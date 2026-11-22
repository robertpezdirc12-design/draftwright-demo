/**
 * Odpri projekt / vnos datoteke — uporabniško vedenje.
 * Pokritje:
 *   - veljaven JSON projekt se naloži (polja se obnovijo, toast »Projekt naložen«);
 *   - slika (PNG) se namesto projekta naloži kot fotografija (photoBox + toast);
 *   - nepravilen JSON prikaže vidno napako (toast) — ne tiho preskoči.
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
function setFile(content, name, type) {
  const f = new window.File([content], name, { type });
  Object.defineProperty($("loadFile"), "files", { value: [f], configurable: true });
  $("loadFile").dispatchEvent(new window.Event("change"));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // 1) veljaven projekt JSON
  setFile(JSON.stringify({ schema: "draftwright-project", version: 3, data: { L: "3800", H: "1200" } }), "projekt.json", "application/json");
  await sleep(150);
  check("open-project: JSON projekt se naloži", $("L").value === "3800" && $("H").value === "1200");
  check("open-project: toast »Projekt naložen«", $("toastZone").textContent.includes("Projekt naložen"));

  // 2) slika PNG → kot fotografija
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  setFile(png, "slika.png", "image/png");
  await sleep(200);
  /* V jsdom se Image.onload ne sproži, zato fotoBox ne dobi »on« — preverimo namen:
     slika se NE obravnava kot JSON in uporabnik dobi pojasnjevalni toast. */
  check("open-project: slika ni poskušana kot JSON", !$("toastZone").textContent.includes("Napaka pri nalaganju projekta"));
  check("open-project: toast pojasni, da je slika naložena kot fotografija", $("toastZone").textContent.includes("slika") && $("toastZone").textContent.includes("fotografija"));

  // 3) napačen JSON → vidna napaka
  setFile("to ni projekt", "napaka.txt", "text/plain");
  await sleep(150);
  check("open-project: napačen projekt prikaže vidno napako", $("toastZone").textContent.includes("Napaka pri nalaganju projekta"));

  check("končno: ni JS napak", errors.length === 0, errors[0] || "brez napak");
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
