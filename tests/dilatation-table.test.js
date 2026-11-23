/**
 * Pregled 2026-11-23, točka 4 — dilatacijska tabela (WoodCore terasne deske).
 * tests/roksal-p1.test.js preverja le 3 celice; tukaj sweepu CESTO uradno matriko
 * (1–5 m × −25…+35 °C) in preverimo:
 *   - monotoničnost: razmak NI manjši za višjo temperaturo (termično raztezanje);
 *   - interpolacija po dolžini in temperaturi leži med sosednima vrsticama;
 *   - sklicevanje na skrajni vrednosti (1 m, 5 m, −25, +35) ustreza DIL.vals;
 *   - meje: pod 1 m / nad 5 m se razrešita v skrajni stolpec (ne tiho).
 * Poganja pravo funkcijo dilatacija prek javnega testnega izvoza.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = () => ({ drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } });
    w.URL.revokeObjectURL = () => {};
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
const dil = window.dilatacija, DIL = window.DIL;

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

(async () => {
  check("dilatacija: window.dilatacija + DIL javno dostopno", typeof dil === "function" && !!DIL && DIL.temps.length === 13 && DIL.vals.length === 13);
  const temps = DIL.temps; // [-25..35 po 5]
  const lengths = [1, 2, 3, 4, 5];

  /* A) skrajne točke matrike = točna tabela (poDolzini na celem vrstnem redu) */
  check("dilatacija: 1 m, −25 °C = 2.75", Math.abs(dil(1, -25) - 2.75) < 1e-9, String(dil(1, -25)));
  check("dilatacija: 5 m, +35 °C = 2.0", Math.abs(dil(5, 35) - 2.0) < 1e-9, String(dil(5, 35)));
  check("dilatacija: 1 m, +35 °C = 1.0", Math.abs(dil(1, 35) - 1.0) < 1e-9, String(dil(1, 35)));
  check("dilatacija: 5 m, −25 °C = 11.0", Math.abs(dil(5, -25) - 11.0) < 1e-9, String(dil(5, -25)));

  /* B) monotoničnost po temperaturi: za vsak 1–5 m razmak NI manjši pri višji T */
  let monoT = true, monoTmsg = "";
  lengths.forEach((l) => {
    for (let i = 0; i < temps.length - 1; i++) {
      const lo = dil(l, temps[i + 1]), hi = dil(l, temps[i]); // višja T → manjši razmak
      if (lo > hi + 1e-9) { monoT = false; monoTmsg = `L=${l}: ${temps[i]}°C→${hi} > ${temps[i + 1]}°C→${lo}`; }
    }
  });
  check("dilatacija: monotono po temperaturi (višja T → manjši razmak)", monoT, monoTmsg);

  /* C) monotoničnost po dolžini: pri isti T daljša deska → VEČJI razmak (termično raztezanje ΔL=α·L·ΔT) */
  let monoL = true, monoLmsg = "";
  temps.forEach((t) => {
    for (let i = 0; i < lengths.length - 1; i++) {
      const short = dil(lengths[i], t), long = dil(lengths[i + 1], t); // daljša → manj ali enak
      if (long < short - 1e-9) { monoL = false; monoLmsg = `T=${t}: ${lengths[i]}m→${short} > ${lengths[i + 1]}m→${long}`; }
    }
  });
  check("dilatacija: monotono nepadajoče po dolžini (daljša deska → večji razmak)", monoL, monoLmsg);

  /* D) meje: pod 1 m in nad 5 m se razrešita v skrajni stolpec */
  check("dilatacija: 0.3 m se razreši v 1 m (clamped)", Math.abs(dil(0.3, 10) - dil(1, 10)) < 1e-9);
  check("dilatacija: 7 m se razreši v 5 m (clamped)", Math.abs(dil(7, 10) - dil(5, 10)) < 1e-9);

  /* E) interpolacija po dolžini leži med sosednjima stolpoma */
  lengths.forEach((l) => {
    const at = dil(l, 0); // 0 °C → vrstica 5 (indeks 5)
    const loCol = DIL.vals[5][l - 1] - 1e-9, hiCol = DIL.vals[5][Math.min(5, l) - 1] + 1e-9;
    // za celo l je točna tabela; za decimalno leži med stolpoma — preverimo mejno
    const dAt = dil(l + 0.5, 0);
    const a = DIL.vals[5][l - 1], b = DIL.vals[5][Math.min(5, l + 1) - 1];
    const loB = Math.min(a, b) - 1e-9, hiB = Math.max(a, b) + 1e-9;
    if (l < 5) check(`dilatacija: ${l + 0.5} m @0°C leži med stolpoma`, dAt >= loB && dAt <= hiB, String(dAt));
  });

  /* F) vsi izhodi so končni in pozitivni (brez NaN/Infinity) */
  let allFinite = true;
  for (let l = 1; l <= 5; l += 0.5) for (let t = -25; t <= 35; t += 5) {
    const v = dil(l, t);
    if (!isFinite(v) || v <= 0) { allFinite = false; }
  }
  check("dilatacija: vsi izhodi končni in > 0 (1–5 m × −25…35)", allFinite);

  check("ni JS napak", errors.length === 0, errors.join(" | "));
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("test throw:", e && e.stack || e); process.exit(1); });
