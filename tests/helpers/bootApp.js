/*
 * Draftwright — testni pomočnik za nalaganje aplikacije v jsdom.
 *
 * JSDOM (runScripts:"dangerously") izvaja SAMO inline <script> — zunanjih
 * <script src> ne nalaga. Po razbitju monolita zato tukaj zamenjamo oznake
 * <script src="js/..."> z inline <script> vsebino modulov (v dokumentnem
 * vrstnem redu), tako da testi tečejo ob popolnoma enaki semantiki kot prej
 * (klasične skripte, deljen globalni obseg).
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "tehnicka-risba-pro.html");

// Vrstni red modulov — identičen vrstnemu redu v HTML (tools/inline-scripts.js).
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

function appFileSource(file) {
  return fs.readFileSync(path.join(ROOT, "js", file), "utf8");
}

/**
 * Prebere tehnicka-risba-pro.html in vsako <script src="js/..."> oznako
 * nadomesti z inline <script> vsebino tistega modula.
 * Izjeme (vendor <script src>, tema v head, CSS, HTML) ostanejo nespremenjene.
 */
function loadAppHtml() {
  let html = fs.readFileSync(HTML_PATH, "utf8");
  for (const file of APP_FILES) {
    const tag = `<script src="js/${file}"></script>`;
    if (!html.includes(tag)) {
      throw new Error(`Manjka oznaka ${tag} v HTML — preveri vrstni red modulov`);
    }
    html = html.replace(tag, `<script>\n${appFileSource(file)}\n</script>`);
  }
  return html;
}

module.exports = { loadAppHtml, APP_FILES, appFileSource };
