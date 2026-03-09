# High-Risk Claims for Verification

**Purpose:** Exact claims to verify against code, logs, and manuscript source.  
**Date:** 2025-03-07  
**Status:** Pending verification; do not infer without file-level evidence.

---

## Claim 1: Full 2×2×2 vs 4 Blocks with Pressure Within Block

**Claim:** Is the study actually a full 2×2×2 repeated-measures block design, or are there only 4 blocks with pressure varying within block?

**Relevant files:**
- `app/src/experiment/counterbalance.ts` — WILLIAMS_8 defines 8 conditions (HaS_P0, HaS_P1, GaS_P0, GaS_P1, HaA_P0, HaA_P1, GaA_P0, GaA_P1); `validateWilliamsAssignment` expects 8 blocks
- `docs/manuscript/Manuscript.qmd` line 187 — "2 × 2 × 2 within-subjects design"
- `docs/manuscript/Manuscript.qmd` line 201 — "4 blocks of 40 trials each (160 trials total)" — **conflicts with 8-block design**
- `docs/methods_detail.md` — "Four blocks" (legacy?)

**Verification:** Compare counterbalance.ts (8 blocks) vs Manuscript Procedure (4 blocks). Resolve conflict.

---

## Claim 2: 4 Blocks vs 8 Condition Blocks

**Claim:** Did participants complete 4 blocks or 8 condition blocks?

**Relevant files:**
- `app/src/experiment/counterbalance.ts` — `sequenceForParticipant` returns 8 conditions; `validateWilliamsAssignment` expects 8 blocks
- `docs/manuscript/Manuscript.qmd` line 201 — "4 blocks of 40 trials each"
- `docs/EXCLUSION_CRITERIA.md` — "All 8 blocks completed"
- `data/dict/data_dictionary.md` — block_number 1–8
- `app/src/lib/csv.ts` line 690 — "8 blocks × 24 trials"

**Verification:** Inspect actual trial data (block_number distribution) and TaskPane block flow. Manuscript says 4; code and docs say 8.

---

## Claim 3: Dynamic Modality Switching vs Fixed Modality Block

**Claim:** Does the system ever dynamically switch active modality online, or does it only apply adaptive manipulations within a fixed modality block?

**Relevant files:**
- `app/src/components/TaskPane.tsx` — `parseConditionCode`, `startFittsBlockInternal`; modality set per block from condition code
- `app/src/lib/policy.ts` — `nextPolicyState` receives `modality`; triggers declutter (gaze) or inflate_width (hand) within that modality
- `docs/manuscript/Manuscript.qmd` — "context-driven switching" vs "adaptive manipulations within block"

**Verification:** Confirm that modality is fixed per block (from Williams sequence) and policy only changes declutter/width within block. No mid-block modality switch.

---

## Claim 4: Hand Width Inflation Rendering Failure

**Claim:** Did hand width inflation truly fail to render in the analyzed dataset?

**Relevant files:**
- `docs/ADAPTATION_POLICY_ROOT_CAUSE.md` — Policy emitted inflate_width; UI did not apply to rendered targets
- `scripts/compute_manuscript_stats.py` — `compute_width_scaling_check` checks `width_scale_factor != 1.0`
- `docs/manuscript/Manuscript.qmd` line 397 — "width_scale_factor remained 1.0 (0 trials with scaling)"
- `app/src/components/FittsTask.tsx` — `effectiveWidth = config.W * widthScale`; `widthScale` from TaskPane
- `app/src/components/TaskPane.tsx` lines 228–241 — `handlePolicyChange` sets widthScale on `policy:change`

**Verification:** Check that policy:change events reach TaskPane; that FittsTask receives widthScale; that CSV logs width_scale_factor. Root cause doc says event propagation or state update failed.

---

## Claim 5: Fitts Slope Interpretations Reversed

**Claim:** Are the Fitts slope interpretations reversed in the appendix/discussion?

**Relevant files:**
- `docs/manuscript/Manuscript.qmd` lines 377–384 — Hand: 0.155, 0.146 s/bit; Gaze: 0.179, 0.193 s/bit
- `docs/manuscript/Manuscript.qmd` line 376 — "Hand conditions showed steeper slopes (0.15–0.16 s/bit) ... The flatter gaze slope (0.18–0.19 s/bit)"

**Verification:** Hand slopes (0.15–0.16) are **flatter** than gaze slopes (0.18–0.19). Manuscript text says "steeper" for hand and "flatter" for gaze — **reversed**. Steeper = higher slope = more ms per bit. Gaze has higher slopes.

---

## Claim 6: LBA t0 on Latent vs Literal Millisecond Scale

**Claim:** Is LBA t0 on a latent transformed scale rather than a literal millisecond nondecision-time parameter?

**Relevant files:**
- `analysis/py/lba.py` lines 393–399 — `t0 = sigmoid(t0_raw) * min_rt_global`; t0_raw is latent; t0 is in seconds
- `scripts/export_lba_figures.R` lines 6–9 — "t0 = sigmoid(t0_raw) * min_rt ... t0_mu is the group-level latent parameter ... Higher t0_mu -> higher sigmoid -> higher t0 in seconds"
- `scripts/export_lba_figures.R` line 67 — x-axis: "Non-decision time (t0) — latent scale: rightward = longer verification phase"
- `docs/case_study/case_study_web.qmd` — "t0_mu" values like -1.41, -0.97 (negative, latent)

**Verification:** t0_mu in lba_parameters_summary.csv is on latent (sigmoid input) scale, not milliseconds. Manuscript must not report t0_mu as "ms" or literal NDT.

---

## Claim 7: XR Embodiment vs Mouse/Trackpad

**Claim:** Is the paper overstating XR embodiment given that participants used mouse/trackpad on their own computers?

**Relevant files:**
- `docs/manuscript/Manuscript.qmd` — "XR interaction", "embodied interaction", "Gorilla Arm", "primary pointing devices are the user's own hands and eyes"
- `docs/manuscript/Manuscript.qmd` line 170 — "participants controlled a cursor with their mouse"
- `docs/manuscript/Manuscript.qmd` line 216 — "web application ... hosted on Vercel ... remote, asynchronous data collection"
- `docs/INPUT_DEVICE_EXCLUSION_STRATEGY.md` — mouse vs trackpad; hand uses mouse

**Verification:** Manuscript frames study as XR/embodied; implementation is web-based mouse/trackpad with gaze simulation. Clarify scope of "XR" (simulation vs hardware HMD).
