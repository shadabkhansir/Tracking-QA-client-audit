# Pro launch checklist (Dodo Payments)

_Written 2026-10-15. Decisions are final unless you change them: $19/month or $190/year (launch offer $15/$150 for the
first 100 customers), 7-day free trial, "Changes since last audit" is Pro, brand shown as The Growth Folks™ until the
trade mark is registered._

## 1. Dodo dashboard (you, after approval)

Work in **test mode** first, then repeat in live mode (Dodo can copy products from test to live).

- **Settings → Business → Brands → primary brand → Edit**
  - Brand Name: `The Growth Folks` (no ®)
  - Logo
  - Support email: `hello@thegrowthfolks.com`
  - Statement descriptor: e.g. `GROWTHFOLKS`, so the card line reads `DODOPAY_GROWTHFOLKS`
- **Settings → Design → Business Name**: `The Growth Folks`.
- **Settings → Subscriptions → Prevent Trial Misuse**: on, so one email gets one trial.
- **Products**: create two subscription products, tax category *SaaS*.
  - Each one needs:
    - Trial Period Days: `7`
    - Subscription period: 10 years, so it renews instead of ending after one charge
    - Licence key entitlement on
    - Activation limit **5**: one browser uses one activation, and reinstalls use a new one (see section 3)
  - The two products:
    - *Tracking QA Pro (Monthly)*: $19/month
    - *Tracking QA Pro (Yearly)*: $190/year
  - Optional: *TGF All-Access* (Monthly and Yearly), activation limit 10.
- **Discount code** for the launch offer: about 21% off, limited to 100 uses.
- Create a **payment link** for each product.

Send me:
- business ID `bus_…`
- product IDs `pdt_…`
- the payment links
- the customer portal link

## 2. Extension config (me, about an hour)

Fill in `src/license-config.js`:

```js
enabled: true, mode: 'test', storeId: 'bus_…',
products: { 'pdt_MONTHLY': 'pro', 'pdt_YEARLY': 'pro' },
bundleProducts: { /* all-access ids, if created */ },
checkoutUrls: { monthly: '<payment link>', yearly: '<payment link>' },
manageUrl: '<Dodo customer portal link>',
```

Test in test mode with a test card: buy, receive the key, activate, see Pro, revalidate, deactivate, and hit the activation limit. Then switch to `mode: 'live'`, bump the version, and publish.

## 3. Reinstalls and lost keys (no login by design)

- **The licence key is the account.** It's in the purchase email and in Dodo's Customer Portal, where customers sign in by email.
- **Reinstalling:** paste the key again in Settings to bring Pro back.
- **Uninstalling doesn't free the activation**, because Chrome gives the extension no chance to run code on uninstall. That's why the limit is 5, not 3.
- **When the limit is hit,** the extension tells the buyer to email `hello@thegrowthfolks.com`. You then reset the key from Dodo's dashboard: **Sales → License Keys**.

## 4. Privacy policy addition (publish on thegrowthfolks.com and in PRIVACY.md when Pro goes live)

> **Pro licence validation.** If you activate Pro, the extension sends your licence key and an activation ID to
> Dodo Payments (`live.dodopayments.com`) when you activate it, about every 3 days to confirm the subscription is still
> active, and when you deactivate it. Nothing else is sent: no browsing data, audit results or page content. Purchases,
> payment details and your email address are handled by Dodo Payments, our reseller and Merchant of Record, under
> [its privacy policy](https://dodopayments.com/privacy-policy). We don't store your email in the extension.

## 5. Store listing changes (same update)

- **Description:** add this after the Free paragraph:
  > **Pro** ($19/month or $190/year, 7-day free trial): white-label client reports (your logo, colours and call-to-action, no credit line), "changes since last audit" in reports, scans of up to 50 pages, scheduled monitoring of up to 20 sites with desktop alerts (runs while Chrome is open), and 500 saved audits. Buy on thegrowthfolks.com and paste your licence key in Settings; no account needed.
- **Dashboard → Distribution:** declare that the item contains **in-app purchases**.
- **Privacy tab:** keep the existing boxes. The licence key isn't user data in the store's categories, but mention it in the reviewer notes.
- **Reviewer notes:** append:
  > Pro is unlocked with a licence key sold through Dodo Payments. The extension calls Dodo's public licence endpoints (`live.dodopayments.com/licenses/activate|validate|deactivate`) with only the key and an activation ID. Test key for review: `<create a 100% discount key in Dodo and paste it here>`.
- Remove the "Pro is planned" sentence and the "Note before publishing" block.
