/**
 * P3.1 + P3.3 — masne lastnosti in oznake zastarelih vrednosti (»rebuild«).
 * Pokritje:
 *   - window.massStats() vrne kg, kg/m², kg/m;
 *   - predračun prikaže povzetek mase;
 *   - montažni načrt vsebuje vrstico mase;
 *   - po spremembi parametra so proizvodni rezultati označeni kot stale;
 *   - po ponovnem izračunu se oznaka odstrani.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.HTMLAnchorElement.prototype.click = function () {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function $ (id) { return document.getElementById(id); }
function fire(el, type) { el.dispatchEvent(new window.Event(type, { bubbles: true })); }
function setF(id, v) { const el = $(id); el.value = v; fire(el, "input"); }

check("P3.1: massStats na window", typeof window.massStats === "function");
const ms = window.massStats();
check("P3.1: masa lamel > 0", ms.kg > 0, "kg = " + ms.kg.toFixed(2));
check("P3.1: kg/m² > 0", ms.perM2 > 0, "kg/m² = " + ms.perM2.toFixed(2));

setF("L", "3800"); setF("H", "1200"); setF("D", "1200"); setF("n", "16");
$("buildQuote").click();
check("P3.1: predračun prikaže povzetek mase", $("quoteOut").textContent.includes("Skupna masa lamel (ocena)") && $("quoteOut").textContent.includes("kg/m²"));

$("makePlan").click();
check("P3.1: montažni načrt vsebuje vrstico mase", $("planOut").textContent.includes("Masa lamel (ocena)") && $("planOut").textContent.includes("kg/m"));

/* P3.3 — stale oznake */
check("P3.3: plan ni stale po izračunu", !$("planOut").classList.contains("stale"));
setF("L", "4000");
check("P3.3: po spremembi je plan stale", $("planOut").classList.contains("stale"));
$("makePlan").click();
check("P3.3: po ponovnem izračunu stale izgine", !$("planOut").classList.contains("stale"));

$("buildQuote").click();
check("P3.3: quote ni stale po izračunu", !$("quoteOut").classList.contains("stale"));
setF("L", "4200");
check("P3.3: po spremembi je quote stale", $("quoteOut").classList.contains("stale"));
$("buildQuote").click();
check("P3.3: po ponovnem izračunu quote stale izgine", !$("quoteOut").classList.contains("stale"));

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
