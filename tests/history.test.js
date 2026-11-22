/**
 * P1.1 — zgodovina operacij (undo/redo parametrov + recept).
 * Pokritje:
 *   - histUndo/histRedo sta na voljo na window;
 *   - ob spremembah polj se zgodovina polni;
 *   - undo vrne prejšnje stanje, redo ga ponovno uporabi;
 *   - Ctrl+Z / Ctrl+Y (izven vnosnih polj in kanvasa) sprožita undo/redo;
 *   - undo na začetku zgodovine ne spremeni ničesar.
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

check("P1.1: histUndo/histRedo na window", typeof window.histUndo === "function" && typeof window.histRedo === "function");

setF("L", "4000");
setF("L", "5000");
check("P1.1: trenutna vrednost 5000", $("L").value === "5000");

window.histUndo();
check("P1.1: undo vrne 4000", $("L").value === "4000");
window.histRedo();
check("P1.1: redo vrne 5000", $("L").value === "5000");

/* Ctrl+Z (izven vnosnih polj) */
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
check("P1.1: Ctrl+Z naredi undo", $("L").value === "4000");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "y", ctrlKey: true, bubbles: true }));
check("P1.1: Ctrl+Y naredi redo", $("L").value === "5000");

/* Meja: undo na začetku zgodovine ne spremeni ničesar */
window.histUndo();
window.histUndo();
const afterDoubleUndo = $("L").value;
window.histUndo();
check("P1.1: undo na začetku je neutralen", $("L").value === afterDoubleUndo, afterDoubleUndo);

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
