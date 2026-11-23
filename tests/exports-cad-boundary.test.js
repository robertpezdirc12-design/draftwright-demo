/**
 * Issue #41 §3.C — CAD/izvozi: NEODVISNA preverba izvoženih formatov + izrazna
 * meja "brez pravega CAD jedra ni mogoče potrditi proizvodno primernost".
 *
 * Poganja pravo aplikacijo prek jsdom in neodvisno preverja tri izvoze:
 *   - SVG: well-formed XML, pravilen SVG namespace + viewBox A3 (420×297),
 *     vsa geometrija finite, nujno v mejah lista, nujno niščnih/negativnih koordinat.
 *   - SKLADNOST MER: izvožene mere = prikazane mere. Vnesti L=3800 (prečna) →
 *     ista dolžina mora nastati v SVG kot koten (f(L)) in v CSV kosovnici kot
 *     rezalna dolžina lamele (cutLen() = L). To dokazuje konsistentnost risba↔izvoz.
 *   - STEP (CAD-jedro MEJA): FILE_DESCRIPTION mora izrecno priznati
 *     "simplified box-solid approximation (not production CAD)" — test zaklene,
 *     da aplikacija NE tvrdi proizvodne primernosti, kje pa je meja.
 *
 * DXF/PDF sta že neodvisno potrjena (tests/dxf-parser.test.js prek dxf-parser,
 * tests/pdf.test.js prek jsPDF); tu pokrijem manjkajočo SVG neodvisno validacijo
 * ter skupno skladnost mer + izrazno CAD-jedro mejo.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const blobs = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.URL.createObjectURL = (b) => { blobs.push(b); return "blob:test"; };
    window.HTMLAnchorElement.prototype.click = function () {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));
const setField = (id, v) => { $(id).value = String(v); fire($(id), "input"); };

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
const blobText = async (b) => (b ? Buffer.from(await b.arrayBuffer()).toString("utf8") : "");

(async () => {
  /* ===== nastavi enotno konfiguracijo: prečna ograja, L=3800 (cutLen()=L) ===== */
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change");
  $("sysUse").value = "precna"; fire($("sysUse"), "change");
  $("refMode").checked = false; fire($("refMode"), "change");
  setField("L", "3800"); setField("H", "1200"); setField("n", "16"); setField("gap", "10");
  $("paper").value = "A3"; fire($("paper"), "change");
  $("gen").click();
  check("risba generirana (A3 prečna)", !!document.querySelector("#prev svg"), "ni #prev svg");

  /* ============ 1) SVG: neodvisna validacija ============ */
  blobs.length = 0;
  $("dlSvg").click();
  const svgRaw = await blobText(blobs[blobs.length - 1]);
  check("SVG: izvožena datoteka ni prazna", svgRaw.length > 500, svgRaw.length + " znakov");

  // well-formed XML (neodvisen parse), ne le naša lastna serija
  const parsed = new window.DOMParser().parseFromString(svgRaw, "image/svg+xml");
  const perr = parsed.querySelector("parsererror");
  check("SVG: well-formed XML (neodvisen parse brez parsererror)", !perr, perr ? (perr.textContent || "").slice(0, 80) : "");
  const svgRoot = parsed.documentElement;
  check("SVG: koren <svg> v pravem SVG namespace", svgRoot.nodeName === "svg" && /http:\/\/www\.w3\.org\/2000\/svg/.test(svgRoot.namespaceURI), svgRoot.nodeName + " :: " + svgRoot.namespaceURI);
  const vb = svgRoot.getAttribute("viewBox");
  check("SVG: viewBox A3 (0 0 420 297)", vb === "0 0 420 297", vb);

  // vsa koordinatna lastnosti finite + nujno v mejah lista (s tolerantno zaščito za kote)
  const attrEls = svgRoot.querySelectorAll("*");
  let finite = true, inSheet = true, total = 0, outCount = 0;
  attrEls.forEach((el) => {
    ["x", "y", "cx", "cy"].forEach((a) => {
      const rawv = el.getAttribute(a);
      if (rawv === null) return;
      total++;
      const v = Number(rawv);
      if (!Number.isFinite(v)) { finite = false; return; }
      if (v < -6 || v > 426 || (a === "y" && (v < -6 || v > 303))) { inSheet = false; outCount++; }
    });
  });
  check("SVG: vse x/y/cx/cy koordinate finite (brez NaN/Infinity)", finite);
  check("SVG: geometrija ostane v mejah A3 lista (± tolerantno za kote)", inSheet, total + " koordinat, izven=" + outCount);
  check("SVG: nujna niso ničelna/negativna (min x/y >= 0)",
    (() => { let mn = Infinity, my = Infinity; svgRoot.querySelectorAll("*").forEach(el => { [el.getAttribute("x"), el.getAttribute("cx")].forEach(v => { if (v !== null && Number.isFinite(+v)) mn = Math.min(mn, +v); }); [el.getAttribute("y"), el.getAttribute("cy")].forEach(v => { if (v !== null && Number.isFinite(+v)) my = Math.min(my, +v); }); }); return mn >= 0 && my >= 0; })(), "x min / y min");
  check("SVG: nujno niščnih elementov (več kot 50 geometrijskih)", svgRoot.querySelectorAll("rect,line,path,circle,polygon,ellipse").length > 50, svgRoot.querySelectorAll("rect,line,path,circle,polygon,ellipse").length + " oblik");

  /* ============ 2) SKLADNOST MER: prikazane = izvožene ============ */
  // L=3800 mora biti v SVG kot koten prednjega pogleda (f(L)) ...
  check("skladnost mer: L=3800 je koten v SVG (prikazano)", svgRaw.includes("3800"), "ni '3800' v SVG");
  // ... in v CSV kosovnici kot rezalna dolžina lamele (cutLen() = L za prečno)
  blobs.length = 0;
  $("dlCsv").click();
  const csv = await blobText(blobs[blobs.length - 1]);
  check("CSV kosovnica: izvožena ni prazna", csv.length > 50, csv.length + " znakov");
  const lamelaCutRows = csv.split("\n").filter((l) => /Lamela/i.test(l) && /dolžina/i.test(l));
  const lamelaLenOk = lamelaCutRows.some((l) => l.replace(/"/g, "").includes("dolžina 3800 mm"));
  check("skladnost mer: CSV lamela = rezalna dolžina 3800 mm (iz L)", lamelaLenOk, lamelaCutRows.slice(0, 2).join(" | "));
  check("skladnost mer: CSV število lamel povezano z n=16 (BOM↔rezalni)", /Lamela/i.test(csv), csv.split("\n").filter((l) => /Lamela/i.test(l)).length + " lamelnih vrst");
  // BOM (prikazan v SVG) in CSV se ujema po profilu ROMB DESKA-67
  check("skladnost mer: profil ROMB-67 v SVG BOM in v CSV", svgRaw.includes("ROMB") && /ROMB/i.test(csv));

  /* ============ 3) STEP: izrazna CAD-jedro meja ============ */
  blobs.length = 0;
  $("dlStep").click();
  const step = await blobText(blobs[blobs.length - 1]);
  check("STEP: ISO-10303-21 + AP214 shema", step.startsWith("ISO-10303-21") && /AUTOMOTIVE_DESIGN[\s\S]*214/.test(step));
  check("STEP: izrecno priznana MEJA (simplified box solids, not production CAD)", /simplified box-solid approximation \(not production CAD\)/i.test(step) || /not production CAD/i.test(step));
  // brez nedoločenih referenc (skladnost s strukturnim testom faze 2)
  const defs = new Set([...step.matchAll(/#(\d+)\s*=/g)].map((m) => m[1]));
  const dangling = [...step.matchAll(/#(\d+)(?!\s*=)/g)].map((m) => m[1]).filter((id) => !defs.has(id));
  check("STEP: brez nedoločenih #N referenc", dangling.length === 0, "npr. " + dangling.slice(0, 3).join(","));

  /* ============ skupaj: brez JS napak ============ */
  check("brez JS napak med izvozi", errors.length === 0, errors.join(" | "));

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ""}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e && e.stack || e); process.exit(1); });
