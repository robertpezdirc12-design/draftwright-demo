/**
 * Postopna modularizacija — korak 6: čisti modul roksal.
 *
 * USE_NAMES, roksalLimit() in roksalRailLimit() so izvzeti v js/roksal.js;
 * inline kopija v HTML-ju se generira z npm run modules:sync. Vir ne sme
 * uporabljati DOM-a ali stanja obrazca — roksalUseNotes() in applySystem()
 * ostaneta v HTML-ju. Ta surov preveri obe lastnosti in identično obnašanje
 * vseh omejitev razmika (preverjeno tudi v obstoječih roksal-p1/p2 testih).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "tehnicka-risba-pro.html");
const sourcePath = path.join(root, "js/roksal.js");
const html = fs.readFileSync(htmlPath, "utf8");
const hasSource = fs.existsSync(sourcePath);
const source = hasSource ? fs.readFileSync(sourcePath, "utf8") : "";
const errors = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    w.URL.revokeObjectURL = () => {};
    w.URL.createObjectURL = () => "blob:test";
    w.HTMLAnchorElement.prototype.click = function () {};
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
const same = (got, v, label) => JSON.stringify(got) === JSON.stringify({ v: v, label: label });

check("js/roksal.js obstaja (stara koda bi PADLA)", hasSource);
const start = "/* >>> GENERATED: js/roksal.js — uredi izvorno datoteko, ne to kopijo */";
const end = "/* <<< END GENERATED: js/roksal.js */";
const i = html.indexOf(start), j = html.indexOf(end);
check("natanko en urejen par oznak",
  html.split(start).length - 1 === 1 && html.split(end).length - 1 === 1 && i >= 0 && i < j);
check("inline kopija vsebinsko enaka izvoru",
  hasSource && i >= 0 && j >= 0 && html.slice(i + start.length, j).trim() === source.replace(/\s+$/, ""));
check("vir nima DOM/storage/obrazčnih odvisnosti",
  source.length > 0 && !/\bdocument\b|\blocalStorage\b|\$\(|\bV\(|\bn\(|\bf\(/.test(source));

check("window.USE_NAMES ostane izvožen", typeof window.USE_NAMES === "object" && window.USE_NAMES !== null);
check("USE_NAMES pokriva vseh 7 uporab", Object.keys(window.USE_NAMES || {}).length === 7);
check("USE_NAMES ohrani slovenske nazive",
  window.USE_NAMES && window.USE_NAMES.napusc === "napušč" &&
  window.USE_NAMES.pokoncna === "pokončna ograja" &&
  window.USE_NAMES.stopniscna === "stopniščna ograja");
check("window.roksalLimit ostane izvožen", typeof window.roksalLimit === "function");
check("window.roksalRailLimit je testno dostopen", typeof window.roksalRailLimit === "function");

const L = window.roksalLimit;
const WC = window.WC || {};
check("brez profila → privzeti razmak nosilcev",
  typeof L === "function" && same(L(null, "precna", 1200), 1500, "razmak nosilcev"));
check("terasa → razmak podložnih letev 350 mm",
  same(L(WC.romb67, "terasa", 1200), 350, "razmak podložnih letev"));
check("napušč → podkonstrukcija 800 mm",
  same(L(WC.polna100, "napusc", 1200), 800, "razmak podkonstrukcije (macesen 4×7 cm)"));
check("pregrada KUBO → razpon 2600 mm z alu cevjo",
  same(L(WC.kubo80, "pregrada", 2500), 2600, "razpon (z alu cevjo 20×60×2)"));
check("pregrada brez KUBO → razmak stebrov 2000 mm",
  same(L(WC.romb67, "pregrada", 2500), 2000, "razmak stebrov (pokončno)"));
check("fasada z facade.studMax → 800 mm",
  same(L(WC.romb67, "fasada", 1200), 800, "razmak podkonstrukcije"));
check("fasada brez facade.studMax → padec na max*10",
  same(L(WC.polna128, "fasada", 1200), 1100, "razmak podkonstrukcije"));
check("prečna s post.precna → 1450 mm",
  same(L(WC.romb67, "precna", 1200), 1450, "razmak med stebri"));
check("prečna brez post.precna → padec na max*10",
  same(L(WC.polna100, "precna", 1200), 1800, "razmak med stebri"));
const tall = { n: "TEST", post: { pokoncna: 2000 } };
check("pokončna do 1500 mm → zgornja meja 1800 mm",
  same(L(tall, "pokoncna", 1200), 1800, "razmak med stebri"));
check("pokončna nad 1500 mm → osnovna meja 1500 mm",
  same(L(tall, "pokoncna", 2000), 1500, "razmak med stebri"));
check("pokončna omejena z profilom (min)",
  same(L(WC.romb67, "pokoncna", 1200), 1500, "razmak med stebri"));
check("neznana uporaba → privzeti razmak nosilcev",
  same(L(WC.romb67, "neznano", 1200), 1500, "razmak nosilcev"));

const R = window.roksalRailLimit;
check("roksalRailLimit iz profila → rail.pokoncna",
  R && R(WC.romb67) === 1100 && R(WC.polna100) === 800);
check("roksalRailLimit brez profila → 1000 mm", R && R(null) === 1000);
check("roksalRailLimit brez rail → 1000 mm", R && R(WC.kubo80) === 1000);

const reg = typeof window.woodcoreRegistry === "function" ? window.woodcoreRegistry() : null;
check("register še vedno kaže na isto funkcijo in seznam",
  reg && reg.pravaPodlage === L && reg.uporabe === window.USE_NAMES);
check("brez JS napak", errors.length === 0, errors.join(" | "));

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ""}`);
process.exit(fail || errors.length ? 1 : 0);
