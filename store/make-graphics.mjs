// Generates Chrome Web Store graphics from the extension's real UI.
//
//   node store/make-graphics.mjs
//
// Serves the extension folder on a fake origin, stubs the chrome.* APIs with sample data (produced by the
// extension's own detectors and checks, so findings are real), screenshots the side panel, report and
// options pages, then composes them onto branded canvases:
//   store/screenshot-N-1280x800.png, store/promo-small-440x280.png, store/marquee-1400x560.png
//
// Needs Playwright with Chromium. If `playwright` is not resolvable, set PLAYWRIGHT_MODULE to its index.mjs.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { classifyRequest } from '../src/detectors.js';
import { runChecks } from '../src/checks.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const ORIGIN = 'http://ext.local';

async function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node22/lib/node_modules/playwright/index.mjs'].filter(Boolean);
  for (const c of candidates) {
    try { return await import(c.startsWith('/') ? pathToFileURL(c).href : c); } catch { /* try next */ }
  }
  throw new Error('Playwright not found. npm i -D playwright, or set PLAYWRIGHT_MODULE.');
}

// ---- Sample data (fictional store) ------------------------------------------------------
const SITE = 'https://shop.example.com';
const T0 = Date.UTC(2026, 9, 15, 9, 30, 0);
let t = T0;
const tick = (ms = 180) => (t += ms);

function req(url, body = '', method = body ? 'POST' : 'GET') {
  return classifyRequest({ url, method, body }).map((h, i) => ({ ...h, ts: tick(), frameId: 0, requestId: `r${t}-${i}` }));
}
const qs = o => new URLSearchParams(o).toString();

const ga = (params, body = '') => req(`https://region1.google-analytics.com/g/collect?${qs({ v: '2', tid: 'G-8LM2TQ4ZRB', gtm: '45je5a40v9', _p: '1739', cid: '1283746501.1760520000', ul: 'en-us', sr: '1512x982', dl: `${SITE}/checkout/thank-you`, dt: 'Thank you | Example Shop', gcs: 'G100', gcd: '13p3p3p2p5l1', ...params })}`, body);

const hits = [
  ...req('https://www.googletagmanager.com/gtm.js?id=GTM-K7P2QX9'),
  ...req('https://www.googletagmanager.com/gtag/js?id=G-8LM2TQ4ZRB&l=dataLayer&cx=c'),
  ...ga({ en: 'page_view', _ss: '1', _fv: '1' }),
  ...req('https://connect.facebook.net/en_US/fbevents.js'),
  ...req('https://connect.facebook.net/signals/config/1234567890123456?v=2.9.170&r=stable'),
  ...req(`https://www.facebook.com/tr/?${qs({ id: '1234567890123456', ev: 'PageView', dl: `${SITE}/checkout/thank-you?email=jane.doe%40example.com`, rl: `${SITE}/checkout`, if: 'false', ts: String(t), v: '2.9.170' })}`),
  ...req('https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=C4PX7Q3RN1&lib=ttq'),
  ...ga({ en: 'purchase', cu: 'USD', 'epn.value': '129.00', pr1: 'idSKU-2041~nmTrail Running Jacket~pr129.00~qt1~caOuterwear' }),
  ...req(`https://www.facebook.com/tr/?${qs({ id: '1234567890123456', ev: 'Purchase', 'cd[value]': '129.00', 'cd[currency]': 'USD', 'cd[content_ids]': '["SKU-2041"]', 'cd[content_type]': 'product', eid: 'ord-58213', dl: `${SITE}/checkout/thank-you`, if: 'false', ts: String(t), v: '2.9.170' })}`),
  ...req('https://analytics.tiktok.com/api/v2/pixel', JSON.stringify({ event: 'CompletePayment', event_id: 'ord-58213', context: { pixel: { code: 'C4PX7Q3RN1' }, page: { url: `${SITE}/checkout/thank-you` } }, properties: { value: 119, currency: 'USD', contents: [{ content_id: 'SKU-2041', quantity: 1 }], content_type: 'product' } })),
  ...req('https://px.ads.linkedin.com/wa/?pid=5521873&url=' + encodeURIComponent(`${SITE}/checkout/thank-you`)),
  ...req('https://www.clarity.ms/tag/kq81zt6mvp'),
];

