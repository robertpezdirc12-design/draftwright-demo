/**
 * P3 — PWA + mobilna priprava — poganja `npm test`.
 * Pokritje: manifest.webmanifest (veljaven JSON, ikone, start_url, standalone),
 * sw.js (sintaksa, strategija stale-while-revalidate, omejitev na isti izvor),
 * ikone PNG (razsevnosti 192/512, pravi PNG podpis), meta oznake v HTML,
 * registracija SW samo prek https/localhost, mobilni CSS (@media 760: predal, dotiki).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");
const errors = [];

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

/* PNG razsevnosti iz IHDR (offset 16, big-endian) */
function pngSize(file) {
  const d = fs.readFileSync(file);
  if (!d.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return null;
  return { w: d.readUInt32BE(16), h: d.readUInt32BE(20) };
}

(async () => {
  /* 1) manifest */
  const mfPath = path.join(root, "manifest.webmanifest");
  check("manifest obstaja", fs.existsSync(mfPath));
  let mf = null;
  try { mf = JSON.parse(fs.readFileSync(mfPath, "utf8")); } catch (e) { /* zlom spodaj */ }
  check("manifest: veljaven JSON z ključi", !!mf && !!mf.name && !!mf.short_name && mf.display === "standalone" && !!mf.start_url && mf.lang === "sl");
  check("manifest: ikone 192 + 512", !!mf && mf.icons.some((i) => i.sizes === "192x192") && mf.icons.some((i) => i.sizes === "512x512") && mf.icons.some((i) => i.purpose === "maskable"));
  const barHex = ((html.match(/--bar:(#[0-9a-f]{3,6})/i) || [])[1] || "").toLowerCase();
  check("manifest: tema ujema aplikaciji (--bar)", !!mf && !!barHex && mf.theme_color === barHex && mf.background_color === barHex, barHex);

  /* 2) sw.js: sintaksa + vsebina */
  const swPath = path.join(root, "sw.js");
  check("sw.js obstaja", fs.existsSync(swPath));
  let swOk = true;
  try { new vm.Script(fs.readFileSync(swPath, "utf8"), { filename: "sw.js" }); } catch (e) { swOk = false; }
  check("sw.js: sintaksa veljavna", swOk);
  const sw = fs.existsSync(swPath) ? fs.readFileSync(swPath, "utf8") : "";
  check("sw.js: stale-while-revalidate (hit takoj, osvežitev v ozadju)", sw.includes("cache.match") && sw.includes("if (hit)") && sw.includes("cache.put"));
  check("sw.js: brez predpomniska + omrežna napaka → fallback na domov (ne undefined)", sw.includes('caches.match("./")') && !sw.includes("hit || net"));
  check("sw.js: samo isti izvor (GET)", sw.includes('e.request.method !== "GET"') && sw.includes("url.origin !== self.location.origin"));
  check("sw.js: čiščenje starih različic ob aktivaciji", sw.includes("caches.delete") && sw.includes("skipWaiting") && sw.includes("clients.claim"));

  /* 3) ikone */
  const i192 = pngSize(path.join(root, "icon-192.png")), i512 = pngSize(path.join(root, "icon-512.png"));
  check("ikone: PNG 192×192 in 512×512", !!i192 && i192.w === 192 && i192.h === 192 && !!i512 && i512.w === 512 && i512.h === 512);

  /* 4) HTML: meta oznake + registracija + mobilni CSS */
  const barColor = ((html.match(/--bar:(#[0-9a-f]{3,6})/i) || [])[1] || "").toLowerCase();
  check("HTML: link manifest + theme-color + apple-touch-icon", html.includes('rel="manifest" href="manifest.webmanifest"') && barColor && html.includes('name="theme-color" content="' + barColor + '"') && html.includes('rel="apple-touch-icon" href="icon-192.png"'));
  check("HTML: registracija SW varovana (https/localhost, catch)", html.includes('"serviceWorker" in navigator&&(window.location.protocol==="https:"||window.location.hostname==="localhost")') && /register\("sw\.js"\)\.catch/.test(html));
  check("HTML: mobilni predal @media 760 (aside fiksni + transform + dotiki)", html.includes("@media(max-width:760px)") && html.includes("body.aside-hidden aside{display:block;transform:translateX(-104%)}") && html.includes("min-height:44px"));

  /* 5) aplikacija se zažene brez JS napak (SW registracija varno preskočena v jsdom) */
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = function () {
        return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
      };
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = function () {};
      window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
    },
  });
  const { document } = dom.window;
  dom.window.document.getElementById("gen").click();
  check("aplikacija: generiranje deluje (brez JS napak)", !!document.querySelector("#prev svg") && errors.length === 0, errors.length ? errors.join(" | ") : "brez napak");
  check("aplikacija: SW NI registriran v jsdom (guard)", !("serviceWorker" in dom.window.navigator) || dom.window.navigator.serviceWorker.register === undefined);

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
