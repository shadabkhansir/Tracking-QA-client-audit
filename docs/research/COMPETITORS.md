# Competitor research: Pixel & Tag Checker

_Research date: 2026-10-16. Prepared for the rename of "Tracking QA & Client Audit by The Growth Folks®" to **Pixel & Tag Checker**. This replaces and re-verifies [../competitive-analysis.md](../competitive-analysis.md) (2026-10-14) and [../feature-gaps.md](../feature-gaps.md) (2026-10-15)._

**Method and caveats**

- Chrome Web Store (CWS) user counts, ratings, versions and "last updated" dates were read from each listing on 2026-10-16. CWS rounds user counts and says ratings "may not reflect the most recent reviews".
- Prices were checked on the vendor's own page on 2026-10-16 unless marked otherwise. "No price shown" means the CWS listing has only an "Add to Chrome" button and no in-app purchase notice.
- **No competitor was installed.** Every "UX notes" paragraph is **based on public materials (store listing text, vendor docs, help articles), not hands-on use**. Screenshots could not be viewed directly, so screen descriptions come from the listing and documentation text.
- Anything we could not confirm on a primary source is marked "(unverified)" or "estimate".
- Corrections to our older notes: **TagHound does exist** (60,000 users; our 2026-10-15 note said there was no evidence of it). **WASP.inspector is still gone.** A new wave of 2025–26 multi-platform, local-only side-panel tools (All Pixel Helper, both "Pixel Auditor" extensions, Insighter) now overlaps heavily with us and was missing from the old notes.

---

## 1. Summary of the market

| Tier | Who | What it means for us |
|---|---|---|
| Official single-vendor helpers | Google Tag Assistant, Meta Ads Data Advisor, TikTok, Pinterest, Snap, X, Microsoft UET, Reddit | Free, huge installed base (Tag Assistant and Meta about 3M each), but each covers one vendor. None does consent banner tests, PII, a client report or multi-page checks. They set the "expected warnings" baseline that clients compare against. |
| Free multi-vendor debuggers (established) | Omnibug, Analytics Debugger, dataslayer, Adswerve dataLayer Inspector+, TagHound, Datalayer Checker | Developer and analyst tools. Broad request decoding, little or no rules engine, no consent automation, no client deliverable. Several are stale (Omnibug Jan 2025, Adswerve Apr 2025, dataslayer Jun 2025, TagHound Dec 2024). |
| **New free multi-vendor audit tools (2025–26), the real threat** | **Pixel Auditor: Tag, PII & Consent Mode Inspector** (10,000 users), **All Pixel Helper**, Pixel Auditor (side panel, AI hand-off), Insighter Debugger, Tracking Auditor | Local-only, no account, side panel, consent + PII + server-side detection. Pixel Auditor (ratanjhadigital.com) already ships CMP auto-click for 19 CMPs, an A–F score, saved-run diffs and an HTML report, and promises "No paid tier, ever". This is the closest feature match to our free tier. |
| Consent / cookie auditors | ConsentScope, InfoTrust Consent Mode Inspector, My Agile Privacy Consent Mode V2 Inspector, ObservePoint Debugger (GPC) | ConsentScope sells exactly what our Pro sells, to the same agency buyer, at **$39.99 lifetime or $29–$69/month with scheduled cloud monitoring**. It is the main pricing reference. |
| Enterprise SaaS | ObservePoint, Trackingplan, DataTrue | Crawls, journeys, alerts, from about €89/month (Trackingplan) to $999+/month (DataTrue) to five-figure annual contracts (ObservePoint journeys). Too expensive for freelancers and small agencies: our gap to fill. |

---

## 2. Deep dives

Each entry follows the same order: what it does · target user · pricing · CWS data · onboarding · standout features · weaknesses · key screens · UX notes (public materials, not hands-on).

### 2.1 Google Tag Assistant (extension + tagassistant.google.com), including Tag Assistant Companion

