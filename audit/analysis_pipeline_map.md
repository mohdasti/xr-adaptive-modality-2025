# Analysis Pipeline Map

**Purpose:** Trace data flow from raw/merged dataset to manuscript outputs.

---

## Pipeline Overview

```
data/raw/*_merged.csv
        │
        ▼
scripts/merge_raw_data.py
        │
        ▼
data/clean/trial_data.csv  (81 participants, ~19k rows)
        │
        ├── Trial-level QC (practice, zoom, fullscreen, tab, focus)
        ├── Input device filter (hand: mouse only; gaze: mouse + trackpad)
        │
        ├─────────────────────────────────────────────────────────────
        │
        ├──► scripts/compute_manuscript_stats.py
        │         │
        │         ├── load_and_prep() → df with QC + input device
        │         ├── compute_tlx_subscales() → tlx_subscales_by_modality.csv
        │         ├── compute_fitts_slopes() → fitts_slopes_by_condition.csv
        │         └── compute_width_scaling_check() → width_scaling_check.csv
        │         │
        │         ▼
        │    docs/manuscript/assets/*.csv
        │
        ├──► scripts/export_case_study_assets.R
        │         │ (same QC as Report.qmd)
        │         ├── performance_combined.png, error_type_composition.png
        │         ├── tlx_overall.png, tlx_subscales.png
        │         ├── fitts_validation.png
        │         └── lba_t0_forest.png, verification_rt_empirical.png
        │         │
        │         ▼
        │    docs/assets/case_study/*.png
        │
        ├──► docs/analysis/Report.qmd
        │         │ df_factorial = filter(!has_pressure_bug) OR filter(n_distinct(pressure)==2)
        │         │ df_iso, df_all_trials, input device exclusion
        │         ▼
        │    Report.html (internal)
        │
        └──► analysis/py/lba.py
                  │ load_and_prep_data() → verification_time_ms, 200-5000ms
                  │ No explicit participant-level exclusion; uses all with valid verification RT
                  ▼
             outputs/LBA/lba_parameters_summary.csv, lba_trace.nc
```

---

## Participant-Level Exclusions by Analysis

| Analysis | Participant Filter | Evidence |
|----------|-------------------|----------|
| **compute_manuscript_stats** | None explicit; trial-level QC + input device only | `load_and_prep()` does not filter by 8 blocks |
| **TLX** | Participants with TLX data (block-level); no 8-block gate | `compute_tlx_subscales` uses all with tlx_mental |
| **Fitts** | Participants with valid correct trials; no 8-block gate | `compute_fitts_slopes` uses df after QC |
| **LBA** | Participants with verification_time_ms in range | `lba.py` load_and_prep_data; no block gate |
| **Report.qmd df_factorial** | `!has_pressure_bug` OR `n_distinct(pressure)==2` | Lines 598-606 |
| **export_case_study_assets.R** | Same as Report; no explicit 8-block filter | Reuses Report QC |

---

## Trial-Level Exclusions

| Step | Filter | Script |
|------|--------|--------|
| Practice | practice == false/na | compute_manuscript_stats, Report |
| Display | zoom_pct==100, fullscreen, tab_hidden<500, focus_blur==0 | Both |
| Valid RT | 150 ≤ rt_ms ≤ 6000, correct | Fitts, throughput |
| Input device | hand: mouse only; gaze: mouse+trackpad | Both |
| Verification RT (LBA) | 200 ≤ verification_time_ms ≤ 5000 | lba.py |

---

## Key Finding: No Uniform 8-Block Gate

**compute_manuscript_stats.py** does NOT filter to participants with 8 blocks. It uses all participants who have at least one QC-ok trial after input device filter. The manuscript's "N=67 with complete 2×2×2 factorial data" implies an 8-block completeness gate that is **not** implemented in compute_manuscript_stats. The Report.qmd uses `df_factorial` for throughput/ISO metrics, which applies pressure-bug exclusion (when flag exists) or both-pressure-levels check, but the Report does not explicitly filter to 8 blocks before computing N.
