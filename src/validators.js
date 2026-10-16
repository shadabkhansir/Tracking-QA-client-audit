// Event-level validation: ecommerce completeness, naming limits, dedup IDs, dataLayer hygiene, cookies vs consent.
// Each validator returns findings in the same shape as checks.js.
import { ecommerceOf } from './params.js';
import { PLATFORM_LABELS, platformLabel } from './detectors.js';
import { classifyCookie } from './cookies.js';

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
    // gtag.js sends user_engagement itself; only names a site chose are worth flagging.
    if (GA4_RESERVED.has(ev) && ev !== 'user_engagement') out.push(f('ga4-reserved-event', 'warning', 'GA4 reserved event name used', 'This name is reserved by Google and the event will be ignored or misreported.', 'Rename the custom event.', { event: ev }));
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
    const [id, ev, eid] = k.split('|');
    // Same event_id twice is a certain duplicate; without event_id repeated events may be real clicks (e.g. two add-to-carts).
    if (n > 1) out.push(f('meta-multiple-activation', eid ? 'warning' : 'info', 'Meta Pixel event activated multiple times', `${ev} fired ${n}× for pixel ${id} on one page load${eid ? ' with the same event_id' : ''}. ${eid ? 'Meta counts each one, inflating conversions.' : 'Fine if each came from a separate user action; otherwise conversions are inflated.'}`, 'Make sure the event fires from one trigger only (theme code, plugin or GTM, not several).', { event: ev }));
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

// Uses the full first-party cookie table when available (includes HttpOnly cookies), else document.cookie names.
export function validateCookies(probe, signals, table = null) {
  const names = [...new Set([...(table || []).map(c => c.name), ...(probe?.cookieNames || [])])];
  if (!names.length || !signals) return [];
  const pick = category => names.map(n => ({ n, ...classifyCookie(n) })).filter(c => c.category === category).map(c => `${c.n} (${c.vendor})`);
  const out = [];
  const ad = signals.ad_storage?.effective === 'denied' ? pick('advertising') : [];
  const an = signals.analytics_storage?.effective === 'denied' ? pick('analytics') : [];
  if (ad.length || an.length) {
    // Warning, not critical: cookies can be left over from an earlier consented visit. Pixels firing while
    // denied (a separate critical) is the hard evidence.
    out.push(f('cookies-without-consent', 'warning', 'Tracking cookies present while consent is denied',
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
      seen.map(s => `${platformLabel(s.platform)}: ${s.value} ${s.currency || '(no currency)'}`).join(' · ') + '. Each platform will report different revenue for the same order.',
      'Read value and currency from one dataLayer variable for every purchase tag. Decide once whether value includes tax and shipping.')];
  }
  return [f('cross-platform-consistent', 'pass', 'Purchase value matches across platforms', '', '')];
}

// ---- Delivery ----------------------------------------------------------------------------
const BLOCKED_RE = /BLOCKED_BY_CLIENT|BLOCKED_BY_ADMINISTRATOR/;
// Not delivery failures: navigation away / cancelled beacons, and responses the browser discards after the vendor
// already received the request (ORB, CORP).
const IGNORE_ERRORS = /ERR_ABORTED|ERR_BLOCKED_BY_ORB|ERR_BLOCKED_BY_RESPONSE/;

