/**
 * Strukturni testi razbitja monolita — poganja `npm test`.
 * Preverjajo, da:
 *   (1) vsak modul iz APP_FILES obstaja v js/,
 *   (2) je vrstni red <script src="js/..."> v HTML identičen APP_FILES,
 *   (3) vendored <script src="vendor/..."> oznake ostanejo nespremenjene,
 *   (4) sw.js predpomnilniči VSE module z SW_VERSION "3",
 *   (5) loadAppHtml() nadomesti vsako modulno oznako z inline kodo
 *       (testi tečejo ob enaki semantiki kot prej).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { loadAppHtml, APP_FILES, appFileSource } = require("./helpers/bootApp");

const root = path.join(__dirname, "..");

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");
const sw = fs.existsSync(path.join(root, "sw.js")) ? fs.readFileSync(path.join(root, "sw.js"), "utf8") : "";

/* (1) obstoj modulov */
check("moduli: vseh 17 datotek obstaja v js/", APP_FILES.every((f) => fs.existsSync(path.join(root, "js", f))), APP_FILES.length + " datotek");

/* (2) vrstni red v HTML */
const htmlTags = [];
const tagRe = /<script src="js\/([^"]+)"><\/script>/g;
let m;
while ((m = tagRe.exec(html))) htmlTags.push(m[1]);
check("HTML: <script src=\"js/...\"> v enakem vrstnem redu kot APP_FILES", JSON.stringify(htmlTags) === JSON.stringify(APP_FILES), htmlTags.length + " oznak");

/* (3) vendored oznake */
check("HTML: vendor skripti ohranjeni", html.includes('<script src="vendor/jspdf.umd.min.js" defer></script>') && html.includes('<script src="vendor/svg2pdf.umd.min.js" defer></script>'));

/* (4) sw.js — predpomnilnik in različica */
check("sw.js: SW_VERSION = 3", /var SW_VERSION = "3";/.test(sw));
check("sw.js: predpomnilnik vseh modulov", APP_FILES.every((f) => sw.includes('"./js/' + f + '"')), APP_FILES.length + " modulov");

/* (5) loadAppHtml() inline nadomestitev */
const inlined = loadAppHtml();
check("loadAppHtml(): brez zunanjih js/ oznak", !/<script src="js\//.test(inlined));
check("loadAppHtml(): vsak modul inline v dokumentnem vrstnem redu", APP_FILES.every((f) => inlined.includes(appFileSource(f).split("\n")[3] || appFileSource(f).slice(0, 40))));
check("loadAppHtml(): inline tema v head ohranjena", inlined.includes("data-theme"));
check("loadAppHtml(): vendored <script src> ohranjeni", inlined.includes('<script src="vendor/jspdf.umd.min.js" defer></script>') && inlined.includes('<script src="vendor/svg2pdf.umd.min.js" defer></script>'));

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
