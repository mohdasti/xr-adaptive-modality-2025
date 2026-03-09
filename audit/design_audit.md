# Design Integrity Audit

**Date:** 2025-03-07  
**Purpose:** Resolve manuscript vs. code/data discrepancies (block count, sample size, pressure assignment).

---

## 1. Files Inspected

| File | Purpose |
|------|---------|
| `docs/manuscript/Manuscript.qmd` | Manuscript source; Procedure, Design, Participants sections |
| `app/src/experiment/counterbalance.ts` | Williams 8×8 design, condition codes, block validation |
| `app/src/components/TaskPane.tsx` | Block flow, condition assignment, pressure from block, TLX trigger |
| `app/src/components/FittsTask.tsx` | Trial rendering, widthScale application |
| `app/src/lib/csv.ts` | CSV schema, block_number, pressure logging |
| `app/src/lib/fitts.ts` | generateTrialSequence, trials per block |
| `scripts/compute_manuscript_stats.py` | Data path, QC filters, input-device exclusion |
| `analysis/check_exclusions.R` | Exclusion flags (error rate, completion, zoom, fullscreen) |
| `docs/EXCLUSION_CRITERIA.md` | Pressure bug exclusion (N=48), inclusion criteria |
| `docs/INPUT_DEVICE_EXCLUSION_STRATEGY.md` | Trackpad hand-trial exclusion |
| `data/clean/trial_data.csv` | Analyzed dataset (exists, ~70MB) |
| `data/participant_tracking.csv` | Block completion status per participant |

---

## 2. Intended Design in Code

### 2.1 Block Count and Design

**Source:** `app/src/experiment/counterbalance.ts`

- **Design:** 2 (Modality) × 2 (Intervention) × 2 (Pressure) = **8 conditions**
- **Condition format:** `{Modality}{Intervention}_{Pressure}` (e.g., `HaS_P0`, `GaA_P1`)
- **Blocks per participant:** **8** (one per condition)

```typescript
// Lines 4-9
Design: 2 (Modality) × 2 (Intervention) × 2 (Pressure) = 8 conditions
Format: {Modality}{Intervention}_{Pressure}
```

```typescript
// Lines 69-72
export function sequenceForParticipant(participantIndex: number): Cond[] {
  const sequenceIndex = participantIndex % 8
  return [...WILLIAMS_8[sequenceIndex]]
}
```

```typescript
// Lines 97-99
if (completedBlocks.length !== 8) {
  errors.push(`Expected 8 blocks, found ${completedBlocks.length}`)
}
```

### 2.2 Williams Counterbalancing

**Source:** `app/src/experiment/counterbalance.ts` lines 38-47

- True 8×8 Balanced Latin Square (Williams Design)
- Each condition appears in each position exactly once
- Every condition follows every other condition exactly once

### 2.3 Pressure Assignment

**Source:** `app/src/components/TaskPane.tsx` lines 404-418

- **Pressure is block-level.** Each block has a single pressure value from the condition code.
- `parseConditionCode(currentCond)` extracts `pressure` from `block_order` (e.g., `HaS_P0` → pressure=false, `HaS_P1` → pressure=true).
- `setPressureEnabled(targetPressure)` is called at block start.

```typescript
// Lines 404-418
const currentCond = blockSequence[blockNumber - 1]
const { modality: targetModality, uiMode: targetUiMode, pressure: targetPressure, ... } = parseConditionCode(currentCond)
setPressureEnabled(targetPressure)
```

### 2.4 Trials per Block

**Source:** `app/src/lib/fitts.ts` + `app/src/components/TaskPane.tsx`

- Default: `selectedIDs = ['low','medium','high']` (3 IDs), `nTrialsPerID = 3`
- `generateTrialSequence(configs, nTrialsPerID, true)` produces: 3 configs × (3 point + 3×2 drag) = 3 × 9 = **27 trials per block**
- UI displays: `selectedIDs.length * nTrialsPerID * 3` = 27

**Evidence:** `app/src/components/TaskPane.tsx` line 476:
```typescript
const sequence = generateTrialSequence(configs, nTrialsPerID, true)
```

### 2.5 Total Main-Task Trials per Participant

- **8 blocks × 27 trials = 216 trials** (default configuration)
- Some participants may have different `nTrialsPerID` or `selectedIDs` (observed range 216–432 in data)

