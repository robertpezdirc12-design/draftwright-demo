// Draftwright — modul 05-sheets (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
function mass(){
  var sw=n("sw"),stn=n("st"),wa=n("wall"),rho=n("rho"),prof=V("prof");
  var area;
  if(prof==="rhombus")area=sw*stn/2;
  else if(prof==="tube")area=sw*stn-Math.max(0,sw-2*wa)*Math.max(0,stn-2*wa);
  else area=sw*stn;
  var tot=0;
  cutItems().forEach(function(it){if(String(it.name).indexOf("Lamela")===0)tot+=area*it.len*it.qty});
  return tot*rho/1e9;
}
/* ---------- reference-matching sheet ---------- */
function generateReference(){
  var L=Math.max(1,n("L")),H=Math.max(1,n("H")),D=Math.max(1,n("D")),N=Math.max(1,Math.round(n("n")));
  var zt=Math.max(1,n("zoneTop")),zm=Math.max(1,n("zoneMid")),zb=Math.max(1,n("zoneBot")),zbase=Math.max(1,n("zoneBase")),idn=Math.max(1,n("innerD"));
  var vert=$("sysUse")&&V("sysUse")==="pokoncna";
  var paper=V("paper"),pw=paper==="A3"?420:paper==="A4"?297:594,ph=paper==="A3"?297:paper==="A4"?210:420;
  var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="'+pw+'mm" height="'+ph+'mm">';
  s+='<rect width="420" height="297" fill="#fff"/><rect x="6" y="6" width="408" height="285" fill="none" stroke="#111" stroke-width="0.6"/>';
  function vt(x,y,t){var w=t.length*1.62+5;return rc(x,y,w,5.4,"#141c24","#141c24")+tx(x+2.5,y+3.8,t,2.7,"start",600,"#fff")}
  function circ(x,y,r){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fff" stroke="#777" stroke-width="0.25" stroke-dasharray="1.2 1"/>'}

  var fx=28,fy=32,fs=196/L,fw=L*fs,fh=H*fs,fb=fy+fh;
  s+=vt(20,20,"SPREDNJI POGLED");
  s+=dh(fx,fx+fw,fy-7,f(L),fy)+dv(fy,fb,fx-8,f(H),fx);
  var tS=zt*fs,mS=zm*fs,bS=zb*fs,baseS=zbase*fs,rem=fh-tS-mS-bS-baseS;
  s+=rc(fx,fy,fw,tS,"#2c3742","#111")+rc(fx,fy+tS,fw,mS,"#fff","#111");
  if(vert){
    var bp=fw/N,bw=Math.max(0.6,Math.min(bp-n("gap")*fs,n("sw")*fs));
    for(var vi=0;vi<N;vi++){var bx=fx+vi*bp+(bp-bw)/2;s+=rc(bx,fy+tS,bw,mS,"#2c3742","#111")}
    for(i=1;i<=3;i++){var vy=fy+tS+mS*i/4;s+=ln(fx,vy,fx+fw,vy,0.25)}
  }else{
    var pitch=mS/N,sh=Math.max(1,pitch-Math.max(1,n("gap"))*fs);
    for(var i=0;i<N;i++){
      var y=fy+tS+i*pitch+(pitch-sh)/2;
      s+=rc(fx,y,fw,sh,"#2c3742","#111");
    }
    for(i=1;i<=3;i++){var vx=fx+fw*i/4;s+=ln(vx,fy+tS,vx,fy+tS+mS,0.25)}
  }
  s+=rc(fx,fy+tS+mS+rem,fw,bS,"#2c3742","#111")+rc(fx,fb-baseS,fw,baseS,"#fff","#111")+hatch(fx,fb-baseS,fw,baseS);
  var cx=fx+fw+7;
  s+=dv(fy,fy+tS,cx,f(zt),fx+fw)+dv(fy+tS,fy+tS+mS,cx,f(zm),fx+fw);
  s+=dv(fy+tS+mS,fy+tS+mS+bS,cx,f(zb),fx+fw)+dv(fb-baseS,fb,cx,f(zbase),fx+fw);
  if(Math.abs(rem)>0.5)s+=dv(fy+tS+mS+bS,fb-baseS,cx,f(H-zt-zm-zb-zbase),fx+fw);
  var NPn=Math.max(2,Math.round(n("np"))),spans=spanParts(L,NPn-1),centers=spanCenters(L,NPn-1),cx0=fx;
  for(var pk=1;pk<NPn;pk++){var cxs=cx0+Number(spans[pk-1])/L*fw;s+=dh(cx0,cxs,fb+5,spans[pk-1],fb);cx0=cxs}
  s+=tx(fx,fb+12,"OSI NOSILCEV (mm): "+centers.map(String).join(" / "),2.0);

  var sx=288,sy=32,ss=90/D,swd=D*ss,shd=H*ss;
  s+=vt(284,20,"STRANSKI POGLED");
  s+=rc(280,28,7,shd+6,"none","#111")+hatch(280,28,7,shd+6);
  s+=dh(sx,sx+swd,sy-7,f(D),sy)+dv(sy,sy+shd,sx+swd+7,f(H),sx+swd);
  s+=rc(sx,sy+shd-8,swd,8,"none","#111")+hatch(sx,sy+shd-8,swd,8);
  var ox=sx+swd-7;
  s+=rc(ox,sy,7,shd,"#2c3742","#111");
  s+=rc(ox-5,sy+zt*ss,12,Math.max(2,zt*ss*0.5),"#2c3742","#111");
  s+=rc(ox-4,sy+shd-zbase*ss-4,10,4,"#2c3742","#111");
  s+=rc(ox+2,sy+zt*ss+3,3,Math.max(2,shd-zt*ss-zbase*ss-7),"#2c3742","#111")+hatch(ox+2,sy+zt*ss+3,3,Math.max(2,shd-zt*ss-zbase*ss-7));
  s+=dh(sx,sx+swd-24*ss,sy+shd+6,f(idn),sy);

  var ax=28,ay=164,as=130/L,aw=L*as,ad=D*as;
  s+=vt(20,152,"TLORIS");
  s+=dh(ax,ax+aw,ay-ad-7,f(L),ay-ad)+dv(ay-ad,ay,ax-8,f(D),ax);
  s+=rc(ax,ay-ad,aw,ad,"none","#111");
  s+=rc(ax,ay-ad-6,aw,6,"none","#111")+hatch(ax,ay-ad-6,aw,6);
  s+=rc(ax,ay,aw,6,"none","#111")+hatch(ax,ay,aw,6);
  s+=rc(ax,ay-ad,5,5,"#2c3742","#111")+rc(ax+aw-5,ay-ad,5,5,"#2c3742","#111")+rc(ax,ay-5,5,5,"#2c3742","#111")+rc(ax+aw-5,ay-5,5,5,"#2c3742","#111");
  if(vert){
    var tbp=aw/N,tbw=Math.max(0.6,Math.min(tbp-Math.max(1,n("gap"))*as,n("sw")*as)),td=Math.max(1.2,Math.min(ad*0.35,n("st")*as));
    for(var ti=0;ti<N;ti++){var tbx=ax+ti*tbp+(tbp-tbw)/2;s+=rc(tbx,ay-ad/2-td/2,tbw,td,"#2c3742","#111")}
  }else{
    var tdy=Math.max(1.2,Math.min(ad*0.35,n("st")*as));
    s+=rc(ax+2,ay-ad/2-tdy/2,aw-4,tdy,"#2c3742","#111");
  }

  s+=vt(300,124,"IZOMETRIČNI POGLED");
  var kx=Math.min(0.022,140/((L+D)*0.866)),ky=Math.min(0.012,55/((L+D)*0.5+H)),icx=330,icy=154;
  function ip(x,y,z){return[icx+(x-y)*0.866*kx,icy+(x+y)*0.5*ky-z*ky]}
  function ib(x0,y0,z0,x1,y1,z1,fr,fl){
    var A=ip(x0,y0,z1),B=ip(x1,y0,z1),C=ip(x1,y1,z1),Z=ip(x0,y1,z1),E=ip(x1,y0,z0),F=ip(x0,y0,z0),G=ip(x1,y1,z0);
    return poly([Z,C,B,A],fr,"#333",0.18)+poly([A,B,E,F],fl,"#222",0.18)+poly([B,C,G,E],"#c7ced4","#222",0.18);
  }
  s+=poly([ip(0,D,0),ip(L,D,0),ip(L,D,H),ip(0,D,H)],"#f1f3f5","#888",0.2);
  s+=ib(0,D-6,0,6,D,H,"#dfe4e8","#c9d2d9")+ib(L-6,D-6,0,L,D,H,"#dfe4e8","#c9d2d9");
  if(vert){
    var ibp=L/N,ibw=Math.max(20,Math.min(ibp-n("gap"),n("sw")));
    for(i=0;i<N;i++){
      var ibx=i*ibp+(ibp-ibw)/2;
      s+=ib(ibx,0,0,ibx+ibw,n("st"),H,"#e2e6ea","#c2c9d0");
    }
  }else{
    for(i=0;i<N;i++){
      var iz=zbase+i*(H-zt-zbase)/N,iz1=Math.min(H-zt,iz+(H-zt-zbase)/N*0.72);
      s+=ib(0,0,iz,L,n("st"),iz1,"#e2e6ea","#c2c9d0");
    }
  }
  s+=poly([ip(0,4,H-zt+6),ip(L,4,H-zt+6),ip(L,4,H-zt+14),ip(0,4,H-zt+14)],"#2c3742","#111",0.2);
  s+=ib(0,-8,H-zt,L,4,H,"#dfe4e8","#c9d2d9")+ib(0,-8,0,L,4,zbase,"#dfe4e8","#c9d2d9");
  s+=ib(0,-10,0,5,0,H,"#c2c9d0","#777")+ib(L-5,-10,0,L,0,H,"#c2c9d0","#777");

  s+=vt(14,188,"PREREZ A–A");
  s+=rc(18,198,9,62,"none","#111")+hatch(18,198,9,62);
  var qy=244;
  s+=rc(33,qy-34,6,68,"#2c3742","#111");
  s+=rc(27,qy-30,12,5,"#8d979f","#111");
  s+=rc(27,qy+4,12,5,"#8d979f","#111");
  s+=rc(39,qy-23,Math.max(3,n("st")*0.5),46,"#2c3742","#111");
  s+='<circle cx="22" cy="'+(qy+6.5)+'" r="1.5" fill="none" stroke="#111" stroke-width="0.3"/><line x1="22" y1="'+(qy+5)+'" x2="22" y2="'+(qy+8)+'" stroke="#111" stroke-width="0.25"/><line x1="20.5" y1="'+(qy+6.5)+'" x2="23.5" y2="'+(qy+6.5)+'" stroke="#111" stroke-width="0.25"/>';
  s+=balloon(100,198,1)+ln(97,199,39,216,0.18);
  s+=balloon(100,210,2)+ln(97,211,42,230,0.18);
  s+=balloon(100,222,3)+ln(97,223,39,250,0.18);
  s+=balloon(100,234,4)+ln(97,235,36,224,0.18);
  s+=balloon(100,246,5)+ln(97,247,24,250,0.18);
  s+=dh(18,45,258,"60",252);

  s+=vt(126,188,"DETAIL PRITRJEVANJA");
  s+=circ(164,232,34)+rc(142,204,8,55,"none","#111")+hatch(142,204,8,55);
  s+=rc(150,223,26,8,"#2c3742","#111")+rc(176,225,16,4,"#8d979f","#111");
  s+='<circle cx="164" cy="227" r="2.4" fill="none" stroke="#111" stroke-width="0.3"/>';
  s+=dv(204,259,138,f(zm),142)+dh(150,192,263,"60",231);

  s+=vt(220,188,"DETAIL LAMELE");
  s+=circ(254,232,34)+rc(248,204,13,55,"#2c3742","#111");
  s+='<path d="M248 204 Q245 204 245 208 L245 255 Q245 259 248 259 Z" fill="#1f2933" stroke="#111" stroke-width="0.3"/>';
  s+=dv(204,259,241,f(zm),248)+dh(245,261,265,f(n("st")),259);

  s+=vt(282,192,"SEZNAM SESTAVNIH DELOV");
  var pc=WC[$("sysProfile")?$("sysProfile").value:"romb67"]||{n:"Lamela",len:0};
  var cutLen=vert?zm:L,perStock=Math.max(1,Math.floor(pc.len/Math.max(1,cutLen))),boards=Math.ceil(N/perStock),offcut=pc.len-perStock*cutLen;
  var rows=[
    ["1","Zgornji profil / okvir","Aluminij / jeklo",V("topP"),"1 kos"],
    ["2","Lamela "+pc.n+" ("+V("sysColor")+")","WoodCore WPC",f(n("sw"))+"x"+f(n("st"))+"x"+f(cutLen),N+" kos"],
    ["3","Spodnji profil / konzola","Aluminij / jeklo",V("botP"),"1 kos"],
    ["4","Nosilni profili","Jeklo / aluminij",V("postP"),V("np")+" kos"],
    ["5","Pritrdilni vijaki / sidra","Inox A2/A4",V("bolt"),String(2*n("np"))+" kos"],
    ["6","Zaloga desk",pc.n,pc.len+" mm · "+perStock+"/desko",boards+" desek"],
    ["7","Odpadek","—",f(offcut)+" mm/desko","~"+f(offcut*boards/1000)+" m"]
  ];
  s+=tbl(283,200,[6,36,30,36,19],rows,["št.","Naziv dela","Material","Dimenzije (mm)","Količina"]);

  s+=vt(286,254,"TEHNIČNI PODATKI IN OPOMBE");
  var un=V("notes").split("\n").map(function(x){return x.trim()}).filter(Boolean).slice(0,4).map(function(x){return x.substring(0,105)});
  var notes=un.length?un:["Vse mere so v milimetrih (mm); pred izdelavo preveriti mere na objektu.","Spojni materiali: jeklo, vijaki in mozniki po proizvajalčevi specifikaciji.","Površinska obdelava: prašno barvanje, barva po dogovoru (RAL 7016).","Sidranje prilagoditi nosilnosti fasadnega zidu / betonske plošče oziroma ograje."];
  notes.forEach(function(t,i){s+=tx(289,263+i*4.3,(i+1)+". "+t,2.25)});
  s+=tx(14,266,"SIDRANJE: "+V("anchor")+", globina "+V("emb")+" mm; podlaga: "+V("sub")+".",2.0);
  s+=tx(14,271,"KONTROLA: osi nosilcev, vodnost, navpičnost, odtok, +5 °C, luknja +1 mm, vijak 30 mm od roba.",2.0);

  var by=279;
  s+=rc(8,by,404,11,"none","#111");
  [86,146,206,266,326].forEach(function(x){s+=ln(x,by,x,by+11,0.3)});
  s+=ln(8,by+6,412,by+6,0.2);
  s+=tx(10,by+3.2,"PROJEKT:",1.9,"start",500,"#444")+tx(10,by+9.2,E(V("proj")),3.2,"start",500);
  s+=tx(88,by+3.2,"MERILO:",1.9,"start",500,"#444")+tx(88,by+9.2,E(V("scale")),2.6,"start");
  s+=tx(148,by+3.2,"FORMAT:",1.9,"start",500,"#444")+tx(148,by+9.2,E(paper),2.6,"start");
  s+=tx(208,by+3.2,"DATUM:",1.9,"start",500,"#444")+tx(208,by+9.2,E(V("date")),2.6,"start");
  s+=tx(268,by+3.2,"IZDELAL:",1.9,"start",500,"#444")+tx(268,by+9.2,E(V("aut")||"R. Pezdirc"),2.6,"start");
  s+=tx(328,by+3.2,"RISBA ŠT.:",1.9,"start",500,"#444")+tx(328,by+9.2,E(V("drw")),2.6,"start");
  s+='</svg>';
  $("prev").className="sheet";$("prev").innerHTML=s;
}

/* ---------- stair railing sheet ---------- */
function generateStair(){
  var nS=Math.max(1,Math.round(n("stN"))),rise=Math.max(1,n("stRise")),going=Math.max(1,n("stGoing"));
  var W=Math.max(100,n("stW")),NP=Math.max(2,Math.round(n("stPosts"))),rh=Math.max(300,n("stH"));
  var run=nS*going,tot=nS*rise,slope=Math.sqrt(run*run+tot*tot);
  var paper=V("paper"),pw=paper==="A3"?420:paper==="A4"?297:594,ph=paper==="A3"?297:paper==="A4"?210:420;
  var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="'+pw+'mm" height="'+ph+'mm">';
  s+='<rect width="420" height="297" fill="#fff"/><rect x="6" y="6" width="408" height="285" fill="none" stroke="#111" stroke-width="0.6"/>';
  function vt(x,y,t){return rc(x,y,t.length*1.62+5,5.4,"#141c24","#141c24")+tx(x+2.5,y+3.8,t,2.7,"start",600,"#fff")}
  function ty(x,es,ey){return ey-((x-20)/(going*es))*rise*es}
  s+=vt(14,14,"STOPNIŠČNA OGRAJA — POGLED PO STOPNICAH");
  var ex=20,ey=162,es=Math.min(380/run,132/(tot+rh));
  s+='<path d="M'+ex+' '+ty(ex,es,ey);
  for(var i=1;i<=nS;i++){var x0=ex+(i-1)*going*es,x1=ex+i*going*es;s+=' L'+x1+' '+ty(x0,es,ey)+' L'+x1+' '+ty(x1,es,ey)}
  s+='" fill="none" stroke="#111" stroke-width="0.45"/>';
  s+=ln(ex,ty(ex,es,ey)-rh*es,ex+run*es,ty(ex+run*es,es,ey)-rh*es,1.1);
  s+=ln(ex,ty(ex,es,ey)-60*es,ex+run*es,ty(ex+run*es,es,ey)-60*es,0.7);
  var pitchS=going*es,bw=Math.max(0.5,Math.min(n("sw")*es,pitchS-Math.max(0.4,n("gap"))*es));
  for(var bx=ex;bx<ex+run*es-0.1;bx+=pitchS){
    var by=ty(bx,es,ey);
    s+=rc(bx+(pitchS-bw)/2,by-rh*es,bw,(rh-60)*es,"#2c3742","#111");
  }
  for(var k=0;k<NP;k++){
    var px=ex+k*run*es/(NP-1),py=ty(px,es,ey);
    s+=rc(px-1.6,py-rh*es,3.2,rh*es,"#2c3742","#111");
    s+=poly([[px-3,py],[px+3,py],[px,py+3]],"#8d979f","#111",0.2);
  }
  s+=dh(ex,ex+run*es,ey+9,f(run),ey)+dv(ey-tot*es,ey,ex+run*es+8,f(tot),ex+run*es);
  s+=dv(ey-rh*es,ey,ex-7,f(rh),ex);
  var stSp=spanParts(run,NP-1),stCtr=spanCenters(run,NP-1),stx=ex;
  for(var q=1;q<NP;q++){var stx2=stx+Number(stSp[q-1])/run*run*es;s+=dh(stx,stx2,ey+18,stSp[q-1],ey+9);stx=stx2}
  s+=tx(ex,ey+27,"Osi nosilcev (mm): "+stCtr.join(" / "),2.0);

  s+=vt(14,190,"TLORIS STOPNIŠČA");
  var px0=20,py0=202,pp=Math.min(180/W,34/run);
  s+=rc(px0,py0,W*pp,run*pp,"none","#111");
  for(var t2=1;t2<nS;t2++)s+=ln(px0,py0+t2*going*pp,px0+W*pp,py0+t2*going*pp,0.15,'stroke="#999"');
  for(var q2=0;q2<NP;q2++)s+=rc(px0+q2*W*pp/(NP-1)-1.5,py0-2,3,4,"#2c3742","#111");
  s+=dh(px0,px0+W*pp,py0-7,f(W),py0)+dv(py0,py0+run*pp,px0+W*pp+6,f(run),px0+W*pp);

  s+=vt(250,30,"REZALNI SEZNAM");
  var pc=WC[$("sysProfile")?$("sysProfile").value:"romb67"]||{n:"Lamela",len:0};
  var cut=rh-60,per=Math.max(1,Math.floor(pc.len/Math.max(1,cut))),boards=Math.ceil(nS/per),off=Math.max(0,pc.len-per*cut);
  var rows=[
    ["1",pc.n+" ("+V("sysColor")+")",f(n("sw"))+"x"+f(n("st"))+"x"+f(cut),nS+" kos"],
    ["2","Nosilci "+V("postP"),V("postP"),NP+" kos"],
    ["3","Zgornja ročica",f(slope)+" mm","1 kos"],
    ["4","Spodnja ročica",f(slope)+" mm","1 kos"],
    ["5","Zaloga / odpadek",pc.len+" mm · "+per+"/desko",boards+" desek · "+f(off*boards/1000)+" m"]
  ];
  s+=tbl(251,36,[7,52,38,25],rows,["št.","Del","Dimenzije (mm)","Količina"]);

  s+=tx(14,238,"SIDRANJE: "+V("anchor")+", globina "+V("emb")+" mm; podlaga: "+V("sub")+". Razdalja od roba ≥ 50 mm, moment po proizvajalcu.",2.0);
  s+=tx(14,244,"PRITRDITEV: izvrtina v WPC +1 mm, vijak 30 mm od roba, Inox A2/A4; montaža nad +5 °C.",2.0);
  s+=tx(14,250,"KONTROLNI SEZNAM: 1) preveriti osi nosilcev, 2) sidra v nosilno podlago, 3) vodnost in naklon ročice, 4) reže in odtok, 5) podpis izvajalca.",2.0);
  s+=tx(14,256,"Barva: "+V("sysColor")+" ("+V("sysSurface")+"); odtenek se v prvem letu posvetli 5–10 %. Garancija 15 let ob pravilni montaži.",2.0);
  s+=rc(8,268,404,16,"none","#111");
  s+=tx(10,271,"PROJEKT: "+E(V("proj")),2.4,"start",500)+tx(210,271,"RISBA ŠT.: "+E(V("drw")),2.4,"start",500);
  s+=tx(10,276,"Stopniščna ograja · "+nS+" stopnic · naklon "+f(Math.atan2(tot,run)*180/Math.PI,1)+"° · H "+f(rh)+" mm",2.2,"start");
  s+=tx(210,276,"Datum: "+E(V("date"))+" · Merilo: "+E(V("scale")),2.2,"start");
  s+='</svg>';
  $("prev").className="sheet";$("prev").innerHTML=s;
}

function generate(){
  checks();
  if(V("sysUse")==="stopniscna"){generateStair();return}
  if(($("refMode")&&$("refMode").checked)||V("sysUse")==="pokoncna"){generateReference();return}
  var L=n("L"),H=n("H"),D=n("D"),N=Math.max(1,Math.round(n("n"))),sw=n("sw"),stn=n("st"),gap=n("gap"),NP=Math.max(1,Math.round(n("np")));
  checks();
  if(!(L>0&&H>0&&D>0)){$("prev").className="empty";$("prev").innerHTML="<b>Manjkajoče mere</b>L, H in D morajo biti pozitivne.";return}
  var paper=V("paper"),pw=paper==="A3"?420:paper==="A4"?297:594,ph=paper==="A3"?297:paper==="A4"?210:420;
  var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="'+pw+'mm" height="'+ph+'mm">';
  s+='<rect width="420" height="297" fill="#fff"/><rect x="7" y="7" width="406" height="283" fill="none" stroke="#111" stroke-width="0.5"/>';
  s+=tx(11,16,E(V("proj")),5.0,"start",500)+tx(409,16,"TEHNIČNA RISBA · "+paper+" · REV "+E(V("rev")),2.6,"end");

  var pd=dim(V("topP"),[80,40]),pdb=dim(V("botP"),[60,40]);
  var topHmm=Math.min(pd[1],H*0.2),botHmm=Math.min(pdb[1],H*0.2),baseHmm=60;
  var innerHmm=Math.max(10,H-topHmm-botHmm-baseHmm);

  /* FRONT — ena ograja ALI več segmentov (F4: vrstica = naziv;širina;višina) */
  var segs=[];
  (V("segList")||"").trim().split("\n").forEach(function(sgl){var sgp=sgl.split(";"),sgw=pnum(sgp[1],0),sgh=pnum(sgp[2],0);
    if(sgp[0]&&sgp[0].trim()&&sgw>0&&sgh>0)segs.push({n:sgp[0].trim(),w:sgw,h:sgh})});
  var fx=20,fy=99,fs=Math.min(212/L,76/H),fw=L*fs,fh=H*fs;
  var topH=topHmm*fs,botH=botHmm*fs,inner=fh-topH-botH,pitch=inner/N,sh=(sw/Math.max(1,sw+gap))*pitch;
  s+=panel(12,20,235,92,"SPREDNJI POGLED"+(segs.length>=2?" PO SEGMENTIH":" · M "+E(V("scale"))));
  if(segs.length>=2){
    var slabT=Math.max(0,n("slabT")||0),limF=roksalLimit(WC[$("sysProfile").value]||WC.romb67,V("sysUse"),H),sy2=30;
    segs.slice(0,3).forEach(function(sg){
      var fs2=Math.min(190/sg.w,26/sg.h),fw2=sg.w*fs2,fh2=sg.h*fs2,fx2=26,fy2=sy2+fh2;
      var t2=Math.min(pd[1],sg.h*0.2)*fs2,b2=Math.min(pdb[1],sg.h*0.2)*fs2;
      var Ni=Math.max(1,Math.round((sg.h-topHmm-botHmm)/(sw+gap))),p2i=(fh2-t2-b2)/Ni,sh2=(sw/Math.max(1,sw+gap))*p2i;
      var np2=Math.max(2,Math.ceil(sg.w/limF.v)+1);
      s+=tx(fx2,fy2-fh2-1.2,sg.n,2.6,"start",500);
      s+=rc(fx2,fy2-fh2,fw2,fh2)+rc(fx2,fy2-fh2,fw2,t2)+rc(fx2,fy2-b2,fw2,b2);
      for(var i2=0;i2<Ni;i2++){var yy2b=fy2-b2-(i2+1)*p2i+gap*fs2/2;s+=rc(fx2,yy2b,fw2,Math.max(0.4,sh2),"#e6e6e6","#111");for(var k2=1;k2<np2;k2++)s+=ln(fx2+fw2*k2/np2,yy2b,fx2+fw2*k2/np2,yy2b+sh2,0.12)}
      for(k2=0;k2<np2;k2++)s+=rc(fx2+fw2*k2/np2-0.8,fy2-fh2,1.6,t2,"#cfcfcf","#111");
      var sl2=slabT>0?slabT*fs2:0;
      if(sl2>0)s+=rc(fx2,fy2+1,fw2,sl2,"none","#999")+hatch(fx2,fy2+1,fw2,sl2)+tx(fx2+fw2+2,fy2+1+sl2/2+0.6,"BETONSKA PLOŠČA ("+f(slabT)+" mm)",1.9,"start");
      s+=dh(fx2,fx2+fw2,fy2+6+sl2,f(sg.w),fy2-fh2)+dv(fy2-fh2,fy2,fx2-6,f(sg.h),fx2);
      sy2=fy2+sl2+13;
    });
    if(segs.length>3)s+=tx(244,26.5,"(+ "+(segs.length-3)+" segmentov ni prikazanih)",1.9,"end");
    s+=tx(244,24.5,"Količine v BOM: vsi segmenti + povratek · nosilci/segment ≤ "+limF.v+" mm",1.9,"end",500,"#444");
  }else{
  s+=rc(fx,fy-fh,fw,fh)+rc(fx,fy-topH,fw,topH)+rc(fx,fy-fh,fw,botH);
  s+=rc(fx,fy-fh+botH-1.5,fw,1.5,"#ddd","#111");
  for(var i=0;i<N;i++){var yy=fy-topH-(i+1)*pitch+gap*fs/2;s+=rc(fx,yy,fw,Math.max(0.5,sh),"#e6e6e6","#111");for(var k=1;k<NP;k++)s+=ln(fx+fw*k/NP,yy,fx+fw*k/NP,yy+sh,0.15)}
  for(k=0;k<NP;k++)s+=rc(fx+fw*k/NP-1,fy-topH,2,topH,"#cfcfcf","#111");
  /* P2: korita za rože — box nad lamelami na vrhu ograje (samo enojna ograja); enoten vir getKoritaData() */
  var kdF=getKoritaData();
  if(kdF.active){
    kdF.items.forEach(function(kt){
      var kx=fx+kt.x*fs,kw=kt.w*fs,kh=kdF.H*fs,kd=Math.max(1,kdF.D*fs);
      s+=rc(kx,fy-fh,kw,kh,"#dcdcdc","#111")+rc(kx+kd*0.25,fy-fh+1.2,kw-kd*0.5,kh-2.4,"none","#999");
      s+=dh(kx,kx+kw,fy-fh+kh-1.8,f(kt.w),fy-fh);
      s+=tx(kx+kw/2,fy-fh+kh/2+0.8,"KORITO ZA ROŽE ("+f(kt.w)+" mm)",Math.min(2.0,Math.max(1.4,kw*0.075)),"middle",500);
    });
  }
  s+=center(fx-4,fy-fh/2,fx+fw+4,fy-fh/2);
  s+=dh(fx,fx+fw,fy+5,f(L),fy-fh)+dv(fy-fh,fy,fx-7,f(H),fx);
  var chx=fx+fw+6;
  if(topH>3.2)s+=dv(fy-fh,fy-fh+topH,chx,f(topHmm),fx+fw);
  if(inner>3.2)s+=dv(fy-fh+topH,fy-fh+topH+inner,chx,f(innerHmm),fx+fw);
  if(botH>3.2)s+=dv(fy-fh+topH,fy-fh+topH+inner+botH,chx,f(botHmm),fx+fw);
  if(baseHmm*fs>3.2)s+=dv(fy-botH,fy,chx,f(baseHmm),fx+fw);
  s+=tx(fx,fy+10,N+" × "+f(sw)+"×"+f(stn)+"×2 U-profil · reža "+f(gap)+" mm",2.4,"start");
  }

  /* SIDE with wall */
  var sx=270,sy=99,ss=Math.min(112/D,76/H),swd=D*ss,shd=H*ss;
  s+=panel(253,20,155,92,"STRANSKI POGLED");
  s+=rc(261,32,7,74,"none","#111")+hatch(261,32,7,74);
  s+=rc(sx,sy-shd,swd,shd,"none","#111");
  for(i=0;i<N;i++){var yy2=sy-shd+botH+(i+0.2)*(shd-topH-botH)/N;s+=rc(sx,yy2,swd,Math.max(0.5,stn*ss),"#e6e6e6","#111")}
  s+=rc(sx+swd,sy-shd*0.45,14,3,"#ddd","#111");
  s+=center(sx+swd/2,sy-shd-4,sx+swd/2,sy+4);
  s+=dh(sx,sx+swd,sy+5,f(D),sy-shd)+dv(sy-shd,sy,sx+swd+7,f(H),sx+swd);
  s+=dh(sx,sx+swd-40*ss,sy-6,f(D-40),sy-shd);

  /* TOP — tloris, po želji z desnim L-povratkom (F5): W2>0 → fasadni trak + povratek + kotni steber */
  var ax=20,ay=160,W2=Math.max(0,n("w2")||0),tlrL=W2>0;
  var as=Math.min(116/L,tlrL?34/(D+W2+60):42/D),aw=L*as,ad=D*as,w2px=W2*as,bandT=Math.max(1.4,60*as);
  s+=panel(12,119,140,49,"TLORIS"+(tlrL?" — DESNI L-POVRATEK":""));
  s+=rc(ax,ay-ad,aw,ad,"none","#111");
  s+=rc(ax-7,ay-ad+2,7,ad+2,"none","#111")+hatch(ax-7,ay-ad+2,7,ad+2);
  for(k=0;k<NP;k++){var px=ax+aw*k/Math.max(1,NP-1);s+=rc(px-1.6,ay-ad-1.6,3.2,3.2,"#ddd","#111");s+=rc(px-1.6,ay-1.6,3.2,3.2,"#ddd","#111");center(px,ay-ad-3,px,ay+3)}
  s+=dh(ax,ax+aw,ay+6,(tlrL?"W1 = ":"")+f(L),ay-ad)+dv(ay-ad,ay,ax-7,f(D),ax);
  if(tlrL){
    var fcy=ay-ad-w2px; /* spodnji rob fasadnega traku = zgornji rob povratka */
    s+=rc(ax-7,fcy-6,aw+ad+14,6,"none","#999")+hatch(ax-7,fcy-6,aw+ad+14,6);
    s+=tx(ax+aw+ad+7,fcy-1.4,"FASADA OBJEKTA",1.9,"end");
    s+=rc(ax+aw,fcy,bandT,w2px,"none","#111"); /* povratek: fasada → glavna trasa */
    var cpx=Math.max(1.8,60*as);
    s+=rc(ax+aw,ay-ad-cpx,cpx,cpx,"#ddd","#111")+tx(ax+aw+bandT+2,ay-ad-1,"KOTNI STEBER",1.9,"start");
    for(var kr=1;kr<Math.max(1,Math.round(w2/800));kr++)s+=rc(ax+aw+bandT/2-0.8,fcy+w2px*kr/Math.round(w2/800),1.6,1.6,"#ddd","#111");
    s+=dv(ay-ad-w2px,ay-ad,ax+aw+bandT+6,"W2 = "+f(W2),ax+aw);
    s+=tx(ax-5,ay-ad/2+0.8,"A",2.2,"middle",500)+tx(ax+aw+bandT/2+5.5,ay-ad/2+0.8,"A",2.2,"middle",500);
  }

  /* ISOMETRIC */
  s+=panel(158,119,250,49,"IZOMETRIČNI POGLED");
  var ik=Math.min(238/((L+D)*0.866),43/((L+D)*0.5+H)),icx=280,icy=138;
  function ip(x,y,z){return[icx+(x-y)*0.866*ik,icy+(x+y)*0.5*ik-z*ik]}
  function ibox(x0,y0,z0,x1,y1,z1,fl){
    var A=ip(x0,y0,z1),B=ip(x1,y0,z1),C=ip(x1,y1,z1),Dp=ip(x0,y1,z1),E=ip(x1,y0,z0),F=ip(x0,y0,z0),G=ip(x1,y1,z0);
    return poly([Dp,C,B,A],"#f2f2f2","#111",0.2)+poly([A,B,E,F],fl,"#111",0.2)+poly([B,C,G,E],"#cfcfcf","#111",0.2);
  }
  s+=poly([ip(0,D,0),ip(L,D,0),ip(L,D,H),ip(0,D,H)],"none","#999",0.2);
  s+=ibox(0,D-4,0,4,D,H,"#bdbdbd");s+=ibox(L-4,D-4,0,L,D,H,"#bdbdbd");
  for(i=0;i<N;i++){var z0=botHmm+i*(H-topHmm-botHmm)/N,z1=Math.min(H-topHmm,z0+sw*0.88);s+=ibox(0,0,z0,L,stn,z1,"#d0d0d0")}
  s+=ibox(0,-6,H-topHmm,L,stn,H,"#9a9a9a");s+=ibox(0,-6,0,L,stn,botHmm,"#9a9a9a");
  s+=ibox(0,-8,0,4,0,H,"#8f8f8f");s+=ibox(L-8,-8,0,L-4,0,H,"#8f8f8f");

  /* SECTION A-A — realni vertikalni rez (F1): steber, lamele v prerezu (ROMB: trapec z 15° fazami),
     zgornji/spodnji profil, sidranje/podlaga po mountType/subType. Baloni = št. vrstic v BOM (1,2,3,6,8). */
  var kdSe=getKoritaData(),seKt=(segs.length<2)?kdSe.items:[];
  var seS=Math.min(0.08,32/(H||1));
  if(seKt.length&&kdSe.active)seS=Math.min(seS,28/(H+kdSe.H)); /* korito nad ograjo mora ostati v panelu */
  /* P2 (Faza 3): merilo prereza vidno označeno — dinamično (z/brez korita) */
  s+=panel(12,172,140,50,"PREREZ A–A · M 1:"+Math.round(1/seS));
  var seX=32,seY0=211,seW=pd[0]*seS,seD=Math.max(0.8,stn*seS);
  var seTop=topHmm*seS,seBot=botHmm*seS,seZ=seY0-H*seS,sePi=(H-topHmm-botHmm)*seS/N,seSh=(sw/Math.max(1,sw+gap))*sePi;
  var seRom=(WC[$("sysProfile").value]||WC.romb67).n.indexOf("ROMB")>=0,seTan=Math.tan(Math.PI/12);
  s+=rc(seX-seW/2,seZ,seW,H*seS,"#cfcfcf","#111"); /* steber */
  for(i=0;i<N;i++){var seYy=seY0-seBot-(i+1)*sePi+gap*seS/2+seSh/2,seX0=seX+seW/2,seH2=Math.max(0.25,seSh-2*seD*seTan);
    if(seRom)s+=poly([[seX0,seYy-seSh/2],[seX0,seYy+seSh/2],[seX0+seD,seYy+seH2/2],[seX0+seD,seYy-seH2/2]],"#e6e6e6","#111",0.22);
    else s+=rc(seX0,seYy-seSh/2,seD,seSh,"#e6e6e6","#111");}
  s+=rc(seX-seW/2-0.8,seZ,seW+seD+2.4,seTop,"#dcdcdc","#111");
  s+=rc(seX-seW/2-0.8,seY0-seBot,seW+seD+2.4,seBot,"#dcdcdc","#111");
  /* P2: cvetlično korito v prerezu — box nad zgornjim profilom, za stebrom, na konzolnem nosilcu */
  if(seKt.length&&kdSe.active){
    var seKH=kdSe.H*seS,seKD=Math.max(1.2,kdSe.D*seS),seKX=seX-seW/2-0.8-seKD*0.6;
    s+=rc(seKX,seZ-seKH,seKD,seKH,"#dcdcdc","#111")+rc(seKX+seKD*0.15,seZ-seKH+0.5,seKD*0.7,seKH-1,"none","#999");
    s+=poly([[seKX+seKD*0.4,seZ],[seKX+seKD*0.4,seZ+seKH*0.3],[seX-seW/2-0.8,seZ]],"#cfcfcf","#111",0.2);
    s+=balloon(seKX-3.2,seZ-seKH+1.5,9)+ln(seKX-0.5,seZ-seKH+1.5,seKX+seKD*0.3,seZ-seKH*0.7,0.18);
    s+=balloon(seKX-3.2,seZ-seKH*0.45,10)+ln(seKX-0.5,seZ-seKH*0.45,seKX+seKD*0.3,seZ-seKH*0.28,0.18);
  }
  var seMt=V("mountType"),seLab="";
  if(seMt==="v tla"){s+=rc(seX-16,seY0,32,8,"none","#999")+hatch(seX-16,seY0,32,8)+rc(seX-seW/2,seY0,seW,5,"#cfcfcf","#111");seLab="V TLA / TEMELJ ("+E(V("subType"))+")"}
  else if(seMt==="bočno na ploščo"){s+=rc(seX+seW/2+1,seY0,18,8,"none","#999")+hatch(seX+seW/2+1,seY0,18,8)+rc(seX+seW/2-0.6,seY0-2.4,10,2.8,"#dcdcdc","#111");seLab="SIDRNA PLOŠČA · "+E(V("anchor"))}
  else if(seMt==="kovinska konstrukcija"){s+=rc(seX-seW/2-3,seY0-2,seW+6,2.4,"#cfcfcf","#111");seLab="OBSTOJEČA KONSTRUKCIJA · "+E(V("anchor"))}
  else{s+=rc(seX-16,seY0+1.6,32,6.4,"none","#999")+hatch(seX-16,seY0+1.6,32,6.4)+rc(seX-seW/2-2,seY0,seW+4,1.6,"#dcdcdc","#111");s+='<circle cx="'+(seX-seW/2-1)+'" cy="'+(seY0+3.4)+'" r="0.5" fill="#111"/><circle cx="'+(seX+seW/2+1)+'" cy="'+(seY0+3.4)+'" r="0.5" fill="#111"/>';seLab="PODLAGA: "+E(V("subType"))+" · PRITRDILO: "+E(V("anchor"))}
  s+=dv(seZ,seY0,seX+seD+8,f(H),seX+seW/2+seD);
  s+=tx(14,221,"Baloni = št. vrstic v SEZNAMU SESTAVNIH DELOV",2.1,"start")+tx(150,221,seLab,2.1,"end");
  var seMy=seY0-H*seS*0.45;
  s+=balloon(seX+seD+14,seZ+2,1)+ln(seX+seD+11.3,seZ+2,seX+seW/2+seD+1,seZ+seTop/2,0.18);
  s+=balloon(seX+seD+14,seMy,2)+ln(seX+seD+11.3,seMy,seX+seW/2+seD*0.6,seMy,0.18);
  s+=balloon(seX+seD+14,seY0-seBot+0.8,3)+ln(seX+seD+11.3,seY0-seBot+0.8,seX+seW/2+seD+1,seY0-seBot+0.4,0.18);
  s+=balloon(seX-seW/2-9,seMy,6)+ln(seX-seW/2-6.3,seMy,seX-seW/2,seMy,0.18);
  s+=balloon(seX+seD+14,seY0+4.4,8)+ln(seX+seD+11.3,seY0+4.4,seX+seW/2+2,seY0+1.6,0.18);

  /* SLAT DETAIL - U profile (naslov sledi dejanskemu profilu, ne trdo kodiran U 80×20×2) */
  var profP=WC[$("sysProfile").value]||null;
  s+=panel(158,172,114,50,"DETAIL LAMELE · "+(profP?profP.n+" "+f(sw)+"×"+f(stn)+" mm":"U "+f(sw)+"×"+f(stn)+"×2"));
  var ux=210,uy=197,dP=profP||WC.romb67;
  var ang15=Math.tan(Math.PI/12),dS=Math.min(0.35,22/dP.w),dW=dP.w*dS,dT=dP.t*dS;
  var dIsR=dP.n.indexOf("ROMB")>=0,dIsK=dP.n.indexOf("KUBO")>=0,dIsS=dP.n.indexOf("POLNA")>=0||dP.n.indexOf("DESKA")>=0;
  if(dIsR){ /* ROMB: vidna ploskev w navpično, fazi 15° nazaj v globino t → trapec */
    var dBk=Math.max(0.3,dW-2*dT*ang15);
    s+=poly([[ux,uy-dW/2],[ux,uy+dW/2],[ux+dT,uy+dBk/2],[ux+dT,uy-dBk/2]],"#dcdcdc","#111",0.3);
    s+=ln(ux+dT*0.55,uy-dW/2+dT*ang15*0.55,ux+dT*0.55+4,uy-dW/2+dT*ang15*0.55-2.6,0.2)+tx(ux+dT*0.55+4.4,uy-dW/2+dT*ang15*0.55-3,"15°",2.2,"start");
    s+=center(ux-5,uy,ux+dT+6,uy);
    s+=dh(ux,ux+dT,uy+dW/2+7,f(dP.t),uy+dW/2)+dv(uy-dW/2,uy+dW/2,ux+dT+9,f(dP.w),ux+dT);
  }else if(dIsK){ /* KUBO: zaprt kvadratni tubus */
    s+=rc(ux-dW/2,uy-dW/2,dW,dW,"#dcdcdc","#111")+rc(ux-dW/2+1.4,uy-dW/2+1.4,dW-2.8,dW-2.8,"none","#111");
    s+=center(ux-5,uy,ux+dW/2+6,uy)+center(ux,uy-dW/2-4,ux,uy+dW/2+5);
    s+=dh(ux-dW/2,ux+dW/2,uy+dW/2+7,f(dP.w),uy+dW/2)+dv(uy-dW/2,uy+dW/2,ux+dW/2+9,f(dP.t),ux+dW/2);
  }else if(dIsS){ /* polna deska/palica */
    s+=rc(ux-dT/2,uy-dW/2,dT,dW,"#dcdcdc","#111");
    s+=center(ux-5,uy,ux+dT/2+6,uy);
    s+=dh(ux-dT/2,ux+dT/2,uy+dW/2+7,f(dP.t),uy+dW/2)+dv(uy-dW/2,uy+dW/2,ux+dT/2+9,f(dP.w),ux+dT/2);
  }else{ /* pravokotna cev / U */
    s+=rc(ux-dW/2,uy-dW/2,dW,dW,"#dcdcdc","#111")+rc(ux-dW/2+1.4,uy-dW/2+1.4,dW-2.8,dW-2.8,"none","#111");
    s+=center(ux-5,uy,ux+dW/2+6,uy)+center(ux,uy-dW/2-4,ux,uy+dW/2+5);
    s+=dh(ux-dW/2,ux+dW/2,uy+dW/2+7,f(dP.w),uy+dW/2)+dv(uy-dW/2,uy+dW/2,ux+dW/2+9,f(dP.t),ux+dW/2);
    s+=tx(162,214,"notranji polmer r = 2 mm",2.3,"start");
  }

  /* FASTENER DETAIL */
  s+=panel(278,172,130,50,"DETAIL PRITRJEVANJA");
  s+=rc(286,180,7,36)+hatch(286,180,7,36)+rc(293,194,26,7,"none","#111");
  s+='<circle cx="306" cy="197.5" r="2.6" fill="none" stroke="#111" stroke-width="0.3"/>';
  center(293,197.5,321,197.5);
  s+=dh(293,319,209,"60",200)+tx(324,197,V("bolt")+" / "+V("anchor"),2.4,"start",500);
  s+=ln(330,186,363,186,0.25)+'<path d="M336 186 L340 181 L344 186 Z" fill="none" stroke="#111" stroke-width="0.25"/>'+tx(346,188,V("weld"),2.2,"start");

  /* BOM */
  var m=mass();
  var rows=[
    ["1","Zgornji profil","Alu/jeklo",V("topP"),"1"],
    ["2","Lamela "+(WC[$("sysProfile").value]||WC.romb67).n,"WPC",f(sw)+"x"+f(stn)+"x2 · "+lamelaBreakdown(),String(lamelaTotal())],
    ["3","Spodnji profil","Alu/jeklo",V("botP"),"1"],
    ["4","Vertikalni profil","Alu/jeklo",V("postP"),String(postCount())],
    ["5","Nosilec – konzola","Jeklo",V("bracket"),String(postCount()*2)],
    ["6","Steber","Jeklo",V("postP"),String(postCount()*2)],
    ["7","Pritrdilni vijak","Inox",V("bolt"),String(postCount()*Math.max(0,n("nbolt")))],
    ["8","Sidro","Inox",V("anchor"),String(postCount()*2)]
  ];
  var kdB=getKoritaData(),seKb=(segs.length<2)?kdB.items:[];
  if(seKb.length&&kdB.active){
    rows.push(["9","Cvetlično korito","WPC/alu (ocena — potrditi pri Roksalu)","globina "+f(kdB.D)+" × višina "+f(kdB.H)+" — širine: "+seKb.map(function(kt){return f(kt.w)}).join(", "),String(seKb.length)]);
    rows.push(["10","Konzolni nosilec korita","Jeklo","max(2, ceil(širina/600)+1) na korito — ocena",String(seKb.reduce(function(a,kt){return a+koritoNosilci(kt.w)},0))]);
  }
  s+=panel(12,226,238,48,"SEZNAM SESTAVNIH DELOV");
  s+=tbl(14,230,[8,50,28,120,28],rows,["Št.","Naziv dela","Material","Dimenzije (mm)","Količ."],rows.length>8?Math.max(3.2,44/(rows.length+1)):undefined);

  /* NOTES */
  s+=panel(256,226,152,48,"TEHNIČNI PODATKI IN OPOMBE");
  var nt=V("notes").split("\n").filter(function(x){return x.trim()});nt.push("Barva: "+V("ral")+" · Masa konstrukcije: "+f(m)+" kg");
  var yy=234;nt.slice(0,8).forEach(function(line,idx){s+=tx(259,yy,(idx+1)+". "+line,2.25);yy+=4.2});

  /* TITLE BLOCK — 2 vrstici (F3): PROJEKT/RISBA·REV/MERILO/FORMAT/DATUM/RISAL + OBJEKT/TIP/MATERIAL/BARVA */
  var ty=274;
  s+=rc(12,ty,396,12,"none","#111")+ln(12,ty+6,408,ty+6,0.25);
  [110,180,230,270,330].forEach(function(x){s+=ln(x,ty,x,ty+6,0.25)});
  [110,230,330].forEach(function(x){s+=ln(x,ty+6,x,ty+12,0.25)});
  s+=tx(14,ty+2.6,"PROJEKT",1.7,"start",500,"#444")+tx(14,ty+5.2,E(V("proj")),2.2,"start");
  s+=tx(112,ty+2.6,"RISBA / REV",1.7,"start",500,"#444")+tx(112,ty+5.2,E(V("drw"))+" / "+E(V("rev")),2.1,"start");
  s+=tx(182,ty+2.6,"MERILO",1.7,"start",500,"#444")+tx(182,ty+5.2,E(V("scale")),2.1,"start");
  s+=tx(232,ty+2.6,"FORMAT",1.7,"start",500,"#444")+tx(232,ty+5.2,paper,2.1,"start");
  s+=tx(272,ty+2.6,"DATUM",1.7,"start",500,"#444")+tx(272,ty+5.2,E(V("date")),2.1,"start");
  s+=tx(332,ty+2.6,"RISAL / KONT.",1.7,"start",500,"#444")+tx(332,ty+5.2,E(V("aut")||"—")+" / "+E(V("chk")||"—"),2.0,"start");
  s+=tx(14,ty+8.6,"OBJEKT",1.7,"start",500,"#444")+tx(14,ty+11.2,E(V("objekt")||"—"),2.2,"start");
  s+=tx(112,ty+8.6,"TIP",1.7,"start",500,"#444")+tx(112,ty+11.2,(USE_NAMES[V("sysUse")]||V("sysUse")).toUpperCase(),2.2,"start",500);
  s+=tx(232,ty+8.6,"MATERIAL",1.7,"start",500,"#444")+tx(232,ty+11.2,E(V("mat")),2.2,"start");
  s+=tx(332,ty+8.6,"BARVA",1.7,"start",500,"#444")+tx(332,ty+11.2,E(V("ral")),2.2,"start");

  s+='</svg>';
  $("prev").className="sheet";$("prev").innerHTML=s;
}
$("gen").onclick=generate;
$("matSel").onchange=function(){if(n("matSel")>0)$("rho").value=V("matSel")};
function svgEl(){return $("prev").querySelector("svg")}
function saveBlob(name,data,type){var b=new Blob([data],{type:type}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1200)}
$("dlSvg").onclick=function(){generate();if(!svgEl())return;saveBlob(V("drw")+".svg",new XMLSerializer().serializeToString(svgEl()),"image/svg+xml;charset=utf-8")};
function printHtml(svgText,paper){
  var pw=paper==="A3"?"420mm":paper==="A4"?"297mm":"594mm",ph=paper==="A3"?"297mm":paper==="A4"?"210mm":"420mm";
  return '<!doctype html><html><head><meta charset="utf-8"><style>@page{size:'+pw+' '+ph+';margin:0}html,body{margin:0;background:#fff}svg{width:'+pw+';height:'+ph+';display:block}</style></head><body>'+svgText+'</body></html>';
}
$("prt").onclick=function(){generate();if(!svgEl())return;var w=window.open("","_blank");if(!w)return;
  w.document.write(printHtml(new XMLSerializer().serializeToString(svgEl()),V("paper")));w.document.close();setTimeout(function(){w.focus();w.print()},400)};

