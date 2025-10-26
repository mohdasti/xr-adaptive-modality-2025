# Study Preregistration

**Research Title**: Adaptive Modality Systems in Extended Reality: A Fitts's Law Investigation

**Preregistration Date**: [Fill in]

**Author(s)**: [Fill in]

**Institution**: [Fill in]

## Aims

### Research Question

How do adaptive UI interventions (declutter for gaze, width inflation for hand) affect performance and workload in dual-modality XR interfaces?

### Hypotheses

**H1**: Declutter interventions will improve reaction time (RT) and accuracy for gaze-based selection, particularly under high cognitive load (pressure condition).

**H2**: Width inflation will improve RT and accuracy for hand-based selection, with effects most pronounced under high cognitive load.

**H3**: Adaptive interventions will result in lower subjective workload (TLX) compared to non-adaptive conditions.

**H4**: Throughput (TP) will be higher in adaptive conditions, following Fitts's Law predictions with optimal target sizing.

## Design

### Experimental Design

- **Design**: 2 (Modality: hand vs. gaze) × 2 (Intervention: adaptive vs. control) × 2 (Pressure: ON vs. OFF) mixed design
- **Repeated Measures**: Modality, Intervention, Pressure
- **Between-Subjects**: None (all participants complete all conditions)
- **Counterbalancing**: Modality order counterbalanced; Intervention randomized within session

### Independent Variables

1. **Modality** (within-subjects)
   - Hand-like (direct pointing + click)
   - Gaze-like (hover + dwell/Space confirmation)

2. **Intervention** (within-subjects)
   - Adaptive (policy-driven UI changes)
   - Control (no UI adaptation)

3. **Pressure** (within-subjects)
   - ON (countdown timer, 10s timeout)
   - OFF (no time pressure)

4. **Aging Proxy** (optional)
   - ON (reduced contrast, blur)
   - OFF (normal vision)

### Dependent Variables

**Primary Outcomes:**
- Reaction time (RT, milliseconds)
- Accuracy (% correct)
- Throughput (TP = ID / MT, bits/s)
- Error types (miss, timeout, slip)

**Secondary Outcomes:**
- NASA-TLX scores (global workload, mental demand)
- Pupil diameter proxy (z-score, if camera enabled)
- Policy adaptation frequency
- Block completion time

### Stimuli

- **Task**: Fitts's Law target selection (ISO 9241-9 compliant)
- **Target Sizes**: Varied (W ∈ [30, 100] pixels)
- **Amplitudes**: Varied (A ∈ [100, 400] pixels)
- **IDs**: 1.7 (low), 3.3 (medium), 5.0 (high) bits
- **Trials per ID**: 5 trials per difficulty level
- **Target Positions**: 8 circular positions at fixed amplitude

## Outcomes

### Primary Outcomes

1. **Reaction Time (ms)**
   - Mean RT per condition
   - RT distribution (ex-Gaussian fit)
   - RT percentiles (p75, p95)

2. **Accuracy (%)**
   - Overall correct rate
   - Error rate by type (miss, timeout, slip)
   - Error burst frequency

3. **Throughput (bits/s)**
   - Mean TP per ID
   - TP × Modality interaction
   - TP × Intervention interaction

4. **Workload (TLX)**
   - Global workload scores
   - Mental demand scores

### Secondary Outcomes

1. **Adaptation Effectiveness**
   - Hysteresis count (N trials to trigger)
   - Policy trigger frequency
   - Action application success rate

2. **Individual Differences**
   - RT variability (CV)
   - Habituation effects
   - Strategy shifts

## Analyses

### Primary Analyses

**A1: Reaction Time Analysis**
- LME/M: `logRT ~ Modality * Intervention * Pressure + (1|pid)`
- Estimated marginal means (EMM) for condition comparisons
- Pairwise comparisons with Bonferroni correction

**A2: Accuracy Analysis**
- GLMM: `correct ~ Modality * Intervention * Pressure + (1|pid)`
- Odds ratios for intervention effects
- Error type frequency analysis

**A3: Throughput Analysis**
- LME/M: `TP ~ Modality * Intervention + (1|pid)`
- Slope analysis (TP vs ID) for Fitts's Law validation
- Condition-specific regression parameters

