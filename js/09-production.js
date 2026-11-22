// Draftwright — modul 09-production (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
/* ---------- cut list / installation plan ---------- */
let planData=null;

/* ---------- Manufacturing: kerf-aware cut optimizer, quote, order ---------- */
let cutData=null, quoteData=null, orderText="", checklistText="";
/* Faza 1 (Issue #2, pogl. 2 P0-3): vsak vnos poniči proizvodne predračune —
   izvozi (meni in dialog) vedno znova gradijo iz trenutnega stanja, brez zastarelih podatkov. */
function invalidateProduction(){cutData=null;quoteData=null;planData=null;orderText="";checklistText="";}
/* Faza 1 (Issue #2 P0-1/P1-2): enoten vir dolžine reza in količin po uporabi —
   pokončna: lamele segajo med vodoravnima cevema (srednje polje, kot jih riše referenčni list);
   stopnice: višina ograje − 60 mm, kosov = stN, nosilci = stPosts. */
function cutLen(){
  var use=V("sysUse");
  if(use==="pokoncna")return Math.max(1,n("zoneMid"));
  if(use==="stopniscna")return Math.max(1,n("stH")-60);
  return Math.max(1,n("L"));
}
/* P1: segmenti (F4) in L-povratek (F5) v količinah — enoten vir za risbo, kosovnico,
   rezalni načrt, predračun in naročilnik. Brez segmentov se vse vrne na glavno ograjo. */
function segsParse(){
  var out=[];
  (V("segList")||"").trim().split("\n").forEach(function(sgl){var sgp=sgl.split(";"),sgw=pnum(sgp[1],0),sgh=pnum(sgp[2],0);
    if(sgp[0]&&sgp[0].trim()&&sgw>0&&sgh>0)out.push({n:sgp[0].trim(),w:sgw,h:sgh})});
  return out;
}
function lamelaCountFor(h){
  var tp=dim(V("topP"),[80,40]),bp=dim(V("botP"),[60,40]);
  var th=Math.min(tp[1],h*0.2),bh=Math.min(bp[1],h*0.2);
  return Math.max(1,Math.round((h-th-bh)/((n("sw")||1)+Math.max(0,n("gap")))));
}
function lamelaTotal(){
  var t=cutCount();
  segsParse().forEach(function(sg){t+=lamelaCountFor(sg.h)});
  if(Math.max(0,n("w2")||0)>0)t+=cutCount(); /* povratek: enaka višina kot glavna ograja */
  return t;
}
function lamelaBreakdown(){
  var pr=[];
  cutItems().forEach(function(it){if(String(it.name).indexOf("Lamela")===0)pr.push(f(it.len)+"×"+it.qty)});
  return pr.join(" + ")||(f(cutLen())+"×"+cutCount());
}
/* P2: korita za rože — vrstica v koritoList = "širina;odmik od levega roba" (mm).
   Višina/globina iz polj koritoH/koritoD (privzeti 310×220 po referenčni risbi uporabnika).
   ENOTEN VIR (Faza 3 P2): vse uporabe — izris, prerez, BOM, kosovnica, montažni načrt,
   naročilnik, checks() — kličejo getKoritaData(). Validacija:
   - robustno razčlenjevanje: trim, prazne vrstice ignorirane, neveljavne vrstice → opozorilo
   - meje: 0 ≤ odmik, odmik+širina ≤ L; preseganje → opozorilo + izključitev iz količin
   - svetovalni meji: H ≥ 100 mm (stabilnost), D ≥ 150 mm (drenaža) — opozorilo, ne napaka
   - H/D = 0 z vnešenimi koriti → opozorilo */
