import { getAudit, getBrand } from '../src/storage.js';
import { getPlan, LIMITS } from '../src/plan.js';
import { PLATFORM_LABELS } from '../src/detectors.js';
import { CONSENT_SIGNALS } from '../src/checks.js';

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

function platformTable(platforms, isSite, pageCount) {
  const rows = Object.entries(platforms);
  if (!rows.length) return '<p class="muted">No tracking platforms detected.</p>';
  return `<table><thead><tr><th>Platform</th><th>IDs</th>${isSite ? '<th>Found on</th>' : '<th>Events observed</th>'}</tr></thead><tbody>
    ${rows.map(([k, p]) => `<tr><td>${esc(PLATFORM_LABELS[k] || k)}</td><td class="mono">${esc(p.ids.join(', ') || '—')}</td>
      <td>${isSite ? `${p.pages}/${pageCount} pages` : esc(Object.entries(p.events || {}).map(([e, n]) => `${e} ×${n}`).join(', ') || '—')}</td></tr>`).join('')}
  </tbody></table>`;
}

function findingsHtml(findings, isSite, pageCount) {
  const issues = findings.filter(f => f.severity !== 'pass');
  const passes = findings.filter(f => f.severity === 'pass');
  return `
    ${issues.length ? issues.map(f => `
      <div class="finding ${f.severity}">
        <div class="t"><span>${esc(f.title)}</span><span class="sev ${f.severity}">${SEV_LABEL[f.severity]}</span></div>
        ${f.detail ? `<div>${esc(f.detail)}</div>` : ''}
        ${f.fix ? `<div class="fix"><b>How to fix:</b> ${esc(f.fix)}</div>` : ''}
        ${isSite && f.pages ? `<div class="pages">Affects ${f.pages.length}/${pageCount} pages${f.pages.length <= 5 ? `: ${f.pages.map(esc).join(', ')}` : ''}</div>` : ''}
      </div>`).join('') : '<p>No issues found.</p>'}
    ${passes.length ? `<h2>What's working</h2><ul class="passes">${passes.map(f => `<li><span>${esc(f.title)}</span></li>`).join('')}</ul>` : ''}`;
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

  const isSite = audit.type === 'site';
  const data = isSite ? audit.site : audit.result;
  const pageCount = isSite ? audit.pages.length : 1;
  const consent = isSite ? audit.pages.find(p => p.consent)?.consent : audit.result.consent;
  const date = new Date(audit.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  document.title = `Tracking audit – ${audit.host} – ${new Date(audit.createdAt).toISOString().slice(0, 10)}`;

  el.innerHTML = `
    <div class="head">
      <div>${brand.logoDataUrl ? `<img src="${esc(brand.logoDataUrl)}" alt="">` : `<div class="agency">${esc(brand.agencyName || 'Tracking QA')}</div>`}</div>
      <div class="meta">${brand.preparedFor ? `Prepared for ${esc(brand.preparedFor)}<br>` : ''}${esc(date)}</div>
    </div>
    <h1>Tracking &amp; Consent Audit</h1>
    <div class="site">${esc(audit.host)}${isSite ? ` · ${pageCount} pages scanned` : ` · ${esc(audit.url)}`}</div>

    <div class="summary">
      <div class="dial" style="background: conic-gradient(${scoreColor(data.score)} ${data.score * 3.6}deg, var(--line) 0)">
        <div class="inner"><div><div class="num">${data.score}</div><div class="lbl">${grade(data.score)}</div></div></div>
      </div>
      <div>
        <p>${esc(executiveSummary(data.counts, data.score, isSite, pageCount))}</p>
        <div class="tally">
          <div><b class="sev critical">${data.counts.critical}</b>Critical</div>
          <div><b class="sev warning">${data.counts.warning}</b>Warnings</div>
          <div><b class="sev pass">${data.counts.pass}</b>Passed</div>
        </div>
      </div>
    </div>

    <h2>Findings</h2>
    ${findingsHtml(data.findings, isSite, pageCount)}

    <h2>Platforms detected</h2>
    ${platformTable(data.platforms, isSite, pageCount)}

    <h2>Consent Mode status${isSite ? ' (first page)' : ''}</h2>
    ${consentTable(consent)}

    ${isSite ? `<h2>Pages scanned</h2><table><thead><tr><th>URL</th><th>Score</th><th>Critical</th><th>Warnings</th></tr></thead><tbody>
      ${audit.pages.map(p => `<tr><td class="mono">${esc(p.url)}</td><td>${p.score}</td><td>${p.counts.critical}</td><td>${p.counts.warning}</td></tr>`).join('')}
    </tbody></table>${audit.truncated ? `<p class="muted">${audit.truncated} more URLs were not scanned (plan limit).</p>` : ''}` : ''}

    <h2>Method</h2>
    <p class="muted">Pages were loaded in a standard Chrome browser and the network requests sent to Google, Meta and TikTok were inspected, together with the page's tag configuration. Results reflect the visitor state at the time of the scan (typically before any cookie banner interaction). Server-side events (Conversions API, Measurement Protocol) are not visible from the browser and are not covered.</p>

    <div class="foot">
      <span>${esc(brand.agencyName)}${brand.contact ? ` · ${esc(brand.contact)}` : ''}</span>
      ${LIMITS[plan].customBranding ? '' : '<span class="watermark">Generated with Tracking QA</span>'}
    </div>`;

  document.getElementById('toolbar-note').textContent = plan === 'pro' ? '' : 'Free plan: upgrade to remove the watermark and add your logo.';
}

document.getElementById('print').addEventListener('click', () => window.print());
render();
