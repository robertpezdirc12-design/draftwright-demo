/**
 * Reference — pokončna ograja z WoodCore deskami (galerija foto eksponatov).
 *
 * Štirje primeri pokončne ograje z različnimi profili desk (POLNA DESKA 57/32,
 * POLNA DESKA 100, POLNA DESKA 128, ROMB DESKA 67) so v galeriji primerov
 * prikazani s fotografijami eksponatov. Klik kartice naloži uporabo »pokoncna«
 * in ustrezen profil registra WC ter generira risbo.
 *
 * Pokritje:
 *   1) struktura: #refGrid s 4 karticami, slike iz krajevnega slike/pokoncna/ (brez egress),
 *   2) katalog: širine/dolžine desk iz zapisa (5,7/3,2 cm · 5,8 m; 10 cm · 5,8 m;
 *      12,8 cm · 2,2 m; 6,7 cm · 2,8 m) in imena profilov,
 *   3) registarska povezava: ključi kartic soveljavijo z WC (applySystem nastavi
 *      širino/debelino/razmike iz registra),
 *   4) nalaganje: klik kartice → sysUse=pokoncna, sysProfile=ključ, risba generirana,
 *   5) EN pariteta: ref_h/ref_intro/ref_c1..4 prevedeni, povratek v SL brez ostankov,
 *   6) dostopnost: vsaka kartica ima dostopno ime,
 *   7) slike na disku in v SW predpomnilniku (offline galerija),
 *   8) brez JS napak.
 *
 * Na kodi brez referenčne galerije PADE (refGrid ne obstaja).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const html = read("tehnicka-risba-pro.html");
const errors = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.URL.createObjectURL = () => "blob:test";
    window.HTMLAnchorElement.prototype.click = function () {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

(async () => {
  /* ---- 1) struktura galerije ---- */
  window.openTemplates();
  const grid = $("refGrid");
  check("refGrid obstaja v galeriji primerov", !!grid);
  const cards = grid ? grid.querySelectorAll(".ref-card") : [];
  check("4 referenčne kartice (4 profili)", cards.length === 4, "najdenih: " + cards.length);

  const imgs = Array.from(grid ? grid.querySelectorAll("img") : []);
  check("vsaka kartica ima fotografijo", imgs.length === 4, "slik: " + imgs.length);
  check("vse slike so krajevne (slike/pokoncna/) — brez egress",
    imgs.length === 4 && imgs.every((im) => /^slike\/pokoncna\/[a-z0-9-]+\.jpg$/.test(im.getAttribute("src") || "")),
    imgs.map((im) => im.getAttribute("src")).join(", "));
  check("alt besedila so izpolnjena",
    imgs.length === 4 && imgs.every((im) => (im.getAttribute("alt") || "").length > 5));

  /* slike morajo obstajati na disku (PWA offline vsebina) */
  const filesOk = imgs.length === 4 && imgs.every((im) => fs.existsSync(path.join(root, im.getAttribute("src"))));
  check("vse4 slike obstajajo na disku", filesOk);

  const bodyTxt = grid ? grid.textContent : "";
  /* ---- 2) katalog: imena profilov in mere desk ---- */
  check("katalog: POLNA DESKA 57/32", bodyTxt.includes("POLNA DESKA 57/32"));
  check("katalog: POLNA DESKA 100", bodyTxt.includes("POLNA DESKA 100"));
  check("katalog: POLNA DESKA 128", bodyTxt.includes("POLNA DESKA 128"));
  check("katalog: ROMB DESKA 67", bodyTxt.includes("ROMB DESKA 67"));
  check("katalog: mere eksponata 5,7/3,2 cm · 5,8 m",
    bodyTxt.includes("5,7") && bodyTxt.includes("3,2") && bodyTxt.includes("5,8 m"));
  check("katalog: mere 10 cm · 5,8 m", bodyTxt.includes("10 cm") && bodyTxt.includes("5,8 m"));
  check("katalog: mere 12,8 cm · 2,2 m", bodyTxt.includes("12,8") && bodyTxt.includes("2,2 m"));
  check("katalog: mere ROMB 6,7 cm · 2,8 m", bodyTxt.includes("6,7") && bodyTxt.includes("2,8 m"));

  /* uvodno besedilo navaja vse4 profile */
  const intro = grid && grid.parentElement ? grid.parentElement.textContent : "";
  check("uvod navaja 4 profile (57/32, 100, 128, ROMB 67)",
    ["57/32", "POLNA DESKA 100", "POLNA DESKA 128", "ROMB DESKA 67"].every((s) => intro.includes(s)));

  /* ---- 3) registarska povezava (ključi kartic ↔ WC) ---- */
  const keys = Array.from(cards).map((c) => c.getAttribute("data-refkey"));
  check("ključi kartic soveljavljajo z WC registrom",
    keys.length === 4 && keys.every((k) => !!window.WC[k]), keys.join(","));
  check("ključi kartic zajemajo vse4 katalogske profile",
    ["polna57", "polna100", "polna128", "romb67"].every((k) => keys.indexOf(k) >= 0), keys.join(","));

  /* ---- 3b) register: omejitve usklajene s katalogom montaže ---- */
  const W = window.WC, RL = window.roksalLimit, RR = window.roksalRailLimit;
  check("register: polna100 stebri 1800 (H ≤ 1500) / 1500 (višje)",
    RL(W.polna100, "pokoncna", 1200).v === 1800 && RL(W.polna100, "pokoncna", 2000).v === 1500);
  check("register: polna128 stebri 1800 (H ≤ 1500)", RL(W.polna128, "pokoncna", 1200).v === 1800);
  check("register: romb67 stebri z L-kotniki 1450", RL(W.romb67, "pokoncna", 1200).v === 1450);
  check("register: polna57 stebri 1500 ne glede na višino", RL(W.polna57, "pokoncna", 2000).v === 1500);
  check("register: polna57 nosilci ≤ 1000 mm", RR(W.polna57) === 1000);
  check("register: polna128 dimenzija kataloga 128×16×2200", W.polna128.t === 16 && W.polna128.len === 2200);
  check("register: polna57 drill — vijak 2/3 globine, luknja v WPC manjša od vijaka",
    /2\/3/.test(W.polna57.drill) && /manjša/.test(W.polna57.drill) && /večja/.test(W.polna57.drill));
  check("register: romb67 — obvezna alu cev (fix + drill)",
    /ni mogoča/.test(W.romb67.fix) && /alu cev/.test(W.romb67.drill));
  check("register: polna100 drill — večja luknja v kovinsko cev", /kovinsko cev/.test(W.polna100.drill));

  /* ---- 4) nalaganje profila prek klikа ---- */
  const card128 = Array.from(cards).find((c) => c.getAttribute("data-refkey") === "polna128");
  check("kartica POLNA DESKA 128 obstaja", !!card128);
  if (card128) {
    card128.click();
    check("klik: uporaba = pokončna ograja", $("sysUse").value === "pokoncna", $("sysUse").value);
    check("klik: profil = polna128", $("sysProfile").value === "polna128", $("sysProfile").value);
    check("klik: applySystem nastavi širino iz registra (128 mm)", $("sw").value === "128", $("sw").value);
    check("klik: applySystem nastavi debelino iz registra (16 mm — katalog 128×16×2200)", $("st").value === "16", $("st").value);
    check("klik: modal galerije zaprt", !$("tmplOverlay").classList.contains("on"));
    check("klik: risba generirana", !!document.querySelector("#prev svg"));
    check("klik: število desk čez L je smiselno (≥ 2)",
      Number($("n").value) >= 2, "n=" + $("n").value);
  }

  const cardRomb = Array.from(cards).find((c) => c.getAttribute("data-refkey") === "romb67");
  if (cardRomb) {
    window.openTemplates();
    cardRomb.click();
    check("klik ROMB kartice: profil = romb67", $("sysProfile").value === "romb67", $("sysProfile").value);
    check("klik ROMB kartice: širina 67 mm", $("sw").value === "67", $("sw").value);
    check("klik ROMB kartice: uporaba = pokončna ograja", $("sysUse").value === "pokoncna", $("sysUse").value);
  }

  /* ---- 5) EN pariteta ---- */
  $("langBtn").click();
  check("EN: html lang=en", document.documentElement.getAttribute("lang") === "en");
  const gridEn = $("refGrid");
  const enTxt = gridEn ? gridEn.textContent : "";
  const sectTxt = gridEn && gridEn.parentElement ? gridEn.parentElement.textContent : "";
  check("EN: naslov sekcije preveden (ref_h)",
    sectTxt.includes("vertical fences"), sectTxt.slice(0, 120));
  check("EN: opisi eksponatov prevedeni (ref_c1..4)",
    enTxt.includes("Exhibit fence") && enTxt.includes("5.7 or 3.2 cm") &&
    enTxt.includes("10 cm wide") && enTxt.includes("12.8 cm wide") && enTxt.includes("ROMB-profile"),
    enTxt.slice(0, 160));
  check("EN: imena profilov ostanejo katalogska (POLNA DESKA 57/32)",
    enTxt.includes("POLNA DESKA 57/32"));

  $("langBtn").click();
  const slTxt = $("refGrid") ? $("refGrid").textContent : "";
  check("povratek v SL: opisi spet slovensko",
    slTxt.includes("Eksponat ograje") && slTxt.includes("5,7") && slTxt.includes("Ograjne deske profila ROMB"),
    slTxt.slice(0, 160));
  check("povratek v SL: html lang=sl", document.documentElement.getAttribute("lang") === "sl");

  /* ---- 5b) EN pariteta kataloga ---- */
  $("langBtn").click();
  const catEn = $("tmplOverlay").textContent;
  check("EN: pritrjevanje prevedeno",
    catEn.includes("Board fixing characteristics") && catEn.includes("Minimum screw distance from the cut edge is 3 cm"));
  check("EN: elementi prevedeni",
    catEn.includes("Elements for WoodCore WPC fences") && catEn.includes("intended for vertical fences only"));
  check("EN: opozorilo ROMB prevedeno",
    catEn.includes("without the aluminium tube is impossible") && catEn.includes("included in the price"));
  check("EN: palete in skladiščenje prevedena",
    catEn.includes("Colour options") && catEn.includes("complaints will not be accepted"));
  check("EN: povpraševanje prevedeno", catEn.includes("For a free quote"));
  check("EN: terase prevedeno (PDF navodila)",
    catEn.includes("Terrace boards — installation instructions") && catEn.includes("not structural elements") && catEn.includes("void the warranty") && catEn.includes("freezing water inside the board can crack it"));
  $("langBtn").click();
  const catSl = $("tmplOverlay").textContent;
  check("povratek v SL: katalog spet slovensko",
    catSl.includes("Značilnosti pritrjevanja") && catSl.includes("reklamacija ne upošteva") && catSl.includes("Skladiščenje"));

  /* ---- 6) dostopnost kartic ---- */
  const allNamed = cards.length === 4 && Array.from(cards).every((c) => {
    const al = (c.getAttribute("aria-label") || "").trim();
    return al.length > 0 || (c.textContent || "").trim().length > 0;
  });
  check("vse kartice imajo dostopno ime", allNamed);

  /* ---- 6b) katalog: pritrjevanje, elementi, palete, skladiščenje ---- */
  const cat = $("tmplOverlay").textContent;
  check("katalog: naslov pritrjevanja", cat.includes("Značilnosti pritrjevanja desk na konstrukcijo"));
  check("katalog: splošna pravila vijakov (3 cm / 15 cm / 10 cm)",
    cat.includes("Minimalen odmik vijaka od roba reza je 3 cm") && cat.includes("15 cm") && cat.includes("10 cm"));
  check("katalog: 57/32 — vijak 2/3 globine, luknja manjša v WPC",
    cat.includes("2/3 globine profila") && cat.includes("manjša od vijaka"));
  check("katalog: 57/32 — stebri 150 cm, nosilci 100 cm",
    cat.includes("150 cm ne glede na višino") && cat.includes("nosilci je 100 cm"));
  check("katalog: 100/128 — reža 0,5–3 cm in prekrivanje",
    cat.includes("0,5–3 cm") && cat.includes("prekrivanje desk"));
  check("katalog: 100/128 — stebri 180/150 cm in vijačenje iz lica",
    cat.includes("180 cm") && cat.includes("obvezno je vijačenje iz lica"));
  check("katalog: ROMB — stebri 145 cm, primer vrtanja 3,9 → 3,2 → 4,2–4,5",
    cat.includes("145 cm") && cat.includes("4,2–4,5"));
  check("katalog: ROMB — OPOZORILO brez alu cevi ni mogoča",
    cat.includes("brez aluminijaste cevi ni mogoča") && cat.includes("vključena v ceno"));
  check("katalog: elementi — dimenzije vseh elementov",
    ["57 × 32 × 5800", "100 × 12 × 5800", "128 × 16 × 2200", "67 × 26 × 5800", "95 × 45 × 5800", "92 × 45 × 5800", "55 × 30"].every((d) => cat.includes(d)));
  check("katalog: elementi — polna100 samo za pokončno, romb Z ALU CEVJO",
    cat.includes("samo za pokončno ograjo") && cat.includes("Z ALU CEVJO"));
  check("katalog: elementi — čepi, ročaj WHITE in brez samostojne prodaje",
    cat.includes("Levi in desni čep") && cat.includes("WHITE odtenku") && cat.includes("samostojna prodaja ročajev ni možna"));
  check("katalog: palete 4/8/6/7 barv",
    ["4 barve", "8 barv", "6 barv", "7 barv"].every((t) => cat.includes(t)));
  check("katalog: skladiščenje — reklamacija ob neustreznem",
    cat.includes("reklamacija ne upošteva"));
  check("katalog: povpraševanje — info@roksal.com kot besedilo (brez zunanje povezave)",
    cat.includes("info@roksal.com") && !$("tmplOverlay").querySelector('a[href^="mailto"], a[href^="http"]'));
  check("katalog: terase — naslov in strukturno opozorilo (PDF)",
    cat.includes("Terasne deske — navodila za montažo") && cat.includes("niso konstrukcijski element") && cat.includes("izniči garancijo"));
  check("katalog: terase — podlaga (1 cm/m, 100 mm zemlje, beton ≥ 6 cm)",
    cat.includes("1 cm/m") && cat.includes("100 mm zemlje") && cat.includes("betonsko ploščo (debelina ≥ 6 cm)"));
  check("katalog: terase — letve 30–35 cm, točkovno do 60 cm, turbo 6,7×80",
    cat.includes("30–35 cm med letvami") && cat.includes("do 60 cm") && cat.includes("6,7×80 mm"));
  check("katalog: terase — predvrtanje WPC letvi (luknja manjša + grezilo)",
    cat.includes("luknjo manjšo od vijaka") && cat.includes("letev lahko poči"));
  check("katalog: terase — izmenično polaganje, dve letvi pri spoju",
    cat.includes("2,2+1,1 m") && cat.includes("vedno dve letvi"));
  check("katalog: terase — reže 5–6 mm + dilatacija, stene ≥ 6 mm",
    cat.includes("5–6 mm") && cat.includes("do cca 10 mm na 4 m") && cat.includes("vseh sten ≥ 6 mm"));
  check("katalog: terase — L letev ≤ 2 m / 30 cm, rez 30°, odvodne Ø4,2 mm",
    cat.includes("≤ 2 m") && cat.includes("vsakih 30 cm") && cat.includes("kotom 30°") && cat.includes("Ø4,2 mm") && cat.includes("zmrznjena voda"));

  const fixImgs = Array.from(document.querySelectorAll('#tmplOverlay img[src^="slike/"]'));
  check("vse katalogske slike so krajevne", fixImgs.every((im) => /^slike\/pokoncna\/[a-z0-9-]+\.jpg$/.test(im.getAttribute("src") || "")));
  check("vse katalogske slike obstajajo na disku",
    fixImgs.length >= 17 && fixImgs.every((im) => fs.existsSync(path.join(root, im.getAttribute("src")))), fixImgs.length + " slik");
  const swAll = read("sw.js");
  check("sw.js predpomni vse katalogske slike (offline)",
    fixImgs.every((im) => swAll.includes('"' + "./" + im.getAttribute("src") + '"')));

  /* ---- 7) SW predpomnilnik vsebuje fotografije (offline galerija) ---- */
  const sw = read("sw.js");
  const swOk = imgs.length === 4 && imgs.every((im) => sw.includes('"' + "./" + im.getAttribute("src") + '"') || sw.includes('"' + im.getAttribute("src") + '"'));
  check("sw.js predpomni vse4 reference (offline)", swOk);

  /* ---- 8) brez JS napak ---- */
  check("brez JS napak", errors.length === 0, errors[0] || "brez napak");

  console.log(`\nReference galerija: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("Surov se je sesul: " + e.stack); process.exit(1); });
