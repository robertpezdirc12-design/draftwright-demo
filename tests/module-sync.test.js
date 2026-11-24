/**
 * Postopna modularizacija — izvorne datoteke js/*.js.
 *
 * Aplikacija ostane zero-install PWA z enim HTML-jem, zato se moduli ne naložijo
 * prek <script src> (tudi jsdom testi brez resources:"usable" jih ne bi). Viri
 * so datoteke v js/, inline kopije pa se generirajo med oznakama. Ta surov
 * zaklene ujemanje za VSE module, idempotenco in popravilo drift-a.
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");

const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "tehnicka-risba-pro.html");
const generatorPath = path.join(root, "scripts", "sync-modules.js");
const MODULES = ["js/core.js", "js/geometry.js", "js/dilatation.js", "js/csv.js", "js/roksal.js"];
const markers = (file) => ({
  start: "/* >>> GENERATED: " + file + " — uredi izvorno datoteko, ne to kopijo */",
  end: "/* <<< END GENERATED: " + file + " */",
});
const generated = (s, m) => {
  const i = s.indexOf(m.start), j = s.indexOf(m.end);
  return i < 0 || j < 0 ? null : s.slice(i + m.start.length, j).trim();
};
const count = (s, needle) => s.split(needle).length - 1;

let pass = 0, fail = 0, errors = [];
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; errors.push(name); console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function finish() {
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${fail ? " — " + errors.join("; ") : ""}`);
  process.exit(fail ? 1 : 0);
}

check("scripts/sync-modules.js obstaja (stara koda bi PADO)", fs.existsSync(generatorPath));
/* Vsi viri so preverjeni PRED morebitnim izstopom. Na neposredni predhodni
   kodi (manjka le js/roksal.js) zato pade z 1 FAIL; na kodi pred celotno
   modularizacijo bi bilo 6 FAIL (generator + 5 virov), ne le prvi. */
let allSources = true;
for (const file of MODULES) {
  const ok = fs.existsSync(path.join(root, file));
  check(file + " obstaja (stara koda bi PADO)", ok);
  allSources = allSources && ok;
}
if (!fs.existsSync(generatorPath) || !allSources) finish();

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
check("npm script modules:sync je registriran",
  pkg.scripts && pkg.scripts["modules:sync"] === "node scripts/sync-modules.js",
  pkg.scripts && pkg.scripts["modules:sync"]);

const html = fs.readFileSync(htmlPath, "utf8");
for (const file of MODULES) {
  const m = markers(file);
  const source = fs.readFileSync(path.join(root, file), "utf8").replace(/\s+$/, "");
  check(file + ": natanko en urejen par oznak",
    count(html, m.start) === 1 && count(html, m.end) === 1 && html.indexOf(m.start) < html.indexOf(m.end),
    `start=${count(html, m.start)}, end=${count(html, m.end)}`);
  const inline = generated(html, m);
  check(file + ": inline kopija vsebinsko enaka izvoru", inline === source,
    inline === source ? "" : `html=${inline && inline.length} src=${source.length}`);
  check(file + ": izvor nima DOM/storage odvisnosti",
    !/\bdocument\b|\blocalStorage\b|\$\(/.test(source));
}
const coreSource = fs.readFileSync(path.join(root, "js/core.js"), "utf8");
const geoSource = fs.readFileSync(path.join(root, "js/geometry.js"), "utf8");
const dilSource = fs.readFileSync(path.join(root, "js/dilatation.js"), "utf8");
const csvSource = fs.readFileSync(path.join(root, "js/csv.js"), "utf8");
check("js/csv.js vsebuje csvCell in csvRow",
  /function csvCell\(/.test(csvSource) && /function csvRow\(/.test(csvSource));
check("js/core.js izvaža DWCore", coreSource.includes("window.DWCore=DWCore;"));
check("js/geometry.js vsebuje solve in homography",
  /function solve\(/.test(geoSource) && /function homography\(/.test(geoSource));
check("js/dilatation.js vsebuje DIL in dilatacija",
  /var DIL=\{/.test(dilSource) && /function dilatacija\(/.test(dilSource));
const roksalSource = fs.readFileSync(path.join(root, "js/roksal.js"), "utf8");
check("js/roksal.js vsebuje USE_NAMES in obe omejitvi",
  /var USE_NAMES=\{/.test(roksalSource) && /function roksalLimit\(/.test(roksalSource) &&
  /function roksalRailLimit\(/.test(roksalSource));
check("roksalUseNotes ostane v HTML-ju, ne v čistem modulu",
  /function roksalUseNotes\(/.test(html) && !/function roksalUseNotes\(/.test(roksalSource));
check("generator pokriva vse module",
  MODULES.every((f) => fs.readFileSync(generatorPath, "utf8").includes('"' + f + '"')));

/* --- generator v začasni kopiji --- */
const tempDirs = [];
function workspace(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dw-module-"));
  tempDirs.push(dir);
  for (const f of ["tehnicka-risba-pro.html", ...MODULES, "scripts/sync-modules.js"]) {
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
check("generator poroča vse izvore",
  MODULES.every((f) => out1.includes(f)), out1.trim());
check("idempotenca: pravilna HTML ostane bajtovno nespremenjena",
  fs.readFileSync(path.join(clean, "tehnicka-risba-pro.html"), "utf8") === html);

for (const file of MODULES) {
  const m = markers(file);
  const source = fs.readFileSync(path.join(root, file), "utf8").replace(/\s+$/, "");
  const drifted = workspace((dir) => {
    const p = path.join(dir, "tehnicka-risba-pro.html");
    const s = fs.readFileSync(p, "utf8");
    const i = s.indexOf(m.start), j = s.indexOf(m.end);
    fs.writeFileSync(p, s.slice(0, i + m.start.length) + "\nvar DRIFTED=null;\n" + s.slice(j));
  });
  generate(drifted);
  check(file + ": generator popravi driftano inline kopijo",
    generated(fs.readFileSync(path.join(drifted, "tehnicka-risba-pro.html"), "utf8"), m) === source);
  check(file + ": popravilo je minimalno (ostanek HTML identičen)",
    fs.readFileSync(path.join(drifted, "tehnicka-risba-pro.html"), "utf8") === html);
}

/* Manjkajoča končna oznaka mora biti napaka, ne tihi no-op. */
const brokenMarkers = workspace((dir) => {
  const p = path.join(dir, "tehnicka-risba-pro.html");
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(markers("js/core.js").end, "/* END MARKER REMOVED */"));
});
const rejected = cp.spawnSync(process.execPath,
  [path.join(brokenMarkers, "scripts", "sync-modules.js"), brokenMarkers],
  { encoding: "utf8", cwd: root });
check("generator zavrne manjkajočo končno oznako (ne tihi no-op)",
  rejected.status !== 0 && /ordered generated marker pair/.test(rejected.stderr || ""),
  "exit=" + rejected.status + " " + (rejected.stderr || "").slice(0, 160));
check("zavrnitev ne spremeni HTML-ja",
  fs.readFileSync(path.join(brokenMarkers, "tehnicka-risba-pro.html"), "utf8").includes("/* END MARKER REMOVED */"));

for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
finish();
