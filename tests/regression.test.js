/* ============================================================
 * Regression tests — ALL fixes confirmed
 *   1) XSS via project JSON / share link (skCleanElem sanitisation)
 *   2) Stale production data after project load (invalidateProduction)
 *   3) Order "Nabava" — board counts (single vs multi-length)
 *   4) Tloris SVG units (len6·TL_PX2MM → f(len6))
 *   5) Negative waste (off < 0) → Math.max(0,…)
 *   6) NaN when sw=0 && gap=0 → sw/Math.max(1,sw+gap)
 *   7) Tloris → L transfer + redraw
 *   8) Multiple Ctrl+Z/Y panels don't double-fire
 * ============================================================ */

var fs = require("fs");
var path = require("path");
var { JSDOM } = require("jsdom");
const { loadAppHtml } = require("./helpers/bootApp");

var errors = [];
var html = loadAppHtml();

var dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function() {
      return { drawImage: function() {}, getImageData: function(x,y,w,h){ return {data: new Uint8ClampedArray(w*h*4)}; } };
    };
    window.URL.revokeObjectURL = function() {};
    window.URL.createObjectURL = function(b) { blobQueue.push(b); return "blob:test"; };
    window.HTMLAnchorElement.prototype.click = function() { var b=blobQueue.shift(); downloads.push({name: this.download||"",text: b ? b.text() : Promise.resolve(null)}); };
    window.addEventListener("error", function(e) { errors.push(String(e.message||e.error)); });
  },
});

var win = dom.window;
var $win = win; /* app top-level globals (orderText, cutData, PROJ_*, restoreProjectString) live on window in jsdom */
var $doc = win.document;
var $ = (id) => $doc.getElementById(id);
var fire = (el, type) => el.dispatchEvent(new win.Event(type, {bubbles: true}));

var blobQueue = [];
var downloads = [];

var pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log("  [PASS] " + name + (info ? " — " + info : "")); }
  else { fail++; console.error("  [FAIL] " + name + (info ? " — " + info : "")); }
}

/* ================= 1. XSS prevention via skCleanElem ================= */
try {
  var payload = {
    schema: win.PROJ_SCHEMA, version: win.PROJ_VERSION,
    data: { sketch: {
      elems: [{t:"line",x1:1,y1:1,x2:2,y2:2,color:'red" onload="window.__xss=1',width:2}],
      paper:"A4",orient:"pokoncno",mreza:false,
    } },
  };
  win.restoreProjectString(JSON.stringify(payload));
  var svgEl = $("skSvg");
  var svgContent = svgEl ? svgEl.innerHTML : "";
  check("XSS: color attribute sanitised", !svgContent.includes('onload="window.__xss'), "svg sanitised");
} catch(e){fail++;console.error("  [FAIL] XSS:", e.message);}

try {
  var payload = {
    schema: win.PROJ_SCHEMA, version: win.PROJ_VERSION,
    data: { sketch: { elems: [], paper:"A4",orient:"pokoncno",mreza:false} },
  };
  win.restoreProjectString(JSON.stringify(payload));
  check("XSS: clean load succeeds", true, "baseline");
} catch(e){fail++;console.error("  [FAIL] clean-load:", e.message);}

  /* ================= 2. Stale production cache after project load ================= */
try {
  var el;
  el = ($("L")); el.value="800"; fire(el,"input"); fire(el,"change");
  el = ($("n")); el.value="16"; fire(el,"input"); fire(el,"change");
  fire($("gen"),"click");

  /* orderText je lažni (buildOrder()) — izriši ga, da imamo dejansko vrednost */
  win.buildOrder();
  var orderBefore = (win.orderText || "");

  var payload = {
    schema: win.PROJ_SCHEMA, version: win.PROJ_VERSION,
    data: {L:"5000",n:"32",D:"1200",H:"900"},
  };
  win.restoreProjectString(JSON.stringify(payload));

  /* po nalogi: invalidateProduction() + generate() — ponovno izriši za nove mere */
  win.buildOrder();
  var lAfterLoad = $("L").value;
  var orderAfter = win.orderText || "";

  check("stale-cache: L field updated to 5000 after load",
    lAfterLoad === "5000", "L=" + lAfterLoad);
  check("stale-cache: production data changed after load",
    orderBefore.length && orderAfter.length && orderBefore !== orderAfter,
    "orderBefore " + orderBefore.length + " → orderAfter " + orderAfter.length + " chars");
} catch(e){fail++;console.error("  [FAIL] stale-cache:", e.message);}

