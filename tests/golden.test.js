/**
 * P5 — zlati posnetki (golden snapshot): vizualne regresije risb in kosovnice.
 * Normaliziran SVG (datum → DATE) se primerja z tests/golden/*.svg.
 * Posodobitev zlatih datotek:  UPDATE_GOLDENS=1 node tests/golden.test.js
 * (začasno — namenoma, potem pregledaj diff v git).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const GOLDEN = path.join(__dirname, "golden");
const errors = [];

function makeDom() {
  return new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://draftwright-demo.vercel.app/",
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = function () {
        return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
      };
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = function () {};
      window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
    },
  });
}

const CHANGE_IDS = ["sysUse", "sysProfile", "sysColor", "sysSurface", "mountType", "paper", "projType"];
function norm(s) { return s.replace(/\d{1,2}\.\d{1,2}\.\d{4}/g, "DATE").replace(/\r/g, ""); }

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* konfiguracije: ime → polja (change ali input), textarea polja */
const CONFIGS = [
  { name: "precna-osnovna", set: { proj: "OSNOVNA OGRAJA", sysProfile: "romb67", sysUse: "precna", L: "4200", H: "1050", n: "12", gap: "20" } },
  {
    name: "dvonadstropna-lpovratek",
    set: { proj: "DVONADSTROPNA OGRAJA", objekt: "STANOVANJSKA HIŠA", sysProfile: "romb67", sysUse: "precna", L: "7800", D: "2100", H: "1050", n: "12", gap: "20", w2: "2100", slabT: "180", mountType: "bočno na ploščo" },
    area: { segList: "1. NADSTROPJE;6200;1030\nPRITLIČJE;7800;1050" },
  },
  { name: "stopniscna", set: { sysUse: "stopniscna", L: "4200", H: "1000", stN: "12", stRise: "17", stGoing: "28", stW: "1000" } },
  { name: "pokoncna-referencna", set: { sysUse: "pokoncna", L: "4200", H: "1200" } },
  { name: "terasa-deska150", set: { sysUse: "terasa", sysProfile: "deska150", L: "5000", D: "1200", H: "1200" } },
];

(async () => {
  if (!fs.existsSync(GOLDEN)) fs.mkdirSync(GOLDEN, { recursive: true });
  const UPDATE = !!process.env.UPDATE_GOLDENS;

  for (const cfg of CONFIGS) {
    const dom = makeDom();
    const { window } = dom;
    const { document } = window;
    const $ = (id) => document.getElementById(id);
    const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));
    Object.keys(cfg.set || {}).forEach((id) => {
      const el = $(id); if (!el) return;
      el.value = String(cfg.set[id]);
      fire(el, CHANGE_IDS.indexOf(id) >= 0 ? "change" : "input");
    });
    Object.keys(cfg.area || {}).forEach((id) => { const el = $(id); if (el) { el.value = cfg.area[id]; fire(el, "input"); } });
    $("gen").click();
    const svg = $("prev").querySelector("svg");
    if (!svg) { check(cfg.name, false, "brez SVG"); continue; }
    const got = norm(svg.outerHTML);
    const file = path.join(GOLDEN, cfg.name + ".svg");
    if (UPDATE || !fs.existsSync(file)) {
      fs.writeFileSync(file, got);
      check(cfg.name, true, UPDATE ? "posodobljen zlati posnetek" : "nov zlati posnetek (shranjen)");
    } else {
      const want = fs.readFileSync(file, "utf8").replace(/\r/g, "");
      if (want === got) { check(cfg.name, true, "identično (" + Math.round(got.length / 1024) + " kB)"); }
      else {
        let i = 0; while (i < Math.min(want.length, got.length) && want[i] === got[i]) i++;
        check(cfg.name, false, "razlika @ " + i + " — željeno: …" + want.slice(Math.max(0, i - 30), i + 30) + " · dobljeno: …" + got.slice(Math.max(0, i - 30), i + 30));
      }
    }
  }

  /* kosovnica (CSV) — zlati posnetek za precna-osnovna */
  {
    const dom = makeDom();
    const { window } = dom;
    const { document } = window;
    const $ = (id) => document.getElementById(id);
    const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));
    const cfg = CONFIGS[0];
    Object.keys(cfg.set).forEach((id) => { const el = $(id); if (el) { el.value = String(cfg.set[id]); fire(el, CHANGE_IDS.indexOf(id) >= 0 ? "change" : "input"); } });
    let blob = null;
    const oc = window.URL.createObjectURL;
    window.URL.createObjectURL = (b) => { blob = b; return "blob:test"; };
    $("dlCsv").click();
    window.URL.createObjectURL = oc;
    const got = blob ? norm(await blob.text()) : "";
    const file = path.join(GOLDEN, "kosovnica-osnovna.csv");
    if (UPDATE || !fs.existsSync(file)) { fs.writeFileSync(file, got); check("kosovnica-osnovna", true, "nov zlati posnetek (shranjen)"); }
    else {
      const want = fs.readFileSync(file, "utf8").replace(/\r/g, "");
      if (want === got) check("kosovnica-osnovna", true, "identično");
      else { let i = 0; while (i < Math.min(want.length, got.length) && want[i] === got[i]) i++; check("kosovnica-osnovna", false, "razlika @ " + i + ": …" + want.slice(i, i + 50) + " vs …" + got.slice(i, i + 50)); }
    }
  }

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
