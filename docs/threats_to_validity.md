# Threats to Validity

This document identifies potential threats to the validity of study conclusions and describes mitigations implemented in the experimental design and analysis plan.

---

## 1. Construct Validity

### Threat: Browser "Gaze-Confirm" as Proxy for XR Gaze+Pinch

**Description:**
The study uses a browser-based "gaze-confirm" interaction (hover + spacebar) as a proxy for true XR gaze-directed pointing with pinch confirmation. This may not fully capture the spatial and temporal characteristics of HMD-based gaze interaction.

**Mitigation:**
- Frame the study as "gaze-directed pointing" rather than true eye-tracking
- Acknowledge limitations in generalizability to HMD contexts
- Plan HMD replication study for future work
- Use established ISO 9241-9 metrics that are comparable across input modalities
- Document the proxy nature in all reporting

**Impact:** Medium — Affects external validity but not internal validity of modality comparison

---

## 2. Internal Validity

### Threat: Carryover Effects Despite Counterbalancing

**Description:**
Practice, fatigue, or adaptation effects may carry over between blocks, potentially confounding the comparison of Static vs Adaptive UI modes.

**Mitigation:**
- **Williams Latin Square counterbalancing:** Each condition appears in each position exactly once across participants
- **Block order as covariate:** Include `block_number` as a fixed effect in statistical models
- **Post-hoc analysis:** Test for block-order effects and report if significant
- **Block-level breaks:** Participants can rest between blocks to reduce fatigue

**Impact:** Low — Counterbalancing and statistical controls minimize risk

### Threat: Display Settings Violations

**Description:**
Participants may change zoom level, exit fullscreen, or have unstable device pixel ratio during trials, introducing measurement error.

**Mitigation:**
- **Pre-trial gates:** System Check route enforces fullscreen and 100% zoom before starting
- **Live monitoring:** Display requirements checked before each block and during trials
- **Pause-on-violation:** Trials automatically pause if display settings change mid-trial
- **Exclusion criteria:** Trials with `zoom_pct != 100` or `fullscreen != TRUE` are excluded
- **Stability tracking:** `dpr` changes and `tab_hidden_ms` are logged for quality control

**Impact:** Low — Gates and exclusions prevent invalid data collection

### Threat: Event Dropout and Sampling Artifacts

**Description:**
High-frequency pointer events may be dropped by the browser, especially on slower devices, leading to incomplete trajectory data.

**Mitigation:**
- **Coalesced events:** Use `getCoalescedEvents()` to capture high-frequency samples
- **Event health tracking:** Monitor `pointer_coalesced_ratio` and `event_drop_estimate`
- **Quality flags:** Flag trials with `event_drop_estimate > threshold` for review
- **Robust metrics:** Use aggregated metrics (mean, median) that are less sensitive to missing samples

**Impact:** Low — Coalesced events and health tracking minimize data loss

---

## 3. External Validity

### Threat: Browser Latency vs HMD Latency

**Description:**
Browser-based interaction has different latency characteristics than HMD-based interaction, affecting absolute throughput values.

**Mitigation:**
- **Relative comparisons:** Focus on relative differences (Hand vs Gaze) rather than absolute TP values
- **Benchmark to ISO norms:** Compare to established mouse/controller norms (ISO 9241-9)
- **Acknowledge limitation:** Report that absolute TP values are context-specific
- **Replication plan:** HMD study will provide absolute benchmarks

**Impact:** Medium — Affects absolute values but not relative comparisons

### Threat: Laboratory vs Real-World Context

**Description:**
Controlled laboratory conditions may not generalize to real-world XR interaction scenarios.

**Mitigation:**
- **Standardized protocol:** Follow ISO 9241-9 guidelines for comparability
- **Multiple difficulty levels:** Test across range of ID values (1.5–6.5 bits)
- **Contextual factors:** Include pressure and aging conditions to increase ecological validity
- **Document limitations:** Acknowledge controlled nature in reporting

**Impact:** Medium — Standard protocol improves generalizability

---

## 4. Statistical Conclusion Validity

### Threat: Underpowered Equivalence Test (TOST)

**Description:**
TOST requires sufficient power to reject both null hypotheses. With small sample sizes, TOST may fail to establish equivalence even when true difference is small.

**Mitigation:**
- **Primary criterion:** Use 95% CI-based equivalence (CI entirely within ±5%) as primary
- **CI interpretation:** More robust to sample size than TOST p-values
- **Sensitivity analysis:** Report TOST at multiple margins (±3%, ±5%, ±7.5%)
- **Power analysis:** Target N=26–28 based on expected effect sizes
- **Report both:** Include both CI and TOST results for transparency

**Impact:** Low — CI-based criterion is primary, TOST is secondary

### Threat: Multiple Comparisons and Type I Error Inflation

**Description:**
Testing multiple hypotheses (H1–H5) increases risk of false positives.

**Mitigation:**
- **Pre-registration:** All hypotheses and tests pre-registered before data collection
- **Holm correction:** Use Holm-Bonferroni adjustment for pairwise comparisons
- **Primary vs secondary:** Clearly distinguish primary (H1, H2) from secondary (H3–H5) outcomes
- **Replication:** Plan replication study for key findings

**Impact:** Low — Pre-registration and corrections control error rate

### Threat: Model Assumptions Violations