// Did vendor endpoints accept the requests? "Accepted" means the endpoint answered 2xx/3xx, not that the platform processed the event.
export function validateDelivery(hits) {
  const out = [];
  const withStatus = hits.filter(h => h.delivery);
  if (!withStatus.length) return out;
  const byReq = new Map();
  for (const h of withStatus) if (!byReq.has(h.requestId)) byReq.set(h.requestId, h);
  const reqs = [...byReq.values()];
  const blocked = reqs.filter(h => BLOCKED_RE.test(h.delivery.error || ''));
  const failed = reqs.filter(h => !blocked.includes(h) && (h.delivery.status >= 400 || (h.delivery.status === 0 && h.delivery.error && !IGNORE_ERRORS.test(h.delivery.error))));
  const label = h => `${platformLabel(h.platform)}${h.id ? ` ${h.id}` : ''}`;
  const summary = list => [...list.reduce((m, h) => m.set(label(h), [...(m.get(label(h)) || []), h.delivery.status || h.delivery.error]), new Map())]
    .map(([k, v]) => `${k} (${[...new Set(v)].join(', ')})`).join('; ');

  if (blocked.length) {
    out.push(f('hits-blocked-locally', 'info', `${blocked.length} tracking request${blocked.length > 1 ? 's were' : ' was'} blocked by this browser`,
      `Blocked: ${summary(blocked)}. An ad blocker or privacy extension in your browser stopped these, so results for these vendors are incomplete. Real visitors without blockers are not affected.`,
      'Disable ad blockers for this site (or use a clean Chrome profile) and re-run the audit.'));
  }
  const failedScripts = failed.filter(h => h.kind === 'script');
  const failedHits = failed.filter(h => h.kind !== 'script');
  if (failedScripts.length) {
    out.push(f('tag-library-failed', 'critical', 'A tag library failed to load',
      `${summary(failedScripts)}. Every tag that depends on it is silently missing.`,
      'Check the container or pixel ID is correct and published (a GTM 404 usually means a wrong or unpublished container ID). For first-party/server-side paths, check the proxy is running.'));
  }
  if (failedHits.length) {
    out.push(f('hits-rejected', 'critical', 'Tracking requests rejected by the endpoint',
      `${summary(failedHits)}. These events never reached the platform.`,
      'A 4xx usually means a malformed payload or wrong ID; a 5xx or network error on a first-party endpoint usually means the server-side container or proxy is down.'));
  }
  const slow = reqs.filter(h => !failed.includes(h) && !blocked.includes(h) && h.delivery.ms > 3000);
  if (slow.length) {
    out.push(f('hits-slow', 'info', `${slow.length} tracking request${slow.length > 1 ? 's' : ''} took over 3 seconds`,
      `Slow: ${summary(slow.map(h => ({ ...h, delivery: { ...h.delivery, status: `${h.delivery.ms} ms` } })))}. Slow endpoints lose hits when visitors leave quickly.`,
      'Check server-side container latency and that tags are not waiting on slow scripts.'));
  }
  const ok = reqs.filter(h => !failed.includes(h) && !blocked.includes(h) && h.delivery.status >= 200 && h.delivery.status < 400);
  if (ok.length && !failed.length) {
    out.push(f('hits-delivered', 'pass', `All ${ok.length} tracking requests accepted by the endpoint`, '', ''));
  }
  return out;
}

