# XR Adaptive Modality Experiment: Dataset & Current Report Summary
## Request for Creative Visualization Suggestions

---

## PART 1: COMPREHENSIVE DATASET DESCRIPTION

### Dataset Overview
- **File**: `trial_data.csv`
- **Structure**: One row per trial
- **Participants**: Multiple participants (PIDs)
- **Total Columns**: ~70+ columns
- **Experimental Design**: 2×2×2 factorial
  - **Modality**: hand vs. gaze
  - **UI Mode**: static vs. adaptive
  - **Pressure**: 0 (OFF) vs. 1 (ON)

### Available Columns (Organized by Category)

#### **Participant & Demographics**
- `participant_id` / `pid`: Participant identifier
- `session_number`: Session number
- `age`: Participant age
- `gender`: Gender (male/female/other)
- `gaming_hours_per_week`: Gaming experience
- `input_device`: Input device used (mouse/trackpad/etc.)
- `vision_correction`: Vision correction status
- `wearing_correction_now`: Whether wearing correction during experiment
- `dominant_hand`: Dominant hand (left/right)
- `operating_hand`: Hand used for operation
- `using_dominant_hand`: Boolean
- `motor_impairment`: Motor impairment status
- `fatigue_level`: Fatigue level (1-10 scale)

#### **Trial Structure & Timing**
- `ts`: Timestamp (milliseconds since epoch)
- `trial_number`: Global trial index
- `trial_in_block`: Trial number within block
- `block_number`: Block sequence number
- `block_order`: Block code (e.g., "HaS_P0", "GaS_P0", "HaA_P0", "GaA_P0")
- `block_trial_count`: Number of trials in block
- `block`: Block identifier
- `trial`: Trial identifier
- `practice`: Boolean indicating practice trial

#### **Experimental Conditions**
- `modality`: Input modality ("hand" or "gaze")
- `ui_mode`: UI condition ("static" or "adaptive")
- `pressure`: Time pressure (0 = OFF, 1 = ON)
- `aging`: Aging mode enabled (boolean)

#### **Fitts' Law Parameters**
- `ID`: Index of Difficulty (bits)
- `index_of_difficulty_nominal`: Nominal ID
- `A`: Amplitude (target distance in pixels)
- `target_distance_A`: Target distance amplitude
- `W`: Target width (pixels)
- `target_x`: Target X position (pixels)
- `target_y`: Target Y position (pixels)
- `target_center_x`: Target center X coordinate
- `target_center_y`: Target center Y coordinate

#### **Performance Metrics**
- `rt_ms`: Reaction time / Movement time (milliseconds)
- `correct`: Trial success (boolean)
- `err_type`: Error type ("miss", "timeout", "slip")
- `endpoint_x`: Endpoint X coordinate (pixels)
- `endpoint_y`: Endpoint Y coordinate (pixels)
- `endpoint_error_px`: Distance from target center (pixels)
- `projected_error_px`: Projected error (pixels)

#### **Gaze-Specific Metrics**
- `hover_ms`: Hover duration before confirmation (gaze only, milliseconds)
- `confirm_type`: Confirmation method ("click", "space", "dwell")
- `pupil_z_med`: Pupil diameter z-score (proxy for cognitive load)
- `target_reentry_count`: Number of times cursor left and re-entered target
- `verification_time_ms`: Time spent verifying target before confirmation

#### **Movement Quality Metrics**
- `submovement_count`: Number of velocity peaks (intermittent control proxy)
- `adaptation_triggered`: Boolean indicating if adaptation was triggered

#### **Technical/Environmental**
- `screen_width`: Screen width (pixels)
- `screen_height`: Screen height (pixels)
- `window_width`: Browser window width (pixels)
- `window_height`: Browser window height (pixels)
- `device_pixel_ratio`: Device pixel ratio
- `zoom_level`: Browser zoom level
- `zoom_pct`: Zoom percentage
- `is_fullscreen`: Fullscreen status (boolean)
- `fullscreen`: Fullscreen status (boolean)
- `viewport_w`: Viewport width
- `viewport_h`: Viewport height
- `focus_blur_count`: Number of focus/blur events
- `tab_hidden_ms`: Time tab was hidden (milliseconds)
- `user_agent`: Browser user agent string
- `browser`: Browser name (Chrome/Firefox/Safari/etc.)
- `dpi`: DPI setting
- `pixels_per_mm`: Pixels per millimeter
- `pixels_per_degree`: Pixels per degree (visual angle)
- `avg_fps`: Average frames per second

