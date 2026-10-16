// v1 "advanced" features: ChatGPT Ads (OpenAI) decoder and checks, per-vendor consent timeline, Meta sensitive-data pre-check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyRequest } from '../src/detectors.js';
import { runChecks } from '../src/checks.js';
import { buildConsentTimeline, timelineFindings } from '../src/consent-timeline.js';
import { validateMetaSensitive } from '../src/validators.js';

const fixture = name => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const beacon = name => { const f = JSON.parse(fixture(name)); return classifyRequest({ url: f.url, method: 'POST', body: JSON.stringify(f.body) }); };
const ids = r => r.findings.map(f => f.id);
let t = 1000;
const at = (hits, ts) => hits.map(h => ({ ...h, ts: ts ?? (t += 10) }));

// ---- OpenAI decoder ------------------------------------------------------------------------------
test('OpenAI beacon body: one hit per event, click id and user fields carried, diagnostics marked internal', () => {
  const hits = beacon('openai-beacon.json');
  assert.equal(hits.length, 3);
  assert.deepEqual(hits.map(h => h.event), ['page_viewed', 'order_created', 'oai::diagnostic']);
  assert.ok(hits.every(h => h.platform === 'openai' && h.id === 'px_test123'));
  assert.equal(hits[1].params['data.amount'], 259900);
  assert.equal(hits[1].params.oppref, 'opp_abc123xyz');
  assert.equal(hits[1].params['user.country'], 'IN');
  assert.equal(hits[2].internal, true);
});

test('OpenAI SDK script, image tag and browser Conversions API call are classified', () => {
  assert.equal(classifyRequest({ url: 'https://bzrcdn.openai.com/sdk/oaiq.min.js' })[0].kind, 'script');
  const [img] = classifyRequest({ url: fixture('openai-image-tag.txt').trim() });
  assert.equal(img.event, 'order_created');
  assert.equal(img.params['data.amount'], '25.99');
  assert.equal(img.params.id, 'order-1002');
  const [capi] = classifyRequest({ url: 'https://bzr.openai.com/v1/events?pid=px_test123', method: 'POST', body: '{"events":[]}' });
  assert.equal(capi.capiInBrowser, true);
  assert.deepEqual(classifyRequest({ url: 'https://api.ads.openai.com/v1/campaigns' }), []);
});

test('Healthy OpenAI setup: click id captured, no OpenAI warnings, diagnostics ignored', () => {
  const hits = at(beacon('openai-beacon.json'));
  const r = runChecks({ url: 'https://shop.example.com/?oppref=opp_abc123xyz', hits });
  assert.ok(ids(r).includes('openai-oppref-captured'));
  assert.ok(!r.findings.some(f => f.id.startsWith('openai-') && f.severity !== 'pass'), JSON.stringify(r.findings.filter(f => f.id.startsWith('openai'))));
  assert.ok(!ids(r).includes('pii-leak'), 'hashed email + clear country are fine');
});

test('Misconfigured OpenAI events: unknown name, bad custom name, amount format, missing currency, missing event id, raw email', () => {
  const hits = at([...beacon('openai-bad-beacon.json'), ...classifyRequest({ url: fixture('openai-image-tag.txt').trim() })]);
  const r = runChecks({ url: 'https://shop.example.com/', hits });
  for (const id of ['openai-unknown-event', 'openai-custom-name', 'openai-amount-format', 'openai-no-event-id', 'pii-leak']) assert.ok(ids(r).includes(id), id);
  const pii = r.findings.find(f => f.id === 'pii-leak');
  assert.ok(pii.pii.some(p => p.platform === 'openai' && p.param === 'user.email_sha256'));
  assert.ok(!JSON.stringify(r).includes('jane@example.com'), 'raw email never stored in results');
});

