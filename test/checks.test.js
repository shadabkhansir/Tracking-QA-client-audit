import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyRequest, parseGcs, parseGcd } from '../src/detectors.js';
import { runChecks, aggregatePages, readDataLayerConsent } from '../src/checks.js';

const ga4 = (params, body = '') => classifyRequest({
  url: `https://region1.google-analytics.com/g/collect?${new URLSearchParams({ v: '2', tid: 'G-ABC123', ...params })}`,
  method: 'POST', body,
});
const meta = params => classifyRequest({ url: `https://www.facebook.com/tr/?${new URLSearchParams({ id: '111', ...params })}` });
const ids = r => r.findings.map(f => f.id);

test('parseGcs', () => {
  assert.deepEqual(parseGcs('G100'), { ad_storage: 'denied', analytics_storage: 'denied' });
  assert.deepEqual(parseGcs('G1-1'), { ad_storage: 'unset', analytics_storage: 'granted' });
  assert.equal(parseGcs('nope'), null);
});

test('parseGcd reads default/update per signal', () => {
  const g = parseGcd('13r3p3l2v5l1');
  assert.equal(g.ad_storage.default, 'denied');
  assert.equal(g.ad_storage.effective, 'granted');
  assert.equal(g.analytics_storage.effective, 'denied');
  assert.equal(g.ad_user_data.effective, 'unset');
  assert.equal(g.ad_personalization.effective, 'granted');
});

test('GA4 batched POST body yields one hit per line', () => {
  const hits = ga4({}, 'en=page_view&dl=https%3A%2F%2Fx.com%2F\nen=scroll');
  assert.deepEqual(hits.map(h => h.event), ['page_view', 'scroll']);
  assert.equal(hits[0].id, 'G-ABC123');
});

