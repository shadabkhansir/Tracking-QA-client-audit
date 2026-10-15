// Regression tests for false positives and crashes found in the pre-launch review.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyRequest, parseUserData } from '../src/detectors.js';
import { runChecks } from '../src/checks.js';
import { validateDelivery, validateGa4, validateShopify, validatePixelHealth, validateMeta } from '../src/validators.js';
import { classifyCookie } from '../src/cookies.js';
import { ecommerceOf } from '../src/params.js';
import { diffFindings } from '../src/diff.js';

const ids = r => (r.findings || r).map(f => f.id);
const ga4 = (p, extra = {}) => classifyRequest({ url: `https://www.google-analytics.com/g/collect?${new URLSearchParams({ v: '2', tid: 'G-1', ...p })}` }).map(h => ({ ...h, ...extra }));

test('X pageview sent to t.co and analytics.twitter.com is not a duplicate', () => {
  const q = '?txn_id=o1abc&events=%5B%5B%22pageview%22%2C%7B%7D%5D%5D&tw_document_href=https%3A%2F%2Fs.com%2F';
  const hits = [...classifyRequest({ url: `https://t.co/i/adsct${q}` }), ...classifyRequest({ url: `https://analytics.twitter.com/i/adsct${q}` })];
  assert.ok(!ids(runChecks({ url: 'u', hits })).includes('duplicate-pageview-x'));
});

test('SPA page views more than 2 s apart are not duplicates; within 2 s they are', () => {
  const spa = [...ga4({ en: 'page_view', dl: 'u' }, { ts: 1000 }), ...ga4({ en: 'page_view', dl: 'u' }, { ts: 9000 })];
  assert.ok(!ids(runChecks({ url: 'u', hits: spa })).includes('duplicate-pageview-ga4'));
  const dup = [...ga4({ en: 'page_view', dl: 'u' }, { ts: 1000 }), ...ga4({ en: 'page_view', dl: 'u' }, { ts: 1300 })];
  assert.ok(ids(runChecks({ url: 'u', hits: dup })).includes('duplicate-pageview-ga4'));
});

test('GPC reload does not double-count a purchase', () => {
  const p = { en: 'purchase', 'ep.transaction_id': 'T1', 'epn.value': '10', cu: 'USD', pr1: 'idA~nmA', dl: 'u' };
  const r = runChecks({ url: 'u', hits: ga4(p), postHits: ga4(p), consentTest: { attempted: true, accepted: true, mode: 'gpc', before: {}, after: {} } });
  assert.ok(!ids(r).includes('ga4-duplicate-purchase'));
  const acc = runChecks({ url: 'u', hits: ga4(p), postHits: ga4(p), consentTest: { attempted: true, accepted: true, mode: 'accept', before: {}, after: {} } });
  assert.ok(!ids(acc).includes('ga4-duplicate-purchase'), 'CMP reload on accept');
});

test('UET in its own consent mode (asc=D) respects consent', () => {
  const hits = [...ga4({ en: 'page_view', gcs: 'G100', gcd: '13p3p3p2p5l1' }), ...classifyRequest({ url: 'https://bat.bing.com/action/0?ti=1&evt=pageLoad&asc=D' })];
  assert.ok(!ids(runChecks({ url: 'u', hits })).includes('pixels-ignore-consent'));
});

test('Enhanced Conversions: unhashed address parts and base64 hashes are fine', () => {
  assert.deepEqual(parseUserData(`tv.1~em.${'a'.repeat(64)}~pc0.94043~co0.US~ct0.sf`).clearText, []);
  assert.deepEqual(parseUserData(`tv.1~em.${'Ab+/'.repeat(10)}abc=`).clearText, []);
  assert.equal(parseUserData('tv.1~fn0.' + 'a'.repeat(64)).hasAddress, true);
  assert.deepEqual(parseUserData('tv.1~em.jane@doe.com').clearText, ['em']);
});

