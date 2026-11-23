/**
 * Regresijski testi za popravke iz celovitega pregleda 2026-11-23
 * (docs/review-2026-11-23.md). Vse preizkusi poganjajo pravo aplikacijo prek jsdom.
 *
 *  A) P0: vlečenje zaznanih lamelnih črt je bilo samo mouse-only (mousedown/move/up)
 *     → zdaj pointer* dogodki + touch-action:none (tablične/dotik).
 *  B) P1: (1) izvozna papirna velikost se ob PREKLICU vrne (tiha mutacija risbe),
 *     (2) diskriminacija Ctrl+Z/Y po zadnjem domenu (LAST_EDIT) — tloris/skica/parametri.
 *  C) P2: sanitizacija izvozov — CSV formula-injection (skupno csvCell) in STEP
 *     projektne oznake (besedilo z \n / \\ / ' iz nezaupanih virov).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [], blobs = [], downloads = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    w.URL.revokeObjectURL = () => {};
    w.URL.createObjectURL = (b) => { blobs.push(b); return "blob:test"; };
    w.HTMLAnchorElement.prototype.click = function () {
      const b = blobs.shift();
      downloads.push({ name: this.download || "", text: b ? b.text() : Promise.resolve("") });
    };
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function setF(id, v) { $(id).value = String(v); fire($(id), "input"); }

(async () => {
  /* ============ A) pointer vlečenje lamelnih črt (tablični/dotik) ============ */
  const S = window.S;
  S.img = { naturalWidth: 200, naturalHeight: 200 };
  S.det = { lines: [{ y0: 100 }, { y0: 150 }], sc: 1, cx: 0, ang: 0, rectK: 0, bbox: { x0: 0, x1: 100, y0: 100, y1: 150 }, confidence: 60 };
  S.calibrated = false; // le lamelne črte; preskoči kalibracijski blok v drawOverlay
  const ov = $("ov");
  ov.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200 });
  function ptr(type, el, x, y) { el.dispatchEvent(new window.PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, bubbles: true })); }
  // pointerdown na višini prve črte (y=100)
  ptr("pointerdown", ov, 0, 100);
  check("A: pointerdown sproži S.drag (tablični start)", S.drag && S.drag.i === 0, JSON.stringify(S.drag));
  const before = S.det.lines[0].y0;
  ptr("pointermove", ov, 0, 125);
  check("A: pointermove premakne črto", S.det.lines[0].y0 === 125 && before === 100, "y0: " + before + " → " + S.det.lines[0].y0);
  window.dispatchEvent(new window.PointerEvent("pointerup", { pointerId: 1, bubbles: true }));
  check("A: pointerup sredi S.drag", S.drag === null);
  check("A: CSS touch-action:none na #ov (v stilu)", /#ov\{[^}]*touch-action:\s*none/.test(html), "pravilo v viru");
  // regression: miška (mousedown/mousemove/mouseup) na #ov ni več v kodi — zamenjala jo je pointer*
  check("A: mousedown/mousemove handlerja na #ov odstranjena", !/ovEl\.addEventListener\("mousedown|ovEl\.addEventListener\("mousemove|window\.addEventListener\("mouseup/.test(html), "ni starih mouse handlerjev");

  /* ============ B) izvozna papirna velikost se ob preklicu vrne ============ */
  setF("paper", "A3");
  $("exportDialog").click();
  $("expPaper").value = "A4"; fire($("expPaper"), "change");
  check("B: med izvozom je risba v A4", $("paper").value === "A4", "paper=" + $("paper").value);
  $("expCancel").click();
  check("B: ob PREKLICU se format vrne na A3", $("paper").value === "A3", "paper=" + $("paper").value);
  // odprtje + uspešen izvoz: format ostane sinhroniziran (ni vračanja)
  $("exportDialog").click();
  check("B: dialog se znova odpre (paperBefore=A3)", $("expPaper").value === "A3", "expPaper=" + $("expPaper").value);

  /* ============ B2) diskriminacija undo domen (LAST_EDIT) ============ */
  // privzeti domain je "params" → parametricni undo aktiven
  const tlSec = document.querySelector('section[data-panel="tloris"]');
  const skSec = document.querySelector('section[data-panel="skica"]');
  // klik v sklop tloris → domain preklopi
  tlSec.dispatchEvent(new window.PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
  check("B2: pointerdown v tlorisu sklopi domain na 'tloris'", String(window.LAST_EDIT) === "tloris", "LAST_EDIT=" + window.LAST_EDIT);
  skSec.dispatchEvent(new window.PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
  check("B2: pointerdown v skici sklopi domain na 'skica'", String(window.LAST_EDIT) === "skica", "LAST_EDIT=" + window.LAST_EDIT);

  /* ============ C) CSV formula-injection (skupno csvCell) ============ */
  check("C: csvCell je javno (testno dostopno)", typeof window.csvCell === "function");
  if (typeof window.csvCell === "function") {
    // ob omiljenem formula-celici vsebina začne z enikatom narekovajem (predpono ')
    // in cela celica je obdajena z dvojnim narekovajem → " ' ...
    check("C: celica z '=' omiljena z predpono '", window.csvCell('=HYPERLINK("x")').startsWith("\"'"), JSON.stringify(window.csvCell('=HYPERLINK("x")')));
    check("C: celica z '+' omiljena", window.csvCell('+cmd').startsWith("\"'"), JSON.stringify(window.csvCell('+cmd')));
    check("C: celica z '@' omiljena", window.csvCell('@SUM(A1)').startsWith("\"'"), JSON.stringify(window.csvCell('@SUM(A1)')));
    check("C: čista celica ostane nespremenjena", window.csvCell('Lamela ROMB-67') === '"Lamela ROMB-67"', JSON.stringify(window.csvCell('Lamela ROMB-67')));
    check("C: čista celica NI omiljena", !window.csvCell('Lamela ROMB-67').startsWith("\"'"), JSON.stringify(window.csvCell('Lamela ROMB-67')));
    check("C: pike v celici podvojene", window.csvCell('a"b') === '"a""b"', JSON.stringify(window.csvCell('a"b')));
    check("C: številka ostane nespremenjena", window.csvCell(42) === '"42"', JSON.stringify(window.csvCell(42)));
  }

  /* ============ C2) STEP: projektne oznake iz nezaupanega vira ============ */
  setF("drw", "EVIL\n0\nSECTION 'INJ");
  downloads.length = 0;
  $("dlStep").click();
  await sleep(20);
  const stepDl = downloads.find((d) => /\.step$/.test(d.name));
  let stepTxt = "";
  if (stepDl) stepTxt = await stepDl.text;
  check("C2: STEP datoteka ustvarjena", !!stepDl, stepDl ? stepDl.name : "ni .step");
  if (stepTxt) {
    // naslov v FILE_NAME/PRODUCT sme biti enovrsticni: brez pomika vrstice, backslasha, enikatih narekovajev
    check("C2: STEP ime brez pomika vrstice", !stepTxt.includes("EVIL\n0"), "pomik ostal");
    check("C2: STEP ime brez enikatih narekovajev", !/PRODUCT\('[^']*\n/.test(stepTxt) && !stepTxt.includes("'INJ"), "oklepaj ostal");
  }

  check("ni JS napak", errors.length === 0, errors.join(" | "));
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("test throw:", e && e.stack || e); process.exit(1); });
