import { getAudit, getBrand, listAudits, updateAudit } from '../src/storage.js';
import { diffFindings, findPrevious } from '../src/diff.js';
import { findingsToCsv, download, summaryText } from '../src/export.js';
import { getPlan, LIMITS, appendUpgrade } from '../src/plan.js';
import { platformLabel } from '../src/detectors.js';
import { CONSENT_SIGNALS } from '../src/checks.js';
import { getSettings } from '../src/storage.js';
import { wireTgfLinks, LINKS, TGF } from '../src/brand.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SEV_LABEL = { critical: 'Critical', warning: 'Warning', info: 'Note', pass: 'Pass' };

function scoreColor(score) {
  return score >= 85 ? 'var(--pass)' : score >= 60 ? 'var(--warning)' : 'var(--critical)';
}

function grade(score) {
  return score >= 85 ? 'Healthy' : score >= 60 ? 'Needs attention' : 'At risk';
}

function executiveSummary(counts, score, isSite, pageCount) {
  const scope = isSite ? `${pageCount} pages` : 'this page';
  if (!counts.critical && !counts.warning) return `Tracking on ${scope} is in good shape. No critical issues or warnings were found.`;
  const parts = [];
  if (counts.critical) parts.push(`${counts.critical} critical issue${counts.critical > 1 ? 's' : ''} affecting data accuracy or compliance`);
  if (counts.warning) parts.push(`${counts.warning} warning${counts.warning > 1 ? 's' : ''}`);
  return `We audited ${scope} and found ${parts.join(' and ')}. Overall health: ${grade(score).toLowerCase()} (${score}/100). Fixes are listed in priority order below.`;
}

function consentTable(consent) {
  if (!consent) return '';
  if (!consent.implemented) return '<p><span class="sev critical">Not detected</span>: Google tags run without Consent Mode.</p>';
  const cls = v => (v === 'granted' ? 'g' : v === 'denied' ? 'd' : 'u');
  return `<table><thead><tr><th>Signal</th><th>Default</th><th>Update</th><th>Current</th></tr></thead><tbody>
    ${CONSENT_SIGNALS.filter(s => consent.signals[s]).map(s => [s, consent.signals[s]]).map(([s, v]) => `<tr><td class="mono">${esc(s)}</td><td class="${cls(v.default)}">${esc(v.default || '—')}</td><td class="${cls(v.update)}">${esc(v.update || '—')}</td><td class="${cls(v.effective)}"><b>${esc(v.effective)}</b></td></tr>`).join('')}
  </tbody></table><p class="muted">Consent platform: ${esc(consent.cmps?.join(', ') || 'none detected')}</p>`;
}

function consentTestHtml(t) {
  if (!t) return '';
  if (!t.accepted) return `<h2>Consent banner test</h2><p class="muted">${esc(t.reason || 'The consent banner could not be accepted automatically.')}</p>`;
  const plats = [...new Set([...Object.keys(t.before || {}), ...Object.keys(t.after || {})])];
  const cls = v => (v === 'granted' ? 'g' : v === 'denied' ? 'd' : 'u');
  const gpc = t.mode === 'gpc';
  return `<h2>${gpc ? 'Global Privacy Control test' : 'Consent banner test'}</h2>
    <p>${gpc ? 'We reloaded the page with the browser\'s Global Privacy Control signal on (Sec-GPC: 1 header and navigator.globalPrivacyControl), as a US visitor opting out of ad sharing would, and compared what each platform sent.' : `We clicked "${t.mode === 'reject' ? 'reject all' : 'accept all'}" (${esc(t.method)}) and compared what each platform sent before and after.`}</p>
    <table><thead><tr><th>Platform</th><th>Requests before</th><th>Requests ${gpc ? 'with GPC on' : `after ${t.mode === 'reject' ? 'rejecting' : 'accepting'}`}</th></tr></thead><tbody>
      ${plats.map(p => `<tr><td>${esc(platformLabel(p))}</td><td>${esc(t.before?.[p] || 0)}</td><td>${esc(t.after?.[p] || 0)}</td></tr>`).join('') || '<tr><td colspan="3">No tracking requests in either state.</td></tr>'}
    </tbody></table>
    ${t.cookiesAdded?.length ? `<p class="muted" style="margin-top:8px">Cookies set afterwards: ${esc(t.cookiesAdded.join(', '))}</p>` : ''}
    ${t.signalsAfter ? `<p class="muted" style="margin-top:8px">Google consent afterwards: ${['ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization'].map(s => `${s} <b class="${cls(t.signalsAfter[s]?.effective)}">${esc(t.signalsAfter[s]?.effective || 'unset')}</b>`).join(' · ')}</p>` : ''}`;
}

