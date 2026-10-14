// Event-level validation: ecommerce completeness, naming limits, dedup IDs, dataLayer hygiene, cookies vs consent.
// Each validator returns findings in the same shape as checks.js.
import { ecommerceOf } from './params.js';
import { PLATFORM_LABELS } from './detectors.js';

const ISO_CURRENCY = /^[A-Z]{3}$/;
const SHA256_RE = /^[a-f0-9]{64}$/i;

const GA4_ITEM_EVENTS = new Set(['view_item', 'view_item_list', 'select_item', 'add_to_cart', 'remove_from_cart', 'view_cart',
  'begin_checkout', 'add_shipping_info', 'add_payment_info', 'purchase', 'refund', 'add_to_wishlist', 'view_promotion', 'select_promotion']);
const GA4_VALUE_EVENTS = new Set(['add_to_cart', 'remove_from_cart', 'view_cart', 'begin_checkout', 'add_shipping_info', 'add_payment_info', 'purchase', 'refund', 'add_to_wishlist', 'view_item']);
// Google reserves these names; events sent with them are dropped or misattributed.
const GA4_RESERVED = new Set(['ad_activeview', 'ad_click', 'ad_exposure', 'ad_impression', 'ad_query', 'ad_reward', 'adunit_exposure',
  'app_clear_data', 'app_exception', 'app_install', 'app_remove', 'app_store_refund', 'app_update', 'app_upgrade', 'error',
  'firebase_campaign', 'first_open', 'first_visit', 'in_app_purchase', 'notification_dismiss', 'notification_foreground',
  'notification_open', 'notification_receive', 'os_update', 'screen_view', 'session_start', 'user_engagement']);

const META_STANDARD = ['AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration', 'Contact', 'CustomizeProduct', 'Donate',
  'FindLocation', 'InitiateCheckout', 'Lead', 'PageView', 'Purchase', 'Schedule', 'Search', 'StartTrial', 'SubmitApplication', 'Subscribe', 'ViewContent'];
const META_CATALOG_EVENTS = new Set(['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase']);
const TIKTOK_VALUE_EVENTS = new Set(['CompletePayment', 'PlaceAnOrder', 'Purchase', 'AddToCart', 'InitiateCheckout', 'AddPaymentInfo']);
const TIKTOK_PURCHASE_EVENTS = new Set(['CompletePayment', 'PlaceAnOrder', 'Purchase']);

function f(id, severity, title, detail, fix, extra = {}) {
  return { id, severity, title, detail, fix, ...extra };
}

// Collapses repeated findings (same id) into one, listing the events affected.
function collapse(list) {
  const map = new Map();
  for (const x of list) {
    if (!map.has(x.id)) map.set(x.id, { ...x, events: new Set() });
    if (x.event) map.get(x.id).events.add(x.event);
  }
  return [...map.values()].map(({ events, event, ...x }) => ({
    ...x,
    detail: events.size ? `${x.detail} Events: ${[...events].join(', ')}.` : x.detail,
  }));
}

