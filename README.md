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
- uporabe: prečna ograja, pokončna ograja, fasada, terasa, stopniščna ograja
- samodejne validacije: razmak stebrov/nosilcev, vodoravne cevi, padec podlage ≥ 10 mm/m, temperatura montaže ≥ +5 °C, varjeni deli na stebrih, cone, vsota lamel in rež, debelina stene profila
- prednastavitve: ROMB vodoravno · POLNA pokončno · KUBO fasada
- izračun mase po materialu (aluminij, jeklo, WPC)

### 3. Generiranje risbe
- sprednji pogled, stranski pogled, tloris, izometrični pogled, prerezi in detajli pritrjevanja
- dimenzije s puščicami, baloni kosovnice, osi nosilcev z razmiki
- naslovni blok: projekt, merilo, format, revizija, datum, risba št., izdelal
- trije tipi lista: klasični, referenčni (WoodCore cona + mere), stopniščni

### 4. Izvozi
| Izvoz | Oblika |
|---|---|
| PDF / tisk | brskalni tisk, `@page` po izbranem formatu (A3/A4/A2) |
| SVG | vektorski list |
| DXF | R12 (LINE/TEXT), kvadratne krivulje vzorčene v polilinije — za CAD |
| STEP | AP214, parametrični solid model (BREP) |
| Kosovnica | CSV |
| Montažni načrt | CSV |
| Rezalni načrt | CSV — kerf optimizator (izkoristek, odpadek, neizrezljivi kosi) |
| Predračun | CSV — orientacijski, brez DDV |
| Naročilnik | TXT |
| Montažni checklist | TXT — sklopi A–E (dostava, montaža, geometrija, garancija, reklamacijska dokumentacija) |
| Projekt | JSON (shranjevanje / odpiranje celotnega stanja) |

### 5. Delovni načini
- vodeni / strokovni način, izbira vidnih sklopov in polj
- bližnjice: **Ctrl+G** generiraj · **Ctrl+S** shrani · **Alt+P** izbira plošče · **Ctrl+V** prilepi sliko · **+/−** povečava
- samodejno shranjevanje stanja (localStorage)

## Samoprevera

Meni **Datoteka → Samoprevera (90 kombinacij)** generira 6 profilov × 5 uporab × 3 različice mer in preveri, da nastane veljaven SVG brez JS napak.

Za avtomatski test je v repozitoriju še [tests/smoke.test.js](tests/smoke.test.js) (jsdom), ki ga poganja CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)):

```bash
npm install
npm test
```

## Struktura repozitorija

```
index.html               preusmeritev na aplikacijo
tehnicka-risba-pro.html  glavna aplikacija (vse v eni datoteki)
export-options-pro.html  prototip UI dialoga »Možnosti izvoza«
samples/                 vzorčni izvozi (SVG/PDF/DXF/STEP) in testni posnetki
tests/                   jsdom smoke test
```

## Zagon

Aplikacija je statična — odprete `index.html` (ali direktno `tehnicka-risba-pro.html`) v brskalniku, ali objavite mapo kot statično stran (npr. Vercel, Netlify, GitHub Pages). **Brez build koraka.**

## Znane omejitke

- STEP model vsebuje posamezna telesa, ki se geometrijsko prekrivajo (brez bool operacij) — primeren kot parametrični pregled, ne za 3D tisk / CNC.
- DXF deluje v koordinatnem prostoru lista (420×297 enot, razporeditev kot A3); pri drugih formatih se vsebina za tisk le proporcionalno pomanjša.
- Samodejno zaznavanje lamel je orientacijsko — rezultat vedno preverite ročno.
- Predračun je orientacijski in **ni ponudba**; risba **ni statični izračun** — nosilnost in sidranje preveri strokovnjak.

## Licenca

MIT — glej [LICENSE](LICENSE).
