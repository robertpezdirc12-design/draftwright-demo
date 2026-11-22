/**
 * Testi izvoznega dialoga (integracija export-options) — poganja `npm test`.
 * Pokrije: odpiranje/zapiranje, prednastavitve, vsebine, vse formate risbe
 * (PDF/SVG/DXF/STEP), napredne nastavitve (vodni žig, samo-geometrija, datum,
 * metapodatki) in robne primere (prazna izbira, neveljavne mere, blokiran
 * pojavni okvir, sanitizacija imen, samostojni hitri izvozi po refactorju).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { loadAppHtml } = require("./helpers/bootApp");

const html = loadAppHtml();
const errors = [];

/* naklepni "brskalnik": par ime-datoteke ↔ blob vsebina (saveBlob: createObjectURL → a.download → a.click) */
const downloads = []; // {name, text: Promise<string>}
const blobQueue = [];
let printWindows = []; // {html}
let openBlocked = false;

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
    window.open = function () {
      if (openBlocked) return null;
      const fake = { document: { write(s) { printWindows.push({ html: String(s) }); }, close() {} }, focus() {}, print() {} };
      return fake;
    };
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
const overlayOn = () => $("expOverlay").classList.contains("on");
const openDlg = () => $("exportDialog").click();
const closeDlg = () => $("expClose").click();
const itemCb = (id) => document.querySelector(`#expItems [data-exp-item="${id}"]`);
const advCb = (id) => document.querySelector(`#expAdv [data-exp-adv="${id}"]`);
async function runExportAndWait() {
  downloads.length = 0; printWindows = [];
  $("globalStatus").textContent = ""; // čisto stanje — prejšnji (končni) status ne sme ustreli
  if ($("expGo").disabled) return downloads;
  $("expGo").click();
  // čakaj na KONČNI zaključek izvozne verige; največ 20 s
  for (let i = 0; i < 400; i++) {
    await sleep(50);
    if (/Izvoz (končan|prekinjen)|končan z napakami/.test($("globalStatus").textContent)) break;
  }
  await sleep(60);
  return downloads;
}

