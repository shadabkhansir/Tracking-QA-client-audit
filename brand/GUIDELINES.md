# The Growth Folks® design guidelines

Version 1.0 · October 2026 · Applies to every TGF product: thegrowthfolks.com, agency.thegrowthfolks.com, Chrome extensions, web apps, client reports (HTML/PDF), emails, landing pages, share images and any sub-brand.

Values live in [`tokens.css`](tokens.css) (and [`tokens.json`](tokens.json) for non-CSS uses). Copy them; never invent new values. If something is missing, add it to `tokens.css` first, then use it.

---

## 1. Principles

1. **Minimal, but the important thing is obvious.** Calm, uncluttered, lots of space, and on every screen exactly one thing people should notice first. Minimal means fewer things competing, not fewer features.
2. **One colour means action.** Forest green is the brand and the only action colour. If everything is green, nothing is.
3. **Flat and warm.** Warm off-white background, white cards, warm hairline borders. Depth (shadow) only on hover or on things that float.
4. **Show the product.** Prefer a working tool, real numbers or a real screenshot over illustration or stock imagery.
5. **Practical, direct, no hype.** In words as in design.
6. **Same family everywhere.** A person moving from the website to an extension to a report should feel it is one product.

Our own look, not Apple's or anyone else's: don't copy another brand's blue, cool greys or glassy surfaces.

---

## 2. Name, voice and words

- Always **The Growth Folks®** (with ®) in visible text. The bare word mark "The Growth Folks" is only for machine-readable data (schema, store listings that reject symbols) and next to a logo that already carries the ®.
- Short form in UI: **TGF** (logo mark, tight labels). Never "Growth Folks" or "GrowthFolks".
- Never put any person's name in user-facing copy, credits, footers or metadata. Citing public figures in lessons as sources is fine.
- Contact: **team@thegrowthfolks.com**.
- The agency: on our products, link to "our growth agency" (agency.thegrowthfolks.com). Its launch status ("opening soon") lives only on the agency site.
- Navigation labels on the website: **Growth Tactics · Tools · Learn Growth Marketing · Community · Agency**.
- Spelling: British (personalise, practise as a verb, monetisation, licence as a noun).
- Tone: practical, direct, plain English. Short sentences. Numbers over adjectives. No "revolutionary", "supercharge", "10x".
- Never invent stats, testimonials, customer logos or user counts.

---

## 3. Logo

- **Mark:** forest-green (`--brand`) rounded square with white **TGF**, weight 800. Corner radius ≈ 28% of the side (10px at 36px). Minimum size 24px.
- **Lock-up:** mark + "The Growth Folks" in Inter 700–800 with a small superscript ®.
- On a green surface, invert: white square, green "TGF".
- Don't recolour, outline, stretch, add effects, or place on busy imagery.
- Favicon and app icons come from the same mark (see `/public/favicon.svg`, `icon-*.png`).

---

## 4. Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FBFAF7` | `#111317` | Page/app background |
| `--surface` | `#FFFFFF` | `#191C22` | Cards, panels, inputs, menus, dialogs |
| `--ink` | `#16181D` | `#EEF0F3` | Text |
| `--ink-soft` | `#4A4F5A` | `#A7ADB8` | Secondary text, labels, captions |
| `--line` | `#E6E3DC` | `#2A2E36` | Hairlines, card borders, dividers |
| `--line-strong` | `#C9C5BB` | `#474D59` | Input and outline-button borders |
| `--brand` | `#1F6B4F` | `#4FBF92` | Primary buttons, links, active states, progress, focus |
| `--brand-deep` | `#185640` | `#6CCFA6` | Primary hover |
| `--brand-soft` | `#E5F1EB` | `#16291F` | Soft green panels, badges, selected rows |
| `--accent` | `#F2A541` | same | "New" / "needs attention": a dot or fill, **never text** |
| `--accent-soft` / `--accent-ink` | `#FDEEDB` / `#6B4A16` | `#3A2A12` / `#F3C784` | Amber chip background and its text |
| `--danger` / `--danger-soft` | `#D64545` / `#FBE9E9` | `#F07C7C` / `#3A1C1C` | Errors, failed checks |
| `--stage-*` | 6 hues | 6 hues | Funnel stages (Awareness → Referral): dot, numeral or label only |

**Rules**
- Green = brand + action. **One filled green button per section.** Everything else green is a link, an icon, a dot or a thin indicator.
- Amber = new/attention. If two amber things are on one screen, one is wrong.
- Everything else is neutral: diagrams, tables, track lists, cards use `--surface`, `--bg`, `--line`.
- At most **one solid green surface per page** (e.g. the course band on the homepage). That is the "look here" moment.
- Stage hues never fill surfaces or borders.
- **Status** (audits, QA tools, reports): critical = `--danger`, warning = `--accent` fill with `--accent-ink` text, pass = `--brand`. Always icon + word with the colour ("✓ Pass", "! Warning", "✕ Critical"), never colour alone.
- Charts: single series in `--brand`; comparisons in `--brand` vs `--ink-soft`; funnel-stage charts use stage hues. No rainbows; no dual axes.
- Never hard-code a hex in a component. Dark mode uses the same tokens.
- Contrast: body text AA (4.5:1), large text and UI borders 3:1. All token pairs above pass when used as described.

