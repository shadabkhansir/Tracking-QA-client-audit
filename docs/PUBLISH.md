# Publish handover: Pixel & Tag Checker v1.1.0 (free launch)

_For the Claude Code session (and the owner) that checks and publishes the extension. Written 2026-10-16._

## 0. Decision

**Publish v1.1.0 completely free.** Every feature is unlocked for everyone:
- consent timeline, ChatGPT Ads and Meta checks
- white-label client reports
- 50-page scans, 500 saved audits
- scheduled monitoring

There are no limits, upgrade prompts, Pro badges, account, payments or licence calls. Paid plans may come later (`docs/PRO-LAUNCH.md` §0).

The switch lives in `src/license-config.js`:

```js
allFree: true,   // must be true for this release
enabled: false,  // licensing off: the extension makes no network calls of its own
```

## 1. Where everything is

| What | Where |
|---|---|
| Repo / branch | `shadabkhansir/Tracking-QA-client-audit`, branch `claude/charming-edison-ts8soj`, PR [#3](https://github.com/shadabkhansir/Tracking-QA-client-audit/pull/3) → merge to `main` first |
| Store listing copy, privacy-tab answers, permission justifications, reviewer notes | `store/STORE_LISTING.md` |
| Screenshots (1280×800), promo tiles | `store/screenshots/screenshot-1…5` (store), `-6` (website only); `store/promo-small-440x280.png`; `store/marquee-1400x560.png` |
| Privacy policy (publish verbatim on the website) | `PRIVACY.md` |
| Permissions and why | `docs/PERMISSIONS.md` |
| Website / landing-page facts (copy, FAQs, features, quickStart) | `HANDOFF.md` |
| Research behind the claims | `docs/RESEARCH.md`, `docs/research/` |
| Brand rules | `CLAUDE.md`, `.claude/skills/tgf-design-system/`, `brand/` |

## 2. Pre-flight checks (run all; every one must pass)

```bash
git checkout main && git pull                 # after PR #3 is merged
npm test                                      # 85 unit tests
npm run test:e2e                              # Playwright + unpacked extension (Chromium at /opt/pw-browsers/chromium or CHROMIUM_PATH)
npm run zip && unzip -l dist.zip | tail -1    # about 44 files; upload this file
node -e "const c=require('fs').readFileSync('src/license-config.js','utf8');if(!/allFree: true/.test(c)||!/enabled: false/.test(c))throw new Error('launch flags wrong')"
node -p "require('./manifest.json').version"  # 1.1.0, higher than any version already in the store
grep -rn "hello@" src sidepanel report options PRIVACY.md store/STORE_LISTING.md   # expect nothing
```

**Manual checks in Chrome** (`chrome://extensions` → Developer mode → Load unpacked):
1. **Badge and Monitor tab:** the panel badge says **FREE**. The Monitor tab is usable, with no "Pro" labels or "coming soon" anywhere.
2. **Audit:** on a real store page, "Reload & capture" then "Run audit" gives a score, platforms and findings.
3. **Banner test:** "Consent test: Reject all" on a site with a cookie banner shows the consent timeline card.
4. **Settings:** branding is editable, and the report shows your logo and colour.
5. **Dark mode and fonts:** dark mode follows the OS. Inter loads with no network requests (DevTools → Network on the panel).
6. **Fresh profile:** installing in a fresh profile opens `https://thegrowthfolks.com/tools/tag-checker/welcome/`.

## 3. Website must be live before you submit

The extension links to these pages, and store reviewers open the privacy URL:
- `https://thegrowthfolks.com/tools/tag-checker/`: landing page; content from `HANDOFF.md`, with the price shown as "Free".
- `.../tag-checker/privacy/`: **`PRIVACY.md` verbatim**, last updated 2026-10-16. Also add the Chrome Web Store Limited Use statement (wording in `store/STORE_LISTING.md` → Privacy practices).
- `.../tag-checker/welcome/`: quickStart from `HANDOFF.md`.
- `.../tag-checker/pricing/`: one line, "Free during launch". No prices, no buy button.
- Redirect `/tools/tracking-qa/*` → `/tools/tag-checker/*`.
- `/learn/` exists.

## 4. Chrome Web Store submission (owner, in the Developer Dashboard)

1. **Developer account.** Use the account the owner wants to own the item long term (ideally a team@ Google account, not a personal one).
   - Pay the one-time registration fee.
   - Turn on 2-step verification.
   - Verify the contact email.
2. **Trader declaration (EU Digital Services Act).** The dashboard asks whether you're a trader. Selling, or planning to sell, means **trader**. Traders must show a contact address, phone and email publicly. Decide which address to publish before submitting.
3. **New item:** upload `dist.zip`.
4. **Store listing tab:** paste from `store/STORE_LISTING.md`.
   - Name, summary, detailed description (free-launch text), category Developer Tools, language English.
   - Icon `icons/icon128.png`.
   - Screenshots 1–5 from `store/screenshots/`, small promo tile, marquee (optional).
   - Homepage, support and privacy URLs, with trailing slashes.
5. **Privacy practices tab:** single purpose, a justification for every permission, remote code "No", and the data-usage boxes. All of it is copy-paste from `store/STORE_LISTING.md`.
6. **Distribution:** free; all regions; **in-app purchases: No**; visibility **Public**. Use **Unlisted** first if you want a private test with a few users.
7. **Reviewer notes:** paste the "Reviewer notes / test instructions" block.
8. **Submit.** `<all_urls>` plus `webRequest` triggers in-depth review, so expect a few days to a few weeks. If it's rejected, the email names the policy; fix it, bump the patch version (1.1.1), re-zip and resubmit.

## 5. Things a reviewer or lawyer could object to (check before submitting)

- **"The Growth Folks®".** In India and the UAE, ® may only be used on a **registered** trade mark. Keep it only if registration is complete; otherwise switch to ™ (`src/brand.js`, manifest name, `node store/make-graphics.mjs`).
- **Competitor names.** These appear in the description only ("free alternative to Meta Pixel Helper and Google Tag Assistant"), never in the title, followed by the "Not affiliated with…" line. Remove that sentence if a reviewer objects.
- **Platform names.** The description names five platforms, then "and 11 more" (store keyword policy).
- **Unverified dates.** Some research dates are labelled SECONDARY/UNVERIFIED (India DPDP, the US GPC state list, Meta's restriction start). The extension's findings word them cautiously and say "not legal advice". Don't turn them into hard claims in marketing.

## 6. After approval

1. Put the Chrome Web Store URL in `HANDOFF.md` and on the landing page. Replace "Coming soon" with "Add to Chrome".
2. Tag the release: `git tag v1.1.0 && git push origin v1.1.0`.
3. **First weeks:**
   - Answer store reviews within 48 hours.
   - Log real-site false positives as issues, with the URL, the finding id and a HAR export from the Requests tab.
   - Fix them in small patch releases.
4. Re-check the ChatGPT Ads facts monthly against https://developers.openai.com/ads/llms-full.txt. OpenAI's API is changing fast.

## 7. Later: going paid

Follow `docs/PRO-LAUNCH.md`. §0 covers ending the free launch fairly (notice, grandfathering via the locally stored `installedAt`); §1–5 cover Dodo setup, config, the privacy and listing changes, and testing.
