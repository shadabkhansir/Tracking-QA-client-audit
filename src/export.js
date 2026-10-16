// CSV / text exports shared by the side panel and the report page.
import { platformLabel } from './detectors.js';

const cell = v => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows) {
  return rows.map(r => r.map(cell).join(',')).join('\n');
}

export function hitsToCsv(hits) {
  const rows = [['time', 'platform', 'type', 'id', 'event', 'status', 'ms', 'consent', 'page', 'parameters']];
  for (const h of hits) {
    if (h.kind === 'nav') { rows.push([new Date(h.ts).toISOString(), 'navigation', '', '', '', '', '', '', h.url, '']); continue; }
    rows.push([
      h.ts ? new Date(h.ts).toISOString() : '',
      platformLabel(h.platform),
      h.kind,
      h.id || '',
      h.event || '',
      h.delivery ? (h.delivery.error || h.delivery.status) : '',
      h.delivery?.ms ?? '',
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
  const lines = [`Pixel & Tag Checker audit: ${url}${pages ? ` (${pages} pages)` : ''}`, `Score: ${score}/100`, ''];
  if (!issues.length) lines.push('No critical issues or warnings found.');
  for (const f of issues) lines.push(`${f.severity === 'critical' ? '🔴' : '🟠'} ${f.title}${f.fix ? `\n   Fix: ${f.fix}` : ''}`);
  const passes = findings.filter(f => f.severity === 'pass');
  if (passes.length) lines.push('', `✅ ${passes.map(f => f.title).join('; ')}`);
  return lines.join('\n');
}

// HAR 1.2 of the captured tracking requests (one entry per request; batched GA4 hits share one).
export function hitsToHar(hits, { pageUrl = '', creator = 'Pixel & Tag Checker by The Growth Folks®' } = {}) {
  const seen = new Set();
  const entries = [];
  for (const h of hits) {
    if (h.kind === 'nav' || !h.url) continue;
    const key = h.requestId || `${h.url}|${h.ts}`;
    if (seen.has(key)) continue;
    seen.add(key);
    let queryString = [];
    try { queryString = [...new URL(h.url).searchParams].map(([name, value]) => ({ name, value })); } catch { /* keep empty */ }
    const status = h.delivery?.status ?? 0;
    entries.push({
      startedDateTime: new Date(h.ts || Date.now()).toISOString(),
      time: h.delivery?.ms ?? -1,
      request: {
        method: h.method || (h.body ? 'POST' : 'GET'),
        url: h.url,
        httpVersion: 'HTTP/1.1',
        headers: [],
        queryString,
        cookies: [],
        headersSize: -1,
        bodySize: h.body ? h.body.length : 0,
        ...(h.body ? { postData: { mimeType: h.body.trim().startsWith('{') ? 'application/json' : 'text/plain', text: h.body } } : {}),
      },
      response: {
        status,
        statusText: h.delivery?.error || '',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        content: { size: 0, mimeType: '' },
        redirectURL: '',
        headersSize: -1,
        bodySize: -1,
        ...(h.delivery?.error ? { _error: h.delivery.error } : {}),
      },
      cache: {},
      timings: { send: 0, wait: Math.max(0, h.delivery?.ms ?? 0), receive: 0 },
      comment: `${platformLabel(h.platform)}${h.id ? ` ${h.id}` : ''}${h.event ? ` · ${h.event}` : ''}`,
    });
  }
  return { log: { version: '1.2', creator: { name: creator, version: '1' }, pages: pageUrl ? [{ startedDateTime: entries[0]?.startedDateTime || new Date().toISOString(), id: 'page_1', title: pageUrl, pageTimings: {} }] : [], entries } };
}
