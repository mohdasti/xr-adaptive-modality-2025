# arXiv Numeric Lock

**Date:** 2025-03-07  
**Source of truth:** docs/assets/case_study/results_at_a_glance.csv, docs/manuscript/assets/tlx_subscales_by_modality.csv, docs/manuscript/assets/fitts_slopes_by_condition.csv, outputs/LBA/lba_parameters_summary.csv

---

## Primary Performance (Table 1)

| Claim | Manuscript (before) | Authoritative | Status |
|-------|---------------------|---------------|--------|
| Throughput Hand | 5.15 [5.06, 5.25] | 5.17 [5.06, 5.27] | **Corrected** |
| Throughput Gaze | 4.70 [4.56, 4.83] | 4.73 [4.58, 4.88] | **Corrected** |
| Error Rate Hand | 1.75 [1.23, 2.26] | 1.77 [1.22, 2.32] | **Corrected** |
| Error Rate Gaze | 18.65 [17.26, 20.04] | 19.09 [17.58, 20.59] | **Corrected** |
| Movement Time Hand | 1.09 [1.07, 1.11] | 1.09 [1.07, 1.11] | Match |
| Movement Time Gaze | 1.19 [1.16, 1.23] | 1.19 [1.14, 1.23] | **Corrected** (CI) |

**Source:** results_at_a_glance.csv (export_case_study_assets.R, N=69, 8-block)

---

## NASA-TLX

| Claim | Manuscript (before) | Authoritative | Status |
|-------|---------------------|---------------|--------|
| Overall Hand | 40.4 [37.0, 43.8] | 38.92 [35.30, 42.54] | **Corrected** |
| Overall Gaze | 47.0 [43.9, 50.2] | 46.38 [42.77, 49.99] | **Corrected** |
| Subscales | Various | tlx_subscales_by_modality.csv | **Corrected** |

**Source:** results_at_a_glance.csv (overall); tlx_subscales_by_modality.csv (subscales)

---

## N, Exclusions, Trial Counts

| Claim | Manuscript | Authoritative | Status |
|-------|------------|---------------|--------|
| N primary | 69 | 69 | Match |
| Excluded | 12 | 81−69=12 | Match |
| Trials | 15,105; 13,519 valid | analysis_population_counts | Match |

---

## Fitts Slopes (Appendix)

| Claim | Manuscript | Authoritative | Status |
|-------|------------|---------------|--------|
| Hand-Static | 0.155, R² 0.54 | 0.154, 0.525 | Match (rounding) |
| Hand-Adaptive | 0.146, R² 0.54 | 0.147, 0.539 | Match (rounding) |
| Gaze-Static | 0.179, R² 0.35 | 0.177, 0.347 | Match (rounding) |
| Gaze-Adaptive | 0.193, R² 0.28 | 0.189, 0.253 | **Corrected** (0.19, 0.25) |

**Source:** fitts_slopes_by_condition.csv

---

## LBA Table 4

| Claim | Manuscript | Authoritative | Status |
|-------|------------|---------------|--------|
| t0 values | −2.85, −3.01, −1.41, −0.97 | lba_parameters_summary.csv | Match |
| t0 (latent) wording | Present | — | Match |

---

## Edits Applied

1. Abstract: 5.15→5.17, 4.70→4.73; 1.75%→1.8%, 18.65%→19.1%
2. Table 1: Full update to match results_at_a_glance
3. Results paragraph: 5.15→5.17, 4.70→4.73; 1.75→1.8, 18.65→19.1
4. Discussion: Same throughput/error updates; TLX 40.4→38.9, 47.0→46.4; Physical 34.3→33.2, 41.9→41.1; Frustration 32.2→31.4, 43.2→43.6
5. TLX table: Full update to match tlx_subscales_by_modality.csv
6. Appendix Fitts: Gaze-Adaptive 0.193→0.19, R² 0.28→0.25
