// Draftwright — modul 14-ui-fields (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
/* ---------- Field picker: show only what the user needs ---------- *//* ---------- Field picker: show only what the user needs ---------- */
var FIELD_SECTIONS={photo:1,cal:2,detect:3,sheet:5,plan:6,export:7,tloris:8,skica:9};
var FIELD_ITEMS={
  system:[".sysbox"],
  main:["#L","#H","#D","#n","#sw","#st","#gap"],
  zones:["#zoneTop","#zoneMid","#zoneBot","#zoneBase","#innerD"],
  advanced:["#wall","#prof","#topP","#botP","#np","#postP","#bolt","#nbolt","#matSel","#rho"]
};
var FIELD_FALLBACK={photo:false,cal:false,detect:false,sheet:false,plan:false,export:true,system:true,main:true,zones:true,advanced:false,skica:true,tloris:true};
function fieldBoxes(){return [].slice.call(document.querySelectorAll("[data-fg]"))}
function saveFieldState(){
  try{
    var d={};fieldBoxes().forEach(function(b){d[b.getAttribute("data-fg")]=b.checked});
    localStorage.setItem("tehnicka-risba-pro-fields",JSON.stringify(d));
  }catch(e){}
}
function restoreFieldState(){
  try{
    var d=JSON.parse(localStorage.getItem("tehnicka-risba-pro-fields")||"null");if(!d)return;
    fieldBoxes().forEach(function(b){var k=b.getAttribute("data-fg");if(d[k]!=null)b.checked=!!d[k]});
  }catch(e){}
}
function applyFieldVisibility(){
  var on={};fieldBoxes().forEach(function(b){on[b.getAttribute("data-fg")]=b.checked});
  var secs=[].slice.call(document.querySelectorAll("aside section"));
  Object.keys(FIELD_SECTIONS).forEach(function(g){
    var sec=secs[FIELD_SECTIONS[g]-1];if(sec)sec.classList.toggle("collapsed",!on[g]);
  });
  [].slice.call(document.querySelectorAll(".fg-hide")).forEach(function(e){e.classList.remove("fg-hide")});
  Object.keys(FIELD_ITEMS).forEach(function(g){
    if(on[g])return;
    FIELD_ITEMS[g].forEach(function(sel){
      var e=document.querySelector(sel);if(!e)return;
      var t=(e.parentNode&&e.parentNode.classList&&e.parentNode.classList.contains("row3"))?e.parentNode:e;
      t.classList.add("fg-hide");
    });
  });
  var s4=secs[3];
  if(s4)s4.classList.toggle("collapsed",!on.system&&!on.main&&!on.zones&&!on.advanced);
  var boxes=fieldBoxes(),lc=$("fieldCount");
  if(lc)lc.textContent=boxes.filter(function(b){return b.checked}).length+"/"+boxes.length;
  saveFieldState();
}
$("fieldBtn").onclick=function(){$("fieldMenu").classList.toggle("open")};
$("fieldReset").onclick=function(){
  fieldBoxes().forEach(function(b){b.checked=!!FIELD_FALLBACK[b.getAttribute("data-fg")]});
  applyFieldVisibility();
};
fieldBoxes().forEach(function(b){b.addEventListener("change",applyFieldVisibility)});
document.addEventListener("click",function(e){
  var m=$("fieldMenu");if(!m||!m.classList.contains("open"))return;
  if(!e.target.closest(".fieldpick"))m.classList.remove("open");
});

