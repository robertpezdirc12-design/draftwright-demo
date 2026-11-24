/* js/roksal.js — izvorni modul uporab in omejitev razmika WoodCore.
   Vir je ta datoteka; `npm run modules:sync` vstavi vsebino v označeni blok
   znotraj tehnicka-risba-pro.html. Podatki in funkciji so čisti (brez DOM,
   brez stanja obrazca); roksalUseNotes() ostane v HTML-ju, ker uporablja stanje obrazca. */
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
