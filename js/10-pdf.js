// Draftwright — modul 10-pdf (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
/* ---------- P4: vektorski PDF (jsPDF + svg2pdf) — enak izpis na vseh napravah, brez tiskalnega okna.
   Knjižnici so lokalne (vendor/) in v predpomnilniku SW → deluje tudi brez signala.
   Pisava Liberation Sans (TTF, SIL OFL) — slovenske črke (č š ž) pravilno v vektorskem besedilu. ---------- */
var pdfFontPromise=null;
function pdfFontB64(){
  if(!pdfFontPromise)pdfFontPromise=fetch("vendor/LiberationSans-Regular.ttf").then(function(r){
    if(!r.ok)throw new Error("pisava ni dosegljiva ("+r.status+")");
    return r.arrayBuffer();
  }).then(function(b){
    var u=new Uint8Array(b),s="",CH=0x8000;
    for(var i=0;i<u.length;i+=CH)s+=String.fromCharCode.apply(null,u.subarray(i,i+CH));
    return btoa(s);
  });
  return pdfFontPromise;
}
window.exportPdf=exportPdf; /* P4: testno dostopni */
function exportPdf(sv,paper){
  if(typeof jspdf==="undefined"||typeof svg2pdf==="undefined")return Promise.reject(new Error("PDF knjižnice se še nalagajo — poskusite znova ali uporabite tisk (brskalnik)"));
  var pw=paper==="A3"?420:paper==="A4"?297:594,ph=paper==="A3"?297:paper==="A4"?210:420;
  var doc=new jspdf.jsPDF({orientation:pw>ph?"landscape":"portrait",unit:"mm",format:[pw,ph],compress:true});
  return pdfFontB64().then(function(b64){
    doc.addFileToVFS("LiberationSans.ttf",b64);
    /* vse kombinacije, ki jih svg2pdf zahteva glede na font-weight (500/600 v naslovih) —
       brez registracije bi teža 500/600 padla na standardno WinAnsi pisavo (č/š/ž pokvarjene) */
    ["Arial","Helvetica"].forEach(function(fn){
      doc.addFont("LiberationSans.ttf",fn,"normal");
      doc.addFont("LiberationSans.ttf",fn,"bold");
      doc.addFont("LiberationSans.ttf",fn,"italic");
      doc.addFont("LiberationSans.ttf",fn,"bolditalic");
      doc.addFont("LiberationSans.ttf",fn,"400normal");
      doc.addFont("LiberationSans.ttf",fn,"500normal");
      doc.addFont("LiberationSans.ttf",fn,"600normal");
      doc.addFont("LiberationSans.ttf",fn,"700normal");
    });
    var el=new DOMParser().parseFromString(sv,"image/svg+xml").documentElement;
    return doc.svg(el,{x:0,y:0,width:pw,height:ph});
  }).then(function(){return doc});
}

