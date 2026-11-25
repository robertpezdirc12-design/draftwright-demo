/**
 * Vsebina za strojno berljive izhode (scripts/generate-llms.js, scripts/generate-seo.js).
 *
 * En vir resnice za produktna dejstva, pogosta vprašanja (FAQ) in HowTo korake —
 * ista vsebina gre v llms.txt / llms.en.txt in v schema.org JSON-LD (FAQPage, HowTo),
 * da besedila ne razpadejo po kanalih. Odgovori so samostojni (vsak zase citirljiv),
 * brez povezav in brez sklicev "kot zgoraj". Dejstva so povzeta iz vsebine aplikacije
 * (register WoodCore, katalog v galeriji, opozorila) — tests/seo.test.js preverja,
 * da se ključni fragmenti dejansko pojavijo tudi v aplikaciji.
 */
"use strict";

/* Absolutna domena je potrebna za schema.org URL-je (screenshot, downloadUrl …). */
const SITE_URL = (process.env.SITE_URL || "https://draftwright-demo.vercel.app").replace(/\/+$/, "");

const PRODUCT = {
  name: "Tehnična risba PRO",
  alternateName: "DraftWright",
  descriptionSL:
    "Tehnična risba PRO (DraftWright) iz fotografije ograje, balkona ali terase pripravi tehnično risbo " +
    "z dimenzijami, kosovnico in montažnimi opombami za WoodCore WPC sisteme. Podpira prečno in pokončno " +
    "ograjo, fasado, teraso, pregradno steno in napušč; izračuna razmake stebrov in nosilcev po Roksal " +
    "pravilih ter izvaža PDF, SVG, DXF, STEP in CSV. Deluje kot PWA tudi brez signala na terenu.",
  descriptionEN:
    "Tehnična risba PRO (DraftWright) turns a photo of a fence, balcony or terrace into a technical drawing " +
    "with dimensions, bill of materials and assembly notes for WoodCore WPC systems. It covers transverse and " +
    "vertical fences, façades, terraces, partition walls and eaves; computes post and batten spacing by Roksal " +
    "rules and exports PDF, SVG, DXF, STEP and CSV. Runs as a PWA, offline on site.",
  category: "DesignApplication",
  subCategory: "Technical drawing / CAD",
  operatingSystem: "Web (PWA) — Windows, macOS, Linux, Android, iOS",
  license: "MIT",
  price: "0",
  priceCurrency: "EUR",
  applicationSuite: "WoodCore WPC (Roksal)",
  screenshot: SITE_URL + "/samples/out_primer.png",
  downloadUrl: SITE_URL + "/tehnicka-risba-pro.html",
  featuresSL: [
    "Fotografija → umeritev (2 ali 4 točke) → dimenzije v milimetrih",
    "Register WoodCore: ROMB-67, POLNA-128, DESKA-150, POLNA-57/32, POLNA-100, KUBO-80/42",
    "Avtomatski izračun stebrov in nosilcev po Roksal pravilih (prečna/pokončna ograja, fasada, terasa, pregrada, napušč)",
    "Dilatacijske reže po uradni temperaturni tabeli",
    "Izvoz PDF, SVG, DXF, STEP, kosovnica (CSV), montažni načrt, rezalni načrt, predračun",
    "Deluje brez signala (PWA) — fotografije in podatki ostanejo lokalno",
  ],
  featuresEN: [
    "Photo → calibration (2 or 4 points) → dimensions in millimetres",
    "WoodCore registry: ROMB-67, POLNA-128, DESKA-150, POLNA-57/32, POLNA-100, KUBO-80/42",
    "Automatic post and batten spacing by Roksal rules (transverse/vertical fence, façade, terrace, partition, eaves)",
    "Expansion gaps from the official temperature table",
    "Exports PDF, SVG, DXF, STEP, BOM (CSV), assembly plan, cutting plan, quotation",
    "Works offline (PWA) — photos and data stay on the device",
  ],
};

/* Pogosta vprašanja — SL (na voljo tudi aplikaciji prek FAQPage v JSON-LD).
   Odgovori morajo stati samostojno: iskalniki in AI asistenti jih citirajo posamezno. */