### 2.6 NASA-TLX Administration

**Source:** `app/src/components/TaskPane.tsx` lines 610-621, 640-651

- TLX modal shown **after each block** completion
- `handleTlxSubmit` called when user submits; block advances to next
- **8 TLX administrations per complete participant** (one per block)

---

## 3. Actual Analyzed Design in Data

**Dataset:** `data/clean/trial_data.csv` (analyzed by `scripts/compute_manuscript_stats.py`)

| Metric | Value |
|--------|-------|
| Total rows (excl. practice) | 17,442 |
| Unique participants | 81 |
| Participants with 8 blocks | 76 |
| Participants with &lt;8 blocks | 5 |
| Trials per block | min 27, max 54, median 27 |
| Pressure varies within block | **No** (0 blocks with &gt;1 pressure value) |
| Unique modality×ui_mode×pressure per complete participant | 8 |
| Total trials per complete participant | 216–432 (mean ~219) |
| TLX blocks per participant | 0–8 (median 8 for complete) |

### Pressure Assignment Verdict

**Pressure is block-level.** Every block has a single pressure value. No within-block pressure variation.

### Block-Count Verdict

**The design is 8 blocks, not 4.** Code, validation, and data all support 8 blocks per participant.

---

## 4. Pressure Assignment Verdict

**Pressure is assigned at the block level.** Each block corresponds to one condition (Modality × UI Mode × Pressure). The manuscript Procedure line 201 states "Pressure (time-limited vs. self-paced) was varied within blocks"—**this is incorrect.** Pressure is constant within each block.

---

## 5. Block-Count Verdict

**Manuscript error:** Manuscript.qmd line 201 says "4 blocks of 40 trials each (160 trials total per participant)."

**Evidence from code and data:**
- Counterbalance: 8 conditions, 8 blocks
- TaskPane: `blockSequence.length` = 8
- Data: 76/81 participants have 8 blocks; trials per block median 27 (not 40)

**Correction:** Replace with "eight blocks of [27] trials each" (or report actual median). The "40 trials" does not match the default `generateTrialSequence` output (27).

---

## 6. Sample-Size Reconciliation

### 6.1 Document Discrepancy

| Document | N Reported | Context |
|----------|------------|---------|
| Manuscript (abstract, results, discussion) | N=67 | "Complete 2×2×2 factorial data" |
| Manuscript Participants | 81 enrolled, 14 excluded (10 no usable, 4 incomplete) | 81 − 14 = 67 |
| docs/EXCLUSION_CRITERIA.md | N=48 | After pressure-bug exclusion (7 participants); 55 total |
| Actual trial_data.csv | 81 in data, 76 with 8 blocks | |

### 6.2 Explanation

1. **EXCLUSION_CRITERIA.md** reflects an **older snapshot** (Dec 8, 2025): 55 participants, 7 excluded for pressure bug → N=48.
2. **Manuscript** reflects a **newer dataset**: 81 participants, 14 excluded → N=67.
3. **trial_data.csv** has **pressure corrected** from `block_order` during merge. Pressure-bug participants (P002, P003, etc.) have correct pressure values derived from block_order; they are **included** in the current dataset.
4. **Current data:** 76 participants have 8 blocks (factorial complete). Manuscript states 67, implying additional exclusions (e.g., display compliance, valid-trial threshold) that are not fully replicated in `compute_manuscript_stats.py` QC.

### 6.3 Participant Flow Summary

| Stage | Count | Notes |
|-------|-------|-------|
| In trial_data.csv | 81 | Participants who submitted data |
| Complete (8 blocks) | 76 | From `audit/participant_flow.csv` |
| Incomplete (&lt;8 blocks) | 5 | P002, P037, P048, P073, P078 |
| Excluded for pressure bug | 0 | Pressure corrected from block_order in merge; EXCLUSION_CRITERIA N=48 is from older snapshot |
| Final N (if 8 blocks = complete) | 76 | Actual data |
| Manuscript-reported N | 67 | Implies 9 additional exclusions (display/validity) |

See `audit/participant_flow.csv` for per-participant status. See `audit/design_summary.csv` for block/condition/trial counts.

### 6.4 Recommendation

