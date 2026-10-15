// Classifies first-party cookies by vendor and purpose from their name. Values are never used.
const RULES = [
  [/^_ga(_|$)/, 'Google Analytics', 'analytics'],
  [/^_gid$/, 'Google Analytics', 'analytics'],
  [/^_gat/, 'Google Analytics', 'analytics'],
  [/^_gcl_/, 'Google Ads', 'advertising'],
  [/^(FPGCLAW|FPGCLDC|FPAU|FPID|FPLC)$/, 'Google (server-side)', 'advertising'],
  [/^_fbp$|^_fbc$/, 'Meta', 'advertising'],
  [/^_ttp$|^_tt_enable_cookie$|^ttcsid/, 'TikTok', 'advertising'],
  [/^_uet(sid|vid)$/, 'Microsoft Ads', 'advertising'],
  [/^_pin_unauth$|^_pinterest_/, 'Pinterest', 'advertising'],
  [/^_scid|^_sctr$|^sc_at$/, 'Snapchat', 'advertising'],
  [/^_rdt_/, 'Reddit', 'advertising'],
  [/^_twclid$|^muc_ads$/, 'X', 'advertising'],
  [/^li_fat_id$|^_li_/, 'LinkedIn', 'advertising'],
  [/^_cl(ck|sk)$/, 'Microsoft Clarity', 'analytics'],
  [/^_hj/, 'Hotjar', 'analytics'],
  [/^OptanonConsent$|^OptanonAlertBoxClosed$|^eupubconsent/, 'OneTrust / TCF', 'consent'],
  [/^CookieConsent$/, 'Cookiebot', 'consent'],
  [/^uc_|^usercentrics/, 'Usercentrics', 'consent'],
  [/^didomi_token$|^euconsent-v2$/, 'Didomi / TCF', 'consent'],
  [/^cookieyes-consent$|^cmplz_/, 'CMP', 'consent'],
  [/^_shopify_|^_tracking_consent$|^_landing_page$|^_orig_referrer$/, 'Shopify', 'functional'],
];

export function classifyCookie(name) {
  for (const [re, vendor, category] of RULES) if (re.test(name)) return { vendor, category };
  return { vendor: null, category: 'other' };
}

export function classifyCookies(table) {
  return (table || []).map(c => ({ ...c, ...classifyCookie(c.name) }));
}
