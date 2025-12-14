# Power Analysis Expert Response: LBA & Control Theory

**Date:** December 8, 2025  
**Source:** Expert consultation on power analysis for secondary analyses  
**Status:** ✅ Recommendations received

---

## Executive Summary

**Key Finding:** Your current **N=48 is sufficient** for medium main effects in both LBA and control theory analyses, but **interactions will be underpowered** unless they're unusually large. The main constraint for LBA is **trial count per condition** and **low error rates**, not sample size.

**Recommendation:** 
- ✅ Keep N=48
- ✅ Use hierarchical LBA modeling (not per-condition per-person fits)
- ⚠️ Treat interactions as exploratory
- ✅ N=48 is sufficient for control theory main effects

---

## 1. Minimum N for Medium Effects (dz = 0.50)

### Within-Subjects Contrasts

For **within-subjects** contrasts (e.g., Adaptive vs Static), using **paired/within d (dz)**:

- **Minimum N ≈ 34** participants to detect **dz = 0.50** for a single planned within-sub contrast
- **Your N=48**: Powered at ≈0.80 for effects around **dz ≈ 0.41** (and ≈0.92 for dz=0.50)

**Applies to:**
- LBA threshold contrast (Adaptive–Static on b–A)
- LBA drift contrast (Gaze–Hand on v)
- Submovement count (Adaptive–Static)
- Primary movement duration (Gaze–Hand)
- Smoothness metrics (Adaptive–Static)

### Interactions Are Underpowered

**3-way factorial interactions** in HCI/motor work are often **smaller than main effects**:

- dz = 0.40 → N ≈ 52
- dz = 0.35 → N ≈ 67
- dz = 0.30 → N ≈ 90

**With N=48, you're typically underpowered for small-to-medium interactions** unless they're unusually strong.

**Recommendation:** Treat interactions as **exploratory** and interpret cautiously.

---

## 2. LBA-Specific Considerations

### The Real Constraint: Trials + Error Rate

Even with sufficient N, LBA models can fail when:
1. **Cell-level trial counts are small** (~24 trials/cell in your design)
2. **Error rates are too low** (you have ~3-5% errors, which is problematic)

### Key Findings from Methods Papers

1. **Parameter Recovery:**
   - **~150 data points per condition** = practical minimum for unbiased estimation
   - **80 data points** = larger bias and convergence issues
   - **Your design:** ~24 trials/cell = **too thin for per-condition per-person parameters**

2. **Error Rate & Identifiability:**
   - **Target: 15-35% errors** for strong identifiability
   - **<15% errors** with small trial numbers = compromised identifiability
   - **Your error rate: 3-5%** = **exactly the danger zone**

### What This Means for Your Design

**If fitting separate LBA parameters per participant per condition:**
- ❌ **24 trials/cell is too thin** for stable person-level condition parameters
- ❌ Will see unstable thresholds/drifts and high parameter trade-offs

**If using hierarchical LBA with regression on factors (RECOMMENDED):**
- ✅ **Can work with N=48** because you're estimating structured effects with partial pooling
- ✅ Hierarchical approaches stabilize estimation with limited per-subject data

### Practical Recommendations for LBA

1. **Use hierarchical LBA with predictors on parameters:**
   - Let **(b–A)** depend on **UI mode**, **pressure**, and their interaction
   - Let **v** depend on **modality**, and optionally interactions if theoretically justified
   - This aligns with "vary only what theory predicts" guidance

2. **Do identifiability sanity check early:**
   - Fit hierarchical model on first ~15-20 participants
   - Look for: divergent transitions, extreme posteriors, wide credible intervals, threshold–drift tradeoffs

3. **If identifiability is bad, add trials (not participants):**
   - Most efficient fix: increase trials in conditions driving key contrasts
   - Both participants AND trials increase power/precision for latent parameters

### Direct Answers (LBA)

- **Q1a (threshold b–A, dz=0.50):** N≈34 minimum; **N=48 is sufficient** for medium main effects
- **Q1b (drift v, dz=0.50):** Same: N≈34 minimum; **N=48 is sufficient** for medium main effects
- **Q1c (typical effect sizes):** No clean "benchmark d" for adaptive-vs-static threshold or gaze-vs-hand drift in HCI XR tasks. Use **simulation-based power** targeted to your exact task statistics
- **Q1d (special requirements):** Yes: **trial count and error rate** are special requirements; low errors can break identifiability
- **Q1e (is N=48 & 24/cell sufficient?):** 
  - ✅ **Sufficient for exploratory hierarchical LBA main-effect questions**
  - ❌ **Not sufficient** for clean, per-condition per-person parameter estimation
  - ⚠️ **Interactions will be underpowered** unless large

---

## 3. Control Theory / Submovement Metrics

### Minimum N (Medium Effect)

- **Q2a (submovement count, dz=0.50):** N≈34 minimum; **N=48 is sufficient** for medium main effects

### Typical Effect Sizes

These metrics can be **very sensitive** to task constraints:

