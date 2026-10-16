import { classifyRequest, classifyCustom } from './detectors.js';
import { pageProbe, acceptConsent, rejectConsent } from './page-probe.js';
import { runChecks, aggregatePages, resolveConsent, summarize } from './checks.js';
import { saveAudit, newId, listAudits, getSettings, listMonitors, saveMonitors } from './storage.js';
import { getLimits, getPlan } from './plan.js';
import { diffFindings, findPrevious } from './diff.js';
import { LINKS } from './brand.js';
import { revalidateIfDue } from './license.js';

// Licence keys are re-checked at most every few days, and only for users who activated one.
revalidateIfDue().catch(() => {});

const MAX_HITS_PER_TAB = 1000;
const MAX_DL_PER_TAB = 500;
const SETTLE_MS = 3500;
const CONSENT_SETTLE_MS = 4000;
const LOAD_TIMEOUT_MS = 30000;
const MONITOR_ALARM = 'monitor-tick';
const MAX_BODY_CHARS = 4000;
const GPC_RULE_ID = 9000;

// tabId -> { url, startedAt, hits[], dl[] }. Mirrored to storage.session (one key per tab) so a worker restart keeps live data.
const tabs = new Map();
const dirty = new Set();
let restoring = null;
let persistTimer = null;
const tabKey = id => `tab:${id}`;

// One shared promise: every caller waits for the same load, so restored hits are never dropped or reordered.
function restore() {
  restoring ||= chrome.storage.session.get(null).then(all => {
    for (const [k, state] of Object.entries(all || {})) {
      const m = /^tab:(\d+)$/.exec(k);
      if (m && !tabs.has(Number(m[1]))) tabs.set(Number(m[1]), state);
    }
    if (all?.tabState) chrome.storage.session.remove('tabState').catch(() => {}); // pre-1.0 single-key format
  }).catch(() => {});
  return restoring;
}

function markDirty(tabId) {
  if (tabId !== undefined) dirty.add(tabId);
  clearTimeout(persistTimer);
  persistTimer = setTimeout(flush, 500);
}

// Writes changed tabs. If a tab no longer fits the session quota, drop its raw request bodies (HAR only) and retry.
async function flush() {
  const ids = [...dirty];
  dirty.clear();
  for (const id of ids) {
    const state = tabs.get(id);
    if (!state) { await chrome.storage.session.remove(tabKey(id)).catch(() => {}); continue; }
    try {
      await chrome.storage.session.set({ [tabKey(id)]: state });
    } catch {
      state.hits.forEach(h => { delete h.body; });
      state.dl = state.dl.slice(-100);
      await chrome.storage.session.set({ [tabKey(id)]: state }).catch(() => {});
    }
  }
}

// Kept for call sites that changed several tabs at once.
function persistSoon(tabId) {
  if (tabId === undefined) tabs.forEach((_, id) => dirty.add(id));
  markDirty(tabId);
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
  return { url, startedAt: Date.now(), hits: [], dl: [], frames: {} };
}

// User-defined providers, cached so the synchronous webRequest listener can use them.
let customProviders = [];
const settingsReady = getSettings().then(s => { customProviders = s.customProviders || []; }).catch(() => {});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) customProviders = changes.settings.newValue?.customProviders || [];
});

// Delivery status: requestId -> start time, and results that arrive before the hit is stored.
const starts = new Map();
const pendingDelivery = new Map();

function trimMap(m, max = 2000) {
  while (m.size > max) m.delete(m.keys().next().value);
}