/* ---------- UI/UX additions: guided/expert, accordion, presets, shortcuts, autosave ---------- */
var advancedIds=["rho","tol","fin","aut","chk","ral","bracket","anchor","weld","rev","projType","innerD","matSel","sens","minsep","nbolt","emb","sub","stN","stRise","stGoing","stW","stPosts","stH","np","matDensityLabel"];
advancedIds.forEach(function(id){var e=$(id);if(!e)return; if(e.tagName==="LABEL"){e.classList.add("advanced");return;} var d=e.closest("div"); if(d)d.classList.add("advanced");});
function setMode(expert){
  document.querySelector("aside").className=expert?"":"guided";
  if($("modeGuided")) $("modeGuided").className="btn"+(expert?"":" on");
  if($("modeExpert")) $("modeExpert").className="btn"+(expert?" on":"");
}
$("modeGuided").onclick=function(){setMode(false)};
$("modeExpert").onclick=function(){setMode(true)};
[].forEach.call(document.querySelectorAll("aside section h2"),function(h){
  h.onclick=function(){h.parentNode.classList.toggle("collapsed")};
});
var PRESETS={
  romb:{use:"precna",profile:"romb67",color:"Amazon wood",gap:27,n:11,L:4000,H:1200,D:1200},
  polna:{use:"pokoncna",profile:"polna57",color:"White",gap:20,n:40,L:4000,H:1200,D:1200},
  kubo:{use:"fasada",profile:"kubo80",color:"Oak wood",gap:30,n:20,L:4000,H:1200,D:1200}
};
function applyPreset(k){
  invalidateProduction();
  var p=PRESETS[k];if(!p)return;
  $("sysUse").value=p.use;$("sysProfile").value=p.profile;$("sysColor").value=p.color;
  $("refMode").checked=true;
  ["gap","n","L","H","D"].forEach(function(id){$(id).value=p[id]});
  applySystem();
  $("globalStatus").textContent="Prednastavitev "+$("sysProfile").selectedOptions[0].text+" naložena — preverite mere in pritisnite Generiraj.";
}
[].forEach.call(document.querySelectorAll("[data-preset]"),function(b){
  b.onclick=function(){applyPreset(b.getAttribute("data-preset"))};
});
function updateGlobalStatus(msgs){
  var e=$("globalStatus");if(!e)return;
  var prof=WC[$("sysProfile").value]?WC[$("sysProfile").value].n:"—";
  e.textContent=prof+" · nosilci: "+V("np")+" · "+(msgs.length?msgs.length+" opozorilo":"brez opozoril")+" · samodejno shranjeno";
}
/* En sam lastnik tipkovnih bližnjic: prepreči dvojni undo, ko sta odprta oba platna. */
var KBD={last:null};
document.addEventListener("pointerdown",function(e){
  var t=e.target;if(!t||!t.closest)return;
  if(t.closest("#tlorisSvg"))KBD.last="tloris";
  else if(t.closest("#skSvg"))KBD.last="skica";
},true);
function panelOn(name){var s=document.querySelector('section[data-panel="'+name+'"]');return !!s&&!s.classList.contains("collapsed")}
function undoAction(redo){
  if(KBD.last==="skica"&&panelOn("skica"))return redo?skRedo:skUndo;
  if(KBD.last==="tloris"&&panelOn("tloris"))return redo?tlrRedo:tlrUndo;
  if(panelOn("skica")&&SK.undo.length&&(!panelOn("tloris")||!TLR.undo.length))return redo?skRedo:skUndo;
  if(panelOn("tloris")&&TLR.undo.length)return redo?tlrRedo:tlrUndo;
  if(panelOn("skica"))return redo?skRedo:skUndo;
  return null;
}
document.addEventListener("keydown",function(e){
  var typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  var blocked=typing||$("expOverlay").classList.contains("on");
  var k=String(e.key||"").toLowerCase();
  if(blocked)return;
  if((e.ctrlKey||e.metaKey)&&(k==="z"||k==="y")){var fn=undoAction(k==="y");if(fn){e.preventDefault();fn()}}
  if((e.ctrlKey||e.metaKey)&&k==="g"){e.preventDefault();generate()}
  if((e.ctrlKey||e.metaKey)&&k==="s"){e.preventDefault();$("save").click()}
  if(e.key==="+")setZoom(zoom+10);
  if(e.key==="-")setZoom(zoom-10);
  if(e.key==="Escape"&&KBD.last==="tloris"&&panelOn("tloris")&&TLR.anchor){TLR.anchor=null;tlrRender()}
});
var LSKEY="tehnicka-risba-pro-state",saveTimer=null;
function saveState(){
  var d={};fields.forEach(function(id){d[id]=V(id)});d.refMode=$("refMode").checked;
  /* pogl. 12: kalibracija se avtomatsko shrani (majhna) — fotografija NE (kvota ~5 MB; izrecno dokumentirano) */
  if(S.cal)d.cal=S.cal;if(S.calMode)d.calMode=S.calMode;if(S.calibrated)d.calibrated=1;
  d.plan={walls:TLR.walls.slice(),anchor:TLR.anchor};
  d.sketch={elems:SK.elems.slice(),paper:SK.paper,orient:SK.orient,mreza:SK.mreza};
  try{localStorage.setItem(LSKEY,JSON.stringify(d))}catch(e){
    if(String(e).indexOf("QuotaExceeded")>=0&&$("globalStatus")){ $("globalStatus").textContent="Opozorilo: shramba brskalnika je polna — avtoshranjevanje preskočeno.";$("globalStatus").style.color="var(--wa)"; }
  }
}
function restoreState(){
  try{
    var d=JSON.parse(localStorage.getItem(LSKEY)||"null");if(!d)return;
    fields.forEach(function(id){if(d[id]!=null)$(id).value=d[id]});
    $("refMode").checked=!!d.refMode;
    if(d.cal){S.cal=d.cal;S.calMode=d.calMode||"linear";S.calibrated=!!d.calibrated}
    if(d.plan){TLR.walls=(d.plan.walls||[]).slice();TLR.anchor=d.plan.anchor||null;tlrRender()}
    if(d.sketch){SK.elems=(d.sketch.elems||[]).slice();SK.paper=d.sketch.paper||"A4";SK.orient=d.sketch.orient||"pokoncno";SK.mreza=!!d.sketch.mreza;skRender()}
  }catch(e){try{localStorage.removeItem(LSKEY)}catch(e2){}}
}
document.addEventListener("input",function(){invalidateProduction();clearTimeout(saveTimer);saveTimer=setTimeout(saveState,400)});
document.addEventListener("change",function(){invalidateProduction();clearTimeout(saveTimer);saveTimer=setTimeout(saveState,400)});

