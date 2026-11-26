/**
 * Tema — kontrast in popolnost svetle teme — poganja `npm test`.
 * Pokritje: barvni žetoni v obeh temah (WCAG 2.1 AA, ≥ 4.5 : 1 za besedilo),
 * napis na primarnih tipkah, svetle različice površin, ki so v temni temi
 * trdo kodirane, in zavesa (scrim) dialogov v svetli temi.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

const css = html.slice(html.indexOf("<style>") + 7, html.indexOf("</style>"));

/* zbere spremenljivke --* iz vseh blokov z danim predznakom (po vrsti dokumenta) */
function tokenMap(prefix) {
  const map = {};
  let i = 0;
  while ((i = css.indexOf(prefix + "{", i)) !== -1) {
    const end = css.indexOf("}", i);
    if (end < 0) break;
    for (const decl of css.slice(i + prefix.length + 1, end).split(";")) {
      const k = decl.indexOf(":");
      if (k < 0) continue;
      const name = decl.slice(0, k).trim();
      if (!name.startsWith("--")) continue;
      map[name] = decl.slice(k + 1).trim();
    }
    i = end;
  }
  return map;
}

const dark = tokenMap(":root");
const light = Object.assign({}, dark, tokenMap('[data-theme="light"]'));

function rgb(v) {
  if (!/^#[0-9a-f]{3,6}$/i.test(v || "")) return null;
  let h = v.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function lum(c) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function ratio(a, b) {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const PAIRS = [
  ["--tx", "--bg"], ["--tx", "--panel"], ["--tx", "--p2"],
  ["--mut", "--panel"], ["--mut", "--p2"], ["--mut", "--bg"],
  ["--dim", "--panel"], ["--dim", "--p2"], ["--dim", "--bg"],
  ["--ac", "--panel"], ["--ac", "--bg"],
  ["--ok", "--panel"], ["--wa", "--panel"], ["--bad", "--panel"],
];
const MIN = 4.5;

for (const [name, tokens] of [["temna", dark], ["svetla", light]]) {
  for (const [fg, bg] of PAIRS) {
    const a = rgb(tokens[fg]), b = rgb(tokens[bg]);
    if (!a || !b) { check(`${name} tema: ${fg} na ${bg}`, false, "žeton manjka ali ni hex"); continue; }
    const r = ratio(a, b);
    check(`${name} tema: ${fg} na ${bg}`, r >= MIN, `${r.toFixed(2)} : 1`);
  }
}

/* primarne tipke: temna tema = skoraj črn napis na terakoti, svetla = bel */
const acDark = rgb(dark["--ac"]), acLight = rgb(light["--ac"]);
const inkDark = rgb("#1a120e");
const white = { r: 255, g: 255, b: 255 };
if (acDark) check("temna tema: napis na primarni tipki", ratio(inkDark, acDark) >= MIN, `${ratio(inkDark, acDark).toFixed(2)} : 1`);
if (acLight) check("svetla tema: napis na primarni tipki", ratio(white, acLight) >= MIN, `${ratio(white, acLight).toFixed(2)} : 1`);

/* površine, ki so v temni temi trdo kodirane — vsaka mora imeti svetlo različico */
const MUST = [
  ".menu .drop", ".drop .mi.active", ".kbd", ".sysbox", ".warnbox",
  ".steps span.cur", ".exp-sec", ".exp-row", ".exp-sl", ".exp-chip.active",
  ".exp-seg.active", ".exp-overlay", "#asideScrim", ".primarybar", ".exp-go",
  "main", ".menubar", "select", ".photo",
];
for (const sel of MUST) {
  check(`svetla različica: ${sel}`, css.includes(`[data-theme="light"] ${sel}`));
}

/* zavesa dialogov: v svetli temi mehkejša kot v temni */
function scrimAlpha(sel) {
  const i = css.indexOf(sel + "{");
  if (i < 0) return null;
  const body = css.slice(i, css.indexOf("}", i));
  const m = body.match(/background:(#[0-9a-f]{3,8})/i);
  if (!m) return null;
  const h = m[1].slice(1);
  if (h.length === 4) return parseInt(h[3] + h[3], 16) / 255;
  if (h.length === 8) return parseInt(h.slice(6, 8), 16) / 255;
  return 1;
}
const aDarkScrim = scrimAlpha(".exp-overlay");
const aLightScrim = scrimAlpha('[data-theme="light"] .exp-overlay');
check("zavesa: temna tema prisotna", aDarkScrim !== null, aDarkScrim === null ? "" : aDarkScrim.toFixed(2));
check("zavesa: svetla tema mehkejša", aLightScrim !== null && aDarkScrim !== null && aLightScrim < aDarkScrim && aLightScrim <= 0.45,
  aLightScrim === null ? "ni predpisa" : aLightScrim.toFixed(2));

console.log(`Tema in kontrast: ${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
