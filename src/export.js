// CSV / text exports shared by the side panel and the report page.
import { PLATFORM_LABELS } from './detectors.js';

const cell = v => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows) {
  return rows.map(r => r.map(cell).join(',')).join('\n');
}

export function hitsToCsv(hits) {
  const rows = [['time', 'platform', 'type', 'id', 'event', 'consent', 'page', 'parameters']];
  for (const h of hits) {
    if (h.kind === 'nav') { rows.push([new Date(h.ts).toISOString(), 'navigation', '', '', '', '', h.url, '']); continue; }
    rows.push([
      h.ts ? new Date(h.ts).toISOString() : '',
      PLATFORM_LABELS[h.platform] || h.platform,
      h.kind,
      h.id || '',
      h.event || '',
      h.consent?.gcs || h.consent?.gcd || '',
      h.params?.dl || h.params?.['context.page.url'] || '',
      Object.entries(h.params || {}).map(([k, v]) => `${k}=${v}`).join('&'),
    ]);
  }
  return toCsv(rows);
}

export function findingsToCsv(findings) {
  return toCsv([['severity', 'finding', 'detail', 'how to fix', 'pages affected'],
    ...findings.map(f => [f.severity, f.title, f.detail, f.fix, (f.pages || []).join(' ')])]);
}

export function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Plain-text summary for email or Slack.
export function summaryText({ url, score, findings, pages }) {
  const issues = findings.filter(f => f.severity === 'critical' || f.severity === 'warning');
  const lines = [`Tracking audit: ${url}${pages ? ` (${pages} pages)` : ''}`, `Score: ${score}/100`, ''];
  if (!issues.length) lines.push('No critical issues or warnings found.');
  for (const f of issues) lines.push(`${f.severity === 'critical' ? '🔴' : '🟠'} ${f.title}${f.fix ? `\n   Fix: ${f.fix}` : ''}`);
  const passes = findings.filter(f => f.severity === 'pass');
  if (passes.length) lines.push('', `✅ ${passes.map(f => f.title).join('; ')}`);
  return lines.join('\n');
}
