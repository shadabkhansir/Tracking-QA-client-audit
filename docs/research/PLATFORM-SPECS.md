# Platform specs for detection rules

Pixel & Tag Checker by The Growth Folks®: technical reference for detection and consent checks.

- **Research date:** 2026-10-16. Every fact below was checked on 2026-10-16 unless marked otherwise.
- **Labels:**
  - **VERIFIED (official doc):** stated in vendor documentation.
  - **VERIFIED (vendor source code):** read in the vendor's live public JavaScript on 2026-10-16. It is not documented, so it can change without notice. Detection code should tolerate that.
  - **SECONDARY:** reputable third-party coverage only.
  - **UNVERIFIED:** not confirmed. Do not hard-code it as a rule.
- **Scope:** request formats change. Treat everything here as detection hints, version-pin where possible (for example, OpenAI SDK `sv=0.1.41`), and degrade gracefully.

---

## 1. OpenAI / ChatGPT Ads: Measurement Pixel, Image Tag and Conversions API

**Summary.** The pixel exists and is publicly documented. Its click identifier really is called `oppref`, so the build brief's name is correct. OpenAI's docs call it a "privacy-preserving attribution identifier". The real names and endpoints are below.

Sources (all checked 2026-10-16):
- Ads docs index: https://developers.openai.com/ads
- Measurement Pixel: https://developers.openai.com/ads/measurement-pixel (markdown: `…/measurement-pixel.md`)
- Image Tag: https://developers.openai.com/ads/image-tag
- Conversions API: https://developers.openai.com/ads/conversions-api
- Supported Events: https://developers.openai.com/ads/supported-events
- Conversion Tracking: https://developers.openai.com/ads/conversion-tracking
- Full export, including the changelog and the campaign tracking-template docs: https://developers.openai.com/ads/llms-full.txt
- Live SDK: https://bzrcdn.openai.com/sdk/oaiq.min.js (version string `0.1.41` on 2026-10-16)
- Advertiser blog, "More ways to measure": https://ads.openai.com/blog/more-ways-to-measure. It returned HTTP 403 to our fetcher, so its contents are UNVERIFIED. Search snippets mention pixel and CAPI partner integrations (Hightouch, Tealium, LiveRamp, AppsFlyer, Adjust).

### 1.1 Hosts and paths

| What | Value | Status |
|---|---|---|
| SDK script | `https://bzrcdn.openai.com/sdk/oaiq.min.js` | VERIFIED (official doc) |
| Per-pixel config fetch | host `bzrcdn.openai.com`; the doc's CSP table says "Fetch per-pixel configuration"; path not documented | VERIFIED host / UNVERIFIED path |
| JS pixel event collection | `https://bzr.openai.com/v1/sdk/events`. The doc says events are sent with `fetch` or `sendBeacon`, with an image request as fallback | Host VERIFIED (official doc, CSP table); full URL VERIFIED (vendor source code) |
| Image tag (no-JS) | `GET https://bzr.openai.com/v1/sdk/events?pid=…&event=…&data[type]=…`; responds `200 image/gif` | VERIFIED (official doc) |
| Conversions API (server) | `POST https://bzr.openai.com/v1/events?pid=<PIXEL-ID>` with `Authorization: Bearer <API-KEY>` and a JSON body | VERIFIED (official doc). A browser should never call it: the doc says "Do not call the server conversions API directly from page code". |
| Ads management API (not tracking) | `https://api.ads.openai.com/v1/...` | VERIFIED (official doc). Ignore for tag detection. |

**Detection rule:**
- Host `bzr.openai.com`, path `/v1/sdk/events`: browser pixel or image-tag hit.
- Host `bzr.openai.com`, path `/v1/events`: Conversions API. If seen from a browser, report it as a misconfiguration, because it means an API key is exposed client-side.
- Script `bzrcdn.openai.com/sdk/oaiq.min.js`: OpenAI pixel installed.
- Global function `window.oaiq`: pixel stub present.

### 1.2 JS pixel request format (VERIFIED from vendor source code, SDK v0.1.41, undocumented)

- **Query string**, built in function `Fs`:

  | Param | Meaning |
  |---|---|
  | `pid` | Pixel ID |
  | `st` | SDK type, value `oaiq-web` |
  | `sv` | SDK version, e.g. `0.1.41` |
  | `t` | `Date.now()` in ms |
  | `ec` | event count in the batch |

