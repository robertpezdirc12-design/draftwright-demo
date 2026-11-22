/*
 * Draftwright — zamenja veliki inline <script> v tehnicka-risba-pro.html
 * z oštevilčenimi <script src="js/..."> oznakami (klasične skripte, deljen globalni obseg).
 *
 * Uporaba: node tools/inline-scripts.js
 * Preveri: najde glavni inline skript (vzorec <script> → (function(){ → })(); → </script>),
 *          ga nadomesti z oznakami modulov iz mape js/ (vrstni red!),
 *          ohrani vse ostalo (CSS, HTML, vendor <script src>, inline temo v head).
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HTML = path.join(ROOT, "tehnicka-risba-pro.html");
const JSDIR = path.join(ROOT, "js");

// Vrstni red modulov — mora biti identičen vrstnemu redu v HTML in tests/helpers/bootApp.js
const APP_FILES = [
  "00-core.js",
  "01-input-calibration.js",
  "02-detection.js",
  "03-validation.js",
  "04-svg-lib.js",
  "05-sheets.js",
  "06-exports-dxf-step.js",
  "07-project.js",
  "08-roksal.js",
  "09-production.js",
  "10-pdf.js",
  "11-export-dialog.js",
  "12-tloris.js",
  "13-skica.js",
  "14-ui-fields.js",
  "15-ui-misc.js",
  "16-boot.js",
];

for (const f of APP_FILES) {
  const p = path.join(JSDIR, f);
  if (!fs.existsSync(p)) {
    console.error(`NAPAKA: modul ne obstaja: ${p}`);
    process.exit(1);
  }
}

const raw = fs.readFileSync(HTML, "utf8");
if (!raw.includes("\r\n")) {
  console.error("NAPAKA: datoteka ni v CRLF — preveri končnice");
  process.exit(1);
}
const lines = raw.split("\r\n");

// Najdi začetek glavnega inline skripta: <script> + prazna vrstica + (function(){
let start = -1;
for (let i = 0; i < lines.length - 2; i++) {
  if (lines[i] === "<script>" && lines[i + 1] === "" && lines[i + 2].startsWith("(function(){")) {
    start = i;
    break;
  }
}
if (start < 0) {
  console.error("NAPAKA: glavni inline <script> ni najden");
  process.exit(1);
}

// Najdi konec: </script> za vrstico })(); (z možno prazno vrstico vmes)
let end = -1;
for (let i = start + 1; i < lines.length; i++) {
  if (lines[i] === "</script>") {
    let k = i - 1;
    while (k > start && lines[k] === "") k--;
    if (lines[k] === "})();") {
      end = i;
      break;
    }
  }
}
if (end < 0) {
  console.error("NAPAKA: konec inline <script> ni najden");
  process.exit(1);
}

const block = [
  "<!-- Draftwright — JS moduli (razbitje monolita): naloženi v tem vrstnem redu; 16-boot.js zadnji. -->",
  ...APP_FILES.map((f) => `<script src="js/${f}"></script>`),
];

const outLines = [...lines.slice(0, start), ...block, ...lines.slice(end + 1)];
fs.writeFileSync(HTML, outLines.join("\r\n") + "\r\n", "utf8");
console.log(`OK: inline <script> (vrstice ${start + 1}–${end + 1}) zamenjan z ${APP_FILES.length} moduli.`);
