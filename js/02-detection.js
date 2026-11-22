// Draftwright — modul 02-detection (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
/* ---------- automatic slat detection (tilt tolerant) ---------- */
function grayOf(im){
  if(im&&im.__imageData){ /* Faza 2.5: rektificiran pregled — piksli že na voljo (brez drawImage) */
    var src2=im.__imageData,scR=Math.min(1,900/src2.width),w=Math.max(1,Math.round(src2.width*scR)),h=Math.max(1,Math.round(src2.height*scR));
    var gray=new Float32Array(w*h);
    for(var y2=0;y2<h;y2++)for(var x2=0;x2<w;x2++){
      var sx=Math.min(src2.width-1,Math.round(x2/scR)),sy=Math.min(src2.height-1,Math.round(y2/scR)),i4=(sy*src2.width+sx)*4;
      gray[y2*w+x2]=0.299*src2.data[i4]+0.587*src2.data[i4+1]+0.114*src2.data[i4+2];
    }
    return{gray:gray,w:w,h:h,sc:scR};
  }
  var sc=Math.min(1,900/im.naturalWidth),w=Math.max(1,Math.round(im.naturalWidth*sc)),h=Math.max(1,Math.round(im.naturalHeight*sc));
  var c=document.createElement("canvas");c.width=w;c.height=h;var g=c.getContext("2d");g.drawImage(im,0,0,w,h);
  var d=g.getImageData(0,0,w,h).data,gray=new Float32Array(w*h);
  for(var i=0;i<w*h;i++)gray[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
  return{gray:gray,w:w,h:h,sc:sc};
}
function profiles(g,ang,cx){
  var tan=Math.tan(ang*Math.PI/180),rows=new Float64Array(g.h),cols=new Float64Array(g.w),cnt=new Float64Array(g.h),i,y,x,yy;
  for(x=Math.floor(g.w*0.1);x<Math.ceil(g.w*0.9);x+=3){
    for(y=2;y<g.h-2;y++){
      yy=Math.round(y+tan*(x-cx));if(yy<2||yy>g.h-3)continue;
      rows[y]+=Math.abs(g.gray[(yy+1)*g.w+x]-g.gray[(yy-1)*g.w+x]);cnt[y]++;
    }
  }
  for(y=2;y<g.h-2;y++)rows[y]/=Math.max(1,cnt[y]);
  for(yy=Math.floor(g.h*0.12);yy<Math.ceil(g.h*0.88);yy+=3)for(x=2;x<g.w-2;x++)cols[x]+=Math.abs(g.gray[yy*g.w+x+1]-g.gray[yy*g.w+x-1]);
  return{rows:rows,cols:cols};
}
function peakList(arr,thr,sep){
  var out=[];
  for(var i=2;i<arr.length-2;i++){
    if(arr[i]>thr&&arr[i]>=arr[i-1]&&arr[i]>=arr[i+1]){
      if(!out.length||i-out[out.length-1].i>sep)out.push({i:i,v:arr[i]});
      else if(arr[i]>out[out.length-1].v)out[out.length-1]={i:i,v:arr[i]};
    }
  }
  return out;
}
function stats(arr){
  var m=0,c=0,i;for(i=3;i<arr.length-3;i++){m+=arr[i];c++}m/=Math.max(1,c);
  var v=0;for(i=3;i<arr.length-3;i++)v+=(arr[i]-m)*(arr[i]-m);
  return{m:m,sd:Math.sqrt(v/Math.max(1,c))};
}
function applyDetection(){
  invalidateProduction();
  if(!S.det||S.det.lines.length<2)return;
  S.det.suggestedProfile=null;
  var sb=$("applySuggestedProf");if(sb)sb.style.display="none";
  var sc=S.det.sc,cx=S.det.cx,lines=S.det.lines,ov=S.detOverride||{};
  lines.sort(function(a,b){return a.y0-b.y0});
  /* Faza 2.5 (Issue #2 §5 P0): lamelne širine/število iz RUNOV svetlostnega profila po
     sredinskem stolpcu — pikselna resnica; robovi se izmenično razmakajo (višina/reža),
     zato štetje robov in konstanta 0,88/0,12 nista pravilna (vid audit m2-vision).
     Rektificiran pregled: obseg profila = celotna višina (kalibracijski vogali = vogali ograje). */
  var r0px,r1px;
  if(S.det.rectK){r0px=0;r1px=S.det.gray.h-1}
  else{r0px=lines[0].y0*sc;r1px=lines[lines.length-1].y0*sc}
  var prof=S.det.gray?svetlostniStolpci(S.det.gray,Math.round(cx*S.det.sc),r0px,r1px,S.det.ang):null;
  if(prof){
    S.det.profN=prof.slatN;
    if(!ov.n)$("n").value=String(prof.slatN);
    if(S.calibrated){
      var mmPerPx=S.det.rectK?1/S.det.rectK:S.cal.scale/S.det.sc; // px v gray prostoru → mm (skala + kalibracija)
      if(!ov.H)$("H").value=String(Math.round((prof.lastEndPx-prof.firstStartPx)*mmPerPx*10)/10);
      if(prof.slatMed>0&&!ov.sw)$("sw").value=String(Math.round(prof.slatMed*mmPerPx*10)/10);
      if(prof.gapMed>0&&!ov.gap)$("gap").value=String(Math.round(prof.gapMed*mmPerPx*10)/10);
      if(S.det.bbox){
        var bl=(S.det.bbox.x1-S.det.bbox.x0)*(S.det.rectK?1/S.det.rectK:mmPerPx);
        if(bl>0&&!ov.L)$("L").value=String(Math.round(bl*10)/10);
      }
      /* Faza 3 (F6): ROMB fazi 15° — vidni temni pas na fotografiji je širši od nominalne mere
         (fazi so vidni pod kotom). Korak lamel (sw+gap) je kotno neodvisen, zato: sw := nominalna
         širina iz Roksal registra, fuga := izmerjeni korak − nominalna širina. Samo kadar je
         izračunana fuga fizično smiselna (3–60 mm); sicer ostanejo izmerjene vrednosti. */
      if(prof.slatMed>0&&prof.gapMed>0&&!ov.sw&&!ov.gap){
        var pitchMm=(prof.slatMed+prof.gapMed)*mmPerPx,wp=WC[$("sysProfile").value]||null;
        if(wp&&wp.n.indexOf("ROMB")>=0){
          var gn=Math.round((pitchMm-wp.w)*10)/10;
          if(gn>=3&&gn<=60){
            $("sw").value=String(wp.w);$("gap").value=String(gn);
            S.det.nomNote="ROMB fazi 15°: vidni pas "+(Math.round(prof.slatMed*mmPerPx*10)/10)+" → nominalno "+wp.w+" mm, fuga "+gn+" mm iz koraka";
          }
        }
      }
      /* Faza 3 (AI): samodejni predlog profila — izmerjena širina lamele se primerja z Roksal
         registrom (WC); najbližji profil znotraj ±25 % → predlog + gumb za en-klik uporabo.
         To je POMOČ (ne samodejna zamenjava) — uporabnik potrdi; izmerjena širina je lahko
         popačena zaradi ROMB faz ali kota (pošteno prikazano v % odstopanja). */
      if(prof.slatMed>0&&!ov.sw){
        var wMM=Math.round(prof.slatMed*mmPerPx*10)/10;
        var bestK=null,bestP=null,bestErr=Infinity;
        Object.keys(WC).forEach(function(k){
          var p=WC[k],pw=p.w||0;
          if(!pw)return;
          var err=Math.abs(pw-wMM)/pw;
          if(err<bestErr){bestErr=err;bestK=k;bestP=p}
        });
        if(bestK&&bestP&&bestErr<=0.25){
          S.det.suggestedProfile={key:bestK,name:bestP.n,w:bestP.w,measured:wMM,err:Math.round(bestErr*100)};
          var sb2=$("applySuggestedProf");
          if(sb2){
            sb2.style.display="inline-block";
            sb2.textContent="Uporabi predlagani profil: "+bestP.n+" (izmerjeno "+f(wMM)+" mm)";
            sb2.onclick=function(){
              $("sysProfile").value=bestK;
              $("sysProfile").dispatchEvent(new Event("change",{bubbles:true}));
              sb2.style.display="none";
              toast("Profil "+bestP.n+" uporabljen — preverite mere","ok");
            };
          }
        }
      }
    }
  }
  checks();
}
["n","sw","gap","L","H"].forEach(function(id){
  $(id).addEventListener("input",function(){if(S.detOverride)S.detOverride[id]=1});
});
/* Faza 2.5 (Issue #2 §5 P0): lamelne sirine/stevilo iz RUNOV svetlostnega profila
   (pikselna resnica) — nadomešča štetje robov (robovi se izmenično razmakajo
   višina lamele/reža, zato n=robovi−1 in konstanta 0,88 nista pravilna). */
function svetlostniRazponi(g,col,r0,r1){
  var vals=[],row;
  for(row=Math.max(0,Math.round(r0));row<=Math.min(g.h-1,Math.round(r1));row++)vals.push(g.gray[row*g.w+col]);
  if(vals.length<8)return null;
  var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals);
  if(mx-mn<10)return null;
  var thr=(mn+mx)/2,dark=[],light=[],curType=vals[0]<thr?"D":"L",len=1,start=0,i;
  for(i=1;i<vals.length;i++){
    var t2=vals[i]<thr?"D":"L";
    if(t2===curType)len++;
    else{(curType==="D"?dark:light).push({len:len,start:start});curType=t2;start=i;len=1}
  }
  (curType==="D"?dark:light).push({len:len,start:start});
  function med(a){if(!a.length)return 0;var b2=a.slice().sort(function(x,y){return x.len-y.len});return b2[Math.floor(b2.length/2)].len}
  var dM=med(dark),lM=med(light);
  if(!dM||!lM)return null;
  var slat=dark,gap=light;
  if(lM>dM){slat=light;gap=dark}
  var slatMed=med(slat),slatKept=slat.filter(function(r){return Math.abs(r.len-slatMed)<=0.4*slatMed});
  var gapMed=med(gap);
  if(!slatKept.length)return null;
  var first=slatKept[0],last=slatKept[slatKept.length-1];
  return {slatN:slatKept.length,slatMed:slatMed,gapMed:gapMed,
          firstStartPx:first.start,lastEndPx:last.start+last.len};
}
/* Faza 3 (F6): večstolpčno štetje — ovire (veje, grmičje) pokvarijo posamezen stolpec;
   rezultat = mediana po 7 stolpcih (center ±10/20/30 % širine), ovirani stolpci ne zmagajo.
   Stolpci so kotno odmaknjeni (r0/r1 += dx·tan(ang), ista konvencija kot profiles()) —
   pri naklonu se lamelni robovi ne prečkajo. */
