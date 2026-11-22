# Draftwright — Analiza aplikacije

## KAJ JE APLIKACIJA

**Tehnična risba PRO** je samostojna spletna aplikacija (brez strežniške logike, brez build koraka), ki iz fotografije ograje/fasade/terase proizvede popolno tehnično risbo s sestavnimi listi, kosovnico, montažnim načrtom in izvozi v več formatih. Namenjena je sistemu **WoodCore (Roksal)** WPC profilov.

Zgradba je **modularna** (razbitje monolita):
- **Ovojnica:** `tehnicka-risba-pro.html` — CSS + HTML + `<script src>` oznake za moduli (841 vrstic, ~63,7 KB). Brez inline JS logike (edina izjema: 1-vrstični CSS-only theme-boot na vr. 12).
- **JS logika:** 17 modulov v `js/` (`00-core.js` … `16-boot.js`), klasične skripte z deljenim globalnim obsegom; naložene v oštevilčenem vrstnem redu (zaradi `file://` odprtja in jsdom testov). Skupaj ~3.270 vrstic.
- **Vendored knjižnice:** `vendor/` (jsPDF + svg2pdf + LiberationSans TTF) — delujejo tudi offline.

---

## ARHITEKTURA

### Struktura datoteke

```
┌────────────────────────────────────────────────────────────┐
│ 1. CSS (tehnicka-risba-pro.html, vr. 13–224)               │
│    - Temi: svetla/temna (CSS custom properties)            │
│    - Meni: dropdown, dialogi, toast                         │
│    - Odzivna zasnova (mobilno/tablet/desktop)               │
│    - Export dialog + PWA + share view mode                  │
├────────────────────────────────────────────────────────────┤
│ 2. HTML (vr. 226–819)                                       │
│    - Meni vrstica (Datoteka/Pogled/Orodja/Pomoč)           │
│    - 9 sklopov (photo, cal, detect, dims, sheet, plan,      │
│      export, tloris, skica)                                  │
│    - Dialogi: izvoz, projekti, primeri, 3D, pomoč           │
│    - hooks (skrite datoteke)                                 │
├────────────────────────────────────────────────────────────┤
│ 3. Vendor <script src> (vr. 820–821)                       │
│    - vendor/jspdf.umd.min.js, vendor/svg2pdf.umd.min.js    │
├────────────────────────────────────────────────────────────┤
│ 4. JS moduli <script src> (vr. 823–839) — logika v js/     │
│    - 17 modulov 00-core … 16-boot (klasične skripte,       │
│      deljen globalni obseg, oštevilčen vrstni red)          │
│    - 16-boot.js: zagon + kuriranje window.* javnega API     │
└────────────────────────────────────────────────────────────┘
```

### Glavni moduli (`js/`)

Logika je razdeljena na **17 modulov v `js/`**; vsak je samostojna klasična skripta z deljenim globalnim obsegom, naložena v oštevilčenem vrstnem redu (obvezen).

| Modul | Vrstice | Vsebina |
|-------|---------|------|
| **`00-core.js`** | 33 | `S` stanje; `pnum`/`n`/`V` (tolerantno razčlenjevanje števil); `f()`, `st()`/`toast`, `saveBlob` |
| **`01-input-calibration.js`** | 83 | Vhod slike (load/paste/drag&drop) + umeritev (linearna 2-točkova vr. 52–64, 4-točkova homografija vr. 79) |
| **`02-detection.js`** | 280 | Zaznavanje lamel: `profiles()` (vr. 21), RUNOV svetlostni profil + rektifikacija (vr. 55–124, 177), `peakList` (vr. 33), samodejni predlog profila ±25 % (vr. 90–103), `confidence` (vr. 251–258) |
| **`03-validation.js`** | 60 | `checks()` — Roksal pravila, dilatacije, podlage |
| **`04-svg-lib.js`** | 29 | SVG primitivi (linije, puščice, baloni, mreža) |
| **`05-sheets.js`** | 467 | `generate()` / `generateReference()` / `generateStair()` — 5 pogledov + detajli + BOM |
| **`06-exports-dxf-step.js`** | 244 | DXF R12 + `stepString()` (vr. 88, solidBox vr. 93, `MANIFOLD_SOLID_BREP` vr. 126), `dlStep` (vr. 194) |
| **`07-project.js`** | 48 | Shranjevanje/odpiranje projekta (JSON, shema v3) |
| **`08-roksal.js`** | 156 | `WC` registar (vr. 10, 6 profilov + palete), `DIL` dilatacijska tabela (vr. 40), `dilatacija()` (vr. 46), `roksalLimit()` (vr. 61) |
| **`09-production.js`** | 565 | Količine: `cutItems()`/`buildCut()`, kerf optimizator, `buildQuote()` (vr. 265), `quoteCsv()` (vr. 500), `buildOrder()`, `getKoritaData()` |
| **`10-pdf.js`** | 42 | Vektorski PDF prek vendiranih jsPDF + svg2pdf |
| **`11-export-dialog.js`** | 282 | Dialog »Možnosti izvoza« + prednastavitve + `jobs` izvoza (vr. 170) |
| **`12-tloris.js`** | 81 | Interaktivni tloris (trasa po mreži, 1 px = 10 mm) |
| **`13-skica.js`** | 184 | Terenska skica (prazen list, črta/pravokotnik/krog/puščica/besedilo) |
| **`14-ui-fields.js`** | 281 | Polja, validacije polj, prenos med polji |
| **`15-ui-misc.js`** | 424 | Meniji, dialogi, bližnjice, i18n, toast, autosave, PWA |
| **`16-boot.js`** | 9 | Zagon: IIFE + kuriranje `window.*` javnega API-ja |

