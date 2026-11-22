/**
 * P2.3 — BOM s številkami postavk + interaktivni baloni.
 * Pokritje:
 *   - po generiranju obstaja register window.BOM_ROWS (>= 8 vrstic);
 *   - vsi baloni (data-bom) v risbi so znotraj obsega vrstic BOM;
 *   - klik na balon prikaže toast s podatki o postavki;
 *   - osnovne vrstice (Zgornji profil, Lamela, …) so prisotne.
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

$("gen").click();

const rows = window.BOM_ROWS;
check("P2.3: register BOM_ROWS obstaja", Array.isArray(rows) && rows.length >= 8, rows ? rows.length + " vrstic" : "ni registra");
if (Array.isArray(rows)) {
  check("P2.3: vrstica 1 = Zgornji profil", rows[0][1] === "Zgornji profil");
  check("P2.3: vrstica 2 vsebuje Lamela", String(rows[1][1]).indexOf("Lamela") === 0);
}

const balloons = [].slice.call(document.querySelectorAll("#prev [data-bom]"));
const nums = balloons.map((b) => Number(b.getAttribute("data-bom")));
check("P2.3: risba vsebuje balone", balloons.length >= 5, balloons.length + " balonov");
check("P2.3: vse številke balonov so znotraj BOM", nums.every((n) => n >= 1 && n <= rows.length));

const b2 = balloons.find((b) => Number(b.getAttribute("data-bom")) === 2);
if (b2) b2.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const toastTxt = $("toastZone") ? $("toastZone").textContent : "";
check("P2.3: klik na balon prikaže toast s postavko", toastTxt.includes("BOM vrstica 2") && toastTxt.includes("Lamela"), toastTxt.slice(0, 90));

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
