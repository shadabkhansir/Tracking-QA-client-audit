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
export const DEFAULT_SETTINGS = { preserveLog: false, showCredit: true };

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
