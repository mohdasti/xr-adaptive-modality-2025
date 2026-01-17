# Case Study Review Prompt for External LLM Feedback

**Purpose:** Request comprehensive feedback on a UX Research case study for XR interaction design, including methodological rigor, statistical accuracy, clarity, and audience appropriateness (recruiters, tech companies like Meta/Apple Vision Pro).

**Context:** This is a pre-print stage review before finalizing a case study for job applications and potential arXiv submission.

---

## My Research Project Overview

### Study Title
**"Adaptive Modality Systems in Extended Reality: A User-Centered UX Research Investigation"**

### Research Domain
Human-Computer Interaction (HCI) | Extended Reality (XR) | User Experience Research | Adaptive Interfaces

### Research Goal
Investigate whether context-aware adaptive systems can dynamically optimize input modality (hand vs. gaze) and UI interventions to improve user experience and reduce workload in XR interfaces.

---

## Experimental Design

### Design Type
**2×2×2 within-subjects factorial design** (complete factorial, all participants experience all conditions)

### Independent Variables (All Within-Subjects)

1. **Modality** (2 levels):
   - **Hand:** Mouse-driven pointing with click confirmation (simulates controller-based interaction)
   - **Gaze:** Mouse-driven gaze proxy with Gaussian jitter, saccadic suppression, and dwell/spacebar confirmation (simulates eye-tracking interaction)

2. **UI Mode** (2 levels):
   - **Static:** No adaptation, baseline interface
   - **Adaptive:** Policy-driven UI adaptations based on performance degradation

3. **Pressure** (2 levels):
   - **Pressure OFF (0):** No time pressure, relaxed conditions
   - **Pressure ON (1):** 10-second timeout countdown, high cognitive load

### Counterbalancing
- **Williams Latin Square** with 8 distinct sequences
- Modality blocks counterbalanced across participants
- UI mode and pressure randomized within blocks

### Sample Size
- **Current dataset:** N=80 participants total
- **Hand modality analyses:** N=75 participants (mouse users only)
- **Gaze modality analyses:** N=80 participants (75 mouse + 5 trackpad users)
- **Unbalanced design rationale:** Hand modality requires device standardization (mouse only); gaze modality uses simulation-normalized input (device-independent after simulation)

### Data Collection
- **Remote web-based study** (React 18 + TypeScript, deployed on Vercel)
- **~192 trials per participant** (96 per modality, ~24 per condition)
- **ISO 9241-9 compliant** Fitts' Law pointing task
- **Trials per condition:** ~24 trials per participant × condition combination

---

## Research Questions & Hypotheses

### Research Questions

**RQ1 (Performance):** Does a context-aware adaptive system yield higher Throughput (TP) than static unimodal systems?

**RQ2 (Workload):** Can adaptive modality switching significantly reduce "Physical Demand" and "Frustration" (NASA-TLX) compared to traditional interaction?

**RQ3 (Adaptation):** Do adaptive interventions (declutter, width inflation) significantly improve performance and reduce workload compared to non-adaptive conditions?

### Pre-Registered Hypotheses

**H1 (Modality):** Hand yields faster movement time and higher throughput than gaze-confirm; hand may incur slightly higher error on hard targets.

**H2 (Adaptation - Equivalence):** Adaptive UI produces ≥15% relative error reduction vs Static while not exceeding a 5% RT penalty (TOST equivalence on log-RT with ±5% bounds).

**H3 (Modality × Adaptation):** Width-inflate (hand) yields larger error reduction than declutter; declutter (gaze) yields greater RT improvement than width-inflate. Throughput improves in both.

**H4 (Fitts Law Validation):** With effective width (We) and effective ID (IDe), Fitts's Law holds (R² ≥ .80), and gaze shows a steeper slope than hand.

**H5 (Workload):** Adaptive UI reduces NASA-TLX total by ≥10–15%; the larger TLX drop occurs in the modality that shows the larger performance gain in H3.

### Directional Goals (Not Strict Success Criteria)
- Reduce error patterns that create frustration (especially in gaze)
- Avoid "fixing errors by slowing people down"
- Reduce perceived workload where possible (NASA-TLX), especially physical demand and frustration

---

## Statistical Methods

### Model Specifications

**All analyses use Type III ANOVA** (appropriate for unbalanced designs) with **sum-to-zero contrasts** (`contr.sum`).

#### 1. Throughput (Primary Performance Metric)
- **Model:** `lmer(TP ~ modality × ui_mode × pressure + (1 | pid))`
- **Distribution:** Gaussian (continuous, bounded positive)
- **Aggregation:** Participant × modality × ui_mode × pressure level
- **Dataset:** `df_iso` (ISO 9241-9 compliant data, filtered for quality)
- **Sample:** Hand N=75, Gaze N=80

