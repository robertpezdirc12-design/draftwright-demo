/**
 * Regresijski testi za preostali UI vrzeli iz docs/review-2026-11-23.md:
 *   P2 — delno color-only signalizacija napak (brez ikone/predpone, brez aria-invalid)
 *   P1 — dotikova področja pod 44 px v mobilnem media queryju (38 px)
 *
 * Test poganja pravo aplikacijo prek jsdom in ne spreminja repozitorija.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    w.URL.revokeObjectURL = () => {};
    w.URL.createObjectURL = () => "blob:test";
    w.HTMLAnchorElement.prototype.click = function () {};
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
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
  check("checks() je izvožena za neposredno validacijo", typeof window.checks === "function");

  /* --- ne-barvna oznaka v CSS: ikona poleg rdečega roba --- */
  const invalidRule = (html.match(/input\.invalid,select\.invalid[^{]*\{[^}]*\}/) || [""])[0];
  check("CSS: ikona velja tudi za polja z aria-invalid brez class invalid",
    invalidRule.includes("input[data-dw-invalid]") && invalidRule.includes("select[data-dw-invalid]"));
  check("CSS: invalid polje ima SVG opozorilno ikono (ne le barvo)",
    invalidRule.includes("background-image:url(\"data:image/svg+xml,") &&
    invalidRule.includes("background-repeat:no-repeat") &&
    invalidRule.includes("background-position:right"));
  check("CSS: ikona je neodvisna od teme (lastna barva v SVG)", /fill='%23[0-9a-f]{6}'/i.test(invalidRule));

  /* --- dinamična validacija --- */
  const L = $("L");
  const original = L.value;
  if (typeof window.checks === "function") {
    L.value = "0";
    window.checks();
  }
  const warnText = $("checks").textContent || "";
  check("warnbox: opozorilo ima ⚠ predpono (vidno brez barve)", warnText.startsWith("⚠ "), warnText.slice(0, 60));
  check("warnbox: vsebuje besedilo napake", warnText.includes("Mere L, H in D morajo biti pozitivne."));
  check("aria-invalid: polje z napako ga ima", L.getAttribute("aria-invalid") === "true",
    String(L.getAttribute("aria-invalid")));
  check("aria-invalid: sledljiva oznaka za čiščenje", L.getAttribute("data-dw-invalid") === "1",
    String(L.getAttribute("data-dw-invalid")));
  check("err-tray: opozorilo ostaja klikljivo do polja",
    !!$("errTray").querySelector('.et-item[data-field="L"]'));

  /* Popravek vrednosti sproži document-level input → checks() brez eksplicitnega klica. */
  L.value = original;
  L.dispatchEvent(new window.Event("input", { bubbles: true }));
  check("input: popravek polja takoj odstrani aria-invalid", !L.hasAttribute("aria-invalid"),
    String(L.getAttribute("aria-invalid")));
  check("input: popravek polja skrije warnbox", !$("checks").classList.contains("on"),
    $("checks").className);

  /* Skupno sporočilo za L/H/D mora označiti res neveljavno dimenzijo, ne vedno L. */
  const H = $("H"), hOriginal = H.value;
  H.value = "0";
  if (typeof window.checks === "function") window.checks();
  check("H neveljavna → aria-invalid na H", H.getAttribute("aria-invalid") === "true",
    String(H.getAttribute("aria-invalid")));
  check("H neveljavna → L ostane brez aria-invalid", !L.hasAttribute("aria-invalid"),
    String(L.getAttribute("aria-invalid")));
  H.value = hOriginal;
  if (typeof window.checks === "function") window.checks();

  const D = $("D"), dOriginal = D.value;
  D.value = "0";
  if (typeof window.checks === "function") window.checks();
  check("D neveljavna → aria-invalid na D", D.getAttribute("aria-invalid") === "true",
    String(D.getAttribute("aria-invalid")));
  check("D neveljavna → L in H ostaneta brez aria-invalid",
    !L.hasAttribute("aria-invalid") && !H.hasAttribute("aria-invalid"));
  D.value = dOriginal;
  if (typeof window.checks === "function") window.checks();

  /* Svetovalno opozorilo za veljavno izbiro podlage ne sme pomeniti neveljavnega polja. */
  const use = $("sysUse"), sub = $("subType"), useOriginal = use.value, subOriginal = sub.value;
  use.value = "terasa";
  sub.value = "plocice";
  if (typeof window.checks === "function") window.checks();
  check("svetovalno opozorilo ostane vidno v warnboxu",
    ($("checks").textContent || "").includes("Ploščice"));
  check("svetovalno opozorilo ne označi veljavnega polja z aria-invalid",
    !sub.hasAttribute("aria-invalid"), String(sub.getAttribute("aria-invalid")));
  check("pesek ni svetovalen — nepripravljiva podlaga označi polje",
    (() => {
      sub.value = "pesek";
      if (typeof window.checks === "function") window.checks();
      return sub.getAttribute("aria-invalid") === "true";
    })());

  const mount = $("mountType"), mountOriginal = mount.value;
  use.value = "fasada";
  mount.value = "kovinska konstrukcija";
  if (typeof window.checks === "function") window.checks();
  check("mountType: svetovalno opozorilo ostane vidno",
    ($("checks").textContent || "").includes("Obstoječa kovinska konstrukcija"));
  check("mountType: svetovalno opozorilo ne označi polja z aria-invalid",
    !mount.hasAttribute("aria-invalid"), String(mount.getAttribute("aria-invalid")));

  use.value = useOriginal;
  sub.value = subOriginal;
  mount.value = mountOriginal;
  if (typeof window.checks === "function") window.checks();

  /* --- dotikova področja --- */
  const mobile = (html.match(/@media\(max-width:760px\)\{[\s\S]*?\n\}/) || [""])[0];
  check("mobil: gumbi in menijske postavke vsaj 44 px",
    mobile.includes(".btn,.mi,.show-aside-handle,.exp-cancel,.exp-go,.primarybar,.menu>button{min-height:44px;min-width:44px}"));
  check("mobil: ročaj predala in gumb traka napak vsaj 44 px",
    mobile.includes(".err-tray .et-toggle{") && mobile.includes("min-width:44px") &&
    mobile.includes("min-height:44px"));
  check("mobil: stara 38 px vrednost odstranjena", !mobile.includes("min-height:38px"));

  check("brez JS napak", errors.length === 0, errors.join(" | "));
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ""}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
