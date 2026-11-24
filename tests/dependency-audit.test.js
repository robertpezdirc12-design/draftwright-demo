/**
 * Issue #41 §2 — odvisnosti: avdit in regresijska ovira za odvisnostno higieno.
 *
 * Draftwright je **zero-install PWA**: aplikacija v brskalniku se naloži brez
 * kateregakoli runtime omrežnega odvisnosti/zunanjega API-ja/backenda. Vse
 * devDependencies so izključno za TEST/CI (jsdom, canvas, neodvisne validatorje).
 * Ta surov uječe:
 *   - da `dependencies` prazno ostane (brez runtime omrežnih odvisnosti),
 *   - da nobena devDependency ni neuporabljena (4 se dejansko require-vajo v testih,
 *     3 pa so verzionični "pin" za brskalnisko naložene vendor UMD pakete),
 *   - da ni mrtve teže v vendor/ (Roboto-Regular.ttf "404: Not Found" izbrisan),
 *   - da prava pisava (LiberationSans) ostane prisotna in referenca.
 * Vsaka regresija (npr. spet namestitev mrtve pisave ali nova runtime odvisnost) PADO —
 * zato je pravilna ovira za §2.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const pkg = JSON.parse(read("package.json"));
const html = read("tehnicka-risba-pro.html");
const sw = read("sw.js");

let pass = 0, fail = 0, errors = [];
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* ============ 1) zero-install PWA: nobene runtime omrežne odvisnosti ============ */
check("package.json: 'dependencies' prazen (brez runtime omrežnih odvisnosti)",
  Object.keys(pkg.dependencies || {}).length === 0,
  JSON.stringify(Object.keys(pkg.dependencies || {})));

const devDeps = pkg.devDependencies || {};
const EXPECTED_DEV = [
  "@napi-rs/canvas", "dxf-parser", "jsdom", "jspdf", "maxrects-packer", "qrcode-generator", "svg2pdf.js"
];
check("package.json: vse 7 devDependencies prisotne (izključno test/CI)",
  EXPECTED_DEV.every((d) => devDeps[d]),
  "manjka: " + EXPECTED_DEV.filter((d) => !devDeps[d]).join(", "));

/* ============ 2) nobena devDependency neuporabljena ============ */
// (a) 4 se dejansko require-vajo v testih → dokaz uporabe.
const allTests = fs.readdirSync(path.join(root, "tests"))
  .filter((f) => f.endsWith(".test.js"))
  .map((f) => read("tests/" + f))
  .join("\n");
const REQUIRED_IN_TESTS = {
  "@napi-rs/canvas": "tests/fixtures/slats.js + photo-variety/profile-ai",
  "dxf-parser": "tests/dxf-parser.test.js",
  "jsdom": "vsaki jsdom surov",
  "maxrects-packer": "tests/cut-optimizer-ab.test.js"
};
check("dev: @napi-rs/canvas zahtevan v testih", /require\(["']@napi-rs\/canvas["']\)/.test(allTests));
check("dev: dxf-parser zahtevan v testih", /require\(["']dxf-parser["']\)/.test(allTests));
check("dev: jsdom zahtevan v testih", /require\(["']jsdom["']\)/.test(allTests));
check("dev: maxrects-packer zahtevan v testih", /require\(["']maxrects-packer["']\)/.test(allTests));

// (b) 3 so verzionični PIN za brskalnisko naložene vendor UMD pakete (jsdom testih eval
//     bralne vendor datoteke, ne Node pakete). Vsak ustreza prisotni vendor/ datoteki.
//     SRI (Issue #41 sled): vsak vendor skript nosi integrity="sha384-…" — tukaj
//     preverimo SAMO prisotnost SRI atribute (avtoritativni pin 71-znak hash-a je v
//     tests/sri.test.js, kjer se recomputira iz datoteke na disku).
// Vsak vendor skript nosi SRI (integrity="sha384-…"). Avtoritativni pin hash-a
// (recomputed iz datoteke) je v tests/sri.test.js — tukaj preverimo le prisotnost
// SRI atribute na pravilnem skriptu, brez regex/escaping zapletosti.
const VENDOR_PIN = [
  { dep: "jspdf", file: "vendor/jspdf.umd.min.js", tag: '<script src="vendor/jspdf.umd.min.js" defer integrity="sha384-' },
  { dep: "svg2pdf.js", file: "vendor/svg2pdf.umd.min.js", tag: '<script src="vendor/svg2pdf.umd.min.js" defer integrity="sha384-' },
  { dep: "qrcode-generator", file: "vendor/qr-core.js", tag: '<script src="vendor/qr-core.js" defer integrity="sha384-' }
];
for (const v of VENDOR_PIN) {
  const exists = fs.existsSync(path.join(root, v.file));
  const size = exists ? fs.statSync(path.join(root, v.file)).size : 0;
  check("dev: " + v.dep + " pin → " + v.file + " prisoten >10 kB",
    exists && size > 10000, "size=" + size);
  check("HTML naloži " + v.file + " (SRI)", html.includes(v.tag));
}

/* ============ 3) nobenih mrtve teže v vendor/ ============ */
const vendorFiles = fs.existsSync(path.join(root, "vendor")) ? fs.readdirSync(path.join(root, "vendor")) : [];
check("vendor/: Roboto-Regular.ttf (14 B '404: Not Found') izbrisan",
  !vendorFiles.includes("Roboto-Regular.ttf"), "se vedno prisotna: " + vendorFiles.join(", "));
// noben referenco Roboto v kodi/konfiguraciji
check("nobena referenco 'Roboto' v HTML/SW/vercel/print.css",
  !/Roboto/.test(html) && !/Roboto/.test(sw) &&
  !/Roboto/.test(read("print.css")) && !/Roboto/.test(read("vercel.json")));

/* ============ 4) prava pisava ostane prisotna in referenca ============ */
const ttf = path.join(root, "vendor", "LiberationSans-Regular.ttf");
const ttfBuf = fs.existsSync(ttf) ? fs.readFileSync(ttf) : Buffer.alloc(0);
check("vendor: LiberationSans-Regular.ttf prisotna (TTF magic 00 01 00 00, >100 kB)",
  ttfBuf.length > 100000 && ttfBuf.slice(0, 4).equals(Buffer.from([0x00, 0x01, 0x00, 0x00])),
  "size=" + ttfBuf.length);
check("SW predpomni LiberationSans (offline PDF pisava)", sw.includes('"./vendor/LiberationSans-Regular.ttf"'));

/* ============ 5) runtime: aplikacija se naloži brez JS napak (izbris Roboto nima učinka) ============ */
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; }, fillRect() {}, measureText(t){return {width:t.length}} };
    };
    window.URL.createObjectURL = () => "blob:mem";
    window.URL.revokeObjectURL = () => {};
  }
});
const jerr = [];
dom.window.addEventListener("error", (e) => jerr.push(String(e.error || e.message || e)));
try { dom.window.eval(""); } catch (e) { jerr.push(String(e)); }
check("jsdom: aplikacija se naloži brez JS napak", jerr.length === 0, jerr.join(" | "));

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
