import { platformLabel } from '../src/detectors.js';
import { CONSENT_SIGNALS } from '../src/checks.js';
import { describeParams } from '../src/params.js';
import { listAudits, deleteAudit, getSettings, setSettings, listMonitors, saveMonitors, newId, importAudit } from '../src/storage.js';
import { getPlan, getLimits, appendUpgrade } from '../src/plan.js';
import { hitsToCsv, hitsToHar, download, summaryText } from '../src/export.js';
import { wireTgfLinks } from '../src/brand.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const send = msg => chrome.runtime.sendMessage(msg);
const SHORT = { ga4: 'GA4', gtm: 'GTM', gads: 'G Ads', google_tag: 'G tag', floodlight: 'Floodlight', meta: 'Meta', tiktok: 'TikTok',
  linkedin: 'LinkedIn', pinterest: 'Pinterest', snapchat: 'Snap', x: 'X', uet: 'MS Ads', reddit: 'Reddit', clarity: 'Clarity', hotjar: 'Hotjar' };

let activeTabId = null;
let lastResult = null;
let tabState = { hits: [], dl: [] };
const ui = { filter: new Set(), search: '', open: new Set(), openDl: new Set() };
const short = p => SHORT[p] || platformLabel(p);
let idLabels = {};
const withLabel = id => (Object.hasOwn(idLabels, id) && typeof idLabels[id] === 'string' ? `${id} (${idLabels[id]})` : id);
// Stable row keys: indexes shift once the log is full and old entries drop off.
const hitKey = h => `${h.requestId || ''}|${h.ts}|${h.id || ''}|${h.event || ''}|${h.kind}`;
const dlKey = e => `${e.ts}|${e.type}|${dlLabel(e.entry)}`;

// Delivery badge: HTTP status, or why the request never completed.
function statusBadge(h) {
  const d = h.delivery;
  if (!d) return h.kind === 'script' ? 'script' : '…';
  if (/BLOCKED/.test(d.error || '')) return '<span class="st blk" title="Blocked by a browser extension">blocked</span>';
  if (d.status >= 400 || (d.status === 0 && d.error && !/ABORTED/.test(d.error))) return `<span class="st bad" title="${esc(d.error || '')}">${esc(d.status || 'failed')}</span>`;
  return `<span class="st ok" title="${d.ms} ms">${esc(d.status || '')}</span>`;
}

// ?tabId=N pins the panel to one tab (used by the pop-out window).
const pinnedTabId = Number(new URLSearchParams(location.search).get('tabId')) || null;