function recordDelivery(details, outcome) {
  const start = starts.get(details.requestId);
  if (start === undefined) return;
  starts.delete(details.requestId);
  const delivery = { ...outcome, ms: Math.round(details.timeStamp - start), fromCache: !!details.fromCache };
  const state = tabs.get(details.tabId);
  const matched = state ? state.hits.filter(h => h.requestId === details.requestId) : [];
  if (matched.length) {
    matched.forEach(h => { h.delivery = delivery; });
    persistSoon(details.tabId);
    broadcast({ type: 'hits-updated', tabId: details.tabId });
  } else {
    pendingDelivery.set(details.requestId, delivery);
    trimMap(pendingDelivery, 500);
  }
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

chrome.action.setBadgeBackgroundColor?.({ color: '#1f6b4f' }) // TGF --brand.catch?.(() => {});

async function onNavigate(tabId, url, ts = Date.now(), requestId = null) {
  const { preserveLog } = await getSettings();
  const keep = preserveLog && !scanTabs.has(tabId);
  const last = tabs.get(tabId)?.hits.at(-1);
  // Redirect hops (http → https → www) reuse the requestId: one navigation, one marker.
  if (keep && requestId && last?.kind === 'nav' && last.requestId === requestId) { last.url = url; tabs.get(tabId).url = url; persistSoon(tabId); return; }
  if (!keep || !tabs.has(tabId)) tabs.set(tabId, newState(url));
  if (keep) {
    // Navigation markers split the preserved log into pages (funnel steps).
    const state = tabs.get(tabId);
    state.hits.push({ kind: 'nav', url, ts, requestId });
    state.url = url;
    if (state.hits.length > MAX_HITS_PER_TAB) state.hits.splice(0, state.hits.length - MAX_HITS_PER_TAB);
  }
  persistSoon(tabId);
  updateBadge(tabId);
  broadcast({ type: 'tab-reset', tabId });
}

// Registered synchronously at top level so events wake the worker.
chrome.webRequest.onBeforeRequest.addListener(
  details => {
    if (details.tabId < 0) return;
    if (details.type === 'main_frame') {
      restore().then(() => onNavigate(details.tabId, details.url, details.timeStamp, details.requestId));
      return;
    }
    const body = decodeBody(details.requestBody);
    const found = classifyRequest({ url: details.url, method: details.method, body });
    if (found.length) { record(details, body, found); return; }
    // Custom providers load asynchronously; the request that woke the worker still gets checked.
    settingsReady.then(() => {
      const custom = customProviders.length ? classifyCustom(details.url, body, customProviders) : [];
      if (custom.length) record(details, body, custom);
    });
  },
  { urls: ['<all_urls>'] },
  ['requestBody'],
);

function record(details, body, found) {
    starts.set(details.requestId, details.timeStamp);
    trimMap(starts);
    restore().then(() => {
      if (!tabs.has(details.tabId)) tabs.set(details.tabId, newState(details.initiator || ''));
      const state = tabs.get(details.tabId);
      // Redirect hops reuse the requestId; count the request once.
      if (state.hits.slice(-60).some(h => h.requestId === details.requestId)) return;
      const delivery = pendingDelivery.get(details.requestId);
      pendingDelivery.delete(details.requestId);
      found.forEach((h, i) => {
        if (state.hits.length >= MAX_HITS_PER_TAB) state.hits.shift();
        // Method + raw body (first hit of a batch only, capped) feed the HAR export.
        const raw = i === 0 && body ? { body: body.slice(0, MAX_BODY_CHARS) } : {};
        state.hits.push({ ...h, ...raw, method: details.method, ts: details.timeStamp, frameId: details.frameId, requestId: details.requestId, delivery });
      });
      persistSoon(details.tabId);
      updateBadge(details.tabId);
      broadcast({ type: 'hits-updated', tabId: details.tabId });
    });
}

// Did the vendor endpoint accept the hit? Status, timing, and network errors (ad blockers show up as ERR_BLOCKED_BY_CLIENT).
chrome.webRequest.onCompleted.addListener(
  details => { if (details.tabId >= 0 && starts.has(details.requestId)) restore().then(() => recordDelivery(details, { status: details.statusCode })); },
  { urls: ['<all_urls>'] },
);
chrome.webRequest.onErrorOccurred.addListener(
  details => { if (details.tabId >= 0 && starts.has(details.requestId)) restore().then(() => recordDelivery(details, { status: 0, error: details.error })); },
  { urls: ['<all_urls>'] },
);

chrome.tabs.onRemoved.addListener(tabId => {
  restore().then(() => {
    tabs.delete(tabId);
    persistSoon(tabId);
    chrome.declarativeNetRequest?.updateSessionRules({ removeRuleIds: [GPC_RULE_ID + tabId] }).catch(() => {});
  });
});

chrome.runtime.onInstalled.addListener(details => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  scheduleMonitorTick();
  // First install only (not updates): open the getting-started page. tabs.create needs no "tabs" permission.
  if (details.reason === 'install') chrome.tabs.create({ url: LINKS.welcome('welcome') }).catch(() => {});
});
chrome.runtime.onStartup.addListener(() => scheduleMonitorTick());

