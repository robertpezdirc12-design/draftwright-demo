/**
 * M4 (korak 1) — evalucijska teža + oznaka dataseta za zaznavo lamel (baseline heuristike).
 *
 * Namen: pred katerim koli globinskim modelom M4-ja moramo imeti MERLJIV baseline, kam
 * model primerjamo. Ta suro:
 *   1. generira determinističen oziromkovan dataset (tests/fixtures/slats.js — znana resnica),
 *   2. vsak scenarij poganja skozi obstoječi pipeline (kalibracija 2 točki → zaznava),
 *   3. izmeri napako vsake mere (n, H, sw, gap) glede na resnico in izpiše baseline-poročilo.
 *
 * Monolit: nalaganje prek tehnicka-risba-pro.html (runScripts); pipeline poganja DOM-ovski
 * (paste → kalibracija → detektiraj), enako kot tests/photo-variety.test.js.
 *
 * Stop-rule M4 (roadmap): *če dataset ni dovolj obsežen → ostane heuristika.* Ta suro je
 * evaluacijska teža za to pravilo. Gate: Tier A (standardni pogoji) — n vedno pravilno +
 * H v toleranci. Tier B (nizek kontrast) je SAMO opazovanje.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { createCanvas, Image: NImage } = require("@napi-rs/canvas");
const { makeRailing, TIER_A, TIER_B } = require("./fixtures/slats");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function (type) {
      if (!this.__nc || this.__nc.width !== this.width || this.__nc.height !== this.height)
        this.__nc = createCanvas(Math.max(1, this.width), Math.max(1, this.height));
      return this.__nc.getContext(type || "2d");
    };
    window.Image = NImage;
    window.URL.revokeObjectURL = () => {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* pipeline: nalaganje slike → 2-točkovna kalibracija (refA=1000 mm na calPts) → zaznava */
async function runScenario(sc) {
  const data = makeRailing(sc);
  const prevSrc = $("img").src;
  const ev = new window.Event("paste", { bubbles: true, cancelable: true });
  ev.clipboardData = { items: [{ type: "image/png", getAsFile: () => new window.File([data.buffer], "s.png", { type: "image/png" }) }] };
  document.dispatchEvent(ev);
  for (let i = 0; i < 150 && !$("photoBox").classList.contains("on"); i++) await sleep(30);
  for (let i = 0; i < 150 && $("img").src === prevSrc; i++) await sleep(30);
  await sleep(50);
  $("mLinear").click();
  const ov = $("ov");
  ov.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1200, height: 900 });
  $("pickCal").click();
  [data.calPts[0], data.calPts[1]].forEach((p) =>
    ov.dispatchEvent(new window.MouseEvent("click", { clientX: p[0], clientY: p[1], bubbles: true })));
  $("refA").value = "1000"; fire($("refA"), "input");
  $("applyCal").click();
  $("detect").click();
  await sleep(60);
  return {
    name: data.name,
    truth: data.truth,
    measured: {
      L: Number($("L").value), H: Number($("H").value), n: Number($("n").value),
      sw: Number($("sw").value), gap: Number($("gap").value),
      status: $("detStatus").textContent,
    },
  };
}

function relErr(a, b) { return b === 0 ? (a === 0 ? 0 : 1) : Math.abs(a - b) / Math.abs(b); }

async function evaluate(tier) {
  const rows = [];
  for (const sc of tier) {
    const r = await runScenario(sc);
    const t = r.truth, m = r.measured;
    rows.push({
      name: r.name,
      n_ok: m.n === t.n,
      H_rel: relErr(m.H, t.H),
      sw_rel: relErr(m.sw, t.sw),
      gap_rel: relErr(m.gap, t.gap),
      row: r,
    });
  }
  return rows;
}

function report(rows, label) {
  console.log(`  ── ${label} ──`);
  for (const r of rows) {
    const t = r.row.truth, m = r.row.measured;
    console.log(
      `    ${r.name.padEnd(4)} resnica n=${t.n} H=${t.H} sw=${t.sw} gap=${t.gap}  │  ` +
      `izmerjeno n=${m.n} H=${m.H} sw=${m.sw} gap=${m.gap}  │  ` +
      `H ${r.H_rel < 0.005 ? "" : "Δ"}${Math.round(r.H_rel * 100)}% sw ${Math.round(r.sw_rel * 100)}% gap ${Math.round(r.gap_rel * 100)}%`
    );
  }
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  return {
    nOk: rows.filter((r) => r.n_ok).length,
    HOk: rows.filter((r) => r.H_rel <= 0.12).length,
    swMed: Math.round(med(rows.map((r) => r.sw_rel)) * 100),
    gapMed: Math.round(med(rows.map((r) => r.gap_rel)) * 100),
    total: rows.length,
  };
}

(async () => {
  const A = await evaluate(TIER_A);
  const repA = report(A, "Tier A (standardni pogoji) — GATE");

  check("Tier A: ni JS napak v pipeline-u", errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");
  check("Tier A: n (število lamel) vedno pravilno", repA.nOk === repA.total, `${repA.nOk}/${repA.total}`);
  check("Tier A: H znotraj 12 % resnice", repA.HOk === repA.total, `${repA.HOk}/${repA.total}`);
  console.log(`    BASELINE heuristike (Tier A): n ${repA.nOk}/${repA.total} · H ${repA.HOk}/${repA.total} · medians sw ${repA.swMed} % / gap ${repA.gapMed} %`);
  console.log(`    UVID: n/H profil-neodvisna (robustna) → M4 globinski model prinaša vrednost predvsem na osi sw/gap (profil-povezana).`);

  const B = await evaluate(TIER_B);
  const repB = report(B, "Tier B (nizek kontrast) — opazovanje");
  console.log(`    Opazovanje Tier B: n ${repB.nOk}/${repB.total} · H ${repB.HOk}/${repB.total} · sw ${repB.swMed} % / gap ${repB.gapMed} %`);

  check("baseline zabeležen: Tier A n-robustnost potrjena (heuristic baseline drži)",
    repA.nOk === repA.total, repA.nOk === repA.total ? "heuristika robustna → M4 DL motiviran" : "heuristika šibka → M4 DL nujen");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