---

## KLJUČNE FUNKCIJE

### 1. Vhod: Slika → Umeritev → Zaznavanje
- **Nalaganje slike**: izbira datoteke, Ctrl+V, drag&drop (`js/01-input-calibration.js`)
- **Umeritev**: 2 točki (linearna) ali 4 točki (perspektivna homografija z inverzno preslikavo) (`js/01-input-calibration.js`)
- **Zaznavanje lamel**: svetlostni profil po sredinskem stolpcu + večstolpna mediana (7 stolpcev ±10/20/30 %) (`js/02-detection.js`)
  - Rektifikacija pri perspektivi (inverzna homografija) — odpravlja −43,5 % napako H
  - ROMB fazi 15°: nominalna širina iz registra + fuga iz merjenega koraka
  - Predlog profila iz izmerjene širine (najbližji znotraj ±25 %)

### 2. Parametri in validacija
- **6 profilov**: ROMB-67, POLNA-128, DESKA-150, POLNA-57/32, POLNA-100, KUBO-80/42 (`js/08-roksal.js`)
- **7 uporab**: prečna, pokončna, fasada, terasa, pregradna stena, napušč, stopniščna
- **Roksal pravila**: omejitve razmaka, dilatacijski kalkulator, podlage (8 opcij) (`js/03-validation.js`, `js/08-roksal.js`)
- **Validacije**: vsota lamel, stene, temperature, padec podlage, sidranje

### 3. Generiranje risbe (5 pogledov)
- **Sprednji pogled** (z lamelami, nosilci, konturno)
- **Stranski pogled** (z globino)
- **Tloris** (z L-povratkom W2)
- **Izometrični pogled** (3D BREP)
- **Prerez A–A** (s steber, lamelami, sidranjem)
- **Detalji pritrjevanja** + BOM tabela
- (`js/04-svg-lib.js`, `js/05-sheets.js`)

### 4. Izvoz
| Format | Opis | Modul |
|--------|------|-------|
| **PDF** | brskalni tisk z jsPDF + svg2pdf | `js/10-pdf.js` |
| **SVG** | vektorski list | `js/05-sheets.js` |
| **DXF** | R12 LINE/TEXT + polilinije (CNC) | `js/06-exports-dxf-step.js` |
| **STEP** | AP214 BREP solid model | `js/06-exports-dxf-step.js` |
| **CSV** | kosovnica + montažni načrt + kerf + predračun | `js/09-production.js` |
| **TXT** | naročilnik + montažni checklist + tehnični list + povpraševanje | `js/09-production.js` |
| **JSON** | projekt (shranjevanje/odpiranje) | `js/07-project.js` |

### 5. Dodatna orodja
- **Kerf optimizator**: DP za enake kose + FFD nesting (staplanje) (`js/09-production.js`)
- **Predračun**: orientacijski, brez DDV (`js/09-production.js`)
- **Tloris**: interaktivno risanje trase po mreži (1 px = 10 mm) (`js/12-tloris.js`)
- **Terenska skica**: prazen A4/A3 list z orodji (črta, pravokotnik, krog, puščica, besedilo, kotiranje, izo, radirka, premik) (`js/13-skica.js`)
- **3D pogled**: vrtenje izometričnega modela
- **PWA**: manifest + Service Worker (network-first/stale-while-revalidate) (`sw.js`)
- **Izvozni dialog + prednastavitve** (`js/11-export-dialog.js`)

