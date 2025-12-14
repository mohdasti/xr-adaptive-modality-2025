# Single CSV File Verification

## ✅ Confirmed: One CSV File Per Participant

The system has been updated to ensure **all data is exported in a single CSV file** per participant.

### What's Included in the Single CSV File

1. **Trial Data** (78 columns total):
   - Participant metadata (pid, session, demographics)
   - Trial parameters (block, trial, modality, ui_mode, pressure, ID, A, W)
   - Performance metrics (rt_ms, correct, error_type, hover_ms)
   - Movement metrics (submovement_count, verification_time_ms)
   - **Trajectory data** (as JSON string in `trajectory` column)
   - Width scaling metrics (nominal_width_px, displayed_width_px, width_scale_factor)
   - Alignment gate metrics (if enabled)
   - Task configuration (task_type, drag_distance)
   - Display metadata (DPR, viewport, zoom, etc.)
   - **TLX workload data** (merged from block-level data)
   - **Debrief responses** (merged into each row)

2. **Data Merging**:
   - TLX data from block-level questionnaires is automatically merged into trial rows
   - Debrief responses are merged into all trial rows
   - All data appears in the same CSV file

### Trajectory Data Format

- **Storage**: JSON string in CSV column (properly escaped)
- **Format**: `[{"x": 100, "y": 200, "t": 150}, {"x": 105, "y": 205, "t": 166}, ...]`
- **Parsing in R**: `jsonlite::fromJSON(trajectory)`
- **Frequency**: ~60fps (every 16ms during movement)

### Changes Made

1. **Updated `downloadCSV()` method**:
   - Now uses `toMergedCSV()` instead of `toCSV()`
   - Ensures TLX data is included in the main CSV file
   - All data in one file

2. **Trajectory logging**:
   - Added to FittsTask.tsx
   - Included in all trial events
   - Stored as JSON string in CSV (properly escaped)

### File Export

- **One CSV file per participant**: `experiment_P001_session1_YYYY-MM-DDTHH-MM-SS.csv`
- **No separate files needed**: No JSON files, no separate TLX files
- **All data included**: Trial data, TLX, debrief, trajectory - everything in one file

### Verification

✅ Trajectory JSON properly escaped for CSV  
✅ TLX data merged into trial rows  
✅ Debrief data merged into trial rows  
✅ All 78 columns in single CSV  
✅ No separate files required  

## Power Analysis Prompt

A detailed prompt for getting a second opinion on power analysis has been created in `POWER_ANALYSIS_PROMPT.md`. This prompt covers:

1. LBA model parameter power analysis
2. Control theory/submovement metrics power analysis
3. Expected effect sizes from literature
4. Methodological considerations
5. Recommendations for current N=48 sample size

You can use this prompt with another LLM or consult with a statistician.






