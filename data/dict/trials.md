# Trial Data Dictionary

Complete specification of all columns in the telemetry trial CSV export (`trials_<sessionId>.csv`).

## Overview

Each row represents a single trial. Columns are dynamically included based on:
- **P0 (minimal)**: Always included
- **P0+ (full)**: Included when telemetry level >= 'full'
- **P1 (raw)**: Included when telemetry level === 'raw'
- **Conditional fields**: Included when applicable (e.g., drag metrics only for drag tasks)

## Column Specifications

### P0: Minimal Fields (Always Included)

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| `trial_id` | string | - | Unique trial identifier | Any string |
| `session_id` | string | - | Session identifier | Any string |
| `participant_id` | string | - | Participant identifier (anonymized) | Any string |
| `timestamp_start` | number | ms | Trial start timestamp (performance.now()) | ≥ 0 |
| `timestamp_end` | number | ms | Trial end timestamp (performance.now()) | ≥ timestamp_start |
| `rt_ms` | number | ms | Reaction time (select_ts - stim_onset_ts, or fallback) | ≥ 0 |
| `correct` | boolean | - | Trial success (endpoint within target) | true, false |
| `endpoint_x` | number | px | Selection endpoint X coordinate (viewport) | Any number |
| `endpoint_y` | number | px | Selection endpoint Y coordinate (viewport) | Any number |
| `target_center_x` | number | px | Target center X coordinate (viewport) | Any number |
| `target_center_y` | number | px | Target center Y coordinate (viewport) | Any number |
| `endpoint_error_px` | number | px | Euclidean distance from endpoint to target center | ≥ 0 |

### Timing Landmarks

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| `stim_onset_ts` | number | ms | Timestamp of stimulus onset | ≥ 0 |
| `move_onset_ts` | number | ms | Timestamp of first movement (velocity > threshold) | ≥ stim_onset_ts |
| `target_entry_ts` | number | ms | Timestamp when cursor enters target bbox | ≥ move_onset_ts |
| `pinch_onset_ts` | number | ms | Timestamp of pinch/gesture onset | ≥ 0 |
| `select_ts` | number | ms | Timestamp of successful selection | ≥ target_entry_ts |

### Derived RTs

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| `rt_total` | number | ms | Total RT (select_ts - stim_onset_ts) | ≥ 0 |
| `rt_move_prep` | number | ms | Movement preparation time (move_onset_ts - stim_onset_ts) | ≥ 0 |
| `rt_target_entry` | number | ms | Time to target entry (target_entry_ts - stim_onset_ts) | ≥ 0 |
| `rt_click_after_entry` | number | ms | Time from target entry to click (select_ts - target_entry_ts) | ≥ 0 |

### Pinch-Fixation Synchrony

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| `pinch_fixation_delta_ms` | number | ms | Time difference between pinch and fixation | -400 to +400 |
| `timing_bin` | string | - | Timing classification | 'early', 'on', 'late' |
| `timing_pass` | boolean | - | true if timing_bin === 'on' | true, false |

### Drag Task Metrics

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| `drag_distance_bin` | string | - | Distance factor for drag tasks | 'near', 'far' |
| `unintended_drop` | number | count | Count of unintended drops (pointer up outside target) | ≥ 0 |
| `reengage_attempts` | number | count | Number of re-engagement attempts after drop | ≥ 0 |
| `reengage_time_ms` | number | ms | Time from drop to successful completion | ≥ 0 |
| `drag_path_px` | number | px | Accumulated path length during drag | ≥ 0 |

### P0+: Kinematics (level >= 'full')

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| `path_length_px` | number | px | Total path length traveled | ≥ 0 |
| `movement_time_ms` | number | ms | Movement time (first to last sample) | ≥ 0 |
| `peak_velocity_px_s` | number | px/s | Peak velocity during movement | ≥ 0 |
| `mean_velocity_px_s` | number | px/s | Mean velocity during movement | ≥ 0 |
| `submovement_count` | number | count | Number of submovements (speed minima) | ≥ 0 |
| `curvature_index` | number | - | Path length / straight-line distance | ≥ 1.0 |
| `sd_along_px` | number | px | Standard deviation along movement axis | ≥ 0 |
| `sd_ortho_px` | number | px | Standard deviation orthogonal to movement axis | ≥ 0 |
| `power_8_12_hz` | number | - | Power in 8-12 Hz band (Goertzel) | ≥ 0 |
| `power_12_20_hz` | number | - | Power in 12-20 Hz band (Goertzel) | ≥ 0 |

