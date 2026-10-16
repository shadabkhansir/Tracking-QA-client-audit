# Search demand and wording research

Product: "Pixel & Tag Checker: GA4, GTM, Meta Audit" by The Growth Folks®
Research date: 16 October 2026

## How this was gathered

| Source | Method | Notes |
|---|---|---|
| Google autocomplete | `https://suggestqueries.google.com/complete/search?client=firefox&q=…` queried directly on 16 Oct 2026, `gl=us` and `gl=in` | Roughly 90 seed phrases. Autocomplete order is a rough popularity signal, not a volume figure. |
| Chrome Web Store (CWS) | Search pages for "pixel helper", "tag assistant", "consent mode", "linkedin insight tag", "ga4 debugger", "gtm", "chatgpt pixel" and "datalayer", plus each listing's user count, fetched 16 Oct 2026 | User counts are the strongest *sourced* demand proxy available. CWS rounds them and caps the display at "3,000,000". |
| Web search | Reddit, Shopify Community, job boards, vendor blogs | Reddit pages could not be fetched in full, so Reddit evidence below is cited from search-result excerpts, with links. |
| Google Trends / keyword tools | Trends API returned HTTP 429; no free tool published volumes for these terms | **No absolute search volumes are sourced.** Every "relative demand" label below is an estimate. |

Demand labels: **Very high / High / Medium / Low / Emerging** are estimates. Each is triangulated from (a) how many autocomplete variants a term produces and how high it ranks, (b) CWS installs of the matching tool, and (c) how often it comes up in community threads.

---

## 1. Sourced demand proxy: Chrome Web Store installs (16 Oct 2026)

