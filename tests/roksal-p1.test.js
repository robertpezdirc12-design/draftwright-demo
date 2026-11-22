/**
 * Testi Roksal P1 integracij (vir: roksal.com + uradni PDF navodila) — poganja `npm test`.
 * Pokrije: dilatacijski kalkulator, napušč, pregradne stene, per-profil barvne palete,
 * usklajevanje Klasik/Rustik, validacije podlage ter podkonstrukcijo terase.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { loadAppHtml } = require("./helpers/bootApp");

const html = loadAppHtml();
const errors = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
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
const useSel = () => $("sysUse");
const setUse = (v) => { useSel().value = v; fire(useSel(), "change"); };
const setField = (id, v) => { $(id).value = String(v); fire($(id), "input"); };

(async () => {
  // 1) nove uporabe v izbirniku
  const useOpts = [...useSel().options].map((o) => o.value);
  check("sysUse vsebuje napušč in pregrado", useOpts.includes("napusc") && useOpts.includes("pregrada"), useOpts.join(", "));

  // 2) per-profil barvne palete
  setUse("precna");
  $("sysProfile").value = "kubo80"; fire($("sysProfile"), "change");
  let colOpts = [...$("sysColor").options].map((o) => o.value);
  check("KUBO paleta: 4 barve brez White", colOpts.length === 4 && !colOpts.includes("White"), colOpts.join(", "));
  $("sysProfile").value = "polna100"; fire($("sysProfile"), "change");
  colOpts = [...$("sysColor").options].map((o) => o.value);
  check("POLNA-100 paleta: 8 barv z White", colOpts.length === 8 && colOpts.includes("White"), colOpts.join(", "));
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change");
  colOpts = [...$("sysColor").options].map((o) => o.value);
  check("ROMB paleta: 7 barv brez White", colOpts.length === 7 && !colOpts.includes("White"));
  $("sysProfile").value = "polna128"; fire($("sysProfile"), "change");
  colOpts = [...$("sysColor").options].map((o) => o.value);
  check("POLNA-128 paleta: brez Golden teak in White", !colOpts.includes("Golden teak") && !colOpts.includes("White"), colOpts.join(", "));

  // 3) površina Klasik/Rustik uskladi odtenek
  $("sysProfile").value = "kubo80"; fire($("sysProfile"), "change");
  $("sysSurface").value = "Rustik"; fire($("sysSurface"), "change");
  check("Rustik → prvi rustik odtenek (Rustic oak)", $("sysColor").value === "Rustic oak", $("sysColor").value);
  $("sysColor").value = "Rustic walnut"; fire($("sysColor"), "change");
  check("Rustic walnut → površina Rustik", $("sysSurface").value === "Rustik");
  $("sysColor").value = "Oak wood"; fire($("sysColor"), "change");
  check("Oak wood → površina Klasik", $("sysSurface").value === "Klasik");

  // 4) dilatacija: tabela 20 °C / 4 m → 5 mm (brez opozorila pri reži 5)
  setUse("terasa");
  $("sysProfile").value = "deska150"; fire($("sysProfile"), "change");
  setField("installTemp", 20); setField("L", 4000); setField("gap", 5);
  check("dilatacija 20 °C/4 m: reža 5 → brez opozorila", !$("checks").textContent.includes("Dilatacija"), $("checks").textContent.slice(0, 80));
  // 0 °C / 4 m → 7 mm: reža 5 → opozorilo s priporočilom
  setField("installTemp", 0);
  check("dilatacija 0 °C/4 m: opozorilo priporoča 7 mm", $("checks").textContent.includes("priporočen razmak 7 mm"), $("checks").textContent.match(/Dilatacija[^.]*/)?.[0] || "");
  // reža 7 → opozorilo izgine
  setField("gap", 7);
  check("dilatacija 0 °C/4 m: reža 7 → brez opozorila", !$("checks").textContent.includes("Dilatacija"));
  // ekstrem: 30 °C / 4 m → 3 mm
  setField("installTemp", 30);
  check("dilatacija 30 °C/4 m: opozorilo priporoča 3 mm", $("checks").textContent.includes("priporočen razmak 3 mm"));
  setField("gap", 3); setField("installTemp", 20);

  // 5) checklist terasa: dilatacija + podkonstrukcija po PDF
  $("buildChecklist").click();
  const cl = $("checklistOut").textContent;
  check("checklist: dilatacijska vrstica s 5 mm", cl.includes("5 mm po dilatacijski tabeli WoodCore"));
  check("checklist: alu točkovno max 60 cm", cl.includes("alu cevmi, max 60 cm"));
  check("checklist: turbo vijaki 6,7×80", cl.includes("6,7×80"));
  check("checklist: višina terase 4,5 cm", cl.includes("min. 4,5 cm"));
  check("checklist: rez 30° (uradni PDF)", cl.includes("kotom 30°"));
  check("checklist: kombinacija 4,0+2,2 ni dovoljena", cl.includes("kombinacija 4,0+2,2 m NI dovoljena"));
  check("checklist: odmik od vseh sten ≥ 6 mm", cl.includes("odmik od vseh sten ≥ 6 mm"));
  check("popravljena tipkarska napaka VSKAK", !cl.includes("VSKAK"));

  // 6) montazni načrt terase: podkonstrukcija
  $("makePlan").click();
  const plan = $("planOut").textContent;
  check("načrt: podložne letve center 33–35", plan.includes("Podložne letve") && plan.includes("33–35"));
  check("načrt: turbo vijaki 6,7×80", plan.includes("Turbo vijaki za beton") && plan.includes("6,7×80"));
  check("načrt: dilatacija vrstica", plan.includes("Dilatacija") && plan.includes("5 mm"));

  // 7) podlage: validacije
  $("subType").value = "pesek"; fire($("subType"), "change");
  check("podlaga pesek: opozorilo", $("checks").textContent.includes("ne izvaja montaž"));
  $("subType").value = "tlakovci"; fire($("subType"), "change");
  check("podlaga tlakovci: alu cevi obvezne", $("checks").textContent.includes("alu podložne cevi"));
  $("subType").value = "beton_hidro"; fire($("subType"), "change");
  check("podlaga hidroizolacija: guma/filc", $("checks").textContent.includes("guma/filc"));
  $("subType").value = "plocice"; fire($("subType"), "change");
  check("podlaga ploščice: višina do vrat", $("checks").textContent.includes("višino do vrat"));
  $("subType").value = "beton"; fire($("subType"), "change");
  check("podlaga beton: brez opozoril o podlagi", !$("checks").textContent.includes("ne izvaja montaž") && !$("checks").textContent.includes("guma/filc"));

  // 8) okrogle cevi pri obstoječi kovinski konstrukciji (ograja)
  setUse("precna");
  $("mountType").value = "kovinska konstrukcija"; fire($("mountType"), "change");
  check("kovinska konstrukcija: okrogle cevi prepovedane", $("checks").textContent.includes("okrogle cevi NI dovoljena"));
  check("kovinska konstrukcija: garancija ne priznana", $("checks").textContent.includes("garancija na izvedbo"));
  $("mountType").value = "na ploščo"; fire($("mountType"), "change");

  // 9) pregradna stena
  setUse("pregrada");
  $("sysProfile").value = "kubo80"; fire($("sysProfile"), "change");
  setField("H", 3000); setField("L", 2400);
  check("KUBO pregrada H=3000: opozorilo 2500", $("checks").textContent.includes("samo do višine 2500 mm"));
  setField("H", 2000);
  check("KUBO pregrada: status omenja razpon", $("sysStatus").textContent.includes("razpon (z alu cevjo"));
  $("sysProfile").value = "polna57"; fire($("sysProfile"), "change");
  check("polna57 dovoljena za pregrado", !$("checks").textContent.includes("ni predviden"));
  $("buildChecklist").click();
  const cl2 = $("checklistOut").textContent;
  check("checklist pregrada: stebri ≤ 200 cm", cl2.includes("pokončno ≤ 200 cm"));
  check("checklist pregrada: KUBO razpon 120/260", cl2.includes("≤ 120 cm brez cevi") && cl2.includes("≤ 260 cm"));
  check("checklist pregrada: eloksirana na prostem", cl2.includes("eloksirana"));

  // 10) napušč (samo polna-100 je predvidena)
  setUse("napusc");
  $("sysProfile").value = "polna57"; fire($("sysProfile"), "change");
  check("napušč: polna57 NI predvidena (opozorilo)", $("checks").textContent.includes("ni predviden"));
  $("sysProfile").value = "polna100"; fire($("sysProfile"), "change");
  check("napušč: polna100 dovoljena", !$("checks").textContent.includes("ni predviden"));
  $("buildChecklist").click();
  const cl3 = $("checklistOut").textContent;
  check("checklist napušč: macesen 4×7 cm", cl3.includes("macesnove letve 4×7 cm"));
  check("checklist napušč: vertikalno 2×7 cm ≤ 50 cm", cl3.includes("2×7 cm, razmak ≤ 50 cm"));
  check("checklist napušč: v opeko", cl3.includes("vijačenje v opeko"));

  // 11) naročilnik/checklist ne zadeva novih uporab pri barvah (palete so konsistentne)
  setUse("precna");
  $("sysProfile").value = "polna100"; fire($("sysProfile"), "change");
  $("sysColor").value = "White"; fire($("sysColor"), "change");
  $("buildQuote").click();
  check("predračun z White (polna100) deluje", $("quoteOut").textContent.includes("EUR"));

  // 12) samoprevera: 126 kombinacij (7 uporab × 6 profilov × 3 mere)
  $("menuSelfTest").click();
  check("samoprevera 126/126", /126 kombinacij · 0 napak · 0 JS napak/.test($("globalStatus").textContent), $("globalStatus").textContent);

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
