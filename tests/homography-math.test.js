/**
 * Pregled 2026-11-23, točka 4 — numerična preverljivost 4-točkovne homografije.
 * tests/vision.test.js preverja le STATUS "uspešna"; tukaj preverjamo dejansko
 * GEOMETRIJO: da znana skrena pikselna mreža se preslika v predvidene mm (per-corner
 * napaka), da afina pod-mreža (ravno pravokotje) se presliša točno (središče→središče),
 * ter da izrojene točke zavrne z napako (ne tiho vrne absurdnih mer).
 * Poganja pravo funkcijo homography/solve prek javnih testnih izvozov (window).
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
const S = window.S;
const homography = window.homography, toMM = window.toMM;

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function near(a, b, tol) { return Math.abs(a - b) <= tol; }

(async () => {
  check("calibration: window.homography / toMM javno dostopno", typeof homography === "function" && typeof toMM === "function");

  /* ---- 1) skrena (perspektivna) mreža: vogali piksel → vogali mm, točno na 1e-4 ---- */
  const src = [{ x: 50, y: 50 }, { x: 300, y: 80 }, { x: 280, y: 320 }, { x: 40, y: 290 }];
  const dst = [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 500 }, { x: 0, y: 500 }];
  const h = homography(src, dst);
  check("homografija: vrne 9 parametrov (3×3, h8=1)", Array.isArray(h) && h.length === 9 && h[8] === 1, JSON.stringify(h && h.slice(0, 3)));
  S.calMode = "plane"; S.calibrated = true; S.cal = { h, corners: src };
  for (let i = 0; i < 4; i++) {
    const p = toMM(src[i]);
    check(`homografija: vogal ${i} → mm (|Δ|<1e-4)`, near(p.x, dst[i].x, 1e-4) && near(p.y, dst[i].y, 1e-4),
      `p(${src[i].x},${src[i].y})→(${p.x.toFixed(4)},${p.y.toFixed(4)}) cilj(${dst[i].x},${dst[i].y})`);
  }
  /* interior točka skrene mreže mora ostati ZNOTRAJ mm- pravokotja (ne degeneracija) */
  const midPx = { x: (src[0].x + src[2].x) / 2, y: (src[0].y + src[2].y) / 2 };
  const midMm = toMM(midPx);
  check("homografija: interior točka znotraj mm-pravokotja", midMm.x >= -1 && midMm.x <= 1001 && midMm.y >= -1 && midMm.y <= 501,
    `(${midMm.x.toFixed(1)},${midMm.y.toFixed(1)})`);

  /* ---- 2) afina pod-mreža: ravno pravokotje → točno (središče piksel = središče mm) ---- */
  const srcA = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 100 }, { x: 0, y: 100 }];
  const dstA = [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 500 }, { x: 0, y: 500 }];
  const hA = homography(srcA, dstA);
  S.cal = { h: hA, corners: srcA };
  const c = toMM({ x: 100, y: 50 });
  check("homografija (afin): središče piksel (100,50) → mm (500,250)", near(c.x, 500, 1e-3) && near(c.y, 250, 1e-3),
    `(${c.x.toFixed(3)},${c.y.toFixed(3)})`);
  const c2 = toMM({ x: 0, y: 0 });
  check("homografija (afin): piksel (0,0) → mm (0,0)", near(c2.x, 0, 1e-3) && near(c2.y, 0, 1e-3), `(${c2.x.toFixed(3)},${c2.y.toFixed(3)})`);

  /* ---- 3) izrojenost: enake / kolinearne točke → solve vrže (ne tihih absurdnih mer) ---- */
  function throws(srcPts, label) {
    let threw = false;
    try { homography(srcPts, dst); } catch (e) { threw = /izrojen/.test(e.message || ""); }
    check(`homografija: izrojene točke zavrnjene (${label})`, threw);
  }
  throws([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], "4× isti vogal");
  throws([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], "kolinearne");
  /* veljavno pravokotje NE sme vrzeti */
  let ok4 = false; try { homography([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }], dst); ok4 = true; } catch (e) { ok4 = false; }
  check("homografija: veljavno pravokotje NE vrže", ok4);

  check("ni JS napak", errors.length === 0, errors.join(" | "));
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("test throw:", e && e.stack || e); process.exit(1); });
