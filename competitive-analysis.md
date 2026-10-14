# Competitive analysis: tracking QA Chrome extensions

_Checked 2026-10-14 against public Chrome Web Store listings and vendor docs. No competitor code was downloaded or decompiled._

## The field

| Extension | Users · rating | Strength | Gap for agency audits |
|---|---|---|---|
| **Google Tag Assistant** (merged Legacy + Companion) | 3M · 3.4★ | Official GTM Preview / debug sessions; per-tag consent view with "default set after tag fired" error | Google only; no export, report or multi-page audit |
| **Meta Pixel Helper** (now "Meta Ads Data Advisor") | ~3M · 2.1★ | Badge count; warnings for invalid ID, non-standard events, multiple activations, encoded characters, missing content_ids/value/currency; new GTM/Shopify setup + alerts | Meta only; no consent view; no export |
| **TikTok Pixel Helper** | ~600K · 3.1★ | Pixel/event/parameter diagnostics: invalid event, value/currency, currency code, content_id, content_type, email/phone (E.164) format, missing first-party cookies | TikTok only; no consent view; no export |
| **Omnibug** (open source) | 200K · 4.2★ | 69 vendors decoded in a DevTools panel; filter, notes, CSV/TSV export | No validation rules, no consent decoding, no crawl; last updated Jan 2025 |
| **dataslayer** | 70K · 4.5★ | dataLayer view for GTM, Adobe Launch, Tealium, TagCommander; GA4/Adobe/Floodlight decoding | No ad pixels, no validation, no consent |
| **Analytics Debugger** (David Vallejo) | 100K · 4.5★ | 20+ vendors; GA4 batch/session/engagement detail; per-hit Consent Mode; GTM Preview enhancer; hit blocking | DevTools-only; no cross-vendor rules; no client report or crawl |
| **Adswerve dataLayer Inspector+** | 80K · 4.1★ | Console logging of dataLayer/GA; push-format checks; code injection | Console only; no pixels, export or consent |
| **ObservePoint Debugger** | 30K · 4.2★ | Tag list, cookies, GPC simulation, Excel export; records across navigation | Crawl, scheduled audits and alerts require the paid platform |
| **Trackingplan** | tiny · 5.0★ (2) | Rogue/duplicate events, missing properties, UTM checks | Needs SDK + account; extension last updated May 2024; SaaS from ~$79/mo |
| **Consent Mode Inspector** (InfoTrust) | 20K · 4.9★ | gcs/gcd decoding and calculator, `google_tag_data.ics` table, consent history | Google consent only; last updated Nov 2024 |
| **Pinterest / Snap / X pixel helpers** | 60–100K each | Official single-vendor event checks | Single vendor; no LinkedIn official helper exists |
| **WASP.inspector** | removed | (historically) tag hierarchy tree | No longer on the Chrome Web Store |

## Gaps nobody fills, and what we built for each

| Gap | Tracking QA feature |
|---|---|
| Vendor rules live in separate single-vendor helpers | One rules engine covering GA4, Meta, TikTok plus LinkedIn, Pinterest, Snap, X, Microsoft Ads, Reddit (`src/validators.js`) |
| No cross-vendor consistency checks | Purchase value/currency compared across GA4, Meta and TikTok; event_id checks for CAPI/Events API dedup |
| Only Google consent is decoded; nothing checks other pixels | Non-Google pixels and tracking cookies flagged when ad consent is denied; automated accept/reject banner test |
| No client-ready deliverable | Branded PDF report with score, fixes, consent test table, analyst notes, CTA button |
| No funnel QA without a paid crawler | Preserved log across redirects + "whole session" audit |
| PII detection only in paid SaaS | Email / unhashed advanced-matching detection across all vendors, values never stored |
| No before/after comparison | "Changes since last audit" in every report; monitoring alerts on regressions |
| Several tools are stale or gone | Actively maintained; MV3 side panel |

## Where competitors remain stronger

- **GTM Preview / debug sessions:** Tag Assistant, Analytics Debugger. Not planned; recommend using alongside.
- **Analytics-suite breadth (Adobe, Tealium, Snowplow, Piwik Pro):** Omnibug, Analytics Debugger, dataslayer. Off-target for the ad-pixel/consent audit buyer.
- **Hit blocking / redirect stopping:** Analytics Debugger. Deliberately excluded: risky on client production sites.
- **Meta catalog match rate / setup automation:** Meta Ads Data Advisor uses first-party account access we don't have.

## Sources

- https://chromewebstore.google.com/detail/tag-assistant/kejbdjndbnbjgmefkgdddjlbokphdefk
- https://developers.google.com/tag-platform/devguides/consent-debugging
- https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc
- https://developers.facebook.com/docs/meta-pixel/support/pixel-helper
- https://chromewebstore.google.com/detail/tiktok-pixel-helper/aelgobmabdmlfmiblddjfnjodalhidnn
- https://ads.tiktok.com/help/article/tiktok-pixel-helper-2.0
- https://github.com/MisterPhilip/omnibug · https://omnibug.io/help/supported-tags/
- https://chromewebstore.google.com/detail/dataslayer/ikbablmmjldhamhcldjjigniffkkjgpo
- https://chromewebstore.google.com/detail/analytics-debugger/ilnpmccnfdjdjjikgkefkcegefikecdc
- https://www.analytics-debugger.com/en/tools/analytics-debugger-extension
- https://chromewebstore.google.com/detail/adswerve-datalayer-inspec/kmcbdogdandhihllalknlcjfpdjcleom
- https://www.observepoint.com/solutions/observepoint-debugger/
- https://trackingplan.com/pricing
- https://chromewebstore.google.com/detail/phpllnjdcoiijcpgcbhlocjgcegjfnhb
- https://chromewebstore.google.com/detail/pinterest-tag-helper/gmlcbajhgoaaegmlbaclmmmhpmfdajmp
- https://chromewebstore.google.com/detail/snap-pixel-helper/hnlbfcoodjpconffdbddfglilhkhpdnf
- https://help.x.com/es/business-and-advertising/pixel-helper
