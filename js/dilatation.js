/* js/dilatation.js — izvorni modul dilatacijske tabele in interpolacije.
   Vir je ta datoteka; `npm run modules:sync` vstavi vsebino v označeni blok
   znotraj tehnicka-risba-pro.html. Tabela in funkcija ne uporabljata DOM. */

/* Dilatacijska tabela WoodCore — uradni PDF »Navodila za montažo WPC terasnih desk«
   (zahodna/vzhodna Evropa): priporočen razmak (mm) glede na dolžino deske (1–5 m)
   in temperaturo ob montaži. Vrstica −25 °C/1 m je v PDF natisnjena kot 2,27;
   po vrstnem redu tabele je to tiskarska napaka za 2,75 — uporabljena 2,75. */
var DIL={
  temps:[-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35],
  vals:[[2.75,5.5,8.25,11,11],[2.5,5,7.5,10,10],[2.5,5,7.5,10,10],[2.25,4.5,6.75,9,9],
        [2,4,6,8,8],[1.75,3.5,5.25,7,7],[1.75,3.5,5.25,7,7],[1.5,3,4.5,6,6],
        [1.25,2.5,3.75,5,5],[1.25,2.5,3.75,5,5],[1,2,3,4,4],[1,1.5,2.25,3,3],[1,1.5,1.8,2,2]]
};
function dilatacija(lenM,tempC){
  var l=Math.max(1,Math.min(5,lenM)),t=Math.max(DIL.temps[0],Math.min(DIL.temps[DIL.temps.length-1],tempC));
  function poDolzini(vals){
    var i1=Math.floor(l),i2=Math.min(5,Math.ceil(l));
    if(i1===i2)return vals[i1-1];
    var fr=l-i1;return vals[i1-1]*(1-fr)+vals[i2-1]*fr;
  }
  var ti=0;
  while(ti<DIL.temps.length-1&&t>DIL.temps[ti+1])ti++;
  var a=poDolzini(DIL.vals[ti]);
  if(t<=DIL.temps[ti]||ti>=DIL.temps.length-1)return a;
  var b=poDolzini(DIL.vals[ti+1]),fr=(t-DIL.temps[ti])/(DIL.temps[ti+1]-DIL.temps[ti]);
  return a*(1-fr)+b*fr;
}
