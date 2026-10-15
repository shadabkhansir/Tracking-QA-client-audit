// Provider-neutral licence keys (Dodo Payments or Lemon Squeezy), shared by every The Growth Folks extension.
// Per-extension settings live in license-config.js.
// Network calls happen only after the user enters a key, and then at most every `revalidateDays`.
import { LICENSE_CONFIG } from './license-config.js';

const STATE_KEY = 'license';
const DAY = 86400000;

const chromeStorage = {
  get: async key => (await chrome.storage.local.get(key))[key],
  set: async (key, value) => chrome.storage.local.set({ [key]: value }),
  remove: async key => chrome.storage.local.remove(key),
};

function defaults(deps = {}) {
  return {
    cfg: deps.cfg || LICENSE_CONFIG,
    storage: deps.storage || chromeStorage,
    fetchImpl: deps.fetchImpl || ((...a) => fetch(...a)),
    now: deps.now || (() => Date.now()),
  };
}

// ---- Providers: each returns { ok, network, error, status, expiresAt, instanceId, meta } -------------------
export const providers = {
  lemonsqueezy: {
    async call(action, fields, fetchImpl) {
      let res;
      try {
        res = await fetchImpl(`https://api.lemonsqueezy.com/v1/licenses/${action}`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(fields).toString(),
        });
      } catch {
        return { ok: false, network: true, error: 'Could not reach the licence server.' };
      }
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON error page */ }
      if (res.status >= 500 || res.status === 429) return { ok: false, network: true, error: 'Licence server unavailable. Try again later.' };
      const flag = { activate: 'activated', validate: 'valid', deactivate: 'deactivated' }[action];
      return {
        ok: data[flag] === true,
        network: false,
        error: data.error || (data[flag] ? null : 'This licence key is not valid.'),
        status: data.license_key?.status || null,
        expiresAt: data.license_key?.expires_at ? Date.parse(data.license_key.expires_at) : null,
        instanceId: data.instance?.id || null,
        meta: {
          storeId: data.meta?.store_id ?? null,
          productId: data.meta?.product_id ?? null,
          variantId: data.meta?.variant_id ?? null,
          productName: data.meta?.product_name || '',
          variantName: data.meta?.variant_name || '',
        },
      };
    },
    activate(key, instanceName, fetchImpl) { return this.call('activate', { license_key: key, instance_name: instanceName }, fetchImpl); },
    validate(key, instanceId, fetchImpl) { return this.call('validate', { license_key: key, instance_id: instanceId }, fetchImpl); },
    deactivate(key, instanceId, fetchImpl) { return this.call('deactivate', { license_key: key, instance_id: instanceId }, fetchImpl); },
  },
};

