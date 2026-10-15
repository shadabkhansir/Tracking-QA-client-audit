# Chrome Web Store listing: Tracking QA & Client Audit by The Growth Folks™

Copy-paste source for the Chrome Web Store Developer Dashboard. Everything below was checked against the code in
this repo (manifest v1.0.0).

---

## Store listing tab

**Name** (from manifest, 47 chars)

```
Tracking QA & Client Audit by The Growth Folks™
```

**Summary** (manifest `description`, 112/132 chars)

```
Audit GA4, GTM, Meta, TikTok and 11 more tags plus Consent Mode v2 and GPC, then send clients a polished report.
```

**Category:** Developer Tools (alternative: Productivity)

**Language:** English

**Detailed description**

```
Find broken tracking before your client does.

Tracking QA & Client Audit checks the analytics and ad tags on any web page, tests whether the cookie banner really controls them, and turns the result into a clean report you can send to a client. Open the side panel, click "Run audit", and get a 0–100 score with a prioritised list of fixes.

WHAT IT CHECKS
• Tags: Google Analytics 4 (including server-side GTM endpoints on your own domain), Google Tag Manager, the Google tag, Google Ads, Floodlight, Meta Pixel, TikTok Pixel, LinkedIn Insight Tag, Pinterest Tag, Snap Pixel, X (Twitter) Pixel, Microsoft Ads UET, Reddit Pixel, Microsoft Clarity and Hotjar.
• Google Consent Mode v2: missing, v1-only or late defaults; whether "accept" actually updates consent; the default, update and current state of every signal.
• Consent stress test: clicks "Accept all" or "Reject all" on the banner (OneTrust, Cookiebot, Usercentrics, Didomi, Complianz or a generic button) and compares what every platform sent before and after.
• Global Privacy Control test: reloads the page with the browser's GPC opt-out signal on and checks whether ad tags still fire (required by several US state privacy laws).
• Delivery: whether every tracking request was actually accepted by the vendor (HTTP status and timing), tag libraries that fail to load (e.g. a GTM 404), and hits blocked by an ad blocker in your browser.
• Google Ads: conversion label, value, currency and order ID per conversion, and Enhanced Conversions user data (present, hashed or leaking in clear text).
• Shopify: events from Customer Events custom pixels, and the common bug where they report Shopify's sandbox URL instead of the real page.
• Placement and order: GTM snippet or Meta base code outside <head>, events sent before the Google tag is configured, dataLayer pushes without an event, several conversions firing on one page load.
• Pixel health: invalid Meta or TikTok pixel IDs, empty or wrong-case TikTok events, missing TikTok first-party cookie, Meta automatic events.
• Cookies: every first-party cookie on the page with vendor, purpose and expiry (names only, never values).
• First-party and proxied tags (Google Tag Gateway, server-side GTM, pixel proxies) are detected, and you can add your own custom providers.
• Pixels, cookies or session recorders that run while consent is denied.
• Ecommerce: purchases missing transaction_id, value, currency or items; duplicate purchases; purchase values that differ between GA4, Meta and TikTok.
• Meta and TikTok event rules: wrong-case standard events, missing content IDs, missing event_id for Conversions API deduplication, malformed advanced matching.
• dataLayer problems: overwritten dataLayer, ecommerce object not cleared between pushes.
• Personal data (such as email addresses) leaking into tracking payloads.

TOOLS FOR THE JOB
• Request inspector: every tracking hit with readable parameter names, parsed GA4 items, consent strings and delivery status. Filter, search, and export to CSV, JSON or HAR.
• Label IDs ("G-ABC123 = Main property") so panels and reports read like your client's setup.
• dataLayer timeline: every push in order from the first line of the page, even before GTM loads.
• Funnel mode: preserve the log across pages and audit a whole journey (product → cart → checkout → thank-you).
• Multi-page scan: audit a list of URLs in background tabs as a first-time visitor, with a coverage check that spots templates missing tags the rest of the site has.
• Import an audit someone exported to view their report.
• Pop-out window pinned to one tab.

CLIENT-READY REPORTS
• Executive summary, score, findings with "how to fix", consent results and changes since the last audit.
• Editable analyst notes and "Prepared for" line.
• Print to PDF, or export CSV, JSON or a plain-text summary for email and Slack.

WHO IT'S FOR
Agencies, freelance analysts, in-house marketers and developers who set up or maintain GA4, GTM and ad pixels and need to prove tracking and consent work.

FREE VERSION
Every check, the inspectors, consent and GPC tests, funnel audits and exports are free. Multi-page scans cover up to 3 pages at a time, the last 5 audits are kept, and reports carry a small credit line. A Pro plan with white-label reports, larger scans and monitoring is planned.

PRIVACY
Everything runs in your browser. The extension has no server, no analytics and no third-party code, and it sends no data anywhere. Saved audits stay in your browser's extension storage until you delete them. Full policy: https://thegrowthfolks.com/tools/tracking-qa/privacy

Built by The Growth Folks™: https://thegrowthfolks.com/tools/tracking-qa
```

