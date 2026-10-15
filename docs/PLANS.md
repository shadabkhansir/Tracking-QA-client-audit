# Free vs Pro plan and paid-launch guide

_Written 2026-10-15 for v0.4.x. Limits live in `src/plan.js`; this document is the source of truth for what each plan includes._

## Principles

1. **Free must be the best free tracking debugger on the store.** Reviews and installs come from Free. Never cripple detection, checks or the inspector: those are what beat Omnibug, Tag Assistant and the Pixel Helpers.
2. **Charge for what agencies get paid for:** putting their own name on the report, auditing whole sites, proving progress over time, and catching breakages without manual re-checks.
3. **No payment until it works end to end.** Until then the UI says "Pro, coming soon" and the store listing doesn't advertise Pro features (Web Store policy: no misleading claims).

## Plans

| | **Free** | **Pro** (v1, no backend) | **Agency** (v2, needs a backend) |
|---|---|---|---|
| Price | $0 | **$19/month or $190/year** (launch offer $15/$150) | $59–79/month |
| Platforms (15 built in + custom providers) | ✓ | ✓ | ✓ |
| One-click audit, 0–100 score, 50+ checks with fixes | ✓ | ✓ | ✓ |
| Request inspector, delivery status, dataLayer timeline | ✓ | ✓ | ✓ |
| CSV / JSON / HAR export, copy summary | ✓ | ✓ | ✓ |
| Consent tests: accept, reject, GPC (current page) | ✓ | ✓ | ✓ |
| Funnel / session audit, cookie table, ID labels | ✓ | ✓ | ✓ |
| Client report (PDF) | ✓ with Tracking QA credit + default branding | **White-label**: logo, colour, contact, CTA button, credit optional | ✓ |
| Multi-page scan | 3 pages | **50 pages**, consent test on every page | 500 pages, sitemap import |
| Saved audits (history) | Last 5 | **500** | Unlimited, cloud-synced |
| "Changes since last audit" in reports | Teaser only | **✓** | ✓ |
| Scheduled monitoring + desktop alerts | ✗ | **✓ up to 20 sites** (runs while Chrome is open) | **Cloud monitoring** (no browser needed), email/Slack alerts |
| Shareable report link, scheduled PDF email to clients | ✗ | ✗ | ✓ |
| Team seats, shared branding and history | ✗ | ✗ | ✓ (5 seats) |
| Support | Docs + email | Priority email | Priority + onboarding call |

### Why this split

- **White-label** is the clearest willingness-to-pay signal for agencies: a report with your logo and CTA is a sales asset. Free reports still look professional, so they spread the brand through every report a freelancer sends.
- **50-page scans and monitoring** are what an agency does every month per client. 3 free pages is enough to try it, not enough to run a retainer on it.
- **"Changes since last audit"** turns the report into proof of the agency's work ("resolved 6 issues since March"). That's what justifies a retainer, so it's Pro.
- **Agency** depends on a server (cloud monitoring, share links, team sync). Don't promise it until it's built. It's also where client-side gating stops being bypassable, because the value lives on the server.

## Honest limitations to design around

- **Pro v1 gating is client-side.** A technical user can flip `plan` in storage. That's acceptable for a $19 tool. Don't spend time on obfuscation; put future high-value features (cloud monitoring, share links) on the server.
- **Pro monitoring only runs while Chrome is open** (it uses `chrome.alarms` and background tabs). Say so in the UI and pricing page. Cloud monitoring is the Agency upgrade path.
- **Every paid flow adds a network request** to the payment provider. Today's privacy policy and store listing say the extension makes no network requests. Both must be updated before payments go live (see step 5).

## Choosing a payment provider

> **Update 2026-10-15: decided Dodo Payments.** Lemon Squeezy needs a Stripe account, which isn't available to new Indian sellers. See [`LICENSING.md`](LICENSING.md) for the India/individual setup, the multi-extension catalogue and the licence code that is already built.


The Chrome Web Store's own payments were shut down years ago, so you need a third party. Verify current fees and terms on each provider's site before signing up; they change.

