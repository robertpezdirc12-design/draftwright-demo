// Draftwright — modul 08-roksal (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
/* ---------- Roksal WoodCore system logic — use-specific rules (v15: napušč, pregrade, palete, dilatacije) ---------- */
/* Barvne palete po profilu (lestvice roksal.com/woodcore-wpc-deske/barvni-odtenki):
   White je SAMO pri POLNA-100; KUBO in 57/32 delita paletо (Amazon/Oak/Rustic oak/Rustic walnut);
   POLNA-128: besedilo strani navaja 5 barv, lestvica prikazuje 6 — uporabljena lestvica, potrditi pri Roksalu. */
var PAL_KLASIK=["Amazon wood","Ash wood","Golden teak","Burma teak","Oak wood"];
var PAL_RUSTIK=["Rustic oak","Rustic walnut"];
var WC={
  romb67:{n:"ROMB-67",w:67,t:26,len:5800,max:145,fix:"skrito — L-kotnik in alu cev v sredini profila",
    allowed:["precna","pokoncna","fasada","pregrada"],post:{precna:1450,pokoncna:1500},rail:{pokoncna:1100},
    facade:{studMax:800,buildup:"71–75 mm"},drill:"3.9 vijak → Ø3.2 v alu, Ø4.2–4.5 v WPC",
    palette:PAL_KLASIK.concat(PAL_RUSTIK)},
  polna128:{n:"POLNA-128",w:128,t:16.5,len:2200,max:110,fix:"vidno spredaj — predvrtanje +1 mm",
    allowed:["precna","pokoncna","pregrada"],post:{precna:1100,pokoncna:1500},rail:{pokoncna:1000},
    drill:"predvrtanje Ø vijak +1 mm, vijak 30 mm od roba",
    palette:["Amazon wood","Ash wood","Burma teak","Oak wood"].concat(PAL_RUSTIK)},
  deska150:{n:"DESKA-150",w:150,t:25,len:4000,max:130,fix:"vidno spredaj — predvrtanje +1 mm",
    allowed:["precna","terasa","pregrada"],post:{precna:1300}, /* uradni max razpon 130 cm (roksal.com) */
    drill:"predvrtanje Ø vijak +1 mm, vijačenje v sredino rebra",
    palette:PAL_KLASIK.concat(PAL_RUSTIK)},
  polna57:{n:"POLNA-57/32",w:57,t:32,len:5800,max:150,fix:"skrito zadaj — RF vijaki skozi cev",
    allowed:["pokoncna","pregrada"],post:{pokoncna:1500},rail:{pokoncna:1000},
    drill:"skrito vijačenje, 57 ali 32 mm naleganje",
    palette:["Amazon wood","Oak wood"].concat(PAL_RUSTIK)},
  polna100:{n:"POLNA-100",w:100,t:12,len:5800,max:180,fix:"vidno spredaj — predvrtanje +1 mm",
    allowed:["pokoncna","fasada","pregrada","napusc"],post:{pokoncna:1500},rail:{pokoncna:800},
    facade:{studMax:500,buildup:"~60 mm"},drill:"predvrtanje Ø vijak +1 mm, vijak 30 mm od roba",
    palette:PAL_KLASIK.concat(["White"],PAL_RUSTIK)},
  kubo80:{n:"KUBO-80/42",w:80,t:42,len:5800,max:120,fix:"skrito — alu cev 20x60x2 mm v profilu",
    allowed:["fasada","pregrada"],facade:{studMax:1000,buildup:"82 ali 120 mm"},
    drill:"alu cev 20×60×2 mm, pritrditev zgoraj/spodaj do 2500 mm",
    palette:["Amazon wood","Oak wood"].concat(PAL_RUSTIK)}
};
/* Dilatacijska tabela WoodCore — uradni PDF »Navodila za montažo WPC terasnih desk«
   (zahodna/vzhodna Evropa): priporočen razmak (mm) glede na dolžino deske (1–5 m)
   in temperaturo ob montaži. Vrstica −25 °C/1 m je v PDF natisnjena kot 2,27;
   po vrstnem redu tabele je to tiskarska napaka za 2,75 — uporabljena 2,75. */