function changesHtml(previous, findings, score, full) {
  if (!previous) return '';
  const prevFindings = previous.type === 'site' ? previous.site.findings : previous.result.findings;
  const d = diffFindings(prevFindings, findings);
  const prevScore = previous.type === 'site' ? previous.site.score : previous.result.score;
  // Free plan: a one-line preview (kept out of the printed PDF); the full resolved/new lists are Pro.
  if (!full) {
    return `<p class="muted changes-teaser no-print" id="changes-teaser">Since ${esc(new Date(previous.createdAt).toLocaleDateString())}: score ${esc(prevScore)} → ${esc(score)}, ${esc(d.resolved.length)} resolved, ${esc(d.added.length)} new. The full before/after list for client reports is part of Pro.</p>`;
  }
  const list = arr => arr.length ? `<ul>${arr.map(f => `<li>${esc(f.title)}</li>`).join('')}</ul>` : '<p class="muted">None</p>';
  return `<h2>Changes since ${esc(new Date(previous.createdAt).toLocaleDateString())}</h2>
    <p>Score: ${esc(prevScore)} → <b>${esc(score)}</b></p>
    <div class="changes"><div><h3 class="sev pass">Resolved (${d.resolved.length})</h3>${list(d.resolved)}</div>
    <div><h3 class="sev critical">New (${d.added.length})</h3>${list(d.added)}</div></div>`;
}

let idLabels = {};
const withLabel = id => (Object.hasOwn(idLabels, id) && typeof idLabels[id] === 'string' ? `${id} (${idLabels[id]})` : id);

function cookieTableHtml(cookies) {
  if (!cookies?.length) return '';
  const order = { advertising: 0, analytics: 1, consent: 2, functional: 3, other: 4 };
  const rows = [...cookies].sort((a, b) => order[a.category] - order[b.category] || a.name.localeCompare(b.name));
  const life = c => (c.session || !c.expires ? 'Session' : (d => `${d} day${d === 1 ? '' : 's'}`)(Math.max(1, Math.round((c.expires - Date.now()) / 86400000))));
  return `<h2>Cookies on this page</h2>
    <p class="muted">First-party cookies present when the page was audited (names and metadata only, no values).</p>
    <table><thead><tr><th>Cookie</th><th>Vendor</th><th>Purpose</th><th>Domain</th><th>Expires</th></tr></thead><tbody>
      ${rows.map(c => `<tr><td class="mono">${esc(c.name)}</td><td>${esc(c.vendor || '—')}</td><td>${esc(c.category)}</td><td class="mono">${esc(c.domain)}</td><td>${esc(life(c))}</td></tr>`).join('')}
    </tbody></table>`;
}

function platformTable(platforms, isSite, pageCount) {
  const rows = Object.entries(platforms);
  if (!rows.length) return '<p class="muted">No tracking platforms detected.</p>';
  return `<table><thead><tr><th>Platform</th><th>IDs</th>${isSite ? '<th>Found on</th>' : '<th>Events observed</th>'}</tr></thead><tbody>
    ${rows.map(([k, p]) => `<tr><td>${esc(platformLabel(k))}</td><td class="mono">${esc(p.ids.map(withLabel).join(', ') || '—')}</td>
      <td>${isSite ? `${p.pages}/${pageCount} pages` : esc(Object.entries(p.events || {}).map(([e, n]) => `${e} ×${n}`).join(', ') || '—')}</td></tr>`).join('')}
  </tbody></table>`;
}

