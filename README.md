# Tracking QA & Client Audit

Chrome extension (Manifest V3) that checks GA4, GTM, Google Ads, Meta Pixel, TikTok Pixel and Google Consent Mode v2 on any page, then turns the result into a branded client report.

## What it does

- **Live panel**: streams tracking requests for the current tab and runs an audit on demand.
- **Checks** (`src/checks.js`):
  - Duplicate page views (GA4 `page_view`, Meta `PageView`, TikTok `Pageview`)
  - Libraries that load but never send hits
  - Multiple GTM containers / GA4 properties
  - Consent Mode missing, v1-only (no `ad_user_data` / `ad_personalization`), default set late, `ad_storage` defaulting to granted
  - Meta/TikTok pixels firing while Google sees `ad_storage = denied` (the CMP isn't gating non-Google tags)
  - PII in payloads: emails in GA4/TikTok params, unhashed Meta advanced-matching fields. Only the parameter name is recorded, never the value.
- **Client report**: score, summary for the client, fixes in priority order, platforms, consent table. Saved as PDF through Chrome's print dialog.
- **Multi-page scan**: opens URLs in background tabs (pre-consent state), then aggregates findings with the pages each one affects.
- **History**: saved audits per site in `chrome.storage.local`.

### Where consent state comes from

In priority order: Google's runtime state (`google_tag_data.ics`), then `gcs`/`gcd` on Google hits, then `gtag('consent', …)` commands in `dataLayer`. CMP templates in GTM set defaults through `setDefaultConsentState` and never write to `dataLayer`. Reading only `dataLayer` would wrongly flag those sites as missing a default.

## Free vs Pro

| | Free | Pro |
|---|---|---|
| Live checks | ✓ | ✓ |
| Client report | Watermarked, default branding | Your logo, colour, contact, no watermark |
| Pages per scan | 3 | 50 |
| Saved audits | 5 | 500 |

Limits live in `src/plan.js`. **Payments are not wired up yet.** Connect a provider (ExtensionPay, or Lemon Squeezy/Paddle with license-key checks) and call `setPlan('pro')`. On unpacked installs the Options page has a developer toggle to turn Pro on.

## Develop

```bash
npm test          # unit tests for detectors + rules (node:test, no deps)
npm run zip       # dist.zip for the Chrome Web Store
```

Load it: `chrome://extensions` → Developer mode → *Load unpacked* → select this folder. Click the toolbar icon to open the side panel.

## Layout

```
manifest.json
src/background.js   service worker: webRequest capture, per-tab state, audits, scans
src/detectors.js    URL/body → hits (GA4, GTM, gtag, Google Ads, Meta, TikTok), gcs/gcd parsing
src/page-probe.js   injected into the page's MAIN world: dataLayer, consent state, fbq, ttq, CMPs, links
src/checks.js       rules engine, scoring, multi-page aggregation
src/storage.js      history + branding
src/plan.js         free/pro limits
sidepanel/          live UI
report/             printable client report
options/            branding + plan
```

## Known limits

- Server-side tracking (Meta CAPI, GA4 Measurement Protocol) can't be seen from the browser. The report says so.
- The `gcd` letter mapping is reverse-engineered by the community, not documented by Google. Unknown letters show up as `unknown` instead of being guessed.
- `<all_urls>` + `webRequest` puts the extension into the Chrome Web Store's in-depth review. Plan for a slower first review and a privacy policy (see `PRIVACY.md`).
