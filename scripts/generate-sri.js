/**
 * SRI hash generator (zero-build).
 * Computes SHA-384 over the SERVED bytes of every vendored runtime script and
 * writes the resulting integrity attributes into the app HTML.
 *
 * Run after ANY change to vendor/*.js:  node scripts/generate-sri.js
 * tests/sri-generator.test.js fails if the generator is missing or drifts.
 *
 * CRITICAL: served bytes are the committed (LF) bytes, not the local Windows
 * CRLF checkout (.gitattributes: * text=auto eol=lf). Hashing CRLF bytes would
 * produce hashes the browser rejects in production. CRLF is normalized here.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, "..");
const htmlPath = path.join(root, "tehnicka-risba-pro.html");
const VENDOR = [
  "vendor/jspdf.umd.min.js",
  "vendor/svg2pdf.umd.min.js",
  "vendor/qr-core.js",
];

function sha384(file) {
  const bytes = fs.readFileSync(path.join(root, file)).toString("latin1");
  const served = bytes.replace(/\r\n/g, "\n"); // CRLF → LF (served/git bytes)
  return "sha384-" + crypto.createHash("sha384").update(served, "latin1").digest("base64");
}

const original = fs.readFileSync(htmlPath, "utf8");
let html = original;

for (const file of VENDOR) {
  const want = sha384(file);
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp('(<script\\s+src="' + escaped + '"[^>]*?\\bintegrity=")sha384-[A-Za-z0-9+/=]+(")');
  if (!re.test(html)) {
    throw new Error("SRI: no integrity attribute found on <script src=\"" + file + "\"> in " + htmlPath);
  }
  html = html.replace(re, (_m, before, after) => before + want + after);
}

if (html !== original) fs.writeFileSync(htmlPath, html);
console.log("SRI updated: " + VENDOR.length + " vendor hashes (served LF bytes)." +
  (html === original ? " Already current." : ""));
