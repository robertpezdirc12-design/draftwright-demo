/**
 * Issue #41 (focus-trap) — Tab / Shift+Tab mora ostati znotraj odprtega modalnega
 * dialoga (WCAG 2.1.2 "No Keyboard Trap" + 4.7.2; dostopno ime pokriva §3.E).
 *
 * Pre-fiks: dialogi so imeli [role=dialog][aria-modal=true] + Escape + obnovo fokusa,
 * a BREZ osnade za krmiljenje Tab — Shift+Tab/Tab sta umaknili tipkovnični fokus v
 * ozadje, za modalnim oknom. Popravek: en centraliziran focus-trap, ki cilja na najvišji
 * odprt modal (overlay z .on, ki vsebuje [role=dialog][aria-modal=true]) in Tab ob
 * zadnjem fokusabilnem povrže na prvi, Shift+Tab ob prvem na zadnji.
 *
 * Ta surov ustreza na pravi HTML prek jsdom in ustreže window.fwFocusTrap (javni
 * izvoz iz aplikacije), zato se lahko dejansko dokaze, da:
 *   - Trap je izvožena in deluje (Tab ob meji → na drugo mejo),
 *   - Brez odprtega modala trap NE ukrepa (privzeto tabiranje ostane),
 *   - SREDINSKI Tab ne premika fokusa (trap lovi SAMO meji, ne blokira tabanja),
 *   - Skupina fokusabilnih izključuje skriti/skliceni elementi,
 *   - Statiko: HTML dejansko vsebuje focus-trap IIFE in vsi aria-modal dialogi so
 *     znotraj overlaya.
 * Na stari kodi (brez focus-trap) bi PADO: window.fwFocusTrap bi bilo undefined.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");

let pass = 0, fail = 0, errors = [];
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; errors.push(name); console.log(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* ---------- nalaganje prave aplikacije (jsdom) ---------- */
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; }, fillRect() {}, measureText(t) { return { width: t.length }; }, getBBox() { return { x: 0, y: 0, width: 100, height: 100 }; } };
    };
    window.URL.createObjectURL = () => "blob:mem";
    window.URL.revokeObjectURL = () => {};
  }
});
const w = dom.window;
const d = w.document;

const jerr = [];
w.addEventListener("error", (e) => jerr.push(String(e.error || e.message || e)));

/* Aplikacija ob zagonu samodejno odpre "zapiski izdaj" (maybeShowWhatsNew), zato vsako
   scenico začnemo z izklopom VSEH overlayev (izločitev). */
function closeAllOverlays() { d.querySelectorAll('[class*="overlay"]').forEach((o) => o.classList.remove("on")); }

/* ---------- 1) focus-trap izvoz ---------- */
check("window.fwFocusTrap izvožena (regresija: stare kodi bi PADO)",
  w.fwFocusTrap && typeof w.fwFocusTrap.collectFocusable === "function" && typeof w.fwFocusTrap.topOpenDialog === "function",
  "fwFocusTrap=" + w.fwFocusTrap);
closeAllOverlays();
check("fwFocusTrap.topOpenDialog() brez odprtega modala → null",
  w.fwFocusTrap.topOpenDialog() === null);

/* ---------- 2) skupina fokusabilnih v pomočnem dialogu ---------- */
const help = d.getElementById("helpOverlay");
const helpDlg = help && help.querySelector('[role="dialog"][aria-modal="true"]');
closeAllOverlays();
help.classList.add("on");
check("odprtje #helpOverlay → topOpenDialog() vrne pomočni dialog",
  w.fwFocusTrap.topOpenDialog() === helpDlg);

const items = w.fwFocusTrap.collectFocusable(helpDlg);
check("pomočni dialog vsebuje > 0 fokusabilnih elementov", items.length > 0, "n=" + items.length);
check("fokusabilni seznam ne vsebuje skritih/sklicenih",
  items.every((el) => !el.disabled && !(d.defaultView && d.defaultView.getComputedStyle(el).display === "none")));

/* ---------- 3) TAB WRAP (na sintetičnem dialogu — deterministični fokus) ----------
   Jsdomov .focus() na elementih, ki so v zavihanih (display:none) sekcijah realnih
   dialogov, aktivni elementa ne premakne — zato wrap dokazujemo na lastnem odprtem
   dialogu z 3 zanesljivo fokusabilnimi gumbi. Trap cilja "zadnji odprti overlay". */
