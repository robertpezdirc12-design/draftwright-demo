/**
 * Inline module synchronizer (zero-build).
 *
 * Source of truth for pure modules lives in js/*.js. The deployed app stays a
 * single self-contained HTML file (zero-install PWA) and the existing jsdom
 * suites load that HTML without resources:"usable" — so the modules are copied
 * into marked inline blocks instead of being referenced with <script src>.
 *
 * Run after ANY edit to js/*.js:  node scripts/sync-modules.js
 * CI fails on drift; tests/module-sync.test.js covers idempotence and repair.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const root = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, "..");
const htmlPath = path.join(root, "tehnicka-risba-pro.html");
const MODULES = ["js/core.js", "js/geometry.js", "js/dilatation.js", "js/csv.js"];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const markers = (file) => ({
  start: "/* >>> GENERATED: " + file + " — uredi izvorno datoteko, ne to kopijo */",
  end: "/* <<< END GENERATED: " + file + " */",
});

let html = fs.readFileSync(htmlPath, "utf8");
const original = html;
const summary = [];

for (const file of MODULES) {
  const sourcePath = path.join(root, file);
  const source = fs.readFileSync(sourcePath, "utf8").replace(/\s+$/, "");
  if (!source) throw new Error(file + " is empty — refusing to blank the inline module.");

  const { start, end } = markers(file);
  const startCount = (html.match(new RegExp(escapeRe(start), "g")) || []).length;
  const endCount = (html.match(new RegExp(escapeRe(end), "g")) || []).length;
  if (startCount !== 1 || endCount !== 1 || html.indexOf(start) > html.indexOf(end)) {
    throw new Error(
      "Expected exactly one ordered generated marker pair for " + file + " in " + htmlPath +
      " (start=" + startCount + ", end=" + endCount + "). Refusing to write stale inline code."
    );
  }

  const blockRe = new RegExp(escapeRe(start) + "[\\s\\S]*?" + escapeRe(end));
  html = html.replace(blockRe, () => start + "\n" + source + "\n" + end);
  summary.push(file + " (" + source.length + " bytes)");
}

if (html !== original) fs.writeFileSync(htmlPath, html);
console.log("Inline modules " + (html === original ? "already current" : "synced") +
  ": " + summary.join(", ") + ".");
