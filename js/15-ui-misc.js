// Draftwright — modul 15-ui-misc (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
/* ---------- Faza 0.5: toast obvestila, tema, pan/fullscreen/wheel, galerija primerov ---------- */
function toast(msg,type){
  var z=$("toastZone");if(!z)return;
  var el=document.createElement("div");el.className="toast"+(type?" "+type:"");
  el.textContent=msg;z.appendChild(el);
  setTimeout(function(){el.classList.add("out");setTimeout(function(){el.remove()},380)},3200);
}
(function(){ /* tema — gumb + sistemska detekcija (flag v localStorage) */
  var th=$("themeBtn"),root=document.documentElement;
  function upd(){if(th)th.textContent=(root.getAttribute("data-theme")||"dark")==="light"?"🌙":"☀️"}
  if(th){th.onclick=function(){
    var cur=root.getAttribute("data-theme")||"dark",nxt=cur==="light"?"dark":"light";
    root.setAttribute("data-theme",nxt);
    try{localStorage.setItem("draftwright-theme",nxt)}catch(e){}
    upd();toast(nxt==="light"?"Svetla tema":"Temna tema","ok");
  };}
  upd();
})();
(function(){ /* predogled: ctrl+wheel zoom, Pan toggle (samo >100 %), fullscreen */
  var sheet=document.querySelector(".sheet"),pan={on:false,active:false},pb=$("panBtn");
  function setPan(v){pan.active=v;if(pb)pb.classList.toggle("on",v);if(sheet)sheet.classList.toggle("panning",v&&zoom>100)}
  if(pb)pb.onclick=function(){setPan(!pan.active)};
  if(sheet){
    sheet.addEventListener("pointerdown",function(e){
      if(pan.active&&zoom>100){pan.on=true;pan.x=e.clientX;pan.y=e.clientY;pan.l=sheet.scrollLeft;pan.t=sheet.scrollTop;e.preventDefault();}
    });
    sheet.addEventListener("wheel",function(e){
      if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(zoom+(e.deltaY<0?10:-10));}
    },{passive:false});
  }
  window.addEventListener("pointermove",function(e){if(!pan.on)return;sheet.scrollLeft=pan.l-(e.clientX-pan.x);sheet.scrollTop=pan.t-(e.clientY-pan.y);});
  window.addEventListener("pointerup",function(){pan.on=false});
  var fsb=$("fsBtn");
  if(fsb)fsb.onclick=function(){
    if(document.fullscreenElement){if(document.exitFullscreen)document.exitFullscreen();}
    else{var el=document.querySelector(".sheet");if(el&&el.requestFullscreen)el.requestFullscreen().catch(function(){});else toast("Fullscreen ni podprt v tem brskalniku","err");}
  };
})();
/* Galerija primerov — naloži polja iz predloge, jih počisti in generira risbo */
var TEMPLATES={
  precna:{icon:"🚧",name:"Prečna ograja",desc:"ROMB-67 · L=4000, H=1200",set:{use:"precna",profile:"romb67",L:"4000",H:"1200",D:"1200",n:"11",gap:"27"}},
  pokoncna:{icon:"🚪",name:"Pokončna ograja",desc:"POLNA-57 · navpične lamele",set:{use:"pokoncna",profile:"polna57",L:"4000",H:"1200",D:"1200",n:"10",gap:"20"}},
  fasada:{icon:"🏢",name:"Fasada",desc:"KUBO-80 · alu cev",set:{use:"fasada",profile:"kubo80",L:"4000",H:"1200",D:"1200",n:"10",gap:"30"}},
  terasa:{icon:"⛱️",name:"Terasa",desc:"DESKA-150 · letve 33–35 cm",set:{use:"terasa",profile:"deska150",L:"5000",H:"1200",D:"2000",n:"15",gap:"8"}},
  stopnice:{icon:"🪜",name:"Stopniščna ograja",desc:"naklon 17/28 · ročaj",set:{use:"stopniscna",profile:"romb67",L:"4200",H:"1000",D:"1200",n:"6",gap:"10",stN:"12",stRise:"17",stGoing:"28",stW:"1000"}},
  dvonadstropna:{icon:"🏗️",name:"Dvonadstropna",desc:"segmenti 6200+7800 · plošča 180",set:{use:"precna",profile:"romb67",L:"7800",H:"1050",D:"2100",n:"12",gap:"20",segList:"1. NADSTROPJE;6200;1030\nPRITLIČJE;7800;1050",slabT:"180"}},
  lpovratek:{icon:"↩️",name:"L-povratek",desc:"kotni steber · W2=2100",set:{use:"precna",profile:"romb67",L:"7800",H:"1050",D:"2100",n:"12",gap:"20",w2:"2100"}},
  korita:{icon:"🌺",name:"Korita za rože",desc:"2× korito (1100+1400)",set:{use:"precna",profile:"romb67",L:"4200",H:"1050",D:"1200",n:"12",gap:"20",koritoList:"1100;300\n1400;1900"}}
};
function openTemplates(){if($("expOverlay").classList.contains("on"))return;$("tmplNote").textContent="";renderTmplGrid();$("tmplOverlay").classList.add("on")}
function closeTemplates(){$("tmplOverlay").classList.remove("on")}
function renderTmplGrid(){
  var g=$("tmplGrid");if(!g)return;
  g.innerHTML=Object.keys(TEMPLATES).map(function(k){
    var t=TEMPLATES[k];
    return '<button class="tmpl-card" data-tmpl="'+k+'" type="button"><span class="tmpl-icon">'+t.icon+'</span><b>'+E(t.name)+'</b><span>'+E(t.desc)+'</span></button>';
  }).join("");
  [].slice.call(g.querySelectorAll("[data-tmpl]")).forEach(function(b){
    b.addEventListener("click",function(){applyTemplate(b.getAttribute("data-tmpl"))});
  });
}
function applyTemplate(k){
  var t=TEMPLATES[k];if(!t)return;
  function ev(id,type){var el=$(id);if(!el)return;el.dispatchEvent(new Event(type,{bubbles:true}))}
  ["segList","koritoList","w2","slabT","L","H","D","n","sw","st","gap","stN","stRise","stGoing","stW"].forEach(function(id){
    var el=$(id);if(!el)return;
    if(t.set[id]!=null){el.value=t.set[id];ev(id,["sysUse","sysProfile","mountType"].indexOf(id)>=0?"change":"input");}
    else if(id==="segList"||id==="koritoList"){el.value="";ev(id,"input");}
    else if(id==="w2"||id==="slabT"){el.value="0";ev(id,"input");}
  });
  closeTemplates();
  $("gen").click();
  toast("Primer »"+t.name+"« naložen in generiran","ok");
}
$("tmplClose").onclick=closeTemplates;
$("tmplOverlay").addEventListener("click",function(e){if(e.target===this)closeTemplates()});
document.addEventListener("keydown",function(e){if($("tmplOverlay").classList.contains("on")&&e.key==="Escape")closeTemplates()});
window.openTemplates=openTemplates;window.applyTemplate=applyTemplate;window.toast=toast;

