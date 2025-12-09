# Data Dictionary

Complete specification of all CSV columns in the experiment data.

## Overview

The experiment data is exported as **a single merged CSV file** with **162 columns**. Each row represents a single trial.

**File Format**: CSV (UTF-8 encoding)  
**Column Order**: Fixed (as defined in `app/src/lib/csv.ts`)  
**Headers**: Present in first row  
**Export Method**: Single merged file containing all trial data + TLX data (merged from block-level)

**Last Updated**: December 2025  
**Schema Version**: 3.0

**Note**: Participants download one CSV file that contains all their trial data. TLX (workload) scores are merged into each trial row based on block number.

---

## Column Specifications

### Participant & Session Metadata (13 columns)

#### 1. `pid` (Participant ID)
- **Type**: String
- **Format**: Participant identifier (e.g., `P001`, `P002`)
- **Example**: `P001`
- **Required**: Yes
- **Description**: Unique identifier for each participant

#### 2. `session_number`
- **Type**: Integer
- **Format**: Session number (typically 1)
- **Example**: `1`
- **Required**: Yes
- **Description**: Session identifier (for multi-session studies)

#### 3-13. Demographics
- `age`: Integer (years)
- `gender`: String (e.g., `male`, `female`, `other`)
- `gaming_hours_per_week`: Number (hours)
- `input_device`: String (e.g., `mouse`, `trackpad`)
- `vision_correction`: String (e.g., `none`, `glasses`, `contacts`)
- `wearing_correction_now`: Boolean
- `dominant_hand`: String (e.g., `left`, `right`)
- `operating_hand`: String (e.g., `left`, `right`)
- `using_dominant_hand`: Boolean
- `motor_impairment`: Boolean
- `fatigue_level`: Integer (1-10 scale)

---

### Trial Structure & Timing (7 columns)

#### 14. `ts` (Timestamp)
- **Type**: Number (milliseconds since epoch)
- **Format**: Unix timestamp in milliseconds
- **Example**: `1698765432100`
- **Required**: Yes
- **Description**: When the trial started (trial:start event timestamp)

#### 15. `trial_number`
- **Type**: Integer
- **Format**: Global trial number across all blocks
- **Example**: `1`, `50`, `192`
- **Required**: Yes
- **Description**: Sequential trial number across entire session

#### 16. `trial_in_block`
- **Type**: Integer
- **Format**: Trial number within current block
- **Example**: `1`, `2`, `10`
- **Required**: Yes
- **Description**: Trial position within the current block

#### 17. `block_number`
- **Type**: Integer
- **Format**: Block number (1-8)
- **Example**: `1`, `2`, `8`
- **Required**: Yes
- **Description**: Which block of trials this trial belongs to

#### 18. `block_order`
- **Type**: String
- **Format**: Condition code (e.g., `HaS_P0`, `GaA_P1`)
- **Example**: `HaS_P0`, `GaA_P1`
- **Required**: Yes
- **Description**: Williams design condition code for this block
- **Encoding**: `{Modality}{UI_Mode}_{Pressure}`
  - Modality: `H`=Hand, `G`=Gaze
  - UI Mode: `S`=Static, `A`=Adaptive
  - Pressure: `P0`=OFF, `P1`=ON

#### 19. `block_trial_count`
- **Type**: Integer
- **Format**: Number of trials in this block
- **Example**: `10`
- **Required**: Yes
- **Description**: Total trials in the current block

#### 20-21. `block`, `trial`
- **Type**: Integer
- **Format**: Duplicate of `block_number` and `trial_in_block` (legacy)
- **Note**: Redundant with `block_number` and `trial_in_block`

---

### Experimental Conditions (4 columns)

#### 22. `modality` (Input Modality)
- **Type**: String (categorical)
- **Values**: `'hand'` or `'gaze'`
- **Example**: `'hand'`, `'gaze'`
- **Required**: Yes
- **Description**: Which input modality was used for this trial
- **Encoding**:
  - `'hand'`: Direct pointing (move cursor + click)
  - `'gaze'`: Gaze-based (hover + dwell/Space confirmation)

#### 23. `ui_mode` (UI Mode/Condition)
- **Type**: String (categorical)
- **Values**: `'static'` or `'adaptive'`
- **Example**: `'static'`, `'adaptive'`
- **Required**: Yes
- **Description**: UI mode or experimental condition
- **Encoding**:
  - `'static'`: Non-adaptive UI (baseline)
  - `'adaptive'`: Adaptive UI with modality-specific interventions

