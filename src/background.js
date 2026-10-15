import { classifyRequest } from './detectors.js';
import { pageProbe, acceptConsent, rejectConsent } from './page-probe.js';
import { runChecks, aggregatePages, resolveConsent, summarize } from './checks.js';
import { saveAudit, newId, listAudits, getSettings, listMonitors, saveMonitors } from './storage.js';
import { getLimits, getPlan } from './plan.js';
import { diffFindings, findPrevious } from './diff.js';
import { LINKS } from './brand.js';

const MAX_HITS_PER_TAB = 1000;
const MAX_DL_PER_TAB = 500;
const SETTLE_MS = 3500;
const CONSENT_SETTLE_MS = 4000;
const LOAD_TIMEOUT_MS = 30000;
const MONITOR_ALARM = 'monitor-tick';

// tabId -> { url, startedAt, hits[], dl[] }. Mirrored to storage.session so a worker restart keeps live data.
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

function newState(url) {
  return { url, startedAt: Date.now(), hits: [], dl: [] };
}

// Hits and dataLayer events since the last navigation (a preserved log keeps older pages behind a marker).
function currentPage(state) {
  if (!state) return { hits: [], dl: [] };
  const navIdx = state.hits.map(h => h.kind).lastIndexOf('nav');
  const navTs = navIdx >= 0 ? state.hits[navIdx].ts : 0;
  return { hits: state.hits.slice(navIdx + 1), dl: state.dl.filter(e => e.ts >= navTs) };
}

function updateBadge(tabId) {
  const n = currentPage(tabs.get(tabId)).hits.filter(h => h.kind === 'hit').length;
  chrome.action.setBadgeText({ tabId, text: n ? String(Math.min(n, 999)) : '' }).catch(() => {});
}

chrome.action.setBadgeBackgroundColor?.({ color: '#2f5bea' }).catch?.(() => {});

async function onNavigate(tabId, url, ts = Date.now()) {
  const { preserveLog } = await getSettings();
  const keep = preserveLog && !scanTabs.has(tabId);
  if (!keep || !tabs.has(tabId)) tabs.set(tabId, newState(url));
  if (keep) {
    // Navigation markers split the preserved log into pages (funnel steps).
    const state = tabs.get(tabId);
    state.hits.push({ kind: 'nav', url, ts });
    state.url = url;
    if (state.hits.length > MAX_HITS_PER_TAB) state.hits.splice(0, state.hits.length - MAX_HITS_PER_TAB);
  }
  persistSoon();
  updateBadge(tabId);
  broadcast({ type: 'tab-reset', tabId });
}

// Registered synchronously at top level so events wake the worker.
chrome.webRequest.onBeforeRequest.addListener(
  details => {
    if (details.tabId < 0) return;
    if (details.type === 'main_frame') {
      restore().then(() => onNavigate(details.tabId, details.url, details.timeStamp));
      return;
    }
    const found = classifyRequest({ url: details.url, method: details.method, body: decodeBody(details.requestBody) });
    if (!found.length) return;
    restore().then(() => {
      if (!tabs.has(details.tabId)) tabs.set(details.tabId, newState(details.initiator || ''));
      const state = tabs.get(details.tabId);
      // Redirect hops reuse the requestId; count the request once.
      if (state.hits.slice(-60).some(h => h.requestId === details.requestId)) return;
      for (const h of found) {
        if (state.hits.length >= MAX_HITS_PER_TAB) state.hits.shift();
        state.hits.push({ ...h, ts: details.timeStamp, frameId: details.frameId, requestId: details.requestId });
      }
      persistSoon();
      updateBadge(details.tabId);
      broadcast({ type: 'hits-updated', tabId: details.tabId });
    });
  },
  { urls: ['<all_urls>'] },
  ['requestBody'],
);

chrome.tabs.onRemoved.addListener(tabId => {
  tabs.delete(tabId);
  persistSoon();
});

chrome.runtime.onInstalled.addListener(details => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  chrome.alarms.create(MONITOR_ALARM, { periodInMinutes: 60 });
  // First install only (not updates): open the getting-started page. tabs.create needs no "tabs" permission.
  if (details.reason === 'install') chrome.tabs.create({ url: LINKS.welcome('welcome') }).catch(() => {});
});
chrome.runtime.onStartup.addListener(() => chrome.alarms.create(MONITOR_ALARM, { periodInMinutes: 60 }));

