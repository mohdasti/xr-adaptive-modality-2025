# Data Dictionary

Complete specification of all CSV columns in the experiment data.

## Overview

The experiment data is exported as CSV files with 23 columns. Each row represents a single trial.

**File Format**: CSV (UTF-8 encoding)  
**Column Order**: Fixed (as defined below)  
**Headers**: Present in first row

## Column Specifications

### 1. `pid` (Participant ID)

- **Type**: String (hashed)
- **Format**: SHA256 hex digest
- **Example**: `a3f5b8c2d1e4f6a7b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2`
- **Units**: N/A
- **Required**: Yes
- **Anonymization**: Hashed with salt before storage
- **Description**: Unique identifier for each participant (anonymized)

---

### 2. `ts` (Timestamp)

- **Type**: Integer (milliseconds since epoch)
- **Format**: Unix timestamp in milliseconds
- **Example**: `1698765432100`
- **Units**: Milliseconds (ms)
- **Required**: Yes
- **Description**: When the trial started (trial:start event timestamp)
- **Range**: Typically 1970 to current year

---

### 3. `block` (Block Number)

- **Type**: Integer
- **Format**: Sequential block number
- **Example**: `1`, `2`, `3`
- **Units**: Block index (1-indexed)
- **Required**: No (default: 1)
- **Description**: Which block of trials this trial belongs to
- **Range**: Typically 1-10 (varies by study length)

---

### 4. `trial` (Trial Number)

- **Type**: Integer
- **Format**: Sequential trial number within block
- **Example**: `1`, `2`, `15`
- **Units**: Trial index (1-indexed)
- **Required**: Yes
- **Description**: Trial number within the current block
- **Range**: Typically 1-30 (varies by block configuration)

---

### 5. `modality` (Input Modality)

- **Type**: String (categorical)
- **Values**: `'hand'` or `'gaze'`
- **Example**: `'hand'`, `'gaze'`
- **Units**: N/A
- **Required**: No
- **Description**: Which input modality was used for this trial
- **Encoding**:
  - `'hand'`: Direct pointing (move cursor + click)
  - `'gaze'`: Gaze-based (hover + dwell/Space confirmation)

---

### 6. `ui_mode` (UI Mode/Condition)

- **Type**: String (categorical)
- **Values**: `'standard'`, `'minimal'`, `'enhanced'`
- **Example**: `'standard'`
- **Units**: N/A
- **Required**: No
- **Description**: UI mode or experimental condition
- **Encoding**:
  - `'standard'`: Default UI
  - `'minimal'`: Reduced UI elements
  - `'enhanced'`: Additional UI feedback

---

### 7. `pressure` (Pressure Level)

- **Type**: Number (float)
- **Format**: 0.0 to 2.0
- **Example**: `1.0`, `1.5`, `2.0`
- **Units**: Pressure multiplier (dimensionless)
- **Required**: No (default: 1.0)
- **Description**: Time pressure level (1.0 = normal, >1.0 = high pressure)
- **Range**: 0.0 (no pressure) to 2.0 (maximum pressure)

---

### 8. `aging` (Aging Proxy)

- **Type**: Boolean
- **Format**: `true` / `false` (string)
- **Example**: `true`, `false`
- **Units**: N/A
- **Required**: No (default: false)
- **Description**: Whether aging proxy (reduced contrast/blur) was enabled
- **Encoding**: `true` = aging effects ON, `false` = aging effects OFF

---

### 9. `ID` (Index of Difficulty)

- **Type**: Number (float)
- **Format**: Shannon formulation
- **Example**: `1.7`, `3.3`, `5.0`
- **Units**: Bits
- **Required**: No
- **Description**: Fitts's Law Index of Difficulty (ID = log₂(A/W + 1))
- **Range**: Typically 1.0 to 7.0 bits
- **Formula**: ID = log₂(A/W + 1)
  - Where A = amplitude (distance to target)
  - Where W = width (target size)

---

### 10. `A` (Amplitude)

- **Type**: Number (integer)
- **Format**: Distance in pixels
- **Example**: `200`, `400`, `600`
- **Units**: Pixels (px)
- **Required**: No
- **Description**: Distance from start position to target center
- **Range**: Typically 50 to 800 pixels

---

### 11. `W` (Width)