var DIL={
  temps:[-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35],
  vals:[[2.75,5.5,8.25,11,11],[2.5,5,7.5,10,10],[2.5,5,7.5,10,10],[2.25,4.5,6.75,9,9],
        [2,4,6,8,8],[1.75,3.5,5.25,7,7],[1.75,3.5,5.25,7,7],[1.5,3,4.5,6,6],
        [1.25,2.5,3.75,5,5],[1.25,2.5,3.75,5,5],[1,2,3,4,4],[1,1.5,2.25,3,3],[1,1.5,1.8,2,2]]
};
function dilatacija(lenM,tempC){
  var l=Math.max(1,Math.min(5,lenM)),t=Math.max(DIL.temps[0],Math.min(DIL.temps[DIL.temps.length-1],tempC));
  function poDolzini(vals){
    var i1=Math.floor(l),i2=Math.min(5,Math.ceil(l));
    if(i1===i2)return vals[i1-1];
    var fr=l-i1;return vals[i1-1]*(1-fr)+vals[i2-1]*fr;
  }
  var ti=0;
  while(ti<DIL.temps.length-1&&t>DIL.temps[ti+1])ti++;
  var a=poDolzini(DIL.vals[ti]);
  if(t<=DIL.temps[ti]||ti>=DIL.temps.length-1)return a;
  var b=poDolzini(DIL.vals[ti+1]),fr=(t-DIL.temps[ti])/(DIL.temps[ti+1]-DIL.temps[ti]);
  return a*(1-fr)+b*fr;
}
var USE_NAMES={precna:"prečna ograja",pokoncna:"pokončna ograja",fasada:"fasada",terasa:"terasa",pregrada:"pregradna stena",napusc:"napušč",stopniscna:"stopniščna ograja"};
function roksalLimit(p,use,H){
  if(!p)return {v:1500,label:"razmak nosilcev"};
  if(use==="terasa")return {v:350,label:"razmak podložnih letev"};
  if(use==="napusc")return {v:800,label:"razmak podkonstrukcije (macesen 4×7 cm)"};
  if(use==="pregrada"){
    if(p.n.indexOf("KUBO")>=0)return {v:2600,label:"razpon (z alu cevjo 20×60×2)"};
    return {v:2000,label:"razmak stebrov (pokončno)"};
  }
  if(use==="fasada")return {v:(p.facade&&p.facade.studMax)||p.max*10,label:"razmak podkonstrukcije"};
  if(use==="precna")return {v:(p.post&&p.post.precna)||p.max*10,label:"razmak med stebri"};
  if(use==="pokoncna"){
    var pv=(H<=1500?1800:1500);
    if(p.post&&p.post.pokoncna)pv=Math.min(pv,p.post.pokoncna);
    return {v:pv,label:"razmak med stebri"};
  }
  return {v:1500,label:"razmak nosilcev"};
}
function roksalRailLimit(p){return (p&&p.rail&&p.rail.pokoncna)||1000}
function roksalUseNotes(p,use,H){
  var lim=roksalLimit(p,use,H),rail=roksalRailLimit(p),rows=Math.max(2,Math.ceil(H/rail)+1);
  if(use==="precna"){
    var s=p.n+": "+lim.label+" ≤ "+lim.v+" mm; predvrtanje +1 mm, vijak 30 mm od roba reza.";
    if(p.n.indexOf("ROMB")>=0)s+=" Pri >1450 mm dodaj vmesno povezavo do <1800 mm, nad tem nov steber.";
    return s;
  }
  if(use==="pokoncna"){
    var t=p.n+": stebri ≤ "+lim.v+" mm; vodoravne cevi "+rows+"×, razmak ≤ "+rail+" mm.";
    t+=(V("mountType")==="bočno na ploščo")?" Vijak ≤100 mm od roba reza; na ploščo ≤150 mm.":" Vijak 30–150 mm od roba reza.";
    if(p.n.indexOf("ROMB")>=0)t+=" Romb: čepi na koncih, alu cev v profilu.";
    return t;
  }
  if(use==="fasada"){
    var ff=p.facade||{studMax:p.max*10,buildup:"—"};
    var t2=p.n+": podkonstrukcija ≤ "+ff.studMax+" mm; skupna debelina na izolaciji "+ff.buildup+"; okoli odprtin alu pločevina 2 mm.";
    if(p.n.indexOf("KUBO")>=0)t2+=" KUBO samo do 2500 mm z alu cevjo 20×60×2 mm, pritrditev zgoraj/spodaj.";
    return t2;
  }
  if(use==="terasa")return "Terasa: podložne letve 30–35 cm (center 33–35; PDF navodila 33–38), padec ≥ 10 mm/m, reža 5–6 mm + dilatacija po tabeli, odmik od vseh sten ≥ 6 mm; točkovno podlaganje samo z alu cevmi max 60 cm; turbo vijaki za beton 6,7×80 mm; drenažne luknje Ø4,2 mm 5 cm od roba v vsak prekat; rez spodnje stene 30° (uradni PDF) / 5° (FAQ pri pravokotnem polaganju).";
  if(use==="napusc")return "Napušč: macesnove letve 4×7 cm v razmaku 70–80 cm (vertikalna postavitev → horizontalne letve 2×7 cm ≤ 50 cm); vidni RF svetleči vijaki, vijačenje v opeko; izolacija v ravnini fasade stanjšana ≥ 6 cm; okna/vrata: črna pločevina 2 mm.";
  if(use==="pregrada"){
    var t3=p.n+": prečno stebri ≤ 1450 mm (odvisno od profila), pokončno ≤ 2000 mm.";
    if(p.n.indexOf("KUBO")>=0)t3+=" KUBO: brez vmesnih nosilcev zgoraj in spodaj z alu cevjo 20×60 mm, samo do višine 2500 mm; razpon ≤ 1200 mm brez cevi, ≤ 2600 mm z alu 20×60×2 mm, nad tem močnejša (alu/inox) cev; na prostem obvezno eloksirana.";
    else if(p.n.indexOf("ROMB")>=0)t3+=" Romb: kotnik na vsakem nosilcu; odprtine zakriti (vdor vode do alu cevi); čepi ne garantirajo pred vdorom vode.";
    return t3;
  }
  if(use==="stopniscna")return "Stopniščna ograja: ročica vzporedno stopnicam, nosilci na vsakih "+f(n("stGoing"))+" mm, sidranje v nosilno podlago.";
  return p.n+": "+p.fix+".";
}
var notesTouched=false;
function applySystem(){
  invalidateProduction();
  var p=WC[$("sysProfile").value]||WC.romb67,use=V("sysUse"),color=V("sysColor"),surf=V("sysSurface"),H=n("H");
  /* barvna paleta po profilu (lestvice roksal.com) + uskladitev površine Klasik/Rustik */
  var pal=p.palette||PAL_KLASIK.concat(["White"],PAL_RUSTIK);
  var selC=$("sysColor"),had=pal.indexOf(color)>=0;
  selC.innerHTML=pal.map(function(c){return "<option>"+c+"</option>"}).join("");
  if(!had)color=pal[0];
  selC.value=color;
  $("sysSurface").value=(color.indexOf("Rustic")===0)?"Rustik":"Klasik";
  $("sw").value=p.w;$("st").value=p.t;
  var lim=roksalLimit(p,use,H),need=Math.max(2,Math.ceil(n("L")/Math.max(1,lim.v))+1);
  $("np").value=need;
  var span=n("L")/(need-1),bad=span>lim.v+0.5,wrongUse=use!=="stopniscna"&&(p.allowed||[]).indexOf(use)<0;
  var msg="Profil "+p.n+": "+f(p.w)+"×"+f(p.t)+"×"+p.len+" mm, "+p.fix+". "+lim.label+" ≤ "+lim.v+" mm. ";
  msg+=bad?("RAZMAK "+Math.round(span)+" mm PRESEGA največ "+lim.v+" mm!"):(lim.label.charAt(0).toUpperCase()+lim.label.slice(1)+" "+Math.round(span)+" mm ≤ "+lim.v+" mm.");
  if(wrongUse)msg+=" POZOR: profil ni predviden za "+(USE_NAMES[use]||use)+".";
  if(use==="pokoncna"){
    var rail=roksalRailLimit(p),rows=Math.max(2,Math.ceil(H/rail)+1);
    msg+=" Vodoravne cevi: "+rows+" vrst, razmak ≤ "+rail+" mm.";
  }
  if(p.n.indexOf("KUBO")>=0&&use==="fasada")msg+=" KUBO: pritrditev samo zgoraj in spodaj do 2500 mm z alu cevjo 20×60×2 mm.";
  $("sysStatus").textContent=msg;$("sysStatus").className="status"+((bad||wrongUse)?" bad":"");
  $("sysHint").textContent="Dolžina deske "+p.len+" mm; "+lim.label+" ≤ "+lim.v+" mm; barva "+color+", površina "+surf+".";
  var extra=roksalUseNotes(p,use,H);
  var nt=["Vse mere so v milimetrih (mm); pred izdelavo preveriti na objektu.",
    "Material: WoodCore WPC — 60 % bambusovih vlaken, 30 % recikliranega HDPE, 10 % dodatkov; 15 let garancije.",
    "Barva: "+color+" ("+surf+"); odtenek se v prvem letu posvetli za 5–10 %.",
    extra,
    "Montaža nad +5 °C; izvrtina v WPC 1 mm večja od vijaka, vijak 30–150 mm od roba.",
    "Dilatacijske reže po Roksal temperaturni tabeli; vogal 1 mm.",
    "Garancija: 15 let na material, 2 leti na dela izvedena s strani Roksal/a."];
  if(!notesTouched)$("notes").value=nt.join("\n");
  $("mat").value="WoodCore WPC (bambus / HDPE)";$("ral").value=color;
  var sb=$("stairBox");if(sb)sb.style.display=(use==="stopniscna")?"block":"none";
  checks();
}
["sysUse","sysProfile","sysColor","L","H","mountType"].forEach(function(id){$(id).addEventListener("change",applySystem)});
$("L").addEventListener("input",applySystem);
$("sysProfile").addEventListener("change",function(){var p3=WC[this.value]||WC.romb67;$("stockLen").value=String(p3.len);});
/* izbira površine (Klasik/Rustik) samodejno izbere prvi ustrezni odtenek v paleti profila */
$("sysSurface").addEventListener("change",function(){
  var pal=(WC[$("sysProfile").value]||{}).palette||[];
  var want=this.value==="Rustik",c=null;
  for(var i=0;i<pal.length;i++){var r=pal[i].indexOf("Rustic")===0;if(r===want){c=pal[i];break}}
  if(c){$("sysColor").value=c;applySystem()}
});

