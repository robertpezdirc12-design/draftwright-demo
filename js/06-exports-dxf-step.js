// Draftwright — modul 06-exports-dxf-step (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
function num(v){return (Math.round(v*1000)/1000).toFixed(3)}
function dxfString(opts){
  opts=opts||{};
  var seg=Math.max(2,opts.segs||8);
  var doc=new DOMParser().parseFromString(opts.source||new XMLSerializer().serializeToString(svgEl()),"image/svg+xml");
  var out=[];function add(){for(var i=0;i<arguments.length;i++)out.push(arguments[i])}
  /* Faza 1 (Issue #2 §6.1): $DWGCODEPAGE ANSI_1250 (slovenska č/š/ž) + LTYPE DASHDOT + $EXTMIN/$EXTMAX */
  add("0","SECTION","2","HEADER","9","$ACADVER","1","AC1009","9","$DWGCODEPAGE","1","ANSI_1250",
      "9","$EXTMIN","10","0","20","0","30","0","9","$EXTMAX","10","420","20","297","30","0","0","ENDSEC",
      "0","SECTION","2","TABLES",
      "0","TABLE","2","LTYPE","70","1","0","LTYPE","2","DASHDOT","70","0","3","Dashdot __ . __ . __","72","65","73","4","40","11.9","49","9.5","49","-1.6","49","0.2","49","-1.6","0","ENDTAB",
      "0","TABLE","2","LAYER","70","3","0","LAYER","2","GEOMETRIJA","70","0","62","7","6","CONTINUOUS","0","LAYER","2","OSI","70","0","62","1","6","DASHDOT","0","LAYER","2","TEKST","70","0","62","3","6","CONTINUOUS","0","ENDTAB","0","ENDSEC","0","SECTION","2","ENTITIES");
  function flip(v){return 297-v}
  function segLine(a,b,dash,layer){
    if(Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9)return; // brez črt z ničelno dolžino
    var g=["0","LINE","8",layer||"GEOMETRIJA","10",num(a.x),"20",num(flip(a.y)),"30","0","11",num(b.x),"21",num(flip(b.y)),"31","0"];
    if(dash){g.push("6","DASHDOT");g[3]="OSI"}
    add.apply(null,g);
  }
  function ptsOf(e){var pts=(e.getAttribute("points")||"").trim().split(/\s+/),p=[];pts.forEach(function(q){var v=q.split(",");if(v.length===2)p.push({x:parseFloat(v[0]),y:parseFloat(v[1])})});return p}
  var els=doc.getElementsByTagName("*");
  for(var i=0;i<els.length;i++){
    var e=els[i],tag=e.tagName.toLowerCase();
    function A(k){return parseFloat(e.getAttribute(k)||0)}
    if(tag==="line"){
      segLine({x:A("x1"),y:A("y1")},{x:A("x2"),y:A("y2")},e.getAttribute("stroke-dasharray"));
    }else if(tag==="circle"){
      add("0","CIRCLE","8","GEOMETRIJA","10",num(A("cx")),"20",num(flip(A("cy"))),"30","0","40",num(A("r")));
    }else if(tag==="rect"){
      var x=A("x"),y=A("y"),w=A("width"),h=A("height");
      segLine({x:x,y:y},{x:x+w,y:y});segLine({x:x+w,y:y},{x:x+w,y:y+h});segLine({x:x+w,y:y+h},{x:x,y:y+h});segLine({x:x,y:y+h},{x:x,y:y});
    }else if(tag==="polyline"){
      var p=ptsOf(e);
      for(var j=1;j<p.length;j++)segLine(p[j-1],p[j]);
    }else if(tag==="polygon"){
      /* Faza 1: poligoni se prej tiho izpuščali (CAD audit: 68 poligonov/izometrični pogled) */
      var pg=ptsOf(e);
      for(var j3=1;j3<pg.length;j3++)segLine(pg[j3-1],pg[j3]);
      if(pg.length>2)segLine(pg[pg.length-1],pg[0]);
    }else if(tag==="path"){
      // zavestni parser poti: M/L/Q/Z; kvadratne krivulje (Q) se vzorčijo v polilinijo
      var d=e.getAttribute("d")||"",tk=d.match(/[A-Za-z]|-?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g)||[];
      var pv=[],px=0,py=0,sp=null;
      function flushPoly(){if(pv.length>1)for(var t2=1;t2<pv.length;t2++)segLine(pv[t2-1],pv[t2]);pv=[]}
      var ii=0;
      while(ii<tk.length){
        var C=tk[ii];
        if(!/[A-Za-z]/.test(C)){ii++;continue}
        if(C==="M"){ii++;flushPoly();px=parseFloat(tk[ii]);py=parseFloat(tk[ii+1]);ii+=2;sp={x:px,y:py};pv.push({x:px,y:py})}
        else if(C==="L"){ii++;px=parseFloat(tk[ii]);py=parseFloat(tk[ii+1]);ii+=2;pv.push({x:px,y:py})}
        else if(C==="Q"){ii++;var qx=parseFloat(tk[ii]),qy=parseFloat(tk[ii+1]),ex=parseFloat(tk[ii+2]),ey=parseFloat(tk[ii+3]);ii+=4;for(var s2=1;s2<=seg;s2++){var tt=s2/seg,mt=1-tt;pv.push({x:mt*mt*px+2*mt*tt*qx+tt*tt*ex,y:mt*mt*py+2*mt*tt*qy+tt*tt*ey})}px=ex;py=ey}
        else if(C==="Z"){ii++;if(sp){pv.push({x:sp.x,y:sp.y});px=sp.x;py=sp.y}flushPoly()}
        else{ii++}
      }
      flushPoly();
    }else if(tag==="text"){
      if(opts.geomOnly)continue;
      var tr=e.getAttribute("transform")||"",rot=0,mm=tr.match(/rotate\((-?[\d.]+)/);if(mm)rot=-parseFloat(mm[1]); // SVG y-navzdol → DXF y-navzgor: obrnjen predznak
      var anchor=e.getAttribute("text-anchor")||"start",h72=(anchor==="middle")?1:(anchor==="end")?2:0;
      var txt=(e.textContent||"").trim().replace(/≤/g,"<=").replace(/≥/g,">=");
      var rec=["0","TEXT","8","TEKST","10",num(A("x")),"20",num(flip(A("y"))),"30","0","40",num(A("font-size")||2.6),"1",txt,"50",num(rot)];
      if(h72)rec.push("72",String(h72),"11",num(A("x")),"21",num(flip(A("y"))),"31","0");
      add.apply(null,rec);
    }
  }
  add("0","ENDSEC","0","EOF");
  return out.join("\n");
}
/* Kodiranje v Windows-1250 (slovenska č/š/ž) — $DWGCODEPAGE ANSI_1250 */
function cp1250Bytes(str){
  var map={0x010D:0xE8,0x010C:0xC8,0x0161:0x9A,0x0160:0x8A,0x017E:0x9E,0x017D:0x8E,0x00D7:0xD7,0x00D8:0xD8,0x00B7:0xB7,0x00B0:0xB0,0x00B1:0xB1,0x2013:0x96,0x2014:0x97,0x201A:0x82,0x201D:0x94,0x00A0:0xA0,0x00AB:0xAB,0x00BB:0xBB,0x00E9:0xE9,0x00C9:0xC9,0x00FC:0xFC,0x00DC:0xDC,0x00F6:0xF6,0x00D6:0xD6,0x00E4:0xE4,0x00C4:0xC4,0x00DF:0xDF};
  var out=new Uint8Array(str.length),n2=0;
  for(var i=0;i<str.length;i++){
    var c=str.charCodeAt(i);
    if(c<128)out[n2++]=c;
    else if(map[c]!=null)out[n2++]=map[c];
    else out[n2++]=0x3F;
  }
  return out.subarray(0,n2);
}
function dxf(){generate();if(!svgEl())return;saveBlob(V("drw")+".dxf",cp1250Bytes(dxfString({})),"application/dxf")}
$("dlDxf").onclick=dxf;

/* ---------- STEP model export ---------- */
function stepString(){
  var ents=[],id=0;
  function add(s){ents.push("#"+(++id)+" = "+s+";");return "#"+id}
  function r(v){v=Math.round(v*1e6)/1e6;return v%1===0?v.toFixed(1):String(v)}
  function pt(x,y,z){return add("CARTESIAN_POINT('',("+r(x)+","+r(y)+","+r(z)+"))")}
  function solidBox(x0,y0,z0,x1,y1,z1,label){
    /* Faza 2 (Issue #2 §6.2 P2): skupna topologija — 8 VERTEX_POINT + 12 EDGE_CURVE na solid
       (prej 48 oglišč/24 robov s popolnimi podvajanji; striktna CAD jedra zahtevajo delitev). */
    var C=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    var P=C.map(function(q){return pt(q[0],q[1],q[2])});
    var V8=C.map(function(q){return add("VERTEX_POINT('',"+pt(q[0],q[1],q[2])+")")});
    var ED={};function edge(a,b){
      var k=a<b?a+"_"+b:b+"_"+a;
      if(!ED[k]){
        var dv=[C[b][0]-C[a][0],C[b][1]-C[a][1],C[b][2]-C[a][2]],dl=Math.hypot(dv[0],dv[1],dv[2])||1;
        var dn=add("DIRECTION('',("+dv.map(function(v){return r(v/dl)}).join(",")+"))");
        var vec=add("VECTOR('',"+dn+","+r(dl)+")"),li=add("LINE('',"+P[a]+","+vec+")");
        ED[k]={id:add("EDGE_CURVE('',"+V8[a]+","+V8[b]+","+li+",.T.)"),a:a,b:b};
      }
      return ED[k];
    }
    var faces=[];
    [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]].forEach(function(lp,fi){
      var norms=[[0,0,-1],[0,0,1],[0,-1,0],[1,0,0],[0,1,0],[-1,0,0]];
      var refs=[[1,0,0],[1,0,0],[1,0,0],[0,1,0],[1,0,0],[0,1,0]];
      var oe=[];
      for(var i=0;i<4;i++){
        var a=lp[i],b=lp[(i+1)%4];
        var ed=edge(a,b);
        var naprej=(ed.a===a&&ed.b===b);
        oe.push(add("ORIENTED_EDGE('',*,*,"+ed.id+","+(naprej?".T.":".F.")+")"));
      }
      var loop=add("EDGE_LOOP('',("+oe.join(",")+"))"),fb=add("FACE_BOUND('',"+loop+",.T.)");
      var nd=add("DIRECTION('',("+norms[fi].map(r).join(",")+"))"),rd=add("DIRECTION('',("+refs[fi].map(r).join(",")+"))");
      var ap=add("AXIS2_PLACEMENT_3D('',"+P[lp[0]]+","+nd+","+rd+")"),pl=add("PLANE('',"+ap+")");
      faces.push(add("ADVANCED_FACE('',("+fb+"),"+pl+",.T.)"));
    });
    var shell=add("CLOSED_SHELL('',("+faces.join(",")+"))");
    return add("MANIFOLD_SOLID_BREP('"+label+"',"+shell+")");
  }
  var L=n("L"),H=n("H"),D=n("D"),N=Math.max(1,Math.round(n("n"))),NP=Math.max(1,Math.round(n("np")));
  var sw=n("sw"),stn=n("st"),gap=n("gap");
  var tp=dim(V("topP"),[80,40]),bp=dim(V("botP"),[60,40]),pp=dim(V("postP"),[50,50]);
  var solids=[],isStair=(V("sysUse")==="stopniscna");
  if(isStair){
    /* Faza 1 (Issue #2 §6.2 P2): stopniščna ograja — poštena stopničasta reprezentacija
       (prej: bajtno identičen model pokončni ograji). Polni profili/prerezana polnila so poenostavitev. */
    var stN=Math.max(1,Math.round(n("stN"))),stR=Math.max(1,n("stRise")),stG=Math.max(1,n("stGoing")),
        stW=Math.max(200,n("stW")),stP=Math.max(2,Math.round(n("stPosts"))),rh=Math.max(300,n("stH"));
    var runW=stN*stG;
    for(var si=0;si<stN;si++){
      solids.push(solidBox(si*stG,0,si*stR,(si+1)*stG,st,si*stR+sw,"Infill (step) "+String(si+1)));
    }
    for(var pi2=0;pi2<stP;pi2++){
      var px2=runW*pi2/Math.max(1,stP-1);
      solids.push(solidBox(px2-pp[0]/2,-pp[1]/2,0,px2+pp[0]/2,pp[1]/2,rh,"Post "+(pi2+1)+" front"));
      solids.push(solidBox(px2-pp[0]/2,stW-pp[1]/2,0,px2+pp[0]/2,stW+pp[1]/2,rh,"Post "+(pi2+1)+" back"));
    }
  }else{
  var topH=Math.min(tp[1],H*0.2),botH=Math.min(bp[1],H*0.2);
  solids.push(solidBox(0,-tp[0]/2,H-topH,L,tp[0]/2,H,"Top profile"));
  solids.push(solidBox(0,-bp[0]/2,0,L,bp[0]/2,botH,"Bottom profile"));
  var inner=H-topH-botH,pitch=inner/N,sh=Math.max(2,sw/Math.max(1,sw+gap)*pitch);
  for(var i=0;i<N;i++){
    var z0=botH+i*pitch+gap/2,z1=Math.min(H-topH,z0+sh);
    solids.push(solidBox(0,-stn/2,z0,L,stn/2,z1,"Slat "+String(i+1)));
  }
  for(var k=0;k<NP;k++){
    var x=L*k/Math.max(1,NP-1);
    if(NP===1)x=L/2;
    solids.push(solidBox(x-pp[0]/2,-pp[1]/2,0,x+pp[0]/2,pp[1]/2,H,"Post "+(k+1)+" front"));
    solids.push(solidBox(x-pp[0]/2,D-pp[1]/2,0,x+pp[0]/2,D+pp[1]/2,H,"Post "+(k+1)+" back"));
  }
  /* P2 (Faza 3): cvetlična korita v 3D modelu — box na vrhu ograje (konzolni nosilec pod njim);
     enoten vir getKoritaData(); korita so izključena ob segmentih (kot izris). */
  var kdSt=getKoritaData();
  if(kdSt.active&&segsParse().length<2){
    kdSt.items.forEach(function(kt,ki){
      solids.push(solidBox(kt.x,D,H,kt.x+kt.w,D+kdSt.D,H+kdSt.H,"Cvetlično korito "+(ki+1)));
      solids.push(solidBox(kt.x+kt.w/2-30,D,H-60,kt.x+kt.w/2+30,D+kdSt.D,H,"Konzolni nosilec korita "+(ki+1)));
    });
  }
  }
  var appctx=add("APPLICATION_CONTEXT('core data for automotive mechanical design processes')");
  add("APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,"+appctx+")");
  var pctx=add("PRODUCT_CONTEXT('',"+appctx+",'mechanical')");
  var prod=add("PRODUCT('"+V("drw").replace(/'/g,"")+"','"+V("drw").replace(/'/g,"")+"','',("+pctx+"))");
  var form=add("PRODUCT_DEFINITION_FORMATION('','',"+prod+")");
  var pdefctx=add("PRODUCT_DEFINITION_CONTEXT('part definition',"+appctx+",'design')");
  var pdef=add("PRODUCT_DEFINITION('design','',"+form+","+pdefctx+")");
  var pshape=add("PRODUCT_DEFINITION_SHAPE('','',"+pdef+")");
  var u1=add("( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) )");
  var u2=add("( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) )");
  var u3=add("( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() )");
  var unc=add("UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-07),"+u1+",'distance_accuracy_value','confusion accuracy')");
  var rctx=add("( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT(("+unc+")) GLOBAL_UNIT_ASSIGNED_CONTEXT(("+u1+","+u2+","+u3+")) REPRESENTATION_CONTEXT('Context #1','3D Context with UNIT and UNCERTAINTY') )");
  var rep=add("SHAPE_REPRESENTATION('',("+solids.join(",")+"),"+rctx+")");
  add("SHAPE_DEFINITION_REPRESENTATION("+pshape+","+rep+")");
  add("PRODUCT_RELATED_PRODUCT_CATEGORY('part',$,("+prod+"))");
  var desc=isStair?"Stepped stair infill approximation (simplified box solids, not production CAD)":"Simplified box-solid approximation (not production CAD)";
  var out="ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('"+desc+"'),'2;1');\n";
  out+="FILE_NAME('"+V("drw").replace(/'/g,"")+"','"+(new Date()).toISOString().slice(0,19)+"',(''),'','','');\n";
  out+="FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));\nENDSEC;\nDATA;\n";
  out+=ents.join("\n")+"\nENDSEC;\nEND-ISO-10303-21;\n";
  return out;
}
$("dlStep").onclick=function(){saveBlob(V("drw")+".step",stepString(),"application/step")};
/* Faza 4 (Issue #2 pogl. 11): registr komponent — vsak vložek ima formulo količine + sled do zasnove.
   Vrata/tečaji/ključavnice: TBI — javno ni podatkov Roksala; specifikacije se ne izmišljujejo. */
