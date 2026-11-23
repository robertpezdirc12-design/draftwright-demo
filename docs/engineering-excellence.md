# Engineering Excellence & Team Uplift Plan

**Audience:** Draftwright development team
**Basis:** independent audit of the working tree on 2026-11-22/23, branch `integrate-remote-modular`, HEAD `e22a08c3979a7a86d70b54537f8e023c5616c7dc`
**Goal:** move from "feature-complete demo" to "maintainable product" and grow engineering judgement through the work.

### Evidence status legend

- **[VERIFIED]** — reproduced in this working tree; command or test named where possible.
- **[REPORTED]** — came from prior notes/reports and was **not** independently reproduced here.
- **[FIXED]** — verified defect with a correction and a regression test in the tree.
- **[RECOMMENDED]** — action or design proposal, not yet implemented.
- **[OUTSTANDING]** — known gap that remains open.

---

## 1. Executive summary

The product is strong: zero-install offline PWA, deep domain rules, five drawing views, seven export formats, 126-combination self-check and a green test chain. The remaining engineering surface area is a ~4,900-line HTML file, 36 classified `innerHTML` sinks, architecture documentation drift, and a serial test chain. A strict, hash-based CSP is now enforced in both the HTML and the Vercel header.

Priorities:

1. **[FIXED]** Close the injection boundary — sketch fields *and* calibration state from shared links/imported JSON, plus the downloadable SVG export.
2. **[FIXED]** Make golden tests incapable of blessing their own output.
3. **[FIXED]** Add a restrictive CSP without `unsafe-inline`/`unsafe-eval`; keep the review checklist and DoD.
4. **[RECOMMENDED]** Grow capability through module ownership, review rotation and decision records.

---

## 2. What the team already does well — protect these

| Strength | Evidence |
|---|---|
| Offline-first, zero-install delivery | static PWA + service worker, vendored fonts, no build step |
| Single source of truth for domain rules | `WC`/`DIL` registry, `roksalLimit`, `checks()`; Issue #37 removed conflicting quantity calculations |
| Regression discipline | golden SVG snapshots; 126/126 self-check inside suites |
| Deterministic fixtures | `tests/fixtures/slats.js`; no binary fixtures in git |
| Accessibility | 83 `label[for]`, `aria-live`, `prefers-reduced-motion` |
| Honest limitations | README discloses STEP/DXF limits and indicative measurements |

Any refactor must preserve these properties; adding a build step or backend would trade away the product's main advantage.

---

## 3. Baseline assessment

| # | Area | Finding and status | Severity |
|---|---|---|---|
| F1 | Security | **[VERIFIED + FIXED]** Attribute-injection XSS via untrusted sketch fields (`x1="10\" onmouseover=…"`) **and** via calibration state `S.cal.a.x` from the same shared project JSON. Both reproduced with arbitrary JS execution; both now blocked. Downloadable sketch SVG also emitted raw fields; now sanitised. | P0 |
| F2 | Security | **[VERIFIED + FIXED]** 36 `innerHTML` + 4 `document.write` sites classified in `docs/security-innerhtml-inventory.md`; none unclassified. Strict hash-based CSP now present in HTML meta and `vercel.json` header; no `unsafe-inline`/`unsafe-eval`; print documents use `print.css` + CSSOM sizing. 22-check `csp.test.js` verifies policy/source agreement. | P1 |
| F3 | Architecture | **[REPORTED]** `research/roadmap.md` describes 17 `js/` modules; the current tree is a single HTML file. Not independently reproduced here beyond observing the current file layout. | P1 |
| F4 | Test integrity | **[VERIFIED + FIXED]** `tests/golden.test.js` wrote a missing CSV fixture and reported PASS; directory creation also happened on a normal run. CI now fails if `npm test` changes the working tree, and re-runs `scripts/generate-csp.js` to fail on CSP hash drift. | P1 |
| F5 | Feedback speed | **[VERIFIED]** final full run 10m43s (643 s) for 44 suites / 746 checks, serial jsDOM boots. Earlier trees: 43 suites / 730 checks in 11m09s; 42 suites / 708 checks in 10m48s; 41 suites / 637 checks in 9m37s. The 21m26s figure was never reproduced. | P2 |
| F6 | Code quality | **[REPORTED]** No linter/formatter; longest line 890 chars; dense one-liners (`solve`, `homography`). | P2 |
| F7 | Git hygiene | **[REPORTED]** ~26 merged remote branches; token previously pasted in chat. **[VERIFIED]** work sits on `integrate-remote-modular`, not `main`. | P1 |
| F8 | Docs drift | **[VERIFIED]** README claimed 34 suites; the chain now invokes 44. Corrected in this pass. | P2 |
| F9 | Export confidence | **[VERIFIED + GAP CLOSED]** DXF output was previously checked only by our own string assertions. `tests/dxf-parser.test.js` now parses the real exported blob with the MIT-licensed `dxf-parser` 1.1.2 (dev-only): AC1009 header, 3 layers, 1058 entities, finite in-sheet coordinates. GstarCAD modules were NOT copied: they are Windows DLL/LISP binaries with a restrictive licence and cannot run in a browser PWA. | P2 |
| F10 | Cutting yield | **[SHIPPED — HYBRID]** Benchmark (`npm run bench:cut`, MIT `maxrects-packer` 2.1.1 dev-only) showed FFD losing on mixed-length cases (62 000 → 56 000 mm in one scenario; 9/30 seeded better, 5 worse). The hybrid is now shipped: `optimizeMulti` keeps FFD as baseline, adds a best-fit span packer over 3 piece orderings with stock re-pricing (smallest stock covering the bin span), and picks the cheaper plan — never worse than FFD. Mixed case 62 000 → **55 600 mm** (optimal), 30-case property test: 18 improvements, 0 regressions (`tests/cut-hybrid.test.js`). No external library in the browser. | P2 |

