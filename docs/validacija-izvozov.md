# Matrika sposobnosti in validacija izvozov (Issue #2, pogl. 6)

Stanje: Faza 2. Neodvisna validacija: **ezdxf 1.4.5** (DXF), **steputils 0.1** + lasten ISO-10303-21 topološki preverjevalnik (STEP), **jsdom + neodvisen XML/DOM parse** (SVG), **jsPDF** (PDF); strukturni in mejni testi (`tests/issue2-phase2.test.js`, `tests/exports-cad-boundary.test.js`). Reprodukcija: `npm test` + spodnji postopki.

## DXF R12 (AC1009, ANSI_1250)

| Zmožnost | Status | Opomba |
|---|---|---|
| LINE | ✅ | vse črte, brez ničelnih; sloj GEOMETRIJA/OSI |
| POLYGON/POLYLINE | ✅ | poligoni zaprti (Faza 2 — prej tiho izpuščeni) |
| CIRCLE | ✅ | sloj GEOMETRIJA |
| PATH (M/L/Q/Z) | ✅ | Q-krivulje vzorčene (4/8/16 segmentov po izbiri) |
| TEXT | ✅ | sloj TEKST; `text-anchor` → koda 72 + točka 11/21; rotacija s obrnjenim predznakom |
| Kodiranje | ✅ | `$DWGCODEPAGE ANSI_1250` + cp1250 bajti (č=0xE8, š=0x9A, ž=0x9E); ≤/≥ → `<=`/`>=`; Ø=0xD8; neznani znaki → `?` |
| Sloji | ✅ | GEOMETRIJA (7), OSI (1, DASHDOT), TEKST (3) |
| $EXTMIN/$EXTMAX | ✅ | 0,0–420,297 (koordinatni prostor lista je vedno 420×297 enot) |
| Y-os | ✅ | y′ = 297 − y (SVG top-levo → DXF bottom-levo) |
| geom-only način | ✅ | brez TEXT entitet (CNC) |

**Neodvisno orodje:** `ezdxf.readfile` + `doc.audit()` → 0 napak/0 popravkov; števec entitet se ujema z neodvisno re-implementacijo pretvorbe (zamik 0).

**Omejitve:** dasharray različne vzorce vse preslikajo v DASHDOT; tekst podlaga je baseline (1 vrstica offset); enote = enote viewBox (pri tisku A4/A2 se le proporcionalno pomanjšajo); R12 ne podiva pripetih krivulj (spline) — PATH Q/L pokrito, ostale ukaze pretvornik tiho preskoči.

## STEP AP214 (AUTOMOTIVE_DESIGN)

| Zmožnost | Status | Opomba |
|---|---|---|
| Skladnja ISO-10303-21 | ✅ | glava/dooglek/ENDSEC, edinstveni #ID, 0 nedoločenih referenc |
| Topologija | ✅ (Faza 2) | 8 VERTEX_POINT + 12 EDGE_CURVE na solid; vsak rob točno 2 ORIENTED_EDGE (manifold); prej 48 podvojenih oglišč |
| Units | ✅ | SI_UNIT(.MILLI.,.METRE.) |
| Geometrija | ⚠️ | poenostavljeni box-solidi po modelu (top/bottom profil, lamele, nosilci); `FILE_DESCRIPTION` izrecno: *simplified box solids, not production CAD* |
| Stopnice | ✅ (Faza 2) | stopničasta polnila po stN/stRise + nosilci po stPosts (prej bajtno identičen model pokončni ograji) |
| Sestava | ⚠️ | en PRODUCT, 26 ločenih MANIFOLD_SOLID_BREP brez assembly strukture |
| Timestamp | ✅ (Faza 2) | `FILE_NAME` = čas izvoza (prej trdo 2026-01-01) |

**Neodvisno orodje:** steputils parse + lasten preverjevalnik (reference, topologija, normale, inventar po solidih — odstopanje 0/26). **Vizualna validacija s CAD jedrom (Faza 3)**: orodje ni na voljo v okolju — izrecno nepreverjeno.

