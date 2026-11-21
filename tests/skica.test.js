/**
 * Issue #6 — terenska skica: prazen list, prostoročno risanje, elementi, ročno kotiranje,
 * radirka, premik, undo/redo, A4/A3 obe orientaciji, tisk v dejanski velikosti,
 * persistenca (shema v3) + migracija v2→v3. Poganja `npm test`.
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
const svg = () => $("skSvg");
function svgPt(x, y) { svg().getBoundingClientRect = () => ({ left: 0, top: 0, width: 210, height: 297 }); return { clientX: x, clientY: y, bubbles: true }; }
function pdown(x, y) { svg().dispatchEvent(new window.PointerEvent("pointerdown", Object.assign(svgPt(x, y)))); }
function pmove(x, y) { svg().dispatchEvent(new window.PointerEvent("pointermove", Object.assign(svgPt(x, y)))); }
function pup() { window.dispatchEvent(new window.PointerEvent("pointerup", { bubbles: true })); }
function tool(t) { document.querySelector('[data-sk-tool="' + t + '"]').click(); }
function skWalls() { return wallCountImpl(); }
function wallCountImpl() { return [...svg().querySelectorAll("line")].filter((l) => l.getAttribute("stroke-width") === "3").length; }

(async () => {
  // ---- kriterij 2/1: povsem prazen list + prostoročno risanje ----
  window.openPanel("skica");
  check("skica: prazen list (brez mreže, brez okvirja, brez vsebine)", svg().querySelectorAll("line").length === 0 && svg().querySelectorAll("rect").length === 0 && $("skSvg").textContent === "");
  tool("prosto");
  pdown(20, 20); pmove(60, 40); pmove(100, 30); pup();
  check("prosto: poteza shranjena (polyline)", svg().querySelectorAll("polyline").length === 1);
  check("skica: status šteje elemente", $("skStatus").textContent.includes("Elementov: 1"));

  // ---- kriterij 2: elementi brez prostoročnega risanja ----
  tool("rect"); pdown(100, 100); pmove(160, 160); pup();
  check("pravokotnik: element dodan", svg().querySelectorAll("rect").length === 1);
  tool("circle"); pdown(60, 200); pmove(80, 220); pup();
  check("krog: element dodan", svg().querySelectorAll("circle").length === 1);
  tool("arrow"); pdown(20, 250); pmove(80, 250); pup();
  check("puščica: line + polygon glava", svg().querySelectorAll("polygon").length === 1);
  tool("line"); pdown(30, 60); pmove(120, 60); pup();
  check("črta: element dodan", [...svg().querySelectorAll("line")].filter((l) => l.getAttribute("stroke-width") === "2").length >= 1);
  tool("text");
  window.prompt = () => "Opomba A";
  pdown(120, 220); pup();
  check("besedilo: element dodan", svg().querySelectorAll("text").length >= 1 && $("skSvg").textContent.includes("Opomba A"));

  // ---- ročno kotiranje: jasno označeno (kriterij 8) ----
  tool("dim"); pdown(20, 120); pmove(120, 120);
  window.prompt = () => "1450";
  pup();
  check("kotiranje: oznaka M(ročno)", $("skSvg").textContent.includes("M(ročno): 1450"));

  // ---- izometrična kocka ----
  tool("iso"); pdown(150, 60); pup();
  check("izo kocka: simbol izrisan", svg().querySelectorAll("polygon").length >= 2);

  // ---- radirka ----
  const beforeErase = svg().querySelectorAll("*").length;
  tool("radirka"); pdown(105, 130);
  check("radirka: pravokotnik odstranjen", svg().querySelectorAll("rect").length === 0, "prej " + beforeErase + " vsebin");

  // ---- premik ----
  tool("premakni"); pdown(62, 202); pmove(90, 180); pup();
  const circ = svg().querySelectorAll("circle")[0];
  check("premakni: krog prestavljen", circ && circ.getAttribute("cx") === "98", "cx=" + (circ ? circ.getAttribute("cx") : "-"));

  // ---- undo/redo (re-kviz: skRender zamenja DOM elemente) ----
  $("skUndo").click();
  const circU = svg().querySelectorAll("circle")[0];
  check("undo: krog nazaj na prvotni položaj (70)", circU && circU.getAttribute("cx") === "70", circU ? circU.getAttribute("cx") : "-");
  $("skRedo").click();
  const circR = svg().querySelectorAll("circle")[0];
  check("redo: krog znak prestavljen (98)", circR && circR.getAttribute("cx") === "98");

  // ---- podvajanje izbranega elementa (+10 mm odmik, undo) ----
  tool("premakni"); pdown(98, 178); pup();
  $("skDup").click();
  const dups = svg().querySelectorAll("circle");
  check("podvoji izbrano: krog ×2 (+10 mm odmik)", dups.length === 2 && dups[1].getAttribute("cx") === String(Number(dups[0].getAttribute("cx")) + 10), dups.length + " krogi");
  $("skUndo").click();
  check("podvoji: undo odstrani kopijo", svg().querySelectorAll("circle").length === 1);

  // ---- barva/debelina ----
  $("skColor").value = "#c0392b"; fire($("skColor"), "change");
  tool("line"); pdown(40, 260); pmove(90, 260); pup();
  check("barva: rdeča poteza", [...svg().querySelectorAll("line")].some((l) => l.getAttribute("stroke") === "#c0392b"));

  // ---- kriterij 3/6: A4/A3 obe orientaciji + tisk v dejanski velikosti ----
  $("skPaper").value = "A3"; fire($("skPaper"), "change");
  check("A3: viewBox 297×420 (pokončno)", svg().getAttribute("viewBox") === "0 0 297 420");
  $("skOrient").value = "lezeco"; fire($("skOrient"), "change");
  check("A3 ležeče: viewBox 420×297", svg().getAttribute("viewBox") === "0 0 420 297");
  // tisk: zajem odprtega okna
  let printHtml = null;
  window.open = () => ({ document: { write(h) { printHtml = h; }, close() {} }, focus() {}, print() {} });
  $("skPrint").click();
  check("tisk: @page A3 ležeče (420mm 297mm)", !!printHtml && printHtml.includes("@page{size:420mm 297mm"));
  $("skPaper").value = "A4"; fire($("skPaper"), "change");
  $("skOrient").value = "pokoncno"; fire($("skOrient"), "change");
  $("skPrint").click();
  check("tisk: @page A4 pokončno (210mm 297mm)", !!printHtml && printHtml.includes("@page{size:210mm 297mm"));
  check("tisk: brez odrezane vsebine (svg cel)", !!printHtml && printHtml.includes("</svg>"));

  // ---- kriterij 5: persistenca (shema v3) ----
  $("save").click();
  const proj = JSON.parse(await blobQueue[blobQueue.length - 1].text());
  check("shema v3: verzija 3", proj.schema === "draftwright-project" && proj.version === 3);
  check("shema v3: sketch v data", !!proj.data.sketch && Array.isArray(proj.data.sketch.elems) && proj.data.sketch.elems.length > 0);
  // migracija: v2 projekt (brez sketch) → naloži z prazno skico
  const v2 = JSON.stringify({ schema: "draftwright-project", version: 2, data: { L: "4500", plan: { walls: [], anchor: null } } });
  const lf = $("loadFile");
  Object.defineProperty(lf, "files", { value: [new window.File([v2], "v2.json", { type: "application/json" })], configurable: true });
  fire(lf, "change");
  await sleep(120);
  check("migracija v2→v3: L=4500 + prazna skica", $("L").value === "4500" && $("skSvg").querySelectorAll("*").length <= 3);

  // ---- kriterij 10: obstoječe funkcije nespremenjene ----
  setField("L", "4000"); setField("n", "11");
  $("gen").click();
  check("risba še vedno deluje", !!document.querySelector("#prev svg"));
  $("menuSelfTest").click();
  check("samoprevera 126/126", /126 kombinacij · 0 napak · 0 JS napak/.test($("globalStatus").textContent), $("globalStatus").textContent);

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
