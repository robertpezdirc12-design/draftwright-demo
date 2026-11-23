/**
 * Independent verification of the trust-boundary fixes found during review:
 *  1) calibration overlay XSS from #p= / imported JSON
 *  2) raw sketch fields in the downloadable SVG export
 *  3) unbounded floorplan geometry (DoS) from imported JSON
 * Every check uses the real application in jsdom, not helper functions alone.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "tehnicka-risba-pro.html"), "utf8");
const errors = [], blobs = [], downloads = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } };
    };
    w.URL.revokeObjectURL = () => {};
    w.URL.createObjectURL = (b) => { blobs.push(b); return "blob:test"; };
    w.HTMLAnchorElement.prototype.click = function () {
      const b = blobs.shift();
      downloads.push({ name: this.download || "", text: b ? b.text() : Promise.resolve("") });
    };
    w.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
  },
});
const { window } = dom;
const { document } = window;
const $ = (id) => document.getElementById(id);
const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));
let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
function restoreData(data) {
  window.restoreProjectString(JSON.stringify({ schema: "draftwright-project", version: 3, data }));
}
function drawOverlay() {
  window.S.img = { naturalWidth: 100, naturalHeight: 100 };
  window.S.picking = true;
  $("ov").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}
function cleanAttrs(root) {
  return !root.querySelector("[onmouseover],[onload],[onfocus],[onbegin],[onerror]");
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // 1) linear calibration, reported payload via #p=/import
  const payload = '10" onmouseover="window.__cal=1';
  restoreData({
    photo: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", calMode: "linear", calibrated: true,
    cal: { a: { x: payload, y: 10 }, b: { x: 20, y: 20 }, scale: 1, cos: 1, sin: 0 },
  });
  drawOverlay();
  check("kalibracija: atribut dogodka ni vstavljen", cleanAttrs($("ov")));
  const calLine = $("ov").querySelector("line");
  check("kalibracija: koordinata je število", calLine && calLine.getAttribute("x1") === "0", calLine && calLine.getAttribute("x1"));
  const h = $("ov").querySelector("[onmouseover]");
  if (h) h.dispatchEvent(new window.Event("mouseover", { bubbles: true }));
  check("kalibracija: JS ni izveden", window.__cal !== 1);

  // 2) plane calibration via corners
  const payload2 = '30"><img src=x onerror="window.__cal2=1>';
  restoreData({
    photo: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", calMode: "plane", calibrated: true,
    cal: { corners: [{ x: payload2, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 20 }, { x: 10, y: 20 }], h: [1, 0, 0, 0, 1, 0, 0, 0, 1], scale: 1 },
  });
  drawOverlay();
  check("kalibracija (4 točke): brez vbrizganih elementov", cleanAttrs($("ov")) && !$("ov").querySelector("img"));
  const h2 = $("ov").querySelector("[onerror]");
  if (h2) h2.dispatchEvent(new window.Event("error", { bubbles: true }));
  check("kalibracija (4 točke): JS ni izveden", window.__cal2 !== 1);

  // 3) malicious sketch exported as SVG
  restoreData({ sketch: { elems: [
    { t: "line", x1: '10" onload="window.__exp=1', y1: 10, x2: 50, y2: 50, color: 'red" onmouseover="window.__exp=1', width: 2 },
    { t: "text", x: 5, y: 6, txt: '<img src=x onerror="window.__exp=1">', color: "#111", width: 2 },
  ], paper: "A4", orient: "pokoncno", mreza: false } });
  $("exportDialog").click();
  document.querySelectorAll("#expItems [data-exp-item]").forEach((cb) => {
    if (cb.checked) { cb.checked = false; fire(cb, "change"); }
  });
  const skCb = document.querySelector('#expItems [data-exp-item="skicaSvg"]');
  skCb.checked = true; fire(skCb, "change");
  check("izvoz: samo skica izbrana", document.querySelector("#expSumVsebina").textContent.includes("1/12"));
  downloads.length = 0;
  $("expGo").click();
  for (let i = 0; i < 200 && !/Izvoz (končan|prekinjen)|končan z napakami/.test($("globalStatus").textContent); i++) await sleep(50);
  await sleep(50);
  const d = downloads.find((x) => /skica\.svg$/.test(x.name));
  check("izvoz: SVG datoteka ustvarjena", !!d, d ? d.name : $("globalStatus").textContent);
  if (d) {
    const txt = await d.text;
    const parsed = new window.DOMParser().parseFromString(txt, "image/svg+xml");
    check("izvoz: brez atributov dogodkov", cleanAttrs(parsed), txt.slice(0, 120));
    check("izvoz: brez vbrizganih elementov", !parsed.querySelector("img,script,foreignObject"));
    check("izvoz: barva je očiščena", /stroke="#111"/.test(txt));
  }

  // 4) legitimate sketch still exports unchanged
  restoreData({ sketch: { elems: [{ t: "line", x1: 12, y1: 34, x2: 56, y2: 78, color: "#aabbcc", width: 3 }], paper: "A4", orient: "pokoncno", mreza: false } });
  $("exportDialog").click();
  downloads.length = 0;
  $("expGo").click();
  for (let i = 0; i < 200 && !/Izvoz (končan|prekinjen)|končan z napakami/.test($("globalStatus").textContent); i++) await sleep(50);
  await sleep(50);
  const d2 = downloads.find((x) => /skica\.svg$/.test(x.name));
  if (d2) {
    const txt2 = await d2.text;
    check("izvoz: veljavna geometrija ohranjena", /x1="12"/.test(txt2) && /y2="78"/.test(txt2) && /stroke="#aabbcc"/.test(txt2));
  } else check("izvoz: veljavna geometrija ohranjena", false, "ni datoteke");

  // 5) unbounded floorplan geometry from imported JSON must not explode
  restoreData({ plan: { walls: [{ x1: 0, y1: 0, x2: 1e300, y2: 1e300 }], anchor: null } });
  check("tloris: ekstremna vrednost omejena", !!$("tlorisSvg") && !/1e\+300|Infinity/.test($("tlorisSvg").innerHTML));
  check("ni JS napak", errors.length === 0, errors.join(" | "));
  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail ? 1 : 0);
})();
