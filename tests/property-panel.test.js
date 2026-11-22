/**
 * P1.2 — kontekstualni panel (MVP: dimenzije v risbi).
 * Pokritje:
 *   - klik na dimenzijo odpre panel (lastnosti);
 *   - panel prepozna pripadajoče polje (po številčni vrednosti) in omogoči urejanje;
 *   - »Uporabi« posodobi polje in regenerira risbo;
 *   - gumb × in Esc zapreta panel.
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

check("P1.2: #propPanel obstaja", !!$("propPanel"));

/* Pripravi risbo z dimenzijami */
setF("L", "3800"); setF("H", "1200"); setF("n", "16");
$("gen").click();
const dims = [].slice.call(document.querySelectorAll("#prev [data-dim]"));
check("P1.2: risba vsebuje dimenzije (data-dim)", dims.length > 0, dims.length + " dimenzij");

const Ldim = dims.find((d) => d.textContent.trim() === "3800");
check("P1.2: najdena dimenzija L=3800", !!Ldim, Ldim ? Ldim.textContent : "ni dimenzije 3800");
if (Ldim) Ldim.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

const panel = $("propPanel");
check("P1.2: klik odpre panel", panel.classList.contains("on"));
check("P1.2: panel prikaže vrednost", panel.textContent.includes("3800 mm"));
check("P1.2: panel prepozna polje #L", panel.textContent.includes("#L"));

const apply = panel.querySelector("#ppApply");
const ppInput = panel.querySelector("#ppInput");
check("P1.2: panel omogoča urejanje", !!apply && !!ppInput);
if (apply && ppInput) {
  ppInput.value = "3900";
  apply.click();
}
check("P1.2: Uporabi posodobi polje #L", $("L").value === "3900");
check("P1.2: panel se po Uporabi zapre", !panel.classList.contains("on"));

/* Esc zapre */
const Ldim2 = [].slice.call(document.querySelectorAll("#prev [data-dim]")).find((d) => d.textContent.trim() === "3900");
if (Ldim2) Ldim2.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
check("P1.2: ponovno odprt panel", panel.classList.contains("on"));
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
check("P1.2: Esc zapre panel", !panel.classList.contains("on"));

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
