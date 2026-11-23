/**
 * CSP hash generator (zero-build).
 * Computes SHA-256 hashes of every inline <script>/<style> in the app and writes
 * the resulting policy into the HTML <meta> tag and vercel.json header.
 * Run after ANY edit to inline code:  node scripts/generate-csp.js
 * tests/csp.test.js fails if the policy and the source drift apart.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "tehnicka-risba-pro.html");
const vercelPath = path.join(root, "vercel.json");
const html = fs.readFileSync(htmlPath, "utf8");

const hash = (s) => "sha256-" + crypto.createHash("sha256").update(s).digest("base64");
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1]).filter((s) => s.trim());
const styles = [...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)]
  .map((m) => m[1]).filter((s) => s.trim());
if (!scripts.length || !styles.length) throw new Error("No inline scripts/styles found — policy would be empty.");

const scriptSrc = ["'self'", ...scripts.map((s) => "'" + hash(s) + "'")].join(" ");
const styleSrc = ["'self'", ...styles.map((s) => "'" + hash(s) + "'")].join(" ");
const base = [
  "default-src 'self'",
  "script-src " + scriptSrc,
  "style-src " + styleSrc,
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
const metaPolicy = base;
const headerPolicy = base + "; frame-ancestors 'none'";

const metaRe = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/;
if (!metaRe.test(html)) throw new Error("CSP meta tag not found.");
fs.writeFileSync(htmlPath, html.replace(metaRe, '<meta http-equiv="Content-Security-Policy" content="' + metaPolicy + '">'));

const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
const entry = vercel.headers && vercel.headers[0];
const csp = entry && entry.headers && entry.headers.find((h) => h.key === "Content-Security-Policy");
if (!csp) throw new Error("CSP header entry not found in vercel.json.");
csp.value = headerPolicy;
fs.writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + "\n");
console.log("CSP updated: " + scripts.length + " script hashes, " + styles.length + " style hashes.");