- **Transport:** `navigator.sendBeacon(url, body)` first, then fetch, then image fallback. The doc lists fetch, sendBeacon and image. The method is POST for beacon and fetch.
- **Body:** a JSON string. Batched; the doc says "batches closely grouped `measure` calls". The shape is `{ obref, events: [...], oppref, user }`.
  - When consent is not granted, or when all events are internal diagnostics, the body is reduced to `{ events: [...] }` and credentials are omitted.
- **Each event object** (source function `lo`):
  - `type`: the event name
  - `timestamp_ms`
  - `id`: the event_id
  - `source_url`
  - `referrer_url`
  - `opt_out`
  - `custom_event_name`: only when type is `custom`
  - `data`: an object with a `type` field
- **Internal event names:** the SDK also emits `oai::diagnostic` and `openai::sdk_init`. They are not advertiser events, so the extension should hide or label them as SDK internals.
- **Parsing:** for beacon or fetch hits the extension must read the request body. In MV3 this means `webRequest` `requestBody.raw` bytes. Do not rely on the query string for the event name.

### 1.3 Image tag parameters (VERIFIED, official doc)

| Param | Required | Notes |
|---|---|---|
| `pid` | yes | Pixel ID |
| `event` | yes | Standard event name, or `custom` |
| `custom_event_name` | when `event=custom` | 1–64 chars, `[A-Za-z0-9_-]`, starts and ends alphanumeric, must not equal a standard name |
| `event_id` | no | Deduplication ID |
| `oppref` | no | Click identifier. The image tag does **not** capture it automatically. |
| `data[type]` | yes | `contents`, `customer_action`, `plan_enrollment` or `custom` |
| `data[amount]`, `data[currency]` | no | Integer amount in **minor units** (2599 = 25.99). Currency is ISO 4217 and required if amount is set. |
| `data[contents]` | no | URL-encoded JSON array |
| `data[plan_id]` | no | For `plan_enrollment` and `custom` |

- OpenAI rejects unknown `data[...]` fields.
- The doc says not to put personal data, session IDs or order IDs in the query string. This can be a lint rule.

### 1.4 Parameter names (pixel `measure` call and CAPI)

**Pixel calls:**
- `oaiq("init", { pixelId, debug?, user? })`
- `oaiq("measure", <event_name>, <data>, <options>)`
  - `data`: `{ type, amount?, currency?, contents?, plan_id? }`
  - `options`: `{ event_id?, custom_event_name?, opt_out? }`

| Concept | Pixel (JS) | Image tag | CAPI JSON |
|---|---|---|---|
| Pixel / advertiser ID | `init` → `pixelId`; wire: `pid` | `pid` | `?pid=` query |
| Event name | 2nd arg of `measure`; wire: `events[].type` | `event` | `events[].type` |
| Event ID (dedup) | `options.event_id`; wire: `events[].id` | `event_id` | `events[].id` |
| Value | `data.amount` (integer, minor units) | `data[amount]` | `events[].data.amount` |
| Currency | `data.currency` | `data[currency]` | `events[].data.currency` |
| Click ID | captured automatically → body `oppref` | `oppref` | `events[].oppref` (event-level) |
| Browser ID | `__obref` cookie → body `obref` | n/a | `events[].user.obref` |
| Event time | automatic | n/a | `events[].timestamp_ms`: within the last 7 days and no more than 10 minutes in the future |
| Source URL | automatic, adds `source_url` | from Referer | `events[].source_url`, required when `action_source` = `web` |

Notes on the user object:
- **Pixel `user` fields** (in `init`): `email_sha256`, `phone_number_sha256`, `external_id_sha256`, `first_name_sha256`, `last_name_sha256`, `country`, `city`, `region`, `postal_code`.
- **CAPI `user` fields** are plural lists of at most 3 values each: `emails_sha256`, `phone_numbers_sha256`, `external_ids_sha256`, `first_names_sha256`, `last_names_sha256`, `countries`, `cities`, `regions`, `postal_codes`. Single-value fields are `android_advertising_id`, `obref`, `ip_address` and `user_agent`.
- **Hashing:** values are SHA-256, lowercase hex, 64 characters. Audit idea: flag any `user` value that is not a 64-character hex string as possible raw PII.