**A4: Workload Analysis**
- TLX scores aggregated per block
- Global workload and mental demand compared across conditions
- Correlation with RT and accuracy

### Secondary Analyses

**A5: Cognitive Model Fitting**
- Drift-diffusion model (DDM) parameters by condition
- Linear ballistic accumulator (LBA) comparison
- Ex-Gaussian tail analysis for RT distribution

**A6: Adaptation Effects**
- Pre/post intervention performance
- Hysteresis latency analysis
- Time-to-stabilization metrics

### Statistical Approach

- **Software**: R (lme4, lmerTest, emmeans)
- **Significance Level**: α = 0.05, two-tailed
- **Effect Size**: Cohen's d for mean differences
- **Missing Data**: Exclude incomplete blocks, report patterns

## Success Criteria

### Primary

1. **Main Effect**: Modality × Intervention interaction significant (p < 0.05)
2. **Effect Size**: Cohen's d ≥ 0.5 for intervention within modality
3. **TP Improvement**: Adaptive conditions show 10% higher throughput

### Secondary

1. **Workload Reduction**: TLX scores 15% lower in adaptive conditions
2. **Error Reduction**: 20% fewer errors (misses/timeouts) with adaptation
3. **Consistency**: Hysteresis triggers within 5±2 trials

### Power Analysis

- **Expected Effect Size**: d = 0.60 (medium-to-large)
- **Power**: 0.80
- **α**: 0.05 (two-tailed)
- **Required N**: 24 participants (12 per modality order)
- **Actual N**: [Fill in after data collection]

## Sample

### Inclusion Criteria

- Age 18-65 years
- Normal or corrected-to-normal vision
- Right-handed (for consistency with pointing hand)
- Fluent in English (for instructions)
- Own laptop/computer for study access

### Exclusion Criteria

- Severe motor impairment affecting pointing
- Color blindness (for UI elements)
- Neurological conditions affecting movement
- Current or recent participation in similar studies (within 3 months)

### Recruitment

- **Method**: [Fill in: Email, lab participant pool, online recruitment, etc.]
- **Location**: Remote online study
- **Incentive**: [Fill in: Course credit, monetary compensation, etc.]
- **Duration**: [Fill in after pilot testing]

### Sample Size

- **Target N**: 24 participants
- **Actual N**: [Fill in after data collection]
- **Dropouts**: [Fill in]

## Anonymization & Data Handling

- **PID Hashing**: SHA256 with salt (participant IDs anonymized)
- **Data Retention**: ≤90 days (after study completion and analysis)
- **Storage**: Local processing only, no cloud storage
- **Export Format**: CSV (anonymized)
- **Camera Data**: No video frames stored (only scalar z-score)

## Exclusions

### Trial-Level Exclusions

- RT < 100ms (anticipation)
- RT > 10,000ms (timeout error)
- Erroneous click positions (outside task area)

### Participant-Level Exclusions

- <50% accuracy across all trials (suggests non-compliance)
- Missing >3 complete blocks
- Technical failures (browser crash, data loss)

### Planned Exclusions

Document all exclusions with rationale and N affected.

## Deviations Policy

### Minor Deviations (In-Progress)

- Threshold adjustments (RT bounds, timeout values)
- UI refinements (non-functional styling)
- Bug fixes (do not affect outcomes)

### Major Deviations (Report)

- Protocol changes affecting outcomes
- Additional conditions/measures
- Statistical analysis modifications

### Reporting Timeline

- All deviations documented in study log
- Major deviations reported in manuscript
- Transparent disclosure of all changes

## Timeline

- **Preregistration**: [Date]
- **Data Collection Start**: [Date]
- **Data Collection End**: [Date]
- **Analysis Completion**: [Date]
- **Manuscript Submission**: [Date]

## Author Contributions

[Fill in contributions for each author]

## References

- Fitts, P. M. (1954). The information capacity of the human motor system in controlling the amplitude of movement. Journal of Experimental Psychology.
- ISO 9241-9 (2000). Ergonomic requirements for office work with visual display terminals.
- [Additional references]

