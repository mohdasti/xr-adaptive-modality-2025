# Report Reorganization Plan: Main Report vs Supplement

**Date:** December 2025  
**Purpose:** Clear separation of core findings vs exploratory/descriptive analyses

---

## Statistical Code Audit: ✅ COMPLETE

**All statistical analyses are correct:**
- ✅ Type III ANOVA for unbalanced designs (hand N=75, gaze N=80)
- ✅ Sum-to-zero contrasts (`contr.sum`) properly set
- ✅ Mixed-effects models with appropriate random intercepts
- ✅ Sample sizes accurately reported by modality
- ✅ Input device exclusion properly documented

**No changes needed to statistical code.**

---

## Section Organization

### **MAIN REPORT** (Core Findings)

These sections address **pre-registered research questions and hypotheses**:

1. **Executive Summary** (Line ~984)
   - Keep: Overview of key findings
   - Status: ✅ CRITICAL

2. **Demographics** (Line ~1050)
   - Keep: Brief sample characterization (N, age, gender, input device)
   - Move to Supplement: Extended demographics (gaming, vision correction, etc.)
   - Status: ✅ REQUIRED (brief version)

3. **Data Quality & Coverage Gate** (Line ~937)
   - Keep: QC metrics, exclusion rationale
   - Status: ✅ REQUIRED

4. **Throughput** (Line ~1142) - **PRIMARY**
   - Keep: Complete section (RQ1)
   - Status: ✅ PRIMARY ANALYSIS

5. **Movement Time** (Line ~1574) - **PRIMARY**
   - Keep: Complete section (RQ1/RQ3)
   - Status: ✅ CORE CONFIRMATORY

6. **Fitts' Law Modelling** (Line ~1948) - **VALIDATION**
   - Keep: Complete section (H4 validation)
   - Status: ✅ VALIDATION

7. **Error Rate** (Line ~2012) - **PRIMARY**
   - Keep: Complete section (RQ1/RQ3)
   - Status: ✅ CORE CONFIRMATORY

8. **Accuracy & Gaze Dynamics** (Line ~2240) - **PARTIAL**
   - **Keep in Main:**
     - Effective Width ($W_e$) statistical analysis (H4 validation)
     - Statistical tests for We
   - **Move to Supplement:**
     - Endpoint Accuracy Scatter Plot (Line ~2507) - exploratory visualization
     - "Midas Touch" Re-entries (Line ~2613) - interesting but descriptive
   - Status: ✅ VALIDATION (partial)

9. **NASA-TLX** (Line ~2773) - **PRIMARY**
   - Keep: Complete section (RQ2)
   - Status: ✅ CORE CONFIRMATORY

10. **Summary & Conclusions** (Line ~7834)
    - Keep: Final summary
    - Status: ✅ CRITICAL

---

### **SUPPLEMENT** (Exploratory/Descriptive)

These sections are **exploratory, descriptive, or advanced analyses**:

1. **Extended Demographics** (from Section 2)
   - Gaming hours, vision correction, motor impairments, etc.
   - Line: ~1050-1139 (extract extended tables)

2. **Accuracy Scatter Plots & Midas Touch Analysis** (from Section 7)
   - Endpoint accuracy scatter plots (Line ~2507)
   - "Midas Touch" re-entry analysis (Line ~2613)
   - Status: Exploratory visualization

3. **Participant Awareness & Strategy (Debrief)** (Section 9, Line ~3375)
   - Participant awareness of adaptations
   - Strategy changes
   - Status: Qualitative/Supplementary

4. **Learning Curves & Practice Effects** (Section 10, Line ~3620)
   - Performance over time within conditions
   - Practice effects
   - Status: Exploratory

5. **Movement Quality Metrics** (Section 11, Line ~3913)
   - Submovement analysis
   - Verification time
   - Status: Advanced/Exploratory

6. **Error Patterns & Types** (Section 12, Line ~4697)
   - Error type breakdown (miss, timeout, slip)
   - Status: Descriptive

7. **Block Order & Temporal Effects** (Section 13, Line ~4784)
   - Performance by block number
   - Temporal patterns
   - Status: Exploratory

8. **Spatial Patterns & Heatmaps** (Section 14, Line ~4956)
   - Spatial distribution of endpoints
   - Heatmaps
   - Status: Visualization/Exploratory

9. **Adaptive UI Mechanism Analysis** (Section 15, Line ~5505)
   - How adaptations activated (if at all)
   - Policy engine activation
   - Status: Exploratory

10. **Gaze-Specific Analysis: Hover/Dwell Time** (Section 16, Line ~6890)
    - Gaze hover and dwell times
    - Status: Gaze-specific/Exploratory

11. **Linear Ballistic Accumulator (LBA) Analysis** (Section 17, Line ~7212)
    - Cognitive modeling of decision processes
    - Status: Advanced/Exploratory

12. **Control Theory Analysis: Submovement Models** (Section 18, Line ~7329)
    - Movement kinematics
    - Control theory modeling
    - Status: Advanced/Exploratory

