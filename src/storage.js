import { getLimits } from './plan.js';

const KEY = 'audits';

export async function listAudits() {
  const { [KEY]: audits = [] } = await chrome.storage.local.get(KEY);
  return audits;
}

export async function getAudit(id) {
  return (await listAudits()).find(a => a.id === id) || null;
}

// Saved audits must not keep personal data: page URLs can carry emails (forms submitted with GET).
const EMAIL_IN_TEXT = /[A-Z0-9._%+-]+(?:@|%40)[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.(?!(?:png|jpe?g|gif|webp|svg|avif)\b)[A-Z]{2,}\b/gi;
export function redactEmails(obj) {
  return JSON.parse(JSON.stringify(obj).replace(EMAIL_IN_TEXT, '[email]'));
}

// Newest first; trimmed to the plan's history limit, but never below what is already saved
// (so a Pro → Free downgrade does not delete history).
export async function saveAudit(audit) {
  const { historyItems } = await getLimits();
  const clean = redactEmails(audit);
  const audits = (await listAudits()).filter(a => a.id !== clean.id);
  const keep = Math.max(historyItems, audits.length);
  audits.unshift(clean);
  await chrome.storage.local.set({ [KEY]: audits.slice(0, keep) });
  return clean;
}

export async function deleteAudit(id) {
  const audits = (await listAudits()).filter(a => a.id !== id);
  await chrome.storage.local.set({ [KEY]: audits });
}

export const DEFAULT_BRAND = {
  agencyName: '',
  brandColor: '#1f6b4f', // TGF --brand: default for the Pro colour picker
  logoDataUrl: '',
  contact: '',
  preparedFor: '',
  ctaText: '',
  ctaUrl: '',
};

export async function getBrand() {
  const { brand = {} } = await chrome.storage.local.get('brand');
  return { ...DEFAULT_BRAND, ...brand };
}

export async function setBrand(brand) {
  await chrome.storage.local.set({ brand: { ...DEFAULT_BRAND, ...brand } });
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// showCredit: the small "Made with … by The Growth Folks®" line in client reports (on by default, user can turn it off).
export const DEFAULT_SETTINGS = { preserveLog: false, showCredit: true, customProviders: [], idLabels: {} };

export async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function setSettings(patch) {
  await chrome.storage.local.set({ settings: { ...(await getSettings()), ...patch } });
}

export async function updateAudit(id, patch) {
  const audits = await listAudits();
  const i = audits.findIndex(a => a.id === id);
  if (i < 0) return null;
  audits[i] = { ...audits[i], ...patch };
  await chrome.storage.local.set({ [KEY]: audits });
  return audits[i];
}

// Monitors: { id, host, urls[], frequency: 'daily'|'weekly', consentTest, enabled, lastRun, lastAuditId, lastScore }
export async function listMonitors() {
  const { monitors = [] } = await chrome.storage.local.get('monitors');
  return monitors;
}

export async function saveMonitors(monitors) {
  await chrome.storage.local.set({ monitors });
}

// Imports an audit exported as JSON from another browser. Validates the shape and gives it a fresh id.
export async function importAudit(data) {
  const ok = data && typeof data === 'object' && typeof data.url === 'string'
    && ((data.type === 'page' && Array.isArray(data.result?.findings)) || (data.type === 'site' && Array.isArray(data.site?.findings) && Array.isArray(data.pages)));
  if (!ok) throw new Error('This file is not a Tracking QA audit export.');
  const audit = JSON.parse(JSON.stringify(data));
  // Imported files are untrusted: force numeric and enum fields to safe values before anything renders them.
  const num = v => (Number.isFinite(+v) ? +v : 0);
  const SEV = ['critical', 'warning', 'info', 'pass'];
  const clean = d => {
    if (!d || typeof d !== 'object') return;
    d.score = num(d.score);
    d.counts = Object.fromEntries(SEV.map(k => [k, num(d.counts?.[k])]));
    d.platforms = d.platforms && typeof d.platforms === 'object' && !Array.isArray(d.platforms) ? d.platforms : {};
    for (const p of Object.values(d.platforms)) if (p && typeof p === 'object') { p.ids = Array.isArray(p.ids) ? p.ids.map(String) : []; p.pages = num(p.pages); }
    d.findings = (Array.isArray(d.findings) ? d.findings : []).filter(f => f && typeof f === 'object')
      .map(f => ({ ...f, id: String(f.id || ''), title: String(f.title || ''), detail: String(f.detail || ''), fix: String(f.fix || ''), severity: SEV.includes(f.severity) ? f.severity : 'info', pages: Array.isArray(f.pages) ? f.pages.map(String) : undefined }));
  };
  clean(audit.result);
  clean(audit.site);
  if (Array.isArray(audit.pages)) { audit.pages = audit.pages.filter(p => p && typeof p === 'object'); audit.pages.forEach(p => { clean(p); p.url = String(p.url || ''); }); }
  audit.truncated = num(audit.truncated);
  audit.id = newId();
  audit.imported = true;
  audit.host = String(audit.host || (() => { try { return new URL(audit.url).hostname; } catch { return 'imported'; } })());
  audit.createdAt = Number(audit.createdAt) || Date.now();
  return saveAudit(audit);
}
