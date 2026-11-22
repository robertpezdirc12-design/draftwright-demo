/**
 * P1.3 — trak napak (error tray): klik-za-popravek.
 * Pokritje:
 *   - #errTray obstaja v delovnem prostoru;
 *   - ob napakah se trak prikaže (count + postavke z data-field);
 *   - klik na postavko fokusira pripadajoče polje;
 *   - ob popravku se trak skrije/zprazni.
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

check("P1.3: #errTray obstaja", !!$("errTray"));

/* Povzroči napako: L=0 */
setF("L", "0");
const tray = $("errTray");
const on = tray.classList.contains("on");
const items = [].slice.call(tray.querySelectorAll(".et-item"));
const countTxt = tray.querySelector(".et-count") ? tray.querySelector(".et-count").textContent : "";
check("P1.3: ob napakah je trak viden", on, countTxt);
check("P1.3: trak vsebuje postavke z data-field", items.length >= 1 && items.every((i) => i.hasAttribute("data-field")), items.length + " postavk");
const LItem = items.find((i) => i.getAttribute("data-field") === "L");
check("P1.3: sporočilo o merah je povezano z #L", !!LItem, LItem ? LItem.textContent.slice(0, 60) : "ni postavke z data-field=L");
if (LItem) LItem.click();
check("P1.3: klik fokusira polje #L", document.activeElement === $("L"));

/* Popravek */
setF("L", "3800");
check("P1.3: po popravku se trak skrije", !$("errTray").classList.contains("on"));

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