Not defects: golden SVG fixtures already failed on missing files; CI runs `npm ci` on Node 24; known product limits are disclosed.

---

## 4. Corrections completed in this pass

- `tehnicka-risba-pro.html`: added `skNum()`, `skColor()` **[FIXED]**; added `normalizeCal()`, `normalizeSketchElems()`, `normalizePlanWalls()`, `skCalibrated()` so imported state is cleaned **at the trust boundary**. `drawOverlay()`, `skRender()`, `tlrRender()`, `preview()`, the sketch SVG export, PDM list and project thumbnail rendering now use validated values.
- `tests/security-sketch.test.js`: extended from 11 to **69 checks** exercising real DOM rendering (quote variants, `>` markup, event handlers, `foreignObject`, `href`, colours, numeric edge cases, legitimate geometry).
- `tests/security-boundaries.test.js` (new): **13 checks** for calibration XSS (linear + plane), SVG export sanitisation, and bounded floorplan geometry.
- `tests/golden.test.js`: missing fixture now FAILS; no fixture generation in normal mode; `UPDATE_GOLDENS=1` is the only rewrite path; blob guard added.
- CSP hardening: `tehnicka-risba-pro.html` (meta policy + 132 style attributes converted to 74 utility rules), new `print.css`, new `vercel.json` (header with `frame-ancestors 'none'`), new `scripts/generate-csp.js`, new `tests/csp.test.js` (22 checks), `index.html`, `sw.js`, `tests/export-dialog.test.js`, `tests/skica.test.js`.
- `README.md`: suite counts 34 → 44 (including CSP and DXF-parser suites); added a short security section.
- `tests/dxf-parser.test.js` (new, 16 checks) + `dxf-parser` 1.1.2 as devDependency (MIT, verified locally): independent third-party validation of the emitted DXF. The app writer stays in place — a JS writer library would still require all SVG→entity domain logic and would force vendoring/external script loading into the hash-locked zero-build PWA.
- `docs/security-innerhtml-inventory.md` (new): 36 sinks classified, CSP compatibility evaluated.

Final verification: `npm test` → **44 suites, 746 checks, 0 fail, exit 0, 643 s (10m43s)**, including the 22-check CSP suite and the 16-check independent DXF-parser suite. Golden test run twice independently: 6 OK / 0 FAIL both times, no tracked file modified. `git diff --check` clean. Real-browser CSP enforcement could not be confirmed: headless Chrome in this environment produced no DOM output.

---

## 5. Prioritised action plan

### P0 — this week

| Action | Acceptance criterion |
|---|---|
| **[FIXED]** Review and ship the injection fixes | Two-person review; both security suites green; crafted share link and exported SVG verified |
| **[FIXED]** Restrictive CSP | Meta + Vercel header, exact hash allowlist, no `unsafe-inline`/`unsafe-eval`; print/export flows verified by `tests/csp.test.js` |
| **[FIXED]** Sink inventory | 0 class-3 and 0 class-5 sinks in `docs/security-innerhtml-inventory.md` |
| **[RECOMMENDED]** Credential hygiene | Rotate any token pasted in chat; delete stale branches; confirm no credentials in `.git/config` |

### P1 — 2–4 weeks

| Action | Acceptance criterion |
|---|---|
| **[FIXED]** Golden test integrity | Missing fixture fails; no tracked file changed by a normal run |
| **[RECOMMENDED]** Module boundaries | Split the IIFE into ordered `defer` scripts, one thin slice first; golden snapshots unchanged; zero build step preserved |
| **[RECOMMENDED]** DoD + review checklist adopted | Every PR links the checklist; CI blocks merge on red tests |
| **[RECOMMENDED]** CI hardening | Branch protection with green CI; static security check |