async function inject(tabId, func, args = []) {
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func, args });
    return res?.result ?? null;
  } catch {
    return null; // chrome:// pages, Web Store, PDF viewer, etc.
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// First-party cookie metadata for the audited page. Values are never read into the result.
async function cookieTable(url) {
  if (!chrome.cookies || !/^https?:/.test(url || '')) return null;
  try {
    const all = await chrome.cookies.getAll({ url });
    return all.map(c => ({ name: c.name, domain: c.domain, path: c.path, session: !!c.session, expires: c.expirationDate ? Math.round(c.expirationDate * 1000) : null, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite }));
  } catch {
    return null;
  }
}

// Global Privacy Control: send Sec-GPC: 1 from this tab and expose navigator.globalPrivacyControl (read by dl-hook.js via sessionStorage).
async function setGpc(tabId, on) {
  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [GPC_RULE_ID + tabId],
      addRules: on ? [{
        id: GPC_RULE_ID + tabId,
        priority: 1,
        action: { type: 'modifyHeaders', requestHeaders: [{ header: 'Sec-GPC', operation: 'set', value: '1' }] },
        condition: { tabIds: [tabId], resourceTypes: ['main_frame', 'sub_frame', 'script', 'xmlhttprequest', 'ping', 'image', 'other'] },
      }] : [],
    });
  } catch { /* declarativeNetRequest unavailable */ }
  await inject(tabId, flag => { try { flag ? sessionStorage.setItem('__tqa_gpc', '1') : sessionStorage.removeItem('__tqa_gpc'); } catch { /* storage blocked */ } }, [on]);
}

async function reloadAndSettle(tabId) {
  const loaded = waitForLoad(tabId);
  await chrome.tabs.reload(tabId);
  await loaded;
  await sleep(SETTLE_MS);
}

// Which frames are Shopify Customer Events sandboxes (custom pixels run in /wpm@…/sandbox/ iframes).
function sandboxFrames(state) {
  return Object.entries(state?.frames || {}).filter(([, u]) => /\/(wpm|web-pixels)@[^/]*\/.*sandbox/.test(u)).map(([id]) => Number(id));
}

function tagSources(hits, state) {
  const sandbox = new Set(sandboxFrames(state));
  return hits.map(h => (sandbox.has(h.frameId) ? { ...h, source: 'shopify-sandbox' } : h));
}
const countBy = hits => hits.filter(h => h.kind === 'hit').reduce((m, h) => ({ ...m, [h.platform]: (m[h.platform] || 0) + 1 }), {});

