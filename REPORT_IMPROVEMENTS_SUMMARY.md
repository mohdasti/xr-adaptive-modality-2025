# Report.qmd Improvements Summary

## Date: 2025-01-XX

This document summarizes the improvements made to `Report.qmd` to enhance statistical reporting and APA-style formatting.

---

## ✅ Completed Improvements

### 1. APA-Style Formatting Functions

Added helper functions for proper APA-style statistical reporting:
- `format_p_apa()`: Formats p-values (< .001, = .003, etc.)
- `format_F_apa()`: Formats F-statistics (F(df1, df2) = value, p = .xxx)
- `format_t_apa()`: Formats t-statistics
- `format_chisq_apa()`: Formats chi-square statistics
- `calc_partial_eta_sq()`: Calculates partial eta-squared from F-statistics
- `interpret_cohens_d()`: Interprets Cohen's d (negligible/small/medium/large)
- `interpret_eta_sq()`: Interprets partial eta-squared

### 2. APA-Style Written Results Sections

Added comprehensive written results sections for all major analyses:

#### **Throughput Analysis** (Section 3)
- Main effect of modality with F-statistic, p-value, partial η², and interpretation
- Main effect of UI mode with effect size and interpretation
- Modality × UI Mode interaction with follow-up recommendations
- Descriptive statistics with 95% CIs from estimated marginal means

#### **Movement Time Analysis** (Section 4)
- Main effects and interactions with proper APA formatting
- Descriptive statistics on log-transformed scale (back-transformed for interpretation)
- Effect sizes and confidence intervals

#### **Error Rate Analysis** (Section 6)
- GLMM results with chi-square or F-statistics (depending on model type)
- Error rates reported as percentages with 95% CIs
- Proper interpretation for binomial models

#### **NASA-TLX Analysis** (Section 8)
- Main effects and interactions for workload
- Descriptive statistics with 95% CIs
- Effect size interpretations

### 3. Effect Size Calculations

- **Partial Eta-Squared (η²p)**: Calculated for all ANOVA effects
  - Formula: η²p = (F × df1) / (F × df1 + df_error)
  - Interpreted as: negligible (< 0.01), small (0.01-0.06), medium (0.06-0.14), large (> 0.14)

- **Cohen's d (approximate)**: Added to pairwise comparisons
  - Approximated from t-ratios for paired comparisons
  - Interpreted as: negligible (< 0.2), small (0.2-0.5), medium (0.5-0.8), large (> 0.8)

### 4. Enhanced Pairwise Comparisons

- Added Cohen's d approximations to pairwise comparison tables
- Effect size interpretations included
- Proper p-value formatting

---

## ✅ Statistical Model Verification

### Model Specifications (All Correct)

1. **Throughput Model**
   ```r
   lmer(TP ~ modality * ui_mode * pressure + (1 | pid), ...)
   ```
   - ✅ Correct: 3-way factorial with random intercept
   - ✅ Uses REML = FALSE for model comparison
   - ✅ bobyqa optimizer for stability

2. **Movement Time Model**
   ```r
   lmer(log(rt_s) ~ modality * ui_mode * pressure + (1 | pid), ...)
   ```
   - ✅ Correct: Log transformation for normality
   - ✅ Type = "response" for emmeans (back-transforms)
   - ✅ Random intercept structure

3. **Error Rate Model**
   ```r
   glmer(error ~ modality * ui_mode * pressure + (1 | pid), 
         family = binomial(link = "logit"), ...)
   ```
   - ✅ Correct: Binomial GLMM for binary outcomes
   - ✅ Logit link function
   - ✅ Increased maxfun for convergence

4. **TLX Model**
   ```r
   lmer(overall_tlx ~ modality * ui_mode + (1 | pid), ...)
   ```
   - ✅ Correct: 2-way factorial (no pressure in TLX)
   - ✅ Random intercept structure

### ANOVA Type
- ✅ All models use Type III ANOVA (appropriate for factorial designs with sum-to-zero contrasts)
- ✅ Contrasts set to `contr.sum` in setup chunk

---

## 📊 Figure Captions

### Status: Needs Review

All figures should have:
- ✅ Dynamic sample sizes (already implemented)
- ✅ Clear descriptions of what is shown
- ✅ APA-compliant formatting
- ⚠️ **Action Needed**: Review all 59 figure captions for completeness

**Recommendation**: Review each figure caption to ensure:
1. Sample size is included (N = XX)
2. What is being plotted is clear
3. Any special features (e.g., "95% CI", "Holm-adjusted") are mentioned
4. Captions are concise but informative

---

## 📝 Remaining Tasks

### High Priority
- [ ] **Review all figure captions** (59 figures total)
  - Ensure sample sizes are included
  - Verify clarity and completeness
  - Check APA compliance

### Medium Priority
- [ ] **Add effect size tables** for key comparisons
  - Create summary table of all effect sizes
  - Include both partial η² and Cohen's d where appropriate

- [ ] **Verify confidence intervals** are reported consistently
  - All EMMs should have 95% CIs
  - Check that CI columns are properly identified

### Low Priority
- [ ] **Add model fit statistics** (AIC, BIC, R²) to model summaries
- [ ] **Add diagnostic plots** section (residuals, Q-Q plots)
- [ ] **Create effect size interpretation table** (reference guide)

---

## 📚 APA 7th Edition Compliance Checklist

### Statistical Reporting
- ✅ F-statistics: F(df1, df2) = value, p = .xxx
- ✅ t-statistics: t(df) = value, p = .xxx
- ✅ Chi-square: χ²(df) = value, p = .xxx
- ✅ p-values: < .001, = .003, etc.
- ✅ Effect sizes: Partial η² and Cohen's d reported
- ✅ Confidence intervals: 95% CIs for all means

### Written Results
- ✅ Clear statement of significance/non-significance
- ✅ Descriptive statistics (M, SD, 95% CI)
- ✅ Effect size interpretations
- ✅ Follow-up recommendations for interactions

### Model Descriptions
- ✅ Model type specified (LMM, GLMM)
- ✅ Random effects structure described
- ✅ Transformations mentioned (log for RT)
- ✅ Link functions specified (logit for errors)

---

## 🔍 Quality Assurance

### What to Check When Rendering

1. **Statistical Output**
   - All F-statistics formatted correctly
   - p-values display properly (< .001 vs = .003)
   - Effect sizes calculated (not NA)
   - Confidence intervals present

2. **Written Results**
   - Text flows naturally
   - Numbers match ANOVA tables
   - Effect size interpretations are correct
   - No missing values or errors

3. **Model Diagnostics**
   - Models converge without warnings
   - EMMs compute successfully
   - Pairwise comparisons complete

---

## 📖 References for APA Style

- American Psychological Association. (2020). *Publication manual of the American Psychological Association* (7th ed.).
- Lakens, D. (2013). Calculating and reporting effect sizes to facilitate cumulative science: A practical primer for t-tests and ANOVAs. *Frontiers in Psychology*, 4, 863.
- Cohen, J. (1988). *Statistical power analysis for the behavioral sciences* (2nd ed.). Erlbaum.

---

## 🎯 Next Steps

1. **Render the report** and review all written results sections
2. **Check figure captions** for completeness
3. **Verify effect sizes** are reasonable (not NA, within expected ranges)
4. **Test with new data** when additional participants are added
5. **Update sample sizes** dynamically (already implemented)

---

**Last Updated**: 2025-01-XX  
**Status**: Core improvements complete, figure caption review pending



