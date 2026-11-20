# Draftwright — Tehnična risba PRO

**Fotografija → umeritev → parametri → končni tehnični list.** Samostojna spletna aplikacija (ena HTML datoteka, brez odvisnosti, brez strežniške logike) za pripravo tehničnih risb in montažne dokumentacije za ograje, fasade in terase iz sistema **WoodCore (Roksal)** WPC profilov.

🔗 Živa demo: [draftwright-demo.vercel.app](https://draftwright-demo.vercel.app)

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
- naslovni blok: projekt, merilo, format, revizija, datum, risba št., izdelal
- trije tipi lista: klasični, referenčni (WoodCore cona + mere), stopniščni

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
- vodeni / strokovni način, izbira vidnih sklopov in polj
- bližnjice: **Ctrl+G** generiraj · **Ctrl+S** shrani · **Ctrl+E** možnosti izvoza · **Alt+P** izbira plošče · **Ctrl+V** prilepi sliko · **+/−** povečava
- dostopnost: `aria-live` status, `label for=` na 77 poljih
- **interaktivni tloris** (sklop 8): risanje trase po mreži (1 px = 10 mm), dolžine/nosilci po segmentih (Roksal limiti), Undo/Redo (Ctrl+Z/Y), »Uporabi v izračun« → L; trasa v projektu (shema v2) in autosave
- samodejno shranjevanje stanja + kalibracije (localStorage; fotografija izrazito NE — kvota)

## Samoprevera

Meni **Datoteka → Samoprevera (90 kombinacij)** generira 6 profilov × 5 uporab × 3 različice mer in preveri, da nastane veljaven SVG brez JS napak.

Za avtomatske teste je v repozitoriju še [tests/](tests/) (jsdom): `smoke.test.js` (generiranje listov, validacije, izvozi), `export-dialog.test.js` (izvozni dialog — vsi formati, napredne nastavitve in robni primeri), `roksal-p1.test.js` (dilatacije, napušč, pregrade, palete barv, podlage) in `roksal-p2.test.js` (tehnični list, povpraševanje, prodajni pogoji), `issue2-phase1.test.js` (stale-state, orientacija reza), `vision.test.js` (realno pikselno zaznavanje, @napi-rs/canvas), `issue2-phase2.test.js` (DXF sloji, STEP topologija) in `issue2-phase3.test.js` (stale-state, orientacija reza, enote) in `vision.test.js` + `issue2-phase2.test.js` (realno pikselno zaznavanje, DXF sloji/kodiranje, STEP topologija). Požene jih CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)):

```bash
npm install
npm test
```

## Struktura repozitorija

```
index.html               preusmeritev na aplikacijo
tehnicka-risba-pro.html  glavna aplikacija (vse v eni datoteki, vključno z izvoznim dialogom)
samples/                 vzorčni izvozi (SVG/PDF/DXF/STEP) in testni posnetki
tests/                   jsdom testi (smoke + izvozni dialog)
```

## Zagon

Aplikacija je statična — odprete `index.html` (ali direktno `tehnicka-risba-pro.html`) v brskalniku, ali objavite mapo kot statično stran (npr. Vercel, Netlify, GitHub Pages). **Brez build koraka.**

## Znane omejitve

- STEP model vsebuje posamezna telesa, ki se geometrijsko prekrivajo (brez bool operacij) — primeren kot parametrični pregled, ne za 3D tisk / CNC.
- DXF deluje v koordinatnem prostoru lista (420×297 enot, razporeditev kot A3); pri drugih formatih se vsebina za tisk le proporcionalno pomanjša.
- Samodejno zaznavanje lamel je orientacijsko — rezultat vedno preverite ročno.
- Predračun je orientacijski in **ni ponudba**; risba **ni statični izračun** — nosilnost in sidranje preveri strokovnjak.

## Licenca

MIT — glej [LICENSE](LICENSE).
