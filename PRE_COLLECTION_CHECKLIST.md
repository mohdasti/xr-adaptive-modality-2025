# Pre-Collection Checklist - XR Adaptive Modality Study

**Date:** $(date)  
**Status:** ✅ Ready for Data Collection

## Critical Components Verification

### ✅ 1. Experimental Design

- [x] **Williams Design**: True 8×8 Balanced Latin Square implemented
  - Verified: Hardcoded matrix in `app/src/experiment/counterbalance.ts`
  - Every condition follows every other condition exactly once
  - Controls for immediate carryover effects

- [x] **Single Session Design**: All 8 blocks in session 1
  - Verified: `scripts/generate_participant_tracking.py` assigns all blocks to `session_number = 1`
  - Participant tracking CSV shows all blocks under session 1

- [x] **Participant Count**: N=32 target, 40 links generated for redundancy
  - Verified: 40 participant links generated
  - Perfect balancing: 40 ÷ 8 = 5 participants per Williams sequence

### ✅ 2. Data Collection Metrics

- [x] **ISO 9241-9 Compliance**
  - ✅ `projected_error_px` - logged in all event payloads (lines 274, 641, 700)
  - ✅ R script uses `projected_error_px` for effective width calculation

- [x] **Gaze Interaction Analysis**
  - ✅ `target_reentry_count` - tracks cursor entering target (lines 291, 667, 733)
  - ✅ `verification_time_ms` - time from first target entry to selection (lines 238, 579)

- [x] **Calibration Data**
  - ✅ `pixels_per_mm` - logged in all event payloads (lines 288, 647, 711)
  - ✅ `pixels_per_degree` - logged in all event payloads (lines 289, 648, 712)

- [x] **CSV Headers**: All new metrics added to CSV schema
  - ✅ `projected_error_px`
  - ✅ `target_reentry_count`
  - ✅ `verification_time_ms`
  - ✅ `pixels_per_mm`
  - ✅ `pixels_per_degree`

### ✅ 3. Angular Velocity Gaze Simulation

- [x] **Physiological Gaze Physics**: Uses angular velocity (deg/s) instead of pixel velocity
  - ✅ Saccade threshold: 120 deg/s
  - ✅ Fixation threshold: 30 deg/s
  - ✅ `pixelsPerDegree` passed from calibration data

### ✅ 4. Analysis Pipeline

- [x] **R Scripts**: ISO 9241-9 compliant
  - ✅ `analysis/01_compute_effective_metrics.R` uses `projected_error_px`
  - ✅ Effective width calculation: `We = 4.133 * sd(projected_error_px, na.rm = TRUE)`

- [x] **Visualization Script**: Publication-ready plots
  - ✅ `analysis/publication_plots.py` generates 5 essential plots
  - ✅ Throughput violin, Fitts' regression, accuracy scatter, trajectories, workload

### ✅ 5. Participant Management

- [x] **Participant Links**: 40 unique links generated
  - ✅ Format: `https://xr-adaptive-modality-2025.vercel.app/intro?pid=PXXX&session=1`
  - ✅ All links use `session=1` (single session design)

- [x] **Participant Tracking**: 40 participants × 8 blocks = 320 rows
  - ✅ All blocks assigned to `session_number = 1`
  - ✅ Williams sequences correctly distributed

### ✅ 6. Data Submission

- [x] **EmailJS Integration**: Automatic data submission
  - ✅ EmailJS template configured (`EMAILJS_TEMPLATE.txt`)
  - ✅ Includes trial CSV, block CSV, and debrief responses
  - ✅ 50KB size limit handling with automatic CSV downloads

- [x] **Debrief Page**: Strategy questions and data download
  - ✅ Two open-ended strategy questions
  - ✅ Automatic email submission on page load
  - ✅ Manual download buttons for CSV files

## Pre-Collection Verification Commands

Run these commands to verify everything is correct:

```bash
# Verify Williams Design matches between TypeScript and Python
grep -A 8 "WILLIAMS_8" app/src/experiment/counterbalance.ts
grep -A 8 "WILLIAMS_SEQUENCES" scripts/generate_participant_tracking.py

# Verify participant links
tail -n +2 participant_links.csv | wc -l  # Should be 40

# Verify participant tracking
tail -n +2 participant_tracking.csv | awk -F',' '{print $1, $2}' | sort | uniq -c | head -5
# Should show 8 blocks per participant, all session 1

# Verify R script uses projected_error_px
grep "projected_error_px" analysis/01_compute_effective_metrics.R

# Verify all metrics are logged
grep -E "projected_error_px|target_reentry_count|verification_time_ms|pixels_per" app/src/components/FittsTask.tsx
```

## Final Pre-Collection Steps

1. **Test EmailJS Template**
   - Copy `EMAILJS_TEMPLATE.txt` to EmailJS dashboard
   - Test with sample data to verify formatting

2. **Verify Deployment**
   - Ensure latest code is deployed to Vercel
   - Test participant link flow end-to-end

3. **Data Collection Protocol**
   - Review participant recruitment materials
   - Prepare data collection tracking spreadsheet
   - Set up backup data storage procedures

4. **Quality Assurance**
   - Test complete flow: Intro → Demographics → Calibration → Task → Debrief
   - Verify all metrics are being logged correctly
   - Test email submission and CSV download

## Success Criteria

- ✅ All 40 participant links generated (target: 32 complete)
- ✅ Williams Design correctly counterbalanced (8 sequences)
- ✅ All critical metrics logged (projected error, re-entries, verification time, calibration)
- ✅ ISO 9241-9 compliant analysis pipeline
- ✅ Publication-ready visualization scripts
- ✅ Single-session design (all 8 blocks in session 1)

**Status: READY FOR DATA COLLECTION** 🚀

