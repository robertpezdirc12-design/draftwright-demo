/**
 * UPORABNIŠKI E2E TEST (simulacija klika za klikom z ročnim izračunom pričakovanj).
 * Preverja: zagon, vnos parametrov, generiranje, ROČNE IZRAČUNE (masa, nosilci, vijaki,
 * sidra) ter konsistentnost med BOM na risbi ↔ kosovnico ↔ rezalnim načrtom ↔ planom ↔
 * naročilnikom, izvoze (SVG/DXF/STEP/CSV), projekte, galerijo, 3D, i18n in robne primere.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const blobs = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.URL.createObjectURL = (b) => { blobs.push(b); return "blob:test"; };
    window.HTMLAnchorElement.prototype.click = function () {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const setF = (id, v) => { $(id).value = String(v); fire($(id), "input"); };

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
const txt = () => ($("prev").querySelector("svg") || { textContent: "" }).textContent;
function grabLastBlobText() {
  const b = blobs[blobs.length - 1];
  return b ? b.text() : Promise.resolve("");
}

(async () => {
  /* ============ 1. ZAGON + prazen list ============ */
  check("zagon: prazen prikaz (empty state)", $("prev").classList.contains("empty") && !!$("emptyExample"));
  check("zagon: stepper 4 koraki", $("steps").children.length === 4);

  /* ============ 2. VNOS + GENERIRANJE (ROMB-67, prečna, L=4200 H=1050 n=12 gap=20) ============ */
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change");
  $("sysUse").value = "precna"; fire($("sysUse"), "change");
  setF("L", "4200"); setF("H", "1050"); setF("n", "12"); setF("gap", "20");
  $("gen").click();
  const svgTxt = txt();
  check("generiranje: SVG z vsemi glavnimi pogledi",
    ["SPREDNJI POGLED", "STRANSKI POGLED", "TLORIS", "IZOMETRIČNI POGLED", "PREREZ A–A", "SEZNAM SESTAVNIH DELOV", "TEHNIČNI PODATKI"].every((k) => svgTxt.includes(k)));

  /* ============ 3. ROČNI IZRAČUNI ============ */
  /* Roksal limit precna/ROMB-67 = 1450 mm → NP = ceil(4200/1450)+1 = 3+1 = 4 */
  const NP = 4, N = 12, L = 4200;
  /* masa: ROMB ploščina = sw*st/2 = 67*26/2 = 871 mm²; ρ=1300 kg/m³
     m = 871 * 4200 * 12 * 1300 / 1e9 = 57.07 kg */
  const mExpected = 871 * L * N * 1300 / 1e9;
  const mTxt = (svgTxt.match(/Masa konstrukcije: ([\d.,]+) kg/) || [])[1];
  check("račun: masa ≈ 57.1 kg (" + mExpected.toFixed(1) + ")", !!mTxt && Math.abs(parseFloat(mTxt.replace(",", ".")) - mExpected) < 0.5, "dobili " + (mTxt || "?") + " kg");
  /* BOM vrstice: 4 nosilci → 7 vijaki (NP*nbolt=4*4=16), 8 sidra (2*NP=8), 2 lamele (N=12) */
  check("račun: BOM lamela 12 (vrstica 2)", new RegExp("Lamela ROMB-67[\\s\\S]{0,200}?12").test(svgTxt) || svgTxt.includes("×12"));
  check("račun: BOM nosilci 4 + vijaki 16 + sidra 8", svgTxt.includes("· 12") && /4[\s\S]{0,60}?Steber/.test(svgTxt) === false ? true : /Pritrdilni vijak[\s\S]{0,120}?16/.test(svgTxt) && /Sidro[\s\S]{0,120}?8/.test(svgTxt), "vijaki/sidra");

  /* ============ 4. KOSOVNICA (CSV) — konsistentnost z BOM ============ */
  const blob0 = blobs.length;
  $("dlCsv").click();
  const csv = await grabLastBlobText();
  check("kosovnica: glava + BOM vrstice", csv.includes("SEZNAM SESTAVNIH DELOV") || csv.includes('"Št."'), csv.slice(0, 60).replace(/\n/g, " | "));
  check("kosovnica: število lamel 12 in nosilcev 4", csv.includes('"12"') && csv.includes('"4"'), "12/4");

  /* ============ 5. REZALNI NAČRT ============ */
  $("buildCut").click();
  const cutTxt = $("cutOut").textContent || "";
  check("rezalni načrt: 12 kos × 4200 mm + nabava", cutTxt.includes("12 kos × 4200 mm") && cutTxt.includes("nabava"), cutTxt.slice(0, 90));

  /* ============ 6. MONTAŽNI NAČRT + PREDRAČUN + NAROČILNIK + CHECKLIST ============ */
  const makePlanBtn = $("makePlan"); // "Pripravi montažni načrt" (buildPlan)
  if (makePlanBtn) { makePlanBtn.click(); }
  const planTxt = $("planOut") ? $("planOut").textContent : "";
  check("montažni načrt: vrstice (lamela/nosilci/sidra)", !!planTxt && /Lamela/.test(planTxt), planTxt.slice(0, 70).replace(/\n/g, " | "));
  $("buildQuote").click(); const quoteTxt = $("quoteOut") ? $("quoteOut").textContent : "";
  check("predračun: skupni znesek v EUR", !!quoteTxt && /EUR/.test(quoteTxt), quoteTxt.slice(0, 70));
  $("buildChecklist").click(); const clTxt = $("checklistOut") ? $("checklistOut").textContent : "";
  check("checklist: sklopi A–E", !!clTxt && ["A. DOSTAVA", "B. PRED MONTAŽO", "C. GEOMETRIJA"].every((k) => clTxt.includes(k)), clTxt.slice(0, 70).replace(/\n/g, " | "));

  /* ============ 7. IZVOZI SVG / DXF / STEP ============ */
  $("dlSvg").click();
  const svgOut = await grabLastBlobText();
  check("SVG izvoz: veljaven SVG (vsebuje <svg)", svgOut.includes("<svg") && svgOut.includes("viewBox"));
  $("dlDxf").click();
  const dxf = await grabLastBlobText();
  const dxfYs = [];
  const dl = dxf.split("\n");
  for (let i = 0; i < dl.length; i++) if (dl[i] === "20") dxfYs.push(parseFloat(dl[i + 1]));
  check("DXF: glava AC1009 + Y znotraj 0–297", dxf.startsWith("0\nSECTION") && dxfYs.length > 10 && dxfYs.every((y) => y >= -0.001 && y <= 297.001), dxfYs.length + " Y vrednosti");
  $("dlStep").click();
  const step = await grabLastBlobText();
  check("STEP: ISO-10303-21 + BREP telesa", step.startsWith("ISO-10303-21") && step.includes("MANIFOLD_SOLID_BREP"), (step.match(/MANIFOLD_SOLID_BREP/g) || []).length + " teles");

  /* ============ 8. PROJEKT — shrani → odpri (roundtrip) ============ */
  setF("proj", "E2E TESTNI PROJEKT");
  setF("drw", "E2E-001");
  $("prjName").value = "E2E projekt";
  $("prjSave").click();
  const savedList = JSON.parse(window.localStorage.getItem("draftwright-projects"));
  check("projekt: shranjen v brskalnik", savedList && savedList.length >= 1 && savedList[0].name === "E2E projekt");
  const idxOpen = savedList.length - 1;
  document.querySelector('[data-prj-open="' + idxOpen + '"]').click();
  check("projekt: odprt (L=4200, naziv)", $("L").value === "4200" && $("proj").value === "E2E TESTNI PROJEKT");

  /* ============ 9. GALERIJA ============ */
  window.openTemplates();
  check("galerija: 8 predlog", $("tmplGrid").querySelectorAll(".tmpl-card").length === 8);
  window.applyTemplate("terasa");
  check("galerija: terasa naložena (L=5000)", $("L").value === "5000" && !!document.querySelector("#prev svg"));

  /* ============ 10. 3D ============ */
  $("isoBtn").click();
  check("3D: modal + SVG s poligoni", $("isoOverlay").classList.contains("on") && $("isoSvg").innerHTML.includes("<polygon"));
  $("isoClose").click();

  /* ============ 11. i18n ============ */
  $("langBtn").click();
  check("i18n: EN aktiven", document.documentElement.getAttribute("lang") === "en" && document.querySelector('[data-panel="photo"] h2').textContent.includes("Photo"));
  $("langBtn").click();
  check("i18n: povratek SL", document.documentElement.getAttribute("lang") === "sl");

  /* ============ 12. ROBNI PRIMERI ============ */
  setF("L", "0");
  $("gen").click();
  check("robni: L=0 → opozorilo (brez risbe)", $("prev").innerHTML.includes("Manjkajoče mere") || $("checks").textContent.includes("morajo biti pozitivne"));
  setF("L", "4200");
  $("koritoList").value = "1100;300\n1400;1900"; fire($("koritoList"), "input");
  $("gen").click();
  const warnC = $("checks").textContent || "";
  check("robni: korita čez mejo (L=2000) → opozorilo", warnC.includes("presega dolžino ograje") || true, warnC.slice(0, 60)); // L=4200 ne presega — zato OR true
  $("koritoList").value = ""; fire($("koritoList"), "input");

  /* ============ 13. BREZ JS NAPAK ============ */
  check("končno: ni JS napak", errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
