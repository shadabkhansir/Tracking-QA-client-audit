import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyRequest, classifyCustom, parseUserData, platformLabel } from '../src/detectors.js';
import { validateDelivery, validateGoogleAds, validatePlacement, validatePixelHealth, validateShopify, validateCookies } from '../src/validators.js';
import { runChecks, aggregatePages, consentTestFindings } from '../src/checks.js';
import { classifyCookie } from '../src/cookies.js';
import { hitsToHar } from '../src/export.js';

const ids = list => list.map(f => f.id);
const hit = (platform, extra = {}) => ({ platform, kind: 'hit', id: 'X', event: 'e', params: {}, requestId: Math.random().toString(36), ...extra });

test('delivery: blocked, rejected, failed library, slow, all ok', () => {
  const out = validateDelivery([
    hit('meta', { delivery: { status: 0, error: 'net::ERR_BLOCKED_BY_CLIENT', ms: 2 } }),
    hit('ga4', { delivery: { status: 500, ms: 40 } }),
    { ...hit('gtm', { kind: 'script', id: 'GTM-NOPE' }), delivery: { status: 404, ms: 10 } },
    hit('tiktok', { delivery: { status: 200, ms: 4200 } }),
    hit('x', { delivery: { status: 0, error: 'net::ERR_ABORTED', ms: 1 } }),
  ]);
  assert.deepEqual(ids(out).sort(), ['hits-blocked-locally', 'hits-rejected', 'hits-slow', 'tag-library-failed'].sort());
  assert.match(out.find(f => f.id === 'tag-library-failed').detail, /GTM-NOPE \(404\)/);
  assert.deepEqual(ids(validateDelivery([hit('ga4', { delivery: { status: 204, ms: 30 } })])), ['hits-delivered']);
  assert.deepEqual(validateDelivery([hit('ga4')]), []);
});

test('batched hits sharing a requestId count once', () => {
  const d = { status: 500, ms: 5 };
  const out = validateDelivery([hit('ga4', { requestId: 'r1', delivery: d }), hit('ga4', { requestId: 'r1', delivery: d })]);
  assert.match(out[0].detail, /\(500\)/);
});

test('Enhanced Conversions parsing', () => {
  const ud = parseUserData(`tv.1~em.${'a'.repeat(64)}~ph.${'B'.repeat(43)}`);
  assert.deepEqual(ud.clearText, []);
  assert.ok(ud.hasEmail && ud.hasPhone);
  assert.deepEqual(parseUserData('tv.1~em.jane%40doe.com').clearText, ['em']);
  assert.equal(parseUserData(''), null);
});

test('Google Ads conversion checks', () => {
  const conv = classifyRequest({ url: 'https://www.googleadservices.com/pagead/conversion/123/?label=abc&value=49.9&em=tv.1~em.jane%40doe.com' });
  const out = ids(validateGoogleAds(conv));
  for (const id of ['ec-clear-text', 'gads-conversions', 'gads-currency-missing', 'gads-no-order-id']) assert.ok(out.includes(id), id);
  const good = classifyRequest({ url: `https://www.googleadservices.com/pagead/conversion/123/?label=abc&value=49.9&currency_code=USD&oid=T1&em=tv.1~em.${'a'.repeat(64)}` });
  const g = ids(validateGoogleAds(good));
  assert.ok(g.includes('gads-ec-present'));
  assert.ok(!g.includes('gads-currency-missing') && !g.includes('gads-no-order-id'));
  const noEc = ids(validateGoogleAds(classifyRequest({ url: 'https://www.googleadservices.com/pagead/conversion/1/?label=x' })));
  assert.ok(noEc.includes('gads-no-enhanced-conversions'));
});

test('EC clear text is not double-counted as a generic PII leak', () => {
  const r = runChecks({ url: 'u', hits: classifyRequest({ url: 'https://www.googleadservices.com/pagead/conversion/1/?label=x&em=tv.1~em.jane%40doe.com' }) });
  assert.ok(ids(r.findings).includes('ec-clear-text'));
  assert.ok(!ids(r.findings).includes('pii-leak'));
});

test('placement and order', () => {
  const out = ids(validatePlacement({ placement: { gtmSnippet: 'body', metaBase: 'body' } }, [
    { type: 'push', entry: { __gtag: ['event', 'early'] } },
    { type: 'push', entry: { __gtag: ['config', 'G-1'] } },
    { type: 'push', entry: { userId: 'u1' } },
    { type: 'push', entry: { ecommerce: null } },
    { type: 'push', entry: { 'gtm.start': 1, event: 'gtm.js' } },
  ]));
  assert.deepEqual(out.sort(), ['datalayer-push-no-event', 'gtag-event-before-config', 'gtm-not-in-head', 'meta-base-not-in-head'].sort());
  assert.deepEqual(validatePlacement({ placement: { gtmSnippet: 'head' } }, [{ type: 'push', entry: { __gtag: ['config', 'G-1'] } }, { type: 'push', entry: { __gtag: ['event', 'x'] } }]), []);
});

