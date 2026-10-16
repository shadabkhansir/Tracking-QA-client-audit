# Pixel & Tag Checker by The Growth Folks®

Chrome extension (Manifest V3) that checks GA4, GTM, Google Ads, Meta, TikTok, LinkedIn, Pinterest, Snap, X, Microsoft Ads, Reddit, Clarity, Hotjar and ChatGPT Ads (OpenAI) tags, shows what each vendor sends before and after the cookie banner choice, and turns the result into a branded client report.

- Landing page: https://thegrowthfolks.com/tools/tag-checker/
- Privacy policy: https://thegrowthfolks.com/tools/tag-checker/privacy/ (source: [`PRIVACY.md`](PRIVACY.md))
- Support: team@thegrowthfolks.com
- Chrome Web Store listing copy, permission justifications and graphics: [`store/`](store/)
- Research, spec and decisions: [`docs/RESEARCH.md`](docs/RESEARCH.md), [`docs/SPEC.md`](docs/SPEC.md), [`docs/DECISIONS.md`](docs/DECISIONS.md), details in [`docs/research/`](docs/research/)
- Permissions and why: [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) · Website hand-off: [`HANDOFF.md`](HANDOFF.md)

The old GitHub Pages site (`gh-pages` branch) now only redirects to the landing page.

## What it does

- **Audit tab**: one-click audit with a 0–100 score, the platforms detected, Consent Mode state, and fixes for each finding.
- **Consent timeline**: per vendor, what was sent before the cookie banner choice and after "Accept all"/"Reject all", with a verdict (Google Consent Mode `gcs`/`gcd`, Microsoft UET `asc`, timing for every other vendor; Clarity cookieless mode recognised).
- **ChatGPT Ads (OpenAI) pixel**: decodes `oaiq` beacon bodies and image tags, checks standard event names, integer minor-unit amounts, currency, event IDs and `oppref` click-ID capture, and flags a Conversions API key exposed in page code.
- **Meta sensitive-data pre-check**: health, financial and identifier terms in URLs, UTMs, custom event names and custom data that may trigger Meta data restrictions.
- **Consent stress test**: clicks "Accept all" or "Reject all" on the banner (OneTrust, Cookiebot, Usercentrics, Didomi, Complianz, or a generic button) and compares tag behaviour before and after.
- **Requests tab**:
  - every tracking hit with decoded parameter names and GA4 item strings parsed
  - filter by vendor, search, CSV/JSON export
  - log can be preserved across redirects
  - toolbar badge count
- **dataLayer tab**: every push in order, captured from `document_start`, so it survives GTM replacing `push()`. Flags `dataLayer = []` overwrites.
- **Funnel mode**: audits a whole preserved session (product → cart → checkout → thank-you).
- **Multi-page scan**: background tabs as a first-time visitor who hasn't consented. Optional "fresh visitor" mode clears that site's cookies first; it uses the optional `browsingData` permission.
- **Monitoring**: daily or weekly re-scans through `chrome.alarms`, with a desktop notification when new issues appear or the score drops.
- **Client report**:
  - branded and print-to-PDF
  - executive summary, findings with fixes
  - consent test table, "changes since last audit", funnel steps
  - editable analyst notes and "Prepared for"
  - call-to-action button
  - CSV/JSON/summary export
  - small "Made with Pixel & Tag Checker by The Growth Folks®" credit in the footer, switchable off in Settings
- **Pop-out window** pinned to a tab.

- **Delivery status**: HTTP status and timing for every tracking request. Flags tag libraries that fail to load (e.g. a GTM 404), hits rejected by the endpoint, and hits blocked by an ad blocker in the auditor's own browser.
- **Google Ads + Enhanced Conversions**: label, value, currency and order ID per conversion. Checks user data is present and hashed.
- **GPC test**: reloads the page with `Sec-GPC: 1` and `navigator.globalPrivacyControl` (via a tab-scoped `declarativeNetRequest` session rule) and checks ad tags honour the opt-out. Meta LDU and Google `rdp` count as honouring it.
- **Cookie table**: first-party cookies (including HttpOnly) with vendor, purpose and expiry, before and after consent. Names only, never values.
- **Shopify custom pixels**: captures events and the dataLayer from Customer Events sandboxes (`/wpm@…`, `/web-pixels@…`) and flags the sandbox URL being reported as the page URL.
- **Placement and order**: GTM or Meta snippet outside `<head>`, gtag events before config, dataLayer pushes without `event`, several conversions on one page load.
- **Proxies and custom providers**: Google Tag Gateway, server-side GTM and Meta/TikTok pixel proxies on first-party domains. User-defined providers (`Name | match | idParam | eventParam`) in Settings.
- **Coverage**: site scans flag templates missing tags that most other pages have.
- **HAR export** of captured requests, and **audit import** to view a report someone exported as JSON.
- **ID labels** ("G-ABC = Main property") shown in the panel and in reports.

### Platforms
GA4 (including first-party server-side GTM endpoints), GTM, gtag, Google Ads, Floodlight, Meta, TikTok, LinkedIn, Pinterest, Snapchat, X, Microsoft Ads (UET), Reddit, Microsoft Clarity, Hotjar.

### Checks (`src/checks.js`, `src/validators.js`)
- **Consent:**
  - Consent Mode missing, v1-only, or default set late
  - accept doesn't update Google consent
  - pixels fire, or Google consent is granted, after reject
  - non-Google pixels or tracking cookies present while consent is denied
  - session recorders load without consent
