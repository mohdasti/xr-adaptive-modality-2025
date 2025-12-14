# Power Analysis Request: XR Adaptive Modality Experiment

## Context and Overview

I am conducting a **within-subjects experimental study** investigating adaptive input modality systems in Extended Reality (XR). The experiment uses a **2×2×2 factorial design** with three within-subjects factors:

- **Modality**: 2 levels (hand, gaze)
- **UI Mode**: 2 levels (static, adaptive)  
- **Pressure**: 2 levels (pressure ON, pressure OFF)

**Target sample size**: N=48 participants (current interim: N=23)

**Design considerations**:
- All participants experience all 8 conditions (complete factorial)
- Counterbalanced using Williams Latin square (8 sequences)
- Multiple trials per condition per participant
- ISO 9241-9 compliant Fitts' Law pointing task
- Data aggregated at participant × condition level for some analyses, trial-level for others

## Research Questions

**RQ1 (Performance)**: Does a context-aware adaptive system yield higher Throughput (TP) than static unimodal systems?

**RQ2 (Workload)**: Can adaptive modality switching significantly reduce "Physical Demand" and "Frustration" (NASA-TLX) compared to traditional interaction?

**RQ3 (Adaptation)**: Do adaptive interventions (declutter, width inflation) significantly improve performance and reduce workload compared to non-adaptive conditions?

## Statistical Models and Analyses

### Analysis 1: Throughput (TP) - Primary Performance Metric

**Research Question**: RQ1 (Performance), RQ3 (Adaptation)

**Dependent Variable**: Throughput (TP) in bits/second
- Continuous, bounded positive (typically 0-10 bits/s)
- Computed using ISO 9241-9: TP = IDe / MT, where IDe = log2(A/We + 1)
- Aggregated at participant × modality × ui_mode × pressure × A × W level
- Then further aggregated to participant × modality × ui_mode × pressure level for modeling

**Model Specification**:
```
TP ~ modality × ui_mode × pressure + (1 | pid)
```
- **Model Type**: Linear Mixed-Effects Model (LMM) using `lmer()`
- **Fixed Effects**: modality, ui_mode, pressure, all two-way interactions, three-way interaction
- **Random Effects**: Random intercept per participant `(1 | pid)`
- **Distribution**: Gaussian (continuous outcome)
- **Link Function**: Identity

**Key Hypotheses**:
- Main effect of modality: hand > gaze (expected large effect, dz ≈ 0.8-1.0)
- Main effect of ui_mode: adaptive > static (expected medium effect, dz ≈ 0.4-0.6)
- Modality × UI Mode interaction: adaptive benefit larger for gaze than hand
- Main effect of pressure: pressure ON > pressure OFF (expected small-medium, dz ≈ 0.3-0.5)
- Three-way interaction: exploratory, expected small if any

**Planned Contrasts**:
- Adaptive vs Static (collapsed over modality and pressure)
- Hand vs Gaze (collapsed over ui_mode and pressure)
- Adaptive × Modality interaction contrasts
- All with Holm-adjusted p-values via `emmeans::pairs()`

