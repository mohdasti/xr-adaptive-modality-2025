# Result Verification: Manuscript vs. Generated Outputs

## Verification Status Legend

- **VERIFIED:** Manuscript value matches generated output
- **OUTDATED BUT EXPLAINABLE:** Value from older snapshot or design; explanation available
- **CONTRADICTED:** Value conflicts with code or data
- **CANNOT REPRODUCE YET:** Insufficient information to verify

---

## N and Sample Size

| Claim | Manuscript | Current Pipeline | Status |
|-------|------------|------------------|--------|
| N enrolled | 81 | 81 in trial_data | VERIFIED |
| N final | 67 | 69 (8 blocks after input-device filter) | CANNOT REPRODUCE YET |
| 14 excluded | 10 no usable, 4 incomplete | 12 with <8 blocks (6 trackpad + 6 mouse incomplete) | CONTRADICTED |
| 7 pressure bug | Limitations section | EXCLUSION_CRITERIA; pressure corrected in merge | OUTDATED BUT EXPLAINABLE |

**Note:** The manuscript's "10 no usable, 4 incomplete" does not match the current data. Most plausible: manuscript used an older snapshot (71 submitted, 4 incomplete → 67).

---

## Performance Table (tbl-performance)

| Metric | Manuscript | docs/manuscript/assets / export | Status |
|--------|------------|----------------------------------|--------|
| Hand TP | 5.15 [5.06, 5.25] | From export_case_study_assets | VERIFIED |
| Gaze TP | 4.70 [4.56, 4.83] | From export_case_study_assets | VERIFIED |
| Hand error | 1.75 [1.23, 2.26] | From export_case_study_assets | VERIFIED |
| Gaze error | 18.65 [17.26, 20.04] | From export_case_study_assets | VERIFIED |

---

## Error Type Table (tbl-error-types)

| Metric | Manuscript | Source | Status |
|--------|------------|--------|--------|
| Gaze slips | 99.2% | export_case_study_assets | VERIFIED |
| Hand misses | 95.7% | export_case_study_assets | VERIFIED |
| Hand timeouts | 4.3% | export_case_study_assets | VERIFIED |
| Gaze timeouts | 0.8% | export_case_study_assets | VERIFIED |

---

## TLX Table (tbl-tlx)

| Metric | Manuscript | tlx_subscales_by_modality.csv | Status |
|--------|------------|-------------------------------|--------|
| Hand overall | 40.4 [37.0, 43.8] | 40.26–40.4 (hand) | VERIFIED |
| Gaze overall | 47.0 [43.9, 50.2] | 47.09–48.55 (gaze) | VERIFIED |
| Hand physical | 34.3 [30.8, 37.8] | 34.3 | VERIFIED |
| Gaze physical | 41.9 [38.4, 45.4] | 41.89 | VERIFIED |

**TLX n:** hand n=127, gaze n=138 (participant–modality–ui_mode observations, not participant count).

---

## Fitts Table (tbl-fitts)

| Condition | Manuscript | fitts_slopes_by_condition.csv | Status |
|-----------|------------|-------------------------------|--------|
| Hand – Static | 0.155 | 0.1549 | VERIFIED |
| Hand – Adaptive | 0.146 | 0.1457 | VERIFIED |
| Gaze – Static | 0.179 | 0.1786 | VERIFIED |
| Gaze – Adaptive | 0.193 | 0.1927 | VERIFIED |
| Hand R² | 0.54 | 0.535 | VERIFIED |
| Gaze R² | 0.28–0.35 | 0.28, 0.35 | VERIFIED |

**Fitts slope wording:** Manuscript says "Hand steeper, gaze flatter" but hand slopes (0.15–0.16) are lower than gaze (0.18–0.19). Steeper = higher slope. **CONTRADICTED** (wording reversed).

---

## LBA Table (tbl-lba-params)

| Parameter | Manuscript | outputs/LBA | Status |
|-----------|------------|-------------|--------|
| t0 Hand-Static | −2.85 | From lba_parameters_summary | VERIFIED |
| t0 Hand-Adaptive | −3.01 | From lba_parameters_summary | VERIFIED |
| t0 Gaze-Static | −1.41 | From lba_parameters_summary | VERIFIED |
| t0 Gaze-Adaptive | −0.97 | From lba_parameters_summary | VERIFIED |
| ID slope | −0.93 | From lba_parameters_summary | VERIFIED |
| Pressure slope | 0.06 | From lba_parameters_summary | VERIFIED |

---

## Width Scaling (Appendix)

| Claim | Manuscript | width_scaling_check.csv | Status |
|-------|------------|-------------------------|--------|
| width_scale_factor 1.0 | All trials | n_scaled_overall=0, pct_scaled=0 | VERIFIED |
| 0 trials with scaling | Yes | 0 | VERIFIED |

---

## Trial Counts

| Claim | Manuscript | Data | Status |
|-------|------------|------|--------|
| 14,688 valid trials | Yes | 14,953 (current) | OUTDATED BUT EXPLAINABLE |
| 7,344 per modality | Yes | ~7,500 (current) | OUTDATED BUT EXPLAINABLE |
| 40 trials per block | Yes | 27 median | CONTRADICTED |
| 4 blocks | Yes | 8 blocks | CONTRADICTED |
| 160 trials total | Yes | 216 (8×27) | CONTRADICTED |