// ---- Google Ads conversions + Enhanced Conversions -----------------------------------------
export function validateGoogleAds(hits) {
  const out = [];
  const conv = hits.filter(h => h.platform === 'gads' && h.event === 'conversion');
  // Clear-text user data on any Google hit (Ads conversions or GA4 user-provided data).
  const clear = hits.filter(h => ['gads', 'ga4'].includes(h.platform) && h.userData?.clearText?.length);
  if (clear.length) {
    const fields = [...new Set(clear.flatMap(h => h.userData.clearText))];
    out.push(f('ec-clear-text', 'critical', 'Enhanced Conversions user data sent unhashed',
      `Fields sent in clear text: ${fields.join(', ')} (values not stored). Google expects SHA-256 hashed or normalised data that gtag hashes for you.`,
      'Pass raw values through gtag("set", "user_data", {...}) or the GTM user-provided data variable so Google hashes them, or hash with SHA-256 after normalising (lowercase, trimmed, E.164 phone).'));
  }
  if (!conv.length) return out;

  const rows = conv.map(h => {
    const p = h.params || {};
    const value = p.value !== undefined && p.value !== '' ? Number(p.value) : undefined;
    return { id: h.id, label: p.label || '?', value, currency: p.currency_code || p.cu || p.currency || '', orderId: p.oid || p.transaction_id || '', ec: h.userData };
  });
  out.push(f('gads-conversions', 'info', `${rows.length} Google Ads conversion${rows.length > 1 ? 's' : ''} observed`,
    rows.map(r => `${r.id}/${r.label}: value ${r.value ?? '—'} ${r.currency || ''} · order ID ${r.orderId ? '✓' : '✗'} · Enhanced Conversions ${r.ec ? `✓ (${r.ec.fields.join(', ')})` : '✗'}`).join(' | '), ''));

  if (rows.some(r => r.value !== undefined && Number.isNaN(r.value))) {
    out.push(f('gads-value-nan', 'warning', 'Google Ads conversion value is not a number', 'Values like "$49.90" are not recorded as conversion value.', 'Send value as a plain number.'));
  }
  if (rows.some(r => r.value !== undefined && !Number.isNaN(r.value) && !r.currency)) {
    out.push(f('gads-currency-missing', 'warning', 'Google Ads conversion value sent without currency', 'Google falls back to the account currency, which misreports value for multi-currency stores.', 'Add currency (ISO 4217) to the conversion tag.'));
  }
  if (rows.some(r => r.value > 0 && !r.orderId)) {
    out.push(f('gads-no-order-id', 'info', 'Google Ads conversion without a transaction ID', 'Without an order ID Google cannot deduplicate conversions when the thank-you page reloads.', 'Set the Transaction ID field in the conversion tag to the order number.'));
  }
  if (rows.every(r => !r.ec)) {
    out.push(f('gads-no-enhanced-conversions', 'info', 'Enhanced Conversions not detected on Google Ads conversions',
      'No hashed user data (email, phone or address) was sent with the conversion. Enhanced Conversions typically recovers 5–15% of conversions lost to cookie limits.',
      'Turn on Enhanced Conversions in Google Ads and send user-provided data on the conversion (gtag user_data or the GTM user-provided data variable).'));
  } else if (!clear.length) {
    out.push(f('gads-ec-present', 'pass', 'Enhanced Conversions user data sent (hashed)', '', ''));
  }
  return out;
}

// ---- Placement and order -----------------------------------------------------------------
export function validatePlacement(probe, dlLog) {
  const out = [];
  const pl = probe?.placement || {};
  if (pl.gtmSnippet === 'body') {
    out.push(f('gtm-not-in-head', 'warning', 'GTM snippet is not in <head>',
      'The Google Tag Manager loader sits in <body>, so it starts late. Visitors who leave quickly are never tracked, and the consent default may run after other scripts.',
      'Move the GTM <script> snippet as high in <head> as possible (keep the <noscript> part right after <body>).'));
  }
  if (pl.metaBase === 'body') {
    out.push(f('meta-base-not-in-head', 'warning', 'Meta Pixel base code is not in <head>',
      'Meta recommends the base code in <head> so PageView fires before visitors leave.',
      'Move the Meta Pixel base code into <head>, or fire it from GTM on Initialization.'));
  }
  const log = (dlLog || []).filter(e => e.type === 'push');
  const gtagCmds = log.map(e => e.entry?.__gtag).map((a, i) => ({ a, i })).filter(x => x.a);
  const firstConfig = gtagCmds.find(x => x.a[0] === 'config');
  const earlyEvent = gtagCmds.find(x => x.a[0] === 'event' && (!firstConfig || x.i < firstConfig.i));
  if (earlyEvent && firstConfig) {
    out.push(f('gtag-event-before-config', 'warning', 'gtag event sent before the Google tag was configured',
      `"${earlyEvent.a[1]}" was pushed before gtag("config", "${firstConfig.a[1]}"). Events sent before config may be dropped or sent without your configuration settings.`,
      'Call gtag("config", ...) right after gtag("js", new Date()), before any events.'));
  }
  const noEvent = log.map(e => e.entry).filter(x => x && typeof x === 'object' && !Array.isArray(x) && !x.__gtag && !('event' in x)
    && Object.keys(x).some(k => !/^gtm\./.test(k) && !(k === 'ecommerce' && x[k] === null)));
  if (noEvent.length) {
    out.push(f('datalayer-push-no-event', 'info', `${noEvent.length} dataLayer push${noEvent.length > 1 ? 'es have' : ' has'} no event key`,
      'GTM triggers only fire on pushes with an "event". Data-only pushes are fine for setting variables, but tags meant to fire on them never will.',
      'Add an event name to pushes that should trigger tags, e.g. dataLayer.push({ event: "sign_up", ... }).'));
  }
  return out;
}

