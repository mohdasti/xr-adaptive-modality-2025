# Analysis Population Comparison

**Date:** 2025-03-07  
**Purpose:** Compare candidate manuscript-facing analysis populations for reproducibility and design alignment.

---

## 1. Population Definitions

| Population | Definition | 8-Block Gate | check_exclusions |
|------------|------------|--------------|------------------|
| **A** | Current pipeline behavior: QC + input-device filter, no 8-block gate | No | No |
| **B** | Complete-design primary: 8 blocks after QC + device filter | Yes | No |
| **C** | B + check_exclusions (error>40%, completion<80%) | Yes | Yes (error/completion only) |

**Note:** `check_exclusions.R` uses `error`, `movement_time_ms`, `zoom_level`, `is_fullscreen`. The current `trial_data.csv` lacks `error` and `movement_time_ms`; zoom/fullscreen at participant level would over-exclude (many trials have `is_fullscreen=False` from browser reporting). Population C uses only error_rate (from `correct`) and completion_rate (from `rt_ms`) as a conservative approximation. The full `check_exclusions.R` does not run on current data.

---

## 2. Counts Summary

| Population | N | Trials | Hand | Gaze | TLX obs | Blocks/pp | Matches RM design |
|------------|---|--------|------|------|---------|-----------|-------------------|
| A | 81 | 16,711 | 8,113 | 8,598 | 492 | varies | No |
| B | 69 | 15,105 | 7,560 | 7,545 | 441 | 8 | Yes |
| C | 68 | 14,889 | 7,452 | 7,437 | 433 | 8 | Yes |

---

## 3. Population A (Current Pipeline)

- **Participants:** 81 (all with any QC-passing trials after device filter)
- **Trials:** 16,711
- **Blocks per participant:** Varies (includes 6 trackpad users with 4 blocks each, 6 mouse users with incomplete sessions)
- **Matches repeated-measures design:** No — does not enforce complete 2×2×2 coverage

**Excluded from A by 8-block gate (→ B):** 12 participants  
- 6 trackpad users (4 blocks each; hand trials excluded by device filter, so effectively 4 blocks of gaze)  
- 6 mouse users: P002, P030, P037, P043, P048, P057, P059, P061, P063, P072, P073, P078

---

## 4. Population B (Complete-Design Primary)

- **Participants:** 69
- **Trials:** 15,105
- **Hand trials:** 7,560 (mouse only)
- **Gaze trials:** 7,545 (mouse + trackpad)
- **TLX observations:** 441 (69 × 8 blocks, minus blocks with missing TLX)
- **Blocks per participant:** 8
- **Matches repeated-measures design:** Yes

**Rationale:** The manuscript claims a repeated-measures 2×2×2 design with complete within-participant condition coverage. Primary performance claims (throughput, error rate, movement time) require participants with all 8 blocks.

---

## 5. Population C (B + check_exclusions)

- **Participants:** 68
- **Excluded from B:** P041 (error_rate > 40% or completion_rate < 80%)
- **Trials:** 14,889
- **Matches repeated-measures design:** Yes

**Note:** `check_exclusions.R` is not currently used by manuscript-facing scripts (`compute_manuscript_stats.py`, `export_case_study_assets.R`). Adopting C would require adding this exclusion to the pipeline. The audit recommends **Population B** as the primary sample because it is what the current pipeline effectively uses for 8-block-complete participants, and C adds an exclusion not yet enforced in code.

---

## 6. Analysis-Specific Ns

| Analysis | Primary population | Hand N | Gaze N | Notes |
|----------|--------------------|--------|--------|-------|
| Throughput, Error, MT | B (69) | 69 | 69 | Mouse for hand; mouse+trackpad for gaze |
| TLX | B (69) | ≤69 | ≤69 | Some participants missing TLX in some blocks |
| Fitts regression | B (69) | 69 | 69 | Uses valid trials (correct, 150–6000 ms) |
| LBA | B (69) | ≤69 | ≤69 | Requires verification_time; subset of trials |

---

## 7. Manuscript N = 67 Gap

The manuscript reports N = 67. The current pipeline yields **N = 69** for the 8-block-complete sample. The 2-participant gap is not reproducible from the current code or data. **Recommendation:** Retire N = 67 and use N = 69 as the primary manuscript N, with analysis-specific n reported where applicable (e.g., TLX, LBA).
