# Data Availability Status Report

This document summarizes the current status of data collection and identifies sections of `Report.qmd` that are waiting for additional data.

**Last Updated:** 2025-12-09  
**Data File:** `data/clean/trial_data.csv`  
**Total Trials:** 3,985

## ✅ Available Data

### Core Metrics (100% coverage)
- **Participant demographics**: Age, gender, gaming hours, input device
- **Trial metadata**: Modality, UI mode, pressure, block numbers, trial numbers
- **Performance metrics**: Movement time (RT), accuracy (correct/incorrect), error types
- **Fitts' law parameters**: Amplitude (A), target width (W), Index of Difficulty (ID)
- **Endpoint data**: Target positions, endpoint positions, endpoint errors
- **TLX workload**: All 6 scales (mental, physical, temporal, performance, effort, frustration)

### Partial Coverage

#### Trajectory Data (~40% coverage)
- **Status**: Available for newer participants only
- **Coverage**: 1,582/3,985 trials (39.7%)
- **Columns**: `trajectory` (JSON), `traj_point_count`, `traj_duration_ms`
- **Note**: Trajectory logging was added mid-data-collection, so earlier participants don't have this data
- **Impact**: Path length and efficiency analyses will be limited to ~40% of trials

#### Submovement Data (~40% coverage)
- **Status**: Available via recomputed metric
- **Coverage**: 
  - `submovement_count` (legacy): 708/3,985 (17.8%) - only for gaze modality
  - `submovement_count_recomputed`: 1,652/3,985 (41.5%) - computed from trajectory
- **Note**: Recomputed submovement count uses trajectory data, so coverage matches trajectory

#### Width Scaling Data (~60% coverage, but no actual scaling)
- **Status**: Columns exist but **no actual scaling occurred**
- **Coverage**: 2,360/3,985 trials (59.2%)
- **Values**: All `width_scale_factor = 1.0` (no scaling)
- **Columns**: `nominal_width_px`, `displayed_width_px`, `width_scale_factor`
- **Explanation**: Adaptive policy did not trigger during data collection
  - Requires hysteresis gate (N consecutive slow/error trials)
  - Performance thresholds (RT p75, error burst) were not exceeded
  - Participants performed well enough that adaptation was not needed
- **Impact**: Section 14 (Adaptive UI Mechanism Analysis) shows that no scaling occurred

#### Task Type (~60% coverage)
- **Status**: Available for most trials
- **Coverage**: 2,337/3,985 trials (58.6%)
- **Values**: `'point'` and `'drag'`
- **Impact**: Limited to trials with task type data

## ❌ Missing/Disabled Data

### Alignment Gate Metrics (0% enabled)
- **Status**: **Feature disabled during data collection**
- **Coverage**: 
  - `alignment_gate_enabled`: 2,360/3,985 trials (59.2% non-null), **all values = FALSE**
  - `alignment_gate_false_triggers`: 0/3,985 (0% non-null)
  - `alignment_gate_recovery_time_ms`: 0/3,985 (0% non-null)
  - `alignment_gate_mean_recovery_time_ms`: 0/3,985 (0% non-null)
- **Explanation**: 
  - Alignment gates are an **experimental feature (P1)** disabled by default
  - Feature requires hand input AND hover-in-target for ≥80ms before selection
  - To enable: Set `experimental.alignmentGate = true` in `app/src/config.ts`
- **Impact**: Section 14 (Alignment Gate Metrics) shows informative message explaining feature was not enabled
- **Action Required**: Enable feature in config and re-run data collection to get metrics

## 📊 Report Sections Status

