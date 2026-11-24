# Draftwright — Tehnična risba PRO

**Fotografija → umeritev → parametri → končni tehnični list.** Samostojna spletna aplikacija (ena HTML datoteka, brez odvisnosti, brez strežniške logike) za pripravo tehničnih risb in montažne dokumentacije za ograje, fasade in terase iz sistema **WoodCore (Roksal)** WPC profilov.

🔗 Živa demo: [draftwright-demo.vercel.app](https://draftwright-demo.vercel.app)

## Varnost
- strogi CSP brez `unsafe-inline` in `unsafe-eval` (HTML meta + Vercel glava s `frame-ancestors 'none'`); po vsaki spremembi inline koda poganjaj `node scripts/generate-csp.js`, po zamenjavi katerekoli `vendor/*.js` datoteke pa `npm run sri:generate` (SHA-384 iz **served/LF bajtov**)
- podatki iz deljenih povezav in uvoženih projektov se validirajo na meji zaupanja; regresije pokrivajo `security-sketch`, `security-boundaries` in `csp` surovi
- DXF izvoz se v testih preverja z neodvisno MIT knjižnico `dxf-parser` (samo `devDependency`, ne v browser bundles)

## Funkcije

### 1. Slika in umeritev
- nalaganje slike: izbira datoteke, **Ctrl+V**, drag & drop
- umeritev z **2 točkama** (linearno) ali **4 točkami** (perspektivna homografija)
- samodejno zaznavanje lamel (naklon do ±12°, ocena zanesljivosti, ročno vlečenje črt)

### 2. Parametri in validacija po Roksal pravilih
- 6 profilov: ROMB-67, POLNA-128, DESKA-150, POLNA-57/32, POLNA-100, KUBO-80/42
- uporabe: prečna ograja, pokončna ograja, fasada, terasa, **pregradna stena**, **napušč**, stopniščna ograja
- **dilatacijski kalkulator za teraso** — priporočen razmak med deskami glede na dolžino deske (1–5 m) in temperaturo montaže (−25…+35 °C), po uradni tabeli iz [PDF navodil WoodCore](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf)
- **barvne palete po profilu** (lestvice roksal.com): White samo pri POLNA-100, KUBO/57/32 delita paletо itd.; izbira površine Klasik/Rustik samodejno uskladi odtenek
- **podlaga (8 opcij po Roksal povpraševanju)**: validacije za pesek/prodec (nepripravljivo), tlakovce (alu cevi obvezne), ploščice, hidroizolacijo (guma/filc), prane plošče, obstoječo kovinsko konstrukcijo (okrogle cevi prepovedane, garancija na izvedbo ne priznana)
- **kontakt stranke za povpraševanje**: naslovljeno na (fizična/podjetje), davčna št., naslov, e-pošta, telefon, način dobave — vir za izvoz povpraševanja
- **terasna podkonstrukcija po PDF navodilih**: točkovno podlaganje samo z alu cevmi max 60 cm, turbo vijaki 6,7×80 mm, beton ≥ 60 mm, višine 4,5/5,5/6,5 cm, rez spodnje stene 30°, kombinacija 4,0+2,2 m ni dovoljena
- samodejne validacije: razmak stebrov/nosilcev, vodoravne cevi, padec podlage ≥ 10 mm/m, temperatura montaže ≥ +5 °C, varjeni deli na stebrih, cone, vsota lamel in rež, debelina stene profila
- prednastavitve: ROMB vodoravno · POLNA pokončno · KUBO fasada
- izračun mase po materialu (aluminij, jeklo, WPC)

### 3. Generiranje risbe
- sprednji pogled, stranski pogled, tloris, izometrični pogled, prerezi in detajli pritrjevanja
- dimenzije s puščicami, baloni kosovnice, osi nosilcev z razmiki
- naslovni blok: projekt, merilo, format, revizija, datum, risba št., izdelal, objekt, tip, material, barva
- trije tipi lista: klasični, referenčni (WoodCore cona + mere), stopniščni
- **segmenti** (za dvonadstropne ograje): polje »Segmenti za sprednji pogled« — ena vrstica `naziv;širina;višina` (do 3 na list), vsak z lastnimi merami, lamelami in nosilci po Roksal omejitvi; opcijsko balkonska plošča (debelina v mm)
- **L-povratek** v tlorisu: polje »Povratek W2« > 0 → tloris z fasadnim trakom, kotnim stebrom in mero W2
- merilo prereza A–A je vidno označeno v naslovu panela (dinamično prilagojeno, kadar so vklopljena korita)

### 3a. Korita za rože (P2)
- **Vnos**: polje »Korita za rože« — ena vrstica na korito: `širina;odmik od levega roba` (npr. `1100;300`); višina (privzeto 310 mm) in globina (privzeto 220 mm) v lastnih poljih. Prazno polje = brez korit.
- **Izris**: boxi korit nad lamelami v sprednjem pogledu (z mero širine in oznako), korito v prerezu A–A z balonoma 9/10 (korito + konzolni nosilec).
- **Količine**: BOM vrstici 9/10 (ocena nosilcev: robova + vsakih 600 mm — jasno označena za potrditev pri Roksalu); korita se prenesejo v kosovnico, montažni načrt, naročilnik in STEP 3D model.
- **Validacija**: korita izven meja (odmik + širina > L) se izključijo iz količin z opozorilom; svetovalni meji H ≥ 100 mm in D ≥ 150 mm; robustno razčlenjevanje (presledki, prazne vrstice, neveljavne vrstice → opozorilo).
- **Omejitev**: korita so opcijska in veljajo za glavno ograjo (brez segmentov).

### 4. Izvoz — dialog »Možnosti izvoza« (Ctrl+E)

Poenotena točka izvoza: **Datoteka → Izvozi…** (ali gumb »Izvozi…« v sklopu Izdelava). Izberete lahko:

- **prednastavitve**: celotna dokumentacija · za delavnico (risba + rezalni načrt + kosovnica + montaža) · za naročilo · samo risba
- **vsebina** (8 delov): risba, kosovnica, rezalni načrt (kerf), montažni načrt, predračun, naročilnik, montažni checklist, projekt (JSON)
- **format risbe**: PDF / tisk, SVG, DXF, STEP — priloge se izvozijo v nativnih formatih (CSV/TXT/JSON)
- **format lista**: A3/A4/A2 (dvosmerno usklajeno s poljem na stranskem plošču)
- **napredno**: vodni žig (PDF/SVG), DXF samo-geometrija (CNC, brez besedil), natančnost krivulj v DXF (4/8/16 segmentov), datum v imenu datotek, metapodatki v SVG

Risba se ob izvozu vedno znova generira iz trenutnih polj, tako da izvoz vedno odraža zadnje stanje. Posamezne hitre izvoze (meni Datoteka) ostanejo nespremenjeni — vsi uporabljajo iste graditelje izhodov.

### 5. Izvozi v podrobnostih
| Izvoz | Oblika |
|---|---|
| PDF / tisk | brskalni tisk, `@page` po izbranem formatu (A3/A4/A2) |
| SVG | vektorski list, opcijsko z vodnim žigom in metapodatki |
| DXF | R12 (LINE/TEXT), kvadratne krivulje vzorčene v polilinije — za CAD/CNC |
| STEP | AP214, parametrični solid model (BREP) |
| Kosovnica | CSV |
| Montažni načrt | CSV |
| Rezalni načrt | CSV — kerf optimizator (DP za enake kose, FFD nesting za več dolžin — stopnice: lamela + ročaj v isti deski) |
| Predračun | CSV — orientacijski, brez DDV |
| Naročilnik | TXT |
| Montažni checklist | TXT — sklopi A–E (dostava, montaža, geometrija, garancija, reklamacijska dokumentacija) + kontakt Roksal |
| Tehnični list materiala | TXT — tehnični podatki WoodCore iz garancijskega PDF (vlaga, trdota HRR, modul, sila vijaka …) |
| Povpraševanje Roksal | TXT — pripravljeno povpraševanje v strukturi Roksal obrazca (kontakt, dobava, mere, profil, barva, podlaga); pošljite na info@roksal.com |
| Projekt | JSON (shranjevanje / odpiranje celotnega stanja) |

### 6. Delovni načini
- **jezik UI: SL/EN** (gumb v menijski vrstici, shranjeno v brskalniku) — risba in tehnični izpisi ostanejo slovenski (Roksal dokumentacija)
- vodeni / strokovni način, izbira vidnih sklopov in polj
- bližnjice: **Ctrl+G** generiraj · **Ctrl+S** shrani · **Ctrl+E** možnosti izvoza · **Alt+P** izbira plošče · **Ctrl+V** prilepi sliko · **+/−** povečava
- dostopnost: `aria-live` status, `label for=` na 77 poljih
- **lokalni predlog ograje na fotografiji** (gumb *Predlog ograje na sliki* v foto plošči): vektorska SVG prekrivka se izriše iz zaznanega okvira in mer iz risbe (`n`/`sw`/`gap`/`L`/`H`) — brez AI in brez omrežja. Podprta je 2-točkovna umeritev; pri 4-točkovni (homografija) se gumb javi z opozorilom. Mere v prekrivki izvirajo iz risbe, ne iz fotografije. Statusne oznake so enotne: ✓ izmerjeno · ∑ izračunano · ≈ ocenjeno · ?? neznano.
- **terenska skica** (sklop 9, Issue #6): popolnoma prazen A4/A3 list (obe orientaciji), prostoročno risanje, elementi (črta/pravokotnik/krog/puščica/besedilo/kotiranje z ročnim vnosom — jasno ločeno od izmerjenih, izo kocka), radirka, premik, Undo/Redo, mreža po želji, tisk v dejanski velikosti, shranjevanje v projektu (shema v3)
- **interaktivni tloris** (sklop 8): risanje trase po mreži (1 px = 10 mm), dolžine/nosilci po segmentih (Roksal limiti), Undo/Redo (Ctrl+Z/Y), »Uporabi v izračun« → L; trasa v projektu (shema v2) in autosave
- samodejno shranjevanje stanja + kalibracije (localStorage; fotografija izrazito NE — kvota)

### 7. Napredne funkcionalnosti (P1–P3)

Profesionalna nadgradnja produktivnosti in kakovosti, dostavljena v fazah P1–P3:

- **Zgodovina operacij** — undo/redo parametrov (Ctrl+Z/Y, meni Orodja → Zgodovina); omejitev 40 korakov.
- **Kontekstualni panel** — klik na dimenzijo v risbi odpre desni panel z lastnostmi in neposrednim urejanjem vrednosti (»Uporabi« regenerira risbo).
- **Trak napak** — klik-za-popravek: vsako opozorilo je povezano s poljem (fokus + skok).
- **Konfiguracije + dizajn tabela** — shranjevanje/uporaba različic parametrov (meni Konfiguracije) in izvoz celotne tabele kot CSV.
- **Predloge listov** — slog naslovnega bloka: klasičen / ISO 7200 / ANSI (polje `sheetStyle`).
- **BOM z interaktivnimi baloni** — klik na balon v risbi prikaže podatke o postavki (register `BOM_ROWS`).
- **Break view** — dolge ograje (L > 7600 mm) se v sprednjem pogledu prikažejo komprimirano z lomljenima črtama in polno mero.
- **PDM-lite** — samodejni posnetki stanja projekta (do 20) z obnovitvijo in izvozom arhiva (JSON).
- **Masne lastnosti** — skupna masa lamel, kg/m² in kg/m v predračunu in montažnem načrtu.
- **Zaznavanje trkov/prekrivanj** — opozorila (korita+segmenti, negativna reža, nepozitivna širina, negativen kerf, negativne cone).
- **Oznake »stale«** — proizvodni rezultati so po spremembi parametrov označeni, dokler niso ponovno izračunani.
- **Vadnice + certifikacija** — tri vodeni vadnice in kviz za oznako »Draftwright Certified Installer« (≥ 80 %).
- **»What's new«** — popup ob novi različici + zapiski izdaj (Pomoč → Zapiski izdaj).

## Samoprevera

Meni **Datoteka → Samoprevera (126 kombinacij)** generira 6 profilov × 7 uporab × 3 različice mer in preveri, da nastane veljaven SVG brez JS napak.

Za avtomatske teste je v repozitoriju [tests/](tests/) (jsdom) — **66 testnih surov** (vključno z zlatimi posnetki, varnostnima surovama `security-sketch` in `security-boundaries`, surovo `csp` za hash politiko ter `dxf-parser`, ki DXF preveri z neodvisno MIT knjižnico). Poleg jedrnih (smoke, izvozni dialog, Roksal P1/P2, issue2 faze, vision, tloris, skica, projekti, PWA, PDF, E2E, stres, foto-različnost, novice-user, auto-l, registry, vision-deep, golden) so dodani **regresijski in novi surovi**: `issue37` (proizvodna konsistentnost, foto persistence, share fidelity, 3D pariteta), `error-tray`, `property-panel`, `history`, `configurations`, `sheet-templates`, `bom-balloons`, `pdm-snapshots`, `views-break`, `production-metrics`, `clash-detection`, `whats-new`, `learning`, `review-2026-11-23` (regresija: tablični vlečenje lamelnih črt s pointer dogodki, ločitev undo domen po zadnji interakciji, omiljanje CSV formula-injection ter sanitizacija STEP/DXF besedila), `homography-math` (numerična pravilnost 4-točkovne umeritve), `dilatation-table` (sweep cele dilatacijske matrike), `sw-offline` (behavioral test service workerja), `refactor-utility-css` (Issue #41 §3.F: skupna `dim`/`vt` brez lokalnih podvojenih definicij ter enovirni generator 74 CSS utilitetskih pravil `[data-s]`), `egress-privacy` (Issue #41 §3.D: dokaz, da aplikacija **ne pošilja fotografij/podatkov na zunanje strežnike** — edini `fetch` je lokalni vendor font, nobenih XHR/WebSocket/sendBeacon/senzorjev, skupni povezavi izključujeta `photo`, nobenih zunanjih `<a>/<img>`, SW prestreža samo isti izvor, CSP `connect-src 'self'`), `exports-cad-boundary` (Issue #41 §3.C: neodvisna SVG validacija — well-formed XML, namespace, viewBox A3, finite in v mejah lista; **skladnost izvoženih mer s prikazanimi** (L→SVG koten + CSV lamela `cutLen()`); **izrazna CAD-jedro meja** — STEP `FILE_DESCRIPTION` izrecno "simplified box-solid approximation, not production CAD"), `dependency-audit` (Issue #41 §2: avdit odvisnosti — `dependencies` prazen (zero-install PWA), vse 7 devDependencies upravičeno (4 dejansko require-vane v testih + 3 verzionični pin za brskalnisko naložene vendor UMD pakete), mrtva pisava `vendor/Roboto-Regular.ttf` izbrisana, prava pisava LiberationSans prisotna), `decimal-comma` (Issue #41 §3.A: lokalizacijsko varna številksa razlaga — decimalna VEJICA `3,8` → 3.8 in tisoči-pika `3.000,5` → 3000.5, brez tihega okrnjenja `3,8`→3; pokrije `n()`, `refA`, `refB` prek `numParse`, ASCII pika ni regresija, NaN/Infinity varno), `photo-stale-guard` (Issue #41 §3.B: detekcija fotografij z orientacijsko razlago **ne sme** ostati neoznačena — po `applyDetection()` so vsi proizvodni izhodi (cut/plan/quote/checklist) označeni `.stale`, orientacijska mera ne izgleda kot potrjena), `accessibility` (Issue #41 §3.E: dostopnost (WCAG 4.1.2 "Name") — `#calStatus` ima `role=status`+`aria-live` (zasilni kanal povratne informacije), 5 polj ima `aria-label`, `#applySuggestedProf` ima `title`, **celoten sweep** vseh vidnih interaktivnih elementov preverja, da noben ni brez dostopnega imena), `i18n-ui` (Issue #41 EN UI parity: v EN načinu so prevedeni **navigacija z ohranjenimi bližnjicami**, polja za korita/segmente, orodja tlorisa in skice ter `title` atributi; **statična in dinamična statusna sporočila** (live regije + toast) se prevedejo ob spremembi DOM in se ob povratku v SL obnovijo; tehnična risba ostane namerno SL), `sri` (Issue #41 SRI: **Subresource Integrity** za 3 runtime vendor skripte — vsak nosi `integrity="sha384-…"`; surov recomputira SHA-384 iz resnične `vendor/*.js` datoteke na disku in ugotovi točno ujemanje s HTML `integrity` atributom, zato katerakoli **tiha sprememba vendor/ (kompromitiran paket, poškodovan checkout) ali odstranitev SRI PADO**; preveri tudi, da noben vendor skript NI brez SRI in da je SHA-384, ne slabšega), `sri-generator` (Issue #41: **avtomatski SRI hash generator** — `npm run sri:generate` (`scripts/generate-sri.js`) računa SHA-384 iz **served/LF bajtov** (prepreči ponovitev CRLF incidenta iz PR #49, ko bi brskalnik zavrnil vendor skripte); surov v začasni kopiji dokaže **idempotenco**, popravilo poškodovanega hash-a in pravilnost na CRLF Windows checkoutu, ne da bi spremenil repozitorij), `focus-trap` (Issue #41: **WCAG 2.1.2 "No Keyboard Trap" + 4.7.2** — centraliziran trap vgradi Tab/Shift+Tab v odprtem modalnem dialogu (`role=dialog`+`aria-modal`, overlay z `.on`); ob zadnjem fokusabilnem Tab povrže na prvi, ob prvem Shift+Tab na zadnji; brez odprtega modala trap ne ukrepa; izvoz `window.fwFocusTrap` omogoča determinističen jsdom dokaz), `ui-error-touch` (Issue #41 P2/P1: napake **niso več označene samo z barvo** — CSS doda SVG opozorilno ikono, warnbox dobi `⚠` predpono, polja z opozorili dobijo `aria-invalid` in se ob popravku počistijo; mobilna dotikova področja gumbov, menija, ročaja predala in traka napak so zvišana z 38 na **44 px**), `core-module` (postopna modularizacija, korak 1: čisti modul `DWCore` z `numParse`/`format`/`spanParts`/`spanCenters`/`dim`/`escapeHtml`; stare ovijalke in izvozi ostanejo, modulo nima DOM odvisnosti), `module-sync` (koraki 2–7: `js/core.js`, `js/geometry.js`, `js/dilatation.js`, `js/csv.js`, `js/roksal.js` in `js/registry.js` so izvirne datoteke, inline kopije v HTML-ju se generirajo z `npm run modules:sync`; surov za **vsak** modul preverja vsebinsko ujemanje po odstranitvi ločilnih novih vrstic, urejen par oznak, odsotnost DOM/storage/omrežnih odvisnosti in popravilo drift-a; idempotenca se preverja **globalno**, zavrnitev manjkajoče končne oznake pa na modulu `core`. CI ima drift-check.), `roksal-module` (postopna modularizacija, korak 6: `USE_NAMES`, `roksalLimit()` in `roksalRailLimit()` so izvzeti v čisti `js/roksal.js`; surov preverja vse veje omejitev, identiteto registra in odsotnost DOM/storage odvisnosti, `roksalUseNotes()` pa ostane v HTML-ju.), `registry-module` (postopna modularizacija, korak 7: `REGISTRY_SCHEMA`, `validateRegistry()`, `woodcoreRegistry()` in helperji znamk so v čistem `js/registry.js`; surov preverja vse veje validatorja, identiteto virov, stop-rule samo WoodCore in vrstni red odvisnosti pred modulom.), `local-upgrade` (lokalne izboljšave brez omrežja: popravek enote `L` — bbox je v naravnih pikslih, zato se množi z `S.cal.scale`, ne z `mmPerPx` iz sivih pikslov, kar je pri fotografijah širših od 900 px dalo `L` za `1/sc` prevelik; vektorski predlog ograje v SVG prekrivki z lamelami iz `n` in stebri iz `roksalLimit()`; enotne statusne oznake `DW_STATUS` z EN prevodi; surov dokazuje, da ostane natanko en `fetch` — lokalni font — in da novi handler ne kliče omrežja). Požene jih CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)):

```bash
npm install
npm test
```

Dev-only primerjava rezalnega optimizatorja z MIT knjižnico `maxrects-packer` (ne nalaga se v aplikacijo):

```bash
npm run bench:cut
```

## Struktura repozitorija

```
index.html               preusmeritev na aplikacijo
tehnicka-risba-pro.html  glavna aplikacija (vse v eni datoteki, vključno z izvoznim dialogom)
manifest.webmanifest      PWA manifest (sl, standalone, ikone, teme)
sw.js                    Service Worker — stale-while-revalidate, offline način (P3)
icon-192.png / icon-512.png  PWA ikone (192/512, maskable)
vendor/                  vendored knjižnice (jsPDF + svg2pdf + LiberationSans TTF) za vektorski PDF (P4) — delujejo tudi offline
samples/                 vzorčni izvozi (SVG/PDF/DXF/STEP) in testni posnetki
docs/                    dodatna dokumentacija / viri (npr. slike za zaznavanje)
tests/                   jsdom testi (66 surovov; zlati posnetki v tests/golden/)
js/                      izvirne čiste module (`core.js`, `geometry.js`, `dilatation.js`, `csv.js`, `roksal.js`, `registry.js`); inline kopije v HTML generira `npm run modules:sync`
scripts/                 generatorji brez build koraka (`generate-csp.js`, `generate-sri.js`, `sync-modules.js`, `generate-utility-css.js`)
CHANGELOG.md            zapiski izdaj (What's new)
package.json / package-lock.json   odvisnosti in testna skripta (npm test)
m2-rect.png / m2-src.png  testni viri za zaznavanje/perspektivo
.github/                 CI (GitHub Actions — smoke test)
```

## Zagon

Aplikacija je statična — odprete `index.html` (ali direktno `tehnicka-risba-pro.html`) v brskalniku, ali objavite mapo kot statično stran (npr. Vercel, Netlify, GitHub Pages). **Brez build koraka.**

## Znane omejitve

- STEP model vsebuje posamezna telesa, ki se geometrijsko prekrivajo (brez bool operacij) — primeren kot parametrični pregled, ne za 3D tisk / CNC.
- DXF deluje v koordinatnem prostoru lista (420×297 enot, razporeditev kot A3); pri drugih formatih se vsebina za tisk le proporcionalno pomanjša.
- Samodejno zaznavanje lamel je orientacijsko — rezultat vedno preverite ročno.
- Samodejna določitev dolžine L iz fotografije (2-točkovna kalibracija) je lahko nezanesljiva — L vpisite ročno ali uporabite tloris; višina H in št. lamel sta zanesljivi.
- AI-prepoznavanje profila: večsignalni klasifikator (širina kor korak, separacija, fizična validacija) s zaupanjem in alternativami; predlog uporabnik potrdi (gumb v plošči Slika).
- Predračun je orientacijski in **ni ponudba**; risba **ni statični izračun** — nosilnost in sidranje preveri strokovnjak.

### Pričakovana natančnost meritev iz fotografije

Meritve so **orientacijske** — za milimetre je potrebna umeritev z znano referenčno dolžino (2/4 točke). Pričakovane napake (potrjene na sintetičnih slikah z eksaktno resnico, `tests/vision.test.js`):

| Scenarij | Meritev | Pričakovana napaka |
|---|---|---|
| Idealna fotografija (ravna, enakomerno osvetljena) | H, št. lamel | **±3–5 %** |
| Šum / zamegljenost | H, št. lamel | ±3–5 % |
| Perspektiva (s 4-točkovno rektifikacijo) | H | ±5 % (brez nje tudi do −40 %!) |
| Širina lamele / reža | sw, gap | **±20–25 %** |
| Dolžina L iz fotografije | L | **ni zanesljiva** — vpišite ročno ali uporabite tloris |
| Tuji tipi ograj (kovina/PVC/mreža) | vse | **ni veljavno** — aplikacija opozori; orodje je namenjeno WPC/lesu |

Namig: status po zaznavi prikaže **konsistentnost koraka** (≥ 90 % = zanesljivo štetje); pod 45 % se predlog profila ne vsiljuje.

## Licenca

MIT — glej [LICENSE](LICENSE).
