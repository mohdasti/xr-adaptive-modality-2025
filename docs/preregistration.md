# Preregistration (Lean 2×2)

## Design
- Within-subjects 2×2: Modality (Hand vs Gaze-confirm) × UI Mode (Static vs Adaptive).
- Williams Latin-square counterbalancing (4 orders).
- N = 24–30; session 20–30 min.

## Primary Outcomes
- Movement time (log-RT, successful trials, 150ms–5000ms).
- Error (0/1).
- Throughput (IDe / MT) computed with **effective width** (We = 4.133 × SD of endpoint error).
- NASA-TLX (raw sum + key subscales).

## Success Thresholds
- Error: ≥15% relative reduction with Adaptive vs Static.
- RT: TOST equivalence within ±5% (no meaningful slowdown).
- TLX: ≥10–15% reduction with Adaptive vs Static.

## Exclusion Rules (pre-registered)
- Trial-level (RT analysis): RT < 150ms or > 5000ms; timeouts; non-successes excluded from RT but included in error.
- Participant-level: error rate > 40%; completion < 80%; zoom ≠ 100%; not full-screen.
- Expect <5% trial exclusions; <15% participant exclusions.

## Adaptation Policy
- Target trigger rate: **15–25%** (pilot tune in `policy.default.json`).
- After pilot, freeze thresholds in `policy.locked.json`.

## Modeling Plan
- LMEM: log-RT ~ Modality * UI + scale(IDe) + scale(trial_number) + block_number + (1 + UI | participant).
- GLMM(logit): Error ~ Modality * UI + scale(IDe) + scale(trial_number) + block_number + (1 | participant).
- Fitts: mixed slopes; Modality × IDe interaction.
- TOST: test RT equivalence (±5%) Adaptive vs Static.
- TLX: RM-ANOVA or LMEM at block level.

## Reporting
- Provide effect sizes (CIs), TOST results, and pre-committed thresholds.
- Camera metrics, if any, reported as exploratory only.
