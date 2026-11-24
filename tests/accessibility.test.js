/**
 * Issue #41 §3.E — UX, dostopnost in združljivost: razumljiva dostopnost (WCAG 4.1.2 "Name").
 *
 * Ugotovljeni in popravljeni §3.E pomanjkljivosti:
 *   1) #calStatus — glavni kanal povratne informacije (st(): "Umeritev uspešna", opozorila
 *      detekcije, potrjevanja) NI bil aria-live → zaslonski bralnik glavnih sporočil ni slišal.
 *      Popravek: role="status" + aria-live="polite" (uskladitvo s #globalStatus/#errTray/#toastZone).
 *   2) 5 polj BREZ dostopnega imena (aria-label/label for): #file, #rho, #prjName, #refMode, #loadFile.
 *      Popravek: dodan aria-label (slovenski, v skladu z lokalizacijo).
 *   3) #applySuggestedProf (JS-generated gumb) je bil prazen → ni imel dostopnega imena, ko ni bil
 *      prikazan. Popravek: title (title NE prevlada dinamičnega textContent; služi le kot privzeti
 *      dostopni imenovalnik).
 *
 * Poleg posebnih popravkov ta surov izvede CELOTEN sweep: vsak VIDEN interaktiven element
 * (button/input/select/[role=button]) — razen tistih pod aria-hidden pradedkom (skriti .hooks) —
 * mora imeti dostopno ime (aria-label / title / besedilo / obdajajoč label / label[for] /
 * aria-labelledby). Brez imena → FAIL. Na stari kodi bi PADO (6+ manjkajočih imen).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = () => ({ drawImage() {}, getImageData(x, y, WW, H) { return { data: new Uint8ClampedArray(WW * H * 4) }; } });
    w.URL.revokeObjectURL = () => {};
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* ---- helper: accessible name + hidden-ancestor skip ---- */
function accName(el) {
  const al = el.getAttribute("aria-label"); if (al && al.trim()) return al;
  const t = el.getAttribute("title"); if (t && t.trim()) return "title:" + t;
  const txt = (el.textContent || "").trim(); if (txt) return txt.slice(0, 40);
  let p = el.parentElement; if (p && p.tagName === "LABEL") return "label:" + (p.textContent || "").trim().slice(0, 40);
  if (el.id && document.querySelector('label[for="' + el.id + '"]')) return "for:" + el.id;
  const lb = el.getAttribute("aria-labelledby");
  if (lb) { const r = document.getElementById(lb); if (r && r.textContent.trim()) return "lb:" + r.textContent.trim().slice(0, 30); }
  return null;
}
function hiddenAncestor(el) { let a = el; while (a) { if (a.getAttribute && a.getAttribute("aria-hidden") === "true") return true; a = a.parentElement; } return false; }

(async () => {
  /* ---- 1) #calStatus: glaven kanal povratne informacije mora biti oznanjen (aria-live) ---- */
  const cal = $("calStatus");
  check("#calStatus obstaja", !!cal);
  check("#calStatus aria-live (zasilje st()/dt() — merjenja, opozorila, potrjevanja)",
    !!cal && cal.getAttribute("aria-live") === "polite" && cal.getAttribute("role") === "status",
    "aria-live=" + (cal && cal.getAttribute("aria-live")) + " role=" + (cal && cal.getAttribute("role")));

  /* ---- 2) 5 polj brez imena → aria-label dodan ---- */
  const NAMED = [
    ["file", "Naloži fotografijo ograje"],
    ["rho", "Gostota materiala"],
    ["prjName", "Ime projekta"],
    ["refMode", "Referenčni način lista"],
    ["loadFile", "Odpri projekt"],
  ];
  for (const [id, expect] of NAMED) {
    const el = $(id);
    const al = el && el.getAttribute("aria-label") || "";
    check(`${id} ima dostopno ime (aria-label)`, el && al.length > 0, "aria-label=" + JSON.stringify(al));
  }

  /* ---- 3) #applySuggestedProf: JS gumb mora imeti privzeti dostopni imenovalnik (title) ---- */
  const sb = $("applySuggestedProf");
  check("#applySuggestedProf ima dostopno ime (title — ne prevlada dinamičnega textContent)",
    !!sb && !!sb.getAttribute("title"), "title=" + JSON.stringify(sb && sb.getAttribute("title")));

  /* ---- 4) CELOTEN sweep: noben VIDEN interaktiven element brez dostopnega imena ---- */
  const interactive = document.querySelectorAll('button, input, select, [role="button"]');
  const unnamed = [];
  let considered = 0;
  interactive.forEach((el) => {
    if (hiddenAncestor(el)) return; // skriti .hooks / aria-hidden → ni v dostopnem drevesu
    considered++;
    if (!accName(el)) {
      unnamed.push(el.tagName + (el.id ? " #" + el.id : "") + (el.tagName === "INPUT" && el.getAttribute("type") ? ("(" + el.getAttribute("type") + ")") : ""));
    }
  });
  check("sweep: vsak VIDEN interaktiven element ima dostopno ime", unnamed.length === 0,
    unnamed.length ? "brez imena (" + unnamed.length + "): " + unnamed.join(", ") : considered + " preverjeno, 0 brez imena");

  /* ---- 5) st() še vedno piše v #calStatus (ni regresija) + ni JS napak ---- */
  check("st() piše v #calStatus (regresijska preverba)", /function st\(t,k\)\{var e=\$\("calStatus"\)/.test(html));
  check("ni JS napak", errors.length === 0, errors.join(" | "));

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("test throw:", e && e.stack || e); process.exit(1); });
