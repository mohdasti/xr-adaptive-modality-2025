# Preregistration (Pre-Data)

## Hypotheses & Success Criteria

- **H1:** Hand > Gaze in TP (≥0.5 bits/s difference). Tests: LMEM log(MT), paired t on TP.

- **H2 (Equivalence):** Adaptive vs Static RT difference within ±5% on log scale.  
  **Primary:** 95% CI entirely within ±0.05 log units.  
  **Secondary:** TOST (report p's) + sensitivity at ±3% and ±7.5%.

- **H3:** Modality × Adaptation interaction: hand benefits mainly on errors; gaze mainly on RT.

- **H4:** Fitts fit: MT ~ a + b·IDe; R² ≥ .80 hand / ≥ .75 gaze; b_gaze > b_hand.

- **H5:** TLX total decreases ≥10% (5–7.5 points).

## Exclusions (predeclared)

- Trial RT <150ms or >5000ms; participant error rate >40%; completion <80%.  
- Display violations: zoom≠100%, not fullscreen, unstable DPR.

## Analysis Model (primary)

- LMEM: `log(MT) ~ modality * ui_mode + IDe + trial_number + block_number + (1+modality|participant)`

- GLMM (binomial) for error with same fixed effects.

- TP via mean-of-means per participant×condition (ISO recommendation).

## Policy Lock

- Adaptive thresholds finalized after 5-person pilot; frozen in `policy/policy.locked.json`.  
- SHA-256 of locked policy: `45781b229a064e26f61bea817d8d181d04be8c95f28c0247cd023d06f4bb7e5b` (example policy, update after pilot)

## Data Availability

- Scripts + synthetic dataset in repo; de-identified aggregates on OSF/Zenodo at `v1.0.0-data`.
