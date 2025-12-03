# Testing with P040

## ✅ Yes, you can reuse P040 for testing!

For testing purposes, reusing P040 is perfectly fine. Here are the best ways to do it:

## Option 1: Use Incognito/Private Window (Easiest)

1. Open an **Incognito/Private window** in your browser
2. Navigate to the P040 link: `https://xr-adaptive-modality-2025.vercel.app/intro?pid=P040&session=1`
3. This starts completely fresh (no localStorage/sessionStorage)
4. Perfect for testing!

## Option 2: Clear Browser Storage Manually

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Clear:
   - **localStorage** → Right-click → Clear
   - **sessionStorage** → Right-click → Clear
4. Refresh the page
5. Navigate to P040 link again

## Option 3: Use Browser Console

Open console and run:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Then navigate to: `https://xr-adaptive-modality-2025.vercel.app/intro?pid=P040&session=1`

---

## What to Test

### 1. **CSV Fields (CRITICAL)**
- Complete a few trials
- Download CSV
- **Check that these columns have NUMBERS (not empty):**
  - `projected_error_px`
  - `target_reentry_count`
  - `verification_time_ms`
  - `pixels_per_mm`
  - `pixels_per_degree`

### 2. **Block Sequence**
- Check browser console for: `[TaskPane] Participant P040: index=39, row=7, sequence=...`
- Verify the sequence matches: `['GaA_P1', 'HaS_P0', 'GaA_P0', 'GaS_P0', 'HaA_P0', 'HaA_P1', 'HaS_P1', 'GaS_P1']`
- Complete at least 2 blocks and verify `block_order` column matches

### 3. **Performance**
- Close DevTools before testing (they reduce FPS)
- Verify `avg_fps` is ~60fps, not ~26fps

---

## Important Notes

- ✅ **Testing is fine** - reusing P040 for verification is expected
- ⚠️ **Don't submit test data** - this is just to verify fixes work
- 🔄 **Each new session creates a new CSVLogger instance** - data is isolated per session
- 📊 **CSV downloads are separate** - each test run creates a new file with timestamp

---

## Quick Test Checklist

- [ ] Clear storage or use incognito
- [ ] Load P040 link
- [ ] Complete 2-3 trials
- [ ] Download CSV
- [ ] Verify all 5 critical fields have numbers
- [ ] Check console for block sequence log
- [ ] Verify block_order matches expected sequence

---

**Ready to test!** Once you verify the CSV fields contain numbers, you can proceed with real data collection.

