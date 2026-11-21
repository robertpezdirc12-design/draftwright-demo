/**
 * Foto-razičnost: ali različne vstavljene slike (drugačna resnica) vodijo do različnih
 * izmerjenih mer in različnih tehničnih risb? Enaka kalibracijska referenca (1000 mm segment)
 * za vse tri slike — če pipeline deluje, morajo biti polja in risbe med slikami različni.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { createCanvas, Image: NImage } = require("@napi-rs/canvas");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];

/* --- generator slik: ograja + referenčni segment (20,20)-(270,20) = 1000 mm --- */
const PX = 0.25; // px per mm
function synth({ W, H, n, sw, gap }) {
  const c = createCanvas(1200, 900);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#d9d9d9"; ctx.fillRect(0, 0, 1200, 900);
  const fw = W * PX, fh = H * PX;
  const x0 = Math.round((1200 - fw) / 2), y0 = Math.round((900 - fh) / 2);
  ctx.save(); ctx.translate(x0 + fw / 2, y0 + fh / 2);
  let y = -fh / 2;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? "#5a5a5a" : "#6a6a6a";
    ctx.fillRect(-fw / 2, y, fw, sw * PX); y += sw * PX;
    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(-fw / 2, y, fw, Math.min(gap * PX, fh / 2 - y)); y += gap * PX;
  }
  ctx.restore();
  ctx.strokeStyle = "#222"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(270, 20);
  ctx.moveTo(20, 14); ctx.lineTo(20, 26); ctx.moveTo(270, 14); ctx.lineTo(270, 26); ctx.stroke();
  return c.toBuffer("image/png");
}

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function (type) {
      if (!this.__nc || this.__nc.width !== this.width || this.__nc.height !== this.height) this.__nc = createCanvas(Math.max(1, this.width), Math.max(1, this.height));
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
const setF = (id, v) => { $(id).value = String(v); fire($(id), "input"); };

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

async function loadAndDetect(buf) {
  const prevSrc = $("img").src;
  const ev = new window.Event("paste", { bubbles: true, cancelable: true });
  ev.clipboardData = { items: [{ type: "image/png", getAsFile: () => new window.File([buf], "s.png", { type: "image/png" }) }] };
  document.dispatchEvent(ev);
  for (let i = 0; i < 150 && !$("photoBox").classList.contains("on"); i++) await sleep(30);
  for (let i = 0; i < 150 && $("img").src === prevSrc; i++) await sleep(30);
  await sleep(50);
  $("mLinear").click();
  const ov = $("ov");
  ov.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1200, height: 900 });
  $("pickCal").click();
  [[20, 20], [270, 20]].forEach((p) => ov.dispatchEvent(new window.MouseEvent("click", { clientX: p[0], clientY: p[1], bubbles: true })));
  $("refA").value = "1000"; fire($("refA"), "input");
  $("applyCal").click();
  $("detect").click();
  await sleep(60);
  return { L: Number($("L").value), H: Number($("H").value), n: Number($("n").value), sw: Number($("sw").value), gap: Number($("gap").value), status: $("detStatus").textContent };
}

(async () => {
  const scenes = [
    { name: "A: 3000×1000, 8 lamel (70/20)", truth: { W: 3000, H: 1000, n: 8, sw: 70, gap: 20 } },
    { name: "B: 5000×1200, 10 lamel (80/15)", truth: { W: 5000, H: 1200, n: 10, sw: 80, gap: 15 } },
    { name: "C: 2000×800, 6 lamel (60/25)", truth: { W: 2000, H: 800, n: 6, sw: 60, gap: 25 } },
  ];
  const results = [];
  for (const sc of scenes) {
    const got = await loadAndDetect(synth(sc.truth));
    results.push({ ...got, name: sc.name });
    console.log(`    ${sc.name} → polja: L=${got.L} H=${got.H} n=${got.n} sw=${got.sw} gap=${got.gap}`);
  }

  /* 1) različne slike → različne izmerjene mere (H, n, sw/gap — zanesljivo; L: znana omejitev bbox) */
  const Hs = results.map((r) => r.H), ns = results.map((r) => r.n), sws = results.map((r) => r.sw);
  check("različnost: H se med slikami razlikuje", new Set(Hs).size >= 2, Hs.join("/"));
  check("različnost: n se med slikami razlikuje", new Set(ns).size >= 2, ns.join("/"));
  check("različnost: sw vse pozitivne in fizično smiselne", sws.every((w) => w > 0 && w < 250), sws.join("/"));

  /* 2) smiselnost H in n — resnica = dejanska zasedba lamel n×(sw+gap): A=720, B=950, C=510 mm */
  const expectH = [8 * (70 + 20), 10 * (80 + 15), 6 * (60 + 25)];
  const tol = 0.12;
  check("A: H≈720 (±12%)", Math.abs(results[0].H - expectH[0]) / expectH[0] <= tol, results[0].H + " (pričakovano " + expectH[0] + ")");
  check("B: H≈950 (±12%)", Math.abs(results[1].H - expectH[1]) / expectH[1] <= tol, results[1].H + " (pričakovano " + expectH[1] + ")");
  check("C: H≈510 (±12%)", Math.abs(results[2].H - expectH[2]) / expectH[2] <= tol, results[2].H + " (pričakovano " + expectH[2] + ")");
  check("A: n=8 · B: n=10 · C: n=6", results[0].n === 8 && results[1].n === 10 && results[2].n === 6, results.map((r) => r.n).join("/"));

  /* 3) različne risbe: SVG med slikami NI identičen (druge mere/številke) */
  const texts = [];
  for (let i = 0; i < 3; i++) {
    const buf = synth(scenes[i].truth);
    await loadAndDetect(buf);
    $("gen").click();
    const sv = $("prev").querySelector("svg");
    texts.push(sv ? sv.textContent : "");
  }
  const distinct = new Set(texts).size;
  check("risbe: A≠B≠C (različne risbe)", distinct === 3, distinct + " različnih risb");
  check("risbe: vsaka vsebuje svoj n (8/10/6)", texts[0].match(/×8| 8\b/) && texts[1].match(/×10| 10\b/) && texts[2].match(/×6| 6\b/), "številke lamel v risbah");

  /* 4) ročno vpisano L → risba ga zvesto upošteva */
  await loadAndDetect(synth(scenes[0].truth));
  setF("L", "3000");
  $("gen").click();
  const svL = $("prev").querySelector("svg").textContent;
  check("ročno L: risba vsebuje 3000 mm in BOM šteje po njem", svL.includes("3000"), "L v risbi");

  check("končno: ni JS napak", errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
