// Draftwright — modul 16-boot (izločeno iz tehnicka-risba-pro.html; razbitje monolita)
// Klasična skripta: deljen globalni obseg; naložena pred 16-boot.js.
"use strict";
$("notes").addEventListener("input",function(){notesTouched=true});
restoreState();restoreFieldState();
if(!$("date").value){var td=new Date();$("date").value=("0"+td.getDate()).slice(-2)+"."+("0"+(td.getMonth()+1)).slice(-2)+"."+td.getFullYear()}
setMode(false);applyFieldVisibility();applySystem();checks();
var _rm=$("refModeMenu"); if(_rm) _rm.checked=!!$("refMode").checked;
if(typeof updateModeTicks==="function") updateModeTicks();
