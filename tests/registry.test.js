/**
 * M5 (P4-a): več-znamkovski registar — samoprevera registrske sheme.
 *
 *  - validacija registra znamke (obvezna polja, profili, dilatacijska tabela, kontaktni obrazec)
 *  - WoodCore kot prvi registar: referenca na obstoječi globalni vir (WC/DIL) brez zamika
 *  - konsistentnost BOM ↔ predračun ↔ rezalni načrt: profili v registru = profili v WC
 *  - negativni primeri: validator ugrabi manjkajoča polja / nepopolno dilatacijsko tabelo
 *
 * Stop-rule M5: brez pogodbenih podatkov znamk → registriran ostane samo WoodCore.
 * Tu zato ne preverjamo izmišljenih znamk — le, da je abstrakcija *zderna* in *validna*.
 */
"use strict";
const { JSDOM } = require("jsdom");
const { loadAppHtml } = require("./helpers/bootApp");

const html = loadAppHtml();
const errors = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) { window.addEventListener("error", (e) => errors.push(String(e.message || e.error))); },
});
const w = dom.window;
const { document } = w;

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* ---------- 1) shema + validator obstajajo in so dosegljivi ---------- */
check("shema REGISTRY_SCHEMA definirana", !!(w.REGISTRY_SCHEMA && w.REGISTRY_SCHEMA.required.length));
check("validator validateRegistry() je funkcija", typeof w.validateRegistry === "function");
check("woodcoreRegistry() je funkcija", typeof w.woodcoreRegistry === "function");
check("registryBrands()/activeRegistry()/setRegistryBrand() dosegljivi",
  typeof w.registryBrands === "function" && typeof w.activeRegistry === "function" && typeof w.setRegistryBrand === "function");

/* ---------- 2) WoodCore registar je validiran (prazno polje problemov) ---------- */
const wcReg = w.activeRegistry();
const probs = w.validateRegistry(wcReg);
check("WoodCore registar validiran (0 problemov)", probs.length === 0, probs.length ? probs.join("; ") : "čisto");

/* ---------- 3) registar referencira obstoječi vir — brez zamika (konsistentnost BOM↔predračun↔rezni načrt) ---------- */
check("registar.id = woodcore in naziv", wcReg.id === "woodcore" && /WoodCore|Roksal/.test(wcReg.naziv));
check("profiles v registru = globalni WC (isti objekt, brez podvojanja)", wcReg.profiles === w.WC,
  Object.keys(wcReg.profiles).length + " profilov");
check("vsak profil nosi obvezna polja (n/w/t/len/max/fix/allowed/drill/palette)",
  w.REGISTRY_SCHEMA.profileRequired.every((f) => Object.values(wcReg.profiles).every((p) => p[f] !== undefined)));
check("dilatacijska tabela = globalni DIL (isti temps/vals)",
  wcReg.dilatacijska.temps === w.DIL.temps && wcReg.dilatacijska.vals === w.DIL.vals);
check("pravaPodlage = roksalLimit (globalna funkcija)", wcReg.pravaPodlage === w.roksalLimit);
check("uporabe = USE_NAMES in palete pokrivajo K/R",
  wcReg.uporabe === w.USE_NAMES && Array.isArray(wcReg.palete.klasik) && Array.isArray(wcReg.palete.rustik));

/* ---------- 4) kontaktni obrazec (P4-c: pravno razmejevanje odgovornosti) ---------- */
check("kontaktni dopisatelj + garancija + opozorila",
  !!wcReg.kontaktni.dopisatelj && !!wcReg.kontaktni.garancija && Array.isArray(wcReg.kontaktni.opozorila) && wcReg.kontaktni.opozorila.length >= 3);

/* ---------- 5) negativni primeri — validator resni ugrabi napake ---------- */
const missing = JSON.parse(JSON.stringify(wcReg));
delete missing.material;
delete missing.profiles;
const badDil = JSON.parse(JSON.stringify(wcReg));
badDil.dilatacijska.vals[0] = [1, 2, 3]; // samo 3 vrednosti namesto 5
const badProfile = JSON.parse(JSON.stringify(wcReg));
delete badProfile.profiles.romb67.w; // profil brez širine
check("manjkajoča polja (material, profiles) ugrabljena", w.validateRegistry(missing).some((s) => /manjka polje/.test(s)),
  w.validateRegistry(missing).filter((s) => /manjka polje/.test(s)).length + " opozorilj");
check("nepopolna dilatacijska vrstica ugrabljena", w.validateRegistry(badDil).some((s) => /dilatacijska/.test(s)));
check("profil brez w (širine) ugrabljen", w.validateRegistry(badProfile).some((s) => /romb67/.test(s)));

/* ---------- 6) dostopniki do registra (brez obnašanja privzete znamke) ---------- */
check("registryBrands() vsebuje woodcore", w.registryBrands().indexOf("woodcore") >= 0);
check("setRegistryBrand('woodcore') → true, neznano → false",
  w.setRegistryBrand("woodcore") === true && w.setRegistryBrand("azek") === false);
check("activeRegistry() vrne woodcore (privzeto)", w.activeRegistry().id === "woodcore");

check("končno: ni JS napak", errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
