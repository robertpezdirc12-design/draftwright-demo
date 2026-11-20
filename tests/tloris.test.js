/**
 * Faza 5 (Issue #10, pogl. 10) — interaktivni tloris trase ograje — poganja `npm test`.
 * Pokritje: dodajanje oglišč/segmentov po klikih (1 px = 10 mm), nosilci po roksalLimit,
 * oznake dolžin, undo/redo (gumb + tipkovnica), Escape zaključi traso, počisti,
 * »Uporabi v izračun« (plan → polja), shema v2 (plan v projektu) + migracija v1 + autosave.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const blobQueue = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.URL.createObjectURL = (b) => { blobQueue.push(b); return "blob:test"; };
    window.HTMLAnchorElement.prototype.click = function () {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const setField = (id, v) => { $(id).value = String(v); fire($(id), "input"); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function clickSvg(x, y) { // koordinate v PX (1 px = 10 mm)
  const svg = $("tlorisSvg");
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 400 });
  svg.dispatchEvent(new window.MouseEvent("click", { clientX: x, clientY: y, bubbles: true }));
}
const wallCount = () => [...$("tlorisSvg").querySelectorAll("line")].filter((l) => l.getAttribute("stroke-width") === "3").length; // stene imajo širino 3 (mreža 1)

(async () => {
  window.openPanel("tloris"); // odpre ploščo (render)

  // A) trasa: klik (50,50) → (350,50) → wall 3000 mm; Escape; (350,300) → (50,300) → wall 3000 mm
  clickSvg(50, 50); clickSvg(350, 50);
  check("A: segment 3000 mm narejen", wallCount() === 1, wallCount() + " črt (brez mreže)");
  check("A: oznaka dolžine 3000 mm", $("tlorisSvg").textContent.includes("3000 mm"), $("tlorisSvg").textContent.slice(0, 100));
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  clickSvg(350, 300); clickSvg(50, 300);
  check("A: drug segment po Escape", wallCount() === 2, wallCount() + " sten");
  const totalTxt = $("tlorisStatus").textContent;
  check("A: skupna dolžina 6000 mm", totalTxt.includes("6000 mm"), totalTxt);

  // B) nosilci po roksalLimit: romb67 prečna → limit 1450 → 3000 mm → 3 nosilcev/segment
  const posts = [...$("tlorisSvg").querySelectorAll("rect")].length;
  check("B: nosilci izrisani (roksalLimit na segment)", posts >= 6, posts + " oznak nosilcev");

  // C) undo/redo
  $("tlorisUndo").click();
  check("C undo: en segment odstranjen", wallCount() === 1, wallCount() + " sten");
  $("tlorisRedo").click();
  check("C redo: segment obnovljen", wallCount() === 2);

  // D) tipkovnica: Ctrl+Z / Ctrl+Y
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, cancelable: true }));
  check("Ctrl+Z undo", wallCount() === 1);
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "y", ctrlKey: true, bubbles: true, cancelable: true }));
  check("Ctrl+Y redo", wallCount() === 2);

  // E) Uporabi v izračun: L = vsota dolžin (6000) → obstoječi tok
  $("tlorisApply").click();
  check("E: plan → polja (L=6000)", $("L").value === "6000", $("tlorisStatus").textContent);
  $("gen").click();
  check("E: risba generirana iz tlorisa", !!document.querySelector("#prev svg"));

  // F) shema v2: projekt vsebuje plan.walls
  $("save").click();
  const proj = JSON.parse(await blobQueue[blobQueue.length - 1].text());
  check("F: ovojnica v2", proj.schema === "draftwright-project" && proj.version === 2);
  check("F: plan.walls = 2 stene", Array.isArray(proj.data.plan?.walls) && proj.data.plan.walls.length === 2);

  // G) migracija: legacy v1 (brez plan) → naloži, trasa prazna; v2 → obnovi stene
  const v1 = JSON.stringify({ schema: "draftwright-project", version: 1, data: { L: "4500", refMode: true } });
  const lf = $("loadFile");
  Object.defineProperty(lf, "files", { value: [new window.File([v1], "v1.json", { type: "application/json" })], configurable: true });
  fire(lf, "change");
  await sleep(120);
  check("G: v1 migracija — L=4500, trasa prazna", $("L").value === "4500" && wallCount() === 0);
  // v2 z enim zidom
  $("tlorisClear").click();
  const v2 = JSON.stringify({ schema: "draftwright-project", version: 2, data: { L: "5800", plan: { walls: [{ x1: 0, y1: 0, x2: 5800, y2: 0 }], anchor: null } } });
  Object.defineProperty(lf, "files", { value: [new window.File([v2], "v2.json", { type: "application/json" })], configurable: true });
  fire(lf, "change");
  await sleep(120);
  check("G: v2 trasa obnovljena (5800 mm)", wallCount() === 1);
  // novejša verzija → zavrnjena
  const v9 = JSON.stringify({ schema: "draftwright-project", version: 9, data: {} });
  Object.defineProperty(lf, "files", { value: [new window.File([v9], "v9.json", { type: "application/json" })], configurable: true });
  fire(lf, "change");
  await sleep(80);
  check("G: novejša verzija zavrnjena (L ostane)", $("L").value === "5800", $("L").value);

  // H) Počisti
  $("tlorisClear").click();
  check("H: počisti traso", wallCount() === 0);

  // I) samoprevera 126/126 (regresija celega programa)
  $("menuSelfTest").click();
  check("I: samoprevera 126/126", /126 kombinacij · 0 napak · 0 JS napak/.test($("globalStatus").textContent), $("globalStatus").textContent);

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
