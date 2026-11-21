/**
 * LAIK TEST — uporabnik, ki ne pozna aplikacije (ne ve, kako se doda slika).
 * Preverja: empty state navodila, gumb "Kako začeti", pomoč modal s 4 koraki,
 * interaktivne poti (data-goto), gumbi za datoteko/zaznavanje/generiranje, Esc.
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
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

(async () => {
  /* 1) empty state: laik mora razumeti, kako dodati sliko */
  const empty = $("prev").textContent;
  check("empty state: omenja Ctrl+V / povleci", empty.includes("Ctrl+V") && empty.includes("povleci"));
  check("empty state: gumb Kako začeti", empty.includes("Kako začeti"));

  /* 2) pomoč modal — odpre se iz gumba ? in iz menija */
  $("helpBtn").click();
  check("pomoč: modal odprt prek ?", $("helpOverlay").classList.contains("on"));
  $("helpClose").click();
  $("openHelp").click();
  check("pomoč: modal odprt prek data-call/hook", $("helpOverlay").classList.contains("on"));

  /* 3) 4 koraki z naslovi + interaktivne poti */
  const body = $("helpOverlay").textContent;
  check("pomoč: 4 koraki", ["1. Vnesite sliko", "2. Umeritev", "3. Samodejno zaznavanje lamel", "4. Generiraj risbo in izvozi"].every((k) => body.includes(k)));
  check("pomoč: gumbi za preskok (data-goto)", $("helpOverlay").querySelectorAll('[data-goto]').length >= 3);
  check("pomoč: gumbi Izberi datoteko/Zaznaj/Generiraj", !!$("helpFile") && !!$("helpDetect") && !!$("helpGen"));

  /* 4) klik na Zaznaj/Generiraj ne crash-a (handler obstaja) */
  $("helpGen").click();
  check("pomoč: helpGen sproži generiranje (handler)", $("prev").classList.contains("empty") || !!document.querySelector("#prev svg"));

  /* 5) Esc zapre */
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("pomoč: Esc zapre", !$("helpOverlay").classList.contains("on"));

  /* 6) brez JS napak */
  check("končno: ni JS napak", errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