/* ---------- Faza 2: 3D pogled — zbirni model (enaka logika kot STEP) + rotacija (azimut/elevacija) ---------- */
function collectSolids(){
  var L=n("L"),H=n("H"),D=n("D"),N=Math.max(1,Math.round(n("n"))),NP=Math.max(1,Math.round(n("np")));
  var sw=n("sw"),stn=n("st"),gap=n("gap");
  var tp=dim(V("topP"),[80,40]),bp=dim(V("botP"),[60,40]),pp=dim(V("postP"),[50,50]);
  var out=[],add=function(b){out.push(b)};
  var topH=Math.min(tp[1],H*0.2),botH=Math.min(bp[1],H*0.2);
  add({x0:0,y0:-tp[0]/2,z0:H-topH,x1:L,y1:tp[0]/2,z1:H,label:"Top profile"});
  add({x0:0,y0:-bp[0]/2,z0:0,x1:L,y1:bp[0]/2,z1:botH,label:"Bottom profile"});
  var inner=H-topH-botH,pitch=inner/N,sh=Math.max(2,sw/Math.max(1,sw+gap)*pitch);
  for(var i=0;i<N;i++){
    var z0=botH+i*pitch+gap/2,z1=Math.min(H-topH,z0+sh);
    add({x0:0,y0:-stn/2,z0:z0,x1:L,y1:stn/2,z1:z1,label:"Slat "+(i+1)});
  }
  for(var k=0;k<NP;k++){
    var x=L*k/Math.max(1,NP-1);if(NP===1)x=L/2;
    add({x0:x-pp[0]/2,y0:-pp[1]/2,z0:0,x1:x+pp[0]/2,y1:pp[1]/2,z1:H,label:"Post front "+(k+1)});
    add({x0:x-pp[0]/2,y0:D-pp[1]/2,z0:0,x1:x+pp[0]/2,y1:D+pp[1]/2,z1:H,label:"Post back "+(k+1)});
  }
  var kds=getKoritaData();
  if(kds.active&&segsParse().length<2){
    kds.items.forEach(function(kt,ki){
      add({x0:kt.x,y0:D,z0:H,x1:kt.x+kt.w,y1:D+kds.D,z1:H+kds.H,label:"Cvetlično korito "+(ki+1)});
      add({x0:kt.x+kt.w/2-30,y0:D,z0:H-60,x1:kt.x+kt.w/2+30,y1:D+kds.D,z1:H,label:"Konzola "+(ki+1)});
    });
  }
  return out;
}
function renderIso3D(az,el){
  var a=az*Math.PI/180,e=el*Math.PI/180;
  var sa=Math.sin(a),ca=Math.cos(a),se=Math.sin(e),ce=Math.cos(e);
  function R(x,y,z){var x1=x*ca+z*sa,y1=y,z1=-x*sa+z*ca;return [x1,y1*ce-z1*se,y1*se+z1*ce]}
  var sol=collectSolids(),pol=[];
  sol.forEach(function(b){
    var C=[[b.x0,b.y0,b.z0],[b.x1,b.y0,b.z0],[b.x1,b.y1,b.z0],[b.x0,b.y1,b.z0],[b.x0,b.y0,b.z1],[b.x1,b.y0,b.z1],[b.x1,b.y1,b.z1],[b.x0,b.y1,b.z1]];
    var faces=[[[0,3,2,1],[242,242,242]],[[4,5,6,7],[250,250,250]],[[0,1,5,4],[218,218,218]],[[1,2,6,5],[236,236,236]],[[2,3,7,6],[228,228,228]],[[3,0,4,7],[246,246,246]]];
    faces.forEach(function(f){
      var pts=f[0].map(function(i){return R(C[i][0],C[i][1],C[i][2])});
      var z=pts.reduce(function(s,p){return s+p[2]},0)/4;
      pol.push({pts:pts,z:z,fill:f[1]});
    });
  });
  pol.sort(function(x,y){return y.z-x.z});
  var all=[];pol.forEach(function(p){p.pts.forEach(function(pt){all.push(pt)})});
  var x0=Math.min.apply(null,all.map(function(p){return p[0]})),x1=Math.max.apply(null,all.map(function(p){return p[0]}));
  var y0=Math.min.apply(null,all.map(function(p){return p[1]})),y1=Math.max.apply(null,all.map(function(p){return p[1]}));
  var w=x1-x0||1,h=y1-y0||1,sc=Math.min(520/w,320/h),cx=(x0+x1)/2,cy=(y0+y1)/2;
  var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#ffffff"/>';
  pol.forEach(function(p){
    var pts=p.pts.map(function(pt){return (300+(pt[0]-cx)*sc)+","+(200-(pt[1]-cy)*sc)}).join(" ");
    s+='<polygon points="'+pts+'" fill="rgb('+p.fill.join(",")+')" stroke="#777" stroke-width="0.6"/>';
  });
  return s+'</svg>';
}
var ISO={az:35,el:25};
function renderIso3DTo(az,el){
  var svg=$("isoSvg");if(!svg)return;
  svg.innerHTML=renderIso3D(az,el);
  var inf=$("isoInfo");if(inf)inf.textContent="Azimut "+Math.round(az)+"° · Elevacija "+Math.round(el)+"°";
}
function isoOpen(){renderIso3DTo(ISO.az,ISO.el);$("isoOverlay").classList.add("on")}
function isoClose(){$("isoOverlay").classList.remove("on")}
$("isoBtn").onclick=isoOpen;
$("isoClose").onclick=isoClose;
$("isoOverlay").addEventListener("click",function(e){if(e.target===this)isoClose()});
document.addEventListener("keydown",function(e){if($("isoOverlay").classList.contains("on")&&e.key==="Escape")isoClose()});
[].slice.call(document.querySelectorAll("[data-iso]")).forEach(function(b){
  b.addEventListener("click",function(){
    var k=b.getAttribute("data-iso");
    if(k==="front")ISO.az=0;else if(k==="rear")ISO.az=180;else if(k==="left")ISO.az=-90;
    else if(k==="right")ISO.az=90;else if(k==="top"){ISO.az=0;ISO.el=90}else{ISO.az=35;ISO.el=25}
    renderIso3DTo(ISO.az,ISO.el);
  });
});
(function(){
  var svg=$("isoSvg"),d={on:false};
  if(!svg)return;
  svg.addEventListener("pointerdown",function(e){d.on=true;d.x=e.clientX;d.y=e.clientY;svg.style.cursor="grabbing";e.preventDefault()});
  window.addEventListener("pointermove",function(e){
    if(!d.on)return;
    ISO.az=(ISO.az-(e.clientX-d.x)*0.6+360)%360;
    ISO.el=Math.max(-85,Math.min(85,ISO.el+(e.clientY-d.y)*0.4));
    d.x=e.clientX;d.y=e.clientY;
    renderIso3DTo(ISO.az,ISO.el);
  });
  window.addEventListener("pointerup",function(){if(d.on){d.on=false;svg.style.cursor="grab"}});
})();
window.isoOpen=isoOpen;window.renderIso3D=renderIso3D;window.collectSolids=collectSolids;

