import { getLimits } from './plan.js';

const KEY = 'audits';

export async function listAudits() {
  const { [KEY]: audits = [] } = await chrome.storage.local.get(KEY);
  return audits;
}

export async function getAudit(id) {
  return (await listAudits()).find(a => a.id === id) || null;
}

// Newest first; trimmed to the plan's history limit.
export async function saveAudit(audit) {
  const { historyItems } = await getLimits();
  const audits = (await listAudits()).filter(a => a.id !== audit.id);
  audits.unshift(audit);
  await chrome.storage.local.set({ [KEY]: audits.slice(0, historyItems) });
  return audit;
}

export async function deleteAudit(id) {
  const audits = (await listAudits()).filter(a => a.id !== id);
  await chrome.storage.local.set({ [KEY]: audits });
}

export const DEFAULT_BRAND = {
  agencyName: '',
  brandColor: '#2f5bea',
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
  audit.id = newId();
  audit.imported = true;
  audit.host = String(audit.host || (() => { try { return new URL(audit.url).hostname; } catch { return 'imported'; } })());
  audit.createdAt = Number(audit.createdAt) || Date.now();
  return saveAudit(audit);
}
