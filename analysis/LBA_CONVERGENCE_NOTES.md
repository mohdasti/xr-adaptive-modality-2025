# LBA Model Convergence Issues and Solutions

## Current Status

The LBA analysis completed but showed **convergence problems**:

### Issues Detected

1. **20 divergences** after tuning (should be 0)
2. **Chains reached maximum tree depth** (indicates difficult geometry)
3. **High R-hat values** (1.83-2.21, should be < 1.01, acceptable < 1.05)
4. **Very low ESS** (3-1605, should be > 400 for reliable inference)
5. **R-hat > 1.01** for most parameters (indicates poor convergence)

### What This Means

- **Results are unreliable** - parameter estimates may be biased
- **Credible intervals are too narrow** - uncertainty is underestimated
- **Model may be misspecified** or have difficult geometry
- **Sampling was inefficient** - took 116 minutes but produced poor samples

## Immediate Fixes Applied

1. **Fixed code error**: R-hat extraction now works correctly
2. **Improved diagnostics**: Better display of convergence metrics
3. **Increased target_accept**: 0.9 → 0.95 (more conservative sampling)
4. **Increased max_treedepth**: 10 → 15 (handles difficult geometry better)

## Recommended Next Steps

### Option 1: Re-run with Better Settings (Quick Fix)

```bash
# The script now uses:
# - target_accept=0.95 (was 0.9)
# - max_treedepth=15 (was 10)
# - Better diagnostics

python3 analysis/py/lba.py --input data/clean/ --output analysis/results/
```

**Expected improvement**: Fewer divergences, better R-hat, but may still have issues.

### Option 2: Use More Chains (Better Diagnostics)

Modify the script to use 4 chains instead of 2:

```python
trace = pm.sample(
    draws=1000,
    tune=1000,
    target_accept=0.95,
    chains=4,  # Changed from 2
    cores=4,   # Changed from 2
    return_inferencedata=True,
    progressbar=True,
    max_treedepth=15
)
```

**Why**: More chains provide better convergence diagnostics and more robust estimates.

### Option 3: Reparameterize the Model (Best Long-term Fix)

The model may have difficult geometry. Consider:

1. **Centering covariates**: Already done (ID_norm, pressure_norm) ✓
2. **Non-centered parameterization**: Use `pm.Normal` with `pm.Deterministic` transforms
3. **Simpler priors**: Current priors may be too informative
4. **Hierarchical structure**: May need to simplify random effects

### Option 4: Use Simpler Model (Pragmatic)

If convergence remains poor, consider:
- Fewer parameters (e.g., remove pressure effects)
- Fixed effects only (no hierarchical structure)
- Moment-based estimation instead of Bayesian

## Current Results (Use with Caution)

Despite convergence issues, the analysis did produce results:

- **Files saved**: All output files were created successfully
- **Parameter estimates**: Available in `lba_parameters.json`
- **Trace plots**: Available in `lba_trace_plot.png` (check for mixing issues)

**⚠️ Warning**: These results should be interpreted with extreme caution due to poor convergence.

## Diagnostic Interpretation

### R-hat Values
- **< 1.01**: Excellent convergence ✓
- **1.01 - 1.05**: Acceptable convergence ⚠
- **> 1.05**: Poor convergence ✗ (current status)

### ESS (Effective Sample Size)
- **> 400**: Good for reliable inference ✓
- **100-400**: Acceptable but may need more samples ⚠
- **< 100**: Poor, unreliable inference ✗ (most parameters)

### Divergences
- **0**: Ideal ✓
- **< 5% of samples**: Acceptable ⚠
- **> 5%**: Problematic ✗ (20 divergences = ~1% of 2000 samples, borderline)

## References

- [PyMC Convergence Troubleshooting](https://www.pymc.io/projects/docs/en/stable/learn/core_notebooks/pymc_overview.html#diagnosing-sampling-problems)
- [Stan Divergence Guide](https://mc-stan.org/misc/warnings.html#divergent-transitions-after-warmup)
- [Vehtari et al. (2021) - Rank-normalization, folding, and localization](https://arxiv.org/abs/1903.08008)

## Action Items

- [ ] Re-run analysis with improved settings (target_accept=0.95, max_treedepth=15)
- [ ] Check trace plots for mixing issues
- [ ] Consider using 4 chains for better diagnostics
- [ ] If convergence still poor, consider model reparameterization
- [ ] Document any model changes in analysis notes

---

**Last Updated**: 2025-01-XX  
**Analysis**: LBA Hierarchical Model  
**Status**: ⚠️ Convergence Issues - Results Use with Caution