async function currentTab() {
  if (pinnedTabId) return chrome.tabs.get(pinnedTabId).catch(() => null);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

wireTgfLinks(document, 'panel-footer');

// Export menu: close after picking a format or clicking outside it.
document.addEventListener('click', e => {
  for (const menu of document.querySelectorAll('details.menu[open]')) {
    if (!menu.contains(e.target) || e.target.closest('.menu-items button')) menu.open = false;
  }
});

// ---- Tabs -----------------------------------------------------------------------------
document.querySelectorAll('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.id !== `tab-${btn.dataset.tab}`; });
    if (btn.dataset.tab === 'history') renderHistory();
    if (btn.dataset.tab === 'monitor') renderMonitors();
  });
});
$('open-options').addEventListener('click', e => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
$('pop-out').addEventListener('click', async e => {
  e.preventDefault();
  const tab = await currentTab();
  chrome.windows.create({ url: chrome.runtime.getURL(`sidepanel/sidepanel.html?tabId=${tab.id}`), type: 'popup', width: 440, height: 820 });
});

// ---- Live state -----------------------------------------------------------------------
async function refreshLive() {
  const tab = await currentTab();
  if (!tab) return;
  if (tab.id !== activeTabId) {
    activeTabId = tab.id;
    $('audit-result').hidden = true;
    lastResult = null;
    ui.open.clear();
    ui.openDl.clear();
  }
  $('page-url').textContent = tab.url || '—';
  tabState = (await send({ type: 'get-tab-state', tabId: tab.id })) || { hits: [], dl: [] };
  renderHits();
  renderDataLayer();
}

function hitMatches(h) {
  if (h.kind === 'nav') return true;
  if (ui.filter.size && !ui.filter.has(h.platform)) return false;
  if (!ui.search) return true;
  const hay = `${h.platform} ${h.id || ''} ${h.event || ''} ${Object.entries(h.params || {}).map(([k, v]) => `${k}=${v}`).join(' ')}`.toLowerCase();
  return hay.includes(ui.search);
}

function renderHits() {
  const hits = tabState.hits || [];
  const platforms = [...new Set(hits.filter(h => h.platform).map(h => h.platform))];
  $('chips').innerHTML = platforms.map(p => `<button class="chip" data-p="${esc(p)}" aria-pressed="${ui.filter.has(p)}">${esc(short(p))} ${hits.filter(h => h.platform === p).length}</button>`).join('');
  const shown = hits.map((h, i) => ({ h, i })).filter(({ h }) => hitMatches(h)).reverse().slice(0, 300);
  const n = hits.filter(h => h.kind === 'hit').length;
  $('hit-count').textContent = n ? `${n} tracking requests${ui.filter.size || ui.search ? ` (${shown.filter(x => x.h.kind !== 'nav').length} shown)` : ''}` : 'No tracking requests yet. Reload the page with this panel open.';
  $('hits').innerHTML = shown.map(({ h, i }) => {
    if (h.kind === 'nav') return `<li class="nav">↳ ${esc(h.url)}</li>`;
    const k = hitKey(h);
    const open = ui.open.has(k);
    const rows = open ? describeParams(h).map(r => `<tr><td>${esc(r.label)}<code>${esc(r.key)}</code></td><td>${esc(r.value)}</td></tr>`).join('') : '';
    return `<li data-k="${esc(k)}" class="${open ? 'open' : ''}"><span class="p">${esc(short(h.platform))}${h.source === 'shopify-sandbox' ? '<span class="src" title="Sent from a Shopify custom pixel (Customer Events sandbox)">Shopify</span>' : ''}</span>
      <span><span>${esc(h.event || (h.kind === 'script' ? 'library loaded' : '—'))}</span><br><span class="id">${esc(withLabel(h.id || ''))}</span></span>
      <span class="k">${statusBadge(h)}${h.consent?.gcs ? `<br>${esc(h.consent.gcs)}` : ''}</span>
      ${open ? `<table class="params">${rows || '<tr><td colspan="2">No parameters</td></tr>'}</table>` : ''}</li>`;
  }).join('');
}

function dlLabel(entry) {
  if (!entry || typeof entry !== 'object') return String(entry);
  if (entry.__gtag) return `gtag(${entry.__gtag.slice(0, 2).map(a => (typeof a === 'string' ? `'${a}'` : '…')).join(', ')})`;
  return entry.event ? String(entry.event) : 'push (no event)';
}

function renderDataLayer() {
  const dl = tabState.dl || [];
  if (!dl.length) {
    $('dl').innerHTML = '<li class="muted">No dataLayer activity captured. Reload the page with the extension enabled.</li>';
    return;
  }
  let n = 0;
  const navs = (tabState.hits || []).filter(h => h.kind === 'nav');
  let navIdx = 0;
  $('dl').innerHTML = dl.map((e, i) => {
    let sep = '';
    while (navIdx < navs.length && navs[navIdx].ts <= e.ts) sep += `<li class="nav-sep">↳ ${esc(navs[navIdx++].url)}</li>`;
    return sep + dlRow(e, i);
  }).join('');

  function dlRow(e, i) {
    if (e.type === 'reassigned') return `<li class="bad">⚠ dataLayer was overwritten${e.afterGtm ? ' after GTM loaded' : ''} (${e.previousLength} earlier entries detached)</li>`;
    n++;
    const k = dlKey(e);
    const open = ui.openDl.has(k);
    const ecommerce = e.entry && e.entry.ecommerce ? '<span class="tag">ecommerce</span>' : '';
    return `<li data-k="${esc(k)}"><span class="n">${n}</span><span class="ev">${esc(dlLabel(e.entry))}</span>${ecommerce}${e.existing ? '<span class="tag">before hook</span>' : ''}
      ${open ? `<pre>${esc(JSON.stringify(e.entry, null, 2))}</pre>` : ''}</li>`;
  }
}

$('hits').addEventListener('click', e => {
  if (e.target.closest('.params')) return;
  const li = e.target.closest('li[data-k]');
  if (!li) return;
  const k = li.dataset.k;
  ui.open.has(k) ? ui.open.delete(k) : ui.open.add(k);
  renderHits();
});
$('dl').addEventListener('click', e => {
  if (e.target.closest('pre')) return;
  const li = e.target.closest('li[data-k]');
  if (!li) return;
  const k = li.dataset.k;
  ui.openDl.has(k) ? ui.openDl.delete(k) : ui.openDl.add(k);
  renderDataLayer();
});
$('chips').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  const p = chip.dataset.p;
  ui.filter.has(p) ? ui.filter.delete(p) : ui.filter.add(p);
  renderHits();
});
$('hit-search').addEventListener('input', e => { ui.search = e.target.value.trim().toLowerCase(); renderHits(); });
$('preserve-log').addEventListener('change', async e => {
  await setSettings({ preserveLog: e.target.checked });
  $('opt-session-wrap').hidden = !e.target.checked;
});
$('clear-log').addEventListener('click', async () => { await send({ type: 'clear-tab', tabId: activeTabId }); refreshLive(); });