CAPI also takes these fields:
- Top level: `validate_only`, `integration_source` (1–64 chars) and `events` (at most 1,000 per batch; one bad event fails the whole batch).
- Per event: `action_source` is one of `web`, `mobile_app`, `offline`, `physical_store`, `phone_call`, `email` or `other`.

### 1.5 Standard event names (VERIFIED, official doc)

| Event | `data.type` | Notes |
|---|---|---|
| `page_viewed` | `contents` | Fired automatically by the pixel on init, per the doc and SECONDARY guides |
| `contents_viewed` | `contents` | |
| `items_added` | `contents` | |
| `checkout_started` | `contents` | |
| `order_created` | `contents` | Purchase |
| `lead_created` | `customer_action` | |
| `registration_completed` | `customer_action` | |
| `appointment_scheduled` | `customer_action` | |
| `subscription_created` | `plan_enrollment` | |
| `trial_started` | `plan_enrollment` | |
| `app_installed`, `app_opened` | `customer_action` | **CAPI only**, with `action_source` = `mobile_app` |
| `custom` | `custom` | Requires `custom_event_name` |

**Audit rules:**
- Flag `amount` values that are not integers. The doc says "Use integer values for `amount` and `quantity`".
- Flag `amount` sent without `currency`.
- Flag event names outside this list that are not `custom`.
- Flag a custom name that equals a standard name.

### 1.6 Click identifier `oppref`: how it flows (VERIFIED, official doc)

1. **Landing page URL query parameter `oppref`.** The pixel "captures `oppref` from the landing page URL".
   - OpenAI's campaign tracking templates also expose `{oppref}` as a macro, for example `click_id={oppref}`. So an advertiser may see the value under a custom key as well.
   - UNVERIFIED: whether OpenAI always appends `oppref=` itself. The pixel doc implies it does, because the pixel reads it from the URL. We have not seen a live ad click URL.
2. **First-party cookie `__oppref`.**
   - Expiry is 30 days.
   - The expiry is reset each time a non-empty `oppref` URL parameter is captured. Reading the cookie without the parameter does not extend it.
3. **First-party cookie `__obref`.**
   - A random browser reference with a 365-day expiry.
   - It is forwarded to CAPI as `events[].user.obref`, without hashing.
4. **CAPI.** "Unlike the pixel, the API does not capture `oppref` for you."
   - The server must capture the original string and send it unchanged as `events[].oppref` (event-level).
   - The docs also recommend sending all conversions, not only those with `oppref`, so that view-through conversions are counted.
5. **Image tag.** It does not capture `oppref`. Pass `&oppref=` only if the server already has the value.

**Extension checks:**
- Landing URL has `oppref` but no `__oppref` cookie is set after the pixel loads, and consent was granted: report "pixel not capturing click ID".
- Conversion hit body lacks `oppref` while the `__oppref` cookie exists: report it.
- Visible check: `__oppref` and `__obref` cookies exist before consent was given.

### 1.7 Deduplication (VERIFIED, official doc)

- The deduplication key is Pixel ID + event name + event ID. For custom events, `custom_event_name` replaces the event name in the key.
- The pixel's `event_id` must equal the CAPI `id`.
- OpenAI keeps the first event it receives and ignores later duplicates.

### 1.8 Consent (VERIFIED, official doc, plus vendor source code)

- **API calls:**
  - `oaiq("consent", false)` must be called **before** `init`.
  - `oaiq("consent", true)` is called after the user grants consent.
- **Default is `true`.** "The Pixel initializes consent to `true` by default unless you set it to `false` or the Pixel finds a stored denial." So an un-gated install fires immediately.
- **While consent is false:** "the Pixel doesn't send measurement-event pings". Blocked events "aren't replayed" after a grant.
- **On revoke:** `oaiq("consent", false)` deletes the `__oppref` and `__obref` cookies.
- **Stored denial** (vendor source code, undocumented): localStorage key `oaiq_consent` (`"true"`/`"false"`) and cookie name `__oaiq_consent`.
- **No consent parameter on the wire.** None is documented. The only on-the-wire hint we found is the reduced body without `obref`/`oppref`/`user` (vendor source code), and that state was observed only for diagnostic events.
- **Pre-consent detection:**
  - Any measurement `/v1/sdk/events` hit, or an `__oppref`/`__obref` cookie write, before the CMP's accept time counts as a pre-consent fire.
