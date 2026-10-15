# Selling Pro: payments and licence keys (India, individual seller, many extensions)

_Written 2026-10-15. Not legal or tax advice. Confirm the tax points with an Indian chartered accountant (CA)._

## 1. Which payment provider

| Provider | Works for you? | Why |
|---|---|---|
| **Lemon Squeezy** | **No (for new sellers from India)** | Signup now pushes you to a Stripe login. Stripe has accepted new Indian accounts only by invitation since May 2024, and Lemon Squeezy's 2026 plan is to move merchants to Stripe Managed Payments, which does not accept India-based sellers. Even an approved account would have nowhere to migrate to. |
| **Dodo Payments** | **Recommended** | A Merchant of Record built for Indian indie and solo founders: it is the legal seller, handles VAT/GST/sales tax abroad and chargebacks, and pays out to India. It has **public licence-key endpoints** (activate / validate / deactivate) that the extension calls directly, with no server needed. |
| Paddle | Backup | Mature Merchant of Record with an India page (no foreign entity needed, UPI Autopay). Its licence keys need your own small server, and onboarding is stricter. Confirm it accepts individuals. |

**Decision: use Dodo Payments.** The extension code supports both Dodo and Lemon Squeezy (`src/license.js`), and switching is one line in `src/license-config.js`, so you aren't locked in.

## 2. Selling as an individual in India (no company yet)

You can start as an **individual / sole proprietor**. You don't need a company to sell software through a Merchant of Record. Practical points:

- **Onboarding (KYC):** expect PAN, Aadhaar or other ID, and an Indian bank account in your name. Use your legal name; your store/brand name can be "The Growth Folks".
- **Who the buyer pays:** Dodo is the seller of record and invoices the customer. You get one payout from Dodo, which your CA will likely treat as an **export of services**.
- **GST (ask your CA):** for services, GST registration is generally required only once aggregate turnover crosses ₹20 lakh a year (₹10 lakh in special-category states). After you register, file a **LUT** so exports are zero-rated without paying IGST.
- **Income tax (ask your CA):** declare it as business income in your ITR. Ask whether presumptive taxation applies to you.
- **Bank paperwork:** keep the **FIRA/FIRC** (foreign inward remittance certificate) for every payout; your bank or Dodo provides it.
- **Legal pages must name a real person.** Until you incorporate, terms of service, refund policy and privacy policy should say: *"Operated by <Your Full Name>, trading as The Growth Folks, <city>, India."*
- **When to incorporate (LLP or Pvt Ltd):** when revenue, liability or investors justify it. Moving the Dodo account to a company later is a support request; your product IDs live only in `license-config.js`, so the extension side stays easy.

### The ™ symbol (switched from ® on 2026-10-15)

The extension, listing and docs now say **"The Growth Folks™"**. Using ® for a mark that isn't **registered** is an offence in India (falsely representing a trade mark as registered), and the UAE takes the same view. ™ needs no registration.
- Apply for registration (likely classes 9 and 42 for software/SaaS). Individuals and startups pay a reduced fee per class.
- Switch back to ® only after the registration certificate is issued. To switch back, change `src/brand.js` and the manifest name, re-run `node store/make-graphics.mjs`, and update the listing.

## 3. Catalogue design for many extensions and plans

One Dodo business, one product per plan and billing period, with licence keys turned on for each product.

| Product (Dodo) | Price | Licence key activations | Unlocks |
|---|---|---|---|
| Tracking QA Pro (Monthly) | $19/mo | 5 | Tracking QA → Pro |
| Tracking QA Pro (Yearly) | $190/yr | 5 | Tracking QA → Pro |
| _Next extension_ Pro (Monthly / Yearly) | your price | 5 | That extension → Pro |
| **TGF All-Access** (Monthly / Yearly) | e.g. $39/mo, $390/yr | 10 | Every TGF extension → Pro |
| _Later:_ Tracking QA Agency | $59–79/mo | 5 | Tracking QA → Agency (needs the backend) |