// ---- Meta / TikTok helper parity ------------------------------------------------------------
const META_CONVERSIONS = new Set(['Purchase', 'Lead', 'CompleteRegistration', 'Subscribe', 'StartTrial', 'SubmitApplication', 'Contact', 'Schedule', 'InitiateCheckout', 'AddPaymentInfo']);
const TIKTOK_CONVERSIONS = new Set(['CompletePayment', 'PlaceAnOrder', 'Purchase', 'SubmitForm', 'CompleteRegistration', 'Subscribe', 'Contact']);
const TIKTOK_STANDARD = ['AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'ClickButton', 'CompletePayment', 'CompleteRegistration', 'Contact', 'Download',
  'InitiateCheckout', 'PlaceAnOrder', 'Search', 'SubmitForm', 'Subscribe', 'ViewContent', 'Pageview', 'Purchase', 'Lead', 'ApplicationApproval', 'FindLocation', 'Schedule', 'StartTrial', 'SubmitApplication', 'CustomizeProduct'];

export function validatePixelHealth(hits, { session = false, cookieNames = [], signals = null } = {}) {
  const out = [];
  const meta = hits.filter(h => h.platform === 'meta' && h.kind === 'hit');
  const tt = hits.filter(h => h.platform === 'tiktok' && h.kind === 'hit');

  const badMeta = [...new Set(meta.map(h => h.id).filter(id => id && !/^\d{10,20}$/.test(id)))];
  if (badMeta.length) out.push(f('meta-invalid-pixel-id', 'warning', 'Meta Pixel ID looks invalid', `IDs: ${badMeta.join(', ')}. Meta pixel IDs are 15–16 digit numbers.`, 'Copy the pixel ID from Events Manager → Data sources.'));
  const badTt = [...new Set(tt.map(h => h.id).filter(id => id && !/^[A-Z0-9]{15,25}$/.test(id)))];
  if (badTt.length) out.push(f('tiktok-invalid-pixel-id', 'warning', 'TikTok pixel ID looks invalid', `IDs: ${badTt.join(', ')}. TikTok pixel codes are ~20 uppercase letters and digits.`, 'Copy the pixel code from TikTok Events Manager.'));

  // Only the main event endpoint must carry a name; interaction endpoints (/api/v2/pixel/act …) may not.
  const ttPath = h => { try { return new URL(h.url).pathname; } catch { return ''; } };
  if (tt.some(h => !h.event && /\/api\/v2\/pixel(\/batch)?\/?$/.test(ttPath(h)))) out.push(f('tiktok-empty-event', 'warning', 'TikTok event sent without a name', 'TikTok drops events with an empty event name.', 'Pass an event name to ttq.track(), e.g. ttq.track("ViewContent").'));
  const ttLower = new Map(TIKTOK_STANDARD.map(e => [e.toLowerCase(), e]));
  const ttCase = [...new Set(tt.map(h => h.event).filter(e => typeof e === 'string' && ttLower.has(e.toLowerCase()) && ttLower.get(e.toLowerCase()) !== e))];
  if (ttCase.length) out.push(f('tiktok-event-case', 'warning', 'TikTok standard event has the wrong case', `${ttCase.map(e => `"${e}" should be "${ttLower.get(e.toLowerCase())}"`).join('; ')}. Wrong case makes it a custom event that can't be used for optimisation.`, 'Use the exact standard event name.'));

  const ttPay = tt.filter(h => ['CompletePayment', 'Purchase', 'PlaceAnOrder'].includes(h.event));
  if (ttPay.length && !ttPay.some(h => h.params?.['context.user.email'] || h.params?.['context.user.phone_number'] || h.params?.['context.user.sha256_email'] || h.params?.['context.user.sha256_phone_number'])) {
    out.push(f('tiktok-no-user-data', 'info', 'TikTok purchase without email or phone', 'Advanced matching data improves TikTok match rate and attribution on purchases.', 'Call ttq.identify({ email, phone_number }) before the purchase event (TikTok hashes it).'));
  }
  if (tt.length && cookieNames.length && signals?.ad_storage?.effective !== 'denied' && !cookieNames.includes('_ttp')) {
    out.push(f('tiktok-no-first-party-cookie', 'info', 'TikTok first-party cookie (_ttp) not found', 'TikTok events fire but its first-party cookie is missing, so attribution falls back to weaker signals.', 'Enable "First-party cookies" in TikTok Events Manager → Pixel settings.'));
  }

  const auto = [...new Set(meta.map(h => h.event).filter(e => ['SubscribedButtonClick', 'Microdata'].includes(e)))];
  if (auto.length) out.push(f('meta-automatic-events', 'info', 'Meta automatic events are on', `Seen: ${auto.join(', ')}. Meta infers events from button clicks and page metadata.`, 'Check automatic events do not duplicate your explicit events; turn them off in Events Manager if they do.'));

  if (!session) {
    const mConv = [...new Set(meta.map(h => h.event).filter(e => META_CONVERSIONS.has(e)))];
    if (mConv.length > 1) out.push(f('meta-multiple-conversions', 'info', 'Several Meta conversion events on one page load', `${mConv.join(', ')} fired on the same page. Fine if each came from a separate user action (e.g. a one-page checkout); otherwise conversions are inflated.`, 'Make sure each conversion fires only on its own action or confirmation page.'));
    const tConv = [...new Set(tt.map(h => h.event).filter(e => TIKTOK_CONVERSIONS.has(e)))];
    if (tConv.length > 1) out.push(f('tiktok-multiple-conversions', 'info', 'Several TikTok conversion events on one page load', `${tConv.join(', ')} fired on the same page.`, 'Make sure each conversion fires only on its own action or confirmation page.'));
  }
  return out;
}

