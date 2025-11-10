# Hypotheses (Pre-Registered)

**Design.** Within-subjects 2×2: **Modality** (Hand-pointing vs Gaze-confirmation) × **UI Mode** (Static vs Adaptive).

**Primary DVs.** Movement Time (RT; correct trials, ms), Error (0/1; all trials), Throughput (bits/s = IDe/MT), NASA-TLX total (raw).

**Fitts metrics.** Effective width (W_e = 4.133 × SD(endpoint error)); Effective ID (ID_e = log₂(A/W_e + 1)).

---

### H1 — Modality (Speed/Efficiency)

**Statement.** Hand-pointing yields **faster movement time** and **higher throughput** than gaze-confirmation across difficulty levels.

**Quantified expectation.** ( RT_hand < RT_gaze ) (on the log scale); ( TP_hand > TP_gaze ).

**Planned test.** LMEM on log-RT with fixed effects Modality, UI Mode, (ID_e); planned EMM contrasts Hand vs Gaze. LMEM on Throughput analogously.

---

### H2 — UI Mode (Accuracy) and Non-Inferiority (Speed)

**Statement.** Adaptive UI **reduces error probability** versus Static **by a practically meaningful amount** **without** a meaningful speed penalty.

**Quantified expectation.** ≥ **15% relative** reduction in error (Static → Adaptive); **RT non-inferior within ±5%** (Adaptive vs Static).

**Planned test.** GLMM (logit) for Error with fixed effects Modality, UI Mode, (ID_e); report relative reduction. TOST on RT using EMMs with ±5% margin.

---

### H3 — Modality × UI Interaction (Modality-Specific Benefits)

**Statement.** The benefit of adaptation **depends on modality**:

- For **Hand**, **width-inflate** yields a **larger error-rate reduction** than Adaptive vs Static for Gaze.
- For **Gaze**, **declutter** yields **equal or greater RT reduction** than Adaptive vs Static for Hand.

**Planned test.** Modality × UI Mode interaction in LMEM (log-RT) and GLMM (Error); planned simple-effects contrasts within each modality.

---

### H4 — Cognitive Load (NASA-TLX)

**Statement.** Adaptive UI **reduces subjective workload** versus Static.

**Quantified expectation.** **≥ 10%** lower TLX total with Adaptive; largest TLX drop aligns with the modality that shows the bigger performance gain in H3.

**Planned test.** RM-ANOVA or LMEM on block-level TLX total with within-factors Modality and UI Mode; planned contrasts Adaptive vs Static.

---

### H5 — Fitts’ Law Validation and Modality Slopes

**Statement.** RT **increases with** (ID_e) for both modalities, and the **RT–(ID_e)** slope is **steeper for Gaze** than for Hand.

**Quantified expectation.** Positive (ID_e) slope; model fit (R²_marginal ≥ 0.80). ( β_IDe,gaze > β_IDe,hand ).

**Planned test.** LMEM: log-RT ~ (ID_e) × Modality (+ UI Mode); inspect main effect of (ID_e) and the (ID_e ×) Modality interaction; report per-modality slopes.

---

## Analysis Notes (summary)

- **Confounds controlled:** trial_number (practice), block_number (order/fatigue).
- **Exclusions (pre-registered):** RT < 150 ms or > 5000 ms, timeouts excluded from RT models; participant-level: >40% errors, <80% completion, fullscreen off, zoom ≠ 100%.
- **Success thresholds (interpretation):** Error ≥15% rel. drop; RT TOST ±5%; TP +0.2–0.3 bits/s; TLX ≥10–15% drop.

