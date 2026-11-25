/**
 * Minimalni parser CHANGELOG.md za generatorja (llms.txt, schema.org JSON-LD).
 * Iz zapisa `## [različica] — datum` izluči zadnjo izdajo in vse oznake različic;
 * uporablja se tudi kot snapshot različice za JSON-LD (softwareVersion, datePublished).
 */
"use strict";
const fs = require("fs");
const path = require("path");

function parseChangelog(root) {
  const src = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  const entries = [];
  /* datum je opcijski (npr. '## [2026.10] — predhodna izdaja'); zgoraj je vedno z datumom */
  const re = /^##\s*\[([^\]]+)\]\s*(?:—|--|-)\s*(\d{4}-\d{2}-\d{2})?/gm;
  let m;
  while ((m = re.exec(src))) entries.push({ version: m[1], date: m[2] || null });
  if (!entries.length) throw new Error("CHANGELOG.md: ni najdenega zapisa '## [različica]'.");
  if (!entries[0].date) throw new Error("CHANGELOG.md: prvi zapis nima datuma (## [različica] — YYYY-MM-DD).");
  return { latest: entries[0], entries };
}

module.exports = { parseChangelog };