- **Accuracy:**
  - duplicate page views across 8 vendors
  - tag libraries that load but stay silent
  - dataLayer overwritten
  - ecommerce object not cleared between pushes
  - purchase value differs between GA4, Meta and TikTok
- **GA4:**
  - purchase missing transaction_id, value, currency or items
  - duplicate purchases
  - non-numeric value or price
  - currency not ISO 4217
  - event and parameter naming limits, reserved names
- **Meta:**
  - Purchase missing value or currency
  - standard event with the wrong case
  - same event activated more than once
  - missing content_ids
  - missing event_id (CAPI dedup)
  - double-encoded parameters
- **TikTok:**
  - purchase missing value or currency
  - missing content_id
  - invalid content_type
  - malformed email or phone (E.164)
  - missing event_id
- **PII:** email addresses in any vendor's payload; unhashed Meta advanced matching. Only the parameter name is stored, never the value.

### Where consent state comes from

In priority order:
1. Google's runtime state (`google_tag_data.ics`).
2. `gcs`/`gcd` on Google hits.
3. `gtag('consent', …)` commands from the live dataLayer log.

That log survives a page overwriting `window.dataLayer`. CMP templates in GTM set defaults through `setDefaultConsentState` and never touch `dataLayer`, so reading only `dataLayer` would wrongly flag those sites.

## Plans

**v1.1 ships as a free launch:** every feature unlocked for everyone, with no limits, upgrade prompts or Pro badges. The switch is `allFree: true` in `src/license-config.js`.

The Free/Pro split below is built and tested, but switched off. It comes back when `allFree` is set to `false` (see `docs/PRO-LAUNCH.md`).

| | Free (after launch) | Pro |
|---|---|---|
| Live checks, consent timeline, ChatGPT Ads, Meta pre-check | ✓ | ✓ |
| Client report | TGF credit, default branding | Your logo, colour, contact, CTA; credit optional |
| Pages per scan | 3 | 50 |
| Saved audits | 5 | 500 |
| "Changes since last audit" | Preview | Full |
| Scheduled monitoring + alerts | – | ✓ |

Full plan and launch guide: [`docs/PLANS.md`](docs/PLANS.md); payments and licence keys: [`docs/LICENSING.md`](docs/LICENSING.md) (Dodo Payments, off until configured in `src/license-config.js`). Limits live in `src/plan.js`. Licence-key activation (Dodo Payments) is built and tested but off (`enabled: false`). On unpacked installs the Options page has a developer toggle for Pro once `allFree` is off.

## Develop

```bash
npm test          # unit tests for detectors + rules (node:test, no deps)
npm run test:e2e  # Playwright end-to-end test with the unpacked extension (Chromium at /opt/pw-browsers/chromium or CHROMIUM_PATH)
npm run zip       # dist.zip for the Chrome Web Store (gitignored)
node store/make-graphics.mjs   # regenerate store screenshots and promo tiles (needs Playwright + Chromium)
```

Load it: `chrome://extensions` → Developer mode → *Load unpacked* → select this folder. Click the toolbar icon to open the side panel.

## Layout

```
manifest.json
src/background.js   service worker: webRequest capture, per-tab state, audits, consent test, scans, monitors
src/detectors.js    URL/body → hits for 16 platforms (incl. ChatGPT Ads beacon bodies), gcs/gcd parsing
src/consent-timeline.js  per-vendor before/after-choice timeline and verdicts
src/params.js       readable parameter names, GA4 item parsing, ecommerce normalisation
src/page-probe.js   MAIN-world probe (dataLayer, consent state, pixels, CMPs, cookie names) + accept/reject banner
src/content/        dataLayer hook (MAIN world, document_start) + relay (isolated world)
src/checks.js       core rules, consent test findings, scoring, multi-page aggregation
src/validators.js   ecommerce, naming, dedup, dataLayer, cookies, cross-platform, delivery, Google Ads/EC, placement, pixel health, Shopify, ChatGPT Ads and Meta sensitive-data rules
src/cookies.js      cookie vendor/purpose classification
src/diff.js         before/after comparison between audits
src/export.js       CSV / summary exports
src/storage.js      history, branding, settings, monitors
src/plan.js         free/pro limits
src/brand.js        The Growth Folks® links (UTM-tagged) for the panel, options and report
src/brand/          TGF design tokens + bundled Inter (copied from brand/)
docs/               research (docs/research/), spec, decisions, permissions, plans, licensing
test/               unit tests + fixtures; test/e2e/ Playwright end-to-end test and fixture site
store/              Web Store listing copy, graphics and the script that generates them
sidepanel/          live UI
report/             printable client report
options/            branding + plan
```

## Known limits

- Server-side tracking (Meta CAPI, GA4 Measurement Protocol, OpenAI Conversions API) can't be seen from the browser. The report says so; the ChatGPT Ads check verifies `oppref` capture, not server forwarding.
- Vendors other than Google and Microsoft UET put no consent value on the wire, so the consent timeline judges them by timing against the banner choice. Without a banner test, a returning visitor's stored choice can't be distinguished, so those rows say "Run banner test" instead of failing.
- The Meta sensitive-data check is a pre-check on what the browser sends; it can't see whether Meta has restricted the dataset.
- The `gcd` letter mapping is reverse-engineered by the community, not documented by Google. Unknown letters show up as `unknown` instead of being guessed.
- `<all_urls>` + `webRequest` puts the extension into the Chrome Web Store's in-depth review. Plan for a slower first review and a privacy policy (see `PRIVACY.md`).