| Extension (publisher) | Users | Rating | What it tells us |
|---|---|---|---|
| Meta Ads Data Advisor, **formerly Meta Pixel Helper** (Meta) | 3,000,000 | 2.1 (1.3K ratings) | Largest pool of intent. The rename and low rating leave room for a plain "pixel checker". [listing](https://chromewebstore.google.com/detail/fdgfkebogiimcoedlicjlajpkdmockpc), [Meta docs on rename](https://developers.facebook.com/documentation/meta-pixel/support/meta-ads-data-advisor) |
| Tag Assistant (Google) | 3,000,000 | 3.4 (1.3K) | Same scale. Google's own note says it is "bringing back the on-page debugging experience" after feedback. [listing](https://chromewebstore.google.com/detail/kejbdjndbnbjgmefkgdddjlbokphdefk) |
| TikTok Pixel Helper | 600,000 | 3.1 (143) | [listing](https://chromewebstore.google.com/detail/aelgobmabdmlfmiblddjfnjodalhidnn) |
| Google Analytics Debugger | 600,000 | n/a | [listing](https://chromewebstore.google.com/detail/jnkmfdileelhofjcijamephohjechhna) |
| Tag Assistant Companion | 500,000 | 3.5 (206) | [listing](https://chromewebstore.google.com/detail/jmekfmbnaedfebfnmakmokmlfpblbfdm) |
| Omnibug | 200,000 | (53) | [listing](https://chromewebstore.google.com/detail/bknpehncffejahipecakbfkomebjmokl) |
| Pinterest Tag Helper | 100,000 | 4.1 | [listing](https://chromewebstore.google.com/detail/gmlcbajhgoaaegmlbaclmmmhpmfdajmp) |
| UET Tag Helper (Microsoft Advertising) | 100,000 | 4.5 | [listing](https://chromewebstore.google.com/detail/naijndjklgmffmpembnkfbcjbognokbf) |
| Analytics Debugger | 100,000 | (249) | [listing](https://chromewebstore.google.com/detail/ilnpmccnfdjdjjikgkefkcegefikecdc) |
| Datalayer Checker | 100,000 | (49) | [listing](https://chromewebstore.google.com/detail/ffljdddodmkedhkcjhpmdajhjdbkogke) |
| Pixel Helper for Meta (third party) | 70,000 | 4.7 | [listing](https://chromewebstore.google.com/detail/pbidfgcngaghdobpeppgnfgpefengdaj) |
| Snap Pixel Helper | 70,000 | 3.9 | [listing](https://chromewebstore.google.com/detail/hnlbfcoodjpconffdbddfglilhkhpdnf) |
| dataslayer | 70,000 | (83) | [listing](https://chromewebstore.google.com/detail/ikbablmmjldhamhcldjjigniffkkjgpo) |
| X Pixel Helper | 60,000 | 3.5 | [listing](https://chromewebstore.google.com/detail/jepminnlebllinfmkhfbkpckogoiefpd) |
| TagHound (multi-vendor debugger) | 60,000 | 4.8 (111) | Closest multi-vendor competitor. [listing](https://chromewebstore.google.com/detail/canpneabbfipaelecfibpmmjbdkiaolf) |
| Debugger for GA4 | 50,000 | (35) | [listing](https://chromewebstore.google.com/detail/nomnoimacbncclfbnfaingniikblfbji) |
| Meta Pixel Helper Pro (third party) | 30,000 | 4.9 (62) | [listing](https://chromewebstore.google.com/detail/mlflgnidohcdebodadahjnmmkdgmnplk) |
| Reddit Pixel Helper | 20,000 | 5.0 | [listing](https://chromewebstore.google.com/detail/ebgpcjlgganlidigifggjjiglghjnjcj) |
| Pixel Helper for LinkedIn (third party) | 20,000 | n/a | LinkedIn has no official helper. [listing](https://chromewebstore.google.com/detail/adbhmmjkppnhjjiapocjgjaknpigdoaa) |
| Consent Mode Inspector (InfoTrust) | 20,000 | 4.9 (17) | The only consent tool with real scale. [listing](https://chromewebstore.google.com/detail/phpllnjdcoiijcpgcbhlocjgcegjfnhb) |
| ChatGPT Pixel Helper / OpenAI Ads Pixel Helper (two listings) | about 2,000 each | n/a | **Emerging.** At least 8 ChatGPT-pixel helpers launched in 2026, most under 500 users. [example 1](https://chromewebstore.google.com/detail/dhonjfdfjfalgolkojmldklhdnnfaodi), [example 2](https://chromewebstore.google.com/detail/dgdgmmbimbmdkmmldjohcdfjgkhfnclg) |
| Other consent-mode checkers (about 9 listings) | 9 to 1,000 each | n/a | Crowded but tiny. No winner yet. |

**Takeaways.** Combined, the single-vendor "helpers" hold well over 7 million installs. One free tool covering all of them is a believable pitch. "Helper" and "Tag Assistant" are the category nouns users already know.

---

## 2. Keyword clusters

Phrases are verbatim autocomplete suggestions unless marked *(paraphrase)*. Demand labels are estimates (see method).

### A. Meta pixel checking. Demand: Very high (estimate)
- meta pixel helper, meta pixel helper chrome extension, meta pixel helper extension, meta pixel helper download, meta pixel helper firefox
- facebook pixel helper, facebook pixel checker, facebook pixel checker online, facebook pixel checker chrome extension, facebook pixel check
- meta pixel checker chrome extension, pixel helper, pixel helper meta, pixel helper pro
- **Problem phrasing:** meta pixel not working, meta pixel not active, meta pixel not firing, meta pixel not tracking purchases, meta pixel not detected, meta pixel not showing in ads manager, meta pixel not connecting to shopify, facebook pixel no activity yet shopify, facebook pixel test events not working, meta pixel firing twice
- **How-to phrasing:** how to check meta pixel on website, how to check meta pixel is working, how to test meta pixel events, how to verify meta pixel, how to check meta pixel health, how to check if facebook pixel is installed, how to check if website has facebook pixel
- **Helper failing:** meta pixel helper not working, meta pixel helper no pixel found, meta pixel helper no pixels found on this page, why is my meta pixel helper not working
- **Alternatives:** meta pixel helper alternative (autocomplete exists but with no extensions, so low volume, estimate)
- **Advanced:** meta capi vs pixel, conversion api vs meta pixel, meta pixel event id, meta pixel event parameters, meta pixel purchase event parameters, meta pixel limited data use, meta pixel restrictions

### B. Google tag / GTM checking. Demand: Very high (estimate)
- tag assistant, tag assistant chrome extension, tag assistant google, tag assistant companion, tag assistant legacy, tag assistant legacy chrome extension
- google tag not working, google tag not found, google tag not detected on website, google tag not firing, google tag not installed yet, google tag assistant not connecting, google tag assistant not working
- check google tag, check google tags on website, check google tag manager on website, check google tag manager is working, check google tag extension
- gtm checker, gtm checker extension, google tag manager checker, gtm code checker, gtm debugger, gtm debug mode, gtm tag not firing, google tag manager not firing
- how to check if gtm is installed, how to check if gtm is working, how to check if a website has gtm

### C. GA4 checking and debugging. Demand: High (estimate)
- ga4 debugger, ga4 debugger chrome extension, ga4 event debugger, gtm ga4 debugger
- how to check ga4 is working, how to check events in ga4, how to test ga4 events, how to check ga4 tag, how to find ga4 measurement id
- ga4 not tracking, **ga4 not tracking purchases**, ga4 not working, ga4 purchase event not working, ga4 debugview not working, ga4 cross domain tracking not working
- why is google analytics not working, why is google analytics not showing any data, how to check if google analytics is installed correctly
- datalayer checker, datalayer checker chrome extension, datalayer checker plus

### D. Consent Mode / cookie consent / privacy. Demand: Medium and rising (estimate)
- consent mode checker, consent mode checker extension, consent mode check, consent mode test, consent mode tester, consent mode v2 checker, google consent mode checker, cookie consent mode checker
- check consent mode v2, test consent mode v2, check google consent mode v2, **check if consent mode v2 is enabled**, check website for consent mode v2, how to check consent mode google ads, how to check if consent mode is enabled
- is consent mode v2 mandatory, is google consent mode gdpr compliant, is advanced consent mode gdpr compliant, consent mode v2 advanced, consent mode v2 shopify, consent mode v2 gtm, consent mode v2 cookiebot
- cookie banner checker, cookie banner test, cookie banner tester, cookie consent banner test, gdpr cookie checker, gdpr cookie compliance checker, gdpr cookie consent checker
- global privacy control, global privacy control extension, gpc checker, gpc signal checker, global privacy control opt-out signal
- Context: 12 US states require websites to honour opt-out signals such as GPC in 2026 ([Clym](https://www.clym.io/blog/what-is-global-privacy-control-the-opt-out-signal-12-us-states-now-require-you-to-honor), [Concord](https://www.concord.tech/blog/global-privacy-control-gpc-multi-state-mandate)).

### E. Other ad platforms ("X pixel helper"). Demand: Medium per vendor (estimate)
- tiktok pixel helper (+ chrome extension, 2.0, firefox, safari), tiktok pixel not working, tiktok pixel helper not working, tiktok pixel test events not working, how to check if tiktok pixel is working
- linkedin insight tag helper, linkedin insight tag checker (+ extension), how to check if linkedin insight tag is working
- pinterest tag helper, pinterest tag assistant
- snap pixel helper, snapchat pixel helper
- microsoft uet tag helper, microsoft advertising uet tag helper
- reddit pixel helper, x pixel helper, twitter pixel helper, x ads pixel helper
- hotjar not working, shopify pixel helper, wix tiktok pixel

### F. Ad-platform conversions failing. Demand: High (estimate)
- google ads conversion not tracking, google ads conversion tracking not working, google ads conversions not showing, shopify google ads conversion tracking not working
- facebook not tracking purchases, conversions not tracking

### G. Audit / client report. Demand: Low as a search, high as a job to be done (estimate)
- website tracking audit, website analytics audit, tracking audit, tracking audit findings, tracking audit recommendations, meta pixel audit, pixel auditor
- tracking checker, website tracking checker, tracking checker online
- Search volume is thin, but the job is paid for. Fiverr/Upwork gigs sell "GA4, GTM, Meta pixel, consent" audits at $50 to $650 ([Fiverr](https://fiverr.com/ashiiq82/audit-your-google-ads-campaigns-and-fix-conversion-tracking-issues), [Upwork package](https://www.upwork.com/services/product/marketing-full-digital-audit-to-boost-traffic-leads-and-sales-across-google-ads-ga4-2050689937812879011), [Upwork job: "Full Tracking Audit, Consent Mode v2"](https://www.upwork.com/freelance-jobs/apply/GA4-GTM-Specialist-Needed-Full-Tracking-Audit-Consent-Mode-and-Custom-Funnels_~022099609042293175990/)).

### H. ChatGPT / OpenAI ads pixel. Demand: Emerging (estimate), fastest-growing
- openai pixel, openai pixel helper, openai ads pixel, openai ads pixel helper, openai conversion pixel, openai measurement pixel, openai pixel gtm, openai pixel tracking, chatgpt ads pixel
- Context: OpenAI launched a pixel and Conversions API for ChatGPT Ads with self-serve Ads Manager ([PPC Land](https://ppc.land/openais-chatgpt-ads-are-getting-conversion-optimization-heres-what-changes/)). EU self-serve opened on 31 Aug 2026, and the pixel needs CMP consent ([Axeptio](https://www.axept.io/blog/chatgpt-ads-pixel-tracking-openai-vendors)). 20 measurement partners were named on 5 Oct 2026 ([PPC Land](https://ppc.land/openai-gains-20-measurement-partners-for-chatgpt-ads/)). Click attribution uses `?oppref=` stored in a first-party cookie ([Hardal](https://usehardal.com/blog/openai-measurement-pixel)).

### I. India-relevant phrasing
- Under `gl=in`, "meta pixel helper" and "meta pixel helper extension" outrank "meta pixel" itself. India users search for the tool by name.
- "facebook pixel" is still common alongside "meta pixel" in India suggestions ("facebook pixel helper chrome extension", "facebook pixel setup", "facebook pixel login"). **Use both names.**
- India-specific suggestions: **razorpay meta pixel**, **razorpay facebook pixel**, meta pixel kya hai, ga4 kya hai, ga4 full form, conversion api full form, conversion api meaning, google tag manager in hindi / tutorial in hindi, whatsapp conversion tracking.
- Hinglish "kaise" phrasings for pixels returned nothing. India users search in English, with Hindi for "what is" questions.
- Platform words: Shopify, WordPress/WooCommerce and Wix appear in India suggestions ("meta pixel for wordpress", "meta pixel for shopify", "meta pixel for woocommerce"). Indian one-click checkouts (GoKwik, Shiprocket) are known causes of purchase double-counting and missing events ([CustomerLabs on Shiprocket](https://www.customerlabs.com/docs/website-event-tracking/shopify-one-click-checkout/shiprocket-checkout-customerlabs-integration-tracking/), [Meta dev thread on a GoKwik store](https://developers.secure.facebook.com/community/threads/504810579253606)). This is vendor evidence, so treat it with caution.
- Privacy: India's DPDP Rules were notified 13 Nov 2025. Notice and consent duties apply from 13 May 2027 ([Hogan Lovells](https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-)). "dpdp act cookies" and "cookie consent india" already appear in autocomplete. Demand: Low now, rising into 2027 (estimate).

---

## 3. Exact phrases to use

### Store title (current: "Pixel & Tag Checker: GA4, GTM, Meta Audit")
Keep "Pixel" and "Checker" ("pixel checker" and "facebook pixel checker" are both suggestions). Keep "GA4", "GTM" and "Meta". Options within the 75-character limit:
1. `Pixel & Tag Checker: GA4, GTM, Meta Pixel Helper & Consent Audit` (adds "pixel helper" and "consent")
2. `Pixel Helper & Tag Checker: Meta, GA4, GTM, TikTok, Consent Mode`
Avoid using "Meta Pixel Helper" or "Tag Assistant" *as the name* (trademark and impersonation risk). Use them only in comparisons like "free alternative to …".

### Short description (132 chars), suggested
`Free pixel helper & tag checker: see if your Meta pixel, GA4, GTM, TikTok tags are firing, test consent mode v2 and export a report.`

### Long-description phrases (use verbatim; each matches a real query)
- "Is my Meta pixel firing?" / "check if Facebook pixel is working"
- "Meta pixel not tracking purchases" / "GA4 not tracking purchases"
- "check Google Tag Manager on any website" / "check if GTM is installed"
- "GA4 debugger" / "test GA4 events"
- "consent mode v2 checker" / "check if consent mode v2 is enabled" / "cookie banner test"
- "TikTok pixel helper", "LinkedIn Insight Tag checker", "Pinterest tag helper", "Snap pixel helper", "Microsoft UET tag helper", "Reddit pixel helper", "X pixel helper"
- "pixel firing twice" / "duplicate events"
- "Global Privacy Control (GPC) checker"
- "website tracking audit" / "tracking audit report for clients"
- "free alternative to Meta Pixel Helper and Google Tag Assistant"
- "ChatGPT ads pixel" / "OpenAI pixel helper" (only once the check ships)

### UI labels (plain words that match queries)
| Feature | Label to use | Avoid |
|---|---|---|
| Vendor detection | "Tags found on this page" | "Detected vendors" |
| Request status | "Firing" / "Not firing" / "Blocked" / "Sent, no response" | "Beacon dispatched", "2xx" |
| Duplicate detection | "Firing twice" | "Duplicate hit" |
| Consent test | "Cookie banner test: Accept / Reject" | "CMP interaction simulation" |
| Pre-consent | "Fired before consent" | "Pre-consent leakage" |
| Consent Mode | "Consent Mode v2: on / off / partly set up" | "gcs=G100", "gcd" (show raw values in a details drawer) |
| GPC | "Respects Global Privacy Control (GPC)?" | "UOOM compliance" |
| PII | "Personal data sent (email, phone)" | "PII exfiltration" |
| Purchase checks | "Purchase event: value, currency, order ID" | "Ecommerce schema validation" |
| Multi-page | "Scan more pages" | "Crawl" |
| Report | "Download client report (PDF)" | "Export artefact" |
| Meta restrictions | "May be blocked by Meta (health/sensitive data)" | "Core setup restriction" |

---

## 4. Questions the tool must answer (31)

Each is written in the user's own words, taken from autocomplete or community threads.

**Is it installed / firing**
1. Is my Meta (Facebook) pixel firing on this page?
2. Does this website have a Facebook pixel, and which pixel ID?
3. Is Google Tag Manager installed on this site, and which container?
4. Is GA4 working, and which measurement ID is it sending to?
5. Is my TikTok pixel working?
6. Is the LinkedIn Insight Tag working?
7. Which tracking tags are on this page (Pinterest, Snap, X, Reddit, UET, Clarity, Hotjar)?
8. Why does Pixel Helper say "no pixels found on this page"?
9. Why is my Meta pixel "not active" in Events Manager when it looks installed?

**Events and purchases**
10. Why is my Meta pixel not tracking purchases (Shopify)?
11. Why is GA4 not tracking purchases?
12. Is my purchase event sending value, currency and order ID?
13. Is my pixel firing twice / are events duplicated?
14. Why is InitiateCheckout higher than AddToCart? ([Reddit](https://www.reddit.com/r/FacebookAds/comments/1qbmb43/pixel_tracking_issue_for_shopify_store_checkout/))
15. Are browser and server (CAPI) events using the same event ID for deduplication?
16. Why are Google Ads conversions not tracking?
17. Did the tag actually reach the platform or just get blocked? (Delivery status.)

**Consent and privacy**
18. Is Consent Mode v2 enabled on this site?
19. Is it Basic or Advanced consent mode?
20. Do tags fire before the user accepts cookies? ([Reddit scanner thread](https://www.reddit.com/r/GoogleTagManager/comments/1qsg6sl/built_a_free_scanner_that_checks_consent_mode_v2/))
21. After I click "Reject", do Meta/TikTok/GA4 stop?
22. Why is ad_storage still denied after consent was accepted? ([Reddit](https://www.reddit.com/r/GoogleTagManager/comments/1nurz0t/ad_storage_still_denied_after_consent_was/))
23. Does the site respect Global Privacy Control?
24. Is any personal data (email, phone, name) being sent in pixel or URL parameters?
25. Will Meta block my events as health or sensitive data? ([Triple Whale](https://www.triplewhale.com/blog/meta-health-and-wellness-brands.md), [PixelFlow](https://docs.pixelflow.so/troubleshooting/what-are-meta-s-health-and-wellness-restrictions-and-how-do-they-affect-tracking-ce3t3))

**Audit / client**
26. What is broken across the whole site, not just this page?
27. Can I give the client a report showing what is broken and how to fix it?
28. Did tracking break after the last site or theme change?
29. Does my client's tracking still work this week? (Monitoring.) ([Reddit: "Does your client ever find out their tracking broke before you do?"](https://www.reddit.com/r/analytics/comments/1ucqb8u/does_your_client_ever_find_out_their_tracking/))

**Emerging**
30. Is my ChatGPT (OpenAI) ads pixel installed, and is it capturing `oppref`?
31. Does the Razorpay / one-click checkout page still fire the purchase event? (India)

---

## 5. Wording recommendations

| Users say | Jargon to avoid or hide | Notes |
|---|---|---|
| pixel, tag, tracking code | beacon, hit, collect request | "Tag" for Google, "pixel" for social. Use both. |
| firing / not firing / working / not working | dispatched, executed, 2xx | "Firing" appears in many autocompletes. |
| Facebook pixel *and* Meta pixel | (none) | India and SMB users still say Facebook. |
| check, test, verify, helper, checker | validate, instrument, introspect | "helper" and "checker" are the CWS category nouns. |
| not tracking purchases, conversions | ecommerce schema, transaction hit | Lead with outcome words. |
| firing twice | deduplication failure | Explain dedup in help text only. |
| consent mode v2, cookie banner | CMP, TCF string, gcs/gcd | "Consent mode v2" is user language. Show gcs/gcd raw only in details. |
| fired before consent | pre-consent leakage | |
| personal data (email, phone) | PII | "PII" is fine for analysts; pair it with plain words. |
| report for my client | deliverable, artefact | |
| Events Manager, Test Events, DebugView, Preview mode | (none) | Platform UI names users already know. Reference them when telling users where to confirm. |

Tone: questions as headings ("Is my Meta pixel firing?") match how users search and how PAA-style queries are phrased. British spelling in UI copy ("honour", "optimise"), but keep platform proper nouns as published.