async function inject(tabId, func, args = []) {
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func, args });
    return res?.result ?? null;
  } catch {
    return null; // chrome:// pages, Web Store, PDF viewer, etc.
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const countBy = hits => hits.filter(h => h.kind === 'hit').reduce((m, h) => ({ ...m, [h.platform]: (m[h.platform] || 0) + 1 }), {});

// Captures the page as-is, optionally clicks "accept all" and captures again.
async function auditTab(tabId, { consentTest = false, session = false } = {}) {
  await restore();
  const probe = await inject(tabId, pageProbe, [{}]);
  const state = tabs.get(tabId);
  // Session mode audits every page in a preserved log (e.g. product → cart → checkout → thank-you).
  const before = session && state ? { hits: state.hits.filter(h => h.kind !== 'nav'), dl: state.dl } : currentPage(state);
  const preHits = [...before.hits];
  const url = probe?.url || tabs.get(tabId)?.url || '';
  let test = null;
  let postHits = [];

  if (consentTest && probe) {
    const acceptTs = Date.now();
    const mode = consentTest === 'reject' ? 'reject' : 'accept';
    const res = await inject(tabId, mode === 'reject' ? rejectConsent : acceptConsent);
    test = { attempted: true, mode, accepted: !!res?.accepted, method: res?.method || null, reason: res?.reason || null };
    if (test.accepted) {
      await sleep(CONSENT_SETTLE_MS);
      const after = currentPage(tabs.get(tabId));
      postHits = after.hits.filter(h => h.ts >= acceptTs || !preHits.includes(h));
      const postProbe = await inject(tabId, pageProbe, [{}]);
      const platformsBefore = summarize(preHits, probe);
      Object.assign(test, {
        before: countBy(preHits),
        after: countBy(postHits),
        signalsBefore: resolveConsent(preHits, probe).signals,
        signalsAfter: resolveConsent([...preHits, ...postHits], postProbe || probe).signals,
        googlePresent: !!(platformsBefore.ga4 || platformsBefore.gtm || platformsBefore.gads),
        loadedPlatforms: Object.keys(summarize([...preHits, ...postHits], postProbe || probe)).filter(p => !['gtm', 'google_tag', 'clarity', 'hotjar'].includes(p)),
      });
    }
  }

  const result = runChecks({ url, hits: preHits, probe, postHits, dlLog: before.dl, consentTest: test });
  const steps = session && state ? state.hits.filter(h => h.kind === 'nav').map(h => h.url) : [];
  return { ...result, injectable: !!probe, session: session ? { steps: steps.length ? steps : [url] } : null };
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

async function clearSiteData(url) {
  if (!chrome.browsingData) return false;
  try {
    await chrome.browsingData.remove({ origins: [new URL(url).origin] }, { cookies: true, localStorage: true, indexedDB: true, serviceWorkers: true });
    return true;
  } catch {
    return false;
  }
}

const scanTabs = new Set();
let queue = Promise.resolve();
let queued = 0;

// Scans run one at a time; monitors queue behind manual scans.
function enqueueScan(urls, opts) {
  queued++;
  const job = queue.then(() => runScan(urls, opts)).finally(() => { queued--; });
  queue = job.catch(() => {});
  return job;
}

async function runScan(urls, { consentTest = false, freshVisitor = false, monitorId = null, silent = false } = {}) {
  const { scanPages } = await getLimits();
  const list = [...new Set(urls)].slice(0, scanPages);
  const pages = [];
  const progress = msg => { if (!silent) broadcast(msg); };
  for (let i = 0; i < list.length; i++) {
    progress({ type: 'scan-progress', done: i, total: list.length, url: list[i] });
    let tab;
    try {
      if (freshVisitor) await clearSiteData(list[i]);
      tab = await chrome.tabs.create({ url: list[i], active: false });
      scanTabs.add(tab.id);
      await waitForLoad(tab.id);
      await sleep(SETTLE_MS);
      pages.push(await auditTab(tab.id, { consentTest }));
    } catch (e) {
      pages.push({ url: list[i], score: 0, findings: [{ id: 'scan-error', severity: 'warning', title: 'Page could not be scanned', detail: String(e?.message || e), fix: '' }], platforms: {}, consent: null, counts: { critical: 0, warning: 1, info: 0, pass: 0 } });
    } finally {
      if (tab?.id) { scanTabs.delete(tab.id); tabs.delete(tab.id); chrome.tabs.remove(tab.id).catch(() => {}); }
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
    options: { consentTest, freshVisitor },
    monitorId,
    truncated: urls.length > list.length ? urls.length - list.length : 0,
  };
  await saveAudit(audit);
  progress({ type: 'scan-progress', done: list.length, total: list.length });
  progress({ type: 'scan-done', auditId: audit.id });
  return audit;
}

// ---- Monitoring -------------------------------------------------------------------------
const FREQ_MS = { daily: 24 * 3600e3, weekly: 7 * 24 * 3600e3 };

async function runDueMonitors() {
  if ((await getPlan()) !== 'pro') return;
  const monitors = await listMonitors();
  const now = Date.now();
  for (const m of monitors) {
    if (!m.enabled || now - (m.lastRun || 0) < (FREQ_MS[m.frequency] || FREQ_MS.weekly)) continue;
    m.lastRun = now;
    await saveMonitors(monitors);
    const audit = await enqueueScan(m.urls, { consentTest: m.consentTest, freshVisitor: false, monitorId: m.id, silent: true });
    const previous = findPrevious(await listAudits(), audit);
    const diff = previous ? diffFindings(previous.site.findings, audit.site.findings) : null;
    const newProblems = diff ? diff.added.filter(f => f.severity === 'critical' || f.severity === 'warning') : [];
    m.lastAuditId = audit.id;
    m.lastScore = audit.site.score;
    await saveMonitors(monitors);
    if (newProblems.length || (previous && audit.site.score < previous.site.score - 5)) {
      chrome.notifications.create(`monitor:${audit.id}`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: `Tracking changed on ${m.host}`,
        message: newProblems.length
          ? `${newProblems.length} new issue${newProblems.length > 1 ? 's' : ''}: ${newProblems.slice(0, 2).map(f => f.title).join('; ')}`
          : `Score dropped from ${previous.site.score} to ${audit.site.score}.`,
        priority: 2,
      });
    }
  }
}

chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === MONITOR_ALARM) runDueMonitors(); });
chrome.notifications.onClicked.addListener(id => {
  if (id.startsWith('monitor:')) chrome.tabs.create({ url: chrome.runtime.getURL(`report/report.html?id=${encodeURIComponent(id.slice(8))}`) });
});

