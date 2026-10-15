# Chrome Web Store listing: Tracking QA & Client Audit by The Growth Folks®

Copy-paste source for the Chrome Web Store Developer Dashboard. Everything below was checked against the code in
this repo (manifest v0.3.0).

---

## Store listing tab

**Name** (from manifest, 47 chars)

```
Tracking QA & Client Audit by The Growth Folks®
```

**Summary** (manifest `description`, 124/132 chars)

```
Audit GA4, GTM, Meta, TikTok and 10 more tags plus Consent Mode v2, then send clients a branded report. By The Growth Folks®
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
• Pixels, cookies or session recorders that run while consent is denied.
• Ecommerce: purchases missing transaction_id, value, currency or items; duplicate purchases; purchase values that differ between GA4, Meta and TikTok.
• Meta and TikTok event rules: wrong-case standard events, missing content IDs, missing event_id for Conversions API deduplication, malformed advanced matching.
• dataLayer problems: overwritten dataLayer, ecommerce object not cleared between pushes.
• Personal data (such as email addresses) leaking into tracking payloads.

TOOLS FOR THE JOB
• Request inspector: every tracking hit with readable parameter names, parsed GA4 items and consent strings. Filter, search, and export to CSV or JSON.
• dataLayer timeline: every push in order from the first line of the page, even before GTM loads.
• Funnel mode: preserve the log across pages and audit a whole journey (product → cart → checkout → thank-you).
• Multi-page scan: audit a list of URLs in background tabs as a first-time visitor.
• Pop-out window pinned to one tab.

CLIENT-READY REPORTS
• Executive summary, score, findings with "how to fix", consent results and changes since the last audit.
• Editable analyst notes and "Prepared for" line.
• Print to PDF, or export CSV, JSON or a plain-text summary for email and Slack.

WHO IT'S FOR
Agencies, freelance analysts, in-house marketers and developers who set up or maintain GA4, GTM and ad pixels and need to prove tracking and consent work.

PRIVACY
Everything runs in your browser. The extension has no server, no analytics and no third-party code, and it sends no data anywhere. Saved audits stay in your browser's extension storage until you delete them. Full policy: https://thegrowthfolks.com/tools/tracking-qa/privacy

Built by The Growth Folks®: https://thegrowthfolks.com/tools/tracking-qa
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
Core feature. The Requests tab and every audit rely on seeing the tracking requests a page sends (for example GA4 /g/collect, facebook.com/tr, analytics.tiktok.com). The extension uses only a non-blocking onBeforeRequest listener with requestBody, because GA4, TikTok and LinkedIn send event data in POST bodies. Each request is matched in memory against a fixed list of tracking endpoints; non-matching requests are discarded immediately and never stored. The extension never blocks, modifies or redirects any request.
```

**scripting**
```
When the user clicks "Run audit", "Use links from this page" or runs a consent test or scan, the extension injects a bundled function (chrome.scripting.executeScript, MAIN world) into the audited tab to read its tag configuration: the dataLayer, Google's consent state (google_tag_data.ics), configured Meta/TikTok pixel IDs, which consent-management platform is present, cookie names (not values) and same-site links. For the optional consent test it clicks "Accept all" or "Reject all" on the cookie banner. All injected code ships inside the extension package.
```

**alarms**
```
Powers scheduled monitoring: an hourly chrome.alarms tick checks whether any monitor the user created is due (daily or weekly) and, if so, re-scans those URLs. With no monitors configured the tick does nothing.
```

**notifications**
```
Shows a desktop notification when a scheduled monitoring scan finds new tracking problems or the site's audit score drops, so the user learns that a client's tracking broke without opening the extension. Clicking the notification opens that audit's report. No other notifications are sent.
```

**browsingData (optional permission)**
```
Requested only when the user ticks "Fresh visitor" in the Scan tab, and only after a confirmation dialog. Before scanning, it deletes cookies, localStorage, IndexedDB and service workers for the origins of the URLs being scanned (chrome.browsingData.remove with an origins filter), so pages are audited as a genuine first-time visitor who has not consented yet. It never touches other sites or browsing history.
```

**Host permission: <all_urls>**
```
Users audit their own and their clients' websites, which can be on any domain, so the extension cannot know the hosts in advance. Host access is needed to (1) observe tracking requests with webRequest, which fire to many vendor domains and to first-party server-side Tag Manager domains on the audited site; (2) inject the audit probe into the tab the user is auditing; and (3) read tab URLs so audits and the side panel show which page was checked. The extension does not read page content beyond the tag configuration listed above and sends nothing off the device.
```

**Content script: src/content/dl-hook.js on http://*/* and https://*/*, world MAIN, run_at document_start**
```
Records dataLayer.push() calls in the order they happen for the dataLayer tab and the dataLayer checks (overwritten dataLayer, ecommerce not cleared, consent commands). It must run in the page's MAIN world at document_start because pushes made before Google Tag Manager loads, and calls after GTM replaces push(), are otherwise lost, and because window.dataLayer is only visible from the page's own JavaScript world. It only wraps dataLayer.push and the dataLayer property setter, passes every call through unchanged, and posts a sanitised copy (depth- and size-limited, functions and DOM nodes removed) to the relay script via window.postMessage. It makes no network requests and does not modify the page.
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
| Personally identifiable information | No | Not collected. If an audited site leaks e.g. an email into a pixel, saved audits keep only the parameter name. |
| Health information | No | |
| Financial and payment information | No | |
| Authentication information | No | |
| Personal communications | No | |
| Location | No | |
| Web history | No | URLs of pages the user audits are stored locally only and never transmitted. |
| User activity | No | |
| Website content | No | Tracking requests and dataLayer pushes of audited pages are processed and stored locally only. |

If you prefer the most conservative reading of the form, ticking **Website content** and **Web history** is also
defensible (they are processed locally); in that case the certifications below still hold.

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
5. Optional: set "Consent test" to "Accept all" or "Reject all" and run the audit again on a site with a cookie banner. The extension clicks the banner and shows requests before/after.
6. Click "Save & open client report" to see the printable report. Settings (link in the panel header) contains report branding and the switch for the small "Made with ... by The Growth Folks®" footer credit.

Notes on permissions: webRequest is used read-only (non-blocking) and only requests to known tracking endpoints are kept. The MAIN-world document_start content script only wraps window.dataLayer.push to log pushes and passes every call through unchanged. The extension makes no network requests of its own. "Fresh visitor" in the Scan tab requests the optional browsingData permission and deletes cookies only for the URLs being scanned, after a confirmation dialog. Monitoring and custom report branding are gated behind a Pro plan that is not purchasable yet; reviewers can ignore those tabs.
```
