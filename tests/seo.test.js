/**
 * schema.org JSON-LD (scripts/generate-seo.js) — strukturirani podatki aplikacije.
 *
 * Pokritje:
 *   - blok je v <head> označen z markerjema in se ujema z generatorjem (drift gate);
 *   - JSON je veljaven, vsebuje SoftwareApplication + HowTo + FAQPage;
 *   - SoftwareApplication: različica in datum iz CHANGELOG snapshot, licence, ponudba;
 *   - HowTo in FAQPage sta iz ENEGA vira (scripts/lib/seo-content.js) — brez drift-a;
 *   - FAQ odgovori so ZASIDRANI v vsebini aplikacije (ključni fragmenti se pojavijo
 *     v HTML-ju — odgovori niso izmišljeni, temveč povzeti iz kataloga/opozoril);
 *   - APP_VERSION in »Kaj je novega« sta usklajena z CHANGELOG (snapshot različice);
 *   - blok ne vsebuje mailto:/zunanjih href/src (egress politika).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const html = read("tehnicka-risba-pro.html");

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log("  [PASS] " + name + (info ? " — " + info : "")); }
  else { fail++; console.error("  [FAIL] " + name + (info ? " — " + info : "")); }
}

let gen = null, genErr = null;
try { gen = require(path.join(root, "scripts", "generate-seo.js")); }
catch (e) { genErr = String(e && e.message || e); }
check("scripts/generate-seo.js se naloži", !!gen, genErr || "");

/* ---------- blok v HTML-ju + drift gate ---------- */
const start = "<!-- >>> GENERATED: seo-jsonld";
const end = "<!-- <<< END GENERATED: seo-jsonld -->";
const si = html.indexOf(start), ei = html.indexOf(end);
check("blok seo-jsonld obstaja v <head> (markerja v redu)", si >= 0 && ei > si && si < html.indexOf("</head>"));
let block = null;
if (si >= 0 && ei > si) block = html.slice(si, ei + end.length);
check("blok se ujema z generatorjem (drift gate)",
  !!gen && !!block && block === gen.renderBlock(root),
  block && gen && block !== gen.renderBlock(root) ? "se razlikuje — poženi: node scripts/generate-seo.js && node scripts/generate-csp.js" : "");

/* ---------- JSON parse + struktura ---------- */
let data = null, parseErr = null;
if (block) {
  const m = block.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  try { data = m ? JSON.parse(m[1]) : null; } catch (e) { parseErr = String(e && e.message || e); }
  if (!m) parseErr = "script type=application/ld+json ni najden v bloku";
}
check("JSON-LD se parsira", Array.isArray(data), parseErr || "");
const byType = (t) => (Array.isArray(data) ? data.find((o) => o && o["@type"] === t) : null);
const app = byType("SoftwareApplication"), howto = byType("HowTo"), faq = byType("FAQPage");
check("vsebuje SoftwareApplication, HowTo in FAQPage", !!app && !!howto && !!faq);
check("vsak objekt ima @context schema.org",
  !!app && !!howto && !!faq && [app, howto, faq].every((o) => o["@context"] === "https://schema.org"));

/* ---------- SoftwareApplication ---------- */
const { parseChangelog } = require(path.join(root, "scripts", "lib", "changelog.js"));
const ver = parseChangelog(root).latest;
check("softwareVersion/datePublished = CHANGELOG snapshot",
  !!app && app.softwareVersion === ver.version && app.datePublished === ver.date,
  ver.version + " (" + ver.date + ")");
check("kategorija in platforma", !!app && app.applicationCategory === "DesignApplication" && /Web \(PWA\)/.test(app.operatingSystem));
check("ponudba: zastonj (0 EUR), MIT licenca, dostopno brez plačila",
  !!app && app.offers && app.offers.price === "0" && app.offers.priceCurrency === "EUR" &&
  /MIT/.test(app.license || "") && app.isAccessibleForFree === true);
check("featureList iz seo-content (en vir resnice)",
  !!app && Array.isArray(app.featureList) && app.featureList.length >= 5 &&
  JSON.stringify(app.featureList) === JSON.stringify(require(path.join(root, "scripts", "lib", "seo-content.js")).PRODUCT.featuresSL));
