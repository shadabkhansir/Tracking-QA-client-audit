import { PLATFORM_LABELS } from '../src/detectors.js';
import { CONSENT_SIGNALS } from '../src/checks.js';
import { listAudits, deleteAudit } from '../src/storage.js';
import { getPlan, getLimits } from '../src/plan.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const send = msg => chrome.runtime.sendMessage(msg);
const SHORT = { ga4: 'GA4', gtm: 'GTM', gads: 'G Ads', google_tag: 'G tag', floodlight: 'Floodlight', meta: 'Meta', tiktok: 'TikTok' };

let activeTabId = null;
let lastResult = null;

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// ---- Tabs -----------------------------------------------------------------------------
document.querySelectorAll('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.id !== `tab-${btn.dataset.tab}`; });
    if (btn.dataset.tab === 'history') renderHistory();
  });
});
$('open-options').addEventListener('click', e => { e.preventDefault(); chrome.runtime.openOptionsPage(); });

// ---- Live -----------------------------------------------------------------------------
async function refreshLive() {
  const tab = await currentTab();
  if (!tab) return;
  if (tab.id !== activeTabId) {
    activeTabId = tab.id;
    $('audit-result').hidden = true;
    lastResult = null;
  }
  $('page-url').textContent = tab.url || '—';
  const state = await send({ type: 'get-tab-state', tabId: tab.id });
  const hits = state?.hits || [];
  $('hit-count').textContent = hits.length ? `(${hits.length})` : '';
  $('live-hint').hidden = hits.length > 0;
  $('hits').innerHTML = hits.slice().reverse().slice(0, 200).map(h => `
    <li><span class="p">${esc(SHORT[h.platform] || h.platform)}</span>
      <span><span>${esc(h.event || (h.kind === 'script' ? 'library loaded' : '—'))}</span><br><span class="id">${esc(h.id || '')}</span></span>
      <span class="k">${h.kind === 'script' ? 'script' : 'hit'}</span></li>`).join('');
}

function renderResult(r) {
  lastResult = r;
  $('audit-result').hidden = false;
  $('score').textContent = r.score;
  $('counts').innerHTML = ['critical', 'warning', 'info', 'pass']
    .map(s => `<span class="c-${s}">${r.counts[s]} ${s}</span>`).join('');

  const plats = Object.entries(r.platforms);
  $('platforms').innerHTML = plats.length
    ? plats.map(([k, p]) => `<div><span>${esc(PLATFORM_LABELS[k] || k)}</span><span class="ids">${esc(p.ids.join(', ') || 'detected')}</span></div>`).join('')
    : '<div class="muted">No platforms detected</div>';

  const c = r.consent;
  $('consent').innerHTML = `<div><strong>Consent Mode</strong><span>${c.implemented ? 'Detected' : '<span class="c-critical">Not detected</span>'}</span></div>`
    + (c.implemented ? CONSENT_SIGNALS.filter(s => c.signals[s]).map(s => [s, c.signals[s]]).map(([s, v]) => `<div><span>${esc(s)}</span><span class="c-${v.effective === 'granted' ? 'pass' : v.effective === 'denied' ? 'warning' : 'info'}">${esc(v.effective)}</span></div>`).join('') : '')
    + `<div><span>CMP</span><span>${esc(c.cmps.join(', ') || 'none detected')}</span></div>`;

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
  try {
    const r = await send({ type: 'audit-tab', tabId: tab.id });
    if (r?.error) throw new Error(r.error);
    renderResult(r);
  } catch (e) {
    alert(`Audit failed: ${e.message}`);
  } finally {
    $('run-audit').disabled = false;
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
  chrome.tabs.create({ url: chrome.runtime.getURL(`report/report.html?id=${encodeURIComponent(saved.id)}`) });
});

// ---- Scan -----------------------------------------------------------------------------
$('use-links').addEventListener('click', async () => {
  const tab = await currentTab();
  const { links, url } = await send({ type: 'collect-links', tabId: tab.id });
  const { scanPages } = await getLimits();
  const list = [url, ...links.filter(l => l !== url)].filter(Boolean).slice(0, scanPages);
  $('scan-urls').value = list.join('\n');
});

$('start-scan').addEventListener('click', async () => {
  const urls = $('scan-urls').value.split('\n').map(s => s.trim()).filter(s => /^https?:\/\//.test(s));
  if (!urls.length) return alert('Add at least one http(s) URL.');
  const res = await send({ type: 'start-scan', urls });
  if (!res?.ok) return alert(res?.error || 'Could not start scan.');
  $('start-scan').disabled = true;
  $('scan-progress').hidden = false;
});

chrome.runtime.onMessage.addListener(msg => {
  if ((msg.type === 'hits-updated' || msg.type === 'tab-reset') && msg.tabId === activeTabId) refreshLive();
  if (msg.type === 'scan-progress') {
    $('scan-progress').hidden = false;
    $('scan-progress').querySelector('.bar').style.width = `${Math.round((msg.done / msg.total) * 100)}%`;
    $('scan-status').textContent = msg.url ? `Scanning ${msg.done + 1}/${msg.total}: ${msg.url}` : `Done: ${msg.total} pages`;
  }
  if (msg.type === 'scan-done') {
    $('start-scan').disabled = false;
    chrome.tabs.create({ url: chrome.runtime.getURL(`report/report.html?id=${encodeURIComponent(msg.auditId)}`) });
  }
});

// ---- History --------------------------------------------------------------------------
async function renderHistory() {
  const audits = await listAudits();
  $('history').innerHTML = audits.length ? audits.map(a => {
    const score = a.type === 'site' ? a.site.score : a.result.score;
    const label = a.type === 'site' ? `${a.pages.length}-page scan` : 'Page audit';
    return `<li><div><div>${esc(a.host)}</div><div class="meta">${esc(label)} · score ${score} · ${new Date(a.createdAt).toLocaleString()}</div></div>
      <div><button data-open="${esc(a.id)}">Open</button><button class="del" data-del="${esc(a.id)}">Delete</button></div></li>`;
  }).join('') : '<li class="muted">No saved audits yet.</li>';
}

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
}

chrome.tabs.onActivated.addListener(refreshLive);
chrome.tabs.onUpdated.addListener((tabId, info) => { if (tabId === activeTabId && info.url) refreshLive(); });
chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.plan) renderPlan(); });
renderPlan();
refreshLive();
