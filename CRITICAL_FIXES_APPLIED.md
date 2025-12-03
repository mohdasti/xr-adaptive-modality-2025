# Critical Fixes Applied

## ✅ Fix 1: CSV Data Loss - FIXED

**Problem:** Empty columns for critical metrics (`projected_error_px`, `target_reentry_count`, `verification_time_ms`, `pixels_per_mm`, `pixels_per_degree`)

**Root Cause:** `createRowFromTrial` function in `csv.ts` was not extracting these fields from the `bus.emit` payload.

**Fix Applied:**
- Updated `app/src/lib/csv.ts` `createRowFromTrial` function
- Added extraction for all 5 missing fields from payload
- Fields are now properly captured and written to CSV

**Status:** ✅ Fixed and committed

---

## ⚠️ Fix 2: Block Sequence - NEEDS VERIFICATION

**Problem:** User reports P040 should use row 0 (Block 8 = `GaA_P0`) but CSV shows row 7 (Block 8 = `GaS_P1`)

**Current Behavior:**
- P040 → parseInt("040") - 1 = 39 → row 7 → Block 8 = `GaS_P1` ✓ (matches tracking CSV)
- Python script: `participant_idx = 39` → row 7 ✓
- Tracking CSV: P040 uses row 7 ✓

**User Expectation:**
- P040 → row 0 → Block 8 = `GaA_P0`

**Investigation:**
- Code calculation matches Python script exactly
- Tracking CSV confirms row 7 is correct
- Added debug logging to verify runtime behavior

**Next Steps:**
1. Test with P040 link and check console logs
2. Verify the sequence matches tracking CSV
3. If mismatch found, investigate further

**Status:** ⚠️ Needs verification - debug logging added

---

## 📋 Testing Checklist

Before collecting more data:

1. **Test CSV Export:**
   - Run a test trial
   - Export CSV
   - Verify `projected_error_px` has numbers (not empty)
   - Verify `target_reentry_count` has numbers
   - Verify `verification_time_ms` has numbers
   - Verify `pixels_per_mm` and `pixels_per_degree` have numbers

2. **Test Block Sequence:**
   - Use P040 link
   - Check browser console for debug log
   - Verify sequence matches tracking CSV
   - Complete all 8 blocks
   - Verify block_order column matches expected sequence

3. **Performance Check:**
   - Close dev tools/console
   - Verify `avg_fps` is ~60fps (not ~26fps)
   - Dev tools significantly impact performance

---

## 🚨 DO NOT COLLECT DATA UNTIL:

- ✅ CSV fields are verified to contain numbers (not empty)
- ✅ Block sequence is verified to match tracking CSV
- ✅ FPS is acceptable (~60fps)