function findingsHtml(findings, isSite, pageCount) {
  const issues = findings.filter(f => f.severity !== 'pass');
  const passes = findings.filter(f => f.severity === 'pass');
  return `
    ${issues.length ? issues.map(f => `
      <div class="finding ${esc(f.severity)}">
        <div class="t"><span>${esc(f.title)}</span><span class="sev ${esc(f.severity)}">${esc(SEV_LABEL[f.severity] || '')}</span></div>
        ${f.detail ? `<div>${esc(f.detail)}</div>` : ''}
        ${f.fix ? `<div class="fix"><b>How to fix:</b> ${esc(f.fix)}</div>` : ''}
        ${isSite && f.pages ? `<div class="pages">Affects ${f.pages.length}/${pageCount} pages${f.pages.length <= 5 ? `: ${f.pages.map(esc).join(', ')}` : ''}</div>` : ''}
      </div>`).join('') : '<p>No issues found.</p>'}
    ${passes.length ? `<h2>What's working</h2><ul class="passes">${passes.map(f => `<li><span>${esc(f.title)}</span></li>`).join('')}</ul>` : ''}`;
}

// The user's own branding stays primary; this is a small credit line they can switch off in Settings.
// On the Free plan the existing "Generated with Tracking QA" watermark still applies when the credit is off.
function footerCredit(customBranding, showCredit) {
  if (showCredit) {
    return `<span class="credit${customBranding ? '' : ' watermark'}">Made with <a href="${esc(LINKS.landing('report-footer'))}" target="_blank" rel="noopener">${esc(TGF.extension)}</a> by ${esc(TGF.name)}</span>`;
  }
  return customBranding ? '' : '<span class="watermark">Generated with Tracking QA</span>';
}