const FAQ_SL = [
  {
    q: "Katere profile WoodCore WPC podpira Tehnična risba PRO?",
    a: "Aplikacija pozna šest profilov WoodCore: ROMB-67 (67 × 26 × 5800 mm), POLNA-128 (128 × 16,5 × 2200 mm), DESKA-150 (150 × 25 × 4000 mm), POLNA-57/32 (57 × 32 × 5800 mm), POLNA-100 (100 × 12 × 5800 mm) in KUBO-80/42 (80 × 42 × 5800 mm). Za vsak profil upošteva katalogske razmake stebrov in nosilcev ter pravila pritrjevanja.",
  },
  {
    q: "Ali so izračuni in risbe zavezujoča dokumentacija?",
    a: "Ne. Izračuni so orientacijske narave in niso pogodbena dokumenta; vse mere so v milimetrih (mm) in jih je pred izdelavo treba preveriti na objektu. Predračun je orientacijski in ni ponudba — za zavezujočo ponudbo in DDV velja pogodbeni obrazec.",
  },
  {
    q: "Kakšen je največji razmak stebrov pri pokončni ograji?",
    a: "Največji razmak stebrov je odvisen od profila: ROMB-67 do 1450 mm, POLNA-57/32 do 1500 mm ter POLNA-100 in POLNA-128 do 1800 mm do višine 1500 mm, nad to višino pa 1500 mm. Pri pregradnih stenah znaša razmak stebrov 150–180 cm po profilu.",
  },
  {
    q: "Ali je pri profilu ROMB-67 potrebna aluminijasta cev?",
    a: "Da. ROMB-67 se montira skrito z L-kotniki levo in desno na stebru, aluminijasta cev v sredini profila pa je obvezna in vključena v ceno romb deske — montaža brez alu cevi ni mogoča. Vijak 3,9 mm se privija z vrtino Ø3,2 mm v alu cev in romb ter Ø4,2–4,5 mm v WPC.",
  },
  {
    q: "Kako poteka pritrjevanje WPC desk na konstrukcijo?",
    a: "Najmanjši odmik vijaka od roba reza je 3 cm, pri konstrukciji na ploščo največ 15 cm, pri bočni montaži na ploščo pa 10 cm. Izvrtina v WPC je 1 mm večja od vijaka (predvrtanje +1 mm), pri profilu POLNA-57/32 pa je luknja v WPC manjša od vijaka in v konstrukciji večja. Vijak je 30–150 mm od roba deske, montaža poteka nad +5 °C.",
  },
  {
    q: "Kako vzdrževati WPC vrtno pohištvo?",
    a: "Površino očistite z vodo. Za dodatno vodoodbojno zaščito nanesite WEPOS WPC impregnacijo na dobro očiščeno in popolnoma suho površino, predvsem na mizne plošče in sedeže.",
  },
  {
    q: "Kako skladiščiti WPC deske?",
    a: "Deske hranite v suhem in zračnem prostoru, na ravni in čisti podlagi po celotni dolžini in širini. Ob neustreznem skladiščenju se reklamacija ne upošteva.",
  },
  {
    q: "Kakšna je garancija za WoodCore WPC?",
    a: "Garancija znaša 15 let na material in 2 leti na dela izvedena s strani Roksal/a. Odtenek deske se v prvem letu posvetli za 5–10 %.",
  },
];

