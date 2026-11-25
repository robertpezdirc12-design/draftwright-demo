/**
 * WebP katalogske slike (scripts/images.mjs) — offline optimizacija galerije.
 *
 * Pokritje:
 *   - aplikacija se sklicuje SAMO na .webp (brez ostalih .jpg referenc), slike
 *     obstajajo na disku in so v SW predpomnilniku (offline galerija);
 *   - vsak .webp je veljaven (RIFF/WEBP magic) in manjši od svojega .jpg izvora;
 *   - izvorne .jpg slike ostanejo v repozitoriju (vir za regeneracijo);
 *   - avdit iz scripts/images.mjs (audit) ne najde problemov — deluje tudi brez
 *     sharp (CI ne potrebuje lokalnega orodja).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const html = read("tehnicka-risba-pro.html");
const sw = read("sw.js");

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log("  [PASS] " + name + (info ? " — " + info : "")); }
  else { fail++; console.error("  [FAIL] " + name + (info ? " — " + info : "")); }
}

/* ---------- reference v aplikaciji ---------- */
const htmlRefs = [...new Set([...html.matchAll(/slike\/pokoncna\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp)/g)].map((m) => m[0]))];
check("vse reference HTML so WebP (brez .jpg v galeriji)",
  htmlRefs.length > 0 && htmlRefs.every((r) => r.endsWith(".webp")),
  htmlRefs.filter((r) => !r.endsWith(".webp")).join(", "));
check("vse reference HTML obstajajo na disku",
  htmlRefs.every((r) => fs.existsSync(path.join(root, r))), htmlRefs.length + " slik");

/* ---------- SW predpomnilnik ---------- */
const swMatch = sw.match(/var SW_ASSETS\s*=\s*\[([^\]]*)\]/);
const swImgs = swMatch ? [...swMatch[1].matchAll(/"(?:\.\/)?(slike\/[^"]+)"/g)].map((m) => m[1]) : [];
const diskWebp = fs.readdirSync(path.join(root, "slike", "pokoncna")).filter((f) => f.endsWith(".webp")).sort();
check("SW_ASSETS: vse katalogske slike so WebP",
  swImgs.length > 0 && swImgs.every((s) => s.endsWith(".webp")), swImgs.length + " vnosov");
check("SW_ASSETS: pokrite vse WebP slike na disku",
  swImgs.length === diskWebp.length && diskWebp.every((f) => swImgs.indexOf("slike/pokoncna/" + f) >= 0),
  "disk " + diskWebp.length + " / SW " + swImgs.length);
check("HTML in SW se ujemata (isti nabor slik)",
  htmlRefs.length === swImgs.length && htmlRefs.every((r) => swImgs.indexOf(r) >= 0));

/* ---------- veljavnost + kompresija ---------- */
const isWebp = (p) => {
  const head = Buffer.alloc(12);
  const fd = fs.openSync(p, "r");
  fs.readSync(fd, head, 0, 12, 0);
  fs.closeSync(fd);
  return head.slice(0, 4).toString("ascii") === "RIFF" && head.slice(8, 12).toString("ascii") === "WEBP";
};
const rows = diskWebp.map((f) => {
  const base = f.replace(/\.webp$/, "");
  const src = path.join(root, "slike", "pokoncna", base + ".jpg");
  const out = path.join(root, "slike", "pokoncna", f);
  return { f, hasSrc: fs.existsSync(src), srcBytes: fs.existsSync(src) ? fs.statSync(src).size : 0, outBytes: fs.statSync(out).size, webp: isWebp(out) };
});
check("vsi .webp so veljaven WebP (RIFF/WEBP magic)", rows.every((r) => r.webp));
check("izvorne .jpg slike ostanejo v repozitoriju (vir za regeneracijo)", rows.every((r) => r.hasSrc));
check("vsak .webp je manjši od svojega .jpg izvora", rows.every((r) => r.outBytes < r.srcBytes),
  "skupaj " + rows.reduce((a, r) => a + r.srcBytes, 0) + " → " + rows.reduce((a, r) => a + r.outBytes, 0) + " B");
check("noben .webp ni nesorazmerno velik (< 250 KB)", rows.every((r) => r.outBytes < 250 * 1024));

/* ---------- avdit iz scripts/images.mjs ---------- */
(async () => {
  let audit = null, err = null;
  try { ({ audit } = await import(pathToFileURL(path.join(root, "scripts", "images.mjs")).href)); }
  catch (e) { err = String(e && e.message || e); }
  check("scripts/images.mjs se naloži (brez sharp)", !!audit, err || "");
  if (audit) {
    let res = null, aerr = null;
    try { res = audit(root); } catch (e) { aerr = String(e && e.message || e); }
    check("audit: brez problemov", !!res && res.problems.length === 0, aerr || (res ? res.problems.join(" | ") : ""));
    check("audit: zajema vseh " + diskWebp.length + " slik", !!res && res.rows.length === diskWebp.length);
  }

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})();