> Note before publishing: the Free/Pro split in `src/plan.js` has no payment flow yet (Pro can only be switched on
> for unpacked developer installs). The description above deliberately does not mention Pro, custom report branding,
> 50-page scans or scheduled monitoring, because store users cannot get them yet. Add them back once payments work.

**Graphics** (in this folder; regenerate with `node store/make-graphics.mjs`)

| Slot | File |
|---|---|
| Store icon 128×128 | `../icons/icon128.png` |
| Small promo tile 440×280 | `promo-small-440x280.png` |
| Marquee 1400×560 (optional) | `marquee-1400x560.png` |
| Screenshot 1: one-click audit | `screenshot-1-1280x800.png` |
| Screenshot 2: consent stress test | `screenshot-2-1280x800.png` |
| Screenshot 3: request inspector | `screenshot-3-1280x800.png` |
| Screenshot 4: dataLayer timeline | `screenshot-4-1280x800.png` |
| Screenshot 5: client report | `screenshot-5-1280x800.png` |

Screenshots show the real extension UI rendered with sample data for a fictional store (shop.example.com).

**URLs**

- Official URL / homepage: `https://thegrowthfolks.com/tools/tracking-qa`
- Support URL: `https://thegrowthfolks.com/tools/tracking-qa` (support email: hello@thegrowthfolks.com)
- Privacy policy URL: `https://thegrowthfolks.com/tools/tracking-qa/privacy` (source text: `../PRIVACY.md`)

---

## Privacy practices tab

### Single purpose

```
Tracking QA & Client Audit has one purpose: auditing the analytics and advertising tags on web pages the user chooses to check. It observes the requests a page sends to known tracking platforms (Google Analytics, Google Tag Manager, Google Ads, Meta, TikTok, LinkedIn, Pinterest, Snap, X, Microsoft Ads, Reddit, Clarity, Hotjar), reads the page's tag and consent configuration, optionally tests the page's cookie banner, and presents the findings in a side panel and in a report the user can print or export for their client.
```

### Permission justifications

**sidePanel**
```
The extension's whole interface (Audit, Requests, dataLayer, Scan, Monitor and History tabs) lives in Chrome's side panel so it can stay open next to the page being audited. Clicking the toolbar icon opens it.
```

**storage**
```
Saves the user's audits (findings, tag IDs, scores, page URLs), report branding they enter (agency name, colour, logo, contact line), report notes, monitors and settings in chrome.storage.local so they can reopen reports and compare audits over time. Live request and dataLayer logs for each tab are kept in chrome.storage.session so they survive the service worker restarting; they are cleared when the tab navigates or closes. Nothing is synced or sent off the device.
```

**webRequest**
```
Core feature. The Requests tab and every audit rely on seeing the tracking requests a page sends (for example GA4 /g/collect, facebook.com/tr, analytics.tiktok.com). The extension uses a non-blocking onBeforeRequest listener with requestBody, because GA4, TikTok and LinkedIn send event data in POST bodies, plus non-blocking onCompleted and onErrorOccurred listeners to record the HTTP status and timing of those same tracking requests (so users can see whether a hit was accepted, failed or was blocked). Each request is matched in memory against a fixed list of tracking endpoints and any custom endpoints the user configured; non-matching requests are discarded immediately and never stored. The extension never blocks, modifies or redirects any request with webRequest.
```

