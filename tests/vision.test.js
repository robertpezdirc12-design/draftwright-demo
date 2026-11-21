/**
 * Faza 2 (Issue #2 §5) — realno pikselno testiranje zaznavanja lamel z @napi-rs/canvas.
 * Sintetične fotografije z eksaktno resnico (ograjа 3200×1880 mm, 8 lamel × 200 mm,
 * 7 rež × 40 mm, referenčni segment 1000 mm — onesnaževalo), interakcija izključno
 * prek DOM dogodkov (paste → FileReader → Image → grayOf → detect → applyDetection).
 * Vir pravil: vid audit m2-vision + redesign verižnega štetja (chainEdges).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { createCanvas, Image: NImage } = require("@napi-rs/canvas");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];

// resnica (mm) — vhod v generator slik
const TRUTH = { W: 3200, H: 1880, n: 8, sw: 200, gap: 40, ref: 1000, pxPerMM: 0.25 };

function drawFence(canvas, opts) {
  const o = opts || {};
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  // ozadje (svetlo, ob_gradnja za ograjo)
  ctx.fillStyle = "#d9d9d9"; ctx.fillRect(0, 0, W, H);
  const ppm = TRUTH.pxPerMM;
  const fw = TRUTH.W * ppm, fh = TRUTH.H * ppm;
  const x0 = Math.round((W - fw) / 2), y0 = Math.round((H - fh) / 2);
  const rot = (o.rotationDeg || 0) * Math.PI / 180;
  const nN = o.nN || TRUTH.n, swM = o.swMM || TRUTH.sw, gapM = o.gapMM || TRUTH.gap;
  ctx.save();
  ctx.translate(x0 + fw / 2, y0 + fh / 2);
  if (rot) ctx.rotate(rot);
  if (o.perspective) {
    // perspektivna približka: konvergentna višina lamel (spodaj širše, zgoraj ožje)
    ctx.transform(1, 0, o.perspective, 1, 0, 0);
  }
  // lamele + reže
  let y = -fh / 2;
  for (let i = 0; i < nN; i++) {
    ctx.fillStyle = i % 2 ? "#5a5a5a" : "#6a6a6a"; // temne lamele
    ctx.fillRect(-fw / 2, y, fw, swM * ppm);
    y += swM * ppm;
    ctx.fillStyle = "#d9d9d9"; // reža (svetla)
    ctx.fillRect(-fw / 2, y, fw, Math.min(gapM * ppm, fh / 2 - y));
    y += gapM * ppm;
  }
  ctx.restore();
  // referenčni segment 1000 mm — onesnaževalo (vodoravna črta s konici, nad ograjo)
  ctx.strokeStyle = "#222"; ctx.lineWidth = 3;
  const rx = 20, ry = 20, rl = TRUTH.ref * ppm;
  ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + rl, ry);
  ctx.moveTo(rx, ry - 6); ctx.lineTo(rx, ry + 6);
  ctx.moveTo(rx + rl, ry - 6); ctx.lineTo(rx + rl, ry + 6);
  ctx.stroke();
}

function synthPNG(opts) {
  const c = createCanvas(1200, 900);
  drawFence(c, opts);
  if (opts && opts.occluder) {
    // Faza 3 (F6): suha veja čez sredinski stolpec — srednja svetlost (med lamelo in ozadjem)
    const ctx2 = c.getContext("2d");
    ctx2.fillStyle = "#8a7a5a";
    ctx2.fillRect(560, 170, 90, 580);
  }
  if (o_noise(opts)) {
    const ctx = c.getContext("2d");
    const d = ctx.getImageData(0, 0, c.width, c.height);
    let seed = 42;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296 - 0.5;
    for (let i = 0; i < d.data.length; i += 4) {
      const nz = rnd() * 2 * (opts.noise || 0);
      d.data[i] = Math.max(0, Math.min(255, d.data[i] + nz));
      d.data[i + 1] = Math.max(0, Math.min(255, d.data[i + 1] + nz));
      d.data[i + 2] = Math.max(0, Math.min(255, d.data[i + 2] + nz));
    }
    ctx.putImageData(d, 0, 0);
  }
  return c.toBuffer("image/png");
  function o_noise(x) { return x && x.noise ? x : null; }
}

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    // REALNI piksli: canvas getContext preusmerjen na @napi-rs/canvas
    window.HTMLCanvasElement.prototype.getContext = function (type) {
      if (!this.__nc || this.__nc.width !== this.width || this.__nc.height !== this.height) {
        this.__nc = createCanvas(Math.max(1, this.width), Math.max(1, this.height));
      }
      return this.__nc.getContext(type || "2d");
    };
    window.Image = NImage; // realno dekodiranje data URL
    window.URL.revokeObjectURL = () => {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
async function loadAndDetect(opts) {
  const buf = synthPNG(opts);
  const prevSrc = $("img").src;
  const dataUrl = "data:image/png;base64," + buf.toString("base64");
  const ev = new window.Event("paste", { bubbles: true, cancelable: true });
  ev.clipboardData = { items: [{ type: "image/png", getAsFile: () => new window.File([buf], "s.png", { type: "image/png" }) }] };
  document.dispatchEvent(ev);
  // čakaj, da je fotografija res naložena (FileReader + NImage decode; prvi load zahteva init)
  for (let i = 0; i < 150 && !$("photoBox").classList.contains("on"); i++) {
    await new Promise((r) => setTimeout(r, 30));
  }
  // Faza 3 (F6): photoBox je lahko že "on" od prejšnje slike — čakaj, da je NOVA slika dejansko
  // dekodirana ($("img").src se nastavi šele v im.onload)
  for (let i = 0; i < 150 && $("img").src === prevSrc; i++) {
    await new Promise((r) => setTimeout(r, 30));
  }
  await new Promise((r) => setTimeout(r, 40));
  // kalibracija na referenčnem segmentu (20,20)→(270,20) = 1000 mm (nariše ga drawFence)
  $("mLinear").click(); // H pusti plane način — vsilimo linearnega (2 točki)
  const ov = $("ov");
  ov.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1200, height: 900 });
  const clickOv = (x, y) => ov.dispatchEvent(new window.MouseEvent("click", { clientX: x, clientY: y, bubbles: true }));
  $("pickCal").click();
  clickOv(20, 20); clickOv(270, 20);
  const ra = $("refA"); ra.value = "1000"; fire(ra, "input");
  $("applyCal").click();
  $("detect").click();
  await new Promise((r) => setTimeout(r, 30));
  return {
    status: $("detStatus").textContent,
    n: Number($("n").value),
    H: Number($("H").value),
    sw: Number($("sw").value),
    gap: Number($("gap").value),
  };
}
const near = (v, ref, pct) => Math.abs(v - ref) / ref <= pct;

(async () => {
  // A) idealna + referenčno onesnaženje (prej: n=+1..+2, H +17 %)
  let r = await loadAndDetect({});
  check("A ideal+referenca: n = 8 (veriga odstrani onesnaževalo)", r.n === TRUTH.n, "n=" + r.n + ", " + r.status.slice(0, 60));
  check("A: H znotraj ±3 % (1880)", near(r.H, TRUTH.H, 0.03), "H=" + r.H);

  // B) šum + vinjeta
  r = await loadAndDetect({ noise: 22 });
  check("B šum: n = 8", r.n === TRUTH.n, "n=" + r.n);
  check("B: H ±3 %", near(r.H, TRUTH.H, 0.03), "H=" + r.H);

  // C) zamegljeno
  r = await loadAndDetect({ blur: 4 });
  check("C zamegljeno: n = 8", r.n === TRUTH.n, "n=" + r.n);

  // D) rotacija 5°
  r = await loadAndDetect({ rotationDeg: 5 });
  check("D rotacija 5°: n = 8 (naklon skeniran)", r.n === TRUTH.n, "n=" + r.n + ", status=" + r.status.slice(0, 50));

  // E) izmerjene sw/gap (prej konstanta 0,88/0,12 → gap −28 %)
  r = await loadAndDetect({});
  check("E: sw izmerjena ±20 % (200)", near(r.sw, TRUTH.sw, 0.2), "sw=" + r.sw);
  check("E: gap izmerjena ±20 % (40; prej −28 % sistemsko)", r.gap > 0 && near(r.gap, TRUTH.gap, 0.2), "gap=" + r.gap);

  // F) perspektiva — dokumentirana omejitev: opozorilo mora biti prikazano
  r = await loadAndDetect({ perspective: 0.18 });
  check("F perspektiva: opozorilo o naklonu/priporočilo ročnega merjenja", r.status.includes("naklon") || r.status.includes("ročno"), r.status.slice(0, 90));

  // G) regresija: kalibracija + izmerjene mere se pravilno uporabijo
  r = await loadAndDetect({});
  check("G: zaznava nastavi n v vnosno polje", $("n").value === String(TRUTH.n));

  // H) PERSPEKTIVA + 4-točkovna kalibracija → REKTIFIKACIJA (prej: n −37 %, H −43,5 %)
  //    vogali trapeza (šir 0,18): TL(158,215) TR(958,215) BR(1042,685) BL(242,685)
  const buf2 = synthPNG({ perspective: 0.18 });
  const ev2 = new window.Event("paste", { bubbles: true, cancelable: true });
  ev2.clipboardData = { items: [{ type: "image/png", getAsFile: () => new window.File([buf2], "p.png", { type: "image/png" }) }] };
  document.dispatchEvent(ev2);
  for (let i = 0; i < 150 && !$("photoBox").classList.contains("on"); i++) await new Promise((r2) => setTimeout(r2, 30));
  const ov2 = $("ov");
  ov2.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1200, height: 900 });
  $("mPlane").click();
  $("pickCal").click();
  const corners = [[158, 215], [958, 215], [1042, 685], [242, 685]];
  corners.forEach(([x, y]) => ov2.dispatchEvent(new window.MouseEvent("click", { clientX: x, clientY: y, bubbles: true })));
  const ra2 = $("refA"); ra2.value = "3200"; fire(ra2, "input");
  const rb2 = $("refB"); rb2.value = "1880"; fire(rb2, "input");
  $("applyCal").click();
  check("H: kalibracija uspešna (4 točke)", $("calStatus").textContent.includes("uspešna"), $("calStatus").textContent);
  $("detect").click();
  await new Promise((r2) => setTimeout(r2, 30));
  r = { n: Number($("n").value), H: Number($("H").value), sw: Number($("sw").value), gap: Number($("gap").value), status: $("detStatus").textContent };
  check("H: rektificirano — n = 8", r.n === TRUTH.n, "n=" + r.n);
  check("H: rektificirano — H ±5 % (1880; prej −43,5 %)", near(r.H, TRUTH.H, 0.05), "H=" + r.H);
  check("H: rektificirano — sw ±20 % (200)", near(r.sw, TRUTH.sw, 0.2), "sw=" + r.sw);
  check("H: rektificirano — gap ±25 % (40)", r.gap > 0 && near(r.gap, TRUTH.gap, 0.25), "gap=" + r.gap);
  check("H: status omenja rektifikacijo", r.status.includes("rektificiranem"), r.status.slice(0, 90));

  // I) Faza 3 (F6): ovire — suha veja čez sredinski stolpec; večstolpčna mediana še vedno šteje 8
  r = await loadAndDetect({ occluder: true });
  check("I ovire: veja čez sredinski stolpec — n = 8 (večstolpčno)", r.n === TRUTH.n, "n=" + r.n + ", " + r.status.slice(0, 60));

  // J) Faza 3 (F6): ROMB fazi 15° — vidni pas 70 mm / fuga 17 mm (korak 87 ohranjen; kamera
  //    pod kotom skrije faze) → pretvorba v nominalno sw=67 iz registra + fuga 20 iz koraka
  r = await loadAndDetect({ swMM: 70, gapMM: 17, nN: 11 });
  check("J ROMB: štetje n = 11 (korak kotno neodvisen)", r.n === 11, "n=" + r.n);
  check("J ROMB: sw → nominalna 67 iz Roksal registra", r.sw === 67, "sw=" + r.sw);
  check("J ROMB: fuga iz koraka ≈ 20", Math.abs(r.gap - 20) <= 2.5, "gap=" + r.gap + ", " + r.status.slice(0, 90));

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
