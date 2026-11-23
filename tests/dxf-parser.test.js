/**
 * Independent DXF validation using the MIT-licensed `dxf-parser` (dev only).
 * The app itself stays zero-build and keeps its own writer; this test proves
 * the emitted DXF is readable by a third-party implementation, not just by
 * our own string checks.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const Parser = require("dxf-parser");

const root = path.join(__dirname, "..");
const libPkg = JSON.parse(fs.readFileSync(path.join(root, "node_modules", "dxf-parser", "package.json"), "utf8"));
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");
const errors = [];
const blobs = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.URL.createObjectURL = (b) => { blobs.push(b); return "blob:test"; };
    window.HTMLAnchorElement.prototype.click = function () {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
const $ = (id) => window.document.getElementById(id);

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log("  [PASS] " + name + (info ? " — " + info : "")); }
  else { fail++; console.error("  [FAIL] " + name + (info ? " — " + info : "")); }
}

(async () => {
  check("validator licence is MIT", libPkg.license === "MIT", libPkg.name + " " + libPkg.version);

  $("gen").click();
  $("dlDxf").click();
  const blob = blobs[blobs.length - 1];
  check("DXF blob created", !!blob);
  const raw = Buffer.from(await blob.arrayBuffer()).toString("latin1");

  let parsed = null, parseError = "";
  try { parsed = new Parser().parseSync(raw); } catch (e) { parseError = e.message; }
  check("third-party parser reads our DXF", !!parsed, parseError);
  if (!parsed) { console.log("\n  Rezultat: " + pass + " OK, " + fail + " FAIL"); process.exit(1); }

  check("header declares AC1009 (R12)", parsed.header && parsed.header.$ACADVER === "AC1009", parsed.header && parsed.header.$ACADVER);
  const layers = parsed.tables && parsed.tables.layer && parsed.tables.layer.layers;
  check("layer table parsed", !!layers && Object.keys(layers).length >= 3, layers ? Object.keys(layers).join(", ") : "none");
  check("expected drawing layers exist", !!layers && ["GEOMETRIJA", "OSI", "TEKST"].every((n) => layers[n]),
    layers ? Object.keys(layers).join(", ") : "none");

  const ents = parsed.entities || [];
  check("entity list is non-trivial", ents.length > 100, ents.length + " entities");
  const types = {};
  ents.forEach((e) => { types[e.type] = (types[e.type] || 0) + 1; });
  check("LINE / TEXT / CIRCLE entities present", ["LINE", "TEXT", "CIRCLE"].every((t) => types[t] > 0), JSON.stringify(types));
  check("no unknown entity types", Object.keys(types).every((t) => ["LINE", "TEXT", "CIRCLE"].includes(t)), JSON.stringify(types));

  const geom = ents.filter((e) => e.type === "LINE");
  const finite = geom.every((e) => e.vertices && e.vertices.length === 2 &&
    e.vertices.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
  check("all LINE vertices are finite 2D points", finite);
  const inSheet = geom.every((e) => e.vertices.every((p) => p.x >= -0.01 && p.x <= 420.01 && p.y >= -0.01 && p.y <= 297.01));
  check("LINE coordinates stay on the A3 sheet", inSheet);

  const texts = ents.filter((e) => e.type === "TEXT");
  check("TEXT entities carry text", texts.length > 0 && texts.every((e) => typeof e.text === "string" && e.text.length > 0), texts.length + " texts");

  const rawCount = (kind) => (raw.match(new RegExp("(?:^|\\n)" + kind + "\\n", "g")) || []).length;
  check("parser LINE count matches raw DXF", rawCount("LINE") === types.LINE, rawCount("LINE") + " / " + types.LINE);
  check("parser TEXT count matches raw DXF", rawCount("TEXT") === types.TEXT, rawCount("TEXT") + " / " + types.TEXT);
  check("parser CIRCLE count matches raw DXF", rawCount("CIRCLE") === types.CIRCLE, rawCount("CIRCLE") + " / " + types.CIRCLE);
  check("no JS errors during export", errors.length === 0, errors.join("; "));

  console.log("\n  Rezultat: " + pass + " OK, " + fail + " FAIL");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
