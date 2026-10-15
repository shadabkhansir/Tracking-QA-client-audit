---
name: tgf-design-system
description: The Growth Folks® (TGF) brand and design system. Use whenever building, restyling or reviewing anything for The Growth Folks or its sub-brands, including thegrowthfolks.com pages, agency.thegrowthfolks.com, landing pages, Chrome extensions (side panels, popups, options pages), web apps and dashboards, client reports (HTML/PDF), emails, Chrome Web Store screenshots and share/OG images. Also use when someone asks for "our brand", "TGF style", "the brand colours", or to make a UI "match the website". Covers colours, Inter typography, spacing, radii, buttons, cards, forms, status colours, dark mode, accessibility, naming rules (The Growth Folks®) and per-surface layouts.
---

# The Growth Folks® design system

Apply these rules to every TGF product so the website, extensions, reports and sub-brands look like one family. Full guidelines: `references/GUIDELINES.md`. Token values: `references/tokens.css` (CSS) and `references/tokens.json`. Copy `tokens.css` into the project unchanged and build on its variables; never invent new hex values, fonts or radii.

## Workflow

1. Read `references/tokens.css`. In the target project, import it (or paste it as the first stylesheet) and use only its variables. If a value is missing, add it to the brand file first and say so.
2. Read the section of `references/GUIDELINES.md` for the surface you are building (§11 website/landing, extensions, reports, emails, OG images; §12 sub-brands).
3. Build. Then run the release checklist (§14) and fix anything that fails. Check light and dark mode and 375px width.
4. If the user asks for something that breaks a rule (new primary colour, Apple-style blue, several filled buttons), point out the rule and propose the on-brand alternative before doing it.

## The rules that matter most

- **Minimal, but the important thing is obvious.** Calm, spacious layouts; exactly one thing per screen that people notice first. Minimal = fewer things competing, not fewer features. Use progressive disclosure (collapsible sections, menus) instead of removing features.
- **Colour:** forest green `--brand` #1F6B4F (dark #4FBF92) is the brand AND the only action colour. Warm off-white `--bg` #FBFAF7, white `--surface`, ink #16181D, secondary #4A4F5A, warm borders #E6E3DC. Amber `--accent` #F2A541 = "new/attention" only and never as text. Everything else neutral. One filled green button per section; at most one solid green band per page. Funnel-stage hues only as a small dot/numeral/label.
- **Status:** critical `--danger`, warning amber fill + `--accent-ink` text, pass `--brand`; always icon + word, never colour alone.
- **Type:** Inter 400/600/800, self-hosted (bundle .woff2 in extensions; no remote fonts). Headings 800, -0.02em. Web body 17px; dense app UI 14px. Eyebrows 13px/600/uppercase/0.08em/green.
- **Shape:** buttons and badges are pills; inputs 8px; cards 14px; panels/dialogs 20px. Cards flat with 1px warm border; shadow only on hover and floating layers; no lift/scale animations.
- **Buttons:** Primary (green fill), Ghost (outline), Inverse (white on green), Link (green text + →). 44px tall (36px dense). Status like "Beta"/"Coming soon" is a badge, never a button.
- **Spacing:** 4px grid (4, 8, 12, 16, 24, 32, 48, 64). Web content max 1120px. No orphan cards in grids.
- **Accessibility:** AA contrast, green focus ring, keyboard access, labels, alt text, one H1, no horizontal scroll at 375px, tap targets ≥ 44px.
- **Dark mode:** same token names; follows the OS, forced with `<html data-theme="dark|light">`.
- **Words:** always "The Growth Folks®" (with ®), short form "TGF"; never a person's name in user-facing copy; contact team@thegrowthfolks.com; British spelling; practical, no hype; never invent stats or testimonials. On TGF products link to "our growth agency"; the agency's launch status lives only on agency.thegrowthfolks.com.
- **Logo:** green rounded square (radius ≈ 28%) with white "TGF" in Inter 800, plus "The Growth Folks®". Inverted (white square, green text) on green surfaces.
- **Sub-brands:** "<Name> by The Growth Folks®"; may change name, icon glyph and copy only; must keep every token, the button system and the logo mark.
- **Our look, not someone else's:** don't drift toward Apple blue, cool greys, glassmorphism or gradients. Show the real product (live tool, real screenshot, real numbers) instead of stock imagery.

## Surface quick reference

- **Website / landing page:** header (logo, nav, Sign in ghost + Sign up primary) → hero (eyebrow, H1 with one green phrase, one-line lead, primary + ghost, live product element or real screenshot) → tools/proof → how it works → content → one green conversion band → newsletter → footer with "Cookie settings". Title ≤ 60 chars, description 140–160, canonical, OG 1200×630.
- **Chrome extension:** dense sizes, sticky header with TGF mark + product name + segmented tabs, one primary action visible, secondary options collapsed, exports behind one menu, switches for settings, Shadow DOM or `tgf-` prefix for anything injected into pages. Store screenshots 1280×800 on warm off-white.
- **Client report:** Free = TGF green + "Made with The Growth Folks®" credit; Pro = agency logo + one agency colour replaces our green, layout/type/status colours stay. Tabular numbers.
- **Email:** 560px single column, white card on #FBFAF7, one green pill button, system font stack, always a plain-text part.
- **OG image:** 1200×630, warm off-white, 18px green/stage bar on the left, logo top-left, eyebrow, Inter 800 title, one-line subtitle, "thegrowthfolks.com".

Source of truth: `brand/` in the `shadabkhansir/web` repo (`tokens.css`, `GUIDELINES.md`). If the copies here differ from that repo, the repo wins.
