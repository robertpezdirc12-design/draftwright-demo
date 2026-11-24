/**
 * Issue #41 — Subresource Integrity (SRI) za brskalnisko naložene vendor skripte.
 *
 * Draftwright je zero-install PWA: trije runtime skripti se naložijo iz istega
 * izvora (vendor/*.js), ne iz omrežja. SRI (SHA-384 integrity atribute) doda
 * obrambo pred **supply-chain** napako: če se katerikoli vendor datotek tiho
 * spremeni (kompromitiran npm, poškodovan checkout, malware), bo brskalnik
 * zavrnil izvajanje skripta, ker hash ne bo ujel — namesto da tiho zažene
 * spremenjeno kodo.
 *
 * Ta surov je AVTORITATIVNI PIN: recomputira sha384 iz resnične datoteke na
 * disku in preveri, da točno ustreza integrity atributu v HTML. Zato katerekoli
 * tihe spremembe vendor/ datoteke (ali ročno spremenjenega hash-a) PADO.
 *
 * SRI ne spreminja CSP inline hash-i (skripti so 'self', integrity je ločen
 * mehanizem), zato vercel.json / generate-csp.js nista prizadeta.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const html = read("tehnicka-risba-pro.html");

let pass = 0, fail = 0, errors = [];
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; errors.push(name); console.log(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* ============ 1) vsak vendor skript nosi integrity atribut ============ */
// Vsi trije runtime vendor skripti morajo imeti integrity="sha384-…".
// Ulovimo vsak <script src="vendor/*.js" …> in zahtevamo integrity atribut.
const vendorScriptTags = [];
{
  const re = /<script\s+src="(vendor\/[^"]+\.js)"[^>]*>/g;
  let m;
  while ((m = re.exec(html)) !== null) vendorScriptTags.push(m[0] + "</script>");
}
const EXPECTED_VENDOR = ["vendor/jspdf.umd.min.js", "vendor/svg2pdf.umd.min.js", "vendor/qr-core.js"];
const missing = EXPECTED_VENDOR.filter((f) => !vendorScriptTags.some((t) => t.includes('src="' + f + '"')));
check("HTML: vsak od 3 vendor skriptov prisoten kot <script>", missing.length === 0,
  "manjka: " + missing.join(", "));

for (const f of EXPECTED_VENDOR) {
  const tag = vendorScriptTags.find((t) => t.includes('src="' + f + '"'));
  const hasIntegrity = !!tag && /integrity="sha384-[A-Za-z0-9+/=]{43,}"/.test(tag);
  check("SRI prisoten na " + f, hasIntegrity, tag ? tag : "skript ni najden");
  // SHA-384 base64 = 64 znakov; slabši algoritmi (md5/sha1/sha256) zavrnemo.
  check(f + ": integrity je SHA-384 (ne slabšega)",
    !!tag && /integrity="sha384-/.test(tag) && !/integrity="(sha256|sha1|md5)-/.test(tag));
}

/* ============ 2) AVTORITATIVNI PIN: recomputed hash === HTML integrity ============ */
// KLJUČNO: SRI hash mora biti izračunan iz **strežanih bajtov** — to so git-commitane
// bajtote (LF), ker `* text=auto eol=lf` v .gitattributes. Na Windowsu git pri checkout-u
// pretvori v CRLF (lokalno delovno kopijo), zato brskalnik v produkciji prejme LF bajte.
// Zato normaliziramo CRLF→LF pred hash-iranjem: na CI (že LF) je brez učinka, na Windowsu
// da strežane (LF) bajte — enaka vrednost integrity v HTML. Brez tega bi bil SRI hash
// iz CRLF bajtov in brskalnik bi ZAVRNIL vse vendor skripte v produkciji.
function sha384Base64(file) {
  const bytes = fs.readFileSync(path.join(root, file)).toString("latin1");
  const served = bytes.replace(/\r\n/g, "\n"); // CRLF → LF (strežani/git bajti)
  return "sha384-" + crypto.createHash("sha384").update(served, "latin1").digest("base64");
}
for (const f of EXPECTED_VENDOR) {
  if (!fs.existsSync(path.join(root, f))) { check(f + " prisotna na disku", false, "datoteka manjka"); continue; }
  const want = sha384Base64(f);
  const tag = vendorScriptTags.find((t) => t.includes('src="' + f + '"'));
  const m = tag && tag.match(/integrity="([^"]+)"/);
  const got = m ? m[1] : null;
  check(f + ": integrity hash točno ustreza datoteki na disku (sha384)", got === want,
    got === want ? "" : ("\n      HTML: " + got + "\n      DISK: " + want));
  check(f + ": hash dolžina 71 znakov (sha384- + 64 b64)", got === "sha384-" + got.slice(7) && got.length === 71,
    "len=" + (got ? got.length : "-"));
}

/* ============ 3) noben vendor skript NI brez SRI (supply-chain varnost) ============ */
// Katerekoli <script src="vendor/*.js"> brez integrity atributa → varnostna luknja.
const unsigned = vendorScriptTags.filter((t) => /<script\s+src="vendor\//.test(t) && !/integrity="/.test(t));
check("noben vendor skript brez integrity atribute (brez SRI = tvegano)", unsigned.length === 0,
  unsigned.join(" | "));
check("skupaj natanko 3 SRI-pini (ni nepričakovanega 4. vendor skripta)",
  vendorScriptTags.length === EXPECTED_VENDOR.length, "n=" + vendorScriptTags.length);

/* ============ 4) regresija: stari kodi bi PADO ============ */
// Na stari kodi (brez SRI) bi: (a) noben integrity atribut → točke 1+3 PADO;
// (b) recomputed hash ne bi imel s čem primerjati. Ta blok dokazuje, da surov
// dejansko uloži odstranitev/kapiranje SRI (ne samo da je tam).
check("regresija: vsaj 1 integrity atribut dejansko prisoten (stara koda bi PADO)",
  (html.match(/integrity="sha384-/g) || []).length >= EXPECTED_VENDOR.length,
  "št. sha384 integrity=" + ((html.match(/integrity="sha384-/g) || []).length));

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${fail ? " — " + errors.join("; ") : ""}`);
process.exit(fail ? 1 : 0);