/* ---------- M5: več-znamkovski registar (registrska abstrakcija, P4-a) ----------
   Namen: WoodCore/Roksal postane *en registar* med drugimi (AZEK, Trex, Fiberon, RENOLIT …)
   brez ponovne vgradnje logike ob menjavi znamke. Enotna shema (profil / dilatacijska tabela /
   pravila podlage / barvna paleta / uporabe / kontaktni obrazec) + validacija.
   Stop-rule M5: BREZ pogodbenih podatkov znamk → registriran ostane samo WoodCore; druga znamka
   se vgradi šele, ko so njeni podatki na voljo. Ta modul je zato ZADOBELEN: shema + validator +
   prvi registar (WoodCore, ki referencira obstoječe globalne vire WC/DIL/USE_NAMES/PAL_*),
   ne pa izmišljenih podatkov drugih znamk. */

/* Referenčna shema enega registra znamke. Polja:
   id        – enolična ključnica ("woodcore"); naziv – prikazno ime znamke;
   material  – opis materiala (npr. "WoodCore WPC (bambus / HDPE)");
   profiles  – mapa key→{n,w,t,len,max,fix,allowed[],post{?},rail{?},facade{?},drill,palette[]};
   dilatacijska – {temps:[°C…], vals:[[mm po 1–5 m]…]} (temperatura × dolžina deske);
   pravaPodlage – funkcija (profil, uporaba, H) → {v, label} (razmak nosilcev/cev);
   palete    – imenovane barvne palete {imeno:[barve…]} (osnova za sysColor/sysSurface);
   uporabe   – mapa key→slovensko ime (npr. precna→"prečna ograja");
   kontaktni – obrazec pogodbenih podatkov: {dopisatelj,pogoji,garancija,opozorila[],eula}. */
