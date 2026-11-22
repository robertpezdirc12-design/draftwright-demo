// Draftwright — modul 01-input-calibration (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
var S={img:null,calMode:"linear",cal:null,calibrated:false,picking:false,tmp:[],lines:[],photoData:null,det:null,drag:null};
/* ---------- image input ---------- */
function loadPhoto(file){
  var r=new FileReader();
  r.onload=function(){S.photoData=r.result;var im=new Image();im.onload=function(){S.img=im;S.cal=null;S.calibrated=false;S.tmp=[];S.raw=null;S.lines=[];S.rectCache=null;$("img").src=im.src;$("ov").setAttribute("viewBox","0 0 "+im.naturalWidth+" "+im.naturalHeight);$("photoBox").classList.add("on");drawOverlay();st("Slika naložena. Izberite umeritev.","")};im.src=r.result};
  r.readAsDataURL(file);
}
$("file").onchange=function(e){if(e.target.files[0])loadPhoto(e.target.files[0])};
document.addEventListener("paste",function(e){var it=(e.clipboardData||{}).items||[];for(var i=0;i<it.length;i++)if(it[i].type.indexOf("image/")===0){loadPhoto(it[i].getAsFile());e.preventDefault();return}});
$("photoBox").addEventListener("dragover",function(e){e.preventDefault()});
$("photoBox").addEventListener("drop",function(e){e.preventDefault();if(e.dataTransfer.files[0])loadPhoto(e.dataTransfer.files[0])});

/* ---------- calibration math ---------- */
function solve(A,b){var i,j,c,p,d,t,nn=b.length,M=A.map(function(r,k){return r.concat([b[k]])});for(c=0;c<nn;c++){p=c;for(i=c+1;i<nn;i++)if(Math.abs(M[i][c])>Math.abs(M[p][c]))p=i;if(Math.abs(M[p][c])<1e-12)throw new Error("Točke so izrojene.");t=M[c];M[c]=M[p];M[p]=t;d=M[c][c];for(j=c;j<=nn;j++)M[c][j]/=d;for(i=0;i<nn;i++){if(i===c)continue;var q=M[i][c];if(Math.abs(q)<1e-15)continue;for(j=c;j<=nn;j++)M[i][j]-=q*M[c][j]}}return M.map(function(r){return r[nn]})}
function homography(src,dst){var A=[],b=[];src.forEach(function(p,i){var X=dst[i].x,Y=dst[i].y,u=p.x,v=p.y;A.push([u,v,1,0,0,0,-u*X,-v*X]);b.push(X);A.push([0,0,0,u,v,1,-u*Y,-v*Y]);b.push(Y)});var h=solve(A,b);return[h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1]}
function toMM(p){
  if(!S.calibrated)return null;
  if(S.calMode==="linear"){var c=S.cal,dx=p.x-c.a.x,dy=p.y-c.a.y;return{x:(dx*c.cos+dy*c.sin)*c.scale,y:(-dx*c.sin+dy*c.cos)*c.scale}}
  var h=S.cal.h,u=p.x,v=p.y,d=h[6]*u+h[7]*v+h[8];return{x:(h[0]*u+h[1]*v+h[2])/d,y:(h[3]*u+h[4]*v+h[5])/d};
}
function mmDist(a,b){if(!S.calibrated)return 0;var p=toMM(a),q=toMM(b);return Math.hypot(q.x-p.x,q.y-p.y)}
function pxPerMM(){return S.calibrated?1/S.cal.scale:0}