**scripting**
```
When the user clicks "Run audit", "Use links from this page" or runs a consent test or scan, the extension injects a bundled function (chrome.scripting.executeScript, MAIN world) into the audited tab to read its tag configuration: the dataLayer, Google's consent state (google_tag_data.ics), configured Meta/TikTok pixel IDs, which consent-management platform is present, cookie names (not values) and same-site links. For the optional consent test it clicks "Accept all" or "Reject all" on the cookie banner, and for the optional GPC test it sets and later removes a temporary sessionStorage flag on the tab under test. All injected code ships inside the extension package.
```

**cookies**
```
The audit lists the first-party cookies on the audited page with their vendor, purpose, domain and expiry, and checks whether advertising or analytics cookies exist while the visitor has not consented. chrome.cookies.getAll is called only for the URL of the tab being audited, only when the user runs an audit or a scan (including a scheduled monitor the user created), and only cookie names and metadata are kept; cookie values are never read into results or stored. HttpOnly cookies (such as some analytics cookies) are not visible to page scripts, which is why the cookies permission is needed.
```

**declarativeNetRequestWithHostAccess**
```
Used only for the optional Global Privacy Control test the user starts from the Audit, Scan or Monitor tab. For the duration of that test the extension adds one session rule, scoped to the single tab under test, that sets the "Sec-GPC: 1" request header, reloads the page to see whether ad tags honour the opt-out signal, and then removes the rule. No other rules exist; the extension never blocks or redirects requests.
```

**unlimitedStorage**
```
Saved audits (multi-page site reports with findings, cookie tables and page lists) and their before/after history are kept locally in chrome.storage.local. A single 50-page site audit can be close to 1 MB, so the default 10 MB quota fills after a dozen audits and saves would start failing. Nothing is synced or sent off the device; users delete audits in the History tab.
```

**alarms (optional permission)**
```
Requested only when the user adds a scheduled monitor in the Monitor tab. Powers scheduled monitoring: an hourly chrome.alarms tick checks whether any monitor the user created is due (daily or weekly) and, if so, re-scans those URLs. Not requested by users who never set up monitoring.
```

**notifications (optional permission)**
```
Requested together with alarms when the user adds a scheduled monitor. Shows a desktop notification when a scheduled monitoring scan finds new tracking problems or the site's audit score drops. Clicking the notification opens that audit's report. No other notifications are sent.
```

**browsingData (optional permission)**
```
Requested only when the user ticks "Fresh visitor" in the Scan tab, and only after a confirmation dialog. Before scanning, it deletes cookies, localStorage, IndexedDB and service workers for the origins of the URLs being scanned (chrome.browsingData.remove with an origins filter), so pages are audited as a genuine first-time visitor who has not consented yet. It never touches other sites or browsing history.
```

**Host permission: <all_urls>**
```
Users audit their own and their clients' websites, which can be on any domain, so the extension cannot know the hosts in advance. Host access is needed to (1) observe tracking requests with webRequest, which fire to many vendor domains and to first-party server-side Tag Manager domains on the audited site; (2) inject the audit probe into the tab the user is auditing; and (3) read tab URLs so audits and the side panel show which page was checked. (4) chrome.cookies and the GPC header rule also need host access to the audited site. activeTab is not sufficient because tracking requests must be captured from the start of page load, before the user opens the panel, and scans/monitors run in background tabs. The extension does not read page content beyond the tag configuration listed above and sends nothing off the device.
```

**Content script: src/content/dl-hook.js on http://*/* and https://*/*, world MAIN, run_at document_start**
```
Records dataLayer.push() calls in the order they happen for the dataLayer tab and the dataLayer checks (overwritten dataLayer, ecommerce not cleared, consent commands). It must run in the page's MAIN world at document_start because pushes made before Google Tag Manager loads, and calls after GTM replaces push(), are otherwise lost, and because window.dataLayer is only visible from the page's own JavaScript world. It does not change page content or data: it wraps dataLayer.push and the dataLayer property setter, passes every call through unchanged, and posts a sanitised copy (depth- and size-limited, functions and DOM nodes removed) to the relay script via window.postMessage. Only during a Global Privacy Control test the user starts does it make navigator.globalPrivacyControl return true for that tab. It makes no network requests.
```

