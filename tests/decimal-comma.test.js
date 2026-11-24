/**
 * Issue #41 §3.A — Geometrija in matematika: lokalizacijsko varno številsko razlago
 * (decimalna VEJICA) pri merah in kalibracijskih referencah.
 *
 * Pregled #41 §3.A izrecno navaja »decimalno vejico« med robnimi primeri. V slovenski
 * lokalizaciji je decimalni ločilec VEJICA, a aplikacija je polja razlagovala s
 * `parseFloat` — »3,8« je tiho okrnjeno v 3, »3800,5« v 3800 (napačno merilo = napačna
 * risba, BOM, reznica in predračun). Ta surov zaklene popravek `numParse`:
 *   - decimalna vejica ("3,8" → 3.8) in ASCII pika ("3.8" → 3.8),
 *   - cela in negativna ("42", "-1,5"),
 *   - smeti/NaN/Infinity → klicatelj dobi privzeto vrednost (n() → 0),
 *   - »3.000,5« (tisoči + decimalno) pravilno razlago kot decimalno (vejica = dec.),
 * in dokaza, da so `n()`, `refA`, `refB` dejansko posameznjenih prek `numParse`
 * (ne `parseFloat`). Na stari kodi (parseFloat) bi PADO — zato je pravilna ovira.
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
    w.HTMLCanvasElement.prototype.getContext = () => ({ drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } });
    w.URL.revokeObjectURL = () => {};
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
const numParse = window.numParse, n = window.n;

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function near(a, b, tol) { return Math.abs(a - b) <= tol; }

(async () => {
  check("window.numParse / n javno dostopno (testni izvozi)", typeof numParse === "function" && typeof n === "function");

  /* ---- 1) numParse: decimalna vejica (slovenska lokalizacija) ---- */
  check("numParse('3,8') = 3.8 (vejica = decimalna)", near(numParse("3,8"), 3.8, 1e-9), "got=" + numParse("3,8"));
  check("numParse('3800,5') = 3800.5", near(numParse("3800,5"), 3800.5, 1e-9), "got=" + numParse("3800,5"));
  check("numParse('0,5') = 0.5", near(numParse("0,5"), 0.5, 1e-9));
  check("numParse('-1,5') = -1.5", near(numParse("-1,5"), -1.5, 1e-9));
  check("numParse('20,25') = 20.25", near(numParse("20,25"), 20.25, 1e-9));

  /* ---- 2) numParse: ASCII pika ostane podprta (ni regresija) ---- */
  check("numParse('3.8') = 3.8 (ASCII pika)", near(numParse("3.8"), 3.8, 1e-9));
  check("numParse('42') = 42 (cela)", near(numParse("42"), 42, 1e-9));
  check("numParse('12') = 12", near(numParse("12"), 12, 1e-9));

  /* ---- 3) numParse: tisoči-pika + decimalna vejica ('3.000,5') = 3000.5 ---- */
  // Slovenska lokalizacija: pika = tisoči, vejica = dec. "3.000,5" = 3000,5.
  check("numParse('3.000,5') = 3000.5 (pika tisoči, vejica dec.)", near(numParse("3.000,5"), 3000.5, 1e-9), "got=" + numParse("3.000,5"));
  check("numParse('1.500') = 1500 (tisoči-pika, brez dec.)", near(numParse("1.500"), 1500, 1e-9), "got=" + numParse("1.500"));

  /* ---- 4) numParse: robni primeri (smeti / prazno / obsežni) ---- */
  check("numParse('abc') = NaN (neštevilčno → klicatelj določi privzeto)", Number.isNaN(numParse("abc")));
  check("numParse('') = NaN (prazno)", Number.isNaN(numParse("")));
  check("numParse('  42  ') = 42 (odstriga prostore)", near(numParse("  42  "), 42, 1e-9));

  /* ---- 5) n(): dejansko posameznjena prek numParse (behavioral) ----
     Opomba: jsdom razčisti number-inpute (odstrani vejico → ""), zato se DEJANSKA
     vejica preverja prek PROSTEGA besedilnega polja #stockLen, ki drži vejico;
     pika/cela/NaN/Infinity pa prek number-inputa #L (ASCII je varno). */
  const stock = window.document.getElementById("stockLen"); // <input> brez type → text
  check("#stockLen je prosto besedilno polje (drži vejico)", stock.tagName === "INPUT" && (stock.getAttribute("type") || "text") === "text");
  stock.value = "3800,5";
  check("n('stockLen'): vnos '3800,5' → 3800.5 (n() → numParse, dejanska vejica)", near(n("stockLen"), 3800.5, 1e-9), "got=" + n("stockLen"));
  stock.value = "4000,5";
  check("n('stockLen'): vnos '4000,5' → 4000.5 (druga decimalna vejica)", near(n("stockLen"), 4000.5, 1e-9), "got=" + n("stockLen"));

  const Lel = window.document.getElementById("L"); // number input
  Lel.value = "3.8";
  check("n('L'): vnos '3.8' → 3.8 (ASCII pika, ni regresija)", near(n("L"), 3.8, 1e-9), "got=" + n("L"));
  Lel.value = "42";
  check("n('L'): vnos '42' → 42", near(n("L"), 42, 1e-9));
  Lel.value = "abc";
  check("n('L'): vnos 'abc' → 0 (privzeto, ni NaN napake)", n("L") === 0, "got=" + n("L"));
  Lel.value = "1e999";
  check("n('L'): vnos '1e999' (Infinity) → 0 (isFinite varno, brez tihega +∞)", n("L") === 0, "got=" + n("L"));
  Lel.value = "3800"; // povrh privzeto stanje

  /* ---- 6) statično: referenčna polja refA/refB + n() posameznjena prek numParse ---- */
  const src = html;
  check("n() ne razlaga več s raw parseFloat(V(id)) (uporabi numParse)", /function n\(id\)\{var x=numParse\(V\(id\)\)/.test(src), "n() vsebuje numParse");
  check("refA posameznjena prek numParse", /numParse\(V\("refA"\)\)/.test(src));
  check("refB posameznjena prek numParse", /numParse\(V\("refB"\)\)/.test(src));
  // nobena referenca več raw parseFloat(V("refX"))
  check("brez ostanka raw parseFloat(V(\"refA|refB\"))", !/parseFloat\(V\("ref[AB]"\)\)/.test(src));

  check("ni JS napak", errors.length === 0, errors.join(" | "));
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("test throw:", e && e.stack || e); process.exit(1); });
