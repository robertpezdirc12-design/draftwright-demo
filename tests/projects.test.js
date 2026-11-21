/**
 * P5 — shranjeni projekti (brskalnik) + deljenje po URL povezavi — poganja `npm test`.
 * Pokritje: shrani/odpri/izbriši projekte iz localStorage, URL #p=<base64url> kodiranje
 * in obnovitev (prjRestoreFromHash), Esc zapiranje dialoga, enoten restoreProjectString.
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
const setField = (id, v) => { $(id).value = String(v); fire($(id), "input"); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

(async () => {
  // 1) dialog: prazen seznam
  $("prjDialogBtn").click();
  check("dialog se odpre, seznam prazen", $("prjOverlay").classList.contains("on") && $("prjList").textContent.includes("Še ni shranjenih projektov"));

  // 2) shrani projekt A (ime vneseno)
  setField("proj", "TESTNI PROJEKT A"); setField("L", "4200"); setField("H", "1050");
  $("prjName").value = "Moja ograja 1";
  $("prjSave").click();
  check("shranjevanje: 1 projekt na seznamu", $("prjList").textContent.includes("Moja ograja 1") && JSON.parse(window.localStorage.getItem("draftwright-projects")).length === 1);
  check("shranjevanje: brez fotografije (kvota)", !JSON.parse(window.localStorage.getItem("draftwright-projects"))[0].data.includes('"photo":"data:'));

  // 3) shrani projekt B (privzeto ime = naziv projekta)
  setField("proj", "DRUGI PROJEKT"); setField("L", "6000");
  $("prjSave").click();
  const list2 = JSON.parse(window.localStorage.getItem("draftwright-projects"));
  check("shranjevanje: 2 projekta, najnovejši na vrhu", list2.length === 2 && list2[0].name === "DRUGI PROJEKT");

  // 4) odpri prvi (Moja ograja 1) — polja se obnovijo
  document.querySelector('[data-prj-open="1"]').click();
  check("odpiranje: L=4200 in naziv obnovljena", $("L").value === "4200" && $("proj").value === "TESTNI PROJEKT A");
  check("odpiranje: dialog se zapre", !$("prjOverlay").classList.contains("on"));

  // 5) izbriši drugi → 1 preostanek
  document.querySelector('[data-prj-del="0"]').click();
  check("brisanje: 1 preostanek", JSON.parse(window.localStorage.getItem("draftwright-projects")).length === 1);

  // 6) povezava: prompt fallback (navigator.clipboard ni v jsdom) + kodiranje
  let prompted = null;
  window.prompt = (msg, val) => { prompted = val; return val; };
  $("prjLinkBtn").click();
  check("povezava: prompt z URL #p=<base64url>", !!prompted && prompted.indexOf("#p=") > 0 && !/[+/=]/.test(prompted.slice(prompted.indexOf("#p=") + 3)), Math.round((prompted || "").length / 1024) + " kB");
  check("povezava: ne vsebuje fotografije", !decodeURIComponent(escape(atob(prompted.slice(prompted.indexOf("#p=") + 3).replace(/-/g, "+").replace(/_/g, "/")))).includes('"photo":"data:'));

  // 7) obnovitev iz povezave (prjRestoreFromHash) — L iz projekta A
  setField("L", "9999");
  window.location.hash = prompted.slice(prompted.indexOf("#p="));
  const ok = window.prjRestoreFromHash();
  check("povezava: obnovitev — L=4200 iz projekta", ok === true && $("L").value === "4200");
  check("povezava: hash očiščen po obnovitvi", window.location.hash === "" || window.location.hash.indexOf("#p=") !== 0);

  // 8) neveljavna povezava — pošteno sporočilo, brez zloma
  window.location.hash = "#p=NEVELJAVNO!!!";
  const ok2 = window.prjRestoreFromHash();
  check("povezava: neveljavna — false + sporočilo", ok2 === false && $("globalStatus").textContent.includes("ni veljavna"));

  // 9) Esc zapre dialog
  $("prjDialogBtn").click();
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("Esc zapre dialog projektov", !$("prjOverlay").classList.contains("on"));

  // 10) enoten restoreProjectString: napačna shema javi napako
  let threw = "";
  try { window.restoreProjectString(JSON.stringify({ schema: "druga-shema", data: {} })); }
  catch (e) { threw = e.message; }
  check("restoreProjectString: napačna shema javi napako", threw.includes("nepodprta shema"));

  // 11) Faza 1: share view mode — povezava za ogled + vklop/izklop načina
  prompted = null;
  window.prompt = (msg, val) => { prompted = val; return val; };
  $("prjLinkView").click();
  const viewUrl = prompted || "";
  check("view: povezava vsebuje ?view=1#p=<base64url>", viewUrl.includes("?view=1#p=") && !/[+/=]/.test(viewUrl.slice(viewUrl.indexOf("#p=") + 3)), Math.round(viewUrl.length / 1024) + " kB");
  window.history.pushState(null, "", "https://draftwright-demo.vercel.app/?view=1");
  check("view: parseViewMode vklopi način (body.viewmode)", window.parseViewMode() === true && document.body.classList.contains("viewmode") && !!$("vbPdf") && !!$("vbEdit"));
  window.history.pushState(null, "", "https://draftwright-demo.vercel.app/?x=1");
  check("view: brez ?view se način ne vklopi (čisti URL)", window.parseViewMode() === false);
  document.body.classList.remove("viewmode");

  // 12) Faza 1: regresija — nalaganje z ?view=1#p=<hash> ob inicializaciji NE sme povzročiti JS napake
  //    (prej: $("emptyExample") izgine po restore/generate → crash "Cannot set properties of null")
  const viewHtml = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
  const viewErrs = [];
  const domView = new JSDOM(viewHtml, {
    runScripts: "dangerously", pretendToBeVisual: true,
    url: "https://draftwright-demo.vercel.app/?view=1#p=eyJ0ZXN0IjoxfQ",
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = function () {
        return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
      };
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = function () {};
      window.addEventListener("error", (e) => viewErrs.push(String(e.message || e.error)));
    },
  });
  await sleep(120);
  check("view: nalaganje z ?view=1#p= brez JS napak", viewErrs.length === 0, viewErrs[0] || "brez napak");
  check("view: body.viewmode aktiven + uuid gumba", domView.window.document.body.classList.contains("viewmode") && !!domView.window.document.getElementById("vbPdf"));

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
