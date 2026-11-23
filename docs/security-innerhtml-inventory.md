# innerHTML sink inventory and CSP compatibility

Scope: `tehnicka-risba-pro.html` at branch `integrate-remote-modular`, working tree after the 2026-11-23 trust-boundary corrections. 36 `innerHTML` sites and 4 `document.write` sites were found. "Class" follows the task taxonomy: 1 static, 2 trusted constants, 3 user/imported, 4 safe because of a proven validation boundary, 5 unknown.

## Inventory

| Line | Sink | Data source | Class | Justification |
|---|---|---|---|---|
| 1035 | `ov.innerHTML=""` | literal | 1 | Clears overlay; no data. |
| 1055 | `ov.innerHTML=s` | `S.det`, `S.cal`, `S.tmp` | 4 | `drawOverlay()` now passes every interpolated value through `skNum()`; imported calibration is normalised by `normalizeCal()` at restore. Exploit reproduction now fails. |
| 1485 | `checks.innerHTML` | validation messages | 4 | Every message is escaped with `E()`; only a `<br>` separator is markup. |
| 1515 | `tray.innerHTML=""` | literal | 1 | Clears error tray. |
| 1521 | `tray.innerHTML` | validation messages + `fieldForMsg()` | 4 | Message via `E()`; `data-field` comes from a fixed field-id mapping. |
| 1552 | `propPanel.innerHTML` | dimension label/value | 4 | Label via `E()`, value via `f()`, field id from fixed mapping. |
| 1632 | read-only `el.innerHTML` | DOM state | 1 | Only tests whether content exists. |
| 1781 / 1845 / 2097 | `prev.innerHTML=s` | drawing generators | 4 | Sheet generators build SVG from numeric fields and `E()`-escaped text; unchanged golden snapshots confirm output integrity. |
| 1854 | `prev.innerHTML` | literal | 1 | Static "missing dimensions" message. |
| 2526 | `selC.innerHTML` | `PAL_*` palettes | 2 | Palette names are application constants embedded in the registry. |
| 2901 / 2924 | `cutOut` / `quoteOut` | numeric calculations | 2 | Values from `f()`, `toFixed()`, row counts; no user text. |
| 3209 | `planOut.innerHTML` | production rows | 4 | Every row cell passes through `E()` (verified in source). |
| 3294 / 3309 | export dialog items | `EXP_ITEMS`, `EXP_ADV` | 2 | Static option descriptors. |
| 3593 | `tlorisSvg.innerHTML` | `TLR.walls`, `TLR.anchor` | 4 | Imported walls normalised by `normalizePlanWalls()`, anchor by `skPoint()`; renderer also clamps with `skNum()`. |
| 3743 | `skSvg.innerHTML` | `SK.elems` | 4 | Imported elements normalised by `normalizeSketchElems()`, rendered through `skNum()`/`skColor()`/`E()`. |
| 3876 / 4749 / 4751 / 2106 | `document.write` print/result windows | serialised SVG or result DOM | 4 | Prints `XMLSerializer` output or an existing, already-escaped DOM subtree; inline `<style>` is static except for numeric page dimensions. |
| 4022 / 4138 / 4347 | empty-state HTML | literal | 1 | Static messages. |
| 4023 | `pdmList.innerHTML` | localStorage snapshots | 4 | `id` coerced with `skNum()`, timestamp escaped with `E()`; corrected 2026-11-23. |
| 4139 | config list | localStorage configs | 4 | Name via `E()`, timestamp sliced/escaped, index numeric. |
| 4207 | what's-new list | `WHATS_NEW` constant | 2 | Static release notes. |
| 4280 / 4293 | tutorial/quiz panels | `TUT`, `QUIZ` constants | 2 | Static content; question/option text escaped with `E()`. |
| 4307 | quiz result | pass flag + percentage | 2 | Boolean and `Math.round()` only. |
| 4348 | project list | localStorage projects | 4 | Name/date via `E()`; thumbnail now restricted to `data:image/(png|jpeg|gif|webp);base64,...` (corrected 2026-11-23). |
| 4540 | sheet template gallery | `TEMPLATES` constant | 2 | Static keys. |
| 4645 | `svg.innerHTML` | `renderIso3D()` | 4 | Built from validated numeric geometry (`collectSolids()`), no text/link attributes. |
| 4708 / 4710 / 4711 | i18n swap | translation constants / `textContent` | 2 | Static dictionary values and DOM text content, restored verbatim. |
| 4740 | result window | existing DOM subtree | 4 | Copies already-rendered markup, does not introduce new untrusted data. |

**Summary:** 0 class-3 (untrusted and unsafe) sinks remain; 0 class-5 (unknown) sinks remain. Before the corrections, lines 1055, 3593, 3743, 4023 and 4348 were class 3. Three of those were demonstrated exploitable (1055, 3743 in exported SVG, and the 3743 sibling export path); the others were latent.

This classification is not a claim that every sink was a vulnerability: most were always safe because they emitted constants or escaped text.

## CSP compatibility evaluation — IMPLEMENTED

A restrictive CSP is now deployed in both places: a `<meta http-equiv>` in `tehnicka-risba-pro.html` and an HTTP header in `vercel.json` (which adds `frame-ancestors 'none'`). The policy contains **no `unsafe-inline` and no `unsafe-eval`**.

Compatibility work performed (zero build step retained):

- The theme bootstrap and the application remain inline, but are individually authorised by exact SHA-256 hashes. Every edit to inline code must be followed by `node scripts/generate-csp.js`; `tests/csp.test.js` fails if the policy and source drift.
- All 132 inline `style="..."` attributes were replaced by 74 CSP-safe `[data-s="sN"]` utility rules with `!important` to preserve inline-style precedence. The same rules live in `print.css` (also added to the service-worker precache, cache version bumped to v3).
- All three `document.write()` print paths now emit `<link rel="stylesheet" href="print.css">` instead of inline `<style>`. Paper size is recorded as `data-print-size` and applied through CSSOM (`insertRule` / `element.style`), which CSP does not block.
- `index.html` lost its redundant inline redirect script and style; the existing meta refresh remains.
- Same-origin vendor scripts, worker, manifest, icons and `data:`/`blob:` images are explicitly allowed.
- `.gitattributes` pins LF checkouts, because a CRLF checkout would change the exact bytes covered by the hashes and break the app.

Effective policy (header form):

```
default-src 'self';
script-src 'self' 'sha256-…theme…' 'sha256-…app…';
style-src 'self' 'sha256-…app stylesheet…';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
media-src 'self' blob:;
manifest-src 'self';
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none'
```

Verification: `node tests/csp.test.js` → 22 checks, 0 fail. It recomputes every hash from the actual inline content, compares meta and header policies, asserts there are no inline event handlers or style attributes, checks that every `data-s` value has a `print.css` rule, and drives all three print paths to confirm no generated document contains inline `<style>`. A real-browser enforcement check was attempted with headless Chrome but the Chrome binary in this environment produced no DOM/screenshot output, so browser-level CSP enforcement is **not independently verified here**; the jsdom policy/hash checks are the available evidence.

CSP is defence in depth only; the injection fixes above stand on their own. The hash-based approach is intentionally strict: any unapproved inline script is blocked, but it also means inline code changes require regenerating the hashes.