test('oppref on the landing URL but never captured is flagged; Conversions API in the browser is critical', () => {
  const hits = at([
    ...classifyRequest({ url: 'https://bzr.openai.com/v1/sdk/events?pid=px1&event=order_created&event_id=o1&data%5Btype%5D=contents&data%5Bamount%5D=100&data%5Bcurrency%5D=USD' }),
    ...classifyRequest({ url: 'https://bzr.openai.com/v1/events?pid=px1', method: 'POST', body: '{}' }),
  ]);
  const r = runChecks({ url: 'https://shop.example.com/landing?oppref=opp_1', hits });
  assert.ok(ids(r).includes('openai-oppref-missing'));
  assert.equal(r.findings.find(f => f.id === 'openai-capi-in-browser').severity, 'critical');
  const withCookie = runChecks({ url: 'https://shop.example.com/landing?oppref=opp_1', hits, cookies: [{ name: '__oppref', domain: 'shop.example.com' }] });
  assert.ok(ids(withCookie).includes('openai-oppref-captured'));
});

// ---- Consent timeline ----------------------------------------------------------------------------
const ga = (gcs, gcd) => classifyRequest({ url: `https://region1.google-analytics.com/g/collect?v=2&tid=G-T1&en=page_view&gcs=${gcs}&gcd=${gcd}` });
const meta = () => classifyRequest({ url: 'https://www.facebook.com/tr/?id=111&ev=PageView&dl=https%3A%2F%2Fx.com%2F' });
const uet = asc => classifyRequest({ url: `https://bat.bing.com/action/0?ti=123&evt=pageLoad${asc ? `&asc=${asc}` : ''}` });
const openai = () => classifyRequest({ url: 'https://bzr.openai.com/v1/sdk/events?pid=px1&event=page_viewed&data%5Btype%5D=contents' });
const clarity = () => classifyRequest({ url: 'https://www.clarity.ms/tag/abc123' }).map(h => ({ ...h, kind: 'hit' }));
const verdicts = tl => Object.fromEntries(tl.vendors.map(v => [v.platform, v.verdict]));

test('Timeline: Meta before the choice fails; Google denied cookieless pings pass; UET D→G passes', () => {
  const pre = at([...ga('G100', '13p3p3p2p5l1'), ...meta(), ...uet('D')], 1100);
  const post = at([...ga('G111', '13r3r3r2r5l1'), ...uet('G')], 1600);
  const tl = buildConsentTimeline({ hits: pre, postHits: post, test: { mode: 'accept', accepted: true, tChoice: 1500 }, cmps: ['OneTrust'], t0: 1000 });
  assert.deepEqual(verdicts(tl), { ga4: 'pass', uet: 'pass', meta: 'before' });
  assert.equal(tl.choiceMs, 500);
  assert.equal(tl.vendors.find(v => v.platform === 'meta').firstMs, 100);
  const f = timelineFindings(tl);
  assert.equal(f[0].id, 'consent-timeline-fail');
  assert.match(f[0].title, /Meta Pixel fires before/);
});

test('Timeline: UET without asc warns; UET still D after accept = update missing; OpenAI after reject fails; Clarity is cookieless', () => {
  const noAsc = buildConsentTimeline({ hits: at(uet(null), 1100), test: null, cmps: ['Cookiebot'], t0: 1000 });
  assert.equal(verdicts(noAsc).uet, 'noSignal');
  assert.ok(timelineFindings(noAsc).some(f => f.id === 'uet-consent-missing'));

  const stuck = buildConsentTimeline({ hits: at(uet('D'), 1100), postHits: at(uet('D'), 1600), test: { mode: 'accept', accepted: true, tChoice: 1500 }, cmps: ['Cookiebot'], t0: 1000 });
  assert.equal(verdicts(stuck).uet, 'updateMissing');
  assert.ok(timelineFindings(stuck).some(f => f.id === 'consent-update-missing'));

  const rej = buildConsentTimeline({ hits: at(clarity(), 1100), postHits: at(openai(), 1600), test: { mode: 'reject', accepted: true, tChoice: 1500 }, cmps: ['Didomi'], t0: 1000 });
  assert.deepEqual(verdicts(rej), { openai: 'afterReject', clarity: 'cookieless' });
  assert.match(timelineFindings(rej)[0].title, /ChatGPT Ads \(OpenAI\) tracks after the visitor rejects/);
});

