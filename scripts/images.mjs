#!/usr/bin/env node
/**
 * WebP generator/avdit za katalogske slike (vzor: soma-website scripts/images.mjs).
 *
 * Izvorne slike (`slike/pokoncna/*.jpg`) OSTANEJO v repozitoriju kot vir za
 * regeneracijo; aplikacija, SW predpomnilnik in testi uporabljajo `.webp`
 * (kakovost 82, ~60–75 % manjši offline cache). Deluje tudi brez build koraka —
 * generiranje je lokalno orodje (sharp), avdit in testi pa samo bereta disk,
 * zato CI sharp-a ne potrebuje.
 *
 * Uporaba:
 *   node scripts/images.mjs            generiraj/posodobi vse .webp
 *   node scripts/images.mjs --check    samo avdit (izpiši probleme, exit 1)
 *
 * sharp se išče v lokalnih odvisnostih, sicer v globalni npm mapi agenta
 * (kot pri ostalih orodjih tega repozitorija).
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = path.join("slike", "pokoncna");
const QUALITY = 82;

function loadSharp() {
  const require = createRequire(import.meta.url);
  const candidates = ["sharp", "C:/Users/admin/.pi/agent/npm/node_modules/sharp"];
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* naslednji kandidat */ }
  }
  throw new Error("sharp ni najden (namesti lokalno ali v globalni npm mapi agenta).");
}

function listSources(root) {
  const dir = path.join(root || ROOT, SRC_DIR);
  return fs.readdirSync(dir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort()
    .map((f) => path.join(dir, f));
}

/** Avdit: vsaka slika ima .webp, ta je veljaven WebP in manjši od izvora. */
function audit(root) {
  const r = root || ROOT;
  const rows = [];
  const problems = [];
  for (const src of listSources(r)) {
    const out = src.replace(/\.(jpe?g|png)$/i, ".webp");
    const row = { src: path.basename(src), out: path.basename(out), srcBytes: fs.statSync(src).size };
    if (!fs.existsSync(out)) {
      row.exists = false;
      row.outBytes = 0;
      problems.push("manjka WebP: " + path.relative(r, out));
    } else {
      row.exists = true;
      row.outBytes = fs.statSync(out).size;
      const head = Buffer.alloc(12);
      const fd = fs.openSync(out, "r");
      fs.readSync(fd, head, 0, 12, 0);
      fs.closeSync(fd);
      const isWebp = head.slice(0, 4).toString("ascii") === "RIFF" && head.slice(8, 12).toString("ascii") === "WEBP";
      row.webp = isWebp;
      if (!isWebp) problems.push("ni veljaven WebP (RIFF/WEBP magic): " + path.relative(r, out));
      if (row.outBytes >= row.srcBytes) problems.push("WebP ni manjši od izvora: " + path.relative(r, out));
    }
    rows.push(row);
  }
  return { rows, problems };
}

async function generate(root) {
  const r = root || ROOT;
  const sharp = loadSharp();
  const rows = [];
  for (const src of listSources(r)) {
    const out = src.replace(/\.(jpe?g|png)$/i, ".webp");
    const before = fs.existsSync(out) ? fs.statSync(out).size : 0;
    await sharp(src).webp({ quality: QUALITY }).toFile(out);
    rows.push({ file: path.relative(r, out), before, after: fs.statSync(out).size });
  }
  return rows;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const check = process.argv.includes("--check");
  if (check) {
    const { rows, problems } = audit(ROOT);
    rows.forEach((r) => console.log(`  ${r.out}  ${r.outBytes} B (izvor ${r.srcBytes} B)`));
    if (problems.length) {
      console.error("Avdit: " + problems.length + " problemov:");
      problems.forEach((p) => console.error("  - " + p));
      process.exit(1);
    }
    console.log("Avdit: vseh " + rows.length + " WebP slik je veljavnih in manjših od izvora.");
  } else {
    const rows = await generate(ROOT);
    rows.forEach((r) => console.log(`  ${r.file}: ${r.before} → ${r.after} B`));
    console.log("Generiranih " + rows.length + " WebP slik (kakovost " + QUALITY + ").");
  }
}

export { audit, generate, listSources, QUALITY, SRC_DIR };