// ---- Messages ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Content-script relay: fire-and-forget, no response needed.
  if (msg.type === 'dl-event') {
    const tabId = sender.tab?.id;
    if (tabId === undefined || sender.frameId !== 0) return false;
    restore().then(() => {
      if (!tabs.has(tabId)) tabs.set(tabId, newState(sender.tab.url || ''));
      const state = tabs.get(tabId);
      state.dl.push(msg.event);
      if (state.dl.length > MAX_DL_PER_TAB) state.dl.shift();
      persistSoon();
      broadcast({ type: 'dl-updated', tabId });
    });
    return false;
  }

  (async () => {
    switch (msg.type) {
      case 'get-tab-state': {
        await restore();
        const s = tabs.get(msg.tabId);
        return { url: s?.url || '', hits: s?.hits || [], dl: s?.dl || [] };
      }
      case 'clear-tab': {
        tabs.set(msg.tabId, newState(tabs.get(msg.tabId)?.url || ''));
        persistSoon();
        updateBadge(msg.tabId);
        return { ok: true };
      }
      case 'audit-tab':
        return auditTab(msg.tabId, { consentTest: msg.consentTest || false, session: !!msg.session });
      case 'save-page-audit': {
        const r = msg.result;
        return saveAudit({ id: newId(), type: 'page', host: hostOf(r.url), url: r.url, createdAt: Date.now(), result: r });
      }
      case 'collect-links': {
        const probe = await inject(msg.tabId, pageProbe, [{ collectLinks: true }]);
        return { links: probe?.links || [], url: probe?.url || '' };
      }
      case 'start-scan': {
        if (queued) return { ok: false, error: 'A scan is already running.' };
        enqueueScan(msg.urls, { consentTest: msg.consentTest || false, freshVisitor: !!msg.freshVisitor });
        return { ok: true };
      }
      case 'run-monitors-now':
        runDueMonitors();
        return { ok: true };
      default:
        return undefined;
    }
  })().then(sendResponse, err => sendResponse({ error: String(err?.message || err) }));
  return true;
});