#### 2. Movement Time (RT)
- **Model:** `lmer(log(rt_ms) ~ modality × ui_mode × pressure + (1 | pid))`
- **Distribution:** Gaussian (log-transformed for normality)
- **Level:** Trial-level (not aggregated)
- **Sample:** Hand N=75, Gaze N=80

#### 3. Error Rate
- **Model:** `glmer(error ~ modality × ui_mode × pressure + (1 | pid), family = binomial)`
- **Distribution:** Binomial (binary outcome)
- **Level:** Trial-level (all trials, correct + incorrect)
- **Sample:** Hand N=75, Gaze N=80

#### 4. NASA-TLX (Workload)
- **Model:** `lmer(overall_tlx ~ modality × ui_mode + (1 | pid))`
- **Distribution:** Gaussian (continuous, 0-100 scale)
- **Level:** Block-level (one TLX score per block)
- **Sample:** Hand N=75, Gaze N=80

#### 5. Effective Width (We) - ISO 9241-9 Accuracy Metric
- **Model:** `lmer(We ~ modality × ui_mode × pressure + (1 | pid))`
- **Distribution:** Gaussian (continuous, pixels)
- **Level:** Participant × condition level
- **Formula:** We = 4.133 × SD(projected_error_px) per condition
- **Sample:** Hand N=75, Gaze N=80

### Statistical Approach

**Mixed-Effects Models:**
- All models use random intercept per participant `(1 | pid)`
- Fixed effects: modality, ui_mode, pressure, all interactions
- Type III ANOVA for unbalanced designs
- Estimated marginal means (EMMs) via `emmeans`
- Pairwise comparisons with Holm adjustment for multiple comparisons

**Effect Size Reporting:**
- Cohen's d (from EMMs)
- Partial eta-squared (η²p) from F-statistics
- Confidence intervals (95% CI) for all EMMs

**Power Analysis:**
- Target N=48 for main effects (dz ≈ 0.4-0.6, power ≈ 0.80)
- Actual N=80 provides higher power and robustness
- Interactions treated as exploratory (may be underpowered)

---

## Key Findings (Current Dataset, N=80)

### Descriptive Statistics

**Modality Differences:**
- **Hand throughput > Gaze throughput** (large effect, as expected)
- **Hand RT < Gaze RT** (faster movement time for hand)
- **Gaze error rate > Hand error rate** (gaze shows higher errors)
- **Gaze errors are predominantly "slips"** (Midas Touch problem) rather than misses/timeouts

**Adaptive vs Static:**
- **Adaptive vs Static differences are small** in current dataset
- **Declutter intervention:** Present and evaluable, but effect is modest
- **Width inflation:** Did not activate (all `width_scale_factor` = 1.0 due to policy constraints)

**Workload (NASA-TLX):**
- **Gaze workload > Hand workload** (gaze shows higher cognitive/physical demand)
- **Adaptive vs Static TLX:** Very similar (no clear reduction yet)

