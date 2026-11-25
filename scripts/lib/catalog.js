/**
 * Node nalagalnik kataloga WoodCore (zero-build, brez DOM).
 *
 * Vir resnice za podatke kataloga je aplikacija sama: `WC`, `PAL_KLASIK` in
 * `PAL_RUSTIK` stojijo inline v tehnicka-risba-pro.html, `DIL` v js/dilatation.js,
 * `USE_NAMES`/`roksalLimit()`/`roksalRailLimit()` v js/roksal.js, registrska
 * abstrakcija v js/registry.js, `roksalUseNotes()` pa po dogovoru ostane v HTML-ju.
 * Ta nalagalnik vse to naloži v `vm` sandbox brez DOMa, da lahko generatorja
 * (scripts/generate-llms.js, scripts/generate-seo.js) in testi berejo katalog
 * brez parsanja HTML zaslonske plasti. Napake so eksplicitne — če se sidra
 * premaknejo, generator jasno pade, namesto da bi tiho podal stare podatke.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");

function extract(from, startMarker, endMarker) {
  const s = from.indexOf(startMarker);
  if (s < 0) throw new Error("catalog-loader: sidro ni najdeno: " + startMarker.slice(0, 40));
  const e = endMarker ? from.indexOf(endMarker, s) : -1;
  if (endMarker && e < 0) throw new Error("catalog-loader: končno sidro ni najdeno: " + endMarker.slice(0, 40));
  return from.slice(s, e < 0 ? from.length : e);
}

/** Izvleče funkcijo `name(...)` iz vira z uravnoteženimi oklepaji (odpornejše od regexa). */
function extractFunction(src, name) {
  const start = src.indexOf("function " + name + "(");
  if (start < 0) throw new Error("catalog-loader: funkcija ni najdena: " + name);
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error("catalog-loader: neuravnoteženi oklepaji pri: " + name);
}

/**
 * Naloži katalog v sandbox in vrne objekt z WC, DIL, PAL_KLASIK, PAL_RUSTIK,
 * USE_NAMES, roksalLimit, roksalRailLimit, roksalUseNotes, woodcoreRegistry,
 * validateRegistry, REGISTRY.
 * `ui` omogoča nadomestke DOM-funkcij, ki jih roksalUseNotes() kliče posredno
 * (V = vrednost polja, n = številska vrednost polja, f = oblikovanje števila).
 */
function loadCatalog(root, ui) {
  const r = root || ROOT;
  const html = fs.readFileSync(path.join(r, "tehnicka-risba-pro.html"), "utf8");
  const stubs = Object.assign(
    {
      /* roksalUseNotes() bere polja obrazca; generator nima obrazca → smiselni privzeti:
         mountType prazen = standardna montaža, stGoing 280 mm = tipičen korak stopnic. */
      V: (id) => (id === "mountType" ? "" : ""),
      n: (id) => (id === "stGoing" ? 280 : 0),
      f: (x) => String(x),
    },
    ui || {}
  );

  const sources = [
    extract(html, "var PAL_KLASIK=", "/* >>> GENERATED: js/dilatation.js"),
    fs.readFileSync(path.join(r, "js", "dilatation.js"), "utf8"),
    fs.readFileSync(path.join(r, "js", "roksal.js"), "utf8"),
    fs.readFileSync(path.join(r, "js", "registry.js"), "utf8"),
    extractFunction(html, "roksalUseNotes"),
  ].join("\n");

  const sandbox = Object.assign({}, stubs);
  vm.runInNewContext(sources + "\n;this.__exports={WC:WC,PAL_KLASIK:PAL_KLASIK,PAL_RUSTIK:PAL_RUSTIK,DIL:DIL,USE_NAMES:USE_NAMES,roksalLimit:roksalLimit,roksalRailLimit:roksalRailLimit,roksalUseNotes:roksalUseNotes,woodcoreRegistry:woodcoreRegistry,validateRegistry:validateRegistry,REGISTRY:REGISTRY};",
    sandbox, { filename: "catalog-loader.js" });
  return sandbox.__exports;
}

module.exports = { loadCatalog, extractFunction, ROOT };
