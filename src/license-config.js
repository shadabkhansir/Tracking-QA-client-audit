// Per-extension licensing config. The same src/license.js is reused across every The Growth Folks extension;
// only this file differs. Keep `enabled: false` until products exist and the privacy policy/store listing
// mention licence validation (see docs/LICENSING.md).
export const LICENSE_CONFIG = {
  enabled: false,
  // 'dodo' (Dodo Payments) or 'lemonsqueezy'.
  provider: 'dodo',
  // Dodo only: 'test' while trying it out, 'live' for real customers.
  mode: 'test',
  extension: 'tag-checker',
  // Your business/store ID (Dodo: "bus_…", Lemon Squeezy: numeric store id). Keys from any other merchant are
  // rejected: licence endpoints are public, so this check is what stops other sellers' keys working.
  storeId: null,
  // product id → plan it grants in THIS extension, e.g. { 'pdt_abc123': 'pro' }. List monthly and yearly products.
  products: {},
  // "All-access" bundle products that unlock every TGF extension, e.g. { 'pdt_bundle1': 'pro' }
  bundleProducts: {},
  // Lemon Squeezy only: per-variant override, e.g. an Agency variant { 777: 'pro' }
  variants: {},
  // Pricing page (used by generic upgrade prompts) and, once products exist, direct checkout links per period,
  // e.g. { monthly: 'https://checkout.dodopayments.com/buy/pdt_…', yearly: '…' }.
  checkoutUrl: 'https://thegrowthfolks.com/tools/tag-checker/pricing/',
  checkoutUrls: {},
  // Shown when a key hits its activation limit (e.g. after reinstalling), so the buyer can ask for a reset.
  supportEmail: 'team@thegrowthfolks.com',
  // Customer portal where buyers manage or cancel subscriptions (Dodo or Lemon Squeezy).
  manageUrl: 'https://thegrowthfolks.com/account',
  revalidateDays: 3,
  graceDays: 7,
};
