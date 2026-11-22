/*
 * Draftwright — razbitje monolita: izloči JS-odsek iz tehnicka-risba-pro.html
 * v oštevilčene modulne datoteke js/NN-ime.js (klasične skripte, deljen globalni obseg).
 *
 * Uporaba: node tools/split-modules.js
 * Preveri: (1) da vsota izločenih vrstic ustreza vsebini IIFE (814..4031),
 *          (2) da je v vsakem modulu natanko ena definicija »function dim« (po deduplikaciji),
 *          (3) sintakso vsakega modula (node --check).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const HTML = path.join(ROOT, "tehnicka-risba-pro.html");
const OUTDIR = path.join(ROOT, "js");

// Moduli: [ime, startVrstica, endVrstica] — vključno; številčenje 1-bazirano (kot sed).
const MODULES = [
  ["00-core", 814, 843],
  ["01-input-calibration", 845, 925],
  ["02-detection", 927, 1203],
  ["03-validation", 1205, 1261],
  ["04-svg-lib", 1263, 1288],
  ["05-sheets", 1289, 1752],
  ["06-exports-dxf-step", 1754, 1995],
  ["07-project", 1996, 2040],
  ["08-roksal", 2041, 2193],
  ["09-production", 2195, 2756],
  ["10-pdf", 2758, 2796],
  ["11-export-dialog", 2797, 3075],
  ["12-tloris", 3077, 3154],
  ["13-skica", 3156, 3336],
  ["14-ui-fields", 3338, 3615],
  ["15-ui-misc", 3617, 4024],
  ["16-boot", 4026, 4031],
];

// Normalizacija CRLF → LF (datoteka ima Windows končnice vrstic)
const lines = fs.readFileSync(HTML, "utf8").replace(/\r\n/g, "\n").split("\n");

// Vsebina IIFE: vrstice 814..4031 (vrstica 813 = "use strict", 812 = (function(){, 4032 = })();)
// Odštejemo 13 namerno izpuščenih praznih vrstic (SKIP_BLANKS).
const EXPECT_TOTAL = 4031 - 814 + 1 - 13; // 3205

// Prazne vrstice, ki jih namerno izpustimo (ločila med moduli)
const SKIP_BLANKS = new Set([844, 846, 926, 1204, 1262, 1753, 2194, 2757, 3076, 3155, 3337, 3616, 4025]);

let extracted = 0;
const modules = MODULES.map(([name, a, b]) => {
  const chunk = [];
  for (let i = a; i <= b; i++) {
    if (SKIP_BLANKS.has(i)) continue;
    chunk.push(lines[i - 1]); // indeks 0-baziran
  }
  extracted += chunk.length;
  return { name, chunk };
});

if (extracted !== EXPECT_TOTAL) {
  console.error(`NAPAKA: izločeno ${extracted} vrstic, pričakovano ${EXPECT_TOTAL}`);
  process.exit(1);
}

// Deduplikacija: v 06-exports-dxf-step.js naj bo samo še GLOBALNA dim() (v 00-core).
const dimDecl = /^\s*function dim\(str,fallback\)\{/;
let dimRemoved = 0;
const core = modules.find((m) => m.name === "00-core").chunk;
const coreNumOf = "function numOf(x,d){var y=pnum(x,d);return isFinite(y)?y:(d||0)}";
const coreNumOfNew = "function numOf(x,d){return pnum(x,d)}";

if (!core.includes(coreNumOf)) {
  console.error("NAPAKA: pričakovana definicija numOf ni najdena v 00-core");
  process.exit(1);
}

for (const m of modules) {
  if (m.name === "00-core") {
    m.chunk = m.chunk.map((l) => (l === coreNumOf ? coreNumOfNew : l));
    continue;
  }
  const kept = [];
  for (const l of m.chunk) {
    if (dimDecl.test(l)) {
      dimRemoved++;
      continue; // izpusti podvojeno nested dim() (v stepString)
    }
    kept.push(l);
  }
  m.chunk = kept;
}
if (dimRemoved !== 1) {
  console.error(`NAPAKA: odstranjenih ${dimRemoved} podvojenih dim() — pričakovano 1`);
  process.exit(1);
}

// Zapiši module
fs.mkdirSync(OUTDIR, { recursive: true });
for (const { name, chunk } of modules) {
  const out = path.join(OUTDIR, name + ".js");
  const header = [
    `// Draftwright — modul ${name} (izločeno iz tehnicka-risba-pro.html; razbitje monolita)`,
    `// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.`,
    `"use strict";`,
    ``,
  ].join("\n");
  fs.writeFileSync(out, header + chunk.join("\n") + "\n", "utf8");
  console.log(`zapisano ${path.relative(ROOT, out)} (${chunk.length} vrstic)`);
}

// Sintaktično preverjanje
let ok = true;
for (const { name } of modules) {
  const out = path.join(OUTDIR, name + ".js");
  try {
    execFileSync(process.execPath, ["--check", out], { stdio: "pipe" });
  } catch (e) {
    ok = false;
    console.error(`SINTAKSA ${name}: ${e.stderr.toString().trim()}`);
  }
}
if (!ok) process.exit(1);
console.log("OK: vseh " + modules.length + " modulov sintaktično pravilnih.");
