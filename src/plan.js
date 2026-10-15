// Free vs Pro gating. The plan comes from a validated licence key (src/license.js, off until
// LICENSE_CONFIG.enabled) or, on unpacked developer installs, the Pro toggle in Options. Must match docs/PLANS.md.
import { LICENSE_CONFIG } from './license-config.js';
import { getLicense, planFromLicense } from './license.js';

export const LIMITS = {
  free: { scanPages: 3, historyItems: 5, customBranding: false, monitors: 0 },
  pro: { scanPages: 50, historyItems: 500, customBranding: true, monitors: 20 },
};

export async function getPlan() {
  const { plan } = await chrome.storage.local.get('plan'); // developer toggle
  if (plan === 'pro') return 'pro';
  if (!LICENSE_CONFIG.enabled) return 'free';
  return planFromLicense(await getLicense()) === 'pro' ? 'pro' : 'free';
}

export async function setPlan(plan) {
  await chrome.storage.local.set({ plan: plan === 'pro' ? 'pro' : 'free' });
}

export async function getLimits() {
  return LIMITS[await getPlan()];
}
