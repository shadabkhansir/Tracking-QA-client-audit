# Risks: platform, privacy, legal and product

Pixel & Tag Checker by The Growth Folks®: risk register for a local, in-browser tag-audit Chrome extension.

- **Research date:** 2026-10-16. Every fact was checked on 2026-10-16 unless marked otherwise.
- **Labels:** VERIFIED (official or regulator source), SECONDARY (reputable third party), UNVERIFIED.
- **Status:** this document is research, not legal advice. Get qualified counsel before relying on any legal point.
- **Format:** each item gives the change, the impact on us, and the mitigation.

---

## A. Privacy and legal changes, 2025–2026

### A1. GDPR / UK GDPR and the UK Data (Use and Access) Act 2025 (DUAA)

**Facts:**
- The DUAA received Royal Assent on **19 June 2025**. It is commenced in stages by regulations (VERIFIED: https://www.gov.uk/guidance/data-use-and-access-act-2025-data-protection-and-privacy-changes ).
- **SI 2026/82** (Commencement No. 6) brought these provisions into force on **5 February 2026** (VERIFIED: https://www.legislation.gov.uk/uksi/2026/82/made ):
  - **s.112**: storing information in terminal equipment. This is the PECR cookie rule, now with new exceptions.
  - **s.115**: the Commissioner's PECR enforcement powers, which align PECR fines with UK GDPR levels. The level is SECONDARY: up to £17.5m or 4% of turnover.
  - s.110, s.114 and others.
- **s.103** (complaints by data subjects to controllers) came into force on **19 June 2026** (VERIFIED, same SI).
- **ICO guidance.** The ICO's storage and access technologies guidance has a chapter "What are the exceptions?" (VERIFIED: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/ ). It says:
  - The statistical-purposes (analytics) exception requires that users can object.
  - Exceptions are purpose-specific.
  - Advertising cookies still need consent (SECONDARY wording).

**Impact on us:**
- We can no longer say "every analytics cookie before consent is a UK breach".
- First-party, aggregate analytics with an opt-out may be lawful in the UK without consent.
- Advertising pixels (Meta, Google Ads, TikTok, OpenAI and others) still need consent.

**Mitigation:**
- Add a jurisdiction selector to findings: EU/EEA, UK, US-state, India, other.
- For the UK, downgrade first-party analytics fired pre-consent from **FAIL** to **REVIEW**, with the note "may fall under the DUAA statistical exception if users can object".
- Keep advertising pixels at FAIL.
- Never state a conclusion as law. Use wording such as "likely requires consent under…".

### A2. EU ePrivacy and consent-banner enforcement

**Facts:**
- Art. 5(3) of the ePrivacy Directive still governs device storage and access in the EU.
- **The Digital Omnibus proposal (COM(2025) 837), published 19 November 2025**, would move the cookie rules for personal data into the GDPR (proposed Art. 88a) and add machine-readable browser consent signals (Art. 88a/88b; numbering differs across commentary).
  - It was still in the legislative procedure in September 2026 (SECONDARY: https://www.iubenda.com/en/blog/the-european-commissions-proposal-for-new-cookie-rules-our-first-look-at-potential-implications/ , https://gdprlocal.com/cookie-banner-reform/ ).
  - Reports say the Council dropped the browser-signal provision in June 2026 (SECONDARY, single source: https://ppc.land/eu-council-drops-cookie-signal-after-google-lobbying-eur-40-50-bn-at-stake/ ).
- The withdrawal of the old ePrivacy *Regulation* proposal in 2025 is UNVERIFIED in this pass.
- **Enforcement** (VERIFIED, CNIL):
  - 1 September 2025 decisions, announced 3 September 2025:
    - **SHEIN, €150m**: advertising cookies placed before any choice; refusing or withdrawing consent did not stop cookies being placed or read (https://www.cnil.fr/en/cookies-placed-without-consent-shein-fined-150-million-euros-cnil ).
    - **Google, €325m**: invalid cookie consent at account creation, plus Gmail ads (https://www.cnil.fr/en/cookies-and-advertisements-inserted-between-emails-google-fined-325-million-euros-cnil ).
  - The CNIL sanctioned 21 entities over trackers in 2025 (https://www.cnil.fr/en/sanctions-and-corrective-measures-cnils-actions-2025 ).

**Impact on us:**
- This is strong demand validation: SHEIN's failures are exactly the "fires before choice" and "fires after reject" checks we run.
- If the Omnibus browser signals pass, consent checks will need a new signal type.

**Mitigation:**
- Make "fires after reject" the headline check.
- Cite regulator decisions only as context, never as a prediction of fines for the client.
- Track the Omnibus. Design the consent model so new signal sources (browser signal, GPC) plug in.

### A3. US state laws requiring Global Privacy Control (GPC) or another universal opt-out

**Facts** (SECONDARY; vendor tables, verify against statutes and AG guidance before use: https://www.concord.tech/blog/global-privacy-control-gpc-multi-state-mandate , https://www.foster.com/newsroom/legal-alerts/global-privacy-controls-preparing-for-the-next-wave-of-enforcement/ ). Roughly 12 states require businesses to honour universal opt-out signals:

| State | Universal opt-out effective (reported) |
|---|---|
| California | 1 Jan 2023 (CPRA regulations) |
| Colorado | 1 Jul 2024 |
| Connecticut | 1 Jan 2025 (one source says 2026) |
| Texas | 1 Jan 2025 |
| Montana | 1 Jan 2025 |
| New Hampshire | 1 Jan 2025 |
| New Jersey | 15 Jul 2025 |
| Maryland | 1 Oct 2025 (MODPA) |
| Oregon | 1 Jan 2026 |
| Delaware | 1 Jan 2026 |
| Minnesota | UNVERIFIED date (law effective 31 Jul 2025) |
| Nebraska | conditional. UNVERIFIED |

- California reportedly requires sites to display that GPC was honoured, from 1 January 2026 (§7025(c)(6); SECONDARY).
- California **AB 566** reportedly requires browsers to offer an opt-out signal from 1 January 2027 (SECONDARY).

**Impact on us:**
- Agencies will want a "GPC honoured?" check. The browser can send `Sec-GPC: 1` and check whether ad pixels still fire or drop identifiers.
- Wrong dates in a client report would be a credibility and liability problem.

**Mitigation:**
- Build a GPC test mode that sets `navigator.globalPrivacyControl` and the `Sec-GPC` header via `declarativeNetRequest` header modification. Compare requests made with and without the signal.
- Ship the state list as data with a "last reviewed" date, not as hard-coded copy. Show "reported effective date, verify with counsel".
- Re-verify against state AG and CPPA sources before launch. This is an open task.

### A4. India: DPDP Act 2023 and DPDP Rules 2025

**Facts:**
- **Act:** enacted by Parliament on 11 August 2023 (VERIFIED, PIB backgrounder: https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf ).
- **Rules notified:** PIB states **14 November 2025** (VERIFIED: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190014 ).
  - The Gazette reference is reported as **G.S.R. 846(E), dated 13 November 2025**, at https://egazette.gov.in/WriteReadData/2025/267650.pdf (SECONDARY). We could not open the e-Gazette PDF: TLS certificate error, then HTTP 503.
  - Treat **13 November 2025** as the Gazette date and **14 November 2025** as the public announcement date until the Gazette is read.
- **Phased commencement under rule 1** (SECONDARY reproduction of the Gazette text, SCC Online https://www.scconline.com/blog/?p=366711 ; the 18-month phasing is VERIFIED by PIB):

  | Phase | Rules | In force |
  |---|---|---|
  | Immediate | 1, 2, 17–21 (Data Protection Board) | 13 Nov 2025 |
  | 1 year | 4 (Consent Manager registration) | 13 Nov 2026 |
  | 18 months | 3, 5–16, 22, 23 (notice, consent, security, breach notification, children, rights and other core duties) | 13 May 2027 (some sources say 14 May 2027) |

- **Proposal to shorten:** in January 2026 MeitY consulted on cutting the 18-month period to 12 months, which would make the core duties apply from 13 November 2026.
  - The status of a final amendment is **UNVERIFIED**. We found no notified amendment in law-firm coverage as late as April 2026 (https://ssrana.in/articles/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs/ , https://www.storyboard18.com/digital/meity-seeks-industry-views-on-fast-tracking-dpdp-act-rollout-proposes-12-month-compliance-timeline-88332.htm ).
  - **Re-check meity.gov.in and egazette.gov.in before launch.**
- **Data Protection Board:** MeitY has advertised the Chairperson and Member posts (VERIFIED: https://www.meity.gov.in/static/uploads/2026/05/53b1bcf01cab9a0adde463e73fbc3417.pdf ).

**Impact on us:**
- The Growth Folks® and many clients are India-facing. The DPDP Act is consent-centric with no "legitimate interest" equivalent, so pre-consent tracking for Indian users becomes a material finding once rules 3 and 5–16 apply.
- Our own extension is a Data Fiduciary for any personal data it processes. Today it processes none off-device, which is the design goal.

**Mitigation:**
- Add an "India (DPDP)" jurisdiction profile. Show "obligations apply from 13 May 2027 (or earlier if amended)" until that date.
- Keep everything local, which keeps us out of scope.
- If we add accounts or licensing, publish a DPDP-compliant notice. Consent Managers must be Indian companies.

### A5. Chrome third-party cookies and Privacy Sandbox

**Facts:**
- July 2024: Google dropped full third-party cookie deprecation in favour of a "user choice" approach.
- **22 April 2025:** Google said it would keep the current approach (choice in Chrome settings) and **not** roll out a standalone prompt (VERIFIED: https://privacysandbox.google.com/blog/privacy-sandbox-next-steps ; CMA record: https://assets.publishing.service.gov.uk/media/6811f0ac0a8696a367e72730/Privacy_Sandbox_Progress_Report_to_the_CMA_2025_Q1.pdf ).
- **17 October 2025:** Google announced it would retire most Privacy Sandbox APIs (Topics, Protected Audience, Attribution Reporting and others) (VERIFIED: https://privacysandbox.google.com/blog/update-on-plans-for-privacy-sandbox-technologies ). Removal milestones are UNVERIFIED.

**Impact on us:**
- Third-party cookies still work for most Chrome users, so third-party tag behaviour stays realistic in our tests.
- Do not build features around Privacy Sandbox APIs.
- Incognito and other browsers (Safari ITP, Firefox ETP) differ, and results vary by browser profile.

**Mitigation:**
- Note in the report: "tested in Chrome <version>, third-party cookies: allowed/blocked".
- Detect the profile setting where possible.
- Drop any Topics/Attribution Reporting checks.

### A6. Microsoft UET consent enforcement

**Facts** (VERIFIED):
- Consent signals are required from **5 May 2025** for EEA, UK and CH traffic (https://about.ads.microsoft.com/en/blog/post/march-2025/providing-user-consent-signals-on-your-microsoft-campaigns-by-may-5-2025 ).
- Where consent is enforced, the default is denied (https://help.ads.microsoft.com/apex/index/3/en/60119 ).
- Clarity enforces consent signals for EEA, UK and CH from **31 October 2025** (https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2 ).

**Impact on us:** this is a clear, checkable rule (`asc=G/D` on `bat.bing.com`) with commercial value: missing signals cause conversion loss.

**Mitigation:** implement as specified in PLATFORM-SPECS.md §2. Wire values come from vendor source code, so keep the parser tolerant.

### A7. Meta health & wellness / sensitive data restrictions

**Facts:**
- Meta restricts data from categorised data sources in three tiers: core setup, restrictions on certain standard events, and full restrictions.
- It prohibits health, financial and other sensitive information in URLs, UTMs, custom event, conversion and audience names, and custom data (VERIFIED: https://www.facebook.com/business/help/511197658391698 , https://www.facebook.com/business/help/124742407297678 , https://www.facebook.com/business/help/361948878201809 ).
- Rollout to health and wellness advertisers was from January 2025 (SECONDARY).

**Impact on us:**
- High value: we can flag risky URLs and event names before Meta does.
- Risk: false alarms on benign words (for example "care" or "test"), and implying a client is "restricted" when we cannot see Events Manager.

**Mitigation:**
- Use a curated term list by category with context rules (path or UTM position, not the page body).
- Use wording such as "may trigger Meta data restrictions".
- Link to Meta's help pages.
- Let users mute terms.

### A8. Google Ads EU user consent policy (EUUCP) and Consent Mode v2

**Facts** (VERIFIED):
- Advertisers measuring EEA users with Google tags, or using personalisation, must pass consent through consent mode or TCF (https://support.google.com/google-ads/answer/13695607 ).
- The policy covers the EEA, UK and Switzerland (https://www.google.com/about/company/user-consent-policy-help/ ).
- From March 2024, Customer Match for the EEA requires both consent fields to be GRANTED.
- A "consent audit" help article exists (https://support.google.com/google-ads/answer/16724512 ).
- From **15 June 2026**, Consent Mode is the sole control over Google Ads cookies and IDs collected via GA (https://support.google.com/analytics/answer/17016975 ).

**Impact on us:** `gcs`/`gcd` checks are a core feature. `gcd` letter decoding is unofficial and Google says the fields may change.

**Mitigation:**
- Label the decoded `gcd` as "interpreted".
- Show the raw values.
- Unit-test against captured fixtures and refresh them quarterly.

### A9. OpenAI / ChatGPT Ads measurement

**Facts** (VERIFIED, official docs):
- Pixel SDK `bzrcdn.openai.com/sdk/oaiq.min.js`; events go to `bzr.openai.com/v1/sdk/events`; CAPI at `bzr.openai.com/v1/events`.
- The click ID is `oppref`, stored in cookie `__oppref`.
- **Consent defaults to granted** unless `oaiq("consent", false)` is called before init.
- The docs change monthly. Changelog entries run June to September 2026.

**Impact on us:**
- This is a new platform, and early support is a differentiator.
- The risk is schema churn. The JS wire format is undocumented.

**Mitigation:**
- Version-gate the parser on `sv=`.
- Fall back to "OpenAI pixel request detected (unparsed)".
- Re-check the docs monthly.

---

## B. Chrome Web Store policy risks

Sources (VERIFIED, checked 2026-10-16):
- Program policies: https://developer.chrome.com/docs/webstore/program-policies/policies
- Single purpose FAQ: https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq
- Limited Use: https://developer.chrome.com/docs/webstore/program-policies/limited-use
- MV3 requirements (remote code): https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements
- Spam and keyword FAQ: https://developer.chrome.com/docs/webstore/program-policies/spam-faq
- Impersonation and IP: https://developer.chrome.com/docs/webstore/program-policies/impersonation-and-intellectual-property
- Affiliate ads: https://developer.chrome.com/docs/webstore/program-policies/affiliate-ads
- Developer Agreement: https://developer.chrome.com/docs/webstore/program-policies/terms

| # | Policy | What it says (VERIFIED) | Impact on us | Mitigation |
|---|---|---|---|---|
| B1 | **Single purpose** | An extension must have a single purpose, limited to a narrow focus area or a narrow browser function | Bundling unrelated features (SEO audits, coupon tools) could be judged multi-purpose | Keep the purpose as "inspect and audit marketing tags and consent on the current page". Every feature, including reports and white-label, must serve it. |
| B2 | **Limited Use / user data** | Use or transfer user data only for the single purpose. No selling, no advertising use, no transfer to data brokers. Humans may not read data except in narrow cases. An affirmative Limited Use statement must be on our website. A privacy policy is required if user data is handled. | Network request contents (URLs, bodies with hashed emails) are user data even when processed locally | Process locally, with no telemetry by default. Publish the Limited Use statement on thegrowthfolks.com. Keep PRIVACY.md and the CWS data disclosure form consistent. Redact `*_sha256`, email and phone fields in exports by default. |
| B3 | **Remote code ban (MV3)** | No `<script>` from outside the package, no `eval` of fetched strings, no interpreters running fetched commands. Data fetched externally "must not contain any logic". Only the Debugger and User Scripts APIs are exempt. | Updating detection rules remotely could count as remote logic if the rules are code | Ship rules in the package. If we fetch rule updates, keep them pure declarative data (hosts, parameter names, regexes) interpreted by fixed, bundled code. Never `eval`. |
| B4 | **Disclosure requirements** | Be transparent; disclose collection, use and sharing; prominent disclosure where needed | `webRequest`, `<all_urls>` and `cookies` permissions trigger review scrutiny | Justify each permission in the listing. Use optional host permissions or `activeTab` where possible. Show an in-product data notice on first run. |
| B5 | **Keyword spam** | Keep a keyword under about 5 instances. List no more than five supported sites or brands in the description. | A title or description listing "GA4, GTM, Meta, TikTok, LinkedIn, Pinterest, Snap, Reddit, Clarity, Hotjar, OpenAI…" breaches this | Title is "Pixel & Tag Checker by The Growth Folks®", with no brand stuffing. The description names at most five platforms, then says "and more", with the full list on the website. |
| B6 | **Impersonation / competitor and trade marks** | Do not imply endorsement by another company. Do not infringe trade marks. Do not misuse others' marks in metadata. Unattributed or "Editor's Choice"-style claims are not allowed. | Platform logos (Meta, Google, OpenAI) and competitor names (for example "Tag Assistant alternative" or "Omnibug alternative") in the listing risk takedown | Use plain-text platform names for descriptive, nominative use only. No logos in store assets unless their brand rules allow it. Add a disclaimer: "Not affiliated with or endorsed by Google, Meta, Microsoft, OpenAI…". No competitor names in the title or short description. Comparison pages go on our website, not in the listing. |
| B7 | **Affiliate / monetisation** | Affiliate links only with related user action and tangible user benefit; no background injection | Low risk, unless we add partner links (for example CMP referrals) | No affiliate injection. Any partner links are clearly labelled and clicked by the user. |
| B8 | **Payments** | The Developer Agreement says developers who charge are responsible for transactions and taxes. Chrome Web Store payments are deprecated: the docs list a deprecation page (SECONDARY / UNVERIFIED details). | Pro plan billing must be external | Use our own licensing and checkout (see docs/LICENSING.md). The free tier must be genuinely useful. Disclose paid features in the listing. |

---

## C. Product risks

### C1. Data accuracy: the browser cannot see server-side tracking

- **Fact:** server-side GTM, Conversions APIs (Meta CAPI, OpenAI CAPI at `bzr.openai.com/v1/events`, TikTok Events API, Google enhanced conversions via server) and first-party proxies do not appear in the browser's network log, or appear only as calls to the site's own domain (VERIFIED for OpenAI: "Send events to the Conversions API from your server only").
- **Impact:**
  - "No purchase event" may be wrong.
  - Deduplication cannot be verified end to end.
  - First-party-proxied tags (for example `metrics.example.com`) may be missed.
- **Mitigation:**
  - Label findings "browser-observed".
  - Add a standard caveat to every report: "Server-side and offline events are not visible to this tool."
  - Detect common sGTM signatures (first-party `/g/collect`, `transport_url`).
  - Show `event_id` values so clients can match them against server logs themselves.

### C2. False positives and negatives

- **Sources of false results:**
  - Timing-based consent checks depend on detecting the CMP choice time. Unknown CMPs and SPA navigation break this.
  - Region: consent defaults differ by IP country, and our tester may be in India while the client's users are in the EU.
  - Cached consent from previous visits.
  - Ad blockers or browser privacy settings suppressing requests.
  - Undocumented, changing wire formats (OpenAI JS body, UET `asc`, Google `gcd`).
  - Meta sensitive-term matches on benign words.
- **Mitigation:**
  - Provide a "clean run" mode that clears site data, uses a fresh profile tip, and records the CMP and its choice.
  - Show raw evidence (request, timestamp, parameter) for every finding.
  - Use severity levels FAIL, WARN, REVIEW and INFO.
  - Allow manual override of the consent time.
  - Keep a fixtures test suite per vendor.
  - Document the known limitations in-product.

### C3. Platform terms when naming competitors and platforms

- **Facts:**
  - The CWS impersonation and IP policy, B6 above.
  - Platform brand guidelines generally restrict logo use. Specific Meta, Google, Microsoft and OpenAI brand rules were not reviewed in this pass (UNVERIFIED).
- **Impact:** listing rejection, or a trade mark complaint.
- **Mitigation:**
  - Nominative text only.
  - An "independent tool" disclaimer.
  - No vendor logos in the store or in reports by default. White-label reports use only the agency's logo.
  - Competitor comparisons stay factual, dated, and on our website.

### C4. Liability wording ("not legal advice")

- **Facts:**
  - Regulators frame consent failures as legal breaches (CNIL decisions).
  - Microsoft itself states its information "does not constitute legal advice" (VERIFIED, UET consent page).
- **Impact:** clients may rely on a "PASS" as proof of compliance. An agency could forward our report to a regulator or a client's lawyer.
- **Mitigation:**
  - Footer on every report and side panel: "This report is a technical observation of tags fired in one browser session. It is not legal advice and does not certify compliance. Consult a qualified adviser."
  - Use "likely" and "may" language for legal points.
  - Make no guarantees in the store listing.
  - Terms of use should limit liability. Contact: team@thegrowthfolks.com.

### C5. Scraping and automation limits

- **Facts:**
  - The extension inspects pages the user opens, which is low risk.
  - Bulk or automated crawling of client or third-party sites may breach site terms and robots policies, trigger bot protection, and conflict with the CWS single-purpose and user-data policies if data is sent off-device.
- **Impact:** a "scan 100 URLs" Pro feature could create ToS or CWS problems and inaccurate results (bot pages, CAPTCHAs).
- **Mitigation:**
  - Keep scanning user-initiated, in the user's own browser, at modest rates with visible tabs.
  - Respect site terms; offer only for sites the user is authorised to audit, with a checkbox in multi-URL mode.
  - Never proxy scans through our servers.
  - Do not scrape platform dashboards such as Events Manager or Ads Manager. Use official APIs only if ever needed.

### C6. Handling personal data seen in requests

- **Fact:** pixel requests can carry hashed or raw emails and phone numbers, IP-related data and order IDs. OpenAI's docs warn against personal data in image-tag query strings (VERIFIED).
- **Impact:**
  - Reports exported or shared by agencies could leak end-user PII.
  - We could become a processor under GDPR or DPDP if data leaves the device.
- **Mitigation:**
  - Redact PII-like values in exports by default.
  - Make no network calls with captured data.
  - Clear captured data when the panel closes, with an option to retain it.
  - Write all of this in PRIVACY.md.

---

## D. Open items to re-verify before launch

1. DPDP Rules: read G.S.R. 846(E) on egazette.gov.in, and check for any 2026 amendment shortening the 18 months.
2. GPC states: confirm each date against the statute or AG/CPPA source. Minnesota and Nebraska dates are missing.
3. UET event path suffix and `_uet*` cookie names, from Microsoft documentation.
4. TikTok official consent-mode page text. Official LinkedIn, X, Snap and Reddit consent APIs, if any exist.
5. Google `gcd` letters: refresh against a live capture. Google warns the format may change.
6. OpenAI: whether `oppref` is always auto-appended to ad landing URLs, and any consent changes for EEA launch. Re-read https://developers.openai.com/ads/llms-full.txt monthly.
7. Meta: whether Meta offers a named CAPI parameter-filtering feature.
8. ePrivacy Regulation withdrawal status, and the Digital Omnibus outcome.