var DW_COMPONENTS={
  topProfile:{naziv:"Zgornji profil",material:"Alu/jeklo",dim:function(){return V("topP")},qty:function(){return 1},izracun:"1 na odsek"},
  lamela:{naziv:function(){return "Lamela "+(WC[$("sysProfile").value]||WC.romb67).n},material:function(){return V("mat")||"WoodCore WPC"},dim:function(){return f(n("sw"))+"x"+f(n("st"))+" x "+f(cutLen())},qty:function(){return lamelaTotal()},izracun:function(){return lamelaBreakdown()+" kos — "+(USE_NAMES[V("sysUse")]||V("sysUse"))}},
  botProfile:{naziv:"Spodnji profil",material:"Alu/jeklo",dim:function(){return V("botP")},qty:function(){return 1},izracun:"1 na odsek"},
  aluCev:{naziv:"Alu cev 20×60×2 (obvezna)",material:function(){return "Aluminij (na prostem eloksirana)"},dim:function(){return "20×60×2 × "+f((V("sysUse")==="fasada")?n("H"):cutLen())+" mm"},qty:function(){return (V("sysUse")==="fasada")?Math.ceil(n("H")/1000)+1:2},izracun:function(){return (V("sysUse")==="fasada")?"letve ≤ 1000 mm: ceil(H/1000)+1":"zgoraj + spodaj (pregrada)"}},
  nosilec:{naziv:"Nosilec",material:"Jeklo",dim:function(){return V("postP")},qty:function(){return postCount()},izracun:function(){var l2=roksalLimit(WC[$("sysProfile").value]||WC.romb67,V("sysUse"),n("H"));return l2.label+" ≤ "+l2.v+" mm"}},
  vijakiRF:{naziv:"Vijaki RF",material:"Inox",dim:"2 na lamelo + 2 na nosilec",qty:function(){return 2*cutCount()+2*postCount()},izracun:"2 × lamela + 2 × nosilec"},
  pritrdilni:{naziv:function(){return "Pritrdilni vijak ("+V("bolt")+")"},material:"Inox",dim:function(){return V("bolt")},qty:function(){return postCount()*Math.max(0,n("nbolt"))},izracun:function(){return V("nbolt")+" na nosilec × "+postCount()}},
  sidra:{naziv:function(){return "Sidra ("+V("anchor")+" — "+V("emb")+" mm)"},material:"Inox",dim:function(){return V("anchor")+" — "+V("emb")+" mm"},qty:function(){return 2*postCount()},izracun:"2 na nosilec"},
  vrata:{naziv:"Vrata WoodCore",material:"TBI — podatki proizvajalca",dim:"TBI",qty:function(){return "TBI"},izracun:"NI v BOM — potrebna specifikacija Roksala"},
  korito:{naziv:"Cvetlično korito za rože",material:"WPC/alu (ocena — potrditi pri Roksalu)",dim:function(){var k=getKoritaData();return f(k.D)+"x"+f(k.H)+" — širine: "+(k.items.map(function(kt){return f(kt.w)}).join(", ")||"—")},qty:function(){return getKoritaData().items.length},izracun:"1 na korito — po razponih (P2)"},
  koritoNosilec:{naziv:"Konzolni nosilec korita",material:"Jeklo",dim:function(){return V("bracket")},qty:function(){return getKoritaData().items.reduce(function(a,kt){return a+koritoNosilci(kt.w)},0)},izracun:"max(2, ceil(širina/600)+1) na korito — ocena, potrditi pri Roksalu"}
};
function kosovnicaCsv(){
  var prof=WC[$("sysProfile").value]||WC.romb67;
  var use=V("sysUse");
  var compKeys=["topProfile","lamela","botProfile"];
  if(prof.n.indexOf("KUBO")>=0)compKeys.push("aluCev");
  compKeys.push("nosilec","vijakiRF","pritrdilni","sidra");
  var kdCsv=getKoritaData();
  if(kdCsv.active&&segsParse().length<2)compKeys.push("korito","koritoNosilec");
  var bomfeff=String.fromCharCode(65279);
  var rows=[["Št.","Naziv","Material","Dimenzije (mm)","Količina","Izračun"]];
  var st=1;
  compKeys.forEach(function(k){
    var c=DW_COMPONENTS[k];
    if(k==="lamela"){
      /* P1: lamele razčlenjene po dolžinah — glavna ograja, vsak segment, L-povratek */
      cutItems().forEach(function(it){
        rows.push([String(st++),it.name,typeof c.material==="function"?c.material():c.material,f(n("sw"))+"x"+f(n("st"))+"x2",String(it.qty),"dolžina "+f(it.len)+" mm"]);
      });
      return;
    }
    rows.push([String(st++),typeof c.naziv==="function"?c.naziv():c.naziv,typeof c.material==="function"?c.material():c.material,typeof c.dim==="function"?c.dim():c.dim,String(c.qty()),typeof c.izracun==="function"?c.izracun():c.izracun]);
  });
  if(use==="terasa"){
    var letve=Math.max(2,Math.ceil(n("L")/335)+1);
    rows.push([String(st++),"Podložne letve (center 33–35 cm)","WPC 40×30×2200 ali alu cev","40×30×2200 / alu 6 m",letve,"ceil(L/335)+1"]);
    rows.push([String(st++),"Distančniki","plastika/guma","na vsako letev pri vsaki deski",cutCount()*letve,"n × letve"]);
    rows.push([String(st++),"Turbo vijaki za beton","jeklo","6,7×80 mm",letve*4,"≈4 na letev"]);
    rows.push([String(st++),"Zaključna letev L","WPC","45×55 mm",f(n("L")/1000)+" m","ob rob; vijaki 30 cm, vsaka 2. deska"]);
  }
  rows.push(["","Masa lamel (ocena; brez profilov)","",f(mass())+" kg","","area·len·n·ρ"]);
  rows.push(["","Vrata WoodCore (TBI — ni v BOM)","TBI — podatki proizvajalca","TBI","TBI","potrebna specifikacija Roksala"]);
  return bomfeff+rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(";")}).join("\n");
}
var PROJ_SCHEMA="draftwright-project",PROJ_VERSION=3;
$("dlCsv").onclick=function(){saveBlob(V("drw")+"-kosovnica.csv",kosovnicaCsv(),"text/csv;charset=utf-8")};