function getKoritaData(){
  var L=n("L"),out={items:[],warnings:[],H:Math.max(0,n("koritoH")||0),D:Math.max(0,n("koritoD")||0),active:false};
  String(V("koritoList")||"").split("\n").forEach(function(kl,li){
    var line=String(kl||"").trim();
    if(!line)return;
    var kp=line.split(";");
    var kw=pnum(kp[0],0),kx=pnum(kp[1],0);
    if(!(kw>0&&kx>=0)){out.warnings.push("Vrstica "+(li+1)+" korit je neveljavna — pričakovano »širina;odmik« (mm).");return}
    if(kx+kw>L){out.warnings.push("Korito "+f(kw)+" mm na odmiku "+f(kx)+" mm presega dolžino ograje "+f(L)+" mm — izpuščeno iz količin.");return}
    out.items.push({w:kw,x:kx});
  });
  if(out.items.length){
    if(!(out.H>0))out.warnings.push("Vnešena so korita, a višina korita je 0 — nastavite višino (privzeto 310 mm).");
    if(!(out.D>0))out.warnings.push("Vnešena so korita, a globina korita je 0 — nastavite globino (privzeto 220 mm).");
    if(out.H>0&&out.H<100)out.warnings.push("Višina korita "+f(out.H)+" mm je pod priporočilom (≥100 mm za stabilnost).");
    if(out.D>0&&out.D<150)out.warnings.push("Globina korita "+f(out.D)+" mm je pod priporočilom (≥150 mm za drenažo).");
    out.active=out.H>0&&out.D>0;
  }
  return out;
}
function koritoParse(){return getKoritaData().items}
function koritoHVal(){return Math.max(0,n("koritoH")||0)}
function koritoDVal(){return Math.max(0,n("koritoD")||0)}
function koritoNosilci(w){return Math.max(2,Math.ceil(w/600)+1)} /* ocena: robova + vsakih 600 mm — potrditi pri Roksalu */
function cutCount(){
  return (V("sysUse")==="stopniscna")?Math.max(1,Math.round(n("stN"))):Math.max(1,Math.round(n("n")));
}
function postCount(){
  var base=(V("sysUse")==="stopniscna")?Math.max(1,Math.round(n("stPosts"))):Math.max(1,Math.round(n("np")));
  var lim=roksalLimit(WC[$("sysProfile").value]||WC.romb67,V("sysUse"),n("H"));
  segsParse().forEach(function(sg){base+=Math.max(2,Math.ceil(sg.w/lim.v)+1)});
  if(Math.max(0,n("w2")||0)>0)base+=Math.max(2,Math.ceil(Math.max(0,n("w2"))/lim.v)+1);
  return base;
}
function parseLens(raw){
  var out=[];
  String(raw||"").split(/[;,]/).forEach(function(x){
    x=pnum(x,0);
    if(isFinite(x)&&x>0)out.push(Math.round(x));
  });
  return out.length?out:[5800];
}
function optimizeStock(piece,count,stocks,kerf){
  /* Faza 1 (Issue #2 P2-2): dinamično programiranje — točen optimum za enako dolge kose
     (preverjeno proti brute-force: matematični audit m2-math, 52/52 primerov).
     Odpadek: k kosov na deski pomeni k−1 rezov (P2-5) — prej je odštel k·kerf. */
  var left=Math.max(0,Math.round(count)),k2=Math.max(0,kerf);
  var uniq=stocks.filter(function(v,i,a){return a.indexOf(v)===i}).filter(function(B){return B>=piece}).sort(function(a,b){return a-b});
  function greedy(){ // rezerva za ekstremne količine (left>3000): stara greedy hevristika
    var traki=[],rem=left,guard=0;
    while(rem>0&&guard++<500){
      var best=null;
      uniq.forEach(function(B){
        var k=Math.min(rem,Math.max(1,Math.floor((B+k2)/(piece+k2))));
        if(k<1)return;
        var w=Math.max(0,B-k*piece-(k-1)*k2),eff=k>0?w/k:Infinity;
        if(!best||eff<best.eff-1e-9||(Math.abs(eff-best.eff)<=1e-9&&B<best.B))best={eff:eff,B:B,k:k};
      });
      if(!best)break;
      traki.push({B:best.B,k:best.k,waste:best?Math.max(0,best.B-best.k*piece-(best.k-1)*k2):0});
      rem-=best.k;
    }
    return {traki:traki,unfilled:rem};
  }
  if(!left||!uniq.length)return {traki:[],unfilled:left};
  if(left>3000)return greedy();
  var dp=[{cost:0,prev:null}];
  for(var x=1;x<=left;x++){
    var best=null;
    for(var bi=0;bi<uniq.length;bi++){
      var B=uniq[bi];
      var k=Math.min(x,Math.max(1,Math.floor((B+k2)/(piece+k2))));
      if(k<1)continue;
      var prev=dp[x-k];
      if(!best||prev.cost+B<best.cost)best={cost:prev.cost+B,prev:{B:B,k:k}};
    }
    dp[x]=best||{cost:Infinity,prev:null};
  }
  if(!isFinite(dp[left].cost))return {traki:[],unfilled:left};
  var traki=[],x=left;
  while(x>0&&dp[x].prev){
    var pr=dp[x].prev;
    traki.push({B:pr.B,k:pr.k,waste:Math.max(0,pr.B-pr.k*piece-(pr.k-1)*k2)});
    x-=pr.k;
  }
  return {traki:traki,unfilled:Math.max(0,left-traki.reduce(function(a,t){return a+t.k},0))};
}

/* ---------- Built-in regression self-test ---------- */
function selfTest(){
  var profiles=Object.keys(WC),uses=["precna","pokoncna","fasada","terasa","pregrada","napusc","stopniscna"];
  var vals={L:[2000,4000,6000],H:[900,1200,1500],n:[6,16,40],gap:[10,27,50]};
  var total=0,failed=[],errs=[];
  function snap(){var d={};fields.forEach(function(id){d[id]=V(id)});d.ref=$("refMode").checked;return d}
  function restore(d){fields.forEach(function(id){if(d[id]!=null)$(id).value=d[id]});$("refMode").checked=!!d.ref}
  var orig=snap();
  var oldErr=window.onerror;var captured=[];
  window.onerror=function(m){captured.push(String(m));return true};
  try{
    profiles.forEach(function(pk){
      uses.forEach(function(u){
        for(var i=0;i<3;i++){
          total++;
          try{
            $("sysProfile").value=pk;$("sysUse").value=u;
            $("L").value=vals.L[i];$("H").value=vals.H[i];
            $("n").value=vals.n[i];$("gap").value=vals.gap[i];
            $("refMode").checked=(u==="pokoncna"||i%2===0);
            $("sysUse").dispatchEvent(new Event("change",{bubbles:true}));
            generate();
            var svg=document.querySelector("#prev svg");
            if(!svg||svg.querySelectorAll("text").length<10)failed.push(pk+"/"+u+"/"+i+": no svg");
          }catch(e){failed.push(pk+"/"+u+"/"+i+": "+e.message)}
        }
      });
    });
  }finally{window.onerror=oldErr;restore(orig);checks();}
  errs=captured;
  var msg="Samoprevera: "+total+" kombinacij · "+failed.length+" napak · "+errs.length+" JS napak"+
    (failed.length?" · "+failed.slice(0,3).join(" | "):"")+
    (errs.length?" · JS: "+errs.slice(0,2).join(" | "):"");
  $("globalStatus").textContent=msg;
  $("globalStatus").style.color=failed.length||errs.length?"var(--bad)":"var(--ok)";
  return {total:total,failed:failed,errors:errs};
}
$("menuSelfTest").onclick=selfTest;

/* Faza 3 (Issue #2 pogl. 7): postavke reza po uporabi — več dolžin hkrati (stopnice: lamela + ročaj) */
function cutItems(){
  var pn=(WC[$("sysProfile").value]||WC.romb67).n;
  var items=[{name:"Lamela "+pn,len:Math.round(cutLen()),qty:cutCount()}];
  segsParse().forEach(function(sg){items.push({name:"Lamela "+pn+" — "+sg.n,len:Math.round(sg.w),qty:lamelaCountFor(sg.h)})});
  if(Math.max(0,n("w2")||0)>0)items.push({name:"Lamela "+pn+" — L-povratek",len:Math.round(n("w2")),qty:cutCount()});
  if(V("sysUse")==="stopniscna"){
    var stRun=n("stN")*n("stGoing"),stTot=n("stN")*n("stRise"),slope=Math.hypot(stRun,stTot);
    items.push({name:"Ročaj (naklon)",len:Math.round(slope),qty:2});
  }
  return items.filter(function(it){return it.len>0&&it.qty>0});
}
/* Faza 3: večdolžinski nesting — FFD (first-fit-decreasing, padajoče dolžine) prek obstoječih desk;
   enodolžinski primeri ostanejo na DP (optimalen). Odpadek šteje k−1 rezov na desko. */
