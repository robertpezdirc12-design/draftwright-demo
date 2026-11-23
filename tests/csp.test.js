/**
 * CSP integrity: verifies that the deployed policy authorises exactly the inline
 * code that exists in the app, contains no unsafe-inline/unsafe-eval, and that
 * generated print documents contain no inline <style>/style attributes.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const html = read("tehnicka-risba-pro.html");
const indexHtml = read("index.html");
const printCss = read("print.css");
const vercel = JSON.parse(read("vercel.json"));
const sha = (s) => "'sha256-" + crypto.createHash("sha256").update(s, "utf8").digest("base64") + "'";

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log("  [PASS] " + name + (info ? " — " + info : "")); }
  else { fail++; console.error("  [FAIL] " + name + (info ? " — " + info : "")); }
}

const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/);
check("CSP meta present", !!meta);
const policy = meta ? meta[1] : "";
check("no unsafe-inline / unsafe-eval", !/unsafe-inline|unsafe-eval/i.test(policy), policy.slice(0, 80));
check("object-src none", /object-src\s+'none'/.test(policy));
check("base-uri self", /base-uri\s+'self'/.test(policy));
check("frame-ancestors only in HTTP header", !/frame-ancestors/.test(policy));

function sources(p, name) {
  const m = p.match(new RegExp("(?:^|;)\\s*" + name + "\\s+([^;]+)"));
  return m ? m[1].trim().split(/\s+/).sort() : [];
}
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1]).filter((s) => s.trim());
const inlineStyles = [...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)]
  .map((m) => m[1]).filter((s) => s.trim());
const scriptHashes = inlineScripts.map(sha).sort();
const styleHashes = inlineStyles.map(sha).sort();
check("script-src authorises every inline script and nothing else",
  JSON.stringify(sources(policy, "script-src").filter((s) => s !== "'self'")) === JSON.stringify(scriptHashes),
  inlineScripts.length + " script(s)");
check("style-src authorises every inline style and nothing else",
  JSON.stringify(sources(policy, "style-src").filter((s) => s !== "'self'")) === JSON.stringify(styleHashes),
  inlineStyles.length + " style(s)");

const headerEntry = vercel.headers && vercel.headers[0];
const header = headerEntry && headerEntry.headers.find((h) => h.key === "Content-Security-Policy");
check("Vercel CSP header present", !!header);
if (header) {
  check("header has no unsafe-inline / unsafe-eval", !/unsafe-inline|unsafe-eval/i.test(header.value));
  check("header has frame-ancestors 'none'", /frame-ancestors\s+'none'/.test(header.value));
  const withoutFrame = header.value.replace(/;\s*frame-ancestors\s+'none'/, "");
  check("header and meta policies agree", withoutFrame === policy);
}

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://draftwright-demo.vercel.app/",
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return { drawImage() {}, getImageData(x, y, ww, hh) { return { data: new Uint8ClampedArray(ww * hh * 4) }; } };
    };
    w.URL.revokeObjectURL = () => {};
    w.HTMLAnchorElement.prototype.click = function () {};
    w.addEventListener("error", () => {});
  },
});
const w = dom.window;
const allEls = [...w.document.querySelectorAll("*")];
check("no inline event-handler attributes", !allEls.some((el) => [...el.attributes].some((a) => /^on/i.test(a.name))));
/* Source markup must have no style attributes. CSSOM mutations (element.style.x=)
   are not CSP-blocked and are therefore not flagged here. */
check("no style attributes in source markup", !/(?<![-\w])style="[^"]*"/.test(html));
check("redirect page has no inline script/style", !/<script|<style/i.test(indexHtml));

const used = new Set([...html.matchAll(/data-s="(s\d+)"/g)].map((m) => m[1]));
const cssRules = new Set([...printCss.matchAll(/\[data-s="(s\d+)"\]/g)].map((m) => m[1]));
check("every utility style has a print.css rule", [...used].every((u) => cssRules.has(u)),
  used.size + " used / " + cssRules.size + " defined");
check("print.css carries @page and table rules", /@page\{margin:0\}/.test(printCss) && /table\{border-collapse/.test(printCss));
check("service worker caches print.css", /print\.css/.test(read("sw.js")));

const written = [];
w.open = function () {
  return {
    document: { write(h) { written.push(h); }, close() {}, readyState: "complete", styleSheets: [], querySelector() { return null; } },
    focus() {}, print() {},
  };
};
const $ = (id) => w.document.getElementById(id);
$("gen").click();
$("prt").click();
$("skPrint").click();
$("resultBody").innerHTML = "<table><tr><td>x</td></tr></table>";
$("resultPrint").click();
check("all three print paths write a document", written.length === 3, written.length + " document(s)");
check("print documents have no inline <style>", written.every((h) => !/<style[\s>]/i.test(h)));
check("print documents have no style attributes", written.every((h) => !/[^-]style="/.test(h)));
check("print documents load same-origin print.css", written.every((h) => h.includes('href="print.css"')));
check("paper size recorded as data attribute", written[0].includes('data-print-size="297mm 210mm"') || written[0].includes('data-print-size="420mm 297mm"'));

console.log("\n  Rezultat: " + pass + " OK, " + fail + " FAIL");
process.exit(fail ? 1 : 0);
