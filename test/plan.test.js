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
  assert.equal(await getPlan({ allFree: false, enabled: false }), 'free');
});

test('developer Pro toggle works on unpacked installs', async () => {
  stubChrome('development', { plan: 'pro' });
  const { getPlan } = await import(`../src/plan.js?dev`);
  assert.equal(await getPlan({ allFree: false, enabled: false }), 'pro');
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

test('free launch: every feature unlocked, labelled Free, no upgrade prompts', async () => {
  stubChrome('normal');
  const { getPlan, planLabel, allFree } = await import(`../src/plan.js?launch`);
  const { LICENSE_CONFIG } = await import('../src/license-config.js');
  assert.equal(LICENSE_CONFIG.allFree, true, 'store build ships with the free launch on');
  assert.equal(allFree(), true);
  assert.equal(await getPlan(), 'pro', 'all limits are the full tier');
  assert.equal(planLabel('pro'), 'Free');
  assert.equal(planLabel('pro', { allFree: false }), 'Pro');
});