#### 24. `pressure` (Pressure Condition)
- **Type**: Integer (0 or 1)
- **Format**: Binary indicator
- **Example**: `0`, `1`
- **Required**: Yes
- **Description**: Time pressure condition
- **Encoding**:
  - `0`: Pressure OFF (no time constraint)
  - `1`: Pressure ON (visible countdown timer, 6s timeout)
- **Note**: Fixed bug on 2025-12-08 (commit `04758db`). Prior to fix, all trials logged as `1`.

#### 25. `aging` (Aging Proxy)
- **Type**: Boolean
- **Format**: `true` / `false`
- **Example**: `false`
- **Required**: No (default: false)
- **Description**: Whether aging proxy (reduced contrast/blur) was enabled
- **Note**: This factor was dropped from the experimental design. Always `false` in current data.

---

### Fitts' Law Parameters (5 columns)

#### 26. `ID` (Index of Difficulty)
- **Type**: Number (float)
- **Format**: Shannon formulation
- **Example**: `1.7`, `3.3`, `5.0`
- **Units**: Bits
- **Required**: Yes
- **Description**: Fitts's Law Index of Difficulty (ID = log₂(A/W + 1))
- **Formula**: ID = log₂(A/W + 1)

#### 27. `index_of_difficulty_nominal`
- **Type**: Number (float)
- **Format**: Same as `ID`
- **Note**: Duplicate of `ID` (nominal difficulty before adaptation)

#### 28. `A` (Amplitude)
- **Type**: Number (integer)
- **Format**: Distance in pixels
- **Example**: `200`, `400`, `600`
- **Units**: Pixels (px)
- **Required**: Yes
- **Description**: Distance from start position to target center

#### 29. `target_distance_A`
- **Type**: Number (integer)
- **Format**: Same as `A`
- **Note**: Duplicate of `A`

#### 30. `W` (Width)
- **Type**: Number (integer)
- **Format**: Size in pixels
- **Example**: `30`, `50`, `100`
- **Units**: Pixels (px)
- **Required**: Yes
- **Description**: Nominal target width (diameter for circular targets)
- **Note**: May be modified by adaptive policy (width inflation)

---

### Target & Endpoint Positions (7 columns)

#### 31-32. `target_x`, `target_y`
- **Type**: Number (integer)
- **Format**: X/Y coordinates in pixels
- **Example**: `300`, `200`
- **Units**: Pixels (px)
- **Description**: Target position on canvas (legacy, use `target_center_x/y`)

#### 33-34. `target_center_x`, `target_center_y`
- **Type**: Number (float)
- **Format**: X/Y coordinates in pixels
- **Example**: `300.5`, `200.3`
- **Units**: Pixels (px)
- **Required**: Yes
- **Description**: Precise target center coordinates

#### 35-36. `endpoint_x`, `endpoint_y`
- **Type**: Number (float)
- **Format**: X/Y coordinates in pixels
- **Example**: `302.1`, `198.7`
- **Units**: Pixels (px)
- **Description**: Actual click/confirmation position

#### 37. `endpoint_error_px`
- **Type**: Number (float)
- **Format**: Euclidean distance in pixels
- **Example**: `5.2`
- **Units**: Pixels (px)
- **Description**: Euclidean distance from endpoint to target center

---

### Performance Metrics (4 columns)

#### 38. `projected_error_px`
- **Type**: Number (float)
- **Format**: Scalar projection along task axis
- **Example**: `3.1`
- **Units**: Pixels (px)
- **Required**: Yes (for ISO 9241-9 calculations)
- **Description**: Error projected onto task axis (for We calculation)
- **Formula**: `(endpoint - target_center) · task_axis_vector / ||task_axis_vector||`

#### 39. `rt_ms` (Reaction Time / Movement Time)
- **Type**: Number (integer)
- **Format**: Milliseconds
- **Example**: `450`, `650`, `1200`
- **Units**: Milliseconds (ms)
- **Required**: Yes
- **Description**: Time from target appearance to click/confirmation
- **Range**: Typically 150 to 6000 ms (exclusions: < 150ms or > 6000ms)

#### 40. `correct` (Trial Success)
- **Type**: Boolean
- **Format**: `true` / `false` (string or boolean)
- **Example**: `true`, `false`
- **Required**: Yes
- **Description**: Whether the trial was completed successfully
- **Encoding**:
  - `true`: Target hit successfully
  - `false`: Target missed or timeout occurred

