# LBA Model Improvements - Second Attempt

## Changes Made for Better Convergence

### 1. Increased Chains and Warmup
- **Chains**: 2 → **4** (better diagnostics, more robust)
- **Warmup (tune)**: 1000 → **2000** per chain (better adaptation)
- **Total iterations**: 4000 → **12000** (3000 per chain)
- **Cores**: 2 → **4** (parallel processing)

### 2. Improved Sampling Settings
- **target_accept**: 0.9 → **0.95** (more conservative, fewer divergences)
- **max_treedepth**: 10 → **15** (handles difficult geometry better)

### 3. Model Reparameterization (Non-Centered)

**What changed**: Switched from centered to non-centered parameterization for all hierarchical effects.

**Why**: Non-centered parameterization improves the geometry of the posterior, making it easier for NUTS to sample efficiently.

**Technical details**:
- **Before (centered)**: `theta ~ Normal(mu, sigma)` then use `theta` directly
- **After (non-centered)**: `theta_raw ~ Normal(0, 1)` then `theta = mu + theta_raw * sigma`

**Applied to**:
- `t0_offset` → `t0_offset_raw` (non-decision time participant effects)
- `A_offset` → `A_offset_raw` (start point participant effects)
- `gap_int_offset` → `gap_int_offset_raw` (threshold gap participant effects)
- `vc_base_offset` → `vc_base_offset_raw` (drift rate participant effects)

### 4. Less Informative Priors

**Rationale**: Overly informative priors can cause convergence issues if they conflict with the data.

**Changes**:
- **t0_mu**: `Normal(0.3, 0.1)` → `Normal(0.0, 1.0)` (wider, less informative)
- **A_mu**: `Normal(0.3, 0.1)` → `Normal(0.0, 1.0)` (wider, less informative)
- **gap_int_mu**: `Normal(0.2, 0.1)` → `Normal(0.0, 1.0)` (wider, less informative)
- **gap_slope_mu**: `Normal(-0.1, 0.1)` → `Normal(0.0, 0.5)` (less informative)
- **vc_base_mu**: `Normal(2.5, 0.5)` → `Normal(0.0, 2.0)` (much wider, less informative)
- **vc_slope_mu**: `Normal(-0.5, 0.2)` → `Normal(0.0, 1.0)` (less informative)
- **ve_mu**: `Normal(1.0, 0.5)` → `Normal(0.0, 2.0)` (wider, less informative)
- **SD priors**: Made more flexible (e.g., `HalfNormal(0.1)` → `HalfNormal(0.5)`)

**Note**: The `softplus` transformation ensures parameters remain positive, so wider priors on the raw scale are safe.

## Expected Improvements

1. **Fewer divergences**: Non-centered parameterization + higher target_accept should reduce divergences
2. **Better R-hat**: 4 chains provide more robust convergence diagnostics
3. **Higher ESS**: Better geometry should lead to more efficient sampling
4. **More reliable estimates**: Better convergence means more trustworthy results

## Expected Runtime

- **Previous**: ~116 minutes (2 chains, 2000 iterations each)
- **Current**: **60-90 minutes** (4 chains, 3000 iterations each, but better efficiency)
  - More chains but better geometry may make sampling faster per iteration
  - Longer warmup period for better adaptation

## What to Look For

### Good Signs ✓
- **Divergences**: < 5 (ideally 0)
- **R-hat**: < 1.01 for all parameters
- **ESS**: > 400 for key parameters
- **No tree depth warnings**: Chains should not hit max_treedepth frequently

### Warning Signs ⚠
- **Divergences**: 5-20 (may need further tuning)
- **R-hat**: 1.01-1.05 (acceptable but not ideal)
- **ESS**: 100-400 (acceptable but may need more samples)

### Problem Signs ✗
- **Divergences**: > 20 (model may need reparameterization)
- **R-hat**: > 1.05 (poor convergence, results unreliable)
- **ESS**: < 100 (very inefficient sampling)

## If Convergence Still Poor

If you still see convergence issues after these improvements:

1. **Check trace plots**: Look for poor mixing, trends, or multimodality
2. **Consider simpler model**: Remove some hierarchical structure
3. **Check data**: Ensure data quality (no outliers, proper scaling)
4. **Alternative approach**: Consider moment-based estimation instead of Bayesian

## References

- [Non-Centered Parameterization](https://mc-stan.org/docs/2_28/stan-users-guide/reparameterization-section.html)
- [PyMC Reparameterization Guide](https://www.pymc.io/projects/docs/en/stable/learn/core_notebooks/pymc_overview.html#reparameterization)
- [Vehtari et al. (2021) - Rank-normalization](https://arxiv.org/abs/1903.08008)

---

**Last Updated**: 2025-01-XX  
**Analysis**: LBA Hierarchical Model - Second Attempt  
**Status**: Ready to run with improved settings



