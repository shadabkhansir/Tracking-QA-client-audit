// Classifies outgoing network requests into tracking "hits" and "script" loads.
// Pure functions: no chrome.* APIs, so they run under `node --test`.

const GOOGLE_ID = /^(G|GTM|AW|GT|DC)-[A-Z0-9]+$/i;
// Vendor-owned hosts. The same payloads on any other host mean a first-party proxy (server-side GTM, Google Tag Gateway, pixel proxies).
const GOOGLE_HOSTS = /(^|\.)(google-analytics\.com|analytics\.google\.com|googletagmanager\.com|google\.com|googleadservices\.com|doubleclick\.net)$/;
const isFirstParty = (host, vendorRe) => !vendorRe.test(host);

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
        consent: parseGoogleConsent(params), url, serverSide: isFirstParty(host, GOOGLE_HOSTS), firstParty: isFirstParty(host, GOOGLE_HOSTS), userData: parseUserData(params.em),
      };
    });
  }

  // GTM container / gtag.js library loads (Google CDN or first-party sGTM).
  if (/\/gtm\.js$/.test(path) && /^GTM-/i.test(qs.id || '')) return [scriptHit('gtm', qs.id, url, { firstParty: isFirstParty(host, GOOGLE_HOSTS) })];
  if (/\/gtag\/js$/.test(path) && GOOGLE_ID.test(qs.id || '')) {
    return [scriptHit(googleIdPlatform(qs.id), qs.id, url, { loader: 'gtag.js', firstParty: isFirstParty(host, GOOGLE_HOSTS) })];
  }

  // Google Ads conversion / remarketing pings carry gcs/gcd too.
  const ads = path.match(/\/pagead\/(?:viewthrough)?conversion\/(\d+)/);
  if (ads && /(^|\.)(googleadservices\.com|doubleclick\.net|google\.com)$/.test(host)) {
    const params = { ...qs, ...formOrJson(body) };
    return [{ platform: 'gads', kind: 'hit', id: `AW-${ads[1]}`, event: params.label ? 'conversion' : 'remarketing', params, consent: parseGoogleConsent(params), url, userData: parseUserData(params.em) }];
  }

  // Google Ads conversion modelling / consent pings (www.google.com/ccm/collect).
  if (/\/ccm\/collect$/.test(path) && /(^|\.)google\.[a-z.]+$/.test(host)) {
    const params = { ...qs, ...formOrJson(body) };
    return [{ platform: 'gads', kind: 'hit', id: params.tid || null, event: params.en || 'ccm', params, consent: parseGoogleConsent(params), url }];
  }

  // Meta Pixel.
  if (host === 'connect.facebook.net') {
    if (/\/fbevents\.js$/.test(path)) return [scriptHit('meta', null, url)];
    const cfg = path.match(/\/signals\/config\/(\d+)/);
    if (cfg) return [scriptHit('meta', cfg[1], url, { loader: 'config' })];
    return [];
  }
  const metaHost = /(^|\.)facebook\.com$/.test(host);
  if (!metaHost && /\/fbevents\.js$/.test(path)) return [scriptHit('meta', null, url, { firstParty: true })];
  if (/^\/tr\/?$/.test(path) || (!metaHost && /\/tr\/?$/.test(path))) {
    const bodyParams = body && body.includes('=') && !body.trim().startsWith('{') ? Object.fromEntries(new URLSearchParams(body)) : {};
    const params = { ...qs, ...bodyParams };
    // First-party /tr endpoints only count when they carry a Meta-shaped payload (numeric pixel id + event).
    if (!params.id || (!metaHost && !(/^\d{6,}$/.test(params.id) && params.ev))) return [];
    return [{ platform: 'meta', kind: 'hit', id: params.id, event: params.ev || null, params, consent: null, url, firstParty: !metaHost }];
  }

  // TikTok Pixel.
  const tiktokHost = host === 'analytics.tiktok.com';
  if (/\/pixel\/events\.js$/.test(path) && (tiktokHost || qs.sdkid)) return [scriptHit('tiktok', qs.sdkid || null, url, { firstParty: !tiktokHost })];
  if (/\/api\/v2\/pixel/.test(path)) {
    const json = tryJson(body);
    const events = json ? (Array.isArray(json.batch) ? json.batch : [json]) : [];
    const out = events
      .map(ev => {
        const id = ev?.context?.pixel?.code || ev?.pixel_code || qs.sdkid || null;
        return { platform: 'tiktok', kind: 'hit', id, event: typeof ev?.event === 'string' ? ev.event : null, params: flattenForScan(ev), consent: null, url, firstParty: !tiktokHost };
      })
      // On first-party hosts require a TikTok-shaped payload.
      .filter(h => (tiktokHost ? (h.id || h.event) : h.id));
    if (out.length || tiktokHost) return out;
  }

  const openai = classifyOpenAI(host, path, qs, body, url);
  if (openai) return openai;

  return classifyOtherPixels(u, qs, body, url);
}

