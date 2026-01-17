# Report.qmd Gaps Analysis

**Date:** 2025-01-XX  
**Data File:** `data/clean/trial_data.csv`  
**Total Columns:** 138

## Summary

The report currently covers **most primary and secondary outcomes**, but several potentially valuable analyses are missing or underutilized.

## ✅ Well-Covered Areas

1. **Primary Outcomes** (100% coverage)
   - Throughput (IDe/MT)
   - Movement Time (RT)
   - Error Rate
   - NASA-TLX (all 6 scales)

2. **Movement Quality Metrics**
   - Submovement count (legacy + recomputed)
   - Target re-entries
   - Verification time
   - Path efficiency (from trajectory)

3. **Spatial Analysis**
   - Effective Width (We)
   - Endpoint accuracy scatter plots
   - Spatial heatmaps
   - Error density heatmaps

4. **Adaptation Features**
   - Width scaling (analyzed, but no scaling occurred)
   - Alignment gates

5. **Computational Models**
   - LBA analysis (Section 16)
   - Control Theory submovement models (Section 17)

## ⚠️ Missing or Underutilized Areas

### 1. **Debrief Questions** (76-100% coverage) - **HIGH PRIORITY**

**Available Data:**
- `debrief_q1_adaptation_noticed`: Did participants notice the adaptation? (76% coverage)
- `debrief_q2_strategy_changed`: Did they change their strategy? (100% coverage)

**Potential Analysis:**
- Quantitative analysis: Count responses, compare by condition
- Relationship to performance: Do participants who noticed adaptation perform differently?
- Strategy changes: Analyze relationship between strategy changes and performance metrics

**Recommendation:** Add a "Participant Awareness & Strategy" section analyzing debrief responses and their relationship to performance.

---

### 2. **Trajectory Metadata** (52-55% coverage) - **MEDIUM PRIORITY**

**Available Data:**
- `traj_point_count`: Number of trajectory points
- `traj_duration_ms`: Total trajectory duration
- `traj_median_dt_ms`: Median time between points
- `traj_max_dt_ms`: Maximum time gap
- `traj_gap_count`: Number of gaps in trajectory
- `traj_has_monotonic_t`: Whether timestamps are monotonic
- `traj_start_reason`, `traj_end_reason`: Why trajectory started/ended
- `traj_usable`: Whether trajectory is usable

**Potential Analysis:**
- Data quality assessment: Trajectory completeness and quality by condition
- Sampling rate analysis: How consistent is trajectory sampling?
- Gap analysis: When do trajectory gaps occur? (e.g., during fast movements)
- Start/end reason analysis: What triggers trajectory recording?

**Recommendation:** Add a "Trajectory Data Quality" subsection in Section 17 (Control Theory) to assess trajectory reliability.

---

### 3. **Detailed Timing Metrics** (Partial coverage) - **MEDIUM PRIORITY**

**Available Data:**
- `hover_ms`: Time hovering over target (already analyzed for gaze)
- `first_entry_time_ms`: Time to first target entry
- `last_exit_time_ms`: Time of last target exit
- `time_in_target_total_ms`: Total time spent in target
- `verification_start_time_ms`: When verification phase started
- `verification_end_time_ms`: When verification phase ended
- `confirm_event_time_ms`: When confirmation occurred
- `confirm_event_source`: What triggered confirmation (click, timeout, etc.)

**Potential Analysis:**
- **Target Dwell Time Analysis**: How long do participants stay in target before confirming?
  - Compare hand vs. gaze
  - Compare static vs. adaptive
  - Relationship to error rate
- **Verification Phase Breakdown**: Decompose verification time into sub-phases
- **Confirmation Source Analysis**: What triggers confirmation? (click vs. timeout vs. other)

**Recommendation:** Expand Section 15 (Verification Time Analysis) to include:
- Target dwell time analysis
- Verification phase decomposition
- Confirmation source breakdown

---

### 4. **Adaptation Triggering** (Partial coverage) - **LOW PRIORITY**

**Available Data:**
- `adaptation_triggered`: Boolean indicating if adaptation was triggered
- `width_scale_factor`: Actual scale factor (all 1.0, so no scaling occurred)

**Potential Analysis:**
- When adaptation triggers: Relationship to performance metrics (RT, errors)
- Why adaptation didn't trigger: Analysis of conditions where it should have triggered but didn't

**Recommendation:** Since no scaling occurred, this is less urgent. Could add a note in the Width Scaling section explaining why adaptation didn't trigger.

---