---

## 5. Typography

**Inter**, self-hosted, weights **400 / 600 / 800**, latin subset (`@fontsource/inter` on the web; bundled `.woff2` files in extensions, since the Chrome Web Store discourages remote fonts). Fallback: the metric-matched "Inter Fallback" in `tokens.css`.

| Token | Size | Use |
|---|---|---|
| `--t-xs` | 13px | Chips, eyebrows, captions, table meta |
| `--t-sm` | 14px | Card text, labels, secondary UI |
| `--t-base` | 17px | Body on the web (line-height 1.6) |
| `--t-lg` | 20px | Lead paragraphs, step titles |
| `--t-xl` | 24px | H3 in long-form, stat numbers |
| `--t-h2` | 28–38px fluid | Section headings |
| `--t-h1` | 32–52px fluid | Page titles |
| `--t-display` | 38–60px fluid | Homepage/landing hero only |

- Weights: 400 body · 600 UI, buttons, labels, H3 · 800 H1/H2 and big numbers. Headings `letter-spacing: -0.02em`, line-height 1.15.
- **Eyebrow:** `--t-xs`, 600, UPPERCASE, `letter-spacing: 0.08em`, `--brand` (or `--ink-soft`).
- Highlight one or two words of a hero headline in `--brand`; never more.
- Long-form text max width 72ch. Numbers in tables/stats: `font-variant-numeric: tabular-nums`.
- One H1 per page.

---

## 6. Spacing, layout and density

- 4px grid: `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 · `--s-7` 48 · `--s-8` 64.
- Web: content column `--max` 1120px with 16–24px side gutters; sections `--section`; blocks inside a section `--section-tight`.
- Card padding `--s-5` (web) / `--s-4` (dense UI); grid gaps `--s-4`; button groups `--s-3`.
- **Dense app UI** (extension side panels, dashboards, report tables): body 14px, labels 13px, captions 12px; inputs and buttons 36px tall; card padding 12–16px. Same colours, radii and weights.
- Grids: avoid orphans (a lone card on its own row). Prefer 2, 3 or 4 even columns.
- Mobile first: no horizontal scroll at 375px; tap targets ≥ 44px (≥ 36px in dense UI).

---

## 7. Shape and depth

- Radius: inputs/chips/small tiles `--r-sm` 8px · cards `--radius` 14px · panels, bands, dialogs `--r-lg` 20px · buttons and badges `--pill`.
- Borders: 1px `--line` on cards; 1px `--line-strong` on inputs and outline buttons.
- Shadow `--shadow` only on hover and on floating layers (menus, dialogs, toasts, sticky bars, the cookie bar). No shadows on resting cards.
- Hover: border → `--line-strong` and the shadow appears. No lift/scale transforms on cards.

---

## 8. Components

**Buttons** (pill, 44px; 36px small; weight 600; no shadow)

| Variant | Look | Use |
|---|---|---|
| Primary | Green fill, white text | The one main action of a section/screen |
| Ghost | Transparent, `--line-strong` border, `--ink` text | Secondary action beside a primary |
| Inverse | White fill, green text | Primary on a solid green surface |
| Link | Green text + "→", no box | Tertiary actions, "All tools →" |

Hover darkens fill (`--brand-deep`) or border (`--ink`). Disabled: 50% opacity, no pointer. Status ("Beta", "Coming soon") is a **badge**, never something that looks like a button.

**Badges / chips:** pill, 12–13px, 600. Green: `--brand-soft` + `--brand`. Amber: `--accent-soft` + `--accent-ink`. Neutral: `--bg` + `--ink-soft` + `--line` border.

**Cards:** `--surface`, `--line`, `--radius`. Content order: label/eyebrow → title → one or two lines → footer (meta or link). Compact on overview pages (title + one line).

**Forms:** label above (14px/600), input `--bg` fill, `--line-strong` border, `--r-sm`, 44px (36px dense). Focus: `--brand` border + 3px ring of `--brand` at ~35%. Hint 13px `--ink-soft`; error text `--danger` with the field marked `aria-invalid`. Checkbox groups as pill chips; on/off settings as switches (green when on).

**Tabs / segmented controls:** text tabs with a 2px `--brand` underline on the web; segmented pill control in dense UI. Selected = `--brand`.

**Dialogs:** `--surface`, `--r-lg`, `--shadow`, dimmed backdrop; Escape and backdrop click close; focus the first field.

**Toasts:** dark `--ink` pill/box with white text, bottom centre, auto-hide.

**Tables:** header 13px/600 `--ink-soft`; rows separated by `--line`; numbers right-aligned and tabular; no zebra stripes.

**Empty states:** one sentence of what will appear + one action.

**Consent/cookie UI:** "Accept all" and "Reject all" equally prominent (same style); "Manage" as a text link.

**Diagrams** (tactic flows): `--bg` boxes, `--line` borders, numbered steps with the stage hue on the numeral only, arrows `--ink-soft`.

---

## 9. Iconography, imagery and motion

- Icons: simple 1.5–2px line icons, 16/20/24px, `currentColor`. One icon set per product.
- Imagery: real product UI, real data, diagrams. No stock photos of people, no 3D blobs, no gradients behind text.
- Motion: 150–200ms ease for colour/border/opacity. No bouncing, parallax or auto-playing animation. Respect `prefers-reduced-motion`.

---

## 10. Accessibility (non-negotiable)

AA contrast · visible `:focus-visible` ring (green) on everything interactive · semantic HTML (`header`, `nav`, `main`, `footer`, one H1) · labels on every input · keyboard-operable menus, tabs and dialogs · `alt` text on meaningful images · never colour alone for meaning · works at 200% zoom and at 375px wide.

---

## 11. Surfaces

**Website and landing pages**
- Header: logo left, nav centre/right, "Sign in" (ghost) + "Sign up" (primary). Mobile menu below 1080px.
- Hero: eyebrow, H1 (`--t-display`, one green phrase), one-line lead, one primary + one ghost button, and a **live product element or real screenshot** on the right.
- Then: proof/tools → how it works → content → one green band for the main conversion → newsletter → footer.
- Footer: brand + tagline + team@, link columns, "© The Growth Folks®", "Cookie settings".
- Every page: title ≤ 60 chars, description 140–160, canonical, OG image 1200×630.

**Chrome extensions (side panel / popup / options)**
- Same tokens; dense UI sizes (§6); Inter bundled locally.
- Sticky header: TGF mark + product name + (optional) segmented tabs. One primary action visible; secondary options in a collapsible section; exports behind one menu.
- Settings use switches; findings use status dots with words.
- UI injected into web pages: Shadow DOM or a unique prefix (`tgf-`), never leak styles.
- Store screenshots: 1280×800, warm off-white background, real UI, one short headline per screenshot in Inter 800.

**Client reports (HTML/PDF)**
- Free plan: TGF green and warm off-white, with a small "Made with The Growth Folks®" credit.
- Pro (white-label): the agency's logo and one brand colour replace ours in the header and accents; keep our layout, type and status colours.
- A4/Letter, 20mm margins, Inter, tabular numbers, status = icon + word + colour.

**Emails**
- 560px single column, white card on `#FBFAF7`, the logo lock-up at top, one green pill button, system font stack (email clients don't load web fonts reliably), plain-text version always.