---

## Line-by-Line Extraction Guide

### To Extract to Supplement:

**From Section 7 (Accuracy & Gaze Dynamics):**
- Line ~2507-2612: Endpoint Accuracy Scatter Plot
- Line ~2613-2772: "Midas Touch" Re-entries

**Section 9 (Debrief):**
- Line ~3375-3619: Entire section

**Section 10 (Learning Curves):**
- Line ~3620-3912: Entire section

**Section 11 (Movement Quality):**
- Line ~3913-4696: Entire section

**Section 12 (Error Patterns):**
- Line ~4697-4783: Entire section

**Section 13 (Block Order):**
- Line ~4784-4955: Entire section

**Section 14 (Spatial Patterns):**
- Line ~4956-5504: Entire section

**Section 15 (Adaptive UI):**
- Line ~5505-6889: Entire section

**Section 16 (Gaze Hover/Dwell):**
- Line ~6890-7211: Entire section

**Section 17 (LBA):**
- Line ~7212-7328: Entire section

**Section 18 (Control Theory):**
- Line ~7329-7833: Entire section

---

## Recommended Action

### Option 1: Keep Current Report As-Is
- Keep all sections in `Report.qmd`
- Use `Report_Section_Audit.md` as a guide when writing case study
- Focus on sections 3, 4, 6, 8 (core findings) in case study

### Option 2: Create Separate Supplement File
- Create `Report_Supplement.qmd` with supplementary sections
- Keep `Report.qmd` focused on core findings
- Reference supplement from main report

### Option 3: Use Section Headers to Mark Importance
- Add comments to `Report.qmd` marking sections as "CORE" vs "SUPPLEMENT"
- Keep all in one file but organized
- Easy to skip sections when reading

---

## For Case Study Writing

**Focus on these core sections:**
1. **Section 3: Throughput** - Primary performance metric (RQ1)
2. **Section 4: Movement Time** - Complementary performance (RQ1/RQ3)
3. **Section 6: Error Rate** - Error analysis (RQ1/RQ3)
4. **Section 8: NASA-TLX** - Workload assessment (RQ2)

**Key findings to highlight:**
- Hand > Gaze in throughput (modality main effect)
- Gaze errors are predominantly "slips" (Midas Touch problem)
- Gaze workload > Hand workload
- Adaptive vs Static TLX is similar (null finding is informative)
- Input device exclusion (hand N=75, gaze N=80)

**Can reference but not emphasize:**
- Section 5: Fitts' Law (validation that task works)
- Section 7: Effective Width (ISO 9241-9 metric, manipulation check)
- Other sections: Exploratory/descriptive findings

---

## For arXiv Preprint

**Main paper should include:**
- Introduction & Background
- Methods (Design, Participants, Apparatus, Procedure)
- Results:
  - Throughput (Section 3)
  - Movement Time (Section 4)
  - Error Rate (Section 6)
  - NASA-TLX (Section 8)
  - Effective Width (Section 7, statistical part)
- Discussion
- Conclusion

**Supplementary material:**
- Extended demographics
- Learning curves
- Movement quality metrics
- Error patterns
- Exploratory analyses (LBA, Control Theory)
- Extended visualizations

---

## File Structure (If Creating Supplement)

```
Report.qmd (Main Report)
├── 1. Executive Summary
├── 2. Demographics (brief)
├── 3. Data Quality & Coverage Gate
├── 4. Throughput (Primary)
├── 5. Movement Time (Primary)
├── 6. Fitts' Law (Validation)
├── 7. Error Rate (Primary)
├── 8. Effective Width (Validation) [Statistical part only]
├── 9. NASA-TLX (Primary)
└── 10. Summary & Conclusions

Report_Supplement.qmd (Supplementary Material)
├── 1. Extended Demographics
├── 2. Accuracy Scatter Plots & Midas Touch
├── 3. Participant Awareness (Debrief)
├── 4. Learning Curves
├── 5. Movement Quality Metrics
├── 6. Error Patterns & Types
├── 7. Block Order & Temporal Effects
├── 8. Spatial Patterns & Heatmaps
├── 9. Adaptive UI Mechanism Analysis
├── 10. Gaze Hover/Dwell Analysis
├── 11. Linear Ballistic Accumulator (LBA)
└── 12. Control Theory Analysis
```

---

## Next Steps

1. ✅ **Audit complete:** Statistical code is correct
2. ✅ **Categorization complete:** Sections organized by importance
3. ⏳ **Decision needed:** Which option do you prefer?
   - Option 1: Keep as-is, use audit as guide
   - Option 2: Create separate supplement file
   - Option 3: Add section markers to current file

Once you decide, I can:
- Create `Report_Supplement.qmd` if needed
- Extract sections from main report if requested
- Add section markers/comments if preferred

---

*This reorganization will help you focus on core findings for the case study and structure the preprint appropriately.*
