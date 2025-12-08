# Participant Exclusion Criteria

**Date:** December 8, 2025  
**Status:** Active

---

## Overview

This document specifies the criteria for excluding participants from the main statistical analysis. Exclusions are based on data quality issues and technical problems encountered during data collection.

---

## Excluded Participants

### Category 1: Pressure Condition Logging Bug

**Participants:** P002, P003, P007, P008, P015, P039, P040

**Reason for Exclusion:**
All trials from these participants were logged with `pressure = 1` (Pressure ON) regardless of the actual block condition. This was due to a bug in the data logging code that was fixed on December 8, 2025 (commit `04758db`).

**Technical Details:**
- **Bug Location**: `app/src/components/TaskPane.tsx` line 1105
- **Bug Description**: Code passed `pressure={pressure}` (always 1.0) instead of `pressure={pressureEnabled ? 1 : 0}`
- **Impact**: 27 out of 55 blocks had incorrect pressure values
- **Verification**: Block order codes (e.g., `HaS_P0`) indicate pressure=0 blocks, but logged values show pressure=1

**Data Status:**
- ✅ Modality and UI Mode logged correctly (0 mismatches)
- ❌ Pressure logged incorrectly (27/55 blocks affected)
- ✅ All 8 blocks completed per participant
- ❌ Only pressure=1 condition present in data

**Exclusion Rationale:**
The experimental design requires a 2 × 2 × 2 within-subjects factorial analysis (Modality × UI Mode × Pressure). Without both pressure conditions (0 and 1), these participants cannot contribute to the full factorial model. Statistical models require at least 2 levels for each factor to estimate contrasts.

**Alternative Uses:**
These participants' data can be used for:
- Exploratory analysis of pressure=1 condition only
- Pilot data validation
- Practice effect estimation
- Sub-analyses excluding pressure as a factor

**Replacement Strategy:**
7 additional participants (P049-P055) were added to compensate, ensuring N=48 for the main analysis.

---

## Inclusion Criteria

### For Main 2×2×2 Factorial Analysis

Participants are **included** if they meet ALL of the following criteria:

1. ✅ **Complete Data Collection**: All 8 blocks completed
2. ✅ **Both Pressure Conditions**: Data contains both `pressure = 0` and `pressure = 1`
3. ✅ **Both Modalities**: Data contains both `modality = 'hand'` and `modality = 'gaze'`
4. ✅ **Both UI Modes**: Data contains both `ui_mode = 'static'` and `ui_mode = 'adaptive'`
5. ✅ **Display Compliance**: <40% of trials excluded due to display violations
6. ✅ **Valid Trials**: ≥50% of trials have valid RT (150ms ≤ rt_ms ≤ 6000ms)

### Verification Code

```r
library(tidyverse)
df <- read_csv('data/clean/trial_data.csv')

# Check pressure conditions per participant
pressure_check <- df %>%
  filter(practice == FALSE) %>%
  group_by(participant_id) %>%
  summarise(
    n_pressure_levels = n_distinct(pressure),
    pressures = paste(sort(unique(pressure)), collapse = ', '),
    .groups = 'drop'
  )

# Participants with both pressure conditions (INCLUDED)
included <- pressure_check %>% filter(n_pressure_levels == 2)

# Participants with only one pressure level (EXCLUDED)
excluded <- pressure_check %>% filter(n_pressure_levels == 1)

print("INCLUDED:")
print(included)
print("\nEXCLUDED:")
print(excluded)
```

---

## Final Sample Size

| Category | Count | Participants |
|----------|-------|--------------|
| **Excluded (Pressure Bug)** | 7 | P002, P003, P007, P008, P015, P039, P040 |
| **Included (Main Analysis)** | 48 | P001, P004-P006, P009-P048, P049-P055 |
| **Total** | 55 | All participants |

**Final N for Main Analysis:** 48 participants

This provides:
- 6 complete Williams blocks (48 ÷ 8 = 6.0)
- Balanced counterbalancing across all 8 sequences
- Statistical power ≈ 0.95 for d=0.60 within-subjects effects

---

## Documentation in Manuscript

This exclusion is documented in the Methods section of the manuscript:

> "Seven participants (P002, P003, P007, P008, P015, P039, P040) were excluded from the main analysis due to a data logging error that incorrectly recorded all trials as pressure=1 regardless of block condition. This error was identified and fixed on December 8, 2025 (commit 04758db). The affected participants' data were retained for exploratory analyses but excluded from the primary 2×2×2 factorial analysis to ensure all factors had complete data. Seven replacement participants (P049-P055) were added to maintain the target sample size of N=48."

---

## References

- **Audit Report**: See `AUDIT_REPORT.md` for full technical details
- **Bug Fix**: Commit `04758db` in git history
- **Data Dictionary**: See `data/dict/data_dictionary.md` for schema details

---

*Last updated: December 8, 2025*

