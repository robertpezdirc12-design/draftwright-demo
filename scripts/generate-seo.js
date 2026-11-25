/**
 * Generator schema.org JSON-LD (blok <script type="application/ld+json">).
 *
 * Iz ENEGA vira resnice (scripts/lib/seo-content.js + register WoodCore prek
 * scripts/lib/catalog.js + različica iz CHANGELOG.md) sestavi strojno berljive
 * strukturirane podatke za iskalnike in AI iskalnike:
 *   - SoftwareApplication (kategorija, platforma, različica, izvozi, zastonj),
 *   - HowTo (fotografija → umeritev → parametri → risba → izvoz),
 *   - FAQPage (pogosta vprašanja — ista besedila kot v llms.txt).
 *
 * Blok je v HTML-ju označen z markerjema in se generira idempotentno.
 * POZOR: po vsaki spremembi zaženi `node scripts/generate-csp.js` — inline
 * <script> (tudi ld+json) šteje v CSP hash politiko (tests/csp.test.js).
 *
 * Uporaba:  node scripts/generate-seo.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { parseChangelog } = require("./lib/changelog");
const { SITE_URL, PRODUCT, FAQ_SL, HOWTO_SL } = require("./lib/seo-content");

const ROOT = path.join(__dirname, "..");
const START = "<!-- >>> GENERATED: seo-jsonld — uredi scripts/generate-seo.js, ne to kopijo -->";
const END = "<!-- <<< END GENERATED: seo-jsonld -->";

function renderJsonLd(root) {
  const v = parseChangelog(root || ROOT).latest;
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: PRODUCT.name,
      alternateName: PRODUCT.alternateName,
      description: PRODUCT.descriptionSL,
      url: SITE_URL + "/",
      downloadUrl: PRODUCT.downloadUrl,
      applicationCategory: PRODUCT.category,
      applicationSubCategory: PRODUCT.subCategory,
      operatingSystem: PRODUCT.operatingSystem,
      applicationSuite: PRODUCT.applicationSuite,
      softwareVersion: v.version,
      datePublished: v.date,
      offers: { "@type": "Offer", price: PRODUCT.price, priceCurrency: PRODUCT.priceCurrency },
      license: "https://spdx.org/licenses/MIT.html",
      isAccessibleForFree: true,
      screenshot: PRODUCT.screenshot,
      featureList: PRODUCT.featuresSL,
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: HOWTO_SL.name,
      description: HOWTO_SL.description,
      step: HOWTO_SL.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_SL.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
}

function renderBlock(root) {
  /* zaščita pred </script> v besedilu — enak vzorec kot StructuredData.jsx (soma) */
  const esc = (obj) => JSON.stringify(obj, null, 2).replace(/</g, "\\u003c");
  const json = esc(renderJsonLd(root));
  /* vgrajeni CHANGELOG snapshot (vzor fetch-github iz soma — brez runtime omrežja):
     aplikacija »Kaj je novega« prikaže zapiski zadnje izdaje iz istega vira kot JSON-LD */
  const v = parseChangelog(root || ROOT).latest;
  const release = esc({ version: v.version, date: v.date, notes: v.notes });
  return START + "\n<script type=\"application/ld+json\">" + json + "</script>\n" +
    "<script>var DW_RELEASE=" + release + ";</script>\n" + END;
}

function installBlock(root) {
  const r = root || ROOT;
  const htmlPath = path.join(r, "tehnicka-risba-pro.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  const block = renderBlock(r);
  let next;
  if (html.indexOf(START) >= 0 && html.indexOf(END) > html.indexOf(START)) {
    const re = new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]*?" + END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    next = html.replace(re, block);
  } else {
    /* prva vgradnja: blok gre za <title> v <head> */
    next = html.replace(/(<title>[^<]*<\/title>\n)/, "$1" + block + "\n");
    if (next === html) throw new Error("generate-seo: ni najdenega <title> za vstavitev JSON-LD bloka.");
  }
  if (next !== html) fs.writeFileSync(htmlPath, next, "utf8");
  return next !== html;
}

if (require.main === module) {
  const changed = installBlock(ROOT);
  console.log("seo-jsonld blok " + (changed ? "posodobljen" : "že aktualen") + " v tehnicka-risba-pro.html.");
  console.log("Ne pozabi: node scripts/generate-csp.js (ld+json šteje v CSP hash politiko).");
}

module.exports = { renderJsonLd, renderBlock, installBlock, START, END };
