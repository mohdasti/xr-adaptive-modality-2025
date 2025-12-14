# CSV Data Sufficiency Assessment Prompt

## Context

I am conducting a within-subjects experimental study investigating adaptive modality systems in Extended Reality (XR). The study uses a **2×2×2 factorial design** (Modality: Hand vs. Gaze × UI Mode: Static vs. Adaptive × Pressure: ON vs. OFF) with **N=48 participants** and **Williams Latin Square counterbalancing**.

**Experimental Task**: Fitts' Law pointing task (ISO 9241-9 compliant) where participants select targets of varying difficulty (Index of Difficulty: 1.7 to 5.0 bits) using either hand (mouse/trackpad) or gaze (eye-tracking with dwell/space confirmation) input.

**Data Collection**: All trial-level data is logged client-side in a React/TypeScript web application and exported as a **single CSV file per participant** with **78 columns**. The CSV includes trial-level performance metrics, experimental conditions, adaptive system metrics, workload measures (NASA-TLX), and debrief responses—all consolidated into one file.

---

## CSV Data Structure

### Overview

- **Total Columns**: 78
- **Format**: UTF-8 CSV, comma-delimited
- **Structure**: One row per trial (including practice trials)
- **File Naming**: `{participant_id}_{timestamp}_merged.csv`
- **Data Types**: Mix of integers, floats, booleans, strings, timestamps, and JSON strings

### Column Categories

#### 1. Participant & Session Metadata (13 columns)
- `pid`: Participant ID (e.g., "P001")
- `session_number`: Session identifier
- Demographics: `age`, `gender`, `gaming_hours_per_week`, `input_device`, `vision_correction`, `wearing_correction_now`, `dominant_hand`, `operating_hand`, `using_dominant_hand`, `motor_impairment`, `fatigue_level`

#### 2. Trial Structure & Timing (7 columns)
- `ts`: Unix timestamp (milliseconds) when trial started
- `trial_number`: Global trial number across all blocks
- `trial_in_block`: Trial position within current block
- `block_number`: Block number (1-8)
- `block_order`: Williams design condition code (e.g., "HaS_P0", "GaA_P1")
- `block_trial_count`: Number of trials in current block
- `block`, `trial`: Legacy duplicates

#### 3. Experimental Conditions (4 columns)
- `modality`: Input modality ("hand" or "gaze")
- `ui_mode`: UI condition ("static" or "adaptive")
- `pressure`: Time pressure condition (0 = OFF, 1 = ON)
- `aging`: Always false (dropped factor)

#### 4. Fitts' Law Parameters (5 columns)
- `ID`: Index of Difficulty (bits) = log₂(A/W + 1)
- `index_of_difficulty_nominal`: Duplicate of ID
- `A`: Amplitude (distance in pixels)
- `target_distance_A`: Duplicate of A
- `W`: Nominal target width (pixels)

#### 5. Target & Endpoint Positions (7 columns)
- `target_x`, `target_y`: Legacy target position
- `target_center_x`, `target_center_y`: Precise target center coordinates (float)
- `endpoint_x`, `endpoint_y`: Actual click/confirmation position (float)
- `endpoint_error_px`: Euclidean distance from endpoint to target center

#### 6. Performance Metrics (4 columns)
- `projected_error_px`: Error projected onto task axis (for ISO 9241-9 We calculation)
- `rt_ms`: Movement time (milliseconds, from target appearance to click/confirmation)
- `correct`: Trial success (true/false)
- `err_type`: Error type ("miss", "timeout", "slip") - only when correct=false

#### 7. Gaze-Specific Metrics (3 columns)
- `hover_ms`: Hover duration before confirmation (gaze modality only, milliseconds)
- `confirm_type`: Confirmation method ("click", "space", "dwell")
- `pupil_z_med`: Always null (dropped feature)

#### 8. Adaptive System Metrics (5 columns)
- `adaptation_triggered`: Whether adaptive intervention was triggered (boolean)
- `target_reentry_count`: Number of times cursor exited and re-entered target before selection (integer)
- `submovement_count`: Number of velocity peaks (submovements) in cursor trajectory (integer, pre-calculated)
- `verification_time_ms`: Time from first target entry to final selection (milliseconds)