**Content scripts on Shopify custom-pixel sandboxes (http(s)://*/wpm@* and http(s)://*/web-pixels@*, all_frames)**
```
The same two scripts (dl-hook.js in the MAIN world and relay.js in the isolated world) also run inside the iframes Shopify uses for Customer Events custom pixels, which keep their own dataLayer. relay.js in those frames sends its own frame URL to the service worker so tracking requests from the sandbox can be labelled as coming from a Shopify custom pixel. These match patterns only cover Shopify's pixel sandbox paths, not other iframes.
```

**Content script: src/content/relay.js on http://*/* and https://*/*, isolated world, run_at document_start**
```
Forwards the dataLayer events posted by dl-hook.js to the extension's service worker with chrome.runtime.sendMessage, because MAIN-world scripts cannot call extension APIs. It accepts only messages from the same window carrying the extension's marker and forwards only the dataLayer fields. Data is held in session storage for that tab and cleared on navigation or when the tab closes.
```

### Remote code

```
No, I am not using remote code.
```

All JavaScript is packaged in the extension. There is no `eval`, `new Function`, remote `<script>`, `importScripts` or
`fetch` of code; functions injected with `chrome.scripting.executeScript` are bundled in `src/page-probe.js`.

### Data usage

The extension does **not collect or transmit** any user data: it has no server, no analytics, no third-party SDK and
makes no network requests of its own. All processing happens locally and results stay in `chrome.storage` on the
user's device. Recommended answers:

| Data category | Tick? | Notes |
|---|---|---|
| Personally identifiable information | **Yes** | Not transmitted. Raw tracking payloads of audited pages, which can contain personal data a site leaks (e.g. an email in a pixel), are held in session storage for the live inspector and in files the user exports. Saved audits redact email addresses and keep only the parameter name. |
| Health information | No | |
| Financial and payment information | No | |
| Authentication information | No | |
| Personal communications | No | |
| Location | No | |
| Web history | **Yes** | URLs of pages the user audits are stored locally only and never transmitted. |
| User activity | No | |
| Website content | **Yes** | Tracking requests, dataLayer pushes and cookie names of audited pages are processed and stored locally only. |

Per the Chrome Web Store User Data FAQ, data handled only on the device must still be disclosed, so these three are
ticked even though nothing leaves the browser.

Certify all three:

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## Reviewer notes / test instructions

```
No account or login is needed.

1. Install the extension, then open any site that uses Google Analytics or ad pixels (for example a large online store or news site).
2. Click the toolbar icon. The side panel opens.
3. In the Audit tab click "Reload & capture", wait for the page to load, then click "Run audit". You get a score, the tracking platforms detected with their IDs, Google Consent Mode status and a list of findings.
4. Open the Requests tab to see each tracking request with decoded parameters (click a row to expand). Open the dataLayer tab to see dataLayer pushes in order.
5. Optional: set "Consent test" to "Accept all" or "Reject all" and run the audit again on a site with a cookie banner. The extension clicks the banner and shows requests before/after. "GPC signal" reloads the page once with the Sec-GPC header and navigator.globalPrivacyControl set (this is the only use of declarativeNetRequest) and compares the tags.
6. Click "Save & open client report" to see the printable report. Settings (link in the panel header) contains the switch for the small "Made with ... by The Growth Folks™" footer credit; custom report branding is shown there but locked until the planned Pro plan launches.

Notes on permissions: webRequest is used read-only (non-blocking) and only requests to known tracking endpoints are kept. The MAIN-world document_start content script only wraps window.dataLayer.push to log pushes and passes every call through unchanged. The extension makes no network requests of its own. "Fresh visitor" in the Scan tab requests the optional browsingData permission and deletes cookies only for the URLs being scanned, after a confirmation dialog. Scheduled monitoring and custom report branding belong to a planned Pro plan that is not purchasable yet; the UI labels them "coming soon". The alarms and notifications permissions are optional and only requested when monitoring is enabled.
```