// ---- Shopify Customer Events (custom pixels) ------------------------------------------------
const SANDBOX_URL = /\/(?:wpm|web-pixels)@[^/]+\/|\/sandbox\/modern\//;
const PAGE_URL_KEYS = ['dl', 'context.page.url', 'url', 'p', 'page_url', 'pu'];

export function validateShopify(hits, probe) {
  const out = [];
  const sandboxUrl = hits.filter(h => h.kind === 'hit' && PAGE_URL_KEYS.some(k => SANDBOX_URL.test(String(h.params?.[k] || ''))));
  if (sandboxUrl.length) {
    const vendors = [...new Set(sandboxUrl.map(h => platformLabel(h.platform)))];
    out.push(f('shopify-sandbox-url', 'critical', 'Shopify custom pixel reports the sandbox URL as the page URL',
      `${vendors.join(', ')} receive a /wpm@…/sandbox/ address instead of the real page, which breaks page reports, URL-based audiences and conversion rules.`,
      'In the custom pixel, set the page URL from event.context.document.location.href (e.g. page_location for GA4, dl for Meta) instead of relying on window.location.'));
  }
  const fromSandbox = hits.filter(h => h.source === 'shopify-sandbox' && h.kind === 'hit');
  if (fromSandbox.length) {
    out.push(f('shopify-custom-pixels', 'info', `${fromSandbox.length} event${fromSandbox.length > 1 ? 's' : ''} sent from Shopify custom pixels`,
      `Vendors: ${[...new Set(fromSandbox.map(h => platformLabel(h.platform)))].join(', ')}. These run in Shopify's Customer Events sandbox.`, ''));
  }
  return out;
}