// OpenAI / ChatGPT Ads (docs/research/PLATFORM-SPECS.md §1, checked 2026-10-16):
// - SDK oaiq.min.js on bzrcdn.openai.com;
// - browser events on bzr.openai.com/v1/sdk/events: JSON body via sendBeacon/fetch
//   ({ obref, oppref, user, events: [{ type, id, timestamp_ms, source_url, custom_event_name, data }] }),
//   or the no-JS image tag (GET with pid, event, event_id, oppref, data[...]);
// - bzr.openai.com/v1/events is the server Conversions API and must never be called from page code.
export const OPENAI_INTERNAL_EVENTS = new Set(['oai::diagnostic', 'openai::sdk_init']);
function classifyOpenAI(host, path, qs, body, url) {
  if (host === 'bzrcdn.openai.com') return /\/sdk\/oaiq(\.min)?\.js$/.test(path) ? [scriptHit('openai', null, url)] : [];
  if (host !== 'bzr.openai.com') return null;
  if (/^\/v1\/events\/?$/.test(path)) {
    return [{ platform: 'openai', kind: 'hit', id: qs.pid || null, event: 'conversions_api', params: { ...qs }, consent: null, url, capiInBrowser: true }];
  }
  if (!/^\/v1\/sdk\/events\/?$/.test(path)) return [];
  const json = typeof body === 'string' && body.length < 65536 ? tryJson(body) : null;
  if (json && Array.isArray(json.events)) {
    const shared = {};
    if (json.oppref) shared.oppref = String(json.oppref);
    if (json.obref) shared.obref = String(json.obref);
    if (json.user && typeof json.user === 'object') Object.assign(shared, flattenForScan(json.user, 'user'));
    return json.events.filter(ev => ev && typeof ev === 'object').map(ev => {
      const type = typeof ev.type === 'string' ? ev.type : null;
      const params = { pid: qs.pid, sv: qs.sv, ...shared, ...flattenForScan(ev) };
      return { platform: 'openai', kind: 'hit', id: qs.pid || null, event: type === 'custom' && ev.custom_event_name ? ev.custom_event_name : type, params, consent: null, url, internal: OPENAI_INTERNAL_EVENTS.has(type) };
    });
  }
  // Image tag (GET) or an unparsable body: query parameters only.
  if (!qs.pid && !qs.event) return [];
  const params = { ...qs };
  if (params.event_id) params.id = params.event_id;
  for (const [k, v] of Object.entries(qs)) {
    const m = k.match(/^data\[(\w+)\]$/);
    if (m) params[`data.${m[1]}`] = v;
  }
  params.type = qs.event;
  return [{ platform: 'openai', kind: 'hit', id: qs.pid || null, event: qs.event === 'custom' && qs.custom_event_name ? qs.custom_event_name : (qs.event || null), params, consent: null, url, imageTag: true }];
}

function formOrJson(body) {
  if (typeof body !== 'string' || !body) return {};
  const json = tryJson(body);
  if (json) return flattenForScan(json);
  return body.includes('=') ? Object.fromEntries(new URLSearchParams(body)) : {};
}

function hit(platform, id, event, params, url, consent = null) {
  return { platform, kind: 'hit', id: id ? String(id) : null, event: event || null, params, consent, url };
}

// LinkedIn, Pinterest, Snapchat, X, Microsoft UET, Reddit, plus session-recording tools.
function classifyOtherPixels(u, qs, body, url) {
  const host = u.hostname;
  const path = u.pathname;

  if (host === 'snap.licdn.com' && /insight\.min\.js$/.test(path)) return [scriptHit('linkedin', null, url)];
  if (host === 'px.ads.linkedin.com' && /^\/(collect|wa)/.test(path)) {
    const params = { ...qs, ...formOrJson(body) };
    return [hit('linkedin', params.pid, params.conversionId ? 'conversion' : 'pageview', params, url)];
  }

  if (host === 's.pinimg.com' && /\/ct\/core\.js$/.test(path)) return [scriptHit('pinterest', null, url)];
  if (host === 'ct.pinterest.com' && /^\/(v3|user)\/?/.test(path)) {
    const params = { ...qs, ...formOrJson(body) };
    if (typeof params.ed === 'string') Object.assign(params, flattenForScan(tryJson(params.ed) || {}, 'ed'));
    return [hit('pinterest', params.tid, params.event, params, url)];
  }

  if (host === 'sc-static.net' && /scevent\.min\.js$/.test(path)) return [scriptHit('snapchat', null, url)];
  if (/^tr(-shadow)?\.snapchat\.com$/.test(host) && /^\/(p|cm\/)/.test(path)) {
    const params = { ...qs, ...formOrJson(body) };
    if (!params.pid && !params.ev) return [];
    return [hit('snapchat', params.pid, params.ev, params, url)];
  }

  if (host === 'static.ads-twitter.com' && /uwt\.js$/.test(path)) return [scriptHit('x', null, url)];
  if ((host === 'analytics.twitter.com' || host === 't.co') && /\/i\/adsct/.test(path)) {
    let event = qs.event || null;
    const parsed = tryJson(qs.events || '');
    if (Array.isArray(parsed) && Array.isArray(parsed[0])) event = parsed[0][0];
    return [hit('x', qs.txn_id || qs.p_id, event || 'pageview', qs, url)];
  }

  if (host === 'bat.bing.com') {
    if (/\/bat\.js$/.test(path)) return [scriptHit('uet', null, url)];
    if (/^\/action\//.test(path)) {
      const consent = qs.asc ? { uet: qs.asc === 'G' ? 'granted' : qs.asc === 'D' ? 'denied' : 'unset' } : null;
      return [hit('uet', qs.ti, qs.evt === 'custom' ? (qs.ea || 'custom') : qs.evt, qs, url, consent)];
    }
  }

  if (host === 'www.redditstatic.com' && /\/ads\/pixel\.js$/.test(path)) return [scriptHit('reddit', null, url)];
  if (host === 'alb.reddit.com' && /^\/rp\.gif/.test(path)) return [hit('reddit', qs.id, qs.event, qs, url)];

  const clarity = host === 'www.clarity.ms' && path.match(/^\/tag\/([a-z0-9]+)/i);
  if (clarity) return [scriptHit('clarity', clarity[1], url)];
  const hotjar = host === 'static.hotjar.com' && path.match(/hotjar-(\d+)\.js/);
  if (hotjar) return [scriptHit('hotjar', hotjar[1], url)];

  return [];
}