#### 9. Trajectory Data (1 column)
- `trajectory`: **JSON string** containing array of trajectory points logged at ~60fps during active trials
  - Format: `[{"x": 100.5, "y": 200.3, "t": 0.0}, {"x": 101.2, "y": 201.1, "t": 16.7}, ...]`
  - `x`, `y`: Cursor position in pixels
  - `t`: Time relative to trial start (milliseconds)
  - Only present for trials with active cursor movement
  - Can be parsed in R: `jsonlite::fromJSON(trajectory)`

#### 10. Width Scaling Metrics (3 columns)
- `nominal_width_px`: Original target width (design specification, pixels)
- `displayed_width_px`: Actual rendered target width after adaptive scaling (pixels)
- `width_scale_factor`: Scale factor = displayed_width_px / nominal_width_px (1.0 = no scaling)

#### 11. Alignment Gate Metrics (4 columns)
- `alignment_gate_enabled`: Whether alignment gate was active (boolean)
- `alignment_gate_false_triggers`: Number of false triggers (integer)
- `alignment_gate_recovery_time_ms`: Time spent recovering from false triggers (milliseconds)
- `alignment_gate_mean_recovery_time_ms`: Mean recovery time across all false triggers in trial (milliseconds)

#### 12. Task Configuration (2 columns)
- `task_type`: Task type ("point" or "drag", currently all "point")
- `drag_distance`: Distance dragged (pixels, currently always null)

#### 13. Display & System Metadata (13 columns)
- `pixels_per_mm`, `pixels_per_degree`: Display calibration values
- `screen_width`, `screen_height`: Physical screen resolution (pixels)
- `window_width`, `window_height`: Browser window dimensions (pixels)
- `device_pixel_ratio`: Device pixel ratio for HiDPI displays
- `zoom_level`, `zoom_pct`: Browser zoom level (should be 100% for valid trials)
- `is_fullscreen`, `fullscreen`: Whether window was in fullscreen mode (boolean)
- `viewport_w`, `viewport_h`: Viewport dimensions (pixels)
- `focus_blur_count`, `tab_hidden_ms`: Window focus/blur events and tab visibility duration
- `user_agent`, `browser`: Browser identification
- `dpi`: Legacy field (duplicate of device_pixel_ratio)

#### 14. Practice & Performance Tracking (2 columns)
- `practice`: Whether this is a practice trial (boolean, should be excluded from analysis)
- `avg_fps`: Average frame rate during trial (frames per second)

#### 15. Workload Measures (6 columns)
- `tlx_mental`: NASA-TLX Mental Demand (0-100)
- `tlx_physical`: NASA-TLX Physical Demand (0-100)
- `tlx_temporal`: NASA-TLX Temporal Demand (0-100)
- `tlx_performance`: NASA-TLX Performance (0-100, inverted: higher = worse)
- `tlx_effort`: NASA-TLX Effort (0-100)
- `tlx_frustration`: NASA-TLX Frustration (0-100)
- **Note**: These are **block-level** values (same for all trials within a block). Collected after each block via TLX form and merged into the main CSV.

#### 16. Debrief Responses (3 columns)
- `debrief_q1_adaptation_noticed`: Response to "Did you notice the interface adapting?" (text)
- `debrief_q2_strategy_changed`: Response to "Did you change your strategy?" (text)
- `debrief_timestamp`: When debrief form was submitted (ISO timestamp)

---

## Planned Analyses (from Report.qmd)

The following analyses are planned or already implemented in the report. For each analysis, I need to know if the CSV data is **sufficient** to conduct it.

### Primary Analyses

#### 1. **Throughput Analysis (ISO 9241-9)**
- **Metric**: Throughput (TP) = IDe / MT (bits/s)
- **Calculation**: 
  - Effective Width (We) = 4.133 × SD(projected_error_px)
  - Effective ID (IDe) = log₂(A / We + 1)
  - Throughput = IDe / MT
- **Required Data**: `projected_error_px`, `A`, `W`, `rt_ms`, `modality`, `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

#### 2. **Movement Time Analysis**
- **Metric**: Movement time (RT) in seconds
- **Required Data**: `rt_ms`, `modality`, `ui_mode`, `pressure`, `correct`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

#### 3. **Error Rate Analysis**
- **Metric**: Percentage of trials with errors
- **Required Data**: `correct`, `err_type`, `modality`, `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

