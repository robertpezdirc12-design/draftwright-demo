/**
 * P2.5 — PDM-lite: posnetki (checkpoints) stanja projekta.
 * Pokritje:
 *   - pdm API na window (pdmSnapshotNow/pdmAll/pdmRestore/pdmDelete/pdmArchiveJson);
 *   - posnetek shrani trenutno stanje polj;
 *   - obnovitev vrne prejšnje stanje;
 *   - arhiv JSON vsebuje posnetke;
 *   - brisanje odstrani posnetek.
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

check("P2.5: pdm API na window", ["pdmSnapshotNow", "pdmAll", "pdmRestore", "pdmDelete", "pdmArchiveJson"].every((k) => typeof window[k] === "function"));

setF("L", "4000");
const s1 = window.pdmSnapshotNow();
check("P2.5: posnetek 1 obstaja", !!s1 && s1.id >= 1 && s1.data.L === "4000");
setF("L", "5000");
const s2 = window.pdmSnapshotNow();
check("P2.5: posnetek 2 obstaja", !!s2 && s2.data.L === "5000" && s2.id > s1.id);

const all = window.pdmAll();
check("P2.5: seznam vsebuje 2+ posnetka", all.length >= 2, all.length + " posnetkov");

check("P2.5: obnovitev posnetka 1", window.pdmRestore(s1.id) === true && $("L").value === "4000");
check("P2.5: obnovitev posnetka 2", window.pdmRestore(s2.id) === true && $("L").value === "5000");

const archive = window.pdmArchiveJson();
check("P2.5: arhiv JSON vsebuje posnetke", archive.includes('"id"') && archive.includes('"data"') && archive.includes("5000"));

const before = window.pdmAll().length;
window.pdmDelete(s1.id);
check("P2.5: brisanje zmanjša seznam", window.pdmAll().length === before - 1);

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
