# Strategija razvoja in roadmap produkta Draftwright — tehnična risba WPC ograj, fasad in teras iz fotografije

**Datum:** 2026-11-22

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

> *Opomba za sestavo: v to točko (med UVOD in SKLEPO poglavje) sestavilec vstavi celotno vsebino Poglavij 1–5 (ch1–ch5), oziroma v vrstnem redu. Vsebina poglavij ostaja nespremenjena.*

---

## UVOD

Produkt Draftwright (»Tehnična risba PRO«) se je v razvojnem oknu 19.–21. novembra 2026 z 78 commiti razvil v izjemno zrel stanje za samostojno enodatotečno spletno aplikacijo: celoten cevovod *slika → umeritev → zaznavanje lamel → parametri → tehnična risba → izvoz* je implementiran in zaklenjen v `main`, testna disciplina obsega trenutno 19 testnih surov v delovnem drevesu (zadnje potrjeno stanje v CI — commit `b9310c9` — je bilo 420/420 trditev v takratnih 18 surovih), zlati posnetki in neodvisna validacija CAD formatov prek ezdxf/steputils pa potrjujejo izvedbeno kakovost (dokumentirano v [README.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/README.md), [ANALIZA.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/ANALIZA.md) ter živi demo na [draftwright-demo.vercel.app](https://draftwright-demo.vercel.app)). Kljub tej zrelosti izdelek nosi javno dokumentirane tehnične meje — poenostavljena 3D geometrija brez boolevskih operacij, orientacijska narava zaznavanja in statični značaj predračuna — zato služi pripravi dokumentacije in orijentacijskim ocenam, ne pa 3D tisku, CNC ali statičnemu izračunu.

V tem kontekstu poročilo obravnava strateško vprašanje, kako produkt prevesti iz zrele, izvedbene točke v naslednje faze razvoja. Namera je dvojna: prvič, opredeliti strateške kompromise (niša proti generalnemu CAD, enodatotečnost proti WASM jedru, odgovornost, komercializacija in vloga AI), drugič, izpeljati konkretno, prioritizirano roadmapo z mejniki in pravili za ustavitev. Ob tem poročilo opremi izdelek zunanjo perspektivo: globalni trg WPC bo po napovedih [Grand View Research (2025)](https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market) do leta 2033 dosegel 21,51 mrd USD ob CAGR 11,7 %, računalniški vid pa hitro prestopa od klasične geometrije k globinskemu učenju — reprezentativen je model C3Po s 34-odstotnim zmanjšanjem napake pri vezavi slik z arhitekturnimi tlorisi ([Cornell Chronicle, 2025](https://news.cornell.edu/stories/2025/12/computer-vision-connects-real-world-images-building-layouts)).

Poročilo je sestavljeno iz petih poglavij: prvo opisuje trenutno stanje produktne zrelosti in ključne tehnične omejitve, drugo podaja zunanje trende (računalniški vid, WPC trg, Web CAD/CAM, offline PWA, generativna AI), tretje obravnavo konkurenčno lego in obseg niše, četrto izpoda strateške odločitve in kompromise, peto pa predlaga izvedljivo roadmapo z prioritizacijo, mejniki in tveganji. Skupaj tvorijo osnovo za oblikovanje naslednjih razvojnih odločitev produkta.

---

*[SEM VSTAVI POGLAVJA 1–5 — ch1.md, ch2.md, ch3.md, ch4.md, ch5.md, v tem vrstnem redu]*

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