#### 4. **Fitts' Law Modelling**
- **Metric**: Linear regression of Movement Time vs. Index of Difficulty
- **Required Data**: `rt_ms`, `ID` (or `IDe`), `modality`, `ui_mode`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

### Accuracy & Spatial Metrics

#### 5. **Effective Width (We) Analysis**
- **Metric**: Effective target width (ISO 9241-9)
- **Calculation**: We = 4.133 × SD(projected_error_px)
- **Required Data**: `projected_error_px`, `modality`, `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

#### 6. **Endpoint Accuracy Scatter Plot**
- **Metric**: Visual distribution of endpoint errors relative to target center
- **Required Data**: `endpoint_x`, `endpoint_y`, `target_center_x`, `target_center_y`, `modality`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

#### 7. **Target Re-entries ("Midas Touch" Struggle)**
- **Metric**: Number of times cursor exited and re-entered target before selection
- **Required Data**: `target_reentry_count`, `modality`, `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

### Workload & Subjective Measures

#### 8. **NASA-TLX Workload Analysis**
- **Metric**: Six subscales (Mental, Physical, Temporal, Performance, Effort, Frustration) and overall workload
- **Required Data**: `tlx_mental`, `tlx_physical`, `tlx_temporal`, `tlx_performance`, `tlx_effort`, `tlx_frustration`, `modality`, `ui_mode`
- **Note**: TLX data is block-level (same value for all trials in a block)
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

### Learning & Temporal Effects

#### 9. **Learning Curves (Within Condition)**
- **Metric**: Performance change over trials within each condition
- **Required Data**: `trial_in_block` or `trial_number`, `rt_ms`, `correct`, `modality`, `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

#### 10. **Block Order & Temporal Effects**
- **Metric**: Performance across blocks (order effects)
- **Required Data**: `block_number`, `rt_ms`, `correct`, `modality`, `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

### Movement Quality Metrics

#### 11. **Submovement Count Analysis**
- **Metric**: Number of velocity peaks (submovements) per trial
- **Required Data**: `submovement_count`, `modality`, `ui_mode`, `pressure`
- **Note**: Pre-calculated in `FittsTask.tsx` using velocity peak detection
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

#### 12. **Verification Time Analysis**
- **Metric**: Time from first target entry to final selection (separates "ballistic movement" from "precise stopping")
- **Required Data**: `verification_time_ms`, `rt_ms`, `modality`, `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

### Error Patterns

#### 13. **Error Type Distribution**
- **Metric**: Breakdown of error types (miss, timeout, slip)
- **Required Data**: `err_type`, `modality`, `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

### Spatial Patterns

#### 14. **Spatial Performance Heatmaps**
- **Metric**: Performance (RT, error rate) by target position on screen
- **Required Data**: `target_center_x`, `target_center_y`, `rt_ms`, `correct`, `modality`, `ui_mode`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

#### 15. **Error Density Heatmap**
- **Metric**: Spatial distribution of endpoint errors (where errors occur)
- **Required Data**: `endpoint_x`, `endpoint_y`, `target_center_x`, `target_center_y`, `modality`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

### Adaptive UI Mechanism Analysis

#### 16. **Width Scaling Analysis**
- **Metric**: How target sizes are dynamically adjusted by adaptive UI
- **Required Data**: `nominal_width_px`, `displayed_width_px`, `width_scale_factor`, `rt_ms`, `modality`, `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

#### 17. **Alignment Gate Metrics**
- **Metric**: False trigger count and recovery time from alignment gate
- **Required Data**: `alignment_gate_enabled`, `alignment_gate_false_triggers`, `alignment_gate_recovery_time_ms`, `alignment_gate_mean_recovery_time_ms`, `modality`, `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

#### 18. **Task Type Analysis**
- **Metric**: Performance differences between point and drag tasks (if implemented)
- **Required Data**: `task_type`, `rt_ms`, `correct`, `modality`, `ui_mode`
- **Note**: Currently all trials are "point" tasks
- **Question**: Is the CSV sufficient? ✅ (Structure ready, but no drag data yet)

#### 19. **Drag Distance Analysis**
- **Metric**: Relationship between drag distance and performance (if drag tasks exist)
- **Required Data**: `drag_distance`, `rt_ms`, `modality`, `ui_mode`, `pressure`
- **Note**: Currently always null (point tasks only)
- **Question**: Is the CSV sufficient? ✅ (Structure ready, but no drag data yet)

