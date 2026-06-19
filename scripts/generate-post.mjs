// =============================================================================
//  generate-post.mjs — the "Claude via GitHub" content engine
// =============================================================================
//  Runs in GitHub Actions (Node 20+, no dependencies). On each run it:
//    1. Asks Claude for ONE fresh, GCC-targeted, buying-intent article
//    2. Writes it as a styled HTML page in /posts
//    3. Updates posts.json, regenerates journal.html and sitemap.xml
//  The workflow then commits the result back to the repo (your "cloud"),
//  so new content keeps appearing while you're offline.
//
//  Requires env: ANTHROPIC_API_KEY  (GitHub repo secret)
//  Optional env: CLAUDE_MODEL  (default claude-opus-4-8)
//                SITE_URL      (your live domain, for sitemap.xml)
//
//  ⚠️ Honest note: this produces and publishes content. It does NOT produce
//  traffic. Real clicks still require you to distribute these posts.
// =============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT       = process.cwd();
const POSTS_DIR  = path.join(ROOT, "posts");
const MANIFEST   = path.join(ROOT, "posts.json");

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL   = process.env.CLAUDE_MODEL || "claude-opus-4-8";
// Cost lever (your call): claude-opus-4-8 ($5/$25 per 1M tok) is the default.
// For cheaper runs set CLAUDE_MODEL to claude-sonnet-4-6 ($3/$15) or
// claude-haiku-4-5 ($1/$5). A single ~1.5k-word article is a few US cents.
const SITE_URL = (process.env.SITE_URL || "https://YOUR-SITE-URL").replace(/\/+$/, "");

// Affiliate destinations the article may deep-link to (must match Ounass paths).
const SHOP_PATHS = [
  "/", "/women", "/men", "/kids", "/beauty",
  "/women/handbags", "/women/clothing", "/women/jewellery", "/women/shoes",
  "/beauty/fragrance", "/watches",
];

if (!API_KEY) {
  console.error("✗ ANTHROPIC_API_KEY is not set. Add it as a GitHub repo secret.");
  process.exit(1);
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (s) => String(s).toLowerCase().normalize("NFKD")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "post";

// ---- load existing posts (avoid duplicate topics) --------------------------
let posts = [];
try { posts = JSON.parse(await readFile(MANIFEST, "utf8")); } catch { posts = []; }
const existingTitles = posts.map((p) => p.title);

// ---- ask Claude (structured output guarantees parseable JSON) --------------
const system =
  "You are an expert luxury-retail editor writing for an affiliate publisher " +
  "called " + (process.env.BRAND_NAME || "The Edit") + ", which sends shoppers to " +
  "Ounass (the Middle East's leading luxury e-commerce destination). Your readers " +
  "are affluent shoppers in the GCC (UAE, Saudi Arabia, Kuwait, Qatar). Write " +
  "genuinely useful, specific, non-spammy editorial that helps people decide what " +
  "to buy. British English. Return ONLY the structured fields requested — no " +
  "preamble, no commentary, no reasoning.";

const user =
  "Write ONE original article with clear buying intent for a GCC luxury shopper.\n" +
  "Pick a fresh angle NOT covered by these existing titles: " +
  JSON.stringify(existingTitles) + "\n\n" +
  "Good angles: seasonal/occasion gift guides (Eid, Ramadan, weddings, Eid al-Adha, " +
  "back-to-school luxury), 'best of' category edits, designer spotlights, " +
  "how-to-style guides, and comparison/buying guides — all relevant to Ounass.\n\n" +
  "Requirements for body_html:\n" +
  "- Semantic HTML only: <h2>, <h3>, <p>, <ul>/<li>, <strong>. Do NOT include an <h1> " +
  "(the page adds the title) and do NOT include <html>/<head>/<body>.\n" +
  "- 700–1100 words, scannable, genuinely helpful.\n" +
  "- Include 2–4 inline shopping links written EXACTLY as " +
  '<a data-shop="/women">anchor text</a> (no href — the site adds tracking). ' +
  "Only use these data-shop paths: " + JSON.stringify(SHOP_PATHS) + ".\n" +
  "- Naturally mention Ounass perks where relevant (2-hour delivery in Dubai & Kuwait, " +
  "3-hour in Riyadh, curated local + international designers).\n" +
  "- No fabricated prices, no fake discounts, no invented product names/SKUs.\n\n" +
  "title: compelling, specific, <= 70 chars. slug: url-safe kebab-case. " +
  "description: a 140–160 char meta description. tags: 3–6 short tags.";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title:       { type: "string" },
    slug:        { type: "string" },
    description: { type: "string" },
    tags:        { type: "array", items: { type: "string" } },
    body_html:   { type: "string" },
  },
  required: ["title", "slug", "description", "tags", "body_html"],
};

console.log(`→ Requesting a new article from ${MODEL} …`);
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: MODEL,
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema } },
  }),
});

