# Pixel & Tag Checker: v1 spec (this release)

_2026-10-16. Builds on the shipped extension (README.md, CHANGELOG.md). Research references:_
- _**P#** = pain and **F#** = feature request (`research/REVIEWS.md`)_
- _**Pn** = persona (`research/PERSONAS.md`): P1 auditor, P2 owner, P3 operator, P4 verifier_
- _**§** = section of `research/PLATFORM-SPECS.md`_

## 1. Feature list

### Must (v1): parity with the best competitor (already shipped, kept)

| Feature | Justification |
|---|---|
| Detect 15 platforms by network request, including GTM-deployed, template, proxied and server-side endpoints, plus Shopify sandbox | P1, P2 (33 + 8 rows); every persona |
| Per-hit delivery status (sent / failed / blocked by ad blocker), latency | P3 (26), F3 (32) |
| One-click audit, score, findings with a plain-English fix | P9, F20, praise (25) |
| Consent Mode v2 decoding; Accept / Reject banner test; GPC test; cookie table | P4, F4; P4 verifier |
| PII detection; Enhanced Conversions hashing; event_id dedup hints | P11; P4 |
| Request inspector, dataLayer timeline, preserved log across pages | F11, P15 |
| Multi-page scan, coverage gaps, client PDF, history and "changes since", monitoring (Pro) | F7, F8; P1 auditor |

### Advanced (v1, our edge): new in this release

| # | Feature | Justification |
|---|---|---|
| A1 | **OpenAI / ChatGPT Ads pixel checker**, see §2 | Emerging demand (DEMAND §2); gap (COMPETITORS §6); P3 operator |
| A2 | **Pre-consent timeline and verdict per vendor**, see §3 | F4 (17), P4 (14), P12 UET (14); P1 and P4; strongest differentiator (PERSONAS priorities) |
| A3 | **Meta sensitive-data pre-check**, see §4 | P6 (10), F18 (10); P2 owner (health/beauty D2C) |
| A4 | **Microsoft UET Consent Mode check** (part of A2 plus a standalone finding) | P12 (14), F21 (14) |

### Later (not in this release; see DECISIONS.md)

- IAB TCF v2.2 / GPP string decoding.
- Clarity `consentv2` state decoding.
- India checkout checks (Shiprocket, GoKwik, Razorpay).
- "Which tag loaded which" initiator chain.
- "Copy findings for AI" with redaction.
- Firefox / Edge listings.
- Confirmation that the platform *received* the event (needs account access).
- Agency tier with cloud monitoring.

## 2. A1: OpenAI pixel checker

**Detection** (§1.1–1.3):

| Request | Classified as |
|---|---|
| `bzrcdn.openai.com/sdk/oaiq.min.js` | `openai` script load |
| `bzr.openai.com/v1/sdk/events` (POST JSON body, beacon or fetch) | One hit per `events[]` item. Event = `type` (`custom` → `custom_event_name`). ID = `pid` query. Params flattened: `events[].data.*`, `id`, `source_url`, and top-level `oppref`, `obref` and `user.*` |
| `bzr.openai.com/v1/sdk/events` (GET, image tag) | One hit. Event = `event`. ID = `pid`. Params: `event_id`, `oppref`, `data[...]` |
| `bzr.openai.com/v1/events` from the browser | Conversions API call; always a critical finding |
| SDK-internal events `oai::diagnostic`, `openai::sdk_init` | Hidden from audit checks, still visible in Requests |

**Checks:**