/* ---------- overlay ---------- */
function drawOverlay(){
  var ov=$("ov");if(!S.img){ov.innerHTML="";return}
  var W=S.img.naturalWidth,H=S.img.naturalHeight,w=Math.max(2,W/500);ov.setAttribute("viewBox","0 0 "+W+" "+H);
  var s="";
  if(S.det&&S.det.lines&&S.det.lines.length&&!S.det.rectK){
    var cc=S.det.cx||W/2;
    S.det.lines.forEach(function(L){
      var tg=Math.tan((L.ang||0)*Math.PI/180);
      s+='<line x1="0" y1="'+(L.y0-tg*cc)+'" x2="'+W+'" y2="'+(L.y0+tg*(W-cc))+'" stroke="#4ade80" stroke-width="'+(w*0.55)+'" stroke-opacity="0.75"/>';
    });
    if(S.det.bbox){var b=S.det.bbox;s+='<rect x="'+b.x0+'" y="'+b.y0+'" width="'+(b.x1-b.x0)+'" height="'+(b.y1-b.y0)+'" fill="none" stroke="#60a5fa" stroke-width="'+w+'" stroke-dasharray="'+(w*3)+' '+(w*2)+'"/>'}
  }
  if(S.calibrated){
    if(S.calMode==="linear")s+='<line x1="'+S.cal.a.x+'" y1="'+S.cal.a.y+'" x2="'+S.cal.b.x+'" y2="'+S.cal.b.y+'" stroke="#fbbf24" stroke-width="'+w+'"/>';
    else{var q=S.cal.corners.concat([S.cal.corners[0]]);s+='<polyline points="'+q.map(function(p){return p.x+","+p.y}).join(" ")+'" fill="none" stroke="#fbbf24" stroke-width="'+w+'"/>'}
  }
  if(S.tmp.length){
    s+='<polyline points="'+S.tmp.map(function(p){return p.x+","+p.y}).join(" ")+'" fill="none" stroke="#60a5fa" stroke-width="'+w+'"/>';
    S.tmp.forEach(function(p){s+='<circle cx="'+p.x+'" cy="'+p.y+'" r="'+(w*2)+'" fill="#60a5fa"/>'});
  }
  ov.innerHTML=s;
}
function ovPoint(e){var r=$("ov").getBoundingClientRect();return{x:(e.clientX-r.left)*S.img.naturalWidth/r.width,y:(e.clientY-r.top)*S.img.naturalHeight/r.height}}
$("ov").addEventListener("click",function(e){if(!S.img||!S.picking)return;var need=S.calMode==="linear"?2:4;S.tmp.push(ovPoint(e));if(S.tmp.length>=need){S.raw=S.tmp.slice();S.tmp=[];S.picking=false;$("pickCal").classList.remove("on");st("Točke izbrane. Vpišite resnične mere in potrdite.","")}else st("Točk še "+(need-S.tmp.length)+".","warn");drawOverlay()});
$("mLinear").onclick=function(){S.calMode="linear";S.calibrated=false;S.tmp=[];$("mLinear").classList.add("on");$("mPlane").classList.remove("on");$("refBWrap").style.display="none";st("Način: 2 točki.","");drawOverlay()};
$("mPlane").onclick=function(){S.calMode="plane";S.calibrated=false;S.tmp=[];$("mPlane").classList.add("on");$("mLinear").classList.remove("on");$("refBWrap").style.display="block";st("Način: 4 točke.","");drawOverlay()};
$("pickCal").onclick=function(){if(!S.img){st("Najprej naložite sliko.","bad");return}S.picking=true;S.tmp=[];$("pickCal").classList.add("on");st("Kliknite referenčne točke na sliki.","warn")};
$("clearCal").onclick=function(){S.cal=null;S.calibrated=false;S.tmp=[];S.raw=null;S.lines=[];st("Umeritev počiscena.","");drawOverlay()};
$("applyCal").onclick=function(){
  var a=parseFloat(V("refA"));if(!(a>0)){st("Vpišite resnično dolžino.","bad");return}
  if(!S.raw){st("Najprej izberite točke.","bad");return}
  try{
    if(S.calMode==="linear"){
      if(S.raw.length<2)throw new Error("Potrebni sta 2 točki.");
      var p=S.raw[0],q=S.raw[1],dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy);
      if(len<3)throw new Error("Točki sta preblizu.");
      S.cal={a:p,b:q,scale:a/len,cos:dx/len,sin:dy/len};
    }else{
      if(S.raw.length<4)throw new Error("Potrebne so 4 točke.");
      /* Faza 1 (Issue #2 §5 P1): validacija kalibracije — površina, vrstni red, samopresekanje */
      var cs4=S.raw,area=0;
      for(var k3=0;k3<4;k3++){var q1=cs4[k3],q2=cs4[(k3+1)%4];area+=(q1.x*q2.y-q2.x*q1.y)/2}
      if(Math.abs(area)<2000)throw new Error("Kalibracijska površina je premajhna ("+Math.round(Math.abs(area))+" px²) — kliknite vogale ograje.");
      function xseg(p1,p2,p3,p4){
        var d1x=p2.x-p1.x,d1y=p2.y-p1.y,d2x=p4.x-p3.x,d2y=p4.y-p3.y,den=d1x*d2y-d1y*d2x;
        if(Math.abs(den)<1e-9)return false;
        var t=((p3.x-p1.x)*d2y-(p3.y-p1.y)*d2x)/den,u=((p3.x-p1.x)*d1y-(p3.y-p1.y)*d1x)/den;
        return (t>=-0.02&&t<=1.02&&u>=-0.02&&u<=1.02);
      }
      if(!xseg(cs4[0],cs4[2],cs4[1],cs4[3]))throw new Error("Vogali niso v pravilnem vrstnem redu ali so samosekajoči — kliknite: levo zgoraj, desno zgoraj, desno spodaj, levo spodaj.");
      var b=parseFloat(V("refB"));if(!(b>0))throw new Error("Vpišite resnično višino.");
      S.cal={corners:S.raw,h:homography(S.raw,[{x:0,y:0},{x:a,y:0},{x:a,y:b},{x:0,y:b}])}
    }
    S.calibrated=true;S.rectCache=null;st("Umeritev uspešna: "+f(a)+" mm referenca.","");drawOverlay();toast("Umeritev uspešna: "+f(a)+" mm referenca","ok");
  }catch(err){st(err.message,"bad")}
};
