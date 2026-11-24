/**
 * Inline module synchronizer (zero-build).
 *
 * Source of truth for pure modules lives in js/*.js. The deployed app stays a
 * single self-contained HTML file (zero-install PWA) and the existing jsdom
 * suites load that HTML without resources:"usable" — so the modules are copied
 * into marked inline blocks instead of being referenced with <script src>.
 *
 * Run after ANY edit to js/core.js:  node scripts/sync-modules.js
 * CI fails on drift; tests/module-sync.test.js covers idempotence and repair.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const root = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, "..");
const htmlPath = path.join(root, "tehnicka-risba-pro.html");
const start = "/* >>> GENERATED: js/core.js — uredi izvorno datoteko, ne to kopijo */";
const end = "/* <<< END GENERATED: js/core.js */";

const sourcePath = path.join(root, "js", "core.js");
const source = fs.readFileSync(sourcePath, "utf8").replace(/\s+$/, "");
const html = fs.readFileSync(htmlPath, "utf8");

if (!source) throw new Error("js/core.js is empty — refusing to blank the inline module.");
const markerRe = new RegExp(
  start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
  "[\\s\\S]*?" +
  end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const startCount = (html.match(new RegExp(escapeRe(start), "g")) || []).length;
const endCount = (html.match(new RegExp(escapeRe(end), "g")) || []).length;
if (startCount !== 1 || endCount !== 1 || html.indexOf(start) > html.indexOf(end)) {
  throw new Error(
    "Expected exactly one ordered generated core marker pair in " + htmlPath +
    " (start=" + startCount + ", end=" + endCount + "). Refusing to write stale inline code."
  );
}
const block = start + "\n" + source + "\n" + end;
const updated = html.replace(markerRe, () => block);

if (updated === html) {
  console.log("Inline modules already current: js/core.js (" + source.length + " bytes).");
} else {
  fs.writeFileSync(htmlPath, updated);
  console.log("Inline modules synced from js/core.js (" + source.length + " bytes).");
}
