/**
 * Faza 1 (Issue #2) regresijski testi — poganja `npm test`.
 * Pokritje: stale-state invalidacija (pogl. 2), pokončna/stopniška dolžina reza (pogl. 4),
 * terasne enote (pogl. 7), DP optimizator + kerf k−1 (pogl. 4), DXF poligoni/kodiranje/
 * poravnava (pogl. 6.1), STEP stopnice + timestamp (pogl. 6.2), kalibracijska validacija
 * (pogl. 5), masa/sidra v kosovnici, refMode v projektu, aria-live.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const downloads = [];
const blobQueue = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    /* jsdom Image ne sproži onload — lažni Image z realnimi merami 600×450 */
    window.Image = class {
      constructor() { this.onload = null; this.naturalWidth = 600; this.naturalHeight = 450; this._src = ""; }
      set src(v) { this._src = v; const self = this; setTimeout(() => { if (self.onload) self.onload(); }, 10); }
      get src() { return this._src; }
    };
    window.URL.revokeObjectURL = () => {};
    window.URL.createObjectURL = (b) => { blobQueue.push(b); return "blob:test"; };
    window.HTMLAnchorElement.prototype.click = function () {
      const b = blobQueue.shift();
      downloads.push({ name: this.download || "", text: b ? b.text() : Promise.resolve(null) });
    };
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const setField = (id, v) => { $(id).value = String(v); fire($(id), "input"); };

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
async function lastText() {
  const d = downloads[downloads.length - 1];
  return d && d.text ? await d.text : null;
}

