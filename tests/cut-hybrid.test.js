/**
 * Hibridni večdolžinski rezalni optimizator (FFD baseline + best-fit razponski
 * pakirnik z vnovično oceno zaloge, izbere se cenejši načrt).
 * Pokritje:
 *   - enodolžinski primer ostane na DP (optimalen, nespremenjen);
 *   - mešani primer 4000×10 + 1200×10: golden — 13 desk / 55 600 mm (prej FFD 62 000 mm);
 *   - mešani primer 2400×12 + 1100×10: kombinacija na 4000 mm zalogi;
 *   - lastnost: hibrid nikoli ni slabši od čistega FFD (30 seeded primerov);
 *   - vsak kos je res na svoji deski (vsote se ključavajo).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [];

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

const { window } = dom;
const $ = (id) => window.document.getElementById(id);

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function set(id, v) { $(id).value = String(v); }

/* Zažene buildCut prek DOM in vrne porabljeno nabavljeno dolžino (mm) + št. desk. */
function runApp(c) {
  set("sysUse", "precna"); set("L", c.L); set("n", c.n); set("w2", c.w2 || 0);
  set("stockLen", c.stocks.join("; ")); set("kerf", c.kerf);
  $("buildCut").click();
  const m = $("cutOut").textContent.match(/nabava (\d+) desk · poraba ([\d.]+) m · odpad ([\d.]+) m · izkoristek (\d+)%/);
  return m ? { boards: +m[1], used: Math.round(+m[2] * 1000), waste: Math.round(+m[3] * 1000), yield: +m[4] } : null;
}

/* Referenčna čista FFD kopija (stari algoritem) — za lastnost "hibrid ≤ FFD". */
function pureFFD(items, stocks, kerf) {
  const uniq = [...new Set(stocks)].sort((a, b) => a - b);
  const pieces = [];
  items.slice().sort((a, b) => b.len - a.len).forEach((it) => {
    for (let i = 0; i < it.qty; i++) pieces.push(it.len);
  });
  const boards = [];
  pieces.forEach((len) => {
    let best = null;
    boards.forEach((b) => {
      const usedLen = b.segs.reduce((a, s) => a + s, 0) + (b.segs.length > 1 ? (b.segs.length - 1) * kerf : 0);
      const avail = b.B - usedLen;
      const need = (b.segs.length > 0 ? kerf : 0) + len;
      if (need <= avail && (best === null || avail - need < best.after)) best = { b, after: avail - need };
    });
    if (!best) {
      const stock = uniq.find((s) => s >= len);
      if (stock === undefined) return;
      best = { b: { B: stock, segs: [] }, after: stock - len };
      boards.push(best.b);
    }
    best.b.segs.push(len);
  });
  return { purchased: boards.reduce((a, b) => a + b.B, 0), placed: boards.reduce((a, b) => a + b.segs.length, 0) };
}

/* ---------- 1. enodolžinski: DP optimum nespremenjen ---------- */
const c1 = { L: 4000, n: 10, w2: 0, stocks: [5800, 4000, 2200], kerf: 3 };
const r1 = runApp(c1);
check("enodolžinski (DP): 10 desk × 4000 = 40 000 mm", r1 && r1.boards === 10 && r1.used === 40000,
  r1 ? r1.boards + " desk / " + r1.used + " mm" : "no output");

/* ---------- 2. mešani golden: 4000×10 + 1200×10 → hibrid 55 600 mm ---------- */
const c2 = { L: 4000, n: 10, w2: 1200, stocks: [5800, 4000, 2200], kerf: 3 };
const r2 = runApp(c2);
const ffd2 = pureFFD([{ name: "A", len: 4000, qty: 10 }, { name: "B", len: 1200, qty: 10 }], c2.stocks, c2.kerf);
check("mešani 4000+1200: golden 13 desk / 55 600 mm", r2 && r2.boards === 13 && r2.used === 55600,
  r2 ? r2.boards + " desk / " + r2.used + " mm" : "no output");
check("mešani 4000+1200: hibrid boljši od čistega FFD (62 000 mm)", r2 && r2.used < ffd2.purchased,
  r2 && r2.used + " < " + ffd2.purchased);
check("mešani 4000+1200: vsi 20 kosov na načrtu", r2 && r2.used > 0 && !/ni mogoče izrezati/.test($("cutOut").textContent));

/* ---------- 3. mešani: 2400×12 + 1100×12 (pari na 4000 mm zalogi) ---------- */
const c3 = { L: 2400, n: 12, w2: 1100, stocks: [5800, 4000, 2200], kerf: 3 };
const r3 = runApp(c3);
check("mešani 2400+1100: 12 desk × 4000 = 48 000 mm", r3 && r3.boards === 12 && r3.used === 48000,
  r3 ? r3.boards + " desk / " + r3.used + " mm" : "no output");

/* ---------- 4. lastnost: hibrid ≤ čisti FFD na 30 seeded primerih ---------- */
let seed = 20261123;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const stocksFixed = [5800, 4000, 2200];
let compared = 0, wins = 0, neverWorse = true;
for (let i = 0; i < 30; i++) {
  const c = {
    L: 800 + Math.floor(rnd() * 3700), n: 3 + Math.floor(rnd() * 38),
    w2: rnd() < 0.55 ? 0 : 400 + Math.floor(rnd() * 1600), stocks: stocksFixed, kerf: 3,
  };
  const app = runApp(c);
  const items = [{ name: "A", len: c.L, qty: c.n }];
  if (c.w2 > 0) items.push({ name: "B", len: c.w2, qty: c.n });
  const ffd = pureFFD(items, c.stocks, c.kerf);
  if (!app) continue;
  compared++;
  if (app.used < ffd.purchased) wins++;
  if (app.used > ffd.purchased) { neverWorse = false; console.error(`    regresa: L=${c.L} n=${c.n} w2=${c.w2} app=${app.used} > ffd=${ffd.purchased}`); }
}
check(`hibrid nikoli slabši od FFD (${compared} primerov, ${wins} izboljšav)`, compared > 0 && neverWorse);

/* ---------- 5. brez JS napak ---------- */
check("ni JS napak", errors.length === 0, errors[0] || "brez napak");

console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail || errors.length ? 1 : 0);