/* ---------- Faza 3 (i18n): EN prevod UI — risba/testi ostanejo SL (namerno) ---------- */
var LANG_EN={
  h_photo:"Photo",h_cal:"Calibration",h_detect:"Automatic slat detection",h_dims:"Dimensions & parameters",
  h_sheet:"Sheet & notes",h_plan:"Installation & quantities",h_export:"Export / build",h_tloris:"Plan view (interactive)",h_skica:"Field sketch (blank sheet)",
  st1:"1 Photo",st2:"2 Calibration",st3:"3 Dimensions",st4:"4 Drawing",
  "Generiraj risbo":"Generate drawing","Povečaj":"Zoom in","Pomanjšaj":"Zoom out","Prileži":"Fit",
  "Prikaži primer":"Show example","Primeri…":"Examples…","Naloži primer risbe":"Load example drawing",
  "Odpri projekt…":"Open project…","Shrani projekt…":"Save project…","Shranjeni projekti…":"Saved projects…",
  "Kopiraj povezavo projekta":"Copy project link","Kopiraj povezavo za ogled (stranka)":"Copy view link (client)",
  "Izvozi… — možnosti izvoza":"Export…","PDF / tisk":"PDF / print","Izvozi SVG":"Export SVG","Izvozi DXF":"Export DXF","Izvozi STEP":"Export STEP",
  "Izvozi kosovnico (CSV)":"Export BOM (CSV)","Izvozi montažni načrt (CSV)":"Export installation plan (CSV)",
  "Izvozi rezalni načrt (CSV)":"Export cut plan (CSV)","Izvozi predračun (CSV)":"Export quote (CSV)",
  "Izvozi naročilnik (TXT)":"Export order (TXT)","Izvozi montažni checklist (TXT)":"Export checklist (TXT)",
  "Izvozi tehnični list materiala (TXT)":"Export material data sheet (TXT)","Izvozi povpraševanje Roksal (TXT)":"Export Roksal enquiry (TXT)",
  "Izračunaj rezalni načrt (kerf)":"Calculate cut plan (kerf)","Pripravi montažni checklist":"Prepare installation checklist",
  "Pripravi montažni načrt":"Prepare installation plan","Samoprevera (126 kombinacij)":"Self-test (126 combinations)",
  "Plošča ▾":"Panels ▾","Prednastavitve sistema":"System presets","Odpri sklop":"Open section","Vidnost":"Visibility","Vidni sklopi in polja…":"Visible sections & fields…",
  "Možnosti izvoza":"Export options","Prednastavitve":"Presets","Celotna dokumentacija":"Full documentation",
  "Za delavnico":"For workshop","Za naročilo":"For order","Samo risba":"Drawing only",
  "Prekliči":"Cancel","Izvozi":"Export",
  "Shranjeni projekti":"Saved projects","Shrani trenutni projekt":"Save current project","Deljenje":"Sharing",
  "Primeri risb":"Drawing examples","Prenesi PDF":"Download PDF","Uredi projekt":"Edit project",
  "Front":"Front","Rear":"Rear","Left":"Left","Right":"Right","Top":"Top","Reset":"Reset",
  "Prilepite z":"Paste with"
};
function lngGet(){try{return localStorage.getItem("draftwright-lang")||"sl"}catch(e){return"sl"}}
function applyLang(lang){
  document.documentElement.setAttribute("lang",lang==="en"?"en":"sl");
  [].slice.call(document.querySelectorAll("[data-i18n]")).forEach(function(el){
    var k=el.getAttribute("data-i18n"),v=LANG_EN[k];
    if(lang==="en"&&v){
      if(!el.__i18nOrig)el.__i18nOrig=el.innerHTML;
      var iEl=el.querySelector("i");
      el.innerHTML=iEl?"<i>"+iEl.textContent+"</i>"+v:v;
    }else if(lang==="sl"&&el.__i18nOrig){el.innerHTML=el.__i18nOrig;delete el.__i18nOrig}
  });
  if(lang==="en"){
    [].slice.call(document.querySelectorAll("button,.mi,.label,span,div,p")).forEach(function(el){
      if(el.children.length||el.querySelector("svg")||el.querySelector("input")||el.querySelector("select"))return;
      var t=(el.textContent||"").trim();
      if(!t||t.length>60)return;
      var v=LANG_EN[t];
      if(v&&!el.__i18nOrig){el.__i18nOrig=document.createTextNode(el.textContent);el.textContent=v}
    });
  }else{
    [].slice.call(document.querySelectorAll("*")).forEach(function(el){
      if(el.__i18nOrig){el.textContent=el.__i18nOrig.nodeValue;delete el.__i18nOrig}
    });
  }
  var lb=$("langBtn");if(lb)lb.textContent=(lang==="en"?"SL":"EN");
}
applyLang(lngGet());
$("langBtn").onclick=function(){
  var nxt=lngGet()==="en"?"sl":"en";
  try{localStorage.setItem("draftwright-lang",nxt)}catch(e){}
  applyLang(nxt);
  toast(nxt==="en"?"Interface switched to English":"Vmesnik preklopljen v slovenščino","ok");
};
window.applyLang=applyLang;

