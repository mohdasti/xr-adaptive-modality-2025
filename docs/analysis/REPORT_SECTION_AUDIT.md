# Report Section Audit & Reorganization Plan

**Date:** December 2025  
**Purpose:** Audit statistical code and categorize sections for core report vs supplements

---

## Statistical Code Audit

### ✅ **Verified: Statistical Analysis Code is Correct**

**Contrasts & ANOVA Type:**
- ✅ `options(contrasts = c("contr.sum", "contr.poly"))` set at line 40
- ✅ All models use `anova(..., type = "III")` for unbalanced designs
- ✅ Error model uses `car::Anova(..., type = "III")` with fallback
- ✅ **Correctly handles unbalanced design** (hand N=75, gaze N=80)

**Model Specifications:**
- ✅ Throughput: `lmer(TP ~ modality * ui_mode * pressure + (1 | pid))`
- ✅ RT: `lmer(log_rt ~ modality * ui_mode * pressure + (1 | pid))`
- ✅ Error Rate: `glmer(error ~ modality * ui_mode * pressure + (1 | pid), family = binomial)`
- ✅ TLX: `lmer(overall_tlx ~ modality * ui_mode + (1 | pid))`
- ✅ **All use appropriate random intercepts**

**Sample Size Reporting:**
- ✅ All sections now report modality-specific N (hand N=75, gaze N=80)
- ✅ Unbalanced design documented in power analysis sections
- ✅ **Transparent about input device exclusion**

**No Issues Found:**
- Code correctly implements Type III ANOVA for unbalanced designs
- Mixed-effects models appropriately specified
- Sample sizes accurately reported

---

## Section Categorization

### **CORE SECTIONS** (Primary Report)
**Essential for addressing research questions and hypotheses**

| Section | Title | Importance | Rationale |
|---------|-------|------------|-----------|
| 1 | Executive Summary | **CRITICAL** | Overview of key findings |
| 2 | Demographics | **REQUIRED** | Sample characterization (brief) |
| 3 | Throughput | **PRIMARY** | RQ1: Core performance metric |
| 4 | Movement Time | **PRIMARY** | RQ1/RQ3: Complementary to throughput |
| 6 | Error Rate | **PRIMARY** | RQ1/RQ3: Error analysis |
| 8 | NASA-TLX | **PRIMARY** | RQ2: Workload assessment |
| 7 | Effective Width | **VALIDATION** | H4: ISO 9241-9 metric, manipulation check |
| 5 | Fitts' Law | **VALIDATION** | H4: Validation that task works |

### **SUPPLEMENTARY SECTIONS** (Move to Supplement)
**Exploratory, descriptive, or advanced analyses**

| Section | Title | Type | Why Supplementary |
|---------|-------|------|-------------------|
| 7 (partial) | Accuracy Scatter Plots | **Exploratory** | Visualization, not core finding |
| 7 (partial) | "Midas Touch" Re-entries | **Interesting but exploratory** | Descriptive finding, not pre-registered |
| 9 | Debrief Analysis | **Qualitative/Supplementary** | Participant awareness, not core RQ |
| 10 | Learning Curves | **Exploratory** | Practice effects, not primary outcome |
| 11 | Movement Quality Metrics | **Advanced/Exploratory** | Submovements, verification time - exploratory |
| 12 | Error Patterns & Types | **Descriptive** | Error type breakdown, descriptive |
| 13 | Block Order & Temporal Effects | **Exploratory** | Temporal patterns, not pre-registered |
| 14 | Spatial Patterns & Heatmaps | **Visualization** | Descriptive visualization |
| 15 | Adaptive UI Mechanism Analysis | **Exploratory** | How adaptations activated (if at all) |
| 16 | Gaze Hover/Dwell Time | **Exploratory** | Gaze-specific metrics, not core |
| 17 | LBA Analysis | **Advanced/Exploratory** | Cognitive modeling, exploratory |
| 18 | Control Theory Analysis | **Advanced/Exploratory** | Movement modeling, exploratory |
| 19 | Summary & Conclusions | **CRITICAL** | Keep in main (final summary) |

---

## Recommended Report Structure

### **MAIN REPORT** (`Report.qmd`)
1. Executive Summary
2. Demographics (brief)
3. Data Quality & Coverage Gate
4. Throughput (Primary Analysis)
5. Movement Time (Core Confirmatory)
6. Fitts' Law Modelling (Validation)
7. Error Rate (Core Confirmatory)
8. Effective Width (Validation/Accuracy)
   - Keep: Statistical analysis of We
   - Move to Supplement: Scatter plots, Midas Touch re-entries
9. NASA-TLX (Core Confirmatory)
10. Summary & Conclusions

### **SUPPLEMENT** (`Report_Supplement.qmd`)
1. Extended Demographics
2. Accuracy Scatter Plots & Midas Touch Analysis
3. Debrief Analysis (Participant Awareness)
4. Learning Curves & Practice Effects
5. Movement Quality Metrics
6. Error Patterns & Types (Extended)
7. Block Order & Temporal Effects
8. Spatial Patterns & Heatmaps
9. Adaptive UI Mechanism Analysis
10. Gaze-Specific Analysis (Hover/Dwell)
11. Linear Ballistic Accumulator (LBA) Analysis
12. Control Theory Analysis

---

## Action Plan

1. ✅ **Audit complete:** Statistical code is correct
2. ⏳ **Create Supplement file:** `Report_Supplement.qmd`
3. ⏳ **Move sections:** Extract supplementary sections from main report
4. ⏳ **Update cross-references:** Link from main report to supplement
5. ⏳ **Update TOC:** Ensure main report has clear structure

---

## Benefits

**For Case Study:**
- Clear focus on core findings (Throughput, RT, Errors, TLX)
- Less overwhelming when explaining methodology
- Key insights stand out (e.g., gaze errors are slips)

**For arXiv Preprint:**
- Main paper focuses on pre-registered hypotheses
- Supplementary material available but not distracting
- Follows standard academic structure (main + supplement)

**For Writing:**
- Clear separation of confirmatory vs exploratory
- Easier to write focused narrative in main report
- Supplement available for reviewers/interested readers

---

## Statistical Code Summary

**All models correctly implement:**
- Type III ANOVA (appropriate for unbalanced designs)
- Sum-to-zero contrasts (`contr.sum`)
- Mixed-effects models with random intercepts
- Proper sample size reporting (hand N=75, gaze N=80)
- Transparent documentation of input device exclusion

**No changes needed to statistical code.**
