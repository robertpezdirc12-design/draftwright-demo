/**
 * Vsebinski gate (scripts/check-content.js) — samoprevera artefaktov pred objavo.
 *
 * Pokritje:
 *   - na resničnem repozitoriju gate ne najde nobenega problema (vse zeleno);
 *   - negativni dokazi z vbrizganimi okvarami (injekcija v spremenljivke) padejo
 *     ČISTO: manjkajoča datoteka SW_ASSETS, manjkajoča slika, manjkajoč i18n ključ
 *   - in napačen README števec surov — vsak sproži svoj opis problemov;
 *   - register WoodCore prestane validateRegistry() (shema js/registry.js).
 */
"use strict";
const path = require("path");

const root = path.join(__dirname, "..");
const fs = require("fs");

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log("  [PASS] " + name + (info ? " — " + info : "")); }
  else { fail++; console.error("  [FAIL] " + name + (info ? " — " + info : "")); }
}

let checkContent = null, loadErr = null;
try { ({ checkContent } = require(path.join(root, "scripts", "check-content.js"))); }
catch (e) { loadErr = String(e && e.message || e); }
check("scripts/check-content.js se naloži", !!checkContent, loadErr || "");

/* ---------- pozitivni tek na resničnem repozitoriju ---------- */
let problems = [];
if (checkContent) {
  try { problems = checkContent(root); }
  catch (e) { problems = ["checkContent je padel: " + (e && e.message || e)]; }
}
check("vsebinski gate na repozitoriju je brez problemov", problems.length === 0, problems.join(" | "));

/* ---------- register (shema iz js/registry.js) ---------- */
try {
  const { loadCatalog } = require(path.join(root, "scripts", "lib", "catalog.js"));
  const cat = loadCatalog(root);
  check("validateRegistry(woodcoreRegistry()) → brez napak", cat.validateRegistry(cat.woodcoreRegistry()).length === 0);
  check("register vsebuje vse profile WoodCore", Object.keys(cat.WC).length >= 6);
} catch (e) {
  check("register se naloži in validira", false, String(e && e.message || e));
}

/* ---------- negativni dokazi (vbrizgane okvare) ---------- */
if (checkContent) {
  const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
  const html = read("tehnicka-risba-pro.html");
  const sw = read("sw.js");
  const readme = read("README.md");

  /* manjkajoča datoteka v SW_ASSETS */
  const swBroken = sw.replace('"./print.css"', '"./ne-obstaja.css"');
  const swProblems = checkContent(root, { sw: swBroken });
  check("okvara: SW_ASSETS z neobstoječo datoteko → zaznano",
    swProblems.some((p) => p.indexOf("SW_ASSETS") >= 0 && p.indexOf("ne-obstaja") >= 0));

  /* okvara: HTML se sklicuje na manjkajočo sliko */
  const imgProblems = checkContent(root, { html: html + "\n<img src=\"slike/pokoncna/ne-obstaja.jpg\">" });
  check("okvara: HTML z neobstoječo sliko → zaznano",
    imgProblems.some((p) => p.indexOf("ne-obstaja.jpg") >= 0));

  /* okvara: data-i18n ključ brez prevoda v LANG_EN (zamenjava prvega statičnega ključa) */
  const i18nProblems = checkContent(root, { html: html.replace(/data-i18n="([a-z][a-z0-9_]*)"/, 'data-i18n="zz_ni_prevoda"') });
  check("okvara: data-i18n ključ brez prevoda → zaznano",
    i18nProblems.some((p) => p.indexOf("zz_ni_prevoda") >= 0));

  /* okvara: README števec surov ne ustreza */
  const readmeProblems = checkContent(root, { readme: readme.replace(/\d+ testnih surov/, "66 testnih surov") });
  check("okvara: README števec surov ne ustreza → zaznano",
    readmeProblems.some((p) => p.indexOf("66 testnih surov") >= 0));

  /* okvara: generiran llms.txt zastarel (drift gate) */
  const llmsPath = path.join(root, "llms.txt");
  const original = fs.readFileSync(llmsPath, "utf8");
  try {
    fs.writeFileSync(llmsPath, original + "\n# zastarelo\n", "utf8");
    const p2 = checkContent(root);
    check("okvara: zastarel llms.txt → zaznano (drift gate)",
      p2.some((p) => p.indexOf("llms.txt") >= 0 && p.indexOf("svež") >= 0));
  } finally {
    fs.writeFileSync(llmsPath, original, "utf8");
  }
  /* okvara: odstranjen seo-jsonld blok */
  const noBlock = html.replace(/<!-- >>> GENERATED: seo-jsonld[\s\S]*?<!-- <<< END GENERATED: seo-jsonld -->/, "");
  const seoProblems = checkContent(root, { html: noBlock });
  check("okvara: odstranjen seo-jsonld blok → zaznano",
    seoProblems.some((p) => p.indexOf("seo-jsonld") >= 0));
}

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
