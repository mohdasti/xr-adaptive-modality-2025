# LBA Analysis Fixes Summary

## Critical Issues Fixed

Based on comprehensive audit, the following critical issues were identified and fixed:

### 1. **Wrong PDF Implementation** ✅ FIXED
- **Problem**: Used simplified `phi(z1) - phi(z2)` instead of correct Brown & Heathcote (2008) formula
- **Fix**: Implemented correct closed-form PDF: `f(t) = (1/A) * [-v*Phi(z1) + s*phi(z1) + v*Phi(z2) - s*phi(z2)]`
- **Impact**: This was causing incorrect likelihoods and pathological sampling behavior

### 2. **Non-Smooth Geometry from Hard Clamps** ✅ FIXED
- **Problem**: Hard clamps (`pt.maximum(t, 1e-5)`, `pt.clip(cdf, 0, 1)`) created kinks in logp surface
- **Fix**: 
  - Removed `pt.maximum(t, 1e-5)` by constraining t0 < min(rt)
  - Refactored to log-space to avoid `1 - CDF` catastrophic cancellation
  - Used `log1mexp` for stable `log(1 - CDF)` computation
- **Impact**: Smooth geometry → NUTS takes normal-sized trees → order-of-magnitude speedup

### 3. **t0 Constraint Missing** ✅ FIXED
- **Problem**: No constraint ensuring `t0 < min(rt)`, requiring `pt.maximum(t, eps)` clamp
- **Fix**: Constrain t0 using sigmoid transformation: `t0 = sigmoid(raw) * 0.95 * min(rt)`
- **Impact**: Eliminates boundary issues and removes need for clamps

### 4. **Likelihood Not in Log-Space** ✅ FIXED
- **Problem**: Computed `PDF * (1 - CDF)` in linear space, then took log
- **Fix**: Entire likelihood computed in log-space: `logpdf + logsf` (log survival function)
- **Impact**: Better numerical stability, avoids underflow

### 5. **Data Column Preference** ✅ FIXED
- **Problem**: Used `movement_time_ms` which may not exist for error trials
- **Fix**: Prefer `verification_time_ms` (verification phase), check for error RTs
- **Impact**: Ensures we're modeling the right phase and have error RTs

### 6. **Sampling Parameters Too Conservative** ✅ FIXED
- **Problem**: `tune=2000`, `max_treedepth=15` too high for well-behaved geometry
- **Fix**: Reduced to `tune=1500`, `max_treedepth=12`
- **Impact**: Faster sampling while maintaining quality

## Expected Performance Improvement

**Before**: 48+ hours for warmup (pathological)
**After**: Expected **2-4 hours** total runtime (warmup + sampling)

The fixes should provide **order-of-magnitude speedup** because:
1. Smooth geometry → normal tree depths (not hitting max_treedepth constantly)
2. Correct PDF → valid likelihoods → better adaptation
3. Log-space → numerical stability → fewer rejections

## Next Steps

### 1. **Kill Current Process** ⚠️ REQUIRED
```bash
pkill -f lba.py
```

**Why**: The current run has:
- Wrong PDF formula (scientifically invalid)
- Pathological geometry (will never finish efficiently)
- 48+ hours wasted

### 2. **Pull Fixed Version**
```bash
git pull origin main
```

### 3. **Verify Data**
```bash
# Check if verification_time_ms exists and error trials have RTs
python3 -c "
import pandas as pd
df = pd.read_csv('data/clean/trial_data.csv', nrows=1000)
print('Columns:', [c for c in df.columns if 'time' in c.lower() or 'rt' in c.lower()])
if 'verification_time_ms' in df.columns:
    print('✓ verification_time_ms found')
error_trials = df[df.get('correct', pd.Series([True]*len(df))) == False]
print(f'Error trials: {len(error_trials)}')
if len(error_trials) > 0:
    print(f'Error trials with RT: {error_trials[\"rt_ms\"].notna().sum()}')
"
```

### 4. **Run Fixed Version**
```bash
./scripts/run_lba_analysis.sh
```

### 5. **Monitor Progress**
```bash
# Quick status check
./scripts/check_lba_status.sh

# Or watch for trace file
./scripts/watch_lba_progress.sh

# Check progress once trace exists
python3 scripts/check_lba_progress.py
```

## What Changed in Code

### PDF Function (`pdf_lba_single`)
- **Before**: `(1/A) * [phi(z1) - phi(z2)]` ❌
- **After**: `(1/A) * [-v*Phi(z1) + s*phi(z1) + v*Phi(z2) - s*phi(z2)]` ✅

### Likelihood Function (`logp_lba_race`)
- **Before**: Linear space `PDF * (1 - CDF)`, then log, with clamps ❌
- **After**: Log-space `logpdf + logsf`, no clamps ✅

### t0 Parameter
- **Before**: Unconstrained, required `pt.maximum(t, eps)` ❌
- **After**: Constrained `t0 = sigmoid(raw) * 0.95 * min(rt)` ✅

### Data Loading
- **Before**: Used `movement_time_ms` (may not exist for errors) ❌
- **After**: Prefers `verification_time_ms`, checks for error RTs ✅

## Validation Checklist

After running the fixed version, verify:

- [ ] Warmup completes in reasonable time (< 2 hours)
- [ ] Tree depths are reasonable (not constantly hitting max_treedepth)
- [ ] Divergences are low (< 1%)
- [ ] R-hat < 1.05 for key parameters
- [ ] Trace file is created and grows during sampling
- [ ] Final results files are created

## References

- Brown, S. D., & Heathcote, A. (2008). The simplest complete model of choice reaction time: Linear ballistic accumulation. *Cognitive Psychology*, 57(3), 153-178. https://doi.org/10.1016/j.cogpsych.2007.12.002