### Gaze-Specific Analysis

#### 20. **Hover Time (Dwell Duration) Analysis**
- **Metric**: How long participants hover before confirming (gaze modality)
- **Required Data**: `hover_ms`, `rt_ms`, `modality` (filter to "gaze"), `ui_mode`, `pressure`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

### Advanced Cognitive Models

#### 21. **Linear Ballistic Accumulator (LBA) Model**
- **Purpose**: Analyze decision verification processes and caution thresholds
- **Required Data**:
  - Verification phase RTs: `verification_time_ms` (time from first target entry to selection)
  - Correct/error outcomes: `correct`
  - Condition labels: `modality`, `ui_mode`, `pressure`
- **Model Parameters to Estimate**:
  - Threshold (b): Decision boundary
  - Drift rate (v): Evidence accumulation speed
  - Starting point (A): Initial evidence
  - Non-decision time (t0): Motor/response time
- **Research Questions**:
  - Do adaptive interventions reduce caution threshold (b - A)?
  - Does drift rate (v) differ between modalities?
- **Power Analysis**: N=48 is sufficient for main effects (dz≈0.41, power≈0.80); interactions underpowered (treat as exploratory)
- **Key Constraint**: Low error rates (3-5%) and limited trials per condition (~24/cell) require hierarchical LBA modeling (not per-condition per-person fits)
- **Question**: ⚠️ **Is the CSV sufficient for hierarchical LBA analysis?** What additional data or preprocessing steps are needed?

#### 22. **Control Theory Analysis: Submovement Models**
- **Purpose**: Analyze movement control efficiency, velocity profiles, and control loop efficiency
- **Current Status**: Basic `submovement_count` analysis is implemented (Section 10)
- **Advanced Analyses Needed**:
  1. **Velocity Profile Analysis**:
     - Peak velocity extraction
     - Time to peak velocity (TPV)
     - Deceleration phase duration
     - Velocity profile asymmetry
  2. **Submovement Detection** (from raw trajectory):
     - Zero-crossing detection in acceleration profile
     - Primary movement identification (first ballistic phase)
     - Corrective submovement count and duration
     - Inter-submovement intervals
  3. **Control Loop Efficiency**:
     - Ratio of primary to total movement time
     - Correction frequency (submovements per second)
     - Movement smoothness metrics (jerk, normalized jerk - MUST be duration-normalized)
  4. **Modality-Specific Patterns**:
     - Gaze: Intermittent control due to lag and saccadic blindness
     - Hand: Continuous control with proprioceptive feedback
- **Available Data**:
  - `submovement_count`: Pre-calculated count (already analyzed)
  - `trajectory`: JSON string with cursor positions at ~60fps `[{"x": 100.5, "y": 200.3, "t": 0.0}, ...]`
- **Required Calculations from Trajectory**:
  - Velocity: `v = diff(x) / diff(t)` and `v = diff(y) / diff(t)`
  - Acceleration: `a = diff(velocity)`
  - Jerk: `j = diff(acceleration)`
  - Normalized jerk: Duration-normalized jerk (jerk is duration-sensitive)
- **Power Analysis**: N=48 is sufficient for main effects (dz≈0.41, power≈0.80); interactions underpowered (treat as exploratory)
- **Question**: ⚠️ **Is the trajectory data sufficient for advanced control theory analyses?** What additional processing or validation is needed? Are there any limitations or potential issues with the trajectory data format or sampling rate?

### Demographics & Participant-Level Analysis

#### 23. **Demographics Summary**
- **Metric**: Age, gender, gaming hours, input device distribution
- **Required Data**: `age`, `gender`, `gaming_hours_per_week`, `input_device`, `pid`
- **Question**: Is the CSV sufficient? ✅ (Already implemented)

---

## Specific Questions

### For LBA Analysis (Question 21)

1. **Data Sufficiency**:
   - Is `verification_time_ms` sufficient for LBA analysis, or do we need additional timing data?
   - Are there any issues with using `correct` (boolean) for error outcomes in LBA?
   - Do we need to separate correct vs. error trials, or can LBA handle both in a single model?

