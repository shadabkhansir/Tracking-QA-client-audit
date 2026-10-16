// End-to-end: unpacked extension in Chromium against a local fixture site.
//   node test/e2e/advanced.e2e.mjs        (Chromium at /opt/pw-browsers/chromium, or set CHROMIUM_PATH)
// Third-party hosts are stubbed with Playwright routes; the extension still sees every request through webRequest.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const out = process.env.E2E_OUT || null;

async function loadPlaywright() {
  for (const c of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node-tools/node_modules/playwright/index.mjs', '/opt/node22/lib/node_modules/playwright/index.mjs'].filter(Boolean)) {
    try { return await import(c.startsWith('/') ? pathToFileURL(c).href : c); } catch { /* next */ }
  }
  throw new Error('Playwright not found (npm i -D playwright, or set PLAYWRIGHT_MODULE).');
}

const server = http.createServer(async (req, res) => {
  try {
    const file = path.join(here, 'fixtures', path.basename(new URL(req.url, 'http://x').pathname) || 'consent.html');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const { chromium } = await loadPlaywright();
const ctx = await chromium.launchPersistentContext('', {
  headless: true, executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`, '--headless=new'],
});
const stub = await readFile(path.join(here, 'fixtures', 'oaiq-stub.js'), 'utf8');
await ctx.route('https://bzrcdn.openai.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: stub }));
await ctx.route(/https:\/\/(bzr\.openai\.com|www\.facebook\.com|bat\.bing\.com|region1\.google-analytics\.com)\/.*/, r => r.fulfill({ status: 204, body: '' }));

let failures = 0;
const check = async (name, fn) => { try { await fn(); console.log(`ok - ${name}`); } catch (e) { failures++; console.log(`not ok - ${name}\n  ${e.message}`); } };

try {
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const extId = new URL(sw.url()).host;
  // The worker event fires when the worker starts, before its top-level code has registered the webRequest listeners.
  await new Promise(r => setTimeout(r, 1500));
  const site = await ctx.newPage();
  await site.goto(`${base}/consent.html?oppref=opp_e2e_click`);
  await site.waitForTimeout(1500);

  const panel = await ctx.newPage();
  await panel.setViewportSize({ width: 400, height: 1400 });
  await panel.goto(`chrome-extension://${extId}/options/options.html`);
  const siteTabId = await panel.evaluate(async b => (await chrome.tabs.query({ url: `${b}/*` }))[0].id, base);
  const state = await panel.evaluate(id => chrome.runtime.sendMessage({ type: 'get-tab-state', tabId: id }), siteTabId);
  console.log(`# captured ${state?.hits?.length ?? 0} requests: ${[...new Set((state?.hits || []).map(h => h.platform).filter(Boolean))].join(', ')}`);
  await panel.goto(`chrome-extension://${extId}/sidepanel/sidepanel.html?tabId=${siteTabId}`);
  await panel.waitForTimeout(600);

  await check('Requests tab lists the ChatGPT Ads pixel', async () => {
    await panel.click('[data-tab="requests"]');
    await panel.waitForTimeout(300);
    try { assert.match(await panel.textContent('#chips'), /ChatGPT Ads/); } finally { await panel.click('[data-tab="live"]'); }
  });

  await panel.selectOption('#opt-consent', 'reject');
  await panel.click('#run-audit');
  await panel.waitForFunction(() => !document.getElementById('audit-result').hidden && !document.getElementById('run-audit').disabled, null, { timeout: 30000 });

  const timeline = await panel.textContent('#consent-timeline');
  await check('Timeline: Meta fired before consent', async () => assert.match(timeline, /Meta[\s\S]*Before consent/));
  await check('Timeline: ChatGPT Ads fired after reject', async () => assert.match(timeline, /ChatGPT Ads[\s\S]*After reject/));
  await check('Timeline: GA4 (denied pings) and UET (asc=D) pass', async () => {
    const rows = await panel.$$eval('#consent-timeline tbody tr', trs => trs.map(tr => tr.innerText.replace(/\s+/g, ' ')));
    assert.ok(rows.some(r => /^GA4 .*Pass/.test(r)), rows.join(' | '));
    assert.ok(rows.some(r => /^MS Ads .*Pass/.test(r)), rows.join(' | '));
  });
  const findings = await panel.textContent('#findings');
  await check('Finding: consent timeline failure', async () => assert.match(findings, /tracks? after the visitor rejects cookies/));
  await check('Finding: Meta sensitive data pre-check', async () => assert.match(findings, /May trigger Meta data restrictions/));
  await check('Finding: oppref captured passes (no oppref warning)', async () => assert.doesNotMatch(findings, /click ID \(oppref\) is not captured/));
  if (out) await panel.screenshot({ path: path.join(out, 'e2e-panel.png'), fullPage: true });

  await check('Report shows the consent timeline section', async () => {
    const [rep] = await Promise.all([ctx.waitForEvent('page'), panel.click('#save-report')]);
    await rep.waitForLoadState();
    await rep.waitForTimeout(600);
    const text = await rep.textContent('#report');
    assert.match(text, /Consent timeline by vendor/);
    assert.match(text, /Fired after reject/);
    if (out) { await rep.setViewportSize({ width: 900, height: 1400 }); await rep.screenshot({ path: path.join(out, 'e2e-report.png'), fullPage: true }); }
  });
} finally {
  await ctx.close();
  server.close();
}
console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exit(failures ? 1 : 0);