- **Region:** custom audiences are "not supported for campaigns targeting the European Economic Area (EEA) or Switzerland, where personalized ads are not yet available" (Custom Audiences doc). Ads are therefore served in some markets where consent law applies, and conversion measurement still needs consent there.
- **`opt_out` flag:** it relates to future user-level personalisation. OpenAI says it does not currently use pixel data for that. It is **not** a consent signal.

**Dated changelog entries** (from `llms-full.txt`):
- 3 June 2026: conversion setup endpoints added.
- 16 July 2026: `obref` added to CAPI.
- 19 August 2026: more pixel match fields; plural CAPI fields and GAID.
- 10 September 2026: web platform targeting split.
- Expect further change.

---

## 2. Microsoft UET Consent Mode (bat.bing.com)

Sources (checked 2026-10-16):
- Official help, "Setting up UET for Consent Mode": https://help.ads.microsoft.com/apex/index/3/en/60119. It is JS-rendered; we scraped the rendered text.
- Official blog, 31 March 2025, "Providing user consent signals on your Microsoft campaigns by May 5, 2025": https://about.ads.microsoft.com/en/blog/post/march-2025/providing-user-consent-signals-on-your-microsoft-campaigns-by-may-5-2025
- Live tag source: https://bat.bing.com/bat.js, read on 2026-10-16.

### 2.1 API (VERIFIED, official doc)

```js
window.uetq = window.uetq || [];
window.uetq.push('consent', 'default', { 'ad_storage': 'denied' }); // on every page, before or right after the UET tag
window.uetq.push('consent', 'update',  { 'ad_storage': 'granted' }); // after the choice, and on later pages
```

- **Only one signal:** `ad_storage`, with values `granted` or `denied`.
- **Default when nothing is set:** "For most countries, if the consent setting is not set, UET uses granted by default."
- **Enforced regions:** "In European Economic Area countries, along with the UK and Switzerland, Microsoft Advertising is enforcing Consent Mode … In scenarios where Consent Mode is enforced, the default value is denied."
- **Effect of `denied`:**
  - First-party cookies are not read or written.
  - Third-party cookies are not written.
  - Third-party cookies are read only for fraud and spam purposes.
