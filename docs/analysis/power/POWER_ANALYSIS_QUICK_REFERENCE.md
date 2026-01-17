# Power Analysis Quick Reference

**Based on Expert Consultation - December 8, 2025**

## TL;DR

✅ **N=48 is sufficient** for main effects in both LBA and Control Theory analyses  
⚠️ **Interactions are underpowered** - treat as exploratory  
🔑 **LBA constraint:** Use hierarchical modeling (not per-condition per-person)  
📊 **Focus on validity** for control theory (duration-normalized metrics, FDR)

---

## Power Summary Table

| Analysis Type | Main Effects | Interactions | Recommendation |
|---------------|-------------|--------------|-----------------|
| **LBA (hierarchical)** | ✅ N=48 sufficient (dz≈0.41, power≈0.80) | ⚠️ Underpowered (dz<0.40) | Use hierarchical modeling; treat interactions as exploratory |
| **Control Theory** | ✅ N=48 sufficient (dz≈0.41, power≈0.80) | ⚠️ Underpowered (dz<0.40) | Focus on validity; FDR for multiple metrics |
| **Primary Analyses** | ✅ N=48 sufficient (dz≈0.60, power≈0.95) | ✅ Adequate | Already powered |

---

## LBA Analysis: Critical Constraints

### The Real Problem (Not N=48)

1. **Trial Count:** ~24 trials/cell is **too thin** for per-condition per-person parameters
2. **Error Rate:** 3-5% errors is **problematic** (recommended: 15-35% for strong identifiability)

### Solution: Hierarchical LBA

**DO:**
- Model parameters as functions of experimental factors
- Use partial pooling to stabilize estimation
- Example: `(b-A) ~ UI_mode + pressure + (UI_mode × pressure) + (1|pid)`

**DON'T:**
- Fit separate LBA parameters per condition per person
- This will give unstable thresholds/drifts and parameter trade-offs

### Early Identifiability Check

- Fit hierarchical model on first ~15-20 participants
- Check for: divergent transitions, extreme posteriors, wide credible intervals
- If bad: Add trials (not participants) to conditions driving key contrasts

---

## Control Theory: Key Considerations

### N=48 is Sufficient

- Main effects: Powered at ~0.80 for dz≈0.41
- You have: N=48, ~24 trials/cell, high-resolution trajectories

### Focus on Validity (Not Just Power)

1. **Duration-normalized metrics:**
   - Jerk is very duration-sensitive
   - Use normalized jerk or log dimensionless jerk

2. **Multiple comparisons:**
   - Pre-specify a small set of theoretically motivated outcomes
   - Use FDR (Benjamini-Hochberg) for exploratory metrics

3. **Submovement detection:**
   - Document your algorithm (peak detection thresholds, filtering)
   - Consider robustness checks (alternative detectors)

### 60fps Trajectory Data

- ✅ Improves measurement precision
- ✅ Enables better feature extraction
- ❌ Does NOT increase effective N (participant is still the unit of inference)

---

## What to Report

### For Exploratory Analyses

1. **Pre-label as exploratory** (or "secondary, not powered for interactions")
2. **Report:**
   - Estimated effects + uncertainty (confidence/credible intervals)
   - Model fit diagnostics
   - Robustness checks
3. **For nulls:**
   - Don't report "post-hoc observed power" (known fallacy)
   - Report effect sizes + intervals
   - Interpret cautiously

### For Interactions

- **Label as exploratory** upfront
- **Report effect sizes** even if non-significant
- **Acknowledge underpowered** status
- **Interpret cautiously**

---

## Key References

**LBA Parameter Recovery:**
- Visser & Poessé: ~150 datapoints = practical minimum

**Error Rate & Identifiability:**
- Lüken et al. (PMC): 15-35% error range; low errors hurt identifiability

**Smoothness Metrics:**
- Gulde et al. (PubMed): Large ds; note duration-control caveat

**Submovement Sensitivity:**
- Hsieh et al. (PLOS One): Huge effects of constraint manipulations

**Why Not Post-Hoc Power:**
- Hoenig & Heisey: "Abuse of power" paper

---

## Bottom Line

1. ✅ **Keep N=48** - don't expand just for LBA
2. ✅ **Use hierarchical LBA** - not per-condition per-person fits
3. ⚠️ **Treat interactions as exploratory** - they're underpowered
4. ✅ **Focus on validity** for control theory - duration-normalized metrics, FDR
5. 📊 **If you can change anything mid-collection:** Add trials (not participants) to key conditions

**See `POWER_ANALYSIS_EXPERT_RESPONSE.md` for full details.**










