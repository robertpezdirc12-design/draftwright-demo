# Draftwright — Roadmap podrobnih izboljšav (navdih: SOLIDWORKS)

**Datum:** 2026-11-22
**Vrsta:** strateško-izvedbeni dokument (roadmap) — koda ni bila spremenjena.
**Namen:** konkretizirati »kaj vzamemo iz SolidWorks-a« v izvedljive naloge z mapiranjem na dejanske module in teste ter z oceno obsega.

---

## 1. Stanje danes (izhodišče, preverjeno)

| Kategorija | Stanje |
|---|---|
| Arhitektura | 17 modulov `js/NN-ime.js` (klasične skripte, deljen globalni obseg), HTML+CSS v `tehnicka-risba-pro.html` |
| Funkcije | slika → umeritev (2/4 točke) → zaznavanje lamel → parametri + validacije (Roksal) → risba (5 pogledov + BOM) → izvoz (PDF/SVG/DXF/STEP/CSV/TXT/JSON) |
| Dodatno | tloris, skica, 3D pogled, projekti (localStorage + JSON), PWA/offline, i18n SL/EN, canvas-first UI (predal v menijski vrstici, poglobljeni način za tloris/skico) |
| Testi | 21 surov, 460 preverjanj, zlati posnetki, strukturni testi modulov |
| Omejitve | DXF vezan na A3 prostor; STEP brez bool operacij; samodejno zaznavanje orientacijsko; predračun »ni ponudba« |

---

## 2. Načela

1. **Brez regresij:** vsaka faza se zaključi z zelenim `npm test` (obstoječih 460 + novi).
2. **Ohrani zero-install PWA** (brez strežnika, brez build koraka, offline).
3. **Najprej vidna vrednost** za uporabnika (monter/prodajalec), nato interni mehanizmi.
4. **Vsaka naloga ima sprejemljivostni kriterij** (oprijemljiva, preverljiva).
5. Če naloga zahteva večje spremembe v jedru (npr. nov modul), najprej **prototip v ločeni veji** z minimalnim obsegom.

---

## 3. Faze in naloge

### Faza P1 — Temelji (visoka vrednost, nizko tveganje)

| # | Naloga | Kje (koda) | Testi | Ocena | Kriterij sprejemljivosti |
|---|---|---|---|---|---|
| P1.1 | **Zgodovina operacij / undo-redo + »recept«** — pipeline (slika → umeritev → zaznavanje → parametri → list) kot nespremenljiva zgodovina; vsak korak shrani stanje parametrov; undo/redo na nivoju projekta; izvoz »recepta« (JSON) | `js/14-ui-fields.js` (saveState/restoreState), nov `js/14b-history.js`, `js/07-project.js` | nov `tests/history.test.js` (+15) | 2–3 dni | Undo/redo deluje čez korake; recipe JSON round-trip; stari projekti še vedno veljavni |
| P1.2 | **Kontekstualni panel (PropertyManager)** — ob izbiri objekta (risba, dimenzija, profil, vrstica BOM) se odpre desni panel z lastnostmi in živim predogledom; zamenja modalne dialoge, kjer je smiselno | CSS v HTML, `js/15-ui-misc.js` (nov `openPropertyPanel`), `js/05-sheets.js` (izbira dimenzij) | nov `tests/property-panel.test.js` (+12) | 3–4 dni | Izbira elementa odpre panel; sprememba parametra se takoj odrazi v predogledu; Esc/»Uporabi« zapre |
| P1.3 | **Trak napak (error tray)** — obstoječe `checks()` sporočila postanejo klik-za-popravek (klik → fokus polja), trak ob dnu lista, ne modal | `js/03-validation.js` (checks), `js/15-ui-misc.js`, CSS | razširitev `tests/layout.test.js` (+8) | 1–2 dni | Vsako opozorilo je povezano z IDF-om; klik postavi kazalec; list ostane viden |
| P1.4 | **Stikalo dimenzijskega standarda ISO/ANSI** — globalni + per-list parameter (puščice, enote, tolerance, privzeti sloji) | `js/08-roksal.js` (WC parametri), `js/05-sheets.js` (generatorji), `js/06-exports-dxf-step.js` (DXF) | razširitev `tests/smoke.test.js` (+6) | 2 dni | Preklop spremeni videz dimenzij v vseh pogledih in DXF; zlati posnetki (ISO privzeto) nespremenjeni |

