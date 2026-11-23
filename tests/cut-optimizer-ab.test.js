/**
 * DEV-ONLY A/B benchmark (not part of `npm test`): compares the app's production
 * cut optimiser with the MIT-licensed `maxrects-packer` on real DOM-driven
 * scenarios. Run with: npm run bench:cut
 *
 * It never modifies the app. Metric: total purchased stock length (mm), which is
 * comparable across different stock lengths; board count is reported as context.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { MaxRectsPacker } = require("maxrects-packer");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");
const libPkg = JSON.parse(fs.readFileSync(path.join(root, "node_modules", "maxrects-packer", "package.json"), "utf8"));
const errors = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, a, b) { return { data: new Uint8ClampedArray(a * b * 4) }; } };
    };
    w.URL.revokeObjectURL = () => {};
    w.HTMLAnchorElement.prototype.click = function () {};
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const w = dom.window;
const $ = (id) => w.document.getElementById(id);

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log("  [PASS] " + name + (info ? " — " + info : "")); }
  else { fail++; console.error("  [FAIL] " + name + (info ? " — " + info : "")); }
}
function set(id, v) { $(id).value = String(v); }

function appScenario(c) {
  set("sysUse", "precna"); set("L", c.L); set("n", c.n); set("w2", c.w2);
  set("stockLen", c.stocks.join("; ")); set("kerf", c.kerf);
  $("buildCut").click();
  const text = $("cutOut").textContent;
  const m = text.match(/nabava (\d+) desk · poraba ([\d.]+) m · odpad ([\d.]+) m · izkoristek (\d+)%/);
  if (!m) return null;
  return { boards: +m[1], used: Math.round(+m[2] * 1000), waste: Math.round(+m[3] * 1000), yield: +m[4], text };
}

function pieces(c) {
  const out = [];
  for (let i = 0; i < c.n; i++) out.push({ len: c.L });
  if (c.w2 > 0) for (let i = 0; i < c.n; i++) out.push({ len: c.w2 });
  return out;
}

function packOne(piecesList, stocks, kerf, smart) {
  /* Pack with the widest available stock, then price each bin with the
     smallest purchased stock that fits it. This lets MaxRects mix stock
     lengths exactly like the production optimizer (buildCut/optimizeMulti). */
  const maxStock = Math.max.apply(null, stocks);
  const packer = new MaxRectsPacker(maxStock, 1, kerf, { smart, pot: false, square: false, allowRotation: false });
  packer.addArray(piecesList.map((p, i) => ({ width: p.len, height: 1, name: "p" + i })));
  const bins = packer.bins.filter((b) => b.rects.length);
  if (bins.reduce((a, b) => a + b.rects.length, 0) !== piecesList.length) return null; // unfilled → not comparable

  const sorted = stocks.slice().sort((a, b) => a - b);
  const assigned = [], spans = [];
  for (let i = 0; i < bins.length; i++) {
    const span = Math.max.apply(null, bins[i].rects.map((r) => r.x + r.width));
    const fit = sorted.filter((s) => s + 1e-6 >= span)[0];
    if (!fit || bins[i].rects.some((r) => r.x + r.width > fit + 1e-6)) return null;
    assigned.push(fit);
    spans.push(span);
  }
  const purchased = assigned.reduce((a, b) => a + b, 0);
  const pieceLen = piecesList.reduce((a, p) => a + p.len, 0);
  const kerfCost = Math.max(0, piecesList.length - bins.length) * kerf;
  const waste = Math.max(0, purchased - pieceLen - kerfCost);
  return { assigned, spans, boards: bins.length, used: purchased, waste,
    yield: purchased ? Math.round((1 - waste / purchased) * 100) : 0 };
}

function maxRectsMixed(piecesList, stocks, kerf) {
  /* Give the challenger the same freedom the production optimiser has:
     try both placement strategies and three piece orderings, keep the best. */
  const orders = [
    piecesList.slice(),
    piecesList.slice().sort((a, b) => b.len - a.len),
    piecesList.slice().sort((a, b) => a.len - b.len),
  ];
  const plans = [];
  [true, false].forEach((smart) => orders.forEach((order) => {
    const plan = packOne(order, stocks, kerf, smart);
    if (plan) plans.push(plan);
  }));
  plans.sort((a, b) => a.used - b.used || a.boards - b.boards || a.waste - b.waste);
  return plans[0] || null;
}

