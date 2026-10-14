import { getBrand, setBrand } from '../src/storage.js';
import { getPlan, setPlan, LIMITS } from '../src/plan.js';

const $ = id => document.getElementById(id);
const FIELDS = ['agencyName', 'contact', 'preparedFor', 'brandColor'];
const MAX_LOGO_BYTES = 300 * 1024;
let logoDataUrl = '';

async function load() {
  const brand = await getBrand();
  FIELDS.forEach(f => { $(f).value = brand[f] || ''; });
  setLogo(brand.logoDataUrl);

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

$('clear-logo').addEventListener('click', () => { setLogo(''); $('logo').value = ''; });

$('dev-pro').addEventListener('change', async () => {
  await setPlan($('dev-pro').checked ? 'pro' : 'free');
  load();
});

$('save').addEventListener('click', async () => {
  const brand = Object.fromEntries(FIELDS.map(f => [f, $(f).value.trim()]));
  await setBrand({ ...brand, logoDataUrl });
  $('status').textContent = 'Saved';
  setTimeout(() => { $('status').textContent = ''; }, 1500);
});

load();
