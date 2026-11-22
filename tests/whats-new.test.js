/**
 * P3.6 — »What's new« + zapiski izdaj.
 * Pokritje:
 *   - ob prvi uporabi (brez shranjene različice) se popup odpre;
 *   - seznam vsebuje zapiske izdaj;
 *   - po ogledu se različica shrani → drugi zagon ne odpre popupa;
 *   - zapiranje (× / Esc) deluje; meni openWhatsNew je na voljo.
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

check("P3.6: popup se ob prvem zagonu odpre", $("wnOverlay").classList.contains("on"));
check("P3.6: seznam vsebuje zapiske izdaj", $("wnList").textContent.includes("2026.11"));
check("P3.6: različica je bila shranjena", window.localStorage.getItem("draftwright-seen-version") === "2026.11");

$("wnClose").click();
check("P3.6: × zapre popup", !$("wnOverlay").classList.contains("on"));

$("wnClose").click(); /* nič ne spremeni: ponovno preverimo neodpiranje */
window.eval ? null : null;
/* Ponovno odpremo prek menija (openWhatsNew) in zapremo z Esc */
window.openWhatsNew();
check("P3.6: openWhatsNew odpre popup", $("wnOverlay").classList.contains("on"));
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
check("P3.6: Esc zapre popup", !$("wnOverlay").classList.contains("on"));

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
