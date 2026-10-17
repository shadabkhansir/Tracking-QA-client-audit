# Pixel & Tag Checker by The Growth Folks® (Chrome extension)

## Brand and design: always
Follow the TGF design system: the `tgf-design-system` skill (`.claude/skills/tgf-design-system/`), i.e. `brand/GUIDELINES.md` with values from `brand/tokens.css`.
Use only those token values in the side panel, options page and reports (dense UI sizes, see GUIDELINES §6 and §11). Bundle Inter 400/600/800 locally; no remote fonts.
Client reports: Free plan uses TGF green with the "Made with The Growth Folks®" credit; Pro white-label swaps in the agency's logo and one brand colour only.
The source of truth is `brand/` in the `shadabkhansir/web` repo. Don't edit `brand/` here; copy updates from there.
`brand/` and `.claude/` are not part of the store package (`npm run zip` only includes manifest.json, src, sidepanel, report, options, icons).

## Writing: always
For all user-facing text (the side panel, options page, client reports, Chrome Web Store listing, HANDOFF.md and PRIVACY.md), follow the `human-writing` skill (`.claude/skills/human-writing/`): specific, sourced and first-hand where true, with none of the AI tells it lists (AI vocabulary, significance padding, "not just X but Y", bold-led lists, filler, em dashes, repeated templates).
Check the paste-ready store copy with `node scripts/check-writing.mjs store/STORE_LISTING.md --include-code` and other text with `node scripts/check-writing.mjs HANDOFF.md PRIVACY.md`; fix every real tell (bold field labels in internal notes are fine). No detector-evasion tricks and no invented experience.
Chrome Web Store and other listings: never list brand or competitor names (keyword-spam rule).
The skill and `scripts/check-writing.mjs` are copied from `shadabkhansir/web`, the source of truth for brand and writing rules; don't edit them here, copy updates from there.

## Working
When a task is done and its checks pass, push the branch and open a PR. Merge only when the user says so.

## Words
"The Growth Folks®" with ® in visible text; no personal names; contact team@thegrowthfolks.com; British spelling.
