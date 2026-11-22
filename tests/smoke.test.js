/**
 * Smoke test za tehnicka-risba-pro.html — poganja ga `npm test` (jsdom, brez brskalnika).
 * Preveri generiranje vseh tipov listov, validacije, izvoze in regresije popravljenih napak.
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
    // minimalen canvas 2d stub (potreben za zaznavanje lamel)
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

(async () => {
  // 1) privzeta generacija (klasicni list)
  $("gen").click();
  let svg = document.querySelector("#prev svg");
  check("generacija klasicnega lista", !!svg && svg.querySelectorAll("text").length > 10,
    svg ? svg.querySelectorAll("text").length + " besedil" : "brez SVG");
  // 1b) regresija: naslov detajla lamele sledi dejanskemu profilu (ROMB-67 67×26 mm; prej trdo kodiran "U 80×20×2")
  check("detajl lamele: naslov sledi profilu (ROMB-67 67×26 mm)", svg && svg.textContent.includes("DETAIL LAMELE · ROMB-67 67×26 mm"),
    svg ? "naslov: " + ((svg.textContent.split("DETAIL LAMELE")[1] || "?").slice(0, 26)) : "brez SVG");
  // 1c) F3: naslovni blok 2 vrstici — OBJEKT/TIP/MATERIAL/BARVA
  check("naslovni blok: OBJEKT/TIP/MATERIAL/BARVA", !!svg && ["OBJEKT", "TIP", "MATERIAL", "BARVA", "PREČNA OGRAJA"].every((k) => svg.textContent.includes(k)));
  // 1d) F2: detajl ROMB z 15° fazami + mere profila
  check("detajl ROMB: fazi 15° + mere 67/26", !!svg && svg.textContent.includes("15°"));
  // 1e) F1: prerez = realni rez — baloni = vrstice BOM + podlaga/pritrditev (privzeto na ploščo)
  check("prerez: baloni=BOM + PODLAGA/PRITRDILO", !!svg && svg.textContent.includes("Baloni = št. vrstic") && svg.textContent.includes("PODLAGA") && svg.textContent.includes("PRITRDILO"));
  // 1f) F1: bočna pritrditev — sidrna plošča v prerezu
  $("mountType").value = "bočno na ploščo"; fire($("mountType"), "change");
  $("gen").click(); svg = document.querySelector("#prev svg");
  check("prerez bočno: SIDRNA PLOŠČA", !!svg && svg.textContent.includes("SIDRNA PLOŠČA"));
  $("mountType").value = "na ploščo"; fire($("mountType"), "change");
  // 1g) F4: segmenti — dvonadstropni sprednji pogled s ploščo
  $("segList").value = "1. NADSTROPJE;6200;1030\nPRITLIČJE;7800;1050"; fire($("segList"), "input");
  $("slabT").value = "180"; fire($("slabT"), "input");
  $("gen").click(); svg = document.querySelector("#prev svg");
  check("segmenti: 2 nadstropji + plošča 180 + mere", !!svg && ["PO SEGMENTIH", "1. NADSTROPJE", "PRITLIČJE", "7800", "BETONSKA PLOŠČA (180 mm)"].every((k) => svg.textContent.includes(k)));
  // 1h) F5: tloris z desnim L-povratkom
  $("w2").value = "2100"; fire($("w2"), "input");
  $("gen").click(); svg = document.querySelector("#prev svg");
  check("tloris: L-povratek + fasada + kotni steber + W2", !!svg && ["L-POVRATEK", "FASADA OBJEKTA", "W2 = 2100", "KOTNI STEBER"].every((k) => svg.textContent.includes(k)));
  // 1i) P1: BOM po segmentih — rezalni načrt, kosovnica in BOM vključujejo vse dolžine
  $("buildCut").click();
  const cutTxt = $("cutOut").textContent || "";
  check("P1 rezalni načrt: dolžine segmentov + povratek", ["3800", "6200", "7800", "2100"].every((k) => cutTxt.includes(k)), cutTxt.slice(0, 88));
  let csvBlob = null;
  const ocCsv = window.URL.createObjectURL;
  window.URL.createObjectURL = (b) => { csvBlob = b; return "blob:test"; };
  $("dlCsv").click();
  window.URL.createObjectURL = ocCsv;
  const csvP1 = csvBlob ? await csvBlob.text() : "";
  check("P1 kosovnica: vrstice po segmentih + povratku", ["— 1. NADSTROPJE", "— PRITLIČJE", "— L-povratek"].every((k) => csvP1.includes(k)));
  $("gen").click(); svg = document.querySelector("#prev svg");
  check("P1 BOM na risbi: razčlen dolžin + vsi segmenti", !!svg && svg.textContent.includes("vsi segmenti + povratek") && svg.textContent.includes("6200×") && svg.textContent.includes("7800×"),
    svg ? (svg.textContent.split("Lamela ROMB-67")[1] || "?").slice(0, 46) : "brez SVG");
  // 1j) P2: korita za rože — sprednji pogled, prerez (balona 9/10), BOM, kosovnica
  $("segList").value = ""; fire($("segList"), "input");
  $("w2").value = "0"; fire($("w2"), "input");
  $("koritoList").value = "1100;300\n1400;1900"; fire($("koritoList"), "input");
  $("gen").click(); svg = document.querySelector("#prev svg");
  check("P2 korita: izrisana v pogledu z merami", !!svg && ["KORITO ZA ROŽE (1100 mm)", "KORITO ZA ROŽE (1400 mm)"].every((k) => svg.textContent.includes(k)));
  check("P2 korita: BOM vrstici 9/10", !!svg && svg.textContent.includes("Cvetlično korito") && svg.textContent.includes("Konzolni nosilec korita"));
  csvBlob = null;
  window.URL.createObjectURL = (b) => { csvBlob = b; return "blob:test"; };
  $("dlCsv").click();
  window.URL.createObjectURL = ocCsv;
  const csvP2 = csvBlob ? await csvBlob.text() : "";
  check("P2 kosovnica: korito + nosilci", csvP2.includes("Cvetlično korito za rože") && csvP2.includes("Konzolni nosilec korita"));
  // 1jb) P2 (Faza 3): STEP 3D vključuje korita in konzolne nosilce
  let stepBlob = null;
  window.URL.createObjectURL = (b) => { stepBlob = b; return "blob:test"; };
  $("dlStep").click();
  window.URL.createObjectURL = ocCsv;
  const stepTxt = stepBlob ? await stepBlob.text() : "";
  check("P2 STEP: korita + nosilci v 3D modelu", stepTxt.startsWith("ISO-10303-21") && stepTxt.includes("Cvetlično korito") && stepTxt.includes("Konzolni nosilec korita"));

  // 1k) P2 (Faza 3): robustno razčlenjevanje — presledki, prazne vrstice
  $("koritoList").value = "1100; 300\n\n1400;1900"; fire($("koritoList"), "input");
  $("gen").click(); svg = document.querySelector("#prev svg");
  check("P2 korita: robustno razčlenjevanje (presledki, prazne vrstice)", !!svg && ["KORITO ZA ROŽE (1100 mm)", "KORITO ZA ROŽE (1400 mm)"].every((k) => svg.textContent.includes(k)));

  // 1l) P2 (Faza 3): validacija meja — L=2000, 1400@1900 presega → opozorilo + izključitev
  $("L").value = "2000"; fire($("L"), "input");
  $("koritoList").value = "1100;300\n1400;1900"; fire($("koritoList"), "input");
  $("gen").click();
  const warnTxt = $("checks").textContent || "";
  svg = document.querySelector("#prev svg");
  check("P2 korita: opozorilo ob preseganju meja", warnTxt.includes("presega dolžino ograje"), warnTxt.slice(0, 80));
  check("P2 korita: presegajoče izpuščeno iz BOM", !!svg && svg.textContent.includes("Cvetlično korito") && svg.textContent.includes("širine: 1100") && !svg.textContent.includes("širine: 1100, 1400"));
  check("P2 korita: presegajoče se ne izriše", !!svg && svg.textContent.includes("KORITO ZA ROŽE (1100 mm)") && !svg.textContent.includes("KORITO ZA ROŽE (1400 mm)"));

  // 1m) P2 (Faza 3): merilo prereza vidno označeno (z koritom kor prilagojeno)
  check("P2 korita: merilo prereza vidno označeno", !!svg && /PREREZ A–A · M 1:\d+/.test(svg.textContent));

  // 1n) P2 (Faza 3): prazna korita → brez korit/BOM vrstic
  $("L").value = "4200"; fire($("L"), "input");
  $("koritoList").value = ""; fire($("koritoList"), "input");
  $("gen").click(); svg = document.querySelector("#prev svg");
  check("P2 korita: prazno polje → brez korit in BOM vrstic", !!svg && !svg.textContent.includes("Cvetlično korito") && !svg.textContent.includes("KORITO ZA ROŽE"));

  $("slabT").value = "0"; fire($("slabT"), "input");
  $("segList").value = ""; fire($("segList"), "input");
  $("w2").value = "0"; fire($("w2"), "input");
  $("slabT").value = "0"; fire($("slabT"), "input");

  // 2) pokoncna -> referencni list
  $("sysUse").value = "pokoncna"; fire($("sysUse"), "change");
  $("gen").click();
  let t = $("prev").textContent || "";
  check("referencni list (pokoncna)", t.includes("SPREDNJI POGLED") && t.includes("OSI NOSILCEV"));

  // 3) stopnice -> stopniscni list + brez laznega opozorila (regresija)
  $("sysUse").value = "stopniscna"; fire($("sysUse"), "change");
  $("gen").click();
  t = $("prev").textContent || "";
  check("stopniscni list", t.includes("STOPNIŠČNA OGRAJA"));
  check("stopniscna brez laznega opozorila", !$("checks").textContent.includes("ni predviden"));

  // 4) validacija: lamela+reza > H
  $("sysUse").value = "precna"; fire($("sysUse"), "change");
  $("n").value = "40"; fire($("n"), "input");
  check("validacija vsote lamel", $("checks").classList.contains("on") && $("checks").textContent.includes("presega višino"));
  $("n").value = "16"; fire($("n"), "input");

  // 5) BOM: kolicina lamel sledi N (regresija: trdo kodirano "18")
  //    opomba: input na L sprozi applySystem, ki ponastavi sw/st na profil — zato ju nastavimo eksplicitno
  $("L").value = "3800"; fire($("L"), "input");
  $("sw").value = "80"; fire($("sw"), "input");
  $("st").value = "20"; fire($("st"), "input");
  $("n").value = "21"; fire($("n"), "input");
  $("gen").click();
  t = ($("prev").textContent || "").replace(/\s+/g, "");
  check("BOM kolicina = N", t.includes("3800×21") && !t.includes("3800×18"));

  // 6) rezalni nacrt + predracun
  $("n").value = "16"; fire($("n"), "input");
  $("buildCut").click();
  check("rezalni nacrt (kerf)", $("cutOut").textContent.includes("Rezalni načrt"));
  $("buildQuote").click();
  check("predracun vsota (EUR)", /EUR/.test($("quoteOut").textContent));

  // 7) montažni checklist: sklopi A-E
  $("buildChecklist").click();
  t = $("checklistOut").textContent;
  check("checklist sklopi A-E",
    ["A. DOSTAVA", "B. PRED MONTAŽO", "C. GEOMETRIJA", "D. ZAKLJUČEK", "E. FOTOGRAFSKA"].every((s) => t.includes(s)));

  // 8) DXF izvoz: Y koordinate znotraj lista (regresija flipa + bezier vzorcenje)
  $("paper").value = "A4";
  let blob = null;
  const origCreate = window.URL.createObjectURL;
  window.URL.createObjectURL = (b) => { blob = b; return "blob:test"; };
  $("dlDxf").click();
  window.URL.createObjectURL = origCreate;
  let dxfOk = false, dxfInfo = "brez bloba";
  if (blob) {
    try {
      const txt = await blob.text();
      const lines = txt.split("\n");
      const ys = [];
      for (let i = 0; i < lines.length; i++) if (lines[i] === "20") ys.push(parseFloat(lines[i + 1]));
      dxfOk = ys.length > 10 && ys.every((y) => y >= -0.001 && y <= 297.001);
      dxfInfo = ys.length + " Y vrednosti, maks " + Math.max(...ys).toFixed(1);
    } catch (e) { dxfInfo = "blob.text() ni podprt: " + e.message; }
  }
  check("DXF izvoz (Y obseg, bezier)", dxfOk, dxfInfo);
  $("paper").value = "A3";

  // 9) datum se samodejno izpolni (regresija: trdo kodiran datum)
  check("datum samodejno izpolnjen", /^\d{2}\.\d{2}\.\d{4}$/.test($("date").value), $("date").value);

  // 10) predracun CSV vsebuje obe vrsti vijakov (regresija nbolt)
  {
    let b2 = null;
    window.URL.createObjectURL = (b) => { b2 = b; return "blob:test"; };
    $("menuDlQuote").click();
    window.URL.createObjectURL = origCreate;
    let ok2 = false, inf2 = "brez bloba";
    if (b2) {
      try {
        const txt = await b2.text();
        ok2 = txt.includes("Vijaki RF") && txt.includes("Pritrdilni vijaki") && txt.includes("SKUPAJ");
        inf2 = ok2 ? "CSV v redu" : "manjkajo postavke";
      } catch (e) { inf2 = e.message; }
    }
    check("predracun CSV: RF + pritrdilni vijaki", ok2, inf2);
  }

  // 11) vgrajena samoprevera: 126 kombinacij
  $("menuSelfTest").click();
  t = $("globalStatus").textContent;
  check("vgrajena samoprevera 126/126", t.includes("126 kombinacij") && t.includes("0 napak") && t.includes("0 JS napak"), t);

  // 14) Faza 0.5: tema — toggle, localStorage, sprememba atributa
  const htmlEl = document.documentElement;
  htmlEl.setAttribute("data-theme", "dark");
  window.localStorage.removeItem("draftwright-theme");
  $("themeBtn").click();
  check("tema: preklop na svetlo + shranjeno", htmlEl.getAttribute("data-theme") === "light" && window.localStorage.getItem("draftwright-theme") === "light");
  $("themeBtn").click();
  check("tema: preklop nazaj na temno", htmlEl.getAttribute("data-theme") === "dark");

  // 15) Faza 0.5: toast obvestila (zadnji dodani — predhodni iz preklopov teme)
  window.toast("Test toast");
  const toastEls = $("toastZone").querySelectorAll(".toast");
  const toastEl = toastEls[toastEls.length - 1];
  check("toast: prikaže sporočilo (zadnji)", !!toastEl && toastEl.textContent.includes("Test toast"));

  // 16) Faza 0.5: galerija primerov
  window.openTemplates();
  check("galerija: modal odprt + 8 kartic", $("tmplOverlay").classList.contains("on") && $("tmplGrid").querySelectorAll(".tmpl-card").length === 8);
  window.applyTemplate("precna");
  check("galerija: primer naložen (L=4000) + modal zaprt + risba generirana", $("L").value === "4000" && !$("tmplOverlay").classList.contains("on") && !!document.querySelector("#prev svg"));

  // 17) Faza 0.5: pan toggle + fullscreen gumb obstajata
  $("panBtn").click();
  check("pan: toggle aktivira način", $("panBtn").classList.contains("on"));
  $("panBtn").click();
  check("pan: toggle izklopi", !$("panBtn").classList.contains("on"));
  $("fsBtn").click();
  check("fullscreen: gumb ima delujoč handler", typeof $("fsBtn").onclick === "function" && errors.length === 0);

  // 18) Faza 2: 3D pogled — zbirni model + rotacija + modal
  const sols = window.collectSolids();
  check("3D: collectSolids vrne telesa (≥10)", Array.isArray(sols) && sols.length >= 10, sols.length + " teles");
  const iso = window.renderIso3D(35, 25);
  check("3D: renderIso3D vrne SVG s poligoni", iso.includes("<svg") && iso.includes("<polygon") && (iso.match(/<polygon/g) || []).length >= 24, (iso.match(/<polygon/g) || []).length + " poligonov");
  $("isoBtn").click();
  check("3D: modal odprt + info vrstica", $("isoOverlay").classList.contains("on") && $("isoInfo").textContent.includes("Azimut 35°"));
  document.querySelector('[data-iso="top"]').click();
  check("3D: gumb Top spremeni elevacijo (90°)", $("isoInfo").textContent.includes("Elevacija 90°"));
  $("isoClose").click();
  check("3D: modal se zapre", !$("isoOverlay").classList.contains("on"));

  // 19) Faza 2: miniature shranjenih projektov — prjSave ne crash-a; thumbnail fallback v jsdom
  $("prjName").value = "Miniatura test";
  $("prjSave").click();
  const prjListHtml = $("prjList").innerHTML;
  check("miniature: prjSave shrani + vrstica vsebuje miniaturo (fallback)", prjListHtml.includes("Miniatura test") && prjListHtml.includes("prj-thumb"));

  // 20) Faza 3 (i18n): preklop EN/SL — UI se prevede, risba ostane SL
  $("langBtn").click();
  check("i18n: html lang=en + h2 Slika→Photo + stepper 1 Photo", document.documentElement.getAttribute("lang") === "en" && document.querySelector('[data-panel="photo"] h2').textContent.includes("Photo") && $("steps").textContent.includes("1 Photo"));
  check("i18n: gumb Generiraj risbo → Generate drawing", $("gen").textContent.includes("Generate drawing"));
  $("langBtn").click();
  check("i18n: povratek v SL (h2 Slika)", document.documentElement.getAttribute("lang") === "sl" && document.querySelector('[data-panel="photo"] h2').textContent.includes("Slika"));
  check("i18n: risba ostane SL (ni vpliva na SVG)", !!document.querySelector("#prev svg") && document.querySelector("#prev svg").textContent.includes("SPREDNJI POGLED"));

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
