/**
 * Dostopnost (WCAG 2.1.1, 2.4.3, 4.1.2) — tipkovnica in stanja vmesnika.
 *
 * Pre-fiks: sklope stranske plošče je bilo mogoče odpreti/zapreti SAMO s klikom
 * (h2 ni bil fokusabilen, brez role/aria-expanded), gumbi menijev niso javljali
 * aria-haspopup/aria-expanded, dialogi (razen izvoznega) pa ob zaprtju niso vrnili
 * fokusa na sprožilec. Suita preverja obnašanje na pravi aplikaciji prek jsdom in
 * statične zahteve na oznakah; na stari kodi bi PADLA (brez role=button, brez
 * aria-expanded, brez obnove fokusa).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tehnicka-risba-pro.html"), "utf8");

let pass = 0, fail = 0;
const errors = [];
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; errors.push(name); console.log(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true,
    url: "https://draftwright-demo.vercel.app/",
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = function () {
        return { drawImage() {}, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; }, fillRect() {}, measureText(t) { return { width: t.length }; } };
      };
      window.URL.createObjectURL = () => "blob:mem";
      window.URL.revokeObjectURL = () => {};
    },
  });
  const w = dom.window, d = w.document;
  const jerr = [];
  w.addEventListener("error", (e) => jerr.push(String(e.error || e.message || e)));
  await sleep(50);

  const closeAll = () => d.querySelectorAll('[class*="overlay"]').forEach((o) => o.classList.remove("on"));
  closeAll();

  /* Pripisano dosegljivo ime: aria-label → aria-labelledby → label[for] → <label> prednik → besedilo → title. */
  function accName(el) {
    const al = el.getAttribute("aria-label");
    if (al && al.trim()) return al.trim();
    const lb = el.getAttribute("aria-labelledby");
    if (lb) {
      const t = lb.split(/\s+/).map((id) => { const n = d.getElementById(id); return n ? n.textContent.trim() : ""; }).join(" ").trim();
      if (t) return t;
    }
    if (el.id) { const l = d.querySelector('label[for="' + el.id + '"]'); if (l && l.textContent.trim()) return l.textContent.trim(); }
    const wrap = el.closest && el.closest("label");
    if (wrap && wrap.textContent.trim()) return wrap.textContent.trim();
    /* Pri poljih besedilo ni ime: <select> bi sicer "pobral" besedilo možnosti. */
    if (!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (txt) return txt;
    }
    const t = el.getAttribute("title");
    return t && t.trim() ? t.trim() : "";
  }

  /* ---------- 1) dialogi imajo dosegljivo ime ---------- */
  const dialogs = Array.from(d.querySelectorAll('[role="dialog"]'));
  check("vsi dialogi imajo dosegljivo ime (aria-label/labelledby)", dialogs.length >= 13 && dialogs.every((el) => accName(el)), "dialogov=" + dialogs.length + " brez imena: " + dialogs.filter((el) => !accName(el)).length);
  const overlays = Array.from(d.querySelectorAll(".exp-overlay"));
  check("vsak overlay ima natanko en modalni dialog z imenom", overlays.length === 13 && overlays.every((o) => {
    const ds = o.querySelectorAll('[role="dialog"][aria-modal="true"]');
    return ds.length === 1 && accName(ds[0]);
  }), "overlayev=" + overlays.length + ", dialogov=" + dialogs.length);

  /* 1b) rezultat in povečava fotografije sta prav tako modalna dialoga. */
  const resultOv = d.getElementById("resultOverlay");
  const tmpRes = d.createElement("div"); tmpRes.id = "auditResultSrc"; tmpRes.textContent = "x"; d.body.appendChild(tmpRes);
  w.showResult("auditResultSrc", "Preverjanje rezultata");
  await sleep(35);
  const resultDlg = resultOv.querySelector('[role="dialog"]');
  check("rezultat: modalni dialog z imenom iz naslova", !!resultDlg && resultDlg.getAttribute("aria-modal") === "true" && resultDlg.getAttribute("aria-labelledby") === "resultTitle" && accName(resultDlg) === "Preverjanje rezultata" && resultOv.contains(d.activeElement));
  tmpRes.remove(); w.closeResult(); await sleep(30);

  const photo = d.getElementById("img");
  photo.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
  photo.click();
  await sleep(35);
  const zoomOv = d.getElementById("photoZoomOverlay"), zoomDlg = zoomOv.querySelector('[role="dialog"]');
  check("povečava: modalni dialog z imenom in fokusom", !!zoomDlg && zoomDlg.getAttribute("aria-modal") === "true" && accName(zoomDlg) === "Povečana fotografija" && zoomOv.contains(d.activeElement));
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  await sleep(30);
  check("povečava: Escape zapre dialog", !zoomOv.classList.contains("on"));

  /* 1c) izbira vidnih sklopov je gumb z stanjem in skupino potrditvenih polj. */
  const fieldBtn = d.getElementById("fieldBtn"), fieldMenu = d.getElementById("fieldMenu");
  check("izbira polj javlja stanje in nadzoruje skupino", fieldBtn.getAttribute("aria-expanded") === "false" && fieldBtn.getAttribute("aria-controls") === "fieldMenu" && fieldMenu.getAttribute("role") === "group" && accName(fieldMenu) === "Vidni sklopi in polja");
  /* Gumb je v spustnem meniju, zato najprej odpremo njegov meni (sicer je display:none in fokus ne deluje). */
  fieldBtn.closest("[data-menu]").querySelector(":scope > button").click(); await sleep(20);
  fieldBtn.click(); await sleep(20);
  check("odprta izbira polj javi aria-expanded=true", fieldBtn.getAttribute("aria-expanded") === "true" && fieldMenu.classList.contains("open"));
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); await sleep(20);
  check("Escape zapre izbiro polj in vrne fokus", !fieldMenu.classList.contains("open") && fieldBtn.getAttribute("aria-expanded") === "false" && d.activeElement === fieldBtn, "odprt=" + fieldMenu.classList.contains("open") + ", expanded=" + fieldBtn.getAttribute("aria-expanded") + ", fokus=" + (d.activeElement && (d.activeElement.id || d.activeElement.tagName)));
  fieldBtn.click(); await sleep(20);
  d.body.click(); await sleep(20);
  check("klik zunaj zapre izbiro polj in uskladi stanje", !fieldMenu.classList.contains("open") && fieldBtn.getAttribute("aria-expanded") === "false");

  /* ---------- 2) gumbi in polja imajo ime ----------
     Gumbi v <div class="hooks" aria-hidden="true"> so namerno skriti programski
     sprožilci (JS jih klika), zato jih vidnostni filter izloči — enako velja za
     gumbe v zaprtih menijih in dialogih. */
  function a11yVisible(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.getAttribute && n.getAttribute("aria-hidden") === "true") return false;
      const cs = w.getComputedStyle(n);
      if (cs && (cs.display === "none" || cs.visibility === "hidden")) return false;
    }
    return true;
  }
  const btns = Array.from(d.querySelectorAll("button")).filter(a11yVisible);
  const noName = btns.filter((b) => !accName(b));
  check("vsak gumb ima dosegljivo ime", noName.length === 0, noName.map((b) => b.outerHTML.slice(0, 60)).join(" | "));

  const fields = Array.from(d.querySelectorAll("input:not([type=hidden]),select,textarea"));
  const badField = fields.filter((f) => !accName(f));
  check("vsako polje ima pripadajočo oznako", badField.length === 0, badField.map((f) => f.id || f.name || f.tagName).join(", ") + " (n=" + fields.length + ")");

  /* ---------- 3) sklopi stranske plošče so tipkovnični ---------- */
  const heads = Array.from(d.querySelectorAll("aside section h2"));
  check("najdenih 9 naslovov sklopov", heads.length === 9, "n=" + heads.length);
  check("naslovi sklopov nimajo nedovoljene role=button", heads.every((h) => !h.hasAttribute("role")));
  const toggles = Array.from(d.querySelectorAll("aside section h2 > button.sec-btn"));
  check("vsak naslov ima pravi gumb", toggles.length === 9 && toggles.every((b) => b.tagName === "BUTTON" && !b.disabled));
  check("gumbi sklopov javljajo aria-expanded (true/false)",
    toggles.every((b) => ["true", "false"].includes(b.getAttribute("aria-expanded"))));

  const sec0 = heads[0].closest("section");
  const before = sec0.classList.contains("collapsed");
  toggles[0].click();
  check("klik na naslov obrne stanje sklopa", sec0.classList.contains("collapsed") !== before);
  check("po kliku je aria-expanded usklajen s stanjem", toggles[0].getAttribute("aria-expanded") === (sec0.classList.contains("collapsed") ? "false" : "true"));

  const beforeK = sec0.classList.contains("collapsed");
  toggles[0].dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  check("Enter na naslovu odpre/zapre sklop", sec0.classList.contains("collapsed") !== beforeK);
  const beforeK2 = sec0.classList.contains("collapsed");
  toggles[0].dispatchEvent(new w.KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
  check("preslednica na naslovu odpre/zapre sklop", sec0.classList.contains("collapsed") !== beforeK2);
  const beforeRow = sec0.classList.contains("collapsed");
  heads[0].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("klik na preostanek naslova preklopi sklop", sec0.classList.contains("collapsed") !== beforeRow);

  /* ---------- 4) meniji javljajo stanje ---------- */
  const menuBtns = Array.from(d.querySelectorAll("[data-menu] > button"));
  check("menijski gumbi javljajo aria-haspopup=true", menuBtns.length >= 6 && menuBtns.every((b) => b.getAttribute("aria-haspopup") === "true"), "n=" + menuBtns.length);
  check("menijski gumbi javljajo aria-expanded=false", menuBtns.every((b) => b.getAttribute("aria-expanded") === "false"));

  const mb = menuBtns[0], mm = mb.parentNode;
  mb.click();
  check("klik odpre meni in postavi aria-expanded=true", mm.classList.contains("open") && mb.getAttribute("aria-expanded") === "true");
  mb.click();
  check("drugi klik zapre meni in postavi aria-expanded=false", !mm.classList.contains("open") && mb.getAttribute("aria-expanded") === "false");

  mb.click();
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  check("Escape zapre meni", !mm.classList.contains("open"));
  check("Escape vrne fokus na menijski gumb", d.activeElement === mb, "activeElement=" + (d.activeElement && d.activeElement.id));
  check("po Escape je aria-expanded=false", mb.getAttribute("aria-expanded") === "false");

  mb.focus();
  mb.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
  const firstItem = mm.querySelector(".drop .mi");
  check("ArrowDown odpre meni s tipkovnice", mm.classList.contains("open") && mb.getAttribute("aria-expanded") === "true");
  check("ArrowDown premakne fokus na prvo postavko", firstItem && d.activeElement === firstItem);
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));

  /* ---------- 5) dialog: fokus tja in nazaj ---------- */
  check("aplikacija izvaža syncDialogFocus (regresija)", w.fwFocusTrap && typeof w.fwFocusTrap.syncDialogFocus === "function");
  const prj = d.getElementById("prjOverlay");
  const trigger = d.getElementById("panelBtn");
  trigger.focus();
  prj.classList.add("on");
  await sleep(30);
  check("odprtje dialoga premakne fokus vanj", prj.contains(d.activeElement), "activeElement=" + (d.activeElement && (d.activeElement.id || d.activeElement.tagName)));
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  await sleep(30);
  check("zaprtje dialoga vrne fokus na sprožilec", !prj.classList.contains("on") && d.activeElement === trigger, "activeElement=" + (d.activeElement && (d.activeElement.id || d.activeElement.tagName)));

  /* 5b) Dialog, odprt iz menija: fokus se vrne na gumb menija, ne na skrito postavko.
     Pre-fiks: lastDlgFocus je bila menijska postavka, ki ob zaprtju menija izgine,
     zato je fokus ob zaprtju dialoga padel na <body> (WCAG 2.4.3). */
  const helpMenu = Array.from(d.querySelectorAll("[data-menu]")).find((m) => {
    const b = m.querySelector(":scope > button");
    return b && b.textContent.trim() === "Pomoč";
  });
  const helpTrigger = helpMenu && helpMenu.querySelector(":scope > button");
  const aiItem = helpMenu && helpMenu.querySelector('[data-call="openAiSettings"]');
  const ai = d.getElementById("aiOverlay");
  if (helpTrigger && aiItem && ai) {
    helpTrigger.click();
    aiItem.focus();
    const itemHadFocus = d.activeElement === aiItem;
    aiItem.click();
    await sleep(30);
    check("dialog iz menija: fokus se premakne v AI dialog",
      ai.classList.contains("on") && ai.contains(d.activeElement),
      "activeElement=" + (d.activeElement && (d.activeElement.id || d.activeElement.tagName)));
    d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await sleep(30);
    check("dialog iz menija: Escape vrne fokus na gumb Pomoč (ne na skrito postavko)",
      !ai.classList.contains("on") && d.activeElement === helpTrigger,
      "itemHadFocus=" + itemHadFocus + " activeElement=" + (d.activeElement && (d.activeElement.id || d.activeElement.tagName)));
  } else {
    check("najdem meni Pomoč in postavko za AI dialog", false);
  }

  /* 5c) ARIA modal: globalne bližnjice ne smejo posegati v ozadje.
     Pre-fiks: guard je preverjal samo #expOverlay, zato so Ctrl+G/S/E, Ctrl+Z/Y
     in ± delovali za odprtim AI/help/prj dialogom (WCAG 2.1.2, načelo modalnosti). */
  Array.from(d.querySelectorAll('[class*="overlay"].on')).forEach((o) => o.classList.remove("on"));
  await sleep(30);
  const prev = d.getElementById("prev");
  const lInput = d.getElementById("L");
  prev.innerHTML = "";
  lInput.value = "4321";
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "g", ctrlKey: true, bubbles: true, cancelable: true }));
  await sleep(60);
  const genBase = prev.innerHTML;
  check("bližnjica Ctrl+G brez dialoga generira risbo (kontrola)", genBase.length > 0, "len=" + genBase.length);

  ai.classList.add("on");
  await sleep(30);
  lInput.value = "1234";
  const modalGenAllowed = d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "g", ctrlKey: true, bubbles: true, cancelable: true }));
  await sleep(60);
  check("odprt dialog: Ctrl+G ne generira v ozadju", prev.innerHTML === genBase, "len=" + prev.innerHTML.length);
  check("odprt dialog: Ctrl+G prepreči tudi browserjevo iskanje", !modalGenAllowed);

  const exp = d.getElementById("expOverlay");
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "e", ctrlKey: true, bubbles: true, cancelable: true }));
  await sleep(40);
  check("odprt dialog: Ctrl+E ne odpre izvoza", !exp.classList.contains("on"));

  ai.classList.remove("on");
  await sleep(30);
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "g", ctrlKey: true, bubbles: true, cancelable: true }));
  await sleep(60);
  check("po zaprtju dialoga Ctrl+G spet generira", prev.innerHTML !== genBase && prev.innerHTML.length > 0);

  const modalGuards = (html.match(/modalShortcutGuard\(e\)/g) || []).length;
  check("vsi globalni shortcut handlerji imajo modalOpen guard", modalGuards >= 5, "n=" + modalGuards);

  /* ---------- 6) preskoči na vsebino (WCAG 2.4.1) ---------- */
  const skip = d.querySelector(".skiplink");
  check("obstaja povezava Preskoči na vsebino", !!skip && /Presko/i.test(skip.textContent));
  check("povezava cilja na #main, ki je fokusabilen programsko",
    !!skip && skip.getAttribute("href") === "#main" && d.getElementById("main").getAttribute("tabindex") === "-1");
  const firstFocusable = Array.from(d.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])'))
    .filter((el) => a11yVisible(el) && !el.disabled)[0];
  check("povezava je prva fokusabilna postaja v DOM-u", firstFocusable === skip,
    firstFocusable ? "prva=" + (firstFocusable.id || firstFocusable.tagName) : "nič");
  check("stranska plošča ima vodilno oznako (landmark)", d.getElementById("aside").getAttribute("aria-label") === "Nastavitve risbe");

  /* ---------- 7) brez JS napak ---------- */
  check("jsdom: aplikacija se naloži brez JS napak", jerr.length === 0, jerr.join(" | "));

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL${fail ? " — " + errors.join("; ") : ""}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("  [FAIL] izjema: " + (e && e.stack || e)); process.exit(1); });
