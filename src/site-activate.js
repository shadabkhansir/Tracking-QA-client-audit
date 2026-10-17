// Messages from the thank-you page on thegrowthfolks.com (externally_connectable). Two requests only:
// "ping" (is the extension installed, which plan is on) and "activate" (activate the licence key from checkout).
export const SITE_ORIGIN = 'https://thegrowthfolks.com';

export async function handleSiteMessage(msg, sender, { activate, getPlan }) {
  if (sender?.origin !== SITE_ORIGIN || !msg || typeof msg !== 'object') return { ok: false, error: 'Not allowed.' };
  const version = chrome.runtime.getManifest().version;
  if (msg.type === 'tgf-ping') return { ok: true, version, plan: await getPlan() };
  if (msg.type === 'tgf-activate') {
    const key = String(msg.key || '').trim();
    if (!key || key.length > 200) return { ok: false, error: 'Enter your licence key.' };
    const r = await activate(key);
    return r.ok ? { ok: true, version, plan: r.state.plan } : { ok: false, error: r.error };
  }
  return { ok: false, error: 'Unknown request.' };
}