// Captures the page as-is, optionally clicks "accept all" and captures again.
async function auditTab(tabId, { consentTest = false, session = false } = {}) {
  await restore();
  const probe = await inject(tabId, pageProbe, [{}]);
  const state = tabs.get(tabId);
  // Session mode audits every page in a preserved log (e.g. product → cart → checkout → thank-you).
  const before = session && state ? { hits: state.hits.filter(h => h.kind !== 'nav'), dl: state.dl } : currentPage(state);
  const preHits = tagSources([...before.hits], state);
  const url = probe?.url || tabs.get(tabId)?.url || '';
  const cookiesBefore = await cookieTable(url);
  let cookiesAfter = null;
  let test = null;
  let postHits = [];

  if (consentTest === 'gpc' && probe) {
    // Baseline is the page as loaded; then reload the same page with GPC on and compare.
    test = { attempted: true, mode: 'gpc', accepted: true, method: 'Sec-GPC: 1 header + navigator.globalPrivacyControl' };
    try {
      await setGpc(tabId, true);
      await reloadAndSettle(tabId);
      const after = currentPage(tabs.get(tabId));
      postHits = tagSources(after.hits.filter(h => !preHits.some(p => p.requestId === h.requestId)), tabs.get(tabId));
      const postProbe = await inject(tabId, pageProbe, [{}]);
      test.gpcDetected = !!postProbe?.gpc;
      Object.assign(test, {
        before: countBy(preHits),
        after: countBy(postHits),
        signalsBefore: resolveConsent(preHits, probe).signals,
        signalsAfter: resolveConsent(postHits, postProbe || probe).signals,
        googlePresent: !!(summarize(preHits, probe).ga4 || summarize(preHits, probe).gads),
        limitedUse: {
          metaLdu: postHits.some(h => h.platform === 'meta' && /LDU/i.test(h.params?.dpo || '')),
          googleRdp: postHits.some(h => ['gads', 'ga4'].includes(h.platform) && (h.params?.rdp === '1' || h.params?.npa === '1')),
        },
      });
      cookiesAfter = await cookieTable(url);
    } finally {
      await setGpc(tabId, false);
      // Leave the tab as the user had it: reload once more without the GPC signal.
      await reloadAndSettle(tabId).catch(() => {});
    }
  } else if (consentTest && probe) {
    const acceptTs = Date.now();
    const mode = consentTest === 'reject' ? 'reject' : 'accept';
    const res = await inject(tabId, mode === 'reject' ? rejectConsent : acceptConsent);
    test = { attempted: true, mode, accepted: !!res?.accepted, method: res?.method || null, reason: res?.reason || null };
    if (test.accepted) {
      await sleep(CONSENT_SETTLE_MS);
      const after = currentPage(tabs.get(tabId));
      postHits = after.hits.filter(h => h.ts >= acceptTs);
      postHits = tagSources(postHits, tabs.get(tabId));
      const postProbe = await inject(tabId, pageProbe, [{}]);
      cookiesAfter = await cookieTable(url);
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

  if (test && cookiesBefore && cookiesAfter) {
    const had = new Set(cookiesBefore.map(c => `${c.name}|${c.domain}`));
    test.cookiesAdded = cookiesAfter.filter(c => !had.has(`${c.name}|${c.domain}`)).map(c => c.name);
  }
  const result = runChecks({ url, hits: preHits, probe, postHits, dlLog: before.dl, consentTest: test, cookies: cookiesBefore, session });
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
      if (tab?.id) { scanTabs.delete(tab.id); tabs.delete(tab.id); persistSoon(tab.id); chrome.tabs.remove(tab.id).catch(() => {}); }
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
  let saved;
  try {
    saved = await saveAudit(audit);
  } catch (e) {
    progress({ type: 'scan-done', error: String(e?.message || e) });
    throw e;
  }
  progress({ type: 'scan-progress', done: list.length, total: list.length });
  progress({ type: 'scan-done', auditId: saved.id });
  return saved;
}

// ---- Monitoring -------------------------------------------------------------------------
const FREQ_MS = { daily: 24 * 3600e3, weekly: 7 * 24 * 3600e3 };

// alarms and notifications are optional permissions, granted when the user enables monitoring.
function scheduleMonitorTick() {
  chrome.alarms?.create(MONITOR_ALARM, { periodInMinutes: 60 });
}

let monitorsRunning = false;

async function runDueMonitors() {
  if (monitorsRunning || (await getPlan()) !== 'pro') return;
  monitorsRunning = true;
  try {
    const monitors = await listMonitors();
    const now = Date.now();
    for (const m of monitors) {
      if (!m.enabled || now - (m.lastRun || 0) < (FREQ_MS[m.frequency] || FREQ_MS.weekly)) continue;
      try {
        await runMonitor(m, monitors, now);
      } catch { /* one failing monitor (e.g. storage full) must not stop the others */ }
    }
  } finally {
    monitorsRunning = false;
  }
}

async function runMonitor(m, monitors, now) {
  m.lastRun = now;
  await saveMonitors(monitors);
  const audit = await enqueueScan(m.urls, { consentTest: m.consentTest, freshVisitor: false, monitorId: m.id, silent: true });
  const previous = findPrevious(await listAudits(), audit);
  const diff = previous ? diffFindings(previous.site.findings, audit.site.findings) : null;
  const newProblems = diff ? diff.added.filter(f => f.severity === 'critical' || f.severity === 'warning') : [];
  m.lastAuditId = audit.id;
  m.lastScore = audit.site.score;
  await saveMonitors(monitors);
  if (chrome.notifications && (newProblems.length || (previous && audit.site.score < previous.site.score - 5))) {
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

// Listeners for optional APIs: attach now if already granted, or as soon as the permission is added.
let monitorListeners = false;
function attachMonitorListeners() {
  if (monitorListeners || !chrome.alarms) return;
  monitorListeners = true;
  chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === MONITOR_ALARM) runDueMonitors(); });
  chrome.notifications?.onClicked.addListener(id => {
    if (id.startsWith('monitor:')) chrome.tabs.create({ url: chrome.runtime.getURL(`report/report.html?id=${encodeURIComponent(id.slice(8))}`) });
  });
}
attachMonitorListeners();
chrome.permissions.onAdded.addListener(() => { attachMonitorListeners(); scheduleMonitorTick(); });

// ---- Messages ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Content-script relay: fire-and-forget, no response needed.
  if (msg.type === 'frame-info') {
    const tabId = sender.tab?.id;
    if (tabId === undefined || !sender.frameId) return false;
    restore().then(() => {
      if (!tabs.has(tabId)) tabs.set(tabId, newState(sender.tab.url || ''));
      const state = tabs.get(tabId);
      state.frames = { ...(state.frames || {}), [sender.frameId]: msg.url };
      persistSoon(tabId);
    });
    return false;
  }
  if (msg.type === 'dl-event') {
    const tabId = sender.tab?.id;
    // Top frame, plus Shopify custom-pixel sandboxes (they keep their own dataLayer).
    const sandbox = /\/(wpm|web-pixels)@[^/]*\/.*sandbox/.test(sender.url || '');
    if (tabId === undefined || (sender.frameId !== 0 && !sandbox)) return false;
    restore().then(() => {
      if (!tabs.has(tabId)) tabs.set(tabId, newState(sender.tab.url || ''));
      const state = tabs.get(tabId);
      state.dl.push(sandbox ? { ...msg.event, frame: 'shopify-sandbox' } : msg.event);
      if (state.dl.length > MAX_DL_PER_TAB) state.dl.shift();
      persistSoon(tabId);
      broadcast({ type: 'dl-updated', tabId });
    });
    return false;
  }

  (async () => {
    switch (msg.type) {
      case 'get-tab-state': {
        await restore();
        const s = tabs.get(msg.tabId);
        return { url: s?.url || '', hits: tagSources(s?.hits || [], s), dl: s?.dl || [] };
      }
      case 'clear-tab': {
        await restore();
        tabs.set(msg.tabId, newState(tabs.get(msg.tabId)?.url || ''));
        persistSoon(msg.tabId);
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
