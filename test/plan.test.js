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

test('free-launch switch: every feature unlocked, labelled Free, no upgrade prompts', async () => {
  stubChrome('normal');
  const { getPlan, planLabel, allFree } = await import(`../src/plan.js?launch`);
  assert.equal(allFree({ allFree: true }), true);
  assert.equal(await getPlan({ allFree: true }), 'pro', 'all limits are the full tier');
  assert.equal(planLabel('pro', { allFree: true }), 'Free');
  assert.equal(planLabel('pro', { allFree: false }), 'Pro');
});

test('paid build: licensing on, Dodo IDs filled in for the selected mode', async () => {
  const { LICENSE_CONFIG: c } = await import('../src/license-config.js');
  assert.equal(c.allFree, false);
  assert.equal(c.enabled, true);
  assert.equal(c.provider, 'dodo');
  assert.match(c.storeId || '', /^bus_/, `storeId missing for mode ${c.mode}`);
  assert.ok(Object.keys(c.products).length >= 2, 'monthly and yearly products');
  assert.ok(Object.keys(c.products).every(id => id.startsWith('pdt_')));
  assert.match(c.manageUrl || '', /^https:\/\/(test\.)?customer\.dodopayments\.com\/login\/bus_/);
});

test('free-launch users keep Pro until the cut-off date, new installs do not', async () => {
  stubChrome('normal');
  const { isLaunchUser, launchProActive } = await import(`../src/plan.js?grandfather`);
  const cfg = { launchUsersProUntil: '2027-01-31', paidSinceVersion: '1.2.0' };
  assert.equal(isLaunchUser('1.1.0', cfg), true);
  assert.equal(isLaunchUser('<=1.0.3', cfg), true);
  assert.equal(isLaunchUser('0.4.2', cfg), true);
  assert.equal(isLaunchUser('1.1.10', cfg), true);
  assert.equal(isLaunchUser('1.2.0', cfg), false);
  assert.equal(isLaunchUser('1.10.0', cfg), false);
  assert.equal(isLaunchUser('2.0.0', cfg), false);
  assert.equal(isLaunchUser(undefined, cfg), false);
  assert.equal(launchProActive('1.1.0', cfg, Date.parse('2027-01-31T20:00:00Z')), true);
  assert.equal(launchProActive('1.1.0', cfg, Date.parse('2027-02-01T00:00:01Z')), false);
  assert.equal(launchProActive('1.2.0', cfg, Date.parse('2026-12-01T00:00:00Z')), false);
  assert.equal(launchProActive('1.1.0', { ...cfg, launchUsersProUntil: null }, 0), false);
});

test('getPlan: launch user without a key gets Pro; with no install record gets Free', async () => {
  const cfg = { allFree: false, enabled: true, launchUsersProUntil: '2999-01-01', paidSinceVersion: '1.2.0', revalidateDays: 3, graceDays: 7 };
  stubChrome('normal', { installedVersion: '1.1.0' });
  const a = await import(`../src/plan.js?gf1`);
  assert.equal(await a.getPlan(cfg), 'pro');
  stubChrome('normal', {});
  const b = await import(`../src/plan.js?gf2`);
  assert.equal(await b.getPlan(cfg), 'free');
});