#### **Workload (NASA-TLX)**
- `tlx_mental`: Mental demand (0-100)
- `tlx_physical`: Physical demand (0-100)
- `tlx_temporal`: Temporal demand (0-100)
- `tlx_performance`: Performance (0-100)
- `tlx_effort`: Effort (0-100)
- `tlx_frustration`: Frustration (0-100)

#### **Computed Metrics (in Report)**
- `rt_s`: Reaction time in seconds
- `log_rt`: Log-transformed reaction time
- `We`: Effective Width (ISO 9241-9)
- `IDe`: Effective Index of Difficulty
- `MT_avg`: Mean Movement Time
- `TP`: Throughput (bits/s)
- `err_x`: Endpoint error X component
- `err_y`: Endpoint error Y component
- `err_distance`: Euclidean distance error

---

## PART 2: CURRENT REPORT CONTENTS (Report.qmd)

### Sections Already Implemented:

1. **Executive Summary**
   - Participant count, trial counts, error rates, mean throughput/MT

2. **Demographics**
   - Overall statistics (age, gaming hours)
   - Breakdown by gender
   - Input device distribution

3. **Primary Analysis: Throughput**
   - Summary statistics table
   - Violin + boxplots by modality × UI mode × pressure
   - Interaction plots with EMMs and confidence intervals
   - Statistical model (LME/M) with ANOVA and pairwise comparisons

4. **Movement Time Analysis**
   - Summary statistics
   - Violin + boxplots
   - EMMs with confidence intervals
   - Statistical model results

5. **Fitts' Law Modelling**
   - MT vs. IDe scatter plots with regression lines
   - R² values and model fit statistics
   - Faceted by modality and UI mode

6. **Error Rate Analysis**
   - Error rate summary table
   - Violin + boxplots
   - Statistical model (GLMM)

7. **Accuracy & Gaze Dynamics**
   - **Effective Width (We)**: Bar charts with error bars
   - **Endpoint Accuracy Scatter Plot**: Error X vs. Error Y for gaze modality (faceted by pressure, -50 to 50px range)
   - **Target Re-entries**: Violin + boxplots (control stability metric)

8. **Workload (NASA-TLX)**
   - Summary table by condition
   - Violin + boxplots by scale and modality
   - Overall TLX score visualization
   - **Stacked bar chart**: All 6 TLX components by condition

9. **Summary & Conclusions**
   - Comprehensive summary table (Throughput, MT, Error Rate, We)
   - Data quality notes

### Visualization Types Currently Used:
- Violin plots + boxplots
- Scatter plots
- Bar charts
- Line plots (regression, EMMs)
- Stacked bar charts
- Summary tables

### Statistical Analyses:
- Linear Mixed-Effects Models (LME/M) for continuous outcomes
- Generalized Linear Mixed Models (GLMM) for binary outcomes
- Estimated Marginal Means (EMMs)
- Pairwise comparisons with Holm adjustment
- ANOVA tables

---

## PART 3: POTENTIAL UNUSED COLUMNS & OPPORTUNITIES

### Columns Not Yet Visualized:
- `submovement_count`: Movement quality (intermittent control)
- `verification_time_ms`: Stopping/verification phase timing
- `hover_ms`: Dwell time for gaze modality
- `pupil_z_med`: Cognitive load proxy
- `adaptation_triggered`: When adaptive UI triggered
- `target_reentry_count`: Already used but could be expanded
- `focus_blur_count`: Attention/distraction metric
- `tab_hidden_ms`: Task switching/interruption
- `avg_fps`: Performance/technical quality
- `pixels_per_degree`: Visual angle considerations
- `trial_number`: Learning/practice effects over time
- `block_number`: Block-level effects
- `block_order`: Order effects
- Spatial coordinates: `target_x`, `target_y`, `endpoint_x`, `endpoint_y` (could show spatial patterns)
- Error types: `err_type` breakdown
- Technical: Screen/window dimensions, DPI, zoom levels

### Potential Analysis Dimensions:
- **Temporal**: Learning curves, block effects, trial order
- **Spatial**: Target position effects, spatial error patterns
- **Individual Differences**: Participant-level patterns
- **Technical Quality**: FPS, viewport issues, interruptions
- **Cognitive Load**: Pupil diameter, verification time
- **Movement Quality**: Submovements, re-entries, adaptation triggers
- **Error Patterns**: Error type distributions, spatial error patterns

---

## PART 4: REQUEST FOR CREATIVE VISUALIZATION SUGGESTIONS

