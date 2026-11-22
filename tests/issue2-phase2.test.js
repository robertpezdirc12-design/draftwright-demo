/**
 * Faza 2 (Issue #2 §6, §9) — strukturni testi izvozov: DXF sloji/kodiranje/transliteracija,
 * STEP skupna topologija (8 oglišč/12 robov na solid, vsak rob 2 ORIENTED_EDGE) + stopnice,
 * spanParts točnost. (ezdxf/steputils neodvisna validacija: docs/validacija-izvozov.md)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { loadAppHtml } = require("./helpers/bootApp");

const html = loadAppHtml();
const errors = [];
const blobQueue = [];
let lastBlob = null;

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.URL.createObjectURL = (b) => { blobQueue.push(b); return "blob:test"; };
    window.HTMLAnchorElement.prototype.click = function () { lastBlob = blobQueue.pop(); };
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});

const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
const setField = (id, v) => { $(id).value = String(v); fire($(id), "input"); };

function pairs(txt) { // razčleni DXF/STEP parov (koda, vrednost)
  const l = txt.split("\n"), out = [];
  for (let i = 0; i + 1 < l.length; i += 2) out.push([l[i], l[i + 1]]);
  return out;
}

(async () => {
  // ---- DXF: sloji, kodiranje, transliteracija, DASHDOT uporaba ----
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change"); // opombe vsebujejo "razmak ≤ 1450"
  $("gen").click();
  $("dlDxf").click();
  const dxfBytes = new Uint8Array(await lastBlob.arrayBuffer());
  const dxf = Buffer.from(dxfBytes).toString("latin1"); // bajti → cp1250 znaki prek latin1
  check("DXF: tabela LAYER s 3 sloji", dxf.includes("GEOMETRIJA") && dxf.includes("OSI") && dxf.includes("TEKST"));
  check("DXF: besedila na sloju TEKST", dxf.includes("\n8\nTEKST\n"));
  check("DXF: OSI sloj uporablja DASHDOT", dxf.includes("8\nOSI") && dxf.includes("DASHDOT"));
  check("DXF: ≤ transliteriran v <=", dxf.includes("<=") && !dxf.includes("\u2264"));
  check("DXF: č/š/ž kot cp1250 bajti (0xE8/0x9A/0x9E), ni UTF-8 zaporedja 0xC4 0x8D", (() => {
    let has = false;
    for (let i = 0; i < dxfBytes.length - 1; i++) if (dxfBytes[i] === 0xC4 && dxfBytes[i + 1] === 0x8D) return false;
    for (let i = 0; i < dxfBytes.length; i++) if (dxfBytes[i] === 0xE8 || dxfBytes[i] === 0x9A || dxfBytes[i] === 0x9E) has = true;
    return has;
  })());

  // ---- STEP: skupna topologija ----
  $("dlStep").click();
  let step = await lastBlob.text();
  const refs = {};
  for (const [, id] of step.matchAll(/#(\d+)\s*=/g)) refs[id] = refs[id] || 0;
  // vsi #N napotki morajo obstajati
  const defs = new Set([...step.matchAll(/#(\d+)\s*=/g)].map((m) => m[1]));
  const dangling = [...step.matchAll(/#(\d+)(?!\s*=)/g)].map((m) => m[1]).filter((id) => !defs.has(id));
  check("STEP: brez nedoločenih referenc", dangling.length === 0, "npr. " + dangling.slice(0, 3).join(","));
  const solids = (step.match(/MANIFOLD_SOLID_BREP/g) || []).length;
  const vert = (step.match(/VERTEX_POINT/g) || []).length;
  const edge = (step.match(/EDGE_CURVE/g) || []).length;
  check("STEP: 8 VERTEX_POINT na solid", vert === solids * 8, vert + "/" + solids + " solidov");
  check("STEP: 12 EDGE_CURVE na solid", edge === solids * 12, edge + "/" + solids);
  // vsak EDGE_CURVE točno 2 ORIENTED_EDGE (manifold)
  const edgeRefs = {};
  for (const m of step.matchAll(/ORIENTED_EDGE\('',\*,\*,#(\d+),\.(T|F)\./g)) edgeRefs[m[1]] = (edgeRefs[m[1]] || 0) + 1;
  const badEdges = Object.entries(edgeRefs).filter(([, c]) => c !== 2);
  check("STEP: vsak rob točno 2 ORIENTED_EDGE", Object.keys(edgeRefs).length === solids * 12 && badEdges.length === 0, badEdges.slice(0, 3).join(","));
  // podvojitve oglišč: VERTEX_POINT = 8 × solide (prej 48/solid)
  check("STEP: brez podvojenih oglišč (prej 48/solid)", vert < solids * 12, vert + " < " + solids * 12);

  // ---- STEP stopnice: stepped reprezentacija ----
  $("sysUse").value = "stopniscna"; fire($("sysUse"), "change");
  setField("stN", 12); setField("stRise", 170);
  $("dlStep").click();
  let stair = await lastBlob.text();
  check("STEP stopnice: stepped infill (12 segmentov)", (stair.match(/Infill \(step\)/g) || []).length === 12);
  check("STEP stopnice: različen od klasičnega", stair !== step);
  check("STEP stopnice: iskren FILE_DESCRIPTION", stair.includes("Stepped stair infill approximation"));

  // ---- pogl. 4: spanParts točnost pri necelih mm (P3-7) ----
  // prek osi nosilcev na referenčnem listu: L=3800.5, np=4 → vsota razdelkov = 3800.5 (±0,05)
  $("sysUse").value = "precna"; fire($("sysUse"), "change");
  setField("L", "3800.5"); setField("np", "4");
  $("refMode").checked = true;
  $("gen").click();
  const txt = $("prev").textContent || "";
  const m = txt.match(/OSI NOSILCEV \(mm\): ([\d. /]+)/);
  check("spanParts: vsota razdelkov = L (±0,05)", !!m && (() => {
    const centers = m[1].trim().split(/ \/ /).map(Number);
    const parts = centers.slice(1).map((c, i) => c - centers[i]);
    return Math.abs(parts.reduce((a, b) => a + b, 0) - 3800.5) <= 0.05;
  })(), m ? m[1] : "ni osi");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
