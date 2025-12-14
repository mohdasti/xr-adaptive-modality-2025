# Minimal Pilot Checklist

**Purpose:** Quick verification of new features (trajectory logging, merged CSV export)  
**Time Required:** ~5-10 minutes  
**Risk Level:** Low (changes are backward compatible)

## Pre-Pilot Setup

- [ ] Deploy latest code to Vercel (or test locally)
- [ ] Clear browser cache/localStorage if testing locally
- [ ] Have a test participant ID ready (e.g., `PILOT_TEST`)

## Quick Verification Steps

### 1. Trajectory Logging Test (2-3 minutes)

- [ ] Start a trial (any modality, any condition)
- [ ] Move cursor/track gaze during the trial
- [ ] Complete the trial (correct or error)
- [ ] Download CSV file
- [ ] Open CSV in text editor or spreadsheet
- [ ] Check `trajectory` column:
  - [ ] Column exists
  - [ ] Contains JSON string (starts with `[`)
  - [ ] JSON is properly escaped (quotes doubled: `""`)
  - [ ] JSON contains trajectory points with `x`, `y`, `t` fields
  - [ ] At least 10-20 trajectory points logged (for a 1-2 second trial)

**Expected:** Trajectory column contains valid JSON like:
```
"[{""x"": 100, ""y"": 200, ""t"": 150}, {""x"": 105, ""y"": 205, ""t"": 166}, ...]"
```

### 2. Merged CSV Export Test (2-3 minutes)

- [ ] Complete at least 1 block (8 trials)
- [ ] Fill out TLX questionnaire after block
- [ ] Download CSV file
- [ ] Open CSV in spreadsheet (Excel, Google Sheets, or R)
- [ ] Check TLX columns:
  - [ ] `tlx_mental` column exists
  - [ ] `tlx_physical` column exists
  - [ ] `tlx_temporal` column exists
  - [ ] `tlx_performance` column exists
  - [ ] `tlx_effort` column exists
  - [ ] `tlx_frustration` column exists
  - [ ] TLX values appear in trial rows (not just block rows)
  - [ ] TLX values are the same for all trials in the same block

**Expected:** All trial rows have TLX values filled in (not null/empty)

### 3. Trajectory Parsing Test (1-2 minutes)

- [ ] Open R or RStudio
- [ ] Load CSV: `df <- read.csv("pilot_data.csv")`
- [ ] Parse trajectory: `library(jsonlite)`
- [ ] Test parsing: `traj <- fromJSON(df$trajectory[1])`
- [ ] Verify structure:
  - [ ] `traj` is a data frame or list
  - [ ] Contains `x`, `y`, `t` columns/fields
  - [ ] Values are numeric
  - [ ] `t` values increase over time

**Expected:** Trajectory parses correctly into usable data structure

### 4. Data Completeness Check (1-2 minutes)

- [ ] Verify all 78 columns present in CSV
- [ ] Check that no columns are missing
- [ ] Verify trajectory column is included
- [ ] Check that old columns still work (rt_ms, correct, etc.)

## If Everything Passes

✅ **Proceed with data collection** - All new features working correctly

## If Issues Found

### Issue: Trajectory column empty or missing
- **Check:** Is trajectory logging useEffect running?
- **Check:** Are trials completing correctly?
- **Fix:** May need to check browser console for errors

### Issue: TLX data not in main CSV
- **Check:** Is `downloadCSV()` using `toMergedCSV()`?
- **Check:** Are block rows being created?
- **Fix:** Verify CSV export code

### Issue: Trajectory JSON can't be parsed
- **Check:** Is JSON properly escaped?
- **Check:** Are quotes doubled (`""`)?
- **Fix:** May need to adjust CSV escaping

## Alternative: Test with First Real Participant

If you're confident and want to save time:
- **Option:** Use first real participant as "pilot"
- **Risk:** Low - worst case, trajectory data missing (can be fixed)
- **Benefit:** No extra time needed
- **Recommendation:** Only if you're comfortable debugging on-the-fly

## Post-Pilot Actions

- [ ] Document any issues found
- [ ] Fix any bugs before full data collection
- [ ] Update this checklist if needed
- [ ] Proceed with confidence! 🚀






