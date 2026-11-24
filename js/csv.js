/* js/csv.js — izvorni modul skupnega CSV omiljanja (formula-injection).
   Vir je ta datoteka; `npm run modules:sync` vstavi vsebino v označeni blok
   znotraj tehnicka-risba-pro.html. Funkciji sta čisti, brez DOM odvisnosti. */

function csvCell(c){var s=String(c);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function csvRow(arr){return arr.map(csvCell).join(";")}
