// Draftwright — modul 04-svg-lib (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
/* ---------- SVG sheet ---------- */
function ln(x1,y1,x2,y2,w,extra){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#111" stroke-width="'+(w||0.25)+'" '+(extra||"")+'/>'}
function rc(x,y,w,h,fill,stroke){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+(fill||"none")+'" stroke="'+(stroke||"#111")+'" stroke-width="0.3"/>'}
function tx(x,y,s,z,a,w,c,rot){var tr=rot?' transform="rotate('+rot+' '+x+' '+y+')"':'';return '<text x="'+x+'" y="'+y+'" font-family="Arial,Helvetica,sans-serif" font-size="'+(z||2.6)+'" text-anchor="'+(a||"start")+'" font-weight="'+(w||400)+'" fill="'+(c||"#111")+'"'+tr+'>'+E(s)+'</text>'}
function dh(x1,x2,y,label,ey){var a=Math.min(x1,x2),b=Math.max(x1,x2),t=(a+b)/2,s="";
  s+=ln(a,ey,a,y+2,0.18)+ln(b,ey,b,y+2,0.18)+ln(a,y,b,y,0.25);
  s+='<path d="M'+a+' '+y+' L'+(a+2)+' '+(y-0.8)+' L'+(a+2)+' '+(y+0.8)+' Z" fill="#111"/>';
  s+='<path d="M'+b+' '+y+' L'+(b-2)+' '+(y-0.8)+' L'+(b-2)+' '+(y+0.8)+' Z" fill="#111"/>';
  s+='<rect x="'+(t-label.length*0.8)+'" y="'+(y-3.5)+'" width="'+(label.length*1.6)+'" height="2.9" fill="#fff"/>';
  return s+tx(t,y-1.4,label,2.5,"middle")}
function dv(y1,y2,x,label,ex){var a=Math.min(y1,y2),b=Math.max(y1,y2),t=(a+b)/2,s="",ar=Math.min(0.8,Math.abs(b-a)*0.2),aw=ar*0.35;
  s+=ln(ex,a,x+2,a,0.18)+ln(ex,b,x+2,b,0.18)+ln(x,a,x,b,0.25);
  s+='<path d="M'+x+' '+a+' L'+(x-aw)+' '+(a+ar)+' L'+(x+aw)+' '+(a+ar)+' Z" fill="#111"/>';
  s+='<path d="M'+x+' '+b+' L'+(x-aw)+' '+(b-ar)+' L'+(x+aw)+' '+(b-ar)+' Z" fill="#111"/>';
  s+='<rect x="'+(x-aw)+'" y="'+(t-Math.max(2,label.length*0.5))+'" width="'+(aw*2)+'" height="'+Math.max(4,label.length)+'" fill="#fff"/>';
  return s+tx(x,t+0.9,label,2.5,"middle",400,"#111",-90)}
function panel(x,y,w,h,title){return rc(x,y,w,h,"none","#777")+tx(x+2,y+4.5,title,2.8,"start",500)}
function hatch(x,y,w,h){var s="";for(var i=0;i<w+h;i+=4){var x1=x+Math.max(0,i-h),y1=y+Math.min(i,h),x2=x+Math.min(i,w),y2=y+Math.max(0,i-w);if(x1<=x+w&&y2<=y+h)s+=ln(x1,y1,x2,y2,0.12,'stroke="#999"')}return s}
function poly(pts,fill,stroke,w){return '<polygon points="'+pts.map(function(p){return p[0]+","+p[1]}).join(" ")+'" fill="'+(fill||"none")+'" stroke="'+(stroke||"#111")+'" stroke-width="'+(w||0.25)+'"/>'}
function balloon(x,y,num){return '<circle cx="'+x+'" cy="'+y+'" r="2.7" fill="#fff" stroke="#111" stroke-width="0.3"/>'+tx(x,y+0.9,String(num),2.3,"middle",500)}
function center(x1,y1,x2,y2){return ln(x1,y1,x2,y2,0.15,'stroke="#777" stroke-dasharray="4 1 2 1"')}
function tbl(x,y,cols,rows,head,rh){rh=rh||4.9;var s="",tot=cols.reduce(function(a,b){return a+b},0),i,j,cx,cy=y;
  s+=rc(x,y,tot,rows.length*rh+(head?rh:0),"none","#111");
  if(head){s+=rc(x,y,tot,rh,"#141c24","#111");cx=x;for(i=0;i<head.length;i++){s+=tx(cx+1.3,y+rh*0.7,head[i],Math.min(2.2,rh*0.45),"start",600,"#fff");cx+=cols[i]}cy+=rh}
  rows.forEach(function(row,ri){cx=x;for(j=0;j<row.length;j++){s+=tx(cx+1.3,cy+rh*0.7,String(row[j]),Math.min(2.1,rh*0.43),"start");cx+=cols[j]}cy+=rh;if(ri<rows.length-1)s+=ln(x,cy,tot+x,cy,0.12)});
  return s}
