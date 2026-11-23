/**
 * Security regression: sketch elements restored from untrusted project JSON
 * (shared URL #p=, imported file, localStorage) must never reach SVG innerHTML raw.
 * Every check below boots the real HTML in jsdom, calls restoreProjectString()
 * and inspects the DOM produced by skRender()/tlrRender() — not helper functions.
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
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    window.URL.revokeObjectURL = () => {};
    window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function restoreData(data) {
  window.restoreProjectString(JSON.stringify({ schema: "draftwright-project", version: 3, data }));
}
function restore(elems) {
  restoreData({ sketch: { elems, paper: "A4", orient: "pokoncno", mreza: false } });
}
function restorePlan(plan) { restoreData({ plan }); }
function root(selector) { return window.document.querySelector(selector || "#skSvg"); }
function fireAll(nodes) {
  ["mouseover", "load", "focus", "begin", "click"].forEach((ev) => {
    nodes.forEach((n) => n.dispatchEvent(new window.Event(ev, { bubbles: true })));
  });
}
/* Real-DOM probe: re-render via setup(), then look for injected attributes,
   elements and live handlers on the actual parsed SVG subtree. */
function assertClean(label, setup, marker, selector) {
  window[marker] = 0;
  setup();
  const el = root(selector);
  const nodes = [el].concat([].slice.call(el.querySelectorAll("*")));
  let onAttr = "", tag = "", href = "";
  nodes.forEach((n) => {
    [].slice.call(n.attributes || []).forEach((a) => {
      const name = a.name.toLowerCase();
      if (name.indexOf("on") === 0) onAttr = onAttr || n.tagName + "@" + name;
      if (name === "href" || name === "xlink:href" || a.namespaceURI === "http://www.w3.org/1999/xlink")
        href = href || n.tagName + "@" + a.name;
    });
    const t = (n.tagName || "").toLowerCase();
    if (["img", "script", "foreignobject", "animate", "set", "a"].indexOf(t) >= 0) tag = tag || t;
  });
  fireAll(nodes);
  check(label + ": brez atributov dogodkov", !onAttr, onAttr);
  check(label + ": brez vbrizganih elementov", !tag, tag);
  check(label + ": brez href/xlink:href", !href, href);
  check(label + ": JS ni izveden", window[marker] !== 1);
  return el;
}

// 1) reported payload: double-quote breakout in a numeric geometry field
restore([{ t: "line", x1: '10" onmouseover="window.__pwned=1', y1: 10, x2: 50, y2: 50, color: "#111", width: 2 }]);
const svg = root();
const badAttr = svg.querySelector("[onmouseover]");
check("atribucijska XSS (x1) nevtralizirana", !badAttr, badAttr ? badAttr.outerHTML.slice(0, 90) : "ni dodanih atributov");
if (badAttr) badAttr.dispatchEvent(new window.Event("mouseover", { bubbles: true }));
check("poljubna JS koda ni izvedena (x1)", window.__pwned !== 1);
check("neštevilski x1 pade na 0", svg.querySelector("line").getAttribute("x1") === "0");

// 2) attribute breakout through colour
restore([{ t: "line", x1: 10, y1: 10, x2: 50, y2: 50, color: 'red" onmouseover="window.__pwned2=1', width: 2 }]);
const badColor = svg.querySelector("[onmouseover]");
check("atribucijska XSS (color) nevtralizirana", !badColor);
if (badColor) badColor.dispatchEvent(new window.Event("mouseover", { bubbles: true }));
check("poljubna JS koda ni izvedena (color)", window.__pwned2 !== 1);
check("neveljavna barva pade na varno privzeto", svg.querySelector("line").getAttribute("stroke") === "#111");

// 3) markup in free text
const textPayload = '<img src=x onerror="window.__pwned3=1"><script>window.__pwned3=1</script>';
restore([{ t: "text", x: 10, y: 20, txt: textPayload, color: "#111", width: 2 }]);
check("HTML v besedilu ni interpretiran", !svg.querySelector("img") && !svg.querySelector("script"));
check("besedilo je vidno kot besedilo", svg.textContent.includes("<img src=x") && svg.textContent.includes("<script>"));
window.__pwned3 = 0;
fireAll([].slice.call(svg.querySelectorAll("*")));
check("JS iz besedila ni izveden", window.__pwned3 !== 1);

