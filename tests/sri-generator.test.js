/**
 * Issue #41 — avtomatski generator SRI hash-ov (served/LF bajti).
 *
 * Po incidentu s CRLF hash-i (PR #49) je ročno računanje SRI hash-ov kritično:
 * če jih nekdo izračuna nad lokalnimi CRLF bajti, brskalnik v produkciji
 * (git streže LF) zavrne vse vendor skripte. Ta surov zaklene, da:
 *   - generator obstaja in je registriran kot `npm run sri:generate`,
 *   - generira natanko SHA-384 iz LF-normaliziranih (served) bajtov,
 *   - je idempotenten (ne spremeni že pravilne HTML datoteke),
 *   - popravi napačen/poškodovan hash,
 *   - ostane pravilen tudi na CRLF delovni kopiji (Windows checkout).
 *
 * Surov dela izključno v začasni kopiji — repozitorija ne spreminja.
 * Na stari kodi (brez scripts/generate-sri.js) bi PADO takoj.
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const cp = require("child_process");

const root = path.join(__dirname, "..");
const generator = path.join(root, "scripts", "generate-sri.js");
const htmlPath = path.join(root, "tehnicka-risba-pro.html");
const VENDOR = ["vendor/jspdf.umd.min.js", "vendor/svg2pdf.umd.min.js", "vendor/qr-core.js"];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let pass = 0, fail = 0, errors = [];
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; errors.push(name); console.log(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function finish() {
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${fail ? " — " + errors.join("; ") : ""}`);
  process.exit(fail ? 1 : 0);
}

check("scripts/generate-sri.js obstaja (stara koda bi PADO)", fs.existsSync(generator));
if (!fs.existsSync(generator)) finish();

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
check("npm script sri:generate je registriran", pkg.scripts && pkg.scripts["sri:generate"] === "node scripts/generate-sri.js",
  pkg.scripts && pkg.scripts["sri:generate"]);

// Neodvisen izračun iz strežanih (LF) bajtov — enako pravilo kot v sri.test.js.
const sha384 = (file, base) => {
  const bytes = fs.readFileSync(path.join(base || root, file)).toString("latin1");
  return "sha384-" + crypto.createHash("sha384").update(bytes.replace(/\r\n/g, "\n"), "latin1").digest("base64");
};
const EXPECTED = VENDOR.map((f) => [f, sha384(f)]);
const html = fs.readFileSync(htmlPath, "utf8");
const integrity = (source, file) => {
  const m = source.match(new RegExp('<script\\s+src="' + escapeRe(file) + '"[^>]*?\\bintegrity="([^"]+)"'));
  return m ? m[1] : null;
};

for (const [file, want] of EXPECTED) {
  check("committed HTML: integrity ustreza served LF hash-u za " + file,
    integrity(html, file) === want, integrity(html, file) + " ≠ " + want);
}

const tempDirs = [];
function workspace(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dw-sri-"));
  tempDirs.push(dir);
  for (const f of ["tehnicka-risba-pro.html", ...VENDOR]) {
    const dest = path.join(dir, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(root, f), dest);
  }
  if (mutate) mutate(dir);
  return dir;
}
function generate(dir) {
  const r = cp.spawnSync(process.execPath, [generator, dir], { encoding: "utf8", cwd: root });
  check("generator se izvede brez napake (exit 0)", r.status === 0, (r.stderr || r.stdout || "").slice(0, 200));
  return r.stdout || "";
}

/* 1) Idempotenca: na že pravilni datoteki generator ne sme pisati ničesar. */
const clean = workspace();
const out1 = generate(clean);
check("generator poroča 3 hash-e", /3 vendor hashes/.test(out1), out1.trim());
check("idempotenca: pravilna HTML ostane bajtovno nespremenjena",
  fs.readFileSync(path.join(clean, "tehnicka-risba-pro.html"), "utf8") === html);

/* 2) Popravilo: poškodovan hash se obnovi iz resnične datoteke. */
const brokenHash = "sha384-" + "A".repeat(64);
const broken = workspace((dir) => {
  const p = path.join(dir, "tehnicka-risba-pro.html");
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(EXPECTED[0][1], brokenHash));
});
check("testna predpostavka: hash je bil poškodovan",
  integrity(fs.readFileSync(path.join(broken, "tehnicka-risba-pro.html"), "utf8"), VENDOR[0]) === brokenHash);
generate(broken);
const repaired = fs.readFileSync(path.join(broken, "tehnicka-risba-pro.html"), "utf8");
check("generator popravi poškodovan SRI hash", integrity(repaired, VENDOR[0]) === EXPECTED[0][1]);
check("popravilo je minimalno: ostanek HTML je identičen committed različici", repaired === html);

/* 3) CRLF delovna kopija (Windows): hash mora ostati LF/served hash. */
const crlf = workspace((dir) => {
  for (const f of VENDOR) {
    const p = path.join(dir, f);
    fs.writeFileSync(p, fs.readFileSync(p).toString("latin1").replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"), "latin1");
  }
});
generate(crlf);
const crlfHtml = fs.readFileSync(path.join(crlf, "tehnicka-risba-pro.html"), "utf8");
check("CRLF checkout ne pokvari hash-ov (ostanejo served LF)",
  EXPECTED.every(([f, want]) => integrity(crlfHtml, f) === want));
check("generator ne spreminja vendor datotek, samo HTML",
  fs.readFileSync(path.join(crlf, VENDOR[0])).toString("latin1").includes("\r\n"));

for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
finish();