- **Type**: Number (integer)
- **Format**: Size in pixels
- **Example**: `30`, `50`, `100`
- **Units**: Pixels (px)
- **Required**: No
- **Description**: Target width (diameter for circular targets)
- **Range**: Typically 20 to 200 pixels
- **Note**: May be modified by adaptive policy (inflate_width action)

---

### 12. `target_x` (Target X Position)

- **Type**: Number (integer)
- **Format**: X coordinate in pixels
- **Example**: `300`, `400`, `500`
- **Units**: Pixels (px)
- **Required**: No
- **Description**: X coordinate of target center on canvas
- **Range**: 0 to canvas width (typically 800)

---

### 13. `target_y` (Target Y Position)

- **Type**: Number (integer)
- **Format**: Y coordinate in pixels
- **Example**: `200`, `300`, `400`
- **Units**: Pixels (px)
- **Required**: No
- **Description**: Y coordinate of target center on canvas
- **Range**: 0 to canvas height (typically 600)

---

### 14. `rt_ms` (Reaction Time)

- **Type**: Number (integer)
- **Format**: Milliseconds
- **Example**: `450`, `650`, `1200`
- **Units**: Milliseconds (ms)
- **Required**: No
- **Description**: Reaction time from target appearance to click/confirmation
- **Range**: Typically 100 to 5000 ms
  - **Min**: 100 ms (anticipation threshold)
  - **Max**: 10000 ms (timeout limit)
- **Computation**: RT = trial_end.timestamp - trial_start.timestamp

---

### 15. `correct` (Trial Success)

- **Type**: Boolean
- **Format**: `true` / `false` (string or boolean)
- **Example**: `true`, `false`
- **Units**: N/A
- **Required**: No
- **Description**: Whether the trial was completed successfully
- **Encoding**:
  - `true`: Target hit successfully
  - `false`: Target missed or timeout occurred

---

### 16. `err_type` (Error Type)

- **Type**: String (categorical)
- **Values**: `'miss'`, `'timeout'`, `'slip'`
- **Example**: `'miss'`, `'timeout'`
- **Units**: N/A
- **Required**: No
- **Description**: Type of error (only present when correct=false)
- **Encoding**:
  - `'miss'`: Click/confirm outside target bounds
  - `'timeout'`: No response within time limit
  - `'slip'`: Premature confirmation (gaze only - Space without hover)

---

### 17. `hover_ms` (Hover Duration)

- **Type**: Number (integer)
- **Format**: Milliseconds
- **Example**: `350`, `500`, `750`
- **Units**: Milliseconds (ms)
- **Required**: No
- **Description**: Hover duration before confirmation (gaze modality only)
- **Range**: 0 to rt_ms
- **Note**: Only logged for gaze trials with dwell > 0ms

---

### 18. `confirm_type` (Confirmation Method)

- **Type**: String (categorical)
- **Values**: `'click'`, `'space'`, `'dwell'`
- **Example**: `'click'`, `'space'`
- **Units**: N/A
- **Required**: No
- **Description**: How the target was confirmed
- **Encoding**:
  - `'click'`: Direct mouse/touch click (hand modality)
  - `'space'`: Space key confirmation (gaze modality)
  - `'dwell'`: Auto-confirm via dwell time (gaze modality, dwell > 0ms)

---

### 19. `pupil_z_med` (Pupil Diameter Z-Score)

- **Type**: Number (float)
- **Format**: Standardized z-score
- **Example**: `0.5`, `-0.3`, `1.2`
- **Units**: Z-score (standard deviations from mean)
- **Required**: No (default: null)
- **Description**: Median z-score of pupil diameter proxy over last 1-2 seconds
- **Range**: Typically -3.0 to +3.0 (mean = 0, std = 1)
- **Note**: Only logged if camera permission granted and enabled
- **Computation**: z = (luminance - mean) / std (rolling median)
- **Privacy**: Scalar value only - no video frames stored

---

### 20. `tlx_global` (NASA-TLX Global Workload)

- **Type**: Number (integer)
- **Format**: 0 to 100
- **Example**: `50`, `75`, `90`
- **Units**: Workload score (0-100 scale)
- **Required**: No (default: null)
- **Description**: NASA-TLX global workload rating for the block
- **Range**: 0 (low) to 100 (high)
- **Note**: Same value repeated for all trials within a block
- **Source**: TLX form submitted after block completion