How the extension decides:
1. On **Activate**, it sends the key to Dodo's public endpoint. Dodo replies with the **business ID** and **product ID** the key belongs to.
2. The extension accepts the key only if the business is **yours** (`storeId`) and the product is listed for **this** extension in `products` or `bundleProducts`. This check matters: licence endpoints are public, so without it any Dodo seller's key would unlock Pro.
3. Every 3 days it re-validates the key. It stays Pro for 7 days if offline, and downgrades immediately if Dodo says the key is no longer valid (cancelled, refunded, expired).
4. Each browser uses one activation. "Deactivate on this browser" frees it, which handles moving to a new laptop. Uninstalling doesn't free it, which is why the limit is 5. When the limit is hit, the extension shows the support email, and you reset the key in Dodo (see `PRO-LAUNCH.md` section 3).

Per extension, only `src/license-config.js` changes:

```js
export const LICENSE_CONFIG = {
  enabled: true,
  provider: 'dodo',
  mode: 'live',                       // 'test' while you try it with Dodo test mode
  extension: 'tracking-qa',
  storeId: 'bus_XXXXXXXX',            // Dodo dashboard → Business settings
  products: { 'pdt_MONTHLY': 'pro', 'pdt_YEARLY': 'pro' },
  bundleProducts: { 'pdt_ALLACCESS_M': 'pro', 'pdt_ALLACCESS_Y': 'pro' },
  checkoutUrl: 'https://thegrowthfolks.com/tools/tracking-qa/pricing',
  manageUrl: 'https://thegrowthfolks.com/account',   // or Dodo's customer portal link
  revalidateDays: 3,
  graceDays: 7,
};
```

Copy `src/license.js` unchanged into every new extension. Only the config differs. When you have several extensions, consider moving it into a small shared package.

### Later: a tiny backend (for Agency, team seats or cloud monitoring)

Client-side keys are fine for Pro. When you build Agency features (cloud monitoring, share links, team seats), add a small server, e.g. a Cloudflare Worker. It would:
- receive Dodo webhooks;
- keep your own customer/entitlement table;
- issue signed entitlements to the extensions.

That also makes a future provider switch painless, because you own the customer list.

## 4. Step-by-step

**You (accounts and pages)**
1. Sign up at Dodo Payments as an individual; complete KYC and add your bank account.
2. Work in **test mode** first. Create the products from the table above, with licence keys enabled and activation limits set.
3. Publish on thegrowthfolks.com:
   - pricing page with Dodo checkout links
   - terms of service
   - refund policy (e.g. 14 days)
   - updated privacy policy (step 6)
   - "how to activate" page
4. ~~Fix the ® / ™ question~~ Done: ™ is used until registration.

**Me (code), once you send the IDs**
5. Put your business ID and product IDs into `src/license-config.js`. Test the full purchase → key → activate → validate → deactivate flow in Dodo test mode. Then switch `mode: 'live'` and `enabled: true`. The activation screen in Settings, upgrade links and plan gating are already built and tested.
6. Update the privacy policy and store listing. Activating Pro sends the licence key and an instance ID to Dodo Payments; nothing else is sent. Tick the relevant data-usage box and mention Pro in the description.

**Launch**
7. Publish **Free** first (current build, licensing off). Collect reviews.
8. Release an update with licensing on, using the launch price for the first customers.

## Sources

- Lemon Squeezy supported countries (India: Stripe invite-only, PayPal payouts): https://docs.lemonsqueezy.com/help/getting-started/supported-countries
- Lemon Squeezy 2026 update (moving merchants to Stripe Managed Payments): https://www.lemonsqueezy.com/blog/2026-update
- Stripe Managed Payments supported business locations (India not listed): https://docs.stripe.com/payments/managed-payments
- Dodo Payments licence keys (public activate/validate/deactivate): https://docs.dodopayments.com/features/license-keys
- Dodo activate response (business_id, product): https://docs.dodopayments.com/api-reference/licenses/activate-license
- Paddle for India: https://www.paddle.com/billing/india
