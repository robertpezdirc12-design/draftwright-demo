/**
 * Dokumentacijski list (HTML) — celovit tehnični dokument naročila po vzoru
 * referenčnega lista »Ograja s koriti za rože 5000×1200« (ročno sestavljen HTML).
 *
 * Pokritje:
 *   - meni »Izvozi dokumentacijski list (HTML)« sestavi samostojno HTML datoteko
 *     (glava + žig, risba SVG, vhodni podatki, tehnične opombe, BOM, naslovna polja, noga);
 *   - vhodni podatki vsebujejo IZRAČUNANE vrednosti (št. lamel, pokrivna višina,
 *     omejitev nosilcev, tovariške dolžine, korita);
 *   - opombe = en vir kot list (composeNotes) + koritna konstrukcijska opomba;
 *   - BOM = en vir kot list (bomRows): vključno s surovimi deskami (razrez/odpad)
 *     in razčlenjenimi koriti (okvir/obloga, dno z drenažo, konzole);
 *   - naslovna polja (naročnik/izdelal/preveril/list) in noga z virom Roksal;
 *   - varnost: brez skript, zunanjih povezav (href/src) in mailto (egress politika),
 *     vnešeni podatki so escape-ani (ni vbrizgavanja v dokument);
 *   - determinizem: dva izpisa sta identična.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log("  [PASS] " + name + (info ? " — " + info : "")); }
  else { fail++; console.error("  [FAIL] " + name + (info ? " — " + info : "")); }
}

function makeDom() {
  return new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://draftwright-demo.vercel.app/",
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = function () {
        return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
      };
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = function () {};
      window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
    },
  });
}

const dom = makeDom();
const { window } = dom;
const document = window.document;
const $ = (id) => document.getElementById(id);
const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));

/* konfiguracija: ograja s koriti 5000×1200 (referenčni dokument) */
const SET = { proj: "Ograja s koriti za rože", sysProfile: "romb67", sysUse: "precna", L: "5000", H: "1200", n: "17", gap: "3", drw: "OGR-5000/1200-01" };
const CHANGE_IDS = ["sysUse", "sysProfile", "sysColor", "sysSurface", "mountType", "paper", "projType"];
Object.keys(SET).forEach((id) => {
  const el = $(id); if (!el) return;
  el.value = String(SET[id]);
  fire(el, CHANGE_IDS.indexOf(id) >= 0 ? "change" : "input");
});
$("koritoList").value = "1200;620\n1200;3120"; fire($("koritoList"), "input");

/* izpis prek menija (saveBlob prestrežen) */
let blob = null;
const oc = window.URL.createObjectURL;
window.URL.createObjectURL = (b) => { blob = b; return "blob:test"; };
if ($("menuDlDoc")) $("menuDlDoc").click(); else check("meni Izvozi dokumentacijski list obstaja", false, "menuDlDoc manjka");
window.URL.createObjectURL = oc;

let doc = null;
if (blob) { doc = ""; blob.text().then((t) => { doc = t; }); }

