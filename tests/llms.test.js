/**
 * llms.txt / llms.en.txt (llmstxt.org) — strojno berljiva predstavitev aplikacije.
 *
 * Pokritje:
 *   - generator iz ENEGA vira (register WoodCore + seo-content + CHANGELOG) sestavi
 *     obe datoteki; vsebinska ujemanja z registrom (profili, mere, omejitve, palete);
 *   - drift gate: commitirani datoteki se morata ujemati z regeneriranimi (kot CSP);
 *   - struktura po llmstxt.org (H1, opis, ## sekcije), FAQ v obeh jezikih;
 *   - odgovori FAQ so samostojni (brez povezav, brez sklicev "kot zgoraj");
 *   - info@roksal.com je navadno besedilo (brez mailto:), kar spoštuje egress politiko;
 *   - determinizem: dve generiranji vrneta identično vsebino.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log("  [PASS] " + name + (info ? " — " + info : "")); }
  else { fail++; console.error("  [FAIL] " + name + (info ? " — " + info : "")); }
}

let renderLLMS = null, loadErr = null;
try { ({ renderLLMS } = require(path.join(root, "scripts", "generate-llms.js"))); }
catch (e) { loadErr = String(e && e.message || e); }
check("scripts/generate-llms.js se naloži", !!renderLLMS, loadErr || "");

let out = null, genErr = null;
if (renderLLMS) {
  try { out = renderLLMS(root); } catch (e) { genErr = String(e && e.message || e); }
}
check("renderLLMS() vrne llms.txt in llms.en.txt brez napake", !!out && !!out["llms.txt"] && !!out["llms.en.txt"], genErr || "");

const sl = out ? out["llms.txt"] : "";
const en = out ? out["llms.en.txt"] : "";

/* ---------- obstoj + drift gate ---------- */
const committedSL = fs.existsSync(path.join(root, "llms.txt")) ? read("llms.txt") : null;
const committedEN = fs.existsSync(path.join(root, "llms.en.txt")) ? read("llms.en.txt") : null;
check("llms.txt obstaja v repozitoriju", committedSL !== null);
check("llms.en.txt obstaja v repozitoriju", committedEN !== null);
check("llms.txt je svež (brez drift-a z generatorjem)", !!sl && committedSL === sl,
  committedSL === null ? "manjka" : (committedSL === sl ? "" : "se razlikuje — poženi: node scripts/generate-llms.js"));
check("llms.en.txt je svež (brez drift-a z generatorjem)", !!en && committedEN === en,
  committedEN === null ? "manjka" : (committedEN === en ? "" : "se razlikuje — poženi: node scripts/generate-llms.js"));
check("dve generiranji vrneta identično vsebino (determinizem)",
  !!renderLLMS && (() => { try { const b = renderLLMS(root); return b["llms.txt"] === sl && b["llms.en.txt"] === en; } catch (e) { return false; } })());

/* ---------- struktura (llmstxt.org) ---------- */
function structure(text, labels) {
  return text.startsWith("# Tehnična risba PRO\n") &&
    labels.every((s) => text.indexOf("## " + s) >= 0) &&
    text.indexOf("> ") > 0;
}
check("SL: H1, opis (>) in vse ## sekcije",
  structure(sl, ["Zmogljivosti", "Profili WoodCore WPC", "Dilatacijske reže", "Pogosta vprašanja", "Opozorila in pravne opombe", "Viri"]));
check("EN: H1, opis (>) in vse ## sekcije",
  structure(en, ["Features", "WoodCore WPC profiles", "Expansion gaps", "Frequently asked questions", "Warnings and legal notes", "Sources"]));

/* ---------- vsebina iz registra (en vir resnice) ---------- */
const REG = require(path.join(root, "scripts", "lib", "catalog.js")).loadCatalog(root);
const profileNames = Object.keys(REG.WC).map((k) => REG.WC[k].n);
check("vsi profili iz registra so v SL", profileNames.every((n) => sl.indexOf(n) >= 0), profileNames.join(", "));
check("vsi profili iz registra so v EN", profileNames.every((n) => en.indexOf(n) >= 0));
check("SL: mere POLNA-128 z decimalno vejico (16,5)", sl.indexOf("128 × 16,5 × 2200") >= 0);
check("EN: mere POLNA-128 s piko (16.5)", en.indexOf("128 × 16.5 × 2200") >= 0);
check("SL: katalogske omejitve (1450/1800/1500 mm)", ["1450", "1800", "1500"].every((v) => sl.indexOf(v) >= 0));
check("obvezna alu cev pri ROMB v obeh jezikih",
  sl.indexOf("montaža brez alu cevi ni mogoča") >= 0 && en.indexOf("mounting without the aluminium tube is not possible") >= 0);
check("dilatacijska tabela: vseh 13 temperatur v obeh jezikih",
  REG.DIL.temps.every((t) => sl.indexOf("| " + t + " |") >= 0 && en.indexOf("| " + t + " |") >= 0));
check("kontaktni podatki iz registra (Roksal, garancija 15 let)",
  sl.indexOf("Roksal d.o.o.") >= 0 && sl.indexOf("15 let") >= 0 && en.indexOf("15 years") >= 0);

/* ---------- FAQ ---------- */
const FAQ_SL = require(path.join(root, "scripts", "lib", "seo-content.js")).FAQ_SL;
const FAQ_EN = require(path.join(root, "scripts", "lib", "seo-content.js")).FAQ_EN;
check("FAQ SL: vseh " + FAQ_SL.length + " vprašanj v llms.txt", FAQ_SL.every((f) => sl.indexOf("### " + f.q) >= 0 && sl.indexOf(f.a) >= 0));
check("FAQ EN: vseh " + FAQ_EN.length + " vprašanj v llms.en.txt", FAQ_EN.every((f) => en.indexOf("### " + f.q) >= 0 && en.indexOf(f.a) >= 0));
const selfContained = (faq) => faq.every((f) => f.q && f.a && f.a.length > 40 &&
  !/https?:\/\//.test(f.a) && !/mailto:/.test(f.a) && !/(kot zgoraj|glej spodaj|glej zgoraj|as above|see below|see above)/i.test(f.a));
check("FAQ odgovori so samostojni (brez povezav in sklicev)", selfContained(FAQ_SL) && selfContained(FAQ_EN));

/* ---------- egress/privzeto ---------- */
check("brez mailto: povezav (info@roksal.com kot besedilo)",
  sl.indexOf("mailto:") < 0 && en.indexOf("mailto:") < 0 && sl.indexOf("info@roksal.com") >= 0);
check("viri navajajo uradno Roksal dokumentacijo (PDF + strani)",
  sl.indexOf("WOODCORE_navodila_za_montazo-sl.pdf") >= 0 && sl.indexOf("roksal.com/woodcore-wpc-deske") >= 0);

/* ---------- različica ---------- */
const { parseChangelog } = require(path.join(root, "scripts", "lib", "changelog.js"));
const ver = parseChangelog(root).latest;
check("zadnja različica iz CHANGELOG je v obeh datotekah",
  sl.indexOf(ver.version) >= 0 && sl.indexOf(ver.date) >= 0 && en.indexOf(ver.version) >= 0);

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