#### 41. `err_type` (Error Type)
- **Type**: String (categorical)
- **Values**: `'miss'`, `'timeout'`, `'slip'`
- **Example**: `'miss'`, `'timeout'`
- **Description**: Type of error (only present when correct=false)
- **Encoding**:
  - `'miss'`: Click/confirm outside target bounds
  - `'timeout'`: No response within time limit
  - `'slip'`: Premature confirmation (gaze only - Space without hover)

---

### Gaze-Specific Metrics (3 columns)

#### 42. `hover_ms` (Hover Duration)
- **Type**: Number (integer)
- **Format**: Milliseconds
- **Example**: `350`, `500`, `750`
- **Units**: Milliseconds (ms)
- **Description**: Hover duration before confirmation (gaze modality only)
- **Range**: 0 to rt_ms
- **Note**: Only logged for gaze trials with dwell > 0ms

#### 43. `confirm_type` (Confirmation Method)
- **Type**: String (categorical)
- **Values**: `'click'`, `'space'`, `'dwell'`
- **Example**: `'click'`, `'space'`
- **Description**: How the target was confirmed
- **Encoding**:
  - `'click'`: Direct mouse/touch click (hand modality)
  - `'space'`: Space key confirmation (gaze modality)
  - `'dwell'`: Auto-confirm via dwell time (gaze modality, dwell > 0ms)

#### 44. `pupil_z_med` (Pupil Diameter Z-Score)
- **Type**: Number (float)
- **Format**: Standardized z-score
- **Example**: `0.5`, `-0.3`, `1.2`
- **Units**: Z-score (standard deviations from mean)
- **Description**: Median z-score of pupil diameter proxy
- **Note**: This feature was dropped from the experimental design. Always `null` in current data.

---

### Adaptive System Metrics (5 columns)

#### 45. `adaptation_triggered`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether adaptive intervention was triggered in this trial

#### 46. `target_reentry_count`
- **Type**: Integer
- **Format**: Count
- **Example**: `0`, `1`, `2`
- **Description**: Number of times cursor exited and re-entered target before selection
- **Note**: Proxy for control stability (gaze modality)

#### 47. `submovement_count`
- **Type**: Integer
- **Format**: Count
- **Example**: `0`, `1`, `2`
- **Note**: **DEPRECATED** - Use `submovement_count_legacy` or `submovement_count_recomputed` instead
- **Description**: Legacy submovement count (kept for backward compatibility)

#### 48. `verification_time_ms`
- **Type**: Number (integer) | null
- **Format**: Milliseconds
- **Example**: `150`, `300`, `500`, `null`
- **Units**: Milliseconds (ms)
- **Description**: Time from first target entry to final selection (verification phase duration)
- **Note**: Separates "ballistic movement" from "precise stopping" phases. Null if target was never entered.

#### 49-58. LBA-Critical Timing Fields (Verification Phase Segmentation)

These fields enable Linear Ballistic Accumulator (LBA) modeling by segmenting the verification phase.

##### 49. `entered_target`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether the cursor entered the target at least once during the trial

##### 50. `first_entry_time_ms`
- **Type**: Number (integer) | null
- **Format**: Milliseconds relative to trial start
- **Example**: `250`, `450`, `null`
- **Units**: Milliseconds (ms)
- **Description**: Time of first target entry (relative to trial start)
- **Note**: Null if target was never entered

##### 51. `last_exit_time_ms`
- **Type**: Number (integer) | null
- **Format**: Milliseconds relative to trial start
- **Example**: `300`, `500`, `null`
- **Units**: Milliseconds (ms)
- **Description**: Time of last target exit (relative to trial start)
- **Note**: Null if cursor never exited after entering, or if target was never entered

##### 52. `time_in_target_total_ms`
- **Type**: Number (integer)
- **Format**: Milliseconds
- **Example**: `0`, `150`, `300`
- **Units**: Milliseconds (ms)
- **Description**: Total cumulative time spent inside target (sum of all entry durations)
- **Note**: Includes time if cursor is still in target at trial end

##### 53. `verification_start_time_ms`
- **Type**: Number (integer) | null
- **Format**: Milliseconds relative to trial start
- **Example**: `250`, `450`, `null`
- **Units**: Milliseconds (ms)
- **Description**: Start of verification phase (same as `first_entry_time_ms`)
- **Note**: Null if target was never entered

##### 54. `verification_end_time_ms`
- **Type**: Number (integer) | null
- **Format**: Milliseconds relative to trial start
- **Example**: `400`, `600`, `null`
- **Units**: Milliseconds (ms)
- **Description**: End of verification phase (confirm event time if confirmed, null for timeout)
- **Note**: Null if trial ended in timeout without confirmation

