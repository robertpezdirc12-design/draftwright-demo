/**
 * Postopna modularizacija — korak 7: čisti modul registry.
 *
 * REGISTRY_SCHEMA, validateRegistry(), woodcoreRegistry() in helperji znamk
 * so izvzeti v js/registry.js; inline kopija se generira z npm run modules:sync.
 * Modul nima DOM/omrežnih odvisnosti, WoodCore vnos pa se sklicuje na vire,
 * ki v HTML-ju stojijo pred generiranim blokom. Ta surov zaklene oboje in
 * ohrani obnašanje obstoječega tests/registry.test.js.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "tehnicka-risba-pro.html");
const sourcePath = path.join(root, "js/registry.js");
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

check("js/registry.js obstaja (stara koda bi PADLA)", hasSource);
const start = "/* >>> GENERATED: js/registry.js — uredi izvorno datoteko, ne to kopijo */";
const end = "/* <<< END GENERATED: js/registry.js */";
const i = html.indexOf(start), j = html.indexOf(end);
check("natanko en urejen par oznak",
  html.split(start).length - 1 === 1 && html.split(end).length - 1 === 1 && i >= 0 && i < j);
check("inline kopija vsebinsko enaka izvoru",
  hasSource && i >= 0 && j >= 0 && html.slice(i + start.length, j).trim() === source.replace(/\s+$/, ""));
check("vir nima DOM/storage/omrežnih odvisnosti",
  source.length > 0 && !/\bdocument\b|\bwindow\b|\b(?:local|session)Storage\b|\$\(|\bfetch\(|\bXMLHttpRequest\b|\bWebSocket\b|\bnavigator\b|\bsendBeacon\b/.test(source));
const deps = ["var PAL_KLASIK=", "var WC=", "var DIL=", "var USE_NAMES=", "function roksalLimit("];
check("odvisnosti WoodCore vnosa so opredeljene pred modulom",
  i > 0 && deps.every((d) => html.indexOf(d) >= 0 && html.indexOf(d) < i));

const w = window;
check("vsi izvozi ostanejo dostopni",
  !!w.REGISTRY_SCHEMA && typeof w.validateRegistry === "function" &&
  typeof w.woodcoreRegistry === "function" && !!w.REGISTRY &&
  typeof w.registryBrands === "function" && typeof w.activeRegistry === "function" &&
  typeof w.setRegistryBrand === "function");
check("shema zahteva 9 polj", w.REGISTRY_SCHEMA && w.REGISTRY_SCHEMA.required.length === 9);
check("shema zahteva 9 polj profila", w.REGISTRY_SCHEMA && w.REGISTRY_SCHEMA.profileRequired.length === 9);

const base = () => w.woodcoreRegistry();
check("veljaven WoodCore register nima opozoril", w.validateRegistry(base()).length === 0);
check("ne-objekt je zavrnjen",
  w.validateRegistry(null).some((s) => /registar ni objekt/.test(s)));
const missing = w.validateRegistry({ id: "x" });
check("manjkajoča polja so ugrabljena",
  missing.filter((s) => /manjka polje/.test(s)).length >= 8);
const emptyProfiles = base(); emptyProfiles.profiles = {};
check("prazna mapa profilov je zavrnjena",
  w.validateRegistry(emptyProfiles).some((s) => /profiles: prazna mapa/.test(s)));
const nullProfile = base(); nullProfile.profiles = { x: null };
check("ne-objektni profil je zavrnjen",
  w.validateRegistry(nullProfile).some((s) => /profil x: ni objekt/.test(s)));
const badProfile = base(); badProfile.profiles = { x: { n: "X", w: 0, allowed: [] } };
const badProfileProbs = w.validateRegistry(badProfile);
check("neveljavna širina in prazna uporaba sta zavrnjeni",
  badProfileProbs.some((s) => /w mora biti >0/.test(s)) &&
  badProfileProbs.some((s) => /allowed mora biti neprazen seznam/.test(s)));
check("manjkajoče polje profila je ugrabljeno",
  badProfileProbs.some((s) => /profil x: manjka/.test(s)));
const badTemps = base(); badTemps.dilatacijska = { temps: [10, 5], vals: base().dilatacijska.vals };
check("naraščujočnost temperatur je preverjena",
  w.validateRegistry(badTemps).some((s) => /temps ni strogo naraščujoča/.test(s)));
const badVals = base(); badVals.dilatacijska = { temps: base().dilatacijska.temps, vals: [[1, 2]] };
check("vrstica dilatacije mora imeti 5 vrednosti",
  w.validateRegistry(badVals).some((s) => /vrstica 0 mora imeti 5/.test(s)));
const badContact = base(); badContact.kontaktni = {};
const badContactProbs = w.validateRegistry(badContact);
check("kontaktni podatki so preverjeni",
  badContactProbs.some((s) => /kontaktni: manjka dopisatelj/.test(s)) &&
  badContactProbs.some((s) => /opozorila mora biti seznam/.test(s)));
check("nepopolna dilatacijska tabela je po obstoječi logiki preskočena",
  w.validateRegistry({ ...base(), dilatacijska: {} }).length === 0);

const reg = base();
check("identiteta in material WoodCore vnosa",
  reg.id === "woodcore" && reg.naziv === "WoodCore / Roksal" &&
  reg.material === "WoodCore WPC (bambus / HDPE)");
check("profiles kaže na isti WC", reg.profiles === w.WC);
check("dilatacijska kaže na isto DIL tabelo",
  reg.dilatacijska.temps === w.DIL.temps && reg.dilatacijska.vals === w.DIL.vals);
check("pravaPodlage je ista funkcija kot roksalLimit", reg.pravaPodlage === w.roksalLimit);
check("palete in uporabe so isti viri",
  reg.palete.klasik === w.PAL_KLASIK && reg.palete.rustik === w.PAL_RUSTIK &&
  reg.uporabe === w.USE_NAMES);
check("kontaktni podatki ostanejo neizmišljeni",
  reg.kontaktni.dopisatelj === "Roksal d.o.o." && reg.kontaktni.opozorila.length === 3 &&
  /15 let/.test(reg.kontaktni.garancija));

check("stop-rule: registriran je samo WoodCore",
  JSON.stringify(w.registryBrands()) === '["woodcore"]');
check("aktivni register je WoodCore", w.activeRegistry() === w.REGISTRY.woodcore);
check("neznana znamka je zavrnjena brez spremembe stanja",
  w.setRegistryBrand("neznana") === false && w.activeRegistry() === w.REGISTRY.woodcore);
check("znana znamka je sprejeta in aktivna",
  w.setRegistryBrand("woodcore") === true && w.activeRegistry() === w.REGISTRY.woodcore);
check("brez JS napak", errors.length === 0, errors.join(" | "));

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ""}`);
process.exit(fail || errors.length ? 1 : 0);