async function render() {
  const id = new URLSearchParams(location.search).get('id');
  const audit = id && await getAudit(id);
  const el = document.getElementById('report');
  if (!audit) { el.innerHTML = '<p>Audit not found. It may have been removed from history.</p>'; return; }

  const plan = await getPlan();
  const savedBrand = await getBrand();
  const brand = LIMITS[plan].customBranding ? savedBrand : { ...savedBrand, logoDataUrl: '', agencyName: '', brandColor: '#2f5bea' };
  document.documentElement.style.setProperty('--brand', brand.brandColor || '#2f5bea');
  const { showCredit, idLabels: labels } = await getSettings();
  idLabels = labels || {};

  const isSite = audit.type === 'site';
  const data = isSite ? audit.site : audit.result;
  const pageCount = isSite ? audit.pages.length : 1;
  const previous = findPrevious(await listAudits(), audit);
  current = { audit, data, isSite, pageCount };
  const consent = isSite ? audit.pages.find(p => p.consent)?.consent : audit.result.consent;
  const date = new Date(audit.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  document.title = `Tracking audit – ${audit.host} – ${new Date(audit.createdAt).toISOString().slice(0, 10)}`;

  el.innerHTML = `
    <div class="head">
      <div>${brand.logoDataUrl ? `<img src="${esc(brand.logoDataUrl)}" alt="">` : `<div class="agency">${esc(brand.agencyName || 'Tracking QA')}</div>`}</div>
      <div class="meta"><span class="prep${(audit.preparedFor ?? brand.preparedFor) ? '' : ' empty'}">Prepared for <span id="prepared-for" contenteditable="true" data-placeholder="Client name">${esc(audit.preparedFor ?? brand.preparedFor ?? '')}</span><br></span>${esc(date)}</div>
    </div>
    <h1>Tracking &amp; Consent Audit</h1>
    <div class="site">${esc(audit.host)}${isSite ? ` · ${pageCount} pages scanned` : ` · ${esc(audit.url)}`}</div>

    <div class="summary">
      <div class="dial" style="background: conic-gradient(${scoreColor(data.score)} ${Number(data.score) * 3.6 || 0}deg, var(--line) 0)">
        <div class="inner"><div><div class="num">${esc(data.score)}</div><div class="lbl">${grade(data.score)}</div></div></div>
      </div>
      <div>
        <p>${esc(executiveSummary(data.counts, data.score, isSite, pageCount))}</p>
        <div class="tally">
          <div><b class="sev critical">${esc(data.counts.critical)}</b>Critical</div>
          <div><b class="sev warning">${esc(data.counts.warning)}</b>Warnings</div>
          <div><b class="sev pass">${esc(data.counts.pass)}</b>Passed</div>
        </div>
      </div>
    </div>

    ${changesHtml(previous, data.findings, data.score, LIMITS[plan].changesSince)}

    <h2>Analyst notes</h2>
    <div class="notes" id="notes" contenteditable="true" data-placeholder="Click to add notes for your client (saved automatically, hidden in the PDF if empty).">${esc(audit.notes || '')}</div>

    <h2>Findings</h2>
    ${findingsHtml(data.findings, isSite, pageCount)}

    <h2>Platforms detected</h2>
    ${platformTable(data.platforms, isSite, pageCount)}

    <h2>Consent Mode status${isSite ? ' (first page)' : ''}</h2>
    ${consentTable(consent)}

    ${consentTestHtml(isSite ? audit.pages.find(p => p.consentTest)?.consentTest : audit.result.consentTest)}

    ${cookieTableHtml(isSite ? audit.pages.find(p => p.cookies?.length)?.cookies : audit.result.cookies)}

    ${!isSite && audit.result.session ? `<h2>Funnel steps audited</h2><ol class="steps">${audit.result.session.steps.map(u => `<li>${esc(u)}</li>`).join('')}</ol>` : ''}

    ${isSite ? `<h2>Pages scanned</h2><table><thead><tr><th>URL</th><th>Score</th><th>Critical</th><th>Warnings</th></tr></thead><tbody>
      ${audit.pages.map(p => `<tr><td class="mono">${esc(p.url)}</td><td>${esc(p.score)}</td><td>${esc(p.counts?.critical ?? 0)}</td><td>${esc(p.counts?.warning ?? 0)}</td></tr>`).join('')}
    </tbody></table>${audit.truncated ? `<p class="muted">${audit.truncated} more URLs were not scanned (plan limit).</p>` : ''}` : ''}

    <h2>Method</h2>
    <p class="muted">Pages were loaded in a standard Chrome browser and the network requests sent to the analytics and advertising platforms listed above were inspected, together with the page's tag configuration. Results reflect the visitor state at the time of the scan (typically before any cookie banner interaction). Server-side events (Conversions API, Measurement Protocol) are not visible from the browser and are not covered.</p>

    <div class="foot">
      <span>${esc(brand.agencyName)}${brand.contact && LIMITS[plan].customBranding ? ` · ${esc(brand.contact)}` : ''}</span>
      ${brand.ctaText && LIMITS[plan].customBranding ? `<a class="cta" href="${esc(/^https?:\/\//.test(brand.ctaUrl || '') ? brand.ctaUrl : '#')}">${esc(brand.ctaText)}</a>` : ''}
      ${footerCredit(LIMITS[plan].customBranding, showCredit !== false)}
    </div>`;

  const note = document.getElementById('toolbar-note');
  note.textContent = plan === 'pro' ? '' : 'Free plan: reports carry a small credit line. Your logo, colours and CTA are part of Pro.';
  if (plan !== 'pro') appendUpgrade(note, 'report-toolbar', 'Upgrade to Pro');
  const teaser = document.getElementById('changes-teaser');
  if (teaser) appendUpgrade(teaser, 'report-changes', 'See it with Pro');
}

let current = null;

document.addEventListener('focusout', async e => {
  if (!current) return;
  if (e.target.id === 'notes') await updateAudit(current.audit.id, { notes: e.target.innerText.trim() });
  if (e.target.id === 'prepared-for') await updateAudit(current.audit.id, { preparedFor: e.target.innerText.trim() });
});

const fileBase = () => `tracking-audit-${current.audit.host}-${new Date(current.audit.createdAt).toISOString().slice(0, 10)}`;
document.getElementById('print').addEventListener('click', () => window.print());
document.getElementById('csv').addEventListener('click', () => current && download(`${fileBase()}.csv`, findingsToCsv(current.data.findings), 'text/csv'));
document.getElementById('json').addEventListener('click', () => current && download(`${fileBase()}.json`, JSON.stringify(current.audit, null, 2), 'application/json'));
document.getElementById('copy').addEventListener('click', async e => {
  if (!current) return;
  await navigator.clipboard.writeText(summaryText({ url: current.audit.url, score: current.data.score, findings: current.data.findings, pages: current.isSite ? current.pageCount : null }));
  e.target.textContent = 'Copied';
  setTimeout(() => { e.target.textContent = 'Copy summary'; }, 1200);
});
wireTgfLinks(document.querySelector('.toolbar'), 'report-toolbar');
render().catch(() => {
  document.getElementById('report').innerHTML = '<p>This audit could not be displayed. The saved or imported file may be damaged.</p>';
});