**Validation (Fitts' Law):**
- Fitts' Law holds with R² ≥ 0.80
- Gaze shows steeper slope than hand (greater time cost per bit)

### Inferential Statistics

**Modality Main Effect:**
- Large, significant effect on throughput (hand > gaze)
- Large, significant effect on RT (hand < gaze)
- Significant effect on error rate (gaze > hand)

**UI Mode Main Effect:**
- Effect sizes are small-to-medium in magnitude
- Some analyses show non-significant differences (adaptive ≈ static)

**Modality × UI Mode Interaction:**
- Generally non-significant (suggests adaptive benefit doesn't differ strongly by modality in current dataset)

**Pressure Main Effect:**
- Small-to-medium effects in some analyses

---

## Methodology Details

### Task
**ISO 9241-9 compliant Fitts' Law pointing task:**
- Participants click/hover on circular targets
- Target difficulty varies: 3 Index of Difficulty (ID) levels
- 8 target directions (radial layout)
- Multiple trials per condition (~24 per participant × condition)

### Gaze Simulation (Critical Method Note)

**We did NOT use a hardware eye tracker.** Instead, we used:
- **Mouse-driven gaze proxy** with physiologically-informed simulation
- **Gaussian fixation jitter** (simulating natural eye tremor/drift)
- **Saccadic suppression** (cursor frozen during high-velocity movements)
- **Sensor lag** (30-70ms processing delay)
- **Screen calibration** (pixels-per-degree normalization)

**Rationale (Pros):**
- Enables remote data collection at scale
- Reproducible, controlled noise characteristics
- Low-cost way to study interaction design failure modes (e.g., Midas Touch)

**Limitations (Cons):**
- Not external valid to real eye-tracker hardware
- Some real-world eye-tracker issues not represented

**Validation Plan:**
- Calibration study with real eye tracker to tune parameters
- Outcome-level validation (check if same UX signatures appear)

### Adaptive Interventions

**1. Declutter (Gaze Mode):**
- Hides non-critical HUD elements when performance degrades
- Trigger: Error burst (≥2 consecutive errors) OR RT exceeds 75th percentile
- Hysteresis: Requires consistent degradation over multiple trials
- Status: **Activated in current dataset**

**2. Width Inflation (Hand Mode):**
- Expands target size by 25% when performance degrades
- Trigger: Same as declutter (error burst or RT threshold)
- Hysteresis: Same as declutter
- Status: **Did NOT activate** (policy constraint `pressure_only: true` + thresholds not met)

### Data Quality Control

**Trial Exclusions:**
- Practice trials excluded
- Display violations (zoom ≠ 100%, not fullscreen, tab hidden > 500ms)
- Invalid RTs (RT < 150ms or RT > 6000ms)
- Focus/blur interruptions

**Input Device Exclusion:**
- Hand trials from trackpad users excluded (device confound)
- Gaze trials from trackpad users included (simulation normalizes input)
- Rationale: Hand modality requires device standardization; gaze uses simulation-normalized input

---

## Current Case Study Document

I have drafted a case study focused on:
1. **User-centered UX research perspective** (not heavy statistical analysis)
2. **Practical pain points** (Gorilla Arm, Midas Touch)
3. **Design implications** for XR teams
4. **Skills demonstration** for recruiters

The case study currently includes:
- Executive summary
- Problem statement (Gorilla Arm, Midas Touch)
- Research approach (user-centered methodology)
- Technical implementation (platform details)
- Key insights (error patterns, workload findings)
- Impact & implications (design guidelines)
- Skills demonstrated (UXR, AR/XR, technical)

---

## Questions for Review

Please provide feedback on:

1. **Methodological Accuracy:**
   - Are the statistical methods correctly described (or appropriately simplified for a UXR audience)?
   - Is the unbalanced design (hand N=75, gaze N=80) handled appropriately in reporting?
   - Is the gaze simulation approach clearly explained with appropriate caveats?

2. **Statistical Reporting:**
   - Are the findings accurately represented (modality effects, adaptive vs static, workload)?
   - Should I include more specific effect sizes, p-values, or confidence intervals?
   - Is the balance between descriptive and inferential statistics appropriate for a UXR case study?

3. **Clarity & Audience Appropriateness:**
   - Is the case study accessible to recruiters without deep statistical backgrounds?
   - Does it effectively communicate the research value for tech companies (Meta, Apple Vision Pro)?
   - Are technical details (simulation, adaptations) explained clearly without oversimplifying?

4. **Completeness:**
   - Are critical methodological details missing that would affect credibility?
   - Should I add more detail about pre-registration, exclusion criteria, or power analysis?
   - Are the limitations (width inflation not activating, small adaptive effects) appropriately addressed?

5. **Structure & Flow:**
   - Does the narrative effectively tell the story of the research?
   - Is the balance between problem → method → findings → implications clear?
   - Would a recruiter understand what I did and why it matters?

6. **Honesty & Transparency:**
   - Are negative/null findings (adaptive ≈ static) presented honestly without overselling?
   - Is the gaze simulation limitation clearly explained?
   - Are implementation gaps (width inflation not activating) disclosed?

7. **Specific Recommendations:**
   - What should I add, remove, or revise?
   - Are there sections that need more detail or less detail?
   - Should I restructure any sections for better clarity?

---

## Target Audience

**Primary:** Recruiters and hiring managers at tech companies (Meta, Apple Vision Pro, Google AR, Microsoft HoloLens, etc.)

**Secondary:** UX Researchers, HCI researchers, AR/XR product designers

**Goal:** Demonstrate ability to:
- Conduct rigorous UX research in XR domain
- Build end-to-end research platforms
- Translate findings into actionable design guidelines
- Balance scientific rigor with practical relevance

---

## What I'm Looking For

A comprehensive second opinion that will help me:
1. Ensure the case study accurately represents my research
2. Identify any gaps or inaccuracies in methodology/statistics
3. Improve clarity and accessibility for non-statistical audiences
4. Strengthen the narrative for recruiters in tech companies
5. Refine the balance between technical detail and user experience focus

Thank you for your detailed review!