// ---- OpenAI / ChatGPT Ads pixel (docs/research/PLATFORM-SPECS.md §1, checked 2026-10-16) -------------------
export const OPENAI_STANDARD = new Set(['page_viewed', 'contents_viewed', 'items_added', 'checkout_started', 'order_created', 'lead_created',
  'registration_completed', 'appointment_scheduled', 'subscription_created', 'trial_started']);
const OPENAI_CONVERSIONS = new Set(['checkout_started', 'order_created', 'lead_created', 'registration_completed', 'subscription_created', 'trial_started', 'appointment_scheduled']);
const OPENAI_CUSTOM_NAME = /^[A-Za-z0-9](?:[A-Za-z0-9_-]{0,62}[A-Za-z0-9])?$/;
// Location fields are sent in clear text by design; everything else in `user` must be SHA-256 (lowercase hex).
const OPENAI_CLEAR_USER = /^user\.(country|city|region|postal_code|countries|cities|regions|postal_codes)(\.\d+)?$/;

export function validateOpenAI(hits, { pageUrls = [], cookieNames = [] } = {}) {
  const all = hits.filter(h => h.platform === 'openai' && h.kind === 'hit' && !h.internal);
  const out = [];
  if (all.some(h => h.capiInBrowser)) {
    out.push(f('openai-capi-in-browser', 'critical', 'ChatGPT Ads Conversions API is called from the browser',
      'A request went to bzr.openai.com/v1/events from page code. That endpoint needs your secret API key, so the key is exposed to every visitor.',
      'Remove the call from the page and revoke the key in OpenAI Ads. Send server events from your backend only; use the pixel (oaiq) in the browser.', { platform: 'openai' }));
  }
  const events = all.filter(h => !h.capiInBrowser);
  if (!events.length) return out;
  const issues = [];
  for (const h of events) {
    const p = h.params || {};
    const type = p.type || h.event;
    if (type === 'custom') {
      const name = p.custom_event_name;
      if (!name || !OPENAI_CUSTOM_NAME.test(name) || OPENAI_STANDARD.has(name)) {
        issues.push(f('openai-custom-name', 'warning', 'ChatGPT Ads custom event has an invalid name',
          'Custom events need custom_event_name: 1–64 letters, numbers, "_" or "-", starting and ending with a letter or number, and not a standard event name.',
          'Rename the custom event, or use the matching standard event instead.', { platform: 'openai', event: name || 'custom' }));
      }
    } else if (type && !OPENAI_STANDARD.has(type)) {
      issues.push(f('openai-unknown-event', 'warning', 'ChatGPT Ads event name is not a standard event',
        'OpenAI accepts the standard events (page_viewed, contents_viewed, items_added, checkout_started, order_created, lead_created, registration_completed, appointment_scheduled, subscription_created, trial_started) or "custom" with a custom_event_name.',
        'Use a standard event name, or send it as event "custom" with custom_event_name.', { platform: 'openai', event: type }));
    }
    const amount = p['data.amount'];
    if (amount !== undefined && amount !== '') {
      if (!/^-?\d+$/.test(String(amount))) {
        issues.push(f('openai-amount-format', 'warning', 'ChatGPT Ads amount is not an integer in minor units',
          `amount=${String(amount).slice(0, 20)}. OpenAI expects whole numbers in the currency's minor unit (25.99 USD is 2599).`,
          'Multiply by 100 (or the currency\'s minor-unit factor) and send an integer.', { platform: 'openai', event: type }));
      }
      if (!p['data.currency']) {
        issues.push(f('openai-amount-format', 'warning', 'ChatGPT Ads amount is sent without a currency',
          'An amount needs an ISO 4217 currency code alongside it.', 'Add data.currency (for example "USD" or "INR").', { platform: 'openai', event: type }));
      }
    }
    if (type === 'order_created' && !p.id) {
      issues.push(f('openai-no-event-id', 'info', 'ChatGPT Ads purchase has no event ID',
        'Without an event_id the Conversions API cannot deduplicate this purchase against the pixel, so a server copy would count twice.',
        'Pass options.event_id in oaiq("measure", …) and send the same value as events[].id from your server.', { platform: 'openai', event: type }));
    }
  }
  out.push(...collapse(issues));

  // Click ID: oppref on the landing URL must be captured by the pixel and carried on conversions.
  const landed = pageUrls.some(u => { try { return new URL(u).searchParams.has('oppref'); } catch { return false; } });
  if (landed) {
    const carried = events.some(h => h.params?.oppref);
    const cookie = cookieNames.includes('__oppref');
    const conversions = events.filter(h => OPENAI_CONVERSIONS.has(h.params?.type || h.event));
    if (carried || cookie) {
      out.push(f('openai-oppref-captured', 'pass', 'ChatGPT Ads click ID (oppref) is captured', '', ''));
    } else if (conversions.length || events.length) {
      out.push(f('openai-oppref-missing', 'warning', 'ChatGPT Ads click ID (oppref) is not captured',
        'The page URL has oppref, but no OpenAI event carries it and no __oppref cookie was set. Conversions from ChatGPT ads will not be attributed to the click.',
        'Load the pixel on the landing page before any redirect that drops query parameters, and make sure consent allows it. Your server must also forward the original oppref string unchanged as events[].oppref (the browser cannot see that part).', { platform: 'openai' }));
    }
  }
  return out;
}