/* ---------- Pomoč za laike: "Kako začeti" (4 interaktivni koraki) ---------- */
function openHelp(){if($("expOverlay").classList.contains("on"))return;$("helpNote").textContent="";$("helpOverlay").classList.add("on")}
function closeHelp(){$("helpOverlay").classList.remove("on")}
$("helpBtn").onclick=openHelp;
$("helpClose").onclick=closeHelp;
$("helpOverlay").addEventListener("click",function(e){if(e.target===this)closeHelp()});
document.addEventListener("keydown",function(e){if($("helpOverlay").classList.contains("on")&&e.key==="Escape")closeHelp()});
$("openHelp").onclick=openHelp; /* hook: meni, empty state (data-call="openHelp") */
$("helpFile").onclick=function(){var f=$("file");if(f)f.click()};
$("helpDetect").onclick=function(){var d=$("detect");if(d)d.click()};
$("helpGen").onclick=function(){var g=$("gen");if(g)g.click()};
[].slice.call(document.querySelectorAll("#helpOverlay .exp-sec-h")).forEach(function(b){
  b.addEventListener("click",function(){b.parentNode.classList.toggle("open")});
});
window.openHelp=openHelp;window.closeHelp=closeHelp;

/* P3: PWA — namestljiva aplikacija, deluje brez signala (service worker, stale-while-revalidate).
   Registracija samo prek https (Vercel) oz. localhost; file:// in jsdom preskočita. */
