/* ---------- Issue #6: terenska skica — prazen list, prostoročno risanje, ročno sestavljanje ----------
   Ločen modul od foto/parametričnega toka (brez prekrivanja): prazen list brez mreže/okvira po privzetku,
   elementi so pripomočki za skiciranje (NE samodejno potrjena geometrija), ročne mere jasno označene. */
var SK={elems:[],undo:[],redo:[],tool:"prosto",color:"#111111",width:2,paper:"A4",orient:"pokoncno",mreza:false,drawing:null,selected:-1};
function skPage(){var land=SK.orient==="lezeco";if(SK.paper==="A3")return land?[420,297]:[297,420];return land?[297,210]:[210,297]}
function skPushUndo(){SK.undo.push(JSON.stringify({e:SK.elems,p:SK.paper,o:SK.orient,m:SK.mreza}));if(SK.undo.length>50)SK.undo.shift();SK.redo=[]}
function skRender(){
  var svg=$("skSvg");if(!svg)return;
  var pg=skPage(),s="",i;
  svg.setAttribute("viewBox","0 0 "+pg[0]+" "+pg[1]);
  if(SK.mreza){
    for(var x=10;x<pg[0];x+=10)s+='<line x1="'+x+'" y1="0" x2="'+x+'" y2="'+pg[1]+'" stroke="#ececec" stroke-width="0.3"/>';
    for(var y=10;y<pg[1];y+=10)s+='<line x1="0" y1="'+y+'" x2="'+pg[0]+'" y2="'+y+'" stroke="#ececec" stroke-width="0.3"/>';
  }
  SK.elems.forEach(function(e,ei){
    var col=e.color,w=e.width,sel=(ei===SK.selected),hl=sel?' stroke-dasharray="2 1.5"':"";
    if(e.t==="free")s+='<polyline points="'+e.pts.map(function(p){return p.x+","+p.y}).join(" ")+'" fill="none" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"'+hl+'/>';
    else if(e.t==="line")s+='<line x1="'+e.x1+'" y1="'+e.y1+'" x2="'+e.x2+'" y2="'+e.y2+'" stroke="'+col+'" stroke-width="'+w+'"'+hl+'/>';
    else if(e.t==="rect")s+='<rect x="'+Math.min(e.x1,e.x2)+'" y="'+Math.min(e.y1,e.y2)+'" width="'+Math.abs(e.x2-e.x1)+'" height="'+Math.abs(e.y2-e.y1)+'" fill="none" stroke="'+col+'" stroke-width="'+w+'"'+hl+'/>';
    else if(e.t==="circle")s+='<circle cx="'+e.cx+'" cy="'+e.cy+'" r="'+e.r+'" fill="none" stroke="'+col+'" stroke-width="'+w+'"'+hl+'/>';
    else if(e.t==="arrow"){
      var dx=e.x2-e.x1,dy=e.y2-e.y1,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,ah=Math.max(4,w*2);
      s+='<line x1="'+e.x1+'" y1="'+e.y1+'" x2="'+e.x2+'" y2="'+e.y2+'" stroke="'+col+'" stroke-width="'+w+'"'+hl+'/>';
      s+='<polygon points="'+e.x2+','+e.y2+' '+(e.x2-ah*ux+ah*0.4*uy)+','+(e.y2-ah*uy-ah*0.4*ux)+' '+(e.x2-ah*ux-ah*0.4*uy)+','+(e.y2-ah*uy+ah*0.4*ux)+'" fill="'+col+'"/>';
    }
    else if(e.t==="text")s+='<text x="'+e.x+'" y="'+e.y+'" font-size="'+(w*4+7)+'" font-family="Arial" fill="'+col+'">'+E(e.txt)+'</text>';
    else if(e.t==="dim"){ /* ročno kotiranje — jasno označeno kot ročni vnos (pogl. 13/17 Issue #6) */
      s+='<line x1="'+e.x1+'" y1="'+e.y1+'" x2="'+e.x2+'" y2="'+e.y2+'" stroke="'+col+'" stroke-width="0.7"/>';
      s+='<text x="'+((e.x1+e.x2)/2)+'" y="'+((e.y1+e.y2)/2-3)+'" font-size="8" font-family="Arial" fill="'+col+'" text-anchor="middle">M(ročno): '+E(e.label)+'</text>';
    }
    else if(e.t==="iso"){ /* izometrična kocka — simbol za skiciranje */
      var s4=e.s||40,h4=s4*0.5,d4=s4*0.6;
      s+='<polygon points="'+e.x+','+(e.y+d4)+' '+(e.x+s4/2)+','+e.y+' '+(e.x+s4)+','+(e.y+d4)+' '+(e.x+s4/2)+','+(e.y+d4*2)+'" fill="none" stroke="'+col+'" stroke-width="'+w+'"'+hl+'/>';
      s+='<line x1="'+e.x+'" y1="'+(e.y+d4)+'" x2="'+e.x+'" y2="'+(e.y+d4+s4*0.5)+'" stroke="'+col+'" stroke-width="'+w+'"/>';
      s+='<line x1="'+(e.x+s4/2)+'" y1="'+(e.y+d4*2)+'" x2="'+(e.x+s4/2)+'" y2="'+(e.y+d4*2+s4*0.5)+'" stroke="'+col+'" stroke-width="'+w+'"/>';
      s+='<line x1="'+(e.x+s4)+'" y1="'+(e.y+d4)+'" x2="'+(e.x+s4)+'" y2="'+(e.y+d4+s4*0.5)+'" stroke="'+col+'" stroke-width="'+w+'"/>';
      s+='<line x1="'+e.x+'" y1="'+(e.y+d4+s4*0.5)+'" x2="'+(e.x+s4/2)+'" y2="'+(e.y+d4*2+s4*0.5)+'" stroke="'+col+'" stroke-width="'+w+'"/>';
      s+='<line x1="'+(e.x+s4/2)+'" y1="'+(e.y+d4*2+s4*0.5)+'" x2="'+(e.x+s4)+'" y2="'+(e.y+d4+s4*0.5)+'" stroke="'+col+'" stroke-width="'+w+'"/>';
    }
  });
  if(SK.drawing&&SK.drawing.preview)s+=SK.drawing.preview;
  svg.innerHTML=s;
  var pgTxt=SK.paper+" ("+(SK.orient==="pokoncno"?"pokončno":"ležeče")+")";
  $("skStatus").textContent=SK.elems.length?("Elementov: "+SK.elems.length+" · list: "+pgTxt+(SK.mreza?" · mreža":"")):"Prazen list — izberite orodje in rišite.";
}
function skSvgPt(e){
  var svg=$("skSvg"),r=svg.getBoundingClientRect(),pg=skPage();
  return {x:(e.clientX-r.left)*pg[0]/r.width,y:(e.clientY-r.top)*pg[1]/r.height};
}
function skCommit(e){SK.elems.push(e);SK.drawing=null}
function skHit(x,y){
  var best=-1,bd=6;
  SK.elems.forEach(function(e,i){
    var d=Infinity;
    if(e.t==="free"){e.pts.forEach(function(p2){d=Math.min(d,Math.hypot(p2.x-x,p2.y-y))})}
    else if(e.t==="circle"){d=Math.abs(Math.hypot(x-e.cx,y-e.cy)-e.r)}
    else if(e.t==="text"){d=Math.hypot(x-e.x,y-e.y)}
    else{var x1=Math.min(e.x1,e.x2),y1=Math.min(e.y1,e.y2),x2=Math.max(e.x1,e.x2),y2=Math.max(e.y1,e.y2);
      if(x>=x1-6&&x<=x2+6&&y>=y1-6&&y<=y2+6)d=Math.min(Math.abs(x-x1),Math.abs(x-x2),Math.abs(y-y1),Math.abs(y-y2))}
    if(d<bd){bd=d;best=i}
  });
  return best;
}
(function(){
  var svg=$("skSvg"),down=false,anchor=null,last=null;
  function preview(t,a,b,color,width,extra){
    if(t==="free")return '<polyline points="'+a.x+","+a.y+" "+b.x+","+b.y+'" fill="none" stroke="'+color+'" stroke-width="'+width+'"/>';
    if(t==="line")return '<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+color+'" stroke-width="'+width+'"/>';
    if(t==="rect")return '<rect x="'+Math.min(a.x,b.x)+'" y="'+Math.min(a.y,b.y)+'" width="'+Math.abs(b.x-a.x)+'" height="'+Math.abs(b.y-a.y)+'" fill="none" stroke="'+color+'" stroke-width="'+width+'"/>';
    if(t==="circle")return '<circle cx="'+a.x+'" cy="'+a.y+'" r="'+Math.hypot(b.x-a.x,b.y-a.y)+'" fill="none" stroke="'+color+'" stroke-width="'+width+'"/>';
    if(t==="arrow")return '<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+color+'" stroke-width="'+width+'"/>';
    if(t==="dim")return '<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+color+'" stroke-width="0.7"/><text x="'+((a.x+b.x)/2)+'" y="'+((a.y+b.y)/2-3)+'" font-size="8" fill="'+color+'" text-anchor="middle">M(ročno): '+(extra||"")+'</text>';
    return "";
  }
  svg.addEventListener("pointerdown",function(e){
    var p=skSvgPt(e);skPushUndo();
    if(SK.tool==="radirka"){
      var hit=-1,bd=7;
      SK.elems.forEach(function(el,i){
        var d=Infinity;
        if(el.t==="free"){el.pts.forEach(function(p2){d=Math.min(d,Math.hypot(p2.x-p.x,p2.y-p.y))})}
        else if(el.t==="circle"){d=Math.abs(Math.hypot(p.x-el.cx,p.y-el.cy)-el.r)}
        else if(el.t==="text"){d=Math.hypot(p.x-el.x,p.y-el.y)}
        else{var x1=Math.min(el.x1,el.x2),y1=Math.min(el.y1,el.y2),x2=Math.max(el.x1,el.x2),y2=Math.max(el.y1,el.y2);
          if(p.x>=x1-7&&p.x<=x2+7&&p.y>=y1-7&&p.y<=y2+7)d=0}
        if(d<bd){bd=d;hit=i}
      });
      if(hit>=0)SK.elems.splice(hit,1);
      skRender();return;
    }
    if(SK.tool==="text"){
      var txt=window.prompt("Besedilo (ročni vnos):","");
      if(txt){skCommit({t:"text",x:p.x,y:p.y,txt:txt,color:SK.color,width:SK.width});skRender()}
      return;
    }
    if(SK.tool==="premakni"){
      SK.selected=skHit(p.x,p.y);down=true;last=p;skRender();return;
    }
    down=true;anchor=p;last=p;
  });
  svg.addEventListener("pointermove",function(e){
    if(!down)return;
    var p=skSvgPt(e);
    if(SK.tool==="premakni"){
      if(SK.selected>=0&&last){
        var dx=p.x-last.x,dy=p.y-last.y,el=SK.elems[SK.selected];
        if(el.t==="free")el.pts.forEach(function(p2){p2.x+=dx;p2.y+=dy});
        else{el.x1+=dx;el.y1+=dy;el.x2+=dx;el.y2+=dy;if(el.cx!=null){el.cx+=dx;el.cy+=dy}if(el.x!=null){el.x+=dx;el.y+=dy}}
        last=p;skRender();
      }
      return;
    }
    if(SK.tool==="prosto"){
      if(!SK.drawing){SK.drawing={t:"free",pts:[anchor?anchor:p],color:SK.color,width:SK.width};SK.drawing.pts=[anchor||p]}
      SK.drawing.pts.push(p);last=p;
      skRender();return;
    }
    last=p;
    var lbl=SK.tool==="dim"?window.prompt("Mera (ročni vnos):","")||"":null;
    SK.drawing={t:SK.tool,a:anchor||p,b:p,color:SK.color,width:SK.width,label:lbl,preview:preview(SK.tool,anchor||p,p,SK.color,SK.width,lbl)};
    skRender();
  });
  window.addEventListener("pointerup",function(){
    if(!down)return;down=false;
    if(SK.tool==="prosto"&&SK.drawing){if(SK.drawing.pts.length>1)skCommit(SK.drawing);else{SK.drawing=null;SK.undo.pop()}}
    else if(SK.drawing&&SK.drawing.t==="dim"){var lbl=window.prompt("Mera (ročni vnos):","")||"";if(lbl){SK.drawing.label=lbl;SK.drawing.preview=preview("dim",SK.drawing.a,SK.drawing.b,SK.color,SK.width,lbl);skCommit(SK.drawing)}else{SK.drawing=null;SK.undo.pop()}}
    else if(SK.drawing)skCommit(SK.drawing);
    SK.drawing=null;anchor=null;skRender();
  });
})();
$("skUndo").onclick=function(){if(!SK.undo.length)return;SK.redo.push(JSON.stringify({e:SK.elems,p:SK.paper,o:SK.orient,m:SK.mreza}));var st=JSON.parse(SK.undo.pop());SK.elems=st.e;SK.paper=st.p;SK.orient=st.o;SK.mreza=st.m;$("skPaper").value=SK.paper;$("skOrient").value=SK.orient;$("skGrid").checked=SK.mreza;skRender()};
$("skRedo").onclick=function(){if(!SK.redo.length)return;SK.undo.push(JSON.stringify({e:SK.elems,p:SK.paper,o:SK.orient,m:SK.mreza}));var st=JSON.parse(SK.redo.pop());SK.elems=st.e;SK.paper=st.p;SK.orient=st.o;SK.mreza=st.m;$("skPaper").value=SK.paper;$("skOrient").value=SK.orient;$("skGrid").checked=SK.mreza;skRender()};
$("skClear").onclick=function(){if(!SK.elems.length)return;skPushUndo();SK.elems=[];SK.selected=-1;skRender()};
$("skPrint").onclick=function(){
  SK.selected=-1;skRender();
  var pg=skPage(),w=window.open("","_blank");if(!w)return;
  var svg=$("skSvg").outerHTML.replace(/stroke-dasharray="2 1\.5"/g,"");
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><style>@page{size:'+pg[0]+'mm '+pg[1]+'mm;margin:0}html,body{margin:0;background:#fff}svg{width:'+pg[0]+'mm;height:'+pg[1]+'mm;display:block}</style></head><body>'+svg+'</body></html>');
  w.document.close();setTimeout(function(){w.focus();w.print()},400);
};
$("skPaper").onchange=function(){skPushUndo();SK.paper=this.value;skRender()};
$("skOrient").onchange=function(){skPushUndo();SK.orient=this.value;skRender()};
$("skGrid").onchange=function(){skPushUndo();SK.mreza=this.checked;skRender()};
document.addEventListener("keydown",function(e){
  if($("expOverlay").classList.contains("on"))return;
  var typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if(typing)return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();$("skUndo").click()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();$("skRedo").click()}
});
skRender();