// Raw personal data in OpenAI user fields (pixel init user / CAPI-style fields): everything but location must be hashed.
export function openAIUnhashedFields(hit) {
  if (hit.platform !== 'openai') return [];
  return Object.entries(hit.params || {})
    .filter(([k, v]) => /^user\./.test(k) && !OPENAI_CLEAR_USER.test(k) && k !== 'user.obref' && v !== '' && v != null && !/^[a-f0-9]{64}$/.test(String(v)))
    .map(([k]) => k);
}

// ---- Meta sensitive-data pre-check (PLATFORM-SPECS.md §5) ---------------------------------------------------
// Words Meta's "prohibited information" categories cover. Matched as whole tokens (split on non-letters), so
// "therapy" matches but "therapeutic" does not. Domain names are never scanned (core setup keeps the domain).
const SENSITIVE = {
  health: ['diabetes', 'diabetic', 'cancer', 'tumour', 'tumor', 'chemotherapy', 'hiv', 'aids', 'stds', 'sti', 'herpes', 'hepatitis', 'asthma', 'arthritis',
    'alzheimers', 'dementia', 'epilepsy', 'psoriasis', 'eczema', 'acne', 'obesity', 'cholesterol', 'hypertension', 'migraine', 'insomnia', 'thyroid',
    'covid', 'disease', 'diagnosis', 'symptoms', 'illness', 'injury', 'disability', 'pcos', 'endometriosis', 'menopause', 'incontinence',
    'kidney', 'cardiac', 'chronic'],
  'sexual and reproductive health': ['pregnancy', 'pregnant', 'fertility', 'infertility', 'ivf', 'ovulation', 'contraception', 'contraceptive', 'abortion',
    'erectile', 'viagra', 'cialis', 'libido', 'sexual', 'menstrual', 'period-tracker', 'miscarriage'],
  'mental health': ['depression', 'anxiety', 'adhd', 'autism', 'bipolar', 'schizophrenia', 'ptsd', 'ocd', 'therapy', 'therapist', 'counselling',
    'counseling', 'psychiatrist', 'psychologist', 'addiction', 'rehab', 'suicide', 'eating-disorder', 'anorexia', 'bulimia'],
  'treatments and medication': ['prescription', 'medication', 'medicine', 'pharmacy', 'dosage', 'ozempic', 'wegovy', 'semaglutide', 'insulin',
    'antidepressant', 'vaccine', 'surgery', 'treatment', 'clinic', 'patient', 'appointment-booked', 'telehealth', 'dental-implant', 'hair-transplant', 'weight-loss', 'weightloss'],
  financial: ['bankruptcy', 'debt', 'debt-relief', 'loan-approved', 'loan-denied', 'credit-score', 'payday', 'foreclosure', 'overdraft', 'cibil'],
  identifiers: ['ssn', 'aadhaar', 'pan-card', 'passport-number', 'password', 'otp'],
};
const TERM_INDEX = new Map(Object.entries(SENSITIVE).flatMap(([cat, terms]) => terms.map(t => [t, cat])));
// Multi-word terms are written with "-" and matched against text with spaces/underscores turned into hyphens.