const dl = [
  { type: 'push', ts: T0 - 40, existing: true, entry: { __gtag: ['consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 }] } },
  { type: 'push', ts: T0 - 20, existing: true, entry: { 'gtm.start': T0 - 20, event: 'gtm.js' } },
  { type: 'push', ts: T0 + 400, entry: { event: 'gtm.dom' } },
  { type: 'push', ts: T0 + 600, entry: { ecommerce: null } },
  { type: 'push', ts: T0 + 650, entry: { event: 'purchase', ecommerce: { currency: 'USD', value: 129, tax: 10.32, shipping: 0, items: [{ item_id: 'SKU-2041', item_name: 'Trail Running Jacket', item_category: 'Outerwear', price: 129, quantity: 1 }] } } },
  { type: 'push', ts: T0 + 900, entry: { event: 'gtm.load' } },
  { type: 'push', ts: T0 + 1500, entry: { event: 'OneTrustLoaded', OnetrustActiveGroups: ',C0001,' } },
];

const probe = {
  url: `${SITE}/checkout/thank-you`,
  title: 'Thank you | Example Shop',
  cookieNames: ['_ga', '_ga_8LM2TQ4ZRB', '_fbp', '_ttp', 'OptanonConsent', 'cart_id'],
  hasGtag: true,
  dataLayer: dl.map(d => d.entry),
  googleTagIds: ['GTM-K7P2QX9', 'G-8LM2TQ4ZRB'],
  consentState: { entries: { ad_storage: { default: 'denied', update: null }, analytics_storage: { default: 'denied', update: null }, ad_user_data: { default: 'denied', update: null }, ad_personalization: { default: 'denied', update: null } }, wasSetLate: false, usedDefault: true, usedUpdate: false },
  metaPixels: { version: '2.9.170', ids: ['1234567890123456'] },
  tiktokPixels: { ids: ['C4PX7Q3RN1'] },
  cmps: ['OneTrust'],
  links: [],
};

const consentTest = {
  attempted: true, mode: 'reject', accepted: true, method: 'OneTrust API', reason: null,
  before: { ga4: 2, meta: 2, tiktok: 1, linkedin: 1 }, after: { ga4: 1, meta: 1, tiktok: 1 },
  signalsBefore: null, signalsAfter: null, googlePresent: true, loadedPlatforms: ['ga4', 'meta', 'tiktok', 'linkedin'],
};

const result = { ...runChecks({ url: probe.url, hits, probe, postHits: [], dlLog: dl, consentTest: null }), injectable: true, session: null };
const resultWithTest = { ...runChecks({ url: probe.url, hits, probe, postHits: [], dlLog: dl, consentTest }), injectable: true, session: null };
const audit = { id: 'demo-1', type: 'page', host: 'shop.example.com', url: probe.url, createdAt: T0 + 5000, result: resultWithTest, preparedFor: 'Example Shop', notes: 'Purchase tracking is close. The critical items below block accurate ROAS in Meta and TikTok; we can fix them in the next GTM release.' };

const storageFixture = {
  plan: 'free', // store screenshots must show what store users get (Pro is not purchasable yet)
  settings: { preserveLog: false, showCredit: true },
  brand: { agencyName: 'Northwind Analytics', brandColor: '#1f6b4f', logoDataUrl: '', contact: 'hello@northwind.example · northwind.example', preparedFor: 'Example Shop', ctaText: 'Book a 15-min fix call', ctaUrl: 'https://example.com/book' },
  audits: [audit, { ...audit, id: 'demo-0', createdAt: T0 - 7 * 864e5, result }],
  monitors: [],
};

// ---- chrome.* stub (runs in the page) ----------------------------------------------------
function chromeStub({ storage, tabState, auditResult, tabUrl }) {
  const listeners = [];
  const ev = () => ({ addListener: fn => listeners.push(fn), removeListener() {} });
  const local = JSON.parse(JSON.stringify(storage));
  const get = keys => {
    if (keys == null) return { ...local };
    const ks = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
    return Object.fromEntries(ks.filter(k => k in local).map(k => [k, local[k]]));
  };
  window.chrome = {
    runtime: {
      sendMessage: async msg => {
        if (msg.type === 'get-tab-state') return tabState;
        if (msg.type === 'audit-tab') return auditResult;
        return { ok: true };
      },
      onMessage: ev(), getURL: p => `/${p}`, openOptionsPage() {}, id: 'demo',
    },
    storage: { local: { get: async k => get(k), set: async o => Object.assign(local, o) }, session: { get: async () => ({}), set: async () => {} }, onChanged: ev() },
    tabs: { query: async () => [{ id: 7, url: tabUrl }], get: async () => ({ id: 7, url: tabUrl }), onActivated: ev(), onUpdated: ev(), create: async () => ({}), reload() {} },
    windows: { create() {} }, permissions: { request: async () => true },
    management: { getSelf: async () => ({ installType: 'normal' }) },
  };
}

// ---- Composition --------------------------------------------------------------------------
// Values from src/brand/tokens.css (The Growth Folks® design system).
const C = { green: '#1f6b4f', ink: '#16181d', inkSoft: '#4a4f5a', paper: '#fbfaf7', line: '#e6e3dc', white: '#ffffff' };
const FONT = "Inter, 'Inter Fallback', system-ui, -apple-system, 'Segoe UI', sans-serif";
// The bundled Inter files, inlined so the canvases render with the brand font (setContent pages can't fetch cross-origin fonts).
const FONT_FACES = (await Promise.all([400, 600, 800].map(async w => {
  const b64 = (await readFile(path.join(root, `src/brand/fonts/inter-${w}.woff2`))).toString('base64');
  return `@font-face { font-family: 'Inter'; font-weight: ${w}; src: url(data:font/woff2;base64,${b64}) format('woff2'); }`;
}))).join('\n');
const dataUrl = buf => `data:image/png;base64,${buf.toString('base64')}`;

// TGF logo lock-up: green rounded square (radius ≈ 28%) with white "TGF", then the word mark. Inverted on green.
const mark = (size = 15, inverted = false) => `<div style="display:flex;align-items:center;gap:${Math.round(size * 0.6)}px;font:800 ${size}px/1 ${FONT};color:${inverted ? C.white : C.ink};letter-spacing:-.01em">
  <span style="display:inline-grid;place-items:center;width:${Math.round(size * 2)}px;height:${Math.round(size * 2)}px;border-radius:${Math.round(size * 0.56)}px;background:${inverted ? C.white : C.green};color:${inverted ? C.green : C.white};font-size:${Math.round(size * 0.68)}px">TGF</span>The Growth Folks®</div>`;

function canvasHtml({ eyebrow, headline, sub, shot, shotWidth, bullets = [] }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${FONT_FACES}
    * { box-sizing: border-box; margin: 0; }
    body { width: 1280px; height: 800px; overflow: hidden; background: ${C.paper}; font-family: ${FONT}; color: ${C.ink}; position: relative; }
    .band { position: absolute; right: 0; top: 0; bottom: 0; width: 560px; background: ${C.green}; }
    .copy { position: absolute; left: 72px; top: 0; bottom: 0; width: ${Math.min(540, 1280 - 70 - shotWidth - 72 - 56)}px; display: flex; flex-direction: column; justify-content: center; }
    .eyebrow { font-size: 15px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: ${C.green}; margin-bottom: 18px; }
    h1 { font-size: ${shotWidth > 500 ? 44 : 50}px; line-height: 1.06; letter-spacing: -.02em; font-weight: 800; }
    h1 em { font-style: normal; color: ${C.green}; }
    .sub { font-size: 20px; line-height: 1.5; color: ${C.inkSoft}; margin-top: 22px; }
    ul { list-style: none; padding: 0; margin-top: 26px; }
    li { font-size: 17px; line-height: 1.4; margin: 10px 0; padding-left: 30px; position: relative; color: ${C.ink}; }
    li::before { content: '✓'; position: absolute; left: 0; top: 0; color: ${C.green}; font-weight: 800; }
    .foot { position: absolute; left: 72px; bottom: 44px; }
    .shot { position: absolute; top: 50%; right: 70px; transform: translateY(-50%); width: ${shotWidth}px; border-radius: 14px; overflow: hidden;
      box-shadow: 0 30px 70px rgba(10,30,22,.35), 0 0 0 1px rgba(0,0,0,.08); background: #fff; }
    .shot img { display: block; width: 100%; }
    .shot .bar { height: 30px; background: ${C.paper}; display: flex; align-items: center; gap: 7px; padding: 0 12px; border-bottom: 1px solid ${C.line}; }
    .shot .bar i { width: 10px; height: 10px; border-radius: 50%; background: ${C.line}; display: block; }
  </style></head><body>
    <div class="band"></div>
    <div class="copy">
      <div class="eyebrow">${eyebrow}</div>
      <h1>${headline}</h1>
      ${sub ? `<p class="sub">${sub}</p>` : ''}
      ${bullets.length ? `<ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
    </div>
    <div class="foot">${mark(16)}</div>
    <div class="shot"><div class="bar"><i></i><i></i><i></i></div><img src="${shot}"></div>
  </body></html>`;
}

function promoHtml({ w, h, big }) {
  const s = big ? 1 : 0.42;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${FONT_FACES}
    * { box-sizing: border-box; margin: 0; }
    body { width: ${w}px; height: ${h}px; overflow: hidden; background: ${C.green}; font-family: ${FONT}; color: #fff; position: relative; }
    .wrap { position: absolute; left: ${Math.round(80 * s + 14)}px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; width: ${big ? 720 : 300}px; }
    .icon { width: ${Math.round(84 * s + 18)}px; height: ${Math.round(84 * s + 18)}px; border-radius: ${Math.round(18 * s + 5)}px; background: ${C.white}; display: grid; place-items: center; margin-bottom: ${Math.round(26 * s + 6)}px; }
    .icon img { width: 72%; }
    h1 { font-size: ${big ? 64 : 30}px; line-height: 1.04; letter-spacing: -.02em; font-weight: 800; }
    p { font-size: ${big ? 24 : 13}px; line-height: 1.4; margin-top: ${big ? 18 : 8}px; color: rgba(255,255,255,.86); }
    .by { margin-top: ${big ? 30 : 14}px; font-size: ${big ? 18 : 11}px; font-weight: 600; color: #fff; }
    .card { position: absolute; right: 70px; top: 50%; transform: translateY(-50%) rotate(-2deg); width: 470px; border-radius: 14px; overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,.35); background: #fff; }
    .card img { display: block; width: 100%; }
  </style></head><body>
    <div class="wrap">
      <div class="icon"><img src="ICON"></div>
      <h1>Pixel &amp;<br>Tag Checker</h1>
      <p>${big ? 'Audit GA4, GTM, Meta, TikTok and Consent Mode v2 in one click, then send a branded client report.' : 'Tag &amp; Consent Mode audits with branded client reports.'}</p>
      <div class="by">${mark(big ? 18 : 10, true)}</div>
    </div>
    ${big ? '<div class="card"><img src="SHOT"></div>' : ''}
  </body></html>`;
}

// ---- Main ---------------------------------------------------------------------------------
const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.route(`${ORIGIN}/**`, async route => {
  const rel = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/, '');
  const file = path.resolve(root, rel);
  if (!file.startsWith(root)) return route.abort();
  try {
    const body = await readFile(file);
    const type = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' }[path.extname(file)] || 'application/octet-stream';
    await route.fulfill({ body, contentType: type });
  } catch { await route.fulfill({ status: 404, body: '' }); }
});

async function capture(url, { width, height, scale = 2, setup, clip, fullPage = false }) {
  const page = await ctx.newPage({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme: 'light' });
  await page.setViewportSize({ width, height });
  await page.addInitScript(chromeStub, { storage: storageFixture, tabState: { url: probe.url, hits, dl }, auditResult: setup?.result || result, tabUrl: probe.url });
  await page.goto(`${ORIGIN}/${url}`);
  await page.waitForLoadState('networkidle');
  if (setup?.run) await setup.run(page);
  await page.waitForTimeout(250);
  const buf = await page.screenshot({ clip, fullPage });
  await page.close();
  return buf;
}

async function render(html, w, h, out) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, out), clip: { x: 0, y: 0, width: w, height: h } });
  await page.close();
  console.log('wrote', out);
}

const clickTab = name => async page => { await page.click(`.tabs button[data-tab="${name}"]`); await page.waitForTimeout(300); };
const PANEL = { width: 400, height: 700 };

const shots = {
  audit: await capture('sidepanel/sidepanel.html', { ...PANEL, setup: { run: async p => { await p.click('#run-audit'); await p.waitForSelector('#audit-result:not([hidden])'); } } }),
  consent: await capture('sidepanel/sidepanel.html', { ...PANEL, setup: { result: resultWithTest, run: async p => {
    await p.selectOption('#opt-consent', 'reject'); await p.click('#run-audit'); await p.waitForSelector('#audit-result:not([hidden])');
    await p.evaluate(() => document.querySelector('#consent').scrollIntoView({ block: 'start' }));
  } } }),
  requests: await capture('sidepanel/sidepanel.html', { ...PANEL, setup: { run: async p => {
    await clickTab('requests')(p);
    await p.evaluate(() => { const li = [...document.querySelectorAll('#hits li[data-i]')].find(l => /purchase/i.test(l.textContent) && /GA4/.test(l.textContent)); li?.click(); });
  } } }),
  datalayer: await capture('sidepanel/sidepanel.html', { ...PANEL, setup: { run: async p => {
    await clickTab('datalayer')(p);
    await p.evaluate(() => { const li = [...document.querySelectorAll('#dl li[data-i]')].find(l => /purchase/.test(l.textContent)); li?.click(); });
  } } }),
  report: await capture('report/report.html?id=demo-1', { width: 900, height: 1000, scale: 1.5 }),
};
// Full report (not used in the store images) so the footer credit can be checked by eye.
shots.reportFull = await capture('report/report.html?id=demo-1', { width: 900, height: 1000, scale: 1, fullPage: true });
for (const [k, v] of Object.entries(shots)) await writeFile(path.join(here, 'source', `ui-${k}.png`), v);

const panelW = 400;
const screens = [
  { shot: shots.audit, shotWidth: panelW, eyebrow: 'One-click tracking audit', headline: 'Find broken tracking <em>before your client does</em>', sub: 'Score any page 0–100 and get a prioritised list of fixes.', bullets: ['GA4, GTM, Google Ads, Meta, TikTok and 10 more tags plus delivery status', 'Consent Mode v2 defaults, updates and CMP detection', 'Ecommerce, deduplication and PII checks'] },
  { shot: shots.consent, shotWidth: panelW, eyebrow: 'Consent stress test', headline: 'Prove consent <em>actually works</em>', sub: 'Click "Accept all" or "Reject all" on the cookie banner and compare what every pixel sent before and after.', bullets: ['OneTrust, Cookiebot, Usercentrics, Didomi, Complianz', 'Flags pixels that fire after "Reject all"', 'Google consent signals before and after'] },
  { shot: shots.requests, shotWidth: panelW, eyebrow: 'Request inspector', headline: 'Every tracking hit, <em>decoded</em>', sub: 'Readable parameter names, parsed GA4 items and consent strings, with filters, search and CSV/JSON export.' },
  { shot: shots.datalayer, shotWidth: panelW, eyebrow: 'dataLayer timeline', headline: 'Every dataLayer push, <em>in order</em>', sub: 'Captured from the first line of the page, even pushes made before GTM loads. Overwrites are flagged.' },
  { shot: shots.report, shotWidth: 640, eyebrow: 'Client-ready reports', headline: 'Send a <em>client-ready</em> report', sub: 'Executive summary, fixes, consent results and changes since the last audit. Print to PDF or export CSV.' },
];

for (let i = 0; i < screens.length; i++) {
  const s = screens[i];
  await render(canvasHtml({ ...s, shot: dataUrl(s.shot) }), 1280, 800, `screenshot-${i + 1}-1280x800.png`);
}

const icon = dataUrl(await readFile(path.join(root, 'icons/icon128.png')));
await render(promoHtml({ w: 440, h: 280, big: false }).replace('ICON', icon), 440, 280, 'promo-small-440x280.png');
await render(promoHtml({ w: 1400, h: 560, big: true }).replace('ICON', icon).replace('SHOT', dataUrl(shots.report)), 1400, 560, 'marquee-1400x560.png');

await browser.close();