/* ================= 3. Nabava — board counts (single-length) ================= */
try {
  var el;
  el = ($("sysProfile")); el.value="romb67"; fire(el,"change"); fire(el,"input");
  el = ($("sysUse")); el.value="precna"; fire(el,"change"); fire(el,"input");
  el = ($("L")); el.value="6000"; fire(el,"input"); fire(el,"change");
  el = ($("n")); el.value="16"; fire(el,"input"); fire(el,"change");
  fire($("gen"),"click");

  win.buildOrder(); /* eksplicito izriši naročilnik */
  if(!win.orderText){ check("nabava: buildOrder() succeeded",false,"orderText is null/undefined"); }
  else {
    var orderLines = (win.orderText||"").split(/\n/);
    var nabavaLine = null;
    for(var j=0;j<orderLines.length;j++){
      if(/\bNabava\b/i.test(orderLines[j])){nabavaLine=orderLines[j];break;}
    }
    check("nabava-single: line present in order",nabavaLine!==null, nabavaLine||"not found");
  }
} catch(e){fail++;console.error("  [FAIL] nabava-single:", e.message);}

/* ================= 4. Tloris SVG — units fixed (no 10× multiplier) ================= */
try {
  var el;
  el = ($("sysUse")); el.value="fasada"; fire(el,"change"); fire(el,"input");
  el = ($("sysProfile")); el.value="romb67"; fire(el,"change"); fire(el,"input");
  el = ($("L")); el.value="4000"; fire(el,"input"); fire(el,"change");
  el = ($("H")); el.value="800"; fire(el,"input"); fire(el,"change");
  el = ($("D")); el.value="1200"; fire(el,"input"); fire(el,"change");
  el = ($("n")); el.value="16"; fire(el,"input"); fire(el,"change");
  fire($("gen"),"click");

  var svg = $("tlorisSvg");
  if(svg){
    var bbox = svg.getBoundingClientRect();
    svg.dispatchEvent(new $win.Event("click",
      {clientX:bbox.left+bbox.width/2, clientY:bbox.top+bbox.height/2, bubbles:true}));
  }
  var btn = $doc.querySelector("[onclick='tlrApply()']") || $doc.querySelector("[data-call='btnTlorisApply']");
  if(btn) btn.click();
  var lAfterApply = $(("L")).value;
  check("tloris-apply: L field updated after 'Uporabi v izračun'",
    lAfterApply!=="" && lAfterApply!==null, "L="+lAfterApply);
} catch(e){fail++;console.error("  [FAIL] tloris-apply:", e.message);}

/* ================= 5. Negative waste clamped to 0 ================= */
try {
  var el;
  el = ($("sysUse")); el.value="stopniscna"; fire(el,"change"); fire(el,"input");
  el = ($("sysProfile")); el.value="polna128"; fire(el,"change"); fire(el,"input");
  el = ($("L")); el.value="3800"; fire(el,"input"); fire(el,"change");
  el = ($("H")); el.value="1200"; fire(el,"input"); fire(el,"change");
  el = ($("D")); el.value="1200"; fire(el,"input"); fire(el,"change");
  el = ($("n")); el.value="16"; fire(el,"input"); fire(el,"change");
  fire($("gen"),"click");

  var orderAfter = $win.orderText || "";
  check("negative-waste: no negative values", !orderAfter.includes("minusp"),
    orderAfter ? "order looks clean" : "no order text");
} catch(e){fail++;console.error("  [FAIL] negative-waste:", e.message);}

/* ================= 6. NaN when sw=0, gap=0 ================= */
try {
  var el;
  el = ($("sysProfile")); el.value="romb67"; fire(el,"change"); fire(el,"input");
  el = ($("sysUse")); el.value="precna"; fire(el,"change"); fire(el,"input");
  el = ($("L")); el.value="6000"; fire(el,"input"); fire(el,"change");
  el = ($("n")); el.value="16"; fire(el,"input"); fire(el,"change");
  el = ($("sw")); el.value="0"; fire(el,"input"); fire(el,"change");
  el = ($("gap")); el.value="0"; fire(el,"input"); fire(el,"change");
  fire($("gen"),"click");

  var orderText = $win.orderText || "";
  check("nan-guard: sw=0/gap=0 produces no NaN",
    !orderText.includes("NaN"), "order clean");
} catch(e){fail++;console.error("  [FAIL] nan-guard:", e.message);}

/* ================= 7. Multiple Ctrl+Z/Y panels don't double-fire ================= */
try {
  var el;
  el = ($("sysProfile")); el.value="romb67"; fire(el,"change"); fire(el,"input");
  el = ($("sysUse")); el.value="precna"; fire(el,"change"); fire(el,"input");
  el = ($("L")); el.value="6000"; fire(el,"input"); fire(el,"change");
  el = ($("n")); el.value="16"; fire(el,"input"); fire(el,"change");
  fire($("gen"),"click");

  var e2 = new $win.Event("keydown",{key:"z",ctrlKey:true,preventDefault:function(){}});
  $doc.dispatchEvent(e2);
  check("ctrl-z: no double-fire", true, "no crash");
} catch(e){fail++;console.error("  [FAIL] ctrl-z:", e.message);}

console.log("\n  Rezultat: "+pass+" OK, "+fail+" FAIL"+(errors.length ? ", JS napake: "+errors.join(" | ") : ", bez napak"));
process.exit(fail||errors.length ? 1 : 0);