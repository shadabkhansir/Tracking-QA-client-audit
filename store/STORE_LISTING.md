# Chrome Web Store listing: Pixel & Tag Checker by The Growth Folks®

Copy-paste source for the Chrome Web Store Developer Dashboard. Everything below was checked against the code in
this repo (manifest v1.1.0).

---

## Store listing tab

**Name** (manifest `name`, 61/75 chars)

```
Pixel & Tag Checker: GA4, GTM, Meta Audit – The Growth Folks®
```

**Summary** (manifest `description`, 125/132 chars)

```
Check GA4, GTM, Meta, TikTok and ChatGPT Ads pixels, see what fires before consent, and send clients a polished audit report.
```

**Category:** Developer Tools (alternative: Productivity)

**Language:** English

**Detailed description**

Store policy (docs/research/RISKS.md B5, B6):
- Name at most five supported platforms in the text; link the full list.
- No competitor or platform names in the title.
- Include the "not affiliated" line.

```
Is your Meta pixel firing? Is GA4 tracking purchases? Do your tags fire before visitors accept cookies? Pixel & Tag Checker answers all three in one click, then turns the result into a report you can send to a client.

A free alternative to Meta Pixel Helper and Google Tag Assistant that checks every tag on the page at once, including tags deployed through Google Tag Manager, server-side tagging and Shopify custom pixels.

WHAT IT CHECKS
• Tags found on this page: Google Analytics 4, Google Tag Manager, Meta, TikTok, ChatGPT Ads and 11 more ad and analytics platforms (full list on our website). Firing, not firing, firing twice, or blocked by an ad blocker, with the HTTP status of every request.
• Consent timeline: what each vendor sent before the cookie banner choice and after "Accept all" or "Reject all", with a pass or fail per vendor. Reads Google Consent Mode v2 and Microsoft Ads consent signals; flags tags that fire before consent or after reject.
• Cookie banner test: clicks "Accept all" or "Reject all" on major consent platforms for you and compares before and after.
• Global Privacy Control (GPC) test for US privacy laws.
• ChatGPT Ads pixel: decodes events, amounts and the oppref click ID, checks the click ID is captured, and warns if a Conversions API key is exposed in page code.
• Meta data restrictions pre-check: health and other sensitive words in URLs, UTMs, custom events and custom data that may get your events restricted, with the fix.
• Purchase events: value, currency, order ID and items; duplicate purchases; values that differ between platforms; event IDs for server-side deduplication.
• Personal data (email, phone) sent to ad platforms, and unhashed user data.
• Cookies set on the page, by vendor and purpose (names only, never values).

TOOLS FOR THE JOB
• Request inspector with readable parameter names, filters, search and CSV, JSON or HAR export.
• dataLayer timeline from the first line of the page.
• Funnel mode across pages (product → cart → checkout → thank-you).
• Multi-page scan with a coverage check for templates missing tags.

CLIENT REPORT
Score, plain-English fixes, the consent timeline by vendor and changes since the last audit. Download as PDF.

FREE
Everything is free: every check, the consent and GPC tests, the inspectors and exports, white-label client reports with your own logo, colours and call-to-action, scans of up to 50 pages, 500 saved audits and scheduled monitoring with desktop alerts (runs while Chrome is open). No account needed.

PRIVACY
Everything runs in your browser. No account, no server, no analytics: nothing you audit is sent anywhere. Policy: https://thegrowthfolks.com/tools/tag-checker/privacy/

Not affiliated with or endorsed by Google, Meta, TikTok, Microsoft or OpenAI. Product names are used only to describe compatibility.

Built by The Growth Folks®: https://thegrowthfolks.com/tools/tag-checker/
```

> Before publishing:
> - This listing is for the free launch (`allFree: true` in src/license-config.js): don't mention Pro or prices. When paid plans start, follow docs/PRO-LAUNCH.md.
> - Re-check the ChatGPT Ads facts against https://developers.openai.com/ads (last checked 2026-10-16).

**Graphics** (regenerate with `node store/make-graphics.mjs`)

The store allows 5 screenshots. Use 1–5; screenshot 6 is for the website.

| Slot | File |
|---|---|
| Store icon 128×128 | `../icons/icon128.png` |
| Small promo tile 440×280 | `promo-small-440x280.png` |
| Marquee 1400×560 (optional) | `marquee-1400x560.png` |
| Screenshot 1: consent timeline | `screenshots/screenshot-1-1280x800.png` |
| Screenshot 2: ChatGPT Ads pixel | `screenshots/screenshot-2-1280x800.png` |
| Screenshot 3: Meta data restrictions pre-check | `screenshots/screenshot-3-1280x800.png` |
| Screenshot 4: one-click audit | `screenshots/screenshot-4-1280x800.png` |
| Screenshot 5: client report | `screenshots/screenshot-5-1280x800.png` |
| (website) dataLayer timeline | `screenshots/screenshot-6-1280x800.png` |

Screenshots show the real extension UI with sample data for fictional sites (shop.example.com, wellness.example.com).

**URLs**

- Official URL / homepage: `https://thegrowthfolks.com/tools/tag-checker/`
- Support URL: `https://thegrowthfolks.com/tools/tag-checker/` (support email: team@thegrowthfolks.com)
- Privacy policy URL: `https://thegrowthfolks.com/tools/tag-checker/privacy/` (source text: `../PRIVACY.md`)

---

## Privacy practices tab

### Single purpose

```
Pixel & Tag Checker has one purpose: auditing the analytics and advertising tags on web pages the user chooses to check. It observes the requests a page sends to known tracking platforms (Google Analytics, Google Tag Manager, Google Ads, Meta, TikTok, LinkedIn, Pinterest, Snap, X, Microsoft Ads, Reddit, Clarity, Hotjar, ChatGPT Ads), reads the page's tag and consent configuration, optionally tests the page's cookie banner, and presents the findings in a side panel and in a report the user can print or export for their client.
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

**Limited Use statement:** publish this on the privacy page (Chrome Web Store User Data Policy requires it on the website):

```
The use of information received from Chrome APIs by Pixel & Tag Checker adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. All data the extension reads stays in your browser and is used only to show you tracking-audit results; it is never sold, transferred, used for advertising or read by people.
```

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
5. Optional: set "Consent test" to "Accept all" or "Reject all" and run the audit again on a site with a cookie banner. The extension clicks the banner and shows requests before/after, plus a "Consent timeline" card with a verdict per vendor. "GPC signal" reloads the page once with the Sec-GPC header and navigator.globalPrivacyControl set (this is the only use of declarativeNetRequest) and compares the tags.
6. Click "Save & open client report" to see the printable report. Settings (link in the panel header) contains the switch for the small "Made with ... by The Growth Folks®" footer credit; custom report branding (agency name, logo, colour, contact line, call-to-action) is set there too. Every feature is free in this version; there is no payment, account or licence flow.

Notes on permissions: webRequest is used read-only (non-blocking) and only requests to known tracking endpoints are kept. The MAIN-world document_start content script only wraps window.dataLayer.push to log pushes and passes every call through unchanged. The extension makes no network requests of its own. The ChatGPT Ads, consent timeline and Meta sensitive-data checks work on the same locally observed requests; they added no permissions. "Fresh visitor" in the Scan tab requests the optional browsingData permission and deletes cookies only for the URLs being scanned, after a confirmation dialog. Scheduled monitoring and custom report branding are free in this version. The alarms and notifications permissions are optional and only requested when monitoring is enabled.
```
