import { getBrand, setBrand, getSettings, setSettings } from '../src/storage.js';
import { wireTgfLinks } from '../src/brand.js';
import { getPlan, setPlan, LIMITS, upgradeUrl, allFree, planLabel } from '../src/plan.js';
import { LICENSE_CONFIG } from '../src/license-config.js';
import { activateLicense, deactivateLicense, getLicense, revalidateIfDue, planFromLicense } from '../src/license.js';

const $ = id => document.getElementById(id);
const FIELDS = ['agencyName', 'contact', 'preparedFor', 'brandColor', 'ctaText', 'ctaUrl'];
const MAX_LOGO_BYTES = 300 * 1024;
let logoDataUrl = '';

async function load() {
  const brand = await getBrand();
  FIELDS.forEach(f => { $(f).value = brand[f] || ''; });
  setLogo(brand.logoDataUrl);
  const settings = await getSettings();
  $('showCredit').checked = settings.showCredit !== false;
  $('idLabels').value = Object.entries(settings.idLabels || {}).map(([k, v]) => `${k} = ${v}`).join('\n');
  $('customProviders').value = (settings.customProviders || []).map(p => [p.name, p.match, p.idParam, p.eventParam].join(' | ')).join('\n');

  const plan = await getPlan();
  $('plan-name').textContent = planLabel(plan);
  if (allFree()) {
    document.querySelector('#plan-name').closest('fieldset').querySelector('.hint').textContent =
      'Every feature is free during launch: white-label reports (your logo, colours and call-to-action), "changes since last audit", 50-page scans, scheduled monitoring with alerts and 500 saved audits.';
    document.querySelectorAll('.badge.pro').forEach(b => { b.hidden = true; });
  }
  await renderLicense();
  $('branding').classList.toggle('locked', !LIMITS[plan].customBranding);
  $('dev-pro').checked = plan === 'pro';

  // management.getSelf needs no permission; only unpacked installs see the Pro toggle.
  const self = await chrome.management?.getSelf?.().catch(() => null);
  $('dev-toggle').hidden = self?.installType !== 'development';
}

function setLogo(url) {
  logoDataUrl = url || '';
  $('logo-preview').hidden = !logoDataUrl;
  $('logo-preview').src = logoDataUrl;
}

$('logo').addEventListener('change', () => {
  const file = $('logo').files[0];
  if (!file) return;
  if (file.size > MAX_LOGO_BYTES) { alert('Logo must be 300 KB or smaller.'); $('logo').value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => setLogo(reader.result);
  reader.readAsDataURL(file);
});

$('showCredit').addEventListener('change', async () => {
  await setSettings({ showCredit: $('showCredit').checked });
  $('status').textContent = 'Saved';
  setTimeout(() => { $('status').textContent = ''; }, 1500);
});

$('clear-logo').addEventListener('click', () => { setLogo(''); $('logo').value = ''; });

$('dev-pro').addEventListener('change', async () => {
  await setPlan($('dev-pro').checked ? 'pro' : 'free');
  load();
});

const parseLabels = text => Object.fromEntries(text.split('\n').map(l => l.split('=')).filter(p => p.length >= 2 && p[0].trim())
  .map(([k, ...v]) => [k.trim(), v.join('=').trim()]).filter(([, v]) => v));
const parseProviders = text => text.split('\n').map(l => l.split('|').map(x => x.trim())).filter(p => p[0] && p[1])
  .map(([name, match, idParam = '', eventParam = '']) => ({ name, match, idParam, eventParam }));

$('save').addEventListener('click', async () => {
  const brand = Object.fromEntries(FIELDS.map(f => [f, $(f).value.trim()]));
  await setBrand({ ...brand, logoDataUrl });
  await setSettings({ idLabels: parseLabels($('idLabels').value), customProviders: parseProviders($('customProviders').value) });
  $('status').textContent = 'Saved';
  setTimeout(() => { $('status').textContent = ''; }, 1500);
});

// ---- Licence (shown only once LICENSE_CONFIG.enabled is switched on) --------------------------------------
async function renderLicense() {
  $('license-box').hidden = !LICENSE_CONFIG.enabled;
  if (!LICENSE_CONFIG.enabled) return;
  document.querySelector('#license-box').closest('fieldset').querySelector('.hint').textContent =
    'Pro: white-label reports (your logo, colours, CTA, no credit line), "changes since last audit" in reports, 50-page scans, scheduled monitoring with alerts, 500 saved audits. 7-day free trial.';
  $('license-buy').href = upgradeUrl('options-plan');
  $('license-manage').href = LICENSE_CONFIG.manageUrl;
  const state = await getLicense();
  const active = planFromLicense(state) !== 'free';
  $('license-deactivate').hidden = !state;
  $('license-buy').hidden = active;
  $('license-key').value = state?.key ? `${state.key.slice(0, 4)}…${state.key.slice(-4)}` : '';
  $('license-key').disabled = !!state;
  $('license-activate').hidden = !!state;
  $('license-status').textContent = !state ? 'Free plan. Buy Pro, then paste the licence key from your email.'
    : active ? `Active: ${state.productName || 'Pro'}${state.variantName ? ` (${state.variantName})` : ''}. Last checked ${new Date(state.validatedAt).toLocaleDateString()}.`
      : 'This licence is no longer active (expired, cancelled or refunded). Deactivate it here and enter a current key.';
}

$('license-activate').addEventListener('click', async () => {
  $('license-activate').disabled = true;
  $('license-status').textContent = 'Checking…';
  const r = await activateLicense($('license-key').value);
  $('license-activate').disabled = false;
  if (!r.ok) { $('license-status').textContent = r.error; return; }
  load();
});

$('license-deactivate').addEventListener('click', async () => {
  if (!confirm('Deactivate Pro on this browser? You can activate the same key again later or on another browser.')) return;
  await deactivateLicense();
  load();
});

wireTgfLinks(document, 'options');
if (LICENSE_CONFIG.enabled) revalidateIfDue().catch(() => {}).finally(load);
load();
