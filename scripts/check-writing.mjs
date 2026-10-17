// Flags the patterns that make text read as machine-written (see .claude/skills/human-writing/).
// Sources: Wikipedia:Signs of AI writing, PNAS 2025 "Do LLMs write like humans?", and our brand word list.
// Run: node scripts/check-writing.mjs [paths…]   (default: src/content; reads .md, .mdx and .html)
//      --strict  exit 1 if any file scores above the limit   --quiet  only list files over the limit
//      --limit=N  score limit per 1,000 words (default 6)
//      --include-code  also check text inside ``` blocks (store listings keep the paste-ready copy there)
// Report-only by default: a hit is a prompt to rewrite the sentence, not proof of anything.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const quiet = args.includes('--quiet');
const includeCode = args.includes('--include-code');
const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 6);
const paths = args.filter((a) => !a.startsWith('--'));

// [label, regex, weight]. Word lists follow the Wikipedia guide's "words to watch"; keep them literal.
const RULES = [
  // AI vocabulary (2023–2026 models)
  ['ai-word', /\b(delve[sd]?|delving|tapestry|testament to|pivotal|underscor(e|es|ed|ing)|showcas(e|es|ed|ing)|boasts?|vibrant|intricate|intricacies|interplay|meticulous(ly)?|bolster(s|ed|ing)?|garner(s|ed|ing)?|foster(s|ed|ing)?|enduring|realm|multifaceted|holistic|synergy|paradigm|plethora|myriad|nestled|groundbreaking|renowned|unparalleled|unwavering|transformative|cutting-edge|state-of-the-art|ever-evolving|game-changer|game-changing|revolutionary|revolutioni[sz]e[sd]?|supercharge[sd]?|seamless(ly)?|robust|elevate[sd]?|empower(s|ed|ing)?|embark(s|ed|ing)?|harness(es|ed|ing)?|streamline[sd]?|indelible|commitment to|diverse array|deep dive)\b/gi, 2],
  // Puffery uses only: a referral tier that literally unlocks a reward, or a measured "10x lift", is fine.
  ['ai-word', /\b(unlock(s|ed|ing)? (your |the |new |real )?(growth|potential|value|insights?|success|power|opportunit(y|ies)|revenue|scale)|10x (growth|your|faster|better|results|returns|marketer|engineer))\b/gi, 2],
  ['ai-word', /\b(crucial|vital|key role|valuable insights?|navigat(e|ing) the (complexities|landscape|world))\b/gi, 1],
  ['landscape', /\b(the|this|today's|evolving|digital|competitive|marketing|growth|SEO|search) landscape\b/gi, 2],
  ['leverage-verb', /\b(leverag(e|es|ed|ing)) (your|the|our|their|this|these|it|AI|data)\b/gi, 2],
  ['significance', /\b(stands as|serves as|plays an? (crucial|pivotal|vital|key|significant|important) role|marking an? (pivotal|significant|key)|setting the stage|reflects? (a )?broader|key turning point|focal point|deeply rooted)\b/gi, 2],
  ['trailing-ing', /,\s(highlighting|underscoring|emphasi[sz]ing|showcasing|reflecting|symboli[sz]ing|cementing|solidifying|fostering|contributing to|ensuring that) [^.!?\n]{3,}[.!?]/gi, 2],
  ['not-just', /\b(not (just|only|merely) [^.,;\n]{1,60}, (but|it'?s)|isn'?t (just|only|merely) [^.;\n]{1,60}(it'?s|—)|it'?s not [^.;\n]{1,40}, it'?s)\b/gi, 2],
  ['not-just', /\bnot only\b[^.\n]{1,80}\bbut also\b/gi, 2],
  ['filler', /\b(in today'?s|fast-paced|it'?s worth noting|it is worth noting|it is important to note|it'?s important to (note|remember)|needless to say|at the end of the day|when it comes to|in an era of|look no further|whether you'?re an? [^.\n]{1,40} or an?|let'?s (dive|explore|unpack|break (it|this) down)|dive (in|into)|buckle up|here'?s the (thing|kicker|catch)|the (truth|reality) is|let that sink in|without further ado)\b/gi, 2],
  ['connector', /(^|[.!?]\s+)(Additionally|Moreover|Furthermore|In conclusion|In summary|To summari[sz]e|Overall|Ultimately|Notably|Importantly|Crucially),/gm, 2],
  ['formula', /\b(Despite (these|its|their|the) (challenges|hurdles|limitations)|faces? (several|numerous|many) challenges|future outlook|challenges and (opportunities|future)|navigat(e|ing) (these|the) challenges)\b/gi, 2],
  ['weasel', /\b(experts (say|agree|argue|believe|suggest)|studies (show|suggest|have shown)|research (shows|suggests) that|many (believe|argue|experts)|industry (reports|observers)|observers have|it is widely (believed|accepted))\b/gi, 2],
  ['hedge', /\b(based on (the )?available information|not widely (documented|available|disclosed)|while specific details are (limited|scarce)|in the (provided|available) sources)\b/gi, 3],
  ['chat-leftover', /\b(I hope this helps|let me know if|would you like me to|Certainly!|Great question|As an AI|as a large language model|here is (a|an|the) (revised|updated|rewritten)|feel free to)\b/gi, 5],
  ['placeholder', /(\[(Your|Insert|Company|Name)[^\]]*\]|\((Add|Insert) [^)]*\)|20\d\d-xx-xx|lorem ipsum|\bTBD\b)/gi, 5],
  // Newer-model habits (2025–26) and our own template fingerprints.
  ['modern-tell', /\b(matters|both (things )?can be true|(two|three|four) (things|patterns|lessons|points) stand out|the real (question|work|problem|win|story)|genuinely|quietly)\b/gi, 1],
  ['meta-intro', /\b(this (piece|guide|article|post) (covers|walks|explains|looks at|breaks down)|in this (article|guide|post|piece),?)\b/gi, 3],
  ['not-just', /\bnot just\b/gi, 1],
  ['less-more', /\bis less (about )?[^.\n]{1,60}\band more (about )?/gi, 2],
  ['vague-link', /\b(in connection with|associated with the (rise|growth|success))\b/gi, 1],
];

const walk = (p) => {
  const s = statSync(p);
  if (s.isDirectory()) return readdirSync(p).flatMap((f) => walk(join(p, f)));
  return ['.md', '.mdx', '.html'].includes(extname(p)) ? [p] : [];
};

// Keep what readers see: drop code, URLs, HTML comments and frontmatter keys that hold slugs or URLs.
const prose = (src) =>
  src
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/Showcase Pages?/g, ' ') // LinkedIn product name
    .replace(/```[\s\S]*?```/g, (m) => (includeCode ? m.replace(/^```.*$/gm, ' ') : ' '))
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^\s*(url|slug|tactics|tools|tags|image|cover|category|published|updated|featured|lesson|order):.*$/gm, ' ');

const sentences = (text) =>
  text
    .replace(/^#+ .*$/gm, ' ')
    .replace(/^\s*([-*|]|\d+\.)\s.*$/gm, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().split(/\s+/).filter(Boolean).length)
    .filter((n) => n >= 3);

const results = [];
for (const file of (paths.length ? paths : ['src/content']).flatMap(walk)) {
  const raw = readFileSync(file, 'utf8');
  const text = prose(raw);
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const hits = [];
  let score = 0;
  for (const [label, re, w] of RULES) {
    for (const m of text.matchAll(re)) {
      hits.push(`${label}: "${m[0].trim().slice(0, 80)}"`);
      score += w;
    }
  }
  // Em dashes: one per 400 words is a human amount; more reads as a model habit.
  const dashes = (text.match(/—/g) || []).length;
  if (dashes > words / 400) {
    hits.push(`em-dash: ${dashes} in ${words} words`);
    score += dashes;
  }
  const curly = (text.match(/[“”‘’]/g) || []).length;
  if (curly) hits.push(`curly-quotes: ${curly} (the site uses straight quotes)`);
  // Bold inline-header lists ("- **Thing**: text") and Title Case headings.
  const boldList = (raw.match(/^\s*([-*]|\d+\.)\s+\*\*[^*\n]+\*\*\s*[:–-]/gm) || []).length;
  if (boldList > 3) {
    hits.push(`bold-header-list: ${boldList} items`);
    score += boldList - 3;
  }
  const boldLead = (raw.match(/^\*\*[^*\n]+\*\*/gm) || []).length;
  if (boldLead > 2) {
    hits.push(`bold-led-paragraphs: ${boldLead}`);
    score += boldLead - 2;
  }
  for (const h of raw.match(/^#{2,4} .+$/gm) || []) {
    const w = h.replace(/^#+ /, '').split(/\s+/).filter((x) => /^[a-z]/i.test(x) && x.length > 3);
    if (w.length >= 3 && w.every((x) => /^[A-Z]/.test(x))) {
      hits.push(`title-case-heading: "${h}"`);
      score += 1;
    }
  }
  // Burstiness: human prose mixes short and long sentences; a low spread reads as generated.
  const lens = sentences(text);
  if (lens.length >= 15) {
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
    if (sd / mean < 0.4) {
      hits.push(`flat-rhythm: sentence length ${mean.toFixed(0)}±${sd.toFixed(0)} words (vary it)`);
      score += 3;
    }
  }
  const per1k = (score / words) * 1000;
  results.push({ file, words, score, per1k, hits, raw });
}

// Sameness: a heading or opening device shared by more than a quarter of a collection is a template fingerprint.
const DEVICES = [
  ['"Say you…" example', /^Say you\b/m],
  ['"This piece/guide covers" intro', /\bthis (piece|guide|article|post) (covers|walks|explains)/i],
];
// Tactics and lessons are a reference library with a fixed page layout on purpose, so shared headings are fine there.
const FIXED_LAYOUT = ['src/content/tactics', 'src/content/lessons'];
const byDir = Object.groupBy(results, (r) => r.file.replace(/\/[^/]+$/, ''));
for (const [dir, rs] of Object.entries(byDir)) {
  if (rs.length < 8) continue;
  const share = (test) => rs.filter(test);
  const headings = {};
  if (!FIXED_LAYOUT.includes(dir))
    for (const r of rs) for (const h of new Set(r.raw.match(/^## .+$/gm) || [])) (headings[h] ||= []).push(r);
  const shared = Object.entries(headings).map(([h, list]) => [`heading "${h}"`, list]);
  for (const [label, re] of DEVICES) shared.push([label, share((r) => re.test(r.raw))]);
  for (const [label, list] of shared) {
    if (list.length / rs.length <= 0.25) continue;
    console.log(`\nsameness: ${label} appears in ${list.length} of ${rs.length} files in ${dir}`);
    for (const r of list) {
      r.hits.push(`sameness: ${label} (in ${list.length}/${rs.length} files)`);
      r.score += 3;
      r.per1k = (r.score / r.words) * 1000;
    }
  }
}

results.sort((a, b) => b.per1k - a.per1k);
const over = results.filter((r) => r.per1k > limit);
for (const r of quiet ? over : results.filter((r) => r.hits.length)) {
  console.log(`\n${r.per1k > limit ? '✗' : '·'} ${r.file}  (${r.per1k.toFixed(1)} per 1k words, ${r.words} words)`);
  for (const h of r.hits) console.log(`    ${h}`);
}
console.log(`\ncheck-writing: ${results.length} files, ${over.length} over the limit of ${limit} per 1,000 words.`);
if (strict && over.length) process.exit(1);
