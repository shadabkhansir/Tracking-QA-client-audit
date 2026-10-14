import { classifyRequest } from './detectors.js';
import { pageProbe } from './page-probe.js';
import { runChecks, aggregatePages } from './checks.js';
import { saveAudit, newId } from './storage.js';
import { getLimits } from './plan.js';

const MAX_HITS_PER_TAB = 500;
const SETTLE_MS = 3500;
const LOAD_TIMEOUT_MS = 30000;

// tabId -> { url, startedAt, hits[] }. Mirrored to storage.session so a service-worker restart keeps live data.
const tabs = new Map();
let restored = false;
let persistTimer = null;

async function restore() {
  if (restored) return;
  restored = true;
  const { tabState = {} } = await chrome.storage.session.get('tabState');
  for (const [id, state] of Object.entries(tabState)) if (!tabs.has(Number(id))) tabs.set(Number(id), state);
}

function persistSoon() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    chrome.storage.session.set({ tabState: Object.fromEntries(tabs) }).catch(() => {});
  }, 500);
}

function broadcast(msg) {
  chrome.runtime.sendMessage(msg).catch(() => { /* panel closed */ });
}

function decodeBody(requestBody) {
  if (!requestBody) return '';
  if (requestBody.formData) {
    const p = new URLSearchParams();
    for (const [k, vals] of Object.entries(requestBody.formData)) for (const v of vals) p.append(k, v);
    return p.toString();
  }
  if (requestBody.raw) {
    const dec = new TextDecoder();
    return requestBody.raw.map(part => (part.bytes ? dec.decode(part.bytes) : '')).join('');
  }
  return '';
}

function resetTab(tabId, url) {
  tabs.set(tabId, { url, startedAt: Date.now(), hits: [] });
}

// Registered synchronously at top level so events wake the worker.
chrome.webRequest.onBeforeRequest.addListener(
  details => {
    if (details.tabId < 0) return;
    if (details.type === 'main_frame') {
      resetTab(details.tabId, details.url);
      persistSoon();
      broadcast({ type: 'tab-reset', tabId: details.tabId });
      return;
    }
    const found = classifyRequest({ url: details.url, method: details.method, body: decodeBody(details.requestBody) });
    if (!found.length) return;
    restore().then(() => {
      if (!tabs.has(details.tabId)) resetTab(details.tabId, details.initiator || '');
      const state = tabs.get(details.tabId);
      for (const h of found) {
        if (state.hits.length >= MAX_HITS_PER_TAB) break;
        state.hits.push({ ...h, ts: details.timeStamp, frameId: details.frameId });
      }
      persistSoon();
      broadcast({ type: 'hits-updated', tabId: details.tabId, count: state.hits.length });
    });
  },
  { urls: ['<all_urls>'] },
  ['requestBody'],
);

chrome.tabs.onRemoved.addListener(tabId => {
  tabs.delete(tabId);
  persistSoon();
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

async function probeTab(tabId, collectLinks = false) {
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func: pageProbe, args: [{ collectLinks }] });
    return res?.result || null;
  } catch {
    return null; // chrome:// pages, Web Store, PDF viewer, etc.
  }
}

async function auditTab(tabId) {
  await restore();
  const probe = await probeTab(tabId);
  const state = tabs.get(tabId) || { url: probe?.url || '', hits: [] };
  const result = runChecks({ url: probe?.url || state.url, hits: state.hits, probe });
  return { ...result, injectable: !!probe };
}

function hostOf(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

function waitForLoad(tabId) {
  return new Promise(resolve => {
    const done = () => { chrome.tabs.onUpdated.removeListener(listener); clearTimeout(timer); resolve(); };
    const listener = (id, info) => { if (id === tabId && info.status === 'complete') done(); };
    const timer = setTimeout(done, LOAD_TIMEOUT_MS);
    chrome.tabs.onUpdated.addListener(listener);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

let scanning = false;

async function runScan(urls) {
  const { scanPages } = await getLimits();
  const list = [...new Set(urls)].slice(0, scanPages);
  const pages = [];
  for (let i = 0; i < list.length; i++) {
    broadcast({ type: 'scan-progress', done: i, total: list.length, url: list[i] });
    let tab;
    try {
      tab = await chrome.tabs.create({ url: list[i], active: false });
      await waitForLoad(tab.id);
      await sleep(SETTLE_MS);
      pages.push(await auditTab(tab.id));
    } catch (e) {
      pages.push({ url: list[i], score: 0, findings: [{ id: 'scan-error', severity: 'warning', title: 'Page could not be scanned', detail: String(e?.message || e), fix: '' }], platforms: {}, consent: null, counts: { critical: 0, warning: 1, info: 0, pass: 0 } });
    } finally {
      if (tab?.id) chrome.tabs.remove(tab.id).catch(() => {});
    }
  }
  const audit = {
    id: newId(),
    type: 'site',
    host: hostOf(list[0]),
    url: list[0],
    createdAt: Date.now(),
    site: aggregatePages(pages),
    pages,
    truncated: urls.length > list.length ? urls.length - list.length : 0,
  };
  await saveAudit(audit);
  broadcast({ type: 'scan-progress', done: list.length, total: list.length });
  broadcast({ type: 'scan-done', auditId: audit.id });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'get-tab-state': {
        await restore();
        const s = tabs.get(msg.tabId);
        return { url: s?.url || '', hits: (s?.hits || []).map(({ params, ...h }) => h) };
      }
      case 'audit-tab':
        return auditTab(msg.tabId);
      case 'save-page-audit': {
        const r = msg.result;
        return saveAudit({ id: newId(), type: 'page', host: hostOf(r.url), url: r.url, createdAt: Date.now(), result: r });
      }
      case 'collect-links': {
        const probe = await probeTab(msg.tabId, true);
        return { links: probe?.links || [], url: probe?.url || '' };
      }
      case 'start-scan': {
        if (scanning) return { ok: false, error: 'A scan is already running.' };
        scanning = true;
        runScan(msg.urls).finally(() => { scanning = false; });
        return { ok: true };
      }
      default:
        return undefined;
    }
  })().then(sendResponse, err => sendResponse({ error: String(err?.message || err) }));
  return true;
});
