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
