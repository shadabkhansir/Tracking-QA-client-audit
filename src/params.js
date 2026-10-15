// Human-readable parameter names + per-platform ecommerce normalisation.
// Pure module: used by the side-panel inspector and the validators.

const GA4_LABELS = {
  v: 'Protocol version', tid: 'Measurement ID', gtm: 'GTM container hash', _p: 'Page load ID', cid: 'Client ID',
  sid: 'Session ID', sct: 'Session count', seg: 'Session engaged', en: 'Event name', dl: 'Page URL', dr: 'Referrer',
  dt: 'Page title', ul: 'Language', sr: 'Screen resolution', uid: 'User ID', _et: 'Engagement time (ms)',
  _s: 'Hit sequence', _ss: 'Session start', _fv: 'First visit', _nsi: 'New session', cu: 'Currency',
  gcs: 'Consent state (gcs)', gcd: 'Consent signals (gcd)', dma: 'DMA flag', dma_cps: 'DMA consent', npa: 'Non-personalised ads',
  frm: 'In iframe', pscdl: 'Privacy sandbox', _dbg: 'Debug mode', ep_debug_mode: 'Debug mode', tfd: 'Time from load (ms)',
};
const META_LABELS = {
  id: 'Pixel ID', ev: 'Event', dl: 'Page URL', rl: 'Referrer', if: 'In iframe', ts: 'Timestamp', sw: 'Screen width',
  sh: 'Screen height', v: 'Pixel version', r: 'Release', a: 'Integration', ec: 'Event count', o: 'Options',
  fbp: 'Browser ID (_fbp)', fbc: 'Click ID (_fbc)', eid: 'Event ID (dedup)', it: 'Init time', coo: 'Cookies disabled',
  es: 'Event source', tm: 'Traffic mode', rqm: 'Request method',
};
const TIKTOK_LABELS = {
  event: 'Event', event_id: 'Event ID (dedup)', 'context.pixel.code': 'Pixel ID', 'context.page.url': 'Page URL',
  'context.page.referrer': 'Referrer', 'properties.value': 'Value', 'properties.currency': 'Currency',
  'properties.content_id': 'Content ID', 'properties.content_type': 'Content type',
};

export function labelFor(platform, key) {
  if (platform === 'ga4') {
    if (GA4_LABELS[key]) return GA4_LABELS[key];
    if (key.startsWith('ep.')) return `Event param: ${key.slice(3)}`;
    if (key.startsWith('epn.')) return `Event param (number): ${key.slice(4)}`;
    if (key.startsWith('up.')) return `User property: ${key.slice(3)}`;
    if (key.startsWith('upn.')) return `User property (number): ${key.slice(4)}`;
    if (/^pr\d+$/.test(key)) return `Item ${key.slice(2)}`;
  }
  if (platform === 'meta') {
    if (META_LABELS[key]) return META_LABELS[key];
    const cd = key.match(/^cd\[(.+)\]$/);
    if (cd) return `Custom data: ${cd[1]}`;
    const ud = key.match(/^ud\[(.+)\]$/);
    if (ud) return `Advanced matching: ${ud[1]}`;
  }
  if (platform === 'tiktok' && TIKTOK_LABELS[key]) return TIKTOK_LABELS[key];
  return key;
}

// Params as display rows, most important first.
export function describeParams(hit) {
  const priority = ['tid', 'en', 'id', 'ev', 'event', 'pid', 'cu', 'dl'];
  return Object.entries(hit.params || {})
    .map(([key, value]) => ({ key, label: labelFor(hit.platform, key), value: String(value ?? '') }))
    .sort((a, b) => {
      const pa = priority.indexOf(a.key), pb = priority.indexOf(b.key);
      return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb) || a.key.localeCompare(b.key);
    });
}

const GA4_ITEM_KEYS = {
  id: 'item_id', nm: 'item_name', br: 'item_brand', ca: 'item_category', c2: 'item_category2', c3: 'item_category3',
  c4: 'item_category4', c5: 'item_category5', va: 'item_variant', pr: 'price', qt: 'quantity', cp: 'coupon',
  af: 'affiliation', ds: 'discount', lp: 'index', ln: 'item_list_name', li: 'item_list_id', lo: 'location_id',
};

// GA4 encodes items as pr1=id123~nmShirt~pr9.99~qt1
export function parseGa4Item(raw) {
  const item = {};
  for (const part of String(raw).split('~')) {
    const key = part.slice(0, 2);
    const value = part.slice(2);
    item[GA4_ITEM_KEYS[key] || key] = value;
  }
  return item;
}

function num(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function tryJson(s) {
  try { return JSON.parse(s); } catch { return undefined; }
}

// Normalises a hit into { value, currency, transactionId, items[], eventId, contentIds[] } where the platform supports it.
export function ecommerceOf(hit) {
  const p = hit.params || {};
  if (hit.platform === 'ga4') {
    const items = Object.keys(p).filter(k => /^pr\d+$/.test(k)).sort((a, b) => a.slice(2) - b.slice(2)).map(k => parseGa4Item(p[k]));
    return {
      value: num(p['epn.value'] ?? p['ep.value']),
      currency: p.cu ?? p['ep.currency'],
      transactionId: p['ep.transaction_id'],
      items,
      hasItems: items.length > 0,
    };
  }
  if (hit.platform === 'meta') {
    const ids = p['cd[content_ids]'];
    const parsedIds = ids ? tryJson(ids) : undefined;
    const contents = p['cd[contents]'] ? tryJson(p['cd[contents]']) : undefined;
    return {
      value: num(p['cd[value]']),
      currency: p['cd[currency]'],
      eventId: p.eid,
      contentIds: Array.isArray(parsedIds) ? parsedIds : ids ? [ids] : Array.isArray(contents) ? contents.map(c => c?.id).filter(Boolean) : [],
      contentType: p['cd[content_type]'],
    };
  }
  if (hit.platform === 'tiktok') {
    const contentKeys = Object.keys(p).filter(k => /^properties\.contents\.\d+\.content_id$/.test(k));
    return {
      value: num(p['properties.value']),
      currency: p['properties.currency'],
      eventId: p.event_id,
      contentIds: contentKeys.length ? contentKeys.map(k => p[k]) : p['properties.content_id'] ? [p['properties.content_id']] : [],
    };
  }
  return {};
}
