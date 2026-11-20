/**
 * Faza 3+4 (Issue #2 pogl. 7, 11, 12, 13) regresijski testi — poganja `npm test`.
 * Pokritje: večdolžinski nesting (stopnice), sledljivost količin, registr komponent
 * (vrata TBI), shema verzije projekta + legacy load, kvota, kalibracija v autosave, label for=.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
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
    window.HTMLAnchorElement.prototype.click = function () {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const setField = (id, v) => { $(id).value = String(v); fire($(id), "input"); };

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

(async () => {
  // ---- pogl. 7: večdolžinski nesting (stopnice: lamela 940 + ročaj 3931) ----
  $("gen").click();
  $("sysUse").value = "stopniscna"; fire($("sysUse"), "change");
  setField("stN", 12); setField("stH", 1000); setField("stRise", 170); setField("stGoing", 280); setField("stPosts", 7);
  $("buildCut").click();
  const cut = $("cutOut").textContent;
  check("nesting: lamela 12×940 + ročaj 2×3931", cut.includes("12 kos × 940 mm") && cut.includes("2 kos × 3931 mm"), cut.slice(0, 110));
  check("nesting: ročajev v 4000 (ostanek 69)", cut.includes("Ročaj (naklon) 3931 mm") && cut.includes("69 mm"), cut.match(/DESKA 1[^<]*/)?.[0]);
  check("nesting: lamele 2 na desko 2200 (optimalno)", (cut.match(/2 kos Lamela/g) || []).length >= 5, "nabava " + (cut.match(/nabava \d+ desk/)?.[0] || ""));
  check("nesting: brez neizrezljivih", !cut.includes("ni mogoče izrezati"));

  // regresija: enodolžinski DP še vedno optimalen (16×500 → 4×2200)
  $("sysUse").value = "precna"; fire($("sysUse"), "change");
  setField("L", 500); setField("n", 16); setField("stockLen", "5800; 4000; 2200");
  $("buildCut").click();
  check("DP regresija: 16×500 = 4 desk × 8.80 m", $("cutOut").textContent.includes("4 desk") && $("cutOut").textContent.includes("8.80 m"));

  // ---- pogl. 7/11: sledljivost v kosovnici (stolpec Izračun) ----
  $("dlCsv").click();
  let csv = await blobQueue[blobQueue.length - 1].text();
  check("kosovnica: stolpec Izračun", csv.includes('"Izračun"'));
  check("kosovnica: sled pri nosilcih (limit Roksal)", csv.includes("razmak med stebri ≤"), (csv.match(/"Nosilec"[^\n]*/) || [""])[0]);
  check("kosovnica: sled pri vijakih RF", csv.includes("2 × lamela + 2 × nosilec"));
  check("kosovnica: Sidra z anchom", csv.includes('"Sidra (M10 — 90 mm)"'));

  // ---- pogl. 11: registr komponent — vrata TBI, brez izmišljenih specifikacij ----
  check("registr: vrata TBI (ni funkcionalna postavka)", csv.includes("TBI — podatki proizvajalca") && csv.includes("ni v BOM"));

  // ---- pogl. 12: shema verzije + legacy load + refMode ----
  $("refMode").checked = true;
  $("save").click();
  let proj = JSON.parse(await blobQueue[blobQueue.length - 1].text());
  check("projekt: ovojnica v2 (schema+version)", proj.schema === "draftwright-project" && proj.version === 2);
  check("projekt: refMode v data", proj.data.refMode === true);
  // legacy (v0): ravna struktura brez ovojnice se naloži
  const legacy = JSON.stringify({ L: "2500", n: "9", refMode: true, calMode: "plane" });
  const lf = $("loadFile");
  Object.defineProperty(lf, "files", { value: [new window.File([legacy], "l.json", { type: "application/json" })], configurable: true });
  fire(lf, "change");
  await new Promise((r) => setTimeout(r, 120));
  check("legacy v0: L=2500 naložen", $("L").value === "2500" && $("n").value === "9");
  check("legacy v0: refMode obnoven", $("refMode").checked === true);
  // nova verzija → zavrnjena: polja se NE spremenijo (status prepiše updateGlobalStatus)
  setField("L", "1234");
  const newer = JSON.stringify({ schema: "draftwright-project", version: 99, data: { L: "9999" } });
  Object.defineProperty(lf, "files", { value: [new window.File([newer], "n.json", { type: "application/json" })], configurable: true });
  fire(lf, "change");
  await new Promise((r) => setTimeout(r, 80));
  check("novejša shema: zavrnjena (L ostane 1234)", $("L").value === "1234");
  // pokvarjen JSON → prijazna napaka, brez crasha, polja ostanejo
  Object.defineProperty(lf, "files", { value: [new window.File(["{pokvarjen"], "k.json", { type: "application/json" })], configurable: true });
  fire(lf, "change");
  await new Promise((r) => setTimeout(r, 80));
  check("pokvarjen JSON: prijazna napaka, polja ohranjena", $("L").value === "1234" && !$("photoBox").classList.contains("loading"));
  $("refMode").checked = false;

  // ---- pogl. 12: kalibracija v autosave (localStorage) ----
  setField("L", "3000");
  await new Promise((r) => setTimeout(r, 500)); // debounce 400 ms
  const saved = JSON.parse(window.localStorage.getItem("tehnicka-risba-pro-state") || "{}");
  check("autosave: refMode + stanje", saved.refMode === false && saved.L === "3000");
  // (kalibracija se shrani samo, če je uporabnik kalibriral — S.cal je null v testu)

  // ---- pogl. 13: label for= dostopnost ----
  let withFor = 0, without = 0;
  document.querySelectorAll("aside label:not([for])").forEach((l) => {
    const nxt = l.nextElementSibling;
    if (nxt && /^(INPUT|SELECT|TEXTAREA)$/.test(nxt.tagName) && nxt.id) without++;
    else if (l.textContent.trim() && !l.querySelector("input")) {
      // labeli, ki niso vezani na polje (checkboxi znotraj, akcije) — štejejo kot OK
    }
  });
  document.querySelectorAll("aside label[for]").forEach(() => withFor++);
  check("label for= dodan (≥70 polj)", withFor >= 70, withFor + " label[for]");
  check("brez labelov brez for= tik pred poljem z id", without === 0, without + " brez for=");

  // ---- pogl. 16: samoprevera še vedno 126/126 ----
  $("menuSelfTest").click();
  check("samoprevera 126/126 po Fazi 3/4", /126 kombinacij · 0 napak · 0 JS napak/.test($("globalStatus").textContent), $("globalStatus").textContent);

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