##### 55. `confirm_event_time_ms`
- **Type**: Number (integer) | null
- **Format**: Milliseconds relative to trial start
- **Example**: `400`, `600`, `null`
- **Units**: Milliseconds (ms)
- **Description**: Time when confirmation event occurred (click/space/dwell)
- **Note**: Null for timeout trials

##### 56. `confirm_event_source`
- **Type**: String (categorical)
- **Values**: `'click'`, `'space'`, `'dwell'`, `'none'`
- **Example**: `'click'`, `'dwell'`, `'none'`
- **Description**: Source of confirmation event
- **Encoding**:
  - `'click'`: Mouse/touch click (hand modality)
  - `'space'`: Space key press (gaze confirmation mode)
  - `'dwell'`: Auto-confirm via dwell time (gaze dwell mode)
  - `'none'`: No confirmation (timeout)

##### 57. `timeout_limit_ms`
- **Type**: Number (integer)
- **Format**: Milliseconds
- **Example**: `6000`
- **Units**: Milliseconds (ms)
- **Description**: Timeout limit for this trial (typically 6000ms)

##### 58. `timeout_triggered`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether the trial ended due to timeout
- **Note**: `true` for timeout errors, `false` for successful completions or misses

##### 59. `time_remaining_ms_at_confirm`
- **Type**: Number (integer) | null
- **Format**: Milliseconds
- **Example**: `1500`, `3000`, `null`
- **Units**: Milliseconds (ms)
- **Description**: Time remaining on timeout clock when trial completed
- **Note**: Null for timeout trials or if timeout was not set

##### 60. `trial_end_reason`
- **Type**: String (categorical)
- **Values**: `'confirmed'`, `'timeout'`, `'aborted'`, `'invalid'`
- **Example**: `'confirmed'`, `'timeout'`
- **Description**: Reason why the trial ended
- **Encoding**:
  - `'confirmed'`: Trial completed with confirmation event (hit or miss)
  - `'timeout'`: Trial ended due to timeout
  - `'aborted'`: Trial was aborted (rare)
  - `'invalid'`: Trial state invalid (should not occur)

#### 61. `trajectory`
- **Type**: String (JSON) | null
- **Format**: JSON string containing array of trajectory points, or `[]` for empty, or `null` for practice trials
- **Example**: `[{"x": 100.5, "y": 200.3, "t": 0.0}, {"x": 101.2, "y": 201.1, "t": 16.7}, ...]`
- **Description**: Cursor position over time during trial, logged at ~60fps
- **Structure**: Array of objects with:
  - `x`: Cursor X position (pixels, float)
  - `y`: Cursor Y position (pixels, float)
  - `t`: Time relative to trial start (milliseconds, float)
- **Note**: 
  - Always logged for non-practice trials (at least start + end points)
  - `[]` (empty array) for non-practice trials with no movement
  - `null` for practice trials
  - Can be parsed in R: `jsonlite::fromJSON(trajectory)`
  - Used for advanced control theory analyses (velocity profiles, submovement detection, smoothness metrics)
  - Automatically downsampled if >600 points (see `traj_downsample_factor`)

---

### Width Scaling Metrics (3 columns)

#### 71. `nominal_width_px`
- **Type**: Number (integer)
- **Format**: Pixels
- **Example**: `40`, `50`, `80`
- **Units**: Pixels (px)
- **Description**: Original target width (design specification)

#### 72. `displayed_width_px`
- **Type**: Number (float)
- **Format**: Pixels
- **Example**: `40.0`, `60.0`, `80.0`
- **Units**: Pixels (px)
- **Description**: Actual rendered target width (after adaptive scaling)

#### 73. `width_scale_factor`
- **Type**: Number (float)
- **Format**: Multiplier
- **Example**: `1.0`, `1.5`, `2.0`
- **Description**: Scale factor applied to target width
- **Formula**: `displayed_width_px / nominal_width_px`
- **Note**: `1.0` = no scaling, `>1.0` = enlarged, `<1.0` = reduced

---

### Alignment Gate Metrics (4 columns)

#### 74. `alignment_gate_enabled`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether alignment gate was active for this trial

#### 75. `alignment_gate_false_triggers`
- **Type**: Integer
- **Format**: Count
- **Example**: `0`, `1`, `2`
- **Description**: Number of false triggers (misalignment detected incorrectly)

#### 76. `alignment_gate_recovery_time_ms`
- **Type**: Number (integer)
- **Format**: Milliseconds
- **Description**: Time spent recovering from false triggers