### Enhanced Kinematics (from coalesced events)

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| `path_len_px` | number | px | Path length from coalesced events | ≥ 0 |
| `peak_speed_px_s` | number | px/s | Peak speed during movement | ≥ 0 |
| `time_to_peak_ms` | number | ms | Time from stimulus onset to peak speed | ≥ 0 |
| `n_submovements` | number | count | Submovement count (speed minima with hysteresis) | ≥ 0 |
| `mean_curvature` | number | - | Mean curvature (deviation / path length) | ≥ 0 |
| `max_deviation_px` | number | px | Maximum perpendicular distance from straight-line path | ≥ 0 |
| `speed_at_select_px_s` | number | px/s | Speed at selection time | ≥ 0 |
| `accel_at_select_px_s2` | number | px/s² | Acceleration at selection time | Any number |

### Event Health

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| `pointer_coalesced_ratio` | number | - | Ratio of coalesced events to total events | 0 to 1 |
| `event_drop_estimate` | number | count | Estimated dropped events (dt > 2×median) | ≥ 0 |

### P1: Raw Streams (level === 'raw')

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| `raw_pointer_samples` | string | - | JSONL gzipped base64 pointer samples | Base64 string |
| `raw_raf_deltas` | string | - | JSONL gzipped base64 RAF deltas | Base64 string |

### Trial Metadata (from trial meta)

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| `taskType` | string | - | Task type | 'point', 'drag' |
| `dragDistance` | string | - | Drag distance (for drag tasks) | 'near', 'far' |
| `modality` | string | - | Input modality | 'hand', 'gaze_confirm' |
| `ui_mode` | string | - | UI mode | 'static', 'adaptive' |
| `A` | number | px | Amplitude (distance to target) | > 0 |
| `W` | number | px | Target width | > 0 |
| `ID` | number | bits | Index of Difficulty | ≥ 0 |
| `target_width_px` | number | px | Target width in pixels | > 0 |
| `target_center_x` | number | px | Target center X (from meta) | Any number |
| `target_center_y` | number | px | Target center Y (from meta) | Any number |
| `pressure` | number | - | Task pressure level | 0-2 |
| `aging` | boolean | - | Aging visual effects enabled | true, false |

### Condition Metadata (from session condition)

| Column | Type | Units | Description | Allowed Values |
|--------|------|-------|-------------|----------------|
| Additional fields from `condition` object | varies | - | Condition-specific metadata | Varies |

## Notes

- **Missing values**: Empty string `''` for undefined/null values
- **Timestamp precision**: All timestamps use `performance.now()` (milliseconds, high precision)
- **Coordinate system**: All coordinates are in viewport pixels (clientX/clientY)
- **Dynamic columns**: Column order and presence depends on telemetry level and trial type
- **CSV encoding**: UTF-8 with proper escaping (quotes, commas, newlines)

## Example Row

```csv
trial_id,session_id,participant_id,timestamp_start,timestamp_end,rt_ms,correct,endpoint_x,endpoint_y,target_center_x,target_center_y,endpoint_error_px,stim_onset_ts,move_onset_ts,target_entry_ts,select_ts,rt_total,rt_move_prep,rt_target_entry,path_len_px,peak_speed_px_s,time_to_peak_ms,n_submovements,mean_curvature,max_deviation_px,speed_at_select_px_s,accel_at_select_px_s2,power_8_12_hz,power_12_20_hz,pointer_coalesced_ratio,event_drop_estimate,taskType,modality,ui_mode,A,W,ID
trial-1234,session-5678,P001,1000.5,1450.2,450,true,400.1,300.2,400,300,0.22,1000.5,1020.3,1400.1,1450.2,450,20,400,250.5,120.3,150,2,0.15,5.2,10.5,-5.2,0.05,0.03,0.75,0,point,hand,static,200,80,1.807
```

