/**
 * Vsebinski gate (vzor: soma-website check-legal/check-community).
 *
 * Pred objavo preveri, da vsebinski artefakti aplikacije niso razpadli:
 *   1) register WoodCore prestane validateRegistry() (shema iz js/registry.js);
 *   2) vse slike, na katere se sklicuje HTML, obstajajo na disku;
 *   3) vse datoteke v SW_ASSETS (sw.js) obstajajo na disku (offline vsebina);
 *   4) pariteta i18n: vsak ključ data-i18n ima prevod v LANG_EN;
 *   5) kontaktni/EULA/opozorila registra niso prazna ali "TODO";
 *   6) število testnih surov v package.json se ujema z README;
 *   7) generirana artefakta llms.txt / llms.en.txt in seo-jsonld blok sta sveža.
 *
 * Vzor vedenja (kot soma): lokalno izpiše probleme in pade, v CI enako —
 * `npm test` je naš prebuild, zato mora gate veljati vedno.
 *
 * Uporaba:  node scripts/check-content.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

function checkContent(root, inject) {
  const r = root || ROOT;
  const opt = inject || {};
  const read = (f) => fs.readFileSync(path.join(r, f), "utf8");
  const problems = [];

  const html = opt.html !== undefined ? opt.html : read("tehnicka-risba-pro.html");
  const sw = opt.sw !== undefined ? opt.sw : read("sw.js");
  const pkg = opt.pkg !== undefined ? opt.pkg : read("package.json");
  const readme = opt.readme !== undefined ? opt.readme : read("README.md");

  /* 1) register WoodCore */
  try {
    const { loadCatalog } = require("./lib/catalog");
    const cat = loadCatalog(r);
    const regProblems = cat.validateRegistry(cat.woodcoreRegistry());
    regProblems.forEach((p) => problems.push("register: " + p));
  } catch (e) {
    problems.push("register: nalaganje ni uspelo — " + (e && e.message || e));
  }

  /* 2) slike v HTML-ju (statični src in nizi v JS) */
  const imgRefs = [...new Set([...html.matchAll(/slike\/[A-Za-z0-9_\-./]+\.(?:jpg|jpeg|png|webp|jfif)/g)].map((m) => m[0]))];
  for (const ref of imgRefs) {
    if (!fs.existsSync(path.join(r, ref))) problems.push("slika iz HTML ne obstaja: " + ref);
  }

  /* 3) SW_ASSETS */
  const swMatch = sw.match(/var SW_ASSETS\s*=\s*\[([^\]]*)\]/);
  if (!swMatch) problems.push("sw.js: SW_ASSETS ni najden");
  else {
    const assets = [...swMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    if (!assets.length) problems.push("sw.js: SW_ASSETS je prazen");
    for (const a of assets) {
      const rel = a.replace(/^\.\//, "");
      if (!rel) continue; /* "./" je sama aplikacija */
      if (!fs.existsSync(path.join(r, rel))) problems.push("SW_ASSETS: datoteka ne obstaja: " + a);
    }
  }

  /* 4) i18n pariteta: data-i18n ↔ LANG_EN (samo statični ključi; dinamični nizi v JS, npr. "'+r.cap+'", so izločeni) */
  const i18nKeys = [...new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]))]
    .filter((k) => /^[a-z][a-z0-9_]*$/i.test(k));
  const langEnMatch = html.match(/var LANG_EN=\{[\s\S]*?\n\};/);
  let langEn = {};
  if (!langEnMatch) problems.push("i18n: LANG_EN ni najden");
  else {
    try { vm.runInNewContext(langEnMatch[0], (langEn = {})); langEn = langEn.LANG_EN || {}; }
    catch (e) { problems.push("i18n: LANGEn se ne parsira — " + (e && e.message || e)); }
  }
  for (const k of i18nKeys) {
    if (!langEn[k]) problems.push("i18n: ključ data-i18n '" + k + "' nima prevoda v LANG_EN");
  }

  /* 5) kontaktni/EULA/opozorila */
  try {
    const { loadCatalog } = require("./lib/catalog");
    const k = loadCatalog(r).woodcoreRegistry().kontaktni;
    const fields = [["dopisatelj", k.dopisatelj], ["pogoji", k.pogoji], ["garancija", k.garancija], ["eula", k.eula]];
    for (const [name, val] of fields) {
      if (!val || !String(val).trim()) problems.push("kontaktni: prazno polje " + name);
      else if (/TODO/i.test(String(val))) problems.push("kontaktni: polje " + name + " vsebuje TODO");
    }
    if (!Array.isArray(k.opozorila) || !k.opozorila.length) problems.push("kontaktni: opozorila so prazna");
    else k.opozorila.forEach((o, i) => {
      if (!o || !String(o).trim()) problems.push("kontaktni: opozorilo " + i + " je prazno");
      else if (/TODO/i.test(String(o))) problems.push("kontaktni: opozorilo " + i + " vsebuje TODO");
    });
  } catch (e) { /* že zajeto v 1) */ }

  /* 6) število surov: package.json ↔ README */
  const suites = (pkg.match(/node tests\/[a-z0-9\-]+\.test\.js/g) || []).length;
  if (!suites) problems.push("package.json: test skripta ne vsebuje nobene suite");
  const claims = [...readme.matchAll(/(\d+)\s+(?:testnih\s+)?surov(?:ov|a|e|)?/g)].map((m) => ({ n: Number(m[1]), at: m[0] }));
  if (!claims.length) problems.push("README: ni najdenega zapisa o številu surov");
  for (const c of claims) {
    if (c.n !== suites) problems.push("README: '" + c.at + "' ne ustreza dejanskemu številu surov v package.json (" + suites + ")");
  }

  /* 7) generirani artefakti so sveži (drift gate kot pri CSP) */
  try {
    const { renderLLMS } = require("./generate-llms");
    const out = renderLLMS(r);
    for (const [file, text] of Object.entries(out)) {
      const p = path.join(r, file);
      if (!fs.existsSync(p)) problems.push(file + " manjka — poženi: node scripts/generate-llms.js");
      else if (fs.readFileSync(p, "utf8") !== text) problems.push(file + " ni svež — poženi: node scripts/generate-llms.js");
    }
  } catch (e) { problems.push("llms: generator ni uspel — " + (e && e.message || e)); }
  try {
    const { renderBlock } = require("./generate-seo");
    const block = renderBlock(r);
    const si = html.indexOf("<!-- >>> GENERATED: seo-jsonld"), ei = html.indexOf("<!-- <<< END GENERATED: seo-jsonld -->");
    if (si < 0 || ei < si) problems.push("seo-jsonld blok manjka v HTML — poženi: node scripts/generate-seo.js");
    else if (html.slice(si, ei + "<!-- <<< END GENERATED: seo-jsonld -->".length) !== block)
      problems.push("seo-jsonld blok ni svež — poženi: node scripts/generate-seo.js && node scripts/generate-csp.js");
  } catch (e) { problems.push("seo: generator ni uspel — " + (e && e.message || e)); }

  return problems;
}

if (require.main === module) {
  const problems = checkContent(ROOT);
  if (problems.length) {
    console.error("Vsebinski gate: " + problems.length + " problemov:");
    problems.forEach((p) => console.error("  - " + p));
    process.exit(1);
  }
  console.log("Vsebinski gate: brez problemov.");
}

module.exports = { checkContent };
