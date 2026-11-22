// Draftwright — modul 07-project (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
var fields=["L","H","D","w2","slabT","segList","koritoH","koritoD","koritoList","n","sw","st","gap","wall","prof","topP","botP","np","postP","bolt","nbolt","zoneTop","zoneMid","zoneBot","zoneBase","innerD","sysUse","sysProfile","sysColor","sysSurface","matSel","rho","paper","scale","projType","rev","proj","drw","mat","tol","fin","aut","date","chk","ral","bracket","anchor","weld","notes","emb","sub","stN","stRise","stGoing","stW","stPosts","stH","stockLen","kerf","priceBoard","pricePost","priceScrew","priceWork","workHours","installTemp","slopeMM","mountType","weldedParts","installer","handoverDate","subType","strankaTip","strankaDav","strankaNaslov","strankaEmail","strankaTel","dobavaMode","dobavitelj","stranka","objekt"];
function projectJson(){
  var data={};fields.forEach(function(id){data[id]=V(id)});
  data.refMode=$("refMode").checked;data.photo=S.photoData;data.cal=S.cal;data.calMode=S.calMode;
  data.calibrated=S.calibrated;data.lines=S.lines;data.detOverride=S.detOverride||null;
  data.plan={walls:TLR.walls.slice(),anchor:TLR.anchor};
  data.sketch={elems:SK.elems.slice(),paper:SK.paper,orient:SK.orient,mreza:SK.mreza};
  return JSON.stringify({schema:PROJ_SCHEMA,version:PROJ_VERSION,savedWith:"Tehnična risba PRO",data:data},null,2);
}
$("save").onclick=function(){saveBlob(V("drw")+"-project.json",projectJson(),"application/json")};
$("loadBtn").onclick=function(){$("loadFile").click()};
/* P5: enoten vir nalaganja projekta — datoteka, shranjeni projekti (brskalnik) in URL povezava */
function restoreProjectString(txt){
  var d=JSON.parse(txt);
  if(d&&d.schema===PROJ_SCHEMA&&d.data){
    if((d.version||0)>PROJ_VERSION)throw new Error("projekt je shranjen z novejšo različico ("+d.version+") — posodobite aplikacijo");
    /* migracija: v1 doda prazno traso; v1/v2 dodata prazno skico (shema v3) */
    if((d.version||0)>=1&&!d.data.plan)d.data.plan={walls:[],anchor:null};
    if((d.version||0)>=1&&(d.version||0)<3&&!d.data.sketch)d.data.sketch={elems:[],paper:"A4",orient:"pokoncno",mreza:false};
    if(d.data.sketch){
      SK.elems=(d.data.sketch.elems||[]).map(skCleanElem).filter(Boolean).slice(0,2000);
      SK.paper=d.data.sketch.paper==="A3"?"A3":"A4";SK.orient=d.data.sketch.orient==="lezeco"?"lezeco":"pokoncno";SK.mreza=!!d.data.sketch.mreza;
      $("skPaper").value=SK.paper;$("skOrient").value=SK.orient;$("skGrid").checked=SK.mreza;skRender();
    }
    if(d.data.plan){
      TLR.walls=(d.data.plan.walls||[]).filter(function(w){return w&&typeof w==="object"}).slice(0,500).map(function(w){return{x1:numOf(w.x1,0),y1:numOf(w.y1,0),x2:numOf(w.x2,0),y2:numOf(w.y2,0)}});
      TLR.anchor=d.data.plan.anchor?{x:numOf(d.data.plan.anchor.x,0),y:numOf(d.data.plan.anchor.y,0)}:null;tlrRender();
    }
    d=d.data;
  }
  else if(d&&d.schema&&d.schema!==PROJ_SCHEMA)throw new Error("nepodprta shema "+d.schema+" (pričakovana "+PROJ_SCHEMA+")");
  /* legacy (v0): ravna struktura brez ovojnice — sprejeto */
  var unknown=0;
  fields.forEach(function(id){if(d[id]!=null)$(id).value=d[id]});
  $("refMode").checked=!!d.refMode;var _rm3=$("refModeMenu");if(_rm3)_rm3.checked=$("refMode").checked;
  S.calMode=d.calMode||"linear";S.cal=d.cal||null;S.calibrated=!!d.calibrated;S.lines=d.lines||[];
  if(d.detOverride)S.detOverride=d.detOverride;
  if(d.photo){var im=new Image();im.onload=function(){S.img=im;$("img").src=im.src;$("photoBox").classList.add("on");drawOverlay()};im.src=d.photo}
  invalidateProduction();drawOverlay();checks();generate();
  return "Projekt naložen"+(unknown?" ("+unknown+" nepoznanih polj preskočenih)":"")+".";
}
$("loadFile").onchange=function(e){var file=e.target.files[0];if(!file)return;var r=new FileReader();r.onload=function(){
  try{dt(restoreProjectString(r.result),"")}catch(err){dt("Napaka pri nalaganju: "+err.message,"bad")}
};r.readAsText(file)};

