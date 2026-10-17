# The tells: what makes text read as machine-written

Compiled from Wikipedia's field guide "Signs of AI writing" (WP:AISIGNS, read October 2026), the studies it cites, and patterns found in our own drafts. Each entry: what it looks like, why it reads as generated, and the fix.

The root cause behind most of them, in Wikipedia's words: models "regress to the mean". They swap specific, unusual facts for generic, positive statements that fit any topic, so the subject "becomes simultaneously less specific and more exaggerated". Almost every fix below is the same move in reverse: put the specific fact back.

## 1. Content tells

### Significance padding
Looks like: "marking a pivotal moment", "plays a crucial role", "stands as a testament to", "reflects broader trends", "setting the stage for", "an evolving landscape", "deeply rooted", "a key turning point", "this distinction matters because".
Why: the model asserts importance instead of showing it, and uses a small, recognisable repertoire to do so.
Fix: delete the sentence, or replace it with the consequence. "This update was pivotal for advertisers" → "After the update, conversion counts in GA4 fell by roughly a third for sites without Consent Mode."

### Canned notability and coverage
Looks like: "featured in leading publications", "widely covered by industry media", "maintains an active social media presence", "recognised by experts".
Fix: name the publication and what it said, with a link, or drop it.

### Superficial analysis in trailing "-ing" clauses
Looks like: "…grew 40% in 2025, highlighting the importance of retention." Also "underscoring", "emphasising", "reflecting", "symbolising", "ensuring", "fostering", "contributing to", "making it".
Why: a present participle tacked on the end that adds an opinion nobody sourced (PNAS 2025, Reinhart et al., found participle clauses far more frequent in model text).
Fix: end the sentence at the fact. If the interpretation matters, give it its own sentence with a reason.

### Promotional tone
Looks like: "boasts", "vibrant", "rich", "nestled", "in the heart of", "groundbreaking", "renowned", "diverse array", "showcasing", "commitment to", "seamless experience".
Fix: neutral verbs ("has", "offers" only when something is offered), plain description, a number.

### Vague connection
Looks like: "associated with", "in connection with", "linked to the growth of".
Fix: say what the relationship is. "Associated with higher retention" → "Users who finished the checklist kept paying for longer: 61% were active at day 90, against 38% who skipped it."

### Vague attribution (weasel words)
Looks like: "experts argue", "industry reports suggest", "studies show", "observers have noted", "many marketers believe"; also "such as" before a list that is in fact the whole list.
Fix: name and link the source. One source is "a 2025 Ahrefs study", not "several studies".

### The "challenges" formula
Looks like: "Despite its strengths, X faces several challenges…", "Despite these challenges, X continues to thrive", sections titled "Challenges and future outlook".
Fix: put limitations where they apply, with specifics. Skip the upbeat wrap-up.

### Hedging boilerplate
Looks like: "based on available information", "details are not widely documented", "while specific data is limited", "should be treated as indicative rather than definitive".
Fix: say exactly what is unknown and why, once ("Meta doesn't publish match rates by country"), or say nothing.

### Chat leftovers and placeholders
Looks like: "I hope this helps", "Certainly!", "Let me know if…", "Would you like…", "Here is a revised version", "[Your company name]", "(add link here)", "2025-xx-xx".
Fix: remove. The checker treats these as severe.

## 2. Language tells

