// Free vs Pro gating. Payments are not wired yet: `pro` is set by a license integration
// (e.g. ExtensionPay or Lemon Squeezy) calling setPlan('pro'). Unpacked dev installs get a toggle in Options.
export const LIMITS = {
  free: { scanPages: 3, historyItems: 5, customBranding: false },
  pro: { scanPages: 50, historyItems: 500, customBranding: true },
};

export async function getPlan() {
  const { plan } = await chrome.storage.local.get('plan');
  return plan === 'pro' ? 'pro' : 'free';
}

export async function setPlan(plan) {
  await chrome.storage.local.set({ plan: plan === 'pro' ? 'pro' : 'free' });
}

export async function getLimits() {
  return LIMITS[await getPlan()];
}
