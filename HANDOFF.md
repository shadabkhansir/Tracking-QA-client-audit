# Hand-off: Pixel & Tag Checker (for the thegrowthfolks.com landing page)

_Version 1.1.0 · 2026-10-16 · repo `shadabkhansir/Tracking-QA-client-audit`. Every fact here matches the code; the sources are in `docs/RESEARCH.md` and `docs/research/`._

## Basics

| Field | Value |
|---|---|
| **slug** | `tag-checker` → `https://thegrowthfolks.com/tools/tag-checker/` |
| **Redirect** | `/tools/tracking-qa/*` → `/tools/tag-checker/*` (old URLs are still in v1.0 installs) |
| **name** | Pixel & Tag Checker |
| **Store title** | Pixel & Tag Checker: GA4, GTM, Meta Audit – The Growth Folks® |
| **short_name** | Tag Checker |
| **version** | 1.1.0 |
| **Chrome Web Store** | Not live yet. Show "Coming soon" until the link exists. |
| **Price** | Free plan, plus **Pro at $19/month or $190/year** with a 7-day free trial (v1.2.0, Dodo Payments). Free-launch installs keep Pro until 31 January 2027. Pricing lives on `/tools/tag-checker/pricing/`. |
| **Contact** | team@thegrowthfolks.com |

**Pages the extension links to:** each one must exist.
- `/tools/tag-checker/` (Help)
- `/tools/tag-checker/welcome/` (opened once after install)
- `/tools/tag-checker/privacy/` (publish `PRIVACY.md` verbatim)
- `/tools/tag-checker/pricing/` (upgrade links)
- `/tools/tag-checker/activated/` (Dodo checkout returns here with the licence key)
- `/learn/`

Incoming links carry `utm_source=chrome-extension`, `utm_medium=upgrade` and `utm_content=<prompt>` (scan-limit, history-limit, monitor-tab, report-toolbar, report-changes, options-plan). Dodo's checkout returns buyers to `/tools/tag-checker/activated/`, which hands the licence key to the extension.

## Copy

**Summary (132 chars, matches the manifest):** Check GA4, GTM, Meta, TikTok and ChatGPT Ads pixels, see what fires before consent, and send clients a polished audit report.

**Search-phrased headline:** Is your Meta pixel firing? Check every pixel and tag, and what fires before consent, in one click.
- Alternative H1 with the green phrase: "Check every pixel and tag, and *what fires before consent*"

**Intro:**
> Pixel & Tag Checker is a free Chrome extension that checks every analytics and ad tag on a page at once: GA4, Google Tag Manager, Meta, TikTok, ChatGPT Ads and 11 more. It shows whether each one fired and was accepted, what each vendor sent before and after the cookie banner choice, and what to fix. Then it turns the result into a client-ready report. It's a free alternative to Meta Pixel Helper and Google Tag Assistant that also works with tags deployed through Google Tag Manager, server-side tagging and Shopify custom pixels. Everything runs in your browser; there's no account and nothing is sent anywhere.

**Six features** (one line each, plus a detail sentence):
1. **Consent timeline by vendor.** See what Google, Microsoft Ads, Meta, TikTok, LinkedIn, ChatGPT Ads and others sent before the cookie banner choice and after "Accept all" or "Reject all", with a pass or fail per vendor.
2. **ChatGPT Ads pixel checker.** Decodes OpenAI pixel events, amounts and the `oppref` click ID, checks the click ID is captured, and warns if a Conversions API key is exposed in page code.
3. **Meta data restrictions pre-check.** Finds health and other sensitive words in URLs, UTMs, custom events and custom data that may get your Meta events restricted, and tells you how to fix them.
4. **One-click audit of 16 platforms.** Firing, not firing, firing twice or blocked by an ad blocker, with the HTTP status of every request, a 0–100 score and plain-English fixes. Includes purchase value, currency and order ID checks across platforms, plus personal-data leak detection.
5. **Cookie banner and GPC tests.** Clicks "Accept all" or "Reject all" on major consent platforms for you, reads Google Consent Mode v2, and reloads with Global Privacy Control to check US opt-outs.
6. **Client-ready report.** Score, fixes, the consent timeline and changes since the last audit, downloadable as a PDF, with your own logo, colour and call-to-action (white-label, free).