- **Submovement count:** Can show **very large effects** (partial η² up to **.95**) under space–time constraint manipulations
- **Smoothness metrics:** Can show **large standardized differences** (Cohen's d often >1)
- **For XR adaptive UI:** Expect anything from **small to large** depending on whether adaptation actually reduces corrective control loops

**Recommendation:** Treat literature numbers as "plausible ranges," not priors you can bank on.

### Does 60fps Increase Power?

**No, not in the way people hope:**

- The **independent unit** for inference is still the participant (and sometimes the trial), not each 60Hz sample
- 60fps mainly reduces **measurement noise** and enables **better feature extraction**
- It improves **precision of the DV**, not your effective N

### Is N=48 Sufficient for Control Theory?

**Yes for main effects, usually.** You have:
- N=48 participants
- ~24 trials/cell → strong within-sub averaging if needed
- High-resolution trajectories

**Bigger risks are analysis validity, not raw power:**
- How you define submovements (peak detection thresholds, filtering)
- Whether smoothness metrics are duration-normalized and comparable (jerk is very duration-sensitive)
- Multiple comparisons across many derived kinematic features

---

## 4. Do You Need Separate Power Analysis?

### Q3a: Does Primary Power Transfer?

**No:** Primary-analysis power does **not automatically transfer** to model parameters or kinematics because:
- Effect sizes can be smaller
- Parameter estimation adds uncertainty
- You may test more contrasts

### Q3b: What to Do (Data Collection in Progress)

**Don't do "post-hoc observed power"** - it's a known fallacy.

**Do one of these instead:**
1. **Design sensitivity / minimum detectable effect (MDE)** at your fixed N=48
2. **Simulation-based power** for your exact LBA/control pipeline (best option)
3. Report **effect sizes + confidence/credible intervals** and treat nulls cautiously

### Q3c: Best Practices (Exploratory)

1. **Pre-label as exploratory** (or "secondary, not powered for interactions")
2. **Report:**
   - Estimated effects (and uncertainty)
   - Model fit diagnostics
   - Robustness checks (alternative smoothness metric; alternative submovement detector)
3. **For multiplicity:**
   - If running many metrics/parameters, control **FDR** (Benjamini–Hochberg)
   - Or use multilevel model that shrinks estimates

### Q3d: Key Methodological References

**LBA Parameter Recovery:**
- Visser & Poessé: 150-ish datapoints = practical minimum

**Error Rate & Identifiability:**
- Lüken et al. (PMC): 15-35% error range; low errors hurt identifiability

**Smoothness Metrics:**
- Gulde et al. (PubMed): Large ds; note duration-control caveat

**Submovement Sensitivity:**
- Hsieh et al. (PLOS One): Huge effects of constraint manipulations

**Why Not Post-Hoc Power:**
- Hoenig & Heisey: "Abuse of power" paper

**Computational Modeling Power:**
- Piray et al. (Nature): Simulation-based approaches

---

## Bottom Line Recommendations

### 1. Do NOT Expand Beyond N=48 Just for LBA

If LBA struggles, it will be because of **low errors + too few trials per cell**, not because N is 48 instead of 60.

### 2. Treat LBA Interactions as Exploratory

With N=48, you're in good shape for **medium main effects**, shaky for **small interactions**.

### 3. If You Can Change Anything Mid-Collection, Add Trials Selectively

Adding trials (especially in conditions driving primary LBA contrasts) is often the most efficient way to stabilize latent parameters.

### 4. For Control Theory, N=48 is Generally Sufficient

Focus on **validity + multiplicity**:
- Use defensible smoothness measures
- Control for duration
- Pre-specify a small set of kinematic outcomes
- FDR the rest

---

## Action Items for Your Analysis

### LBA Analysis (Section 16 in Report.qmd)

1. **Use hierarchical LBA modeling:**
   - Model parameters as functions of experimental factors
   - Don't fit separate parameters per condition per person

2. **Early identifiability check:**
   - Fit on first ~15-20 participants
   - Check for convergence issues, extreme posteriors

3. **Report as exploratory:**
   - Label interactions as exploratory
   - Report effect sizes + credible intervals
   - Interpret nulls cautiously

### Control Theory Analysis (Section 17 in Report.qmd)

1. **Focus on validity:**
   - Use duration-normalized smoothness metrics
   - Document submovement detection algorithm
   - Control for multiple comparisons (FDR)

2. **Pre-specify outcomes:**
   - Don't test every possible kinematic metric
   - Focus on theoretically motivated measures

3. **Report as exploratory:**
   - Main effects: N=48 is sufficient
   - Interactions: Underpowered, interpret cautiously

---

## Updated Power Analysis Summary

| Analysis Type | Main Effects | Interactions | Recommendation |
|---------------|--------------|-------------|----------------|
| **LBA (hierarchical)** | ✅ N=48 sufficient (dz≈0.41) | ⚠️ Underpowered (dz<0.40) | Use hierarchical modeling; treat interactions as exploratory |
| **Control Theory** | ✅ N=48 sufficient (dz≈0.41) | ⚠️ Underpowered (dz<0.40) | Focus on validity; FDR for multiple metrics |
| **Primary Analyses** | ✅ N=48 sufficient (dz≈0.60) | ✅ Adequate | Already powered |

**Key Constraint for LBA:** Trial count (~24/cell) and error rate (3-5%) are more limiting than N=48.