function optimizeMulti(items,stocks,kerf){
  var pieces=[];
  items.slice().sort(function(a,b){return b.len-a.len}).forEach(function(it){
    for(var i=0;i<it.qty;i++)pieces.push({len:it.len,name:it.name});
  });
  var uniq=stocks.filter(function(v,i2,a){return a.indexOf(v)===i2}).sort(function(a,b){return a-b});
  var boards=[];
  pieces.forEach(function(pc2){
    var best=null;
    boards.forEach(function(b){
      if(b.closed)return;
      var usedLen=b.segs.reduce(function(a,s2){return a+s2.len},0)+(b.segs.length>1?(b.segs.length-1)*kerf:0); // rezi MED obstoječimi kosi
      var avail=b.B-usedLen;
      var need=(b.segs.length>0?kerf:0)+pc2.len; // nov rez + kos
      if(need<=avail&&(best===null||avail-need<best.after))best={b:b,after:avail-need};
    });
    if(!best){
      var stock=null;
      for(var s3=0;s3<uniq.length;s3++)if(uniq[s3]>=pc2.len){stock=uniq[s3];break}
      if(stock===null)return; // kos ne gre v nobeno zalogo → unfilled
      best={b:{B:stock,segs:[]},after:stock-pc2.len};
      boards.push(best.b);
    }
    best.b.segs.push({len:pc2.len,name:pc2.name});
  });
  var rows=[];
  boards.forEach(function(b,i3){
    var usedLen=b.segs.reduce(function(a,s2){return a+s2.len},0);
    var waste=b.B-usedLen-(b.segs.length>0?b.segs.length-1:0)*kerf;
    var content=b.segs.map(function(s2){return s2.name+" "+s2.len+" mm"}).join(" + ");
    var counts={};b.segs.forEach(function(s2){counts[s2.name]=(counts[s2.name]||0)+1});
    var partStr=Object.keys(counts).map(function(k2){return counts[k2]+" kos "+k2}).join(" + ");
    rows.push(["DESKA "+(i3+1),b.B+" mm",partStr,content,waste+" mm"]);
  });
  var unfilled=pieces.length-boards.reduce(function(a,b){return a+b.segs.length},0);
  return {rows:rows,unfilled:unfilled,boards:boards,pieces:pieces.length};
}
function buildCut(){
  var p=WC[$("sysProfile").value];
  var N=cutCount(),kerf=Math.max(0,n("kerf"));
  var stocks=parseLens($("stockLen").value);
  var items=cutItems(),piece=Math.round(items[0].len);
  var rows=[],used=0,waste=0,unfilled=0;
  if(items.length===1){
    /* enodolžinski: DP — točen optimum (Faza 1) */
    var r=optimizeStock(piece,N,stocks,kerf),pc=1;
    r.traki.forEach(function(t,i){
      var p1=pc,p2=pc+t.k-1;pc+=t.k;
      rows.push(["DESKA "+(i+1),t.B+" mm",t.k+" kos",p1+"–"+p2,t.waste+" mm"]);
    });
    used=r.traki.reduce(function(a,t){return a+t.B},0);
    waste=r.traki.reduce(function(a,t){return a+t.waste},0);
    unfilled=r.unfilled;
  }else{
    /* večdolžinski: FFD nesting po padajočih dolžinah (stopnice: lamela + ročaj) */
    var m=optimizeMulti(items,stocks,kerf);
    rows=m.rows;unfilled=m.unfilled;
    used=m.boards.reduce(function(a,b){return a+b.B},0);
    waste=m.boards.reduce(function(a,b){
      return a+b.B-b.segs.reduce(function(a2,s2){return a2+s2.len},0)-(b.segs.length>0?b.segs.length-1:0)*kerf;
    },0);
  }
  var yieldPct=used>0?Math.round((1-waste/used)*100):0;
  cutData={piece:piece,count:N,kerf:kerf,rows:rows,used:used,waste:waste,yield:yieldPct,unfilled:unfilled,profile:p.n,items:items};
  var summary=N+' kos × '+piece+' mm'+(items.length>1?' + '+items.slice(1).map(function(it){return it.qty+' kos × '+it.len+' mm'}).join(' + '):'');
  $("cutOut").innerHTML='<b style="color:var(--tx)">Rezalni načrt (kerf '+f(kerf)+' mm):</b> '+summary+' · nabava '+(rows.length)+' desk · poraba '+(used/1000).toFixed(2)+' m · odpad '+(waste/1000).toFixed(2)+' m · izkoristek '+yieldPct+'%'+((unfilled>0)?' · <span style="color:var(--bad)">'+unfilled+' kosov ni mogoče izrezati!</span>':'')+
    (rows.length?'<table style="width:100%;font-size:11px;border-collapse:collapse;margin-top:5px"><tr><th>Vir</th><th>Deska</th><th>Količina</th><th>Vsebina</th><th>Ostanek</th></tr>'+rows.map(function(x){return '<tr><td>'+E(x[0])+'</td><td>'+E(x[1])+'</td><td>'+E(x[2])+'</td><td>'+E(x[3])+'</td><td>'+E(x[4])+'</td></tr>'}).join('')+'</table>':'');
  buildQuote();
  buildOrder();
  return cutData;
}
function buildQuote(){
  if(!cutData)buildCut();
  var p=WC[$("sysProfile").value],np=postCount(),use=V("sysUse");
  var boardM=cutData.used/1000, rfScrews=2*cutData.count+2*np, fixScrews=np*Math.max(0,n("nbolt"));
  var pb=n("priceBoard"),pp=n("pricePost"),ps=n("priceScrew"),pw=n("priceWork"),wh=n("workHours");
  var firstLbl=(use==="terasa")?"Nosilci / podložne letve (center 33–35 cm)":"Nosilci";
  var firstQty=(use==="terasa")?Math.max(2,Math.ceil(n("L")/335)+1):np;
  var items=[["WPC deske "+p.n,boardM.toFixed(2)+" m",boardM*pb],
             [firstLbl,firstQty+" kos",firstQty*pp],
             ["Vijaki RF (2 na lamelo + 2 na nosilec)",rfScrews+" kos",rfScrews*ps],
             ["Pritrdilni vijaki ("+V("bolt")+")",fixScrews+" kos",fixScrews*ps],
             ["Montaža",wh+" ur",wh*pw]];
  var total=items.reduce(function(a,x){return a+x[2]},0);
  quoteData={items:items,total:total};
  $("quoteOut").innerHTML='<b style="color:var(--tx)">Orientacijski predračun (brez DDV):</b> <b style="color:var(--ac)">'+total.toFixed(2)+' EUR</b> · <span style="color:var(--mut)">cene so nastavljive zgoraj; sidra, alu cevi in dostava niso vključeni; predračun ni ponudba.</span>';
  return quoteData;
}
function buildOrder(){
  if(!cutData)buildCut();
  var p=WC[$("sysProfile").value],np=postCount(),lim=roksalLimit(p,V("sysUse"),n("H"));
  var agg={};cutData.rows.forEach(function(r){if(r&&r[1])agg[r[1]]=(agg[r[1]]||0)+1});
  function boardWord(k){return k===1?"deska":((k>=2&&k<=4)?"deski":"desek")}
  var lines=["NAROČILO — WPC material ("+(V("dobavitelj")||"WoodCore")+")",
    "Naloga: "+V("drw")+" • Stranka: "+(V("stranka")||"—")+" • Objekt: "+(V("objekt")||"—"),"",
    "DESKE:",
    "- "+p.n+", barva "+V("sysColor")+" ("+V("sysSurface")+"): "+cutData.count+" kos × "+cutData.piece+" mm",
    "- Nabava: "+Object.keys(agg).map(function(k){return k+" × "+agg[k]+" "+boardWord(agg[k])}).join("; "),
    "- Odpad: "+(cutData.waste/1000).toFixed(2)+" m, izkoristek "+cutData.yield+"%","",
    "PROFILI IN PRITRDILA:",
    "- Nosilci: "+np+" kos ("+lim.label+" ≤ "+lim.v+" mm)",
    "- Vijaki RF: "+(2*cutData.count+2*np)+" kos; pritrdilni ("+V("bolt")+"): "+(np*Math.max(0,n("nbolt")))+" kos",
    "- Sidra: "+(2*np)+" kos, globina "+V("emb")+" mm, podlaga "+V("sub"),
    (function(){var k=getKoritaData();return k.active&&segsParse().length<2?"- Cvetlična korita: "+k.items.length+" kos (globina "+f(k.D)+" × višina "+f(k.H)+" mm; širine: "+k.items.map(function(kt){return f(kt.w)}).join(", ")+") — konzolni nosilci: "+(k.items.reduce(function(a,kt){return a+koritoNosilci(kt.w)},0))+" kos":""})(),
    (p.n.indexOf("KUBO")>=0)?"- Alu cev 20×60×2 (obvezna — na prostem eloksirana): "+((V("sysUse")==="fasada")?(Math.ceil(n("H")/1000)+1)+" kos":"2 kos")+"":"",
    "",
    "PRODAJNI POGOJI (Roksal d.o.o., splošni pogoji v5.0):",
    "- Ponudba velja 1 dan od izdaje; potrditev z avansom = pogodba.",
    "- Komercialna garancija ob poravnavi računa v 30 dneh; ugovor računu pisno v 8 dneh.",
    "- B2B: vidne napake ob prevzemu, skrite v 8 dneh od odkritja; B2C odstop v 14 dni — razrezano po meri izključeno.",
    "- Vračilo zaloge v 30 dni, originalno stanje, nerazrezano (manipulativni stroški do 20 %).",
    "- Prevzem materiala v 8 dneh po pozivu; skladiščnina 10/20 EUR + DDV na dan.",
    "- Barvni odtenek med serijami variira; posvetlitev 5–10 % ni reklamacija; na eni površini material iste serije.",
    "",
    "DOSTAVA IN PREVOZ:",
    "- Dolgi profili 4,0/5,8 m: Roksal dostava ali osebni prevzem (kurirji samo do cca 1,5–2 m).",
    "- Razklada: min. 1 oseba kupca pomaga; 1 m² terase ≈ 25 kg; paket 2×4 m ≈ 20 kg.",
    "- Prevoz: podpora po celotni dolžini in širini, opozorilna tabla, trakovi; poškodbe zaradi neustreznega prevoza niso reklamacija.",
    "",
    "KONTAKT — ROKSAL D.O.O.: terase/prevzem 064 123 020 · ograje 064 123 030 · fasade 064 120 969 · info@roksal.com",
    "Salon: Savska Loka 21, 4000 Kranj (pon–čet 7:00–15:30, pet 7:00–14:00) · Sedež: Zgornje Bitnje 186, 4209 Žabnica",
    "",
    "Risba NI statični izračun — nosilnost in sidranje preveri strokovnjak."];
  orderText=lines.join("\n");
  return orderText;
}
/* ---------- Tehnični list materiala (vir: Garancija in tehnična dokumentacija WOODCORE, PDF roksal.com) ---------- */
function techListTxt(){
  var rows=[
    ["Vsebnost vlage","≤ 2 %","0,6 %"],
    ["Trdota (HRR)","≥ 58","61"],
    ["Sila upogibanja","≥ 20 MPa","23,8 MPa"],
    ["Elastični modul upogibanja","≥ 1800 MPa","2360 MPa"],
    ["Sprememba debeline po absorpciji vode","≤ 1 %","0,6 %"],
    ["Vpliv udarca uteži pri nizki temperaturi","≤ 1 poškodba","0"],
    ["Sprememba dimenzije pri cikličnem ohlajanju/segrevanju","± 0,2 %","0,08 %"],
    ["Dimenzionalna stabilnost po segrevanju","± 2,5 %","0,11 %"],
    ["Sila pritrjenega vijaka","≥ 1000 N","1840 N"]
  ];
  var L=["TEHNIČNI LIST — WOODCORE WPC DESKE (ROKSAL D.O.O.)",
    "Datum: "+V("date")+" · Risba št.: "+V("drw")+" · Projekt: "+V("proj"),
    "",
    "SPLOŠNO",
    "- Sestava: 60 % bambusovih vlaken + 30 % polietilena + 10 % aditivov (spletna stran); PDF garancije navaja 60 % bambus + 40 % HDPE.",
    "- Življenjska doba: > 35 let · Garancija: 15 let material (pogoji v garancijskem PDF) · 2 leti na izvedena dela.",
    "- Protizdrsno tudi mokro · ne gnije, ne posivi · barva prvo leto posvetli 5–10 %, nato ostane enaka.",
    "- Čiščenje: z vodo, visokotlačno do 60 barov (curek ne v odprte prekate/zgornje robove); pranje 1–2× letno.",
    "- Montaža ni primerna pod +5 °C · voda ne sme zastajati v deskah (zmrzal → pokanje, brez garancije).",
    "",
    "TEHNIČNI PODATKI (zahteva / izmerjeno):"];
  rows.forEach(function(r){L.push("- "+r[0]+": "+r[1]+" / "+r[2])});
  L.push("");
  L.push("VIRI:");
  L.push("- Navodila za montažo: https://roksal.com/wp-content/uploads/WOODCORE_navodila_za_montazo-sl.pdf");
  L.push("- Garancija in tehnična dokumentacija: https://roksal.com/wp-content/uploads/Garancija%20in%20tehni%C4%8Dna%20dokumentacija%20WOODCORE.pdf");
  L.push("- Kontakt: terase/prevzem 064 123 020 · ograje 064 123 030 · fasade 064 120 969 · info@roksal.com");
  return L.join("\n");
}
/* ---------- Povpraševanje Roksal (struktura obrazcev roksal.com/wpc-povprasevanje) ---------- */
function povprasevanjeTxt(){
  var use=V("sysUse"),p=WC[$("sysProfile").value]||WC.romb67,lim=roksalLimit(p,use,n("H"));
  var np=Math.max(1,Math.round(n("np"))),span=np>1?n("L")/(np-1):n("L");
  var L=[
    "POVPRAŠEVANJE — WOODCORE WPC DESKE",
    "Datum: "+V("date")+" · Risba št.: "+V("drw")+" · Rev: "+V("rev"),
    "",
    "KONTAKT",
    "Naslovljeno na: "+V("strankaTip"),
    "Ime in priimek / naziv: "+(V("stranka")||"—"),
    "Davčna številka: "+(V("strankaDav")||"—")+" (če podjetje)",
    "Naslov: "+(V("strankaNaslov")||"—"),
    "E-pošta: "+(V("strankaEmail")||"—")+" · Telefon: "+(V("strankaTel")||"—"),
    "Način dobave/montaže: "+V("dobavaMode"),
    "",
    "PROJEKT",
    "Vrsta: "+(USE_NAMES[use]||use),
    "Profil: "+p.n+" — "+f(p.w)+"×"+f(p.t)+"×"+p.len+" mm",
    "Barva: "+V("sysColor")+" ("+V("sysSurface")+")",
    "Dimenzije: dolžina "+f(n("L"))+" mm × višina "+f(n("H"))+" mm × globina "+f(n("D"))+" mm",
    "Št. lamel/desk: "+Math.max(1,Math.round(n("n")))+" · razmak med deskami "+f(n("gap"))+" mm",
    lim.label+": izračun "+Math.round(span)+" mm (omejitev ≤ "+lim.v+" mm)",
    "Št. stebrov/nosilcev: "+np,
    "Podlaga: "+V("subType")+" — "+(V("sub")||"—"),
    "Pritrjenje: "+V("mountType")+" · vijaki "+V("bolt")+" · sidra "+V("anchor")+" ("+V("emb")+" mm)",
    "Montaža pri: "+V("installTemp")+" °C · padec podlage "+V("slopeMM")+" mm/m",
    "",
    "DODATNO",
    "Objekt: "+(V("objekt")||"—")+" · Izvajalec: "+(V("installer")||"—")+" · Datum prevzema: "+(V("handoverDate")||"—"),
    "Opombe: "+(V("notes").split("\n").filter(Boolean).slice(0,3).join(" / ")||"—"),
    "",
    "PRILOGE",
    "Fotografije/skice (skupaj ≤ 25 MB) pošljite na info@roksal.com ali priložite pri oddaji na roksal.com/wpc-povprasevanje.",
    "Tehnična risba "+V("drw")+" — priložite izvoz PDF/SVG iz aplikacije Tehnična risba PRO."
  ];
  return L.join("\n");
}
$("menuDlTech").onclick=function(){saveBlob(V("drw")+"-tehnicni-list.txt",techListTxt(),"text/plain;charset=utf-8")};
$("menuDlEnquiry").onclick=function(){saveBlob(V("drw")+"-povprasevanje.txt",povprasevanjeTxt(),"text/plain;charset=utf-8")};
function buildChecklist(){
  var p=WC[$("sysProfile").value]||WC.romb67,use=V("sysUse"),H=n("H"),lim=roksalLimit(p,use,H),rail=roksalRailLimit(p),rowsN=Math.max(2,Math.ceil(H/rail)+1);
  var L=[];
  L.push("MONTAŽNI CHECKLIST / PREVZEMNA KONTROLA — ROKSAL WOODCORE");
  L.push("Risba: "+V("drw")+" · Rev: "+V("rev")+" · Projekt: "+V("proj"));
  L.push("Stranka: "+(V("stranka")||"—")+" · Objekt: "+(V("objekt")||"—")+" · Izvajalec: "+(V("installer")||"—"));
  L.push("Profil: "+p.n+" · "+f(p.w)+"×"+f(p.t)+"×"+p.len+" mm · Barva: "+V("sysColor")+" ("+V("sysSurface")+")");
  L.push("Temperature ob montaži: "+V("installTemp")+" °C (min. +5 °C) · Padec podlage: "+V("slopeMM")+" mm/m · Datum: "+(V("handoverDate")||"—"));
  L.push("Pravilo: "+roksalUseNotes(p,use,H));
  if(use!=="stopniscna"&&(p.allowed||[]).indexOf(use)<0)L.push("POZOR: profil "+p.n+" ni predviden za "+(USE_NAMES[use]||use)+" — pred naročilom potrditi pri Roksal!");
  L.push("");
  L.push("A. DOSTAVA IN SKLADIŠČENJE");
  L.push("[ ] Količina, vidna kakovost in embalaža preverjeni ob prevzemu; nepravilnosti takoj sporočene.");
  L.push("[ ] Profili 4,0 / 5,8 m podprti po celi dolžini; nobenega nalaganja na streho osebnega vozila.");
  L.push("[ ] Material skladiščen suho, zračno, ravno in čisto; ob zunanjem skladiščenju pokrito.");
  L.push("[ ] Serija/odtenek evidentirana; Rustic Oak / Rustic Walnut imata izrazitejšo variacijo.");
  L.push("");
  L.push("B. PRED MONTAŽO");
  L.push("[ ] Jutranja temperatura ≥ +5 °C; dilatacijske reže določene po Roksal temperaturni tabeli.");
  L.push("[ ] Nosilnost podlage, steber, zidov in sidranje preverjeni; risba ni statični izračun.");
  L.push("[ ] Orodje: baterijski vrtalnik (ročni izvijač ni primeren), Widia/HM rezila, brusni papir granulacija 40 (praske), grezilo; RF vijaki odporni na rjo in korozijo.");
  L.push("[ ] Obstoječi varjeni deli na stebrih odstranjeni: "+(V("weldedParts")==="da"?"DA — odstraniti":V("weldedParts")==="ne"?"NI DELOV":"NI PREVERJENO"));
  L.push("[ ] Stebri v ravnini; način pritrditve: "+V("mountType")+".");
  if(use==="terasa")L.push("[ ] Podlaga: beton ≥ 60 mm ali estrih z hidroizolacijo, padec ≥ 10 mm/m, odtok prost.");
  L.push("");
  L.push("C. GEOMETRIJA IN PRITRDITEV");
  L.push("[ ] "+lim.label+": izmerjeno ____ mm, dovoljeno ≤ "+lim.v+" mm.");
  if(use==="precna"){
    L.push("[ ] Spoji desk samo na stebru; pritrdilni vijak 30 mm od roba reza.");
    L.push("[ ] Predvrtanje: "+p.drill+"; vijaki Inox A2/A4.");
    if(p.n.indexOf("ROMB")>=0)L.push("[ ] ROMB: alu cev v profilu obvezna; pri >1450 mm vmesna povezava do <1800 mm, nad tem nov steber.");
    L.push("[ ] Ročica: vijaki vsakih 500 mm od zgoraj navzdol, segment ≤ 4000 mm, vogal 1 mm.");
    L.push("[ ] Korita/posode: kovinska konstrukcija v razmaku 700 mm.");
  }else if(use==="pokoncna"){
    L.push("[ ] Vodoravne cevi: "+rowsN+" vrst, razmak ≤ "+rail+" mm.");
    L.push("[ ] Odmik vijaka od roba reza: min. 30 mm, max. "+(V("mountType")==="bočno na ploščo"?"100 mm (bočno)":"150 mm (na ploščo)")+".");
    L.push("[ ] Predvrtanje: "+p.drill+"; vijaki Inox A2/A4.");
    if(p.n.indexOf("ROMB")>=0)L.push("[ ] ROMB: alu cev v profilu, konci zaprti s čepi.");
    L.push("[ ] Ročica: vijaki vsakih 500 mm od zgoraj navzdol, segment ≤ 4000 mm, vogal 1 mm.");
  }else if(use==="fasada"){
    L.push("[ ] Skupna debelina na izolaciji: "+((p.facade&&p.facade.buildup)||"—")+"; okoli odprtin alu pločevina 2 mm.");
    L.push("[ ] Prezračevanje podkonstrukcije zagotovljeno; paneli brez prezračevanja niso dovoljeni.");
    if(p.n.indexOf("KUBO")>=0)L.push("[ ] KUBO: alu cev 20×60×2 mm, samo zgoraj/spodaj do 2500 mm.");
    if(p.n.indexOf("ROMB")>=0)L.push("[ ] ROMB: montaža brez alu cevi v sredini profila NI mogoča.");
    L.push("[ ] Po montaži brez naknadnega vrtanja/rezanja brez pisnega soglasja.");
  }else if(use==="terasa"){
    L.push("[ ] Podložne letve 30–35 cm med letvama (center 33–35 cm; PDF navodila 33–38 cm); izmenično polaganje (2,2+1,1 / 1,1+2,2); vsak konec deske ima svojo letev in distančnik.");
    L.push("[ ] Točkovno podlaganje SAMO z alu cevmi, max 60 cm (PVC ploščice različnih debelin ali guma) — WPC letvi nikoli točkovno (samo brezhibna podlaga).");
    L.push("[ ] Podlaga: beton ≥ 60 mm (vrhnjih 100 mm zemlje zamenjati); pritrditev letev s turbo vijaki za beton 6,7×80 mm; glave pod površino; ne pretirano zategovati.");
    L.push("[ ] Višina terase: min. 4,5 cm (deska 2,5 + alu cev 2,0), standard 5,5–6,5 cm; višje → alu letvi/buzoni (nikoli WPC).");
    L.push("[ ] Reža med deskami "+f(dilatacija(Math.max(1,Math.min(5,n("L")/1000)),n("installTemp")))+" mm po dilatacijski tabeli WoodCore (montaža pri "+V("installTemp")+" °C, deske "+f(Math.max(1,Math.min(5,n("L")/1000)))+" m); odmik od vseh sten ≥ 6 mm.");
    L.push("[ ] Drenažne luknje Ø4,2 mm od spodaj, približno 5 cm od roba, v vsak prekat (vse deske brez zaključne letvi).");
    L.push("[ ] Spodnja stena desk rezana pod kotom 30° (uradni PDF; FAQ navaja 5° pri polaganju pravokotno na padec) — kontra padca, dolžinski spoji, ob steni.");
    L.push("[ ] Dolžinski spoji odsvetovani; sicer dve deski v nasprotni smeri, pod spojem 2 turbo vijaka ali 2 kotnika, alu cev 3 cm daljša na vsaki strani; kombinacija 4,0+2,2 m NI dovoljena.");
    L.push("[ ] Zaključna letev L 45×55 mm, ≤ 2000 mm, vijaki vsakih 300 mm na vsaki drugi deski; ne ob zidovih/robnikih; na dolžinskih spojih deljena.");
  }else if(use==="napusc"){
    L.push("[ ] Podkonstrukcija: macesnove letve 4×7 cm v razmaku 70–80 cm; vertikalna postavitev → horizontalne letve 2×7 cm, razmak ≤ 50 cm.");
    L.push("[ ] Pritrditev: vidni RF svetleči vijaki s prednje strani; vijačenje v opeko.");
    L.push("[ ] Izolacija v ravnini fasade: stanjšati za najmanj 6 cm; okna/vrata: črna pločevina 2 mm v leseno konstrukcijo (skupna debelina cca 1,5–2 cm).");
    L.push("[ ] Profil: polna deska-100 (100×12×5800 mm) — horizontalno ali vertikalno.");
  }else if(use==="pregrada"){
    L.push("[ ] Maks. razmak stebrov: prečno 133–145 cm (odvisno od profila), pokončno ≤ 200 cm.");
    L.push("[ ] KUBO: brez vmesnih nosilcev zgoraj in spodaj z alu cevjo 20×60 mm, samo do višine 2500 mm; razpon ≤ 120 cm brez cevi, ≤ 260 cm z alu 20×60×2 mm, nad tem močnejša (alu/inox) cev.");
    L.push("[ ] KUBO na prostem: obvezno eloksirana aluminijasta cev (odprti pokrovček ne zadošča proti vlage).");
    L.push("[ ] Romb: kotnik na vsakem nosilcu; odprtine priporočljivo zakriti (vdor vode do alu cevi); čepi ne garantirajo pred vdorom vode.");
    L.push("[ ] Skrito vijačenje: romb, kubo (alu cev) in polna deska 57/32; pri ostalih profilih vijaki vidni.");
  }else{
    L.push("[ ] Nosilci na vsakih "+f(n("stGoing"))+" mm stopnišča; ročica vzporedno stopnicam.");
    L.push("[ ] Sidranje v nosilno podlago, globina "+V("emb")+" mm, podlaga "+V("sub")+".");
  }
  L.push("");
  L.push("D. ZAKLJUČEK IN GARANCIJA");
  L.push("[ ] Prah po montaži odstranjen s temeljitim pranjem z navadno vodo (tlak ≤ 60 bar, dovolj velika razdalja).");
  L.push("[ ] Barva se v prvem letu lahko posvetli 5–10 %; odstopanje med serijami ni reklamacija.");
  L.push("[ ] Materialna garancija 15 let; garancija na izvedena dela 2 leti (če je izvajalec Roksal/pogodbenik).");
  L.push("[ ] B2B: vidne napake takoj, skrite napake in ugovor računa v 8 dneh; komercialna garancija ob plačilu v 30 dneh.");
  L.push("");
  L.push("E. FOTOGRAFSKA DOKUMENTACIJA ZA REKLAMACIJO");
  L.push("[ ] 1. Celotna izvedba (širši posnetek).");
  L.push("[ ] 2. Poškodovan element celo in od blizu.");
  L.push("[ ] 3. Podkonstrukcija in nosilna konstrukcija.");
  L.push("[ ] 4. Podlaga, reže, naklon in odvodnjavanje.");
  L.push("[ ] 5. Pritrdilna mesta, uporabljeni vijaki in dimenzije izvrtin.");
  L.push("[ ] 6. Zaključki in drugi tehnično pomembni detajli.");
  L.push("[ ] Račun/dokazilo o nakupu in opis napake priložena.");
  L.push("");
  L.push("KONTAKT — ROKSAL D.O.O.: terase/prevzem 064 123 020 · ograje 064 123 030 · fasade 064 120 969 · info@roksal.com");
  L.push("Salon: Savska Loka 21, 4000 Kranj (pon–čet 7:00–15:30, pet 7:00–14:00) · Sedež: Zgornje Bitnje 186, 4209 Žabnica");
  L.push("");
  L.push("Izvajalec: ______________________   Datum: ______________   Podpis: ______________________");
  L.push("Prevzel/a: _____________________   Datum: ______________   Podpis: ______________________");
  checklistText=L.join("\n");
  $("checklistOut").textContent=checklistText;
  $("globalStatus").textContent="Montažni checklist pripravljen — "+L.length+" vrstic.";
  return checklistText;
}
$("buildCut").onclick=buildCut;
$("buildQuote").onclick=buildQuote;
function cutCsv(){
  return "\ufeff"+"Vir;Deska (mm);Kosov;Št. kosov;Ostanek (mm)\n"+
    cutData.rows.map(function(r){return '"'+r.join('";"')+'"'}).join("\n")+
    "\n\nSkupaj;kosa "+cutData.count+" × "+cutData.piece+" mm;;;"+cutData.waste+" mm\nIzkoristek;"+cutData.yield+"%;";
}
$("menuDlCut").onclick=function(){
  if(!cutData)buildCut();
  saveBlob(V("drw")+"-rezalni-nacrt.csv",cutCsv(),"text/csv;charset=utf-8");
};
$("menuDlOrder").onclick=function(){if(!orderText)buildOrder();saveBlob(V("drw")+"-narocilo.txt",orderText,"text/plain;charset=utf-8")};
function quoteCsv(){
  return "\ufeff"+"Postavka;Količina;Znesek (EUR)\n"+
    quoteData.items.map(function(x){return '"'+x[0]+'";"'+x[1]+'";"'+x[2].toFixed(2)+'"'}).join("\n")+
    "\n\nSKUPAJ (brez DDV);;"+quoteData.total.toFixed(2)+"\nOPOMBA: predračun je orientacijski in ni ponudba.";
}
$("menuDlQuote").onclick=function(){
  if(!quoteData)buildQuote();
  saveBlob(V("drw")+"-predracun.csv",quoteCsv(),"text/csv;charset=utf-8");
};
$("buildChecklist").onclick=buildChecklist;
$("menuBuildChecklist").onclick=buildChecklist;
$("menuDlChecklist").onclick=function(){
  if(!checklistText)buildChecklist();
  saveBlob(V("drw")+"-montazni-checklist.txt",checklistText,"text/plain;charset=utf-8");
};

