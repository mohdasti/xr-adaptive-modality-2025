# Data Dictionary

Complete specification of all CSV columns in the experiment data.

## Overview

The experiment data is exported as CSV files with **77 columns**. Each row represents a single trial.

**File Format**: CSV (UTF-8 encoding)  
**Column Order**: Fixed (as defined in `app/src/lib/csv.ts`)  
**Headers**: Present in first row

**Last Updated**: December 8, 2025  
**Schema Version**: 2.0

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
- **Description**: Number of velocity peaks (submovements) in cursor trajectory
- **Note**: Quantifies intermittent control strategy

#### 48. `verification_time_ms`
- **Type**: Number (integer)
- **Format**: Milliseconds
- **Example**: `150`, `300`, `500`
- **Units**: Milliseconds (ms)
- **Description**: Time from first target entry to final selection
- **Note**: Separates "ballistic movement" from "precise stopping" phases

---

### Width Scaling Metrics (3 columns)

#### 49. `nominal_width_px`
- **Type**: Number (integer)
- **Format**: Pixels
- **Example**: `40`, `50`, `80`
- **Units**: Pixels (px)
- **Description**: Original target width (design specification)

#### 50. `displayed_width_px`
- **Type**: Number (float)
- **Format**: Pixels
- **Example**: `40.0`, `60.0`, `80.0`
- **Units**: Pixels (px)
- **Description**: Actual rendered target width (after adaptive scaling)

#### 51. `width_scale_factor`
- **Type**: Number (float)
- **Format**: Multiplier
- **Example**: `1.0`, `1.5`, `2.0`
- **Description**: Scale factor applied to target width
- **Formula**: `displayed_width_px / nominal_width_px`
- **Note**: `1.0` = no scaling, `>1.0` = enlarged, `<1.0` = reduced

---

### Alignment Gate Metrics (4 columns)

#### 52. `alignment_gate_enabled`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether alignment gate was active for this trial

#### 53. `alignment_gate_false_triggers`
- **Type**: Integer
- **Format**: Count
- **Example**: `0`, `1`, `2`
- **Description**: Number of false triggers (misalignment detected incorrectly)

#### 54. `alignment_gate_recovery_time_ms`
- **Type**: Number (integer)
- **Format**: Milliseconds
- **Description**: Time spent recovering from false triggers

#### 55. `alignment_gate_mean_recovery_time_ms`
- **Type**: Number (float)
- **Format**: Milliseconds
- **Description**: Mean recovery time across all false triggers in trial

---

### Task Configuration (2 columns)

#### 56. `task_type`
- **Type**: String (categorical)
- **Values**: `'point'`, `'drag'` (if implemented)
- **Example**: `'point'`
- **Description**: Type of task (currently all trials are `'point'`)

#### 57. `drag_distance`
- **Type**: Number (float)
- **Format**: Pixels
- **Description**: Distance dragged (for drag tasks, if implemented)
- **Note**: Currently always `null` (point tasks only)

---

### Display & System Metadata (13 columns)

#### 58-59. `pixels_per_mm`, `pixels_per_degree`
- **Type**: Number (float)
- **Format**: Calibration values
- **Description**: Display calibration from credit card calibration procedure

#### 60-61. `screen_width`, `screen_height`
- **Type**: Integer
- **Format**: Pixels
- **Description**: Physical screen resolution

#### 62-63. `window_width`, `window_height`
- **Type**: Integer
- **Format**: Pixels
- **Description**: Browser window dimensions

#### 64. `device_pixel_ratio`
- **Type**: Number (float)
- **Format**: Ratio
- **Example**: `1.0`, `2.0`, `1.5`
- **Description**: Device pixel ratio (DPR) for HiDPI displays

#### 65-66. `zoom_level`, `zoom_pct`
- **Type**: Number
- **Format**: Zoom factor
- **Description**: Browser zoom level (should be 100% for valid trials)

#### 67-68. `is_fullscreen`, `fullscreen`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Description**: Whether window was in fullscreen mode (required for valid trials)

#### 69-70. `viewport_w`, `viewport_h`
- **Type**: Integer
- **Format**: Pixels
- **Description**: Viewport dimensions

#### 71-72. `focus_blur_count`, `tab_hidden_ms`
- **Type**: Integer
- **Format**: Count / Milliseconds
- **Description**: Window focus/blur events and tab visibility duration
- **Note**: Trials with `tab_hidden_ms > 500ms` should be excluded

#### 73-74. `user_agent`, `browser`
- **Type**: String
- **Format**: Browser identification
- **Example**: `'Chrome'`, `'Firefox'`, `'Safari'`
- **Description**: Browser type and user agent string

#### 75. `dpi`
- **Type**: Number (float)
- **Format**: Device pixel ratio (duplicate of `device_pixel_ratio`)
- **Note**: Legacy field, use `device_pixel_ratio`

---

### Practice & Performance Tracking (2 columns)

#### 76. `practice`
- **Type**: Boolean
- **Format**: `true` / `false`
- **Required**: Yes
- **Description**: Whether this is a practice trial
- **Note**: Practice trials should be excluded from analysis

#### 77. `avg_fps`
- **Type**: Number (float)
- **Format**: Frames per second
- **Example**: `60.0`, `59.8`
- **Description**: Average frame rate during trial

---

### Workload Measures (6 columns)

#### 78-83. NASA-TLX Subscales
- `tlx_mental`: Integer (0-100) - Mental Demand
- `tlx_physical`: Integer (0-100) - Physical Demand
- `tlx_temporal`: Integer (0-100) - Temporal Demand
- `tlx_performance`: Integer (0-100) - Performance (inverted: higher = worse)
- `tlx_effort`: Integer (0-100) - Effort
- `tlx_frustration`: Integer (0-100) - Frustration

**Note**: These values are block-level (same for all trials within a block). Collected after each block via TLX form.

---

### Debrief Responses (3 columns)

#### 84. `debrief_q1_adaptation_noticed`
- **Type**: String (text)
- **Description**: Response to "Did you notice the interface adapting?"

#### 85. `debrief_q2_strategy_changed`
- **Type**: String (text)
- **Description**: Response to "Did you change your strategy?"

#### 86. `debrief_timestamp`
- **Type**: String (ISO timestamp)
- **Description**: When debrief form was submitted

---

## Data Types Summary

| Type | Count | Example Columns |
|------|-------|-----------------|
| String (categorical) | 15 | modality, ui_mode, err_type, confirm_type, browser, block_order |
| Number (integer) | 25 | trial_number, block_number, rt_ms, A, W, age, gaming_hours_per_week |
| Number (float) | 20 | ID, pressure, width_scale_factor, pixels_per_mm, device_pixel_ratio |
| Boolean | 8 | correct, practice, pressure, aging, adaptation_triggered, alignment_gate_enabled |
| Timestamp | 2 | ts, debrief_timestamp |
| Text | 2 | debrief_q1_adaptation_noticed, debrief_q2_strategy_changed |

**Total**: 77 columns

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

## Version History

- **v1.0** (2025-01-15): Initial schema definition (23 columns)
- **v2.0** (2025-12-08): Updated to reflect actual schema (77 columns)
  - Added all new fields (submovement_count, width scaling, alignment gates, etc.)
  - Documented pressure logging bug and fix
  - Removed references to dropped features (aging, pupillometry)