export function validateGa4(hits) {
  const out = [];
  const purchases = new Map();
  for (const h of hits.filter(x => x.platform === 'ga4' && x.event)) {
    const ev = h.event;
    const e = ecommerceOf(h);
    if (ev.length > 40) out.push(f('ga4-event-name-length', 'warning', 'GA4 event name longer than 40 characters', 'GA4 drops events with names over 40 characters.', 'Shorten the event name in the tag or dataLayer push.', { event: ev }));
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(ev)) out.push(f('ga4-event-name-chars', 'warning', 'GA4 event name has invalid characters', 'Event names must start with a letter and use only letters, numbers and underscores.', 'Rename the event (e.g. "form_submit" instead of "Form Submit").', { event: ev }));
    if (GA4_RESERVED.has(ev)) out.push(f('ga4-reserved-event', 'warning', 'GA4 reserved event name used', 'This name is reserved by Google and the event will be ignored or misreported.', 'Rename the custom event.', { event: ev }));
    const custom = Object.keys(h.params).filter(k => /^epn?\./.test(k));
    if (custom.length > 25) out.push(f('ga4-param-count', 'warning', 'More than 25 event parameters', 'GA4 keeps only the first 25 parameters per event; the rest are silently dropped.', 'Move secondary data into items or user properties, or drop unused parameters.', { event: ev }));
    if (custom.some(k => k.replace(/^epn?\./, '').length > 40)) out.push(f('ga4-param-name-length', 'warning', 'Event parameter name over 40 characters', 'GA4 drops parameters whose names exceed 40 characters.', 'Shorten the parameter names.', { event: ev }));
    if (custom.some(k => k.startsWith('ep.') && String(h.params[k]).length > 100)) out.push(f('ga4-param-value-length', 'info', 'Event parameter value over 100 characters', 'GA4 truncates parameter values to 100 characters in reports.', 'Shorten values or send IDs instead of full strings.', { event: ev }));

    if (GA4_ITEM_EVENTS.has(ev)) {
      if (!e.hasItems) out.push(f('ga4-ecom-no-items', ev === 'purchase' ? 'critical' : 'warning', 'GA4 ecommerce event without items', 'Item-level reports (product revenue, item views) will be empty for these events.', 'Push an items array with item_id or item_name for each product.', { event: ev }));
      else if (e.items.some(i => !i.item_id && !i.item_name)) out.push(f('ga4-item-id', 'warning', 'GA4 items missing item_id and item_name', 'Each item needs at least item_id or item_name, otherwise GA4 drops it.', 'Map product SKU to item_id and product name to item_name.', { event: ev }));
      if (e.items.some(i => i.price !== undefined && !Number.isFinite(Number(i.price)))) out.push(f('ga4-item-price', 'warning', 'GA4 item price is not a number', 'Prices like "$19.99" or "19,99" are not parsed as revenue.', 'Send price as a plain number (19.99).', { event: ev }));
    }
    if (GA4_VALUE_EVENTS.has(ev) && e.value !== undefined) {
      if (Number.isNaN(e.value)) out.push(f('ga4-value-nan', 'critical', 'GA4 value is not a number', 'Revenue will not be recorded.', 'Send value as a number without currency symbols or thousands separators.', { event: ev }));
      if (!e.currency) out.push(f('ga4-currency-missing', ev === 'purchase' ? 'critical' : 'warning', 'GA4 value sent without currency', 'Without a currency GA4 does not record revenue for the event.', 'Add currency (ISO 4217, e.g. "USD") next to value.', { event: ev }));
    }
    if (e.currency && !ISO_CURRENCY.test(e.currency)) out.push(f('ga4-currency-format', 'warning', 'GA4 currency is not an ISO 4217 code', `Got "${e.currency}".`, 'Use a 3-letter uppercase code such as USD, EUR, GBP.', { event: ev }));
    if (ev === 'purchase') {
      if (!e.transactionId) out.push(f('ga4-no-transaction-id', 'critical', 'GA4 purchase without transaction_id', 'GA4 cannot deduplicate purchases, so page reloads on the thank-you page double-count revenue.', 'Send the order number as transaction_id.', { event: ev }));
      if (e.value === undefined) out.push(f('ga4-purchase-no-value', 'critical', 'GA4 purchase without value', 'Revenue for this purchase is recorded as 0.', 'Send the order total as value with currency.', { event: ev }));
      if (e.transactionId) purchases.set(`${h.id}|${e.transactionId}`, (purchases.get(`${h.id}|${e.transactionId}`) || 0) + 1);
    }
  }
  for (const [key, n] of purchases) {
    if (n > 1) out.push(f('ga4-duplicate-purchase', 'critical', 'Same GA4 purchase sent more than once', `transaction_id ${key.split('|')[1]} was sent ${n}× to ${key.split('|')[0]}.`, 'Fire the purchase tag once per order (e.g. guard with a "purchase sent" cookie, or use a once-per-page trigger).'));
  }
  return collapse(out);
}