#### 77. `alignment_gate_mean_recovery_time_ms`
- **Type**: Number (float)
- **Format**: Milliseconds
- **Description**: Mean recovery time across all false triggers in trial

---

### Submovement Analysis (6 columns)

#### 78. `submovement_count_legacy`
- **Type**: Integer
- **Format**: Count
- **Example**: `0`, `1`, `2`
- **Description**: Legacy submovement count (on-the-fly detection, kept for comparison)
- **Note**: Original algorithm using velocity peak detection during trial

#### 79. `submovement_count_recomputed`
- **Type**: Integer
- **Format**: Count
- **Example**: `0`, `1`, `2`, `3`
- **Description**: Recomputed submovement count from trajectory (post-trial analysis)
- **Note**: More reliable and reproducible than legacy method

#### 80. `submovement_primary_peak_v`
- **Type**: Number (float) | null
- **Format**: Velocity in px/s
- **Example**: `250.5`, `300.0`, `null`
- **Units**: Pixels per second (px/s)
- **Description**: Velocity of the primary (highest) peak in speed profile
- **Note**: Null if no peaks detected

#### 81. `submovement_primary_peak_t_ms`
- **Type**: Number (integer) | null
- **Format**: Milliseconds relative to trial start
- **Example**: `150`, `250`, `null`
- **Units**: Milliseconds (ms)
- **Description**: Time of primary peak occurrence
- **Note**: Null if no peaks detected

#### 82. `submovement_algorithm`
- **Type**: String
- **Format**: Algorithm identifier
- **Example**: `'peak_detection_v1.0'`
- **Description**: Algorithm used for submovement computation
- **Note**: Currently `'peak_detection_v1.0'` (speed profile peak detection with smoothing)

#### 83. `submovement_params_json`
- **Type**: String (JSON)
- **Format**: JSON string with algorithm parameters
- **Example**: `{"min_peak_distance_ms": 50, "min_peak_prominence": 20, "smoothing_window": 5}`
- **Description**: Parameters used for submovement detection
- **Structure**:
  - `min_peak_distance_ms`: Minimum time between peaks (default: 50ms)
  - `min_peak_prominence`: Minimum peak velocity in px/s (default: 20)
  - `smoothing_window`: Moving average window size (default: 5)

### Task Configuration (2 columns)

#### 84. `task_type`
- **Type**: String (categorical)
- **Values**: `'point'`, `'drag'` (if implemented)
- **Example**: `'point'`
- **Description**: Type of task (currently all trials are `'point'`)

#### 85. `drag_distance`
- **Type**: Number (float)
- **Format**: Pixels
- **Description**: Distance dragged (for drag tasks, if implemented)
- **Note**: Currently always `null` (point tasks only)

---

### Condition Integrity Fields (7 columns)

These fields ensure data quality by tracking the intended experimental condition and detecting any mismatches.

#### 86. `cond_modality`
- **Type**: String (categorical)
- **Values**: `'hand'` or `'gaze'`
- **Description**: Modality from frozen condition (single source of truth)
- **Note**: Should match `modality` - use `condition_mismatch_flag` to check

#### 87. `cond_ui_mode`
- **Type**: String (categorical)
- **Values**: `'static'` or `'adaptive'`
- **Description**: UI mode from frozen condition (single source of truth)
- **Note**: Should match `ui_mode`

#### 88. `cond_pressure`
- **Type**: Number (0 or 1)
- **Format**: Binary indicator
- **Description**: Pressure condition from frozen condition (single source of truth)
- **Note**: Should match `pressure`

#### 89. `condition_id`
- **Type**: String
- **Format**: Condition identifier
- **Example**: `'hand_static_p0'`, `'gaze_adaptive_p1'`
- **Description**: Unique condition identifier combining modality, UI mode, and pressure
- **Format**: `{modality}_{ui_mode}_p{pressure}`

#### 90. `condition_version`
- **Type**: String
- **Format**: Version string
- **Example**: `'1.0'`
- **Description**: Version of condition encoding scheme

#### 91. `app_build_sha`
- **Type**: String
- **Format**: Git commit hash or build identifier
- **Example**: `'abc123def'`, `'dev'`
- **Description**: Build/commit identifier for reproducibility
- **Note**: Injected at build time via Vite environment variable

#### 92. `condition_mismatch_flag`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether any condition field mismatches the frozen condition
- **Note**: `true` indicates potential data quality issue

### Counterbalancing Fields (3 columns)