**Description:**
Linear mixed-effects models assume normality of residuals, homoscedasticity, and linearity.

**Mitigation:**
- **Log transformation:** Use `log(movement_time_ms)` to normalize RT distribution
- **Diagnostic plots:** Generate residual plots, Q-Q plots, and Cook's distance
- **Robust alternatives:** Consider robust standard errors if assumptions violated
- **Model comparison:** Compare models with different random effect structures

**Impact:** Low — Log transformation and diagnostics address most violations

### Threat: Missing Data and Attrition

**Description:**
Participants may drop out or have incomplete data, potentially biasing results.

**Mitigation:**
- **Exclusion criteria:** Pre-declared exclusion rules (error rate >40%, completion <80%)
- **Intent-to-treat:** Analyze all available data, report exclusions transparently
- **Sensitivity analysis:** Re-run analyses with different exclusion thresholds
- **Attrition tracking:** Document reasons for dropout

**Impact:** Low — Pre-declared exclusions and transparency minimize bias

---

## 5. Measurement Validity

### Threat: Telemetry Sampling Rate Variability

**Description:**
Different devices and browsers may have different pointer event sampling rates, affecting kinematic metrics.

**Mitigation:**
- **Coalesced events:** Capture high-frequency samples when available
- **Event health metrics:** Track `pointer_coalesced_ratio` to identify low-quality data
- **Normalized metrics:** Use relative metrics (efficiency, curvature) that are less sensitive to sampling rate
- **Quality flags:** Flag trials with low coalesced ratio for review

**Impact:** Low — Coalesced events and health tracking address variability

### Threat: Submovement Detection Sensitivity

**Description:**
Submovement count depends on hysteresis threshold and prominence criterion, which may be sensitive to noise.

**Mitigation:**
- **Hysteresis threshold:** Use 5 px/s threshold to avoid noise
- **Prominence criterion:** Require minima to be < 10% of peak speed
- **Robust to parameters:** Test sensitivity to threshold values
- **Document algorithm:** Pre-specify detection rule in analysis plan

**Impact:** Low — Hysteresis and prominence criteria reduce noise sensitivity

### Threat: Path Efficiency Computation

**Description:**
Path efficiency depends on accurate start position and endpoint, which may be affected by display scaling or coordinate system issues.

**Mitigation:**
- **Viewport coordinates:** Use `clientX/clientY` (viewport pixels) consistently
- **Display metadata:** Log `zoom_pct`, `dpr`, `viewport_w`, `viewport_h` for each trial
- **Validation:** Flag efficiency values > 1.0 (invalid) or < 0.5 (very poor)
- **Sanity checks:** Compare to expected ranges (0.70–0.98)

**Impact:** Low — Consistent coordinate system and validation prevent errors

---

## 6. Design Validity

### Threat: Adaptation Policy Tuning

**Description:**
Adaptation thresholds are tuned during pilot phase, potentially introducing experimenter bias.

**Mitigation:**
- **Pre-declared target:** Target 15–25% adaptation trigger rate
- **Policy lock:** Freeze thresholds in `policy.locked.json` after pilot
- **SHA-256 hash:** Document locked policy hash in preregistration
- **No post-hoc tuning:** Do not adjust thresholds after locking
- **Transparency:** Report observed trigger rate in results

**Impact:** Low — Policy lock and transparency prevent bias

### Threat: Task Difficulty Range

**Description:**
Limited range of ID values (1.5–6.5 bits) may not capture full Fitts relationship.

**Mitigation:**
- **Three difficulty levels:** Low (≈1.8), Medium (≈3.5), High (≈5.0)
- **ISO compliance:** Follow ISO 9241-9 recommendations for ID range
- **Fitts fit validation:** Require R² ≥ 0.80 (hand) / ≥ 0.75 (gaze) to confirm linearity
- **Report fit quality:** Document R² and slope estimates

**Impact:** Low — Three levels and fit validation address concern

---

## Summary of Mitigations

| Threat Category | Primary Mitigation | Status |
|----------------|-------------------|--------|
| Construct validity | Frame as gaze-directed pointing, plan HMD replication | ✓ Implemented |
| Internal validity | Williams counterbalancing, display gates, exclusion criteria | ✓ Implemented |
| External validity | ISO standardization, relative comparisons | ✓ Implemented |
| Statistical conclusion | CI-based equivalence (primary), TOST (secondary) | ✓ Implemented |
| Measurement validity | Coalesced events, health tracking, validation | ✓ Implemented |
| Design validity | Policy lock, pre-declared targets | ✓ Implemented |

---

## Reporting Requirements

When reporting results, explicitly address:

1. **Construct validity:** Acknowledge browser proxy limitation
2. **Counterbalancing:** Report block-order effects if significant
3. **Exclusions:** Document number and reasons for excluded trials/participants
4. **Equivalence:** Report both 95% CI and TOST results
5. **Model diagnostics:** Include residual plots and assumption checks
6. **Sensitivity:** Report analyses at multiple equivalence margins

---

## References

- Shadish, W. R., Cook, T. D., & Campbell, D. T. (2002). *Experimental and quasi-experimental designs for generalized causal inference*
- ISO 9241-9:2000 - Ergonomic requirements for office work with visual display terminals
- Lakens, D. (2017). Equivalence tests: A practical primer for t tests, correlations, and meta-analyses
