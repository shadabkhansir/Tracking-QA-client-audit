# Personas

Product: "Pixel & Tag Checker: GA4, GTM, Meta Audit" by The Growth Folks®
Research date: 16 October 2026. Companion to [DEMAND.md](./DEMAND.md).

**Evidence base.** Reddit threads (cited from search-result excerpts, since Reddit pages could not be fetched in full), Shopify Community, job postings, freelance marketplaces and Chrome Web Store listings. Personas are composites. Where a statement is inference rather than a sourced fact, it is marked *(inference)*. No real people are described.

**Feature key.** *Existing* = the extension today: multi-vendor detection (GA4, GTM, Meta, TikTok, LinkedIn, Pinterest, Snap, X, UET, Reddit, Clarity, Hotjar), Consent Mode v2, GPC, consent banner accept/reject test, PII checks, delivery status, multi-page scan, branded client PDF. *Candidate* = under consideration: OpenAI/ChatGPT ads pixel check, pre-consent firing timeline per vendor, Meta sensitive-data pre-check, monitoring.

---

## Persona 1: Agency or freelance tracking specialist ("the auditor")

**Who.** Works at a performance or analytics agency, or freelances on Upwork/Fiverr. Onboards new clients and inherits their setups. Is often the one person at the agency who "does GTM" ([Reddit: "Who at your agency handles GA4 and GTM?"](https://www.reddit.com/r/GoogleTagManager/comments/1cg4pe1/who_at_your_agency_handles_ga4_and_gtm/)).

**Goals**
- Audit a new client's tracking fast and win or scope the engagement.
- Prove what was broken before they arrived, and what they fixed.
- Catch breakages before the client does.

**Context**
- Agencies "double check on conversion tracking during our onboard with an audit and maintain it while we have the client" ([r/PPC](https://www.reddit.com/r/PPC/comments/14zzuql/for_google_ads_agencies_client_conversion_tracking/)).
- Agency job ads ask for "agency-wide standards for GA4 and GTM implementation plus QA processes" and Consent Mode v2 ([Digital Analytics & Tracking Lead, Manchester](https://www.itjobswatch.co.uk/jv/TrunkBBI/Digital-Analytics-Tracking-Lead-Job-Manchester-UK-4w42f2)). Another lists "QA and monitoring" as core for multi-client work ([Arc.dev](https://arc.dev/remote-jobs/details/senior-tracking-attribution-lead-pt-worldwide-pkklee26k6)).
- Audits are sold as products: $50 to $100 Fiverr gigs covering "GA4, GTM, Meta pixel, consent" ([Fiverr](https://fiverr.com/ashiiq82/audit-your-google-ads-campaigns-and-fix-conversion-tracking-issues)), and $149/$349/$649 Upwork tiers ([Upwork](https://www.upwork.com/services/product/marketing-full-digital-audit-to-boost-traffic-leads-and-sales-across-google-ads-ga4-2050689937812879011)). Clients post "Full Tracking Audit, Consent Mode v2" briefs ([Upwork](https://www.upwork.com/freelance-jobs/apply/GA4-GTM-Specialist-Needed-Full-Tracking-Audit-Consent-Mode-and-Custom-Funnels_~022099609042293175990/)).
- The usual findings are duplicate conversion tags and triggers on the wrong pages ([GTM audit guide](https://piotrlitwa.com/articles/en/gtm-audit.html)). One Reddit post says "almost every tracking setup I audit has the same mistake" ([r/analytics](https://www.reddit.com/r/analytics/comments/1rxkryy/almost_every_tracking_setup_i_audit_has_the_same/)).

**Tools today.** Tag Assistant (3M users), Meta Pixel Helper, now Meta Ads Data Advisor (3M users, 2.1★), TikTok Pixel Helper, Omnibug, dataslayer, GTM Preview, DevTools Network tab, Consent Mode Inspector. See the CWS figures in [DEMAND.md §1](./DEMAND.md#1-sourced-demand-proxy-chrome-web-store-installs-16-oct-2026).

**Current workaround.** Opens five to eight vendor helpers one at a time, screenshots each, and pastes them into a Google Doc or Slides audit. Repeats on several pages by hand *(inference from the tool mix and audit deliverables above)*.

**Pains**
- Tool sprawl: one extension per vendor, each with its own UI.
- No client-ready output. Screenshots have to be rebuilt into a report.
- The client finds the breakage first: "pixels break, GA4 stops recording… How do you…" ([r/analytics](https://www.reddit.com/r/analytics/comments/1ucqb8u/does_your_client_ever_find_out_their_tracking/)).
- Consent testing is manual: clear cookies, reload, click Reject, watch the Network tab.
- Paid audit SaaS is expensive for small agencies. Tracking Auditor starts at $199 per user per month ([aidoos listing](https://aidoos.com/products/tracking-auditor/)).

**What "done" looks like.** One branded PDF covering every vendor, consent behaviour, PII and duplicates across key pages, with clear "fix this" items. Sent to the client the same day.

**Triggers to install**
- A new client onboarding.
- A pitch where showing "your tracking is broken" wins the deal.
- Meta Pixel Helper rebrand or Tag Assistant UI frustration.
- An EU client asking about Consent Mode v2.

**Objections**
- "Will it see server-side / CAPI events?" (No, it is browser-side. Say so honestly.)
- "Is the report white-label?" (Pro only.)
- "Does it send my clients' data anywhere?"
- "Another extension with broad permissions?"

**Feature map**
| Need | Existing | Candidate |
|---|---|---|
| All vendors in one view | Multi-vendor detection, delivery status | OpenAI/ChatGPT pixel check |
| Whole-site view | Multi-page scan | Monitoring (scheduled re-scan, alert on change) |
| Client deliverable | Branded client PDF (Free: TGF credit; Pro: white-label) | Before/after comparison in the report |
| Consent proof | Accept/reject test, Consent Mode v2, GPC | **Pre-consent firing timeline per vendor** (highest value for this persona) |
| Risk findings | PII checks | Meta sensitive-data pre-check |

---

## Persona 2: D2C founder or e-commerce operator, including India ("the owner")

**Who.** Runs or co-runs a Shopify, WooCommerce or Wix store spending on Meta (and increasingly Google). Not a developer. In India, often uses a one-click checkout (GoKwik, Shiprocket) and Razorpay.

**Goals**
- Make sure Meta "sees" sales so ads optimise. Stop "burning money".
- Know whether the agency or freelancer set things up properly.

**Context**
- Typical threads: "Meta Pixel Not Tracking Purchase Event on Shopify" ([r/FacebookAds](https://www.reddit.com/r/FacebookAds/comments/1l8drl8/meta_pixel_not_tracking_purchase_event_on_shopify/)), "HELP! Pixel not tracking purchases" ([r/FacebookAds](https://www.reddit.com/r/FacebookAds/comments/1r3zz6a/help_pixel_not_tracking_purchases/)), "Shopify meta pixel not 'active'" ([r/FacebookAds](https://www.reddit.com/r/FacebookAds/comments/1n3rqou/shopify_meta_pixel_not_active_or_tracking_events/)), "Burning money on Meta ads for my small jewellery brand" ([r/FacebookAds](https://www.reddit.com/r/FacebookAds/comments/1w1e68y/burning_money_on_meta_ads_for_my_small_jewellery/)).
- Shopify's hosted checkout "can definitely block the Pixel helper from detecting events at checkout" (excerpt, [r/FacebookAds](https://www.reddit.com/r/FacebookAds/comments/1l8drl8/meta_pixel_not_tracking_purchase_event_on_shopify/)).
- India: an r/EcommerceIndia post seeks someone "to help troubleshoot technical tracking issues, verify purchase events, identify tracking discrepancies" for a Shopify brand ([r/EcommerceIndia](https://www.reddit.com/r/EcommerceIndia/comments/1x1ghlb/looking_for_a_meta_ads_expert_for_shopify/)). Autocomplete shows "razorpay meta pixel" and "meta pixel kya hai" ([DEMAND.md §2I](./DEMAND.md#i-india-relevant-phrasing)).
- One-click checkouts are blamed for duplicated or missing purchase events. This comes from vendor sources: [CustomerLabs](https://www.customerlabs.com/docs/website-event-tracking/shopify-one-click-checkout/shiprocket-checkout-customerlabs-integration-tracking/) and a [Meta dev thread on a GoKwik store](https://developers.secure.facebook.com/community/threads/504810579253606).
- Health and wellness D2C brands, a large India category, face Meta data restrictions that block purchase events ([Triple Whale](https://www.triplewhale.com/blog/meta-health-and-wellness-brands.md), [CustomerLabs case study](https://www.customerlabs.com/blog/case-study/how-good-body-clinic-overcame-metas-health-wellness-restrictions-and-revived-their-ad-performance/)).

**Tools today.** Meta Pixel Helper, Events Manager "Test events", the Shopify Facebook & Instagram app, Shopify analytics, and asking in Reddit or WhatsApp groups. Many hire a freelancer.

**Current workaround.** Compares the Shopify order count with Events Manager purchases by eye. Places test orders. Disconnects and reconnects the Shopify Meta app ([r/FacebookAds](https://www.reddit.com/r/FacebookAds/comments/1sn2etw/meta_shopify_deduplication_issue_has_anyone/)).

**Pains**
- Does not know what "good" looks like. Pixel Helper output is jargon.
- Purchase is missing or doubled. InitiateCheckout is twice AddToCart ([r/FacebookAds](https://www.reddit.com/r/FacebookAds/comments/1qbmb43/pixel_tracking_issue_for_shopify_store_checkout/)).
- Cannot verify the freelancer's work.
- The checkout lives on a third-party domain (one-click checkout or Razorpay), so the owner cannot see what fires there *(inference)*.

**What "done" looks like.** A green/amber/red answer to "Is Meta getting my purchases?" in plain English, plus a list to forward to the developer.

**Triggers to install**
- ROAS drops. "Not active" warning in Events Manager.
- A new checkout app. Meta restriction email.
- Hiring or firing an agency.

**Objections**
- "I'm not technical."
- "Is it safe / free?"
- "Meta already has a helper."
- "Will it fix it for me?" (It diagnoses; it does not edit the site.)

**Feature map**
| Need | Existing | Candidate |
|---|---|---|
| "Is my pixel firing?" | Meta detection, delivery status | Plain-English verdict header per vendor *(UX)* |
| Purchase sanity | Event list, duplicate detection | Purchase checklist (value, currency, order ID, event_id) |
| Health/beauty risk | PII checks | **Meta sensitive-data pre-check** (URLs/params that may trigger restriction) |
| Hand-off to developer | Client PDF (works as a "send to dev" report) | Hindi/Hinglish glossary tooltips *(candidate, low effort)* |
| Ongoing reassurance | n/a | Monitoring (weekly "still working" email) |

---

## Persona 3: In-house growth or performance marketer ("the operator")

**Who.** One to four years' experience, at a D2C brand, edtech or SaaS company. Runs Meta and Google Ads daily and owns GA4/GTM/Pixel "well enough".

**Goals**
- Trust conversion numbers before scaling budget.
- Ship launches (landing pages, new funnels, ChatGPT Ads tests) without breaking tracking.
- Answer leadership's "why don't GA4 and Meta match?"

**Context**
- Indian JDs consistently list GA4, GTM and Meta Pixel. Some add "Conversions API (CAPI) setup and troubleshooting" ([Jaipur media buyer](https://jobs.weekday.works/media-buyer-performance-marketer-at-4fox-business-solutions-wkdytwo1wo), [Bengaluru role](https://www.foundit.in/job/performance-marketing-executive-vedantu-bengaluru-bangalore-60457706), [Noida D2C agency role](https://seventhtriangle.keka.com/careers/jobdetails/73677), [Ghaziabad wellness brand](https://www.erekrut.com/jobs/performance-marketing-manager-job-at-ashtaveda-wellness-llp-uttar-pradesh-ghaziabad-erekrut-job-portal/)).
- GA4 purchase gaps are common after Shopify checkout changes, with duplicates from native plus GTM setups ([Shopify Community](https://community.shopify.com/t/ga4-purchase-event-not-being-fired-during-checkout/342255), [Shopify Community](https://community.shopify.com/t/google-youtube-app-purchase-events-not-tracking-in-ga4/305413)).
- "Most companies are horrible at setting up/maintaining their tracking" ([r/GoogleAnalytics](https://www.reddit.com/r/GoogleAnalytics/comments/1wkletr/how_do_you_compare_meta_and_google_ads_when_ga4/)).
- New channel: ChatGPT Ads now has a pixel and CAPI. Agencies say clients "are trained to expect clear conversion data" ([AdNews](https://www.adnews.com.au/news/advertisers-say-chatgpt-ads-have-closed-the-measurement-gap)). Autocomplete shows "openai pixel helper" and "openai ads pixel" ([DEMAND.md §2H](./DEMAND.md#h-chatgpt--openai-ads-pixel-demand-emerging-estimate-fastest-growing)).

**Tools today.** Tag Assistant, GA4 DebugView, Meta Events Manager, GTM Preview, TikTok Pixel Helper, and sometimes Triple Whale or another attribution tool.

**Current workaround.** Clicks through the funnel with GTM Preview and DebugView open. Checks each platform's test-events screen one by one. DebugView itself often "not working" ([autocomplete: "ga4 debugview not working"](./DEMAND.md#c-ga4-checking-and-debugging-demand-high-estimate)).

**Pains**
- Tag Assistant and Preview connection failures ([GTM preview troubleshooting](https://analytify.io/google-tag-manager-preview-mode-not-working/), [Google support thread](https://support.google.com/tagmanager/thread/77384235?hl=en)).
- One helper per platform.
- Consent Mode drops users and they cannot tell if it is set up right ([r/GoogleAnalytics](https://www.reddit.com/r/GoogleAnalytics/comments/1f373p1/struggling_with_google_consent_mode_v2_advanced/)).
- New pixels such as OpenAI's come with no official helper.

**What "done" looks like.** After a release, a single scan of the key funnel pages shows every pixel firing once with the right parameters, consent respected and no PII.

**Triggers to install**
- A site redesign or theme update.
- Launching TikTok, LinkedIn or ChatGPT Ads.
- A GA4 vs Meta discrepancy. An EU expansion.

**Objections**
- "I already have Tag Assistant."
- "Does it show the dataLayer?"
- "Can it see events on the checkout domain?"

**Feature map**
| Need | Existing | Candidate |
|---|---|---|
| Post-release QA | Multi-page scan, duplicate detection | Saved page lists per site |
| New channels | 12 vendors | **OpenAI/ChatGPT ads pixel check** (incl. `oppref` capture) |
| Consent confidence | Consent Mode v2, accept/reject test, GPC | Pre-consent firing timeline |
| Regression alerts | n/a | Monitoring |
| Share with boss/dev | Client PDF | Shareable link *(candidate)* |

---

## Persona 4: Analytics engineer, developer or privacy/compliance lead ("the verifier")

**Who.** A tracking or analytics specialist in-house at a larger brand, or a developer, privacy or legal-ops person who has to prove consent compliance. Covers the EU (Consent Mode v2, GDPR), the US (GPC in 12 states) and, soon, India (DPDP).

**Goals**
- Prove that tags respect consent: nothing fires before opt-in, and Reject stops ad vendors.
- Prevent PII leaks into ad platforms.
- Document compliance for audits.

**Context**
- Job ads require "end-to-end QA and troubleshooting of tracking setups… managing cookie logic and consent management" ([Körber](https://jobs.koerber.com/job/Porto-Tracking-&-Analytics-Specialist-Mid/1381243733)), and GA4, server-side GTM and "consent gating" across Meta, TikTok and Pinterest ([Senior Tracking Specialist](https://celebratecompany.recruitee.com/o/senior-tracking-specialist-mfd?lang=en)).
- Practitioners ask "How do you guys test, if the advanced consent mode is in place and working ok?" ([r/GoogleAnalytics](https://www.reddit.com/r/GoogleAnalytics/comments/1lwiefo/check_for_advanced_consent_mode/)). Another thread: "ad_storage still denied after consent was accepted" ([r/GoogleTagManager](https://www.reddit.com/r/GoogleTagManager/comments/1nurz0t/ad_storage_still_denied_after_consent_was/)). A community member built a free scanner for "tags firing before consent" ([r/GoogleTagManager](https://www.reddit.com/r/GoogleTagManager/comments/1qsg6sl/built_a_free_scanner_that_checks_consent_mode_v2/)).
- 12 US states require honouring GPC ([Clym](https://www.clym.io/blog/what-is-global-privacy-control-the-opt-out-signal-12-us-states-now-require-you-to-honor)). India DPDP consent duties start 13 May 2027 ([Hogan Lovells](https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-)). OpenAI's pixel is "one more vendor your CMP has to collect consent for" ([Axeptio](https://www.axept.io/blog/chatgpt-ads-pixel-tracking-openai-vendors)).

**Tools today.** DevTools, Consent Mode Inspector (20K users), Omnibug, dataLayer inspectors, CMP vendor scanners, and occasionally paid tools (ObservePoint-class) *(inference)*.

**Current workaround.** Opens incognito, clears storage, and records the HAR file before and after the banner. Decodes gcs/gcd by hand. Searches request payloads for "@" to find emails *(inference from thread content above)*.

**Pains**
- Consent tools are fragmented, with about nine tiny CWS listings ([DEMAND.md §1](./DEMAND.md#1-sourced-demand-proxy-chrome-web-store-installs-16-oct-2026)).
- No timeline of *what fired when* relative to the consent click.
- Evidence is hard to hand to legal.

**What "done" looks like.** A timestamped per-vendor timeline: page load, banner shown, click, and what each vendor sent before and after. Plus a PII scan and a GPC result, exported as evidence.

**Triggers to install**
- A regulator letter or DPA complaint. A CMP migration.
- A US state law effective date. An internal privacy audit.
- Adding a new ad vendor.

**Objections**
- "How accurate is detection versus a HAR file?"
- "Does the extension itself collect data?" (Point to PRIVACY.md and local-only processing.)
- "Can I see raw requests?"

**Feature map**
| Need | Existing | Candidate |
|---|---|---|
| Consent proof | Accept/reject test, Consent Mode v2 (with raw gcs/gcd), GPC | **Pre-consent firing timeline per vendor** |
| PII | PII checks | Meta sensitive-data pre-check (URL/param keywords) |
| Evidence | PDF report | Raw request export (HAR/JSON) *(candidate)* |
| Change control | Multi-page scan | Monitoring with diff alerts |

---

## Cross-persona priorities (estimate, based on the evidence above)

| Candidate feature | P1 Auditor | P2 Owner | P3 Operator | P4 Verifier | Notes |
|---|---|---|---|---|---|
| Pre-consent firing timeline per vendor | ●●● | ● | ●● | ●●● | Strongest differentiator; consent tools are tiny and fragmented |
| OpenAI/ChatGPT ads pixel check | ●● | ● | ●●● | ●● | Emerging demand; competitors have under 2K users each, so it is a race |
| Meta sensitive-data pre-check | ●● | ●●● | ●● | ●● | Health/beauty D2C, especially India |
| Client report (exists) | ●●● | ●● | ●● | ●● | Core paid hook for agencies |
| Monitoring | ●●● | ●● | ●● | ●● | Answers "client finds out first"; natural Pro upsell |

Positioning line supported by the evidence: **"Every pixel and tag in one free checker: see what fires, what fires before consent, and hand your client a report."**