test('Timeline: without a banner test a returning visitor is not accused; denied-on-wire still fails', () => {
  const returning = buildConsentTimeline({ hits: at([...ga('G111', '13v3v3v2v5l1'), ...meta()], 1100), cmps: ['OneTrust'], t0: 1000 });
  assert.equal(verdicts(returning).meta, 'unknown');
  assert.equal(timelineFindings(returning).length, 0);
  const denied = buildConsentTimeline({ hits: at([...ga('G100', '13p3p3p2p5l1'), ...meta()], 1100), cmps: ['OneTrust'], t0: 1000 });
  assert.equal(verdicts(denied).meta, 'before');
});

test('Timeline: no banner means no verdicts, and a clean run passes', () => {
  const none = buildConsentTimeline({ hits: at(meta(), 1100), cmps: [], t0: 1000 });
  assert.equal(none.banner, false);
  assert.deepEqual(timelineFindings(none), []);
  const clean = buildConsentTimeline({ hits: at(ga('G100', '13p3p3p2p5l1'), 1100), postHits: at([...meta(), ...ga('G111', '13r3r3r2r5l1')], 1600), test: { mode: 'accept', accepted: true, tChoice: 1500 }, cmps: ['OneTrust'], t0: 1000 });
  assert.deepEqual(timelineFindings(clean).map(f => f.id), ['consent-timeline-pass']);
});

test('runChecks stores the timeline and does not double-score the same consent failure', () => {
  const pre = at([...ga('G100', '13p3p3p2p5l1'), ...meta()], 1100);
  const r = runChecks({ url: 'https://x.com/', hits: pre, probe: { cmps: ['OneTrust'], dataLayer: [] }, t0: 1000 });
  assert.ok(r.consentTimeline.vendors.length >= 2);
  assert.ok(ids(r).includes('consent-timeline-fail'));
  assert.ok(!ids(r).includes('pixels-ignore-consent'), 'superseded by the timeline finding');
});

// ---- Meta sensitive-data pre-check ---------------------------------------------------------------
const metaHit = params => classifyRequest({ url: `https://www.facebook.com/tr/?${new URLSearchParams({ id: '111', ...params })}` });

test('Meta sensitive data: health terms in path and UTM, and in a custom event name, are flagged with where they were found', () => {
  const [f] = validateMetaSensitive([
    ...metaHit({ ev: 'PageView', dl: 'https://clinic.example.com/conditions/diabetes-care?utm_campaign=anxiety-relief' }),
    ...metaHit({ ev: 'WeightLossQuizCompleted', dl: 'https://shop.example.com/quiz' }),
  ]);
  assert.equal(f.id, 'meta-sensitive-data');
  assert.equal(f.severity, 'warning');
  assert.match(f.detail, /"diabetes"/);
  assert.match(f.detail, /"anxiety"/);
  assert.match(f.detail, /"weight-loss"/);
  assert.match(f.detail, /UTM parameters/);
  assert.match(f.detail, /custom event name/);
  assert.match(f.title, /May trigger Meta data restrictions/);
});

test('Meta sensitive data: neutral pages, standard events, near-misses and domains are not flagged', () => {
  assert.deepEqual(validateMetaSensitive([
    ...metaHit({ ev: 'Purchase', dl: 'https://shop.example.com/products/therapeutic-grade-oil?utm_source=meta' }),
    ...metaHit({ ev: 'Lead', dl: 'https://cancer-free-insurance.example.com/' }),
    ...metaHit({ ev: 'ViewContent', dl: 'https://shop.example.com/standard-delivery' }),
  ]), []);
});

test('Meta sensitive data reaches the audit result', () => {
  const r = runChecks({ url: 'https://x.com/', hits: at(metaHit({ ev: 'PageView', dl: 'https://x.com/ivf-treatment-costs' })) });
  assert.ok(ids(r).includes('meta-sensitive-data'));
});