**Steps (how it works):**
1. Add Pixel & Tag Checker to Chrome and click its icon to open the side panel.
2. Open the page you want to check and click **Reload & capture**.
3. Click **Run audit**. For consent, choose **Reject all** or **Accept all** first.
4. Read the score, the consent timeline and the fixes, then **Save & open client report** to download the PDF.

**Five FAQs:**
1. **Is it free?** The audit itself is: every check, the consent and GPC tests, the inspectors, exports and client reports with a credit line. Pro ($19/month or $190/year, 7-day free trial) adds white-label reports, "changes since last audit", 50-page scans, monitoring and 500 saved audits. No account either way.
2. **Does it send my data anywhere?** No. Everything runs in your browser. There's no account, server or analytics, and saved audits stay in your browser.
3. **Can it see server-side tracking (Conversions API, Measurement Protocol)?** No. It sees what the browser sends. It checks the browser side of deduplication (event IDs) and click-ID capture, and says clearly where server-side checks are needed.
4. **How does it know a tag fired before consent?** Google and Microsoft Ads include a consent value in each request; for every other vendor it compares the request time with the moment the banner choice was made. Run the cookie banner test as a fresh visitor for a full verdict.
5. **Will it tell me if Meta has restricted my account?** No. It's a pre-check: it flags words and parameters Meta's rules cover, so you can fix them before Meta restricts your events. Check Events Manager → Diagnostics for Meta's own view.

**Audiences:**
- Agency and freelance tracking specialists, who need client-ready proof.
- In-house growth and performance marketers, for QA after launches and new channels like ChatGPT Ads.
- D2C founders and e-commerce operators, including India (Shopify, missing purchases, Meta health restrictions).
- Analysts, developers and privacy leads, who need consent behaviour per vendor.

## Permissions and data practice

Full table in `docs/PERMISSIONS.md`. Version 1.1 added no permissions.

| Permission | Why |
|---|---|
| `sidePanel` | The UI lives in Chrome's side panel. |
| `webRequest` + `<all_urls>` | Read (never change) requests pages send to tracking platforms, their bodies and HTTP status. Non-matching requests are discarded. |
| `scripting` | Read the page's tag and consent setup when you run an audit; click the cookie banner only when you run a banner test. |
| Content scripts | Record `dataLayer.push()` from the first line of the page. |
| `cookies` | Cookie table and first-party ID checks: names, domains and expiry only, never values. |
| `declarativeNetRequestWithHostAccess` | Add `Sec-GPC: 1` to one tab during a GPC test only. |
| `storage`, `unlimitedStorage` | Live logs, saved audits, settings and branding, all in your browser. |
| Optional `browsingData` | "Fresh visitor" scans clear cookies for the scanned sites only, after confirmation. |
| Optional `alarms`, `notifications` | Scheduled monitoring. |

**Data practice:**
- Local-first; no server, analytics, ads or third-party code; no data sent anywhere.
- Saved audits keep parameter names, not personal values; emails in saved URLs become `[email]`.
- Exports and reports leave the computer only when the user downloads or shares them.
- Not affiliated with Google, Meta, TikTok, Microsoft or OpenAI.

## quickStart (for the welcome page)

```
1. Pin Pixel & Tag Checker: puzzle icon → pin.
2. Open a page with tracking, click the icon, then "Reload & capture".
3. Click "Run audit" for the score and fixes.
4. Consent check: set "Consent test" to "Reject all" and run again to see the consent timeline.
5. "Save & open client report" → Download PDF.
```

## Screenshots (1280×800, `store/screenshots/`)

| File | Shows | Store slot |
|---|---|---|
| `screenshot-1-1280x800.png` | Consent timeline by vendor ("See what fires before consent") | 1 |
| `screenshot-2-1280x800.png` | ChatGPT Ads pixel decoded, with `oppref` | 2 |
| `screenshot-3-1280x800.png` | Meta data restrictions pre-check | 3 |
| `screenshot-4-1280x800.png` | One-click audit and score | 4 |
| `screenshot-5-1280x800.png` | Client report with the consent timeline | 5 |
| `screenshot-6-1280x800.png` | dataLayer timeline | website only (store allows 5) |

**Other assets:**
- Promo tiles: `store/promo-small-440x280.png`, `store/marquee-1400x560.png` (share image).
- Icon: `icons/icon128.png`.
- Regenerate everything with `node store/make-graphics.mjs`.
