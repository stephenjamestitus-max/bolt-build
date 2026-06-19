/* =========================================================================
   ⚙️  AFFILIATE CONFIG — single source of truth for the whole site
   =========================================================================
   Edit these three values once and every page (home, journal, every generated
   article) updates automatically.

   STEP A — BRAND_NAME
     Your own publisher/site name. This site is YOURS (an affiliate showcase);
     it is intentionally NOT presented as the official Ounass site.

   STEP B — PARTNERIZE_PREFIX  (this is how you get paid)
     After approval, Partnerize gives you a tracking deep-link that looks like:
         https://prf.hn/click/camref:1100lXXXXX/destination:
     Copy everything UP TO AND INCLUDING "destination:" and paste it below.
     Every "Shop" link then routes shoppers to Ounass through YOUR link, so
     qualifying sales are tracked (30-day cookie) and credited to your account.

   STEP C — OUNASS_BASE
     The storefront for the market you promote (.ae / .com / .sa …).

   Until a real PARTNERIZE_PREFIX is set, links go straight to Ounass
   (NO commission) so you can preview the site safely.
   ========================================================================= */
const BRAND_NAME        = "The Edit";
const PARTNERIZE_PREFIX = "PASTE_YOUR_PARTNERIZE_CLICK_PREFIX_HERE";
const OUNASS_BASE       = "https://www.ounass.ae";

/* ---- wiring (no need to edit below) ---- */
function shopUrl(path){
  const dest = OUNASS_BASE + path;
  if (PARTNERIZE_PREFIX.indexOf("PASTE_") === 0) return dest;   // not configured yet
  return PARTNERIZE_PREFIX + encodeURIComponent(dest);          // tracked link
}

document.addEventListener("DOMContentLoaded", function(){
  // Brand name everywhere
  document.querySelectorAll("[data-brand]").forEach(function(el){ el.textContent = BRAND_NAME; });

  // Turn every [data-shop] into a tracked, SEO-correct affiliate link
  document.querySelectorAll("[data-shop]").forEach(function(a){
    a.href = shopUrl(a.getAttribute("data-shop"));
    a.target = "_blank";
    a.rel = "sponsored noopener";   // 'sponsored' is Google's recommended rel for affiliate links
  });

  // Current year
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  // Newsletter — placeholder handler. Set NEWSLETTER_ENDPOINT to a form/ESP
  // endpoint (Formspree / Mailchimp / ConvertKit / Beehiiv) to collect for real.
  var NEWSLETTER_ENDPOINT = ""; // e.g. "https://formspree.io/f/xxxxxxx"
  var form = document.getElementById("newsForm");
  if (form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var email = (document.getElementById("newsEmail")||{}).value || "";
      email = email.trim();
      var ok = document.getElementById("newsOk");
      if (!email) return;
      if (NEWSLETTER_ENDPOINT){
        fetch(NEWSLETTER_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:email})})
          .then(function(){ ok.textContent = "Thank you — you're on the list."; form.reset(); })
          .catch(function(){ ok.textContent = "Something went wrong. Please try again."; });
      } else {
        ok.textContent = "Thanks! (Connect a NEWSLETTER_ENDPOINT in affiliate.js to start collecting emails.)";
        form.reset();
      }
    });
  }
});
