// Classifies outgoing network requests into tracking "hits" and "script" loads.
// Pure functions: no chrome.* APIs, so they run under `node --test`.

const GOOGLE_ID = /^(G|GTM|AW|GT|DC)-[A-Z0-9]+$/i;

// gcs = "G1" + ad_storage + analytics_storage, each 1 (granted) / 0 (denied) / - (not set).
export function parseGcs(gcs) {
  if (typeof gcs !== 'string' || !/^G1[01-][01-]$/.test(gcs)) return null;
  const m = c => (c === '1' ? 'granted' : c === '0' ? 'denied' : 'unset');
  return { ad_storage: m(gcs[2]), analytics_storage: m(gcs[3]) };
}

// gcd letters encode default + update state per signal (Consent Mode v2).
// d = state from `consent default`, u = state from `consent update`.
const GCD_LETTERS = {
  l: { d: null, u: null },
  p: { d: 'denied', u: null },
  q: { d: 'denied', u: 'denied' },
  t: { d: 'granted', u: null },
  r: { d: 'denied', u: 'granted' },
  m: { d: null, u: 'denied' },
  n: { d: null, u: 'granted' },
  u: { d: 'granted', u: 'denied' },
  v: { d: 'granted', u: 'granted' },
};
const GCD_SIGNALS = ['ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization'];

// e.g. "13r3r3r2r5l1": letters at index 2, 4, 6, 8.
export function parseGcd(gcd) {
  if (typeof gcd !== 'string' || gcd.length < 9) return null;
  const out = {};
  GCD_SIGNALS.forEach((signal, i) => {
    const letter = gcd[2 + i * 2];
    const entry = GCD_LETTERS[letter];
    out[signal] = entry
      ? { letter, default: entry.d, update: entry.u, effective: entry.u ?? entry.d ?? 'unset' }
      : { letter, default: null, update: null, effective: 'unknown' };
  });
  return out;
}

export function parseGoogleConsent(params) {
  const gcs = parseGcs(params.gcs);
  const gcd = parseGcd(params.gcd);
  if (!gcs && !gcd) return null;
  return { gcs: params.gcs ?? null, gcd: params.gcd ?? null, gcsParsed: gcs, gcdParsed: gcd };
}

function safeUrl(url) {
  try { return new URL(url); } catch { return null; }
}

function bodyLines(body) {
  return typeof body === 'string' && body.length ? body.split(/\r?\n/).filter(Boolean) : [];
}

function tryJson(body) {
  if (typeof body !== 'string' || !body.trim().startsWith('{')) return null;
  try { return JSON.parse(body); } catch { return null; }
}

function scriptHit(platform, id, url, extra = {}) {
  return { platform, kind: 'script', id: id || null, event: null, params: {}, consent: null, url, ...extra };
}

function googleIdPlatform(id) {
  const prefix = String(id).split('-')[0].toUpperCase();
  return { G: 'ga4', GTM: 'gtm', AW: 'gads', GT: 'google_tag', DC: 'floodlight' }[prefix] || 'google_tag';
}

/**
 * @param {{url: string, method?: string, body?: string}} req
 * @returns {Array<object>} zero or more hits
 */
export function classifyRequest({ url, method = 'GET', body = '' }) {
  const u = safeUrl(url);
  if (!u) return [];
  const host = u.hostname;
  const path = u.pathname;
  const qs = Object.fromEntries(u.searchParams);

  // GA4 collect (Google endpoints or server-side GTM on a first-party domain).
  if (/\/g\/collect$/.test(path) && /^G-/i.test(qs.tid || '')) {
    const lines = bodyLines(body);
    const payloads = lines.length ? lines : [''];
    return payloads.map(line => {
      const params = { ...qs, ...Object.fromEntries(new URLSearchParams(line)) };
      return {
        platform: 'ga4', kind: 'hit', id: params.tid, event: params.en || null, params,
        consent: parseGoogleConsent(params), url, serverSide: !/google-analytics\.com$|analytics\.google\.com$/.test(host),
      };
    });
  }

  // GTM container / gtag.js library loads (Google CDN or first-party sGTM).
  if (/\/gtm\.js$/.test(path) && /^GTM-/i.test(qs.id || '')) return [scriptHit('gtm', qs.id, url)];
  if (/\/gtag\/js$/.test(path) && GOOGLE_ID.test(qs.id || '')) {
    return [scriptHit(googleIdPlatform(qs.id), qs.id, url, { loader: 'gtag.js' })];
  }

  // Google Ads conversion / remarketing pings carry gcs/gcd too.
  const ads = path.match(/\/pagead\/(?:viewthrough)?conversion\/(\d+)/);
  if (ads && /googleadservices\.com$|doubleclick\.net$|google\.com$/.test(host)) {
    return [{ platform: 'gads', kind: 'hit', id: `AW-${ads[1]}`, event: qs.label ? 'conversion' : 'remarketing', params: qs, consent: parseGoogleConsent(qs), url }];
  }

  // Meta Pixel.
  if (host === 'connect.facebook.net') {
    if (/\/fbevents\.js$/.test(path)) return [scriptHit('meta', null, url)];
    const cfg = path.match(/\/signals\/config\/(\d+)/);
    if (cfg) return [scriptHit('meta', cfg[1], url, { loader: 'config' })];
    return [];
  }
  if (/(^|\.)facebook\.com$/.test(host) && /^\/tr\/?$/.test(path)) {
    const bodyParams = body && body.includes('=') && !body.trim().startsWith('{') ? Object.fromEntries(new URLSearchParams(body)) : {};
    const params = { ...qs, ...bodyParams };
    if (!params.id) return [];
    return [{ platform: 'meta', kind: 'hit', id: params.id, event: params.ev || null, params, consent: null, url }];
  }

  // TikTok Pixel.
  if (host === 'analytics.tiktok.com') {
    if (/\/pixel\/events\.js$/.test(path)) return [scriptHit('tiktok', qs.sdkid || null, url)];
    if (/^\/api\/v2\/pixel/.test(path)) {
      const json = tryJson(body);
      const events = json ? (Array.isArray(json.batch) ? json.batch : [json]) : [];
      return events
        .map(ev => {
          const id = ev?.context?.pixel?.code || ev?.pixel_code || qs.sdkid || null;
          return { platform: 'tiktok', kind: 'hit', id, event: ev?.event || null, params: flattenForScan(ev), consent: null, url };
        })
        .filter(h => h.id || h.event);
    }
  }

  return [];
}

// Flattens nested JSON into "a.b.c": value pairs so PII scans can treat every platform alike.
export function flattenForScan(obj, prefix = '', out = {}, depth = 0) {
  if (obj === null || typeof obj !== 'object' || depth > 5) return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') flattenForScan(v, key, out, depth + 1);
    else out[key] = v;
  }
  return out;
}

export const PLATFORM_LABELS = {
  ga4: 'Google Analytics 4',
  gtm: 'Google Tag Manager',
  gads: 'Google Ads',
  google_tag: 'Google tag',
  floodlight: 'Floodlight',
  meta: 'Meta Pixel',
  tiktok: 'TikTok Pixel',
};
