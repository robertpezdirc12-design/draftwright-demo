/**
 * P2.4 — predloge listov: slog naslovnega bloka (klasičen / ISO 7200 / ANSI).
 * Pokritje:
 *   - polje sheetStyle obstaja (select) in je v fields;
 *   - ISO: oznake »ŠT. RISBE / REV«, »IZDELAL / KONTROLIRAL« + data-sheet-style="iso";
 *   - ANSI: oznake »DRAWING NO. / REV«, »DRAWN BY / CHECKED« + data-sheet-style="ansi";
 *   - klasičen: »RISBA / REV«, »RISAL / KONT.« + data-sheet-style="klasicen".
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

check("P2.4: select #sheetStyle obstaja", !!$("sheetStyle") && $("sheetStyle").options.length === 3);

setF("sheetStyle", "iso");
$("gen").click();
let svg = svgText();
check("P2.4: ISO — oznake naslovnega bloka", svg.includes("ŠT. RISBE / REV") && svg.includes("IZDELAL / KONTROLIRAL"), "");
check("P2.4: ISO — data-sheet-style", svg.includes('data-sheet-style="iso"'));

setF("sheetStyle", "ansi");
$("gen").click();
svg = svgText();
check("P2.4: ANSI — oznake", svg.includes("DRAWING NO. / REV") && svg.includes("DRAWN BY / CHECKED"));
check("P2.4: ANSI — data-sheet-style", svg.includes('data-sheet-style="ansi"'));

setF("sheetStyle", "klasicen");
$("gen").click();
svg = svgText();
check("P2.4: klasičen — oznake", svg.includes("RISBA / REV") && svg.includes("RISAL / KONT."));
check("P2.4: klasičen — data-sheet-style", svg.includes('data-sheet-style="klasicen"'));

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