// Google user-provided data (Enhanced Conversions): em=tv.1~em.<hash>~ph.<hash>~fn.<hash>...
// Returns which fields are present and whether any value looks like clear text instead of a hash.
// Hex SHA-256, or base64/base64url (a raw "+" may arrive as a space after query decoding).
const HASH_RE = /^([a-f0-9]{64}|[A-Za-z0-9_\-+/ ]{43}={0,2})$/;
// Google sends city, region, postal code and country unhashed by design.
const PLAIN_OK = new Set(['co', 'pc', 'ct', 'rg']);
const baseKey = k => k.replace(/\d+$/, '');
export function parseUserData(em) {
  if (typeof em !== 'string' || !em) return null;
  let raw = em;
  try { raw = decodeURIComponent(em); } catch { /* keep raw */ }
  const fields = {};
  for (const part of raw.split('~')) {
    const dot = part.indexOf('.');
    if (dot < 1) continue;
    const key = part.slice(0, dot);
    if (key === 'tv') continue;
    fields[key] = part.slice(dot + 1);
  }
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const clearText = keys.filter(k => fields[k] && !PLAIN_OK.has(baseKey(k)) && !HASH_RE.test(fields[k]));
  const has = names => keys.some(k => names.includes(baseKey(k)));
  return { fields: keys, clearText, hasEmail: has(['em']), hasPhone: has(['ph']), hasAddress: has(['fn', 'ln', 'pc', 'co', 'ct', 'sa', 'rg']) };
}

// User-defined providers from Settings: { name, match, idParam, eventParam }. `match` is a substring, or /regex/.
export function classifyCustom(url, body, providers = []) {
  if (!providers.length) return [];
  const u = safeUrl(url);
  if (!u) return [];
  for (const p of providers) {
    if (!p || !p.name || !p.match) continue;
    let hitMatch = false;
    const re = /^\/(.+)\/([a-z]*)$/.exec(p.match);
    try { hitMatch = re ? new RegExp(re[1], re[2]).test(url) : url.includes(p.match); } catch { hitMatch = false; }
    if (!hitMatch) continue;
    const params = { ...Object.fromEntries(u.searchParams), ...formOrJson(body) };
    return [{ platform: `custom:${p.name}`, kind: 'hit', id: p.idParam ? (params[p.idParam] ?? null) : null, event: p.eventParam ? (params[p.eventParam] ?? null) : null, params, consent: null, url, custom: true }];
  }
  return [];
}

export function platformLabel(platform) {
  if (PLATFORM_LABELS[platform]) return PLATFORM_LABELS[platform];
  return String(platform || '').startsWith('custom:') ? platform.slice(7) : platform;
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
  linkedin: 'LinkedIn Insight Tag',
  pinterest: 'Pinterest Tag',
  snapchat: 'Snap Pixel',
  x: 'X (Twitter) Pixel',
  uet: 'Microsoft Ads UET',
  reddit: 'Reddit Pixel',
  clarity: 'Microsoft Clarity',
  hotjar: 'Hotjar',
  openai: 'ChatGPT Ads (OpenAI)',
};

// Non-Google ad pixels: no Consent Mode, so the CMP itself has to gate them.
export const AD_PIXELS = ['meta', 'tiktok', 'linkedin', 'pinterest', 'snapchat', 'x', 'reddit', 'uet', 'openai'];
// Session recorders: should wait for analytics consent.
export const SESSION_RECORDERS = ['clarity', 'hotjar'];
