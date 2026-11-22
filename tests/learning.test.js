/**
 * P3.4 — vadnice + certifikacijski kviz.
 * Pokritje:
 *   - startTutorial odpre vadnico in prikaže korak 1/3;
 *   - navigacija »Naslednji« napreduje po korakih;
 *   - »Izvedi korak« izvede akcijo brez napak;
 *   - kviz: napačni odgovori ne prinesejo značke; 100 % jo pridobi;
 *   - certStatus odraža shranjeno značko.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.HTMLAnchorElement.prototype.click = function () {};
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
function click(sel) { const el = document.querySelector(sel); if (el) el.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); return !!el; }

check("P3.4: learn API na window", ["startTutorial", "quizGrade", "certStatus"].every((k) => typeof window[k] === "function"));

window.startTutorial("t1");
check("P3.4: vadnica se odpre", $("learnOverlay").classList.contains("on"));
check("P3.4: korak 1/3 viden", $("learnPanel").textContent.includes("Korak 1/3") && $("learnPanel").textContent.includes("Od slike do risbe"));
click('[data-tut="t1"][data-act="next"]');
check("P3.4: naslednji → korak 2/3", $("learnPanel").textContent.includes("Korak 2/3"));
click('[data-tut="t1"][data-act="run"]');
check("P3.4: »Izvedi korak« ne povzroči napake", errors.length === 0);

check("P3.4: pred kvizom ni značke", window.certStatus() === false);
window.quizGrade([0, 0, 0, 0, 0]);
check("P3.4: napačni odgovori ne prinesejo značke", window.certStatus() === false);
const pct = window.quizGrade([3, 2, 1, 2, 1]);
check("P3.4: pravilni odgovori → 100 %", pct === 1, (pct * 100) + " %");
check("P3.4: značka pridobljena", window.certStatus() === true);

check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
