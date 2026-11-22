/*
 * Draftwright — avtomatski popravek testnih datotek po razbitju monolita:
 *  (1) doda require("./helpers/bootApp") za require("jsdom"),
 *  (2) zamenja branje HTML (fs.readFileSync(...tehnicka-risba-pro.html...))
 *      z loadAppHtml() (vključno z viewHtml v projects.test.js).
 *
 * Uporaba: node tools/patch-tests.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

const TESTS = path.join(__dirname, "..", "tests");
const FILES = fs.readdirSync(TESTS).filter((f) => f.endsWith(".test.js"));

const HTML_READ = /(const|var)\s+(html|viewHtml)\s*=\s*fs\.readFileSync\([^)]*tehnicka-risba-pro\.html[^)]*\),\s*"utf8"\);?/;
const HELP_REQ = "const { loadAppHtml } = require(\".helpers/bootApp\");";

let patchedFiles = 0;
for (const file of FILES) {
  const p = path.join(TESTS, file);
  let src = fs.readFileSync(p, "utf8");
  const orig = src;

  // (2) zamenjaj branje HTML
  src = src.replace(HTML_READ, (_m, kw, name) => `${kw} ${name} = loadAppHtml();`);

  // (1) vstavi require za vrstico z require("jsdom")
  if (!src.includes(HELP_REQ)) {
    const jsdomLine = /^[^\n]*require\(["']jsdom["']\)[^\n]*$/m;
    if (!jsdomLine.test(src)) {
      console.error(`NAPAKA: v ${file} ni require("jsdom")`);
      process.exit(1);
    }
    src = src.replace(jsdomLine, (m) => `${m}\n${HELP_REQ}`);
  }

  if (src !== orig) {
    fs.writeFileSync(p, src, "utf8");
    patchedFiles++;
    console.log(`popravljen ${file}`);
  }
}
console.log(`OK: ${patchedFiles}/${FILES.length} testnih datotek popravljenih.`);