**P1 skupaj:** 8–11 delovnih dni.

### Faza P2 — Profesionalna diferenciacija

| # | Naloga | Kje | Testi | Ocena | Kriterij |
|---|---|---|---|---|---|
| P2.1 | **Konfiguracije + dizajn tabela (CSV)** — menadžer variant (npr. 6 profilov × uporaba), tabela parametrov v obliki CSV (direktno urejevalna), uporaba v BOM/izvozih | nov `js/09b-configurations.js`, `js/09-production.js`, `js/08-roksal.js` | nov `tests/configurations.test.js` (+18) | 4–5 dni | Ustvarjanje/urejanje/brisanje variant; tabela CSV round-trip; varianta vpliva na risbo in izvoze |
| P2.2 | **Usklajevanje pogledov risbe** — poravnave pogledov (front/side/top), prerezi s črtami, prelomi daljših ograj (break views), oznake prerezov v naslovu | `js/05-sheets.js` (generate, generateReference, generateStair) | razširitev `tests/golden.test.js` + nov `tests/views.test.js` (+14) | 4–6 dni | Novo zlati posnetki za prelom/prerez; stari nespremenjeni |
| P2.3 | **BOM s številkami postavk + baloni/vodilne črte** — BOM tabela z ID-ji; baloni po pogledih; enotna številčenja z izvozom (CSV/DXF/PDF) | `js/05-sheets.js`, `js/09-production.js`, `js/06-exports-dxf-step.js` | razširitev `tests/user-e2e.test.js` (+10) | 3–4 dni | BOM vrstice in baloni se ujemajo; številčenje stabilno; izvozi sledijo |
| P2.4 | **Knjižnica predlog listov** — ISO/ANSI okvirji, naslovni bloki, projektni placeholdersi; izbira pri izvozu | CSS v HTML, `js/05-sheets.js` (tbl/panel), `js/11-export-dialog.js` | nov `tests/templates.test.js` (+10) | 2–3 dni | Predloge je mogoče izbrati, uporabiti, shraniti v projekt; SVG/PDF/DXF upoštevajo |
| P2.5 | **Posnetki projektov (PDM-lite)** — checkpointi avtosave-a, obnovitev poljubne različice, oznaka »v delu«, izvoz arhiva | `js/14-ui-fields.js` (saveState), `js/07-project.js`, `js/15-ui-misc.js` | razširitev `tests/projects.test.js` (+10) | 3–4 dni | Zgodovina različic (≥10); obnovitev deluje; velikost localStorage nadzorovana |

**P2 skupaj:** 16–22 delovnih dni.

### Faza P3 — Ekosistem in globina

| # | Naloga | Kje | Testi | Ocena | Kriterij |
|---|---|---|---|---|
| P3.1 | **Dopolnjene masne lastnosti** — kg/m², skupna masa projekta, povzetek v BOM in lastnostih | `js/09-production.js` (mass), `js/05-sheets.js` | razširitev `tests/roksal-p1.test.js` (+6) | 1–2 dni | Vrednosti prikazane v BOM in properties; konsistentne z masa() |
| P3.2 | **Zaznavanje prekrivanj/trkov** — prekrivajoče se lamele, konflikti rezov, prekrivanje korit/segmentov | `js/03-validation.js`, `js/09-production.js` | razširitev `tests/stress.test.js` (+8) | 2–3 dni | Opozorila ob konfliktih; brez lažnih alarmov |
| P3.3 | **Opozarjanje na zastarele vrednosti (»rebuild«)** — ob spremembi vira oznaka »zahteva preračun« in gumb | `js/14-ui-fields.js`, `js/15-ui-misc.js` | razširitev `tests/regression.test.js` (+6) | 1–2 dni | Oznaka se pojavi ob spremembi in izgine po preračunu |
| P3.4 | **Vadnice + začetna certifikacija** — 3–5 interaktivnih vadnic (pripravljena stanja), kviz za »Draftwright Certified Installer« z digitalno značko (lokalno) | `js/15-ui-misc.js` (help), nov `js/16b-learning.js`, CSS | nov `tests/learning.test.js` (+10) | 3–5 dni | Vadnice se lahko prehodijo; kviz ima rezultat; značka se shrani |
| P3.5 | **Galerija skupnosti** — nalaganje/deljenje konfiguracij (JSON), iskanje, ocenjevanje | `js/14-ui-fields.js`, `js/15-ui-misc.js`, po potrebi prostovoljni zaledni endpoint (izven PWA) | nov `tests/gallery.test.js` (+12) | 4–6 dni | Galerija deluje brez registracije; JSON veljavnost preverjena |
| P3.6 | **»What's new« + zapiski izdaj** — pogled/popup ob novi različici, arhiv izdaj, združljivost shranjenih projektov | `sw.js` (verzioniranje), `manifest.webmanifest`, `js/15-ui-misc.js` | razširitev `tests/pwa.test.js` (+6) | 1–2 dni | Ob posodobitvi SW se prikaže obvestilo; stari projekti veljavni |