var REGISTRY_SCHEMA={
  required:["id","naziv","material","profiles","dilatacijska","pravaPodlage","palete","uporabe","kontaktni"],
  profileRequired:["n","w","t","len","max","fix","allowed","drill","palette"]
};
/* Vrne seznam problemov (prazno polje = registar validiran). Samoprevera sheme — osnova za
   tests/registry.test.js in za varno vgradnjo novih znamk. */
function validateRegistry(entry){
  var probs=[],i;
  if(!entry||typeof entry!=="object"){return ["registar ni objekt"]}
  for(i=0;i<REGISTRY_SCHEMA.required.length;i++){
    if(entry[REGISTRY_SCHEMA.required[i]]===undefined)probs.push("manjka polje: "+REGISTRY_SCHEMA.required[i]);
  }
  /* profili: mapa z vsaj enim profilom; vsak profil nosi obvezna polja */
  if(entry.profiles&&typeof entry.profiles==="object"){
    var keys=Object.keys(entry.profiles);
    if(!keys.length)probs.push("profiles: prazna mapa");
    keys.forEach(function(k){
      var p=entry.profiles[k];if(!p||typeof p!=="object")return probs.push("profil "+k+": ni objekt");
      for(var j=0;j<REGISTRY_SCHEMA.profileRequired.length;j++){
        if(p[REGISTRY_SCHEMA.profileRequired[j]]===undefined)probs.push("profil "+k+": manjka "+REGISTRY_SCHEMA.profileRequired[j]);
      }
      if(typeof p.w!=="number"||p.w<=0)probs.push("profil "+k+": w mora biti >0");
      if(!Array.isArray(p.allowed)||!p.allowed.length)probs.push("profil "+k+": allowed mora biti neprazen seznam");
    });
  }
  /* dilatacijska tabela: temps (naraščajoče, ne prazno) in vals (nabor vrstic po dolžinah 1–5 m) */
  if(entry.dilatacijska&&entry.dilatacijska.temps&&entry.dilatacijska.vals){
    var tt=entry.dilatacijska.temps,vm=entry.dilatacijska.vals;
    if(!Array.isArray(tt)||!tt.length)probs.push("dilatacijska: temps prazno");
    for(i=1;i<tt.length;i++)if(tt[i]<=tt[i-1])probs.push("dilatacijska: temps ni strogo naraščujoča");
    if(!Array.isArray(vm)||!vm.length)probs.push("dilatacijska: vals prazno");
    else for(i=0;i<vm.length;i++)if(!Array.isArray(vm[i])||vm[i].length<5)probs.push("dilatacijska: vrstica "+i+" mora imeti 5 vrednosti (1–5 m)");
  }
  /* kontaktni obrazec: dopisatelj + opozorila (pravo razmejevanje odgovornosti, P4-c) */
  if(entry.kontaktni&&typeof entry.kontaktni==="object"){
    if(!entry.kontaktni.dopisatelj)probs.push("kontaktni: manjka dopisatelj");
    if(!Array.isArray(entry.kontaktni.opozorila))probs.push("kontaktni: opozorila mora biti seznam");
  }
  return probs;
}

