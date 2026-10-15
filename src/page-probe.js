// Injected into the page's MAIN world via chrome.scripting.executeScript.
// Must be fully self-contained: Chrome serializes the function source, so no imports or outer references.
export function pageProbe(options = {}) {
  const MAX_DEPTH = 4;
  const clean = (v, d = 0) => {
    if (typeof v === 'function') return '[fn]';
    if (v === null || typeof v !== 'object') return v;
    if (d > MAX_DEPTH) return '[…]';
    if (v instanceof Date) return v.toISOString();
    if (typeof Node !== 'undefined' && v instanceof Node) return '[node]';
    if (typeof Window !== 'undefined' && v instanceof Window) return '[window]';
    const isArgs = Object.prototype.toString.call(v) === '[object Arguments]';
    if (Array.isArray(v) || isArgs) {
      const arr = Array.from(v).slice(0, 50).map(x => clean(x, d + 1));
      return isArgs ? { __gtag: arr } : arr;
    }
    const out = {};
    for (const k of Object.keys(v).slice(0, 60)) {
      try { out[k] = clean(v[k], d + 1); } catch { out[k] = '[err]'; }
    }
    return out;
  };
  const safe = fn => { try { return fn(); } catch { return undefined; } };
  const w = window;

  const dataLayer = Array.isArray(w.dataLayer) ? w.dataLayer.slice(0, 300).map(e => clean(e)) : null;

  const googleTagIds = Object.keys(safe(() => w.google_tag_manager) || {}).filter(k => /^(G|GTM|AW|GT|DC)-/i.test(k));

  // Google's runtime consent state: the source of truth even when a CMP template sets defaults
  // through GTM's setDefaultConsentState API (which never touches dataLayer).
  const ics = safe(() => w.google_tag_data && w.google_tag_data.ics);
  let consentState = null;
  if (ics && ics.entries) {
    const toState = b => (b === true ? 'granted' : b === false ? 'denied' : null);
    consentState = { entries: {}, wasSetLate: safe(() => ics.wasSetLate), usedDefault: safe(() => ics.usedDefault), usedUpdate: safe(() => ics.usedUpdate) };
    for (const [type, e] of Object.entries(ics.entries)) {
      consentState.entries[type] = { default: toState(e && e.default), update: toState(e && e.update) };
    }
  }

  const metaPixels = safe(() => {
    if (typeof w.fbq !== 'function') return null;
    const state = typeof w.fbq.getState === 'function' ? w.fbq.getState() : null;
    return { version: w.fbq.version || null, ids: state && Array.isArray(state.pixels) ? state.pixels.map(p => String(p.id)) : [] };
  }) || null;

  const tiktokPixels = safe(() => {
    if (!w.ttq) return null;
    return { ids: w.ttq._i ? Object.keys(w.ttq._i) : [] };
  }) || null;

  const cmps = [];
  const cmpChecks = {
    'IAB TCF': () => typeof w.__tcfapi === 'function',
    Cookiebot: () => !!(w.Cookiebot || w.CookieConsent && w.CookieConsent.consent),
    OneTrust: () => !!(w.OneTrust || w.OptanonActiveGroups !== undefined),
    Usercentrics: () => !!(w.UC_UI || w.usercentrics),
    CookieYes: () => typeof w.getCkyConsent === 'function',
    Didomi: () => !!w.Didomi,
    Iubenda: () => !!w._iub,
    Complianz: () => !!w.complianz,
    Termly: () => !!w.Termly,
    'Klaro': () => !!w.klaro,
  };
  for (const [name, test] of Object.entries(cmpChecks)) if (safe(test)) cmps.push(name);

  let links = [];
  if (options.collectLinks) {
    const origin = location.origin;
    const seen = new Set();
    for (const a of document.querySelectorAll('a[href]')) {
      try {
        const u = new URL(a.href, location.href);
        u.hash = '';
        if (u.origin !== origin || !/^https?:$/.test(u.protocol)) continue;
        if (/\.(pdf|jpe?g|png|gif|svg|zip|mp4|webp)$/i.test(u.pathname)) continue;
        if (!seen.has(u.href)) { seen.add(u.href); links.push(u.href); }
      } catch { /* ignore */ }
      if (links.length >= 50) break;
    }
  }

  // Names only, never values.
  const cookieNames = safe(() => document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(Boolean)) || [];

  // Where the inline GTM / Meta base snippets sit. Vendors recommend <head> so tags load before the user can leave.
  const placement = safe(() => {
    const inline = Array.from(document.scripts).filter(el => !el.src);
    const where = re => {
      const el = inline.find(x => re.test(x.textContent || ''));
      return el ? (el.closest('head') ? 'head' : 'body') : null;
    };
    return { gtmSnippet: where(/gtm\.start/), metaBase: where(/fbevents\.js/), tiktokBase: where(/analytics\.tiktok\.com\/i18n\/pixel/) };
  }) || {};

  const shopify = safe(() => (w.Shopify ? { shop: w.Shopify.shop || null, theme: w.Shopify.theme?.name || null } : null)) || null;

  return {
    url: location.href,
    cookieNames,
    placement,
    shopify,
    gpc: navigator.globalPrivacyControl === true,
    title: document.title,
    hasGtag: typeof w.gtag === 'function',
    dataLayer,
    googleTagIds,
    consentState,
    metaPixels,
    tiktokPixels,
    cmps,
    links,
  };
}