**P3 skupaj:** 12–20 delovnih dni.

---

## 4. Skupna ocena obsega

| Faza | Obseg (delovnih dni) | Vrednost | Tveganje |
|---|---|---|---|
| P1 | 8–11 | najvišja vidna profesionalnost | nizko |
| P2 | 16–22 | diferenciacija v produkt za variantno upravljanje | srednje |
| P3 | 12–20 | ekosistem in mrežni učinki | srednje–višje |
| **Skupaj** | **36–53** | — | — |

> Ocene so za **enega izkušenega razvijalca** v obstoječi kodi (znanje modulov predpostavljeno). Z dvema razvijalcema se P2/P3 lahko delno vzporedita (−25–35 %).

---

## 5. Priporočen red izvedbe

1. **Takoj (P1)**: P1.2 (panel) + P1.3 (error tray) — najhitrejša vidna sprememba UX-a.
2. **P1.1 (zgodovina)** pred P2 — brez zgodovine je vsaka nadaljnja nadgradnja parametrov težja.
3. **P2.4 (predloge listov)** pred P2.2 (pogledi) — predloge določijo okvir, v katerega se pogledi vstavljajo.
4. **P3 po stabilizaciji P1+P2** — ekosistem zahteva stabilen produkt.

---

## 6. Eksplicitno izključeno (zaenkrat)

- Polni parametrični reševalec + drevo funkcij s parent-child grafom.
- CommandManager/ribbon razpršenost.
- Datotečne seje + eksplicitno shranjevanje/odpiranje (razen kot opcija).
- GD&T drobnoglednost (polne tolerance, kompleksni simboli).
- Simulacije/FEA/gibanje.
- Težka namestitev/licenciranje (ohraniti zero-install PWA).
- Zaledni strežnik, razen če P3.5 (galerija) to zahteva — takrat ločen, neobvezen modul.

---

## 7. Kako preverjati

- Po vsaki nalogi: `npm test` (vsi obstoječi + novi testi zeleni), zlati posnetki nespremenjeni.
- Ročno v brskalniku (lokalni strežnik): prehod skozi glavni tok (slika → risba → izvoz) + novi scenariji.
- Za P2/P3: dodatno ročno preverjanje izvozov (DXF/STEP/PDF) z neodvisnimi orodji (ezdxf/steputils), kjer je primerno.

---

## Status izvedbe (2026-11-22)

- **Faza P1 — vse dokončano**: P1.1 zgodovina (undo/redo + recept), P1.2 kontekstualni panel, P1.3 trak napak.
- **Faza P2 — vse dokončano**: P2.1 konfiguracije + dizajn tabela, P2.2 break view (prelom dolgih ograj) + oznake prerezov, P2.3 BOM z interaktivnimi baloni, P2.4 predloge listov (ISO/ANSI), P2.5 PDM-lite (posnetki).
- Testna veriga ob zaključku: 30 surov / zelenih (0 FAIL).
