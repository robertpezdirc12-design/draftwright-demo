/**
 * Testi Roksal P2 integracij (vir: roksal.com — garancijski PDF, splošni pogoji v5.0, FAQ, kontakt) — poganja `npm test`.
 * Pokrije: tehnični list materiala, povpraševanje Roksal, prodajne pogoje v naročilniku,
 * kontakt blok v checklistu, orodja in težo pošiljke v montažnem načrtu.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];

const downloads = [];
const blobQueue = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.URL.createObjectURL = (b) => { blobQueue.push(b); return "blob:test"; };
    window.HTMLAnchorElement.prototype.click = function () {
      const b = blobQueue.shift();
      downloads.push({ name: this.download || "", text: b ? b.text() : Promise.resolve(null) });
    };
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
  $("gen").click();

  // 1) tehnični list materiala (meni)
  $("menuDlTech").click();
  check("tehnični list: prenesen", downloads.length === 1 && downloads[0].name.endsWith("-tehnicni-list.txt"), downloads[0]?.name);
  let t = downloads[0]?.text ? await downloads[0].text : null;
  check("tehnični list: naslov", !!t && t.includes("TEHNIČNI LIST — WOODCORE WPC DESKE"));
  check("tehnični list: sila vijaka 1840 N", !!t && t.includes("1840 N"));
  check("tehnični list: modul 2360 MPa", !!t && t.includes("2360 MPa"));
  check("tehnični list: vse vrstice zahteva/izmerjeno", !!t && ["0,6 %", "61", "23,8 MPa", "0,08 %", "0,11 %"].every((s) => t.includes(s)));
  check("tehnični list: viri PDF", !!t && t.includes("WOODCORE_navodila_za_montazo-sl.pdf"));
  check("tehnični list: kontakt", !!t && t.includes("064 123 030"));

  // 2) povpraševanje Roksal (meni)
  $("stranka").value = "Marjeta Novak"; fire($("stranka"), "input");
  $("strankaTip").value = "Podjetje"; fire($("strankaTip"), "change");
  $("strankaDav").value = "SI12345678"; fire($("strankaDav"), "input");
  $("strankaNaslov").value = "Cesta 1, 4000 Kranj"; fire($("strankaNaslov"), "input");
  $("strankaEmail").value = "m.novak@example.si"; fire($("strankaEmail"), "input");
  $("strankaTel").value = "041 234 567"; fire($("strankaTel"), "input");
  $("dobavaMode").value = "Dostava in montaža"; fire($("dobavaMode"), "change");
  $("menuDlEnquiry").click();
  check("povpraševanje: preneseno", downloads.length === 2 && downloads[1].name.endsWith("-povprasevanje.txt"), downloads[1]?.name);
  let p = downloads[1]?.text ? await downloads[1].text : null;
  check("povpraševanje: naslov", !!p && p.includes("POVPRAŠEVANJE — WOODCORE WPC DESKE"));
  check("povpraševanje: kontakt polja", !!p && p.includes("Marjeta Novak") && p.includes("SI12345678") && p.includes("m.novak@example.si") && p.includes("Dostava in montaža"));
  check("povpraševanje: projekt (profil, barva, mere)", !!p && p.includes("Profil: ROMB-67") && p.includes("Amazon wood") && p.includes("Vrsta: prečna ograja"));
  check("povpraševanje: omejitev razmaka", !!p && /izračun \d+ mm \(omejitev ≤ \d+ mm\)/.test(p));
  check("povpraševanje: podlaga in pritrditev", !!p && p.includes("Podlaga: beton") && p.includes("Pritrjenje: na ploščo"));
  check("povpraševanje: priloge 25 MB", !!p && p.includes("info@roksal.com") && p.includes("≤ 25 MB"));

  // 3) naročilnik: prodajni pogoji + dostava + kontakt (prek menija; samodejni buildCut/buildOrder)
  blobQueue.length = 0; downloads.length = 0;
  $("menuDlOrder").click();
  p = downloads[0]?.text ? await downloads[0].text : null;
  check("naročilnik: prodajni pogoji v5.0", !!p && p.includes("PRODAJNI POGOJI (Roksal d.o.o.") && p.includes("Ponudba velja 1 dan"));
  check("naročilnik: ugovor 8 dni + vračilo 30 dni", !!p && p.includes("pisno v 8 dneh") && p.includes("manipulativni stroški do 20 %"));
  check("naročilnik: skladiščnina + B2C 14 dni", !!p && p.includes("skladiščnina 10/20 EUR") && p.includes("razrezano po meri izključeno"));
  check("naročilnik: dostava/logistika", !!p && p.includes("kurirji samo do cca 1,5–2 m") && p.includes("1 m² terase ≈ 25 kg"));
  check("naročilnik: kontakt Roksal", !!p && p.includes("064 123 020") && p.includes("Savska Loka 21") && p.includes("Žabnica"));

  // 4) montažni checklist: orodje + kontakt
  $("buildChecklist").click();
  const cl = $("checklistOut").textContent;
  check("checklist: orodje v sklopu B", cl.includes("Orodje: baterijski vrtalnik") && cl.includes("granulacija 40"));
  check("checklist: kontakt Roksal", cl.includes("KONTAKT — ROKSAL D.O.O.") && cl.includes("fasade 064 120 969"));
  check("checklist: delovni čas", cl.includes("pon–čet 7:00–15:30"));

  // 5) montažni načrt terase: teža pošiljke + orodja v nogi
  setUseTerasa();
  function setUseTerasa() { $("sysUse").value = "terasa"; fire($("sysUse"), "change"); }
  $("makePlan").click();
  const plan = $("planOut").textContent;
  check("načrt: teža pošiljke (25 kg/m²)", plan.includes("Teža pošiljke") && plan.includes("1 m² terase ≈ 25 kg"));
  check("načrt: orodja in aksesoarji v nogi", plan.includes("Widia/HM rezila") && plan.includes("WEPOS WPC impregnacija") && plan.includes("fasadni klipi"));

  // 6) izvozni dialog: 9 vsebin vključno z novima izvozoma
  $("exportDialog").click();
  const items = [...document.querySelectorAll("#expItems [data-exp-item]")].map((el) => el.getAttribute("data-exp-item"));
  check("dialog: 12 vsebin z tehlist+povpras+tloris+skica", items.length === 12 && items.includes("tehlist") && items.includes("povpras") && items.includes("tlorisSvg") && items.includes("skicaSvg"), items.join(", "));
  check("dialog: povzetek 10/12", $("expSumVsebina").textContent === "Vključeno 10/12", $("expSumVsebina").textContent);
  const narociloChip = document.querySelector('[data-exp-preset="narocilo"]');
  narociloChip.click();
  check("preset narocilo vključuje povpraševanje", $("expItems").querySelector('[data-exp-item="povpras"]').checked === true);

  // 7) samoprevera: 126 kombinacij še vedno
  $("expClose").click();
  $("menuSelfTest").click();
  check("samoprevera 126/126", /126 kombinacij · 0 napak · 0 JS napak/.test($("globalStatus").textContent), $("globalStatus").textContent);

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
