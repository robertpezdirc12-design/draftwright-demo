/**
 * Smoke test za tehnicka-risba-pro.html — poganja ga `npm test` (jsdom, brez brskalnika).
 * Preveri generiranje vseh tipov listov, validacije, izvoze in regresije popravljenih napak.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
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
  check("BOM kolicina = N", t.includes("80x20x2x380021") && !t.includes("80x20x2x380018"));

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

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
