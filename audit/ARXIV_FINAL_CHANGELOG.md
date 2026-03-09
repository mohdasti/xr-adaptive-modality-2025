# arXiv Final Changelog

**Date:** 2025-03-07  
**Scope:** arXiv release gate — numeric lock, language sweep, packaging

---

## Edits Applied (Manuscript.qmd)

| Location | Change | Type | Source |
|----------|--------|------|--------|
| Abstract | 5.15→5.17, 4.70→4.73 bits/s; 1.75%→1.8%, 18.65%→19.1% | Numeric | results_at_a_glance.csv |
| Table 1 | Throughput, Error, MT — full update to match CSV | Numeric | results_at_a_glance.csv |
| Results paragraph | 5.15→5.17, 4.70→4.73; 1.75→1.8, 18.65→19.1 | Numeric | results_at_a_glance.csv |
| TLX paragraph | Overall 40.4→38.9, 47.0→46.4; Physical, Frustration subscales | Numeric | tlx_subscales_by_modality.csv |
| TLX table | All subscales and overall updated | Numeric | tlx_subscales_by_modality.csv |
| Discussion | Throughput, error, TLX values updated | Numeric | results_at_a_glance, tlx |
| Appendix Fitts | Gaze-Adaptive 0.193→0.19, R² 0.28→0.25; range 0.28–0.35→0.25–0.35 | Numeric | fitts_slopes_by_condition.csv |

---

## Audit Files Created

- audit/arxiv_numeric_lock.md
- audit/arxiv_language_lock.md
- audit/arxiv_packaging_checklist.md
- audit/arxiv_render_QA.md

---

## No Edits Required

- Language sweep: No stale/placeholder language found
- Packaging: PDF-only upload recommended
- Render: Clean
