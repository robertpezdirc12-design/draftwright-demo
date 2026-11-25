# Changelog

Vse pomembnejše spremembe projekta **Draftwright — Tehnična risba PRO** so dokumentirane v tej datoteki. Oblika sledi [Keep a Changelog](https://keepachangelog.com/sl/1.1.0/); datumski sufiksi v oznakah (npr. `[2026.11.15]`) so zaporedne podrazličice mesečne različice `APP_VERSION` (trenutno `2026.11`).

## [2026.11.23] — 2026-11-25

### Dodano (reference — pokončna ograja z WoodCore deskami)

**Galerija referenc pokončne ograje (4 profili, foto eksponati)**
- V galeriji primerov je nova sekcija **Reference — pokončna ograja z WoodCore deskami** s štirimi karticami eksponatov: **POLNA DESKA 57/32** (eksponat ograje iz polnih desk širine 5,7 ali 3,2 cm, dolžine 5,8 m), **POLNA DESKA 100** (ograja iz polnih desk širine 10 cm, dolžine 5,8 m), **POLNA DESKA 128** (ograja iz polnih desk širine 12,8 cm, dolžine 2,2 m) in **ROMB DESKA 67** (ograja iz desk profila ROMB širine 6,7 cm, dolžine 2,8 m).
- Kartica nosi fotografijo eksponata (`slike/pokoncna/*.jpg`, 4 krajevne slike brez zunanjih virov) in katalogski zapis. Klik kartice nastavi uporabo **pokončna ograja** in ustrezen profil iz registra `WC` (applySystem izračuna širino/debelino/nosilce iz Roksal limitov), izračuna število navpičnih desk čez L in generira risbo.
- Fotografije so vključene v `SW_ASSETS` (`sw.js`) — galerija deluje tudi brez signala. Seznam cache `risba-pro-v3` ostaja (dodatne datoteke se v obstoječi cache naložijo ob namestitvi posodobljenega SW).
- EN pariteta: naslov sekcije, uvod in opisi eksponatov (`ref_h`, `ref_intro`, `ref_c1..4`) prevedeni; imena profilov ostanejo katalogska; dinamični toast »Referenca naložena: …« gre prek `UI_MSG` vzorca.
- Nov `tests/reference-gallery.test.js` (**69 preverjanj**) — struktura galerije, katalogske mere, registarska povezava ključev kartic z `WC`, nalaganje profila prek klika (uporaba/profil/širina/debelina/generacija), EN pariteta z povratkom v SL, dostopna imena kartic, prisotnost slik na disku in v SW predpomnilniku ter odsotnost JS napak. Na neposredni predhodni kodi pade z **24 FAIL**, preverjeno v začasni delovni kopiji. Skupaj **67 testnih surov** (prej 66). CSP hash-i regenerirani.

### Dodano (katalog WoodCore WPC elementov in značilnosti pritrjevanja)

**Značilnosti pritrjevanja desk na konstrukcijo**
- Nova sekcija galerije z obveznimi pravili: min odmik vijaka od roba reza **3 cm**, pri konstrukciji na ploščo (balkon, dvoriščna ograja) max **15 cm**, pri bočni montaži na ploščo pa **10 cm**.
- **POLNA DESKA 57/32**: montaža na širino 5,7 ali 3,2 cm; vijak ≈ 2/3 globine profila; RF vijaki skozi cev iz zadnje strani (nevidno); v WPC luknja **manjša** od vijaka, v konstrukcijo **večja** (raztezanje); stebrički max **150 cm** ne glede na višino, nosilci max **100 cm**.
- **POLNA DESKA 100 in 128**: reza in obdelava kakor les; priporočen razmak med deskami **0,5–3 cm** ali prekrivanje (montaža iz obeh strani); stebrički **180 cm** do višine 150 cm, nad **150 cm**; vijačenje iz lica je obvezno; v kovinsko cev predvrtanje večje od vijaka (temperatura), v WPC +1 mm.
- **ROMB DESKA 67**: rostfraj vijaki skozi stebriček v aluminijasto cev v sredini romba iz zadnje strani (nevidno); L-kotniki max **145 cm**; vedno večja luknja v WPC (primer: vijak 3,9 → Ø3.2 v romb in alu, nato romb na 4,2–4,5). **OPOZORILO: montaža brez alu cevi ni mogoča** — alu cev je obvezna in vključena v ceno romb deske.

**Katalog elementov WoodCore WPC (deske, čepi, ročaji)**
- Kartice elementov z dimenzijami: POLNA DESKA 57/32 (57 × 32 × 5800 mm), POLNA DESKA 100 (100 × 12 × 5800 mm, **samo pokončna ograja**), POLNA DESKA 128 (128 × 16 × 2200 mm), ROMB DESKA 67 (67 × 26 × 5800 mm, **z alu cevjo**), WPC čep za profil romb (levo/desno, za prečno ograjo tudi letev), Ročaj 95 × 45 × 5800 mm (samo WHITE odtenek) in Ročaj – poln profil 92 × 45 × 5800 mm (notranja dimenzija 55 × 30 mm; **samostojna prodaja ročajev ni možna**).

**Barvne palete, skladiščenje in povpraševanje**
- Fotografije barvnih palet posameznih profilov (57/32: 4 barve, 100: 8 barv, 128: 6 barv, ROMB: 7 barv) s krajevnimi slikami v `SW_ASSETS`.
- Pravila skladiščenja (suh in zračen prostor, ravna in čista podlaga po celotni dolžini/širini; ob neustreznem skladiščenju se reklamacija ne upošteva) in besedilo povpraševanja (info@roksal.com kot besedilo — brez zunanjih povezav, skladno z egress politiko).

**Register, risarske opombe in zlati posnetki**
- Register `WC`: `polna100`/`polna128` stebri pokončno 1800 (H ≤ 1500) oziroma 1500 (višje), `romb67` stebri z L-kotniki 1450; `polna128` debelina 16 mm po katalogu (128 × 16 × 2200); `drill`/`fix` besedila usklajena (2/3 globine pri 57/32, obvezna alu cev pri ROMB, predvrtanje v kovinsko cev pri 100/128). Opombe risbe (`roksalUseNotes()`, `applySystem`) sledijo profilnim pravilom.
- Zlati posnetek `pokoncna-referencna` regeneriran (romb67 stebri 1500 → 1450 mm); ostali zlati posnetki nespremenjeni. `tests/reference-gallery.test.js` razširjen s **32 novimi preverjanji** kataloga (skupaj 69), `tests/roksal-module.test.js` dopolnjen z novimi katalogskimi mejami. Vseh 16 slik je v `sw.js` predpomnilniku. Skupaj **67 testnih surov**. CSP hash-i regenerirani.

### Dodano (uradni PDF »Navodila za montažo WPC terasnih desk« — uskladitev in dopolnila)

**Prebran celoten uradni Roksal PDF (9 strani, tekstovno in vizualno)**
- Potrjeno, da so ključni podatki iz PDF-ja že vgrajeni: dilatacijska matrika `DIL` (`js/dilatation.js` citira PDF in dokumentira tipkarsko napako −25 °C/1 m: 2,27 → 2,75), terasna veja `roksalUseNotes()`, kontrolni list in montažni načrt (razmiki letvi 30–35 cm, točkovno podlaganje alu do 60 cm, turbo vijaki 6,7×80 mm, reža 5–6 mm + dilatacija, odmik od sten 6 mm, odvodne luknje Ø4,2 mm, rez 30°, orodja).
- **Novo — opozorila iz PDF-ja**, prej manjkajoča: WoodCore deske **niso konstrukcijski element** (nosilci, tramovi, podporni stebri — neupoštevanje lahko izniči garancijo; dodano v kontrolni list za vse uporabe), predvrtanje WPC podložnih letev (luknja manjša od vijaka + grezilo — visoka gostota, brez tega letev poči), opozorilo o zmrznjeni vodi v deski (poči), previdnost pri distančnikih in stiskanju desk, L letev v enem kosu ob enosmernem polaganju brez dolžinskih spojev.
- **Nova sekcija galerije »Terasne deske — navodila za montažo (WoodCore)«** s 4 karticami (priprava podlage, podložne letve, montaža desk in reže, zaključki in odvodnjavanje) in strukturnim opozorilom; EN pariteta (`ter_h`, `ter_w`, `ter_c1..4`).
- `tests/reference-gallery.test.js` dopolnjen s **8 preverjanji** terasnega kataloga (skupaj 77), `tests/roksal-p1.test.js` s 3 preverjanji novih opozoril v kontrolnem listu. Zlati posnetki nespremenjeni (kontrolni list ni vrisan vanje). Skupaj **67 testnih surov**. CSP hash-i regenerirani.

### Spremenjeno (uskladitev s spletno stranjo »WPC prečne deske za pregradne stene«)

**Prebrana uradna produktne stran roksal.com (tekstovno in vizualno, vključno s paletami in prerezi)**
- **Popravek mere: POLNA DESKA-128 je 128 × 16,5 × 2200 mm** (uradna stran + prvotni register) — prej začasno 16 mm po katalogskem zapisu. Register `WC`, kartica elementov in testi posodobljeni.
- **ROMB DESKA-67 pri pregradah**: maksimalni razmak 145 cm velja **samo**, kadar je L-kotnik na vsakem stebru **levo in desno**; vijačenje skrito (rf vijaki skozi kotnik v alu cev iz zadnje strani). Pri razmaku > 145 cm je potrebna **vmesna povezava — ni privijačena v tla, ampak iz zgornje cevi** — možna do < 180 cm; pri ≥ 180 cm dodaten stebriček. Zaključek s čepi ali letvico.
- **Prečno vijačenje POLNA-128 / DESKA-150**: vijak na sredini deske (DESKA-150 v sredino rebra), predvrtanje luknja +1 mm od vijaka, vijaki vidni iz lica; stebri 110 cm (128) oziroma 130 cm (150).
- **DESKA-150**: 150 × 25 × 4000 mm (tudi 2200), 7 barv in **3 površine** (rebra na eni strani bolj na gosto, na drugi na široko; Rustic enostransko gladke), zaključek z **zaključnim pokrovčkom**.
- Nova sekcija galerije **»Pregradne stene s prečnimi deskami (WoodCore)«** (3 kartice) z EN pariteto; kontrolni list veje `pregrada` dopolnjen (vmesna povezava, obojestranski kotniki, sredina deske). `tests/reference-gallery.test.js`: **82 PASS** (+5). Zlati posnetki nespremenjeni. CSP hash-i regenerirani.

## [2026.11.22] — 2026-11-24

### Dodano (lokalne izboljšave brez omrežja)

**Popravek mere `L` pri fotografijah, širših od 900 px**
- `applyDetection()` je `L` računala iz bboxa v naravnih pikslih z `mmPerPx` (mm/sivi px). Ker se slika pred detekcijo pomanjša na največ 900 px (`sc < 1`), je bila vrednost `1/sc` prevelika. Zdaj se v linearnem načinu uporabi `S.cal.scale` (mm/naravni px), v ravninskem pa razmerje `1/S.det.rectK`. `H`, `sw` in `gap` ostanejo v sivih pikslih — zato se njihova vrednost ni spremenila.

**Vektorski predlog nove ograje čez fotografijo**
- Nov gumb *Predlog ograje na sliki* v foto plošči preklopi lokalno SVG prekrivko (`#dw-proposal`): lamele se izrišejo iz `n`/`sw`/`gap` znotraj zaznanega okvira, stebri pa iz `roksalLimit()` glede na `L`. Barva je orientacijska iz WoodCore palete (`sysColor`), ne vir mer. Prekrivka je na voljo v 2-točkovni umeritvi; pri 4-točkovni (homografija) gumb pojasni, da podprta ni.
- Ni klica v oblak, nobenega novega `fetch`, nobene spremembe izvozov. Status izrecno pove: »mere iz risbe, ne iz slike«.

**Enotne statusne oznake in EN prevodi**
- `DW_STATUS` / `statusMark()` poenotita oznake ✓ izmerjeno · ∑ izračunano · ≈ ocenjeno · ?? neznano; legenda je dodana v foto ploščo. Novi gumb, legenda in dinamični statusi imajo EN prevode (preklop prek gumba, kot v preostalem UI-ju).
- Nov `tests/local-upgrade.test.js` (**21 preverjanj**) pokriva popravek enote, vsebino prekrivke, vire mer, prevode in offline jamstvo. Na neposredni predhodni kodi (`92a05a2`) pade z **14 FAIL**, preverjeno v začasni delovni kopiji. Skupaj **66 testnih surov** (prej 65). CSP hash-i regenerirani.

## [2026.11.21] — 2026-11-24

### Dodano (postopna modularizacija — korak 7)

**`js/registry.js` — registrska abstrakcija kot izvirna datoteka**
- `REGISTRY_SCHEMA`, `validateRegistry()`, `woodcoreRegistry()`, `REGISTRY`/`REGISTRY_ACTIVE` in helperji (`registryBrands`, `activeRegistry`, `setRegistryBrand`) so izvzeti v `js/registry.js`. Modul je brez DOM in omrežja; WoodCore vnos se sklicuje na vire `WC`, `DIL`, `PAL_KLASIK`, `PAL_RUSTIK`, `USE_NAMES` in `roksalLimit`, ki so v HTML-ju opredeljeni pred generiranim blokom. Vsi obstoječi izvozi ostanejo nedotaknjeni, stop-rule »samo WoodCore« pa ohranjen.
- `scripts/sync-modules.js` in `tests/module-sync.test.js` pokrivata zdaj šest modulov; `tests/module-sync.test.js` ima **58 preverjanj** (prej 49). Na neposredni predhodni kodi pade z **1 FAIL** (manjka le `js/registry.js`), preverjeno v začasni delovni kopiji.
- Nov `tests/registry-module.test.js` (**30 preverjanj**) — shema, vse veje validatorja, identiteta WoodCore virov, kontaktni podatki, helperji znamk in vrstni red odvisnosti. Na predhodni kodi pade z **5 FAIL**. Skupaj **65 testnih surov** (prej 64). CSP hash-i regenerirani.
- **Odziv na cubic review (P3):** prepovedani tokeni v preverjanjih čistosti razširjeni z `window`, `WebSocket`, `navigator` in `sendBeacon` (v `registry-module`, `roksal-module` in skupnem `module-sync` testu). V slednjem je izrecno dovoljen le obstoječi izvoz `window.DWCore=DWCore;` iz koraka 1.

## [2026.11.20] — 2026-11-24

### Dodano (postopna modularizacija — korak 6)

**`js/roksal.js` — uporabe in omejitve razmika kot izvirna datoteka**
- `USE_NAMES`, `roksalLimit()` in `roksalRailLimit()` so izvzeti v `js/roksal.js` (čisti podatki in funkcije, brez DOM ali stanja obrazca). `roksalUseNotes()` in `applySystem()` ostaneta v HTML-ju, ker uporabljata `V()`/`n()` oziroma DOM. Obstoječa izvoza `window.USE_NAMES` in `window.roksalLimit` ostaneta; dodan je testno dostopen `window.roksalRailLimit` po obstoječi konvenciji.
- `scripts/sync-modules.js` pokriva zdaj pet modulov (`core`, `geometry`, `dilatation`, `csv`, `roksal`); CI korak je preimenovan v `Inline modules must match committed js/*.js`. CSP hash-i regenerirani.
- `tests/module-sync.test.js` razširjen z 40 na **49 preverjanj** (urejen par oznak, vsebinsko ujemanje, odsotnost DOM odvisnosti in popravilo drift-a za vsak od petih modulov; globalna idempotenca; zavrnitev manjkajoče končne oznake na `core`). Na neposredni predhodni kodi pade z **1 FAIL** (manjka `js/roksal.js`); preverjeno v začasni delovni kopiji. Popravljen tudi komentar o obnašanju stare kode — ločuje neposredno predhodno različico od stanja pred celotno modularizacijo.
- Nov `tests/roksal-module.test.js` (**27 preverjanj**) — vseh 7 uporab, vse veje `roksalLimit()` (terasa, napušč, pregrada KUBO/druga, fasada s/padcem, prečna s/padcem, pokončna z min mejo, neznana uporaba), `roksalRailLimit()`, identiteta registra ter čistost vira. Na stari kodi pade z **8 FAIL**. Skupaj **64 testnih surov** (prej 63).

## [2026.11.19] — 2026-11-24

### Dodano (postopna modularizacija — korak 5)

**`js/csv.js` — skupno CSV omiljanje kot izvirna datoteka**
- `csvCell()` in `csvRow()` sta izvzeti v `js/csv.js` (čisti, brez DOM). Izvoz `window.csvCell` in vseh pet uporab v izvozih ostane nedotaknjenih.
- `scripts/sync-modules.js` pokriva zdaj štiri module (`core`, `geometry`, `dilatation`, `csv`).
- `tests/module-sync.test.js` razširjen z 32 na **40 preverjanj**: urejen par oznak, vsebinsko ujemanje, odsotnost DOM odvisnosti in popravilo drift-a **za vsak modul**; idempotenca se preverja **globalno**, zavrnitev manjkajoče končne oznake pa na modulu `core`. Na stari kodi pade s **5 FAIL** (manjkata generator in vsi štirje izvori — vsi checki se izvedejo pred izstopom, preverjeno v začasni kopiji). Skupaj ostane **63 testnih surov**. CSP hash-i regenerirani.

## [2026.11.18] — 2026-11-24

### Dodano (postopna modularizacija — korak 4)

**`js/dilatation.js` — dilatacijska tabela in interpolacija kot izvirna datoteka**
- Tabela `DIL` in funkcija `dilatacija()` sta izvzeti v `js/dilatation.js`. Obe sta čisti (brez DOM, brez stanja `S`), zato se je vzorec iz #57/#58 ponovil brez novih odvisnosti.
- `scripts/sync-modules.js` pokriva zdaj tri module (`core`, `geometry`, `dilatation`); `npm run modules:sync` in CI drift-check ostajata enotna.
- `tests/module-sync.test.js` razširjen z 24 na **32 preverjanj** (danes 40 po vključitvi `js/csv.js`) — urejen par oznak, vsebinsko ujemanje, odsotnost DOM odvisnosti in popravilo drift-a za **vsak** modul. Na stari kodi pade s **4 FAIL**. Skupaj ostane **63 testnih surov**. CSP hash-i regenerirani.
- Obstoječa izvoza `window.DIL` in `window.dilatacija` ter `dilatation-table` (15 preverjanj) ostajajo nedotaknjeni.

## [2026.11.17] — 2026-11-24

### Dodano (postopna modularizacija — korak 3)

**`js/geometry.js` — kalibracijska matematika kot izvirna datoteka**
- Čisti funkciji `solve()` (Gaussova eliminacija s pivotiranjem) in `homography()` sta izvzeti v `js/geometry.js`. `toMM()`/`mmDist()` ostaneta inline, ker sta odvisni od stanja `S.cal`. Obstoječa izvoza `window.solve` in `window.homography` ter ves E2E `homography-math` (13 preverjanj) ostanejo nedotaknjeni.
- `scripts/sync-modules.js` je posplošen na seznam modulov (`js/core.js`, `js/geometry.js`); vsak ima svoj urejen par oznak in neodvisno validacijo. `npm run modules:sync` in CI drift-check pokrivata oba.
- `tests/module-sync.test.js` razširjen z **24 preverjanji** (prej 15, danes 32 po vključitvi `js/dilatation.js`): za vsak modul posebej urejen par oznak, vsebinsko ujemanje, odsotnost DOM odvisnosti ter popravilo drift-a v začasni kopiji. Skupaj ostane **63 testnih surov**. CSP hash-i regenerirani.

## [2026.11.16] — 2026-11-24

### Dodano (postopna modularizacija — korak 2)

**`js/core.js` kot izvirna datoteka, generirana inline kopija**
- Čisti modul iz koraka 1 ima zdaj resnično izvorno datoteko `js/core.js`. Aplikacija ostane zero-install PWA z enim HTML-jem, zato se modul ne naloži prek `<script src>` (tudi jsdom testi brez `resources:"usable"` ga ne bi). Med oznaki `>>> GENERATED: js/core.js` / `<<< END GENERATED` se vstavi **vsebinsko enaka kopija** (generator doda le ločilni novi vrstici; primerjava ju odstrani).
- Nov `scripts/sync-modules.js` (`npm run modules:sync`) je idempotenten in popravi drift. CI ima nov korak `Inline module must match committed js/core.js`, zato se razlika med izvorom in kopijo ujame v PR-ju.
- **Test:** nov `tests/module-sync.test.js` (15 preverjanj ob uvedbi, **zdaj 24** po vključitvi `js/geometry.js`) — prisotnost izvora in generatorja, registriran npm script, natanko en **urejen** par oznak, vsebinsko ujemanje po odstranitvi ločilnih novih vrstic, odsotnost DOM odvisnosti, idempotenca, popravilo drift-a in **zavrnitev manjkajoče končne oznake** v začasni kopiji; **na stari kodi pade z 2 FAIL**. Skupaj **63 testnih surov**. CSP hash-i regenerirani.
- **Odziv na cubic review:** generator zdaj pred pisanjem preveri natančno en `start` in `end` marker v pravilnem vrstnem redu — prej je manjkajoča končna oznaka povzročila tihi no-op z napačnim sporočilom »already current«. Popravek je pokrit z novima preverjanjema.

## [2026.11.15] — 2026-11-24

### Dodano (postopna modularizacija — korak 1)

**Čisti modul `DWCore` brez spremembe vedenja**
- Šest čistih funkcij (`numParse`, `format`, `spanParts`, `spanCenters`, `dim`, `escapeHtml`) je zbranih v enem imenskem prostoru. Obstoječa globalna imena (`numParse`, `n`, `E`, `f`, `spanParts`, `spanCenters`, `dim`) ostanejo kot **tanke ovijalke**, zato se noben klic, testni izvoz ali izvoz risbe ne spremeni.
- **Zakaj še brez zunanje datoteke:** jsdom v obstoječih testih ne nalaga `<script src>` (manjka `resources:"usable"`). Fizična izdvojitev v `js/core.js` bi razbila vseh 62 surovov; modulski korak je zato najprej logičen, šele po morebitni posodobitvi testnega ogrodja fizičen.
- **Test:** nov `tests/core-module.test.js` (18 preverjanj) — obnašanje vseh šestih funkcij, odsotnost DOM/storage odvisnosti v telesu modula ter nazaj združljive ovijalke; **na stari kodi pade s 3 FAIL**. `window.DWCore` je izvožen za teste. Skupaj **62 testnih surov**. CSP hash-i regenerirani.

## [2026.11.14] — 2026-11-24

### Popravljeno (Issue #41 — ne-barvne napake in 44 px dotikova področja)

**Zadnji neposredni UI vrzeli iz `docs/review-2026-11-23.md` (P2 + P1) sta zaprti**
- **Ugotovitev P2:** neveljavna polja so bila označena izključno z rdečim robom (`border-color` + `box-shadow`), brez ikone, predpone ali `aria-invalid` — za barvno slepe in bralnike zaslona signal ni bil zanesljiv.
- **Popravek (samo UI):** `input.invalid,select.invalid` dobijo tematsko neodvisno SVG opozorilno ikono (`data:` URI, dovoljen z `img-src 'self' data:`), sporočila v `warnbox` dobijo vidno `⚠ ` predpono, `checks()` pa vsakemu polju, na katerega se opozorilo navezuje (`it.f`), doda `aria-invalid="true"` z sledljivim `data-dw-invalid` in ga ob popravku odstrani. Klik-za-popravek v traku napak ostaja nedotaknjen. Izvozi (SVG/PDF/CSV/STEP) se ne spremenijo.
- **Ugotovitev P1:** mobilni `@media(max-width:760px)` je gumbom dovoljeval le `min-height:38px`, ročaj predala in gumb traka napak pa sta bila še manjša.
- **Popravek:** najmanj **44 px** za `.btn`, `.mi`, `.show-aside-handle`, `.exp-cancel`, `.exp-go` ter `.err-tray .et-toggle` (slednji tudi `min-width:44px`, centrirana puščica).
- **Test:** nov `tests/ui-error-touch.test.js` (**24 preverjanj**) — jsdom dokaže ikono in `⚠` predpono, `aria-invalid` ob napaki in njegovo odstranitev po popravku, klikljiv err-tray, pravilno dimenzijo pri skupnem sporočilu L/H/D (L, H **in D**), izločitev svetovalnih opozoril (`subType`, `mountType`) ter 44 × 44 px pravila; **na stari kodi pade z 14 FAIL**. `window.checks` izvožen za determinističen test. Skupaj **61 testnih surov**. CSP hash-i regenerirani.
- **Odziv na cubic review (8 findingov v dveh krogih):** ikona velja tudi za `[data-dw-invalid]` (ne le `.invalid`); skupno sporočilo o pozitivnosti označi res neveljavno dimenzijo; 44 px dodan `.primarybar`, `.menu>button` in `min-width:44px` za ikonske gumbe; revalidacija ob vnosu/change je omejena na stanja z aktivnimi oznakami (prepreči upočasnitev stresnih testov); svetovalna opozorila (`subType`, `mountType`) ne označujejo veljavnega polja, `pesek` (nepripravljiva podlaga) pa ostane res neveljavno polje.

## [2026.11.13] — 2026-11-24

### Popravljeno (Issue #41 — EN UI parity: mešan jezik v novejših sklopih)

**Vmesnik v EN načinu zdaj dosledno angleški — meni, korita/segmenti, orodja in statusi**
- **Ugotovitev (docs/review-2026-11-23.md, P2):** SL/EN preklopnik je obstajal, a starejši prevodni slovar ni pokrival novejših sklopov. V EN načinu so ostajali slovenski: navigacijski meni (z bližnjicami), polja za korita in segmente, orodja tlorisa/skice, `title` atributi ter dinamična statusna sporočila.
- **Popravek (frontend, brez spremembe izvozov):** razširjen `LANG_EN`; `data-i18n` na navigacijskih gumbih; `applyLang()` zdaj ohrani `<i>`, `<span class="k">` in `<kbd>` ter prevaja tudi neposredne tekstovne vozle (label z inputom) in `title` atribute. Novi `UI_MSG` + `syncLive()` z `MutationObserver` na live regijah (`calStatus`, `detStatus`, `sysStatus`, `tlorisStatus`, `skStatus`, `globalStatus`, `toastZone`, `errTray`) prevede **dinamična** sporočila ob spremembi DOM in jih ob povratku v SL obnovi iz izvornega besedila. Prefiksi z ohranjeno številko (`Segmentov: 3` → `Segments: 3`) ostanejo nedotaknjeni.
- **Namerna izjema:** tehnična risba, BOM, CSV/PDF in STEP ostajajo slovenski (Roksal dokumentacija) — prevede se samo UI.
- **Test:** nov `tests/i18n-ui.test.js` (41 preverjanj): meni + bližnjica `9`, korita/segmenti, orodja in barve skice, `title`, statični in dinamični statusi/toast, povratek v SL ter SL risba. **Na stari kodi bi padlo (15 FAIL).**
- CSP hash-i ponovno izgenerirani. Skupaj **60 testnih surov** (prej 59).

## [2026.11.12] — 2026-11-24

### Dodano (Issue #41 — avtomatizacija SRI hash-ov po CRLF incidentu)

**`npm run sri:generate` — enovirni generator SHA-384 iz strežanih (LF) bajtov**
- **Ugotovitev:** SRI je bil v PR #49 ročno izračunan in je v CI skoraj ušel kritični napaki — lokalni Windows checkout vsebuje CRLF, git/brskalnik pa streže LF (`.gitattributes: * text=auto eol=lf`). Ročno računanje ostaja ponavljajoča se past ob vsaki zamenjavi vendor datoteke.
- **Popravek:** nov `scripts/generate-sri.js` (registriran kot `npm run sri:generate`) prebere vsakega od 3 vendor skriptov kot bajte, normalizira `CRLF → LF` in zapiše ravno pravilen `integrity="sha384-…"` v HTML. Je **idempotenten** (na že pravilni datoteki ne piše nič) in sprejme opcijsko pot do korena (uporabno za teste v začasni kopiji).
- **Test:** nov `tests/sri-generator.test.js` (15 preverjanj) — neodvisno izračuna pričakovane hashe, v začasni kopiji dokaže idempotenco, **popravilo poškodovanega hash-a** (ostanek HTML ostane bajtovno identičen) in **pravilnost na CRLF checkoutu**, pri čemer repozitorija ne spreminja. **Na stari kodi bi PADO (generator manjka).**
- **CI:** dodan korak, ki po generatorju zahteva `git diff --exit-code -- tehnicka-risba-pro.html` — morebiten drift med committed SRI in resničnimi vendor bajti zdaj pade v pull requestu, ne šele v brskalniku.
- Skupaj **59 testnih surov** (prej 58).

## [2026.11.11] — 2026-11-24

### Dodano (Issue #41 — dostopnost: fokus-trap v modalnih dialogih)

**Tab / Shift+Tab ostane v odprtem modalnem dialogu (WCAG 2.1.2 "No Keyboard Trap" + 4.7.2)**
- **Ugotovitev:** vsi 10 modalnih dialogov (`role=dialog`+`aria-modal=true`, znotraj `.exp-overlay`) so imeli `Escape` + obnovo fokusa, a **brez osnade za krmiljenje Tab** — s tipkovnico bi se fokus (Shift+Tab) lahko umaknil v ozadje, za modalnim oknom.
- **Popravek:** en **centraliziran focus-trap** (konca glavnega skripta) — ko je odprt vsaj en modal (overlay z `.on`, ki vsebuje `[role=dialog][aria-modal=true]`), Tab ob zadnjem fokusabilnem elementu povrže na prvi, Shift+Tab ob prvem na zadnji; brez odprtega modala je obnašanje privzeto. `#propPanel` (11. `role=dialog`) ni `aria-modal` → pravilno izven osaade.
- **Test:** `tests/focus-trap.test.js` (13 preverjanj) — izvoz `window.fwFocusTrap` (regresija: stare kodi bi PADO); `topOpenDialog()` cilja odprt dialog; na sintetičnem dialogu 3 gumbi: **TAB ob zadnjem → prvi**, **SHIFT+TAB ob prvem → zadnji**, ter da **sredinski in brez-modala trap NE premakne fokusa**. **Na stari kodi bi PADO.**
- CSP hash-i ponovno izgenerirani (`scripts/generate-csp.js`). Skupaj **58 testnih surov** (prej 57, po SRI #49).

## [2026.11.10] — 2026-11-24

### Dodano (Issue #41 — Subresource Integrity za runtime vendor skripte)

**SHA-384 `integrity` atribute za 3 vendored runtime skripte (supply-chain obramba)**
- **Ugotovitev:** trije runtime skripti (`vendor/jspdf.umd.min.js`, `vendor/svg2pdf.umd.min.js`, `vendor/qr-core.js`) so se naložili iz istega izvora brez integrity atribute. SRI (SHA-384) doda obrambo pred **tiho spremenjeno/kompromitirano vendor datoteko**: če se hash ne ujemá, brskalnik zavrne izvajanje skripta namesto da tiho zažene spremenjeno kodo. Ne spreminja CSP inline hash-i (skripti so `script-src 'self'`; integrity je ločen mehanizem) → `vercel.json` / `generate-csp.js` nista prizadeta.
- **Popravek:** vsak vendor `<script>` tag v `tehnicka-risba-pro.html` pridobi `integrity="sha384-…"` (3× 71-znak hash, preverjeno, da točno ujema datoteko na disku).
- **Testi:**
  - `tests/sri.test.js` (16 preverjanj) — **AVTORITATIVNI PIN**: recomputira SHA-384 iz resnične `vendor/*.js` datoteke in ugotovi točno ujemanje s HTML `integrity` atributom (katerakoli tiha sprememba vendor/ → FAIL); preveri SRI prisotnost na vseh 3, da je SHA-384 (ne slabšega), da noben vendor skript NI brez SRI, in da je natanko 3 pini. **Na stari kodi (brez integrity) bi PADO.**
  - `tests/dependency-audit.test.js` + `tests/pdf.test.js` — obstoječa `htmlSig` preverjanja za vendor skripte nadgrajena na SRI-obliko tag-a (prej so pričakovala `defer></script>` brez integrity).
- Skupaj **57 testnih surov** (prej 56).

## [2026.11.9] — 2026-11-24

### Dodano (Issue #41 §3.E — dostopnost: WCAG 4.1.2 "Name")

**Dostopno ime za vidna polja/gumba + zasilni `aria-live` kanal povratne informacije**
- **Ugotovitev (jsdom sweep):** vsak VIDEN interaktiven element mora imeti dostopno ime. Po popravku preverimo **276 elementov, 0 brez imena**. Skriti `.hooks` (display:none, aria-hidden) so JS bližnjice, ne vidna UI — izven dostopnega drevesa.
- **Popravki:**
  - `#calStatus` (kanal `st()`/`dt()` — »Umeritev uspešna«, opozorila detekcije, potrjevanja) pridobi `role="status"` + `aria-live="polite"` — zasilni bralnik zdaj sliši glavne sporočila (uskladitvo s `#globalStatus`/`#errTray`/`#toastZone`, ki so že bili live).
  - 5 polj brez imena pridobi `aria-label`: `#file` (Naloži fotografijo ograje), `#rho` (Gostota materiala kg/m³), `#prjName` (Ime projekta), `#refMode` (Referenčni način lista), `#loadFile` (Odpri projekt JSON/foto).
  - `#applySuggestedProf` (JS gumb) pridobi `title` (servi kot privzeti dostopni imenovalnik; NE prevlada dinamičnega `textContent`).
- `tests/accessibility.test.js` (11 preverjanj): vsak poseben popavek + **celoten sweep vseh vidnih interaktivnih elementov** (brez imena → FAIL) + regresija, da `st()` še vedno piše v `#calStatus`. **Na stari kodi bi PADO (8 FAIL).**
- CSP hash-i ponovno izgenerirani (`scripts/generate-csp.js`). Skupaj **56 testnih surov** (prej 55).

## [2026.11.8] — 2026-11-24

### Popravljeno (Issue #41 §3.B — detekcija fotografij: orientacija ≠ potrjena mera)

**Detekcija zdaj označi stare proizvodne izračune kot zastarele (».stale«)**
- **Ugotovitev (reprodukcija):** `applyDetection()` samodejno polja polja `n`/`H`/`sw`/`gap`/`L` prek programatskega `.value=` (ORIENTACIJSKA mera). Ker programatski vnos **ne sproži** `document input/change` poslušalca (ki sicer klice `invalidateProduction();markStale()`), so stare proizvodni izhodi (`#cutOut`/`#planOut`/`#quoteOut`/`#checklistOut`) po detekciji ostali **neoznačeni** — uporabnik bi videl stare rezi/kosovnico, ki odgovarjajo starih meram, kot da bi bila še veljavna. §3.B izrecno zahteva: »orientacijskih meritev ne predstavljaj kot potrjenih proizvodnih mer.«
- **Popravek:** `applyDetection()` ročno klice `markStale()` — enakovredno ročnemu vnosu. Vsi štirje proizvodni izhodi zdaj dobijo razred `.stale` takoj po detekciji.
- `tests/photo-stale-guard.test.js` (8 preverjanj): pred detekcijo izhodi sveži → po detekciji **vsi 4 `.stale`** + vsebina ohranjena + `clearStale()` sanity + statično da `applyDetection()` vsebuje `markStale()`. **Na stari kodi bi PADO (2 FAIL).**
- CSP hash-i ponovno izgenerirani (`scripts/generate-csp.js`). Skupaj **55 testnih surov** (prej 54).

## [2026.11.7] — 2026-11-23

### Popravljeno (Issue #41 §3.A — geometrija/matematika: decimalna vejica)

**Lokalizacijsko varna številksa razlaga mer in kalibracijskih referenc**
- Pred: številksa polja (`L`, `H`, `D`, `gap`, `sw`, `st`, …) in kalibracijski referenci (`refA`/`refB`) so bile razlagovali s `parseFloat` — v slovenski lokalizaciji je decimalni ločilec **vejica**, zato je vnos `3,8` tiho okrnjen v `3`, `3800,5` v `3800` → **napačno merilo = napačna risba, BOM, reznica in predračun** (tiha napaka brez opozorila).
- Popravek: nov `numParse()` — `n()` in `refA`/`refB` zdaj sprejmejo:
  - decimalno vejico `3,8` → 3.8, `3800,5` → 3800.5;
  - tisoči-piko + decimalno vejico `3.000,5` → 3000.5, `1.500` → 1500;
  - ASCII piko `3.8` → 3.8 (brez regresije), cela `42` → 42;
  - smeti/prazno → `NaN`, klicatelj `n()` dobi privzeto `0` (isFinite varno, brez tihega `+∞`).
- `tests/decimal-comma.test.js` (26 preverjanj): semantika `numParse` (vejica/tisoči/pika/cela/NaN/prazno/prostori) + behavioral `n()` prek prostega besedilnega polja `#stockLen` (jsdom razčisti number-inpute, zato se dejanska vejica dokazuje prek text-inputa) + ASCII pika/cela/NaN/Infinity prek `#L` + statični dokaz, da so `n()`/`refA`/`refB` posameznjena prek `numParse` in da ni ostanka raw `parseFloat(V("refA|refB"))`. Na stari kodi bi PADO.
- CSP hash-i ponovno izgenerirani (`scripts/generate-csp.js`) — inline koda se je spremenila. Skupaj **54 testnih surov** (prej 53).

## [2026.11.6] — 2026-11-23

### Popravljen (Issue #41 §2 — odvisnosti: higiena)

**Odstranitev mrtve pisave + avdit odvisnosti, zaklenjen s testom**
- **Izbris `vendor/Roboto-Regular.ttf`** — 14-bajtni placeholder `404: Not Found`, referenca **nič** (ni v SW predpomnilniku, HTML, nobenem testu, ne v dokumentaciji). Čista mrtva teža.
- **Upravičenost vseh 7 devDependencies** (`dependencies` ostane prazen — zero-install PWA, brez runtime omrežnih odvisnosti):
  - dejansko `require`-vane v testih: `@napi-rs/canvas` (canvas sinteza/foto fixtures), `dxf-parser` (neodvisna DXF validacija), `jsdom` (vsi surovi), `maxrects-packer` (A/B optimizerja rezov);
  - verzionični **pin** za brskalnisko naložene **vendor UMD pakete** (test eval-uje bralno `vendor/*.js` datoteko, ne Node paket): `jspdf`↔`vendor/jspdf.umd.min.js`, `svg2pdf.js`↔`vendor/svg2pdf.umd.min.js`, `qrcode-generator`↔`vendor/qr-core.js`.
- `tests/dependency-audit.test.js` (17 preverjanj) ujemeta: `dependencies` prazen, nobena devDependency ni neuporabljena, nobena mrtva pisava, prava pisava (LiberationSans) prisotna in SW-referenca, aplikacija se naloži brez JS napak.
- `npm ci` čisto (62 paketov, 0 ranljivosti). Skupaj **53 testnih surov** (prej 52).

## [2026.11.5] — 2026-11-23

### Dodano (Issue #41 §3.C — CAD/izvozi, neodvisna validacija)

**Neodvisna SVG validacija + skladnost mer + izrazna CAD-jedro meja**
- `tests/exports-cad-boundary.test.js` (18 preverjanj) pokrije pomanjkanje, ki ga DXF/PDF/STEP testi niso pokrivali:
  - **SVG neodvisno**: well-formed XML (neodvisen parse brez `parsererror`), pravilen SVG namespace + `viewBox` A3 (`0 0 420 297`), **vse koordinate finite**, geometrija v mejah lista (± tolerantno za kote), brez ničelnih/negativnih.
  - **Skladnost izvoženih mer s prikazanimi**: vnesti `L=3800` (prečna) → ista dolžina nastane kot koten v SVG **in** kot rezalna dolžina lamele `3800 mm` v CSV kosovnici (`cutLen()=L`); profil ROMB-67 se ujema med SVG BOM in CSV.
  - **CAD-jedro MEJA (zaklenjena)**: STEP `FILE_DESCRIPTION` izrecno prizna *"simplified box-solid approximation (not production CAD)"* + brez nedoločenih `#N` referenc — test dokaza, da aplikacija ne tvrdi proizvodne primernosti, kje pa je meja.
- Posodobljen `docs/validacija-izvozov.md` (SVG matrika + razdelek »CAD jedro — izrazna meja«).
- Skupaj **52 testnih surov** (prej 51). Brez spremembe aplikacijske kode — test le **dokazuje** obstoječe obnašanje.

## [2026.11.4] — 2026-11-23

### Dodano (Issue #41 §3.D — varnost/podatki)

**Dokaz, da aplikacija ne pošilja fotografij ali podatkov na zunanje strežnike** (egress audit)
- `tests/egress-privacy.test.js` (11 preverjanj) zaklene dejstvo, da aplikacija:
  - ima **ravno 1 `fetch`** — lokalni `vendor/LiberationSans-Regular.ttf` (same-origin, predpomnjen v SW);
  - **nima** `XMLHttpRequest`/`WebSocket`/`sendBeacon`/`EventSource`;
  - **nima senzorskih virov** (`getUserMedia`/kamera, `geolocation`, mikrofon, baterija, BLE, USB, serial);
  - **skupni povezavi** (`prjSnapshot()` in `prjViewPayload()`) **ne vsebujeta fotografije** (explicit `photo=null` oziroma beli seznam brez `photo`);
  - **nima zunanjih `<a href>`/`<img src>`** (poleg SVG imenskih prostorov);
  - **SW prestreža samo isti izvor** (`url.origin !== self.location.origin → return`);
  - **CSP `connect-src 'self'`** blokira katerikoli runtime egress.
- Skupaj **51 testnih surov** (prej 50). Brez spremembe aplikacijske kode — test le **dokazuje** obstoječe obnašanje in ujam morebitno egress regresijo.

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
