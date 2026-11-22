# Poglavje 3 — »Konkurenčna lega in obseg niše: WPC specialist proti generalnemu Web CAD-u«

### Teza — kje stoji Draftwright

Draftwright (»Tehnična risba PRO«) ne tekmuje s splošnimi CAD orodji, ampak zaseda ozko niško presečišča treh področij: (1) fotografija→umeritev→tehnična risba, (2) parametrična logika WPC niše ([dilatacijske tabele](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf), 8 podlag, pravila [Roksal/WoodCore](https://roksal.com/)) in (3) večformatni izvoz (SVG/[DXF](https://github.com/mozman/ezdxf)/STEP) skupaj s celotno izvedbeno dokumentacijo (BOM, kerf optimizator, naročilnik). V tem presečišču ni neposrednega ponudnika: generalni CAD ima močno 3D in nosilnost, a ni nišno specializiran; nišni kalkulatorji ([WPC/deck](https://www.trex.com/build-your-deck/planyourdeck/deck-cost-landing/productcalculator/), ograjni) pa običajno ustavijo pri merah in količinah, brez celotne risbe in izvoza.

### Dokazi — konkurenčno polje (3 kategorije)

**(a) Namizni CAD** za ograje/oblotne konstrukcije: AutoCAD, SolidWorks, SketchUp (z dodatki), Revit — industrijski standard za nosilnost in obliko. Močno: zrel standard, statični izračun, nosilnost, velikostne knjižnice. Šibko: drago, ne-specializirano za WPC nišo in brez vgrajene dilatacijske logike ([Roksal/WoodCore tabela](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf)), brez parametričnih pravil za podlage in sidranja, nujno ročno risanje brez vhodnega kanala fotografija→risba. V tem razredu ni orodja, ki bi razumevalo nišno parametrikso WPC profilov.

**(b) Generalni Web-CAD / generativni orodja**: [OpenJSCAD](https://github.com/jscad/OpenJSCAD.org) (odprtokodni 3D JavaScript), [OpenCascade.js](https://github.com/donalffons/opencascade.js) (odprtokodni BREP/STEP kernel v JS), [OnShape](https://www.onshape.com/en/platform) (cloud CAD s parametričnim modeliranjem v brskalniku), CadQuery (Python, programsko CAD). Močno: pravi 3D, generativna/oblikovna moč, STEP izvoz. Šibko: ni dimenzijske logike ograjne niše, ni dilatacijskih/podlagovnih pravil, brez vhodnega kanala s fotografije — vsak projekt zahteva ponovno ročno izmeritev. Je splošen orodni komplet, ne specializiran delovni tok.

**(c) Vendor orodja WPC/les + nišni ograjni/deck kalkulatorji**. Tu je neposrednejša konkurenca; loči dva podrazreda. Prvi: lastni kalkulatorji znamk — npr. [Trex deck-cost/quantity kalkulator](https://www.trex.com/build-your-deck/planyourdeck/deck-cost-landing/productcalculator/) in [The Chippy Calc](https://thechippycalc.com/) (14 konstrukcijskih kalkulatorjev, med njimi balustrade spacing + decking quantities) — ponujajo le mere, količine in oceno stroškov, brez celotne tehnične risbe in izvoza v CAD formate. Drugi, bolj neposredni: konfiguratorji, ki ustvarjajo risbe in BOM — [EZRails Balustrade Planner](https://www.balustrade.co.za/) (dispozicija + cenjen delovni seznam + 3D pogled) in [Liveconfigurator](https://liveconfigurator.co.uk/) (ogrodja/stopnice/deck; »quote pack« z delovnim seznamom, CAD risbami in 3D renderjem). Tudi ti so vezani na lastno znamko/material, ne obravnavajo WPC profilov sproti in ne vsebujejo dilatacijskih/pravilnih logik. Med javno dostopnimi ponudniki ni **znane neposredne ponudbe**, ki hkrati pokriva: fotografija→risba + dilatacije + 8 podlag + večformatni izvoz + izvedbena dokumentacija. *(Opozorilni zapis: trditev temelji na pregledu javno dostopnih ponudnikov, ne na izčrpni analizi trga.)*

### Analiza — prednosti in tveganja specializacije

**Prednosti:**

1. Unikatna kombinacija slika→risba v niši — noben od naštetih ponudnikov ne prevzame fotografije kot vhoda.
2. Nišna parametrika ([dilatacijski kalkulator](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf), 8 podlag po [Roksal](https://roksal.com/), pravila za sidranje/razmike) — razume materialno-fizične omejitve WPC, ki jih splošni CAD nima.
3. Enodatotečnost + offline (eno HTML datoteko, PWA z Service Worker) — nič oblačne odvisnosti, deluje brez strežnika.
4. Večformatni izvoz SVG/DXF/STEP skupaj s celotno izvedbeno dokumentacijo (BOM/CSV, kerf optimizator, montažni načrt, naročilnik) — »last-mile« dokumentacija, ki jo splošni orodja puščajo ročno.

**Tveganja specializacije:**

1. Zaprtost na eno znamko ([Roksal/WoodCore](https://roksal.com/)) — orodje je vezano na enega ponudnika profilov in njegovih pravil; zamenjava znamke zahteva ponovno vgradnjo parametrične logike.
2. Manjkajoča nosilnost/razmerja — risba ni statični izračun; nosilnost in sidranje preveri strokovnjak, zato orodje ne more nadomestiti inženirskega pregleda.
3. Odvisnost od formatov/ponudnikov — DXF/STEP imajo omejitve (npr. brez bool operacij, koordinatni prostor lista), zato so izvozi orientacijskega značaja za CNC/3D tisk.

Ta tri tveganja so naravna cena specializacije, ki jo moramo v roadmapu uravnotežiti z razširitvijo na več znamk/materialov.

### Povzetek

Draftwright zaseda čisto nišo, ki ni pokrita s katero koli od treh kategorij: splošni in Web-CAD imata obliko/nosilnost, a brez nišne parametrične logike in vhodnega kanala s fotografije; nišni ograjni/deck kalkulatorji pa ustavijo pri merah/količinah brez celotne risbe in izvoza. Edinstvena vrednostna lastnost je zlasti kombinacija slika→risba + nišna WPC parametrika + enodatotečnost/offline + večformatni izvoz z izvedbeno dokumentacijo. Cena specializacije so zaprtost na eno znamko, omejena nosilnost in odvisnost od formatov — to so tveganja, ki jih roadmap mora odpirati z razširitvijo materialov in globino izvoza.

### Ključni dokazi

- **Ni znane neposredne ponudbe** WPC-specializiranega orodja, ki bi pokrilo slika→risba + dilatacije + podlage + izvoz. *(trditev iz opazovanja javno dostopnega polja; ne izčrpna analiza)*
- [Trex deck-cost/quantity kalkulator](https://www.trex.com/build-your-deck/planyourdeck/deck-cost-landing/productcalculator/) — le ocena stroškov in količin, brez risbe/izvoza. *(dejstvo)*
- [The Chippy Calc](https://thechippycalc.com/) (14 kalkulatorjev) — balustrade spacing + decking quantities, vizualni diagrami, brez CAD izvoza. *(dejstvo)*
- [EZRails Balustrade Planner](https://www.balustrade.co.za/) — razpored + cenjen delovni seznam + 3D pogled (ni WPC-specializiran). *(dejstvo)*
- [Liveconfigurator](https://liveconfigurator.co.uk/) — »quote pack« z CAD risbami, delovnim seznamom in 3D modelom (ogrodje/deck, vezano na lastno znamko). *(dejstvo)*
- [OnShape](https://www.onshape.com/en/platform) — cloud CAD s parametričnim modeliranjem; splošen, brez ograjske niše in vhodnega kanala s slike. *(dejstvo)*

### Seznam virov

**Konkurenčni ponudniki**
- [Trex — deck cost/quantity kalkulator](https://www.trex.com/build-your-deck/planyourdeck/deck-cost-landing/productcalculator/)
- [The Chippy Calc](https://thechippycalc.com/)
- [EZRails Balustrade Planner](https://www.balustrade.co.za/)
- [Liveconfigurator](https://liveconfigurator.co.uk/)
- [OnShape — platform](https://www.onshape.com/en/platform)

**Odprtokodno / tehnično jedro**
- [ezdxf](https://github.com/mozman/ezdxf)
- [OpenJSCAD](https://github.com/jscad/OpenJSCAD.org)
- [OpenCascade.js](https://github.com/donalffons/opencascade.js)

**Nišni viri (WPC/Roksal)**
- [Roksal (WoodCore)](https://roksal.com/)
- [Roksal navodila WoodCore — dilatacijske tabele / montažna navodila (PDF)](https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf)
- [Grand View Research — global wood-plastic-composite market (izvorni dokument trga WPC)](https://www.grandviewresearch.com/press-release/global-wood-plastic-composite-market)

**Interni viri (Draftwright)**
- [README.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/README.md)
- [ANALIZA.md](https://github.com/robertpezdirc12-design/draftwright-demo/blob/main/ANALIZA.md)
- [Demo — draftwright-demo.vercel.app](https://draftwright-demo.vercel.app)
