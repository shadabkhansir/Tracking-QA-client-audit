// Free vs Pro gating. The plan comes from a validated licence key (src/license.js, off until
// LICENSE_CONFIG.enabled) or, on unpacked developer installs only, the Pro toggle in Options. Must match docs/PLANS.md.
import { LICENSE_CONFIG } from './license-config.js';
import { getLicense, planFromLicense } from './license.js';

export const LIMITS = {
  free: { scanPages: 3, historyItems: 5, customBranding: false, monitors: 0, changesSince: false },
  pro: { scanPages: 50, historyItems: 500, customBranding: true, monitors: 20, changesSince: true },
};

// The developer toggle is honoured only on unpacked installs, so a store install can't unlock Pro by
// writing `plan` into storage. management.getSelf needs no permission.
let devInstall;
async function isDevInstall() {
  if (devInstall === undefined) {
    const self = await chrome.management?.getSelf?.().catch(() => null);
    devInstall = self?.installType === 'development';
  }
  return devInstall;
}

// Launch period: every feature free for everyone (LICENSE_CONFIG.allFree). Internally that is the 'pro' tier.
export const allFree = (cfg = LICENSE_CONFIG) => !!cfg.allFree;

// Installed during the free launch? background.js records installedVersion on install, and "<=x" for updates
// from 1.0, before the paid build existed. Installs older than paidSinceVersion keep Pro until launchUsersProUntil.
const vnum = v => String(v).split('.').map(Number).reduce((n, x, i) => n + (x || 0) * 1000 ** (2 - i), 0);
export function isLaunchUser(installedVersion, cfg = LICENSE_CONFIG) {
  if (!installedVersion) return false;
  if (String(installedVersion).startsWith('<=')) return true;
  return vnum(installedVersion) < vnum(cfg.paidSinceVersion || '0');
}

export function launchProActive(installedVersion, cfg = LICENSE_CONFIG, now = Date.now()) {
  if (!cfg.launchUsersProUntil || !isLaunchUser(installedVersion, cfg)) return false;
  return now < Date.parse(`${cfg.launchUsersProUntil}T23:59:59Z`);
}

export async function getPlan(cfg = LICENSE_CONFIG) {
  if (allFree(cfg)) return 'pro';
  if (await isDevInstall()) {
    const { plan } = await chrome.storage.local.get('plan');
    if (plan === 'pro') return 'pro';
  }
  if (!cfg.enabled) return 'free';
  if (planFromLicense(await getLicense(), Date.now(), cfg) === 'pro') return 'pro';
  const { installedVersion } = await chrome.storage.local.get('installedVersion');
  return launchProActive(installedVersion, cfg) ? 'pro' : 'free';
}

// What the UI calls the current plan: "Free" for everyone during the free launch.
export const planLabel = (plan, cfg = LICENSE_CONFIG) => (allFree(cfg) ? 'Free' : plan === 'pro' ? 'Pro' : 'Free');

export async function setPlan(plan) {
  await chrome.storage.local.set({ plan: plan === 'pro' ? 'pro' : 'free' });
}

export async function getLimits() {
  return LIMITS[await getPlan()];
}

// True once Pro can actually be bought; until then upgrade prompts say "coming soon" (no misleading claims).
export const proOnSale = () => LICENSE_CONFIG.enabled;

// Checkout link for an upgrade prompt. `where` names the prompt (utm_content) so the pricing page and the
// provider's analytics show which limit sold the upgrade.
export function upgradeUrl(where, period = '') {
  const cfg = LICENSE_CONFIG;
  const u = new URL((period && cfg.checkoutUrls?.[period]) || cfg.checkoutUrl);
  u.searchParams.set('utm_source', 'chrome-extension');
  u.searchParams.set('utm_medium', 'upgrade');
  u.searchParams.set('utm_campaign', cfg.extension);
  if (where) u.searchParams.set('utm_content', where);
  return u.toString();
}

// Appends "Upgrade to Pro" (or "Pro: coming soon" before launch) after `el`'s text. Built with DOM nodes, not HTML.
export function appendUpgrade(el, where, label = 'Upgrade to Pro') {
  el.querySelector('.upgrade')?.remove();
  if (allFree()) return;
  const node = proOnSale() ? document.createElement('a') : document.createElement('span');
  node.className = 'upgrade';
  if (proOnSale()) {
    node.href = upgradeUrl(where);
    node.target = '_blank';
    node.rel = 'noopener';
    node.textContent = label;
  } else {
    node.textContent = 'Pro: coming soon';
  }
  el.append(' ', node);
}
