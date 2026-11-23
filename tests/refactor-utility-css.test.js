/**
 * Regresijski test za nizko-prioritete refaktor (Issue #41 §3.F):
 *  1) helper-dedup: skupna dim() in vt() — prej podvojena lokalno v večih
 *     funkcijah (stepString, generateReference, stopnični list). Vsaka trditev
 *     bi na STARI kodi (2× dim, 2× vt) PADO — zato je pravilna regresijska ovira.
 *     ip()/ibox() SO NAMENOMA podvojena (različna izometrična matematika kx/ky
 *     proti ik) in jih refaktor NISME odstranili — to potrjujemo kot zaščito pred
 *     prepisom, ki bi slomil izometrične liste.
 *  2) generator CSS utilitetskih pravil [data-s] (scripts/generate-utility-css.js):
 *     EN vir za 74 pravil, ki prej obstajala byte-identično v dveh mestih
 *     (inline <style> v HTML in povezan print.css). Test zažene `--check` in
 *     preveri idempotentnost (ponovni zapis nič ne spremeni).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const html = read("tehnicka-risba-pro.html");
const printCss = read("print.css");
const genSrc = read("scripts/generate-utility-css.js");

const errors = [];
let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* ============ 1) helper-dedup: staticni vir ============ */
// Na stari kodi: `function dim(` ×2 in `function vt(` ×2. Po refaktorju: ×1.
const dimCount = (html.match(/function dim\(/g) || []).length;
const vtCount = (html.match(/function vt\(/g) || []).length;
const ipCount = (html.match(/function ip\(/g) || []).length;
check("dim: ena skupna definicija (pred refaktorjem je bilo 2)", dimCount === 1, "found " + dimCount);
check("vt: ena skupna definicija (pred refaktorjem je bilo 2)", vtCount === 1, "found " + vtCount);
const vtLines = html.split("\n").filter(l => /function vt\(x,y,t\)\{/.test(l));
const vtCol0 = vtLines.filter(l => /^function vt\(x,y,t\)\{/.test(l)).length;
const vtIndented = vtLines.filter(l => /^[ \t]+function vt\(x,y,t\)\{/.test(l)).length;
check("vt: edina definicija je top-level (column 0), noben lokalni", vtCol0 === 1 && vtIndented === 0,
  "col0=" + vtCol0 + " indented=" + vtIndented);
// ip/ibox: NAMENOMA še vedno 2 × ip (različna izometrija) — zaščita pred prepisom.
check("ip: namenoma podvojena (različna izometrična matematika, refaktor NISME združil)", ipCount === 2, "found " + ipCount);

// Lokalno `dim` v stepString je odstranjeno — preverimo, da v stepString ni še ene dim definicije.
check("ni lokalne dim definicije v stepString (skupna rešitev)",
  (() => {
    const i = html.indexOf("function stepString()");
    const seg = html.slice(i, i + 4000);
    return !/function dim\(/.test(seg);
  })(), "lokalna dim še vedno v stepString");
// Lokalno vt v generateReference / stopničnem listu je odstranjeno.
check("ni lokalne vt definicije v generateReference (skupna rešitev)",
  (() => {
    const i = html.indexOf("function generateReference()");
    const j = html.indexOf("function dim(", i + 1);
    const seg = html.slice(i, j === -1 ? i + 3000 : j);
    return !/function vt\(/.test(seg);
  })(), "lokalna vt še vedno v generateReference");

// Obe definiciji ostali so enolični in identični po telesu (vt).
const vtBodies = [...html.matchAll(/function vt\(x,y,t\)\{([\s\S]*?)\}/g)].map(m => m[0]);
check("vt: definicije so enolične (eno telo)", vtBodies.length === 1 && new Set(vtBodies).size === 1, "count " + vtBodies.length);

// Obe inline skripti ostani syntaktično veljavni.
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.trim());
let syntaxOk = true;
for (const s of scripts) { try { new Function(s); } catch (e) { syntaxOk = false; errors.push("inline script syntax: " + e.message); } }
check("obe inline skripti ostani syntaktično veljavni po dedup", syntaxOk, errors.join(" | "));

/* ============ 2) generator CSS utilitetskih pravil ============ */
const START = "/*__UTILITY_CSS_START__*/";
const END = "/*__UTILITY_CSS_END__*/";
const blockIn = (src) => {
  const i = src.indexOf(START), j = src.indexOf(END);
  return i >= 0 && j > i ? src.slice(i, j + END.length) : null;
};
check("generator: oba imata UTILITTY markers", !!blockIn(html) && !!blockIn(printCss), "manjkajo markerji");
const htmlBlock = blockIn(html), cssBlock = blockIn(printCss);
check("generator: blok v HTML in v print.css sta BYTE-IDENTIČNA", htmlBlock !== null && cssBlock !== null && htmlBlock === cssBlock, "bloka se razlikujeta");
check("generator: blok vsebuje 74 pravil [data-s]", htmlBlock !== null && htmlBlock.split("\n").filter(l => /^\[data-s="s\d+"\]\{/.test(l)).length === 74, "napačno število pravil");

// --check naj potrdi sinhronizacijo (exit 0).
let checkExit = 0, checkOut = "";
try { checkOut = execFileSync(process.execPath, [path.join(root, "scripts/generate-utility-css.js"), "--check"], { encoding: "utf8" }); }
catch (e) { checkExit = e.status === undefined ? 1 : e.status; checkOut = (e.stdout || "") + (e.stderr || ""); }
check("generator: `--check` konča s 0 (oboj blocka v sinhru)", checkExit === 0, "exit " + checkExit + " :: " + checkOut.trim());

// Idempotentnost: writeAll naj datoteki NE spremeni (blocka sta že vir).
const htmlBefore = read("tehnicka-risba-pro.html");
const cssBefore = read("print.css");
execFileSync(process.execPath, [path.join(root, "scripts/generate-utility-css.js")], { encoding: "utf8" });
check("generator: writeAll je idempotentno (ni spremembe HTML)", read("tehnicka-risba-pro.html") === htmlBefore, "HTML se je spremenil po writeAll");
check("generator: writeAll je idempotentno (ni spremembe print.css)", read("print.css") === cssBefore, "print.css se je spremenil po writeAll");

// VIR v generatorju je byte-copy datotek (drift = nevarnost desinhronizacije).
// Rekonstruiramo BLOCK iz generatorjevega RULES polja in ga primerjamo s HTML blokom.
const genRulesBlock = (() => {
  const m = genSrc.match(/const RULES = \[([\s\S]*?)\];/);
  if (!m) return null;
  let RULES;
  try { RULES = eval("[" + m[1] + "]"); } catch (e) { return null; }
  if (!Array.isArray(RULES)) return null;
  return [START, ...RULES, END].join("\n");
})();
check("generator: RULES vir (rekonstruiran BLOCK) je byte-copy HTML bloka", genRulesBlock !== null && genRulesBlock === htmlBlock, "vir v generatorju se razlikuje od datotek");

check("ni napak", errors.length === 0, errors.join(" | "));
console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", napake: " + errors.join(" | ") : ""}`);
process.exit(fail ? 1 : 0);