### 5. **Submovement Details** (Partial coverage) - **LOW PRIORITY**

**Available Data:**
- `submovement_primary_peak_v`: Peak velocity of primary submovement
- `submovement_primary_peak_t_ms`: Time to peak velocity

**Potential Analysis:**
- Primary submovement characteristics: How fast is the initial movement?
- Peak velocity timing: When does peak velocity occur in the movement?
- Relationship to overall movement time

**Recommendation:** Could add to Section 10 (Submovement Analysis) or Section 17 (Control Theory) as exploratory analysis.

---

### 6. **Eye Tracking Quality** (55% coverage) - **LOW PRIORITY**

**Available Data:**
- `eye_dropout_count`: Number of eye tracking dropouts (55% coverage)
- `eye_valid_sample_pct`: Percentage of valid samples (0% coverage - not available)
- `eye_avg_confidence`: Average confidence (0% coverage - not available)
- `pupil_z_med`: Median pupil Z (0% coverage - not available)

**Potential Analysis:**
- Eye tracking reliability: How often do dropouts occur?
- Relationship to performance: Do dropouts affect gaze performance?

**Recommendation:** Since most eye tracking metrics are 0% coverage, this is low priority. Could add a brief note about dropout rates if useful.

---

### 7. **Technical Metrics** (Various coverage) - **VERY LOW PRIORITY**

**Available Data:**
- `avg_fps`: Average frames per second
- `focus_blur_count`: Number of focus/blur events
- `tab_hidden_ms`: Time tab was hidden
- `zoom_pct`: Zoom percentage
- `viewport_w`, `viewport_h`: Viewport dimensions

**Potential Analysis:**
- Technical quality checks: Were there any technical issues affecting data quality?
- Frame rate analysis: Did frame rate affect performance?

**Recommendation:** These are primarily data quality checks. Could add to Data Quality Notes section if issues are found.

---

## Trajectory Data Usage

**Current Usage:**
- ✅ Path length computation (Section 15)
- ✅ Path efficiency analysis (Section 15)
- ✅ Submovement recomputation (Section 10, 17)
- ✅ Control Theory analysis (Section 17)

**Trajectory Coverage:** ~52-55% of trials

**Potential Additional Uses:**
1. **Velocity/Acceleration Profiles**: Already partially done in Section 17, but could be expanded
2. **Trajectory Shape Analysis**: Curvature, straightness, deviation from optimal path
3. **Movement Phases**: Acceleration, deceleration, correction phases
4. **Spatial Trajectory Visualization**: Overlay trajectories on target positions

**Recommendation:** The trajectory data is reasonably well-utilized. The main gap is trajectory metadata analysis (data quality assessment).

---

## Recommendations Summary

### High Priority (Add Soon)
1. **Debrief Questions Analysis** - New section on participant awareness and strategy
   - Quantitative analysis of responses
   - Relationship to performance metrics

### Medium Priority (Consider Adding)
2. **Trajectory Data Quality** - Subsection in Section 17
   - Trajectory completeness and quality metrics
   - Gap analysis
   - Sampling rate consistency

3. **Detailed Timing Analysis** - Expand Section 15
   - Target dwell time
   - Verification phase decomposition
   - Confirmation source analysis

### Low Priority (Optional)
4. **Submovement Details** - Expand Section 10 or 17
   - Primary submovement peak velocity
   - Peak velocity timing

5. **Adaptation Triggering** - Note in Width Scaling section
   - Why adaptation didn't trigger (if analyzable)

---

## Data Coverage Summary

| Category | Coverage | Status | Priority
|---------|----------|--------|----------
| Primary Outcomes | 100% | ✅ Complete | -
| Movement Quality | 40-100% | ✅ Complete | -
| Trajectory Data | 52-55% | ✅ Well-used | -
| Debrief Questions | 76-100% | ⚠️ Missing | High
| Timing Details | Partial | ⚠️ Partial | Medium
| Trajectory Metadata | 52-55% | ⚠️ Missing | Medium
| Eye Tracking | 0-55% | ⚠️ Limited | Low
| Adaptation Triggering | Partial | ⚠️ Partial | Low

---

## Conclusion

The report is **comprehensive** for primary and secondary outcomes. The main gaps are:

1. **Debrief analysis** (high priority) - Would provide valuable insights into participant awareness
2. **Trajectory quality assessment** (medium priority) - Would strengthen confidence in trajectory-based analyses
3. **Detailed timing breakdown** (medium priority) - Would provide deeper insights into movement phases

Most other missing analyses are either low priority or have limited data availability.

