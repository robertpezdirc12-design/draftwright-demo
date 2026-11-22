// Draftwright — modul 12-tloris (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
/* ---------- Faza 5 (Issue #10 pogl. 10): interaktivni tloris trase ograje ----------
   Arhitektura (arhitekturno poročilo): SVG platno + snapshot undo/redo; model mm, 1 px = 10 mm;
   nosilci izpeljani prek roksalLimit na segment; enosmerno plan → polja (Uporabi v izračun). */
var TLR={walls:[],anchor:null,undo:[],redo:[]};
var TL_PX2MM=10,TL_W=600,TL_H=400;
function tlrPushUndo(){TLR.undo.push(JSON.stringify({w:TLR.walls,a:TLR.anchor}));if(TLR.undo.length>50)TLR.undo.shift();TLR.redo=[]}
function tlrPosts(len){var p3=WC[$("sysProfile").value]||WC.romb67,l3=roksalLimit(p3,V("sysUse"),n("H"));return Math.max(2,Math.ceil(len/Math.max(1,l3.v))+1)}
function tlrRender(){
  var svg=$("tlorisSvg");if(!svg)return;
  var grid=10,i,x,y,s="";
  for(x=grid;x<TL_W;x+=grid)s+='<line x1="'+x+'" y1="0" x2="'+x+'" y2="'+TL_H+'" stroke="#1c1c1a" stroke-width="1"/>';
  for(y=grid;y<TL_H;y+=grid)s+='<line x1="0" y1="'+y+'" x2="'+TL_W+'" y2="'+y+'" stroke="#1c1c1a" stroke-width="1"/>';
  TLR.walls.forEach(function(w3,idx){
    var x1=w3.x1/TL_PX2MM,y1=w3.y1/TL_PX2MM,x2=w3.x2/TL_PX2MM,y2=w3.y2/TL_PX2MM;
    var len=Math.hypot(w3.x2-w3.x1,w3.y2-w3.y1),np=tlrPosts(len);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+(idx===TLR.walls.length-1?"var(--ac)":"#e9e7dd")+'" stroke-width="3"/>';
    for(var k3=0;k3<np;k3++){
      var t3=np>1?k3/(np-1):0;
      s+='<rect x="'+(x1+(x2-x1)*t3-2)+'" y="'+(y1+(y2-y1)*t3-2)+'" width="4" height="4" fill="#8aa86a"/>';
    }
    s+='<text x="'+((x1+x2)/2)+'" y="'+((y1+y2)/2-4)+'" font-size="9" fill="#e0a44c" text-anchor="middle">'+f(len)+' mm · '+np+' nos.</text>';
    s+='<circle cx="'+x1+'" cy="'+y1+'" r="3" fill="#e9e7dd"/>';
  });
  if(TLR.walls.length){var last=TLR.walls[TLR.walls.length-1];s+='<circle cx="'+(last.x2/TL_PX2MM)+'" cy="'+(last.y2/TL_PX2MM)+'" r="4" fill="var(--ac)"/>'}
  if(TLR.anchor)s+='<circle cx="'+(TLR.anchor.x/TL_PX2MM)+'" cy="'+(TLR.anchor.y/TL_PX2MM)+'" r="4" fill="var(--ac)"/>';
  svg.innerHTML=s;
  var total=TLR.walls.reduce(function(a,w4){return a+Math.hypot(w4.x2-w4.x1,w4.y2-w4.y1)},0);
  $("tlorisStatus").textContent=TLR.walls.length?("Segmentov: "+TLR.walls.length+" · skupna dolžina: "+f(total)+" mm"+(TLR.anchor?" · trasa v teku (Escape zaključi)":"")):"Trasa prazna — kliknite za prvo oglišče.";
  $("tlorisUndo").disabled=!TLR.undo.length;$("tlorisRedo").disabled=!TLR.redo.length;
}
function tlrUndo(){if(!TLR.undo.length)return;TLR.redo.push(JSON.stringify({w:TLR.walls,a:TLR.anchor}));var st2=JSON.parse(TLR.undo.pop());TLR.walls=st2.w;TLR.anchor=st2.a;tlrRender()}
function tlrRedo(){if(!TLR.redo.length)return;TLR.undo.push(JSON.stringify({w:TLR.walls,a:TLR.anchor}));var st3=JSON.parse(TLR.redo.pop());TLR.walls=st3.w;TLR.anchor=st3.a;tlrRender()}
/* En vir za SVG tlorisa — dolžine so v mm (TLR.walls so v px, 1 px = 10 mm). */
function tlorisSvgString(){
  if(!TLR.walls.length)return "";
  var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600mm" height="400mm">';
  s+='<rect width="600" height="400" fill="#fff"/>';
  for(var gx=10;gx<600;gx+=10)s+='<line x1="'+gx+'" y1="0" x2="'+gx+'" y2="400" stroke="#e5e5e5" stroke-width="0.5"/>';
  for(var gy=10;gy<400;gy+=10)s+='<line x1="0" y1="'+gy+'" x2="600" y2="'+gy+'" stroke="#e5e5e5" stroke-width="0.5"/>';
  TLR.walls.forEach(function(w6){
    var x1=w6.x1/TL_PX2MM,y1=w6.y1/TL_PX2MM,x2=w6.x2/TL_PX2MM,y2=w6.y2/TL_PX2MM;
    var len6=Math.hypot(w6.x2-w6.x1,w6.y2-w6.y1),np6=tlrPosts(len6);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#111" stroke-width="3"/>';
    for(var k6=0;k6<np6;k6++){var t6=np6>1?k6/(np6-1):0;
      s+='<rect x="'+(x1+(x2-x1)*t6-2)+'" y="'+(y1+(y2-y1)*t6-2)+'" width="4" height="4" fill="#111"/>';}
    s+='<text x="'+((x1+x2)/2)+'" y="'+((y1+y2)/2-4)+'" font-size="9" font-family="Arial" fill="#111" text-anchor="middle">'+f(len6)+' mm · '+np6+' nos.</text>';
  });
  s+='<text x="10" y="12" font-size="10" font-family="Arial" fill="#111">TLORIS OGRAJE — '+E(V("proj"))+' · '+E(V("drw"))+' · '+E(V("date"))+'</text>';
  return s+'</svg>';
}
  var svg=$("tlorisSvg");
  svg.addEventListener("click",function(e){
    KBD.last="tloris"; /* označi platno kot aktivno (podprti tudi sintetični / a11y kliki brez pointerdown) */
    var r=this.getBoundingClientRect();
    var mx=Math.round((e.clientX-r.left)*TL_W/r.width*TL_PX2MM),my=Math.round((e.clientY-r.top)*TL_H/r.height*TL_PX2MM);
    mx=Math.max(0,Math.min(TL_W*TL_PX2MM,mx));my=Math.max(0,Math.min(TL_H*TL_PX2MM,my));
    tlrPushUndo();
    if(TLR.anchor){TLR.walls.push({x1:TLR.anchor.x,y1:TLR.anchor.y,x2:mx,y2:my})}
    TLR.anchor={x:mx,y:my};
    tlrRender();
  });
  $("tlorisUndo").onclick=tlrUndo;
  $("tlorisRedo").onclick=tlrRedo;
  $("tlorisClear").onclick=function(){if(!TLR.walls.length&&!TLR.anchor)return;tlrPushUndo();TLR.walls=[];TLR.anchor=null;tlrRender()};
  $("btnTlorisSvg").onclick=function(){
    var s=tlorisSvgString();
    if(!s){$("tlorisStatus").textContent="Trasa je prazna — nič za izvoz.";return}
    saveBlob(V("drw")+"-tloris.svg",s,"image/svg+xml;charset=utf-8");
    $("tlorisStatus").textContent="Tloris izvožen: "+V("drw")+"-tloris.svg";
  };
  $("tlorisApply").onclick=function(){
    var total=TLR.walls.reduce(function(a,w5){return a+Math.hypot(w5.x2-w5.x1,w5.y2-w5.y1)},0);
    if(total<=0){$("tlorisStatus").textContent="Trasa je prazna — nič ni preneseno v izračun.";return}
    $("L").value=String(Math.round(total));
    $("L").dispatchEvent(new Event("input",{bubbles:true})); // input → invalidateProduction + applySystem
    $("tlorisStatus").textContent="Dolžina "+f(total)+" mm prenesena v polje L — pritisnite Generiraj.";
    $("globalStatus").textContent="Tloris → izračun: L = "+f(total)+" mm ("+TLR.walls.length+" segmentov).";
  };
