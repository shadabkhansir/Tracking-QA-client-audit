import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.chrome = { runtime: { getManifest: () => ({ version: '9.9.9' }) } };
const { handleSiteMessage } = await import('../src/site-activate.js');

const site = { origin: 'https://thegrowthfolks.com' };
const deps = (result = { ok: true, state: { plan: 'pro' } }) => {
  const calls = [];
  return { calls, activate: async k => { calls.push(k); return result; }, getPlan: async () => 'free' };
};

test('only thegrowthfolks.com may talk to the extension', async () => {
  const d = deps();
  for (const origin of ['https://evil.example', 'http://thegrowthfolks.com', 'https://thegrowthfolks.com.evil.example', undefined]) {
    const r = await handleSiteMessage({ type: 'tgf-activate', key: 'K' }, { origin }, d);
    assert.equal(r.ok, false);
  }
  assert.equal(d.calls.length, 0);
});

test('ping reports version and plan', async () => {
  assert.deepEqual(await handleSiteMessage({ type: 'tgf-ping' }, site, deps()), { ok: true, version: '9.9.9', plan: 'free' });
});

test('activate passes the trimmed key and returns the plan or the error', async () => {
  const d = deps();
  assert.deepEqual(await handleSiteMessage({ type: 'tgf-activate', key: '  ABC-123 ' }, site, d), { ok: true, version: '9.9.9', plan: 'pro' });
  assert.deepEqual(d.calls, ['ABC-123']);
  const bad = deps({ ok: false, error: 'This licence key does not exist.' });
  assert.deepEqual(await handleSiteMessage({ type: 'tgf-activate', key: 'X' }, site, bad), { ok: false, error: 'This licence key does not exist.' });
  assert.equal((await handleSiteMessage({ type: 'tgf-activate', key: '' }, site, d)).ok, false);
  assert.equal((await handleSiteMessage({ type: 'nope' }, site, d)).ok, false);
});