| Finding id | Severity | Rule |
|---|---|---|
| `openai-capi-in-browser` | critical | Any browser request to `/v1/events`: an API key is exposed in page code |
| `openai-unknown-event` | warning | `type` not in the 10 standard events (§1.5) and not `custom` |
| `openai-custom-name` | warning | `custom` without `custom_event_name`, or a name that is invalid or equals a standard name |
| `openai-amount-format` | warning | `amount` not an integer (minor units), or amount without currency |
| `openai-oppref-missing` | warning | Landing URL has `oppref`, but conversion hits (`order_created`, `lead_created`, `registration_completed`, `subscription_created`, `trial_started`, `checkout_started`) carry no `oppref`, and no `__oppref` cookie exists |
| `openai-oppref-captured` | pass | Landing URL has `oppref` and it appears on later hits or in the `__oppref` cookie |
| `openai-no-event-id` | info | `order_created` without an event id. The Conversions API can't dedupe against the pixel (§1.7) |
| PII rule | critical | Joins the existing `pii-leak`: `user.*` values that aren't 64-character lowercase hex, and email-like text anywhere in OpenAI params |

The fix text always says the browser can't see server-side forwarding: "Make sure your server forwards the original `oppref` string unchanged as `events[].oppref`."

## 3. A2: pre-consent timeline per vendor

**Inputs** (already captured):
- navigation timestamp (t0)
- first-party CMP detection (probe)
- every hit with `ts`
- in a consent test, the choice timestamp `tChoice` and its mode (accept / reject)

Without a test, all hits count as "before choice" whenever a CMP is detected and no stored choice is known.

**Per-vendor rows**, covering every platform seen: Google (GA4/Ads), UET, Meta, TikTok, LinkedIn, X, Pinterest, Snap, Reddit, Clarity, Hotjar, OpenAI.

Each row has:
- `before`: hit count and ms after load of the first hit
- `after`: hit count after the choice
- `signal`: the wire consent value where one exists (Google `gcs` / effective `ad_storage`; UET `asc`)
- `verdict`

**Verdicts:**

| Verdict | Rule |
|---|---|
| **pass** | Nothing before the choice, or only signals that carry denied consent (Google effective `ad_storage` denied; UET `asc=D`) |
| **fail: fired before consent** | Ad pixels (non-Google, non-UET), OpenAI, or Hotjar sending before the choice when a CMP is present. Google with granted `ad_storage` before the choice. UET with `asc=G` before the choice |
| **fail: fired after reject** | Any of the above after a reject (Google/UET only if granted) |
| **warn: no consent signal** | UET hits with no `asc` (and no `tcf`) while a CMP is present (§2.4) |
| **info: cookieless mode** | Clarity before consent (Microsoft allows no-consent mode, §4) |
| **fail: update missing** | After accept, UET still `asc=D` or Google still denied (conversion loss) |

**Display:**
- **Panel:** a "Consent timeline" card. A single line reads "Page load → banner (CMP name) → choice @ +x.xs → tags". Under it, a table of vendor / before / after / verdict chip (icon + word).
- **Report:** a "Consent timeline by vendor" section with the same table.

**Findings:**
- `consent-timeline-fail`: critical; lists the vendors.
- `uet-consent-missing`: warning.
- `uet-consent-update-missing`: warning.

Every finding links GDPR/UK PECR, US GPC states and India DPDP (core duties from 13 May 2027) in its detail text, with "not legal advice". Existing `pixels-ignore-consent` and `pixels-fire-after-reject` stay; the timeline adds the per-vendor view and the new vendors (OpenAI, UET signal).

## 4. A3: Meta sensitive-data pre-check

