import { getBrand, setBrand, getSettings, setSettings } from '../src/storage.js';
import { wireTgfLinks } from '../src/brand.js';
import { getPlan, setPlan, LIMITS } from '../src/plan.js';

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
  $('plan-name').textContent = plan === 'pro' ? 'Pro' : 'Free';
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

wireTgfLinks(document, 'options');
load();