#### 93. `sequence_id`
- **Type**: Integer
- **Format**: Sequence index (1-8)
- **Example**: `1`, `2`, `8`
- **Description**: Williams design sequence assigned to participant
- **Note**: Derived from participant index modulo 8

#### 94. `sequence_table_version`
- **Type**: String
- **Format**: Hash identifier
- **Example**: `'v1a2b3c4'`
- **Description**: Version hash of the Williams counterbalancing matrix
- **Note**: Used to verify counterbalancing table consistency

#### 95. `session_invalid`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether session validation failed (e.g., wrong number of blocks, duplicate conditions)
- **Note**: Set by post-session validation, not per-trial

### QC/Exclusion Telemetry (5 columns)

These fields enable quality control and exclusion of invalid trials.

#### 96. `zoom_pct_measured`
- **Type**: Number (float) | null
- **Format**: Percentage
- **Example**: `100.0`, `95.0`, `105.0`
- **Units**: Percentage (%)
- **Description**: Measured browser zoom level at trial start
- **Note**: Should be 100% for valid trials. Measured reliably (not from browser UI).

#### 97. `tab_hidden_count`
- **Type**: Integer
- **Format**: Count
- **Example**: `0`, `1`, `2`
- **Description**: Number of times the browser tab was hidden during trial
- **Note**: Trials with >0 should be reviewed for exclusion

#### 98. `tab_hidden_total_ms`
- **Type**: Number (integer)
- **Format**: Milliseconds
- **Example**: `0`, `150`, `500`
- **Units**: Milliseconds (ms)
- **Description**: Total cumulative time the tab was hidden during trial
- **Note**: Trials with >500ms should be excluded

#### 99. `trial_invalid_reason`
- **Type**: String | null
- **Format**: Semicolon-separated violation codes
- **Example**: `'tab_hidden_2times;tab_hidden_500ms'`, `'zoom_95.0pct'`, `null`
- **Description**: Reason(s) why trial is invalid (if any)
- **Violation Codes**:
  - `tab_hidden_{N}times`: Tab hidden N times
  - `tab_hidden_{N}ms`: Tab hidden for N milliseconds
  - `focus_blur_{N}times`: Window lost focus N times
  - `zoom_{N}pct`: Zoom level not 100%

#### 100. `trial_valid`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether trial passed quality control checks
- **Note**: `false` if any violations detected (see `trial_invalid_reason`)

### Eye-Tracking Quality (4 columns)

**Note**: These fields are included for schema compatibility but are always null/0 since this study uses **simulated gaze**, not actual eye tracking.

#### 101. `eye_valid_sample_pct`
- **Type**: null (always)
- **Description**: Percentage of valid eye tracking samples
- **Note**: Always `null` for simulated gaze

#### 102. `eye_dropout_count`
- **Type**: 0 (always)
- **Description**: Number of eye tracking dropouts
- **Note**: Always `0` for simulated gaze

#### 103. `eye_avg_confidence`
- **Type**: null (always)
- **Description**: Average confidence score from eye tracker
- **Note**: Always `null` for simulated gaze

#### 104. `calibration_age_ms`
- **Type**: Number (integer) | null
- **Format**: Milliseconds
- **Example**: `5000`, `10000`, `null`
- **Units**: Milliseconds (ms)
- **Description**: Time since last calibration (for simulated gaze calibration timestamp)
- **Note**: Tracks calibration timestamp age, not actual eye tracking calibration

### Display & System Metadata (13 columns)

#### 105-106. `pixels_per_mm`, `pixels_per_degree`
- **Type**: Number (float)
- **Format**: Calibration values
- **Description**: Display calibration from credit card calibration procedure

#### 107-108. `screen_width`, `screen_height`
- **Type**: Integer
- **Format**: Pixels
- **Description**: Physical screen resolution

#### 109-110. `window_width`, `window_height`
- **Type**: Integer
- **Format**: Pixels
- **Description**: Browser window dimensions

#### 111. `device_pixel_ratio`
- **Type**: Number (float)
- **Format**: Ratio
- **Example**: `1.0`, `2.0`, `1.5`
- **Description**: Device pixel ratio (DPR) for HiDPI displays

#### 112-113. `zoom_level`, `zoom_pct`
- **Type**: Number
- **Format**: Zoom factor
- **Description**: Browser zoom level (should be 100% for valid trials)

#### 114-115. `is_fullscreen`, `fullscreen`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether window was in fullscreen mode (required for valid trials)