const FAQ_EN = [
  {
    q: "Which WoodCore WPC profiles does Tehnična risba PRO support?",
    a: "The app knows six WoodCore profiles: ROMB-67 (67 × 26 × 5800 mm), POLNA-128 (128 × 16.5 × 2200 mm), DESKA-150 (150 × 25 × 4000 mm), POLNA-57/32 (57 × 32 × 5800 mm), POLNA-100 (100 × 12 × 5800 mm) and KUBO-80/42 (80 × 42 × 5800 mm). For each profile it applies the catalogue post and batten spacing and the fastening rules.",
  },
  {
    q: "Are the calculations and drawings binding documentation?",
    a: "No. The calculations are orientational and are not contractual documents; all dimensions are in millimetres (mm) and must be verified on site before fabrication. The quotation is orientational and is not an offer — the contract form governs binding offers and VAT.",
  },
  {
    q: "What is the maximum post spacing for a vertical fence?",
    a: "The maximum post spacing depends on the profile: ROMB-67 up to 1450 mm, POLNA-57/32 up to 1500 mm, and POLNA-100 and POLNA-128 up to 1800 mm for fence heights up to 1500 mm (1500 mm above that). For partition walls the post spacing is 150–180 cm depending on the profile.",
  },
  {
    q: "Is an aluminium tube required for the ROMB-67 profile?",
    a: "Yes. ROMB-67 is mounted hidden with L-brackets left and right on each post; the aluminium tube in the middle of the profile is mandatory and included in the price of the ROMB board — mounting without the aluminium tube is not possible. A 3.9 mm screw uses a Ø3.2 mm hole in the aluminium tube and the ROMB board, and Ø4.2–4.5 mm in the WPC.",
  },
  {
    q: "How are WPC boards fastened to the substructure?",
    a: "The minimum screw offset from the cut edge is 3 cm, up to 15 cm for slab-mounted substructure and 10 cm for side-mounted slabs. The WPC hole is 1 mm larger than the screw (pre-drilling +1 mm); for POLNA-57/32 the WPC hole is smaller than the screw and the substructure hole larger. Screws sit 30–150 mm from the board edge; mounting is done above +5 °C.",
  },
  {
    q: "How do I maintain WPC garden furniture?",
    a: "Clean the surface with water. For extra water-repellent protection apply WEPOS WPC impregnation to a well-cleaned and completely dry surface, especially tabletops and seats.",
  },
  {
    q: "How should WPC boards be stored?",
    a: "Store boards in a dry, ventilated room on a flat, clean support along their full length and width. With improper storage, warranty claims are not accepted.",
  },
  {
    q: "What is the warranty for WoodCore WPC?",
    a: "The warranty is 15 years on the material and 2 years on work performed by Roksal. The shade of the board lightens by 5–10 % in the first year.",
  },
];

const HOWTO_SL = {
  name: "Od fotografije do tehnične risbe WPC ograje",
  description:
    "Pet korakov v aplikaciji Tehnična risba PRO: nalaganje fotografije, umeritev, parametri sistema WoodCore, generiranje risbe in izvoz dokumentacije.",
  steps: [
    { name: "Naložite fotografijo", text: "V meniju Datoteka naložite fotografijo ograje, balkona ali terase ali izberite pripravljen primer risbe." },
    { name: "Umerite sliko", text: "Z znano mero (npr. višina stebra) umerite sliko s 2 ali 4 točkami; merilo se pretvori v milimetre." },
    { name: "Nastavite parametre", text: "Vnesite dolžino L, višino H, število desk, profil WoodCore in uporabo (prečna ali pokončna ograja, fasada, terasa, pregrada, napušč)." },
    { name: "Generirajte risbo", text: "Aplikacija po Roksal pravilih izračuna razmake stebrov in nosilcev, doda montažne opombe in kontrolni list ter generira tehnično risbo." },
    { name: "Izvozite dokumentacijo", text: "Izvozite PDF, SVG, DXF ali STEP, kosovnico (CSV), montažni načrt, rezalni načrt, predračun ali povpraševanje Roksal (TXT)." },
  ],
};

const HOWTO_EN = {
  name: "From a photo to a technical WPC fence drawing",
  description:
    "Five steps in Tehnična risba PRO: load a photo, calibrate, set the WoodCore system parameters, generate the drawing and export the documentation.",
  steps: [
    { name: "Load a photo", text: "Use the File menu to load a photo of a fence, balcony or terrace, or open a prepared sample drawing." },
    { name: "Calibrate the image", text: "Calibrate the image with 2 or 4 points against a known dimension (e.g. post height); the scale is converted to millimetres." },
    { name: "Set the parameters", text: "Enter length L, height H, board count, the WoodCore profile and the use case (transverse or vertical fence, façade, terrace, partition, eaves)." },
    { name: "Generate the drawing", text: "The app computes post and batten spacing by Roksal rules, adds assembly notes and a checklist, and generates the technical drawing." },
    { name: "Export the documentation", text: "Export PDF, SVG, DXF or STEP, a bill of materials (CSV), assembly plan, cutting plan, quotation or a Roksal enquiry (TXT)." },
  ],
};

module.exports = { SITE_URL, PRODUCT, FAQ_SL, FAQ_EN, HOWTO_SL, HOWTO_EN };