- **What it does:** Shows the Google tags found on a page in a side panel. "Troubleshoot" opens a debug session on tagassistant.google.com that can cover iframes ([CWS](https://chromewebstore.google.com/detail/tag-assistant/kejbdjndbnbjgmefkgdddjlbokphdefk)). Debug sessions show hits sent, data layer updates, errors and a **tag coverage summary** of tagged and untagged pages. Sessions can be **exported, imported and shared by URL** ([Google help](https://support.google.com/tagassistant/answer/10039345)). Consent: the earliest Consent event shows defaults, later ones show updates; the tag's Consent tab has "On-page Default" and "On-page Update" columns, and it raises an **error when a tag reads cookies before the default consent is set** ([Google consent debugging guide](https://developers.google.com/tag-platform/devguides/consent-debugging)).
- **Target user:** Anyone deploying Google tags (GA4, Google Ads, GTM, Floodlight), from small business owners to GTM specialists.
- **Pricing:** Free (Google product, no paid tier; [CWS](https://chromewebstore.google.com/detail/tag-assistant/kejbdjndbnbjgmefkgdddjlbokphdefk), checked 2026-10-16).
- **CWS:** 3,000,000 users · 3.4★ (1.3K ratings) · v26.279.2.45 · updated 6 Oct 2026 ([CWS](https://chromewebstore.google.com/detail/tag-assistant/kejbdjndbnbjgmefkgdddjlbokphdefk)). **Tag Assistant Companion**: 500,000 users · 3.5★ (206) · updated 6 Oct 2026; Google says it is "retiring this extension", its functions are moving into Tag Assistant, and it will be auto-uninstalled where both are present ([CWS](https://chromewebstore.google.com/detail/tag-assistant-companion/jmekfmbnaedfebfnmakmokmlfpblbfdm)).
- **Onboarding:** Go to tagassistant.google.com → Add domain → enter URL → Connect; optionally install the extension and use "Troubleshoot tag" ([Google help](https://support.google.com/tagassistant/answer/10039345)). Requires a Google sign-in for the web app (unverified; implied by session history).
- **Standout features:** Official GTM Preview integration; per-tag consent view; late-default error; iframe and pop-up debugging with the extension; tag coverage; export/import of sessions ([Google help](https://support.google.com/tagassistant/answer/10039345)). "Step-by-step guidance for popular website builders" is listed as coming soon ([CWS](https://chromewebstore.google.com/detail/tag-assistant/kejbdjndbnbjgmefkgdddjlbokphdefk)).
- **Weaknesses:** Google tags only; AMP not supported ([Google help](https://support.google.com/tagassistant/answer/10039345)); no non-Google pixels, PII scan, banner test, GPC test or client report; middling 3.4★ rating.
- **Key screens:** Extension side panel listing Google tags on the page; web debug window with a left-hand event timeline (Consent, Container Loaded, events), and tabs for Tags, Variables, Data Layer, Consent and Errors on the right (from the Google docs above).
- **UX notes (public materials, not hands-on):** Two-surface design: a light extension panel for "is the tag here?", and a heavier web app for sessions. Docs show it is powerful but GTM-centric: users have to understand containers, Preview mode and the Consent tab's two columns. It is the tool our audience already has open, so our report should line up with its terminology (default vs update, "tag fired before consent").

### 2.2 Meta Ads Data Advisor (formerly Meta Pixel Helper)

- **What it does:** Pixel and event diagnostics plus, since the 2026 rename, **automated setup** of Pixel and Conversions API through GTM or Shopify, CRM connections (Salesforce), catalogues (WordPress/WooCommerce) and ongoing issue monitoring that can apply fixes "only after you approve" ([CWS](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc); [Meta docs](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper)).
- **Diagnostics listed by Meta:** pixel status Active/Warning/Inactive; event status Active/Inactive/Warning/Error/Auto-detected; duplicate Pixel code; base code outside `<head>`; more than one conversion event without user action; missing `content_ids`, `value`, `currency`; blocked by browser/privacy tools/tag managers; Advanced Matching shown; "Show all events" session log; catalogue match rate ([Meta docs](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper)).
- **Target user:** Meta advertisers and media buyers, increasingly non-technical SMB owners.
- **Pricing:** Free ([CWS](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc), checked 2026-10-16).
- **CWS:** 3,000,000 users · 2.1★ (1.3K) · v5.10.0 · updated 13 Oct 2026 ([CWS](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)).
- **Onboarding:** Install → optional Facebook log-in (unlocks automation) → disable ad blocker → look for badge → open side panel → perform an action and check the event ([Meta docs](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper)). A third-party guide describes a "new login requirement" ([adsuploader](https://adsuploader.com/blog/meta-pixel-helper)); Meta's own docs say log-in is optional, so treat the requirement as unverified.
- **Standout features:** First-party account access (Events Manager data, catalogue match rate) that no third party can match; one-click setup automation; action summaries with screenshots ([Meta docs](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper)).
- **Weaknesses:** Meta only; 2.1★ is the lowest rating in the category; Meta itself says custom conversions, some button-click events and advanced diagnostics "may not appear" and need Events Manager ([Meta docs](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper)); no consent view, export or report.
- **Key screens:** Toolbar badge with event count; side panel listing pixels with load status; event detail with parameters, Advanced Matching fields and warnings; setup/automation flows and job summaries.
- **UX notes (public materials, not hands-on):** The product has moved from a passive debugger to an "assistant" that wants a log-in and offers to change your setup. That suits Meta's goals (more CAPI adoption) but adds friction for auditors who just want to read the hit. A neutral, read-only, no-log-in auditor is a clear positioning contrast.

### 2.3 TikTok Pixel Helper

- **What it does:** Pixel-, event- and parameter-level checks: pixel code not in header, invalid Pixel ID, first-party cookies off; empty/invalid event names; email and E.164 phone format; missing email/phone on CompletePayment; value format; value/currency pairing; currency code; content_id; content_type ([TikTok help](https://ads.tiktok.com/help/article/tiktok-pixel-helper-2.0)).
- **Target user:** TikTok advertisers.
- **Pricing:** Free ([CWS](https://chromewebstore.google.com/detail/tiktok-pixel-helper/aelgobmabdmlfmiblddjfnjodalhidnn), checked 2026-10-16).
- **CWS:** 600,000 users · 3.1★ (143) · v3.0.5 · updated 10 Oct 2026 ([CWS](https://chromewebstore.google.com/detail/tiktok-pixel-helper/aelgobmabdmlfmiblddjfnjodalhidnn)).
- **Onboarding:** Install latest version → identify level (pixel/event/parameter) → apply suggested fix ([TikTok help](https://ads.tiktok.com/help/article/tiktok-pixel-helper-2.0)).
- **Standout:** Most detailed parameter validation of any official helper. Supports both Event Builder and Custom Code setups.
- **Weaknesses:** TikTok only; no consent, export or delivery confirmation. One user reported it blocked GTM from loading on their site (search snippet of [CWS reviews](https://chrome.google.com/webstore/detail/tiktok-pixel-helper/aelgobmabdmlfmiblddjfnjodalhidnn?hl=en), unverified).
- **Key screens:** Popup listing detected pixels → events → parameters, with error rows and fix text.
- **UX notes (public materials, not hands-on):** Three-level drill-down is clear and is a pattern worth copying for our per-hit detail. The fix text is short and links to Events Manager settings.

### 2.4 Other official pixel helpers (Pinterest, Snap, X, Microsoft UET, Reddit) and LinkedIn

| Helper | CWS data (checked 2026-10-16) | What it does | Notes |
|---|---|---|---|
| Pinterest Tag Helper (Pinterest, Inc.) | 100,000 users · 4.1★ (53) · v0.1.19 · updated 8 Jan 2025 ([CWS](https://chromewebstore.google.com/detail/pinterest-tag-helper/gmlcbajhgoaaegmlbaclmmmhpmfdajmp)) | "Build, troubleshoot and test your Pinterest Tags"; latest release shows the event type for POST requests | Not updated in 21 months |
| Snap Pixel Helper (Snap Inc.) | about 70,000 · 3.9★ (17) · v5.0.8 · updated 9 Jun 2025 ([CWS](https://chromewebstore.google.com/detail/snap-pixel-helper/hnlbfcoodjpconffdbddfglilhkhpdnf)) | Verify, debug and troubleshoot Snap Pixel | Stale |
| X Pixel Helper (X) | 60,000 · 3.5★ (22) · v3.0.11 · updated 17 Sep 2026 ([CWS](https://chromewebstore.google.com/detail/jepminnlebllinfmkhfbkpckogoiefpd)) | Badge with active tag count; tag details and warnings; Nov 2024 update added better error detection and load times | X help page returned 403 to our fetch |
| UET Tag Helper (Microsoft Corporation) | 100,000 · 4.5★ (26) · v0.6.16 · updated 6 Sep 2026 ([CWS](https://chromewebstore.google.com/detail/naijndjklgmffmpembnkfbcjbognokbf)) | Which UET tags are present and working; checks conversion goals and Dynamic Remarketing lists; explains fixes | CMP vendors use it to read the UET consent value `asc` (D = denied, G = granted) when testing Microsoft Consent Mode ([Didomi docs](https://docs.didomi.io/consent-management-platform-cmp/frameworks-regulations/microsoft-consent-mode)) |
| Reddit Pixel Helper (Reddit, Inc.) | 20,000 · 5.0★ (8) · v1.2.6 · updated 1 Oct 2026 ([CWS](https://chromewebstore.google.com/detail/ebgpcjlgganlidigifggjjiglghjnjcj)) | Badge with event count; events firing, config errors, suggested fixes | Actively maintained |
| LinkedIn | **No official LinkedIn helper found.** Third-party options: Pearmill Pixel Helper (about 1,000 users, v0.0.2, June 2023, per [chromeboard](https://chromeboard.com/extension/pearmill-pixel-helper-ahgjbbnglgnladgimapeecjmhlhmacgg)); "Pixel Helper for LinkedIn", flagged high-risk permissions and "not an official Plugin by Linkedin" ([extensionauditor](https://extensionauditor.com/scan/pixel-helper-for-linkedin-adbhmmjkppnhjjiapocjgjaknpigdoaa)) | Presence and Partner ID checks | Gap: LinkedIn Insight QA is underserved |

- **Pricing:** all free.
- **Target user:** each platform's advertisers.
- **Weaknesses (common):** single vendor; no consent decoding (except UET's raw `asc`); no export; Pinterest and Snap are stale.
- **UX notes (public materials, not hands-on):** All follow the Meta badge-plus-popup pattern. A multi-vendor tool removes the need for six helpers; our store listing should say that in its first sentence.

### 2.5 Omnibug

- **What it does:** DevTools panel that decodes outgoing marketing/analytics requests; filter and export ([CWS](https://chromewebstore.google.com/detail/omnibug/bknpehncffejahipecakbfkomebjmokl)). **69 supported entries**, including Facebook Pixel, TikTok, LinkedIn Conversion, Pinterest, Snapchat, Twitter, Bing Ads (UET), Reddit, Microsoft Clarity and Hotjar ([Omnibug supported tags](https://omnibug.io/help/supported-tags/)).
- **Target user:** Analysts and developers, especially Adobe/enterprise analytics teams.
- **Pricing:** Free and open source (no price on [CWS](https://chromewebstore.google.com/detail/omnibug/bknpehncffejahipecakbfkomebjmokl), checked 2026-10-16).
- **CWS:** 200,000 users · 4.2★ (53) · v2.1.0 · **updated 3 Jan 2025** ([CWS](https://chromewebstore.google.com/detail/omnibug/bknpehncffejahipecakbfkomebjmokl)).
- **Onboarding:** Install → open DevTools → Omnibug tab → browse.
- **Standout:** Breadth (Adobe, Tealium, Google Marketing Platform); readable decoding; export. Trackingplan maintains a fork of it outside the stores ([Trackingplan docs](https://www.trackingplan.com/docs/trackingplan-omnibug-extension)).
- **Weaknesses:** No validation rules, consent decoding, crawl or report; 21 months since the last release.
- **Key screens:** Single DevTools table of requests grouped by vendor, expandable into parameter tables, with a filter bar.
- **UX notes (public materials, not hands-on):** Built for people who live in DevTools. Dense and accurate, but it tells you *what* was sent, never *whether it is right*.

### 2.6 Analytics Debugger (thyngster.com)

- **What it does:** "Single Source of Truth for debugging analytics implementations": GTM, GA, Tealium, Piwik Pro/Matomo, Adobe and common pixels; GTM Preview Enhancer; GA debug-library loader; GA3/GA4 hit blocking; export; enhanced ecommerce reports; click blocker ([CWS](https://chromewebstore.google.com/detail/ilnpmccnfdjdjjikgkefkcegefikecdc)). Vendor list of 20+ includes Amplitude, Snowplow, Plausible, Fathom, Facebook Pixel, Google Ads, DoubleClick ([vendor page](https://www.analytics-debugger.com/en/tools/analytics-debugger-extension)). Version 2.0 added per-hit consent mode, sGTM endpoint and response, Google Signals and session counts ([release post](https://www.thyngster.com/analytics-debugger-2-0-0-chrome-extension-release)).
- **Target user:** GA4/GTM specialists and analytics engineers.
- **Pricing:** Free; "is free and always will be"; donations via GitHub Sponsors/Ko-fi ([vendor page](https://www.analytics-debugger.com/en/tools/analytics-debugger-extension), checked 2026-10-16).
- **CWS:** 100,000 users · 4.5★ (249) · v2.4.7 · updated 3 Sep 2026 ([CWS](https://chromewebstore.google.com/detail/ilnpmccnfdjdjjikgkefkcegefikecdc)).
- **Onboarding:** Install → open DevTools (code is injected only after DevTools loads) ([CWS](https://chromewebstore.google.com/detail/ilnpmccnfdjdjjikgkefkcegefikecdc)).
- **Standout:** Deepest GA4 detail in the market (batches, sessions, sGTM response); hit/click blocking.
- **Weaknesses:** DevTools-only; analytics-first (thin ad-pixel coverage: no TikTok/LinkedIn/Snap listed on the vendor page); no cross-vendor rules, banner test or report.
- **UX notes (public materials, not hands-on):** Expert tool with many toggles. Respected by GA4 specialists; we should recommend it alongside us for GTM Preview work rather than compete.

### 2.7 TagHound: Analytics/GTM/Pixel Debugger (verified: it exists)

- **What it does:** Validates GA4, GTM and ad pixels across **22 platforms** with **"over 1200 validation rules"**; three views (icon, DevTools, on-screen toasts); parameter grouping; filter/group/sort; records across pages and exports; dataLayer viewer with configurable name; GTM Tag Assistant enhancements (sorting, highlighting multiply-fired or erroring tags, hiding paused tags); domain exclusions ([CWS](https://chromewebstore.google.com/detail/canpneabbfipaelecfibpmmjbdkiaolf)).
- **Target user:** Marketers and GTM implementers.
- **Pricing:** No price or paid tier shown ([CWS](https://chromewebstore.google.com/detail/canpneabbfipaelecfibpmmjbdkiaolf), checked 2026-10-16); a third-party index lists it as free ([extensionauditor](https://extensionauditor.com/scan/taghound-analytics-gtm-pixel-debugger-canpneabbfipaelecfibpmmjbdkiaolf)). The developer site trafikant.pro returned HTTP 503 on 2026-10-16.
- **CWS:** 60,000 users · **4.8★ (111)** · v1.3.4 · **updated 27 Dec 2024** · "Featured" badge ([CWS](https://chromewebstore.google.com/detail/canpneabbfipaelecfibpmmjbdkiaolf)).
- **Onboarding:** Install → browse; events appear as toasts and in the popup/DevTools.
- **Standout:** Large rule set and the best rating among multi-vendor tools; toast notifications are unique.
- **Weaknesses:** No update in nearly two years; consent, PII and report not mentioned in the listing; no side panel.
- **UX notes (public materials, not hands-on):** On-page toasts make firing visible without opening anything, which is good for quick QA but noisy on busy pages. All Pixel Helper explicitly markets itself as a "free alternative to TagHound & Pixel Helper" (search snippet of its listing, unverified wording), which shows TagHound is the brand newcomers position against.

### 2.8 All Pixel Helper: Tag, dataLayer & Consent Debugger

- **What it does:** "Debug 40 tags, dataLayer & Consent Mode": popup, Chrome Side Panel or DevTools panel. Consent Mode v2 decoder, Meta Limited Data Use, TikTok consent flags, **GPC**, IAB US Privacy, CMP detection and "marketing tags before consent" warnings; dataLayer tree with GTM variable path copy; multi-pixel cards with **success / HTTP error / blocked** status; developer sandbox that injects a GTM container and simulates dataLayer pushes and consent/GPC; GA4 ecommerce, ISO 4217, missing Meta CAPI event_id, duplicate events and **unhashed email/phone** checks; CSV export; Shopify custom pixel capture ([CWS](https://chromewebstore.google.com/detail/bdedmcfjebcoemocjajpohkbnohbfeld)).
- **Target user:** Media buyers, analysts, GTM engineers, Shopify owners, privacy officers (per listing).
- **Pricing:** No price shown; no accounts or telemetry; data cleared when Chrome closes ([CWS](https://chromewebstore.google.com/detail/bdedmcfjebcoemocjajpohkbnohbfeld), checked 2026-10-16).
- **CWS:** 145 users · 5.0★ (2) · v1.2.1 · updated 27 Sep 2026 ([CWS](https://chromewebstore.google.com/detail/bdedmcfjebcoemocjajpohkbnohbfeld)).
- **Onboarding:** Install → open popup, side panel or DevTools.
- **Standout:** Nearly the same consent + PII + delivery-status feature list as our free tier, on three surfaces.
- **Weaknesses:** Tiny install base; no score, PDF report, multi-page scan or saved history in the listing; code injection on client sites is a risk we deliberately avoid.
- **UX notes (public materials, not hands-on):** Listing reads like a feature checklist aimed at search. Shows that our feature set is now easy to copy; differentiation has to come from the audit/report workflow, accuracy and brand trust, not the raw checks.

### 2.9 Pixel Auditor: Tag, PII & Consent Mode Inspector (ratanjhadigital.com) — closest competitor

- **What it does:** Live event stream with latency, regex search, watched events; detection via JS globals, DOM, cookies and network (rescans at 0/800/2,500/5,000 ms); **Consent Mode v2 inject Grant/Deny, auto-click CMP banners for 19 CMPs** with text fallback, Reset Consent; **PII leak detection** (emails, phones, 15+ fields, hashed IDs); **server-side detection** (renamed sGTM paths, proxies, CAPI, edge forwarders, base64 transports); **A–F grade on a 100-point scale**; saved runs and diffs; single-file **HTML report** and CSV; IAB TCF v2.2, GPP, US Privacy and GPC auditing; Meta CAPI dedup audit; Shopify `trackShopify` parsing; silent-tag audit; CSP-blocked fire detection; conversion reconciliation across ad platforms; Enhanced Conversions field-name audit ([CWS](https://chromewebstore.google.com/detail/pixel-auditor-tag-pii-con/eclgcapbbmjdgialkpcikjficpahmidd); [vendor site](https://pixelauditor.ratanjhadigital.com/)).
- **Platforms named:** Google Analytics, Google Ads, GTM, Merchant Center, Meta, LinkedIn, Microsoft UET, Clarity, Segment, Tealium, Hotjar, Criteo, Klaviyo, server-side ([vendor site](https://pixelauditor.ratanjhadigital.com/)). TikTok, Pinterest, Snap, X and Reddit are not named on the site (unverified whether supported).
- **Target user:** Agencies, analysts, privacy-minded marketers.
- **Pricing:** Free; **"No paid tier, ever"** ([vendor site](https://pixelauditor.ratanjhadigital.com/), checked 2026-10-16).
- **CWS:** 10,000 users · 5.0★ (3) · v2.6.0 · updated 14 Oct 2026 ([CWS](https://chromewebstore.google.com/detail/pixel-auditor-tag-pii-con/eclgcapbbmjdgialkpcikjficpahmidd)).
- **Onboarding:** Install (no account/card) → click icon → side panel opens and starts scanning → review, save, snapshot or export ([vendor site](https://pixelauditor.ratanjhadigital.com/)).
- **Standout:** Feature-for-feature the nearest thing to our product; ships fast (two releases noted in weeks).
- **Weaknesses:** **No multi-page crawl** mentioned; saved runs capped at 10 per browser; HTML report, not a branded PDF; no white-label; no scheduled monitoring; Chromium only ([vendor site](https://pixelauditor.ratanjhadigital.com/)).
- **Key screens:** Side panel with live stream, consent simulator, PII and server-side panels, grade, drag-resizable detail drawer, dark/light themes ([CWS](https://chromewebstore.google.com/detail/pixel-auditor-tag-pii-con/eclgcapbbmjdgialkpcikjficpahmidd)).
- **UX notes (public materials, not hands-on):** Positioned and designed almost identically to us (side panel, local-only, score, consent simulation, report). The "free forever" promise caps what we can charge for single-page features. Our Pro must be about **scale and client delivery**: multi-page scans, scheduled monitoring, branded/white-label PDF, history and "changes since last audit".

### 2.10 Pixel Auditor (side panel; jesperastrom.com)

- **What it does:** Pixels, Status, Activity and Requests tabs; timeline linking dataLayer pushes to triggered requests; GA4 ecommerce schema validation for 17 events; PII detection; Consent Mode decoding; request status; up to 1,000 requests and 1,000 dataLayer events per tab; JSON export; **"Copy & Debug with AI" / "Ask AI to review" buttons that open Claude with the data pre-loaded** ([CWS](https://chromewebstore.google.com/detail/pixel-auditor/aljkhoidejdlbahkbjnblbepancbeccn); [vendor page](https://www.jesperastrom.com/extensions/pixel-auditor/)).
- **Vendors:** GA4, GTM, Google Ads, Meta, LinkedIn, Microsoft UET, Clarity, TikTok, Snapchat, Pinterest, Shopify ([vendor page](https://www.jesperastrom.com/extensions/pixel-auditor/)).
- **Pricing:** Free, no account ([vendor page](https://www.jesperastrom.com/extensions/pixel-auditor/), checked 2026-10-16).
- **CWS:** 94 users · 5.0★ (1) · v5.2 · updated 18 May 2026 ([CWS](https://chromewebstore.google.com/detail/pixel-auditor/aljkhoidejdlbahkbjnblbepancbeccn)).
- **Weaknesses:** No banner test, report, crawl or history.
- **UX notes (public materials, not hands-on):** The AI hand-off is a cheap, popular idea: one button turning findings into a prompt. Worth copying as "Copy findings for AI" with PII redacted.

### 2.11 Adswerve dataLayer Inspector+

- **What it does:** Real-time dataLayer and GA hits in the DevTools console; checks dataLayer initialisation, multiple dataLayers, push and ecommerce validity, delivery and redirects; sGTM parameter view; push test events; inject code; block/swap scripts ([Adswerve](https://adswerve.com/technical-insights/adswerve-datalayer-inspector-tool-now-updated-for-google-analytics-4-and-gtm-server-side-tagging)). "Insert GTM Container" removed in v2024.11.1.1 under MV3 rules ([CWS](https://chromewebstore.google.com/detail/adswerve-datalayer-inspec/kmcbdogdandhihllalknlcjfpdjcleom)).
- **Target user:** Digital analysts on Google stack.
- **Pricing:** No price shown ([CWS](https://chromewebstore.google.com/detail/adswerve-datalayer-inspec/kmcbdogdandhihllalknlcjfpdjcleom), checked 2026-10-16).
- **CWS:** about 80,000 users · 4.1★ (59) · v2025.4.07.1 · updated 8 Apr 2025 ([CWS](https://chromewebstore.google.com/detail/adswerve-datalayer-inspec/kmcbdogdandhihllalknlcjfpdjcleom)).
- **Weaknesses:** Console output only; Google only; 18 months since update.
- **UX notes (public materials, not hands-on):** Output appears as `~`-prefixed console lines. Efficient for developers, opaque for marketers.

### 2.12 Stape GTM Helper

- **What it does:** Restructures GTM Preview / Tag Assistant for web and server containers: entity filter, JSON and URL formatters, tag-type colours with platform logos, **status colouring for 4xx/5xx**, **consent state in sGTM preview**, Shopify checkout debugging, bulk entity editing, and a **"Scan me" scanner** producing a tracking health report with step-by-step fixes ([Stape](https://stape.io/solutions/stape-gtm-helper)).
- **Target user:** GTM and server-side GTM implementers (Stape's hosting customers and others).
- **Pricing:** Free; no registration or Stape subscription needed ([Stape](https://stape.io/solutions/stape-gtm-helper), checked 2026-10-16).
- **CWS:** 9,000 users · 5.0★ (45) · v3.2.3 · updated 31 Aug 2026 ([CWS](https://chromewebstore.google.com/detail/ipjcocdbbjgkailaejllpnmeliblbimn)).
- **Onboarding:** Install → open GTM Preview, or press "Scan me" on any site ([Stape](https://stape.io/solutions/stape-gtm-helper)).
- **Standout:** Only tool showing consent inside server-side GTM preview; the free scanner is a lead magnet for Stape hosting.
- **Weaknesses:** Requires GTM access for most features; scanner depth unknown (unverified).
- **UX notes (public materials, not hands-on):** Augments Google's UI rather than replacing it, so learning cost is low for GTM users. The "Scan me → detailed report → fix steps" funnel is the same shape as our audit and is free, backed by a hosting company.

### 2.13 Consent Mode Inspector by InfoTrust

- **What it does:** Latest gcs, gcd explanation, `google_tag_data.ics.entries` table (shows v2 if ad_user_data/ad_personalization set), history of fired tags with consent state, screenshot capture, gcd calculator ([CWS](https://chromewebstore.google.com/detail/phpllnjdcoiijcpgcbhlocjgcegjfnhb)).
- **Target user:** Consent/privacy implementers on Google stack.
- **Pricing:** No price shown ([CWS](https://chromewebstore.google.com/detail/phpllnjdcoiijcpgcbhlocjgcegjfnhb), checked 2026-10-16).
- **CWS:** 20,000 users · 4.9★ (17) · v3.3.3 · updated 20 Nov 2024 ([CWS](https://chromewebstore.google.com/detail/phpllnjdcoiijcpgcbhlocjgcegjfnhb)).
- **Weaknesses:** Google consent only; no banner automation; almost two years without updates.
- **UX notes (public materials, not hands-on):** Small single-purpose popup. The screenshot button is a nice touch for evidence. A related newer tool, **Consent Mode V2 Inspector by My Agile Privacy**, also reads **Microsoft UET and Clarity consent** (281 users · 5.0★ (2) · v1.2.1 · updated 25 Mar 2026; [CWS](https://chromewebstore.google.com/detail/ehbkhkelglmedmdhaholbblibfpefifp)).

### 2.14 ConsentScope: Cookie & GDPR Checker (verified: it exists) — pricing benchmark

- **What it does:** Compares cookies, local/session storage, third-party scripts and requests before and after consent; recognises 20+ CMPs plus multilingual custom banners; cookie knowledge base; optional auto "Reject All" browsing mode ([vendor site](https://www.consentscope.pro/); [CWS](https://chromewebstore.google.com/detail/bckfbligemognhkpoojinnlemmiaifmj)). Pro adds: white-label PDF reports, scan history, privacy-policy vs reality analysis, 0–100 compliance score, dark-pattern detector, CMP config checker, IAB TCF v2.2 decoder, Google Consent Mode v2 analysis, network interception, DevTools panel, initiator trace, redacted HAR-style debug snapshot, cookie policy and DSAR generators, **bulk URL scanner (up to 20 sites)** ([vendor site](https://www.consentscope.pro/)).
- **Target user:** EU agencies, developers, privacy teams.
- **Pricing (vendor page, checked 2026-10-16):** Free $0; **Pro Lifetime $39.99 one-time**; **Monitor $29/month** (5 sites, 100 successful URL scans/month, weekly schedules, 90-day history); **Agency $69/month** (20 sites, 750 scans/month, daily or weekly schedules, client workspaces, white-label PDF/Markdown) ([vendor site](https://www.consentscope.pro/)). Pro and cloud features send scan data to ConsentScope's API; free stays local (search summary of the listing; unverified wording).
- **CWS:** 311 users · 5.0★ (30) · v1.4.2 · updated 5 Oct 2026 · in-app purchases · also on Firefox ([CWS](https://chromewebstore.google.com/detail/bckfbligemognhkpoojinnlemmiaifmj)).
- **Onboarding:** Install (no registration for free) → browse → analysis appears → export/fix; paid tiers need a website account synced to the extension ([vendor site](https://www.consentscope.pro/)).
- **Weaknesses:** Little tag-level QA (no pixel parameter validation, ecommerce, dedup or delivery status); score and Consent Mode are behind the paywall; account needed for Pro.
- **UX notes (public materials, not hands-on):** Marketing copy targets exactly our Pro buyer ("cheaper than one client report", "the deliverable clients pay you for"). Its pricing proves agencies will pay $29–$69/month for scheduled consent monitoring with white-label reports, and also anchors a lifetime deal at $39.99, which undercuts our $190/year.

### 2.15 ObservePoint (Debugger extension + platform)

- **Debugger:** Tags, all cookies (flags missing Secure/SameSite), tag variables, Adobe GET/POST parsing, on-click requests, consent-banner blocking check, **WCAG scan**, **GPC simulation**, **Excel export**, save/share sessions ([ObservePoint](https://www.observepoint.com/solutions/observepoint-debugger/); [help](https://help.observepoint.com/en/articles/9113174-observepoint-debugger-chrome-extension)). CWS: 30,000 users · 4.2★ (55) · v4.6.679 · updated 7 Oct 2026 · free ([CWS](https://chromewebstore.google.com/detail/daejfbkjipkgidckemjjafiomfeabemo)).
- **Platform:** Automated audits (page scans), Journeys (scripted user paths), privacy monitoring ([ObservePoint](https://www.observepoint.com/solutions/observepoint-debugger/)).
- **Pricing (vendor calculator, checked 2026-10-16):** Audits: first **100 page scans/year free**, then $0.17/page (next 50,000), $0.12 (next 500,000), $0.06 (next 1M), $0.04 (next 5M), $0.03 beyond. Journeys: 25 runs/year free; **$2,500** (1,500 runs), **$5,000** (6,000), **$15,000** (36,000), **$30,000** (144,000). VPN add-on $2,000 (included above $30K/year) ([ObservePoint pricing](https://www.observepoint.com/pricing/)). Estimate: 50 pages × weekly for a year = 2,600 scans ≈ $425/year for one site, before journeys.
- **Target user:** Enterprise analytics and privacy teams.
- **Onboarding:** Install Debugger → DevTools → ObservePoint tab; platform via "Try for Free" sign-up.
- **Weaknesses:** Enterprise UX and pricing; Debugger is DevTools-only; no ad-pixel parameter rules (unverified).
- **UX notes (public materials, not hands-on):** The free platform allowance (100 scans/year) is a real but tiny free tier. The Debugger is a funnel into the platform.

### 2.16 Trackingplan

- **What it does:** SDK-based continuous monitoring of analytics and pixels: anomaly detection, alerts, daily digests, AI agent reports; Compliance module (PII, cookies, consent) as an add-on ([pricing](https://trackingplan.com/pricing)). The extension debugs live with the SDK and detects rogue/duplicate events, UTM mistakes and server-side hits ([CWS](https://chromewebstore.google.com/detail/hbkdieebjlcagkakjapijfaekbbefkef)); docs say the download link is sent on request ([docs](https://docs.trackingplan.com/trackingplans-chrome-extension)).
- **Pricing (vendor page, checked 2026-10-16, EUR ex VAT):** **Starter €89/month** (300k sessions, 5 sites, 50 agent credits); **Growth €699/month** (1M sessions, 20 sites, 250 credits; Compliance add-on **€249/month**); **Enterprise from €2,000/month** (annual, compliance included). No free tier; 2-day learning + 7-day trial with 25 credits ([pricing](https://trackingplan.com/pricing)).
- **CWS (extension):** 97 users · 5.0★ (2) · v0.2.5 · **updated 8 May 2024** ([CWS](https://chromewebstore.google.com/detail/hbkdieebjlcagkakjapijfaekbbefkef)).
- **Target user:** Product/analytics teams at mid-size and large companies.
- **Weaknesses:** Needs SDK install on the client site and an account; extension neglected; compliance costs extra.
- **UX notes (public materials, not hands-on):** Monitoring is the product; the extension is an afterthought. Our "scheduled monitoring" at $19/month would be the cheap, no-SDK alternative for agencies.

### 2.17 dataslayer

- **What it does:** DevTools panel monitoring data layers from GTM, Adobe Launch/DTM, Tealium, TagCommander and custom objects; decodes GA, Adobe Analytics and Floodlight ([CWS](https://chromewebstore.google.com/detail/ikbablmmjldhamhcldjjigniffkkjgpo); [dataslayer.org](https://dataslayer.org/)).
- **Pricing:** No price shown ([CWS](https://chromewebstore.google.com/detail/ikbablmmjldhamhcldjjigniffkkjgpo), checked 2026-10-16).
- **CWS:** 70,000 users · 4.5★ (83) · v2.0.0 · updated 9 Jun 2025.
- **Weaknesses:** No ad pixels, consent or validation.
- **UX notes (public materials, not hands-on):** Classic analyst panel; strong with enterprise TMS users, irrelevant to the ad-pixel/consent buyer.

### 2.18 WASP.inspector (status)

- The historical listing ID `niaoghengfohplclhbjnjheodgkejpih` now resolves to `chromewebstore.google.com/detail/empty-title/…` with no content (fetched 2026-10-16; [CWS URL](https://chromewebstore.google.com/detail/niaoghengfohplclhbjnjheodgkejpih)), i.e. **no longer available**. Roundups still describe its tag-relationship visualisation ([MeasureSchool](https://measureschool.com/analytics-extensions/)). Nobody has replaced the "tag hierarchy" view.

### 2.19 Other tools found (shorter profiles)

| Tool | CWS data (2026-10-16) | What it does | Price | Relevance |
|---|---|---|---|---|
| **Insighter Debugger** | about 2,000 · 5.0★ (19) · v1.0.28 · 9 Oct 2026 ([CWS](https://chromewebstore.google.com/detail/insighter-debugger-gtm-ga/bfpddkljoofdiomkmbbmfgbgmfhpgoec)) | 200+ technologies; real-time events; dataLayer explorer; consent compliance checks; cookie/storage analysis; export; local-only | No price shown; product site would not render | Fast-growing indie rival |
| **Tracking Auditor** (open source) | 142 · no ratings · v1.1.0 · 2 Sep 2026 ([CWS](https://chromewebstore.google.com/detail/tracking-auditor/cngpoecoknpgfjfaafnekjoaeohaejpb); [GitHub](https://github.com/mbaersch/tracking-auditor-extension)) | DevTools; GA4 via Google Tag Gateway, Stape, taggrs, custom paths; **OpenAI ads pixel** with user-data source split; LinkedIn enhanced conversions; Microsoft UET; Meta silent-pixel warning; service-worker "Deep Capture" | No price shown | **Only tool found that decodes the OpenAI/ChatGPT ads pixel** |
| **Audit Pilot** | 12 · 5.0★ (2) · v1.0.0 · 20 May 2026 ([CWS](https://chromewebstore.google.com/detail/bpopbhodmhhbedeepfkmifaciaafjbgn)) | SEO/CRO/tracking-detection audit; AI insights; crawl; white-label PDF | Free (30 scans, 5-page crawl); **Pro $6.99/month**; **Premium $14.99/month** ([vendor](https://siteauditpilot.com/), checked 2026-10-16) | Shows white-label PDFs at very low price points; tracking depth shallow |
| **Datalayer Checker** (sublimetrix.com) | 100,000 · 4.4★ (49) · v3.0.4 · 10 Jul 2025 ([CWS](https://chromewebstore.google.com/detail/ffljdddodmkedhkcjhpmdajhjdbkogke)) | dataLayer table/JSON; snapshots of up to 100 dataLayers and compare; GTM injection removed for MV3 | No price shown | dataLayer only |
| **DataLayer Checker Plus** (growthacademy.io) | about 20,000 · 4.9★ (69) · v1.0.3 · 28 May 2025 ([CWS](https://chromewebstore.google.com/detail/datalayer-checker-plus/blglfmihmnbhfgfbomofeljmididgfhe)) | dataLayer inspection incl. Shopify customer events; connect GTM on any site | No price shown | Shopify angle |
| **Website Tracking Scanner** | 76 · 5.0★ (2) · v1.1 · 1 Jan 2026 ([CWS](https://chromewebstore.google.com/detail/website-tracking-scanner/kalenefadipiiogajgnpaddokacmomje)) | Detects GA, GTM, Meta, TikTok; live dataLayer | No price shown; discloses collecting "User activity" | Minor |
| **Shopify Pixel Helper** | Not found as a CWS listing; Shopify staff describe it as showing whether a custom pixel loaded and subscribed to events, with a green dot per event reaching the sandbox ([Shopify community](https://community.shopify.dev/t/testing-steps-2-no-longer-work-for-create-a-google-tag-manager-custom-pixel/7396)) | Sandbox load and subscription status | Free (unverified) | Validates our Shopify sandbox focus |
| **DataTrue** (SaaS) | n/a | Tag QA/monitoring platform | Starter $999/month, Team $1,999/month, 2 domains, 10,000 pages/month (third-party listings: [OMR](https://omr.com/en/reviews/product/datatrue/pricing), [Capterra](https://www.capterra.com/p/188014/DataTrue/); unverified on vendor page) | Enterprise ceiling |

---

## 3. Feature matrix

Legend: ✓ = yes · ✗ = no · partial = limited or only some vendors · ? = unknown from public materials. Sources are the profiles above. "Us" reflects the current build as described in the brief plus a code check of `src/` (e.g. UET `asc` decoding in `src/detectors.js`; TCF detected but not decoded in `src/page-probe.js`).

Column key: **Us** = Pixel & Tag Checker · **TA** = Google Tag Assistant · **Meta** = Meta Ads Data Advisor · **TT** = TikTok Pixel Helper · **Omni** = Omnibug · **AD** = Analytics Debugger · **TH** = TagHound · **APH** = All Pixel Helper · **PA** = Pixel Auditor (ratanjhadigital.com) · **OP** = ObservePoint Debugger + platform · **CS** = ConsentScope · **Stape** = Stape GTM Helper · **CMI** = InfoTrust Consent Mode Inspector · **TP** = Trackingplan · **DS** = dataslayer · **ADW** = Adswerve dataLayer Inspector+

| Feature | Us | TA | Meta | TT | Omni | AD | TH | APH | PA | OP | CS | Stape | CMI | TP | DS | ADW |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Platforms covered (count) | 15 + custom | Google only | Meta only | TikTok only | 69 | 20+ | 22 | 40 | ~14 named | many (?) | n/a (cookies) | GTM tags | Google consent | analytics + pixels | GA, Adobe, Floodlight | Google |
| Meta, TikTok, LinkedIn, Pinterest, Snap, X, Reddit, UET all decoded | ✓ | ✗ | ✗ | ✗ | ✓ | partial | partial | ? | partial | ? | ✗ | partial | ✗ | ? | ✗ | ✗ |
| Custom / user-defined providers | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ? | ✗ | ✗ | ✗ | ? | partial (custom JS objects) | ✗ |
| First-party / proxied / server-side endpoint detection | ✓ | partial | ✗ | ✗ | ✗ | partial (sGTM) | ? | ? | ✓ | ? | ✗ | ✓ (sGTM) | ✗ | ✓ | ✗ | partial (sGTM) |
| Server-side / CAPI visibility (dedup event_id) | ✓ | ✗ | partial (account side) | ✗ | ✗ | partial | ? | partial (event_id check) | ✓ | ✗ | ✗ | partial (sGTM preview) | ✗ | partial | ✗ | ✗ |
| ChatGPT / OpenAI ads pixel (OAIQ) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ? | ✗ | ? | ✗ | ✗ | ✗ | ? | ✗ | ✗ |
| Shopify custom-pixel sandbox capture | ✓ | ✗ | partial (Shopify setup) | ✗ | ✗ | ✗ | ✗ | ✓ | partial (`trackShopify`) | ✗ | ✗ | partial (checkout) | ✗ | ✗ | ✗ | ✗ |
| One-click audit with score | ✓ (0–100) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (A–F/100) | ✗ | ✓ Pro (0–100) | partial (scanner) | ✗ | ✗ | ✗ | ✗ |
| Validation rules with fixes | ✓ 50+ | partial | ✓ Meta | ✓ TikTok | ✗ | partial | ✓ 1,200+ | ✓ | ✓ | partial | partial | partial | ✗ | ✓ | ✗ | partial |
| Duplicate event detection | ✓ | ✗ | ✓ | ✗ | ✗ | ? | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Ecommerce parameter checks | ✓ | ✗ | ✓ Meta | ✓ TikTok | ✗ | partial | ? | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Cross-platform value/currency consistency | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (reconciliation) | ✗ | ✗ | ✗ | ✗ | ? | ✗ | ✗ |
| Enhanced Conversions hashing checks | ✓ | ✗ | ✗ | ✗ | ✗ | ? | ? | partial | partial (field names) | ✗ | ✗ | ✗ | ✗ | ? | ✗ | ✗ |
| PII leak detection | ✓ | ✗ | ✗ | partial (format only) | ✗ | ✗ | ? | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ (€249 add-on) | ✗ | ✗ |
| Delivery status / latency / ad-blocker per hit | ✓ | partial | partial (blocked warning) | ✗ | ✗ | partial (sGTM response) | ? | ✓ | ✓ | ✓ (performance) | ✗ | ✓ (4xx/5xx) | ✗ | ? | ✗ | partial |
| Placement checks (head, order) | ✓ | partial | ✓ | ✓ | ✗ | ✗ | ? | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Consent Mode v2 decoding (gcs/gcd) | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ? | ✓ | ✓ | ✗ | ✓ Pro | partial (sGTM) | ✓ | partial | ✗ | ✗ |
| Microsoft UET consent (`asc`) | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ? | ? | ? | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| IAB TCF / GPP string decoding | partial (detects TCF) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | partial (US Privacy) | ✓ | ✗ | ✓ Pro | ✗ | ✗ | ✗ | ✗ | ✗ |
| Automated Accept-all / Reject-all banner test | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | partial (simulate) | ✓ (19 CMPs) | partial (banner check) | partial (auto-reject) | ✗ | ✗ | ✗ | ✗ | ✗ |
| GPC test | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Cookie table before/after consent | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | partial | partial (cookie list) | ✓ | ✗ | ✗ | partial | ✗ | ✗ |
| Request inspector | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | partial Pro | ✓ | ✗ | ✓ | ✓ | ✓ |
| dataLayer view / timeline | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ? | ✓ | ✓ |
| GTM Preview integration | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Funnel / session audit across pages | ✓ | ✓ | ✓ (session log) | ✗ | ✗ | ? | ✓ (record) | ✗ | partial | ✓ (journeys, paid) | ✗ | ✗ | partial (history) | ✓ | ✗ | ✗ |
| Multi-page crawl | ✓ (3 free / 50 Pro) | partial (coverage) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (paid) | ✓ Pro (20 sites) | ✗ | ✗ | n/a (SDK) | ✗ | ✗ |
| Tag coverage gaps across pages | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | partial (silent tags) | ✓ (paid) | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Scheduled monitoring / alerts | ✓ Pro | ✗ | ✓ (account) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (paid) | ✓ ($29+/mo) | ✗ | ✗ | ✓ | ✗ | ✗ |
| Client report (PDF/HTML) | ✓ branded PDF | ✗ | partial (action summary) | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ HTML | partial (Excel) | ✓ Pro PDF | partial (scanner) | partial (screenshot) | ✓ (digests) | ✗ | ✗ |
| White-label report | ✓ Pro | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ? | ✓ Pro | ✗ | ✗ | ? | ✗ | ✗ |
| Changes since last audit / diff | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ? | ✓ Pro | ✗ | ✗ | ✓ | ✗ | ✗ |
| Saved history | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (10 runs) | ✓ | ✓ Pro | ✗ | ✗ | ✓ | ✗ | ✗ |
| Export formats | CSV, JSON, HAR, PDF | session export/import | ✗ | ✗ | CSV/TSV (per old notes) | ✓ (formats ?) | ✓ (formats ?) | CSV | HTML, CSV | Excel | PDF, JSON, CSV, MD, HAR-style | ✗ | screenshot | ✓ (tracking plan) | ✗ | ✗ |
| AI assistance | ✗ | ✗ | ✓ (automation) | ✗ | ✗ | ✗ | ✗ | ✗ | partial (plain-language summary) | ✗ | ✗ | ✗ | ✗ | ✓ (agent credits) | ✗ | ✗ |
| Code/container injection | ✗ (by design) | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | partial (consent inject) | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ |
| Side panel UI | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ? | ✗ | ✗ | ✗ | ✗ | ✗ |
| Local-only, no data leaves browser | ✓ | ✗ | ✗ | ? | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ (platform) | partial (free only) | ? | ? | ✗ | ? | ? |
| Account needed | ✗ | partial (web app) | optional | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (platform) | ✓ (Pro) | ✗ | ✗ | ✓ | ✗ | ✗ |
| Actively updated (2026) | ✓ | ✓ | ✓ | ✓ | ✗ (Jan 2025) | ✓ | ✗ (Dec 2024) | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ (Nov 2024) | ✗ ext (May 2024) | ✗ (Jun 2025) | ✗ (Apr 2025) |
| CWS users | new | 3M | 3M | 600K | 200K | 100K | 60K | 145 | 10K | 30K | 311 | 9K | 20K | 97 | 70K | 80K |
| Price | Free; Pro $19/mo or $190/yr (planned) | Free | Free | Free | Free | Free | Free | Free | Free forever | Debugger free; 100 scans/yr free, then $0.17→$0.03/page; journeys $2.5K–$30K/yr | Free; $39.99 lifetime; $29/mo; $69/mo | Free | Free | €89 / €699 / €2,000+ per month | Free | Free |

---

## 4. Pricing landscape (checked 2026-10-16)

| Product | Free | Paid | Model |
|---|---|---|---|
| All official helpers, Omnibug, Analytics Debugger, TagHound, dataslayer, Adswerve, Stape, InfoTrust | Everything | none | Free (vendor lead-gen or open source) |
| Pixel Auditor (ratanjhadigital.com) | Everything | "No paid tier, ever" ([site](https://pixelauditor.ratanjhadigital.com/)) | Free |
| Audit Pilot | 30 scans, 5-page crawl | $6.99 / $14.99 per month ([site](https://siteauditpilot.com/)) | Freemium SEO/CRO tool |
| ConsentScope | Page-level detection | $39.99 lifetime; $29/mo Monitor; $69/mo Agency ([site](https://www.consentscope.pro/)) | Freemium + cloud monitoring |
| **Pixel & Tag Checker (us)** | Full single-page audit, 3-page scan | **$19/mo or $190/yr (planned)** | Freemium, local-only |
| Trackingplan | none (9-day trial) | €89 / €699 / €2,000+ per month ([pricing](https://trackingplan.com/pricing)) | SaaS, SDK |
| ObservePoint | 100 page scans + 25 journey runs/year | per-page $0.17→$0.03; journeys $2,500–$30,000/yr ([pricing](https://www.observepoint.com/pricing/)) | Usage-based enterprise |
| DataTrue | trial | $999–$1,999/month (third-party, unverified) ([OMR](https://omr.com/en/reviews/product/datatrue/pricing)) | Enterprise SaaS |

Takeaways:

1. **Single-page tag QA is now free everywhere**, including consent simulation, PII and a score (Pixel Auditor). Charging for anything a one-page audit does will not work.
2. **The paid market for small agencies sits at $29–$69/month (ConsentScope) and is consent-only.** Nobody sells tag QA plus consent plus white-label reports plus scheduled scans in the $15–$70/month range. Our $19/month Pro sits at the bottom of that gap: credible, possibly underpriced for an Agency tier.
3. **Lifetime deals are an anchor** ($39.99 ConsentScope). Consider a launch lifetime offer or make the annual plan clearly better value.
4. The next step up is €89/month (Trackingplan, needs an SDK) and then four figures. Room exists for an "Agency" tier (e.g. more monitored sites, client workspaces) at $49–$69/month (estimate).

---

## 5. Biggest threats

1. **Pixel Auditor (ratanjhadigital.com):** 10,000 users within months, ships CMP auto-click, PII, server-side detection, an A–F score, diffs and an HTML report, free forever, updated two days ago ([CWS](https://chromewebstore.google.com/detail/pixel-auditor-tag-pii-con/eclgcapbbmjdgialkpcikjficpahmidd)). It neutralises our free-tier differentiation.
2. **ConsentScope:** owns the "agency consent audit + white-label PDF + scheduled monitoring" story with public prices ([site](https://www.consentscope.pro/)). If it adds pixel parameter validation, it becomes a direct Pro competitor.
3. **Meta Ads Data Advisor** and **Tag Assistant** keep moving into automation and guidance with first-party account data we cannot access ([Meta docs](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper); [CWS](https://chromewebstore.google.com/detail/tag-assistant/kejbdjndbnbjgmefkgdddjlbokphdefk)).
4. **Stape's free "Scan me" report** gives away a tracking health report with fix steps, backed by a hosting business ([Stape](https://stape.io/solutions/stape-gtm-helper)).

## 6. Gaps nobody fills (opportunities)

| Gap | Evidence | Suggested action |
|---|---|---|
| **ChatGPT / OpenAI ads pixel (OAIQ) QA** | OpenAI launched a pixel and Conversions API in 2026 ([ppc.land](https://ppc.land/openais-chatgpt-ads-are-getting-conversion-optimization-heres-what-changes/); [North Country Growth](https://www.northcountrygrowth.com/blog/chatgpt-ads-conversion-tracking-oaiq-pixel-conversions-api/)); EU availability reported from 31 Aug 2026 ([Axeptio](https://www.axept.io/blog/chatgpt-ads-pixel-tracking-openai-vendors)). Only the 142-user open-source Tracking Auditor decodes it ([CWS](https://chromewebstore.google.com/detail/tracking-auditor/cngpoecoknpgfjfaafnekjoaeohaejpb)). | Add OpenAI as platform 16 with consent, PII and dedup checks; use in launch messaging. |
| **Tag QA + consent + white-label report + scheduled multi-page monitoring in one tool under $70/month** | Pixel Auditor has no crawl, monitoring or white-label; ConsentScope has no tag validation; ObservePoint/Trackingplan are enterprise-priced (sections 2.9, 2.14–2.16). | This is our Pro story. Lead with it. |
| **Official-quality LinkedIn Insight QA** | No official helper; third-party ones are tiny, stale or flagged high-risk (section 2.4). | Deepen LinkedIn checks (conversion IDs, enhanced conversions fields); SEO page "LinkedIn Insight Tag checker". |
| **Microsoft UET + Clarity consent** | Only a 281-user extension covers both ([CWS](https://chromewebstore.google.com/detail/ehbkhkelglmedmdhaholbblibfpefifp)); UET Tag Helper shows raw `asc` only. | We already decode `asc`; add Clarity consent and market it for the EEA/UK enforcement. |
| **Tag hierarchy / "which tag loaded which"** | WASP gone (section 2.18); ConsentScope Pro has initiator trace only for consent. | P2: initiator chain per hit in the report. |
| **IAB TCF v2.2 / GPP decoding for ad-tech audits** | Only Pixel Auditor (free) and ConsentScope Pro decode strings. | Decode `euconsent-v2` and GPP; we already detect `__tcfapi`. |
| **AI hand-off with PII redaction** | Pixel Auditor (jesperastrom.com) "Copy & Debug with AI"; Trackingplan agent credits. | Cheap win: "Copy findings for AI" with values redacted. |

## 7. Where competitors remain stronger (unchanged or new)

- **GTM Preview integration:** Tag Assistant, Stape, Analytics Debugger, TagHound. Keep recommending them alongside us.
- **First-party account data** (Events Manager, catalogue match rate, automation): Meta Ads Data Advisor.
- **Analytics-suite breadth** (Adobe, Tealium, Snowplow): Omnibug (69 entries), Analytics Debugger, dataslayer.
- **Rule count marketing:** TagHound claims 1,200+ rules vs our 50+ checks. Consider counting per-vendor rules the same way for the store listing, if accurate.
- **Firefox availability:** ConsentScope, Analytics Debugger, dataslayer are on Firefox; we are Chrome-only.
- **Install base and ratings:** official helpers have millions of users; TagHound has 4.8★ from 111 ratings. We start from zero.

## 8. Sources not reachable on 2026-10-16

- help.x.com pixel helper page (HTTP 403), trafikant.pro (HTTP 503), Insighter product site (did not render), ObservePoint Debugger cookie export details (not documented). Facts that depended on them are marked unverified above.
