# Sample Size & Power Status Report
## Current Dataset: N = 80 Participants

**Date:** Based on final Report.qmd (N=80)  
**Exclusions:** LBA analysis runs separately and is not included in this summary

---

## ✅ Quick Answer: Do We Have Minimum Sample Size?

**YES - We exceed all minimum sample size targets.**

- **Primary target:** N = 48 (sufficient for core analyses)
- **Extended target:** N = 64 (better for advanced analyses)
- **Current actual:** **N = 80** ✨

**Status:** All analyses (excluding LBA) have sufficient power and are up-to-date in the current report.

---

## 📊 Power Analysis Summary by Analysis Type

### Core Analyses (Primary Target: N = 48)

| Analysis | Minimum N | Current N | Status | Notes |
|----------|-----------|-----------|--------|-------|
| **Throughput (TP)** | 48 | 80 | ✅ **Exceeded** | N≈50 for 80% power (dz≈0.40); N=48 was primary target |
| **Movement Time (RT)** | 48 | 80 | ✅ **Exceeded** | Same power logic as TP (TP = ID/RT) |
| **NASA-TLX** | 48 | 80 | ✅ **Exceeded** | N=48 was "good, pre-planned N"; N=64 refines CIs |
| **Error Rate** | 48 (adequate)<br>64 (good) | 80 | ✅ **Exceeded** | Binary outcomes need more N; N=48 adequate but N=64 "good" |

**Conclusion:** All core analyses have **more than sufficient power** with N=80.

### Advanced/Exploratory Analyses (Extended Target: N = 64)

| Analysis | Minimum N | Current N | Status | Notes |
|----------|-----------|-----------|--------|-------|
| **Effective Width (We)** | 48 | 80 | ✅ **Exceeded** | N=48 sufficient for medium effects (dz≈0.4-0.5) |
| **Target Re-entries** | 48 (exploratory)<br>64 (confirmatory) | 80 | ✅ **Exceeded** | N=64 was "good" target for confirmatory |
| **Submovement Count** | 48 (exploratory)<br>64-72 (confirmatory) | 80 | ✅ **Exceeded** | N=64-72 needed for confirmatory UI-mode effects |
| **Verification Time** | 48 | 80 | ✅ **Exceeded** | N=48 was "good target" for medium effects |

**Conclusion:** All advanced analyses have **sufficient or better power** with N=80.

### Excluded from This Report

| Analysis | Status | Reason |
|----------|--------|--------|
| **LBA (Linear Ballistic Accumulator)** | ⏳ Runs separately | Requires heavy computation (hours), not included in current report update |

---

## 📈 Power Targets Summary

Based on `Report.qmd` and `POWER_ANALYSIS_QUICK_REFERENCE.md`:

### Primary Target: N = 48
**Sufficient for:**
- Throughput (TP) - main effects
- Movement Time (RT) - main effects  
- Error Rate - main effects (adequate)
- NASA-TLX - main effects
- Effective Width (We) - main effects

**Power reasoning:** Medium within-subject effect sizes (dz ≈ 0.4–0.6) require ≈50 participants for 80% power at α=.05 (Cohen, 1988; Brysbaert, 2019).

### Extended Target: N = 64
**Better for:**
- Error Rate - interactions and rare error types
- Target Re-entries - confirmatory analysis
- Submovement Count - confirmatory UI-mode effects
- Advanced cognitive modeling (LBA) - hierarchical models

**Power reasoning:** Binary outcomes and noisier metrics need more participants for stable mixed-effects estimation (Kumle et al., 2021).

---

## 🎯 Current Status: N = 80

**What this means:**
- ✅ **Exceeds primary target (N=48)** by 67% (32 extra participants)
- ✅ **Exceeds extended target (N=64)** by 25% (16 extra participants)
- ✅ **More than sufficient power** for all core analyses
- ✅ **Good to excellent power** for advanced/exploratory analyses
- ✅ **All results (excluding LBA) are up-to-date** in current Report.qmd

**Practical implications:**
- Confidence intervals are tighter than planned
- Interaction effects have better power than originally planned
- Exploratory analyses can be treated more confidently
- No need to collect more data for these analyses

---

## ✅ Results Status (Excluding LBA)

### Up-to-Date ✅

All analyses in the current `Report.qmd` are based on **N = 80** and are dynamically updated:

- ✅ Throughput analysis
- ✅ Movement Time (RT) analysis
- ✅ Error Rate analysis
- ✅ NASA-TLX workload analysis
- ✅ Effective Width (We) analysis
- ✅ Target Re-entries analysis
- ✅ Submovement Count analysis
- ✅ Verification Time analysis
- ✅ Fitts' Law regression
- ✅ Error type analysis (slips vs misses)
- ✅ Demographics summary

### Not Included ⏳

- ⏳ LBA analysis (runs separately, requires hours of computation)

---

## 📝 Recommendations

### For Case Study / Portfolio

**Say:**
- "We collected data from **N=80 participants**, exceeding our pre-planned targets (primary: N=48, extended: N=64)."
- "This provides **more than sufficient power** for all core analyses (throughput, RT, error rate, NASA-TLX)."
- "All results are up-to-date and based on the full dataset (N=80), with the exception of LBA analysis which runs separately."

**Don't say:**
- "We need more participants" (you don't - you exceed targets)
- "Sample size was N=32" (that was a draft/old status)

### For Academic Paper / ArXiv Preprint

**Report:**
- Final N=80 (exceeds pre-registered targets)
- Power analysis: N=48 was primary target (sufficient for main effects), N=64 was extended target (better for interactions/advanced analyses)
- Current N=80 provides excellent power for all planned analyses
- LBA analysis is ongoing/separate and will be reported separately

---

## 🔍 Power Analysis Details

### Design
- **Type:** 2×2×2 within-subjects factorial
- **Counterbalancing:** Williams Balanced Latin Square (8 sequences)
- **Model:** Mixed-effects models with random intercepts per participant `(1 | pid)`

### Effect Size Expectations
- **Modality effects:** Large (dz ≈ 0.8-1.0)
- **UI Mode effects:** Medium (dz ≈ 0.4-0.6) - **key hypothesis**
- **Pressure effects:** Small-medium (dz ≈ 0.3-0.5)
- **Interactions:** Small-medium (exploratory)

### Power Calculation Basis
- Cohen (1988): Standard repeated-measures power analysis
- Brysbaert (2019): Guidelines for cognitive experiments
- Kumle et al. (2021): Mixed-effects model power guidelines
- Matuschek et al. (2017): Within-subjects design recommendations

---

## 📚 References in Power Analysis

See `Report.qmd` section "Planned Sample Size & Power" and `POWER_ANALYSIS_QUICK_REFERENCE.md` for full details.

**Key takeaway:** N=80 exceeds all pre-planned minimum sample sizes, providing excellent power for all analyses (excluding LBA, which runs separately).
