/**
 * P3.2 — zaznavanje prekrivanj/trkov (clash detection).
 * Pokritje:
 *   - privzeto ni dodatnih opozoril;
 *   - korita + segmenti → opozorilo o izključitvi korit;
 *   - negativna reža → opozorilo;
 *   - po popravku opozorili izgineta;
 *   - trak napak (error tray) prikaže isto opozorilo.
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

check("P3.2: privzeto brez dodatnih opozoril", !$("checks").textContent.includes("izključena iz količin") && !$("checks").textContent.includes("negativna"));

setF("segList", "A;2000;800\nB;1500;900"); setF("koritoList", "500;100");
check("P3.2: korita + segmenti → opozorilo", $("checks").textContent.includes("Korita so izključena iz količin"));
check("P3.2: trak napak prikaže opozorilo", $("errTray").textContent.includes("Korita so izključena iz količin"));

setF("gap", "-5");
check("P3.2: negativna reža → opozorilo", $("checks").textContent.includes("Reža med lamelami ne more biti negativna"));

setF("segList", ""); setF("koritoList", ""); setF("gap", "10");
check("P3.2: po popravku opozorili izgineta", !$("checks").textContent.includes("izključena iz količin") && !$("checks").textContent.includes("negativna"));

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
