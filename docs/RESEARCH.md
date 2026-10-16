# Research summary: Pixel & Tag Checker

_Phase 1 conclusions, 2026-10-16. The detail and every source URL are in `docs/research/`:_
- _`COMPETITORS.md`: 18 deep dives, 8 short profiles, a 41-row feature matrix._
- _`REVIEWS.md`: 231 tagged reviews and comments._
- _`DEMAND.md`: autocomplete for about 90 seeds (US and India), store install counts._
- _`PERSONAS.md`: 4 personas._
- _`PLATFORM-SPECS.md` and `RISKS.md`: official docs plus vendor source code, each item labelled VERIFIED, SECONDARY or UNVERIFIED._

## What the market looks like

- **Single-page tag checking is now free everywhere.**
  - The official helpers have 3M users each. Meta's helper is now "Meta Ads Data Advisor", rated 2.1★. Tag Assistant Companion is being folded into Tag Assistant.
  - A 2026 wave of free side-panel tools also covers this: Pixel Auditor (10K users, banner auto-click, Consent Mode, PII, A–F score, HTML report, "no paid tier, ever"), All Pixel Helper and Insighter.
  - Our free tier can't win on "we detect more tags" alone.
- **Several incumbents are stale:** Omnibug, Adswerve, dataslayer, the InfoTrust consent inspector, TagHound (last updated Dec 2024), and the Pinterest and Snap helpers. WASP is gone.
- **Paid tools sit either far above or far below us:**
  - Above: ObservePoint ($2.5k–$30k a year for journeys) and Trackingplan (€89–€2,000+ a month, needs code installed on the site).
  - Below: shallow audit tools at $7–$15 a month.
  - Closest: ConsentScope ($39.99 lifetime; Monitor $29/mo for 5 sites; Agency $69/mo for 20 sites plus white-label) sells "consent audit + report + monitoring" to our buyer, but does no pixel checks.
- **Gap nobody fills:** tag checks, consent behaviour, a white-label report and scheduled multi-page monitoring in one tool under $70 a month. That is our Pro story.

## What users struggle with (REVIEWS.md, row counts)

1. The helper shows nothing or "doesn't work" (33), often because the tag is deployed through GTM, a template or the server, or an ad blocker is on.
2. The event fires in the browser but never shows up in the platform (26). "Did it reach the platform?" is the top implicit request (demand signal about 32).
3. Consent problems (14), plus Microsoft UET breaking after consent changes (14) while the official UET helper fails. Users want to see what fires before and after consent (demand signal about 17), and "blocked by consent" rather than "not found".
4. Shopify sandbox and Indian checkouts (Shiprocket, GoKwik, Razorpay) hide events (13). Ad blockers and Brave (11). Abandoned or broken tools (11).
5. Meta health and sensitive-data restrictions block events (10). Users find out after their events are blocked, and the fix is usually words in URLs or event names.
6. Cryptic errors with no guidance (8). Praise goes to a quick "is it firing?" answer and colour-coded pass/fail (25).

## What people search for (DEMAND.md)

- **Head terms:** "meta/facebook pixel helper", "tag assistant", "pixel checker".
- **High intent:** "pixel not firing / not tracking purchases", "ga4 not tracking purchases", "google tag not detected", "pixel firing twice".
- **Rising:** "consent mode v2 checker", "cookie banner test", "gpc checker".
- **Emerging:** "openai pixel helper" and "chatgpt ads pixel". At least 8 tiny helpers exist; the largest has about 2K users.
- **India:** "facebook pixel" and "meta pixel" are used interchangeably; also "razorpay meta pixel" and "conversion api full form".
- **Vocabulary:** use "firing / fired before consent / personal data / client report", not "beacon", "CMP" or raw gcs/gcd codes.

## Rules and platforms that changed (PLATFORM-SPECS.md, RISKS.md)

- **OpenAI ChatGPT Ads pixel and Conversions API: VERIFIED.**
  - Script `bzrcdn.openai.com/sdk/oaiq.min.js`; browser events to `bzr.openai.com/v1/sdk/events` (a JSON body by beacon or fetch, or a GET image tag).
  - The Conversions API is `bzr.openai.com/v1/events` with a Bearer key. It must never be called from the browser.
  - Click ID `oppref` is read from the landing URL, stored in the `__oppref` cookie for 30 days, and must be forwarded unchanged to the Conversions API.
  - 10 standard events. Amount is an integer in minor units. Consent defaults to granted, and there's no consent flag on the wire.
- **Microsoft UET Consent Mode** has been required for EEA, UK and Switzerland traffic since 5 May 2025. The wire signal is `asc=G` or `asc=D`; a missing `asc` means no consent signal.
- **Clarity consent** has been enforced in the EEA, UK and Switzerland since 31 Oct 2025.
- **Meta, TikTok, LinkedIn, X, Pinterest, Snap, Reddit and Hotjar** carry no consent parameter. Pre-consent firing can only be detected by timing against the banner choice.
- **Meta data restrictions** come in three tiers: core setup, standard-event blocks, full restriction. Meta scans URLs, UTMs, custom event names and custom data for health, financial and identifier terms.
- **India DPDP Rules** were notified 13/14 Nov 2025, with core consent duties from 13 May 2027 (SECONDARY dates).
- **UK DUAA** cookie changes took effect 5 Feb 2026.
- **About 12 US states require honouring GPC** (SECONDARY list).
- **Chrome Web Store:** no remote code; name at most 5 platforms in the description; no competitor names or logos in the title; add a "not affiliated" disclaimer.

## Conclusions that drive the spec

1. **Lead with consent behaviour, per vendor, on a timeline.** Show what fired before the banner choice, at the choice, and after accepting or rejecting, with pass/fail per vendor. No competitor shows this per vendor with UET and OpenAI included. It answers pains 3 and 6 and serves the auditor and verifier personas.
2. **Be first for ChatGPT Ads.** Make OpenAI platform 16: decode its events, check `oppref` capture and forwarding, flag a Conversions API key exposed in the browser, run PII and dedup checks. It's cheap, nobody covers it yet, and it suits the launch.
3. **Warn before Meta blocks.** A sensitive-data pre-check on Meta hits (URL, UTM, custom event names, custom data), worded as "may trigger Meta data restrictions", never "your account is restricted".
4. **Explain, don't just detect.** Every finding gets a plain-English cause and fix. Say "blocked by consent" or "blocked by an ad blocker" where we can tell, rather than "not found". We already show delivery status per hit.
5. **Be honest about limits.** The browser can't see server-side, Conversions API or Events Manager processing. Say so wherever it matters (OpenAI Conversions API forwarding, Meta categories, deduplication).
6. **Pro is the bundle.** White-label report, multi-page scan with consent test, history with "changes since", and monitoring, under $70 a month. Free must stay the best single-page checker.
7. **Store listing:** keep the agreed title. Describe the tool as a free alternative to the official pixel helpers and tag assistants without naming them in the title. Name at most five platforms, and add a disclaimer.