**Share images (OG)**
- 1200×630, `--bg` background, 18px stage/brand bar on the left, logo top-left, eyebrow, title in Inter 800, one-line subtitle, "thegrowthfolks.com" bottom-left.

---

## 12. Sub-brands

A sub-brand (a tool, an extension, the agency, the community) is **"<Name> by The Growth Folks®"**.
- May change: the product name, its icon glyph, and its copy.
- Must keep: all tokens (colours, type, spacing, radii), the button system, the logo mark in the header or footer, and the voice.
- May not: introduce a new primary colour, a new font, or a different button shape.
- The agency site uses the same tokens; it may use the solid green band more often (it is a sales site), still one primary per section.

---

## 13. Do / don't

| Do | Don't |
|---|---|
| One filled green button per section | Several filled buttons competing |
| Neutral cards, colour only on dots/numerals | Coloured card backgrounds or borders per category |
| Real product in the hero | Empty hero halves, stock photos |
| Status = icon + word + colour | Colour alone, red/green only |
| Tokens from `tokens.css` | Hard-coded hex, new greys, Apple blue |
| "The Growth Folks®" | "Growth Folks", missing ® |
| Flat cards, shadow on hover | Shadows on everything, lift animations |

---

## 14. Release checklist (every new page, app screen or product)

- [ ] Uses `tokens.css` values only; works in light and dark.
- [ ] Inter 400/600/800 loaded locally; no layout shift on load.
- [ ] Exactly one primary action visible per section/screen; the most important thing is noticed first.
- [ ] Green only for brand/action; amber only for new/attention; status with icon + word.
- [ ] Pill buttons, 14px cards, flat surfaces.
- [ ] "The Growth Folks®" spelled correctly; no personal names; team@thegrowthfolks.com.
- [ ] AA contrast, focus rings, keyboard access, labels, alt text.
- [ ] No horizontal scroll at 375px; tap targets ≥ 44px (36px dense).
- [ ] Web: title, description, canonical, OG image. Extension: Shadow DOM for injected UI.

---

## 15. Keeping it in sync

- Source of truth: `brand/tokens.css` in the `shadabkhansir/web` repo. `node scripts/check-brand.mjs` regenerates `tokens.json` and warns if the website's `src/styles/global.css` drifts (it runs after every build).
- Other repos copy `brand/tokens.css` (and the Inter files). When the brand changes: edit `tokens.css`, bump the version at the top of this file and in `tokens.css`, then update each product.
- Claude skill: `.claude/skills/tgf-design-system/` holds these rules for AI-assisted work; copy that folder into any TGF repo (or install it as a personal skill) so every session follows them.
