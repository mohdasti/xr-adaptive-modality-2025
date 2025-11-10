# Preregistration (XR Adaptive Modality, 2×2 within-subjects)

**Design:** Modality (Hand vs Gaze-confirm) × UI Mode (Static vs Adaptive), within-subjects; 4 counterbalanced blocks (Williams design). N=24–30, ~160 trials/participant.

**Primary outcomes:** Movement Time (ms), Error (0/1), Throughput (bits/s using IDe/MT), Raw NASA-TLX (total + mental/effort/frustration).

**Fitts metrics:** Use effective width We = 4.133 × SD(endpoints) and IDe = log2(A/We + 1).

**Adaptation policy:** Targets ~15–25% of trials in adaptive state. Hysteresis: 5 trials. Thresholds locked after pilot.

**Success thresholds (minimum meaningful effects):**

- RT: non-inferior within ±5% margin (TOST) OR ≥5–10% faster.
- Errors: ≥15% relative reduction (Static→Adaptive).
- Throughput: +0.2–0.3 bits/s at medium–high IDe.
- TLX: ≥10–15% lower with Adaptive.

**Exclusion rules (pre-registered):**

- Trial-level: RT <150 ms or >5000 ms; timeouts excluded from RT models; errors included for error models.
- Participant-level: >40% errors, <80% completion, fullscreen off, zoom ≠ 100% (DPI/zoom noncompliance), or resolution <1280×720.
- Sensitivity: re-run models with no exclusions to check robustness.

**Model plan (primary):**

- RT (correct trials): lmer(logRT ~ Modality * UI + scale(IDe) + scale(trial_number) + block_number + (1 + UI|pid))
- Errors: glmer(error ~ Modality * UI + scale(IDe) + scale(trial_number) + block_number + (1|pid), binomial)
- Throughput: lmer(TP ~ Modality * UI + (1|pid))
- Adaptation dynamics: lmer(logRT ~ adaptive_state * Modality + scale(IDe) + (1|pid))

**Equivalence test:** TOST for Adaptive vs Static RT with ±5% margin.

**Counterbalancing:** Williams sequences across 4 conditions: HaS, GaS, HaA, GaA.

**Pilot:** Tune thresholds to reach 15–25% adaptive trials; then lock `policy.locked.json`.

**Reporting:** Fixed effects with β/SE/p; EMMs with 95% CI; Equivalence 90% CI; effect sizes; exclusion report; prereg link.

