/**
 * M2 (Issue #2): avto-L iz detekcije je ZANESILNO le pri dovolj visoki konsistentnosti
 * koraka (prag 45 %, isti prag, ki sproži opozorilo v dt()).
 *
 *   - confidence >= 45  →  L se samodejno izpolni iz bbox, označeno S.det.autoL=true (+autoLVal)
 *   - confidence <  45  →  L NE se izpolni (stop-rule: ostane ročno), S.det.autoL=false,
 *                          status opozori »vpisite L ročno«
 *   - uporabniški prevzem (detOverride.L) vedno ima prednost — avto-L se izpusti
 *
 * Test je determinističen: izgradi sintetični svetlostni profil (S.det.gray), tako da
 * applyDetection() doseže vrata (gate) in preveri vsakega od treh vejk. Polje H/n/sw/gap
 * (zanesljiv, iz svetlostnega profila) se ne preverja — tu gre zgolj za vrata avto-L.
 */
"use strict";
const { JSDOM } = require("jsdom");
const { loadAppHtml } = require("./helpers/bootApp");

const html = loadAppHtml();
const errors = [];

/* --- sintetični svetlostni profil: 100×200, vsak stolpec narašča po vzorcu 10px teme / 10px svetlobe --- */
function makeGray() {
  const w = 100, h = 200;
  const gray = new Float32Array(w * h);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) gray[r * w + c] = (r % 20 < 10) ? 40 : 220;
  return { gray, w, h, sc: 1 };
}

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) { window.addEventListener("error", (e) => errors.push(String(e.message || e.error))); },
});
const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* Deterministična priprava: S.det + kalibracija (scale=10 mm/px), bbox → L=1000 mm, če vrata preidejo */
function prime(conf, detOverride) {
  const S = window.S;
  S.det = {
    lines: [{ y0: 0 }, { y0: 199 }],
    sc: 1, cx: 50, ang: 0, rectK: 0,
    gray: makeGray(),
    bbox: { x0: 0, x1: 100, y0: 0, y1: 199 },
    confidence: conf,
  };
  S.detOverride = detOverride && Object.keys(detOverride).length ? detOverride : null;
  S.calibrated = true;
  S.cal = { scale: 10, cos: 1, sin: 0 };
  delete S.det.autoL; delete S.det.autoLVal; delete S.det.autoLNote;
  $("L").value = "3800";
  window.applyDetection();
}

/* --- A) visoka zanesljivost (≥45 %) → avto-L sprejet, L izpolnjen + označen --- */
prime(80, {});
const A = window.S.det;
check("A: L avtomatsko izpolnjen (bbox→1000 mm)", $("L").value === "1000", "L=" + $("L").value);
check("A: označeno S.det.autoL=true + autoLVal", A.autoL === true && A.autoLVal === 1000, "autoL=" + A.autoL + " val=" + A.autoLVal);
check("A: opomba o avto-L (preverite ročno)", /avtomatsko iz detekcije/.test(A.autoLNote || ""), A.autoLNote || "(ni opombe)");

/* --- B) niska zanesljivost (<45 %) → stop-rule: L ostane ročno, avto-L zavrnjen --- */
prime(30, {});
const B = window.S.det;
check("B: L ostane ročno (ni izpolnjen)", $("L").value === "3800", "L=" + $("L").value);
check("B: označeno S.det.autoL=false", B.autoL === false, "autoL=" + B.autoL);
check("B: opomba »vpisite L ročno«", /ro[čc]no/.test(B.autoLNote || "") && /30/.test(B.autoLNote || ""), B.autoLNote || "(ni opombe)");

/* --- C) uporabniški prevzem (detOverride.L) → avto-L vedno izpuščen, tudi pri visoki zanesljivosti --- */
prime(80, { L: 1 });
const C = window.S.det;
check("C: uporabniški L prevzeti — avto-L se izpusti", $("L").value === "3800", "L=" + $("L").value);
check("C: avto-L ni označen (območje ni bilo doseženo)", C.autoL === undefined, "autoL=" + C.autoL);

check("končno: ni JS napak", errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