2. **Data Quality**:
   - With ~24 trials per condition per participant and 3-5% error rates, what are the identifiability concerns?
   - Should we aggregate data across participants for hierarchical modeling, or can we fit person-level parameters?
   - Are there any preprocessing steps needed (e.g., outlier removal, RT transformations)?

3. **Missing Data**:
   - What happens if `verification_time_ms` is missing for some trials? Should these be excluded?
   - Are there any other required fields we're missing?

### For Control Theory Analysis (Question 22)

1. **Trajectory Data Sufficiency**:
   - Is ~60fps sampling rate sufficient for velocity/acceleration/jerk calculations?
   - Is the JSON string format (`[{"x": 100.5, "y": 200.3, "t": 0.0}, ...]`) appropriate, or should we pre-process it?
   - Are there any concerns with trajectory data being logged only during active trials (missing for very fast movements)?

2. **Calculations**:
   - Can we reliably calculate velocity from `diff(x) / diff(t)` and `diff(y) / diff(t)`?
   - Are there any smoothing or filtering steps needed before calculating acceleration/jerk?
   - For duration-normalized jerk, what duration should we use (total movement time `rt_ms` or time from trajectory start to end)?

3. **Submovement Detection**:
   - Can we reliably detect submovements from acceleration zero-crossings given the trajectory data?
   - Should we use the pre-calculated `submovement_count` or re-calculate from trajectory?
   - Are there any known issues with submovement detection algorithms that we should be aware of?

4. **Missing Data**:
   - What happens if `trajectory` is null or empty for some trials? Should these be excluded?
   - Are there any edge cases (very fast movements, very slow movements) where trajectory data might be unreliable?

### General Questions

1. **Data Completeness**:
   - Are there any analyses in Report.qmd that require data NOT present in the CSV?
   - Are there any redundant or unnecessary columns that could be removed?

2. **Data Quality**:
   - Are there any known data quality issues (missing values, outliers, inconsistencies) that would affect the analyses?
   - Should we perform any additional validation checks beyond what's already documented?

3. **Statistical Modeling**:
   - For hierarchical LBA and control theory analyses, are there any data structure requirements (long format, wide format, nested structure)?
   - Do we need to aggregate data at any level (trial, block, participant) before analysis?

4. **Future Analyses**:
   - Are there any planned analyses that would require additional data collection or logging?
   - Should we consider adding any new columns to the CSV for future analyses?

---

## Expected Output Format

Please provide:

1. **For each analysis (1-23)**:
   - ✅ **Sufficient**: CSV data is adequate for this analysis
   - ⚠️ **Partially Sufficient**: CSV data is adequate but with caveats (specify caveats)
   - ❌ **Insufficient**: CSV data is missing required fields or has critical limitations (specify what's missing)

2. **For LBA Analysis (Question 21)**:
   - Detailed assessment of data sufficiency
   - Recommendations for preprocessing steps
   - Identifiability concerns and mitigation strategies
   - Any missing data requirements

3. **For Control Theory Analysis (Question 22)**:
   - Detailed assessment of trajectory data sufficiency
   - Recommendations for trajectory processing (smoothing, filtering, interpolation)
   - Validation steps for velocity/acceleration/jerk calculations
   - Submovement detection algorithm recommendations
   - Any missing data requirements

4. **General Recommendations**:
   - Data quality improvements
   - Missing data handling strategies
   - Preprocessing pipelines
   - Statistical modeling considerations

---

## Additional Context

- **Sample Size**: N=48 participants
- **Trials per Participant**: ~192 trials (24 trials × 8 blocks)
- **Trials per Condition**: ~24 trials per participant per condition (2 modalities × 2 UI modes × 2 pressure levels = 8 conditions)
- **Error Rate**: ~3-5% overall
- **Data Collection Period**: December 2025
- **Known Issues**: 
  - Pressure logging bug (fixed Dec 8, 2025) affected 7 early participants (excluded from main analysis)
  - Trajectory logging added in December 2025 (may be missing for early participants)

---

## References

- **Data Dictionary**: `data/dict/data_dictionary.md` (complete column specifications)
- **Report**: `Report.qmd` (all planned analyses)
- **Exclusion Criteria**: `EXCLUSION_CRITERIA.md` (participant exclusions)
- **Power Analysis**: `POWER_ANALYSIS_EXPERT_RESPONSE.md` (LBA and control theory power analysis)

---

**Thank you for your assessment!**





