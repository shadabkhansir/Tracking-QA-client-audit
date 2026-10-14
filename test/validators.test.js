import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyRequest } from '../src/detectors.js';
import { parseGa4Item, ecommerceOf, describeParams } from '../src/params.js';
import { validateDataLayer, validateCookies, validateCrossPlatform } from '../src/validators.js';
import { runChecks } from '../src/checks.js';
import { diffFindings } from '../src/diff.js';
import { hitsToCsv, summaryText } from '../src/export.js';

const ga4 = params => classifyRequest({ url: `https://www.google-analytics.com/g/collect?${new URLSearchParams({ v: '2', tid: 'G-1', ...params })}` });
const meta = params => classifyRequest({ url: `https://www.facebook.com/tr/?${new URLSearchParams({ id: '111', ...params })}` });
const tiktok = body => classifyRequest({ url: 'https://analytics.tiktok.com/api/v2/pixel', method: 'POST', body: JSON.stringify(body) });
const ids = r => r.findings.map(f => f.id);

test('GA4 item string parsing', () => {
  assert.deepEqual(parseGa4Item('idSKU1~nmShirt~pr19.99~qt2'), { item_id: 'SKU1', item_name: 'Shirt', price: '19.99', quantity: '2' });
  const [h] = ga4({ en: 'purchase', 'ep.transaction_id': 'T1', 'epn.value': '39.98', cu: 'USD', pr1: 'idSKU1~nmShirt~pr19.99~qt2' });
  const e = ecommerceOf(h);
  assert.equal(e.value, 39.98);
  assert.equal(e.items.length, 1);
});

test('friendly labels', () => {
  const [h] = ga4({ en: 'purchase', 'ep.transaction_id': 'T1' });
  const rows = describeParams(h);
  assert.equal(rows[0].key, 'tid');
  assert.ok(rows.some(r => r.label === 'Event param: transaction_id'));
});

test('GA4 purchase without transaction_id, value, currency or items', () => {
  const r = runChecks({ url: 'u', hits: ga4({ en: 'purchase', dl: 'u' }) });
  for (const id of ['ga4-no-transaction-id', 'ga4-purchase-no-value', 'ga4-ecom-no-items']) assert.ok(ids(r).includes(id), id);
});

test('GA4 duplicate purchase and bad names', () => {
  const p = { en: 'purchase', 'ep.transaction_id': 'T1', 'epn.value': '10', cu: 'USD', pr1: 'idA~nmA', dl: 'u' };
  const r = runChecks({ url: 'u', hits: [...ga4(p), ...ga4(p), ...ga4({ en: 'Form Submit', dl: 'u' }), ...ga4({ en: 'session_start', dl: 'u' })] });
  for (const id of ['ga4-duplicate-purchase', 'ga4-event-name-chars', 'ga4-reserved-event']) assert.ok(ids(r).includes(id), id);
});

test('valid GA4 purchase passes ecommerce check', () => {
  const r = runChecks({ url: 'u', hits: ga4({ en: 'purchase', 'ep.transaction_id': 'T1', 'epn.value': '10', cu: 'USD', pr1: 'idA~nmA~pr10~qt1', dl: 'u' }) });
  assert.ok(ids(r).includes('ecommerce-valid'));
});

test('Meta: Purchase without value, wrong case, missing content_ids, multiple activation', () => {
  const r = runChecks({ url: 'u', hits: [...meta({ ev: 'Purchase' }), ...meta({ ev: 'addtocart' }), ...meta({ ev: 'ViewContent', 'cd[value]': '5', 'cd[currency]': 'USD' }), ...meta({ ev: 'ViewContent', 'cd[value]': '5', 'cd[currency]': 'USD' })] });
  for (const id of ['meta-purchase-value', 'meta-event-case', 'meta-content-ids', 'meta-multiple-activation']) assert.ok(ids(r).includes(id), id);
});

test('TikTok: purchase without value, bad content_type, bad phone', () => {
  const r = runChecks({ url: 'u', hits: tiktok({ event: 'CompletePayment', context: { pixel: { code: 'T' }, user: { phone_number: '555-1234' } }, properties: { content_type: 'sku' } }) });
  for (const id of ['tiktok-purchase-value', 'tiktok-content-type', 'tiktok-phone-format']) assert.ok(ids(r).includes(id), id);
});

test('cross-platform purchase mismatch', () => {
  const hits = [...ga4({ en: 'purchase', 'epn.value': '100', cu: 'USD' }), ...meta({ ev: 'Purchase', 'cd[value]': '85', 'cd[currency]': 'USD' })];
  assert.equal(validateCrossPlatform(hits)[0].id, 'cross-platform-mismatch');
  const ok = [...ga4({ en: 'purchase', 'epn.value': '100', cu: 'USD' }), ...meta({ ev: 'Purchase', 'cd[value]': '100.00', 'cd[currency]': 'usd' })];
  assert.equal(validateCrossPlatform(ok)[0].id, 'cross-platform-consistent');
});