function svetlostniStolpci(g,col,r0,r1,ang){
  var t=Math.tan((ang||0)*Math.PI/180),offs=[0,-0.1,0.1,-0.2,0.2,-0.3,0.3],res=[],i;
  for(i=0;i<offs.length;i++){
    var c2=Math.round(col+offs[i]*g.w);
    if(c2<1||c2>=g.w-1)continue;
    var dr=(c2-col)*t;
    var r=svetlostniRazponi(g,c2,r0+dr,r1+dr);
    if(r&&r.slatN>0)res.push(r);
  }
  if(!res.length)return null;
  res.sort(function(a,b){return a.slatN-b.slatN});
  var medN=res[Math.floor(res.length/2)].slatN;
  var grp=res.filter(function(r){return r.slatN===medN});
  if(!grp.length)grp=[res[0]];
  function med2(arr){var a2=arr.slice().sort(function(x,y){return x-y});return a2[Math.floor(a2.length/2)]}
  return {slatN:medN,
          slatMed:med2(grp.map(function(r){return r.slatMed})),
          gapMed:med2(grp.map(function(r){return r.gapMed})),
          firstStartPx:med2(grp.map(function(r){return r.firstStartPx})),
          lastEndPx:med2(grp.map(function(r){return r.lastEndPx}))};
}
/* Faza 2.5 (Issue #2 §5): rektifikacija — pri 4-tockovni (plane) kalibraciji se slika
   preslika v frontalni pogled prek INVERZNE homografije (k px/mm), nato tece zaznava na njej.
   Odpravi vid-audit P1: perspektivna ograja je bila zaznana z -43,5 % napako H. */