if("serviceWorker" in navigator&&(window.location.protocol==="https:"||window.location.hostname==="localhost")){
  var hadController=!!navigator.serviceWorker.controller,refreshing=false;
  navigator.serviceWorker.addEventListener("controllerchange",function(){
    if(refreshing||!hadController)return;refreshing=true;window.location.reload();
  });
  function showUpdateBanner(worker){
    if(document.getElementById("swUpdate"))return;
    var b=document.createElement("div");b.id="swUpdate";
    b.setAttribute("role","status");
    b.style.cssText="position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;background:var(--panel);color:var(--tx);border:1px solid var(--ac);border-radius:8px;padding:10px 14px;box-shadow:0 8px 24px rgba(0,0,0,.35);font:14px system-ui,sans-serif";
    b.innerHTML='<span>Na voljo je nova različica aplikacije. </span>';
    var btn=document.createElement("button");btn.type="button";btn.textContent="Posodobi";
    btn.style.cssText="margin-left:10px;background:var(--ac);color:#fff;border:0;border-radius:5px;padding:5px 10px;cursor:pointer";
    btn.onclick=function(){worker.postMessage({type:"SKIP_WAITING"});btn.disabled=true;btn.textContent="Posodabljam…"};
    b.appendChild(btn);document.body.appendChild(b);
  }
  navigator.serviceWorker.register("sw.js").then(function(reg){
    reg.addEventListener("updatefound",function(){
      var nw=reg.installing;if(!nw)return;
      nw.addEventListener("statechange",function(){if(nw.state==="installed"&&navigator.serviceWorker.controller)showUpdateBanner(nw)});
    });
  }).catch(function(){});
}

