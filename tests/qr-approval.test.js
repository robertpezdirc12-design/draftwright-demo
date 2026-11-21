/**
 * QR koda + odobritev stranke: 
 * - qrSvg-ish: svgVariant({qr:true}) doda QR (s povezavo za ogled) v izvoz (SVG).
 * - Odobritev v view mode: vbApprove → modal → vnos imena → shranjeno v localStorage →
 *   status prikazan; ponovno nalaganje istega projekta pokaže potrdilo.
 * Poganja `npm test`.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const blobQueue = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.URL.createObjectURL = (b) => { blobQueue.push(b); return "blob:test"; };
    window.HTMLAnchorElement.prototype.click = function () {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const setF = (id, v) => { $(id).value = String(v); fire($(id), "input"); };

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

(async () => {
  /* predpriprava projekta (L/H + naziv) */
  setF("proj", "BALKONSKA OGRADA");
  setF("drw", "BO-100");
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change");
  setF("L", "4200"); setF("H", "1050");
  $("gen").click();

  /* 1) QR v izvozu (SVG) — vendored qrcode eval v okno kot brskalnik */
  window.eval(fs.readFileSync(path.join(__dirname, "..", "vendor", "qr-core.js"), "utf8"));
  check("qr: vendored qrcode na voljo", typeof window.qrcode === "function");
  const withQr = window.svgVariant({ paper: "A3", watermark: false, meta: true, qr: true });
  const qrMods = (withQr.match(/ fill="#111"/g) || []).length;
  check("qr: svgVariant({qr}) vsebuje QR skupino + modulne rect-e", typeof withQr === "string" && withQr.includes('data-qr="1"') && qrMods > 50, qrMods + " modulov");
  const withoutQr = window.svgVariant({ paper: "A3", watermark: false, meta: true });
  check("qr: svgVariant (brez qr) nima QR skupine", !withoutQr.includes('data-qr="1"'), "brez QR");

  /* 2) checkbox v izvoznem dialogu obstaja */
  $("exportDialog").click();
  const qrCb = document.querySelector('#expAdv [data-exp-adv="qr"]');
  check("qr: checkbox v naprednih možnostih", !!qrCb);
  $("expCancel").click();

  /* 3) odobritev stranke (view mode) */
  $("vbApprove").click();
  check("odobritev: modal odprt", $("apprOverlay").classList.contains("on"));
  $("apprName").value = "Mojster d.o.o."; fire($("apprName"), "input");
  $("apprConfirm").click();
  const approvals = window.approvalsAll();
  check("odobritev: shranjeno v localStorage", approvals.length >= 1 && approvals[0].name === "Mojster d.o.o." && approvals[0].drw === "BO-100");
  check("odobritev: status prikazan v viewBar", $("vbApprovalStatus").textContent.includes("✓ Potrjeno: Mojster d.o.o."), $("vbApprovalStatus").textContent);

  /* 4) ponovno nalaganje istega projekta → potrdilo prikazano */
  $("vbEdit").click();
  $("prjName").value = "BO-100 test"; $("prjSave").click();
  document.querySelector('[data-prj-open="0"]').click();
  check("odobritev: status po ponovnem nalaganju", $("vbApprovalStatus").textContent.includes("✓ Potrjeno"), $("vbApprovalStatus").textContent || "(prazen)");

  /* 5) prazno ime → napaka, ne shranjevanje */
  $("vbApprove").click();
  $("apprName").value = ""; fire($("apprName"), "input");
  $("apprConfirm").click();
  const before = window.approvalsAll().length;
  $("apprClose").click();
  check("odobritev: prazno ime zavrnjeno (brez shranjevanja)", $("apprNote").textContent.includes("Vpišite") && window.approvalsAll().length === before, $("apprNote").textContent);

  check("končno: ni JS napak", errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