if (!res.ok) {
  console.error(`✗ Anthropic API error ${res.status}:`, await res.text());
  process.exit(1);
}
const data = await res.json();
if (data.stop_reason === "refusal") {
  console.error("✗ Request was refused by safety classifiers; skipping this run.");
  process.exit(1);
}
const textBlock = (data.content || []).find((b) => b.type === "text");
if (!textBlock) { console.error("✗ No text block in response:", JSON.stringify(data).slice(0, 500)); process.exit(1); }

let article;
try { article = JSON.parse(textBlock.text); }
catch (e) { console.error("✗ Could not parse JSON output:", e, "\n", textBlock.text.slice(0, 500)); process.exit(1); }

// ---- build the post page ----------------------------------------------------
const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
let slug = slugify(article.slug || article.title);
let file = `${today}-${slug}.html`;
let n = 2;
while (posts.some((p) => p.file === file)) { file = `${today}-${slug}-${n++}.html`; }

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">';

function shell({ prefix, title, description, main }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="index,follow" />
${FONTS}
<link rel="stylesheet" href="${prefix}styles.css" />
</head>
<body>
<div class="announce">Complimentary <b>2-hour delivery</b> across Dubai &amp; Kuwait · Same-day in select cities · <b>3-hour</b> in Riyadh</div>
<header class="nav"><div class="wrap nav-inner">
  <a href="${prefix}index.html" class="brand" data-brand>The Edit</a>
  <nav class="nav-links">
    <a href="#" data-shop="/women">Women</a>
    <a href="#" data-shop="/men">Men</a>
    <a href="#" data-shop="/beauty">Beauty</a>
    <a href="${prefix}journal.html">Journal</a>
    <a href="#" class="nav-cta" data-shop="/">Shop Ounass</a>
  </nav>
</div></header>
<main>${main}</main>
<section class="disclosure"><div class="wrap"><p><b>Affiliate disclosure.</b> <span data-brand>The Edit</span> is an independent publisher participating in the Ounass Affiliate &amp; Partnerships Programme. This site is not operated by, and is not the official site of, Ounass or Al Tayer Group. When you click a “Shop” link and make a qualifying purchase, we may earn a commission at no additional cost to you.</p></div></section>
<footer><div class="wrap">
  <div class="brand serif" data-brand>The Edit</div>
  <div class="copy">© <span id="year">2026</span> <span data-brand>The Edit</span> · A curated luxury showcase in partnership with Ounass.</div>
</div></footer>
<script src="${prefix}affiliate.js" defer></script>
</body>
</html>`;
}

const postMain = `
  <article class="page article">
    <nav class="crumb"><a href="../index.html">Home</a> <span>/</span> <a href="../journal.html">Journal</a></nav>
    <span class="eyebrow">The Edit · Journal</span>
    <h1 class="serif">${esc(article.title)}</h1>
    <p class="lede">${esc(article.description)}</p>
    ${article.body_html}
    <div class="article-cta"><a href="#" class="btn" data-shop="/">Shop the Edit at Ounass</a></div>
  </article>`;

await mkdir(POSTS_DIR, { recursive: true });
await writeFile(path.join(POSTS_DIR, file),
  shell({ prefix: "../", title: `${article.title} — The Edit`, description: article.description, main: postMain }));

// ---- update manifest (newest first) ----------------------------------------
posts.unshift({ title: article.title, slug, file, date: today, description: article.description, tags: article.tags || [] });
await writeFile(MANIFEST, JSON.stringify(posts, null, 2) + "\n");

// ---- regenerate journal.html -----------------------------------------------
const cards = posts.map((p) =>
  `      <a class="post-card" href="posts/${p.file}">
        <span class="pc-date">${esc(p.date)}</span>
        <span class="pc-title serif">${esc(p.title)}</span>
        <span class="pc-desc">${esc(p.description)}</span>
        <span class="pc-more">Read →</span>
      </a>`).join("\n");

const journalMain = `
  <section class="page">
    <span class="eyebrow">The Edit</span>
    <h1 class="serif">The Journal</h1>
    <p class="lede">Edits, gift guides and designer spotlights — your curated route to luxury at Ounass. New pieces are published automatically.</p>
    <div class="post-list">
${cards || '      <p class="muted">New guides are on the way. Check back soon.</p>'}
    </div>
  </section>`;

await writeFile(path.join(ROOT, "journal.html"),
  shell({ prefix: "", title: "The Journal — The Edit", description: "Edits, gift guides and designer spotlights — your curated route to luxury at Ounass.", main: journalMain }));

// ---- regenerate sitemap.xml -------------------------------------------------
const locs = ["", "journal.html", ...posts.map((p) => `posts/${p.file}`)];
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<!-- Regenerated automatically by scripts/generate-post.mjs on each run. -->\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  locs.map((u) => `  <url><loc>${SITE_URL}/${u}</loc></url>`).join("\n") +
  `\n</urlset>\n`;
await writeFile(path.join(ROOT, "sitemap.xml"), sitemap);

console.log(`✓ Published: posts/${file}`);
console.log(`✓ Journal + sitemap updated (${posts.length} post${posts.length === 1 ? "" : "s"} total).`);
if (SITE_URL.includes("YOUR-SITE-URL")) {
  console.warn("⚠ SITE_URL is still a placeholder — set the SITE_URL repo variable for a valid sitemap.");
}
