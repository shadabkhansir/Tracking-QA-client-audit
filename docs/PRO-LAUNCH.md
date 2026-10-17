# Pro launch checklist (Dodo Payments)

_Written 2026-10-15. Decisions are final unless you change them: $19/month or $190/year (launch offer $15/$150 for the
first 100 customers), 7-day free trial, "Changes since last audit" is Pro. The brand keeps "The Growth Folks®" (owner's decision)._

## Status (2026-10-17)

Dodo approved the account on 2026-10-17. v1.2.0 is the paid build, wired to **Dodo test mode**:
- Test products exist (Pixel & Tag Checker Pro Monthly/Yearly, TGF All-Access Monthly/Yearly, 7-day trial, licence keys with 5 activations, 10 for All-Access). Their IDs are in `src/license-config.js` → `MODES.test`.
- Test keys for trying it: `TGF-TEST-TAG-PRO-0001` (this extension) and `TGF-TEST-ALL-ACCESS-0001` (bundle). `npm run test:license` exercises both.
- Left for you: create the same products in **live** mode (Dodo can copy them), send the live business ID and product IDs, then `MODE = 'live'`. The full resubmission steps for both extensions are in the shared guide linked from the PR.

## 0. Ending the free launch (read first)

Version 1.1 ships with `allFree: true` in `src/license-config.js`: every feature is free for everyone and no upgrade prompts or Pro badges show. Going paid means:

1. Set `allFree: false` **and** `enabled: true` (with the IDs below) in the same release. Bump the version.
2. Update the store listing (add the Pro section, declare in-app purchases), `PRIVACY.md` (licence validation) and the website pricing page **in the same release**.
3. **Be fair to launch users.** Taking features away is the main source of one-star reviews for free-to-paid extensions. Give 2–4 weeks' notice on the website and in the release notes. Consider leaving existing installs Pro for a period, or giving them a launch discount code. From v1.1 the extension stores `installedAt` and `installedVersion` locally (never sent), so a rule like "installed during the free launch → Pro until <date>" can be added in `src/plan.js` when going paid.
4. Saved audits beyond the Free limit aren't deleted when the plan drops. Only new saves trim to 5, so nobody loses history on the day of the switch.

## 1. Dodo dashboard (you, after approval)

Work in **test mode** first, then repeat in live mode (Dodo can copy products from test to live).

- **Settings → Business → Brands → primary brand → Edit**
  - Brand Name: `The Growth Folks`
  - Logo
  - Support email: `team@thegrowthfolks.com`
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
    - *Pixel & Tag Checker Pro (Monthly)*: $19/month
    - *Pixel & Tag Checker Pro (Yearly)*: $190/year
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
- **When the limit is hit,** the extension tells the buyer to email `team@thegrowthfolks.com`. You then reset the key from Dodo's dashboard: **Sales → License Keys**.

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
