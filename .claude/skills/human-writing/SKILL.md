---
name: human-writing
description: How The Growth Folks® writes so that content reads as written by a person who knows the subject, not by a chatbot. Use for every piece of user-facing text on thegrowthfolks.com and its tools — blog posts, tactics, lessons, landing pages, tool pages, Chrome Web Store listings, emails, social posts, FAQs, meta descriptions — and whenever asked to write, rewrite, edit or review copy, to "make it sound human", "remove AI tone", or to check whether content "looks AI-written". Covers the patterns readers and detectors notice (from Wikipedia's "Signs of AI writing"), what Google actually rewards and penalises, the writing workflow, and the checker script.
---

# Human writing for The Growth Folks®

The goal is not to fool a detector. It is to write the way a practitioner writes: specific, opinionated where the evidence allows, uneven in rhythm, and full of details that only someone who did the work would know. Text like that reads as human because it carries information a generic model would smooth away. Surface tricks alone make content harder to spot and no better to read; Wikipedia's own guide warns against exactly that ("do not merely treat these signs as the problems to be fixed").

Read `references/ai-tells.md` before writing or reviewing anything longer than a paragraph. `references/google-and-detection.md` has the research behind these rules, with sources. `references/rewrites.md` shows before/after pairs from our own site.

## What Google actually does (short version)

- Google does not penalise text for being AI-assisted. It penalises content made "for the primary purpose of manipulating search rankings", including "using generative AI tools … to generate many pages without adding value for users" (spam policies, scaled content abuse).
- It rewards "original, high-quality content" showing E-E-A-T: experience, expertise, authoritativeness, trust. Its self-assessment asks whether a page offers "original information, reporting, research, or analysis" and "substantial value when compared to other pages in search results".
- It asks Who, How, Why: accurate bylines (never invented authors or AI headshots), clarity on how content was made where readers would wonder, and a "why" that is helping people, not chasing traffic.
- So the protection is value and originality. A page nobody could have written without doing the work is safe; a page that rephrases the top ten results is at risk however human it sounds.

## Workflow

1. **Collect the specifics first.** Before drafting, list what this piece has that the top search results do not: a number from our own tools or data, a step we tested, a screenshot, a mistake we saw, a sourced figure, a worked example tied to a real market (₹, £, $). If the list is empty, the piece is not ready; find something or don't publish.
2. **Decide the point.** Write one sentence a reader should remember. Open with it. No preamble, no "this guide covers".
3. **Draft plainly.** Use "is", "has", "does". Name the thing. Prefer the specific noun to the abstract one and the number to the adjective.
4. **Break the template.** Every piece gets its own structure, headings and ending. Do not reuse the last piece's skeleton (see "Sameness" in `references/ai-tells.md`).
5. **Edit against the tells.** Go through `references/ai-tells.md`. Cut significance padding, trailing "-ing" clauses, "not just X but Y", rule-of-three lists, bold-led paragraphs, filler connectors and AI vocabulary.
6. **Read it aloud.** If a sentence sounds like a brochure or a keynote, rewrite it as you would say it to a colleague. Mix short and long sentences.
7. **Fact-check every claim.** Every number traces to a source you opened. Wrong facts are the strongest AI signal of all, and Google says to "manually factcheck and review all AI-generated content".
8. **Run the checker:** `node scripts/check-writing.mjs <files>` (or no arguments for all content). Fix every ✗ file and look hard at the hits in the others. It also flags headings and phrases repeated across many files. It reads .md, .mdx and .html; add `--include-code` for files that keep paste-ready copy in code blocks (Chrome Web Store listings).

## Hard rules

- No AI vocabulary from the list in `references/ai-tells.md` (delve, pivotal, landscape, unlock, seamless, robust, leverage as a verb, testament, showcase, foster, vibrant, crucial, "in today's…", and the rest).
- No significance padding: never tell the reader something is important, pivotal, a game-changer or "matters". Show the consequence instead.
- No "It's not X, it's Y", "not just X but Y", "X rather than Y" as a rhetorical move. One per piece at most, and only when it corrects a real misconception.
- No triplets by reflex. Two items or four are fine. Three only when there really are three.
- No sentence-ending "-ing" commentary (", highlighting…", ", ensuring…", ", making it…").
- No bold lead-ins on paragraphs or list items ("**Speed.** Pages that…"). Bold at most one phrase per section, and only when a scanner must not miss it.
- Headings in sentence case, specific to this piece. No generic closers repeated across posts ("What to do this week", "The short version", "Conclusion", "Final thoughts", "Key takeaways").
- No meta-commentary: "In this article", "This piece covers", "Let's dive in", "Here's the thing", "It's worth noting".
- No vague authority: "experts say", "studies show", "many believe". Name the source and link it, or drop the claim.
- No hedging boilerplate: "based on available information", "while details are limited".
- Em dashes: rarely; never two in a paragraph. Straight quotes, not curly.
- Vary sentence length on purpose. Some sentences are four words. Some run to thirty because the idea needs it.
- Contractions are fine ("it's", "don't"). So is the first person plural ("we tested", "we've seen") when it is true.
- Brand rules still apply: "The Growth Folks®", British spelling, no personal names, team@thegrowthfolks.com.

## What not to do

- No detector-evasion tricks: invisible characters, homoglyphs, random typos, deliberately broken grammar, synonym spinning or "humaniser" tools. They hurt readers and accessibility, can look like spam to Google, and the better detectors are trained on them.
- No fake experience. Never invent tests, clients, results, quotes or authors to sound human. Google calls fabricated creator profiles deceptive, and it is.
- No promise that a tool can never flag a text. Detectors misfire in both directions (a Stanford study found seven detectors flagged 61% of essays by non-native English writers as AI). What we control is quality and specificity.

## Applying it to existing content

Run the checker across `src/content`. Rewrite flagged sentences in place, keep every fact, link, number and source, and change the structure where several pieces share the same skeleton. Do not change slugs, frontmatter keys, or published dates; set `updated` only if the substance changed.
