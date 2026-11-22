// Draftwright — modul 00-core (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
var $=function(id){return document.getElementById(id)};
function V(id){return $(id).value}
/* Enotno, tolerantno število: vejica kot decimalna ločnica, vedno končno. */
function pnum(x,d){var y=parseFloat(String(x==null?"":x).trim().replace(",","."));return isFinite(y)?y:(d||0)}
function numOf(x,d){return pnum(x,d)}
function safeColor(c){var s=String(c==null?"":c).trim();return (/^#[0-9a-fA-F]{3,8}$/.test(s)||/^[a-zA-Z]{3,20}$/.test(s))?s:"#111111"}
function n(id){return pnum(V(id),0)}
function E(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]})}
function f(x){if(!isFinite(x))return "0";var y=Math.round(x*10)/10;return (Math.abs(y-Math.round(y))<0.05)?String(Math.round(y)):y.toFixed(1)}
function spanParts(total,n){var t10=Math.round(total*10),b10=Math.floor(t10/Math.max(1,n)),rem=t10-b10*Math.max(1,n),out=[],i;for(i=0;i<n;i++)out.push(String((b10+(i<rem?1:0))/10));return out}
function spanCenters(total,n){var parts=spanParts(total,n),out=[0],s=0;for(var i=0;i<parts.length;i++){s+=Number(parts[i]);out.push(s)}out[out.length-1]=total;return out}
function dim(str,fallback){var a=(String(str||"").match(/\d+(?:[.,]\d+)?/g)||[]).map(function(x){return pnum(x,0)});return a.length>=2?[a[0],a[1]]:fallback}
/* Sanitizacija elementov skice na vstopni meji — preprečuje vbrizg atributov v SVG. */
function skCleanElem(e){
  if(!e||typeof e!=="object")return null;
  var t=String(e.t||""),ok={free:1,line:1,rect:1,circle:1,arrow:1,text:1,dim:1,iso:1};
  if(!ok[t])return null;
  var o={t:t,color:safeColor(e.color),width:Math.max(0.1,Math.min(20,numOf(e.width,2)))};
  function xy(k,d){o[k]=numOf(e[k],d||0)}
  if(t==="free"){
    o.pts=(Array.isArray(e.pts)?e.pts:[]).slice(0,2000).map(function(p){return{x:numOf(p&&p.x,0),y:numOf(p&&p.y,0)}});
    if(!o.pts.length)return null;
  }else if(t==="circle"){xy("cx",0);xy("cy",0);o.r=Math.max(0,numOf(e.r,0))}
  else if(t==="text"){xy("x",0);xy("y",0);o.txt=String(e.txt==null?"":e.txt).slice(0,500)}
  else if(t==="iso"){xy("x",0);xy("y",0);o.s=Math.max(1,Math.min(500,numOf(e.s,40)))}
  else{xy("x1",0);xy("y1",0);xy("x2",0);xy("y2",0);if(t==="dim")o.label=String(e.label==null?"":e.label).slice(0,200)}
  return o;
}
function st(t,k){var e=$("calStatus");e.textContent=t;e.className="status"+(k?" "+k:"");syncSteps()}
function dt(t,k){var e=$("detStatus");e.textContent=t;e.className="status"+(k?" "+k:"");syncSteps()}