- **Scan:** on Meta hits, read `dl` and `rl` (path and query, including UTMs), custom event names (`ev` not in Meta's standard list), and `cd[...]` keys and values.
- **Dictionary** (§5.3 categories): health conditions, reproductive and sexual health, mental health, treatments and medications, weight loss, financial distress (loan denial, debt, credit score, bankruptcy), and identifiers (`ssn`, `password`, `otp`).
  - Match on whole words or hyphen/underscore tokens, case-insensitive, to keep false positives down. For example "therapy" matches, "therapeutic-grade" doesn't; "anxiety" matches.
- **Finding:** `meta-sensitive-data`, severity warning: "May trigger Meta data restrictions". The detail lists the matched term, category and where it was found (URL path, UTM, event name, custom data), with the value redacted to the term.
- **Fix:**
  - Rename custom events and custom conversions to neutral names.
  - Strip sensitive URL paths and parameters from the pixel (`dl` / `rl`), or turn on Meta's core setup.
  - Remove the pixel from patient or account pages.
  - Filter parameters server-side if you use the Conversions API.
- **Never claim the account is restricted;** the browser can't see Meta's category.

## 5. Screens

- **Audit tab:**
  1. Score
  2. Platforms (now includes "ChatGPT Ads (OpenAI)")
  3. Consent Mode
  4. **Consent timeline** (new card; shows "Run a cookie banner test for a full timeline" when no test ran)
  5. Consent test, cookies, findings
- **Requests tab:** OpenAI chip; OpenAI hits show event, pixel id, amount/currency, `oppref` present yes/no.
- **Report:** a new "Consent timeline by vendor" section after the Consent Mode status.
- **Settings:** unchanged.

## 6. Data model

- Hit gains `platform: 'openai'`; existing hit shape `{ platform, kind, id, event, params, consent, url, ts }`.
- `result.consentTimeline = { t0, tChoice, mode, cmp, vendors: [{ platform, before, firstMs, after, signal, verdict, note }] }`, stored with the audit (page and site; site uses the first page that has one).
- Finding ids are listed above. Storage keys are unchanged.

## 7. Edge cases

- **Batched OpenAI bodies:** multiple events per request, `sendBeacon` raw bytes (already decoded by the service worker), and invalid JSON (ignore the body, keep the hit as unparsed).
- **Image-tag `data[...]` bracket keys.**
- **Duplicate counting:** OpenAI's image fallback after a failed beacon may produce duplicates. Dedupe on `id` within 2 s.
- **Missing `tChoice`:** with no test, there's no "after" column; verdicts are evaluated as "before" only when a CMP is detected. With no CMP, the timeline shows "No consent banner detected" plus the existing `consent-missing` logic.
- **Google advanced mode:** cookieless pings with denied consent pass, not fail (REVIEWS confusion C2).
- **Meta matching:** sensitive terms inside IDs or hashes are not scanned (only `dl`/`rl`/`ev`/`cd`). The domain is excluded from matching (core setup keeps the domain).
- **Redaction:** emails in OpenAI user fields are redacted before saving (existing `redactEmails`).

## 8. Accessibility

Status is always icon + word + colour. The timeline table uses real `<table>` markup with headers, keyboard-reachable, AA contrast in light and dark, tokens only.

## 9. Performance budgets

- OpenAI body parsing: under 1 ms per request (JSON.parse on bodies under 64 KB; larger bodies are skipped).
- Timeline build: O(hits), under 5 ms for 2,000 hits.
- Sensitive-term scan: a precompiled single regex; under 2 ms per audit.
- No new permissions, no network calls, no added content scripts.

## 10. Acceptance criteria

1. Fixture payloads (JS beacon body with 2 events plus `oppref`, image GET with `data[amount]`, browser call to `/v1/events`) produce the expected hits and findings in unit tests.
2. Timeline unit tests cover:
   - Meta before choice: fail
   - Google denied cookieless: pass
   - UET `asc=D` then `G` after accept: pass
   - UET no `asc` with CMP: warn
   - UET `asc=D` after accept: update missing
   - OpenAI after reject: fail
   - Clarity before consent: info
3. Meta sensitive-data unit tests cover:
   - `dl=/conditions/diabetes-care?utm_campaign=anxiety-relief` flags (path and UTM)
   - `ev=WeightLossQuizCompleted` flags
   - neutral URLs and `therapeutic` don't flag
4. Playwright end-to-end tests with the unpacked extension:
   - a fixture page loading the real OpenAI SDK URL (stubbed by route) and posting a beacon
   - a CMP fixture with Accept/Reject buttons where Meta fires early
   - the panel shows the OpenAI platform, the timeline card with fail chips, and the report section
5. All existing tests pass; `npm run zip` builds; no new permissions; light and dark screenshots on brand.
