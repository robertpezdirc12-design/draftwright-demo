/**
 * Issue #41 §3.D — varnost/podatki/PWA: dokaz, da aplikacija NE pošilja
 * fotografij ali podatkov na zunanje strežnike (egress audit).
 *
 * Poganja pravo aplikacijo prek jsdom + statično preverja vir, da ujetje:
 *   - vsakega novega egress klicanja (fetch/XHR/WebSocket/sendBeacon/EventSource),
 *   - vsake novih senzorskih virov (getUserMedia/camera, geolocation, mikrofon ...),
 *   - odstranitve izključitve fotografije iz skupnih povezav (#p= / view-link),
 *   - zunanjih <a href>/<img src> (poleg SVG imenskih prostorov),
 *   - odstranitve samega izvora v sw.js (SW sme prestrezati samo isti izvor),
 *   - ohlapitve CSP connect-src.
 * Vsaka trditev bi na kodi z egress regresijo PADO — zato je pravilna ovira.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const html = read("tehnicka-risba-pro.html");
const sw = read("sw.js");
const cspTest = read("tests/csp.test.js"); // ni nujno, a potrdi, da CSP test obstaja

let pass = 0, fail = 0, errors = [];
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* ---- jsdom: aplikacija se naloži brez JS napak (evidence, da egress ni skrit v runtime) ---- */
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; }, fillRect() {}, measureText(t){return {width:t.length}} };
    };
    window.URL.createObjectURL = () => "blob:mem";
    window.URL.revokeObjectURL = () => {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

/* ============ 1) edini egress je lokalni vendor-tresni (same-origin, predpomnjen) ============ */
const fetchSites = [...html.matchAll(/fetch\s*\(\s*([^)]*)/g)].map((m) => m[1]);
check("aplikacija ima RAVNO 1 fetch() klic", fetchSites.length === 1, "najdeno: " + fetchSites.length);
check("ta fetch je lokalni vendor font (relative, same-origin)", fetchSites.length === 1 && /"vendor\/LiberationSans-Regular\.ttf"|'vendor\/LiberationSans-Regular\.ttf'/.test(fetchSites[0]), fetchSites[0]);

/* ============ 2) nobenih drugih egress / senzorjev ============ */
const banned = /XMLHttpRequest|new WebSocket|navigator\.sendBeacon|EventSource|navigator\.getUserMedia|navigator\.geolocation|navigator\.mediaDevices|navigator\.getBattery|navigator\.bluetooth|navigator\.usb\b|navigator\.serial|navigator\.deviceMemory|navigator\.share\b/;
check("nobene XHR/WebSocket/sendBeacon/EventSource", !/XMLHttpRequest|new WebSocket|navigator\.sendBeacon|EventSource/.test(html));
check("nobene senzorskega vira (kamera/mikrofon/lokacija/baterija/BLE/USB/serial)", !/navigator\.(getUserMedia|geolocation|mediaDevices|getBattery|bluetooth|usb|serial|deviceMemory)/.test(html));

/* ============ 3) skupni povezavi NE vsebujeta fotografije ============ */
// prjSnapshot: eksplicitno null-ira photo (oboj ravno + vnotranje).
const snapSrc = (html.match(/function prjSnapshot\(\)\{[\s\S]*?\n\}/) || [""])[0];
check("prjSnapshot nullira photo (d.photo=null)", /d\.photo=null/.test(snapSrc));
check("prjSnapshot nullira vnotranje data.photo (d.data.photo=null)", /d\.data\.photo=null/.test(snapSrc));
// prjViewPayload: BELI seznam polj — "photo" NI v njem.
const viewSrc = (html.match(/function prjViewPayload\(\)\{[\s\S]*?\n\}/) || [""])[0];
const viewListsPhoto = /["']photo["']/.test(viewSrc);
check("prjViewPayload (view-link) NE vsebuje 'photo' polja (beli seznam)", viewSrc.length > 0 && !viewListsPhoto, viewSrc.slice(0, 80));

/* ============ 4) nobenih zunanjih <a href>/<img src> ============ */
// zunanji URI, ki NI SVG imenski prostor.
const externalRefs = [...html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/g)]
  .map((m) => m[1])
  .filter((u) => /^https?:/i.test(u) && !/w3\.org/i.test(u));
check("nobenega zunanje <a href>/<img src> (poleg SVG namespace)", externalRefs.length === 0, externalRefs.join(", "));

/* ============ 5) SW prestreža SAMO isti izvor ============ */
check("sw.js: zunanji izvir ne prestreže (url.origin !== self.location.origin → return)", /url\.origin\s*!==\s*self\.location\.origin/.test(sw));

/* ============ 6) CSP connect-src blokira katerikoli runtime egress ============ */
const cspMeta = (html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/) || [,""])[1] || "";
check("CSP: connect-src samo 'self' (brez zunanji fetch/XHR)", /connect-src\s+'self'/.test(cspMeta), cspMeta.split(";").find((s) => s.startsWith("connect-src")) || "ni connect-src");

/* ============ runtime: aplikacija se naloži brez JS napak ============ */
check("jsdom: aplikacija se naloži brez JS napak (egress ni skrit v runtime)", errors.length === 0, errors.join(" | "));

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ""}`);
process.exit(fail ? 1 : 0);