/* ---------- UI/UX: stepper, zoom, quick actions, drop target ---------- */
var zoom=100;
function syncSteps(){
  var ref=!!($("refMode")&&$("refMode").checked);
  var done=[!!S.img||ref,!!S.calibrated||ref,n("L")>0&&n("H")>0&&n("D")>0,!!svgEl()];
  var cur=done.indexOf(false);if(cur<0)cur=3;
  [].forEach.call($("steps").children,function(el,i){el.className=(done[i]?"done":"")+(i===cur?" cur":"")});
}
function applyZoom(){var sv=svgEl();if(sv){sv.style.width=zoom+"%";sv.style.height="auto"}$("zoomVal").textContent=zoom+"%"}
function setZoom(v){zoom=Math.max(50,Math.min(200,v));applyZoom()}
function showExample(){
  invalidateProduction();
  $("refMode").checked=true;
  [["L",3800],["H",1200],["D",1200],["n",16],["zoneTop",120],["zoneMid",800],["zoneBot",120],["zoneBase",60],["innerD",1160]].forEach(function(p){$(p[0]).value=p[1]});
  checks();generate();syncSteps();
  $("prev").scrollIntoView({behavior:"smooth",block:"start"});
}
new MutationObserver(function(){applyZoom();syncSteps()}).observe($("prev"),{childList:true});
$("zoomOut").onclick=function(){setZoom(zoom-10)};
$("zoomIn").onclick=function(){setZoom(zoom+10)};
$("zoomFit").onclick=function(){setZoom(100)};
$("showExample").onclick=showExample;
if($("emptyExample"))$("emptyExample").onclick=showExample; /* element obstaja le v praznem stanju #prev — restore/generate ga odstrani */
$("genQuick").onclick=generate;
$("dlSvgQuick").onclick=function(){$("dlSvg").click()};
$("prtQuick").onclick=function(){$("prt").click()};
var mn=document.querySelector("main");
["dragenter","dragover"].forEach(function(t){mn.addEventListener(t,function(e){e.preventDefault();mn.classList.add("drop")})});
["dragleave","drop"].forEach(function(t){mn.addEventListener(t,function(e){e.preventDefault();mn.classList.remove("drop")})});
mn.addEventListener("drop",function(e){if(e.dataTransfer.files[0])loadPhoto(e.dataTransfer.files[0])});