| | ExtensionPay | Lemon Squeezy | Paddle |
|---|---|---|---|
| What it is | Payments built for browser extensions (Stripe underneath) | Merchant of Record with a License API | Merchant of Record |
| Who handles VAT/GST/sales tax | **You** (it's your Stripe account) | Lemon Squeezy | Paddle |
| Integration effort | Lowest: bundled `ExtPay.js`, `getUser().paid`, built-in trials | Low: checkout link + license key, validated with `/v1/licenses/validate` | Medium: checkout + webhooks; usually needs your own small backend for licences |
| Fees (third-party reports, verify) | ~5% + Stripe fees | ~5% + per-transaction fee | ~5% + $0.50 |
| Onboarding | Fast | Fast | Strict (needs live pricing, terms and refund pages) |
| Best when | You can handle tax yourself or sell mostly domestically | **You sell worldwide from one company and don't want to file VAT/GST in many countries** | You want Paddle's maturity and will build a backend for Agency anyway |

**Original recommendation (superseded by Dodo, see above): Lemon Squeezy license keys for Pro v1.** It's a Merchant of Record, so global tax is handled for you, and it needs no backend: the extension validates the key directly against the License API. If Lemon Squeezy isn't available to your company or region, use Paddle (plus a tiny licence endpoint, e.g. a Cloudflare Worker). Use ExtensionPay only if you're comfortable owning tax compliance.

## Launch steps (what you do, what we build)

**1. Business setup (you)**
- Create the provider account and complete verification (KYC, payout bank).
- Create products: *Tracking QA Pro (monthly)* and *(yearly)*, with license keys enabled and activation limit 3 (laptop + desktop + spare).
- Optional 7-day free trial; set renewal reminder emails.

**2. Website pages on thegrowthfolks.com (you)**
- `/tools/tracking-qa/pricing`: the plan table above. State that Pro monitoring runs while Chrome is open.
- Terms of service and a refund policy (e.g. 14 days, no questions asked). Paddle requires these; everyone else should have them too.
- A post-checkout page: "Copy your license key → open Tracking QA → Settings → Activate".

**3. Extension code (we build; tell us the provider)**
- `src/license.js`: `activate(key)`, `validate()`, `deactivate()` against the provider API. Cache `{plan, key, instanceId, validatedAt}` in `chrome.storage.local`.
- Re-validate on browser start and every 3 days (alarm), with a **7-day offline grace period**. Downgrade only on an explicit "expired/disabled" answer.
- Options → Plan: license key field, Activate/Deactivate, "Manage subscription" link, plan status and renewal date.
- Upgrade prompts at the exact moment a limit is hit: the 4th scan URL, the report watermark, the Monitor tab, the history limit, "Changes since" teaser. Each links to the pricing page with UTM `utm_content=<where>`.
- Remove the developer Pro toggle from production builds (keep it for unpacked installs only, as now).

**4. Gating (already in code, adjust in `src/plan.js`)**
- `free: { scanPages: 3, historyItems: 5, customBranding: false, monitors: 0, changesSince: false }`
- `pro: { scanPages: 50, historyItems: 500, customBranding: true, monitors: 20, changesSince: true }`
- Storage: 500 audits can approach Chrome's 10 MB `storage.local` quota. Add the `unlimitedStorage` permission before Pro launches, or trim audit size.

**5. Policy and listing updates (both, before turning payments on)**
- `PRIVACY.md`: add "Licence validation: when you activate Pro, the extension sends your license key (and an instance ID) to <provider> to check your subscription. Payment details are handled by <provider> under its privacy policy."
- Store listing → Privacy tab: re-answer data usage (the license key goes to the provider; there's still no browsing data). List the provider domain in the reviewer notes.
- Store listing description: add a "Pro" section, and in the dashboard declare that the item has in-app purchases.
- `host_permissions` already includes `<all_urls>`, so the provider API is reachable. Mention it in the reviewer notes anyway.

**6. Launch sequence (recommended)**
1. Publish **Free** first (current build). Collect 20–50 reviews; fix whatever real sites surface.
2. Turn on **Pro** with the launch price for the first 100 customers. Email everyone who left a review.
3. Watch: free→Pro conversion (target 2–4% of weekly actives), refund rate, churn after month 1. If churn is high, push yearly (two months free) and the monitoring feature.
4. Build **Agency** only after ~50 paying Pro users ask for cloud monitoring or share links.

## Decisions (2026-10-15)

1. Provider: **Dodo Payments**, because Lemon Squeezy needs Stripe. See `LICENSING.md`.
2. Price: **$19/month or $190/year**, with a launch offer of $15/$150 for the first 100 customers (a discount code).
3. Trial: **7 days**, with Dodo's "Prevent Trial Misuse" switched on.
4. "Changes since last audit": **Pro**. Free reports show a one-line preview (score change and resolved/new counts) with an upgrade link. The preview is left out of the PDF.

Steps to go live are in [`PRO-LAUNCH.md`](PRO-LAUNCH.md).
