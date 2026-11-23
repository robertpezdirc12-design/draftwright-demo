# Changelog

Vse pomembnejše spremembe projekta **Draftwright — Tehnična risba PRO** so dokumentirane v tej datoteki. Oblika sledi [Keep a Changelog](https://keepachangelog.com/sl/1.1.0/); različica je enaka `APP_VERSION` v aplikaciji.

## [2026.11.3] — 2026-11-23

### Spremenjeno (refaktor — Issue #41 §3.F)

**Odstranjevanje podvojenih pomožnih funkcij + enovirni generator CSS**
- Skupni `dim()` in `vt()` — prej podvojena lokalno v večih funkcijah (`stepString`, `generateReference`, stopnični list). Zdaj ena top-level definicija; lokalne podvojene odstranjene, klice rešujejo skupna.
- `ip()`/`ibox()` so **namenoma podvojena** (različna izometrična matematika `kx/ky` proti `ik`) — refaktor jih ni združil, da izometrični listi ohranijo pravilno projekcijo.
- Nov `scripts/generate-utility-css.js`: **en vir** za 74 CSS utilitetskih pravil `[data-s]`, ki prej obstajala byte-identično v dveh mestih (inline `<style>` v HTML in povezan `print.css`). Generator med markerjema `__UTILITY_CSS__` zapiše blok v obe datoteki in z `--check` zazna drift. Pisanje je idempotentno.

### Dodano (testi)

- `tests/refactor-utility-css.test.js` (16 preverjanj): statični vir (ena `dim`, ena top-level `vt`, noben lokalni; `ip` namenoma ×2 kot zaščita pred prepisom), sinhronizacija HTML ↔ `print.css` bloka, `--check` exit 0, idempotentnost pisanja in byte-copy vira.
- Skupaj **50 testnih surov** (prej 49); CSP hash-ji regenerirani, zlata posnetka ostanejo byte-identična.

## [2026.11.2] — 2026-11-23

### Dodano

**Celovit pregled s 4 agenti → implementirani popravki** (povzetek v `docs/review-2026-11-23.md`)
- **P0 (terenska blokada):** ročno prilagajanje zaznanih lamelnih črt se je odvijalo samo z miško (mousedown/move/up) — jedrna kalibracija na tabličnih napravah ni delovala. Prelomljeno na pointer dogodke (`pointerdown/move/up` + `setPointerCapture` + `touch-action:none`).
- **P0 (trojni Ctrl+Z/Y):** trije dokumentni undo skladi (parametri / tloris / skica) so se sprožali hkrati. Dodana diskriminacija po zadnjem domenu interakcije (`LAST_EDIT`, `seedDomain` na `pointerdown`+`click`).
- **P1 (tiha mutacija formata):** sprememba izvozne papirne velikosti se ob **preklicu** izvoznega dialoga vrne — format risbe se tiho ne spremeni. Uspešen izvoz ohrani dvosmerno sinhronizacijo.
- **P1 (SW `undefined` odgovor):** service worker pri manjkajočem predpomnisku + omrežnem padu se je rešil v `undefined`. Zdaj fallback na domov (`./`).
- **P2 (robustnost izvozov):** sanitizacija — STEP projektne oznake (`safeStepName`), DXF TEXT (kontrolni znaki), CSV formula-injection (`csvCell`/`csvRow` v vseh 4 CSV izvozih, omiljenje vodilnih `= + - @`). Nedokumentiran sink `:3558` (QR `insertAdjacentHTML`) dopoljen v `security-innerhtml-inventory`.

### Dodano (testi)

- `tests/review-2026-11-23.test.js` (regresija za zgoraj, 22 preverjanj).
- `tests/homography-math.test.js` — numerična pravilnost 4-točkovne umeritve (skrena mreža → mm znotraj 1e-4, afina točnost, zavrnitev izrojenih točk).
- `tests/dilatation-table.test.js` — sweep cele dilatacijske matrike (1–5 m × −25…+35 °C: monotoničnost po T in dolžini, interpolacija, meje).
- `tests/sw-offline.test.js` — behavioral test service workerja (VM + fake CacheStorage: SWR, offline fallback, navigacija, preskoki POST/zunanji izvor).
- Kalibracijske funkcije (`solve/homography/dilatacija/toMM/mmDist`) izvožene na `window` kot testno dostopne.
- Skupaj **49 testnih surov** (prej 46); CSP hash-ji regenerirani, zlata posnetka ostanejo byte-identična.

## [2026.11.1] — 2026-11-23

### Spremenjeno

**Hibridni rezalni optimizator (večdolžinski primeri)**
- `optimizeMulti` je zdaj hibrid: FFD (prejšnji algoritem) ostane baseline, hkrati teče best-fit razponski pakirnik prek treh vrstnih redov kosov z vnovično oceno zaloge (najmanjša zaloga, ki pokrije razpon deske). Izbran je cenejši načrt — rezultat nikoli ni slabši od FFD.
- Mešani primer 4000×10 + 1200×10: **62 000 → 55 600 mm** (nabava 20 → 13 desk); stopnišče 940×12 + ročaj 3931×2: **21 200 → 19 600 mm** (8 → 4 deske).
- Preverjeno proti A/B benchmarku (`npm run bench:cut`): aplikacija zdaj prekaša MaxRects izzivalca (55 600 ≤ 58 000; v 30-seed vzorcu 0 izboljšav / 4 regresije na strani izzivalca).
- Brez zunanjih knjižnic v brskalniku — `maxrects-packer` ostane samo dev odvisnost za benchmark.
- Nov test `tests/cut-hybrid.test.js` (goldeni + lastnost »nikoli slabši od FFD« na 30 primerih: 18 izboljšav, 0 regresij).

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
