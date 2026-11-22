/**
 * Vizualna povratna informacija ob vnosu slike.
 * Ko uporabnik vstavi/povleče sliko, se mora samodejno odpreti sklop Slika
 * (predal) in fotografija mora biti vidna — tudi če je bil predal prej skrit.
 * Pokritje:
 *   - drop slike na glavno površino odpre predal (body.aside-hidden === false);
 *   - #photoBox dobi razred »on« (fotografija prikazana);
 *   - ni JS napak.
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
    /* Mock Image: takojšnji onload (jsdom ne dekodira slik) */
    window.Image = class {
      constructor() { this.naturalWidth = 400; this.naturalHeight = 300; this._src = ""; }
      set src(v) { this._src = v; setTimeout(() => { if (this.onload) this.onload(); }, 0); }
      get src() { return this._src; }
    };
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  check("photo: privzeto skrit predal", document.body.classList.contains("aside-hidden"));

  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const file = new window.File([png], "f.png", { type: "image/png" });
  const evt = new window.Event("drop", { bubbles: true });
  Object.defineProperty(evt, "dataTransfer", { value: { files: [file] } });
  document.querySelector("main").dispatchEvent(evt);
  await sleep(120);

  check("photo: predal se samodejno odpre", !document.body.classList.contains("aside-hidden"));
  check("photo: fotografija je vidna (photoBox.on)", document.getElementById("photoBox").classList.contains("on"));
  check("photo: ni JS napak", errors.length === 0, errors[0] || "brez napak");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