// Injected into the MAIN world to click "accept all" on the consent banner.
// Prefers each CMP's own JS API; falls back to known button selectors, then to button text.
export function acceptConsent() {
  const w = window;
  const tryApi = [
    ['OneTrust', () => w.OneTrust && typeof w.OneTrust.AllowAll === 'function' && (w.OneTrust.AllowAll(), true)],
    ['Cookiebot', () => w.Cookiebot && typeof w.Cookiebot.submitCustomConsent === 'function' && (w.Cookiebot.submitCustomConsent(true, true, true), true)],
    ['Usercentrics', () => w.UC_UI && typeof w.UC_UI.acceptAllConsents === 'function' && (w.UC_UI.acceptAllConsents(), true)],
    ['Didomi', () => w.Didomi && typeof w.Didomi.setUserAgreeToAll === 'function' && (w.Didomi.setUserAgreeToAll(), true)],
    ['Complianz', () => typeof w.cmplz_set_consent === 'function' && (['marketing', 'statistics', 'preferences'].forEach(c => w.cmplz_set_consent(c, 'allow')), true)],
  ];
  for (const [name, fn] of tryApi) {
    try { if (fn()) return { accepted: true, method: `${name} API` }; } catch { /* try next */ }
  }
  const selectors = ['#onetrust-accept-btn-handler', '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', '#CybotCookiebotDialogBodyButtonAccept',
    '[data-testid="uc-accept-all-button"]', '.cky-btn-accept', '#didomi-notice-agree-button', '.iubenda-cs-accept-btn', '.cmplz-accept',
    '#truste-consent-button', '.qc-cmp2-summary-buttons button[mode="primary"]', '#accept-recommended-btn-handler', '[data-cookiefirst-action="accept"]',
    '.cc-allow', '.cookie-notice-accept', '#cookie_action_close_header', '[data-tid="banner-accept"]'];
  const visible = el => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (visible(el)) { el.click(); return { accepted: true, method: `button ${sel}` }; }
  }
  const words = /^(accept( all)?( cookies)?|allow( all)?( cookies)?|agree( to all)?|i agree|ok(ay)?, ?got it|got it|alle akzeptieren|akzeptieren|tout accepter|accepter|aceptar( todo)?|accetta( tutto)?|aceitar)$/i;
  for (const el of document.querySelectorAll('button, a[role="button"], [role="button"], input[type="button"], input[type="submit"]')) {
    const text = (el.innerText || el.value || '').trim().replace(/\s+/g, ' ');
    if (text.length < 40 && words.test(text) && visible(el)) { el.click(); return { accepted: true, method: `button "${text}"` }; }
  }
  return { accepted: false, reason: 'No supported consent platform API or accept button was found on the page.' };
}

// Injected into the MAIN world to click "reject all" on the consent banner.
export function rejectConsent() {
  const w = window;
  const tryApi = [
    ['OneTrust', () => w.OneTrust && typeof w.OneTrust.RejectAll === 'function' && (w.OneTrust.RejectAll(), true)],
    ['Cookiebot', () => w.Cookiebot && typeof w.Cookiebot.submitCustomConsent === 'function' && (w.Cookiebot.submitCustomConsent(false, false, false), true)],
    ['Usercentrics', () => w.UC_UI && typeof w.UC_UI.denyAllConsents === 'function' && (w.UC_UI.denyAllConsents(), true)],
    ['Didomi', () => w.Didomi && typeof w.Didomi.setUserDisagreeToAll === 'function' && (w.Didomi.setUserDisagreeToAll(), true)],
    ['Complianz', () => typeof w.cmplz_set_consent === 'function' && (['marketing', 'statistics', 'preferences'].forEach(c => w.cmplz_set_consent(c, 'deny')), true)],
  ];
  for (const [name, fn] of tryApi) {
    try { if (fn()) return { accepted: true, method: `${name} API` }; } catch { /* try next */ }
  }
  const selectors = ['#onetrust-reject-all-handler', '#CybotCookiebotDialogBodyButtonDecline', '[data-testid="uc-deny-all-button"]', '.cky-btn-reject',
    '#didomi-notice-disagree-button', '.iubenda-cs-reject-btn', '.cmplz-deny', '[data-cookiefirst-action="reject"]', '.cc-deny', '[data-tid="banner-decline"]'];
  const visible = el => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (visible(el)) { el.click(); return { accepted: true, method: `button ${sel}` }; }
  }
  const words = /^(reject( all)?( cookies)?|decline( all)?|deny( all)?|refuse( all)?|only (necessary|essential)( cookies)?|necessary only|alle ablehnen|ablehnen|tout refuser|refuser|rechazar( todo)?|rifiuta( tutto)?|rejeitar)$/i;
  for (const el of document.querySelectorAll('button, a[role="button"], [role="button"], input[type="button"], input[type="submit"]')) {
    const text = (el.innerText || el.value || '').trim().replace(/\s+/g, ' ');
    if (text.length < 40 && words.test(text) && visible(el)) { el.click(); return { accepted: true, method: `button "${text}"` }; }
  }
  return { accepted: false, reason: 'No supported consent platform API or reject button was found on the page.' };
}
