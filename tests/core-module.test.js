/**
 * Postopna modularizacija — korak 1: čisti modul DWCore.
 *
 * Prvi korak ne dodaja nove datoteke: jsdom brez resources:"usable" ne naloži
 * zunanjih <script src>, zato bi fizična izdvojitev razbila vse obstoječe surove.
 * Namesto tega so čiste funkcije zbrane v enem imenskem prostoru, obstoječa
 * globalna imena pa ostanejo kot tanke ovijalke — noben klic, izvoz ali izvoz
 * risbe se ne spremeni. Ta surov zaklene obe lastnosti.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    w.URL.revokeObjectURL = () => {};
    w.URL.createObjectURL = () => "blob:test";
    w.HTMLAnchorElement.prototype.click = function () {};
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

const C = window.DWCore;
check("DWCore obstaja (stara koda bi PADO)", !!C && typeof C === "object");
if (C) {
  const expected = ["numParse", "format", "spanParts", "spanCenters", "dim", "escapeHtml"];
  check("DWCore izvozi natanko 6 čistih funkcij",
    expected.every((k) => typeof C[k] === "function") && Object.keys(C).length === expected.length,
    Object.keys(C).join(","));

  /* --- obnašanje je identično prejšnjim lokalnim funkcijam --- */
  check("numParse: slovenska decimalna vejica", C.numParse("3,8") === 3.8, String(C.numParse("3,8")));
  check("numParse: tisoči-pika + vejica", C.numParse("3.000,5") === 3000.5, String(C.numParse("3.000,5")));
  check("numParse: ASCII pika ostane", C.numParse("3.8") === 3.8, String(C.numParse("3.8")));
  check("numParse: prazno → NaN", Number.isNaN(C.numParse("")));
  check("format: 3.8 / 4 / zaokroževanje", C.format(3.8) === "3.8" && C.format(4) === "4" && C.format(3.84) === "3.8");
  check("spanParts: delitev na 3 dele", JSON.stringify(C.spanParts(10, 3)) === '["3.4","3.3","3.3"]');
  const centers = C.spanCenters(10, 3);
  check("spanCenters: kumulativni centri z exact mejo",
    Math.abs(centers[1] - 3.4) < 1e-9 && Math.abs(centers[2] - 6.7) < 1e-9 && centers[3] === 10,
    JSON.stringify(centers));
  check("dim: para iz poljubnega besedila", JSON.stringify(C.dim("L=3800 H=1200", [0, 0])) === "[3800,1200]");
  check("dim: fallback ko manjkata dve števili", JSON.stringify(C.dim("x", [1, 2])) === "[1,2]");
  check("escapeHtml: vsi posebni znaki",
    C.escapeHtml('<a href="x">&') === "&lt;a href=&quot;x&quot;&gt;&amp;",
    C.escapeHtml('<a href="x">&'));

  /* --- modul je res čist: nobene DOM/localStorage odvisnosti --- */
  const body = (html.match(/var DWCore=\(function\(\)\{[\s\S]*?\n\}\)\(\);/) || [""])[0];
  check("DWCore telo ne uporablja DOM ali storage",
    body.length > 0 && !/\bdocument\b|\blocalStorage\b|\bwindow\b|\$\(/.test(body));
}

/* --- nazaj združljivo: stare ovijalke in izvozi ostanejo --- */
check("window.numParse ostane izvožen", typeof window.numParse === "function");
check("ovijalka numParse delegira na modul",
  !!C && window.numParse("3,8") === C.numParse("3,8"));
check("window.n ostane izvožen", typeof window.n === "function");
check("ovijalke E/f/dim/spanParts ostanejo v izvorni kodi",
  /function E\(s\)\{return DWCore\.escapeHtml\(s\)\}/.test(html) &&
  /function f\(x\)\{return DWCore\.format\(x\)\}/.test(html) &&
  /function dim\(str,fallback\)\{return DWCore\.dim\(str,fallback\)\}/.test(html) &&
  /function spanParts\(total,n\)\{return DWCore\.spanParts\(total,n\)\}/.test(html));

check("brez JS napak", errors.length === 0, errors.join(" | "));
console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ""}`);
process.exit(fail || errors.length ? 1 : 0);