export function validateMeta(hits) {
  const out = [];
  const lower = new Map(META_STANDARD.map(e => [e.toLowerCase(), e]));
  const counts = new Map();
  for (const h of hits.filter(x => x.platform === 'meta' && x.event && x.event !== 'PageView')) {
    const k = `${h.id}|${h.event}|${h.params.eid || ''}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  for (const [k, n] of counts) {
    const [id, ev] = k.split('|');
    if (n > 1) out.push(f('meta-multiple-activation', 'warning', 'Meta Pixel event activated multiple times', `${ev} fired ${n}× for pixel ${id} on one page load. Meta counts each one, inflating conversions.`, 'Make sure the event fires from one trigger only (theme code, plugin or GTM, not several).', { event: ev }));
  }
  for (const h of hits.filter(x => x.platform === 'meta' && x.event)) {
    const ev = h.event;
    const e = ecommerceOf(h);
    const std = lower.get(ev.toLowerCase());
    if (std && std !== ev) out.push(f('meta-event-case', 'warning', 'Meta standard event has the wrong case', `"${ev}" is treated as a custom event; the standard name is "${std}".`, `Use fbq("track", "${std}") exactly.`, { event: ev }));
    if (ev === 'Purchase') {
      if (e.value === undefined || !e.currency) out.push(f('meta-purchase-value', 'critical', 'Meta Purchase missing value or currency', 'Meta requires value and currency on Purchase. Without them ROAS reporting and value optimisation break.', 'fbq("track", "Purchase", { value: 49.99, currency: "USD" }).', { event: ev }));
    }
    if (Object.values(h.params).some(v => /%25[0-9A-F]{2}/i.test(String(v)))) out.push(f('meta-encoded-chars', 'info', 'Meta parameters are double-encoded', 'Values contain sequences like "%2520", so they arrive in Meta mangled.', 'Pass raw values to fbq(); do not URL-encode them yourself.', { event: ev }));
    if (e.value !== undefined && Number.isNaN(e.value)) out.push(f('meta-value-nan', 'warning', 'Meta value is not a number', 'Values like "$49.99" are not parsed.', 'Send value as a plain number.', { event: ev }));
    if (e.currency && !ISO_CURRENCY.test(e.currency)) out.push(f('meta-currency-format', 'warning', 'Meta currency is not an ISO 4217 code', `Got "${e.currency}".`, 'Use a 3-letter uppercase code such as USD.', { event: ev }));
    if (META_CATALOG_EVENTS.has(ev) && !e.contentIds.length) out.push(f('meta-content-ids', 'warning', 'Meta catalog event without content_ids', 'Dynamic product ads and Advantage+ catalog campaigns cannot match these events to products.', 'Send content_ids (matching catalog IDs) and content_type: "product".', { event: ev }));
    if (['Purchase', 'Lead', 'CompleteRegistration', 'AddToCart', 'InitiateCheckout', 'Subscribe', 'StartTrial'].includes(ev) && !e.eventId) out.push(f('meta-no-event-id', 'info', 'Meta conversion without event_id', 'If Conversions API also sends this event, Meta cannot deduplicate it and will double-count.', 'Pass the same eventID to the pixel and to CAPI.', { event: ev }));
  }
  return collapse(out);
}

export function validateTiktok(hits) {
  const out = [];
  for (const h of hits.filter(x => x.platform === 'tiktok' && x.event)) {
    const ev = h.event;
    const e = ecommerceOf(h);
    if (TIKTOK_PURCHASE_EVENTS.has(ev) && (e.value === undefined || !e.currency)) out.push(f('tiktok-purchase-value', 'critical', 'TikTok purchase event missing value or currency', 'Value-based optimisation and ROAS reporting need both.', 'ttq.track("CompletePayment", { value, currency, contents }).', { event: ev }));
    else if (TIKTOK_VALUE_EVENTS.has(ev) && e.value !== undefined && !e.currency) out.push(f('tiktok-currency', 'warning', 'TikTok value sent without currency', 'TikTok ignores value without a currency.', 'Add currency (ISO 4217).', { event: ev }));
    if (TIKTOK_VALUE_EVENTS.has(ev) && !e.contentIds.length) out.push(f('tiktok-content-id', 'warning', 'TikTok event without content_id', 'Video Shopping Ads and catalog matching need content_id on product events.', 'Send contents: [{ content_id, quantity, price }].', { event: ev }));
    const ct = h.params['properties.content_type'];
    if (ct && !['product', 'product_group'].includes(ct)) out.push(f('tiktok-content-type', 'warning', 'TikTok content_type is invalid', `Got "${ct}"; TikTok accepts "product" or "product_group".`, 'Set content_type to "product" (or "product_group" for variants).', { event: ev }));
    const email = h.params['context.user.email'];
    if (email && !SHA256_RE.test(email) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) out.push(f('tiktok-email-format', 'warning', 'TikTok advanced-matching email is malformed', 'The email field is neither a valid email nor a SHA-256 hash, so it cannot match users.', 'Send a trimmed, lowercase email or its SHA-256 hash.', { event: ev }));
    const phone = h.params['context.user.phone_number'];
    if (phone && !SHA256_RE.test(phone) && !/^\+[1-9]\d{6,14}$/.test(phone)) out.push(f('tiktok-phone-format', 'warning', 'TikTok phone number is not in E.164 format', 'Phone numbers must look like +14155550123 (or be SHA-256 hashed).', 'Normalise to E.164 before sending.', { event: ev }));
    if (e.currency && !ISO_CURRENCY.test(e.currency)) out.push(f('tiktok-currency-format', 'warning', 'TikTok currency is not an ISO 4217 code', `Got "${e.currency}".`, 'Use a 3-letter uppercase code.', { event: ev }));
    if (TIKTOK_PURCHASE_EVENTS.has(ev) && !e.eventId) out.push(f('tiktok-no-event-id', 'info', 'TikTok purchase without event_id', 'If the Events API also sends this purchase, TikTok cannot deduplicate it.', 'Pass the same event_id to the pixel and Events API.', { event: ev }));
  }
  return collapse(out);
}

// dataLayer hygiene from the live push log (content script) or the probe snapshot.
export function validateDataLayer(dlLog, probe) {
  const out = [];
  const events = dlLog || [];
  if (events.some(e => e.type === 'reassigned' && e.afterGtm)) {
    out.push(f('datalayer-reassigned', 'critical', 'dataLayer was overwritten after GTM loaded',
      'A script ran `dataLayer = [...]` after GTM started, so GTM no longer sees new pushes. Events after that point never reach tags.',
      'Always use `window.dataLayer = window.dataLayer || []; dataLayer.push({...})`, never assign a new array.'));
  }
  const pushes = events.filter(e => e.type === 'push').map(e => e.entry);
  const ecommercePushes = pushes.map((p, i) => ({ p, i })).filter(({ p }) => p && typeof p === 'object' && !p.__gtag && p.ecommerce && typeof p.ecommerce === 'object');
  if (ecommercePushes.length > 1) {
    const uncleared = ecommercePushes.slice(1).some(({ i }) => !pushes.slice(0, i).reverse().find(p => p && 'ecommerce' in p && p.ecommerce === null));
    if (uncleared) out.push(f('datalayer-ecommerce-not-cleared', 'warning', 'ecommerce object not cleared between pushes',
      'GTM merges dataLayer objects, so items from an earlier push (e.g. view_item) leak into later events (e.g. add_to_cart).',
      'Push { ecommerce: null } before every ecommerce push.'));
  }
  if (!events.length && probe?.dataLayer === null && probe?.googleTagIds?.some(id => id.startsWith('GTM-'))) {
    out.push(f('datalayer-renamed', 'info', 'GTM uses a renamed dataLayer', 'GTM is present but window.dataLayer does not exist, so the container uses a custom dataLayer name.', 'No action needed if intentional; make sure developers push to the same name.'));
  }
  return out;
}

const AD_COOKIES = { _fbp: 'Meta', _fbc: 'Meta', _gcl_au: 'Google Ads', _gcl_aw: 'Google Ads', _ttp: 'TikTok', _uetsid: 'Microsoft Ads', _uetvid: 'Microsoft Ads', _pin_unauth: 'Pinterest', _scid: 'Snapchat', _rdt_uuid: 'Reddit', _twclid: 'X' };
const ANALYTICS_COOKIES = { _ga: 'Google Analytics', _clck: 'Microsoft Clarity', _hjSessionUser: 'Hotjar' };

export function validateCookies(probe, signals) {
  const names = probe?.cookieNames || [];
  if (!names.length || !signals) return [];
  const has = map => Object.entries(map).filter(([c]) => names.some(n => n === c || n.startsWith(`${c}_`))).map(([c, vendor]) => `${c} (${vendor})`);
  const out = [];
  const ad = signals.ad_storage?.effective === 'denied' ? has(AD_COOKIES) : [];
  const an = signals.analytics_storage?.effective === 'denied' ? has(ANALYTICS_COOKIES) : [];
  if (ad.length || an.length) {
    out.push(f('cookies-without-consent', 'critical', 'Tracking cookies present while consent is denied',
      `Found: ${[...ad, ...an].join(', ')}. Consent signals say denied, but these cookies exist.`,
      'Block these tags until consent. Re-run with "Fresh visitor" enabled to rule out cookies left over from an earlier visit.'));
  }
  return out;
}

export function validateRecorders(hits, signals) {
  const recorders = [...new Set(hits.filter(h => ['clarity', 'hotjar'].includes(h.platform)).map(h => PLATFORM_LABELS[h.platform]))];
  if (recorders.length && signals?.analytics_storage?.effective === 'denied') {
    return [f('recorder-without-consent', 'warning', `${recorders.join(' and ')} load while analytics consent is denied`,
      'Session recording tools capture behaviour and usually need analytics consent under GDPR.',
      'Load them only after analytics consent (GTM consent checks or CMP script blocking). Clarity also supports its own consent API.')];
  }
  return [];
}

// Purchases sent to several platforms on the same page should agree on value and currency.
export function validateCrossPlatform(hits) {
  const purchaseEvents = { ga4: ['purchase'], meta: ['Purchase'], tiktok: ['CompletePayment', 'PlaceAnOrder', 'Purchase'] };
  const seen = [];
  for (const [platform, events] of Object.entries(purchaseEvents)) {
    const h = hits.find(x => x.platform === platform && events.includes(x.event));
    if (!h) continue;
    const e = ecommerceOf(h);
    if (e.value !== undefined && !Number.isNaN(e.value)) seen.push({ platform, value: e.value, currency: e.currency || '' });
  }
  if (seen.length < 2) return [];
  const values = new Set(seen.map(s => s.value.toFixed(2)));
  const currencies = new Set(seen.map(s => s.currency.toUpperCase()));
  if (values.size > 1 || currencies.size > 1) {
    return [f('cross-platform-mismatch', 'warning', 'Purchase value differs between platforms',
      seen.map(s => `${PLATFORM_LABELS[s.platform]}: ${s.value} ${s.currency || '(no currency)'}`).join(' · ') + '. Each platform will report different revenue for the same order.',
      'Read value and currency from one dataLayer variable for every purchase tag. Decide once whether value includes tax and shipping.')];
  }
  return [f('cross-platform-consistent', 'pass', 'Purchase value matches across platforms', '', '')];
}