- **Advanced mode** (Microsoft's recommendation): tags load immediately with consent defaulted to denied, and anonymised data is collected.
- **Basic mode:** no tag fires until consent is granted.
- **Auto-consent:** UET also reads TCF and "other standard mechanisms" automatically, unless the tag init has `enableAutoConsent: false`.
- **Opt-out cookie:** setting the cookie `_uetmsdns=1` stops UET sending events.
- **Clarity:** if the UET–Clarity integration is used, Clarity consent must be set separately (see §4.9).

### 2.2 Enforcement date (VERIFIED, official blog)

- Consent signals are required by **5 May 2025** for site visits from the **EEA, UK and Switzerland**.
- The three accepted methods are UET Consent Mode, IAB TCF 2.0 (directly or through a CMP), or a tag manager integration such as the GTM template.
- Missing signals "will affect advertising performance". The help page adds "conversion loss if the granted signal is not passed".

### 2.3 Wire parameter `asc`

- **Official doc:** "The asc parameter within UET events indicates the status of user consent." The doc shows the values as `denied` / `granted` in **UET Tag Helper's display**.
- **On the wire** (VERIFIED, vendor source code, `bat.js`):

  ```
  addConsentParams: if (consent.enabled) e.asc = consent.adStorageAllowed ? "G" : "D"
  ```

  - The raw query value is **`asc=G`** (granted) or **`asc=D`** (denied).
  - **`asc` is only present when Consent Mode is active.** A missing `asc` means UET received no consent-mode signal.
- **TCF on the wire** (vendor source code):
  - Parameter `tcf` holds a URL-encoded sub-string with these keys:

    | Key | Meaning |
    |---|---|
    | `st` | `L` = TCF loaded, `E` = otherwise |
    | `al=1` | auto-detected |
    | `gdpr=Y` | GDPR applies |
    | `as=G` | ad storage allowed |
    | `ms=G` | measurement allowed |
    | `pz=G` | personalisation allowed |

- **Consent pings** (vendor source code): `evt=consent` with `src=default|update|unenforced` and a `cdb` blob. GTM consent pings also exist, with `evt=gtmConsent` and `gasc=G|D`.
- **Hosts** (vendor source code): the main domain is `bat.bing.com`. When ad storage is not allowed or UET has not finished loading, the tag switches to the cookieless domain **`bat.bing.net`**. Event paths start `/action/`; preview uses `/actionp/`.
  - UNVERIFIED: the exact path suffix (commonly `/action/0`) was not confirmed in this pass.

### 2.4 Detecting pre-consent firing (official expected behaviour, plus our rule)

- **Microsoft's expected behaviour:**
  - Before consent: "UET fired, the consent state (asc) is: Denied (preferred). OR UET events shouldn't be fired."
  - After consent: `asc` must be granted on all later events.
- **Our classification:**
  - **PASS:** before the banner choice, either no UET hit, or every hit has `asc=D`. After accept, `asc=G`.
  - **FAIL (no consent signal):** a UET hit with no `asc` and no `tcf`, on an EEA, UK or CH page view.
  - **FAIL (pre-consent):** `asc=G` before the user accepted. This means the default was granted or was not set.
  - **FAIL (update missing):** the user accepted but later hits still show `asc=D`. This causes conversion loss.
  - **WARN:** `_uetsid`/`_uetvid` cookies were written while `asc=D`. The rule needs care: the cookie names are SECONDARY, and the help page does not list them.

---

## 3. Google Consent Mode v2 (gcs / gcd)

Sources (checked 2026-10-16):
- Consent mode concepts, "Consent mode HTTP parameters": https://developers.google.com/tag-platform/security/concepts/consent-mode
- Google Ads consent mode reference: https://support.google.com/google-ads/answer/13802165
- Updates to consent mode for EEA traffic: https://support.google.com/google-ads/answer/13695607
- GA data-controls change from 15 June 2026: https://support.google.com/analytics/answer/17016975

### 3.1 What Google officially says (VERIFIED)

- Consent mode settings become "HTTP request parameters such as `dma`, `gcd`, and `gcs`". Consent to Google services is encoded in `dma_cps`.
- "These fields may be subject to change as these services evolve."
- **`gcs`** carries `ad_storage` and `analytics_storage`.
- **`gcd`** "is always sent to Google services, regardless of whether consent mode is activated or not", and encodes all consent types.
  - Consequence: **the presence of `gcd` does not prove that Consent Mode v2 is implemented.** Vendor guides that say "no gcd means no CMv2" are only half right.
- **v2 types:** `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`.
- Advertisers measuring EEA users with Google tags must pass consent through consent mode or TCF (EU user consent policy).

### 3.2 `gcs` encoding (SECONDARY; Google does not publish the format)

`gcs=G1xy`, where `x` is `ad_storage` and `y` is `analytics_storage`. Each position is `1` (granted) or `0` (denied).

| Value | Meaning |
|---|---|
| `G100` | both denied |
| `G110` | ads granted, analytics denied |
| `G101` | ads denied, analytics granted |
| `G111` | both granted |
| `G1--` | consent not required for this region (seen with region-scoped defaults) |

`gcs` is absent when consent mode is not used.

### 3.3 `gcd` encoding (SECONDARY; Google says "encoded" and publishes no format)

- **Shape:** for example `gcd=13r3r3r2r5l1`.
- **Order:** the signal letters appear in this order: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`.
- **Separators:** the digits between letters, and the prefix and suffix, vary. The extension should decode letters at fixed positions after splitting on digits. This is the community approach and is UNVERIFIED for all tag versions.

Letter meanings (SECONDARY: Complianz https://complianz.io/consent-mode-for-7-0 , CookieHub https://docs.cookiehub.com/advanced/consent-mode-v2-signals , Didomi https://support.didomi.io/how-to-check-your-google-consent-mode-v2-advanced-implementation-on-web , Stape consent parser https://stape.io/helpdesk/documentation/consent-parser-variable):

| Letter | Default | Update | Effective |
|---|---|---|---|
| `l` | not set | not set | consent mode not used for this type |
| `p` | denied | none | denied |
| `q` | denied | denied | denied |
| `r` | denied | granted | granted |
| `t` | granted | none | granted |
| `u` | granted | denied | denied |
| `v` | granted | granted | granted |
| `m` | none | denied | denied |
| `n` | none | granted | granted |
| `e`/`f`/`h`/`k`/`o`/`w` | various | various | UNVERIFIED (rare, not consistently documented) |

**Audit rules:**
- A pre-consent GA4 or Ads hit with `gcs=G111` or effective-granted letters, from an EEA, UK or CH user before the banner choice: **FAIL**. The default was granted.
- `ad_user_data` or `ad_personalization` is `l`: CMv2 types are missing.
- Hits are fired with no `gcs` while a CMP is present: the CMP is not integrated with consent mode.

### 3.4 Where these parameters appear

- **GA4 hits:** `…/g/collect`.
- **Google Ads hits:** conversion and remarketing hits on `googleads.g.doubleclick.net`, `www.googleadservices.com` and `www.google.com` (`/pagead/…`, `/ccm/…`).
- **Parameters:** `gcs`, `gcd`, `dma`, `dma_cps`, and `npa` on Ads hits.
- Host and path list: SECONDARY / UNVERIFIED in this pass. Detect on the parameter names, not on the paths alone.

### 3.5 Changes in 2025–2026

- **Google signals change, 15 June 2026** (VERIFIED, https://support.google.com/analytics/answer/17016975 ):
  - Consent Mode in Google Ads becomes the **only** control over collecting Google Ads cookies and IDs through the GA tag and SDK.
  - The Google Signals setting is narrowed to signed-in behavioural reporting.
  - Effect for us: `ad_storage` defaults matter more. A granted default now means advertising cookies even when Signals is off (SECONDARY reading).
- **EU user consent policy "consent audit"** article exists: https://support.google.com/google-ads/answer/16724512 (VERIFIED that it exists; contents not reviewed). Google appears to audit advertisers' consent signals.
- **Privacy Sandbox APIs** are being retired (Topics, Protected Audience, Attribution Reporting and others). Announced 17 October 2025: https://privacysandbox.google.com/blog/update-on-plans-for-privacy-sandbox-technologies (VERIFIED announcement; removal milestones UNVERIFIED). Detection of `browsingTopics` or attribution-reporting headers is becoming obsolete.

---

## 4. Pre-consent signals by vendor

**General rule:** for most non-Google, non-Microsoft vendors there is **no consent parameter on the wire**. The only reliable signal is **timing**: a request or cookie write before the CMP's accept event, or after a reject. The extension must record the CMP decision time; see RISKS.md "false positives".

| Vendor | Consent API | What happens while not granted | Wire signal? | Status |
|---|---|---|---|---|
| **Meta Pixel** | `fbq('consent','revoke')` and `fbq('consent','grant')`; revoke must be called on every page | Pauses sending pixel fires. The live `fbevents.js` implements revoke as a "consent lock", which holds events. Whether held events are released on grant is UNVERIFIED. | **None documented.** The request goes to `facebook.com/tr` (vendor source code) only when unlocked. | API VERIFIED (official doc: https://developers.facebook.com/docs/meta-pixel/implementation/gdpr); lock VERIFIED (vendor source code, https://connect.facebook.net/en_US/fbevents.js) |
| **TikTok Pixel** | `ttq.holdConsent()`, `ttq.grantConsent()`, `ttq.revokeConsent()` | Hold queues events (storage key `tt_hold_events`). Grant releases and clears the queue. Revoke clears the queue. Consent modes are UNKNOWN, HOLD, GRANT and REVOKE. | **None found.** Timing only. Events go to `analytics.tiktok.com/api/v2/pixel` (vendor source code). | Methods VERIFIED (vendor source code, https://analytics.tiktok.com/i18n/pixel/static/main.MWFjYmVlZGY0MA.js). The official help page "Use cookies with TikTok Pixel" (https://ads.tiktok.com/help/article/using-cookies-with-tiktok-pixel) names a "pixel consent mode" but our fetch did not return its text. Semantics are SECONDARY. |
| **LinkedIn Insight Tag** | **No consent API found.** The advertiser must gate loading. LinkedIn's Ads Agreement puts consent on the advertiser. | n/a | None; timing only | SECONDARY/official mix: https://www.linkedin.com/help/lms/answer/a1444756 and https://www.linkedin.com/legal/sas-terms . Any LinkedIn consent API is UNVERIFIED. |
| **X (Twitter) Pixel** (`twq`) | **No consent API found** in X docs. X says to provide your own control that stops non-essential cookies. | n/a | None; timing only | Official guidance: https://business.x.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites/about-conversion-tracking ; consent API UNVERIFIED |
| **Pinterest Tag** | `pintrk('setconsent', true/false)`. The help page's sample has a stray `}`. `fp_cookie: false` in the `load` call disables first-party cookies. | `false`: events are not sent, and first-party cookies and session storage are deleted | None documented; timing only | VERIFIED (official doc: https://help.pinterest.com/en/business/article/install-the-base-code ) |
| **Snap Pixel** (`snaptr`) | **No consent API found.** Gate loading. | n/a | None; timing only | UNVERIFIED (no official Snap page retrieved) |
| **Reddit Pixel** (`rdt`) | `rdt('disableFirstPartyCookies')` / `rdt('enableFirstPartyCookies')`; `init` options include `optOut` (SECONDARY) | Cookie control only. This is not a full consent hold. | None confirmed; timing only | SECONDARY (CMP guides); official Reddit page not retrieved |
| **Hotjar** | **No consent API.** Hotjar says the site owner, as controller, collects consent. The script must be gated. | n/a | None; timing only | Official: https://help.hotjar.com/hc/en-us/articles/36820004397713-Privacy-FAQs |
| **Microsoft Clarity** | `window.clarity('consentv2', { ad_Storage: 'granted'\|'denied', analytics_Storage: 'granted'\|'denied' })`. Legacy: `clarity('consent')`, `clarity('consent', false)` erases cookies. | Denied or no consent: "no-consent mode", no first- or third-party cookies, and "a unique ID per page view". Clarity **still records** in that mode. | No wire parameter verified. Check for `_clck`/`_clsk` cookies (SECONDARY names) before consent. | VERIFIED (official doc: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2 ). Enforcement for **EEA, UK and CH from 31 October 2025**. |
| **Microsoft UET** | see §2 | | `asc=G/D` | VERIFIED |
| **Google tags** | see §3 | | `gcs`, `gcd` | VERIFIED / SECONDARY |
| **OpenAI pixel** | see §1.8 | | none | VERIFIED |

**What a pre-consent request looks like:** for every vendor without a wire signal it looks identical to a post-consent request. The audit must therefore record:
- `t_banner_shown`, `t_choice`, `choice` (accept, reject or partial)
- every tracking request's timestamp and initiator
- cookie writes. Cookie writes are available via `chrome.cookies.onChanged` in the extension, without reading values beyond what is needed.

**Rules:**
- Request before `t_choice` on a site with a banner: "fired before consent".
- Request after a reject: "fired after reject". This is the more serious finding, and matches the SHEIN CNIL case in RISKS.md.
- For Clarity, a request in no-consent mode is permitted by Microsoft's design. Report it as "cookieless mode" rather than as a failure.

---

## 5. Meta restrictions on health & wellness and other sensitive categories

Official sources (Meta Business Help Centre, retrieved 2026-10-16 via the Meta Ads help-article tool):
- Understand data sharing restrictions based on data source categories: https://www.facebook.com/business/help/511197658391698
- About core setup: https://www.facebook.com/business/help/124742407297678
- About prohibited information: https://www.facebook.com/business/help/361948878201809

### 5.1 How it works (VERIFIED)

- Meta assigns websites, apps and datasets to **data source categories**, or advertisers self-categorise in Events Manager.
- "Certain data source categories may come with additional data sharing restrictions."
- Restrictions can be country- or region-specific, or global.
- Meta-assigned categories cannot be edited by the advertiser; only a re-review can be requested.

**Three restriction types:**

1. **Core setup.** "Restricts the sharing of custom parameters and parts of URLs following the domain."
   - Example from Meta: `https://jaspersmarket.com/clothes/summer/dresses?item=10` becomes `https://jaspersmarket.com/`.
   - Standard parameters (for example `value`, `currency`, `content_ids`) still pass.
