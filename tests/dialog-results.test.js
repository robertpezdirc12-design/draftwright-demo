/**
 * UX popravki iz uporabniške povratne informacije:
 * - rezultati orodij (rezalni načrt / predračun / montažni načrt / checklist) se odprejo
 *   v MODALU čez ekran (ne skrito območje),
 * - fotografija: klik → povečan pogled,
 * - tloris/skica: fullscreen urejanje čez ekran.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
let fsCalls = 0;

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.HTMLAnchorElement.prototype.click = function () {};
    window.HTMLElement.prototype.requestFullscreen = function () { fsCalls++; return Promise.resolve(); };
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
  setF("proj", "BALKONSKA OGRADA");
  setF("drw", "BO-200");
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change");
  setF("L", "3800"); setF("H", "1050"); setF("n", "10"); setF("gap", "20");
  $("gen").click();

  /* 1) rezalni načrt → modal z rezultatom */
  $("buildCut").click();
  check("rezalni: modal odprt z vsebino", $("resultOverlay").classList.contains("on") && $("resultTitle").textContent.includes("Rezalni načrt") && $("resultBody").textContent.includes("nabava"));
  $("resultClose").click();
  check("rezalni: modal se zapre", !$("resultOverlay").classList.contains("on"));

  /* 2) predračun → modal z EUR */
  $("buildQuote").click();
  check("predračun: modal z EUR", $("resultOverlay").classList.contains("on") && $("resultBody").textContent.includes("EUR"));
  $("resultClose").click();

  /* 3) montažni načrt → modal z Lamela */
  $("makePlan").click();
  check("montažni načrt: modal z Lamela", $("resultOverlay").classList.contains("on") && $("resultBody").textContent.includes("Lamela"));
  $("resultClose").click();

  /* 4) checklist → modal vsebuje DOSTAVA (A–E) */
  $("buildChecklist").click();
  check("checklist: modal z DOSTAVA/sklopi", $("resultOverlay").classList.contains("on") && $("resultBody").textContent.includes("DOSTAVA") && $("resultBody").textContent.includes("FOTOGRAFSKA"));
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("checklist: Esc zapre", !$("resultOverlay").classList.contains("on"));

  /* 5) foto: klik → povečan pogled */
  $("img").src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Crect width='10' height='10' fill='%23aaa'/%3E%3C/svg%3E";
  $("img").click();
  check("foto: povečan pogled odprt", $("photoZoomOverlay").classList.contains("on") && $("photoZoomImg").src === $("img").src);
  $("photoZoomClose").click();
  check("foto: zapre se", !$("photoZoomOverlay").classList.contains("on"));

  /* 6) fullscreen tloris/skica */
  $("tlrFs").click();
  check("tloris: fullscreen poklican", fsCalls >= 1);
  $("skFs").click();
  check("skica: fullscreen poklican", fsCalls >= 2);

  check("končno: ni JS napak", errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