---

## ZNANE OMEJITVE

1. **STEP model** — brez boolevskih operacij, samo geometrijsko prekrivajoča telesa (parametrični pregled, ne 3D tisk/CNC)
2. **DXF** — koordinatni prostor lista (420×297 enot), pri drugih formatih se vsebina proporcionalno pomanjša
3. **Samodejno zaznavanje** — orientacijsko, vedno preveriti ročno
4. **Kalibracija** — 2-točkovno lahko nezanesljivo; L vpisati ročno ali uporabiti tloris
5. **Predračun** — orientacijski, ni ponudba; risba ni statični izračun

---

## TESTI

```bash
npm install
npm test
```

**24 testnih surov (jsdom)** — testno nalaganje prek `tests/helpers/bootApp.js`, ki modulne `<script src>` oznake v HTML nadomesti z inline kodo (jsdom ne nalaga zunanjih skriptov):
- `modules.test.js` — strukturni testi razbitja monolita (vrstni red modulov, `sw.js` predpomnilnik)
- `layout.test.js` — poravnanje/robni primeri postavitev
- `regression.test.js` — regresijski pokriti koraki javnega API-ja (buildOrder, cutData, orderText)
- `smoke.test.js` — generiranje listov, validacije, izvozi
- `export-dialog.test.js` — izvozni dialog (vsi formati, napredne nastavitve, robni primeri)
- `roksal-p1.test.js` — dilatacije, napušč, pregrade, palete, podlage
- `roksal-p2.test.js` — tehnični list, povpraševanje, prodajni pogoji
- `issue2-phase1.test.js` — stale-state, orientacija reza
- `vision.test.js` — realno pikselno zaznavanje
- `issue2-phase2.test.js` — DXF sloji, STEP topologija
- `issue2-phase3.test.js`
- `tloris.test.js` + `skica.test.js` — stale-state, orientacija
- `projects.test.js` + `pwa.test.js` — shranjevanje/PWA
- `pdf.test.js` + `user-e2e.test.js` — PDF end-to-end
- `stress.test.js` + `photo-variety.test.js` — obremenitve
- `auto-l.test.js` — M2: confidence-gated avto-L (prag 45 %; stop-rule pri nizki zanesljivosti)
- `registry.test.js` — M5: več-znamkovski registar (shema + validator; WoodCore kot prvi registar)
- `vision-deep.test.js` — M4 (korak 1): evalucijska teža + oziromkovana fiksatura lamel (`tests/fixtures/slats.js`); baseline heuristike
- `novice-user.test.js` + `golden.test.js` — primerjava s zlatimi posnetki (`tests/golden/`)

CI: `.github/workflows/ci.yml` (Node 22.22.2, `npm ci && npm test`).

---

## STRUKTURA REPOZITORIJA

```
index.html               preusmeritev na aplikacijo
tehnicka-risba-pro.html  ovojnica (CSS + HTML + <script src> oznake; 841 vrstic)
js/                     17 JS modulov (razbitje monolita, 00-core … 16-boot)
tools/                   razvojna orodja (split-modules.js, inline-scripts.js, patch-tests.js)
manifest.webmanifest      PWA manifest
sw.js                    Service Worker (network-first/stale-while-revalidate)
icon-192.png/512.png     PWA ikone
vendor/                  vendored knjižnice (jsPDF + svg2pdf + LiberationSans TTF)
samples/                 vzorčni izvozi (SVG/PDF/DXF/STEP)
docs/                    dodatna dokumentacija / validacija izvozov
tests/                   jsdom testi (24 surov; zlati posnetki v tests/golden/; fiksature v tests/fixtures/; pomočnik tests/helpers/bootApp.js)
tests/fixtures/          deterministične fiksature (slats.js — oziromkovan dataset M4)
package.json / package-lock.json   odvisnosti in testna skripta (npm test)
m2-rect.png / m2-src.png  testni viri za zaznavanje/perspektivo
.github/                 CI (GitHub Actions — smoke test)
```

> **Opomba:** `ANALIZA.md` opisuje **modularno zgradbo**. Starejša verzija tega dokumenta (in `research/report.md`) opisujeta monolitno datoteko (`tehnicka-risba-pro.html`, ~4021 vrstic) — to je točkasti snapshot pred razbitjem monolita; vrstni referenci `851–917` / `919–1176` v teh dokumentih pomenijo območja v takratnem monolitnem HTML.