test('dataLayer reassigned after GTM, ecommerce not cleared', () => {
  const log = [
    { type: 'push', entry: { event: 'view_item', ecommerce: { items: [] } } },
    { type: 'push', entry: { event: 'add_to_cart', ecommerce: { items: [] } } },
    { type: 'reassigned', afterGtm: true },
  ];
  const out = validateDataLayer(log, {}).map(f => f.id);
  assert.ok(out.includes('datalayer-reassigned'));
  assert.ok(out.includes('datalayer-ecommerce-not-cleared'));
  const cleared = [{ type: 'push', entry: { ecommerce: { a: 1 } } }, { type: 'push', entry: { ecommerce: null } }, { type: 'push', entry: { ecommerce: { b: 1 } } }];
  assert.equal(validateDataLayer(cleared, {}).length, 0);
});

test('cookies present while consent denied', () => {
  const out = validateCookies({ cookieNames: ['_fbp', '_ga', 'session'] }, { ad_storage: { effective: 'denied' }, analytics_storage: { effective: 'granted' } });
  assert.equal(out[0].id, 'cookies-without-consent');
  assert.match(out[0].detail, /_fbp/);
  assert.doesNotMatch(out[0].detail, /_ga /);
});

test('other ad pixels firing while denied are caught', () => {
  const hits = [...ga4({ en: 'page_view', gcs: 'G100', gcd: '13p3p3p2p5l1' }), ...classifyRequest({ url: 'https://px.ads.linkedin.com/collect?pid=9&fmt=gif' })];
  const r = runChecks({ url: 'u', hits });
  const f = r.findings.find(x => x.id === 'pixels-ignore-consent');
  assert.match(f.title, /LinkedIn/);
});

test('consent test: CMP accept without Google update is critical', () => {
  const t = { attempted: true, accepted: true, method: 'button', googlePresent: true, before: {}, after: { meta: 1 },
    signalsAfter: { ad_storage: { effective: 'denied' }, analytics_storage: { effective: 'denied' } }, loadedPlatforms: ['meta'] };
  const r = runChecks({ url: 'u', hits: ga4({ en: 'page_view', gcd: '13p3p3p2p5l1' }), consentTest: t });
  assert.ok(ids(r).includes('consent-update-missing'));
  assert.ok(ids(r).includes('pixels-wait-for-consent'));
});

test('diffFindings', () => {
  const a = [{ id: 'x', title: 'X', severity: 'critical' }, { id: 'y', title: 'Y', severity: 'warning' }];
  const b = [{ id: 'y', title: 'Y (changed count)', severity: 'warning' }, { id: 'z', title: 'Z', severity: 'critical' }];
  const d = diffFindings(a, b);
  assert.deepEqual(d.resolved.map(f => f.id), ['x']);
  assert.deepEqual(d.added.map(f => f.id), ['z']);
  assert.deepEqual(d.unchanged.map(f => f.id), ['y']);
});

test('exports', () => {
  const csv = hitsToCsv(ga4({ en: 'page_view', dl: 'https://x.com/a,b' }));
  assert.match(csv.split('\n')[1], /"https:\/\/x.com\/a,b"/);
  assert.match(summaryText({ url: 'u', score: 70, findings: [{ severity: 'critical', title: 'Bad', fix: 'Do X' }] }), /🔴 Bad/);
});

test('consent test: pixels firing after reject is critical; clean reject passes', () => {
  const base = { attempted: true, accepted: true, mode: 'reject', method: 'button', googlePresent: true, before: {} };
  const bad = runChecks({ url: 'u', hits: ga4({ en: 'page_view', gcd: '13p3p3p2p5l1' }), consentTest: { ...base, after: { tiktok: 2 }, signalsAfter: { ad_storage: { effective: 'granted' } } } });
  assert.ok(ids(bad).includes('pixels-fire-after-reject'));
  assert.ok(ids(bad).includes('consent-granted-after-reject'));
  const good = runChecks({ url: 'u', hits: ga4({ en: 'page_view', gcd: '13p3p3p2p5l1' }), consentTest: { ...base, after: {}, signalsAfter: { ad_storage: { effective: 'denied' } } } });
  assert.ok(ids(good).includes('reject-respected'));
});

test('first-party GA4 endpoint is flagged as server-side GTM', () => {
  const hits = classifyRequest({ url: 'https://metrics.shop.com/g/collect?v=2&tid=G-1&en=page_view&dl=u' });
  assert.equal(hits[0].serverSide, true);
  assert.ok(runChecks({ url: 'u', hits }).findings.some(f => f.id === 'sgtm-detected'));
});
