# Tehnični predlogi — M1–M5 (konkretizacija roadmap-e)

**Datum:** 2026-11-22
**Osnova:** `research/report.md` (Poglavje 5, mejniki M1–M5)
**Namen:** ta dokument razčlene strateške mejnike M1–M5 iz poročila v konkretna, v kodo upodobljena tehnična priporočila — točke vgrajevanja v modulno zgradbo `js/` (17 modulov), izbrane knjižnice/arhitekturo, testni načrt in oceno dela. Ni ponovno strateška analiza (to je v P4); tu so samo *kako izvesti*.

> **Opomba o doslednosti virov (preverjeno — zgradba se je spremenila):** `report.md` in prvotna verzija tega dokumenta so bila napisana, ko je bila aplikacija **monolit** (ena datoteka `tehnicka-risba-pro.html`, ~4021 vrstic). Med razvojem se je zgodila **modularizacija** (razbitje monolita): logika je sedaj v `js/` (17 modulov `00-core` … `16-boot`), HTML je samo ovojnica (841 vrstic) in testni surovi so zrasli s 19 na **21**. Zaradi tega so vrstni ankrji v monolitnem HTML **zastareli**; spodaj so zamenjani z **veljavnimi `js/*` ankrji**, potrjenimi z dejanskim stanjem datotek:
> `profiles()` → `js/02-detection.js:21` · `stepString()` → `js/06-exports-dxf-step.js:88` (solidBox :93, MANIFOLD_SOLID_BREP :126) · `dlStep` → `js/06-exports-dxf-step.js:194` · `WC` → `js/08-roksal.js:10` · `DIL` → `:40` · `dilatacija()` → `:46` · `roksalLimit()` → `:61` · `buildQuote()` → `js/09-production.js:265` · `quoteCsv()` → `:500` · `menuDlQuote` → `:505` · kalibracija (linearna/4-točkova) → `js/01-input-calibration.js:52/79` · izvozi → `js/11-export-dialog.js`.

---

## Predpogoj: M1 in M2 (P0) — nujno pred M3–M5

M3/M5 sta odprti le **po M1**, M4 pa le **po M2** (odvisnosti iz P5). Zato jima je tukaj kraj kot predpogoja.

### M1 — veja-higiena + testna disciplina + commit modularizacije (P0, obseg S)
- **Dejansko stanje (git preverjeno, 2026-11-22):** delovno drevo vsebuje **nespremljeno modularizacijo** — `js/` (17 modulov), `tools/`, `tests/helpers/bootApp.js` in 3 nove teste (`layout.test.js`, `modules.test.js`, `regression.test.js`), izbrisan `sk-module.js`; HTML skrajšan s ~4021 na 841 vrstic; `package.json` vgradi **21 testnih surov**. 26 odprtih vej v `origin/*` so vse ancestor glave `main` (0 commitov pred main) → **veja-higiena, ne integracija**.
- **Koraki:** (1) commit modularizacije + usklajenih testov (`package.json` = 21 surov); (2) potrdi `npm test` zeleno (stop-rule); (3) odstrani združene odprte veje; (4) CI kriterij za bodoče združitve = `npm test` + nepoškodovani zlati posnetki.
- **Stop-rule:** če `npm test` ni zeleno → ne zdubim.
- **Testni načrt:** obstoječih **21 surov** + zlati posnetki; novosti: `modules.test.js` (strukturni vrstni red modulov), `layout.test.js`, `regression.test.js`.

### M2 — stabilno avto-L (P0, obseg M)
- **Dejansko stanje (git preverjeno):** commit `b152b75` — samodejni L iz bbox-a je nestabilen (2-točkovna kalibracija intrinzično nezanesljiva); zato ročno vpisane mere ostanejo referenčni način.
- **Točka vgrajevanja:** kalibracijski modul `js/01-input-calibration.js` (linearni način vr. 52/60–64, 4-točkova perspektivna homografija vr. 79).
- **Predlog:** 2-točkovno nadgradi z **4-točkovno perspektivno homografijo** (že implementirana v `mPlane`) kot privzeti način za L; samodejno L izbboxa (določi se v `js/02-detection.js`) postavi le kot predlog z visokim pragom zanesljivosti.
- **Stop-rule:** če zanesljivost ni nad pragom na testnih skicah → ohrani ročni vnos.

---

## M3 — WASM boolevsko jedro (pravi STEP / CNC)

**Cilj:** danes je izvoz STEP poenostavljen (*simplified box solids, not production CAD*) in DXF vezan na 420×297 (A3) prostor. M3 dodaja prave boolevske operacije za generiranje solid geometrije WPC profilov in izvoz CNC G-code — brez vpliva na jedro (modularno, 17 modulov v `js/`; distribucijska portabilnost ostane, saj so moduli statične klasične skripte brez build koraka).

