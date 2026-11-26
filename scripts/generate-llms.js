/**
 * Generator llms.txt / llms.en.txt (llmstxt.org) — kratka, strojno berljiva
 * predstavitev aplikacije za AI asistente in iskalnike.
 *
 * Vsebina prihaja iz ENEGA vira resnice: register WoodCore v aplikaciji
 * (scripts/lib/catalog.js naloži WC/DIL/roksalLimit/roksalUseNotes brez DOM),
 * produktna dejstva/FAQ/HowTo iz scripts/lib/seo-content.js ter različica iz
 * CHANGELOG.md. Generirani datoteki sta commitani; tests/llms.test.js ju
 * regenerira v pomnilniku in pade ob vsakem drift-u (enak vzorec kot CSP).
 *
 * Uporaba:  node scripts/generate-llms.js   (piše llms.txt in llms.en.txt)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { loadCatalog } = require("./lib/catalog");
const { parseChangelog } = require("./lib/changelog");
const { SITE_URL, PRODUCT, FAQ_SL, FAQ_EN, HOWTO_SL, HOWTO_EN } = require("./lib/seo-content");

const ROOT = path.join(__dirname, "..");

/** Omejitev v besedilu — pri H-odvisnih vejah prikaže obe veji (≤1500 mm višine / višje). */
function limitText(cat, p, use) {
  const lo = cat.roksalLimit(p, use, 1200), hi = cat.roksalLimit(p, use, 2500);
  if (lo.v === hi.v) return lo.label + " ≤ " + lo.v + " mm";
  return lo.label + " ≤ " + lo.v + " mm do višine 1500 mm, višje ≤ " + hi.v + " mm";
}

function profileSection(cat, key, lang) {
  const p = cat.WC[key];
  /* v SL so decimalne vrednosti z vejico (npr. 16,5 mm) */
  const num = (x) => (lang === "sl" ? String(x).replace(".", ",") : String(x));
  const out = [];
  out.push("### " + p.n);
  out.push("");
  out.push("- Mere: " + num(p.w) + " × " + num(p.t) + " × " + num(p.len) + " mm" + (p.max ? " (do " + p.max + " cm)" : "") + ".");
  out.push("- Pritrditev: " + p.fix + ".");
  out.push("- Uporabe: " + p.allowed.map((u) => cat.USE_NAMES[u] || u).join(", ") + ".");
  out.push("- Omejitve: " + p.allowed.map((u) => cat.USE_NAMES[u] + " — " + limitText(cat, p, u)).join("; ") + ".");
  if (p.rail && p.rail.pokoncna) {
    out.push("- Pokončno: vodoravne cevi z razmakom ≤ " + cat.roksalRailLimit(p) + " mm (vsaj 2 vrsti; število = ⌈H/" + cat.roksalRailLimit(p) + "⌉+1).");
  }
  if (p.facade) out.push("- Fasada: podkonstrukcija ≤ " + p.facade.studMax + " mm, skupna debelina na izolaciji " + p.facade.buildup + ".");
  out.push("- Vrtanje: " + p.drill + ".");
  out.push("- Barvne palete: " + p.palette.join(", ") + ".");
  out.push("- Pravila aplikacije (opomba za risbo):");
  for (const u of p.allowed) {
    out.push("  - " + (cat.USE_NAMES[u] || u) + ": " + cat.roksalUseNotes(p, u, 1800));
  }
  out.push("");
  return out.join("\n");
}

function dilatationSection(cat, lang) {
  const out = [];
  out.push(lang === "en" ? "## Expansion gaps" : "## Dilatacijske reže");
  out.push("");
  out.push(lang === "en"
    ? "Recommended gap (mm) by board length (1–5 m) and mounting temperature, from the official WoodCore installation PDF:"
    : "Priporočen razmak (mm) po dolžini deske (1–5 m) in temperaturi ob montaži, po uradnem PDF navodilu WoodCore:");
  out.push("");
  out.push((lang === "en" ? "| Mounting temp. (°C) | 1 m | 2 m | 3 m | 4 m | 5 m |" : "| Temperatura ob montaži (°C) | 1 m | 2 m | 3 m | 4 m | 5 m |"));
  out.push("|---|---|---|---|---|---|");
  cat.DIL.temps.forEach((t, i) => {
    out.push("| " + t + " | " + cat.DIL.vals[i].join(" | ") + " |");
  });
  out.push("");
  out.push(lang === "en"
    ? "Corner gap 1 mm. Boards are not a structural element; spacers keep ventilation during installation."
    : "Vogalna reža 1 mm. Deske niso konstrukcijski element; med montažo distančniki ohranjajo zračenje.");
  out.push("");
  return out.join("\n");
}

