/**
 * P4 — vektorski PDF (jsPDF + svg2pdf, lokalno vendored) — poganja `npm test`.
 * Pokritje: vendor datoteke (UMD podpis, TTF magic), script oznake, exportPdf povezava
 * v izvoznem dialogu, SW predpomnilnik za vendor; FUNKCIONALNI test: dejanski PDF iz risbe
 * — %PDF podpis, MediaBox A3 (420×297), VGRADJENA pisava (FontFile2 → vektorsko besedilo),
 * slovenske črke č/š/ž v vsebini.
 * V jsdom se vendor skripte ne naložijo samodejno — test jih vrednoti eksplicitno (kot brskalnik)
 * in doda getBBox/measureText stuba, ki ju jsdom ne implementira.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");
const errors = [];

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

(async () => {
  /* 1) vendor datoteke */
  const jspdfSrc = fs.readFileSync(path.join(root, "vendor", "jspdf.umd.min.js"), "utf8");
  const svg2src = fs.readFileSync(path.join(root, "vendor", "svg2pdf.umd.min.js"), "utf8");
  const ttf = fs.readFileSync(path.join(root, "vendor", "LiberationSans-Regular.ttf"));
  check("vendor: jsPDF UMD + svg2pdf UMD + TTF", jspdfSrc.length > 100000 && svg2src.includes("svg2pdf") && ttf.slice(0, 4).equals(Buffer.from([0x00, 0x01, 0x00, 0x00])), "jsPDF " + Math.round(jspdfSrc.length / 1024) + " kB · svg2pdf " + Math.round(svg2src.length / 1024) + " kB · TTF " + Math.round(ttf.length / 1024) + " kB");
  // SRI: vsak vendor skript nosi integrity="sha384-…" (avtoritativni hash-pin je v tests/sri.test.js).
  const hasSriTag = (f) => new RegExp('src="' + f + '"\\s+defer\\s+integrity="sha384-[^"]+"').test(html);
  check("HTML: vendor skripti (SRI) + exportPdf + vektorski PDF v dialogu", hasSriTag("vendor/jspdf.umd.min.js") && hasSriTag("vendor/svg2pdf.umd.min.js") && html.includes("function exportPdf(sv,paper)") && html.includes("risba (PDF, vektorski)"));
  const swSrc = fs.existsSync(path.join(root, "sw.js")) ? fs.readFileSync(path.join(root, "sw.js"), "utf8") : "";
  check("SW predpomnilnik: vendor datoteke za offline", swSrc.includes('"./vendor/jspdf.umd.min.js"') && swSrc.includes('"./vendor/svg2pdf.umd.min.js"') && swSrc.includes('"./vendor/LiberationSans-Regular.ttf"'));

  /* 2) FUNKCIONALNO: dejanski vektorski PDF iz risbe v jsdom */
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true, url: "https://draftwright-demo.vercel.app/",
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = function () {
        return {
          drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; },
          measureText(t) { return { width: String(t || "").length * 2.2 }; },
          font: "10px Arial",
        };
      };
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = function () {};
      /* jsdom nima fetch — stub servira vendor pisavo (enaka pot kot brskalnik) */
      window.fetch = function (url) {
        if (String(url).indexOf("vendor/LiberationSans") >= 0) {
          const buf = fs.readFileSync(path.join(root, "vendor", "LiberationSans-Regular.ttf"));
          return Promise.resolve({
            ok: true, status: 200,
            arrayBuffer: () => Promise.resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)),
          });
        }
        return Promise.reject(new Error("offline stub: " + url));
      };
      window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
    },
  });
  const { window } = dom;
  const { document } = window;
  const $ = (id) => document.getElementById(id);
  const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));
  const setField = (id, v) => { $(id).value = String(v); fire($(id), "input"); };

  /* stuba, ki ju jsdom ne implementira, svg2pdf pa uporablja */
  const SVGproto = window.SVGElement && window.SVGElement.prototype;
  if (SVGproto && !SVGproto.getBBox) SVGproto.getBBox = function () { return { x: 0, y: 0, width: 20, height: 8 }; };

  /* vendor skripti eksplicitno v okno (kot bi jih naložil brskalnik) */
  window.eval(jspdfSrc);
  window.eval(svg2src);
  check("jsdom: jsPDF + svg2pdf naložena", typeof window.jspdf === "object" && !!window.jspdf.jsPDF && typeof window.svg2pdf === "object");

  /* risba iz trenutnih polj (ROMB-67, balkonska) */
  setField("proj", "VEKTORSKI PDF TEST — č/š/ž");
  $("sysProfile").value = "romb67"; fire($("sysProfile"), "change");
  $("sysUse").value = "precna"; fire($("sysUse"), "change");
  setField("L", "4200"); setField("H", "1050"); setField("n", "12"); setField("gap", "20");
  $("gen").click();
  const svgEl = $("prev").querySelector("svg");
  check("risba generirana", !!svgEl);

  const doc = await window.exportPdf(svgEl.outerHTML, "A3");
  check("exportPdf: vrne jsPDF dokument", !!doc && typeof doc.output === "function");

  const buf = doc.output("arraybuffer");
  const pdfHead = Buffer.from(buf.slice(0, 5)).toString("latin1");
  const pdfTxt = Buffer.from(buf).toString("latin1");
  const mb = pdfTxt.match(/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
  /* jsPDF zapisuje MediaBox v TOČKAH: 420×297 mm = 1190.55×841.89 pt (A3 ležeče); sprejmemo oboje */
  const mbOk = mb && (Math.abs(parseFloat(mb[1]) - 420) <= 1 && Math.abs(parseFloat(mb[2]) - 297) <= 1 ||
                   Math.abs(parseFloat(mb[1]) - 1190.55) <= 2 && Math.abs(parseFloat(mb[2]) - 841.89) <= 2);
  check("PDF: podpis %PDF + A3 ležeče (420×297 mm / 1190.55×841.89 pt)", pdfHead === "%PDF-" && !!mbOk, Math.round(buf.byteLength / 1024) + " kB · MediaBox " + (mb ? mb[1] + "×" + mb[2] : "?"));
  check("PDF: vgradnjena pisava (FontFile2) — vektorsko besedilo", pdfTxt.includes("FontFile2"));
  check("PDF: podstrani = 1", (pdfTxt.match(/\/Type\s*\/Page[^s]/g) || []).length === 1, "strani: " + (pdfTxt.match(/\/Type\s*\/Page[^s]/g) || []).length);

  /* besedilo je risano z GID-i (podnabor pisave) — slovenščina dokazana prek ToUnicode CMap
     (hex preslikave U+010D č, U+0161 š, U+017E ž) + številom besedilnih operatorjev */
  const zlib = require("zlib");
  const streams = [];
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(pdfTxt))) {
    const start = m.index + m[0].length;
    const end = pdfTxt.indexOf("endstream", start);
    if (end < 0) break;
    try { streams.push(zlib.inflateSync(Buffer.from(pdfTxt.slice(start, end), "latin1")).toString("latin1")); } catch (e) { streams.push(pdfTxt.slice(start, end)); }
  }
  const allStream = streams.join("\n");
  const tjCount = (allStream.match(/Tj|TJ/g) || []).length;
  const cMap = streams.filter((s) => s.includes("beginbfchar") || s.includes("beginbfrange"));
  const sloHex = ["010d", "0161", "017e"].filter((h) => cMap.some((s) => s.toLowerCase().includes(h)));
  check("PDF: ToUnicode CMap s č/š/ž (U+010D/0161/017E)", cMap.length > 0 && sloHex.length === 3, "CMap: " + cMap.length + " · preslikave: " + sloHex.join(", "));
  check("PDF: vektorsko besedilo narisano (Tj/TJ > 50)", tjCount > 50, tjCount + " operatorjev v " + streams.length + " tokih");

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${errors.length ? ", JS napake: " + errors.join(" | ") : ", brez JS napak"}`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e); process.exit(1); });