test('script loads are classified', () => {
  assert.equal(classifyRequest({ url: 'https://www.googletagmanager.com/gtm.js?id=GTM-XYZ' })[0].platform, 'gtm');
  assert.equal(classifyRequest({ url: 'https://www.googletagmanager.com/gtag/js?id=G-ABC123' })[0].platform, 'ga4');
  assert.equal(classifyRequest({ url: 'https://connect.facebook.net/signals/config/999?v=2' })[0].id, '999');
  assert.equal(classifyRequest({ url: 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=TT1' })[0].id, 'TT1');
  assert.deepEqual(classifyRequest({ url: 'https://example.com/app.js' }), []);
});

test('TikTok JSON event body', () => {
  const [h] = classifyRequest({
    url: 'https://analytics.tiktok.com/api/v2/pixel',
    method: 'POST',
    body: JSON.stringify({ event: 'Pageview', context: { pixel: { code: 'TT1' }, page: { url: 'https://x.com/' } } }),
  });
  assert.equal(h.platform, 'tiktok');
  assert.equal(h.id, 'TT1');
  assert.equal(h.event, 'Pageview');
});

test('duplicate GA4 page_view is critical', () => {
  const hits = [...ga4({ en: 'page_view', dl: 'https://x.com/', gcd: '13v3v3v2v5l1' }), ...ga4({ en: 'page_view', dl: 'https://x.com/', gcd: '13v3v3v2v5l1' })];
  const r = runChecks({ url: 'https://x.com/', hits, probe: null });
  assert.ok(ids(r).includes('duplicate-pageview-ga4'));
  assert.ok(r.score < 100);
});

test('missing consent mode flagged; full v2 passes', () => {
  const none = runChecks({ url: 'u', hits: ga4({ en: 'page_view', dl: 'u' }), probe: null });
  assert.ok(ids(none).includes('consent-missing'));

  const v2 = runChecks({ url: 'u', hits: ga4({ en: 'page_view', dl: 'u', gcs: 'G100', gcd: '13p3p3p2p5l1' }), probe: null });
  assert.ok(ids(v2).includes('consent-v2'));
  assert.ok(!ids(v2).includes('consent-missing'));
});

test('v1-only consent (no ad_user_data / ad_personalization) is critical', () => {
  const r = runChecks({ url: 'u', hits: ga4({ en: 'page_view', dl: 'u', gcs: 'G100', gcd: '13p3p3l2l5l1' }), probe: null });
  assert.ok(ids(r).includes('consent-v1-only'));
});

test('consent set via GTM template (runtime state only, no dataLayer command) is recognised', () => {
  const probe = { dataLayer: [{ event: 'gtm.js' }], consentState: { entries: {
    ad_storage: { default: 'denied', update: null }, analytics_storage: { default: 'denied', update: null },
    ad_user_data: { default: 'denied', update: null }, ad_personalization: { default: 'denied', update: null },
  } }, cmps: ['Cookiebot'] };
  const r = runChecks({ url: 'u', hits: ga4({ en: 'page_view', dl: 'u' }), probe });
  assert.ok(ids(r).includes('consent-v2'));
  assert.ok(!ids(r).includes('consent-default-late'), 'gtm.js before CMP default must not count as late');
});

test('update without default => late default', () => {
  const r = runChecks({ url: 'u', hits: ga4({ en: 'page_view', dl: 'u', gcd: '13n3n3n2n5l1' }), probe: null });
  assert.ok(ids(r).includes('consent-default-late'));
});

test('dataLayer default after gtag config => late default', () => {
  const dl = [{ __gtag: ['js', 'x'] }, { __gtag: ['config', 'G-ABC123'] }, { __gtag: ['consent', 'default', { ad_storage: 'denied' }] }];
  assert.deepEqual(readDataLayerConsent(dl).defaultIndex, 2);
  const r = runChecks({ url: 'u', hits: ga4({ en: 'page_view', dl: 'u' }), probe: { dataLayer: dl } });
  assert.ok(ids(r).includes('consent-default-late'));
});

test('Meta pixel firing while ad_storage denied is critical', () => {
  const hits = [...ga4({ en: 'page_view', dl: 'u', gcs: 'G100', gcd: '13p3p3p2p5l1' }), ...meta({ ev: 'PageView', dl: 'u' })];
  const r = runChecks({ url: 'u', hits, probe: null });
  assert.ok(ids(r).includes('pixels-ignore-consent'));
});

test('PII: email in GA4 URL and unhashed Meta advanced matching', () => {
  const hits = [
    ...ga4({ en: 'page_view', dl: 'https://x.com/thanks?email=jane%40doe.com' }),
    ...meta({ ev: 'Lead', 'ud[em]': 'jane@doe.com' }),
  ];
  const r = runChecks({ url: 'u', hits, probe: null });
  const pii = r.findings.find(f => f.id === 'pii-leak');
  assert.ok(pii);
  assert.ok(!JSON.stringify(r).includes('jane'), 'raw PII must not end up in results');
});

test('hashed Meta advanced matching is fine', () => {
  const r = runChecks({ url: 'u', hits: meta({ ev: 'PageView', 'ud[em]': 'a'.repeat(64) }), probe: null });
  assert.ok(!ids(r).includes('pii-leak'));
});

test('no tracking at all', () => {
  const r = runChecks({ url: 'u', hits: [], probe: { dataLayer: null, cmps: [] } });
  assert.ok(ids(r).includes('no-tracking'));
});

test('aggregatePages dedupes findings and lists affected pages', () => {
  const a = runChecks({ url: 'https://x.com/a', hits: ga4({ en: 'page_view', dl: 'a' }), probe: null });
  const b = runChecks({ url: 'https://x.com/b', hits: ga4({ en: 'page_view', dl: 'b' }), probe: null });
  const site = aggregatePages([a, b]);
  const missing = site.findings.find(f => f.id === 'consent-missing');
  assert.equal(missing.pages.length, 2);
  assert.equal(site.score, Math.round((a.score + b.score) / 2));
});