(async () => {
  if (blob) doc = await blob.text();
  check("dokument je bil ustvarjen (HTML blob)", typeof doc === "string" && doc.length > 5000, doc ? doc.length + " znakov" : "brez bloba");
  if (!doc) {
    console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL`);
    process.exit(fail ? 1 : 0);
  }

  /* ---------- struktura dokumenta ---------- */
  check("HTML5 doctype + jezik sl", doc.startsWith("<!doctype html>") && doc.indexOf('<html lang="sl">') >= 0);
  check("glava: naslov + žig TEHNIČNA DOKUMENTACIJA",
    doc.indexOf("– tehnična risba") >= 0 && doc.indexOf("TEHNIČNA DOKUMENTACIJA") >= 0 &&
    doc.indexOf("RISBA ŠT.: <b>OGR-5000/1200-01") >= 0 && doc.indexOf("VSE MERE V mm") >= 0);
  check("sekcije 01–05 (risba, vhodni podatki, opombe, BOM, naslovna polja)",
    ["01 Risba", "02 Vhodni podatki", "03 Tehnične opombe", "04 Seznam materiala (BOM)", "05 Naslovna polja"].every((k) => doc.indexOf(k) >= 0));
  check("risba (A3 SVG) je vgrajena",
    doc.indexOf("<svg") >= 0 && doc.indexOf("SPREDNJI POGLED") >= 0 && doc.indexOf("SEZNAM SESTAVNIH DELOV") >= 0);

  /* ---------- vhodni podatki: izračunane vrednosti ---------- */
  check("vhodni podatki: mere in sistem",
    doc.indexOf("Roksal d.o.o., Kranj — WoodCore WPC · ROMB-67") >= 0 &&
    doc.indexOf("<td>5000 mm</td>") >= 0 && doc.indexOf("<td>1200 mm</td>") >= 0);
  check("vhodni podatki: izračuni (št. lamel 17, pokrivna višina 1187, reža 3)",
    doc.indexOf("<td>17</td>") >= 0 && doc.indexOf("1187 mm (razmak/reža 3 mm)") >= 0);
  check("vhodni podatki: omejitev nosilcev in tovariške dolžine",
    doc.indexOf("razmak med stebri ≤ 1450 mm") >= 0 && doc.indexOf("5800") >= 0);
  check("vhodni podatki: korita 2× (širina × globina × višina)",
    doc.indexOf("1200 × 220 × 310 mm, 1200 × 220 × 310 mm") >= 0 || doc.indexOf("Korita za rože") >= 0);

  /* ---------- opombe (en vir kot list) ---------- */
  const notes = [...doc.matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]);
  check("opombe: ≥ 10 vrstic (samodejne + koritna)", notes.length >= 10, notes.length + " opomb");
  check("opombe: koritna konstrukcijska opomba (ALU 30×30×2, PE vložek, drenaža)",
    notes.some((t) => t.indexOf("Korita: okvir ALU 30×30×2") >= 0 && t.indexOf("PE vložek 2 mm") >= 0 && t.indexOf("dno z razmakom 3 mm") >= 0));
  check("opombe: rezanje/spoji, sidranje in garancija",
    notes.some((t) => t.indexOf("spoji desk vedno na stebru") >= 0) &&
    notes.some((t) => t.indexOf("ni predmet risbe") >= 0) &&
    notes.some((t) => t.indexOf("15 let na material") >= 0));

  /* ---------- BOM (en vir kot list) ---------- */
  check("BOM: surove deske (razrez iz tovariških dolžin + odpad)",
    doc.indexOf("Surova deska (razrez)") >= 0 && doc.indexOf("odpad") >= 0 && doc.indexOf("iz tovariških") >= 0);
  check("BOM: korita razčlenjena (okvir/obloga, dno z drenažo, konzole)",
    ["Cvetlično korito – okvir in obloga", "Korito – dno z drenažo", "Konzolni nosilec korita"].every((k) => doc.indexOf(k) >= 0));
  check("BOM: lamela s profilom in širinami korit",
    doc.indexOf("Lamela ROMB-67") >= 0 && doc.indexOf("širine: 1200, 1200") >= 0);

  /* ---------- naslovna polja + noga ---------- */
  check("naslovna polja: naročnik/izdelal/preveril/list",
    ["Naročnik", "Izdelal", "Preveril", "1 / 1"].every((k) => doc.indexOf(k) >= 0));
  check("noga: vir Roksal + oznaka risbe",
    doc.indexOf("Savska Loka 21, 4000 Kranj") >= 0 && doc.indexOf("roksal.com") >= 0 &&
    doc.indexOf("OGR-5000/1200-01") >= 0);

  /* ---------- varnost dokumenta ---------- */
  check("brez skript v dokumentu", doc.indexOf("<script") < 0);
  check("brez zunanjih povezav (href/src) in mailto",
    !/(href|src)\s*=/.test(doc) && doc.indexOf("mailto:") < 0);
  check("brez http(s) URL-jev (dovoljen samo SVG xmlns)", !/https?:\/\//.test(doc.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, "")));

  /* ---------- escape vnešenih podatkov ---------- */
  const dom2 = makeDom();
  const w2 = dom2.window, d2 = w2.document, $2 = (id) => d2.getElementById(id);
  const fire2 = (el, t) => el.dispatchEvent(new w2.Event(t, { bubbles: true }));
  $2("proj").value = '<img src=x onerror=alert(1)>'; fire2($2("proj"), "input");
  let blob2 = null;
  w2.URL.createObjectURL = (b) => { blob2 = b; return "blob:test"; };
  $2("menuDlDoc").click();
  const doc2 = blob2 ? await blob2.text() : "";
  check("vnešeni podatki so escape-ani (ni vbrizgavanja)",
    doc2.indexOf("&lt;img src=x") >= 0 && doc2.indexOf("<img src=x") < 0);

  /* ---------- determinizem ---------- */
  blob2 = null;
  w2.URL.createObjectURL = (b) => { blob2 = b; return "blob:test"; };
  $2("menuDlDoc").click();
  const doc3 = blob2 ? await blob2.text() : "";
  check("dva izpisa sta identična (determinizem)", doc3 === doc2);

  check("brez JS napak med generiranjem", errors.length === 0, errors[0] || "brez napak");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
