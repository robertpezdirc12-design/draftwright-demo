# Strategija razvoja in roadmap produkta Draftwright — tehnična risba WPC ograj, fasad in teras iz fotografije

**Datum:** 2026-11-22

> **Opomba o snapshot-u:** to strategično poročilo je napisano ob **monolitni točki produkta** (ena datoteka `tehnicka-risba-pro.html`, ~4021 vrstic; opis »enodatotečnega« jedra, vrstni ankrji 851–917 / 919–1176). Med razvojem se je zgradba modularizirala v **`js/` (17 modulov)**, HTML je sedaj samo ovojnica (841 vrstic) in testni surovi so zrasli na **21**. Poročilo ostaja veljavno kot **strateški snapshot 2026-11-22**; za dejanske točke vgrajevanja glej `research/predlogi.md` (usklajeno z `js/*` ankrji) in `ANALIZA.md` (modularna zgradba).

---

## KAZALNIK

- **UVOD** — problem, namero poročila in napoved poglavij
- **Poglavje 1** — Stanje produktne zrelosti: pipeline, testiranje in ključne tehnične omejitve
- **Poglavje 2** — Zunanji razvojni trendi: računalniški vid, WPC trg, Web-based CAD/CAM, offline PWA in generativna AI dokumentacija
- **Poglavje 3** — Konkurenčna lega in obseg niše: WPC specialist proti generalnemu Web CAD-u
- **Poglavje 4** — Strateške odločitve in kompromisi: niša, arhitektura, odgovornost in komercializacija
- **Poglavje 5** — Predlagana roadmap za naslednje faze: prioritizacija, mejniki in tveganja
- **SKLEPO poglavje** — skupna smer in izvedljivost
- **VIRI** — združen, abecedno urejen seznam virov (APA)

---

## UVOD

