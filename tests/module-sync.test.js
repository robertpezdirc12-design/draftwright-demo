/**
 * Postopna modularizacija, korak 2 — js/core.js kot izvirna datoteka.
 *
 * Aplikacija ostane zero-install PWA z enim HTML-jem, zato se modul ne naloži
 * prek <script src> (tudi jsdom testi ga ne bi). Vir je js/core.js, inline
 * kopija pa se generira med oznakama. Ta surov zaklene, da se izvor in kopija
 * ne razideta — ter da je generator idempotenten in popravi drift.
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");

const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "tehnicka-risba-pro.html");
const sourcePath = path.join(root, "js", "core.js");
const generatorPath = path.join(root, "scripts", "sync-modules.js");
const START = "/* >>> GENERATED: js/core.js — uredi izvorno datoteko, ne to kopijo */";
const END = "/* <<< END GENERATED: js/core.js */";

let pass = 0, fail = 0, errors = [];
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; errors.push(name); console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function finish() {
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${fail ? " — " + errors.join("; ") : ""}`);
  process.exit(fail ? 1 : 0);
}

check("js/core.js obstaja (stara koda bi PADO)", fs.existsSync(sourcePath));
check("scripts/sync-modules.js obstaja (stara koda bi PADO)", fs.existsSync(generatorPath));
if (!fs.existsSync(sourcePath) || !fs.existsSync(generatorPath)) finish();

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
check("npm script modules:sync je registriran",
  pkg.scripts && pkg.scripts["modules:sync"] === "node scripts/sync-modules.js",
  pkg.scripts && pkg.scripts["modules:sync"]);

const html = fs.readFileSync(htmlPath, "utf8");
const source = fs.readFileSync(sourcePath, "utf8").replace(/\s+$/, "");
const count = (s, needle) => s.split(needle).length - 1;
check("v HTML-ju je natanko en par oznak GENERATED",
  count(html, START) === 1 && count(html, END) === 1,
  `start=${count(html, START)}, end=${count(html, END)}`);

const generated = (s) => {
  const i = s.indexOf(START), j = s.indexOf(END);
  return i < 0 || j < 0 ? null : s.slice(i + START.length, j).trim();
};
const inline = generated(html);
check("committed HTML: inline kopija je bajtovno enaka js/core.js", inline === source,
  inline === source ? "" : `html=${inline && inline.length} src=${source.length}`);
check("izvor vsebuje izvoz window.DWCore", source.includes("window.DWCore=DWCore;"));
check("izvor nima DOM odvisnosti",
  !/\bdocument\b|\blocalStorage\b|\$\(/.test(source));

/* --- generator v začasni kopiji --- */
const tempDirs = [];
function workspace(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dw-module-"));
  tempDirs.push(dir);
  for (const f of ["tehnicka-risba-pro.html", "js/core.js", "scripts/sync-modules.js"]) {
    const dest = path.join(dir, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(root, f), dest);
  }
  if (mutate) mutate(dir);
  return dir;
}
function generate(dir) {
  const r = cp.spawnSync(process.execPath, [path.join(dir, "scripts", "sync-modules.js"), dir],
    { encoding: "utf8", cwd: root });
  check("generator se izvede brez napake (exit 0)", r.status === 0, (r.stderr || r.stdout || "").slice(0, 200));
  return r.stdout || "";
}

const clean = workspace();
const out1 = generate(clean);
check("generator poroča velikost izvora", /Inline modules already current/.test(out1), out1.trim());
check("idempotenca: pravilna HTML ostane bajtovno nespremenjena",
  fs.readFileSync(path.join(clean, "tehnicka-risba-pro.html"), "utf8") === html);

const drifted = workspace((dir) => {
  const p = path.join(dir, "tehnicka-risba-pro.html");
  const s = fs.readFileSync(p, "utf8");
  const i = s.indexOf(START), j = s.indexOf(END);
  fs.writeFileSync(p, s.slice(0, i + START.length) + "\nvar DWCore=null;\n" + s.slice(j));
});
generate(drifted);
check("generator popravi driftano inline kopijo",
  generated(fs.readFileSync(path.join(drifted, "tehnicka-risba-pro.html"), "utf8")) === source);
check("popravilo je minimalno: ostanek HTML je identičen committed različici",
  fs.readFileSync(path.join(drifted, "tehnicka-risba-pro.html"), "utf8") === html);

for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
finish();
