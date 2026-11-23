/**
 * Single source of the 74 [data-s="sN"] utility rules that used to be inline
 * style="..." attributes (CSP forbids style-src unsafe-inline). The same block
 * lives in two places: the inline <style> in tehnicka-risba-pro.html and the
 * linked print.css. This generator is the ONE place you edit; it writes the
 * block into both files between the __UTILITY_CSS__ markers and can verify
 * drift without writing.
 *
 * Refactor (Issue #41 §3.F): eliminates the 74-rule duplication / drift hazard.
 * Behavior-preserving: the RULES below are a byte-copy of the rules already in
 * the files, so running the generator is a no-op on rendered output.
 *
 * Usage:
 *   node scripts/generate-utility-css.js        # write both files
 *   node scripts/generate-utility-css.js --check # exit 1 if either file drifted
 */
"use strict";
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "tehnicka-risba-pro.html");
const printPath = path.join(root, "print.css");

/* ---- single source of truth: 74 utility rules (verbatim) ---- */
const RULES = [
  "[data-s=\"s1\"]{align-self:center!important;}",
  "[data-s=\"s2\"]{background:#111!important;}",
  "[data-s=\"s3\"]{background:#ffffff!important;border-radius:10px!important;overflow:hidden!important;cursor:grab!important;}",
  "[data-s=\"s4\"]{background:var(--line)!important;color:var(--tx)!important;}",
  "[data-s=\"s5\"]{border-top:1px solid var(--line)!important;padding-top:10px!important;}",
  "[data-s=\"s6\"]{border-top:none!important;}",
  "[data-s=\"s7\"]{color:#eee!important;}",
  "[data-s=\"s8\"]{color:var(--ac)!important;}",
  "[data-s=\"s9\"]{color:var(--bad)!important;}",
  "[data-s=\"s10\"]{color:var(--dim)!important;}",
  "[data-s=\"s11\"]{color:var(--mut)!important;}",
  "[data-s=\"s12\"]{color:var(--mut)!important;display:block!important;padding:4px 8px!important;}",
  "[data-s=\"s13\"]{color:var(--mut)!important;font-size:12px!important;margin-top:8px!important;}",
  "[data-s=\"s14\"]{color:var(--ok)!important;font-size:12px!important;}",
  "[data-s=\"s15\"]{color:var(--tx)!important;}",
  "[data-s=\"s16\"]{cursor:default!important;}",
  "[data-s=\"s17\"]{display:block!important;margin-bottom:8px!important;}",
  "[data-s=\"s18\"]{display:block!important;padding:6px 12px!important;}",
  "[data-s=\"s19\"]{display:flex!important;align-items:center!important;gap:8px!important;padding:7px 2px!important;border-bottom:1px solid var(--line)!important;}",
  "[data-s=\"s20\"]{display:flex!important;flex-direction:column!important;gap:10px!important;}",
  "[data-s=\"s21\"]{display:flex!important;gap:6px!important;flex-wrap:wrap!important;margin-bottom:10px!important;}",
  "[data-s=\"s22\"]{display:flex!important;gap:8px!important;align-items:center!important;}",
  "[data-s=\"s23\"]{display:flex!important;gap:8px!important;align-items:center!important;flex-wrap:wrap!important;}",
  "[data-s=\"s24\"]{display:flex!important;gap:8px!important;flex-wrap:wrap!important;}",
  "[data-s=\"s25\"]{display:flex!important;gap:8px!important;padding:4px 0!important;font-size:13px!important;}",
  "[data-s=\"s26\"]{display:inline!important;}",
  "[data-s=\"s27\"]{display:inline-flex!important;gap:8px!important;margin-top:12px!important;}",
  "[data-s=\"s28\"]{display:inline!important;margin-right:6px!important;}",
  "[data-s=\"s29\"]{display:none!important;}",
  "[data-s=\"s30\"]{display:none!important;margin-top:8px!important;width:100%!important;}",
  "[data-s=\"s31\"]{display:none!important;margin-top:9px!important;border-top:1px solid var(--line)!important;padding-top:8px!important;}",
  "[data-s=\"s32\"]{flex:1!important;}",
  "[data-s=\"s33\"]{flex:1!important;min-width:0!important;}",
  "[data-s=\"s34\"]{flex:1!important;padding:7px 9px!important;border-radius:8px!important;border:1px solid var(--line)!important;background:var(--bg)!important;color:var(--tx)!important;}",
  "[data-s=\"s35\"]{font-size:11px!important;color:var(--mut)!important;margin-right:6px!important;}",
  "[data-s=\"s36\"]{font-size:12.5px!important;margin-top:3px!important;}",
  "[data-s=\"s37\"]{font-size:13px!important;margin:6px 0!important;}",
  "[data-s=\"s38\"]{grid-column:1/-1!important;}",
  "[data-s=\"s39\"]{margin-bottom:10px!important;}",
  "[data-s=\"s40\"]{margin-bottom:8px!important;}",
  "[data-s=\"s41\"]{margin-top:0!important;}",
  "[data-s=\"s42\"]{margin-top:10px!important;}",
  "[data-s=\"s43\"]{margin-top:12px!important;}",
  "[data-s=\"s44\"]{margin-top:16px!important;}",
  "[data-s=\"s45\"]{margin-top:6px!important;}",
  "[data-s=\"s46\"]{margin-top:8px!important;}",
  "[data-s=\"s47\"]{margin-top:8px!important;white-space:pre-wrap!important;}",
  "[data-s=\"s48\"]{margin-top:8px!important;width:100%!important;}",
  "[data-s=\"s49\"]{margin-top:9px!important;}",
  "[data-s=\"s50\"]{margin:0 0 8px!important;}",
  "[data-s=\"s51\"]{max-width:1100px!important;background:#111!important;padding:0!important;}",
  "[data-s=\"s52\"]{max-width:560px!important;}",
  "[data-s=\"s53\"]{max-width:920px!important;display:flex!important;flex-direction:column!important;max-height:92vh!important;}",
  "[data-s=\"s54\"]{overflow:auto!important;white-space:pre-wrap!important;}",
  "[data-s=\"s55\"]{padding:12px!important;}",
  "[data-s=\"s56\"]{padding:2px 4px!important;border-bottom:1px solid var(--line)!important;}",
  "[data-s=\"s57\"]{padding:2px 4px!important;border-bottom:1px solid var(--line)!important;text-align:right!important;color:var(--tx)!important;}",
  "[data-s=\"s58\"]{padding:4px 6px!important;}",
  "[data-s=\"s59\"]{padding:4px 6px!important;color:var(--mut)!important;font-size:11px!important;}",
  "[data-s=\"s60\"]{padding:4px 6px!important;text-align:right!important;}",
  "[data-s=\"s61\"]{padding:6px 8px!important;font-size:11.5px!important;color:var(--mut)!important;}",
  "[data-s=\"s62\"]{padding:6px 8px!important;font-size:12px!important;color:var(--mut)!important;line-height:1.7!important;}",
  "[data-s=\"s63\"]{padding:8px 0!important;border-bottom:1px solid var(--line)!important;}",
  "[data-s=\"s64\"]{text-align:left!important;}",
  "[data-s=\"s65\"]{width:100%!important;background:#0d0d0d!important;border:1px solid var(--line)!important;border-radius:8px!important;cursor:crosshair!important;display:block!important;}",
  "[data-s=\"s66\"]{width:100%!important;background:#ffffff!important;border:1px solid var(--line)!important;border-radius:8px!important;display:block!important;touch-action:none!important;}",
  "[data-s=\"s67\"]{width:100%!important;border-radius:10px!important;display:block!important;}",
  "[data-s=\"s68\"]{width:100%!important;display:block!important;touch-action:none!important;}",
  "[data-s=\"s69\"]{width:100%!important;font-family:inherit!important;}",
  "[data-s=\"s70\"]{width:100%!important;font-size:11px!important;border-collapse:collapse!important;}",
  "[data-s=\"s71\"]{width:100%!important;font-size:11px!important;border-collapse:collapse!important;margin-top:5px!important;}",
  "[data-s=\"s72\"]{width:100%!important;font-size:12px!important;border-collapse:collapse!important;}",
  "[data-s=\"s73\"]{width:100%!important;padding:7px 9px!important;border-radius:8px!important;border:1px solid var(--line)!important;background:var(--bg)!important;color:var(--tx)!important;}",
  "[data-s=\"s74\"]{width:auto!important;}"
];