**Context**: We have a comprehensive Fitts' law pointing experiment dataset with rich temporal, spatial, performance, and workload data. The current report covers primary performance metrics (throughput, movement time, accuracy, errors, workload) with standard statistical visualizations.

**Your Task**: Be creative and suggest additional visualizations that would:
1. **Leverage unused columns** (especially those listed in Part 3)
2. **Reveal patterns** not visible in current analyses
3. **Be publication-ready** and scientifically meaningful
4. **Use advanced visualization techniques** like:
   - Heatmaps
   - Trajectory visualizations
   - Time series / learning curves
   - Spatial heatmaps
   - Network/graph visualizations
   - Multi-dimensional visualizations
   - Interactive-style static visualizations

**Specific Interests**:
- **Heatmaps**: What dimensions would be most informative? (e.g., performance by target position, error patterns by condition, learning effects)
- **Trajectories**: Can we visualize movement paths? What would show differences between hand/gaze, static/adaptive?
- **Temporal Patterns**: Learning curves, block effects, fatigue over time
- **Spatial Patterns**: Target position effects, error distributions across screen space
- **Individual Differences**: Participant-level patterns, outliers, clusters
- **Multi-dimensional**: Combining multiple metrics in novel ways

**Constraints**:
- Must work in static HTML output (Quarto/R Markdown)
- Should use R/ggplot2 ecosystem (can suggest additional packages)
- Should be computationally feasible with typical dataset sizes
- Should be interpretable without interaction

**Please suggest**:
1. **Specific visualization ideas** with clear descriptions
2. **What columns/metrics** each would use
3. **What research questions** they would answer
4. **Implementation approach** (packages, techniques)
5. **Expected insights** or patterns they might reveal

Be creative, think outside the box, and suggest visualizations that would make this report truly comprehensive and insightful!

---

## PART 5: INITIAL CREATIVE SUGGESTIONS (AI-Generated)

### 1. **Spatial Error Heatmap**
- **What**: 2D heatmap showing error density across screen space
- **Columns**: `target_x`, `target_y`, `endpoint_error_px`, `modality`, `ui_mode`
- **Research Question**: Are there systematic spatial biases? Do errors cluster in specific screen regions?
- **Implementation**: `ggplot2::stat_density_2d()` or `geom_hex()` with `target_x/y` as coordinates
- **Insights**: Reveal if gaze has different error patterns in corners vs. center, or if adaptive UI reduces errors in specific regions

### 2. **Learning Curve / Practice Effect**
- **What**: Performance metrics over trial number (smoothed trend lines)
- **Columns**: `trial_number`, `TP`, `rt_ms`, `correct`, `modality`, `ui_mode`
- **Research Question**: How quickly do participants adapt? Do learning rates differ by condition?
- **Implementation**: `geom_smooth()` with `trial_number` on x-axis, faceted by condition
- **Insights**: Show if adaptive UI has faster learning, or if gaze requires more practice

### 3. **Submovement Analysis**
- **What**: Submovement count vs. difficulty, or submovement patterns by condition
- **Columns**: `submovement_count`, `IDe`, `modality`, `ui_mode`, `rt_ms`
- **Research Question**: Does adaptive UI reduce movement corrections? How do submovements relate to performance?
- **Implementation**: Scatter plot with regression, or violin plots by condition
- **Insights**: Reveal movement quality differences - fewer submovements might indicate smoother, more ballistic movements

### 4. **Verification Time Analysis**
- **What**: Verification time as separate phase from movement time
- **Columns**: `verification_time_ms`, `rt_ms`, `modality`, `ui_mode`
- **Research Question**: How much time is spent "stopping" vs. "moving"? Does adaptive UI reduce verification time?
- **Implementation**: Ratio plots (verification/MT), or stacked bar showing movement vs. verification phases
- **Insights**: Separate the "ballistic" movement from the "precise stopping" phase - might reveal different mechanisms

### 5. **Target Position Effect Heatmap**
- **What**: Performance (TP, error rate) mapped to target positions on screen
- **Columns**: `target_x`, `target_y`, `TP`, `endpoint_error_px`, `modality`
- **Research Question**: Are some screen regions easier/harder? Do modalities differ in spatial performance?
- **Implementation**: `geom_tile()` or `stat_summary_2d()` with `target_x/y` as grid
- **Insights**: Reveal if gaze struggles in corners, or if hand has biases toward dominant hand side