### AI vocabulary
Words studies show models over-use (Kobak 2025, Juzek & Ward 2025, Geng & Trotta 2025, Washington Post 2025 analysis), roughly by model era:
- 2023–mid 2024: additionally (opening a sentence), boasts, bolstered, crucial, delve, emphasising, enduring, garner, intricate/intricacies, interplay, key, landscape, meticulously, pivotal, underscore, tapestry, testament, valuable, vibrant.
- Mid 2024–mid 2025: align with, bolstered, crucial, emphasising, enhance, enduring, fostering, highlighting, pivotal, showcasing, underscore, vibrant.
- Mid 2025 on: emphasising, enhance, highlighting, showcasing; newer models also lean on challenge, clearer, dependable, foster, leverage, matters, multifaceted, practical, prioritise, quietly, steady (lower confidence; Wikipedia's source for this era is a single review).
- Our own banned list adds: unlock, supercharge, 10x, game-changer, revolutionary, seamless, robust, landscape, leverage (verb), elevate, empower, embark, harness, streamline, realm, holistic, synergy, paradigm, plethora, myriad, cutting-edge, transformative, unparalleled, "in today's…", "fast-paced", "navigate the complexities".
Take the list literally: synonyms are not suspect. Context matters ("underscore" as a character is fine). One stray "crucial" proves nothing; density is the tell.

### Avoiding "is" and "has"
Looks like: "serves as", "stands as", "functions as", "represents", "features", "boasts", "offers", "refers to". One study found "is" and "are" fell over 10% in academic writing in 2023.
Fix: "The dashboard serves as the team's source of truth" → "The dashboard is where the team checks numbers."

### Negative parallelism
Looks like: "It's not just a tool, it's a system." "Not only faster but also cheaper." "No setup, no code, just results." "X rather than Y" used for effect. Also in headings: "Write pages that get cited, not just ranked".
Fix: state the positive claim directly. Keep at most one per piece, and only to correct a belief readers actually hold.

### Rule of three
Looks like: "fast, reliable, and secure", "plan, test, and scale", three-item lists in every paragraph.
Fix: use the real number of items. Often that is one or two.

### Filler connectors and openers
Looks like: sentences opening with "Additionally,", "Moreover,", "Furthermore,", "Notably,", "Importantly,", "Ultimately,", "Overall,", "In conclusion,"; "It's worth noting that", "It's important to remember", "When it comes to", "At the end of the day", "In an era of", "Whether you're a founder or a marketer".
Fix: delete the connector; the order of sentences already shows the link.

### Conversational hooks
Looks like: "Let's dive in", "Here's the thing", "Here's the catch", "The truth is", "Let that sink in", "Buckle up", "The good news?", colon reveals ("The result: …") in every paragraph.
Fix: say the thing. One rhetorical question per piece is plenty.

### Flat rhythm
Detectors measure two things above all: how predictable each word is (perplexity) and how much that varies from sentence to sentence (burstiness). Model text keeps sentence length and structure even; some newer models hold every sentence to roughly 8–20 words.
Fix: vary it deliberately. A three-word sentence after a long one. A paragraph that is one line. Concrete, unusual words (product names, figures, local detail) also raise perplexity naturally.

## 3. Style and formatting tells

- **Title Case Headings**: we use sentence case.
- **Bold everywhere**: bolding key terms in every paragraph, "key takeaways" style.
- **Inline-header lists**: "- **Speed:** pages that…" repeated down a list. Write prose, or a plain list.
- **Bold-led paragraphs**: "**Pew Research Center** tracked…" at the start of paragraph after paragraph.
- **Emoji as bullets or heading decoration.**
- **Tables for tiny data** that read better as a sentence.
- **Headings with nothing under them**, skipped heading levels, a heading that repeats the page title.
- **Thematic breaks (---) between every section.**
- **Curly quotes and apostrophes** mixed with straight ones (common in ChatGPT output; Claude and Gemini usually use straight quotes). The site uses straight quotes.
- **Em dashes**: models over-use them; the Washington Post's 2025 analysis of ChatGPT style lists the em dash among its most recognisable habits. Use commas, full stops, brackets.

## 4. Sameness across pages (the tell detectors and Google both see)

One article with a neat skeleton is fine. Twenty with the same skeleton is a fingerprint, and at scale it is what Google's scaled content abuse policy describes. Watch for:
- The same closing heading on most posts ("What to do this week", "The short version", "Key takeaways", "Final thoughts").
- The same opening move ("This piece covers…", a question, a statistic) on most posts.
- The same device in every piece ("Say you spend ₹2,00,000 a month…" worked examples, a comparison table, a "common mistakes" list).
- The same paragraph count per section, the same list lengths, the same FAQ count.
The checker reports headings and phrases that appear in more than a quarter of a collection. Fix by giving each piece the structure its content needs: some end with a checklist, some with a decision, some just stop when the argument is done.

## 5. What reads as human (do more of this, only where it is true)

- First-hand detail: "In our tag checker's test pages, the Meta pixel fired twice whenever…".
- Specific numbers with units and dates, linked to sources.
- A clear opinion with the reason: "Skip marketing mix modelling under ₹50 lakh a year of spend. You won't have enough variation in the data."
- Admitting limits plainly: "We haven't tested this on Shopify Plus."
- Local and concrete examples (UPI, COD, WhatsApp, GST, VAT, a London agency, a Pune D2C brand) rather than "a company".
- Uneven paragraph lengths; a short sentence for emphasis instead of bold.
- Words people actually use in the trade: "the pixel's double-firing", "CPMs went through the roof in Q4", "we killed the test".
