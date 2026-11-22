// Draftwright — modul 11-export-dialog (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
/* ---------- Izvozni dialog — poenotene možnosti izvoza (Ctrl+E) ---------- */
(function(){
  var EXP={open:false,format:"PDF",preset:"full"};
  var EXP_ITEMS=[
    {id:"risba",label:"Risba (tehnični list)",tag:"risba",tip:"Trenutno generirani list: pogledi, tloris, izometrija, prerezi, detajli, kosovnica na listu in naslovni blok. Izvozi se v izbranem formatu (PDF/SVG/DXF/STEP).",on:true},
    {id:"kosovnica",label:"Kosovnica",tag:"CSV",tip:"Seznam sestavnih delov z materialom, dimenzijami, količinami in skupno maso konstrukcije.",on:true},
    {id:"cut",label:"Rezalni načrt (kerf)",tag:"CSV",tip:"Optimizacija rezov po tovariških dolžinah desk z upoštevanjem širine rezila; poraba, odpadek in izkoristek.",on:true},
    {id:"plan",label:"Montažni načrt",tag:"CSV",tip:"Količine za montažo: lamele, zaloga desk, nosilci, sidra, ročaj, vijaki — po izbranem profilu in uporabi.",on:true},
    {id:"quote",label:"Predračun",tag:"CSV",tip:"Orientacijski predračun brez DDV: deske, nosilci, vijaki RF in pritrdilni, dela. Ni ponudba.",on:true},
    {id:"order",label:"Naročilnik",tag:"TXT",tip:"Pripravljeno naročilo materiala za dobavitelja: deske po rezalnem načrtu, profili, pritrdila, sidra.",on:true},
    {id:"checklist",label:"Montažni checklist",tag:"TXT",tip:"Prevzemna kontrola po sklopih A–E: dostava, pred montažo, geometrija, zaključek, reklamacijska dokumentacija.",on:true},
    {id:"project",label:"Projekt (celotno stanje)",tag:"JSON",tip:"Vsa polja, umeritev in slika — za poznejše odpiranje projekta v aplikaciji.",on:true},
    {id:"tehlist",label:"Tehnični list materiala",tag:"TXT",tip:"Tehnični podatki WoodCore iz garancijskega PDF (vlaga, trdota HRR, modul upogibanja, sila vijaka …) — zahteva in izmerjeno.",on:true},
    {id:"povpras",label:"Povpraševanje Roksal",tag:"TXT",tip:"Pripravljeno povpraševanje v strukturi Roksal obrazca: kontakt, način dobave, mere, profil, barva, podlaga. Fotografije/skice (≤ 25 MB) na info@roksal.com.",on:true},
    {id:"tlorisSvg",label:"Tloris ograje (SVG)",tag:"SVG",tip:"Interaktivni tloris trase (walls) z nosilci po Roksal limitih — top-down pogled za teren.",on:false},
    {id:"skicaSvg",label:"Terenska skica",tag:"SVG",tip:"Skica s prostoročnimi potezami in elementi (A4/A3) — ročni pripomoček, brez izračunov.",on:false}
  ];
  var EXP_ADV=[
    {id:"wm",label:"Vodni žig na risbi",tip:"Prosojno diagonalno besedilo prek risbe. Velja za PDF in SVG; na DXF se ne izvaža (namen CNC).",on:false},
    {id:"geom",label:"DXF: samo geometrija",tip:"Izvoz risbe brez TEXT entitet — primerno za CNC obdelavo. Priloge niso prizadete.",on:false},
    {id:"date",label:"Datum v imenu datotek",tip:"K imenu vsake datoteke doda današnji datum (dd-mm-llll).",on:false},
    {id:"meta",label:"Metapodatki v SVG",tip:"V SVG doda <title> in <desc> iz naslovnega bloka (projekt, merilo, format, datum, profil).",on:false}
  ];
  var EXP_PRESETS={
    full:{risba:1,kosovnica:1,cut:1,plan:1,quote:1,order:1,checklist:1,project:1,tehlist:1,povpras:1,tlorisSvg:0,skicaSvg:0},
    delavnica:{risba:1,kosovnica:1,cut:1,plan:1,quote:0,order:0,checklist:0,project:0,tehlist:0,povpras:0,tlorisSvg:0,skicaSvg:0},
    narocilo:{risba:0,kosovnica:0,cut:1,plan:0,quote:1,order:1,checklist:0,project:0,tehlist:0,povpras:1,tlorisSvg:0,skicaSvg:0},
    minimalno:{risba:1,kosovnica:0,cut:0,plan:0,quote:0,order:0,checklist:0,project:0,tehlist:0,povpras:0,tlorisSvg:0,skicaSvg:0}
  };
  function item(id){for(var i=0;i<EXP_ITEMS.length;i++)if(EXP_ITEMS[i].id===id)return EXP_ITEMS[i];return null}
  function adv(id){for(var i=0;i<EXP_ADV.length;i++)if(EXP_ADV[i].id===id)return EXP_ADV[i];return null}
  function expRenderItems(){
    var c=$("expItems");
    c.innerHTML=EXP_ITEMS.map(function(it){
      return '<div class="exp-row"><div class="exp-it"><span>'+E(it.label)+'</span><span class="i" title="'+E(it.tip)+'">i</span><span class="tag">'+E(it.tag)+'</span></div>'+
        '<label class="exp-sw"><input type="checkbox" data-exp-item="'+it.id+'"'+(it.on?" checked":"")+'><span class="exp-sl"></span></label></div>';
    }).join("");
    [].forEach.call(c.querySelectorAll("[data-exp-item]"),function(cb){
      cb.addEventListener("change",function(){
        item(cb.getAttribute("data-exp-item")).on=cb.checked;
        EXP.preset=null;
        [].forEach.call(document.querySelectorAll("[data-exp-preset]"),function(x){x.classList.remove("active")});
        expUpdate();
      });
    });
  }
  function expRenderAdv(){
    var c=$("expAdv");
    c.innerHTML=EXP_ADV.map(function(a){
      return '<div class="exp-row"><div class="exp-it"><span>'+E(a.label)+'</span><span class="i" title="'+E(a.tip)+'">i</span></div>'+
        '<label class="exp-sw"><input type="checkbox" data-exp-adv="'+a.id+'"'+(a.on?" checked":"")+'><span class="exp-sl"></span></label></div>';
    }).join("");
    [].forEach.call(c.querySelectorAll("[data-exp-adv]"),function(cb){
      cb.addEventListener("change",function(){adv(cb.getAttribute("data-exp-adv")).on=cb.checked;expUpdate()});
    });
  }
  function wordPriloga(k){return k===1?"1 priloga":k===2?"2 prilogi":(k>=3&&k<=4)?k+" priloge":k+" prilog"}
  function wordDatoteka(k){return k===1?"1 datoteka":k===2?"2 datoteki":(k>=3&&k<=4)?k+" datoteke":k+" datotek"}
  function wordVklopljen(k){return k===1?"1 vklopljena":k===2?"2 vklopljeni":(k>=3&&k<=4)?k+" vklopljene":k+" vklopljenih"}
  function expUpdate(){
    var onN=EXP_ITEMS.filter(function(i){return i.on}).length;
    $("expSumVsebina").textContent="Vključeno "+onN+"/"+EXP_ITEMS.length;
    var risba=item("risba").on;
    $("expFmtOff").style.display=risba?"none":"inline";
    [].forEach.call(document.querySelectorAll("#expSegs .exp-seg"),function(b){b.disabled=!risba;b.style.opacity=risba?"":"0.4"});
    var advOn=EXP_ADV.filter(function(a){return a.on}).length;
    $("expSumAdv").textContent=advOn?wordVklopljen(advOn):"Privzeto";
    $("expSumList").textContent=$("expPaper").value+" · merilo "+V("scale");
    $("expWmField").style.display=(adv("wm").on&&risba&&(EXP.format==="PDF"||EXP.format==="SVG"))?"block":"none";
    $("expSegField").style.display=(EXP.format==="DXF"&&risba)?"block":"none";
    if(!onN){$("expNote").textContent="Nič ni izbrano — izberite vsaj en del vsebine.";$("expNote").className="exp-note err";$("expGo").disabled=true;return}
    $("expNote").className="exp-note";$("expGo").disabled=false;
    var names={PDF:"PDF / tisk",SVG:"SVG",DXF:"DXF",STEP:"STEP"};
    var pr=onN-(risba?1:0);
    var txt=risba?(names[EXP.format]+" · risba"+(pr>0?" + "+wordPriloga(pr):" (brez prilog)")):("Samo priloge: "+wordPriloga(pr));
    if(adv("date").on)txt+=" · datum v imenu";
    $("expNote").textContent=txt+(risba?" · "+$("expPaper").value:"");
  }
  var lastFocus=null;
  function openExport(){
    lastFocus=document.activeElement;
    EXP.open=true;
    expRenderItems();expRenderAdv();
    $("expPaper").value=V("paper");
    [].forEach.call(document.querySelectorAll("[data-exp-preset]"),function(b){b.classList.toggle("active",b.getAttribute("data-exp-preset")===(EXP.preset||""))});
    expUpdate();
    $("expOverlay").classList.add("on");
    $("expClose").focus();
  }
  function closeExport(){
    EXP.open=false;$("expOverlay").classList.remove("on");
    if(lastFocus&&document.body.contains(lastFocus)&&lastFocus!==document.body){try{lastFocus.focus()}catch(e){}}
    lastFocus=null;
  }
  function expBase(){
    var b=String(V("drw")||"").replace(/[\\/:*?"<>|]+/g,"-").trim().slice(0,80)||"izvoz";
    if(adv("date").on){var t=new Date();b+="-"+("0"+t.getDate()).slice(-2)+"-"+("0"+(t.getMonth()+1)).slice(-2)+"-"+t.getFullYear()}
    return b;
  }
  window.svgVariant=svgVariant; /* Faza 1: dostopno iz view mode (javni pregled) */
  function svgVariant(o){
    o=o||{};
    var sv=svgEl();if(!sv)return null;
    var clone=sv.cloneNode(true);
    var pw=o.paper==="A4"?"297":o.paper==="A2"?"594":"420",ph=o.paper==="A4"?"210":o.paper==="A2"?"420":"297";
    clone.setAttribute("width",pw+"mm");clone.setAttribute("height",ph+"mm");
    if(o.meta){
      var NS="http://www.w3.org/2000/svg";
      var t=document.createElementNS(NS,"title");t.textContent=(V("proj")||"Risba")+" — "+(V("drw")||"");
      var dd=document.createElementNS(NS,"desc");
      dd.textContent="Tehnična risba PRO · merilo "+V("scale")+" · format "+(o.paper||"A3")+" · rev. "+V("rev")+" · datum "+V("date")+" · profil "+V("sysProfile")+" · barva "+V("sysColor");
      clone.insertBefore(dd,clone.firstChild);clone.insertBefore(t,clone.firstChild);
    }
    if(o.watermark){
      var NS2="http://www.w3.org/2000/svg";
      var g=document.createElementNS(NS2,"g");g.setAttribute("opacity","0.28");
      var wt=document.createElementNS(NS2,"text");
      wt.setAttribute("x","210");wt.setAttribute("y","155");wt.setAttribute("text-anchor","middle");
      wt.setAttribute("font-family","Arial,Helvetica,sans-serif");wt.setAttribute("font-size","46");wt.setAttribute("font-weight","700");
      wt.setAttribute("fill","#c0392b");wt.setAttribute("transform","rotate(-28 210 155)");
      wt.textContent=String(o.wmText||"OSNUTEK").trim()||"OSNUTEK";
      g.appendChild(wt);clone.appendChild(g);
    }
    return new XMLSerializer().serializeToString(clone);
  }
  function expRun(){
    var risba=item("risba").on;
    var wm=adv("wm").on?(String($("expWmText").value||"").trim()||"OSNUTEK"):null;
    var base=expBase();
    var jobs=[];
    if(risba){
      var fmt=EXP.format,paper=$("expPaper").value;
      if(fmt==="PDF"||fmt==="SVG"||fmt==="DXF"){
        generate(); // vedno znova iz trenutnih polj — izvoz odraža zadnje stanje, ne zastarelega predogleda
        if(!svgEl()){$("globalStatus").textContent="Izvoz prekinjen — risbe ni mogoče generirati (preverite mere).";$("globalStatus").style.color="var(--bad)";closeExport();return}
      }
      if(fmt==="PDF"){
        jobs.push({n:"risba (PDF, vektorski)",f:function(){
          var sv=svgVariant({paper:paper,watermark:!!wm,wmText:wm,meta:adv("meta").on});
          if(!sv)throw new Error("ni risbe");
          return exportPdf(sv,paper).then(function(doc){
            doc.save(expBase()+".pdf");
            $("globalStatus").textContent="Vektorski PDF shranjen ("+paper+") — vektorsko besedilo in grafične primitive, brez tiskalnega okna.";
          }).catch(function(e){
            /* P4: padec → preklopi na brskalniški tisk (pošteno sporočilo; tudi tisk ne sme zlomiti zadeve) */
            try{
              var w=window.open("","_blank");
              if(!w)throw e;
              w.document.write(printHtml(sv,paper));w.document.close();
              setTimeout(function(){w.focus();w.print()},400);
              $("globalStatus").textContent="Vektorski PDF ni uspel ("+e.message+") — odprt je tisk (brskalnik).";
            }catch(e2){
              /* tisk je tudi blokiran → job je neuspešen (next() ga prijavi med napake) */
              throw new Error("vektorski PDF ni uspel ("+e.message+"); tisk blokiran — uporabite SVG izvoz ali tisk iz menija");
            }
          });
        }});
      }else if(fmt==="SVG"){
        jobs.push({n:"risba (SVG)",f:function(){
          var sv=svgVariant({paper:paper,watermark:!!wm,wmText:wm,meta:adv("meta").on});
          if(!sv)throw new Error("ni risbe");
          saveBlob(base+".svg",sv,"image/svg+xml;charset=utf-8");
        }});
      }else if(fmt==="DXF"){
        jobs.push({n:"risba (DXF)",f:function(){saveBlob(base+".dxf",cp1250Bytes(dxfString({geomOnly:adv("geom").on,segs:parseInt($("expSegSel").value,10)||8})),"application/dxf")}});
      }else if(fmt==="STEP"){
        jobs.push({n:"risba (STEP)",f:function(){saveBlob(base+".step",stepString(),"application/step")}});
      }
    }
    if(item("kosovnica").on)jobs.push({n:"kosovnica (CSV)",f:function(){saveBlob(base+"-kosovnica.csv",kosovnicaCsv(),"text/csv;charset=utf-8")}});
    if(item("cut").on)jobs.push({n:"rezalni načrt (CSV)",f:function(){if(!cutData)buildCut();saveBlob(base+"-rezalni-nacrt.csv",cutCsv(),"text/csv;charset=utf-8")}});
    if(item("plan").on)jobs.push({n:"montažni načrt (CSV)",f:function(){if(!planData)buildPlan();saveBlob(base+"-montaza.csv",planCsv(),"text/csv;charset=utf-8")}});
    if(item("quote").on)jobs.push({n:"predračun (CSV)",f:function(){if(!quoteData)buildQuote();saveBlob(base+"-predracun.csv",quoteCsv(),"text/csv;charset=utf-8")}});
    if(item("order").on)jobs.push({n:"naročilnik (TXT)",f:function(){saveBlob(base+"-narocilo.txt",buildOrder(),"text/plain;charset=utf-8")}});
    if(item("checklist").on)jobs.push({n:"montažni checklist (TXT)",f:function(){saveBlob(base+"-montazni-checklist.txt",buildChecklist(),"text/plain;charset=utf-8")}});
    if(item("project").on)jobs.push({n:"projekt (JSON)",f:function(){saveBlob(base+"-project.json",projectJson(),"application/json")}});
    if(item("tehlist").on)jobs.push({n:"tehnični list (TXT)",f:function(){saveBlob(base+"-tehnicni-list.txt",techListTxt(),"text/plain;charset=utf-8")}});
    if(item("tlorisSvg").on)jobs.push({n:"tloris (SVG)",f:function(){
      var s=tlorisSvgString();
      if(!s)throw new Error("tloris je prazen — narišite traso");
      saveBlob(base+"-tloris.svg",s,"image/svg+xml;charset=utf-8");
    }});
    if(item("skicaSvg").on)jobs.push({n:"skica (SVG)",f:function(){
      var pgS=skPage();
      var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+pgS[0]+' '+pgS[1]+'" width="'+pgS[0]+'mm" height="'+pgS[1]+'mm">';
      s+='<rect width="'+pgS[0]+'" height="'+pgS[1]+'" fill="#fff"/>';
      SK.elems.map(skCleanElem).filter(Boolean).forEach(function(e2){
        var col=safeColor(e2.color),w2=Math.max(0.1,Math.min(20,numOf(e2.width,2)));
        if(e2.t==="free")s+='<polyline points="'+e2.pts.map(function(p2){return p2.x+","+p2.y}).join(" ")+'" fill="none" stroke="'+col+'" stroke-width="'+w2+'"/>';
        else if(e2.t==="line")s+='<line x1="'+e2.x1+'" y1="'+e2.y1+'" x2="'+e2.x2+'" y2="'+e2.y2+'" stroke="'+col+'" stroke-width="'+w2+'"/>';
        else if(e2.t==="rect")s+='<rect x="'+Math.min(e2.x1,e2.x2)+'" y="'+Math.min(e2.y1,e2.y2)+'" width="'+Math.abs(e2.x2-e2.x1)+'" height="'+Math.abs(e2.y2-e2.y1)+'" fill="none" stroke="'+col+'" stroke-width="'+w2+'"/>';
        else if(e2.t==="circle")s+='<circle cx="'+e2.cx+'" cy="'+e2.cy+'" r="'+e2.r+'" fill="none" stroke="'+col+'" stroke-width="'+w2+'"/>';
        else if(e2.t==="text")s+='<text x="'+e2.x+'" y="'+e2.y+'" font-size="'+(w2*4+7)+'" font-family="Arial" fill="'+col+'">'+E(e2.txt)+'</text>';
        else if(e2.t==="dim")s+='<line x1="'+e2.x1+'" y1="'+e2.y1+'" x2="'+e2.x2+'" y2="'+e2.y2+'" stroke="'+col+'" stroke-width="0.7"/><text x="'+((e2.x1+e2.x2)/2)+'" y="'+((e2.y1+e2.y2)/2-3)+'" font-size="8" font-family="Arial" fill="'+col+'" text-anchor="middle">M(ročno): '+E(e2.label)+'</text>';
        else if(e2.t==="iso"){
          var s4=e2.s||40,h4=s4*0.5,d4=s4*0.6;
          s+='<polygon points="'+e2.x+','+(e2.y+d4)+' '+(e2.x+s4/2)+','+e2.y+' '+(e2.x+s4)+','+(e2.y+d4)+' '+(e2.x+s4/2)+','+(e2.y+d4*2)+'" fill="none" stroke="'+col+'" stroke-width="'+w2+'"/>';
          s+='<line x1="'+e2.x+'" y1="'+(e2.y+d4)+'" x2="'+e2.x+'" y2="'+(e2.y+d4+s4*0.5)+'" stroke="'+col+'" stroke-width="'+w2+'"/>';
          s+='<line x1="'+(e2.x+s4/2)+'" y1="'+(e2.y+d4*2)+'" x2="'+(e2.x+s4/2)+'" y2="'+(e2.y+d4*2+s4*0.5)+'" stroke="'+col+'" stroke-width="'+w2+'"/>';
          s+='<line x1="'+(e2.x+s4)+'" y1="'+(e2.y+d4)+'" x2="'+(e2.x+s4)+'" y2="'+(e2.y+d4+s4*0.5)+'" stroke="'+col+'" stroke-width="'+w2+'"/>';
          s+='<line x1="'+e2.x+'" y1="'+(e2.y+d4+s4*0.5)+'" x2="'+(e2.x+s4/2)+'" y2="'+(e2.y+d4*2+s4*0.5)+'" stroke="'+col+'" stroke-width="'+w2+'"/>';
          s+='<line x1="'+(e2.x+s4/2)+'" y1="'+(e2.y+d4*2+s4*0.5)+'" x2="'+(e2.x+s4)+'" y2="'+(e2.y+d4+s4*0.5)+'" stroke="'+col+'" stroke-width="'+w2+'"/>';
        }
      });
      s+='</svg>';
      saveBlob(base+"-skica.svg",s,"image/svg+xml;charset=utf-8");
    }});
    if(item("povpras").on)jobs.push({n:"povpraševanje Roksal (TXT)",f:function(){saveBlob(base+"-povprasevanje.txt",povprasevanjeTxt(),"text/plain;charset=utf-8")}});
    if(!jobs.length){closeExport();return}
    var wmApplied=!!wm&&risba&&(EXP.format==="PDF"||EXP.format==="SVG");
    var idx=0,failed=[];
    (function next(){
      if(idx>=jobs.length){
        if(failed.length){
          $("globalStatus").textContent="Izvoz končan z napakami: "+wordDatoteka(jobs.length-failed.length)+" uspešnih, neuspešnih "+failed.length+" ("+failed.join("; ")+").";
          $("globalStatus").style.color="var(--bad)";
          toast("Izvoz: "+failed.length+" neuspešnih ("+failed[0]+")","err");
        }else{
          $("globalStatus").textContent="Izvoz končan: "+wordDatoteka(jobs.length)+(wmApplied?" (z vodnim žigom)":"")+".";
          $("globalStatus").style.color="";
          toast("Izvoz končan: "+wordDatoteka(jobs.length)+(wmApplied?" (z vodnim žigom)":""),"ok");
        }
        closeExport();return}
      var j=jobs[idx];
      $("globalStatus").textContent="Izvažam… "+j.n+" ("+(idx+1)+"/"+jobs.length+")";
      var markFail=function(err){
        failed.push(j.n+((err&&err.message)?": "+err.message:""));
        $("globalStatus").textContent="Napaka pri "+j.n+": "+(err&&err.message?err.message:err);
      };
      try{
        var r=j.f();
        if(r&&typeof r.then==="function"){ /* P4: asinhron job (vektorski PDF) — počakaj promise */
          Promise.resolve(r).then(function(){idx++;setTimeout(next,400)},function(err){markFail(err);idx++;setTimeout(next,400)});
          return;
        }
      }catch(err){markFail(err)}
      idx++;setTimeout(next,400);
    })();
  }
  $("expGo").onclick=expRun;
  $("expCancel").onclick=closeExport;
  $("expClose").onclick=closeExport;
  $("expOverlay").addEventListener("click",function(e){if(e.target===this)closeExport()});
  $("expPaper").addEventListener("change",function(){$("paper").value=this.value;expUpdate()});
  [].forEach.call(document.querySelectorAll("[data-exp-preset]"),function(b){
    b.addEventListener("click",function(){
      var p=EXP_PRESETS[b.getAttribute("data-exp-preset")];if(!p)return;
      EXP.preset=b.getAttribute("data-exp-preset");
      EXP_ITEMS.forEach(function(it){it.on=!!p[it.id]});
      [].forEach.call(document.querySelectorAll("[data-exp-preset]"),function(x){x.classList.toggle("active",x===b)});
      expRenderItems();expUpdate();
    });
  });
  [].forEach.call(document.querySelectorAll("#expSegs .exp-seg"),function(b){
    b.addEventListener("click",function(){
      EXP.format=b.getAttribute("data-exp-format");
      [].forEach.call(document.querySelectorAll("#expSegs .exp-seg"),function(x){x.classList.toggle("active",x===b)});
      expUpdate();
    });
  });
  [].forEach.call(document.querySelectorAll("[data-exp-sec] > .exp-sec-h"),function(h){
    h.addEventListener("click",function(){h.parentNode.classList.toggle("open")});
  });
  [].forEach.call(document.querySelectorAll("[data-exp-all]"),function(b){
    b.addEventListener("click",function(){
      var all=b.getAttribute("data-exp-all")==="vse";
      EXP_ITEMS.forEach(function(it){it.on=all});
      EXP.preset=null;
      [].forEach.call(document.querySelectorAll("[data-exp-preset]"),function(x){x.classList.remove("active")});
      expRenderItems();expUpdate();
    });
  });
  $("exportDialog").onclick=openExport;
  document.addEventListener("keydown",function(e){if(EXP.open&&e.key==="Escape")closeExport()});
  document.addEventListener("keydown",function(e){
    var typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if(!typing&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="e"){e.preventDefault();openExport()}
  });
})();
