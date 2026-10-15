import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activateLicense, revalidateIfDue, deactivateLicense, planFromLicense, entitlementFor, getLicense } from '../src/license.js';

const DAY = 86400000;
const memStorage = () => { const m = new Map(); return { get: async k => m.get(k), set: async (k, v) => m.set(k, v), remove: async k => m.delete(k), m }; };
const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

const dodoCfg = { enabled: true, provider: 'dodo', mode: 'test', extension: 'tracking-qa', storeId: 'bus_me', products: { pdt_pro_m: 'pro', pdt_pro_y: 'pro' }, bundleProducts: { pdt_all: 'pro' }, variants: {}, revalidateDays: 3, graceDays: 7 };

function dodoServer({ business = 'bus_me', product = 'pdt_pro_m', activateStatus = 200, valid = true, validateStatus = 200, down = false } = {}) {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, body: JSON.parse(opts.body) });
    if (down) throw new Error('offline');
    if (url.endsWith('/activate')) return activateStatus === 200 ? json(200, { id: 'lki_1', business_id: business, name: 'x', license_key_id: 'lic_1', created_at: '', product: { product_id: product, name: 'Tracking QA Pro' }, customer: { customer_id: 'c', name: 'n', email: 'e@x.com' } }) : json(activateStatus, {});
    if (url.endsWith('/validate')) return json(validateStatus, { valid });
    if (url.endsWith('/deactivate')) return json(200, {});
    return json(404, {});
  };
  return { fetchImpl, calls };
}

test('Dodo: activation grants the plan for this extension and stores no customer email', async () => {
  const storage = memStorage();
  const { fetchImpl, calls } = dodoServer();
  const r = await activateLicense(' KEY-1 ', { cfg: dodoCfg, storage, fetchImpl, now: () => 1000 });
  assert.equal(r.ok, true);
  assert.equal(calls[0].url, 'https://test.dodopayments.com/licenses/activate');
  assert.equal(calls[0].body.license_key, 'KEY-1');
  const s = await getLicense({ storage });
  assert.equal(s.plan, 'pro');
  assert.equal(s.instanceId, 'lki_1');
  assert.ok(!JSON.stringify(s).includes('e@x.com'));
});

test('keys from another merchant or another product are rejected and the activation is released', async () => {
  for (const opts of [{ business: 'bus_other' }, { product: 'pdt_some_other_extension' }]) {
    const storage = memStorage();
    const { fetchImpl, calls } = dodoServer(opts);
    const r = await activateLicense('K', { cfg: dodoCfg, storage, fetchImpl });
    assert.equal(r.ok, false);
    assert.match(r.error, /not for this extension/);
    assert.ok(calls.some(c => c.url.endsWith('/deactivate')), 'frees the activation slot');
    assert.equal(await getLicense({ storage }), null);
  }
});

test('bundle (all-access) product unlocks this extension', async () => {
  const { fetchImpl } = dodoServer({ product: 'pdt_all' });
  const r = await activateLicense('K', { cfg: dodoCfg, storage: memStorage(), fetchImpl });
  assert.equal(r.state.plan, 'pro');
});

test('Dodo error codes give clear messages', async () => {
  const msgs = {};
  for (const st of [404, 403, 422]) msgs[st] = (await activateLicense('K', { cfg: dodoCfg, storage: memStorage(), fetchImpl: dodoServer({ activateStatus: st }).fetchImpl })).error;
  assert.match(msgs[404], /does not exist/);
  assert.match(msgs[403], /not active/);
  assert.match(msgs[422], /activation limit/);
});

test('revalidation: only when due; offline keeps Pro within grace; explicit invalid downgrades', async () => {
  const storage = memStorage();
  let t = 0;
  const now = () => t;
  await activateLicense('K', { cfg: dodoCfg, storage, fetchImpl: dodoServer().fetchImpl, now });
  const quiet = dodoServer();
  t = 1 * DAY;
  await revalidateIfDue({ cfg: dodoCfg, storage, fetchImpl: quiet.fetchImpl, now });
  assert.equal(quiet.calls.length, 0, 'not due yet');

  t = 4 * DAY;
  const s1 = await revalidateIfDue({ cfg: dodoCfg, storage, fetchImpl: dodoServer({ down: true }).fetchImpl, now });
  assert.equal(planFromLicense(s1, t, dodoCfg), 'pro', 'offline: grace');
  assert.equal(planFromLicense(s1, 11 * DAY, dodoCfg), 'free', 'grace expired');

  t = 8 * DAY;
  const s2 = await revalidateIfDue({ cfg: dodoCfg, storage, fetchImpl: dodoServer({ valid: true }).fetchImpl, now });
  assert.equal(s2.validatedAt, 8 * DAY);
  assert.equal(planFromLicense(s2, t, dodoCfg), 'pro');

  t = 12 * DAY;
  const s3 = await revalidateIfDue({ cfg: dodoCfg, storage, fetchImpl: dodoServer({ valid: false }).fetchImpl, now });
  assert.equal(planFromLicense(s3, t, dodoCfg), 'free', 'refunded/expired');
});

test('deactivate releases the activation and clears local state', async () => {
  const storage = memStorage();
  await activateLicense('K', { cfg: dodoCfg, storage, fetchImpl: dodoServer().fetchImpl });
  const srv = dodoServer();
  await deactivateLicense({ cfg: dodoCfg, storage, fetchImpl: srv.fetchImpl });
  assert.ok(srv.calls[0].url.endsWith('/deactivate'));
  assert.equal(srv.calls[0].body.license_key_instance_id, 'lki_1');
  assert.equal(await getLicense({ storage }), null);
});

test('Lemon Squeezy adapter: store check and variant override', async () => {
  const cfg = { ...dodoCfg, provider: 'lemonsqueezy', storeId: 42, products: { 100: 'pro' }, variants: {} };
  const fetchImpl = async (url) => json(200, { activated: true, error: null, license_key: { status: 'active', expires_at: null }, instance: { id: 'inst-1' }, meta: { store_id: 42, product_id: 100, variant_id: 5, product_name: 'TQA', variant_name: 'Monthly' } });
  const r = await activateLicense('K', { cfg, storage: memStorage(), fetchImpl });
  assert.equal(r.ok, true);
  assert.equal(entitlementFor({ storeId: 42, productId: 999, variantId: 5 }, { ...cfg, variants: { 5: 'pro' } }), 'pro');
  assert.equal(entitlementFor({ storeId: 7, productId: 100 }, cfg), null);
});

test('no config, no state: free; disabled config never calls the network', async () => {
  assert.equal(planFromLicense(null), 'free');
  let called = false;
  const r = await revalidateIfDue({ cfg: { ...dodoCfg, enabled: false }, storage: memStorage(), fetchImpl: async () => { called = true; } });
  assert.equal(r, null);
  assert.equal(called, false);
});