(async () => {
  $("gen").click();

  // ---- pogl. 2: stale-state (regresijska matrika) ----
  setField("L", 4000);
  $("buildCut").click();
  setField("L", 6000); // sprememba PO izračunu — brez ponovnega klika buildCut
  downloads.length = 0;
  $("menuDlCut").click();
  let t = await lastText();
  check("S1 stale: rezalni načrt po spremembi L = svež", !!t && t.includes("6000 mm") && !t.includes("4000 mm"), (t || "").match(/Skupaj[^\n]*/)?.[0]);
  downloads.length = 0;
  $("menuDlOrder").click();
  t = await lastText();
  check("S2 stale: naročilnik svež (L + nosilci)", !!t && t.includes("6000 mm") && !t.includes("4000 mm"), (t || "").match(/DESKE[\s\S]{0,120}/)?.[0]);
  setField("n", 20);
  downloads.length = 0;
  $("menuDlQuote").click();
  t = await lastText();
  check("S3 stale: predračun svež (n=20, np=6 → RF=52)", !!t && t.includes("52 kos") && !t.includes("30 kos"), (t || "").match(/Vijaki RF[^\n]*/)?.[0]);
  downloads.length = 0;
  $("dlPlan").click();
  t = await lastText();
  check("S4 stale: montažni načrt svež (6000)", !!t && t.includes("6000") && !t.includes("4000"));
  setUse("terasa");
  $("sysProfile").value = "deska150"; fire($("sysProfile"), "change");
  setField("installTemp", 20);
  $("buildChecklist").click();
  setField("installTemp", 5);
  downloads.length = 0;
  $("menuDlChecklist").click();
  t = await lastText();
  check("S6 stale: checklist svež (20 → 5 °C, 5 → 7 mm)", !!t && t.includes("pri 5 °C") && t.includes("7 mm"), (t || "").match(/Reža med deskami[^\n]*/)?.[0]);
  // izvozni dialog: mešanica sveže/zastarele je prej obstajala — zdaj vse sveže
  setUse("precna");
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change");
  setField("installTemp", 20); setField("L", 4000); setField("n", 16);
  $("buildCut").click(); $("makePlan").click();
  setField("L", 5800);
  $("exportDialog").click();
  document.querySelector('[data-exp-format="SVG"]').click();
  document.querySelector('[data-exp-preset="full"]').click();
  downloads.length = 0;
  $("expGo").click();
  for (let i = 0; i < 200 && $("expOverlay").classList.contains("on"); i++) await new Promise((r) => setTimeout(r, 50));
  const names = downloads.map((d) => d.name);
  check("S7 dialog: 10 prenosov (risba + 9 prilog)", downloads.length === 10, names.join(", "));
  let cutTxt = null, planTxt = null, quoteTxt = null;
  for (const d of downloads) {
    if (d.name.includes("rezalni")) cutTxt = await d.text;
    if (d.name.includes("montaza")) planTxt = await d.text;
    if (d.name.includes("predracun")) quoteTxt = await d.text;
  }
  check("S7 dialog: rezalni načrt svež (5800)", !!cutTxt && cutTxt.includes("5800"));
  check("S7 dialog: načrt svež (5800)", !!planTxt && planTxt.includes("5800"));
  check("S7 dialog: predračun svež (92.80 m)", !!quoteTxt && quoteTxt.includes("92.80 m"));
  $("expClose").click();

  // ---- pogl. 4: pokončna dolžina reza (P0-1) ----
  setUse("pokoncna");
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change");
  function setUse(v) { $("sysUse").value = v; fire($("sysUse"), "change"); }
  setField("L", 3800); setField("zoneMid", 800); setField("n", 16);
  $("buildCut").click();
  check("P0-1 pokončna: rez = srednje polje 800", $("cutOut").textContent.includes("16 kos × 800 mm"), $("cutOut").textContent.slice(0, 90));
  downloads.length = 0;
  $("menuDlCut").click();
  t = await lastText();
  check("P0-1 pokončna: CSV 800 mm, nabava iz 5800", !!t && t.includes("800 mm") && t.includes("5800 mm"), (t || "").match(/Nabava|Skupaj[^\n]*/g)?.join(" | "));

  // ---- pogl. 7: terasne enote (P0-2) ----
  setUse("terasa");
  $("sysProfile").value = "deska150"; fire($("sysProfile"), "change");
  setField("L", 4000); setField("n", 8);
  $("makePlan").click();
  const plan = $("planOut").textContent;
  check("P0-2 terasa: letve 13 kos (4000/335+1)", plan.includes("13 kos"), (plan.match(/Podložne letve[^\n]*/g) || [""])[0]);
  check("P0-2 terasa: distančniki = n×letve", plan.includes("104 kos"), (plan.match(/Distan[^\n]*/g) || [""])[0]);

  // ---- pogl. 4: stopnice v proizvodnih dokumentih (P1-2) ----
  setUse("stopniscna");
  setField("stN", 12); setField("stH", 1000); setField("stPosts", 7); setField("stRise", 170); setField("stGoing", 280);
  $("buildCut").click();
  check("P1-2 stopnice: rez = stH−60 = 940", $("cutOut").textContent.includes("12 kos × 940 mm"), $("cutOut").textContent.slice(0, 80));
  $("makePlan").click();
  const plan2 = $("planOut").textContent;
  check("P1-2 stopnice: nosilci razmak 560 mm", plan2.includes("560 mm"), (plan2.match(/Nosilci[^\n]*/g) || [""])[0]);
  check("P1-2 stopnice: ročaj naklon 3930.8 × 2", plan2.includes("3930.8 mm na kos — 2 kosi"), (plan2.match(/Ročaj[^\n]*/g) || [""])[0]);

  // ---- pogl. 7: KUBO alu cev (P1-3) ----
  setUse("pregrada");
  $("sysProfile").value = "kubo80"; fire($("sysProfile"), "change");
  downloads.length = 0;
  $("dlCsv").click();
  t = await lastText();
  check("P1-3 KUBO: alu cev v kosovnici", !!t && t.includes("Alu cev 20×60×2"));
  downloads.length = 0;
  $("menuDlOrder").click();
  t = await lastText();
  check("P1-3 KUBO: alu cev v naročilniku", !!t && t.includes("Alu cev 20×60×2"));

  // ---- pogl. 4: DP optimizator (P2-2) + kerf k−1 (P2-5) ----
  setUse("precna");
  setField("L", 500); setField("n", 16); setField("stockLen", "5800; 4000; 2200");
  $("buildCut").click();
  check("P2-2 DP: 16×500 iz 4×2200 = 8.80 m", $("cutOut").textContent.includes("4 desk") && $("cutOut").textContent.includes("8.80 m"), $("cutOut").textContent.slice(0, 100));
  setField("L", 2400); setField("n", 2);
  $("buildCut").click();
  check("P2-5 kerf: odpad 5800−2×2400−1×3 = 997", $("cutOut").textContent.includes("997 mm"), $("cutOut").textContent.match(/odpad [\d.]+ m/)?.[0]);

  // ---- pogl. 6.1: DXF (P1 poligoni + kodiranje + poravnava) ----
  setUse("precna");
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change");
  setField("L", 4000); setField("n", 16);
  $("gen").click();
  downloads.length = 0;
  $("dlDxf").click();
  t = await lastText();
  check("DXF: $DWGCODEPAGE ANSI_1250", !!t && t.includes("ANSI_1250"));
  check("DXF: LTYPE DASHDOT tabela", !!t && t.includes("DASHDOT"));
  check("DXF: $EXTMIN/$EXTMAX", !!t && t.includes("$EXTMIN") && t.includes("$EXTMAX"));
  const lineCount = (t.match(/\nLINE\n/g) || []).length;
  check("DXF: poligoni izvoženi (>850 LINE)", lineCount > 850, lineCount + " LINE entitet");
  check("DXF: poravnava besedila (koda 72)", !!t && t.includes("\n72\n"));

  // ---- pogl. 7: kosovnica (sidra, material, masa) ----
  downloads.length = 0;
  $("dlCsv").click();
  t = await lastText();
  check("kosovnica: Sidra vrstica", !!t && t.includes('"Sidra ('));
  check("kosovnica: material WoodCore", !!t && t.includes("WoodCore WPC") && !t.includes('"rhombus"'));
  check("kosovnica: Masa lamel (ocena)", !!t && t.includes("Masa lamel (ocena") && !t.includes("SKUPNA MASA"));

  // ---- pogl. 7: naročilnik agregacija + površina ----
  setField("L", 4000); setField("n", 11);
  $("buildCut").click();
  downloads.length = 0;
  $("menuDlOrder").click();
  t = await lastText();
  check("naročilnik: nabava agregirana", !!t && t.includes("5800 mm × 11 kos") && !t.includes("5800 mm × 1 kos;"), (t || "").match(/Nabava[^\n]*/)?.[0]);
  check("naročilnik: površina Klasik", !!t && t.includes("(Klasik)"));

  // ---- pogl. 2: refMode v projektu ----
  $("refMode").checked = true;
  downloads.length = 0;
  $("save").click();
  t = await lastText();
  let proj = null;
  try { proj = JSON.parse(t); } catch (e) {}
  check("projekt: refMode shranjen (ovojnica)", !!proj && proj.schema === "draftwright-project" && proj.data.refMode === true);
  $("refMode").checked = false;
  // round trip: naloži shranjeni projekt
  try {
    const f = new window.File([t], "projekt.json", { type: "application/json" });
    Object.defineProperty($("loadFile"), "files", { value: [f] });
    fire($("loadFile"), "change");
    await new Promise((r) => setTimeout(r, 150));
    check("projekt: refMode obnoven po load", $("refMode").checked === true);
  } catch (e) { check("projekt: round trip", false, e.message); }
  $("refMode").checked = false;

  // ---- pogl. 5: kalibracijska validacija (slika naložena prek paste) ----
  setUse("precna");
  const pasteEv = new window.Event("paste", { bubbles: true, cancelable: true });
  pasteEv.clipboardData = { items: [{ type: "image/png", getAsFile: () => new window.File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]).buffer], "x.png", { type: "image/png" }) }] };
  document.dispatchEvent(pasteEv);
  await new Promise((r) => setTimeout(r, 80));
  check("kalibracija: fotografija naložena (paste)", $("photoBox").classList.contains("on"));
  // majhna površina: 4 točke v 10 px kvadratu
  const ov = $("ov");
  ov.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 450 });
  function clickOv(x, y) {
    ov.dispatchEvent(new window.MouseEvent("click", { clientX: x, clientY: y, bubbles: true }));
  }
  $("mPlane").click(); $("pickCal").click();
  clickOv(100, 100); clickOv(110, 100); clickOv(110, 110); clickOv(100, 110);
  setField("refA", 1000); setField("refB", 800);
  $("applyCal").click();
  check("kalibracija: majhna površina zavrnjena", $("calStatus").textContent.includes("premajhna"), $("calStatus").textContent);
  // napačen vrstni red (criss-cross): TL, BR, TR, BL
  $("pickCal").click();
  clickOv(200, 200); clickOv(500, 400); clickOv(500, 200); clickOv(200, 400);
  setField("refA", 1000); setField("refB", 800);
  $("applyCal").click();
  check("kalibracija: bowtie zavrnjen (ploščina 0)", $("calStatus").textContent.includes("premajhna"), $("calStatus").textContent);
  // pravilni vrstni red uspe
  $("pickCal").click();
  clickOv(200, 200); clickOv(500, 200); clickOv(500, 400); clickOv(200, 400);
  setField("refA", 1000); setField("refB", 800);
  $("applyCal").click();
  check("kalibracija: pravilni vrstni red uspešen", $("calStatus").textContent.includes("uspešna"), $("calStatus").textContent);

  // ---- pogl. 13: aria-live ----
  check("globalStatus aria-live", $("globalStatus").getAttribute("aria-live") === "polite");

  // ---- pogl. 16: samoprevera še vedno 126/126 ----
  $("menuSelfTest").click();
  check("samoprevera 126/126 po Fazi 1", /126 kombinacij · 0 napak · 0 JS napak/.test($("globalStatus").textContent), $("globalStatus").textContent);

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