/* ---------- P5: shranjeni projekti (brskalnik) + deljenje po URL povezavi ----------
   Projekti so lokalni (localStorage) BREZ fotografije (kvota ~5 MB; cal/trasa/skica ostanejo).
   Povezava: projekt kodiran v #p=<base64url> — prejemnik odpre povezavo in projekt se naloži. */
var PRJKEY="draftwright-projects";
function prjAll(){try{return JSON.parse(localStorage.getItem(PRJKEY)||"[]")}catch(e){return[]}}
function prjWrite(list){
  try{localStorage.setItem(PRJKEY,JSON.stringify(list));return true}
  catch(e){$("globalStatus").textContent="Shramba brskalnika je polna — izbrišite stare projekte.";$("globalStatus").style.color="var(--wa)";return false}
}
function prjSnapshot(){var d=JSON.parse(projectJson());d.photo=null;if(d.data)d.data.photo=null;return JSON.stringify(d)}
function prjRenderList(){
  var list=prjAll(),el=$("prjList");if(!el)return;
  if(!list.length){el.innerHTML='<div class="m" style="color:var(--dim)">Še ni shranjenih projektov.</div>';return}
  el.innerHTML=list.map(function(p,i){
    var thumb=p.thumb
      ?'<img class="prj-thumb" src="'+p.thumb+'" alt="" loading="lazy">'
      :'<span class="prj-thumb ph" aria-hidden="true">📄</span>';
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 2px;border-bottom:1px solid var(--line)">'+
      thumb+
      '<div style="flex:1;min-width:0"><b>'+E(p.name)+'</b> <span class="m" style="color:var(--dim)">· '+E(p.date)+' · '+Math.round(p.size/1024)+' kB</span></div>'+
      '<button class="exp-go" data-prj-open="'+i+'" type="button">Odpri</button>'+
      '<button class="exp-cancel" data-prj-del="'+i+'" type="button">Izbriši</button></div>';
  }).join("");
  [].slice.call(el.querySelectorAll("[data-prj-open]")).forEach(function(b){b.addEventListener("click",function(){prjOpenAt(Number(b.getAttribute("data-prj-open")))})});
  [].slice.call(el.querySelectorAll("[data-prj-del]")).forEach(function(b){b.addEventListener("click",function(){var list2=prjAll();list2.splice(Number(b.getAttribute("data-prj-del")),1);prjWrite(list2);prjRenderList()})});
}
/* Faza 2: thumbnail (SVG → PNG canvas) za vizualno zgodovino — asinhrono; ob napaki/null se preskoči */
function prjMakeThumb(cb){
  cb=cb||function(){};
  try{
    var sv=svgEl();if(!sv)return cb(null);
    var w=180,h=Math.round(w*297/420);
    var c=document.createElement("canvas");c.width=w;c.height=h;
    var ctx=c.getContext("2d");
    ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);
    var url="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(new XMLSerializer().serializeToString(sv));
    var im=new Image();
    im.onload=function(){
      try{ctx.drawImage(im,0,0,w,h);var d=c.toDataURL("image/jpeg",0.7);cb(d.length<250000?d:null);}catch(e){cb(null)}
    };
    im.onerror=function(){cb(null)};
    im.src=url;
  }catch(e){cb(null)}
}
function prjSave(){
  var name=($("prjName").value||"").trim()||V("proj")||"Projekt";
  var snap=prjSnapshot(),list=prjAll();
  var d=new Date();
  var id=Date.now();
  list.unshift({id:id,name:name,date:d.toLocaleDateString("sl-SI")+" "+("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2),size:snap.length,data:snap});
  if(prjWrite(list)){$("prjName").value="";prjRenderList();$("prjNote").textContent="Projekt »"+name+"« shranjen ("+list.length+" shranjenih).";$("globalStatus").textContent="Projekt »"+name+"« shranjen v brskalnik.";toast("Projekt »"+name+"« shranjen","ok");
    prjMakeThumb(function(thumb){
      if(!thumb)return;
      var l2=prjAll(),found=null;
      l2.forEach(function(p){if(p.id===id)found=p});
      if(found){found.thumb=thumb;prjWrite(l2);prjRenderList();}
    });
  }
}
function prjOpenAt(i){
  var p=prjAll()[i];if(!p)return;
  try{$("prjNote").textContent=restoreProjectString(p.data);closePrj();$("globalStatus").textContent="Projekt »"+p.name+"« naložen iz shrambe.";}
  catch(e){$("prjNote").textContent="Napaka: "+e.message}
}
function openPrj(){if($("expOverlay").classList.contains("on"))return;$("prjName").value="";prjRenderList();$("prjNote").textContent="";$("prjOverlay").classList.add("on")}
function closePrj(){$("prjOverlay").classList.remove("on")}
function prjLinkCopy(){
  var b64=btoa(unescape(encodeURIComponent(prjSnapshot()))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  var url=window.location.origin+window.location.pathname+"#p="+b64;
  var done=function(){$("globalStatus").textContent="Povezava projekta kopirana ("+Math.round(url.length/1024)+" kB).";if($("prjNote"))$("prjNote").textContent="Povezava kopirana v odložišče.";};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(done,function(){window.prompt("Povezava projekta (Ctrl+C):",url)});
  else window.prompt("Povezava projekta (Ctrl+C):",url);
}
/* Faza 1: share view mode — povezava za ogled (stranka): samo risba + PDF, brez urejanja */
function prjLinkView(){
  var b64=btoa(unescape(encodeURIComponent(prjSnapshot()))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  var url=window.location.origin+window.location.pathname+"?view=1#p="+b64;
  var done=function(){if($("prjNote"))$("prjNote").textContent="Povezava za ogled kopirana — prejemnik vidi samo risbo + PDF.";toast("Povezava za ogled (stranka) kopirana","ok")};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(done,function(){window.prompt("Povezava za ogled (Ctrl+C):",url)});
  else window.prompt("Povezava za ogled (Ctrl+C):",url);
}
function parseViewMode(){
  try{
    var params=new URLSearchParams(window.location.search);
    if(params.get("view")!=="1")return false;
    document.body.classList.add("viewmode");
    var pdf=$("vbPdf"),edit=$("vbEdit"),title=$("vbTitle");
    if(pdf)pdf.onclick=function(){
      generate();
      var sv=window.svgVariant({paper:V("paper"),watermark:false,meta:true});
      if(!sv){toast("Risbe ni mogoče generirati — preverite mere","err");return}
      exportPdf(sv,V("paper")).then(function(doc){doc.save(V("drw")+".pdf");toast("PDF shranjen","ok")})
        .catch(function(e){toast("PDF ni uspel: "+e.message,"err")});
    };
    if(edit)edit.onclick=function(){
      document.body.classList.remove("viewmode");
      try{history.replaceState(null,"",window.location.pathname+window.location.hash)}catch(e){}
    };
    if(title)title.textContent=(V("proj")||"Naložen projekt")+" · "+(V("drw")||"");
    return true;
  }catch(e){
    /* view mode nikoli ne sme porušiti inicializacije aplikacije */
    try{console.error("parseViewMode:",e)}catch(e2){}
    return false;
  }
}
$("prjLinkView").onclick=prjLinkView;
function prjRestoreFromHash(){
  var h=window.location.hash||"";
  if(h.indexOf("#p=")!==0)return false;
  try{
    var b64=h.slice(3).replace(/-/g,"+").replace(/_/g,"/");
    while(b64.length%4)b64+="=";
    var msg=restoreProjectString(decodeURIComponent(escape(atob(b64))));
    try{history.replaceState(null,"",window.location.pathname+window.location.search)}catch(e2){}
    $("globalStatus").textContent="Projekt naložen iz povezave — "+msg;
    return true;
  }catch(e){$("globalStatus").textContent="Povezava z projektom ni veljavna ("+e.message+").";return false}
}
$("prjSave").onclick=prjSave;
$("prjClose").onclick=closePrj;
$("prjLink").onclick=prjLinkCopy;
$("prjDialogBtn").onclick=openPrj;
$("prjLinkBtn").onclick=prjLinkCopy;
$("prjOverlay").addEventListener("click",function(e){if(e.target===this)closePrj()});
document.addEventListener("keydown",function(e){if($("prjOverlay").classList.contains("on")&&e.key==="Escape")closePrj()});
window.prjRestoreFromHash=prjRestoreFromHash;window.restoreProjectString=restoreProjectString;
window.tlorisSvgString=tlorisSvgString;window.skCleanElem=skCleanElem;window.pnum=pnum;window.SK=SK;window.TLR=TLR; /* testno dostopni */
/* Testno dostopni (regresijski testi): konstante sheme + graditelji produkcije + ŽIVE dostopnike
   do zaprtega stanja (getter zapre IIFE-scope spremenljivke → vedno vrne trenutno vrednost). */
window.PROJ_SCHEMA=PROJ_SCHEMA;window.PROJ_VERSION=PROJ_VERSION;
window.buildOrder=buildOrder;window.buildCut=buildCut;
Object.defineProperty(window,"orderText",{get:function(){return orderText},configurable:true});
Object.defineProperty(window,"cutData",{get:function(){return cutData},configurable:true});
prjRestoreFromHash();
window.prjLinkView=prjLinkView;window.parseViewMode=parseViewMode; /* Faza 1: testno dostopni */
parseViewMode();