function buildPlan(){
  var p=WC[$("sysProfile").value],L=n("L"),H=n("H");
  var N=cutCount(),np=postCount();
  var use=V("sysUse"),lim=roksalLimit(p,use,H),cut=cutLen(),per=Math.max(1,Math.floor(p.len/cut)),boards=Math.ceil(N/per),off=Math.max(0,p.len-per*cut);
  var handles=Math.max(1,Math.ceil(L/4000)),hlen=L/handles;
  var rows=[
    ["Lamela "+p.n,f(p.w)+"x"+f(p.t)+"x"+f(cut)+" mm",N+" kos"],
    ["Zaloga desk",p.len+" mm — "+per+(per===1?" kos":per===2?" kosa":per>2&&per<5?" kosi":" kosov")+" na desko",boards+" desek"],
    ["Odpad",f(off)+" mm na desko","~"+f(off*boards/1000)+" m"],
    ["Stebrički / nosilci",lim.label+" ≤ "+lim.v+" mm",np+" kos"],
    ["Sidra","2 na nosilec",(2*np)+" kos"],
    ["Ročaj",f(hlen)+" mm na kos",handles+" kos"],
    ["Vijaki RF","2 na lamelo + 2 na nosilec",(2*N+2*np)+" kos"],
    ["Pritrdilni vijaki",V("bolt")+" — "+V("nbolt")+" na nosilec",(np*Math.max(0,n("nbolt")))+" kos"]
  ];
  var kdPl=getKoritaData(),ktsPl=(segsParse().length<2)?kdPl.items:[];
  if(ktsPl.length&&kdPl.active){
    rows.push(["Cvetlično korito","globina "+f(kdPl.D)+" × višina "+f(kdPl.H)+" mm (ocena — potrditi pri Roksalu)",ktsPl.length+" kos"]);
    rows.push(["Konzolni nosilec korita","max(2, ceil(širina/600)+1) na korito — ocena",(ktsPl.reduce(function(a,kt){return a+koritoNosilci(kt.w)},0))+" kos"]);
  }
  if(use==="stopniscna"){
    var stRun=n("stN")*n("stGoing"),stTot=n("stN")*n("stRise"),stSlope=Math.hypot(stRun,stTot);
    rows[5]=["Ročaj (naklon)",f(stSlope)+" mm na kos — 2 kosi (zgoraj + spodaj)","2 kos"];
    rows[3]=["Nosilci","razmak po naklonu "+f(stRun/Math.max(1,n("stPosts")-1))+" mm",n("stPosts")+" kos"];
  }
  if(use==="terasa"){
    var letve=Math.max(2,Math.ceil(L/335)+1);
    rows.push(["Podložne letve","WPC 40×30×2200 ali alu cev — center 33–35 cm",letve+" kos (ocena)"]);
    rows.push(["Distančniki","na vsako letev pri vsaki deski",(N*letve)+" kos (ocena)"]);
    rows.push(["Turbo vijaki za beton","6,7×80 mm — pritrditev letev (≈4/letev)",(letve*4)+" kos (ocena)"]);
    rows.push(["Zaključna letev L","45×55 mm — vijaki 30 cm, vsaka 2. deska",f(L/1000)+" m (ocena)"]);
    rows.push(["Dilatacija","priporočen razmak pri "+f(n("installTemp"))+" °C za deske "+f(Math.max(1,Math.min(5,L/1000)))+" m",f(dilatacija(Math.max(1,Math.min(5,L/1000)),n("installTemp")))+" mm"]);
    rows.push(["Teža pošiljke (ocena)","1 m² terase ≈ 25 kg (FAQ Roksal)",f((L*n("D")/1e6)*25)+" kg"]);
  }
  if(use==="pokoncna"){
    var rail=roksalRailLimit(p),rowsN=Math.max(2,Math.ceil(H/rail)+1);
    rows.splice(4,0,["Vodoravne cevi","razmak ≤ "+rail+" mm — dolžina "+f(L)+" mm",rowsN+" kos"]);
  }
  if(p.n.indexOf("KUBO")>=0)rows.splice(4,0,["Alu cev 20×60×2","obvezna — razpon ≤ 2600 mm (na prostem eloksirana)",use==="fasada"?(Math.ceil(H/1000)+1)+" kos":2+" kos"]);
  planData=rows;
  $("planOut").innerHTML='<table style="width:100%;font-size:11px;border-collapse:collapse">'+rows.map(function(r){return '<tr><td style="padding:2px 4px;border-bottom:1px solid var(--line)">'+E(r[0])+'</td><td style="padding:2px 4px;border-bottom:1px solid var(--line)">'+E(r[1])+'</td><td style="padding:2px 4px;border-bottom:1px solid var(--line);text-align:right;color:var(--tx)">'+E(r[2])+'</td></tr>'}).join('')+'</table><p style="margin-top:6px">Barva: '+E(V("sysColor"))+' · površina: '+E(V("sysSurface"))+' · montaža nad +5 °C. Količine so orientacijske — preverite jih pri naročilu. Orodje: baterijski vrtalnik (ročni izvijač ni primeren), Widia/HM rezila, brusni papir granulacija 40, grezilo; aksesoarji po profilu — distančniki + začetni distančnik in zaključna letev 45×55 (terasa), čepi levi/desni (romb), fasadni klipi (romb fasada), WEPOS WPC impregnacija (pohištvo).</p>';
}
$("makePlan").onclick=buildPlan;
function planCsv(){
  return "\ufeff"+"Postavka;Specifikacija;Količina\n"+planData.map(function(r){return '"'+r.join('";"')+'"'}).join("\n");
}
$("dlPlan").onclick=function(){
  if(!planData)buildPlan();
  saveBlob(V("drw")+"-montaza.csv",planCsv(),"text/csv;charset=utf-8");
};