check("absolutni URL-ji (url/downloadUrl/screenshot) iz SITE_URL",
  !!app && [app.url, app.downloadUrl, app.screenshot].every((u) => typeof u === "string" && /^https?:\/\/[^/]+\//.test(u)));

/* ---------- HowTo (en vir resnice) ---------- */
const { HOWTO_SL, FAQ_SL } = require(path.join(root, "scripts", "lib", "seo-content.js"));
check("HowTo koraki so iz seo-content (5 korakov, zaporedje 1..5)",
  !!howto && Array.isArray(howto.step) && howto.step.length === HOWTO_SL.steps.length &&
  howto.step.every((s, i) => s["@type"] === "HowToStep" && s.position === i + 1 &&
    s.name === HOWTO_SL.steps[i].name && s.text === HOWTO_SL.steps[i].text));

/* ---------- FAQPage (en vir resnice + zasidranost v aplikaciji) ---------- */
check("FAQPage je iz seo-content (" + FAQ_SL.length + " vprašanj, brez drift-a)",
  !!faq && Array.isArray(faq.mainEntity) && faq.mainEntity.length === FAQ_SL.length &&
  faq.mainEntity.every((q, i) => q["@type"] === "Question" && q.name === FAQ_SL[i].q &&
    q.acceptedAnswer && q.acceptedAnswer["@type"] === "Answer" && q.acceptedAnswer.text === FAQ_SL[i].a));

/* Zasidranost: vsak odgovor mora temeljiti na vsebini aplikacije —
   za vsako vprašanje mora biti ključni fragment odgovora prisoten v HTML-ju. */
const GROUNDING = [
  "67 × 26 × 5800", "orientacijske narave in niso pogodbena dokumenta", "150–180 cm",
  "montaža brez alu cevi ni mogoča", "manjša od vijaka", "WEPOS", "ne upošteva", "15 let",
];
check("FAQ odgovori so zasidrani v vsebini aplikacije (fragmenti v HTML-ju)",
  FAQ_SL.length === GROUNDING.length && GROUNDING.every((g) => html.indexOf(g) >= 0),
  GROUNDING.filter((g) => html.indexOf(g) < 0).join(" | "));
check("FAQ odgovori so samostojni (brez povezav/mailto/sklicev)",
  FAQ_SL.every((f) => !/https?:\/\/|mailto:|kot zgoraj|glej spodaj/i.test(f.a)));

/* ---------- FAQ na strani (<details>) + EN pariteta ---------- */
const { FAQ_EN } = require(path.join(root, "scripts", "lib", "seo-content.js"));
const detailsCount = (html.match(/<details class="faq-item">/g) || []).length;
check("FAQ sekcija na strani: 8 <details> z summary/odgovorom", detailsCount === FAQ_SL.length, "details: " + detailsCount);
check("FAQ SL besedila na strani so iz seo-content (en vir resnice)", FAQ_SL.every((f, i) =>
  html.indexOf('data-i18n="faq_q' + (i + 1) + '"') >= 0 && html.indexOf(f.q) >= 0 &&
  html.indexOf('data-i18n="faq_a' + (i + 1) + '"') >= 0 && html.indexOf(f.a) >= 0));
const langEnMatch2 = html.match(/var LANG_EN=\{[\s\S]*?\n\};/);
let langEnObj = {};
if (langEnMatch2) {
  try { const sandbox = {}; require("vm").runInNewContext(langEnMatch2[0], sandbox); langEnObj = sandbox.LANG_EN || {}; }
  catch (e) { langEnObj = {}; }
}
check("FAQ EN besedila v LANG_EN so iz seo-content (pariteta)",
  langEnObj.faq_h && langEnObj.faq_i && FAQ_EN.every((f, i) =>
    langEnObj["faq_q" + (i + 1)] === f.q && langEnObj["faq_a" + (i + 1)] === f.a));

/* ---------- vgrajeni CHANGELOG snapshot (DW_RELEASE) ---------- */
if (block) {
  const m = block.match(/<script>var DW_RELEASE=([\s\S]*?)<\/script>/);
  let rel = null;
  try { rel = m ? JSON.parse(m[1].replace(/;\s*$/, "")) : null; } catch (e) { rel = null; }
  check("DW_RELEASE je v generiranem bloku in se parsira", !!rel);
  check("DW_RELEASE = CHANGELOG snapshot (verzija, datum, zapiski)",
    !!rel && rel.version === ver.version && rel.date === ver.date && Array.isArray(rel.notes) && rel.notes.length > 0,
    rel ? rel.version + ": " + (rel.notes ? rel.notes.length + " zapisov" : "/") : "");
  check("zapiski DW_RELEASE brez markdown okraskov (pripravljeno za prikaz)",
    !!rel && Array.isArray(rel.notes) && rel.notes.every((t) => !/\*\*|`/.test(t)));
}
check("renderWhatsNew prikaže DW_RELEASE (vgrajeni snapshot)", html.indexOf("DW_RELEASE.version") >= 0 && html.indexOf("Najnovejša izdaja") >= 0);

/* ---------- CSP: ld+json šteje v hash politiko ---------- */
const policy = (html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/) || [])[1] || "";
if (block) {
  const m = block.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const sha = "'sha256-" + crypto.createHash("sha256").update(m ? m[1] : "", "utf8").digest("base64") + "'";
  check("CSP politika vsebuje hash ld+json bloka", policy.indexOf(sha) >= 0,
    policy.indexOf(sha) < 0 ? "poženi: node scripts/generate-csp.js" : "");
}

/* ---------- egress ---------- */
check("blok brez mailto: in brez zunanjih href/src", !!block &&
  block.indexOf("mailto:") < 0 && !/(href|src)\s*=/.test(block));

/* ---------- snapshot različice: APP_VERSION + »Kaj je novega« ↔ CHANGELOG ---------- */
const av = (html.match(/APP_VERSION="([^"]*)"/) || [])[1];
check("APP_VERSION je določen", !!av, av || "manjka");
check("APP_VERSION je osnova CHANGELOG različice (" + ver.version + ")",
  !!av && ver.version.indexOf(av) === 0, av + " ⊂ " + ver.version);
const wn = (html.match(/var WHATS_NEW=\[([\s\S]*?)\n\];/) || [])[1] || "";
const wnVersions = [...wn.matchAll(/\["([^"]+)"/g)].map((m) => m[1]);
const clVersions = parseChangelog(root).entries.map((e) => e.version);
check("»Kaj je novega«: zapisi so iz CHANGELOG snapshot (oznake različic obstajajo)",
  wnVersions.length > 0 && wnVersions.every((v) => clVersions.some((c) => c.indexOf(v) === 0)),
  wnVersions.join(", "));
check("»Kaj je novega«: prvi zapis je zadnja CHANGELOG različica",
  wnVersions.length > 0 && ver.version.indexOf(wnVersions[0]) === 0);

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
