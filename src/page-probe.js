// Injected into the page's MAIN world via chrome.scripting.executeScript.
// Must be fully self-contained: Chrome serializes the function source, so no imports or outer references.
export function pageProbe(options = {}) {
  const MAX_DEPTH = 4;
  const clean = (v, d = 0) => {
    if (typeof v === 'function') return '[fn]';
    if (v === null || typeof v !== 'object') return v;
    if (d > MAX_DEPTH) return '[…]';
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

  return {
    url: location.href,
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