Produkt Draftwright (»Tehnična risba PRO«) se je v razvojnem oknu 19.–21. novembra 2026 z 78 commiti razvil v izjemno zrel stanje za samostojno enodatotečno spletno aplikacijo: celoten cevovod *slika → umeritev → zaznavanje lamel → parametri → tehnična risba → izvoz* je implementiran in zaklenjen v `main`, testna disciplina obsega trenutno 19 testnih surov v delovnem drevesu (zadnje potrjeno stanje v CI — commit `b9310c9` — je bilo 420/420 trditev v takratnih 18 surovih), zlati posnetki in neodvisna validacija CAD formatov prek ezdxf/steputils pa potrjujejo izvedbeno kakovost (dokumentirano v [README.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/README.md), [ANALIZA.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/ANALIZA.md) ter živi demo na [draftwright-demo.vercel.app](https://draftwright-demo.vercel.app)). Kljub tej zrelosti izdelek nosi javno dokumentirane tehnične meje — poenostavljena 3D geometrija brez boolevskih operacij, orientacijska narava zaznavanja in statični značaj predračuna — zato služi pripravi dokumentacije in orijentacijskim ocenam, ne pa 3D tisku, CNC ali statičnemu izračunu.

V tem kontekstu poročilo obravnava strateško vprašanje, kako produkt prevesti iz zrele, izvedbene točke v naslednje faze razvoja. Namera je dvojna: prvič, opredeliti strateške kompromise (niša proti generalnemu CAD, enodatotečnost proti WASM jedru, odgovornost, komercializacija in vloga AI), drugič, izpeljati konkretno, prioritizirano roadmapo z mejniki in pravili za ustavitev. Ob tem poročilo opremi izdelek zunanjo perspektivo: globalni trg WPC bo po napovedih [Grand View Research (2025)](https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market) do leta 2033 dosegel 21,51 mrd USD ob CAGR 11,7 %, računalniški vid pa hitro prestopa od klasične geometrije k globinskemu učenju — reprezentativen je model C3Po s 34-odstotnim zmanjšanjem napake pri vezavi slik z arhitekturnimi tlorisi ([Cornell Chronicle, 2025](https://news.cornell.edu/stories/2025/12/computer-vision-connects-real-world-images-building-layouts)).

Poročilo je sestavljeno iz petih poglavij: prvo opisuje trenutno stanje produktne zrelosti in ključne tehnične omejitve, drugo podaja zunanje trende (računalniški vid, WPC trg, Web CAD/CAM, offline PWA, generativna AI), tretje obravnavo konkurenčno lego in obseg niše, četrto izpoda strateške odločitve in kompromise, peto pa predlaga izvedljivo roadmapo z prioritizacijo, mejniki in tveganji. Skupaj tvorijo osnovo za oblikovanje naslednjih razvojnih odločitev produkta.

---

# Poglavje 1 — »Stanje produktne zrelosti: pipeline, testiranje in ključne tehnične omejitve«

## 1.1 Teza

Produkt Draftwright (»Tehnična risba PRO«) je dosegel zelo visoko tehnično zrelost za samostojno enodatotečno spletno aplikacijo: celoten cevovod (slika → umeritev → zaznavanje lamel → parametri → tehnična risba → izvoz) je implementiran in zaklenjen v `main`, testna disciplina pa trenutno obsega 19 testnih surov (jsdom) v delovnem drevesu, vgrajenih v `npm test` (zadnje potrjeno stanje v CI — commit b9310c9, »zadnji vsečni commit veje pomoc-laiki (PR #34), združen z a6e2b9b« — je bilo 420/420 trditev v takratnih 18 surovih; najnovejši surov `regression.test.js` je še le v delovnem drevesu, untracked), ter neodvisno validacijo CAD formatov; vsi razvojni programi pa so že združeni v osrednjo vejo. Produkt nosi javno in iskreno dokumentirane tehnične meje (3D geometrija brez booleanov, orientacijsko zaznavanje, statični značaj predračuna in risbe) — namenjen je pripravi dokumentacije in orijentacijskim ocenam, ne pa 3D tisku, CNC ali statičnemu izračunu.

## 1.2 Dokazi: pipeline in stanje roadmap-a

Cevovod je linearen in popoln.

- **Umeritev:** 2-točkovna linearna / 4-točkovna perspektivna homografija z inverzno preslikavo.
- **Zaznavanje lamel:** svetlostni profil z večstolpno mediano 7 stolpcev (sredina ±10/20/30 %) in ROMB fazi 15° (moduli v ANALIZA.md, vrstice 851–917 oziroma 919–1176).
- **Parametri:** 6 WPC profilov (ROMB-67, POLNA-128, DESKA-150, POLNA-57/32, POLNA-100, KUBO-80/42), 7 uporab, dilatacijski kalkulator po uradni tabeli, 8 podlag, barvne palete (ANALIZA.md, vrstice 48–53 in 72–74).
- **Risba:** 5 pogledov + detajli + BOM.
- **Izvoz:** vektorski PDF, SVG, DXF R12, STEP AP214, CSV/TXT/JSON (README.md, vrstice 26–69).

**Stanje roadmap-a:** 78 commitov v razvojnem oknu 19.–21. 11. 2026 (`git log`, `git rev-list --count HEAD`). Faze P1–P5, F1–F6, Faza 0.5–3, issue-2, issue-3.

**Ključna diagnostična ugotovitev:** vse 28 oddaljenih vej kaže 0 commitov pred `main` — vsi razvojni programi so združeni; odprte veje so zgolj housekeeping. Izdelek živi v `main` (zlati posnetki + živa demo na draftwright-demo.vercel.app).

## 1.3 Dokazi: testna zrela in validacija

- **Osnova števila surov (razlaga):** **Trenutno stanje delovnega drevesa = 19 testnih surov (jsdom), vgrajenih v `npm test`** — delovno-drevesni `package.json` natančno navezuje vseh 19, vključno z najnovejšim surovem `regression.test.js`. To stanje še ni commitano: datoteka `regression.test.js` je untracked in ni del commitanega `package.json`. **Zadnje potrjeno stanje v CI: commit b9310c9 (»zadnji vsečni commit veje pomoc-laiki (PR #34), združen z a6e2b9b«) poroča 420/420 trditev v takratnih 18 surovih.** Vse trditve o »420/420« se torej nanašajo na commit b9310c9 (18 surov); trditev »19 surov« se nanaša na delovno dreveso.
- **Večslojna pokritost:** zlati posnetki (6 datotek), E2E klik-za-klikom (`user-e2e.test.js`, +25 trditev; masa 57,1 kg, nosilci 4, vijaki 16, sidra 8; konsistentnost BOM ↔ kosovnica ↔ rezalni načrt ↔ predračun ↔ checklist), samoprevera 126 kombinacij (6×7×3).
- **Neodvisna validacija CAD:** ezdxf 1.4.5: 0 napak / 0 popravkov, ANSI_1250, 420×297; steputils 0.1 + lastni ISO-10303-21 preverjevalec: 8 VERTEX + 12 EDGE_CURVE, 26 MANIFOLD_SOLID_BREP (*simplified box solids, not production CAD*), 0 nedoločenih referenc.
- **CI:** Node 22.22.2, sproži na push in PR, `npm ci && npm test`.

## 1.4 Analiza: ključne tehnične omejitve

1. **STEP AP214 brez booleanov:** 26 MANIFOLD_SOLID_BREP predstavljajo poenostavljene kockastidele (*simplified box solids, not production CAD*) — primerno za orijentacijsko vizualizacijo, ne za proizvodnjo.
2. **DXF R12 v prostoru lista:** vektorska vsebina je omejena na format 420×297.
3. **Orientacijsko zaznavanje:** meritev je funkcija orientacije fotografije; samodejni L iz bbox-a je nestabilen (commit b152b75, dokumentirano v README) — zato ročno vpisane mere ostanejo referenčni način.
4. **Predračun ni ponudba:** zneski so orijentacijske ocene, ne pogodbeni predračun.
5. **Risba ni statika:** izdelek nima nosilnosti; vse vrednosti so namenjene dokumentaciji.

*(Ločitev dejav od posledic: omejitve 1–4 so dejstva o formatih in algoritmih; posledica vseh je, da izdelek služi dokumentaciji in ocenam, ne pa proizvodnji niti statiki.)*

## 1.5 Primerjava s tipično enodatotečno aplikacijo

Take testne discipline (jsdom + zlati posnetki + E2E + neodvisna CAD validacija prek ezdxf/steputils + CI) so **relativno neobičajne za samostojno enodatotečno aplikacijo** in se pogosto srečajo v večmodulnih sistemih s CI/CD — trditev, ki izrazita avtorjevo presojo, ne pa splošno veljavno dejstvo. Vektorski PDF se generira prek lokalno vendiranih knjižnic jsPDF + svg2pdf in deluje offline prek Service Workerja.

## 1.6 Povzetek

Draftwright predstavlja produkt v izjemno zrelom stanju: celoten cevovod, 78 commitov, vse razvojno združeno v `main`, trenutno 19 testnih surov v delovnem drevesu (vgrajeni v `npm test`; zadnje potrjeno v CI: commit b9310c9 — 420/420 trditev v takratnih 18 surovih; najnovejši surov `regression.test.js` je še untracked, le v delovnem drevesu), zlati posnetki, E2E, samoprevera 126 kombinacij in neodvisna CAD validacija prek CI. Edini pravi tehnični tveganja niso v kodi, temveč v mejah formatov (1.4) in orientacijski naravi zaznavanja/predračuna.

## Seznam virov

**Intervni (7):**

1. README.md (Draftwright, lokalno).
2. ANALIZA.md (lokalno; moduli umeritve vrst. 851–917, zaznavanja vrst. 919–1176, profili/palete vrst. 48–53 in 72–74).
3. package.json (lokalno; delovno-drevesna verzija navezuje 19 surov).
4. docs/validacija-izvozov.md (lokalno).
5. Git zgodovina (commits b152b75 → b9310c9 »zadnji vsečni commit veje pomoc-laiki (PR #34), združen z a6e2b9b« → a6e2b9b HEAD (združitev PR #34), skupaj 78 commitov).
6. tests/ + tests/golden/ + samples/ (lokalno; 19 testnih datotek v delovnem drevesu, od tega regression.test.js untracked).
7. .github/workflows/ci.yml (Node 22.22.2, push/PR, `npm ci && npm test`).

**Zunanji (5):**

1. jsdom — https://github.com/jsdom/jsdom
2. ezdxf — https://github.com/mozman/ezdxf
3. steputils — https://pypi.org/project/steputils/
4. jsPDF — https://github.com/parallax/jsPDF
5. svg2pdf.js — https://github.com/yWorks/svg2pdf.js

*(Opomba doslednosti: povsod v poglavju je število surov označeno z osnovo — commitano stanje b9310c9 = 18 surov / delovno dreveso = 19 surov.)*

---

# Poglavje 2 — »Zunanji razvojni trendi: računalniški vid, WPC trg, Web-based CAD/CAM, offline PWA in generativna AI dokumentacija«

## 2.1 Računalniški vid za merjenje v gradbeništvu

Stanje na svetu 2025/2026 kaže jasen premik od klasičnih geometrijskih metod (homografija, ročno umerjanje) proti globokemu učenju za vezavo slik in tlorisov. Ključna zaveščina je model C3Po (Cross-View Cross-Modality Correspondence), predstavljen na NeurIPS 2025 v Cornellu, ki z datasetom C3 (90.000 parov fotografija–tlorisov, 153 milijonov pikselnih korespondenc) dosega vezavo slik z arhitekturnimi tlorisi s 34-odstotnim zmanjšanjem napake ([Cornell Chronicle, 2025](https://news.cornell.edu/stories/2025/12/computer-vision-connects-real-world-images-building-layouts)). Istovrstne raziskave ponazarjajo, da metode brez treniranja (*training-free*), ki združujejo 3D rekonstrukcijo in 2D segmentacijo, vse pogosteje rekonstruirajo večpodropne gradnje neposredno iz fotografij — reprezentativen je MultiFloor3D, baseline metoda brez treniranja, izvirajoča iz dela HouseLayout3D (Bieri, Rakotosaona, Tateno, Engelmann, Guibas — NeurIPS 2025; ETH Zürich / Google / Stanford), [HouseLayout3D](https://houselayout3d.github.io/). Prav tako je trend hibridizacije: fotogrametrija in LiDAR postajata običajen vir podatkov v gradbeništvu — že v 2025 so objavljeni študiji merjenja prostornine zemlje v kovalci copala s trdninskimi 3D LiDAR senzorji ([Springer Construction Robotics 9:21, 2025](https://link.springer.com/article/10.1007/s41693-025-00166-w)), komercialni dronski sistemi pa omogočajo natančne terenske mere brez tradicionalnih geodetskih orodij.

Pomen za Draftwright: Trenutna metodika (svetlostni profil + mediana 7 stolpcev, 2/4-točkova umeritev) je robustna, a omejena pri neenakem osvetljenju in perspektivi. Uvod globinskega modela (npr. pretrained image-to-floorplan ali edge-detection omrežja, prilagojenega na lamele WPC) bi omogočil samodejno zaznavanje profilov in dolžin s manjšim ročnim prilagajanjem. Raziskovalni modeli (C3Po in podobni) še niso na voljo v produkciji, zato je realizabilna stopnja: v fazi razvoja uporabiti klasično CV kot osnovo, a z vzorci za pripravo lastnega dataseta fotografij lamel z znano geometrijo.

## 2.2 Trg WPC/wood-plastic kompozitov

Globalni trg WPC bo po napovedih [Grand View Research (2025)](https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market) do leta 2033 dosegel 21,51 mrd $ ob CAGR 11,7 % (obdobje 2026–2033). Gradbeništvo je največji segment z 71,3-odstotnim deležem prihodkov leta 2025; vodilna je severna Amerika (51,3 % trga), najhitreje rastoča pa Azijo-pacifiška regija (CAGR 12,4 %). Rast povezujejo s trajnostnostjo (zamenjava plastike), infrastrukturnim razvojem in estetsko zahtevo po lesenem videzu.

Pomen za Draftwright: (1) podpora dodatnih materialnih znamk (npr. AZEK, Trex, Fiberon, RENOLIT); (2) podpora za večje število profilov (nad 6) in podlag (nad 8) v BOM kalkulaciji; (3) regionalna prilagoditev.

## 2.3 Web-based CAD/CAM: jedro CAD v brskalniku

Trend: industrijska CAD jedra se selijo v brskalnik prek WebAssembly. [Chili3D](https://github.com/xiangechen/chili3d) je odprtokodna TypeScript aplikacija (aktivna od ~2023), ki s OpenCascade (OCCT) prek Emscripten/Three.js omogoča parametricno modeliranje s pravimi boolevskimi operacijami neposredno v brskalniku. [ODA (Open Design Alliance)](https://www.opendesign.com/) ponuja produkt inWEB za vgradnjo CAD/BIM urejanja in prikaza DWG v web ali SaaS aplikacije, z licenco brez royalties; ODA poleg tega ponuja MCP serverje za vezavo CAD in BIM podatkov na AI agente (podpirajo DWG/DXF, STEP, IFC) — vir preverjen na uradni strani ODA: [ODA MCP Servers](https://www.opendesign.com/products/mcp-servers).

Pomen za Draftwright: Trenutni izvoz STEP (AP214 BREP brez boolevskih operacij) je omejen. Uvod pravih boolevskih operacij (npr. prek [OpenCascade.js](https://github.com/donalffons/opencascade.js) ali ODA/Chili3D pristopa) bi omogočil generiranje prave solid geometrije za WPC profile. Podpora DXF ([ezdxf](https://github.com/mozman/ezdxf), MIT) in izvoz CNC G-code bi razširila uporabnost.

## 2.4 Offline PWA in terenska orodja

Offline-first je postala uveljavljena paradigma za terenska orodja; do leta 2025 so PWA postale glaven način dostave mobilnih izkušenj ([Designveloper, 2025](https://www.designveloper.com/blog/why-progressive-web-apps/)). Industrijski reševalci ([Truestar](https://truestarapp.com/), TrueContext, [offlinefirst.org](https://offlinefirst.org/)) ponazarjajo, da montažne ekipe potrebujejo dostop do podatkov tudi v območjih brez signala. PWA tehnologija (Service Worker, Cache API, Background Sync) omogoča lokalno shranjevanje celotne aplikacije z obveznim sinhroniziranjem ([GitHub PWA topic](https://github.com/topics/progressive-web-app)).

Pomen za Draftwright: Draftwright je že offline PWA (280 KB, brez build/strežnika) — konkurenčna prednost. (1) terenski režim za montažne ekipe (IndexedDB + verzioniranje BOM); (2) sinhronizacija ob povezavi; (3) mobilna kamera za zajem fotografij.

## 2.5 AI-podprto merjenje in generativna dokumentacija

Trg AI v gradbeništvu bo po napovedih [TechSci Research (2025)](https://www.techsciresearch.com/report/artificial-intelligence-ai-in-construction-market/20564.html) z 7,76 mrd $ (2025) dosegel 23,02 mrd $ do leta 2031 (CAGR 19,87 %). Gonilniki: pomanjkanje strokovnih delovnih sil (92 % podjetij poroča o težavah z zaposlovanjem), operativna učinkovitost (28 % projektnega časa izgubljenega za popravke), varnost. Več podjetij (Autodesk, Bentley, NVIDIA) že ponuja AI-podprta orodja za generiranje dokumentacije in zaznavanje kolizij (npr. [NVIDIA AEC / Omniverse](https://www.nvidia.com/en-au/industries/aec/)); po podatkih [DigitalOcean (2025)](https://www.digitalocean.com/resources/articles/generative-ai-use-cases) je generativna AI 2025 dosegla širšo uporabo v podjetniških procesih.

Pomen za Draftwright: (1) AI integracija (LLM agent) za avtomatizirano generiranje ponudbe iz fotografije WPC projekta — opozorilo: gre za velik preskok nad trenutno ±25-odstotno AI funkcijo, zahteva dodaten ML pipeline in ni v obsegu trenutne enodatotečne arhitekture; (2) ODA MCP serverji omogočajo vezavo CAD podatkov na AI agente (vir preverjen: opendesign.com/products/mcp-servers); (3) generativna AI za napovedovanje materialov in cene ob vnosu fotografije.

## Sklepek poglavja

Vseh pet trendov kaže v isto smer: tehnološke omejitve (WebAssembly, offline PWA, globinsko učenje) postajajo rešljive, trg WPC raste 11,7 % letno in AI integracija postaja standard. Draftwright je v ugodnem položaju pod pogoji: širitev CAD jedra (boolevske operacije, pravi solid), ML za zaznavanje lamel, AI integracija za generativno dokumentacijo.

## Seznam virov poglavja (zunanji):
1. Cornell Chronicle (2025) — https://news.cornell.edu/stories/2025/12/computer-vision-connects-real-world-images-building-layouts
2. Grand View Research (2025) — https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market
3. TechSci Research (2025) — https://www.techsciresearch.com/report/artificial-intelligence-ai-in-construction-market/20564.html
4. GitHub – xiangechen/chili3d — https://github.com/xiangechen/chili3d
5. ODA / Open Design Alliance — https://www.opendesign.com/
6. ODA MCP Servers — https://www.opendesign.com/products/mcp-servers
7. DigitalOcean (2025) — https://www.digitalocean.com/resources/articles/generative-ai-use-cases
8. ezdxf — https://github.com/mozman/ezdxf
9. offlinefirst.org — https://offlinefirst.org/
10. Truestar Digital — https://truestarapp.com/
11. Springer Construction Robotics 9:21 (2025) — https://link.springer.com/article/10.1007/s41693-025-00166-w
12. GitHub – donalffons/opencascade.js — https://github.com/donalffons/opencascade.js
13. GitHub PWA topic — https://github.com/topics/progressive-web-app
14. HouseLayout3D / MultiFloor3D — https://houselayout3d.github.io/
15. NVIDIA AEC (Omniverse) — https://www.nvidia.com/en-au/industries/aec/
16. Designveloper (2025) — https://www.designveloper.com/blog/why-progressive-web-apps/

---

# Poglavje 3 — »Konkurenčna lega in obseg niše: WPC specialist proti generalnemu Web CAD-u«

### Teza — kje stoji Draftwright

Draftwright (»Tehnična risba PRO«) ne tekmuje s splošnimi CAD orodji, ampak zaseda ozko niško presečišča treh področij: (1) fotografija→umeritev→tehnična risba, (2) parametrična logika WPC niše ([dilatacijske tabele](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf), 8 podlag, pravila [Roksal/WoodCore](https://roksal.com/)) in (3) večformatni izvoz (SVG/[DXF](https://github.com/mozman/ezdxf)/STEP) skupaj s celotno izvedbeno dokumentacijo (BOM, kerf optimizator, naročilnik). V tem presečišču ni neposrednega ponudnika: generalni CAD ima močno 3D in nosilnost, a ni nišno specializiran; nišni kalkulatorji ([WPC/deck](https://www.trex.com/build-your-deck/planyourdeck/deck-cost-landing/productcalculator/), ograjni) pa običajno ustavijo pri merah in količinah, brez celotne risbe in izvoza.

### Dokazi — konkurenčno polje (3 kategorije)

**(a) Namizni CAD** za ograje/oblotne konstrukcije: AutoCAD, SolidWorks, SketchUp (z dodatki), Revit — industrijski standard za nosilnost in obliko. Močno: zrel standard, statični izračun, nosilnost, velikostne knjižnice. Šibko: drago, ne-specializirano za WPC nišo in brez vgrajene dilatacijske logike ([Roksal/WoodCore tabela](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf)), brez parametričnih pravil za podlage in sidranja, nujno ročno risanje brez vhodnega kanala fotografija→risba. V tem razredu ni orodja, ki bi razumevalo nišno parametrikso WPC profilov.

**(b) Generalni Web-CAD / generativni orodja**: [OpenJSCAD](https://github.com/jscad/OpenJSCAD.org) (odprtokodni 3D JavaScript), [OpenCascade.js](https://github.com/donalffons/opencascade.js) (odprtokodni BREP/STEP kernel v JS), [OnShape](https://www.onshape.com/en/platform) (cloud CAD s parametričnim modeliranjem v brskalniku), CadQuery (Python, programsko CAD). Močno: pravi 3D, generativna/oblikovna moč, STEP izvoz. Šibko: ni dimenzijske logike ograjne niše, ni dilatacijskih/podlagovnih pravil, brez vhodnega kanala s fotografije — vsak projekt zahteva ponovno ročno izmeritev. Je splošen orodni komplet, ne specializiran delovni tok.

**(c) Vendor orodja WPC/les + nišni ograjni/deck kalkulatorji**. Tu je neposrednejša konkurenca; loči dva podrazreda. Prvi: lastni kalkulatorji znamk — npr. [Trex deck-cost/quantity kalkulator](https://www.trex.com/build-your-deck/planyourdeck/deck-cost-landing/productcalculator/) in [The Chippy Calc](https://thechippycalc.com/) (14 konstrukcijskih kalkulatorjev, med njimi balustrade spacing + decking quantities) — ponujajo le mere, količine in oceno stroškov, brez celotne tehnične risbe in izvoza v CAD formate. Drugi, bolj neposredni: konfiguratorji, ki ustvarjajo risbe in BOM — [EZRails Balustrade Planner](https://www.balustrade.co.za/) (dispozicija + cenjen delovni seznam + 3D pogled) in [Liveconfigurator](https://liveconfigurator.co.uk/) (ogrodja/stopnice/deck; »quote pack« z delovnim seznamom, CAD risbami in 3D renderjem). Tudi ti so vezani na lastno znamko/material, ne obravnavajo WPC profilov sproti in ne vsebujejo dilatacijskih/pravilnih logik. Med javno dostopnimi ponudniki ni **znane neposredne ponudbe**, ki hkrati pokriva: fotografija→risba + dilatacije + 8 podlag + večformatni izvoz + izvedbena dokumentacija. *(Opozorilni zapis: trditev temelji na pregledu javno dostopnih ponudnikov, ne na izčrpni analizi trga.)*

### Analiza — prednosti in tveganja specializacije

**Prednosti:**

1. Unikatna kombinacija slika→risba v niši — noben od naštetih ponudnikov ne prevzame fotografije kot vhoda.
2. Nišna parametrika ([dilatacijski kalkulator](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf), 8 podlag po [Roksal](https://roksal.com/), pravila za sidranje/razmike) — razume materialno-fizične omejitve WPC, ki jih splošni CAD nima.
3. Enodatotečnost + offline (eno HTML datoteko, PWA z Service Worker) — nič oblačne odvisnosti, deluje brez strežnika.
4. Večformatni izvoz SVG/DXF/STEP skupaj s celotno izvedbeno dokumentacijo (BOM/CSV, kerf optimizator, montažni načrt, naročilnik) — »last-mile« dokumentacija, ki jo splošni orodja puščajo ročno.

**Tveganja specializacije:**

1. Zaprtost na eno znamko ([Roksal/WoodCore](https://roksal.com/)) — orodje je vezano na enega ponudnika profilov in njegovih pravil; zamenjava znamke zahteva ponovno vgradnjo parametrične logike.
2. Manjkajoča nosilnost/razmerja — risba ni statični izračun; nosilnost in sidranje preveri strokovnjak, zato orodje ne more nadomestiti inženirskega pregleda.
3. Odvisnost od formatov/ponudnikov — DXF/STEP imajo omejitve (npr. brez bool operacij, koordinatni prostor lista), zato so izvozi orientacijskega značaja za CNC/3D tisk.

Ta tri tveganja so naravna cena specializacije, ki jo moramo v roadmapu uravnotežiti z razširitvijo na več znamk/materialov.

### Povzetek

Draftwright zaseda čisto nišo, ki ni pokrita s katero koli od treh kategorij: splošni in Web-CAD imata obliko/nosilnost, a brez nišne parametrične logike in vhodnega kanala s fotografije; nišni ograjni/deck kalkulatorji pa ustavijo pri merah/količinah brez celotne risbe in izvoza. Edinstvena vrednostna lastnost je zlasti kombinacija slika→risba + nišna WPC parametrika + enodatotečnost/offline + večformatni izvoz z izvedbeno dokumentacijo. Cena specializacije so zaprtost na eno znamko, omejena nosilnost in odvisnost od formatov — to so tveganja, ki jih roadmap mora odpirati z razširitvijo materialov in globino izvoza.

### Ključni dokazi

- **Ni znane neposredne ponudbe** WPC-specializiranega orodja, ki bi pokrilo slika→risba + dilatacije + podlage + izvoz. *(trditev iz opazovanja javno dostopnega polja; ne izčrpna analiza)*
- [Trex deck-cost/quantity kalkulator](https://www.trex.com/build-your-deck/planyourdeck/deck-cost-landing/productcalculator/) — le ocena stroškov in količin, brez risbe/izvoza. *(dejstvo)*
- [The Chippy Calc](https://www.thechippycalc.com/) (14 kalkulatorjev) — balustrade spacing + decking quantities, vizualni diagrami, brez CAD izvoza. *(dejstvo)*
- [EZRails Balustrade Planner](https://www.balustrade.co.za/) — razpored + cenjen delovni seznam + 3D pogled (ni WPC-specializiran). *(dejstvo)*
- [Liveconfigurator](https://liveconfigurator.co.uk/) — »quote pack« z CAD risbami, delovnim seznamom in 3D modelom (ogrodje/deck, vezano na lastno znamko). *(dejstvo)*
- [OnShape](https://www.onshape.com/en/platform) — cloud CAD s parametričnim modeliranjem; splošen, brez ograjske niše in vhodnega kanala s slike. *(dejstvo)*

### Seznam virov

**Konkurenčni ponudniki**
- [Trex — deck cost/quantity kalkulator](https://www.trex.com/build-your-deck/planyourdeck/deck-cost-landing/productcalculator/)
- [The Chippy Calc](https://www.thechippycalc.com/)
- [EZRails Balustrade Planner](https://www.balustrade.co.za/)
- [Liveconfigurator](https://liveconfigurator.co.uk/)
- [OnShape — platform](https://www.onshape.com/en/platform)

**Odprtokodno / tehnično jedro**
- [ezdxf](https://github.com/mozman/ezdxf)
- [OpenJSCAD](https://github.com/jscad/OpenJSCAD.org)
- [OpenCascade.js](https://github.com/donalffons/opencascade.js)

**Nišni viri (WPC/Roksal)**
- [Roksal (WoodCore)](https://roksal.com/)
- [Roksal navodila WoodCore — dilatacijske tabele / montažna navodila (PDF)](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf)
- [Grand View Research — global wood-plastic-composite market (izvorni dokument trga WPC)](https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market)

**Interni viri (Draftwright)**
- [README.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/README.md)
- [ANALIZA.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/ANALIZA.md)
- [Demo — draftwright-demo.vercel.app](https://draftwright-demo.vercel.app)

---

# Poglavje 4 — »Strateške odločitve in kompromisi: niša, arhitektura, odgovornost in komercializacija«

**Teza**: Usoda produkta Draftwright v naslednjih dveh letih bo odvisna od petih strateških odločitev z eksplicitnim kompromisom: (a) poglobitev v zaprto nišo WoodCore/Roksal ali širjenje v generalni CAD; (b) ohranjanje enodatotečne portabilnosti ali prehod na bundlarsko arhitekturo z WebAssembly jedrom; (c) pravno razmejevanje odgovornosti (accuracy/liability); (d) oblika komercializacije in tržni dostop (B2B proti B2C); (e) vloga umetne inteligence pri merjenju in generativni dokumentaciji.

**(a) Poglobitev niše Roksal/WPC proti širšemu CAD**: Za poglobitev — zaprt krog profil→dilatacije→podlaga→povpraševanje ustvarja visoko vrednost in prehodno oviro; strokovna validacija po uradni tabeli dilatacij in pravilih podlag iz [WoodCore navodil za montažo](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf) ni generično povzemanja mogoča. Rast WPC trga: po [Grand View Research](https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market) bo svetu WPC tržna vrednost do 2033 dosegla 21,51 mrd USD s CAGR 11,7 % (2026–2033). Za širjenje — več-znamkovni registar odpre tržne deleže; generalne platforme za vertikalne rešitve ([IntelliCAD](https://www.intellicad.org/)) dokazujejo, da se specializacija gradi na skupnem jedru. Kompromis: poglobitev niše je trenutno multiplikativna prednost (6 profilov, dilatacije, 8 podlag, pripravljeno povpraševanje); širjenje zahteva abstrakcijo registrske logike v samostojno plast (enotna shema profil/dilatacijska tabela/pravila podlage/barvna paleta/kontaktni obrazec). Priporočilo: najprej poglobi nišo z registrsko arhitekturo za več-znamkovnost; širjenje v generalni CAD umakni s prioritete (odpravi kot prioriteto), saj za splošni CAD zahteva stroškovno zelo obsežno abstrakcijo registrske logike, ki presega donosnost v tej fazi; dolgoročno ga obravnjaj kot ogroženo možnost.

**(b) Enodatotečnost/portabilnost proti bundlerju + WASM jedru**: Za enodatotečnost — 1 datoteka (~280 KB), brez build koraka/strežnika, offline, prenos prek USB ([demo](https://draftwright-demo.vercel.app)). Za bundler+WASM — boolevske operacije, CNC-izvoz in AI modeli zahtevajo zmogljivo jedro: [Chili3D](https://github.com/xiangechen/chili3d) (OpenCascade 8.0.1 v WASM prek Emscriptena, boolevske operacije in shape repair), [OpenGeometry](https://github.com/OpenGeometry-io/OpenGeometry). WebAssembly je ključna podlaga za CAD/simulacijo v brskalniku ([Fastly](https://www.fastly.com/learning/serverless/what-is-webassembly)); format je učen po obsegu in času nalaganja ([pspdfkit](https://pspdfkit.com/blog/2017/webassembly-a-new-hope/)). Strošek: WASM običajno nosi zmerno preizmerjalno obremenitev, blizu nativne zmogljivosti, z opaznejšo vrzeljo na manj zmogljivih napravah ([pspdfkit](https://pspdfkit.com/blog/2017/webassembly-a-new-hope/); [Fastly](https://www.fastly.com/learning/serverless/what-is-webassembly)). Kompromis: modularna arhitektura — jedro enodatotečno, boolevski/CNC/AI-moduli ločeni neobvezni WASM (po vzoru chili3d). Priporočilo: modularno jedro z ločenimi AI-moduli; odločitev o build verigi prepusti 5. poglavju.

**(c) Odgovornost (accuracy/liability)**: Predračun ni ponudba, risba ni statični izračun — nosilnost/sidranje preverja strokovnjak ([README.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/README.md)). Pravno občutljivo: napaka → reklamacija. Vzorec: omejitve garancije v EULA — [Kontron download disclaimer](https://www.kontron.com/en/downloaddisclaimer); strokovno odgovornostno zavarovanje (PI) — [Zurich](https://www.zurich.com/commercial-insurance/products/professional-indemnity), [ACS professional standards scheme](https://www.acs.org.au/professionalrecognition/professional-standards-scheme.html) (omejena poklicna odgovornost le ob izpolnjenih obveznostih; PI kot ločena zahteva). Priporočilo: vztrajno razmejevanje odgovornosti v EULA + opozorilnih sporočilih + obveznem strokovnem pregledu; iz izrecne ponudbe in statike se izogibati.

**(d) Komercializacija in tržni dostop**: Tržna priložnost — WPC CAGR 11,7 % ([Grand View Research](https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market)). Strokovna AI takeoff se trži kot »zmanjšanje časa za do 90 %« ([Civils.ai](https://civils.ai/)); ponudba do izvedljive ocene ([Ruh AI](https://www.ruh.ai/); [BuildVision AI](https://www.buildvisionai.com/)); generativna AI raste po [TechSci Research](https://www.techsciresearch.com/report/artificial-intelligence-ai-in-construction-market/20564.html) in [DigitalOcean](https://www.digitalocean.com/resources/articles/generative-ai-use-cases). Kompromis: več-znamkovski registar; pravilna ponudba + DDV preide orodje v prodajni izdelek, a poveča pravno ekspozicijo (vezi na c) in odvisnost od Roksalovih prodajnih pogojev; B2B (montažne ekipe) vs. B2C (samopostrežni) — svetuje hibridni GTM ([designrevision](https://designrevision.com/blog/b2b-saas-go-to-market-strategy)); cenovna shema po številu uporabnikov × modulih — smernica iz odprtega bloga, ne formalen vir ([CSDN](https://blog.csdn.net/sinat_28461591/article/details/148209267)). Priporočilo: B2B-hibrid z samopostrežnim B2C vnosom, ponudba z DDV kot plačljiva funkcija, registrom več znamk; odvisnost od Roksalovih pogojev dokumentirati.

**(e) AI merjenje in generativna dokumentacija**: Trenutno ±25 % predlog profila + pikselno zaznavanje lamel; merjenje orientacijsko, ročni pregled ([README.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/README.md)). Kompromis: LLM-agenti za tehnične liste/naročilnike v ločenem modulu brez posredniškega strežnika (Chili3D vzorec: brskalnik pokliče LLM neposredno, API-ključ v seji); strošek, odvisnost od zunanjega API in zasebnost ključev = nasprotje enodatotečnemu modelu. Priporočilo: AI kot ločena, neobvezna, v brskalniku delujoča komponenta; merjenje vztrajno označiti kot orientacijsko z obveznim ročnim pregledom.

**Povzetek**: Pet priporočil: (a) poglobi nišo z registrsko abstrakcijo; (b) modularno jedro; (c) vztrajno razmejevanje odgovornosti; (d) B2B-hibrid; (e) AI kot ločen modul. Vse pet odločitev se izplača kot skupaj usklajen sklop.

---

# Poglavje 5 — »Predlagana roadmap za naslednje faze: prioritizacija, mejniki in tveganja«

## Analitični uvod — teza

Draftwright je po 78 commitih v ~3 dneh ([git zgodovina, veja main](https://github.com/robertpezdirc12-design/draftwright-demo)) v stabilnem, izvedbeno jedrnem stanju: enodatotečna aplikacija, 19 testnih surov in zlati posnetki, vektorski PDF/PWA/DXF/STEP. [README](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/README.md) in [ANALIZA.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/ANALIZA.md) dokumentirata znane omejitve. Ključna ugotovitev za roadmap: **okoli 27 odprtih vej ni dejansko neporavnano delo, temveč veja-higiena** — vse so že združene v main (vsaka je ancestor glave main). To drastično znižuje prag do »čistega« mejnika: naslednje faze F7–F9 so zato resnično nova investicija. F7 »Združitev in odstranitev vej« je s tem **verifikacija + čiščenje**, ne integracija.

## Prioritizacija (P0/P1/P2)

| Prioriteta | Mejnik | Razlog |
|---|---|---|
| P0 | M1: veja-higiena + testna disciplina (CI kriteriji za združitev) | Nizkotrošen; danes je 27 vej že v main — treba je samo potrditi `npm test` (19 surov) in odstraniti. |
| P0 | M2: stabilno avto-L (nadgradnja nestabilnega 2-točkovnega L) | Rešuje dokumentirano omejitev »L vpisite ročno«; brez tega M3/M4 ni prepričljivo avtomatiziran. |
| P1 | M3: WASM bool operacije (pravi STEP/CNC) | Odprava največje omejitve — danes so STEP »poenostavljeni box solidi, ne production CAD« ([validacija-izvozov.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/docs/validacija-izvozov.md)). |
| P1 | M4: globoko učenje za zaznavo lamel/umeritev | Nadgradnja nestabilne avto-L z C3Po-odnosno metodo (slika→tloris). |
| P2 | M5: več-znamkovski registar + ponudba/DDV | Komercializacija; tržna priložnost rasti WPC. |
| P2 | M6: LLM agenti za generativno dokumentacijo | Lošen modul; jedro ostane enodatotečno. |

## Mejniki, obseg in glavno tveganje

- **F7 (P0): M1** — Združi/odstrani odprte veje + CI kriterij. Obseg S. Kriterij: `npm test` (19 surov: jsdom + zlati posnetki + E2E, [ci.yml](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/.github/workflows/ci.yml)) zeleno. Stop-rule: če `npm test` ni zeleno → ne čisti.
- **M2** — Stabilno avto-L. Obseg M. Tveganje: 2-točkovna kalibracija je intrinzično nezanesljiva. Stop-rule: če zanesljivost ni nad prgom na testnih skicah → ohrani ročni vnos.
- **F8 (P1): M3** — WASM boolean. Obseg L. Tveganje: OCCT WASM je težek in kompleksen ([opencascade.js](https://github.com/donalffons/opencascade.js)); boji se z PWA/offline SW predpomnilnikom. Stop-rule: **če WASM modul dodatno podaljša nalaganje nad 10 s na mobilni napravi → omeji na desktop/izvozni kanal** (kvantitativni prag).
- **M4** — Globoko učenje. Obseg L. Tveganje: podatkovni nabor + obdobje treniranja; C3Po dokazuje slika→tloris, a v domeni ograj ni neposredno prenosljivo ([Cornell Chronicle, C3Po @ NeurIPS 2025](https://news.cornell.edu/stories/2025/12/computer-vision-connects-real-world-images-building-layouts)). Stop-rule: **če nabor ni dovolj obsežen → ostane heuristika**.
- **F9 (P2): M5** — Več-znamkovski registar + ponudba/DDV. Obseg M–L (M = več-znamkovski registar sam; L, ko vključi ponudbo in DDV). WPC trg raste na 21,51 mld. USD do 2033 (CAGR 11,7 %, [Grand View Research](https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market)); predračun danes »ni ponudba«. Stop-rule: brez pogodbenih podatkov znamk → samo ena znamka.
- **M6** — LLM agenti. Obseg M. Tveganje: LLM-agenti omogočajo avtomatizacijo nalog v razvoju programske opreme (med drugim dokumentacija in kodiranje) ([arXiv 2505.16120](https://arxiv.org/html/2505.16120v2)); ločen modul. Stop-rule: če vpliva na jedro → zavrne vgrajevanje.

## Odvisnosti med mejniki

M1 odpira vse; M2 odpira M4; M3 odpira pravi CNC/izvoz; M5 odpira prihodek; M6 ni zavezan (ločen modul, odvisen samo od M1).

## Testni mejnik (CI kriteriji za združitev)

Vsak mejnik združimo v main le, če: (1) `npm test` (19 surov) je zeleno na CI — 19 surov je stanje delovnega drevesa; v CI commitu `b9310c9` izvajanje ustreza 18 surovom (420 trditev) — (2) zlati posnetki so nepoškodovani (ali namerno posodobljeni), (3) M3/M4: nov samostojni test (npr. `boolean-step.test.js` / `vision-deep.test.js`) pokrije nov modul.

## Zaključek

Roadmap je izvedbeno (strateški kompromisi so v p4). F7 (P0) odpira varno združevanje; F8 (P1) **rešuje dve glavni omejitvi** (nestabilni avto-L in manjkajoči bool); F9 (P2) ustvarja vrednost. Vsak mejnik je zaščiten s stop-rule in testnim kriterijem.

---

## SKLEPO poglavje

Pregled petih poglavij kaže na jasno, interno konsistentno sliko: niša, ki jo zaseda Draftwright — presečišče *slika→risba*, nišne WPC parametrike in enodatotečnosti s širitvijo na večformatni izvoz — je dejansko edinstvena, saj je med javno dostopnimi ponudniki neposrednega tekmeca, ki bi hkrati prevzel fotografijo kot vhod, razumeval dilatacijsko logiko WPC in izvozil celotno izvedbeno dokumentacijo. Produkt je v izjemno zrelom stanju: celoten cevovod, 19 testnih surov v delovnem drevesu (potrjenih 420/420 trditev v CI commitu `b9310c9`), zlati posnetki in neodvisna CAD validacija ([README.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/README.md)); v oknu 19.–21. 11. 2026 so vsi razvojni programi združeni v `main`.

Edine resnične ovire niso v kodi, temveč v mejah formatov in specializaciji: poenostavljena 3D geometrija brez boolevskih operacij, orientacijska narava zaznavanja, statični značaj predračuna ter odvisnost od ene znamke in enega ponudnika (WoodCore/Roksal). To so naravna tveganja specializacije, ki jih je treba uravnotežiti z razširitvijo na več znamk/materialov in z globino izvoza. Po drugi strani zunanji trendi potrjujejo, da so tehnološke omejitve rešljive (WebAssembly boolevska jedra, globinsko učenje za vezavo slika→tloris, AI integracija), trg WPC pa raste s CAGR 11,7 % do 2033 ([Grand View Research](https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market)).

Predlagana roadmapa F7 → F8 → F9 (M1–M6) je zato izvedljiva: F7 (P0) izvede nujno čiščenje in stabilizacijo, F8 (P1) odpravi dve ključni omejitvi (nestabilni avto-L in manjkajoče boolevske operacije), F9 (P2) pa ustvarja komercialno vrednost. Vsak mejnik je zaščiten s kvantitativno stop-rule in testnim kriterijem (`npm test` zeleno, nepoškodovani zlati posnetki). Ob upoštevanju teh mehanizmov je smer produkta v naslednjih dveh letih razumljiva, prioritizirana in realno izvedljiva.

---

## VIRI

*Združen in dekontroverzirani seznam vseh virov iz Poglavij 1–5, abecedno urejen; notranji viri (Draftwright) so ločeni od zunanjih.*

### Notranji viri (Draftwright)

- **ANALIZA.md** (Draftwright, n. d.). Modul dokumentacije: umeritev, zaznavanje lamel, WPC profili, palete. Dostopno: https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/ANALIZA.md
- **Demo – draftwright-demo.vercel.app** (Draftwright, n. d.). Živa demo spletna aplikacija. Dostopno: https://draftwright-demo.vercel.app
- **Git zgodovina (veja main)** (Draftwright, 2026). Razvojna zgodovina 78 commitov v oknu 19.–21. 11. 2026; commit `b9310c9` (zadnji vsečni commit veje pomoc-laiki, PR #34); združitveni commit `a6e2b9b`. Dostopno: https://github.com/robertpezdirc12-design/draftwright-demo
- **package.json** (Draftwright, n. d.). Delovno-drevesna konfiguracija, navezuje 19 testnih surov.
- **README.md** (Draftwright, n. d.). Opozorila, izvozni formati in opisi produktne meje. Dostopno: https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/README.md
- **.github/workflows/ci.yml** (Draftwright, n. d.). CI konfiguracija: Node 22.22.2, sprožitev na push/PR, `npm ci && npm test`. Dostopno: https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/.github/workflows/ci.yml
- **docs/validacija-izvozov.md** (Draftwright, n. d.). Neodvisna validacija CAD formatov (ezdxf, steputils). Dostopno: https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/docs/validacija-izvozov.md
- **tests/ + tests/golden/ + samples/** (Draftwright, n. d.). Testni surovi, zlati posnetki in vzorčni podatki.

### Zunanji viri

- **ACS (Australian Chartered Institute of Structural Engineers, n. d.).** *Professional standards scheme*. Dostopno: https://www.acs.org.au/professionalrecognition/professional-standards-scheme.html
- **Ariti et al. / arXiv (2025).** *LLM agenti za avtomatizacijo nalog v razvoju programske opreme (dokumentacija in kodiranje)* (arXiv:2505.16120). Dostopno: https://arxiv.org/html/2505.16120v2
- **BuildVision AI (n. d.).** *AI za ponudbo do izvedljive ocene*. Dostopno: https://www.buildvisionai.com/
- **Chili3D – xiangechen/chili3d (GitHub, n. d.).** *Odprtokodna TypeScript aplikacija: parametrichno modeliranje v brskalniku prek OpenCascade/OCCT in boolevskih operacij*. Dostopno: https://github.com/xiangechen/chili3d
- **Civils.ai (n. d.).** *AI takeoff za strokovno dokumentacijo*. Dostopno: https://civils.ai/
- **CSDN (n. d.).** *Odpert blog: shema cena po številu uporabnikov × moduli* (smernica, ne formalen vir). Dostopno: https://blog.csdn.net/sinat_28461591/article/details/148209267
- **Cornell Chronicle (2025).** *Računalniški vid povezuje realne slike z gradbenimi tlorisi (C3Po @ NeurIPS 2025)*. Dostopno: https://news.cornell.edu/stories/2025/12/computer-vision-connects-real-world-images-building-layouts
- **Designveloper (2025).** *Zakaj progressive web apps (PWA)*. Dostopno: https://www.designveloper.com/blog/why-progressive-web-apps/
- **DigitalOcean (2025).** *Generativna AI: primeri uporabe v podjetniških procesih*. Dostopno: https://www.digitalocean.com/resources/articles/generative-ai-use-cases
- **EZRails Balustrade Planner (balustrade.co.za, n. d.).** *Dispozicija + cenjen delovni seznam + 3D pogled*. Dostopno: https://www.balustrade.co.za/
- **ezdxf – mozman/ezdxf (GitHub, n. d.).** *Python biblioteka za DXF*. Dostopno: https://github.com/mozman/ezdxf
- **Fastly (n. d.).** *What is WebAssembly?* Dostopno: https://www.fastly.com/learning/serverless/what-is-webassembly
- **Grand View Research (2025).** *Global wood-plastic-composite market*. Dostopno: https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market
- **GitHub – PWA topic (n. d.).** *Progressive Web App – tematska zbirka*. Dostopno: https://github.com/topics/progressive-web-app
- **HouseLayout3D / MultiFloor3D – Bieri, Rakotosaona, Tateno, Engelmann, Guibas (NeurIPS 2025).** *Rekonstrukcija večnadstropnih stavb iz fotografij (training-free baseline)*. Dostopno: https://houselayout3d.github.io/
- **IntelliCAD (n. d.).** *Odprtokodni vertikalni CAD*. Dostopno: https://www.intellicad.org/
- **jsdom (GitHub, n. d.).** *DOM implementacija za Node*. Dostopno: https://github.com/jsdom/jsdom
- **jsPDF – parallax/jsPDF (GitHub, n. d.).** *PDF generacija v brskalniku*. Dostopno: https://github.com/parallax/jsPDF
- **Kontron (n. d.).** *Download disclaimer (omejitve garancije)*. Dostopno: https://www.kontron.com/en/downloaddisclaimer
- **Liveconfigurator (n. d.).** *Konfigurator: ogrodja/stopnice/deck z »quote pack«*. Dostopno: https://liveconfigurator.co.uk/
- **NVIDIA AEC / Omniverse (n. d.).** *AI-podprta orodja za AEC*. Dostopno: https://www.nvidia.com/en-au/industries/aec/
- **ODA / Open Design Alliance (n. d.).** *inWEB: CAD/BIM urejanje in prikaz v web/SaaS*. Dostopno: https://www.opendesign.com/
- **ODA MCP Servers (n. d.).** *MCP serverji za vezavo CAD/BIM podatkov na AI agente (DWG/DXF, STEP, IFC)*. Dostopno: https://www.opendesign.com/products/mcp-servers
- **offlinefirst.org (n. d.).** *Offline-first paradigma*. Dostopno: https://offlinefirst.org/
- **OpenGeometry – OpenGeometry-io/OpenGeometry (GitHub, n. d.).** *Odprtokodno geometrijsko jedro*. Dostopno: https://github.com/OpenGeometry-io/OpenGeometry
- **OpenJSCAD – jscad/OpenJSCAD.org (GitHub, n. d.).** *Odprtokodni 3D JavaScript*. Dostopno: https://github.com/jscad/OpenJSCAD.org
- **OpenCascade.js – donalffons/opencascade.js (GitHub, n. d.).** *Odprtokodni BREP/STEP kernel v JS*. Dostopno: https://github.com/donalffons/opencascade.js
- **pspdfkit (2017).** *WebAssembly: a new hope* (obseg in čas nalaganja). Dostopno: https://pspdfkit.com/blog/2017/webassembly-a-new-hope/
- **Roksal / WoodCore (n. d.).** *Nišni WPC ponudnik*. Dostopno: https://roksal.com/
- **Roksal navodila WoodCore (n. d.).** *Montažna navodila in dilatacijske tabele (PDF)*. Dostopno: https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf
- **Ruh AI (n. d.).** *Ponudba do izvedljive ocene*. Dostopno: https://www.ruh.ai/
- **Springer – Construction Robotics 9:21 (2025).** *Merjenje prostornine zemlje v kovalci s trdninskimi 3D LiDAR senzorji*. Dostopno: https://link.springer.com/article/10.1007/s41693-025-00166-w
- **steputils (PyPI, n. d.).** *Python orodje za razčlenjevanje STEP*. Dostopno: https://pypi.org/project/steputils/
- **svg2pdf.js – yWorks/svg2pdf.js (GitHub, n. d.).** *SVG v PDF pretvorba v brskalniku*. Dostopno: https://github.com/yWorks/svg2pdf.js
- **TechSci Research (2025).** *Artificial Intelligence (AI) in Construction Market*. Dostopno: https://www.techsciresearch.com/report/artificial-intelligence-ai-in-construction-market/20564.html
- **The Chippy Calc (n. d.).** *14 konstrukcijskih kalkulatorjev (balustrade spacing + decking quantities)*. Dostopno: https://thechippycalc.com/
- **Trex – deck cost/quantity kalkulator (n. d.).** *Ocena stroškov in količin decka*. Dostopno: https://www.trex.com/build-your-deck/planyourdeck/deck-cost-landing/productcalculator/
- **Truestar Digital (n. d.).** *Terenski offline reševalni sistem*. Dostopno: https://truestarapp.com/
- **Zurich (n. d.).** *Professional indemnity (strokovno odgovornostno zavarovanje)*. Dostopno: https://www.zurich.com/commercial-insurance/products/professional-indemnity

> *Opomba o dekontroverziranosti: URL za biblioteko ezdxf se med Poglavjem 1 in Poglavjema 2–3 razlikuje (mozillazc/ezdxf oziroma mozman/ezdxf); v tem seznamu je združen v uradni in veljaven vir mozman/ezdxf. Vsi ostali viri so po imenu in URL združeni brez podvajanja.*

---

## OPOZORILO O ODGOVORNOSTI

To poročilo je strokovno-strateška analiza razvoja produkta Draftwright in ne služi kot pravni, inženirski ali nosilnostni nasvet. Tehnična risba ni statični izračun in predračun ni ponudba niti pogodbeno zavezujoč dokument. Vse strateške odločitve (niša, arhitektura, odgovornost, komercializacija in vloga AI) zahtevajo strokovni pregled pristojnih strokovnjakov pred izvedbo.
