# Manuscript Analysis Policy

**Date:** 2025-03-07  
**Status:** Recommended policy for manuscript-facing analyses

---

## 1. Recommended Primary Manuscript Population

**Population B: Complete-design primary sample**

- Participants with **all 8 blocks** present after applying:
  - Trial-level QC (practice excluded, zoom=100%, fullscreen, tab<500ms, focus=0)
  - Input-device filter (hand: mouse only; gaze: mouse + trackpad)
- **N = 69**

---

## 2. Rationale

1. **Design alignment:** The manuscript claims a repeated-measures 2×2×2 design with complete within-participant condition coverage. Primary performance claims (throughput, error rate, movement time) require participants with all 8 blocks.

2. **Reproducibility:** Population B is what the current pipeline yields when an 8-block gate is applied. It does not invent exclusions that are not implemented in code.

3. **Pressure bug:** Pressure is reconstructed from `block_order` in the merged dataset. The old pressure-logging bug does **not** define the current participant exclusion rule. The "7 participants excluded for pressure bug" language should be reframed as historical, not a current exclusion.

4. **N = 67:** Not reproducible from the current pipeline. Retire N = 67; use N = 69 as the primary manuscript N.

---

## 3. Analyses Using Primary Population

| Analysis | Population | N | Notes |
|----------|------------|---|-------|
| Throughput (TP) | B | 69 | Hand: mouse only; Gaze: mouse + trackpad |
| Error rate | B | 69 | Same |
| Movement time (MT) | B | 69 | Same |
| Fitts regression | B | 69 | Valid trials: correct, 150–6000 ms |

---

## 4. Analyses Using Analysis-Specific Subsets

| Analysis | Subset | Report |
|----------|--------|--------|
| **TLX** | Participants with TLX data in each modality | n_hand, n_gaze (may be <69 if missing blocks) |
| **LBA** | Trials with valid `verification_time_ms` (200–5000 ms) | Observation-level n; participant N = 69 |

---

## 5. N Language for Manuscript

- **Primary sample:** "N = 69 participants with complete 8-block design"
- **Performance (TP, error, MT):** "N = 69"
- **TLX:** Report modality-specific n if different (e.g., "Hand n = 69, Gaze n = 69" or actual counts from regenerated outputs)
- **LBA:** "N = 69 participants; n = X trials with valid verification-phase RT"
- **Do not** use N = 67

---

## 6. What NOT to Do

- Do not use Population A (no 8-block gate) for primary repeated-measures claims
- Do not retain the old "10 no usable, 4 incomplete" story unless it exactly matches regenerated counts
- Do not retain "7 participants excluded for pressure bug" as a current exclusion
- Do not force one N if analyses genuinely use different valid subsets
- Do not invent exclusions not present in code

---

## 7. Trial Counts (Design)

- **Blocks per participant:** 8
- **Trials per block:** 27 (default from `fitts.ts`)
- **Main-task trials per complete participant:** 8 × 27 = 216 (before trial-level exclusions)
- **Practice trials:** Excluded from analysis

---

## 8. Pressure Assignment

- Pressure is **block-level**, not varied within block
- Each block has one pressure value (Self-Paced or Time-Limited)
- TLX administered **after each of 8 blocks**
