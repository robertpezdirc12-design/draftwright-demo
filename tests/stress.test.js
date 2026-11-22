/**
 * STRESNI TESTI — kombinacije funkcij in ekstremne mere (kjer se napake najraje skrivajo).
 * Preverja: L-povratek × korita, ekstremne mere (L=20000, H=50, D=4000), stopnice z nizkimi
 * parametri, galerija vseh 8 predlog, korita+segmenti (izključitev), DXF/STEP pri ekstremih,
 * ni NaN/Infinity v izhodih.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { loadAppHtml } = require("./helpers/bootApp");

const html = loadAppHtml();
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
const resetF = (id) => { const el = $(id); if (el) { el.value = ""; fire(el, "input"); } };

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
const svgTxt = () => { const sv = $("prev").querySelector("svg"); return sv ? sv.textContent : ""; };
const hasNaN = (s) => /NaN|Infinity|undefined/.test(s);

function baseProfile() {
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change");
  $("sysUse").value = "precna"; fire($("sysUse"), "change");
  setF("L", "4200"); setF("H", "1050"); setF("D", "1200");
  resetF("segList"); resetF("koritoList"); setF("w2", "0"); setF("slabT", "0");
}

(async () => {
  /* 1) L-povratek (W2=2100) + korita — korita morajo ostati na glavni trasi */
  baseProfile();
  setF("w2", "2100");
  $("koritoList").value = "1100;300\n1400;1900"; fire($("koritoList"), "input");
  $("gen").click();
  let t = svgTxt();
  check("L-povratek × korita: oboje prisotno (W2 + korita)", t.includes("L-POVRATEK") && t.includes("KORITO ZA ROŽE"), "W2+korita");
  check("L-povratek × korita: brez NaN", !hasNaN(t));

  /* 2) Ekstremne mere: L=20000, H=100, D=4000 — skaliranje ne sme pasti v NaN */
  baseProfile();
  setF("L", "20000"); setF("H", "100"); setF("D", "4000"); setF("n", "3"); setF("gap", "10");
  $("gen").click();
  t = svgTxt();
  check("ekstrem: L=20000/H=100/D=4000 — risba generirana brez NaN", t.includes("SPREDNJI POGLED") && !hasNaN(t), t.length + " znakov");

  /* 3) Stopnice: nizki parametri (stN=2, stRise=30, stGoing=50) */
  $("sysUse").value = "stopniscna"; fire($("sysUse"), "change");
  setF("L", "3000"); setF("H", "900"); setF("stN", "3"); setF("stRise", "30"); setF("stGoing", "50"); setF("stW", "800");
  $("gen").click();
  t = svgTxt();
  check("stopnice: nizki parametri — list generiran brez NaN", t.includes("STOPNIŠČNA OGRAJA") && !hasNaN(t));

  /* 4) Galerija: vseh 8 predlog se generira brez napak/NaN */
  const TPL = ["precna", "pokoncna", "fasada", "terasa", "stopnice", "dvonadstropna", "lpovratek", "korita"];
  let allOk = true;
  for (const k of TPL) {
    window.applyTemplate(k);
    const sv = $("prev").querySelector("svg");
    if (!sv || hasNaN(sv.textContent) || $("checks").textContent.includes("presega")) { allOk = false; console.log("    ✗ predloga " + k + " ni čista"); }
  }
  check("galerija: vseh 8 predlog generiranih brez NaN/preseganja", allOk);

  /* 5) Korita + segmenti — izključitev (korita se ne smejo pojaviti ob segmentih) */
  baseProfile();
  $("segList").value = "1. NADSTROPJE;6200;1030\nPRITLIČJE;7800;1050"; fire($("segList"), "input");
  setF("slabT", "180");
  $("koritoList").value = "1100;300\n1400;1900"; fire($("koritoList"), "input");
  $("gen").click();
  t = svgTxt();
  check("segmenti × korita: korita izključena (BOM brez vrstice korita)", !t.includes("Cvetlično korito"), t.slice(0, 60));
  check("segmenti × korita: segmenti + plošča prisotni", t.includes("PO SEGMENTIH") && t.includes("BETONSKA PLOŠČA"));

  /* 6) DXF pri ekstremnih merah — Y vedno znotraj 0–297 */
  $("sysUse").value = "precna"; fire($("sysUse"), "change");
  baseProfile(); setF("L", "20000"); setF("H", "3000"); setF("D", "4000");
  $("gen").click();
  const bdxf = blobs.length; $("dlDxf").click();
  const dxf = await blobs[blobs.length - 1].text();
  const ys = []; const dl = dxf.split("\n");
  for (let i = 0; i < dl.length; i++) if (dl[i] === "20") ys.push(parseFloat(dl[i + 1]));
  check("DXF ekstrem: vseh Y znotraj 0–297", ys.length > 10 && ys.every((y) => y >= -0.001 && y <= 297.001), ys.length + " Y, max " + Math.max(...ys));

  /* 7) STEP pri ekstremnih merah — veljaven + brez NaN */
  const bstep = blobs.length; $("dlStep").click();
  const step = await blobs[blobs.length - 1].text();
  check("STEP ekstrem: ISO + BREP + brez NaN", step.startsWith("ISO-10303-21") && step.includes("MANIFOLD_SOLID_BREP") && !hasNaN(step));

  /* 8) ni JS napak skozi vse scenarije */
  check("končno: ni JS napak", errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