### P2 — 1–3 months

- **[RECOMMENDED]** Parallelise the test chain to bring feedback under 3 minutes.
- **[RECOMMENDED]** ESLint with correctness rules only (`no-implied-eval`, `eqeqeq`), no style overhaul.
- **[RECOMMENDED]** Property-based tests for the kerf optimiser and dimension arithmetic.
- **[RECOMMENDED]** README as the single source of truth; `research/*` explicitly dated snapshots.

---

## 6. Code review standard (the senior lens)

**Reviewer checklist — every PR, no exceptions:**

1. **Trust boundary:** where does data come from — URL, file, localStorage, canvas, user input — and is it validated *at the boundary*, not only at one renderer?
2. **Output encoding:** HTML/SVG attribute context differs from text context. Never use a blacklist of "bad characters".
3. **Domain invariants:** do BOM, cut plan, order and quote quantities still agree?
4. **Failure mode:** `NaN`, empty string, `null`, huge numbers, comma decimals — visible warning or silent wrong number?
5. **Regression test:** does the test fail on the old code?
6. **Golden snapshots:** intentional output change reviewed and updated with `UPDATE_GOLDENS=1` only?
7. **Scope:** one concern per PR, ~400 changed lines max.
8. **Naming:** no new single-letter helpers; `E`, `V`, `n` are legacy.
9. **Accessibility:** labels, keyboard paths, visible focus for new controls.
10. **Docs:** README/CHANGELOG updated in the same PR if behaviour or counts changed.
11. **No new magic numbers:** one named constant per threshold.
12. **Product constraints:** offline still works, no build step, no new runtime dependency without justification.

**Mechanics:** 24-hour turnaround; two approvals for security or calculation-core changes; weekly reviewer rotation; author writes a short "why". Review the design, not just the diff.

---

## 7. Definition of Done

- [ ] `npm test` green; golden snapshots untouched unless intentionally updated
- [ ] Browser smoke test of the affected flow (photo → parameters → drawing → export)
- [ ] No new untrusted-input path without boundary validation
- [ ] No `NaN`/`Infinity` in generated CSV/SVG/STEP for edge inputs
- [ ] Regression test that fails on the old code
- [ ] CHANGELOG entry if user-visible; README entry if counts changed
- [ ] Diff reviewed against the checklist above
- [ ] No secrets, tokens or personal paths committed

---

## 8. Capability uplift: 30 / 60 / 90 days

**Days 1–30 — Secure the foundation**
- Ship the injection fixes and CSP; run `node scripts/generate-csp.js` after any inline-code edit; keep the sink inventory current.
- Pair-review every PR for two weeks; measure review turnaround.
- Establish checklist and DoD.

**Days 31–60 — Own the architecture**
- Extract one module slice (e.g. `js/03-validation.js`), prove golden snapshots unchanged, then continue.
- Each engineer owns one module: approves changes and maintains its tests.
- Architecture Decision Records for CSP, module split and any build-step debate.

**Days 61–90 — Raise the bar**
- Parallel CI; property-based geometry tests.
- Monthly "audit club" turning findings into tickets or lessons.
- Skill ladder: mid engineers own a module end-to-end; senior candidates lead a security review and a no-regression refactor.

---

## 9. Metrics

| Metric | Baseline (verified) | 90-day target |
|---|---|---|
| Untrusted→sink injection paths | 2 confirmed XSS + 1 unsafe exported SVG **[VERIFIED]** | 0 |
| innerHTML sinks unclassified | 0 (36 classified) **[VERIFIED]** | 0 |
| CSP present | Yes, 2 script hashes + 1 style hash, no `unsafe-inline`/`unsafe-eval`, meta + header **[VERIFIED]** | Keep zero violations and hashes regenerated on every inline edit |
| Test suites in chain | 44 **[VERIFIED]** | stable and documented |
| Test suite runtime | 10m43s / 44 suites / 746 checks **[VERIFIED]** | < 3 min |
| Tests writing fixtures on a normal run | 0 after fix (was 1) **[VERIFIED]** | 0 |
| Largest source file | ~4,900 lines **[REPORTED]** | < 1,500 lines |
| Docs/code suite-count mismatch | 0 after fix (was 1) **[VERIFIED]** | 0 |
| Review turnaround | unmeasured | < 24 h median |

---

## 10. Closing note

The team's instincts — test every fix, document limits, keep the tool install-free — are right. What is missing is the enforcement layer that makes those habits survive growth. The corrected trust boundary and golden test are the reference examples; let the modularisation follow the tests rather than lead them. Elevating the technical level is not a training course here — it is the discipline applied to the next twenty pull requests.
