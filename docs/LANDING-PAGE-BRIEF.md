# Landing page brief: Tracking QA & Client Audit

_For the session that builds thegrowthfolks.com. Source of truth for features and plans: this repository
(`shadabkhansir/tracking-qa-client-audit`, branch `claude/charming-edison-ts8soj` until merged to `main`). Written 2026-10-15._

## 1. What to build

The extension already links to these URLs, so **each one must exist** at launch:

| URL | Purpose | Linked from |
|---|---|---|
| `/tools` | Index of TGF tools. Tracking QA is the first card. | (site nav) |
| `/tools/tracking-qa` | **Main landing page** (sections below) | Panel header, report footer credit, Settings, store listing |
| `/tools/tracking-qa/pricing` | Free vs Pro table, FAQ, buy buttons (or waitlist until Pro launches) | Every upgrade prompt in the extension |
| `/tools/tracking-qa/privacy` | Privacy policy: publish `PRIVACY.md` from this repo **verbatim** (it's what the Chrome Web Store review is checked against) | Panel footer, report toolbar, store listing |
| `/tools/tracking-qa/welcome` | Opened once after install: 3-step quick start | Extension install event |
| `/learn` | Existing TGF content hub (only link to it) | Panel footer, report toolbar |

Add at Pro launch (not before):
- `/tools/tracking-qa/activate`: how to activate a licence key.
- Site-level terms of service and a refund policy (14 days).
- `/account`: redirect to the Dodo Payments customer portal.

Incoming links carry `utm_source=chrome-extension`. Upgrade prompts use `utm_medium=upgrade` and `utm_content=<prompt>`, where the prompt is `scan-limit`, `history-limit`, `monitor-tab`, `report-toolbar`, `report-changes` or `options-plan`. Keep these parameters when redirecting, and pass them through to the checkout link, so we can see which limit sells Pro.

## 2. Product facts (use exactly; don't invent more)

- **Name:** Tracking QA & Client Audit by The Growth Folks®. Short name: **Tracking QA**.
- **What it is:** a free Chrome extension (side panel). It audits a website's analytics and ad tracking plus cookie-consent setup, then produces a client-ready PDF report.
- **Who it's for:**
  - agencies and freelance marketers auditing client sites;
  - in-house marketing, analytics and ecommerce teams;
  - Shopify and WooCommerce store owners.
- **One-line pitch:** *Audit GA4, GTM, Meta, TikTok and 11 more tags plus Consent Mode v2 and GPC, then send clients a polished report.*
- **Positioning:** Free tools each cover one platform (Tag Assistant for Google, Meta Pixel Helper, TikTok Pixel Helper), and none of them produce a client report. Tracking QA checks all of them in one panel, tests consent, and turns the result into a report you can send.
- **Install:** Chrome Web Store link: `<CWS_URL, paste once published>`. Use a placeholder button until then.
- **Privacy promise (true, and important to buyers):**
  - All analysis runs locally in the browser.
  - No account, no sign-up.
  - No browsing data is sent to The Growth Folks.
  - Cookie values are never read; only names and metadata.
  - Emails are redacted from saved audits.

### Features (group them like this on the page)

**1. Detects 15 platforms, plus any you add**
- **Google:** GA4, Google Tag Manager, Google Ads, Google tag, Floodlight.
- **Ad pixels:** Meta Pixel, TikTok Pixel, LinkedIn Insight Tag, Pinterest Tag, Snap Pixel, X (Twitter) Pixel, Microsoft Ads (UET), Reddit Pixel.
- **Behaviour tools:** Microsoft Clarity, Hotjar.
- **Custom providers:** any other endpoint (Segment, in-house collectors) by URL pattern.
- **Setups other tools miss:**
  - tags deployed through GTM;
  - first-party and server-side proxies (Google tag gateway, Meta/TikTok proxies);
  - Shopify custom pixels running in Shopify's sandbox.

**2. One-click audit with fixes**
- A score from 0 to 100, with Critical, Warning and Pass findings. Every finding has a plain-English fix.
- GA4 checks: duplicate page views, reserved event names, ecommerce and item parameters.
- Meta and TikTok checks that match their official helpers' warnings.
- Purchase value and currency compared across GA4, Meta and TikTok, plus event_id checks for Conversions API deduplication.
- Google Ads conversions and **Enhanced Conversions**: user data present, hashed vs clear text, conversion label and currency.
- **Personal-data leak detection:** emails and phone numbers in URLs or payloads, and unhashed advanced matching.
- **Delivery status for every hit:** HTTP status, latency, and whether an ad blocker blocked it. This answers "did the platform actually receive it?"
- Placement checks: GTM or Meta base code outside `<head>`, events firing before config.

**3. Consent and privacy testing**
- **Google Consent Mode v2:** default and update state for all four signals; flags late defaults, v1-only setups and missing defaults.
- **Consent banner tests:**
  - one click accepts or rejects the banner on OneTrust, Cookiebot, Usercentrics, Didomi, Complianz and others;
  - then shows which tags and cookies fired before vs after.
- **Global Privacy Control (GPC) test** for US privacy laws (CCPA/CPRA).
- Flags ad pixels and session recorders that fire while consent is denied.
- **Cookie table:** name, domain, expiry and vendor, split before and after consent.

**4. Inspectors**
- Request log with readable parameter names, decoded consent values and delivery status.
- dataLayer timeline, including pushes from GTM.
- Preserve the log across pages to audit a full funnel, e.g. product → cart → checkout → thank-you.

**5. Multi-page scan**
- Scans a list of URLs, optionally with a consent test or as a fresh visitor on each.
- Shows a site-wide summary and **coverage gaps**: pages missing a tag the rest of the site has.

**6. Client reports**
- Printable PDF with:
  - executive summary;
  - score and findings with fixes;
  - platforms;
  - consent and cookie tables;
  - analyst notes;
  - "Changes since last audit".
- ID labels, e.g. "G-ABC123 = Main GA4 property".

**7. Export and sharing**
- CSV, JSON and HAR (for developers).
- Copy a text summary for Slack or email.
- Import a saved audit.

**8. History and monitoring**
- Saved audits.
- Scheduled monitoring that re-audits sites daily or weekly and shows a desktop alert when tracking breaks. It runs while Chrome is open.

### Plans

| | **Free** | **Pro** |
|---|---|---|
| Price | $0 forever | **$19/month or $190/year** (2 months free). Launch offer **$15/month or $150/year** for the first 100 customers. **7-day free trial.** |
| All 15 platforms, custom providers, every check and fix | ✓ | ✓ |
| Consent tests (accept, reject, GPC), cookie table, funnel audit | ✓ | ✓ |
| Request and dataLayer inspectors, CSV/JSON/HAR export | ✓ | ✓ |
| Client PDF report | ✓ with a small "Made with Tracking QA" credit | **White-label**: your logo, brand colour, contact line and call-to-action button; credit optional |
| "Changes since last audit" in reports | One-line preview | **Full before/after list** |
| Multi-page scan | 3 pages | **50 pages** |
| Saved audits | Last 5 | **500** |
| Scheduled monitoring with alerts | ✗ | **Up to 20 sites** |
| Account needed | No | No: licence key by email, works on up to 5 browsers |

Pro is sold through **Dodo Payments**, which is the Merchant of Record: it handles checkout, tax and invoices. The card statement shows `DODOPAY_…`.

**Pro is not on sale yet.** Until the owner gives you live Dodo payment links:
- Pro buttons say **"Coming soon: join the waitlist"**, using an email form or the site's existing newsletter form.
- Don't show a working Buy button.
- Don't state the trial as available.

The Chrome Web Store forbids advertising features users can't get.

Planned later (mention only as "coming later", or leave out): an **Agency** plan with cloud monitoring, shareable report links, team seats and 500-page scans.

## 3. Page structure for `/tools/tracking-qa`

1. **Hero**
   - Headline idea: "Audit every tracking tag and consent setup in one click, then send the client a report."
   - Subline: the one-line pitch.
   - Primary CTA: "Add to Chrome, it's free". Secondary CTA: "See a sample report".
   - Show the side-panel screenshot.
   - Trust line: "No sign-up · Runs in your browser · 15 platforms".
2. **Problem:** "One helper per platform, no report." Name the three single-platform helpers and what each lacks.
3. **Feature grid:** the 8 groups above. Lead with consent testing, delivery status and the client report, because that's where we're different.
4. **Consent testing deep-dive:** accept/reject/GPC, before vs after.
5. **Client report showcase:** report screenshot, white-label callout (Pro).
6. **Comparison table** vs Tag Assistant, Meta Pixel Helper, TikTok Pixel Helper and Omnibug. Use only facts from `docs/competitive-analysis.md` in this repo, and be fair: say Tag Assistant is better for GTM Preview debugging.
7. **Pricing:** Free vs Pro summary, linking to `/tools/tracking-qa/pricing`.
8. **Privacy:** "Your clients' data never leaves your browser", with a link to the privacy policy.
9. **FAQ** (below).
10. **Final CTA**, plus a cross-link to The Growth Folks services: "Need us to fix what it finds?"

### FAQ (answers are accurate)

- **Is it free?** Yes. Every check, test and export is free. Pro adds white-label reports, 50-page scans, 500 saved audits, full change history and monitoring.
- **Do I need an account?** No. Pro uses a licence key sent by email.
- **Does it send my data anywhere?** No. Everything runs in your browser. Pro only sends the licence key to Dodo Payments to confirm the subscription.
- **Can it see server-side events (Conversions API, Measurement Protocol)?** No. It sees what the browser sends. It does check event_id deduplication on the browser side.
- **Does it work on Shopify?** Yes, including custom pixels in Shopify's sandbox.
- **Which consent platforms does the banner test support?** OneTrust, Cookiebot, Usercentrics, Didomi, Complianz and many others by button. It falls back to clicking buttons inside cookie banners.
- **Does monitoring need Chrome open?** Yes. Cloud monitoring is planned for a later Agency plan.
- **I reinstalled and my key says "activation limit"?** Email hello@thegrowthfolks.com with the key and we'll reset it.
- **Which browsers?** Google Chrome on desktop. Other Chromium browsers may work but aren't officially supported yet. Firefox and Safari aren't supported.

## 4. SEO

- **Title:** `Tracking QA: GA4, Meta & TikTok Pixel + Consent Mode Audit (Chrome)`
- **Meta description:** around 150 characters, based on the one-line pitch.
- **Target keywords:**
  - GA4 debugger Chrome extension
  - Meta Pixel Helper alternative
  - TikTok Pixel Helper alternative
  - Consent Mode v2 checker
  - tracking audit tool
  - tag audit report
  - GTM debugger
  - GPC test
  - cookie consent checker
  - Enhanced Conversions checker
- **JSON-LD:**
  - `SoftwareApplication`: `applicationCategory: BrowserApplication`, `operatingSystem: Chrome`, `offers` price 0 (add the Pro offer only once it's on sale).
  - `FAQPage` from the FAQ above.
  - **No `aggregateRating`** until there are real store reviews.
- **Open Graph and Twitter images:** use `store/marquee-1400x560.png`.

## 5. Assets (in this repo)

- **Screenshots (1280×800), in `store/`:**
  - `screenshot-1` audit and score
  - `screenshot-2` requests
  - `screenshot-3` consent test
  - `screenshot-4` report
  - `screenshot-5` dataLayer
- **Raw UI captures:** `store/source/*.png`.
- **Promo images:** `store/promo-small-440x280.png`, `store/marquee-1400x560.png`.
- **Icons:** `icons/` (16–128 px).
- **Copy sources:**
  - `store/STORE_LISTING.md`: store description, already approved wording.
  - `PRIVACY.md`
  - `docs/PLANS.md`
  - `docs/competitive-analysis.md`

## 6. Rules

- **No fabricated social proof.** No fake testimonials, user counts, ratings, "trusted by" logos or "#1" claims. Leave a hidden slot for real reviews later.
- **Comparisons must be factual and current**, from `docs/competitive-analysis.md`. Don't mock competitors.
- **Brand:** "The Growth Folks®" (the owner's choice; keep it consistent with the extension). Match the existing thegrowthfolks.com design system, nav and footer.
- **Don't promise** server-side visibility, other browsers, AI features or anything not listed in section 2.
- **Accessibility and performance:**
  - mobile-first;
  - Lighthouse 90+;
  - real `<img alt>` text;
  - screenshots in WebP/AVIF with width and height set.
- **Analytics:**
  - fire GA4 events `cta_install_click`, `pricing_view`, `waitlist_signup`, and later `checkout_click` with plan and period;
  - keep incoming UTM parameters on the CTA links.