test('retina image names are not emails', () => {
  const hits = classifyRequest({ url: 'https://www.facebook.com/tr/?id=1234567890123&ev=ViewContent&cd[image_url]=https%3A%2F%2Fs.com%2Fshirt%402x.jpg' });
  assert.ok(!ids(runChecks({ url: 'u', hits })).includes('pii-leak'));
  const real = classifyRequest({ url: 'https://www.facebook.com/tr/?id=1234567890123&ev=Lead&dl=https%3A%2F%2Fs.com%2F%3Fe%3Djane%40doe.com' });
  assert.ok(ids(runChecks({ url: 'u', hits: real })).includes('pii-leak'));
});

test('FPID / FPLC are analytics cookies', () => {
  assert.equal(classifyCookie('FPID').category, 'analytics');
  assert.equal(classifyCookie('FPGCLAW').category, 'advertising');
});

test('Shopify: ordinary blog URLs are not the sandbox', () => {
  assert.deepEqual(validateShopify([{ platform: 'ga4', kind: 'hit', params: { dl: 'https://s.com/blogs/news/web-pixel-setup-guide' } }]), []);
});

test('ORB / CORP discarded responses are not rejected hits', () => {
  const out = validateDelivery([{ platform: 'meta', kind: 'hit', requestId: 'r', delivery: { status: 0, error: 'net::ERR_BLOCKED_BY_ORB', ms: 5 } }]);
  assert.ok(!ids(out).includes('hits-rejected'));
});

test('gtag-sent user_engagement is not a reserved-name warning', () => {
  assert.ok(!ids(validateGa4(ga4({ en: 'user_engagement' }))).includes('ga4-reserved-event'));
});

test('no crash on odd payloads', () => {
  const tt = classifyRequest({ url: 'https://analytics.tiktok.com/api/v2/pixel', body: JSON.stringify({ event: 123, context: { pixel: { code: 'C4ABCDEFGHIJKLMNOPQR' } } }) });
  assert.doesNotThrow(() => validatePixelHealth(tt));
  assert.deepEqual(ecommerceOf({ platform: 'meta', params: { 'cd[contents]': '[null,{"id":"A"}]' } }).contentIds, ['A']);
});

test('consent-missing is only a warning for a bare GTM load without a CMP', () => {
  const r = runChecks({ url: 'u', hits: classifyRequest({ url: 'https://www.googletagmanager.com/gtm.js?id=GTM-ABC' }), probe: { cmps: [] } });
  assert.equal(r.findings.find(f => f.id === 'consent-missing').severity, 'warning');
});

test('repeated Meta events without event_id are info, with the same event_id a warning', () => {
  const m = (eid) => classifyRequest({ url: `https://www.facebook.com/tr/?id=1234567890123&ev=AddToCart${eid ? `&eid=${eid}` : ''}` });
  assert.equal(validateMeta([...m(), ...m()]).find(f => f.id === 'meta-multiple-activation').severity, 'info');
  assert.equal(validateMeta([...m('e1'), ...m('e1')]).find(f => f.id === 'meta-multiple-activation').severity, 'warning');
});

test('diff treats the same rule on a different tag as a change', () => {
  const d = diffFindings([{ id: 'duplicate-pageview-meta', title: 'A', severity: 'critical', platform: 'meta', tagId: '1' }],
    [{ id: 'duplicate-pageview-meta', title: 'B', severity: 'critical', platform: 'meta', tagId: '2' }]);
  assert.equal(d.added.length, 1);
  assert.equal(d.resolved.length, 1);
});

test('Google Ads ccm/collect pings are detected; look-alike hosts are not', () => {
  assert.equal(classifyRequest({ url: 'https://www.google.com/ccm/collect?en=page_view&tid=AW-1&gcs=G111' })[0].platform, 'gads');
  assert.deepEqual(classifyRequest({ url: 'https://evilgoogle.com/pagead/conversion/1/?label=x' }), []);
});
