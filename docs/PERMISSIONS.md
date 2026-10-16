# Permissions and why

_Pixel & Tag Checker v1.1.0 (manifest checked 2026-10-16). Version 1.1 added no permissions: the ChatGPT Ads checks, consent timeline and Meta sensitive-data pre-check reuse what the extension already reads._

## Required

| Permission | Why it's needed | What it never does |
|---|---|---|
| `sidePanel` | The whole UI lives in Chrome's side panel next to the page being checked. | — |
| `webRequest` + host access `<all_urls>` | To see the requests a page sends to tracking platforms (GA4, Meta, TikTok, ChatGPT Ads…), including POST bodies (GA4 batches, TikTok and OpenAI beacons), plus each request's HTTP status and errors (ad-blocker blocks). Non-blocking: nothing is changed or delayed. | Store requests that don't match a known tracking endpoint (they're discarded in memory). |
| `scripting` | Runs the page probe on the page being audited: reads the dataLayer, Google consent state, configured pixel IDs, consent platform, cookie **names**; clicks "Accept all"/"Reject all" only when the user runs a cookie banner test. | Run anything the user didn't ask for, or fetch remote code. |
| Content scripts (all http/https pages, top frame; Shopify pixel sandboxes) | Records `dataLayer.push()` from the first line of the page so the timeline is complete. Passes every call through unchanged. | Read page content, forms or keystrokes. |
| `cookies` | Builds the cookie table (name, domain, expiry, vendor) and checks for first-party IDs such as `_fbp`, `_ttp`, `__oppref`. | Read or store cookie **values**. |
| `declarativeNetRequestWithHostAccess` | Adds the `Sec-GPC: 1` header to one tab, only during a user-started GPC test, then removes it. | Block or modify any other request. |
| `storage` / `unlimitedStorage` | Live per-tab logs (session storage) and saved audits, settings and branding (local storage). Unlimited so a 500-audit history fits. | Sync anything to a server. |

## Optional (asked for only when the feature is first used)

| Permission | Feature |
|---|---|
| `browsingData` | Multi-page scan "Fresh visitor": clears cookies for the scanned sites only, after a confirmation. |
| `alarms` | Scheduled monitoring: wakes the extension to re-scan on schedule. |
| `notifications` | Scheduled monitoring: desktop alert when tracking breaks. |

## Network

The extension makes no network requests of its own. If paid plans are added later (licensing is off and `allFree` is on in this version), it would call Dodo Payments' public licence endpoints with only the licence key and an activation ID (docs/LICENSING.md).
