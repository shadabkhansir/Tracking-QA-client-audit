// Audits are comparable when they cover the same URLs (a 1-page monitor run vs a 20-page scan is not).
export function auditUrls(a) {
  return a.type === 'site' ? [...new Set(a.pages.map(p => p.url))].sort().join('|') : a.url;
}

export function findPrevious(audits, audit) {
  const key = auditUrls(audit);
  return audits.filter(a => a.id !== audit.id && a.type === audit.type && a.createdAt < audit.createdAt && auditUrls(a) === key)
    .sort((a, b) => b.createdAt - a.createdAt)[0] || null;
}

// Compares two finding lists (previous audit vs current) for "what changed" sections and monitoring alerts.
const key = f => `${f.id}|${f.title}`;
// Same rule on a different tag (pixel A fixed, pixel B now broken) is a change, not "unchanged".
const ruleKey = f => `${f.id}|${f.platform || ''}|${f.tagId || ''}`;

export function diffFindings(previous = [], current = []) {
  const prev = new Map(previous.filter(f => f.severity !== 'pass').map(f => [key(f), f]));
  const curr = new Map(current.filter(f => f.severity !== 'pass').map(f => [key(f), f]));
  // Same rule id with a different title (e.g. a count changed) counts as unchanged, not resolved + added.
  const prevIds = new Set([...prev.values()].map(ruleKey));
  const currIds = new Set([...curr.values()].map(ruleKey));
  return {
    added: [...curr.values()].filter(f => !prev.has(key(f)) && !prevIds.has(ruleKey(f))),
    resolved: [...prev.values()].filter(f => !curr.has(key(f)) && !currIds.has(ruleKey(f))),
    unchanged: [...curr.values()].filter(f => prev.has(key(f)) || prevIds.has(ruleKey(f))),
  };
}