## PDF / tisk

| Zmožnost | Status |
|---|---|
| `@page` po formatu A3/A4/A2 | ✅ (brskalni tisk) |
| vodni žig | ✅ (PDF/SVG) |
| Vsebina se vedno regenerira iz trenutnih polj | ✅ (Faza 1) |

Pravi tisk ni jsdom-testabilen — ročni postopek: Orodja → Izvozi PDF → brskalni predogled tiska prikaže list v izbranem formatu.

## SVG

Vektorski list 420×297; opcijsko vodni žig (prosojni diagonalni tekst) + metapodatki `<title>/<desc>`; `width/height` po formatu lista. Round-trip: SVG ↔ ni cilj (izvozna format).

| Zmožnost | Status | Opomba |
|---|---|---|
| Well-formed XML | ✅ | neodvisen parse (`DOMParser`/jsdom brez `parsererror`) — `tests/exports-cad-boundary.test.js` |
| Pravilni SVG namespace + viewBox | ✅ | `http://www.w3.org/2000/svg`, A3 = `0 0 420 297` |
| Koordinatni sistem / enote | ✅ | vse x/y/cx/cy finite; geometrija ostane v mejah lista (± tolerantno za kote); ni ničelnih/negativnih |
| Skladnost izvoženih mer s prikazanimi | ✅ | vnešena L=3800 → koten v SVG **in** rezalna dolžina lamele `3800 mm` v CSV kosovnici (`cutLen()=L` za prečno) |

## CAD jedro — izrazna meja (§3.C)

Izvozi so **dokumentacijsko/referenčni**, ne proizvodni:
- **STEP** izrecno prizna v `FILE_DESCRIPTION`: *"Simplified box-solid approximation (not production CAD)"* — preverja samo ISO-10303-21 sintakso, AP214 shemo, skupno topologijo in pomanjkanje nedoločenih referenc. **Geometrijske natančnosti, trdnosti ali proizvodne primernosti ni mogoče potrditi brez pravega CAD jedra / zunanjega CAD programa** (steputils/ezdxf so dev-only).
- **DXF/PDF** sta neodvisno potrjena (ezdxf `audit` 0 napak; jsPDF + `dxf-parser`).
- Aplikacija **nikjer ne tvrdi**, da je izvoz CNC/proizvodno primeren.

## CSV/TXT/JSON

| Dokument | Struktura | Svežina |
|---|---|---|
| Kosovnica CSV | `Št.;Naziv;Material;Dimenzije;Količina` + masa lamel | vedno iz trenutnih polj |
| Rezalni načrt CSV | kerf optimizator (DP, optimalen), izkoristek/odpadek | rebuild ob vsakem vnosu (invalidateProduction) |
| Montažni načrt CSV | količine po uporabi (terasa: letve/distančniki/turbo vijaki/dilatacija/teža) | enako |
| Predračun CSV | postavke + SKUPAJ + opomba »ni ponudba« | enako |
| Naročilnik TXT | agregirana nabava, prodajni pogoji v5.0, kontakt Roksal | enako |
| Checklist TXT | sklopi A–E po uporabi + kontakt | enako |
| Tehnični list TXT | 9 parametrov (garancijski PDF) | statičen vir |
| Povpraševanje TXT | struktura Roksal obrazcev | enako |
| Projekt JSON | 75+ polj + refMode + kalibracija + slika | round-trip ✓ (test) |

## Postopek neodvisne validacije DXF (reproducibilen)

```bash
pip install ezdxf
python - <<'PY'
import ezdxf
doc = ezdxf.readfile("BO-002.dxf")
a = doc.audit()
print("napake:", len(a.errors), "popravki:", len(a.fixes))
assert len(a.errors) == 0
PY
```

Pričakovano: 0 napak; LINE/TEXT/CIRCLE števec = pričakovanjem iz SVG; sloji GEOMETRIJA/OSI/TEKST; DASHDOT na OSI; brez NaN.
