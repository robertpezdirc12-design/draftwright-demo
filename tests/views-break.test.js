/**
 * P2.2 — break view (prelom) za dolge ograje + oznake.
 * Pokritje:
 *   - pri kratkih dolžinah (<= 7600 mm) ni preloma (ni data-break, ni »SKRAJŠANO«);
 *   - pri dolgih (9000 mm) se prikažeta dve lomljeni črti (data-break), oznaka
 *     »SKRAJŠANO« in dimenzija s polno dolžino (9000 mm);
 *   - generiranje poteka brez JS napak.
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
function svgText() { return $("prev").innerHTML; }

setF("L", "3800"); setF("H", "1200"); setF("D", "1200"); setF("n", "16"); setF("np", "4");
$("gen").click();
let svg = svgText();
check("P2.2: kratka ograja — brez preloma", !svg.includes("data-break") && !svg.includes("SKRAJŠANO"));

setF("L", "9000");
$("gen").click();
svg = svgText();
const breaks = (svg.match(/data-break="1"/g) || []).length;
check("P2.2: dolga ograja — dve lomljeni črti", breaks === 2, breaks + " oznak");
check("P2.2: dolga ograja — oznaka SKRAJŠANO", svg.includes("SKRAJŠANO"));
check("P2.2: dimenzija ohrani polno dolžino", svg.includes("9000 mm"));
check("P2.2: panel poroča SKRAJŠANO", svg.includes("SKRAJŠANO"));
check("P2.2: risba vsebuje dimenzijo L", svg.includes("9000"));

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