(async () => {
  $("gen").click(); // priprava: privzeta risba

  // 1) odpiranje prek menijskega data-call (hook gumb exportDialog)
  openDlg();
  check("odpiranje dialoga (menu)", overlayOn() && document.querySelectorAll("#expItems [data-exp-item]").length === 12,
    document.querySelectorAll("#expItems [data-exp-item]").length + " vsebin");
  check("privzeti povzetek vsebine", $("expSumVsebina").textContent === "Vključeno 10/12", $("expSumVsebina").textContent);
  check("privzeti footer", /PDF \/ tisk · risba \+ 9 prilog/.test($("expNote").textContent), $("expNote").textContent);
  check("format lista usklajen s poljem", $("expPaper").value === $("paper").value);

  // 2) Esc zapre
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("Esc zapre dialog", !overlayOn());

  // 3) Ctrl+E odpre
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "e", ctrlKey: true, bubbles: true, cancelable: true }));
  check("Ctrl+E odpre dialog", overlayOn());

  // 4) prednastavitve
  document.querySelector('[data-exp-preset="narocilo"]').click();
  check("prednastavitev »Za naročilo«: risba izključena", !itemCb("risba").checked && itemCb("order").checked && itemCb("quote").checked && itemCb("cut").checked);
  check("format onemogočen brez risbe", $("expSegs").querySelector(".exp-seg").disabled && $("expFmtOff").style.display === "inline");
  document.querySelector('[data-exp-preset="minimalno"]').click();
  check("prednastavitev »Samo risba«", itemCb("risba").checked && !itemCb("kosovnica").checked && $("expSumVsebina").textContent === "Vključeno 1/12");

  // 5) ročna sprememba počisti aktivnost prednastavitve
  itemCb("kosovnica").checked = true; fire(itemCb("kosovnica"), "change");
  check("ročni izbor deaktivira čip", !document.querySelector("[data-exp-preset].active"));

  // 5b) slovnične oblike v povzetku Napredno
  document.querySelector('[data-exp-preset="minimalno"]').click();
  advCb("wm").checked = true; fire(advCb("wm"), "change");
  check("napredno: 1 vklopljena", $("expSumAdv").textContent === "1 vklopljena", $("expSumAdv").textContent);
  advCb("geom").checked = true; fire(advCb("geom"), "change");
  check("napredno: 2 vklopljeni", $("expSumAdv").textContent === "2 vklopljeni", $("expSumAdv").textContent);
  advCb("wm").checked = false; fire(advCb("wm"), "change");
  advCb("geom").checked = false; fire(advCb("geom"), "change");

  // 6) prazna izbira → Izvozi onemogočen
  document.querySelector('[data-exp-all="nic"]').click();
  check("prazna izbira: Izvozi onemogočen", $("expGo").disabled && /Nič ni izbrano/.test($("expNote").textContent));
  document.querySelector('[data-exp-all="vse"]').click();

  // 7) SVG izvoz z vodnim žigom, metapodatki, A4, datumom v imenu
  document.querySelector('[data-exp-preset="minimalno"]').click();
  document.querySelector('[data-exp-format="SVG"]').click();
  advCb("wm").checked = true; fire(advCb("wm"), "change");
  $("expWmText").value = "PREVERJANJE";
  advCb("meta").checked = true; fire(advCb("meta"), "change");
  advCb("date").checked = true; fire(advCb("date"), "change");
  $("expPaper").value = "A4"; fire($("expPaper"), "change");
  check("format lista se uskladi nazaj v aplikacijo", $("paper").value === "A4");
  let dl = await runExportAndWait();
  let svgText = dl.length && dl[0].text ? await dl[0].text : null;
  check("SVG: 1 prenesena datoteka", dl.length === 1, dl.map(d => d.name).join(", "));
  check("SVG: ime vsebuje datum", /\d{2}-\d{2}-\d{4}\.svg$/.test(dl.length ? dl[0].name : ""), dl.length ? dl[0].name : "");
  check("SVG: width=297mm za A4", !!svgText && svgText.includes('width="297mm"'));
  check("SVG: vodni žig vsebuje besedilo", !!svgText && svgText.includes("PREVERJANJE"));
  check("SVG: metapodatki <title>", !!svgText && svgText.includes("<title>"));
  check("status po izvozu", /Izvoz končan: 1 datoteka/.test($("globalStatus").textContent), $("globalStatus").textContent);
  check("dialog se zapre po izvozu", !overlayOn());

  // 8) DXF: samo geometrija + natančnost krivulj
  //    (referenčni list, ker ima Q-krivulje — klasicni list ima samo ravne poteze)
  $("sysUse").value = "pokoncna"; fire($("sysUse"), "change"); $("gen").click();
  openDlg();
  document.querySelector('[data-exp-preset="minimalno"]').click();
  document.querySelector('[data-exp-format="DXF"]').click();
  check("DXF: polje za natančnost vidno", $("expSegField").style.display === "block");
  $("expSegSel").value = "16";
  advCb("geom").checked = true; fire(advCb("geom"), "change");
  dl = await runExportAndWait();
  let dxfHi = dl.length && dl[0].text ? await dl[0].text : null;
  const dxfLinesHi = dxfHi ? dxfHi.split("\n").filter((l) => l === "LINE").length : 0;
  check("DXF: samo-geometrija (brez TEXT)", !!dxfHi && !dxfHi.includes("\nTEXT\n"), dxfLinesHi + " LINE entitet");
  $("expSegSel").value = "4";
  advCb("geom").checked = false; fire(advCb("geom"), "change");
  dl = await runExportAndWait();
  let dxfLo = dl.length && dl[0].text ? await dl[0].text : null;
  const dxfLinesLo = dxfLo ? dxfLo.split("\n").filter((l) => l === "LINE").length : 0;
  check("DXF: 16 segmentov > 4 segmenti (krivulje)", dxfLinesHi > dxfLinesLo, dxfLinesHi + " > " + dxfLinesLo);
  check("DXF: besedila nazaj pri samo-geometriji off", !!dxfLo && dxfLo.includes("\nTEXT\n"));
  check("DXF: status brez trditve o vodnem žigu", $("globalStatus").textContent.includes("Izvoz končan") && !$("globalStatus").textContent.includes("(z vodnim žigom)"), $("globalStatus").textContent);

  // 9) PDF: vsebina @page + vodni žig v natisljivem HTML
  openDlg();
  document.querySelector('[data-exp-preset="minimalno"]').click();
  document.querySelector('[data-exp-format="PDF"]').click();
  advCb("wm").checked = true; fire(advCb("wm"), "change");
  $("expWmText").value = "OSNUTEK";
  $("expPaper").value = "A4"; fire($("expPaper"), "change");
  dl = await runExportAndWait();
  check("PDF: pojavno okno z @page A4", printWindows.length === 1 && printWindows[0].html.includes("@page{size:297mm 210mm"));
  check("PDF: vodni žig v HTML", printWindows.length === 1 && printWindows[0].html.includes("OSNUTEK"));

  // 10) PDF z blokiranim pojavnim okvirjem → risba neuspešna, priloge pa se še vedno izvozijo
  openBlocked = true;
  dl = await runExportAndWait();
  check("PDF blokiran: vektorski + tisk blokiran → napaka prijavljena", /Izvoz končan z napakami/.test($("globalStatus").textContent) && /vektorski PDF/.test($("globalStatus").textContent), $("globalStatus").textContent);
  check("PDF blokiran: brez prenosov risbe", dl.length === 0);
  // 10b) blokiran PDF ne smije opustiti prilog: risba + kosovnica → 1 prenos (kosovnica)
  openDlg();
  document.querySelector('[data-exp-preset="minimalno"]').click();
  itemCb("kosovnica").checked = true; fire(itemCb("kosovnica"), "change");
  advCb("wm").checked = false; fire(advCb("wm"), "change"); // brez žiga, da status ne omenja žiga
  dl = await runExportAndWait();
  check("PDF blokiran: priloga se vseeno izvozi", dl.length === 1 && dl[0].name.includes("kosovnica"), dl.map(d => d.name).join(", "));
  check("PDF blokiran: priloga izvožena + status napake risbe", /Izvoz končan z napakami/.test($("globalStatus").textContent) && /uspešnih, neuspešnih 1/.test($("globalStatus").textContent), $("globalStatus").textContent);
  openBlocked = false;
  downloads.length = 0;

  // 11) STEP izvoz prek dialoga
  openDlg();
  document.querySelector('[data-exp-preset="minimalno"]').click();
  document.querySelector('[data-exp-format="STEP"]').click();
  dl = await runExportAndWait();
  let stepText = dl.length && dl[0].text ? await dl[0].text : null;
  check("STEP: veljavna glava", !!stepText && stepText.startsWith("ISO-10303-21") && stepText.includes("MANIFOLD_SOLID_BREP"));

  // 12) vse 7 prilog skupaj (brez risbe) — samodejni buildCut/buildQuote/buildPlan/buildOrder/buildChecklist
  openDlg();
  document.querySelector('[data-exp-all="nic"]').click();
  ["kosovnica", "cut", "plan", "quote", "order", "checklist", "project", "tehlist", "povpras"].forEach((id) => { itemCb(id).checked = true; fire(itemCb(id), "change"); });
  check("footer: samo priloge", /Samo priloge: 9 prilog/.test($("expNote").textContent), $("expNote").textContent);
  check("footer: brez formata lista, ko risba ni izbrana", !/· A4/.test($("expNote").textContent), $("expNote").textContent);
  dl = await runExportAndWait();
  check("priloge: 9 prenosov", dl.length === 9, dl.map(d => d.name).join(", "));
  const texts = {};
  for (const d of dl) texts[d.name] = d.text ? await d.text : null;
  const kos = Object.keys(texts).find(n => n.includes("kosovnica"));
  check("priloge: kosovnica CSV glava", !!kos && !!texts[kos] && texts[kos].includes('"Št.";"Naziv";"Material"'));
  const chk = Object.keys(texts).find(n => n.includes("checklist"));
  check("priloge: checklist sklop A", !!chk && !!texts[chk] && texts[chk].includes("A. DOSTAVA"));
  const prj = Object.keys(texts).find(n => n.includes("project"));
  check("priloge: projekt JSON parsable", !!prj && !!texts[prj] && (() => { try { JSON.parse(texts[prj]); return true; } catch (e) { return false; } })());

  // 13) robni primer: neveljavne mere → izvoz prekinjen brez prenosov
  //    (nazaj na klasicni list — referencni list mere prižge in vedno izrise SVG)
  $("sysUse").value = "precna"; fire($("sysUse"), "change");
  openDlg();
  document.querySelector('[data-exp-preset="minimalno"]').click();
  document.querySelector('[data-exp-format="SVG"]').click(); // eksplicitno SVG (po STEP iz testu 11)
  $("L").value = "-5"; fire($("L"), "input"); // generate() bo pokazal »Manjkajoče mere« → brez SVG
  dl = await runExportAndWait();
  check("neveljavne mere: izvoz prekinjen", /Izvoz prekinjen/.test($("globalStatus").textContent), $("globalStatus").textContent);
  check("neveljavne mere: status enotno rdeč", $("globalStatus").style.color === "var(--bad)", $("globalStatus").style.color);
  check("neveljavne mere: brez prenosov", dl.length === 0);
  $("L").value = "3800"; fire($("L"), "input"); $("gen").click();

  // 14) sanitizacija imena datoteke (neveljavni znaki v št. risbe)
  $("drw").value = 'FL"01/2'; fire($("drw"), "input");
  openDlg();
  document.querySelector('[data-exp-preset="minimalno"]').click();
  document.querySelector('[data-exp-format="SVG"]').click();
  advCb("wm").checked = false; fire(advCb("wm"), "change");
  dl = await runExportAndWait();
  check("ime datoteke sanitizirano", dl.length === 1 && !/[\\/:*?"<>|]/.test(dl[0].name), dl.length ? dl[0].name : "");
  // 14b) zelo dolgo št. risbe → ime obrezano na varno dolžino
  $("drw").value = "X".repeat(300); fire($("drw"), "input");
  dl = await runExportAndWait();
  check("ime datoteke obrezano (≤ 80 + pripona)", dl.length === 1 && dl[0].name.length <= 100, dl.length ? dl[0].name.length + " znakov" : "");
  $("drw").value = "BO-002"; fire($("drw"), "input");

  // 15) prazen vodni žig → rezervna vrednost OSNUTEK
  openDlg();
  document.querySelector('[data-exp-preset="minimalno"]').click();
  document.querySelector('[data-exp-format="SVG"]').click();
  advCb("wm").checked = true; fire(advCb("wm"), "change");
  $("expWmText").value = "   ";
  dl = await runExportAndWait();
  let s15 = dl.length && dl[0].text ? await dl[0].text : null;
  check("prazen vodni žig → OSNUTEK", !!s15 && s15.includes("OSNUTEK") && !s15.includes("PREVERJANJE"));

  // 16) stari hitri izvozi še vedno delujejo po refactorju
  closeDlg();
  downloads.length = 0;
  $("dlSvg").click();
  check("hitri SVG še deluje", downloads.length === 1 && (downloads[0].text ? (await downloads[0].text).includes("<svg") : false));
  downloads.length = 0;
  $("dlCsv").click();
  check("hitra kosovnica še deluje", downloads.length === 1 && (downloads[0].text ? (await downloads[0].text).includes('"Št.";"Naziv"') : false));
  downloads.length = 0;
  $("dlDxf").click();
  check("hitri DXF še deluje", downloads.length === 1 && (downloads[0].text ? (await downloads[0].text).includes("ENTITIES") : false));
  downloads.length = 0;
  $("dlStep").click();
  check("hitri STEP še deluje", downloads.length === 1 && (downloads[0].text ? (await downloads[0].text).startsWith("ISO-10303-21") : false));
  downloads.length = 0;
  $("save").click();
  check("hitri shranjevalnik projekta še deluje", downloads.length === 1 && downloads[0].name.endsWith("-project.json"));

  // 17) samoprevera po refactorju (126 kombinacij)
  $("menuSelfTest").click();
  check("samoprevera 126/126 po integraciji", /126 kombinacij · 0 napak · 0 JS napak/.test($("globalStatus").textContent), $("globalStatus").textContent);

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
