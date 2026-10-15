import { test } from 'node:test';
import assert from 'node:assert/strict';

// Minimal chrome stub: storage.local plus management.getSelf with a configurable install type.
function stubChrome(installType, stored = {}) {
  globalThis.chrome = {
    storage: { local: { get: async k => ({ [k]: stored[k] }), set: async o => Object.assign(stored, o) } },
    management: { getSelf: async () => ({ installType }) },
  };
}

test('developer Pro toggle is ignored on store installs', async () => {
  stubChrome('normal', { plan: 'pro' });
  const { getPlan } = await import(`../src/plan.js?store`);
  assert.equal(await getPlan(), 'free');
});

test('developer Pro toggle works on unpacked installs', async () => {
  stubChrome('development', { plan: 'pro' });
  const { getPlan } = await import(`../src/plan.js?dev`);
  assert.equal(await getPlan(), 'pro');
});

test('upgrade links carry utm_content for the prompt that was clicked', async () => {
  stubChrome('normal');
  const { upgradeUrl, LIMITS } = await import(`../src/plan.js?links`);
  const u = new URL(upgradeUrl('scan-limit'));
  assert.equal(u.searchParams.get('utm_content'), 'scan-limit');
  assert.equal(u.searchParams.get('utm_medium'), 'upgrade');
  assert.equal(LIMITS.free.changesSince, false);
  assert.equal(LIMITS.pro.changesSince, true);
});