#### 116-117. `viewport_w`, `viewport_h`
- **Type**: Integer
- **Format**: Pixels
- **Description**: Viewport dimensions

#### 118-119. `focus_blur_count`, `tab_hidden_ms`
- **Type**: Integer
- **Format**: Count / Milliseconds
- **Description**: Window focus/blur events and tab visibility duration
- **Note**: Trials with `tab_hidden_ms > 500ms` should be excluded

#### 120-121. `user_agent`, `browser`
- **Type**: String
- **Format**: Browser identification
- **Example**: `'Chrome'`, `'Firefox'`, `'Safari'`
- **Description**: Browser type and user agent string

#### 122. `dpi`
- **Type**: Number (float)
- **Format**: Device pixel ratio (duplicate of `device_pixel_ratio`)
- **Note**: Legacy field, use `device_pixel_ratio`

---

### Export Metadata (5 columns)

#### 123. `schema_version`
- **Type**: String
- **Format**: Version identifier
- **Example**: `'v3'`
- **Description**: Schema version of the CSV export
- **Note**: Set at export time, same for all rows in file

#### 124. `exported_at_iso`
- **Type**: String (ISO timestamp)
- **Format**: ISO 8601 timestamp
- **Example**: `'2025-12-15T10:30:45.123Z'`
- **Description**: When the CSV file was exported
- **Note**: Set at export time, same for all rows in file

#### 125. `data_quality_flags_json`
- **Type**: String (JSON) | null
- **Format**: JSON string with computed quality flags
- **Example**: `{"trajectory_missing": true, "pressure_bug_detected": true}`
- **Description**: Computed data quality flags at export time
- **Structure**: Object with boolean flags:
  - `trajectory_missing`: Trajectory data unavailable
  - `pressure_bug_detected`: Participant affected by pressure logging bug

#### 126. `traj_usable`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether trajectory data is usable for analysis
- **Note**: `false` if trajectory missing or empty

#### 127. `exclude_main`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether participant should be excluded from main analysis
- **Note**: `true` for participants affected by pressure bug or other data quality issues

### Practice & Performance Tracking (2 columns)

#### 128. `practice`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Required**: Yes
- **Description**: Whether this is a practice trial
- **Note**: Practice trials should be excluded from analysis

#### 129. `avg_fps`
- **Type**: Number (float)
- **Format**: Frames per second
- **Example**: `60.0`, `59.8`
- **Description**: Average frame rate during trial

---

### Workload Measures (6 columns)

#### 130-135. NASA-TLX Subscales
- `tlx_mental`: Integer (0-100) - Mental Demand
- `tlx_physical`: Integer (0-100) - Physical Demand
- `tlx_temporal`: Integer (0-100) - Temporal Demand
- `tlx_performance`: Integer (0-100) - Performance (inverted: higher = worse)
- `tlx_effort`: Integer (0-100) - Effort
- `tlx_frustration`: Integer (0-100) - Frustration

**Note**: These values are block-level (same for all trials within a block). Collected after each block via TLX form.

---

### Debrief Responses (3 columns)

#### 136. `debrief_q1_adaptation_noticed`
- **Type**: String (text)
- **Description**: Response to "Did you notice the interface adapting?"

#### 137. `debrief_q2_strategy_changed`
- **Type**: String (text)
- **Description**: Response to "Did you change your strategy?"

#### 138. `debrief_timestamp`
- **Type**: String (ISO timestamp)
- **Description**: When debrief form was submitted

---

## Data Types Summary

| Type | Count | Example Columns |
|------|-------|-----------------|
| String (categorical) | 20 | modality, ui_mode, err_type, confirm_type, browser, block_order, condition_id, trial_end_reason |
| Number (integer) | 45 | trial_number, block_number, rt_ms, A, W, age, gaming_hours_per_week, traj_point_count, sequence_id |
| Number (float) | 35 | ID, pressure, width_scale_factor, pixels_per_mm, device_pixel_ratio, zoom_pct_measured, submovement_primary_peak_v |
| Boolean | 12 | correct, practice, pressure, aging, entered_target, timeout_triggered, trial_valid, condition_mismatch_flag |
| Timestamp | 3 | ts, debrief_timestamp, exported_at_iso |
| Text | 2 | debrief_q1_adaptation_noticed, debrief_q2_strategy_changed |
| JSON String | 4 | trajectory, submovement_params_json, data_quality_flags_json |

**Total**: 162 columns (including trajectory and all new fields)

---

## Required vs Optional

