# Google, AI content and detectors: what the evidence says

Researched October 2026. Re-check the Google pages before relying on exact wording; they are updated often.

## Google's position

**AI use is allowed; ranking manipulation is not.** Google's February 2023 post "Google Search's guidance about AI-generated content" (8 February 2023) says its systems reward "high-quality content, however it is produced", that "appropriate use of AI or automation is not against our guidelines", and that using automation, including AI, "to generate content with the primary purpose of manipulating ranking in search results" is a spam-policy violation. It adds that AI disclosures "are useful for content where someone might think 'How was this created?'" and that "giving AI an author byline is probably not the best way to follow our recommendation".
https://developers.google.com/search/blog/2023/02/google-search-and-ai-content

**Scaled content abuse** (spam policies, updated 28 August 2026): "when many pages are generated for the primary purpose of manipulating search rankings and not helping users". Examples include "using generative AI tools or other similar tools to generate many pages without adding value for users", scraping and rewording other sites, and stitching content together without adding value. The policy is about purpose and value, not the tool.
https://developers.google.com/search/docs/essentials/spam-policies

**Using generative AI content** (updated 1 October 2026): focus on "accuracy, quality, and relevance"; "it is critical to manually factcheck and review all AI-generated content for accuracy and trustworthiness before publishing"; the same applies to titles, meta descriptions, structured data and alt text; sharing how content was made "can help give your readers more context"; AI-generated product images in Merchant Center need IPTC `TrainedAlgorithmicMedia` metadata.
https://developers.google.com/search/docs/fundamentals/using-gen-ai-content

**Helpful, people-first content** (updated 5 October 2026). Self-assessment questions include: does the content provide "original information, reporting, research, or analysis"; does it provide "substantial value when compared to other pages in search results"; is it "written or reviewed by an expert or enthusiast who demonstrably knows the topic well"; warning signs include "extensive automation to produce content on many topics", "mainly summarizing what others have to say without adding much value", and changing dates to look fresh. Who/How/Why: accurate bylines; "fabricating creator profiles", AI-generated headshots and false credentials are deceptive; the "why" "should be that you're creating content primarily to help people".
https://developers.google.com/search/docs/fundamentals/creating-helpful-content

**What this means for us.** Google is not looking for "AI-sounding" prose; it looks for pages that add nothing. Our protection: original data from our tools, tested steps, first-hand screenshots, sourced numbers, a real point of view, one honest byline ("The Growth Folks®"), no inflated dates, and no mass-produced near-duplicates.

## Does AI content rank? Industry data

- Ahrefs (7 July 2025) analysed the top 20 results for 100,000 keywords (about 600,000 pages) with its own detector: correlation between AI share and ranking position was 0.011, effectively none; 4.6% of pages were classed as pure AI, 13.5% pure human, 81.9% mixed; the very top position leaned slightly more human. Correlation only, and the detector is Ahrefs' own.
  https://ahrefs.com/blog/ai-generated-content-does-not-hurt-your-google-rankings/
- Secondary reports describe later studies (Semrush, a June 2026 Ahrefs follow-up) finding fully AI pages under-represented at position one, attributed to weaker, younger, scaled sites rather than a detection penalty. Treat these as indicative; the primary reports were not verified here.

## AI detectors: how they work and how reliable they are

- Most detectors score perplexity (how predictable each next word is) and burstiness (how much that varies across sentences), or use classifiers trained on human and model text.
- OpenAI withdrew its own AI classifier on 20 July 2023 "due to its low rate of accuracy"; at launch it caught 26% of AI text and wrongly flagged 9% of human text.
- Liang et al. (Stanford, 2023, "GPT detectors are biased against non-native English writers"): seven detectors labelled 61% of TOEFL essays by non-native writers as AI, while being near-perfect on US students' essays. https://arxiv.org/abs/2304.02819
- Wikipedia's guide: detectors such as GPTZero and Pangram "perform better than random chance" but "have non-trivial error rates", and are thrown by paraphrasing and unseen models. Humans do little better: a 2025 study found people distinguished human and LLM text at about chance, though heavy LLM users ("experts") caught about 90% with few false alarms.
- Human writing is converging on model style (studies of podcasts and academic writing since 2023), so the line itself is blurring.

**Conclusion.** No writing method can guarantee that every detector, now and in future, labels a text human; anyone promising that is selling something. Detectors are unreliable in both directions. Writing that carries specific, first-hand, sourced information, in an uneven human rhythm, is both the best reader experience and the least likely to be flagged, and it is what Google's systems are built to reward.
