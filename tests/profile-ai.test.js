/**
 * AI-prepoznavanje profila (poglobljen, zastonj klasifikator):
 * - ROMB-67 (67/20) → predlog ROMB-67 z visokim zaupanjem
 * - POLNA-128 (128/16) → POLNA-128
 * - DESKA-150 (150/25) → DESKA-150
 * - Nejasen primer (npr. 220 mm) → brez predloga (niza confidence)
 * - Sporočilo statusa vsebuje zaupanje in alternative.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { createCanvas, Image: NImage } = require("@napi-rs/canvas");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const PX = 0.25;

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
  const btn = $("applySuggestedProf");
  return {
    status: $("detStatus").textContent,
    btnTxt: btn ? btn.textContent : "",
    btnVisible: btn ? btn.style.display !== "none" : false,
    w: Number($("sw").value),
  };
}

(async () => {
  const romb = await loadAndDetect(synth({ W: 3000, H: 1000, n: 8, sw: 67, gap: 20 }));
  check("ROMB: predlog ROMB-67 + viden gumb", romb.btnVisible && romb.btnTxt.includes("ROMB-67"), romb.btnTxt.slice(0, 60));
  check("ROMB: status vsebuje zaupanje in alternativa", romb.status.includes("zaupanje") && (romb.status.includes("alternativa") || romb.status.includes("alternativ")), romb.status.slice(0, 120));

  const polna = await loadAndDetect(synth({ W: 4000, H: 1100, n: 8, sw: 128, gap: 16 }));
  check("POLNA-128: predlog POLNA-128", polna.btnVisible && polna.btnTxt.includes("POLNA-128"), polna.btnTxt.slice(0, 60));

  const deska = await loadAndDetect(synth({ W: 4500, H: 1200, n: 7, sw: 150, gap: 25 }));
  check("DESKA-150: predlog DESKA-150", deska.btnVisible && deska.btnTxt.includes("DESKA-150"), deska.btnTxt.slice(0, 60));

  const nejasno = await loadAndDetect(synth({ W: 4000, H: 1200, n: 6, sw: 220, gap: 20 }));
  check("nejasno (220 mm): brez predloga", !nejasno.btnVisible, nejasno.btnTxt.slice(0, 40) || "(gumb skrit)");

  check("končno: ni JS napak", errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