function facts(lang) {
  const v = parseChangelog(ROOT);
  const out = [];
  out.push(lang === "en"
    ? "- Type: web application (PWA) — works offline on site"
    : "- Vrsta: spletna aplikacija (PWA) — deluje tudi brez signala na terenu");
  out.push(lang === "en" ? "- License: " + PRODUCT.license : "- Licenca: " + PRODUCT.license);
  out.push(lang === "en" ? "- Platforms: " + PRODUCT.operatingSystem.replace("Web (PWA) — ", "modern browsers: ") : "- Platforma: " + PRODUCT.operatingSystem);
  out.push(lang === "en"
    ? "- Exports: PDF, SVG, DXF, STEP; BOM, assembly plan, cutting plan, quotation (CSV); order, checklist, material sheet, Roksal enquiry (TXT)"
    : "- Izvozi: PDF, SVG, DXF, STEP; kosovnica, montažni načrt, rezalni načrt, predračun (CSV); naročilnik, checklist, tehnični list, povpraševanje Roksal (TXT)");
  out.push(lang === "en"
    ? "- Latest version: " + v.latest.version + " (" + v.latest.date + ")"
    : "- Zadnja različica: " + v.latest.version + " (" + v.latest.date + ")");
  out.push(lang === "en"
    ? "- Material catalogue: WoodCore WPC (Roksal d.o.o.) — profiles, palettes, spacing and fastening rules"
    : "- Materialni katalog: WoodCore WPC (Roksal d.o.o.) — profili, palete, razmaki in pravila pritrjevanja");
  out.push(lang === "en"
    ? "- Privacy: no external network calls — photos and measurements stay on the device"
    : "- Zasebnost: brez zunanjih omrežnih klicev — fotografije in meritve ostanejo na napravi");
  return out.join("\n");
}

function faqSection(faq, lang) {
  const out = [];
  out.push(lang === "en" ? "## Frequently asked questions" : "## Pogosta vprašanja");
  out.push("");
  for (const f of faq) {
    out.push("### " + f.q);
    out.push("");
    out.push(f.a);
    out.push("");
  }
  return out.join("\n");
}

function legalSection(cat, lang) {
  const k = cat.woodcoreRegistry().kontaktni;
  const out = [];
  out.push(lang === "en" ? "## Warnings and legal notes" : "## Opozorila in pravne opombe");
  out.push("");
  for (const o of k.opozorila) out.push("- " + o);
  out.push("- " + k.eula + ".");
  out.push("- " + k.garancija + ".");
  out.push((lang === "en" ? "- Supplier: " : "- Dobavitelj: ") + k.dopisatelj + (lang === "en" ? ", terms " : ", pogoji ") + k.pogoji + ".");
  out.push((lang === "en"
    ? "- Enquiries: info@roksal.com (plain text — the app makes no network requests)"
    : "- Povpraševanje: info@roksal.com (navadno besedilo — aplikacija ne vzpostavlja omrežnih povezav)"));
  out.push("");
  return out.join("\n");
}

function sourcesSection(lang) {
  const out = [];
  out.push(lang === "en" ? "## Sources" : "## Viri");
  out.push("");
  out.push(lang === "en"
    ? "Catalogue data compiled from the official Roksal WoodCore materials:"
    : "Katalogski podatki so povzeti iz uradnih Roksal WoodCore virov:");
  out.push("");
  out.push("- [WoodCore WPC desks — catalogue](https://roksal.com/woodcore-wpc-deske/)");
  out.push("- [Partition walls — transverse boards](https://roksal.com/woodcore-wpc-deske/pregradne-stene/precne-deske/)");
  out.push("- [Partition walls — vertical boards](https://roksal.com/woodcore-wpc-deske/pregradne-stene/pokoncne-deske/)");
  out.push("- [WoodCore installation manual (PDF, SL)](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf)");
  out.push("");
  return out.join("\n");
}

function renderLLMS(root) {
  const cat = loadCatalog(root || ROOT);
  const v = parseChangelog(root || ROOT);
  const profileKeys = Object.keys(cat.WC);

  /* SL */
  const sl = [
    "# " + PRODUCT.name,
    "",
    "> " + PRODUCT.descriptionSL,
    "",
    facts("sl"),
    "",
    "## Zmogljivosti",
    "",
    ...PRODUCT.featuresSL.map((f) => "- " + f),
    "",
    "## " + HOWTO_SL.name,
    "",
    HOWTO_SL.description,
    "",
    ...HOWTO_SL.steps.map((s, i) => (i + 1) + ". **" + s.name + "** — " + s.text),
    "",
    "## Profili WoodCore WPC",
    "",
    ...profileKeys.map((k) => profileSection(cat, k, "sl")),
    dilatationSection(cat, "sl"),
    faqSection(FAQ_SL, "sl"),
    legalSection(cat, "sl"),
    sourcesSection("sl"),
  ].join("\n");

  /* EN */
  const en = [
    "# " + PRODUCT.name,
    "",
    "> " + PRODUCT.descriptionEN,
    "",
    facts("en"),
    "",
    "## Features",
    "",
    ...PRODUCT.featuresEN.map((f) => "- " + f),
    "",
    "## " + HOWTO_EN.name,
    "",
    HOWTO_EN.description,
    "",
    ...HOWTO_EN.steps.map((s, i) => (i + 1) + ". **" + s.name + "** — " + s.text),
    "",
    "## WoodCore WPC profiles",
    "",
    ...profileKeys.map((k) => profileSection(cat, k, "en")),
    dilatationSection(cat, "en"),
    faqSection(FAQ_EN, "en"),
    legalSection(cat, "en"),
    sourcesSection("en"),
  ].join("\n");

  return { "llms.txt": sl + "\n", "llms.en.txt": en + "\n" };
}

if (require.main === module) {
  const out = renderLLMS(ROOT);
  for (const [file, text] of Object.entries(out)) {
    fs.writeFileSync(path.join(ROOT, file), text, "utf8");
    console.log("Zapisano: " + file + " (" + text.length + " znakov).");
  }
}

module.exports = { renderLLMS };