**Effect Size Expectations**:
- Modality effect: Large (Cohen's d ≈ 0.8-1.0 based on pilot data)
- UI Mode effect: Medium (Cohen's d ≈ 0.4-0.6, this is the key hypothesis)
- Pressure effect: Small-medium (Cohen's d ≈ 0.3-0.5)
- Interactions: Small-medium if present

---

### Analysis 2: Movement Time (RT) - Complementary Performance Metric

**Research Question**: RQ1 (Performance), RQ3 (Adaptation)

**Dependent Variable**: Movement Time (RT) in milliseconds
- Continuous, positive, right-skewed
- Log-transformed for normality: `log(rt_ms)` or `log_rt`
- Trial-level data (not aggregated)

**Model Specification**:
```
log(rt_ms) ~ modality × ui_mode × pressure + (1 | pid)
```
- **Model Type**: Linear Mixed-Effects Model (LMM) using `lmer()`
- **Fixed Effects**: modality, ui_mode, pressure, all two-way interactions, three-way interaction
- **Random Effects**: Random intercept per participant `(1 | pid)`
- **Distribution**: Gaussian (after log transformation)
- **Link Function**: Identity

**Key Hypotheses**:
- Main effect of modality: hand < gaze (faster for hand, expected large effect)
- Main effect of ui_mode: adaptive < static (expected medium effect)
- Main effect of pressure: pressure ON < pressure OFF (expected small-medium)
- Should mirror throughput results (TP = ID/RT, so faster RT → higher TP)

**Planned Contrasts**:
- Same as Analysis 1 (Adaptive vs Static, Hand vs Gaze, interactions)

**Effect Size Expectations**:
- Similar to Analysis 1 (RT and TP are mathematically related)

---

### Analysis 3: Error Rate - Accuracy Metric

**Research Question**: RQ1 (Performance), RQ3 (Adaptation)

**Dependent Variable**: Error (binary: 0 = correct, 1 = error)
- Binary outcome per trial
- Includes misses, timeouts, slips
- Trial-level data

**Model Specification**:
```
error ~ modality × ui_mode × pressure + (1 | pid)
```
- **Model Type**: Generalized Linear Mixed-Effects Model (GLMM) using `glmer()`
- **Family**: Binomial with logit link
- **Fixed Effects**: modality, ui_mode, pressure, all two-way interactions, three-way interaction
- **Random Effects**: Random intercept per participant `(1 | pid)`

**Key Hypotheses**:
- Main effect of modality: gaze > hand (more errors for gaze, expected medium effect)
- Main effect of ui_mode: adaptive < static (fewer errors, expected small-medium)
- Low overall error rate (~14% in interim data)
- Errors concentrated in gaze conditions

**Planned Contrasts**:
- Adaptive vs Static error rates (odds ratios)
- Hand vs Gaze error rates (odds ratios)
- Interaction contrasts

**Effect Size Expectations**:
- Modality effect: Medium (OR ≈ 2-3 for gaze vs hand)
- UI Mode effect: Small-medium (OR ≈ 0.7-0.9 for adaptive vs static)

**Note**: This analysis may be underpowered if error rates are very low (<10%). Guardrails check global error rate (1% < error_rate < 99%) before fitting.

---

### Analysis 4: Fitts' Law Regression - ID Effects

**Research Question**: RQ1 (Performance), exploratory

**Dependent Variable**: Movement Time (RT) in seconds

**Model Specification**:
```
RT ~ ID + modality + ui_mode + modality:ID + ui_mode:ID
```
- **Model Type**: Linear Mixed-Effects Model (LMM) using `lmer()`
- **Fixed Effects**: ID (continuous, Index of Difficulty), modality, ui_mode, modality × ID, ui_mode × ID
- **Random Effects**: Random intercept per participant, possibly random slopes `(1 + ID | pid)`
- **Distribution**: Gaussian (possibly log-transformed RT)

**Key Hypotheses**:
- Main effect of ID: RT increases with ID (expected large effect, slope b > 0)
- Modality × ID interaction: different slopes for hand vs gaze
- UI Mode × ID interaction: different slopes for adaptive vs static (exploratory)

**Effect Size Expectations**:
- ID effect: Very large (R² typically > 0.7 for Fitts' Law)
- Modality × ID: Medium (different slopes)
- UI Mode × ID: Small-medium if present

**Note**: This is a validation/descriptive analysis. Primary RQ focuses on TP differences, not ID slopes.

---

### Analysis 5: Effective Width (We) - Spatial Accuracy

**Research Question**: RQ1 (Performance), exploratory

**Dependent Variable**: Effective Width (We) in pixels
- Continuous, positive
- Computed as We = 4.133 × SD(projected_error_px) per condition
- Aggregated at participant × modality × ui_mode × pressure level

**Model Specification**:
```
We ~ modality × ui_mode × pressure + (1 | pid)
```
- **Model Type**: Linear Mixed-Effects Model (LMM) using `lmer()`
- **Fixed Effects**: modality, ui_mode, pressure, all interactions
- **Random Effects**: Random intercept per participant `(1 | pid)`

**Key Hypotheses**:
- Main effect of modality: gaze > hand (larger We for gaze, expected medium effect)
- Main effect of ui_mode: adaptive < static (smaller We, expected small-medium)
- Lower We indicates better spatial accuracy

**Effect Size Expectations**:
- Modality effect: Medium (Cohen's d ≈ 0.5-0.7)
- UI Mode effect: Small-medium (Cohen's d ≈ 0.3-0.5)

---

### Analysis 6: Target Re-entries - Control Stability

**Research Question**: RQ3 (Adaptation), exploratory

**Dependent Variable**: Target re-entry count (count of times cursor enters/exits target)
- Count data (integer, 0+)
- Aggregated at participant × modality × ui_mode × pressure level

**Model Specification**:
```
reentries ~ modality × ui_mode × pressure + (1 | pid)
```
- **Model Type**: Linear Mixed-Effects Model (LMM) using `lmer()`
- **Fixed Effects**: modality, ui_mode, pressure, all interactions
- **Random Effects**: Random intercept per participant `(1 | pid)`
- **Alternative**: Could use Poisson GLMM if distribution is heavily right-skewed

**Key Hypotheses**:
- Main effect of modality: gaze > hand (more re-entries for gaze, expected medium)
- Main effect of ui_mode: adaptive < static (fewer re-entries, expected small-medium)
- Proxy for control stability (Midas Touch problem in gaze)

**Effect Size Expectations**:
- Modality effect: Medium (Cohen's d ≈ 0.5-0.7)
- UI Mode effect: Small-medium (Cohen's d ≈ 0.3-0.5)

---

### Analysis 7: NASA-TLX Workload - Subjective Measures

**Research Question**: RQ2 (Workload), RQ3 (Adaptation)

**Dependent Variable**: NASA-TLX scores (0-100 scale)
- Continuous, bounded [0, 100]
- Six subscales: Mental Demand, Physical Demand, Temporal Demand, Performance, Effort, Frustration
- Also analyzed as overall TLX (mean of all subscales)
- Block-level data (constant within blocks, varies between blocks)

**Model Specification**:
```
Overall_TLX ~ modality × ui_mode + (1 | pid)
```
- **Model Type**: Linear Mixed-Effects Model (LMM) using `lmer()`
- **Fixed Effects**: modality, ui_mode (pressure typically not included in TLX grouping)
- **Random Effects**: Random intercept per participant `(1 | pid)`
- **Alternative**: Could include pressure as factor if block-level data supports it

**Key Hypotheses**:
- Main effect of modality: gaze > hand (higher workload for gaze, expected medium)
- Main effect of ui_mode: adaptive < static (lower workload, expected medium)
- Modality × UI Mode interaction: adaptive reduces workload more for gaze
- Focus on Physical Demand and Frustration subscales per RQ2

**Planned Analyses**:
- Overall TLX by modality × ui_mode
- Individual subscales (especially Physical Demand, Frustration)
- Contrasts: Adaptive vs Static, Hand vs Gaze

**Effect Size Expectations**:
- Modality effect: Medium (Cohen's d ≈ 0.4-0.6)
- UI Mode effect: Medium (Cohen's d ≈ 0.4-0.6, key hypothesis)
- Expected reduction: 15% lower TLX in adaptive conditions (per preregistration success criteria)

---

### Analysis 8: Hover/Dwell Time - Gaze-Specific Metric

**Research Question**: RQ3 (Adaptation), exploratory

**Dependent Variable**: Hover/dwell time in milliseconds
- Continuous, positive, right-skewed
- Only for gaze modality trials
- Trial-level data

**Model Specification**:
```
hover_ms ~ ui_mode × pressure + (1 | pid)
```
- **Model Type**: Linear Mixed-Effects Model (LMM) using `lmer()`
- **Fixed Effects**: ui_mode, pressure, ui_mode × pressure
- **Random Effects**: Random intercept per participant `(1 | pid)`
- **Filter**: Only gaze trials

**Key Hypotheses**:
- Main effect of ui_mode: adaptive < static (shorter dwell time, expected small-medium)
- Relates to "Midas Touch" problem reduction

**Effect Size Expectations**:
- UI Mode effect: Small-medium (Cohen's d ≈ 0.3-0.5)

---

### Analysis 9: Path Length / Drag Distance - Efficiency Metric

**Research Question**: RQ1 (Performance), exploratory

**Dependent Variable**: Path length (computed from trajectory) or drag_distance
- Continuous, positive
- Ratio to straight-line distance (A) computed: ratio = path_length / A (≥1)
- Trial-level data, filtered for correct trials with usable trajectories

**Model Specification**:
```
ratio ~ modality × ui_mode × pressure + (1 | pid)
```
- **Model Type**: Linear Mixed-Effects Model (LMM) using `lmer()`
- **Fixed Effects**: modality, ui_mode, pressure, all interactions
- **Random Effects**: Random intercept per participant `(1 | pid)`
- **Filter**: Requires `traj_usable == TRUE`

**Key Hypotheses**:
- Main effect of modality: gaze > hand (longer paths for gaze, expected medium)
- Main effect of ui_mode: adaptive < static (shorter paths, expected small-medium)

**Effect Size Expectations**:
- Modality effect: Medium (Cohen's d ≈ 0.5-0.7)
- UI Mode effect: Small-medium (Cohen's d ≈ 0.3-0.5)

**Note**: This analysis requires trajectory data, which may not be available for all participants.

---

### Analysis 10: Submovement Count - Movement Quality

**Research Question**: RQ3 (Adaptation), exploratory (planned control theory analysis)

**Dependent Variable**: Submovement count (number of velocity peaks/corrections)
- Count data (integer, 0+)
- Currently using pre-computed `submovement_count`
- Future: will use trajectory-based computation

**Model Specification**:
```
submovement_count ~ modality × ui_mode × pressure + (1 | pid)
```
- **Model Type**: Linear Mixed-Effects Model (LMM) or Poisson GLMM
- **Fixed Effects**: modality, ui_mode, pressure, all interactions
- **Random Effects**: Random intercept per participant `(1 | pid)`

**Key Hypotheses**:
- Main effect of modality: gaze > hand (more submovements, expected medium)
- Main effect of ui_mode: adaptive < static (fewer submovements, expected small-medium)
- Proxy for control loop efficiency

**Effect Size Expectations**:
- Modality effect: Medium (Cohen's d ≈ 0.5-0.7)
- UI Mode effect: Small-medium (Cohen's d ≈ 0.3-0.5)

**Status**: Limited data availability (N=3-16 participants with submovement data in interim sample). This is exploratory/engineering diagnostic, not primary inferential analysis.

---

### Analysis 11: Verification Time - Decision Phase

**Research Question**: RQ3 (Adaptation), exploratory

**Dependent Variable**: Verification time (time from target entry to selection) in milliseconds
- Continuous, positive
- Only for correct trials where target was entered
- Trial-level data

**Model Specification**:
```
verification_time_ms ~ modality × ui_mode × pressure + (1 | pid)
```
- **Model Type**: Linear Mixed-Effects Model (LMM) using `lmer()`
- **Fixed Effects**: modality, ui_mode, pressure, all interactions
- **Random Effects**: Random intercept per participant `(1 | pid)`

**Key Hypotheses**:
- Main effect of modality: gaze > hand (longer verification for gaze, expected medium)
- Main effect of ui_mode: adaptive < static (shorter verification, expected small-medium)
- Relates to decision caution (future LBA analysis will model this)

**Effect Size Expectations**:
- Modality effect: Medium (Cohen's d ≈ 0.5-0.7)
- UI Mode effect: Small-medium (Cohen's d ≈ 0.3-0.5)

---

## Planned Advanced Analyses (Not Yet Implemented)

### Analysis 12: Linear Ballistic Accumulator (LBA) - Decision Modeling

**Research Question**: RQ3 (Adaptation), advanced cognitive modeling

**Dependent Variable**: Verification-time RTs (time from target entry to selection)
- Continuous, positive
- Only correct trials

**Model Specification**:
- Hierarchical LBA model
- Parameters: drift rate (v), threshold (b), starting point (A), non-decision time (t0)
- Fixed effects on parameters: modality, ui_mode
- Random effects: participant-level parameter variation

**Key Hypotheses**:
- Adaptive conditions show lower threshold (b), indicating less caution needed
- Modality differences in drift rates

**Status**: Planned for N=48. Requires sufficient trial counts per condition for stable parameter estimation. Will not be implemented at interim N=23.

**Effect Size Expectations**: To be determined through simulation-based power analysis.

---

### Analysis 13: Control Theory - Trajectory-Based Kinematics

**Research Question**: RQ3 (Adaptation), advanced movement analysis

**Dependent Variables**:
- Velocity profiles
- Jerk (third derivative of position)
- Duration-normalized jerk
- Primary vs corrective movement phases

**Model Specification**:
- Various mixed-effects models depending on specific metric
- Fixed effects: modality, ui_mode, pressure
- Random effects: participant-level variation

**Key Hypotheses**:
- Adaptive conditions reduce corrective movements
- Modality differences in movement smoothness

**Status**: Planned for N=48. Requires complete trajectory data (JSON, ~60fps). Currently limited trajectory data availability.

**Effect Size Expectations**: To be determined.

---

## Design Details

### Experimental Design
- **Type**: Within-subjects, complete factorial
- **Factors**: 2 (modality) × 2 (ui_mode) × 2 (pressure) = 8 conditions
- **Counterbalancing**: Williams Latin square (8 sequences)
- **Target Sample Size**: N=48 (6 complete Williams blocks)
- **Current Interim**: N=23

### Data Structure

**Trial-level data** (for RT, errors, path length):
- Multiple trials per participant per condition
- Typical: ~24-30 trials per condition per participant (varies by ID level)
- Total: ~192-240 trials per participant

**Participant × condition level data** (for TP, We):
- One observation per participant per condition
- TP aggregated from multiple trials per condition
- 8 conditions per participant

**Block-level data** (for TLX):
- One observation per participant per block
- Blocks correspond to condition combinations
- TLX collected after each block

### Data Aggregation Strategy

**Throughput (TP)**:
1. Compute We per participant × modality × ui_mode × pressure × A × W
2. Compute TP per participant × modality × ui_mode × pressure × A × W
3. Model at participant × modality × ui_mode × pressure level

**Movement Time (RT)**:
- Modeled at trial level (not aggregated)
- Log-transformed for normality

**Error Rate**:
- Modeled at trial level (binary outcome)

**TLX**:
- Aggregated at participant × modality × ui_mode level (or participant × block if pressure included)

---

## Power Analysis Request

For each analysis listed above (Analyses 1-11, and optionally 12-13), please provide:

1. **Required sample size (N)** to achieve:
   - Power = 0.80 (standard)
   - α = 0.05 (two-tailed, or one-tailed if appropriate)
   - For the **primary effect of interest** (typically ui_mode main effect or modality × ui_mode interaction)

2. **Required sample size for secondary effects**:
   - Modality main effect (expected large)
   - Pressure main effect (expected small-medium)
   - Two-way interactions (expected small-medium)
   - Three-way interaction (exploratory, expected small if any)

3. **Minimum detectable effect size (MDE)** given N=48:
   - What effect size can we detect with 80% power at N=48?
   - What effect size can we detect with 80% power at N=23 (interim)?

4. **Recommendations**:
   - Which analyses are adequately powered at N=48?
   - Which analyses are underpowered and should be treated as exploratory?
   - Which analyses require larger N and should wait until after full data collection?

5. **Trial-level vs aggregated considerations**:
   - How does aggregation strategy (trial-level vs participant × condition level) affect power?
   - For trial-level analyses (RT, errors), does having multiple trials per condition increase effective power?
   - How should random effects structure affect sample size calculations?

6. **Mixed-effects model power**:
   - Standard power analysis assumes independent observations, but mixed-effects models have correlated observations within participants
   - How should intraclass correlation (ICC) affect sample size calculations?
   - What ICC assumptions are reasonable for these types of data (RT, TP, errors)?

7. **Multiple comparisons correction**:
   - We use Holm correction for contrasts
   - Does this affect required sample size, or just interpretation thresholds?

8. **Interaction effects**:
   - Three-way interactions are likely underpowered
   - What N would be needed to detect medium three-way interactions (dz ≈ 0.5) with 80% power?
   - Should three-way interactions be treated as exploratory regardless of N?

Please provide both:
- **Conservative estimates** (assuming lower effect sizes, higher ICC, more stringent corrections)
- **Optimistic estimates** (assuming higher effect sizes, lower ICC)
- **Realistic estimates** (based on typical HCI/motor control effect sizes and ICC values)

## Current Interim Status

- **Current N**: 23 participants
- **Target N**: 48 participants
- **Goal**: Determine if N=48 is sufficient for primary analyses, or if we need larger N
- **Priority**: Analyses 1-3 (TP, RT, Error) and Analysis 7 (TLX) are highest priority

Thank you for your detailed power analysis recommendations!
