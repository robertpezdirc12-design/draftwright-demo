/* js/core.js — izvorni modul čistih funkcij.
   Datoteka NI neposredno naložena v HTML-ju: zero-install PWA in obstoječi jsdom
   testi uporabljajo inline kopijo. Vir je ta datoteka; po spremembi poganjaj
   `npm run modules:sync`, ki jo vstavi v tehnicka-risba-pro.html med oznaki. */

var DWCore=(function(){
  function numParse(v){
    var s=String(v==null?"":v).trim();
    if(s==="")return NaN;
    if(/^-?\d+,\d+$/.test(s))s=s.replace(",",".");
    else if(/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(s))s=s.replace(/\./g,"").replace(",",".");
    return parseFloat(s);
  }
  function format(x){var y=Math.round(x*10)/10;return (Math.abs(y-Math.round(y))<0.05)?String(Math.round(y)):y.toFixed(1)}
  function spanParts(total,n){var t10=Math.round(total*10),b10=Math.floor(t10/Math.max(1,n)),rem=t10-b10*Math.max(1,n),out=[],i;for(i=0;i<n;i++)out.push(String((b10+(i<rem?1:0))/10));return out}
  function spanCenters(total,n){var parts=spanParts(total,n),out=[0],s=0;for(var i=0;i<parts.length;i++){s+=Number(parts[i]);out.push(s)}out[out.length-1]=total;return out}
  function parseDim(str,fallback){var a=(String(str||"").match(/\d+(?:\.\d+)?/g)||[]).map(Number);return a.length>=2?[a[0],a[1]]:fallback}
  function escapeHtml(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]})}
  return {numParse:numParse,format:format,spanParts:spanParts,spanCenters:spanCenters,dim:parseDim,escapeHtml:escapeHtml};
})();
window.DWCore=DWCore;
