# Changelog

## Unreleased

**The Growth Folks® design system**
- Side panel, settings and client report now use only `brand/tokens.css` values (copied to `src/brand/tokens.css` for the package): forest green actions, warm off-white surfaces, flat 14px cards, pill buttons, Inter 400/600/800 bundled locally (no remote fonts), light and dark mode.
- TGF logo mark in the panel header, settings and report; extension icon redrawn in TGF green.
- Status shown as icon + word + colour (✕ Critical, ! Warning, i Note, ✓ Pass) in the panel and report.
- Free reports use TGF green with the "Made with … The Growth Folks®" credit; Pro white-label replaces only the accent with the agency's colour (text colour picked for contrast). Status colours stay ours.
- Contact email is now team@thegrowthfolks.com everywhere. Store graphics regenerated.

**Pro plan readiness** (licensing still off until Dodo products exist; see `docs/PRO-LAUNCH.md`)
- The developer Pro toggle only works on unpacked installs. Previously a store install could unlock Pro by writing `plan` to storage.
- Upgrade prompts at each Free limit: scan pages, history, Monitor tab, report branding, "changes since". Each tracks where it was clicked with `utm_content`. Until Pro is on sale they read "Pro: coming soon".
- "Changes since last audit" is Pro. Free reports show a one-line preview (kept out of the PDF).
- Dodo subscriptions that recover from on-hold or paused restore Pro (they previously stayed Free).
- Hitting the activation limit, e.g. after a reinstall, now tells the buyer how to get the key reset.
- The side panel updates as soon as a licence is activated or removed.
- Separate monthly/yearly checkout links and a support email in `license-config.js`.

## 1.0.0 (2026-10-15): first store release

Hardening release after a four-part pre-launch review (service worker, rules engine, UI, Web Store compliance).

**Fixes**
- dataLayer recorder no longer recurses when GTM installs its own `push()` (every push on GTM sites threw "Maximum call stack size exceeded"). Verified against a real gtm.js with one and two containers.
- Service worker: a shared restore promise (no lost or reordered hits on wake), per-tab session storage with a quota fallback, closing a tab no longer wipes other tabs' logs, custom providers apply to the request that woke the worker, and redirect hops no longer add extra funnel steps.
- The GPC test reloads the tab once more afterwards, so the page is not left with the signal on.
- Consent-banner text fallback only clicks inside a cookie/consent container (never forms or unrelated "Accept" buttons).
- False positives removed or downgraded:
  - X/Snap duplicate page views across their two endpoints; SPA page views more than 2 s apart.
  - GPC or CMP reloads double-counting purchases.
  - UET running in its own consent mode (`asc=D`).
  - Unhashed address fields and base64 hashes in Enhanced Conversions.
  - Region-scoped consent defaults (now an info note).
  - Retina image names (`@2x.jpg`) flagged as emails.
  - FPID/FPLC treated as ad cookies.
  - Blog URLs matching the Shopify sandbox pattern.
  - ORB/CORP responses treated as rejected hits.
  - Auto-sent `user_engagement` flagged as a reserved name.
  - Repeated Meta events without `event_id`, and multiple conversions per page (now info).
  - Leftover cookies (now a warning).
  - A bare GTM load without a CMP (Consent Mode missing is now a warning).
- Crashes fixed: non-string TikTok event names, null Meta `contents`.
- Imported audit files are normalised before rendering (no HTML injection); damaged files show an error, not "Loading…".
- Saved audits redact email addresses in URLs and text.
- History is never trimmed below what is already saved (no data loss on a Pro → Free downgrade).
- Save failures are reported instead of failing silently.
- Expanded rows keep their place when the log is full.
- Monitor URLs are validated and de-duplicated, with a cap of 20 monitors.
- Small accessibility fixes.

**Changes**
- New Google Ads detection: `www.google.com/ccm/collect` pings.
- `alarms` and `notifications` are now optional permissions, requested only when monitoring is enabled. Added `unlimitedStorage`.
- Store listing, privacy policy and screenshots updated for the Free plan and current behaviour.

## 0.4.0
P1 gap features: delivery status, Google Ads + Enhanced Conversions, Shopify custom pixels, cookie table, GPC test, placement checks, pixel-helper parity, first-party proxies and custom providers, coverage gaps, HAR export, audit import, ID labels.

## 0.3.0
Chrome Web Store launch preparation under The Growth Folks® (branding, store listing, privacy policy).

## 0.2.0
Competitor-parity features: six more ad pixels, request inspector, dataLayer timeline, accept/reject consent test, ecommerce and cross-platform validation, funnel mode, monitoring, report diffs.

## 0.1.0
MVP: GA4, GTM, Meta, TikTok and Consent Mode checks, branded report, multi-page scan, history.