// Dodo Payments (India-friendly Merchant of Record; individuals can sell). Public licence endpoints, no API key.
// Activation returns the business and product the key belongs to; validation only says valid/invalid, so the
// product and plan recorded at activation are kept.
providers.dodo = {
  base(cfg) { return cfg.mode === 'test' ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com'; },
  async call(cfg, path, body, fetchImpl) {
    let res;
    try {
      res = await fetchImpl(`${this.base(cfg)}/licenses/${path}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      return { network: true };
    }
    let data = {};
    try { data = await res.json(); } catch { /* empty body */ }
    return { network: res.status >= 500 || res.status === 429, status: res.status, ok: res.ok, data };
  },
  errorFor(status) {
    return { 404: 'This licence key does not exist.', 403: 'This licence key is not active (expired, refunded or disabled).', 422: 'This licence key has reached its activation limit. Deactivate it on another browser first.' }[status]
      || 'This licence key could not be activated.';
  },
  async activate(key, instanceName, fetchImpl, cfg) {
    const r = await this.call(cfg, 'activate', { license_key: key, name: instanceName }, fetchImpl);
    if (r.network) return { ok: false, network: true, error: 'Could not reach the licence server. Try again later.' };
    if (!r.ok) return { ok: false, network: false, error: this.errorFor(r.status) };
    return { ok: true, network: false, error: null, status: 'active', expiresAt: null, instanceId: r.data.id || null,
      meta: { storeId: r.data.business_id ?? null, productId: r.data.product?.product_id ?? null, variantId: null, productName: r.data.product?.name || '', variantName: '' } };
  },
  async validate(key, instanceId, fetchImpl, cfg) {
    const r = await this.call(cfg, 'validate', { license_key: key, license_key_instance_id: instanceId }, fetchImpl);
    if (r.network) return { ok: false, network: true };
    const valid = r.ok && r.data.valid === true;
    return { ok: valid, network: false, error: valid ? null : 'This licence key is no longer valid.', status: valid ? 'active' : 'inactive', expiresAt: null, meta: null };
  },
  async deactivate(key, instanceId, fetchImpl, cfg) {
    const r = await this.call(cfg, 'deactivate', { license_key: key, license_key_instance_id: instanceId }, fetchImpl);
    return { ok: !!r.ok, network: !!r.network };
  },
};

// Which plan a key grants in this extension. Keys from another store, or for a product this extension does not
// sell or include in a bundle, grant nothing.
export function entitlementFor(meta, cfg = LICENSE_CONFIG) {
  if (!meta || !cfg.storeId || String(meta.storeId) !== String(cfg.storeId)) return null;
  const pick = (map, id) => (id !== null && id !== undefined && Object.hasOwn(map || {}, String(id)) ? map[String(id)] : null);
  return pick(cfg.variants, meta.variantId) || pick(cfg.products, meta.productId) || pick(cfg.bundleProducts, meta.productId);
}

// Effective plan: a validated key keeps working offline for revalidateDays + graceDays, then falls back to free.
export function planFromLicense(state, now = Date.now(), cfg = LICENSE_CONFIG) {
  if (!state || !state.valid || !state.plan) return 'free';
  if (state.expiresAt && now > state.expiresAt + cfg.graceDays * DAY) return 'free';
  if (now - (state.validatedAt || 0) > (cfg.revalidateDays + cfg.graceDays) * DAY) return 'free';
  return state.plan;
}

export async function getLicense(deps) {
  const { storage } = defaults(deps);
  return (await storage.get(STATE_KEY)) || null;
}

async function installId(storage) {
  let id = await storage.get('installId');
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    await storage.set('installId', id);
  }
  return id;
}

export async function activateLicense(rawKey, deps) {
  const { cfg, storage, fetchImpl, now } = defaults(deps);
  const key = String(rawKey || '').trim();
  if (!key) return { ok: false, error: 'Enter your licence key.' };
  const provider = providers[cfg.provider];
  const res = await provider.activate(key, `${cfg.extension} · ${await installId(storage)}`, fetchImpl, cfg);
  if (!res.ok) return { ok: false, error: res.error };
  const plan = entitlementFor(res.meta, cfg);
  if (!plan) {
    // Free the activation slot we just used, so a mistaken key does not burn an activation.
    if (res.instanceId) await provider.deactivate(key, res.instanceId, fetchImpl, cfg);
    return { ok: false, error: 'This key is valid but is not for this extension.' };
  }
  const state = { key, instanceId: res.instanceId, plan, valid: true, status: res.status, expiresAt: res.expiresAt,
    productName: res.meta.productName, variantName: res.meta.variantName, validatedAt: now(), checkedAt: now() };
  await storage.set(STATE_KEY, state);
  return { ok: true, state };
}

// Re-checks the key when due. Network failures keep the current state (grace period); an explicit "not valid"
// answer (expired, disabled, refunded, instance removed) downgrades immediately.
export async function revalidateIfDue(deps, { force = false } = {}) {
  const { cfg, storage, fetchImpl, now } = defaults(deps);
  if (!cfg.enabled) return null;
  const state = await getLicense({ storage });
  if (!state?.key || !state.instanceId) return state;
  if (!force && now() - (state.checkedAt || 0) < cfg.revalidateDays * DAY) return state;
  const res = await providers[cfg.provider].validate(state.key, state.instanceId, fetchImpl, cfg);
  const next = { ...state, checkedAt: now() };
  if (res.network) {
    await storage.set(STATE_KEY, next);
    return next;
  }
  // Providers that return product details on validate (Lemon Squeezy) are re-checked; others keep the plan from activation.
  const plan = !res.ok ? null : res.meta ? entitlementFor(res.meta, cfg) : state.plan;
  Object.assign(next, { valid: !!plan, plan: plan || null, status: res.status, expiresAt: res.expiresAt ?? state.expiresAt });
  if (plan) next.validatedAt = now();
  await storage.set(STATE_KEY, next);
  return next;
}

export async function deactivateLicense(deps) {
  const { cfg, storage, fetchImpl } = defaults(deps);
  const state = await getLicense({ storage });
  if (state?.key && state.instanceId) await providers[cfg.provider].deactivate(state.key, state.instanceId, fetchImpl, cfg);
  await storage.remove(STATE_KEY);
  return { ok: true };
}
