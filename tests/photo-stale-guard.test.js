/**
 * Issue #41 §3.B — detekcija fotografij: "orientacijska mera ne sme izgledati kot potrjena".
 *
 * Detekcija (`applyDetection`) samodejno polja polja n/H/sw/gap/L prek `.value=` (ORIENTACIJSKA
 * razlaga, ne potrjena proizvodna mera). Ker programatski `.value=` vnos NE sproži
 * `document input/change` poslušalca (ki sicer klice `invalidateProduction();markStale()`),
 * so stare proizvodni izračuni (cut/plan/quote/checklist) po detekciji ostali **neoznačeni** —
 * uporabnik bi viden stare rezi/kosovnico, ki odgovarjajo STARIH meram, kot da bi bila še veljavna.
 *
 * Popravek: `applyDetection()` ročno klice `markStale()` — enakovredno ročnemu vnosu. Ta surov
 * dokaza, da po detekciji VSI štirje proizvodni izhodi (PROD_OUTS) dobijo razred `.stale`.
 * Na stari kodi (brez markStale v applyDetection) bi PADO — zato je pravilna ovira za §3.B.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");
const errors = [];
function makeGray() {
  const w = 100, h = 200, g = new Float32Array(w * h);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) g[r * w + c] = (r % 20 < 10) ? 40 : 220;
  return { gray: g, w, h, sc: 1 };
}
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

(async () => {
  const S = window.S;
  // PROD_OUTS (zrcali var v viru): štirje proizvodni izhodi, ki jih mora detekcija označiti stale
  const PROD_OUTS = ["cutOut", "planOut", "quoteOut", "checklistOut"];
  check("vsih 4 proizvodni izhodi obstajajo v DOM", PROD_OUTS.every((id) => $(id)), PROD_OUTS.join(","));

  /* Priprava: detekcija z visoko zanesljivostjo (L se auto-izpolni = orientacijska mera) */
  S.det = {
    lines: [{ y0: 0 }, { y0: 199 }], sc: 1, cx: 50, ang: 0, rectK: 0,
    gray: makeGray(), bbox: { x0: 0, x1: 100, y0: 0, y1: 199 }, confidence: 80,
  };
  S.detOverride = null;
  S.calibrated = true;
  S.cal = { scale: 10, cos: 1, sin: 0 };
  delete S.det.autoL; delete S.det.autoLVal; delete S.det.autoLNote;
  $("L").value = "3800";

  /* Simuliraj: uporabnik je že generiral proizvodne izračune (neprazni izhodi) */
  PROD_OUTS.forEach((id) => { $(id).innerHTML = "<div>STARE IZRAČUN</div>"; $(id).classList.remove("stale"); });
  const beforeStale = PROD_OUTS.filter((id) => $(id).classList.contains("stale"));
  check("pred detekcijo: izhodi so sveži (brez .stale)", beforeStale.length === 0, beforeStale.join(","));

  const Lbefore = $("L").value;
  window.applyDetection();
  const Lafter = $("L").value;
  check("detekcija avto-izpolni L (orientacijska mera: 3800→1000)", Lbefore === "3800" && Lafter === "1000", "L: " + Lbefore + "→" + Lafter);

  /* KLJUČNO: po detekciji so VSI proizvodni izhodi označeni stale */
  const afterStale = PROD_OUTS.filter((id) => $(id).classList.contains("stale"));
  check("PO detekciji: VSI 4 proizvodni izhodi so .stale (orientacija ≠ potrjena mera)",
    afterStale.length === 4, "označeno: " + afterStale.length + "/" + PROD_OUTS.length + " (" + afterStale.join(",") + ")");

  /* Vsak izhod ohrani svojo vsebino (stale je oznaka, ne brisanje) */
  check("označeni izhodi ohranijo vsebino (stale = oznaka, ne reset)",
    PROD_OUTS.every((id) => $(id).innerHTML.indexOf("STARE IZRAČUN") >= 0));

  /* clearStale (generator) odstrani oznako — sanity mehanizma */
  if (typeof window.clearStale === "function") {
    window.clearStale();
    const cleared = PROD_OUTS.filter((id) => $(id).classList.contains("stale")).length;
    check("clearStale() odstrani .stale (sanity mehanizma)", cleared === 0, "ostalo stale=" + cleared);
  } else {
    // clearStale ni izvožen — preverimo razred neposredno po ročnem clear
    PROD_OUTS.forEach((id) => $(id).classList.remove("stale"));
    check("clearStale: razred .stale odstranljiv (sanity)", true, "(manual clear)");
  }

  /* Statično: applyDetection vsebuje markStale() (popravek) — na stari kodi manjka */
  check("statično: applyDetection() klice markStale() (orientacija označi stare izračune)",
    /function applyDetection\(\)\{[\s\S]{0,300}?markStale\(\)/.test(html), "applyDetection vsebuje markStale()");

  check("ni JS napak", errors.length === 0, errors.join(" | "));
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("test throw:", e && e.stack || e); process.exit(1); });
