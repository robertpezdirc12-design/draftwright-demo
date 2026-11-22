/**
 * P2.1 — konfiguracije + dizajn tabela (CSV).
 * Pokritje:
 *   - cfgSave/cfgApply/cfgDelete/cfgCsv/cfgAll so na voljo na window;
 *   - shranjena konfiguracija obnovi polja (tudi po spremembi);
 *   - seznam vsebuje shranjeno konfiguracijo;
 *   - izvoz CSV vsebuje glavo in vrstico konfiguracije;
 *   - brisanje odstrani konfiguracijo.
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
    window.prompt = () => null;
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

check("P2.1: cfg API na window", ["cfgSave", "cfgApply", "cfgDelete", "cfgCsv", "cfgAll"].every((k) => typeof window[k] === "function"));

setF("L", "4000"); setF("H", "1200"); setF("n", "16");
const saved = window.cfgSave("Test A");
check("P2.1: shranjevanje vrne konfiguracijo", !!saved && saved.name === "Test A");
setF("L", "5000"); setF("H", "900");
check("P2.1: polja so bila spremenjena", $("L").value === "5000" && $("H").value === "900");
check("P2.1: uporaba vrne true", window.cfgApply("Test A") === true);
check("P2.1: uporaba obnovi polja", $("L").value === "4000" && $("H").value === "1200" && $("n").value === "16");

const list = window.cfgAll();
check("P2.1: seznam vsebuje Test A", list.length >= 1 && list.some((c) => c.name === "Test A"), list.length + " konfiguracij");

const csv = window.cfgCsv();
check("P2.1: CSV ima glavo (L/H)", csv.includes('"L"') && csv.includes('"H"'));
check("P2.1: CSV vsebuje vrstico Test A", csv.includes("Test A") && csv.includes("4000"));

window.cfgDelete("Test A");
check("P2.1: brisanje odstrani konfiguracijo", !window.cfgAll().some((c) => c.name === "Test A"));

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