function fireTab(shift) {
  const ev = new w.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true, shiftKey: !!shift });
  return d.dispatchEvent(ev);
}
closeAllOverlays();
// Odrazi PRIZIČNO strukturo aplikacije (overlay wrapper → otroški dialog) — s tem
// topOpenDialog() cilja dialog prek [class*="overlay"]+on. (Structure A — role=dialog
// na elementu z overlay razredom — trap ne cilja in je zato v realnem UI nepomemben.)
const so = d.createElement("div");
so.className = "ft-overlay";
so.setAttribute("id", "ftSynth");
const sd = d.createElement("div");
sd.setAttribute("role", "dialog");
sd.setAttribute("aria-modal", "true");
sd.setAttribute("id", "ftSynthDlg");
so.appendChild(sd);
d.body.appendChild(so);
const t1 = d.createElement("button"); t1.id = "ftT1"; t1.type = "button";
const t2 = d.createElement("button"); t2.id = "ftT2"; t2.type = "button";
const t3 = d.createElement("button"); t3.id = "ftT3"; t3.type = "button";
sd.appendChild(t1); sd.appendChild(t2); sd.appendChild(t3);
so.classList.add("on");
const sItems = w.fwFocusTrap.collectFocusable(sd);
check("sintetični dialog (prizična struktura): 3 fokusabilnih + topOpenDialog() cilja njej",
  sItems.length === 3 && w.fwFocusTrap.topOpenDialog() === sd,
  "n=" + sItems.length + " top=" + (w.fwFocusTrap.topOpenDialog() && w.fwFocusTrap.topOpenDialog().id));

if (sItems.length >= 3) {
  // 3a) ob zadnjem, Tab → prvi (wrap)
  t3.focus();
  const a1 = d.activeElement;
  fireTab(false);
  check("TAB ob zadnjem fokusabilnem → prvi (wrap)", d.activeElement === t1 && a1 === t3,
    "prev=" + (a1 && a1.id) + " zdaj=" + (d.activeElement && d.activeElement.id));

  // 3b) ob prvem, Shift+Tab → zadnji (wrap)
  t1.focus();
  fireTab(true);
  check("SHIFT+TAB ob prvem fokusabilnem → zadnji (wrap)", d.activeElement === t3,
    "zdaj=" + (d.activeElement && d.activeElement.id));

  // 3c) SREDINA: Tab ne sme premakniti fokusa (trap lovi samo meji; jsdom ni nativnega tabanja)
  t2.focus();
  const mid = d.activeElement;
  fireTab(false);
  check("TAB na sredinskem fokusabilnem NE premakne fokusa (trap lovi samo meji)", d.activeElement === mid,
    "zdaj=" + (d.activeElement && d.activeElement.id));

  // 3d) NEGATIVNO: brez odprtega modala trap NE ukrepa (privzeti Tab ostane privzeti; fokus ni prisiljen)
  so.classList.remove("on");
  t1.focus();
  const noModal = d.activeElement;
  fireTab(false);
  check("BREZ odprtega modala: trap ne posreduje Tab (fokus ostane, ni prisila)", d.activeElement === noModal,
    "prev=" + (noModal && noModal.id) + " zdaj=" + (d.activeElement && d.activeElement.id));
} else {
  check("sintetični dialog: zadostno fokusabilnih (≥3)", false, "n=" + sItems.length);
}
so.remove();

/* ---------- 4) statiko: focus-trap IIFE + vsi dialogi znotraj overlaya ---------- */
check("HTML vsebuje focus-trap IIFE (fwFocusTrap + topOpenDialog)",
  /fwFocusTrap/.test(html) && /topOpenDialog/.test(html) && /keydown/.test(html));
const dialogs = html.match(/role="dialog" aria-modal="true"/g) || [];
check("vsak aria-modal dialog je znotraj overlaya (class vsebuje 'overlay')",
  (function () {
    const dlgEls = Array.from(d.querySelectorAll('[role="dialog"][aria-modal="true"]'));
    if (!dlgEls.length) return true;
    return dlgEls.every((el) => {
      const ov = el.closest('[class*="overlay"]') || el.parentElement;
      return ov && ov.classList && /overlay/.test(ov.className);
    });
  })(),
  "aria-modal dialogov=" + dialogs.length);

/* ---------- 5) nobenih JS napak ---------- */
check("jsdom: aplikacija se naloži brez JS napak", jerr.length === 0, jerr.join(" | "));

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${fail ? " — " + errors.join("; ") : ""}`);
process.exit(fail ? 1 : 0);
