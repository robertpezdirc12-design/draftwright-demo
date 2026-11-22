// Draftwright — modul 03-validation (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
/* ---------- validation ---------- */
function checks(){
  var L=n("L"),H=n("H"),N=n("n"),sw=n("sw"),gap=n("gap"),stn=n("st"),wa=n("wall");
  var ref=!!($("refMode")&&$("refMode").checked);
  var msgs=[];
  var use0=V("sysUse");
  if(use0==="pokoncna"){
    if(!ref&&N*(sw+gap)>n("zoneMid")*1.05)msgs.push("Vsota širin navpičnih lamel in rež ("+f(N*(sw+gap))+" mm) presega srednje polje ("+f(n("zoneMid"))+" mm).");
  }else if(use0==="terasa"){
    if(N*(sw+gap)>n("D")*1.05)msgs.push("Vsota globin lamel in rež ("+f(N*(sw+gap))+" mm) presega globino D ("+f(n("D"))+" mm).");
  }else if(use0==="stopniscna"){
    /* stopnice: lamele sledijo naklonu — vsota čez H ni uporabna (lažni alarm) */
  }else if(!ref&&N*(sw+gap)>H*1.05){
    msgs.push("Vsota lamel in rež ("+f(N*(sw+gap))+" mm) presega višino H ("+f(H)+" mm).");
  }
  if(wa*2>=Math.min(sw,stn))msgs.push("Stena profila je predebela za izbrane mere lamele.");
  if(L<=0||H<=0||n("D")<=0)msgs.push("Mere L, H in D morajo biti pozitivne.");
  if(ref&&gap*N>=n("zoneMid"))msgs.push("Pri "+N+" lamelah in reži "+gap+" mm srednje polje ("+f(n("zoneMid"))+" mm) ne zadošča — zmanjšajte število lamel ali režo.");
  if(ref){var zs=n("zoneTop")+n("zoneMid")+n("zoneBot")+n("zoneBase");
    if(Math.abs(zs-H)>0.5)msgs.push("Vsota con ("+f(zs)+" mm) se ne ujema z višino H ("+f(H)+" mm) — razlika "+f(H-zs)+" mm je na listu prikazana kot odmik.");
  }
  if(typeof WC!=="undefined"&&$("sysProfile")){
    var pc=WC[$("sysProfile").value],use=V("sysUse");
    if(pc){
      if(use!=="stopniscna"&&(pc.allowed||[]).indexOf(use)<0)msgs.push("Profil "+pc.n+" ni predviden za "+(USE_NAMES[use]||use)+".");
      var lim=roksalLimit(pc,use,H),npv=Math.max(1,Math.round(n("np"))),span=L/Math.max(1,npv-1);
      if(npv>1&&span>lim.v+0.5)msgs.push("Razmak "+lim.label.toLowerCase()+" "+Math.round(span)+" mm presega Roksal omejitev "+lim.v+" mm.");
      if(use==="terasa"&&n("slopeMM")<10)msgs.push("Padec podlage je manjši od 10 mm/m — Roksal zahteva vsaj 1 cm/m.");
      if((use==="terasa"||use==="precna"||use==="pokoncna")&&n("installTemp")<5)msgs.push("Montaža pod +5 °C ni primerna — preverite temperaturo.");
      if((use==="precna"||use==="pokoncna")&&V("weldedParts")==="neznano")msgs.push("Varjeni deli na obstoječih stebrih niso preverjeni — odstraniti jih je treba pred montažo.");
      if(use==="terasa"){
        var lenM=Math.max(1,Math.min(5,L/1000)),rec=dilatacija(lenM,n("installTemp"));
        if(Math.abs(n("gap")-rec)>0.75)msgs.push("Dilatacija (tabela WoodCore): priporočen razmak "+f(rec)+" mm za deske "+f(lenM)+" m pri "+f(n("installTemp"))+" °C — trenutno "+f(n("gap"))+" mm.");
        var stv=V("subType");
        if(stv==="pesek")msgs.push("Pesek/prodec: Roksal ne izvaja montaž in ne priporoča — potrebna prana betonska plošča (min. 6 cm) s padcem 1 cm/m.");
        else if(stv==="tlakovci")msgs.push("Tlakovci: obvezno alu podložne cevi + mreža; preveriti višino do vrat (min. 4,5 cm).");
        else if(stv==="plocice")msgs.push("Ploščice: montaža brez vrtanja v tla; preveriti višino do vrat; odstopajoče ploščice odstraniti.");
        else if(stv==="beton_hidro")msgs.push("Hidroizolacija: podložne letvi ne pritrditi v tla — pod njiju guma/filc; podkonstrukcijo povezati s kotniki.");
        else if(stv==="prane")msgs.push("Prane plošče: minimalna rešitev — priporočena betonska plošča s padcem 1 cm/m.");
        else if(stv==="kovina")msgs.push("Obstoječa kovinska konstrukcija: razmak letvic max 33–35 cm (center); pod dolžinskim spojem konstrukcija na vsaki strani.");
      }
      if(use!=="terasa"&&V("mountType")==="kovinska konstrukcija")msgs.push("Obstoječa kovinska konstrukcija: montaža na okrogle cevi NI dovoljena (potrebne ravne pritrdilne površine); garancija na izvedbo na obstoječi konstrukciji se ne prizna (kondenz).");
      if(use==="pregrada"&&pc.n.indexOf("KUBO")>=0&&H>2500)msgs.push("KUBO pregrada: brez vmesnih nosilcev (pritrditev zgoraj in spodaj) samo do višine 2500 mm — dodajte vmesne nosilce.");
    }
  }
  /* P2 (Faza 3): korita — opozorila iz enotnega vira getKoritaData() */
  getKoritaData().warnings.forEach(function(w){msgs.push(w)});
  var box=$("checks");box.className="warnbox"+(msgs.length?" on":"");box.innerHTML=msgs.map(function(m){return"• "+E(m)}).join("<br>");
  var zoneBad=msgs.some(function(m){return m.indexOf("srednje polje")>=0});
  $("n").classList.toggle("invalid",zoneBad);$("gap").classList.toggle("invalid",zoneBad);
  updateGlobalStatus(msgs);syncSteps()
}
["L","H","D","n","sw","gap","st","wall"].forEach(function(id){$(id).addEventListener("input",checks)});
["zoneTop","zoneMid","zoneBot","zoneBase"].forEach(function(id){$(id).addEventListener("input",checks)});
["installTemp","slopeMM"].forEach(function(id){$(id).addEventListener("input",checks)});
["weldedParts","subType"].forEach(function(id){$(id).addEventListener("change",checks)});
$("refMode").addEventListener("change",function(){var m=$("refModeMenu");if(m)m.checked=$("refMode").checked;checks()});
