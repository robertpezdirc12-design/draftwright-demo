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