/* ---------- toolbar menus ---------- */
(function(){
  var menus=[].slice.call(document.querySelectorAll('[data-menu]'));
  function closeMenus(ex){menus.forEach(function(m){if(m!==ex)m.classList.remove('open')});}
  menus.forEach(function(m){
    var btn=m.querySelector(':scope > button');
    if(btn)btn.addEventListener('click',function(e){e.stopPropagation();var open=m.classList.contains('open');closeMenus();if(!open)m.classList.add('open');});
    var drop=m.querySelector('.drop');
    if(drop)drop.addEventListener('click',function(e){e.stopPropagation();});
  });
  document.addEventListener('click',function(){closeMenus();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenus();});

  function call(id){
    var el=$(id); if(!el) return;
    if(id==='zoomIn'){setZoom(zoom+10);return;}
    if(id==='zoomOut'){setZoom(zoom-10);return;}
    if(id==='zoomFit'){setZoom(100);return;}
    if(typeof el.click==='function') el.click();
  }
  [].slice.call(document.querySelectorAll('[data-call]')).forEach(function(b){
    b.addEventListener('click',function(e){e.preventDefault();call(b.getAttribute('data-call'));closeMenus();});
  });
  [].slice.call(document.querySelectorAll('[data-mode]')).forEach(function(b){
    b.addEventListener('click',function(e){e.preventDefault();var m=b.getAttribute('data-mode'); setMode(m==='expert'); if(typeof updateModeTicks==='function') updateModeTicks(); closeMenus();});
  });
  [].slice.call(document.querySelectorAll('[data-preset]')).forEach(function(b){
    b.addEventListener('click',function(e){e.preventDefault();applyPreset(b.getAttribute('data-preset')); closeMenus();});
  });
  var rm=$('refModeMenu'); if(rm){ rm.addEventListener('change',function(){$('refMode').checked=rm.checked; checks();}); }

  var _setMode=setMode;
  window.updateModeTicks=function(){
    var g=$('tickGuided'),e=$('tickExpert'); if(!g||!e) return;
    var ex=document.querySelector('aside') && document.querySelector('aside').className.indexOf('guided')===-1;
    g.textContent=ex?'':'●'; e.textContent=ex?'●':'';
  };
  setMode=function(expert){_setMode(expert); if(typeof updateModeTicks==='function') updateModeTicks();};

  /* aside show/hide — predal se odpre iz menijske vrstice; ob skritju se konča tudi poglobljeni način */
  function setAsideVisible(visible){
    document.body.classList.toggle('aside-hidden', !visible);
    if(!visible) document.body.classList.remove('canvas-focus');
    var b=$('toggleAside'), t=$('asideTick');
    if(b) b.childNodes[0].nodeValue = visible ? 'Skrij stransko ploščo ' : 'Pokaži stransko ploščo ';
    if(t) t.textContent = visible ? '●' : '';
    try{ localStorage.setItem('tehnicka-risba-pro-aside', visible ? 'visible' : 'hidden'); }catch(e){}
  }
  window.setAsideVisible = setAsideVisible;

  /* Poglobljeni način: skica in tloris se odpreta kot veliko prekrivno platno (≥ polovica zaslona) */
  function setCanvasFocus(on){
    document.body.classList.toggle('canvas-focus', !!on);
  }
  function closeDrawer(){
    setAsideVisible(false);
  }

  /* Panel chooser: open one section from the top toolbar (Figma-style tabs + VS Code view picker) */
  var PANEL_GROUPS={
    photo:["photo"], cal:["cal"], detect:["detect"],
    dims:["system","main","zones","advanced"],
    sheet:["sheet"], plan:["plan"], export:["export"], tloris:["tloris"], skica:["skica"]
  };
  var PANEL_LABELS={photo:"Slika",cal:"Umeritev",detect:"Zaznavanje lamel",dims:"Mere in parametri",sheet:"List in opombe",plan:"Montaža in količine",export:"Izdelava"};
  function markPanelActive(key){
    [].slice.call(document.querySelectorAll('[data-goto]')).forEach(function(b){
      b.classList.toggle('active',b.getAttribute('data-goto')===key);
    });
    [].slice.call(document.querySelectorAll('aside section[data-panel]')).forEach(function(s){
      s.classList.toggle('panel-active',s.getAttribute('data-panel')===key);
    });
  }
  function openPanel(key){
    setAsideVisible(true);
    setCanvasFocus(key==='tloris'||key==='skica');
    var secs=[].slice.call(document.querySelectorAll('aside section[data-panel]'));
    if(key==='all'){
      secs.forEach(function(s){s.classList.remove('collapsed')});
      markPanelActive('all');
      $("globalStatus").textContent="Prikazani vsi vidni sklopi.";
      return;
    }
    var target=secs.filter(function(s){return s.getAttribute('data-panel')===key})[0];
    if(!target)return;
    (PANEL_GROUPS[key]||[]).forEach(function(g){
      var box=document.querySelector('[data-fg="'+g+'"]');
      if(box&&!box.checked)box.checked=true;
    });
    applyFieldVisibility();
    secs.forEach(function(s){s.classList.toggle('collapsed',s!==target)});
    target.classList.remove('collapsed');
    markPanelActive(key);
    $("globalStatus").textContent="Odprt sklop: "+(PANEL_LABELS[key]||key)+".";
    try{ target.scrollIntoView({block:'start',behavior:'smooth'}); }catch(e){}
  }
  window.openPanel=openPanel;
  [].slice.call(document.querySelectorAll('[data-goto]')).forEach(function(b){
    b.addEventListener('click',function(e){
      e.preventDefault();openPanel(b.getAttribute('data-goto'));closeMenus();
      if(b.getAttribute('data-goto')==='tloris')tlrRender();
      if(b.getAttribute('data-goto')==='skica')skRender();
    });
  });
  document.addEventListener('keydown',function(e){
    if(!e.altKey||(e.key!=='p'&&e.key!=='P'))return;
    var tag=(document.activeElement&&document.activeElement.tagName)||'';
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    e.preventDefault();
    var pm=document.querySelector('.panelmenu');if(!pm)return;
    var open=pm.classList.contains('open');closeMenus();if(!open)pm.classList.add('open');
  });

  var tgl=$('toggleAside'); if(tgl) tgl.addEventListener('click', function(e){ e.preventDefault(); setAsideVisible(document.body.classList.contains('aside-hidden')); closeMenus(); });
  var sh=$('showAside'); if(sh) sh.addEventListener('click', function(){ setAsideVisible(document.body.classList.contains('aside-hidden')); }); /* P3: na mobilnem toggle (odpre/zapre predal) */
  var scrim=$('asideScrim'); if(scrim) scrim.addEventListener('click', closeDrawer);
  var fclose=$('focusClose'); if(fclose) fclose.addEventListener('click', closeDrawer);
  /* Privzeto je stranski panel skrit — odpre se samo na zahtevo iz menijske vrstice (canvas-first) */
  try{ var as=localStorage.getItem('tehnicka-risba-pro-aside'); setAsideVisible(as==='visible'); }catch(e){ setAsideVisible(false); }
})();
