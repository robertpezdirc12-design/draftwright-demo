/**
 * M4 (korak 1) — deterministični generator oziromkovanega dataseta fotografij WPC lamel.
 *
 * Vsak scenarij ima ZNANO resnico (n lamel, sw/gap v mm, H = n·sw + (n−1)·gap),
 * zato je evalucija zaznavanja merljiva (napaka vsake mere). Slike so sintetične
 * (PNG prek @napi-rs/canvas, deterministično — brez RNG, brez binarnih fiksatur v git-u).
 *
 * Skala: PX = 0.25 px/mm; referenčni segment (20,20)–(270,20) = 250 px = 1000 mm
 * (ista konvencija kot tests/photo-variety.test.js). Pri naklonu se celota scena
 * (ograja + referenčni segment) zavrti za tilt° — konci segmenta se izračunajo
 * (calPts), ker kalibracija klika na dejanske pozicije na sliki.
 */
"use strict";
const { createCanvas } = require("@napi-rs/canvas");

const PX = 0.25; // px na mm

function rotDeg(x, y, deg, cx, cy) {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const dx = x - cx, dy = y - cy;
  return [Math.round(cx + dx * c - dy * s), Math.round(cy + dx * s + dy * c)];
}

/**
 * Scenarij: {n, sw, gap, tilt?, lowContrast?, name?}
 * Vrne {name, buffer (PNG), truth:{n,sw,gap,H}, calPts:[p0,p1], tilt, lowContrast}.
 */
function makeRailing(sc) {
  const { n, sw, gap, tilt = 0, lowContrast = false, name } = sc;
  const swPx = sw * PX, gapPx = gap * PX;
  const fw = n * swPx + (n - 1) * gapPx;      // zasedena širina/visoka (px)
  const canvasW = 1200, canvasH = 900, cx = canvasW / 2, cy = canvasH / 2;
  const c = createCanvas(canvasW, canvasH);
  const ctx = c.getContext("2d");
  const bg = lowContrast ? "#b8b8b8" : "#d9d9d9";
  ctx.fillStyle = bg; ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate((tilt * Math.PI) / 180); ctx.translate(-cx, -cy);
  const x0 = Math.round(cx - fw / 2), y0 = Math.round(cy - fw / 2);
  let y = y0;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = lowContrast ? (i % 2 ? "#9a9a9a" : "#a4a4a4") : (i % 2 ? "#5a5a5a" : "#6a6a6a");
    ctx.fillRect(x0, y, fw, swPx); y += swPx;
    if (i < n - 1) { ctx.fillStyle = bg; ctx.fillRect(x0, y, fw, gapPx); y += gapPx; }
  }
  /* referenčni segment 250 px = 1000 mm + končni markaciji */
  ctx.strokeStyle = "#222"; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, 20); ctx.lineTo(270, 20);
  ctx.moveTo(20, 14); ctx.lineTo(20, 26);
  ctx.moveTo(270, 14); ctx.lineTo(270, 26);
  ctx.stroke();
  ctx.restore();
  const [p0, p1] = [rotDeg(20, 20, tilt, cx, cy), rotDeg(270, 20, tilt, cx, cy)];
  return {
    name: name || `${n}x${sw}/${gap}${tilt ? " t" + tilt + "°" : ""}${lowContrast ? " lowC" : ""}`,
    buffer: c.toBuffer("image/png"),
    truth: { n, sw, gap, H: n * sw + (n - 1) * gap },
    calPts: [p0, p1], tilt, lowContrast,
  };
}

/* --- Tier A: standardni pogoji (visok kontrast, naklon 0–6°) — MERITNI (gate) --- */
const TIER_A = [
  { name: "A01", n: 4, sw: 64, gap: 24 },
  { name: "A02", n: 6, sw: 88, gap: 32 },
  { name: "A03", n: 8, sw: 64, gap: 16 },
  { name: "A04", n: 8, sw: 112, gap: 24 },
  { name: "A05", n: 10, sw: 64, gap: 24 },
  { name: "A06", n: 12, sw: 88, gap: 16 },
  { name: "A07", n: 14, sw: 64, gap: 16 },
  { name: "A08", n: 6, sw: 112, gap: 40, tilt: 4 },
  { name: "A09", n: 10, sw: 88, gap: 32, tilt: 6 },
  { name: "A10", n: 4, sw: 112, gap: 40 },
  { name: "A11", n: 12, sw: 64, gap: 24, tilt: 4 },
  { name: "A12", n: 8, sw: 88, gap: 40 },
];

/* --- Tier B: nasprotni pogoji (nizek kontrast) — SAMO OPAZOVANJE, ne gate --- */
const TIER_B = [
  { name: "B01", n: 8, sw: 88, gap: 24, lowContrast: true },
  { name: "B02", n: 10, sw: 64, gap: 24, lowContrast: true, tilt: 6 },
];

module.exports = { PX, makeRailing, TIER_A, TIER_B };
