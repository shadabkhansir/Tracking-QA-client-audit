// Per-extension licensing config. The same src/license.js is reused across every The Growth Folks extension;
// only this file differs. Pro is sold through Dodo Payments (docs/PRO-LAUNCH.md).
//
// Going live: create the same products in Dodo live mode, paste their IDs into MODES.live, set `mode: 'live'`
// and bump the manifest version. Nothing else changes.
const MODE = 'test';

// Dodo test and live mode have separate product IDs. Test keys only work against test.dodopayments.com.
const MODES = {
  test: {
    // Your business ID (Dodo dashboard → Settings → Business). Keys from any other merchant are rejected:
    // licence endpoints are public, so this check is what stops other sellers' keys working.
    storeId: 'bus_0NpnX11SKy0ofT8uayAT6',
    // product id → plan it grants in THIS extension. List monthly and yearly products.
    products: {
      pdt_0Npxkz5LBfgbvi5QHUQOk: 'pro', // Pixel & Tag Checker Pro (Monthly)
      pdt_0NpxkzALfz1HOyTZ1KKRG: 'pro', // Pixel & Tag Checker Pro (Yearly)
    },
    // "All-access" bundle products that unlock every TGF extension.
    bundleProducts: {
      pdt_0NpxkzUIMglZyIEHIKm6O: 'pro', // TGF All-Access (Monthly)
      pdt_0NpxkzZ63iky6mDz4ps7o: 'pro', // TGF All-Access (Yearly)
    },
    manageUrl: 'https://test.customer.dodopayments.com/login/bus_0NpnX11SKy0ofT8uayAT6',
  },
  live: {
    storeId: null, // fill in from Dodo live mode before setting MODE = 'live'
    products: {},
    bundleProducts: {},
    manageUrl: null, // 'https://customer.dodopayments.com/login/<live business ID>'
  },
};

export const LICENSE_CONFIG = {
  // Free launch switch: true = every feature free for everyone (no limits, no upgrade prompts, no Pro badges).
  allFree: false,
  enabled: true,
  // 'dodo' (Dodo Payments) or 'lemonsqueezy'.
  provider: 'dodo',
  // Dodo only: 'test' while trying it out, 'live' for real customers.
  mode: MODE,
  extension: 'tag-checker',
  // Lemon Squeezy only: per-variant override, e.g. an Agency variant { 777: 'pro' }
  variants: {},
  // Upgrade prompts open the pricing page, which holds the Dodo checkout links (one place to change prices).
  checkoutUrl: 'https://thegrowthfolks.com/tools/tag-checker/pricing/',
  checkoutUrls: {},
  // Shown when a key hits its activation limit (e.g. after reinstalling), so the buyer can ask for a reset.
  supportEmail: 'team@thegrowthfolks.com',
  // Users who installed during the free launch (v1.1 and earlier) keep Pro until this date (docs/PRO-LAUNCH.md §0).
  // null switches grandfathering off.
  launchUsersProUntil: '2027-01-31',
  // First paid version. Installs from before it count as free-launch users.
  paidSinceVersion: '1.2.0',
  revalidateDays: 3,
  graceDays: 7,
  ...MODES[MODE],
};
