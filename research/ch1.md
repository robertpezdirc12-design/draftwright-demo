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
