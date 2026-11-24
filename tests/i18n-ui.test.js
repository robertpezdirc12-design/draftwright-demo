/**
 * Issue #41 — EN UI parity za novejše funkcionalnosti (frontend).
 *
 * Pregled 2026-11-23 (P2) je ugotovil: v EN načinu so meni, polja za korita in
 * segmente, orodja skice ter statusna sporočila ostala v slovenščini — mešan
 * jezik za EN uporabnike. Ta surov zaklene celoten uporabniški vmesnik:
 *   - navigacija + bližnjice (številke ostanejo),
 *   - korita/segmenti in tloris/skica orodja + title atributi,
 *   - začetna IN dinamična statusna sporočila (live regije, toast),
 *   - povratek v SL brez ostankov angleščine,
 *   - tehnična risba ostane SL (namerna izjema).
 *
 * Na stari kodi bi PADO (navedeni elementi ostanejo SL).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = () => ({
      drawImage() {}, getImageData(x, y, WW, H) { return { data: new Uint8ClampedArray(WW * H * 4) }; },
    });
    w.URL.revokeObjectURL = () => {};
    w.URL.createObjectURL = () => "blob:test";
    w.HTMLAnchorElement.prototype.click = function () {};
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
const txt = (sel) => (document.querySelector(sel) || {}).textContent || "";

(async () => {
  /* ---- 0) izhodišče: SL ---- */
  check("privzeto SL: meni Skica", txt('button[data-goto="skica"]').includes("Skica"));
  check("privzeto SL: polje Korita", txt('label[for="koritoList"]').includes("Korita za rože"));
  check("privzeto SL: status Ni umerjeno", $("calStatus").textContent === "Ni umerjeno.");

  /* risba nastane v SL in mora taka ostati tudi po preklopu (namerna izjema) */
  $("L").value = "3800"; $("H").value = "1200"; $("n").value = "16";
  $("gen").click();
  check("risba generirana za dokaz SL izpisa", !!document.querySelector("#prev svg"));

  /* ---- 1) preklop v EN ---- */
  $("langBtn").click();
  check("html lang=en po preklopu", document.documentElement.getAttribute("lang") === "en");

  const nav = document.querySelector('button[data-goto="skica"]');
  check("EN meni: Skica → Sketch", nav && nav.textContent.includes("Sketch"), nav && nav.textContent);
  check("EN meni: bližnjica 9 ostane vidna", !!nav.querySelector("span.k") && nav.querySelector("span.k").textContent === "9");
  check("EN meni: bližnjica jeZA oznako (ne pred njo)",
    nav.innerHTML.indexOf("Sketch") < nav.innerHTML.indexOf("<span"), nav.innerHTML);
  const visLabel = (fg) => document.querySelector('input[data-fg="' + fg + '"]').parentElement.textContent.trim();
  check("EN vidnost: Umeritev → Calibration", visLabel("cal") === "Calibration", visLabel("cal"));
  check("EN vidnost: Skica → Sketch", visLabel("skica") === "Sketch", visLabel("skica"));
  check("EN meni: Zaznavanje lamel → Detection", txt('button[data-goto="detect"]').includes("Detection"));
  check("EN meni: Montaža in količine → Installation", txt('button[data-goto="plan"]').includes("Installation"));

  check("EN polja: korita → Flower troughs", txt('label[for="koritoList"]').includes("Flower troughs"), txt('label[for="koritoList"]'));
  check("EN polja: segmenti → Front-view segments", txt('label[for="segList"]').includes("Front-view segments"), txt('label[for="segList"]'));
  check("EN polja: višina korita → Flower trough — height", txt('label[for="koritoH"]').includes("Flower trough — height"));

  check("EN orodja skice: Prosto → Freehand", txt('[data-sk-tool="prosto"]').includes("Freehand"));
  check("EN orodja skice: Radirka → Eraser", txt('[data-sk-tool="radirka"]').includes("Eraser"));
  check("EN orodja skice: Črna → Black", txt("#skColor option").includes("Black"));
  check("EN title: Celozaslonsko urejanje → Fullscreen editing",
    document.querySelector("#tlrFs").getAttribute("title") === "Fullscreen editing");
  check("EN title: Zapri (Esc) → Close (Esc)",
    document.querySelector("#expClose").getAttribute("title") === "Close (Esc)");
  check("EN title: Odpri izbiro stranske plošče → Open side panel picker",
    document.querySelector("#panelBtn").getAttribute("title") === "Open side panel picker (Alt+P)");
  check("EN tloris: Uporabi v izračun → Apply to calculation", txt("#tlorisApply").includes("Apply to calculation"));

  /* ---- 2) statična in dinamična statusna sporočila ---- */
  check("EN status: Ni umerjeno → Not calibrated", $("calStatus").textContent === "Not calibrated.", $("calStatus").textContent);
  $("globalStatus").textContent = "Pripravljeno.";
  await new Promise((r) => setTimeout(r, 0));
  check("EN status: global Ready", $("globalStatus").textContent === "Ready.", $("globalStatus").textContent);
  check("EN status: tloris Path empty", $("tlorisStatus").textContent.startsWith("Path empty"), $("tlorisStatus").textContent);
  check("EN status: skica Blank sheet", $("skStatus").textContent.startsWith("Blank sheet"), $("skStatus").textContent);

  check("EN uiMsg: prefix z ohranjeno številko",
    window.uiMsg("Segmentov: 3 · skupna dolžina: 12000 mm") === "Segments: 3 · total length: 12000 mm",
    window.uiMsg("Segmentov: 3 · skupna dolžina: 12000 mm"));
  check("EN uiMsg: celo sporočilo s številko",
    window.uiMsg("Umeritev uspešna: 1000 mm referenca.") === "Calibration successful: 1000 mm reference.",
    window.uiMsg("Umeritev uspešna: 1000 mm referenca."));
  check("EN uiMsg: vrednost orodja ne ostane SL",
    window.uiMsg("Orodje: prosto") === "Tool: Freehand", window.uiMsg("Orodje: prosto"));
  check("EN uiMsg: razgrni vse vidne",
    window.uiMsg("Prikazani vsi vidni sklopi.") === "All visible sections shown.");

  window.toast("Ni umerjeno.", "ok");
  await new Promise((r) => setTimeout(r, 0)); // MutationObserver je mikro-/task-asynchrono
  const toasts = $("toastZone").querySelectorAll(".toast");
  check("EN toast: dinamično sporočilo prevedeno",
    toasts.length > 0 && toasts[toasts.length - 1].textContent === "Not calibrated.",
    toasts.length ? toasts[toasts.length - 1].textContent : "brez toastov");
  check("EN toast: kontejner ostane nedotaknjen (vsi otroci so .toast)",
    toasts.length > 0 && Array.from(toasts).every((el) => el.classList.contains("toast")), "otrok=" + toasts.length);

  check("EN izjema: risba ostane SL", document.querySelector("#prev svg").textContent.includes("SPREDNJI POGLED"));

  /* ---- 3) povratek v SL ---- */
  $("langBtn").click();
  check("povratek: html lang=sl", document.documentElement.getAttribute("lang") === "sl");
  check("povratek: meni spet Skica", txt('button[data-goto="skica"]').includes("Skica"));
  check("povratek: korita spet Slovensko", txt('label[for="koritoList"]').includes("Korita za rože"));
  check("povratek: orodje spet Prosto", txt('[data-sk-tool="prosto"]').includes("Prosto"));
  check("povratek: title spet Celozaslonsko urejanje",
    document.querySelector("#tlrFs").getAttribute("title") === "Celozaslonsko urejanje");
  check("povratek: status spet Ni umerjeno", $("calStatus").textContent === "Ni umerjeno.", $("calStatus").textContent);
  window.toast("Ni umerjeno.", "ok");
  await new Promise((r) => setTimeout(r, 0));
  const slToasts = $("toastZone").querySelectorAll(".toast");
  check("povratek: nov toast ostane SL",
    slToasts[slToasts.length - 1].textContent === "Ni umerjeno.");

  check("brez JS napak", errors.length === 0, errors.join(" | "));
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ""}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