---

### 21. `tlx_mental` (NASA-TLX Mental Demand)

- **Type**: Number (integer)
- **Format**: 0 to 100
- **Example**: `60`, `80`, `95`
- **Units**: Workload score (0-100 scale)
- **Required**: No (default: null)
- **Description**: NASA-TLX mental demand rating for the block
- **Range**: 0 (low) to 100 (high)
- **Note**: Same value repeated for all trials within a block
- **Source**: TLX form submitted after block completion

---

### 22. `browser` (Browser Name)

- **Type**: String
- **Format**: Browser name
- **Example**: `'Chrome'`, `'Firefox'`, `'Safari'`
- **Units**: N/A
- **Required**: Yes
- **Description**: Browser used for the experiment
- **Detection**: From navigator.userAgent
- **Values**: Chrome, Firefox, Safari, Edge, Unknown

---

### 23. `dpi` (Device Pixel Ratio)

- **Type**: Number (float)
- **Format**: Device-specific ratio
- **Example**: `1.0`, `2.0`, `1.5`
- **Units**: Ratio (dimensionless)
- **Required**: Yes
- **Description**: Device pixel ratio for screen scaling
- **Detection**: From window.devicePixelRatio
- **Range**: Typically 1.0 (standard) to 4.0 (HiDPI/Retina)
- **Common Values**:
  - `1.0`: Standard displays
  - `2.0`: Retina/HiDPI displays
  - `1.25`, `1.5`: Mid-range HiDPI

---

## Data Types Summary

| Type | Count | Columns |
|------|-------|---------|
| String (categorical) | 5 | modality, ui_mode, err_type, confirm_type, browser |
| Number (integer) | 6 | trial, block, A, W, target_x, target_y, rt_ms, hover_ms, tlx_global, tlx_mental |
| Number (float) | 4 | pressure, ID, pupil_z_med, dpi |
| Boolean | 2 | aging, correct |
| Timestamp | 1 | ts |
| Hashed ID | 1 | pid |

**Total**: 23 columns

## Required vs Optional

**Required (6 columns):**
- `pid`, `ts`, `trial`, `browser`, `dpi` (always present)
- `correct` (present for all trial results)

**Optional (17 columns):**
- Modality-specific: `hover_ms`, `confirm_type` (gaze only)
- Context factors: `pressure`, `aging`, `pupil_z_med` (if enabled)
- TLX: `tlx_global`, `tlx_mental` (after block completion)
- Fitts parameters: `ID`, `A`, `W`, `target_x`, `target_y`
- Error details: `err_type` (only if correct=false)

## Data Quality Checks

### Validation Rules

1. **RT Range**: 100 ≤ rt_ms ≤ 10000
2. **ID Formula**: ID = log₂(A/W + 1) (±0.1 tolerance)
3. **TLX Range**: 0 ≤ tlx_global ≤ 100, 0 ≤ tlx_mental ≤ 100
4. **Coordinates**: 0 ≤ target_x ≤ 800, 0 ≤ target_y ≤ 600
5. **Boolean Consistency**: If correct=true, err_type should be empty/null
6. **Modality Match**: confirm_type matches modality
7. **Timestamp Order**: ts increases monotonically within participant

### Exclusions

Rows should be excluded if:
- rt_ms < 100ms (anticipation)
- rt_ms > 10000ms (timeout error)
- correct is null
- Missing required columns

## CSV Format

**Encoding**: UTF-8  
**Delimiter**: Comma (`,`)  
**Quote Character**: `"` (if contains comma/newline)  
**Line Endings**: Unix (LF) or Windows (CRLF)

**Example Row:**
```csv
pid,ts,block,trial,modality,ui_mode,pressure,aging,ID,A,W,target_x,target_y,rt_ms,correct,err_type,hover_ms,confirm_type,pupil_z_med,tlx_global,tlx_mental,browser,dpi
a3f5b8c2...,1698765432100,1,1,hand,standard,1.0,false,3.17,200,50,300,200,450,true,,,click,,75,60,Chrome,2.0
```

## Version History

- **v1.0** (2025-01-15): Initial schema definition
- Future versions may add columns as features are developed

