# Repository Cleanup Plan

## Files to Consolidate/Archive

### Verification Reports
- ✅ **Keep:** `CSV_VERIFICATION_REPORT.md` (most recent, detailed, includes actual CSV validation)
- ⚠️ **Consider archiving:** `VERIFICATION_REPORT.md` (earlier verification, less detailed)
- ✅ **Keep:** `VERIFICATION_SUMMARY.txt` (quick reference summary)

**Action:** Move `VERIFICATION_REPORT.md` to `docs/archive/` or consolidate its content into `CSV_VERIFICATION_REPORT.md`

---

### Testing/Development Files
- ✅ **Keep:** `TESTING_WITH_P040.md` (useful testing guide)
- ⚠️ **Move to scripts/:** `clear_storage.js` (utility script, better organized in scripts/)

**Action:** Move `clear_storage.js` to `scripts/clear_storage.js`

---

### Documentation Files
- ✅ **Keep all:** These are all useful and serve different purposes:
  - `PRE_COLLECTION_CHECKLIST.md` - Pre-flight checklist
  - `NEXT_STEPS.md` - Next steps after fixes
  - `CRITICAL_FIXES_APPLIED.md` - Documentation of fixes
  - `DECLUTTER_ANALYSIS.md` - Feature analysis

---

### Template Files
- ✅ **Keep:** `EMAILJS_TEMPLATE.txt` (reference for EmailJS setup)

---

## Suggested Structure

```
xr-adaptive-modality-2025/
├── CSV_VERIFICATION_REPORT.md        # Keep (latest, comprehensive)
├── VERIFICATION_SUMMARY.txt          # Keep (quick reference)
├── TESTING_WITH_P040.md              # Keep (testing guide)
├── PRE_COLLECTION_CHECKLIST.md       # Keep (pre-flight)
├── NEXT_STEPS.md                     # Keep (next actions)
├── CRITICAL_FIXES_APPLIED.md         # Keep (fix documentation)
├── DECLUTTER_ANALYSIS.md             # Keep (feature analysis)
├── EMAILJS_TEMPLATE.txt              # Keep (reference)
├── scripts/
│   ├── clear_storage.js              # Move here
│   ├── generate_participant_links.py
│   └── generate_participant_tracking.py
└── docs/
    └── archive/                      # Create this directory
        └── VERIFICATION_REPORT.md    # Archive old verification
```

---

## Cleanup Actions

1. **Create archive directory:**
   ```bash
   mkdir -p docs/archive
   ```

2. **Move old verification report:**
   ```bash
   git mv VERIFICATION_REPORT.md docs/archive/VERIFICATION_REPORT.md
   ```

3. **Move utility script:**
   ```bash
   git mv clear_storage.js scripts/clear_storage.js
   ```

4. **Update references** (if any files reference the moved files)

5. **Commit changes:**
   ```bash
   git add docs/archive/ scripts/clear_storage.js
   git commit -m "Organize repository: archive old verification report, move utility script"
   ```

---

## Notes

- All files serve a purpose, so we're organizing rather than deleting
- Archive directory preserves history while keeping root clean
- Scripts directory is the logical place for utility scripts
- Main verification report is the comprehensive one (`CSV_VERIFICATION_REPORT.md`)

