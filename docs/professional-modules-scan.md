# Professional open-source modules scan — Draftwright technical drawing PWA

Scan date: **2026-11-23**. Source: GitHub repository search + `LICENSE` / `package.json` files read through the GitHub API. Stars and `updated_at` are the values returned by that API on the scan date. GitLab was also searched; no distinct original professional CAD JS library surfaced — the results were mirrors of GitHub projects. GitHub is therefore the primary ecosystem.

**Constraint that drives every recommendation here:** the product is a zero-build, offline browser PWA with a hash-locked strict CSP. Any new browser library must be vendored as a same-origin static asset, added to `sw.js` precache, and must not require `unsafe-eval`/`unsafe-inline`.

## Shortlist — permissive licence, realistic fit

| Module | Repo | Stars / last update | Licence (verified) | Where it fits in our app | Integration cost / risk |
|---|---|---:|---|---|---|
| `dxf-parser` | [gdsestimating/dxf-parser](https://github.com/gdsestimating/dxf-parser) | 562 / 2026-11-22 | MIT | **Already used** in `tests/dxf-parser.test.js` to validate our exported DXF with an independent implementation. Could also power DXF import. | Low. Dev-only today; browser use would need vendoring. |
| `dxf-writer` / `js-dxf` | [tarikjabiri/js-dxf](https://github.com/tarikjabiri/js-dxf) | 201 / 2026-10-24 | MIT | Alternative DXF writer. npm `dxf-writer@1.18.4`: 61 KB unpacked, no runtime deps. | Low licence risk, **medium design cost**: still need all SVG→entity/domain logic; would require vendoring + changing 42 test boots. Decision so far: keep our writer. |
| `three-dxf` | [gdsestimating/three-dxf](https://github.com/gdsestimating/three-dxf) | 646 / 2026-11-03 | MIT | Browser DXF viewer. Lets a user visually verify an imported DXF before using it as a template. | Medium: pulls in three.js and a WebGL canvas; optional feature, not core generation. |
| `maxrects-packer` | [soimy/maxrects-packer](https://github.com/soimy/maxrects-packer) | 251 / 2026-11-18 | MIT | **Strong fit:** our "rezalni načrt" currently reports board usage/waste. MaxRects can actually optimise part placement on boards. | Low. Pure JS, UMD/npm, dev or vendored. Would need tests comparing old vs new yield. |
| `clipper-lib` | [junmer/clipper-lib](https://github.com/junmer/clipper-lib) | 215 / 2026-11-05 | Boost BSL-1.0 | Line/polygon boolean ops **and offsetting** — directly relevant to kerf compensation and cut-out geometry. | Low-medium. UMD, no runtime deps; older API style. |
| `polygon-clipping` | [mfogel/polygon-clipping](https://github.com/mfogel/polygon-clipping) | 644 / 2026-11-19 | MIT | Union/intersection/difference/xor of polygons; waste-area calculation. No offsetting, unlike Clipper. | Low. Modern JS, well maintained. |
| `opentype.js` | [opentypejs/opentype.js](https://github.com/opentypejs/opentype.js) | 5051 / 2026-11-23 | MIT | Convert title-block text to vector outlines — makes DXF/CNC text independent of CAD fonts. | Low-medium. Font files must be vendored; increases DXF size. |
| `pdf-lib` | [Hopding/pdf-lib](https://github.com/Hopding/pdf-lib) | 8693 / 2026-11-22 | MIT | Alternative/complement to jsPDF for vector PDF export and form/layer features. | Low licence risk; replacing jsPDF is a larger regression surface than the value today. |
| `three.js` | [mrdoob/three.js](https://github.com/mrdoob/three.js) | 119203 / 2026-11-23 | MIT | Shared 3D viewport for imported STEP/3D parts; our current iso renderer is custom SVG. | Medium-high: WebGL canvas, offline bundle size, CSP `worker-src` review. |

## Strategic / heavyweight — powerful but not drop-in

| Module | Repo | Stars / last update | Licence (verified) | What it would unlock | Why it is not a quick win |
|---|---|---:|---|---|---|
| `opencascade.js` | [donalffons/opencascade.js](https://github.com/donalffons/opencascade.js) | 945 / 2026-11-19 | **LGPL-2.1-only** (`package.json` verified) | Real BREP geometry, STEP/IGES import/export, robust booleans inside the browser. | LGPL distribution obligations, multi-MB WASM, strict-CSP/WASM compatibility must be tested, major architecture change. License review required before adoption. |
| `manifold` | [elalish/manifold](https://github.com/elalish/manifold) | 2435 / 2026-11-23 | Apache-2.0 | Topologically robust CSG for 3D parts (better than hand-built STEP bodies). | C++/WASM; same bundle/CSP concerns as OCCT, but with a cleaner permissive licence. |
| `OpenJSCAD` | [jscad/OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org) | 3282 / 2026-11-22 | MIT | Parametric 2D/3D modelling, CSG, exporters (SVG/STL/AMF/3MF, DXF-related I/O). | Modular monorepo; browser use expects a bundler or vendored UMD. Would change how geometry is authored. |
| `opencv` (JS/WASM build) | [opencv/opencv](https://github.com/opencv/opencv) | 91690 / 2026-11-23 | Apache-2.0 | Professional image processing: line/edge detection for lamella recognition, perspective calibration. | Very large WASM, CPU cost on device, strict-CSP/WASM review. Our current canvas heuristic is cheap and tested. |

## Checked but not recommended

- **GstarCAD 2027** installation on this machine: proprietary Windows DLL/EXE + LISP; `eptdwg.lsp` explicitly forbids unauthorised use. Not usable in a browser PWA.
- **SolveSpace / FreeCAD**: excellent CAD algorithms but GPL/LGPL desktop applications; copying their code would impose copyleft obligations. Useful only as algorithmic reference.
- **GitLab**: searches returned mirrors/blogs rather than an original professional CAD JS project. No evidence of a better GitLab-native alternative.

## Recommended order

1. **`maxrects-packer`** for the cutting layout — highest concrete product value, lowest risk. Start as a dev-only A/B comparison against current `rezalni načrt` output, then decide whether to ship it.
2. **`clipper-lib`** for kerf offset and polygon booleans — replace ad-hoc geometry only where tests can prove identical or better results.
3. **`dxf-parser` in the browser** (once vendored) if DXF import becomes a feature; `three-dxf` only if a visual import preview is wanted.
4. **`opentype.js`** when CNC-ready text outlines are requested by users.
5. **OCCT/Manifold/JSCAD** only as a deliberate 3D-architecture project with a licence review, CSP/WASM proof-of-concept and golden tests — not as a module swap.

## A/B evidence for `maxrects-packer` (2026-11-23)

Added a **dev-only** benchmark: `npm run bench:cut` → `tests/cut-optimizer-ab.test.js` (**17 checks, 0 fail**). It boots the real app in jsdom, drives `buildCut()` through the DOM, and compares purchased stock length against MaxRects with the same pieces, stock lengths and kerf. The library is **not** loaded by the app; it is only a devDependency.

The first benchmark revision was biased: MaxRects was restricted to one stock length per case while our `optimizeMulti` may mix `5800/4000/2200`. It was corrected so MaxRects packs with the widest stock and re-prices each bin with the smallest fitting stock, trying both placement strategies and three piece orderings. The figures below are from the **corrected, reproducible** run.

Results:

- Single-length case: MaxRects exactly matches our DP optimum (40 000 mm, 10 boards) — the 1D model is sound.
- Mixed `4000×10 + 1200×10` with stock `5800/4000/2200`: current FFD buys **62 000 mm / 20 boards**; MaxRects buys **58 000 mm / 10 boards** (−6.5 %).
- Seeded 30-case sample: MaxRects better in **9**, equal in **19**, worse in **2**; net **112.2 m** less purchased stock; largest single win **22 %** (`2859×36 + W2 1626`).
- Largest regression: `2357×32 + W2 1589` — 128.0 m → 154.8 m (**+21 %**). The remaining two losses are therefore real, not a comparison artefact.

Decision: **do not vendor MaxRects as a replacement.** Keep it as a measurable benchmark; if cutting yield becomes a commercial requirement, implement a hybrid that evaluates both plans and picks the lower purchased stock length, with golden tests for every scenario above.

No application code was changed by this scan or the benchmark.
