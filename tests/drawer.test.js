/**
 * Canvas-first predal — stranski panel je privzeto skrit; odpira se iz menijske
 * vrstice; tloris/skica se odpreta v poglobljenem načinu (canvas-focus).
 * Pokritje:
 *   - privzeto body.aside-hidden (razen če je uporabnik prej izrecno pokazal);
 *   - openPanel('dims') odpre predal brez canvas-focus;
 *   - openPanel('tloris'/'skica') vklopi canvas-focus;
 *   - #focusClose in #asideScrim zapreta in počistita canvas-focus;
 *   - izbira se shrani v localStorage.
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
function body() { return document.body; }

check("drawer: privzeto skrit (canvas-first)", body().classList.contains("aside-hidden"));
check("drawer: privzeto brez canvas-focus", !body().classList.contains("canvas-focus"));
check("drawer: #asideScrim in #focusClose obstajata", !!document.getElementById("asideScrim") && !!document.getElementById("focusClose"));

/* Politika: ob zagonu se predal NE odpre niti, če je v localStorage shranjena 'visible' izbira */
const html2 = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const dom2 = new JSDOM(html2, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window2) {
    try { window2.localStorage.setItem("tehnicka-risba-pro-aside", "visible"); } catch (e) {}
    window2.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window2.URL.revokeObjectURL = () => {};
    window2.HTMLAnchorElement.prototype.click = function () {};
  },
});
check("drawer: skrit tudi pri shranjenem 'visible'", dom2.window.document.body.classList.contains("aside-hidden"));

window.openPanel("dims");
check("drawer: openPanel(dims) odpre predal", !body().classList.contains("aside-hidden"));
check("drawer: openPanel(dims) brez canvas-focus", !body().classList.contains("canvas-focus"));

window.openPanel("tloris");
check("drawer: openPanel(tloris) → canvas-focus", body().classList.contains("canvas-focus"));
window.openPanel("skica");
check("drawer: openPanel(skica) → canvas-focus", body().classList.contains("canvas-focus"));

document.getElementById("focusClose").click();
check("drawer: ✕ zapre in počisti canvas-focus", body().classList.contains("aside-hidden") && !body().classList.contains("canvas-focus"));

window.openPanel("tloris");
document.getElementById("asideScrim").click();
check("drawer: zaslonka zapre in počisti canvas-focus", body().classList.contains("aside-hidden") && !body().classList.contains("canvas-focus"));

window.openPanel("dims");
check("drawer: localStorage 'visible' po odprtju", window.localStorage.getItem("tehnicka-risba-pro-aside") === "visible");
window.setAsideVisible(false);
check("drawer: localStorage 'hidden' po zaprtju", window.localStorage.getItem("tehnicka-risba-pro-aside") === "hidden");

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