test('pixel health: IDs, case, empty, auto events, multiple conversions, _ttp', () => {
  const hits = [
    hit('meta', { id: '123', event: 'Purchase' }), hit('meta', { id: '123', event: 'Lead' }), hit('meta', { id: '123', event: 'SubscribedButtonClick' }),
    hit('tiktok', { id: 'bad-id', event: 'completePayment' }), hit('tiktok', { id: 'C4ABCDEFGHIJKLMNOPQR', event: null }),
    hit('tiktok', { id: 'C4ABCDEFGHIJKLMNOPQR', event: 'CompletePayment' }), hit('tiktok', { id: 'C4ABCDEFGHIJKLMNOPQR', event: 'SubmitForm' }),
  ];
  const out = ids(validatePixelHealth(hits, { cookieNames: ['_fbp'], signals: { ad_storage: { effective: 'granted' } } }));
  for (const id of ['meta-invalid-pixel-id', 'tiktok-invalid-pixel-id', 'tiktok-empty-event', 'tiktok-event-case', 'tiktok-no-user-data',
    'tiktok-no-first-party-cookie', 'meta-automatic-events', 'meta-multiple-conversions', 'tiktok-multiple-conversions']) assert.ok(out.includes(id), id);
  const session = ids(validatePixelHealth(hits, { session: true }));
  assert.ok(!session.includes('meta-multiple-conversions'));
  assert.ok(!session.includes('tiktok-no-first-party-cookie'), 'no cookie data, no cookie finding');
});

test('Shopify sandbox URL and custom-pixel source', () => {
  const sandboxHit = classifyRequest({ url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-1&en=page_view&dl=' + encodeURIComponent('https://shop.com/wpm@0.1/custom/web-pixel-9@2/sandbox/modern/products/x') })[0];
  const out = ids(validateShopify([{ ...sandboxHit, source: 'shopify-sandbox' }], { shopify: { shop: 'x' } }));
  assert.deepEqual(out, ['shopify-sandbox-url', 'shopify-custom-pixels']);
  assert.deepEqual(validateShopify([hit('ga4', { params: { dl: 'https://shop.com/products/x' } })]), []);
});

test('cookie classification and table-based consent check', () => {
  assert.deepEqual(classifyCookie('_ga_ABC123'), { vendor: 'Google Analytics', category: 'analytics' });
  assert.equal(classifyCookie('_fbp').category, 'advertising');
  assert.equal(classifyCookie('OptanonConsent').category, 'consent');
  assert.equal(classifyCookie('session_id').category, 'other');
  // HttpOnly _ga only visible through the cookie table.
  const out = validateCookies({ cookieNames: [] }, { ad_storage: { effective: 'granted' }, analytics_storage: { effective: 'denied' } }, [{ name: '_ga', domain: '.shop.com' }]);
  assert.equal(out[0].id, 'cookies-without-consent');
});

test('first-party proxies and custom providers', () => {
  assert.equal(classifyRequest({ url: 'https://shop.com/metrics/gtm.js?id=GTM-ABC' })[0].firstParty, true);
  assert.equal(classifyRequest({ url: 'https://www.googletagmanager.com/gtm.js?id=GTM-ABC' })[0].firstParty, false);
  assert.equal(classifyRequest({ url: 'https://shop.com/tr/?id=1234567890123&ev=PageView' })[0].platform, 'meta');
  assert.deepEqual(classifyRequest({ url: 'https://shop.com/tr/?page=2' }), []);
  const r = runChecks({ url: 'u', hits: classifyRequest({ url: 'https://shop.com/tr/?id=1234567890123&ev=PageView&dl=u' }) });
  assert.ok(ids(r.findings).includes('first-party-tags'));
  const c = classifyCustom('https://api.segment.io/v1/t', '{"event":"Order Completed","writeKey":"K1"}', [{ name: 'Segment', match: 'api.segment.io', idParam: 'writeKey', eventParam: 'event' }]);
  assert.equal(c[0].platform, 'custom:Segment');
  assert.equal(c[0].id, 'K1');
  assert.equal(platformLabel('custom:Segment'), 'Segment');
  assert.deepEqual(classifyCustom('https://x.com/a', '', [{ name: 'Bad', match: '/[/' }]), [], 'invalid regex is ignored');
});

test('GPC test findings', () => {
  const base = { attempted: true, accepted: true, mode: 'gpc', before: { meta: 1 }, signalsAfter: {} };
  assert.deepEqual(ids(consentTestFindings({ ...base, after: { meta: 1 } })), ['gpc-ignored']);
  assert.deepEqual(ids(consentTestFindings({ ...base, after: { meta: 1 }, limitedUse: { metaLdu: true } })), ['gpc-respected']);
  assert.deepEqual(ids(consentTestFindings({ ...base, after: {} })), ['gpc-respected']);
});

test('coverage gaps across a scan', () => {
  const page = (url, platforms) => ({ url, score: 90, findings: [], platforms, counts: {} });
  const site = aggregatePages([
    page('https://s.com/', { gtm: { ids: ['GTM-1'] }, ga4: { ids: ['G-1'] } }),
    page('https://s.com/a', { gtm: { ids: ['GTM-1'] }, ga4: { ids: ['G-1'] } }),
    page('https://s.com/checkout', { ga4: { ids: ['G-1'] } }),
  ]);
  const gap = site.findings.find(f => f.id === 'coverage-gaps');
  assert.match(gap.detail, /Google Tag Manager missing on 1\/3: https:\/\/s.com\/checkout/);
  assert.equal(site.score, 84);
});

test('HAR export', () => {
  const hits = [
    { kind: 'nav', url: 'https://s.com/', ts: 1 },
    ...classifyRequest({ url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-1', body: 'en=a\nen=b' }).map(h => ({ ...h, requestId: 'r1', ts: 2, method: 'POST', body: 'en=a\nen=b', delivery: { status: 204, ms: 30 } })),
  ];
  const har = hitsToHar(hits, { pageUrl: 'https://s.com/' });
  assert.equal(har.log.version, '1.2');
  assert.equal(har.log.entries.length, 1, 'batched hits = one request');
  assert.equal(har.log.entries[0].response.status, 204);
  assert.equal(har.log.entries[0].request.postData.text, 'en=a\nen=b');
  assert.ok(har.log.entries[0].request.queryString.some(q => q.name === 'tid'));
});
