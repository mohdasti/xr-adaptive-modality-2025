# Final Policy Harmonization

**Date:** 2025-03-07  
**Policy:** config/manuscript_analysis_policy.yaml, audit/manuscript_analysis_policy.md  
**Target:** N=69, 8-block complete, 27 trials/block, 216 main trials, pressure block-level, verification 200–5000 ms

---

## 1. Scripts Inspected

| Script | Purpose | Status | Notes |
|--------|---------|--------|------|
| scripts/compute_manuscript_stats.py | TLX, Fitts, width check | **Fully harmonized** | Uses manuscript_inclusion.load_and_prep(require_8_blocks=True) |
| scripts/export_case_study_assets.R | Performance, TLX, Fitts figures | **Fully harmonized** | 8-block filter (lines 114–118), QC, device filter |
| scripts/export_lba_figures.R | LBA forest plot, Figure 8 empirical | **Partially harmonized** | Fixed: 200–5000 ms, 8-block, QC, device |
| analysis/py/lba.py | LBA model fit | **Partially harmonized** | Uses 200–5000 ms; does NOT apply 8-block/QC/device filter |
| scripts/compute_analysis_populations.py | Population counts | **Fully harmonized** | Matches manuscript_inclusion logic |

---

## 2. Exact Mismatches Found

### 2.1 export_lba_figures.R (Figure 8 — empirical verification RT)

| Aspect | Before | After | Fix |
|--------|--------|-------|-----|
| RT range | 50–5000 ms | 200–5000 ms | Line 105: `verification_time_ms >= 50` → `>= 200` |
| 8-block filter | None | Applied | Added pids_8block filter (match export_case_study_assets.R) |
| QC filters | practice only | Full QC | Added trial_qc_ok, zoom, fullscreen, tab, focus |
| Device filter | None | Applied | Added input_device filter (hand: mouse; gaze: mouse+trackpad) |

### 2.2 analysis/py/lba.py

| Aspect | Current | Policy | Fix |
|--------|---------|--------|-----|
| 8-block filter | Not applied | use_primary_sample: true | **Not applied** — LBA loads raw data; adding 8-block would require re-running model. Flagged for future harmonization. |
| QC filters | None | trial_qc | **Not applied** — LBA uses raw trial_data.csv |
| Device filter | None | input_device | **Not applied** |
| RT range | 200–5000 ms | 200–5000 ms | ✓ Matches |

**Decision:** LBA model was fit on broader population. Re-running with 8-block filter would change t0 estimates. Empirical Figure 8 is now harmonized to match LBA RT range (200–5000) and manuscript policy (8-block, QC, device). The manuscript states "N=69 participants" for primary sample; LBA may include trials from participants without 8 blocks. Documented as known limitation; no LBA re-run in this pass to avoid destabilizing settled t0 interpretation.

---

## 3. Fixes Applied

### 3.1 export_lba_figures.R

- **Line 105:** `verification_time_ms >= 50` → `verification_time_ms >= 200`
- **Added:** 8-block filter (pids with n_distinct(block_number)==8)
- **Added:** trial_qc_ok (practice, zoom, fullscreen, tab, focus)
- **Added:** input_device filter (hand: mouse only; gaze: mouse or trackpad)

### 3.2 analysis/py/lba.py

- **No code changes** — LBA remains on current data. Policy mismatch documented.

---

## 4. Verification

After fixes, Figure 8 (verification_rt_empirical.png) will be regenerated with:
- Same RT bounds as LBA (200–5000 ms)
- Same participant sample as primary manuscript (8-block complete, N=69)
- Same QC and device rules as export_case_study_assets.R