function inv3(m){
  var a=m[0],b=m[1],c=m[2],d=m[3],e=m[4],f=m[5],g=m[6],h=m[7],i=m[8];
  var det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
  if(!isFinite(det)||Math.abs(det)<1e-12)return null;
  return [(e*i-f*h)/det,(c*h-b*i)/det,(b*f-c*e)/det,(f*g-d*i)/det,(a*i-c*g)/det,(c*d-a*f)/det,(d*h-e*g)/det,(b*g-a*h)/det,(a*e-b*d)/det];
}
function rectifyPlane(){
  var a=Math.max(1,n("refA")),b=Math.max(1,n("refB"));
  var k=Math.min(4,900/Math.max(a,b));
  var W=Math.max(2,Math.round(a*k)),H2=Math.max(2,Math.round(b*k));
  var hi=inv3(S.cal.h);
  if(!hi)return null;
  var src=document.createElement("canvas");src.width=S.img.naturalWidth;src.height=S.img.naturalHeight;
  var sctx=src.getContext("2d");sctx.drawImage(S.img,0,0);
  var sd=sctx.getImageData(0,0,src.width,src.height).data;
  var dst=document.createElement("canvas");dst.width=W;dst.height=H2;
  var dctx=dst.getContext("2d");
  var dd=dctx.createImageData(W,H2),out=dd.data;
  for(var v=0;v<H2;v++){
    for(var u=0;u<W;u++){
      var mmx=u/k,mmy=v/k;
      var w3=hi[6]*mmx+hi[7]*mmy+hi[8];
      if(!isFinite(w3)||Math.abs(w3)<1e-9)continue;
      var sx=(hi[0]*mmx+hi[1]*mmy+hi[2])/w3,sy=(hi[3]*mmx+hi[4]*mmy+hi[5])/w3;
      var x0=Math.floor(sx),y0=Math.floor(sy);
      if(x0<0||y0<0||x0>=src.width-1||y0>=src.height-1)continue;
      var fx=sx-x0,fy=sy-y0,i4=(y0*src.width+x0)*4;
      out[(v*W+u)*4]=sd[i4]*(1-fx)*(1-fy)+sd[i4+4]*fx*(1-fy)+sd[i4+src.width*4]*(1-fx)*fy+sd[i4+src.width*4+4]*fx*fy;
      out[(v*W+u)*4+1]=sd[i4+1]*(1-fx)*(1-fy)+sd[i4+5]*fx*(1-fy)+sd[i4+src.width*4+1]*(1-fx)*fy+sd[i4+src.width*4+5]*fx*fy;
      out[(v*W+u)*4+2]=sd[i4+2]*(1-fx)*(1-fy)+sd[i4+6]*fx*(1-fy)+sd[i4+src.width*4+2]*(1-fx)*fy+sd[i4+src.width*4+6]*fx*fy;
      out[(v*W+u)*4+3]=255;
    }
  }
  dst.__imageData=dd;
  dctx.putImageData(dd,0,0);
  return {canvas:dst,k:k};
}
$("detect").onclick=function(){
  if(!S.img){dt("Najprej naložite sliko.","bad");return}
  var rectK=0,srcIm=S.img;
  if(S.calibrated&&S.calMode==="plane"){
    var rc=rectifyPlane();
    if(rc){srcIm=rc.canvas;rectK=rc.k}
  }
  var g=grayOf(srcIm),cx=Math.round(g.w/2),sens=parseFloat(V("sens")),sep=Math.max(2,parseInt(V("minsep"),10));
  var best=null;
  for(var ang=-12;ang<=12;ang+=2){
    var p=profiles(g,ang,cx),ss=stats(p.rows),thr=ss.m+sens*ss.sd/10,pk=peakList(p.rows,thr,sep);
    if(pk.length<2)continue;
    var score=0;pk.slice(0,12).forEach(function(q){score+=q.v});score+=pk.length*ss.m;
    if(!best||score>best.score)best={ang:ang,peaks:pk,score:score,m:ss.m,sd:ss.sd,thr:thr,cols:p.cols};
  }
  if(!best){dt("Zaznava ni uspela. Zmanjšajte občutljivost ali preverite kontrast slike.","warn");return}
  var lines=best.peaks.map(function(q){return{y0:q.i/g.sc,ang:best.ang,strength:q.v,sc:g.sc}});
  /* Faza 1 (Issue #2 §5 P1): zanesljivost = konsistentnost koraka (MAD razlik / mediana), ne prejšnja
     formula, ki je bila empirično vedno ~99 % tudi pri katastrofalnih zaznavah (vid audit m2-vision). */
  var dArr=[];for(var di=1;di<lines.length;di++)dArr.push(Math.abs(lines[di].y0-lines[di-1].y0));
  dArr.sort(function(a,b){return a-b});
  var medD=dArr.length?dArr[Math.floor(dArr.length/2)]:0,madD=0;
  dArr.forEach(function(d){madD+=Math.abs(d-medD)});madD/=Math.max(1,dArr.length);
  var conf=Math.max(5,Math.min(95,Math.round(100-(medD>0?madD/medD*300:300))));
  S.detOverride={};
  var cs=stats(best.cols),cp=peakList(best.cols,cs.m+sens*cs.sd/10,Math.max(4,sep*2));
  var bbox=null;
  if(cp.length>=2){
    var xs=cp.map(function(q){return q.i/g.sc});
    bbox={x0:Math.min.apply(null,xs),x1:Math.max.apply(null,xs),y0:lines[0].y0,y1:lines[lines.length-1].y0};
  }
  S.det={lines:lines,ang:best.ang,cx:cx/g.sc,sc:g.sc,bbox:bbox,confidence:conf,gray:g,rectK:rectK};
  S.lines=lines.map(function(q){return q.y0});
  drawOverlay();applyDetection();
  var msg="Profil: ~"+(S.det.profN||"?")+" lamel (iz svetlostnega profila), naklon "+f(best.ang)+"°, konsistentnost koraka ~"+S.det.confidence+"%.";
  if(rectK>0)msg+=" Zaznava na rektificiranem pregledu (perspektiva odstranjena).";
  msg+=" Širina/reža izmerjeni iz svetlostnega profila — preverite ročno.";
  if(S.det.nomNote)msg+=" "+S.det.nomNote+".";
  if(S.det.suggestedProfile)msg+=" Možen profil: "+S.det.suggestedProfile.name+" (izmerjeno "+S.det.suggestedProfile.measured+" mm, odstopanje ±"+S.det.suggestedProfile.err+"%) — kliknite gumb v plošči Slika.";
  if(Math.abs(best.ang)>=4)msg+=" Izrazit naklon: pri perspektivi priporočamo ročno merjenje.";
  if(!S.calibrated)msg+=" Za milimetre umerite sliko.";
  dt(msg,S.det.confidence<45?"warn":"");
};
$("sens").oninput=function(){if(S.det)$("detect").click()};
$("minsep").onchange=function(){if(S.det)$("detect").click()};

