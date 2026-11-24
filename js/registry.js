/* js/registry.js — izvorni modul registrske abstrakcije več znamk.
   Vir je ta datoteka; `npm run modules:sync` vstavi vsebino v označeni blok
   znotraj tehnicka-risba-pro.html. Modul je brez DOM in omrežja; WoodCore
   vnos se sklicuje na že opredeljene vire WC, DIL, PAL_KLASIK, PAL_RUSTIK,
   USE_NAMES in roksalLimit, ki v HTML-ju stojijo pred tem blokom. Stop-rule:
   brez pogodbenih podatkov drugih znamk je registriran samo WoodCore. */
var REGISTRY_SCHEMA={
  required:["id","naziv","material","profiles","dilatacijska","pravaPodlage","palete","uporabe","kontaktni"],
  profileRequired:["n","w","t","len","max","fix","allowed","drill","palette"]
};
function validateRegistry(entry){
  var probs=[],i;
  if(!entry||typeof entry!=="object"){return ["registar ni objekt"]}
  for(i=0;i<REGISTRY_SCHEMA.required.length;i++){
    if(entry[REGISTRY_SCHEMA.required[i]]===undefined)probs.push("manjka polje: "+REGISTRY_SCHEMA.required[i]);
  }
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
  if(entry.dilatacijska&&entry.dilatacijska.temps&&entry.dilatacijska.vals){
    var tt=entry.dilatacijska.temps,vm=entry.dilatacijska.vals;
    if(!Array.isArray(tt)||!tt.length)probs.push("dilatacijska: temps prazno");
    for(i=1;i<tt.length;i++)if(tt[i]<=tt[i-1])probs.push("dilatacijska: temps ni strogo naraščujoča");
    if(!Array.isArray(vm)||!vm.length)probs.push("dilatacijska: vals prazno");
    else for(i=0;i<vm.length;i++)if(!Array.isArray(vm[i])||vm[i].length<5)probs.push("dilatacijska: vrstica "+i+" mora imeti 5 vrednosti (1–5 m)");
  }
  if(entry.kontaktni&&typeof entry.kontaktni==="object"){
    if(!entry.kontaktni.dopisatelj)probs.push("kontaktni: manjka dopisatelj");
    if(!Array.isArray(entry.kontaktni.opozorila))probs.push("kontaktni: opozorila mora biti seznam");
  }
  return probs;
}
function woodcoreRegistry(){
  return {
    id:"woodcore",
    naziv:"WoodCore / Roksal",
    material:"WoodCore WPC (bambus / HDPE)",
    profiles:WC,
    dilatacijska:{temps:DIL.temps,vals:DIL.vals},
    pravaPodlage:roksalLimit,
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
var REGISTRY_ACTIVE="woodcore";
function registryBrands(){return Object.keys(REGISTRY)}
function activeRegistry(){return REGISTRY[REGISTRY_ACTIVE]||REGISTRY.woodcore}
function setRegistryBrand(id){if(REGISTRY[id]){REGISTRY_ACTIVE=id;return true}return false}
