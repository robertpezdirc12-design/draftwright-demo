# SOLIDWORKS.com — analiza in preslikava na Draftwright

**Datum:** 2026-11-22
**Vrsta:** raziskovalni dokument (benchmark) — koda ni bila spremenjena.
**Status:** končan (z navedenimi omejitvami preverjanja).

---

## 1. Povzetek

SolidWorks (Dassault Systèmes) je industrijski standard parametričnega 3D CAD-a: več kot 8 milijonov uporabnikov in 1 milijon certificiranih. Njegova spletna stran ni le »škatla z izdelkom«, ampak dovršen trženjski, prodajni in izobraževalni sistem. Za Draftwright je največja vrednost v vzorcih **zaupanja, izobraževanja in prodajnega lijaka** — ne pa v desktopovi kompleksnosti UX-a.

---

## 2. Metodologija in omejitve preverjanja

- solidworks.com je težko JS-brez (Drupal + WAF): neposredni WebFetch je časovno odpovedal na vseh URL-jih.
- Vsebine so bile pridobljene v živo (2026-11-22) prek bralnega posrednika r.jina.ai in/ali arhivov; del prek sekundarnih virov.
- **Preverjeno:** homepage, /solutions, /solution/education, /product/solidworks-design, /product/whats-new (+ design podstran), /product/solidworks-pdm, /product/students, /domain/design-engineering, /how-to-buy (+/solidworks-solutions), /trial, /support/home, /community, /community/3dexperience-world, /solidworks-certification-program, /solution/why-choose-solidworks, /product/all-products.
- **Nepreverjeno:** samostojna stran »Industries« (404; panoge živijo pod /solution/industries/*), kategorija »Services«, eksplicitna tržna besedila o ISO/ANSI standardih (se niso pojavila na prebranih straneh). Dinamične vsebine (cene, akcije) se lahko spremenijo.

---

## 3. Arhitektura in sporočanje spletne strani

| Element | Opis (preverjeno) | Preslikava na Draftwright |
|---|---|---|
| Hero + CTA | »Innovators around the world trust SOLIDWORKS® CAD and cloud product development solutions…« + gumba **Buy online** / **Request a demo** | Vedno jasna pot »preizkusi → kupi«; pri nas: brezplačna predloga + kontakt Roksal |
| Segmentacija občinstva | Rešitve po panogah (High-Tech, Life Sciences, Home & Lifestyle), tipu organizacije (Startups, Makers, Incubators) in vlogi (Educators, Researchers) | Segmentiraj: montažne ekipe / prodajalci / končne stranke / šole |
| Vrednostna sporočila | »Industry-Standard Product Development«, »Collaborate on a Single Source of Truth«, »Built by engineers, for engineers«, »Scalability at Your Pace« | »Orodje, ki ga je zgradil inženir za montažne ekipe — risba v enem kliku iz fotografije« |
| Video-first | Vsaka zmogljivost ima YouTube vdel; interaktivni 3D model na strani »What's New 2027« | Kratke 30–60 s video vadnice po korakih (slika → risba → izvoz) |
| Zaupanje | »8M users«, »1M certified«, metrike strank (»ABCO skrajšal projektne cikle za 35 % s PDM«) | Objavi metrike: »3.5× hitreje do ponudbe«, »0 napak pri meritvah z umeritvijo« |
| Prodajni lijak | /trial → **spletni trial brez namestitve** (my.solidworks.com/try-solidworks) ob registraciji 3DEXPERIENCE ID | **Draftwright ŽE je brskalnik trial** — to je ključni diferenciator za sporočanje |

---

## 4. Produktne zmogljivosti — preslikava na Draftwright

| SolidWorks koncept | Kako ga oglašujejo | Stanje v Draftwright | Predlog nadgradnje |
|---|---|---|
| Parametrično modeliranje | »Powerful and proven 3D CAD modeling capabilities« | ✅ parametrična polja (L/H/D/profil/lamele) | Zgodovina operacij + »recept« (JSON) |
| Risbe/dokumentacija | »Production-ready documentation, fast, associative« | ✅ risba + 5 pogledov + BOM | Izpostaviti asociativnost (že deluje) |
| Kosovnica (BOM) | Poudarjena v »Drawings and BOM« | ✅ BOM + CSV + naročilnik | Številke postavk + baloni z vodilnimi črtami |
| Konfiguracije | »Variability definitions«; dizajn tabele (Excel) poganjajo parametre | ⚠️ 6 profilov (»konfiguracije«) brez tabele | Menadžer konfiguracij + dizajn tabela (CSV) |
| Checki | »Design and Manufacturability Checks«, »CAD Standards and Drawings Checking« | ✅ checks() validacije | Trak napak (error tray) + klik-za-popravek |
| PDM / revizije | Check-in/out, zaklepanje, verzije, avtomatizirana PDF konverzija | ⚠️ projekt JSON + localStorage | PDM-lite: posnetki projektov + revizije + uvoz/izvoz |
| Oblak / sodelovanje | »Real-time collaboration, single source of truth« | ⚠️ deljenje prek URL | Skupna raba / komentarji na risbi |
| Standardizacija | CAD standards (ISO/ANSI) | ⚠️ formati A3/A4/A2 | Stikalo dimenzijskega standarda ISO/ANSI |
| Materiali / masa | Mass properties | ✅ masa lamel | Celotna masa projekta (kg/m²) + povzetek v BOM |

**Ključno spoznanje:** SolidWorks oglašuje »professional drawings are fast, associative, and production-ready« — to je točno jedro Draftwright-a. Njihov največji diferenciator (asociativne risbe) je pri nas že vgrajen; treba ga je le izpostaviti.

---

## 5. UX/UI vzorci, vredni prevzema

1. **PropertyManager → kontekstualni panel** — namesto modalnih dialogov; ob izbiri objekta (risba, dimenzija, profil, BOM vrstica) panel na desni z živim predogledom (Apply/Cancel).
2. **Heads-up mini orodne vrstice** — plavajoča majhna vrstica ob izbiri elementa (namesto CommandManager traku z na stotine ukazi).
3. **Kontekstualni zgornji trak** — način-odvisna vrstica (8–15 orodij): Kalibracija | Zaznavanje | Parametri | List | Izvoz.
4. **Dvojni klik na dimenzijo = vnos** — inline urejanje številke s `+`/`−` (velja tudi za skico).
5. **Napredek pri dolgih operacijah** — asinhrono, preklicljivo, s progress bar (zaznavanje, render, PDF izvoz).
6. **Error tray namesto error modalov** — lista napak ob dnu lista; klik popravi; list ostane viden.

---

## 6. Trženje, cene in ekosistem

- **Cenovna preglednost** (redkost): Standard $2.820/leto, Professional $3.456, Premium $4.716; študenti brezplačno; Startups »free access«; Makers posebne ponudbe; 15-dnevna denarna garancija.
- **Izobraževanje = rastna strategija:** certifikati CSWA/CSWP/CSWE (30+ izpitov, digitalne značke Credly), 600+ vadnic, akademski program, letni 3DEXPERIENCE World (250+ sej, brezplačni izpiti).
- **Skupnost kot zadrževalni mehanizem:** forumi, SWUGN, Champions program, »What's new« zapiski.

**Preslikava na Draftwright:**
- Določiti jasno cenovno raven (npr. brezplačno osnovno; profesionalno s ponudbo/izvozom STEP).
- »Draftwright Certified Installer« — lahka certifikacija za montažne ekipe.
- Galerija konfiguracij (skupnost deli ograje/fasade) — analogija 3D ContentCentral.
- »Draftwright 2026/2027« — letno poimenovanje izdaj s »What's new« zapiski; pri PWA objaviti združljivost shranjenih projektov.
- Customer stories (kratke študije primerov: monter, veletrgovec, stranka).

---

## 7. Česa NE prevzemati

- Polnega parametričnega reševalca + drevesa funkcij (parent-child graf) — zadošča linearen pipeline z undo-stackom.
- CommandManager/ribbon razpršenosti — 8–15 kontekstualnih orodij je prednost.
- Datotečnih sej + eksplicitnega shranjevanja/odpiranja + PDM strežniške infrastrukture — autosave + posnetki zadoščajo.
- GD&T drobnoglednosti (polne tolerance, kompleksni simboli, večplastne črte) — podpreti običajno podmnožico.
- Simulacij/FEA/gibanja — drug produktni pol.
- Težke namestitve/licenciranja — ohraniti zero-install PWA.

---

## 8. Prioritiziran roadmap (povzetek)

**P1 — Temelji:**
1. Zgodovina operacij / undo-redo + »recept« (JSON)
2. Kontekstualni panel (PropertyManager)
3. Trak napak (klik-za-popravek)
4. Stikalo dimenzijskega standarda ISO/ANSI

**P2 — Profesionalna diferenciacija:**
5. Konfiguracije + dizajn tabela (CSV)
6. Usklajevanje pogledov risbe (poravnave, prerezi, prelomi, oznake)
7. BOM s številkami postavk + baloni/vodilne črte
8. Knjižnica predlog listov (ISO/ANSI okvirji, naslovni bloki)
9. Posnetki projektov (PDM-lite): checkpointi, obnovitev, »v delu«

**P3 — Ekosistem in globina:**
10. Dopolnjene masne lastnosti (kg/m², skupna masa)
11. Zaznavanje prekrivanj/trkov
12. Opozarjanje na zastarele vrednosti (»rebuild«)
13. Vadnice, začetna certifikacija, galerija skupnosti, »What's new« zapiski

---

## 9. Sklep

SolidWorks je najboljši učitelj za Draftwright na področju **zaupanja, izobraževanja in prodajnega lijaka**, ne pa na področju UX-a (kjer je desktop-kompleksen). Največje priložnosti: (1) izpostaviti **brskalniški trial brez namestitve** kot diferenciator, (2) uvesti **kontekstualni panel + trak napak** (P1), (3) uvesti **standardizacijo ISO/ANSI + BOM z baloni** (P2), (4) zgraditi **lahek izobraževalno-skupnostni ekosistem** (P3).