### 6. **Error Type Sankey/Alluvial Diagram**
- **What**: Flow diagram showing error type transitions or error patterns by condition
- **Columns**: `err_type`, `modality`, `ui_mode`, `correct`
- **Research Question**: What types of errors are most common? Do error patterns differ by condition?
- **Implementation**: `ggalluvial` package, or stacked bar with error type proportions
- **Insights**: Show if gaze has more "slip" errors, or if adaptive UI changes error type distribution

### 7. **Pupil Diameter (Cognitive Load) Over Time**
- **What**: Pupil z-score trends during blocks or trials
- **Columns**: `pupil_z_med`, `trial_number`, `block_number`, `modality`, `ui_mode`
- **Research Question**: Does cognitive load increase over time? Does adaptive UI reduce cognitive load?
- **Implementation**: Line plot with `trial_number` or `block_number` on x-axis, smoothed trend
- **Insights**: Reveal fatigue effects, or if adaptive UI is cognitively easier

### 8. **Adaptation Trigger Patterns**
- **What**: When and how often adaptation is triggered
- **Columns**: `adaptation_triggered`, `trial_number`, `endpoint_error_px`, `modality`
- **Research Question**: What performance patterns trigger adaptation? How effective is the adaptive system?
- **Implementation**: Timeline plot showing adaptation events, or performance before/after adaptation triggers
- **Insights**: Show if adaptation is working as intended, and what conditions lead to adaptation

### 9. **Multi-Metric Radar/Spider Chart**
- **What**: Combined performance profile for each condition
- **Columns**: Multiple normalized metrics (TP, accuracy, error rate, TLX, submovements)
- **Research Question**: What's the overall performance "profile" of each condition?
- **Implementation**: `ggradar` package or custom polar coordinates
- **Insights**: Visual summary showing trade-offs - e.g., high throughput but high workload

### 10. **Spatial Trajectory Visualization**
- **What**: Representative movement paths from start to target
- **Columns**: Would need trajectory data (if available), or use `endpoint_x/y` and `target_center_x/y` to show vectors
- **Research Question**: What do movement paths look like? Are there systematic deviations?
- **Implementation**: Arrow plots showing movement vectors, or if trajectory data exists, `geom_path()` for actual paths
- **Insights**: Reveal if gaze has more curved paths, or if adaptive UI leads to straighter movements

### 11. **Block Order Effect Analysis**
- **What**: Performance by block order (practice effects, fatigue, adaptation)
- **Columns**: `block_number`, `block_order`, `TP`, `rt_ms`, `tlx_*`
- **Research Question**: Are there order effects? Does performance improve or degrade over blocks?
- **Implementation**: Line plots or bar charts showing metrics by block number, faceted by condition
- **Insights**: Reveal learning, fatigue, or carryover effects

### 12. **Individual Differences Heatmap**
- **What**: Participant-level performance patterns
- **Columns**: `pid`, `TP`, `rt_ms`, `modality`, `ui_mode`
- **Research Question**: Are there participant clusters? Who benefits most from adaptive UI?
- **Implementation**: Heatmap with participants as rows, conditions as columns, performance as color
- **Insights**: Identify outliers, clusters of similar performers, or individual response patterns

### 13. **Technical Quality Dashboard**
- **What**: FPS, viewport issues, interruptions by condition
- **Columns**: `avg_fps`, `focus_blur_count`, `tab_hidden_ms`, `viewport_w/h`, `modality`
- **Research Question**: Do technical issues affect performance? Are there systematic differences?
- **Implementation**: Boxplots or summary statistics showing technical metrics by condition
- **Insights**: Ensure data quality, identify if technical issues confound results

### 14. **Error Distance Distribution**
- **What**: Histogram/density of error distances, showing miss patterns
- **Columns**: `endpoint_error_px`, `err_type`, `modality`, `ui_mode`
- **Research Question**: How far do people miss? Are misses systematic (always overshoot) or random?
- **Implementation**: Density plots or histograms, potentially showing directional bias
- **Insights**: Reveal if errors are small misses vs. large misses, or systematic biases

### 15. **Hover Time Analysis (Gaze-Specific)**
- **What**: Dwell time patterns for gaze modality
- **Columns**: `hover_ms`, `rt_ms`, `correct`, `ui_mode`, `IDe`
- **Research Question**: How long do people hover before confirming? Does adaptive UI change dwell behavior?
- **Implementation**: Violin plots or scatter plots (hover vs. total RT), faceted by condition
- **Insights**: Show if adaptive UI reduces hesitation, or if longer dwell = better accuracy

---

**Next Steps**: Review these suggestions and prioritize based on:
- Research questions of interest
- Data availability and quality
- Computational feasibility
- Publication impact
- Novelty and insight potential