const scenarios = [
  { name: "enodolžinsko (DP optimum)", L: 4000, n: 10, w2: 0, stocks: [5800, 4000, 2200], kerf: 3 },
  { name: "dve dolžini (4000 + 1200)", L: 4000, n: 10, w2: 1200, stocks: [5800, 4000, 2200], kerf: 3 },
  { name: "dve dolžini (2400 + 1100)", L: 2400, n: 12, w2: 1100, stocks: [5800, 4000, 2200], kerf: 3 },
];

check("benchmark library licence is MIT", libPkg.license === "MIT", libPkg.name + " " + libPkg.version);

const results = [];
scenarios.forEach((c) => {
  const app = appScenario(c);
  const mr = maxRectsMixed(pieces(c), c.stocks, c.kerf);
  check(c.name + ": app produced a cut plan", !!app, app ? app.boards + " boards / " + app.used + " mm" : "none");
  check(c.name + ": MaxRects packed all pieces", !!mr, mr ? mr.boards + " boards / " + mr.used + " mm" : "none");
  if (app && mr) {
    check(c.name + ": purchased stock equals assigned bins", mr.used === mr.assigned.reduce((a, b) => a + b, 0));
    check(c.name + ": every bin fits its assigned stock", mr.assigned.every((s, i) => s + 1e-6 >= mr.spans[i]));
    results.push({ name: c.name, app, mr });
    console.log("       app: " + app.used + " mm (" + app.boards + " boards); " +
      "MaxRects: " + mr.used + " mm (" + mr.boards + " bins: " + mr.assigned.join("+") + ")");
  }
});

check("single-length case matches the DP optimum", results[0] && results[0].app.used === results[0].mr.used,
  results[0] ? results[0].app.used + " / " + results[0].mr.used : "no result");
check("mixed 4000+1200: MaxRects buys less stock than current FFD", results[1] && results[1].mr.used < results[1].app.used,
  results[1] ? results[1].mr.used + " < " + results[1].app.used : "no result");
check("no JS errors during benchmark", errors.length === 0, errors.join("; "));

/* Deterministic broader sample (seeded LCG) — reporting only, no app changes. */
let seed = 20261123;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const batch = [];
for (let i = 0; i < 30; i++) {
  const c = {
    name: "sample-" + (i + 1),
    L: 800 + Math.floor(rnd() * 3700),
    n: 3 + Math.floor(rnd() * 38),
    w2: rnd() < 0.55 ? 0 : 400 + Math.floor(rnd() * 1600),
    stocks: [5800, 4000, 2200],
    kerf: 3,
  };
  const app = appScenario(c);
  const mr = maxRectsMixed(pieces(c), c.stocks, c.kerf);
  if (!app || !mr || /ni mogoče izrezati/.test(app.text)) continue;
  batch.push({ c, app, mr });
}
const better = batch.filter((r) => r.mr.used < r.app.used);
const equal = batch.filter((r) => r.mr.used === r.app.used);
const worse = batch.filter((r) => r.mr.used > r.app.used);
const saved = batch.reduce((a, r) => a + (r.app.used - r.mr.used), 0);
console.log("\n  Broad sample: " + batch.length + " comparable cases — MaxRects better " + better.length +
  ", equal " + equal.length + ", worse " + worse.length + "; net stock saved " + (saved / 1000).toFixed(1) + " m");
if (better.length) {
  const top = better.slice().sort((a, b) => (b.app.used - b.mr.used) - (a.app.used - a.mr.used))[0];
  console.log("  Largest win: " + top.c.L + "×" + top.c.n + " + W2 " + top.c.w2 +
    " — " + top.app.used + " mm → " + top.mr.used + " mm (" + Math.round((1 - top.mr.used / top.app.used) * 100) + "%)");
}
if (worse.length) {
  const topWorse = worse.slice().sort((a, b) => (b.mr.used - b.app.used) - (a.mr.used - a.app.used))[0];
  console.log("  Largest regression: " + topWorse.c.L + "×" + topWorse.c.n + " + W2 " + topWorse.c.w2 +
    " — " + topWorse.app.used + " mm → " + topWorse.mr.used + " mm (+" +
    Math.round((topWorse.mr.used / topWorse.app.used - 1) * 100) + "%)");
}
check("broad sample ran without JS errors", errors.length === 0, errors.join("; "));

console.log("\n  Rezultat: " + pass + " OK, " + fail + " FAIL");
process.exit(fail ? 1 : 0);
