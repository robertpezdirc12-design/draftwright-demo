# Changelog

Vse pomembnejše spremembe projekta **Draftwright — Tehnična risba PRO** so dokumentirane v tej datoteki. Oblika sledi [Keep a Changelog](https://keepachangelog.com/sl/1.1.0/); različica je enaka `APP_VERSION` v aplikaciji.

## [2026.11] — 2026-11-22

### Dodano

**Popravki točnosti (Issue #37)**
- `buildPlan()` uporablja isti avtoritativni rezalni izračun kot `buildCut()` (zaloge, kerf, optimizacija) — brez konfliktnih količin med dokumenti.
- Vijaki RF se štejejo iz vseh fizičnih lamel (vključno segmenti + L-povratek) v BOM, predračunu, naročilniku in montažnem načrtu.
- `restoreProjectString()` obnovi `S.photoData` (save→load→save round-trip) in počisti zastarelo foto stanje.
- `prjViewPayload()` vključuje cone/globino (zoneTop/zoneMid/zoneBot/zoneBase/innerD) — zvesta delitev pogleda.
- `collectSolids()` vključuje segmente in L-povratek (3D pariteta z 2D/proizvodnim modelom).

**Faza P1**
- Trak napak (error tray) z klik-za-popravek povezavo na polja.
- Kontekstualni panel za dimenzije (lastnosti + urejanje + »Uporabi« → regeneracija).
- Zgodovina operacij (undo/redo parametrov, Ctrl+Z/Y) s skladom do 40 korakov.

**Faza P2**
- Konfiguracije + dizajn tabela (CSV) — meni Konfiguracije.
- Break view: prelom dolgih ograj (L > 7600 mm) z lomljenima črtama in polno mero.
- BOM z interaktivnimi baloni (register `BOM_ROWS`, klik → toast).
- Predloge listov: klasičen / ISO 7200 / ANSI naslovni blok.
- PDM-lite: samodejni posnetki stanja (do 20) z obnovitvijo in izvozom arhiva (JSON).

**Faza P3**
- Masne lastnosti: kg, kg/m² in kg/m (predračun + montažni načrt).
- Zaznavanje trkov/prekrivanj (korita+segmenti, negativna reža, nepozitivna širina, negativen kerf, negativne cone).
- Oznake »stale« za proizvodne rezultate (do ponovnega izračuna).
- Vadnice (3 vodeni scenariji) + certifikacijski kviz → oznaka »Draftwright Certified Installer«.
- »What's new« popup + zapiski izdaj.

**Dokumentacija**
- Oblikovan nested `README.md` (napredne funkcionalnosti, 34 testnih surov, struktura).
- Ta `CHANGELOG.md`.
- Strateški dokumenti v `research/` (SolidWorks benchmark, roadmap).

### Popravljeno
- Validacije se zdaj sprožijo tudi ob vnosu segmentov/korit/W2/debeline plošče.
- Prikaz dimenzije v break view ohranja polno dolžino.
- Algoritem bvX() (model→papir) za kratke ograje je identičen prejšnjemu (zlati posnetki nedotaknjeni).

## [2026.10] — predhodna izdaja

### Dodano
- Slika → umeritev (2/4 točke) → samodejno zaznavanje lamel (tilt-tolerant, večstolpčno).
- Roksal/WoodCore pravila: 6 profilov, 7 uporab, dilatacije, 8 podlag, podkonstrukcija terase, barvne palete, prednastavitve.
- Generiranje risbe: sprednji/stranski/tloris/izometrija, prerez A–A, detajli, BOM, naslovni blok; segmenti in L-povratek; korita za rože.
- Izvoz: PDF (vektorski), SVG, DXF R12, STEP AP214, CSV/TXT/JSON; izvozni dialog s prednastavitvami in naprednimi možnostmi.
- PWA + offline (Service Worker), i18n SL/EN, terenska skica, interaktivni tloris, projekti (localStorage + deljenje URL), QR-odobritev, rezultati v modalih, AI-prepoznavanje profila.
