# Decisions: what we left out and why

_Checkpoint before building, 2026-10-16. Re-read docs/RESEARCH.md and docs/SPEC.md._

## Left out of this release

| Item | Why not now | Revisit when |
|---|---|---|
| **"Did the platform receive it?" end-to-end confirmation** (top implicit request, about 32 signals) | Needs logged-in access to Events Manager, GA4 DebugView or OpenAI. That means OAuth plus account APIs, and it breaks "no account, local-only". We already show per-hit delivery status (HTTP status, blocked or failed), the closest a browser can get, and every finding links to the platform's own test tool. | Agency tier with a backend |
| **IAB TCF v2.2 / GPP string decoding** | Useful for ad-tech audits, but our buyer mostly uses Google Consent Mode. Only 2 competitors do it. It needs a careful decoder plus a vendor list. | After launch, if requested |
| **Clarity `consentv2` state decoding** | No verified wire parameter (PLATFORM-SPECS §4). The timeline already labels Clarity before consent as "cookieless mode" instead of a violation. | When Microsoft documents a signal |
| **India checkout checks (Shiprocket, GoKwik, Razorpay)** | Evidence is mostly vendor blogs (REVIEWS §8). The checkouts run on third-party domains our tab audit only partly sees, so they need fixtures from real stores. | With real store captures |
| **Initiator chain ("which tag loaded which")** | Needs the `debugger` API or DevTools protocol. That's a heavy permission and hurts store review (RISKS B4). | DevTools panel version |
| **"Copy findings for AI"** | Easy, but off-purpose for single-purpose review. The existing "Copy summary" covers it. | Later |
| **Uninstall URL** | The brief asks to update the welcome and uninstall URLs. The extension never set an uninstall URL, and adding one needs a page on the site first. The welcome URL now points to `/tools/tag-checker/welcome/`. | When the website has an uninstall page |
| **Banner-shown timestamp** | Chrome gives no reliable "banner painted" event. The timeline uses page load (t0), CMP detection and the choice time; the banner step is labelled with the CMP name, not a millisecond figure. | n/a |
| **OpenAI Conversions API forwarding check** | Server-to-server, so invisible to the browser (PLATFORM-SPECS §1.6). We check capture (URL → hits / `__oppref` cookie) and state the server requirement in the fix. | n/a |
| **Competitor names in the store title** | Chrome Web Store impersonation and keyword policies (RISKS B5, B6). "Free alternative to Meta Pixel Helper and Google Tag Assistant" appears once in the description, with a "not affiliated" disclaimer. | n/a |
| **Price changes** | Research (COMPETITORS §4) supports $19/mo Pro and suggests a $49–69 Agency tier later. The lifetime-deal anchor (ConsentScope $39.99) is noted, but no change until Pro launches. | Pro launch |

## Choices made

- **Platform label:** "ChatGPT Ads (OpenAI)". That's what users search for ("chatgpt ads pixel"), and it stays accurate.
- **Meta check wording:** "may trigger Meta data restrictions", severity warning, never critical. The browser can't see Meta's category, so false certainty would mislead (RISKS C).
- **UET without `asc`:** a warning only when a CMP is present. Without a CMP, the existing "no consent" findings apply. Region is unknown in the browser, so we don't assume the EEA.
- **Google cookieless pings with denied consent pass.** Advanced Consent Mode is legitimate (REVIEWS confusion C2).
- **Legal references in findings** (GDPR/PECR, US GPC states, India DPDP with dates) are context, always marked "not legal advice". Dates labelled SECONDARY in research are worded as "from" or "phased", not as legal certainty.
- **No new permissions.** OpenAI hosts are covered by the existing `<all_urls>` plus `webRequest`; cookie names come from the existing `cookies` permission (names only, never values).