function sensitiveTerms(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  const tokens = new Set(lower.split(/[^a-z0-9]+/).filter(Boolean));
  const joined = lower.replace(/[_\s+]+/g, '-');
  const found = [];
  for (const [term, cat] of TERM_INDEX) {
    if (term.includes('-') ? joined.includes(term) : tokens.has(term)) found.push({ term, cat });
  }
  return found;
}

// Path, query and fragment of a URL (the domain is excluded).
function urlTail(u) {
  try { const x = new URL(u); return decodeURIComponent(`${x.pathname} ${x.search} ${x.hash}`.replace(/\+/g, ' ')); } catch { return ''; }
}

export function validateMetaSensitive(hits) {
  const matches = new Map();
  const add = (where, text) => {
    for (const { term, cat } of sensitiveTerms(text)) {
      const k = `${term}|${where}`;
      if (!matches.has(k)) matches.set(k, { term, cat, where });
    }
  };
  for (const h of hits) {
    if (h.platform !== 'meta' || h.kind !== 'hit') continue;
    const p = h.params || {};
    for (const key of ['dl', 'rl']) {
      if (!p[key]) continue;
      const tail = urlTail(p[key]);
      let utm = '';
      try { utm = [...new URL(p[key]).searchParams].filter(([k]) => /^utm_/.test(k)).map(([, v]) => v).join(' '); } catch { /* ignore */ }
      add(utm && sensitiveTerms(utm).length ? `UTM parameters (${key === 'dl' ? 'page URL' : 'referrer'})` : (key === 'dl' ? 'page URL' : 'referrer URL'), utm || tail);
      if (utm) add(key === 'dl' ? 'page URL' : 'referrer URL', urlTail(p[key].replace(/[?&]utm_[^&#]*/g, '')));
    }
    if (p.ev && !META_STANDARD.includes(p.ev)) add('custom event name', p.ev.replace(/([a-z])([A-Z])/g, '$1 $2'));
    for (const [k, v] of Object.entries(p)) {
      if (/^cd\[/.test(k) && !/content_ids|value|currency|num_items/.test(k)) add(`custom data (${k})`, `${k.replace(/^cd\[|\]$/g, '')} ${v}`);
    }
  }
  if (!matches.size) return [];
  const list = [...matches.values()];
  const terms = [...new Set(list.map(m => `"${m.term}" (${m.cat})`))].slice(0, 8);
  const places = [...new Set(list.map(m => m.where))];
  return [f('meta-sensitive-data', 'warning', 'May trigger Meta data restrictions (sensitive terms sent to Meta)',
    `Meta scans URLs, UTM parameters, custom event names and custom data for health, financial and other sensitive information, and can strip parameters, block events or restrict the dataset. Found ${terms.join(', ')} in: ${places.join(', ')}. This is a pre-check: the browser cannot see whether Meta has already restricted your account.`,
    'Rename custom events and custom conversions to neutral names (e.g. "QuizCompleted" not "WeightLossQuizCompleted"), keep sensitive words out of URLs and UTMs or strip the path from the pixel\'s page URL, remove the pixel from patient or account pages, and filter parameters server-side if you use the Conversions API. Check Events Manager → Diagnostics for "potentially prohibited information".',
    { platform: 'meta', sensitive: list.slice(0, 20) })];
}