// 4) legitimate data must still render identically (all sketch shape types)
restore([
  { t: "line", x1: 12, y1: 34, x2: 56, y2: 78, color: "#aabbcc", width: 3 },
  { t: "rect", x1: 20, y1: 30, x2: 60, y2: 80, color: "#aabbcc", width: 2 },
  { t: "circle", cx: 15, cy: 25, r: 8, color: "#aabbcc", width: 2 },
  { t: "arrow", x1: 0, y1: 0, x2: 10, y2: 10, color: "#123456", width: 2 },
  { t: "free", pts: [{ x: 1, y: 2 }, { x: 3, y: 4 }], color: "#aabbcc", width: 2 },
  { t: "iso", x: 10, y: 10, s: 40, color: "#aabbcc", width: 2 },
  { t: "text", x: 5, y: 6, txt: "Kot 45°", color: "#111111", width: 2 },
  { t: "dim", x1: 1, y1: 2, x2: 3, y2: 4, label: "25.4", color: "#111111", width: 2 },
]);
const line = svg.querySelector("line");
check("veljavna koordinata ohranjena", line && line.getAttribute("x1") === "12" && line.getAttribute("y2") === "78",
  line ? `${line.getAttribute("x1")},${line.getAttribute("y2")}` : "ni črte");
check("veljavna barva ohranjena", line && line.getAttribute("stroke") === "#aabbcc");
check("veljavna debelina ohranjena", line && line.getAttribute("stroke-width") === "3");
const rect = svg.querySelector("rect");
check("veljaven pravokotnik ohranjen", rect && rect.getAttribute("x") === "20" && rect.getAttribute("width") === "40");
const circle = svg.querySelector("circle");
check("veljaven krog ohranjen", circle && circle.getAttribute("cx") === "15" && circle.getAttribute("r") === "8");
check("veljaven puščica ohranjena", !!svg.querySelector("polygon[fill='#123456']"));
check("veljavna prosta roka ohranjena", !!svg.querySelector("polyline[points='1,2 3,4']"));
check("veljaven izometer ohranjen", svg.querySelectorAll("polygon").length >= 2);
check("veljavno besedilo ohranjeno", svg.textContent.includes("Kot 45°") && svg.textContent.includes("M(ročno): 25.4"));

// 5) single-quote attribute breakout (incl. mixed-quote variant)
assertClean("enojni narekovaj", () => restore([
  { t: "line", x1: `10' onmouseover='window.__pwned4=1`, y1: 10, x2: 50, y2: 50, color: "#111", width: 2 },
  { t: "line", x1: 10, y1: 10, x2: `50' onmouseover="window.__pwned4=1"`, y2: 50, color: "#111", width: 2 },
]), "__pwned4");

// 6) '>' nested markup injection in geometry fields
assertClean("> v geometriji", () => restore([
  { t: "line", x1: '10"><foreignObject><img src=x onerror="window.__pwned5=1"/></foreignObject>', y1: 10, x2: 50, y2: 50, color: "#111", width: 2 },
  { t: "rect", x1: 20, y1: '30"><script>window.__pwned5=1</script>', x2: 60, y2: 80, color: "#111", width: 2 },
]), "__pwned5");

// 7) SVG event-handler attributes via colour and geometry
assertClean("SVG dogodki onload/onfocus/onbegin", () => restore([
  { t: "line", x1: '10" onfocus="window.__pwned6=1', y1: 10, x2: 50, y2: '50" onbegin="window.__pwned6=1', color: '#111" onload="window.__pwned6=1', width: 2 },
  { t: "iso", x: 10, y: 10, s: '40" onload="window.__pwned6=1', color: "#111", width: 2 },
]), "__pwned6");

// 8) foreignObject injection
assertClean("foreignObject", () => restore([
  { t: "line", x1: 10, y1: 10, x2: '50"><foreignObject><img src=x onerror="window.__pwned7=1"></foreignObject>', y2: 50, color: "#111", width: 2 },
  { t: "text", x: 5, y: 6, txt: '</text><foreignObject><img src=x onerror="window.__pwned7=1"></foreignObject><text>', color: "#111", width: 2 },
]), "__pwned7");

// 9) malicious d= path data — N/A: skRender emits no <path>, but untrusted d must stay inert
const pathRoot = assertClean("d= (renderer ne oddaja <path>)", () => restore([
  { t: "line", d: 'M0 0" onload="window.__pwned8=1', x1: 1, y1: 2, x2: 3, y2: 4, color: "#111", width: 2 },
  { t: "text", x: 1, y: 2, d: "javascript:window.__pwned8=1", txt: "ok", color: "#111", width: 2 },
]), "__pwned8");
check("d= ne ustvari <path> elementa", !pathRoot.querySelector("path"), "ni podprto v skici");

// 10) injected text/label with <img onerror> and <script> (free text + dimension label)
const injRoot = assertClean("besedilo in oznaka", () => restore([
  { t: "text", x: 1, y: 2, txt: textPayload, color: "#111", width: 2 },
  { t: "dim", x1: 1, y1: 2, x2: 3, y2: 4, label: textPayload, color: "#111", width: 2 },
]), "__pwned9");
check("vbrizgano besedilo ostane vidno kot besedilo", injRoot.textContent.includes("<script>") && injRoot.textContent.includes("<img src=x"));

