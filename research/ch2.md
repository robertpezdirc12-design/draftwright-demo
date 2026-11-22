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