/* drag detected lines */
var ovEl=$("ov");
ovEl.addEventListener("mousedown",function(e){
  if(!S.det||!S.img)return;
  var r=ovEl.getBoundingClientRect(),p={x:(e.clientX-r.left)*S.img.naturalWidth/r.width,y:(e.clientY-r.top)*S.img.naturalHeight/r.height};
  var tg=Math.tan((S.det.ang||0)*Math.PI/180),best=-1,bd=1e9;
  S.det.lines.forEach(function(L,i){var d=Math.abs(p.y-(L.y0+tg*(p.x-S.det.cx)));if(d<bd){bd=d;best=i}});
  if(bd<14){S.drag={i:best};e.preventDefault()}
});
ovEl.addEventListener("mousemove",function(e){
  if(!S.drag||!S.img)return;
  var r=ovEl.getBoundingClientRect(),x=(e.clientX-r.left)*S.img.naturalWidth/r.width,y=(e.clientY-r.top)*S.img.naturalHeight/r.height;
  var tg=Math.tan((S.det.ang||0)*Math.PI/180);
  /* Faza 1 (Issue #2 §5 P3): omeji vlečenje črt na kadro — prepreči absurdne mere (54 milijonov mm) */
  S.det.lines[S.drag.i].y0=Math.max(0,Math.min(S.img.naturalHeight,y-tg*(x-S.det.cx)));
  S.lines=S.det.lines.map(function(q){return q.y0});drawOverlay();
});
window.addEventListener("mouseup",function(){if(S.drag){S.drag=null;applyDetection();dt("Zaznane črte prilagojene ročno.","")}});