2. **Restriction on certain standard events.** "Restricts the sharing of specific mid and lower funnel events."
3. **Full restrictions.** All events are blocked in some or all regions, and Meta Business Tools cannot be used for ads purposes there.

**Custom events:** "if your Meta business tool has data restrictions, custom events are automatically blocked until you review and confirm them".

**Triggers for core setup** (VERIFIED, "About core setup"):
1. Meta categorised the data source into a restricted category.
2. The advertiser self-assigned a restricted category.
3. The advertiser "received multiple notifications that data you're sharing potentially goes against the Meta Business Tools Terms" (blocked parameters).
4. The advertiser turned core setup on manually.

**Side effects:**
- URL-rule custom audiences degrade.
- Automatic advanced matching may be unavailable; set it up manually instead.
- Pixel-based catalogue updates stop.
- Events Manager hides paths and custom parameters, including in Test Events.

### 5.2 Dates and industries

- **Timing:** Meta emailed affected advertisers in November 2024, with restrictions applying from **January 2025** (SECONDARY: https://oursprivacy.com/blog/meta-changes-to-data-policy , https://foleyhoag.com/news-and-insights/blogs/security-privacy-and-the-law/2025/january/meta-s-new-advertising-rules-key-considerations-for-health-and-wellness-businesses/ ). Meta's own help pages carry no date.
- **Later automation:** reported from July 2025 (SECONDARY: https://www.accelerateddigitalmedia.com/insights/health-marketing-policy-updates-2025/ ).
- **Industries:** health and wellness (including healthcare providers, pharma, supplements tied to conditions, mental health, reproductive health and weight loss) is the main affected group (SECONDARY). Meta's prohibited-information list also covers **financial** data.
- **Separate from data restrictions:** the US **Financial products and services** special ad category has been required since **21 January 2025** (VERIFIED: https://www.facebook.com/business/help/567423788405762 ). It is an audience-targeting restriction, not a pixel data restriction.

### 5.3 Sensitive term categories (VERIFIED, "About prohibited information"; Meta says the list is not exhaustive)

Health:
- diseases, medical conditions and injuries
- sexual and reproductive health
- mental health and psychological states
- medical condition devices and trackers
- medical procedures, treatments and testing
- prescription medications, and OTC products and supplements for specific conditions
- body specifications, bodily activities and biological cycles
- physical locations that identify a health condition, or places of treatment and counselling

Financial:
- bank account or routing numbers
- card numbers
- income and tax information
- credit score or history
- loan approvals, denials or pre-qualifications
- loan amounts, limits and balances
- PIN, password or OTP
- debt status (including medical bills)

Identifiers:
- SSN or local equivalent
- passwords
- GPS coordinates
- access tokens
- public-service identifiers (for example Medicare or EBT)

**Where Meta looks:** "URL parameters, custom audiences, custom conversions, custom event names, and custom data". It explicitly calls out **UTM parameters** and "product IDs, content names, custom properties". The names of events, conversions and audiences "must not reflect, imply or be based on any prohibited information".

### 5.4 Meta's recommended fixes (VERIFIED, paraphrased)

- Check Events Manager **Diagnostics** for "potentially prohibited information" notices, and review blocked parameters.
- Review the pages, parameters and URLs summary in Events Manager.
- Remove the pixel from pages that collect sensitive data. Meta's example is patient portals and logged-in pages.
- Audit forms, product IDs, content names, custom properties and URL/UTM parameters for sensitive terms.
- Rename custom events, custom conversions and custom audiences so they do not imply sensitive information.
- Turn on core setup / data restrictions voluntarily.
- Hash customer information with SHA-256 using the designated parameter names.
- Under event restrictions, shift optimisation to upper-funnel events. Under full restrictions, use awareness, engagement or traffic objectives.
- **Conversions API parameter filtering:** SECONDARY. Vendors (for example CAPI gateways and server-side GTM) advertise stripping URL paths and query strings and custom data server-side. Meta's help pages retrieved here do not name a specific "CAPI parameter filter" feature, so treat it as UNVERIFIED as a Meta feature. It remains a sound practice.

### 5.5 What the extension can detect locally

- **`facebook.com/tr` requests:**
  - `dl` (document location) or `rl` (referrer) values containing paths or query strings with sensitive terms (dictionary built from §5.3).
  - Custom event names (`ev=`) or custom data (`cd[...]`) containing sensitive terms.
  - UTM values containing sensitive terms.
- The `dl`, `rl`, `ev` and `cd[...]` parameter names are SECONDARY / commonly observed; they were not re-verified in this pass.
- **Present results as "may trigger Meta data restrictions"**, never as "your account is restricted". The browser cannot see the Events Manager category.