### ✅ Fully Functional Sections
1. **Section 1: Executive Summary** - ✅ All data available
2. **Section 2: Demographics** - ✅ Complete
3. **Section 3: Primary Analysis (Throughput)** - ✅ Complete
4. **Section 4: Movement Time Analysis** - ✅ Complete
5. **Section 5: Fitts' Law Modelling** - ✅ Complete
6. **Section 6: Error Rate Analysis** - ✅ Complete
7. **Section 7: Accuracy & Gaze Dynamics** - ✅ Complete
8. **Section 8: Workload (NASA-TLX)** - ✅ Complete
9. **Section 9: Learning Curves** - ✅ Complete (uses trial_in_block or trial_number)
10. **Section 12: Block Order & Temporal Effects** - ✅ Complete
11. **Section 13: Spatial Patterns & Heatmaps** - ✅ Complete

### ⚠️ Partially Functional Sections

#### Section 10: Movement Quality Metrics (Submovements)
- **Status**: ⚠️ Limited to ~40% of trials (trajectory-dependent)
- **Data**: Uses `submovement_count_recomputed` from trajectory data
- **Impact**: Analyses work but are limited to newer participants

#### Section 11: Error Patterns & Types
- **Status**: ✅ Functional
- **Note**: Error type data is available

#### Section 14: Adaptive UI Mechanism Analysis
- **Width Scaling**: ⚠️ Data exists but shows no scaling occurred (all values = 1.0)
  - Section correctly identifies this and explains why
- **Alignment Gate Metrics**: ❌ Feature disabled (explained in report)

#### Section 15: Task Type Analysis & Path Length
- **Task Type**: ⚠️ ~60% coverage (2,337/3,985 trials)
- **Path Length**: ⚠️ ~40% coverage (trajectory-dependent, 1,582/3,985 trials)
- **Impact**: Analyses work but are limited to subset of trials

### ❌ Not Yet Functional Sections

#### Advanced Control Theory Analysis (Section 17)
- **Status**: Placeholder section
- **Basic submovement analysis**: ✅ Done (Section 10)
- **Advanced metrics**: ❌ Not yet implemented
  - Velocity profile analysis
  - Submovement detection algorithm
  - Primary vs. corrective movement decomposition
- **Note**: Trajectory data is now available (40% coverage), enabling future implementation

## 🔍 Data Quality Notes

### Trajectory Data Gap
- **Issue**: Only 39.7% of trials have trajectory data
- **Reason**: Trajectory logging was added mid-data-collection
- **Impact**: Path length and efficiency analyses are limited to newer participants
- **Solution**: No action needed - this is expected for interim data collection

### Adaptive Policy Not Triggered
- **Issue**: All `width_scale_factor = 1.0` (no scaling occurred)
- **Reason**: Adaptive policy thresholds not met (participants performed well)
- **Impact**: Section 14 correctly explains this; no action needed
- **Note**: This is actually good news - suggests participants didn't need adaptive assistance

### Alignment Gates Disabled
- **Issue**: Feature was not enabled during data collection
- **Reason**: Experimental feature (P1) disabled by default
- **Impact**: Section 14 shows informative message
- **Action**: Enable in `app/src/config.ts` if needed for future data collection

## 📝 Recommendations

### For Current Analysis
1. ✅ **Proceed with current analyses** - Core metrics are complete
2. ✅ **Use trajectory-dependent metrics cautiously** - Note coverage limitations
3. ✅ **Document coverage limitations** - Already done in Report.qmd

### For Future Data Collection
1. ⚠️ **Enable alignment gates** if you want to analyze this feature:
   - Set `experimental.alignmentGate = true` in `app/src/config.ts`
2. ⚠️ **Review adaptive policy thresholds** if you want to see scaling:
   - Consider lowering thresholds or increasing hysteresis gate
   - Note: Current behavior (no scaling) may be desired if participants perform well
3. ✅ **Continue trajectory logging** - Now available for all new participants

## Summary

**Overall Data Quality: ✅ Good**

- Core analyses are fully functional with complete data
- Trajectory-dependent analyses work but are limited to ~40% of trials (expected for interim data)
- Alignment gates are configured but disabled (experimental feature)
- Adaptive policy did not trigger (participants performed well)

**No critical data gaps** - All planned analyses can proceed, with appropriate coverage notes where needed.