const START = "/*__UTILITY_CSS_START__*/";
const END   = "/*__UTILITY_CSS_END__*/";
const BLOCK = [START, ...RULES, END].join("\n");

function replaceBetween(src, nextBlock) {
  const i = src.indexOf(START);
  const j = src.indexOf(END);
  if (i < 0 || j < 0 || j < i) throw new Error("markers not found — add " + START + " / " + END + " around the [data-s] block first");
  return src.slice(0, i) + nextBlock + src.slice(j + END.length);
}

function extract(src) {
  const i = src.indexOf(START);
  const j = src.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return src.slice(i, j + END.length);
}

function writeAll() {
  let html = fs.readFileSync(htmlPath, "utf8");
  let css  = fs.readFileSync(printPath, "utf8");
  const htmlBefore = extract(html);
  const cssBefore  = extract(css);
  html = replaceBetween(html, BLOCK);
  css  = replaceBetween(css, BLOCK);
  if (htmlBefore === null || htmlBefore !== BLOCK) { fs.writeFileSync(htmlPath, html); console.log("HTML  [data-s] block regenerated (" + RULES.length + " rules)."); }
  else console.log("HTML  [data-s] block already in sync.");
  if (cssBefore === null || cssBefore !== BLOCK) { fs.writeFileSync(printPath, css); console.log("print.css [data-s] block regenerated (" + RULES.length + " rules)."); }
  else console.log("print.css [data-s] block already in sync.");
}

function check() {
  let bad = false;
  for (const p of [htmlPath, printPath]) {
    const src = fs.readFileSync(p, "utf8");
    const cur = extract(src);
    if (cur === null) { console.error("FAIL " + p + ": markers missing"); bad = true; }
    else if (cur !== BLOCK) { console.error("FAIL " + p + ": [data-s] block drifted from RULES source"); bad = true; }
    else console.log("OK   " + p + ": [data-s] block in sync (" + RULES.length + " rules).");
  }
  process.exit(bad ? 1 : 0);
}

if (process.argv.includes("--check")) check();
else writeAll();
