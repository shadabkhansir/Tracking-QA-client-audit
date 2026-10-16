# Feature gaps vs. competitors

_Researched 2026-10-15 from Chrome Web Store listings, vendor docs and GitHub issues (no competitor code inspected). Companion to [competitive-analysis.md](competitive-analysis.md)._

Priority reflects our buyer (agencies and freelancers auditing client sites), not feature count. **P1** = build next, **P2** = worth it later, **Skip** = off-target or risky.

## P1: build next

> **Status (v0.4.0, 2026-10-15): all 10 P1 items are built**, with unit tests and real-browser tests. Next up is the P2 list below.

| # | Gap | Who has it | Why it matters for audits | Effort |
|---|---|---|---|---|
| 1 | **Hit delivery status**: HTTP status, size and latency of every tracking request; flag 4xx/5xx and blocked hits | ObservePoint (size/latency/status), Stape (4xx/5xx in sGTM preview) | The nearest an extension can get to users' #1 ask: "did the platform actually receive it?" Today we only see that a request was sent | S (`webRequest.onCompleted` / `onErrorOccurred`) |
| 2 | **Google Ads Enhanced Conversions checks**: user data present on conversions, hashed vs clear text, address shape; show conversion label and currency per conversion | Google EC Assist, "Enhanced Conversion Data", Analyzify | EC is now standard on every Google Ads account; agencies are asked to verify it constantly | M |
| 3 | **Shopify Customer Events sandbox**: capture events from custom pixels in Shopify's sandboxed iframe; flag the sandbox URL being reported as the page URL | Stape GTM Helper, Shopify Pixel Helper | Huge share of agency clients are on Shopify; the sandbox-URL bug is a common complaint no tool flags | M |
| 4 | **Full cookie table**: name, domain, expiry and owning vendor, split before and after consent | ObservePoint | Turns "cookies present while denied" into proof a DPO will accept; we currently list names only | S (`cookies` permission) |
| 5 | **Global Privacy Control (GPC) test**: reload with `Sec-GPC: 1` + `navigator.globalPrivacyControl`, then diff tags | ObservePoint | Required by US state laws (CCPA/CPRA and others), so it opens the US market alongside the EU consent tests | M (declarativeNetRequest header rule) |
| 6 | **Placement and order checks**: GTM snippet / Meta base code not in `<head>`; event sent to a Google product before its config fired; dataLayer push without an `event` key; more than one conversion event per page with no user action | Adswerve, Meta Data Advisor, Tag Assistant | Cheap rules that match what vendor helpers already warn about, so clients see the same advice from us | S |
| 7 | **More TikTok and Meta helper parity**: TikTok first-party cookie (`_ttp`) missing, invalid pixel ID format, unsupported event names, missing email/phone on CompletePayment; Meta "auto-detected" events | TikTok Pixel Helper, Meta Data Advisor | Closes the remaining official-helper warnings | S |
| 8 | **Proxied / CNAME / Google Tag Gateway endpoints and custom providers**: detect vendor payloads on first-party domains (Meta CAPI gateway, TikTok/Meta proxies), plus user-defined provider patterns | Open Omnibug requests: nobody does this well | Server-side and gateway setups are where agencies sell upgrades, and current tools go blind there | M |
| 9 | **Tag coverage summary**: in scans, list pages where GTM, GA4 or a pixel is missing, compared with the site norm | Tag Assistant | One-line finding that catches untagged templates (checkout, blog) | S |
| 10 | **HAR export, and import of saved sessions/audits** for read-only replay | Tag Assistant (export/import sessions), Omnibug HAR request (open) | Lets a client's developer reproduce the issue; makes audits shareable without the extension | S |

## P2: worth adding later

| Gap | Who has it | Note |
|---|---|---|
| Consent simulation without a banner (force granted/denied through gtag) | ConsentFlow Debugger | Fallback when the CMP can't be clicked automatically |
| GA4 DebugView toggle (`debug_mode` / `_dbg`) | Analytics Debugger, Tag Assistant | Lets users confirm events in GA4's own UI |
| DevTools panel as an alternative to the side panel | Omnibug, dataslayer, ObservePoint | Developer preference; side panel stays primary |
| Notes per request, hide/clear individual requests, highlighted parameters, raw/friendly toggle, custom columns | Omnibug (+ open requests) | Inspector polish |
| Call stack and timing for each dataLayer push | Adswerve | Shows developers which script pushed bad data |
| One-click screenshot of the panel/finding inside the report | InfoTrust | Visual proof in client reports |
| gcd/gcs decoder input (paste a value) | InfoTrust | Tiny utility, good for SEO/landing page |
| dataLayer snapshots + compare | Datalayer Checker | Overlaps with our audit diff; nice for devs |
| Navigation/click blocker (stop a link leaving the page) | Analytics Debugger | Preserve log already covers most cases |
| Debug pop-ups and new tabs in one session | Tag Assistant | Matters for payment pop-ups (PayPal) |
| Microsoft Clarity consent signals | My Agile Privacy inspector | Clarity now has its own consent API |
| Edge listing (and later Firefox) | Omnibug, ObservePoint, Meta | Edge is a re-listing with almost no code changes |
| ~~Rename / label IDs (e.g. "G-ABC = Main property")~~ **built in 0.4** | Omnibug request | Makes client reports readable |

## Skip (and why)

| Gap | Who has it | Why we skip |
|---|---|---|
| GTM Preview enhancer, container injection, environment/library switching | Stape, Analytics Debugger, Tealium, Adobe, Adswerve | Developer tooling; injecting code on client production sites is a liability, and Manifest V3 restricts it (Datalayer Checker removed theirs) |
| Request blocking / script swapping | Analytics Debugger, Adswerve | Same risk; not needed for audits |
| Adobe / Tealium / Snowplow / Piwik / Amplitude coverage | Omnibug, Analytics Debugger, dataslayer | Enterprise analytics buyer, not our ad-pixel/consent buyer |
| Logged-in account data (Events Manager, catalog match rate, CAPI verification, Adobe report suites) | Meta Data Advisor, Adobe Debugger | Needs each vendor's OAuth/API approval; big lift. Revisit as a Pro+ tier once there are paying users |
| Automated pixel/CAPI setup, CRM connections | Meta Data Advisor | Different product (implementation, not audit) |
| WCAG accessibility scan, tech-stack detection | ObservePoint, Wappalyzer | Unrelated to tracking QA |
| Mobile app tracking, Safari | Analytics Debugger for Apps; nobody (Safari) | Different platforms entirely |

## User demands nobody meets (marketing angles)

- **"Did it actually arrive?"** TikTok helper users report events that never reach Events Manager. P1 #1 (delivery status) is our best answer without account access.
- **Pixels deployed through GTM or blocked by ad blockers/Brave** confuse the vendor helpers. We already detect GTM-deployed pixels by network request; the landing page should say so.
- **Shopify custom pixels report the sandbox URL** (P1 #3).
- **HAR export** and **custom providers** (open Omnibug requests, P1 #8 and #10).
- **"Just make the core work, no AI pop-ups"** (Meta Data Advisor reviews): keep the panel quiet and fast.

## Notes on the research

- No evidence that "TagHound" exists (it was cited in Gemini's feedback). There's no official LinkedIn helper, and no Elevar/Littledata extension.
- Unverified: Analytics Debugger's sGTM response view, Tag Explorer's tag hierarchy, the UET Tag Helper's goal checks, X Pixel Helper's 30-fire history, and all Pinterest Tag Helper details.