- If the manuscript statistics were computed from a run yielding N=67, document the exact exclusion criteria that produce 67 from 81.
- If the current pipeline yields N=76, update the manuscript to report N=76 and adjust exclusion wording.
- **Do not** use EXCLUSION_CRITERIA.md's N=48 for the manuscript; that document is from an older cohort.

---

## 7. Final Manuscript Correction Recommendations

### 7.1 Design and Procedure (CASE A Supported)

**Evidence:** Code and data support an 8-block, 2×2×2 design with block-level pressure.

**Replace Experimental Design paragraph (Section 5.4):**

> We used a repeated-measures 2 × 2 × 2 design crossing Modality (Hand vs. Gaze), UI Mode (Static vs. Adaptive), and Pressure (Self-Paced vs. Time-Limited). Each participant completed eight experimental blocks, one for each condition combination, with block order counterbalanced across participants using a Williams-design schedule. Each block contained [27] trials (default configuration), yielding [216] main-task trials per complete participant before exclusions.

*Note: Use actual median trials per block from data if different from 27.*

**Replace Procedure paragraph (Section 5.6):**

> Each participant first completed a short training session to become familiar with both input modes, including practice with the simulated gaze interface and dwell-based selection as well as standard hand pointing. In the main experiment, participants completed eight blocks of [27] trials each. The eight blocks corresponded to the full crossing of Modality (Hand vs. Gaze), UI Mode (Static vs. Adaptive), and Pressure (Self-Paced vs. Time-Limited), with counterbalanced block order across participants. Within each block, target direction varied across the eight ISO 9241-9 positions and Index of Difficulty varied across three levels (approximately 2–6 bits). Practice trials were excluded from analysis.

**Remove** any wording that "pressure varied within blocks." Pressure is block-level.

**TLX:** Correct any implication of 4 TLX administrations. TLX was administered **after each of 8 blocks**.

### 7.2 Sample Size (Section 5.5.1)

**Do not** apply a fixed replacement without verifying the exact N from the analysis pipeline.

- If all analyses use N=67: Keep current wording but ensure exclusion counts (10 no usable, 4 incomplete) are consistent with the actual participant flow.
- If current data yields N=76: Update to "N=76 participants with complete 2×2×2 factorial data" and revise exclusion narrative.
- If different analyses use different N: State analysis-specific sample sizes explicitly.

---

## 8. Unresolved Ambiguities

1. **Trials per block:** Manuscript says 40; code default is 27. Data shows median 27, max 54. The source of "40" is `docs/methods_detail.md` (older 4-block design). See `audit/trial_count_audit.md`.
2. **N=67 vs. N=69:** Manuscript reports 67; current pipeline yields 69 with 8 blocks (after input-device filter). The 2-participant gap is not reproduced. Most likely: manuscript used an older snapshot (71 submitted, 4 incomplete → 67).
3. **EXCLUSION_CRITERIA.md vs. manuscript:** EXCLUSION_CRITERIA describes pressure-bug exclusion (N=48). The manuscript Participants section says "14 excluded (10 no usable, 4 incomplete)" and reports N=67. The Limitations section says "seven participants excluded... pressure-logging bug." These are inconsistent; the manuscript mixes two exclusion narratives.

---

## 9. CASE and Editorial Strategy

### CASE 3 (Most Likely)

**The manuscript numbers came from an older snapshot and no longer match the current pipeline.**

Evidence:
- Current trial_data: 81 participants, 69 with 8 blocks (after input-device filter)
- Manuscript: N=67, 14 excluded (10 no usable, 4 incomplete)
- "10 no usable" likely = 10 who had not yet submitted when the manuscript was written
- "4 incomplete" matches an older cohort; current data have 6 mouse incomplete + 6 trackpad (4 blocks each)

### Recommended Editorial Strategy: **Strategy C**

**Regenerate all manuscript numbers from the current pipeline before editing the manuscript text.**

1. Re-run `scripts/compute_manuscript_stats.py` and `scripts/export_case_study_assets.R` on current `data/clean/trial_data.csv`.
2. Apply a consistent participant-level gate: 8 blocks (after input-device filter) → N=69.
3. Update manuscript N to 69 (or document the exact exclusion steps that yield 67 if that is preferred).
4. Update Procedure: 8 blocks, 27 trials per block, 216 total; pressure block-level.
5. Resolve the Limitations vs. Participants inconsistency (pressure-bug vs. no-usable/incomplete).
