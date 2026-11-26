/**
 * Lokalne izboljšave brez omrežja:
 *  1) L iz bboxa uporablja mm/naravni px (ne mm/sivi px) — prej 1/sc preveč pri foto >900 px.
 *  2) Vektorski predlog nove ograje čez fotografijo (SVG prekrivka, brez AI).
 *  3) Enotne statusne oznake in EN prevodi v UI-ju.
 * Izvozi (SVG/PDF/CSV) se ne spreminjajo — zlati posnetki ostanejo identični.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const htmlPath = path.join(__dirname, "..", "tehnicka-risba-pro.html");
const html = fs.readFileSync(htmlPath, "utf8");
const errors = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    w.URL.revokeObjectURL = () => {};
    w.URL.createObjectURL = () => "blob:test";
    w.HTMLAnchorElement.prototype.click = function () {};
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
const $ = (id) => window.document.getElementById(id);
/* Stara koda nima novih elementov/izvozov — FAIL mora biti preverjanje, ne izjema. */
const tx = (id) => { const e = $(id); return e ? e.textContent : ""; };
const clickProposal = () => { const b = $("proposalBtn"); if (b && !b.classList.contains("on")) b.click(); };
const mark = (k) => (typeof window.statusMark === "function" ? window.statusMark(k) : "");

/* --- 1) L z naravnimi piksli, ne s sivimi --- */
window.S.calibrated = true;
window.S.calMode = "linear";
window.S.cal = { scale: 2 }; // 2 mm na naravni px
const grayW = 900, grayH = 600, gray = new Float32Array(grayW * grayH);
/* 8 temnih prog po 45 px, 7 svetlih rež po 9 px → zadnji konec pri 423 px. */
for (let row = 0; row < grayH; row++) {
  const inSlats = row < 423 && (row % 54) < 45;
  const v = inSlats ? 20 : 200;
  for (let col = 0; col < grayW; col++) gray[row * grayW + col] = v;
}
window.S.det = {
  lines: [{ y0: 0, ang: 0 }, { y0: 1000, ang: 0 }], cx: 450, sc: 0.5, ang: 0,
  bbox: { x0: 100, x1: 820, y0: 0, y1: 1000 },
  confidence: 80, gray: { w: grayW, h: grayH, gray: gray }, rectK: 0
};
window.S.detOverride = {};
["n", "sw", "gap", "L", "H"].forEach((id) => { $(id).value = ""; });
window.applyDetection();
check("L: bbox v naravnih px · 2 mm/px = 1440 mm (ne 2880)", $("L").value === "1440", "L=" + $("L").value);
check("H/sw/gap še vedno iz sivih px · 4 mm/px", $("H").value === "1692" && $("sw").value === "180" && $("gap").value === "36",
  `${$("H").value}/${$("sw").value}/${$("gap").value}`);
check("n ostane število lamel", $("n").value === "8", $("n").value);

/* --- 2) lokalni vektorski predlog --- */
/* Kalibracijske oznake v drawOverlay() potrebujejo točki a/b; za ta del je ne potrebujemo. */
window.S.calibrated = false;
window.S.img = { naturalWidth: 1000, naturalHeight: 600 };
$("sysProfile").value = "romb67";
$("sysColor").value = "Amazon wood";
$("sysUse").value = "precna";
check("gumb za predlog obstaja", !!$("proposalBtn"));
clickProposal();
const on = $("ov").innerHTML;
check("predlog je v SVG prekrivki", on.includes('id="dw-proposal"'));
/* drawOverlay() že nariše bbox kot <rect> — štejemo lamele samo znotraj naše skupine. */
const grp = (on.match(/<g id="dw-proposal"[\s\S]*?<\/g>/) || [""])[0];
check("izrisanih je 8 lamele", (grp.match(/<rect /g) || []).length === 8, (grp.match(/<rect /g) || []).length + " rect");
check("stebri so izrisani iz roksalLimit", (on.match(/<line /g) || []).length >= 3, (on.match(/<line /g) || []).length + " line");
check("barva izhaja iz WoodCore palete", on.includes("#8b5a2b"));
check("status pojasnjuje vir mer", /mere iz risbe, ne iz slike/.test(tx("detStatus")), tx("detStatus"));
check("predlog ne vsebuje zunanjih URL-jev", !/https?:\/\//.test(on));
if ($("proposalBtn")) $("proposalBtn").click();
check("drugi klik skrije predlog", !$("ov").innerHTML.includes('id="dw-proposal"'));

/* --- 3) statusne oznake in prevodi --- */
/* Pred prevodom znova pokažimo predlog: preverjamo sporočilo o prikazu. */
clickProposal();
check("DW_STATUS ima štiri kanonične oznake",
  Object.keys(window.DW_STATUS || {}).length === 4 && mark("estimated") === "≈ ocenjeno");
check("neznan ključ vrne ?? neznano", mark("xxx") === "?? neznano");
const legend = tx("statusLegend");
check("legenda prikazuje vse štiri oznake",
  ["✓ izmerjeno", "∑ izračunano", "≈ ocenjeno", "?? neznano"].every((s) => legend.includes(s)), legend);
/* Pravi preklop jezika gre prek gumba: applyLang() sam ne shrani izbire,
   syncLive() pa dinamična sporočila prevaja glede na lngGet() iz localStorage. */
$("langBtn").click();
check("EN: gumb preveden", tx("proposalBtn") === "Railing proposal on photo", tx("proposalBtn"));
check("EN: legenda prevedena", /Markers: .+ measured.+ calculated.+ estimated.+ unknown/.test(tx("statusLegend")),
  tx("statusLegend"));
check("EN: status sporočilo prevedeno", tx("detStatus") === "Railing proposal shown — dimensions come from the drawing, not the photo", tx("detStatus"));
$("langBtn").click();
check("SL: povratek na slovenski gumb", tx("proposalBtn") === "Predlog ograje na sliki");

/* --- 4) offline jamstvo ostane --- */
const fetchCalls = [...html.matchAll(/fetch\s*\(\s*([^)]*)/g)];
check("še vedno natanko en fetch (lokalni font)", fetchCalls.length === 1, "fetch=" + fetchCalls.length);
check("novi handler ne kliče omrežja",
  !/proposalBtn[\s\S]{0,600}?fetch\(/.test(html));
check("brez JS napak", errors.length === 0, errors.join(" | "));

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ""}`);
process.exit(fail || errors.length ? 1 : 0);