function hostStamp() {
  let host = 'page';
  try { host = new URL(tabState.url).hostname; } catch { /* keep default */ }
  return `${host}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
}
$('export-csv').addEventListener('click', () => download(`tracking-${hostStamp()}.csv`, hitsToCsv(tabState.hits.filter(hitMatches)), 'text/csv'));
$('export-har').addEventListener('click', () => download(`tracking-${hostStamp()}.har`, JSON.stringify(hitsToHar(tabState.hits.filter(hitMatches), { pageUrl: tabState.url }), null, 2), 'application/json'));
$('export-json').addEventListener('click', () => download(`tracking-${hostStamp()}.json`, JSON.stringify({ url: tabState.url, hits: tabState.hits, dataLayer: tabState.dl }, null, 2), 'application/json'));

// ---- Audit ----------------------------------------------------------------------------
function signalClass(v) {
  return v === 'granted' ? 'pass' : v === 'denied' ? 'warning' : 'info';
}

function renderResult(r) {
  lastResult = r;
  $('audit-result').hidden = false;
  $('score').innerHTML = `${r.score}<span class="of">/100</span>`;
  $('counts').innerHTML = ['critical', 'warning', 'info', 'pass'].map(s => `<span class="c-${s}">${r.counts[s]} ${s}</span>`).join('');

  const plats = Object.entries(r.platforms);
  $('platforms').innerHTML = plats.length
    ? plats.map(([k, p]) => `<div><span>${esc(platformLabel(k))}</span><span class="ids">${esc(p.ids.map(withLabel).join(', ') || 'detected')}</span></div>`).join('')
    : '<div class="muted">No platforms detected</div>';

  const c = r.consent;
  $('consent').innerHTML = `<div><strong>Consent Mode</strong><span>${c.implemented ? 'Detected' : '<span class="c-critical">Not detected</span>'}</span></div>`
    + (c.implemented ? CONSENT_SIGNALS.filter(s => c.signals[s]).map(s => `<div><span>${esc(s)}</span><span class="c-${signalClass(c.signals[s].effective)}">${esc(c.signals[s].effective)}</span></div>`).join('') : '')
    + `<div><span>CMP</span><span>${esc(c.cmps.join(', ') || 'none detected')}</span></div>`;

  const t = r.consentTest;
  $('consent-test').hidden = !t;
  if (t) {
    const plats2 = [...new Set([...Object.keys(t.before || {}), ...Object.keys(t.after || {})])];
    $('consent-test').innerHTML = t.accepted
      ? `<div><strong>Consent test (${({ reject: 'reject all', gpc: 'GPC signal' })[t.mode] || 'accept all'})</strong><span class="muted small">${esc(t.method)}</span></div>
         <table class="ct-table"><tr><th>Platform</th><th>Before</th><th>After ${({ reject: 'reject', gpc: 'GPC on' })[t.mode] || 'accept'}</th></tr>
         ${plats2.map(p => `<tr><td>${esc(short(p))}</td><td>${t.before?.[p] || 0}</td><td>${t.after?.[p] || 0}</td></tr>`).join('')}</table>`
      : `<div><strong>Consent test</strong><span class="c-warning">not run</span></div><div class="small">${esc(t.reason || '')}</div>`;
  }

  const ck = r.cookies;
  $('cookies').hidden = !ck;
  if (ck) {
    const by = cat => ck.filter(c => c.category === cat);
    const line = (cat, label) => (by(cat).length ? `<div><span>${label}</span><span class="ids">${esc(by(cat).map(c => c.name).join(', '))}</span></div>` : '');
    $('cookies').innerHTML = `<div><strong>First-party cookies</strong><span>${ck.length}</span></div>${line('advertising', 'Advertising')}${line('analytics', 'Analytics')}${line('consent', 'Consent')}${by('other').length + by('functional').length ? `<div><span>Other</span><span class="ids">${by('other').length + by('functional').length}</span></div>` : ''}`;
  }

  $('findings').innerHTML = r.findings.map(f => `
    <li class="${f.severity}"><div class="t">${esc(f.title)}</div>
      ${f.detail ? `<div class="d">${esc(f.detail)}</div>` : ''}
      ${f.fix ? `<div class="f">Fix: ${esc(f.fix)}</div>` : ''}</li>`).join('');
  if (!r.injectable) {
    $('findings').insertAdjacentHTML('afterbegin', '<li class="info"><div class="t">Page internals not readable</div><div class="d">Chrome blocks extensions on this page type, so only network requests were checked.</div></li>');
  }
}

$('run-audit').addEventListener('click', async () => {
  const tab = await currentTab();
  $('run-audit').disabled = true;
  $('run-audit').textContent = $('opt-consent').value === 'gpc' ? 'Reloading with GPC…' : $('opt-consent').value ? 'Testing consent…' : 'Auditing…';
  try {
    const r = await send({ type: 'audit-tab', tabId: tab.id, consentTest: $('opt-consent').value || false, session: $('opt-session').checked && !$('opt-session-wrap').hidden });
    if (r?.error) throw new Error(r.error);
    renderResult(r);
  } catch (e) {
    alert(`Audit failed: ${e.message}`);
  } finally {
    $('run-audit').disabled = false;
    $('run-audit').textContent = 'Run audit';
  }
});

$('reload-page').addEventListener('click', async () => {
  const tab = await currentTab();
  $('audit-result').hidden = true;
  chrome.tabs.reload(tab.id);
});

$('save-report').addEventListener('click', async () => {
  if (!lastResult) return;
  const saved = await send({ type: 'save-page-audit', result: lastResult });
  if (!saved?.id) return alert(`Could not save the audit: ${saved?.error || 'browser storage is full. Delete old audits in History.'}`);
  chrome.tabs.create({ url: chrome.runtime.getURL(`report/report.html?id=${encodeURIComponent(saved.id)}`) });
});

$('copy-summary').addEventListener('click', async () => {
  if (!lastResult) return;
  await navigator.clipboard.writeText(summaryText({ url: lastResult.url, score: lastResult.score, findings: lastResult.findings }));
  $('copy-summary').textContent = 'Copied';
  setTimeout(() => { $('copy-summary').textContent = 'Copy summary'; }, 1200);
});

// ---- Scan -----------------------------------------------------------------------------
$('use-links').addEventListener('click', async () => {
  const tab = await currentTab();
  const { links, url } = await send({ type: 'collect-links', tabId: tab.id });
  const { scanPages } = await getLimits();
  $('scan-urls').value = [url, ...links.filter(l => l !== url)].filter(Boolean).slice(0, scanPages).join('\n');
});

// browsingData is optional: ask only when the user opts in (needs the click gesture).
$('scan-fresh').addEventListener('change', async e => {
  if (!e.target.checked) return;
  const ok = await chrome.permissions.request({ permissions: ['browsingData'] }).catch(() => false);
  if (!ok) e.target.checked = false;
});

const parseUrls = text => [...new Set(text.split('\n').map(s => s.trim()).filter(s => {
  try { return /^https?:$/.test(new URL(s).protocol); } catch { return false; }
}))];

$('start-scan').addEventListener('click', async () => {
  const urls = parseUrls($('scan-urls').value);
  if (!urls.length) return alert('Add at least one http(s) URL.');
  if ($('scan-fresh').checked && !confirm('Fresh visitor mode deletes cookies and storage for these sites, which logs you out of them. Continue?')) return;
  const res = await send({ type: 'start-scan', urls, consentTest: $('scan-consent').value || false, freshVisitor: $('scan-fresh').checked });
  if (!res?.ok) return alert(res?.error || 'Could not start scan.');
  $('start-scan').disabled = true;
  $('scan-progress').hidden = false;
});

// ---- Monitor --------------------------------------------------------------------------
async function renderMonitors() {
  const pro = (await getPlan()) === 'pro';
  $('monitor-locked').hidden = pro;
  if (!pro) appendUpgrade($('monitor-locked'), 'monitor-tab', 'Upgrade to Pro');
  $('monitor-form').hidden = !pro;
  $('run-monitors').hidden = !pro;
  const monitors = await listMonitors();
  $('monitors').innerHTML = monitors.length ? monitors.map(m => `
    <li><div><div>${esc(m.host)}</div><div class="meta">${m.urls.length} URL${m.urls.length > 1 ? 's' : ''} · ${esc(m.frequency)}${m.consentTest ? ` · ${esc(m.consentTest)} test` : ''} · ${m.lastRun ? `last run ${new Date(m.lastRun).toLocaleDateString()}, score ${m.lastScore ?? '—'}` : 'not run yet'}</div></div>
      <div>${m.lastAuditId ? `<button data-open="${esc(m.lastAuditId)}">Report</button>` : ''}<button class="del" data-delmon="${esc(m.id)}">Remove</button></div></li>`).join('')
    : '<li class="muted">No monitors yet.</li>';
}

$('add-monitor').addEventListener('click', async () => {
  const urls = parseUrls($('mon-urls').value);
  if (!urls.length) return alert('Add at least one http(s) URL.');
  // Scheduling and alerts are optional permissions, asked for only when monitoring is first used.
  const granted = await chrome.permissions.request({ permissions: ['alarms', 'notifications'] }).catch(() => false);
  if (!granted) return alert('Monitoring needs permission to schedule scans and show alerts.');
  const monitors = await listMonitors();
  if (monitors.some(m => m.urls.join('\n') === urls.join('\n'))) return alert('These URLs are already monitored.');
  const { monitors: maxMonitors } = await getLimits();
  if (monitors.length >= maxMonitors) return alert(`Your plan allows ${maxMonitors} monitors. Remove one to add another.`);
  monitors.push({ id: newId(), host: new URL(urls[0]).hostname, urls, frequency: $('mon-freq').value, consentTest: $('mon-consent').value || false, enabled: true, lastRun: 0 });
  await saveMonitors(monitors);
  $('mon-urls').value = '';
  renderMonitors();
});

$('monitors').addEventListener('click', async e => {
  const open = e.target.closest('[data-open]');
  const del = e.target.closest('[data-delmon]');
  if (open) chrome.tabs.create({ url: chrome.runtime.getURL(`report/report.html?id=${encodeURIComponent(open.dataset.open)}`) });
  if (del) { await saveMonitors((await listMonitors()).filter(m => m.id !== del.dataset.delmon)); renderMonitors(); }
});

$('run-monitors').addEventListener('click', async () => { await send({ type: 'run-monitors-now' }); $('run-monitors').textContent = 'Running in background…'; });

// ---- Messages -------------------------------------------------------------------------
chrome.runtime.onMessage.addListener(msg => {
  if (['hits-updated', 'tab-reset', 'dl-updated'].includes(msg.type) && msg.tabId === activeTabId) scheduleRefresh();
  if (msg.type === 'scan-progress') {
    $('scan-progress').hidden = false;
    $('scan-progress').querySelector('.bar').style.width = `${Math.round((msg.done / msg.total) * 100)}%`;
    $('scan-status').textContent = msg.url ? `Scanning ${msg.done + 1}/${msg.total}: ${msg.url}` : `Done: ${msg.total} pages`;
  }
  if (msg.type === 'scan-done') {
    $('start-scan').disabled = false;
    if (msg.error) { $('scan-status').textContent = ''; return alert(`The scan finished but could not be saved: ${msg.error}`); }
    chrome.tabs.create({ url: chrome.runtime.getURL(`report/report.html?id=${encodeURIComponent(msg.auditId)}`) });
  }
});

// Bursts of hits (GA4 batches, pixel floods) arrive together; redraw at most every 250 ms.
let refreshTimer = null;
function scheduleRefresh() {
  if (refreshTimer) return;
  refreshTimer = setTimeout(() => { refreshTimer = null; refreshLive(); }, 250);
}

// ---- History --------------------------------------------------------------------------
async function renderHistory() {
  const audits = await listAudits();
  $('history').innerHTML = audits.length ? audits.map(a => {
    const score = a.type === 'site' ? a.site.score : a.result.score;
    const label = `${a.type === 'site' ? `${a.pages.length}-page scan${a.monitorId ? ' (monitor)' : ''}` : a.result.session ? 'Funnel audit' : 'Page audit'}${a.imported ? ' · imported' : ''}`;
    return `<li><div><div>${esc(a.host)}</div><div class="meta">${esc(label)} · score ${esc(score)} · ${new Date(a.createdAt).toLocaleString()}</div></div>
      <div><button data-open="${esc(a.id)}">Open</button><button class="del" data-del="${esc(a.id)}">Delete</button></div></li>`;
  }).join('') : '<li class="muted">No saved audits yet.</li>';
}

document.querySelector('.btn-file').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('import-audit').click(); }
});
$('import-audit').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const audit = await importAudit(JSON.parse(await file.text()));
    renderHistory();
    chrome.tabs.create({ url: chrome.runtime.getURL(`report/report.html?id=${encodeURIComponent(audit.id)}`) });
  } catch (err) {
    alert(`Could not import: ${err.message}`);
  }
});

$('history').addEventListener('click', async e => {
  const open = e.target.closest('[data-open]');
  const del = e.target.closest('[data-del]');
  if (open) chrome.tabs.create({ url: chrome.runtime.getURL(`report/report.html?id=${encodeURIComponent(open.dataset.open)}`) });
  if (del && confirm('Delete this audit?')) { await deleteAudit(del.dataset.del); renderHistory(); }
});

// ---- Init -----------------------------------------------------------------------------
async function renderPlan() {
  const plan = await getPlan();
  const limits = await getLimits();
  $('plan-badge').textContent = plan;
  $('plan-badge').classList.toggle('pro', plan === 'pro');
  $('scan-limit').textContent = `${plan === 'pro' ? 'Pro' : 'Free'} plan: up to ${limits.scanPages} pages per scan.`;
  $('history-limit').textContent = `${plan === 'pro' ? 'Pro' : 'Free'} plan keeps your last ${limits.historyItems} audits.`;
  if (plan !== 'pro') {
    appendUpgrade($('scan-limit'), 'scan-limit', 'Scan 50 pages with Pro');
    appendUpgrade($('history-limit'), 'history-limit', 'Keep 500 with Pro');
  }
}

async function init() {
  const settings = await getSettings();
  const { preserveLog } = settings;
  idLabels = settings.idLabels || {};
  $('preserve-log').checked = preserveLog;
  $('opt-session-wrap').hidden = !preserveLog;
  renderPlan();
  refreshLive();
}

if (!pinnedTabId) chrome.tabs.onActivated.addListener(refreshLive);
chrome.tabs.onUpdated.addListener((tabId, info) => { if (tabId === activeTabId && info.url) refreshLive(); });
// The plan changes with the developer toggle or when a licence is activated, revalidated or removed.
chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && (changes.plan || changes['license'])) { renderPlan(); renderMonitors(); } });
init();
