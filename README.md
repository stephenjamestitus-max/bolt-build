# The Edit — Ounass Affiliate Showcase

A self-contained, single-file luxury showcase site (`index.html`) that routes shoppers
to **Ounass** through **your** Partnerize affiliate link. No build step, no dependencies —
host it anywhere static (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

> This site is an **independent affiliate showcase**. It is intentionally *not* presented
> as the official Ounass site, and it carries a clear affiliate disclosure. Keep it that way.

---

## How this actually makes money (read this first)

Affiliate income is real, but it is **not automatic**. The chain is:

1. **You** sign up + get approved (only you can do this — see Setup below).
2. **Real people** visit this site and click a **Shop** link.
3. They make a **genuine purchase** on Ounass within the 30-day cookie window.
4. Partnerize tracks it and credits **your** commission.

The code's job is only step 2→3: make the links track correctly and convert as well as
possible. Steps 1 and "bring real traffic" are on you.

**Do NOT** try to fake clicks, stuff cookies, click your own links repeatedly, or buy bot
traffic. That is affiliate fraud — it gets your account banned and unpaid, and it's illegal.
Real traffic is the only version that works.

---

## Setup (after you're approved)

Open `index.html` and edit the config block near the bottom (`<script>`):

| Setting | What to do |
|---|---|
| `BRAND_NAME` | Your own publisher/site name. |
| `PARTNERIZE_PREFIX` | After approval, Partnerize gives you a deep link like `https://prf.hn/click/camref:1100lXXXXX/destination:` — paste everything **up to and including** `destination:`. **This is how you get paid.** |
| `OUNASS_BASE` | The storefront for your market (`https://www.ounass.ae`, `.com`, `.sa`, …). |

Until `PARTNERIZE_PREFIX` is set, every button links straight to Ounass (no commission) so
you can preview the site safely. Also double-check the category paths (`/women`, `/men`,
`/beauty`, …) against the live Ounass site and adjust if needed.

### Joining the programme (you must do this — I can't)
1. Create a **Partnerize** account with your business/publisher details.
2. Search for **“Ounass”** and submit your application.
3. On approval, generate your tracking link and complete Setup above.

---

## Optional: collect emails
The "Join the List" form is a placeholder. To collect for real, set `NEWSLETTER_ENDPOINT`
in the script to a form endpoint (e.g. Formspree) or wire it to Mailchimp / ConvertKit / Beehiiv.

---

## Roadmap / next "automation" pieces (all legitimate)
- **Content engine** — generate SEO gift-guide / brand-edit posts that embed your links.
- **Social captions** — batch-generate post copy for Instagram/TikTok/Pinterest.
- **Product feed** — render featured products from the programme's product feed.

Ask and I'll build any of these next.
