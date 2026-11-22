/**
 * Postavitev (UI) — poganja `npm test`.
 * Preverja preureditev »canvas-first«:
 *   (1) privzeto je stranski panel skrit (body.aside-hidden),
 *   (2) openPanel() odpre predal; tloris/skica vklopita poglobljeni način (body.canvas-focus),
 *   (3) zapiranje prek ✕/#focusClose ali zaslonke #asideScrim počisti oboje,
 *   (4) izbira se shrani v localStorage.
 */
"use strict";
const { loadAppHtml } = require("./helpers/bootApp");
const { JSDOM } = require("jsdom");

const html = loadAppHtml();
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

/* 1) privzeto stanje: canvas-first */
check("privzeto: stranski panel skrit", body().classList.contains("aside-hidden"));
check("privzeto: brez poglobljenega načina", !body().classList.contains("canvas-focus"));
check("privzeto: predogled (main) prisoten", !!document.querySelector("main #prev"));

/* 2) openPanel — običajni sklop */
window.openPanel("dims");
check("openPanel(dims): predal odprt", !body().classList.contains("aside-hidden"));
check("openPanel(dims): brez canvas-focus", !body().classList.contains("canvas-focus"));
check("openPanel(dims): ciljni sklop aktiven in razgrnjen", !!document.querySelector('aside section[data-panel="dims"].panel-active') && !document.querySelector('aside section[data-panel="dims"]').classList.contains("collapsed"));

/* 3) openPanel — tloris in skica → poglobljeni način */
window.openPanel("tloris");
check("openPanel(tloris): canvas-focus vklopljen", body().classList.contains("canvas-focus"));
check("openPanel(tloris): predal odprt", !body().classList.contains("aside-hidden"));
check("openPanel(tloris): sekcija tlorisa vidna", !document.querySelector('aside section[data-panel="tloris"]').classList.contains("collapsed"));

window.openPanel("skica");
check("openPanel(skica): canvas-focus vklopljen", body().classList.contains("canvas-focus"));
check("openPanel(skica): sekcija skice vidna", !document.querySelector('aside section[data-panel="skica"]').classList.contains("collapsed"));

/* 4) zapiranje */
const fclose = document.getElementById("focusClose");
check("gumb #focusClose obstaja", !!fclose);
if (fclose) fclose.click();
check("✕ zapre: predal skrit", body().classList.contains("aside-hidden"));
check("✕ zapre: canvas-focus počisčen", !body().classList.contains("canvas-focus"));

window.openPanel("tloris");
check("ponovno odprt tloris: canvas-focus", body().classList.contains("canvas-focus"));
const scrim = document.getElementById("asideScrim");
check("zaslonka #asideScrim obstaja", !!scrim);
if (scrim) scrim.click();
check("zaslonka zapre: predal skrit", body().classList.contains("aside-hidden"));
check("zaslonka zapre: canvas-focus počisčen", !body().classList.contains("canvas-focus"));

/* 5) localStorage persistence */
window.openPanel("dims");
check("localStorage: 'visible' po odprtju", window.localStorage.getItem("tehnicka-risba-pro-aside") === "visible");
window.setAsideVisible(false);
check("localStorage: 'hidden' po zaprtju", window.localStorage.getItem("tehnicka-risba-pro-aside") === "hidden");

/* 6) končno: brez JS napak */
check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
