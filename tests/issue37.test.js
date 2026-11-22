/**
 * #37 — Post-audit correctness defects (regresija, monolitna različica).
 * Pokritje:
 *   1. montažni načrt in rezalni načrt uporabljata isti avtoritativni izračun (zaloge/kerf);
 *   2. vijaki RF se povečajo ob segmentih/L-povratku in so konsistentni med dokumenti;
 *   3. shrani→naloži→shrani ohrani fotografijo; projekt brez foto očisti stale stanje;
 *   4. povezava za ogled vključuje polja con/globine (non-default);
 *   5. 3D predogled vključuje segmente in L-povratek (pariteta).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const blobQueue = [];
let capturedPromptUrl = null;

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.URL.createObjectURL = (b) => { blobQueue.push(b); return "blob:test"; };
    window.HTMLAnchorElement.prototype.click = function () {};
    window.prompt = (_msg, def) => { capturedPromptUrl = def; return def; };
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function $ (id) { return document.getElementById(id); }
function fire(el, type) { el.dispatchEvent(new window.Event(type, { bubbles: true })); }
function setF(id, v) { const el = $(id); el.value = v; fire(el, "input"); }
async function lastBlobText() { return blobQueue[blobQueue.length - 1].text(); }
function grabNum(text, label) {
  const idx = text.indexOf(label);
  if (idx < 0) return null;
  const rest = text.slice(idx);
  const m = rest.match(/(\d+)\s*kos/);
  return m ? Number(m[1]) : null;
}

(async () => {

/* ---------- 1. buildPlan ↔ buildCut konsistentnost ---------- */
setF("sysUse", "precna"); fire($("sysProfile"), "change");
setF("L", "1450"); setF("n", "8"); setF("stockLen", "5800"); setF("kerf", "3");
$("buildCut").click();
const cutTxt = $("cutOut").textContent;
check("1: rezalni načrt — kerf upoštevan (5800/1450/3 → 3 deske)", /3 desk/.test(cutTxt) && cutTxt.includes("8 kos × 1450 mm"), (cutTxt.match(/nabava \d+ desk/) || [""])[0]);
check("1: rezalni načrt — odpad > 0 (fizikalno: kerf)", /odpad \d+,\d+ m/.test(cutTxt.replace(/\./g, ",")), (cutTxt.match(/odpad [^\n]*/) || [""])[0]);
$("makePlan").click();
const planTxt = $("planOut").textContent;
check("1: montažni načrt — ista nabava (3 desek)", planTxt.includes("3 desek"), (planTxt.match(/Zaloga desk[^\n]*/) || [""])[0]);
check("1: montažni načrt — odpad ni lažno 0", /Odpad[^\n]*skupaj/.test(planTxt) && !planTxt.includes("0 mm skupaj"), (planTxt.match(/Odpad[^\n]*/) || [""])[0]);

/* ---------- 2. vijaki RF: segmenti/L-povratek ter konsistentnost ---------- */
setF("L", "3800"); setF("H", "1200"); setF("n", "8"); setF("np", "4");
setF("segList", ""); setF("w2", "0");
$("makePlan").click();
const baseScrews = grabNum($("planOut").textContent, "Vijaki RF");
setF("segList", "ZGORNJE;2000;800"); setF("w2", "600");
$("buildCut").click(); $("makePlan").click();
const segPlanTxt = $("planOut").textContent;
const segScrews = grabNum(segPlanTxt, "Vijaki RF");
check("2: vijaki RF narastejo z segmenti/L-povratkom", !!baseScrews && !!segScrews && segScrews > baseScrews, baseScrews + " → " + segScrews + " kos");
const planScrews = grabNum(segPlanTxt, "Vijaki RF");
check("2: montažni načrt — vrstica vsebuje znesek", planScrews === segScrews, planScrews + " kos");
blobQueue.length = 0;
$("menuDlOrder").click();
const orderTxt = await lastBlobText();
const orderScrews = grabNum(orderTxt, "Vijaki RF");
check("2: naročilnik uporablja isti znesek", orderScrews === segScrews, orderScrews + " kos");

/* ---------- 3. foto persistence (save→load→save) ---------- */
const GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const mk = (photo) => JSON.stringify({ schema: "draftwright-project", version: 3, data: photo ? { photo } : {} });
window.restoreProjectString(mk(GIF));
blobQueue.length = 0;
$("save").click();
const p1 = JSON.parse(await lastBlobText());
check("3: po nalaganju shranjevanje ohrani fotografijo", p1.data.photo === GIF);
window.restoreProjectString(JSON.stringify(p1));
blobQueue.length = 0;
$("save").click();
const p2 = JSON.parse(await lastBlobText());
check("3: save→load→save ohrani fotografijo", p2.data.photo === GIF);
window.restoreProjectString(mk(null));
blobQueue.length = 0;
$("save").click();
const p3 = JSON.parse(await lastBlobText());
check("3: projekt brez foto — shranjen brez fotografije", p3.data.photo === null || p3.data.photo === undefined);

/* ---------- 4. share povezava vključuje cone/globino ---------- */
setF("zoneTop", "777"); setF("zoneMid", "888"); setF("zoneBot", "111"); setF("zoneBase", "60"); setF("innerD", "999");
capturedPromptUrl = null;
window.prjLinkView();
check("4: prjLinkView generira URL", !!capturedPromptUrl && capturedPromptUrl.includes("?view=1#p="));
const b64 = capturedPromptUrl.slice(capturedPromptUrl.indexOf("#p=") + 3).replace(/-/g, "+").replace(/_/g, "/");
const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
const payload = JSON.parse(decodeURIComponent(escape(atob(padded))));
check("4: payload vsebuje zoneTop/zoneMid/innerD", payload.data.zoneTop === "777" && payload.data.zoneMid === "888" && payload.data.innerD === "999");
window.restoreProjectString(JSON.stringify(payload));
check("4: restore obnovi non-default cone/globino", $("zoneTop").value === "777" && $("zoneMid").value === "888" && $("innerD").value === "999");

/* ---------- 5. 3D parity (segmenti + L-povratek) ---------- */
setF("segList", "SEG1;2000;800"); setF("w2", "600");
const solids = window.collectSolids();
const hasSeg = solids.some((b) => b.label.indexOf("Segment 1") === 0);
const hasRet = solids.some((b) => b.label.indexOf("Return") === 0);
const maxX = Math.max(...solids.map((b) => b.x1));
const Lv = Number($("L").value), w2v = Number($("w2").value);
check("5: 3D vsebuje segment (Segment 1)", hasSeg);
check("5: 3D vsebuje L-povratek (Return)", hasRet);
check("5: 3D sega do L + w2 (L-povratek)", maxX >= Lv + w2v - 1, "maxX = " + maxX);
check("5: 3D ima več teles kot osnovni model", solids.length > Number(8 + 4 * 2 + 2), solids.length + " teles");

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);

})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