**Required (Always Present):**
- Participant: `pid`, `session_number`
- Trial structure: `ts`, `trial_number`, `trial_in_block`, `block_number`, `block_order`
- Conditions: `modality`, `ui_mode`, `pressure`
- Performance: `rt_ms`, `correct`, `practice`
- Fitts parameters: `A`, `W`, `ID`

**Conditional (Present When Applicable):**
- Gaze-specific: `hover_ms`, `confirm_type` (gaze trials only)
- Error details: `err_type` (only when correct=false)
- TLX: All `tlx_*` columns (after block completion)
- Debrief: All `debrief_*` columns (after session completion)
- Adaptive metrics: `width_scale_factor`, `submovement_count` (when adaptive UI active)

**Dropped Features (Always Null):**
- `aging`: Always `false` (factor dropped from design)
- `pupil_z_med`: Always `null` (webcam pupillometry dropped)

---

## Data Quality Checks

### Validation Rules

1. **RT Range**: 150 ≤ rt_ms ≤ 6000 (exclude outliers)
2. **ID Formula**: ID = log₂(A/W + 1) (±0.1 tolerance)
3. **TLX Range**: 0 ≤ tlx_* ≤ 100 for all TLX subscales
4. **Coordinates**: 0 ≤ target_center_x ≤ screen_width, 0 ≤ target_center_y ≤ screen_height
5. **Boolean Consistency**: If correct=true, err_type should be empty/null
6. **Modality Match**: confirm_type matches modality (click for hand, space/dwell for gaze)
7. **Timestamp Order**: ts increases monotonically within participant
8. **Display Requirements**: zoom_level = 100%, is_fullscreen = true, tab_hidden_ms ≤ 500ms
9. **Pressure Values**: Must be 0 or 1 (not continuous)

### Exclusions

**Trial-level exclusions:**
- rt_ms < 150ms (anticipation)
- rt_ms > 6000ms (timeout error)
- correct is null
- practice = true
- zoom_level ≠ 100%
- is_fullscreen = false
- tab_hidden_ms > 500ms
- Missing required columns

**Participant-level exclusions:**
- >40% of trials excluded due to display violations
- Incomplete data collection (see `EXCLUSION_CRITERIA.md`)

---

## Known Issues & Fixes

### Pressure Condition Logging Bug (Fixed 2025-12-08)

**Issue**: Prior to commit `04758db`, all trials were logged with `pressure = 1` regardless of block condition.

**Root Cause**: In `TaskPane.tsx` line 1105, the code passed `pressure={pressure}` (always 1.0) instead of `pressure={pressureEnabled ? 1 : 0}`.

**Impact**: 
- 7 participants (P002, P003, P007, P008, P015, P039, P040) have only `pressure = 1` data
- These participants must be excluded from the main 2×2×2 factorial analysis
- See `EXCLUSION_CRITERIA.md` for details

**Fix Status**: ✅ Fixed and deployed (commit `04758db`)

---

## CSV Format

**Encoding**: UTF-8  
**Delimiter**: Comma (`,`)  
**Quote Character**: `"` (if contains comma/newline)  
**Line Endings**: Unix (LF) or Windows (CRLF)

**Example Row:**
```csv
pid,session_number,age,gender,...,modality,ui_mode,pressure,...,rt_ms,correct,...
P001,1,25,male,...,hand,static,1,...,450,true,...
```

---

## Export Format

**Single CSV File**: Participants download one merged CSV file containing:
- All trial data (one row per trial)
- TLX (workload) scores merged into each trial row based on block number
- All metadata, quality flags, and export information

**File Naming**: `{participant_id}_{timestamp}_merged.csv`

**Note**: The `downloadCSV()` function automatically uses `toMergedCSV()` which merges TLX data from block-level storage into trial rows, ensuring a single comprehensive file.

## Version History

- **v1.0** (2025-01-15): Initial schema definition (23 columns)
- **v2.0** (2025-12-08): Updated to reflect actual schema (77 columns)
  - Added all new fields (submovement_count, width scaling, alignment gates, etc.)
  - Documented pressure logging bug and fix
  - Removed references to dropped features (aging, pupillometry)
- **v3.0** (2025-12): Major expansion (162 columns)
  - Added LBA-critical timing fields (verification phase segmentation)
  - Added trajectory quality metrics
  - Added submovement recomputation from trajectory
  - Added condition integrity fields
  - Added counterbalancing validation fields
  - Added QC/exclusion telemetry
  - Added export metadata (schema version, export timestamp)
  - Added backward compatibility flags
  - Clarified simulated gaze (no actual eye tracking)
