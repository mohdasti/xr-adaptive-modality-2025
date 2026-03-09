# LBA Edit Pack

**Date:** 2025-03-07  
**Purpose:** Exact replacement text for LBA t0 scale and interpretation.

**Case:** t0 is on a latent transformed scale (t0_mu reported); not raw milliseconds. Condition differences are interpreted directionally. Empirical verification RT supports the ordering.

---

## 1. METHODS — LBA introduction (Measures and Analysis Strategy)

**Old:**
> (3) **Decision Verification (LBA)**—we used the Linear Ballistic Accumulator (LBA) model [@brown2008] to analyze the verification phase (time from first target entry to final selection). LBA is robust to low error rates and allows estimation of non-decision time (NDT), drift rate, and decision threshold. We fit a hierarchical Bayesian LBA model in PyMC with modality- and UI-mode-varying NDT, ID-varying drift rate, and pressure-varying threshold. For the verification-phase component, we used LBA rather than DDM because the subset of trials used for that analysis did not provide error patterns suitable for stable DDM estimation [@lerche2017].

**New:**
> (3) **Decision Verification (LBA)**—we used the Linear Ballistic Accumulator (LBA) model [@brown2008] to analyze the verification phase, defined as time from first target entry to final selection. The model estimated condition-varying non-decision time (t0) together with drift rate and decision threshold. In the fitted parameterization, t0 is reported on the model's latent scale rather than as a directly observed millisecond quantity; condition differences in t0 are interpreted directionally and in conjunction with empirical verification-phase RT summaries. We fit a hierarchical Bayesian LBA model in PyMC with modality- and UI-mode-varying t0, ID-varying drift rate, and pressure-varying threshold. The model used verification-phase RTs (200–5000 ms) from valid trials. For the verification-phase component, we used LBA rather than DDM because the subset of trials used for that analysis did not provide error patterns suitable for stable DDM estimation [@lerche2017].

**Reason:** Clarify latent scale; state that interpretation is directional.

**Source:** audit/lba_t0_audit.md

---

## 2. RESULTS — Parameter Estimates paragraph (before Table 4)

**Old:**
> @tbl-lba-params reports group-level LBA parameter estimates by modality and UI mode. Non-decision time (t0) is the primary parameter that varies across conditions; drift and threshold parameters are shared across conditions with modality- and pressure-specific effects captured in the hierarchical structure. @fig-lba-t0 visualizes the t0 posterior estimates and 95% HDIs by condition, making the modality and UI-mode differences immediately apparent: gaze conditions show higher (less negative) t0 values than hand conditions, indicating longer verification-phase duration. @fig-verification-rt shows the empirical verification-phase RT by condition, bridging the raw observed behavior to the modeled latent parameters.

**New:**
> @tbl-lba-params reports group-level LBA parameter estimates by modality and UI mode. The non-decision-time parameter (t0) is the primary parameter that varies across conditions; it is reported on the model's latent scale, not as a raw duration in milliseconds. More rightward (less negative) values indicate a larger verification-related offset under the fitted parameterization. This ordering was evaluated against the empirical verification-phase RT summaries shown in @fig-verification-rt. @fig-lba-t0 visualizes the t0 posterior estimates and 95% HDIs by condition; gaze conditions show higher (less negative) t0 values than hand conditions, consistent with longer verification-phase duration in the empirical data.

**Reason:** Explicit latent-scale statement; link to empirical validation.

**Source:** audit/lba_t0_audit.md, audit/lba_empirical_alignment.md

---

## 3. TABLE 4 — Column header and caption

**Old (column header):** t0 (NDT) [95% HDI]

**New:** t0 (latent) [95% HDI]

**Old (caption):** t0 (latent): non-decision time; higher values indicate longer verification-phase duration.

**New:** t0 (latent): verification-related offset on the model's latent scale; values are not in milliseconds. More rightward (less negative) values indicate longer verification-phase duration under the fitted parameterization.

**Reason:** Avoid "NDT" implying milliseconds; reinforce latent scale.

**Source:** audit/lba_terminology_recommendation.md

---

## 4. FIGURE 7 caption

**Old:**
> Non-decision time (t0) by condition. Each row shows one condition; the point is the posterior mean and the horizontal line is the 95% highest-density interval. t0 is the time spent on encoding and motor execution before the decision process—the verification phase. Values are on a latent scale (negative); rightward means longer verification phase. Gaze conditions (top two rows) show longer t0 than hand conditions (bottom two rows), meaning gaze required more time before users committed to selection—consistent with the Midas Touch problem.

**New:**
> Non-decision time (t0) by condition. Each row shows one condition; the point is the posterior mean and the horizontal line is the 95% highest-density interval. t0 is shown on the model's latent scale, not in raw milliseconds. More rightward (less negative) values correspond to a larger verification-related offset under the fitted parameterization. Gaze conditions (top two rows) show longer verification-related offsets than hand conditions (bottom two rows), consistent with the empirical verification-phase RT and the Midas Touch account.

**Reason:** Remove any implication of literal time; strengthen latent-scale language.

**Source:** audit/lba_t0_audit.md

---

## 5. FIGURE 8 bridge sentence

**Old:**
> @fig-verification-rt shows the empirical verification-phase RT by condition, bridging the raw observed behavior to the LBA-modeled latent parameters.

**New:**
> @fig-verification-rt shows the empirical verification-phase RT by condition (mean ms from first target entry to selection). The condition ordering in this figure matches the latent t0 ordering in @fig-lba-t0, supporting the interpretation that gaze conditions impose a longer verification-phase burden than hand conditions.

**Reason:** Explicitly state alignment between empirical and model.

**Source:** audit/lba_empirical_alignment.md

---

## 6. INTERPRETATION — Modality effect

**Old:**
> **Modality effect on NDT:** Gaze conditions show higher t0 values (less negative: −1.41 to −0.97) than hand conditions (−3.01 to −2.85), consistent with a longer verification-phase duration for gaze interaction. The pattern is compatible with the Midas Touch account: gaze may require additional time for intent disambiguation before selection.

**New:**
> **Modality effect on t0:** Gaze conditions show higher t0 values (less negative: −1.41 to −0.97) than hand conditions (−3.01 to −2.85) on the latent scale, consistent with a longer verification-phase duration for gaze interaction. This ordering aligns with the empirical verification-phase RT (Figure 8). The pattern is compatible with the Midas Touch account: gaze may require additional time for intent disambiguation before selection.

**Reason:** Add empirical alignment; retain "latent scale."

**Source:** audit/lba_empirical_alignment.md

---

## 7. DISCUSSION — LBA sentence

**Old:**
> The cognitive modeling results sharpen that interpretation. In the LBA analysis, gaze showed higher non-decision time than hand, indicating a longer pre- or post-decisional component surrounding overt selection [@brown2008]. In the present task, the most plausible interpretation is that gaze required a longer verification phase before commitment.

**New:**
> The cognitive modeling results sharpen that interpretation. In the LBA analysis, gaze showed a larger verification-related latent offset than hand (t0 on the model's latent scale), indicating a longer pre- or post-decisional component surrounding overt selection [@brown2008]. This ordering was consistent with the empirical verification-phase RT. In the present task, the most plausible interpretation is that gaze required a longer verification phase before commitment.

**Reason:** Clarify latent scale; add empirical support.

**Source:** audit/lba_t0_audit.md, audit/lba_empirical_alignment.md