/* Prvi (za sedaj edini) registar — WoodCore/Roksal. Podatkovni del referencira obstoječe
   globalne vire (brez podvajanja in brez spremembe obnašanja); abstrakcija samo dodaja
   enotno shemo + pogodbeni obrazec za bodoče znamke. */
function woodcoreRegistry(){
  return {
    id:"woodcore",
    naziv:"WoodCore / Roksal",
    material:"WoodCore WPC (bambus / HDPE)",
    profiles:WC,                                   // obstoječi registar profilov (global)
    dilatacijska:{temps:DIL.temps,vals:DIL.vals},  // dilatacijska tabela (global DIL)
    pravaPodlage:roksalLimit,                       // funkcija pravil podlag/cev (global)
    palete:{klasik:PAL_KLASIK,rustik:PAL_RUSTIK},
    uporabe:USE_NAMES,
    kontaktni:{
      dopisatelj:"Roksal d.o.o.",
      pogoji:"splošni pogoji v5.0",
      garancija:"15 let na material, 2 leti na dela izvedena s strani Roksal/a",
      eula:"predračun je orientacijski, ni ponudba; za zavezujočo ponudbo in DDV glej pogodbeni obrazec",
      opozorila:["Vse mere so v milimetrih (mm); pred izdelavo preveriti na objektu.",
        "Izračuni so orientacijske narave in niso pogodbena dokumenta — pred naročilom potrditi pri Roksalu.",
        "Dilatacijske reže po uradni temperaturni tabeli; vogal 1 mm."]
    }
  };
}
var REGISTRY={woodcore:woodcoreRegistry()};
var REGISTRY_ACTIVE="woodcore";   // privzeti registar; ostali se omogočijo le z validiranimi podatki
function registryBrands(){return Object.keys(REGISTRY)}
function activeRegistry(){return REGISTRY[REGISTRY_ACTIVE]||REGISTRY.woodcore}
function setRegistryBrand(id){if(REGISTRY[id]){REGISTRY_ACTIVE=id;return true}return false}
