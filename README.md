# The Edit — Ounass Affiliate Site + Claude Content Engine

A self-contained luxury affiliate **showcase site** that routes shoppers to **Ounass**
through *your* Partnerize link, plus a **Claude-powered GitHub automation** that writes a
new SEO article on a schedule and publishes it for you — running while you're offline.

No build step, no dependencies. Host the static files anywhere (GitHub Pages, Netlify,
Vercel, Cloudflare Pages).

> This is an **independent affiliate showcase** — intentionally *not* presented as the
> official Ounass site, and it carries a clear affiliate disclosure. Keep it that way.

---

## How this actually makes money (read first)

Affiliate income is real but **not automatic**, and **the automation does not change that.**

1. **You** sign up + get approved on Partnerize (only you can do this).
2. **Real people** visit and click a **Shop** link.
3. They make a **genuine purchase** on Ounass within the 30-day cookie window.
4. Partnerize credits **your** commission.

The automation runs **step "make content"** while you sleep. It does **not** run **step
"get visitors"** — that distribution is the irreducible human part (≈15 min on the days
you're around: posting/pinning the new articles, being a real person in a couple of GCC
communities). An automated site with no distribution gets seen by nobody.

**Never** fake clicks, stuff cookies, click your own links, or buy bot traffic — that's
fraud, it gets you banned and unpaid, and it's illegal.

---

## What's in here

| File | Purpose |
|---|---|
| `index.html` | Luxury landing/showcase page |
| `journal.html` | Auto-generated list of articles (regenerated each run) |
| `posts/` | Generated article pages |
| `styles.css` | Shared styling for every page |
| `affiliate.js` | **One place** to set your brand + tracking link (used by every page) |
| `scripts/generate-post.mjs` | The Claude content engine (Node, no deps) |
| `.github/workflows/content.yml` | Scheduled job: write a post → commit it back |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages |
| `sitemap.xml`, `robots.txt`, `posts.json` | SEO + post manifest (auto-maintained) |

---

## Setup

### 1) Wire your affiliate link (after Partnerize approval)
Edit the three values at the top of **`affiliate.js`** — they propagate to every page:

| Setting | What to do |
|---|---|
| `BRAND_NAME` | Your own site name |
| `PARTNERIZE_PREFIX` | Paste your Partnerize deep-link prefix (everything up to and including `destination:`). **This is how you get paid.** |
| `OUNASS_BASE` | Your market's storefront (`https://www.ounass.ae`, `.com`, `.sa`…) |

Until the prefix is set, links go straight to Ounass (no commission) so you can preview.

### 2) Turn on the Claude content automation
1. Get an Anthropic API key: <https://console.anthropic.com>.
2. Repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `ANTHROPIC_API_KEY` — Value: your key.
3. *(Optional)* add repo **Variables** (same screen): `SITE_URL` (your live domain, for the
   sitemap), `BRAND_NAME`, and `CLAUDE_MODEL`.
4. Test it now: **Actions → "Generate content" → Run workflow**. It writes a post, commits
   it, and the journal/sitemap update automatically.

**Cadence & cost:** default is Mon & Thu (`content.yml` cron). Each article is a few US
cents on `claude-opus-4-8` (the default). To cut cost, set the `CLAUDE_MODEL` variable to
`claude-sonnet-4-6` or `claude-haiku-4-5`.

> ⚠️ **Scheduled runs only fire from the repo's _default_ branch** (a GitHub rule). This is
> on a feature branch, so the cron won't fire until you merge it to the default branch (or
> make this the default). Until then, use **Run workflow** to trigger it manually.

### 3) Publish the site (GitHub Pages)
**Settings → Pages → Source = "GitHub Actions"**, then push (or run the "Deploy site"
workflow). Pages deploys from the default branch by default — merge there, or adjust the
branch in `deploy.yml` / your Pages settings.

---

## Collecting emails (optional)
The "Join the List" form is a placeholder. Set `NEWSLETTER_ENDPOINT` in `affiliate.js` to a
form endpoint (Formspree) or wire it to Mailchimp / ConvertKit / Beehiiv.

---

## The honest roadmap
- **Distribution** is the lever that turns published posts into clicks — Pinterest (fastest
  organic channel from zero), 2–3 GCC communities, and your own network.
- Want more automation I can build next: batch social-caption generation, a Pinterest-ready
  image/pin template, or rendering live products from the programme's product feed.