// 11) dangerous href / xlink:href values
assertClean("href / xlink:href", () => restore([
  { t: "line", x1: 1, y1: 2, x2: 3, y2: 4, href: "javascript:window.__pwned10=1", "xlink:href": "data:text/html,<script>window.__pwned10=1</script>", color: "#111", width: 2 },
  { t: "text", x: 1, y: 2, txt: "x", href: "javascript:window.__pwned10=1", color: "#111", width: 2 },
  { t: "line", x1: '1"><a xlink:href="javascript:window.__pwned10=1"><img src=x onerror="window.__pwned10=1"></a>', y1: 2, x2: 3, y2: 4, color: "#111", width: 2 },
]), "__pwned10");

// 12) malformed colours and CSS-like payloads; valid formats must survive
const colours = [
  ["url(javascript:window.__pwned11=1)", "#111"],
  ["expression(window.__pwned11=1)", "#111"],
  ["red", "#111"],
  ["#GGGGGG", "#111"],
  ['#111" onload="window.__pwned11=1', "#111"],
  ["#aabbcc", "#aabbcc"],
  ["#AABBCC", "#AABBCC"],
  ["rgba(1, 2, 3, 0.5)", "rgba(1, 2, 3, 0.5)"],
  ["rgb(1,2,3)", "rgb(1,2,3)"],
];
restore(colours.map((c, i) => ({ t: "line", x1: i, y1: 0, x2: i + 1, y2: 1, color: c[0], width: 2 })));
const colourLines = [].slice.call(svg.querySelectorAll("line"));
colours.forEach((c, i) => check(`barva #${i} (${c[0]})`, colourLines[i] && colourLines[i].getAttribute("stroke") === c[1],
  colourLines[i] ? colourLines[i].getAttribute("stroke") : "ni črte"));
window.__pwned11 = 0;
fireAll([].slice.call(svg.querySelectorAll("*")));
check("CSS payload JS ni izveden", window.__pwned11 !== 1);

// 13) numeric edge cases
restore([
  { t: "line", x1: "", y1: "0x10", x2: "1e309", y2: "NaN", color: "#111", width: "1e309" },
  { t: "line", x1: "1,5", y1: 1e12, x2: -1e12, y2: "Infinity", color: "#111", width: 999 },
  { t: "line", x1: null, y1: 0, x2: 1, y2: 1, color: "#111", width: -5 },
]);
const nums = [].slice.call(svg.querySelectorAll("line")).map((l) => [l.getAttribute("x1"), l.getAttribute("y1"), l.getAttribute("x2"), l.getAttribute("y2"), l.getAttribute("stroke-width")]);
check("Number('')=0, 0x10=16, Infinity/NaN->0", JSON.stringify(nums[0]) === JSON.stringify(["0", "16", "0", "0", "2"]), JSON.stringify(nums[0]));
check("comma->0, huge neg. clamp, width clamp", JSON.stringify(nums[1]) === JSON.stringify(["0", "10000000", "-10000000", "0", "40"]), JSON.stringify(nums[1]));
check("null->0, negative width->0.5", JSON.stringify(nums[2]) === JSON.stringify(["0", "0", "1", "1", "0.5"]), JSON.stringify(nums[2]));
restore([
  { t: "circle", cx: "0x10", cy: "1,5", r: "1e309", color: "#111", width: 2 },
  { t: "circle", cx: 1, cy: 1, r: -5, color: "#111", width: 2 },
  { t: "free", pts: [{ x: '10" onload="window.__pwned12=1', y: "0x10" }, { x: 1e12, y: -1e12 }], color: "#111", width: 2 },
]);
check("krog: coords/r omejeni", svg.querySelector("circle").getAttribute("r") === "0" &&
  svg.querySelectorAll("circle")[1].getAttribute("r") === "0");
check("točke proste roke so številčne", !!svg.querySelector("polyline[points='0,16 10000000,-10000000']") && !svg.querySelector("[onload]"));

// 14) floorplan TLR.walls / TLR.anchor restored from untrusted JSON
assertClean("tloris walls/anchor", () => restorePlan({
  walls: [{ x1: '10" onmouseover="window.__tlr13=1', y1: '20"><img src=x onerror="window.__tlr13=1>', x2: '30" onload="window.__tlr13=1', y2: 40 }],
  anchor: { x: '50" onfocus="window.__tlr13=1', y: 60 },
}), "__tlr13", "#tlorisSvg");
restorePlan({ walls: [{ x1: 10, y1: 20, x2: 110, y2: 120 }], anchor: { x: 110, y: 120 } });
check("veljaven tloris se še vedno upodobi",
  window.document.querySelector("#tlorisStatus").textContent.includes("Segmentov: 1") &&
  !!window.document.querySelector('#tlorisSvg circle[r="4"]'));

check("ni JS napak", errors.length === 0, errors.join(" | "));
console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
process.exit(fail ? 1 : 0);