### Konkretna točka vgrajevanja
- **`stepString()` (`js/06-exports-dxf-step.js:88`)** — sedaj izgradnja solidov z `solidBox(x0,y0,z0,x1,y1,z1)` (`:93`): 8 VERTEX + 12 EDGE_CURVE + 6 FACE + CLOSED_SHELL + `MANIFOLD_SOLID_BREP` (`:126`). Kaskadna stopniščna ograja (iste datoteke, pod `:88`) prav tako le poenostavljene polnila.
- **`dlStep` (`js/06-exports-dxf-step.js:194` / `jobs.push` `js/11-export-dialog.js:170`)** — točka klicanja izvoza `.step`.
- **DXF R12 izvoz** — vezan na A3; `ezdxf` validacija v `docs/validacija-izvozov.md`.

### Predlog (arhitektura + knjižnice)
1. **Modularno jedro:** jedro ostane statično modularno (17 klasičnih skript v `js/`, brez build koraka); boolevski modul se doda kot **neobvezen WASM** (po vzoru *Chili3D* — OpenCascade 8.0.1 v WASM prek Emscriptena). Uvoz le, ko uporabnik zažene boolevski izvoz ali CNC — jedro in obstoječa distribucija (prenos prek USB / file://) ostanejo netaknjena.
2. **Izbira jedra:** [Chili3D](https://github.com/xiangechen/chili3d) (prave boolevske operacije + shape repair v brskalniku) ali [OpenCascade.js](https://github.com/donalffons/opencascade.js) (BREP/STEP kernel). Za CNC G-code: dodaten izvozni kanal (2,5-/3- osi) na solid geometrijo.
3. **PWA/offline:** WASM modul se prenaša in predpomni v Service Worker (v2, network-first) le ob prvem začetku boolevskega izvoza — ne na obvezno nalaganje celotne aplikacije.
4. **Stop-rule (kvantitativni prag iz P5):** če dodaten WASM modul **podaljša nalaganje nad 10 s na mobilni napravi → omejimo boolevski/CNC kanal na desktop**, jedro ostane hitro.

### Testni načrt
- **`tests/boolean-step.test.js`** (nov, samostojni) — validacija pravih boolevskih solidov (ni več le box); samoprevera preko `ezdxf`/`steputils` (0 nedoločenih referenc).
- Stop-rule M3: testno kriterijem — če solid ni veljaven (nedoločena reference / manjkajoča shell topologija) → izvoz označi kot *orijentacijski*, ne proizvodni.

### Ocena dela / tveganja
- **Obseg L.** OCCT WASM je težak in kompleksen; boji se z PWA/offline SW predpomnilnikom (tveganje nalaganja na mobilnih). Odvisnost: odprt po M1 (veja-higiena).

---

## M4 — Globoko učenje za zaznavo lamel in umeritev

**Cilj:** danes so merjenja **orientacijske** narave (svetlostni profil + mediana 7 stolpcev, samodejni L iz bbox-a je nestabilen — commit `b152b75`). M4 uvaja globinski model, ki samodejno zazna profile in dolžine z manjšim ročnim prilagajanjem.

### Konkretna točka vgrajevanja
- **`profiles(g,ang,cx)` (`js/02-detection.js:21`)** — svetlostni profil s večstolpno mediano (sredina ±10/20/30 %) in ROMB fazi 15°.
- **»Faza 2.5« RUNOV svetlostni profil (`js/02-detection.js:55–124`, rektifikacija `:177`, integracija `:227`)** — iz `peakList(p.rows,thr,sep)` (`:227`) določi število lamel, širino, režo in **konsistentnost koraka (`S.det.confidence`)**; samodejni predlog profila ±25 % (`:90–103`).
- **Konsistentnost:** danes se rezultat *vedno ročno preveri* (`js/02-detection.js:253` »preverite ročno«).

### Predlog (arhitektura + knjižnice)
1. **Lastni dataset:** vzorci fotografij WPC lamel z znano geometrijo (merjena širina/reža/št. lamel + oznake) — osnova za treniranje in evalucijo.
2. **Model:** pretrained image-to-floorplan / edge-detection omrežje, prilagojeno na lamele WPC. Reference: **C3Po** (NeurIPS 2025, vezava slik z tlorisi, −34 % napake) in *training-free* baseline **HouseLayout3D/MultiFloor3D** (večpodropna rekonstrukcija iz fotografij brez treniranja).
3. **Integracija:** model nadgradi `profiles()` kot *sugestijo*; orientacijski rezultat ostane referenca — M2 (stabilno avto-L) pred M4 (odvisnost iz P5).

### Testni načrt
- **`tests/vision-deep.test.js`** (nov, samostojni) — evalucija na lastnem datasetu: zanesljivost vs heuristika (baseline), merjenje napake detekcije lamel.
- Stop-rule M4: **če dataset ni dovolj obsežen → ostane heuristika** (M4 odklopi). Model še ni v produkciji; realizabilnost je *faza razvoja*, ne izdajalni mejnik.

### Ocena dela / tveganja
- **Obseg L.** Podatkovni nabor + obdobje treniranja; C3Po dokazuje slika→tloris, a na domeno ograj ni neposredno prenosljivo. Odvisnost: odprt po M2.

---

## M5 — Več-znamkovski registar + ponudba / DDV

**Cilj:** danes je produkt **zaprt na eno znamko (WoodCore/Roksal)** — registar je hardkodiran. M5 uvede več-znamkovsko registrsko abstrakcijo in (kot plačljivo funkcijo) formalno ponudbo z DDV — komercializacija brez izgube portabilnosti.

### Konkretna točka vgrajevanja
- **`WC` registar (`js/08-roksal.js:10`)** — 6 profilov (romb67, polna128, deska150, polna57, polna100, kubo80) z lastnostmi `w/t/len/max/fix/allowed/post/rail/facade/drill/palette` — vse vezano na WoodCore.
- **`DIL` dilatacijska tabela + `dilatacija(lenM,tempC)` (`js/08-roksal.js:40, 46`)** — uradni WoodCore PDF »Navodila za montažo WPC terasnih desk« (zahodna/vzhodna Evropa); opomba: vrstica −25 °C/1 m v PDFu natisnjena 2,27 → uporabljena 2,75.
- **`roksalLimit(p,use,H)` (`js/08-roksal.js:61`)** — pravila podlag/nosilcev po uporabi (prečna/pokončna fasada/terasa/pregrada/napušč/stopniščna).
- **Predračun:** `buildQuote()` (`js/09-production.js:265`), `quoteCsv()` (`:500`), `menuDlQuote` (`:505`) — danes »orientacijski, brez DDV, ni ponudba«; cene nastavljive (`priceBoard` 24,5 EUR/m itd.).

### Predlog (arhitektura)
1. **Registrska abstrakcija (P4-a):** enotna shema za **profil / dilatacijska tabela / pravila podlage / barvna paleta / kontaktni obrazec**. S tem se WoodCore postane *en registar* med drugimi (npr. AZEK, Trex, Fiberon, RENOLIT) — brez ponovne vgradnje logike ob menjavi znamke.
2. **Ponudba z DDV kot plačljiva funkcija:** prek `buildQuote()`/`quoteCsv()` dodamo DDV postavke in pogodbeni obrazec (stranka, dobava, zavezujoče pogoje). Vsebuje **pravno razmejevanje odgovornosti** (P4-c: EULA + opozorila + obvezni strokovni pregled).
3. **Stop-rule M5:** **brez pogodbenih podatkov znamk → samo ena znamka** (WoodCore ostane privzete; druge znamke se vgrajajo le, ko je podatki na voljo).

### Testni načrt
- **`tests/registry.test.js`** (nov) — samoprevera registrske sheme: vsak registar (znamka → profil/dilatacije/posebnosti) validirano; konsistentnost BOM ↔ predračun ↔ rezalni načrt.
- Ponudba z DDV: poseben test na DDV postavke in pogodbenem obrazcu (vsota brez/ s DDV, pravilni opozorilni zapisi).

### Ocena dela / tveganja
- **Obseg M–L** (M = registarska abstrakcija sama; L, ko vključi ponudbo + DDV). Osnova: rast WPC trga (Grand View 2025: 21,51 mrd USD do 2033, CAGR 11,7 %). Tveganje: odvisnost od Roksalovih prodajnih pogojev — dokumentirati; pravna ekspozicija povečana ob ponudbi s DDV (vezi M5 → P4-c). Odvisnost: odprt po M1.

---

## Povzetek odvisnosti in pravila za zaščito

| Mejnik | Obseg | Odprt po | Stop-rule | Nov test |
|---|---|---|---|---|
| **M1** veja-higiena + commit modularizacije + testna disciplina | S | — | `npm test` ni zeleno → ne zdubim | obstoječih **21 surov** (+ modules/layout/regression) ✅ |
| **M2** stabilno avto-L | M | M1 | zanesljivost pod pragom → ročni vnos | `auto-l.test.js` (confidence-gated) ✅ |
| **M3** WASM bool/CNC | L | M1 | nalaganje >10 s na mobilnem → desktop-only | `boolean-step.test.js` |
| **M4** globoko učenje lamel | L | M2 | dataset premajhen → ostane heuristika | `vision-deep.test.js` (korak 1: dataset + baseline) ✅ |
| **M5** več-znamkovski registar + ponudba/DDV | M–L | M1 | brez pogodbenih podatkov znamk → ena znamka | `registry.test.js` (scope M: shema+validator+WoodCore) ✅ |

**Dejansko stanje (posodobljeno, git preverjeno):** M1 ✅ (commit `d61f156` modularizacija + `7a100e8` raziskovalna izdaja), M2 ✅ (commit `3e75940` — avto-L confidence-gated, prag 45 %, `auto-l.test.js`), M5-scope-M ✅ (commit `bb6ab78` — registrska abstrakcija `js/08-roksal.js` + `registry.test.js`, stop-rule: registriran ostane samo WoodCore), M4-korak-1 ✅ (oziromkovan dataset `tests/fixtures/slats.js` + evalucijska teža `vision-deep.test.js`: baseline heuristike, **n/H 12/12 na Tier A**; uvid: M4-DL vrednost je na osi sw/gap, ki sta profil-povezani). M3 (WASM bool/CNC, obseg L) in M4-korak-2 (globinska treniranja na tem datasetu, obseg L) sta predvidena. `package.json` vgrajuje **24 testnih surov**.
