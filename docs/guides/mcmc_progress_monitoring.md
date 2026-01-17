# MCMC Progress Monitoring and User Feedback

## Overview

When running Bayesian MCMC analyses (especially with PyMC), long-running computations can leave users uncertain about progress, completion time, or whether the process has stalled. This guide documents best practices for adding progress indicators, ETA estimates, and diagnostic feedback to MCMC analyses.

## Why Progress Monitoring Matters

1. **User Experience**: Users need to know the analysis is running and making progress
2. **Time Management**: ETA helps users plan their work
3. **Early Problem Detection**: Divergence warnings and convergence diagnostics help catch issues early
4. **Resource Monitoring**: Understanding CPU/memory usage prevents system overload
5. **Reproducibility**: Clear logging helps document analysis parameters

## Implementation Strategy

### 1. Pre-Sampling Information Display

Before starting MCMC, display:
- Configuration summary (draws, chains, tuning iterations)
- Data summary (participants, trials, conditions)
- Estimated time (based on similar analyses or pilot runs)
- Resource requirements

**Example:**
```python
print("\n" + "="*60)
print("Starting MCMC Sampling...")
print("="*60)
print(f"Configuration:")
print(f"  - Draws: {draws} per chain")
print(f"  - Tune (warmup): {tune} per chain")
print(f"  - Chains: {chains}")
print(f"  - Total iterations: {total_iterations}")
print(f"  - Estimated time: {estimated_time}")
print("="*60)
print("\nProgress will be shown below. This may take a while...\n")
```

### 2. PyMC Built-in Progress Bar

PyMC 5.x includes a built-in progress bar. Enable it with:

```python
trace = pm.sample(
    draws=1000,
    tune=1000,
    chains=2,
    cores=2,
    progressbar=True,  # Enable progress bar
    return_inferencedata=True
)
```

**What it shows:**
- Chain progress (e.g., "Chain 0: 500/2000 [25%]")
- Sampling speed (iterations/second)
- Estimated time remaining
- Divergence warnings (if any)

### 3. Custom Progress Callbacks (Optional)

For more detailed monitoring, you can add custom callbacks:

```python
import time

start_time = time.time()

def progress_callback(trace, draw):
    """Custom callback to show detailed progress"""
    if draw % 100 == 0:  # Update every 100 iterations
        elapsed = time.time() - start_time
        total_draws = draws + tune
        progress = (draw / total_draws) * 100
        
        # Calculate ETA
        if draw > 0:
            rate = draw / elapsed  # iterations per second
            remaining = (total_draws - draw) / rate
            eta_minutes = remaining / 60
        else:
            eta_minutes = 0
        
        print(f"Chain progress: {draw}/{total_draws} ({progress:.1f}%) | "
              f"Elapsed: {elapsed/60:.1f}m | ETA: {eta_minutes:.1f}m", 
              flush=True)
    return trace

# Note: PyMC 5.x callback API may vary - check documentation
# For most cases, built-in progressbar=True is sufficient
```

### 4. Post-Sampling Summary

After sampling completes, display:
- Total elapsed time
- Convergence diagnostics (R-hat, ESS)
- File save confirmations
- Next steps

**Example:**
```python
elapsed_total = time.time() - start_time
print(f"\n✓ Sampling complete! Total time: {elapsed_total/60:.1f} minutes")
print("="*60)

# Convergence diagnostics
rhat = az.rhat(trace)
print("\nR-hat diagnostics (should be < 1.05):")
print(rhat)

# File confirmations
print(f"\n✓ Saved: lba_parameters.json")
print(f"✓ Saved: lba_trace.nc")
print(f"✓ Saved: lba_trace_plot.png")
```

## Complete Example: LBA Analysis

Here's a complete example from our LBA analysis:

```python
import time
import pymc as pm
import arviz as az

def fit_hierarchical_lba(df, participants, modalities, ui_modes):
    """Fit hierarchical Bayesian LBA model with progress monitoring."""
    
    # ... model definition ...
    
    with pm.Model() as model:
        # ... priors and likelihood ...
        
        # --- Sampling with Progress Monitoring ---
        print("\n" + "="*60)
        print("Starting MCMC Sampling...")
        print("="*60)
        print(f"Configuration:")
        print(f"  - Draws: 1000 per chain")
        print(f"  - Tune (warmup): 1000 per chain")
        print(f"  - Chains: 2")
        print(f"  - Total iterations: 4000 (2000 per chain)")
        print(f"  - Estimated time: 15-30 minutes")
        print("="*60)
        print("\nProgress will be shown below. This may take a while...\n")
        
        start_time = time.time()
        
        trace = pm.sample(
            draws=1000,
            tune=1000,
            target_accept=0.9,
            chains=2,
            cores=2,
            return_inferencedata=True,
            progressbar=True  # PyMC's built-in progress bar
        )
        
        elapsed_total = time.time() - start_time
        print(f"\n✓ Sampling complete! Total time: {elapsed_total/60:.1f} minutes")
        print("="*60)
    
    return trace, model

def main():
    # ... data loading ...
    
    print("\n" + "="*60)
    print("Fitting Hierarchical LBA Model...")
    print("="*60)
    
    trace, model = fit_hierarchical_lba(df, participants, modalities, ui_modes)
    
    print("\n" + "="*60)
    print("Extracting Results...")
    print("="*60)
    
    # ... result extraction ...
    
    print("\n" + "="*60)
    print("✓ LBA Analysis Complete!")
    print("="*60)
    print(f"\nResults saved to: {output_dir}")
    print(f"  • lba_parameters.json - Parameters by condition")
    print(f"  • lba_parameters_summary.csv - Parameter estimates")
    print(f"  • lba_trace.nc - Full MCMC trace")
    print(f"  • lba_trace_plot.png - Trace plots")
    print("\nYou can now render Report.qmd to see the results.")
    print("="*60)
```

## Key Monitoring Metrics

### During Sampling

1. **Iteration Progress**: Current iteration / total iterations
2. **Percentage Complete**: Visual progress indicator
3. **Elapsed Time**: How long the analysis has been running
4. **ETA (Estimated Time to Arrival)**: Predicted completion time
5. **Sampling Rate**: Iterations per second
6. **Divergence Warnings**: Early warning of sampling problems

### After Sampling

1. **Total Time**: Total elapsed time for the analysis
2. **R-hat (Gelman-Rubin statistic)**: Convergence diagnostic (< 1.05 is good)
3. **ESS (Effective Sample Size)**: Quality of samples
4. **File Confirmations**: Which files were saved successfully

## Best Practices

### 1. Use Visual Separators

```python
print("="*60)  # Clear section separators
```

### 2. Show Configuration Upfront

Users should know what they're waiting for:
- Number of iterations
- Number of chains
- Estimated time

### 3. Provide Clear Status Messages

Use consistent formatting:
- `✓` for success
- `⚠` for warnings
- `✗` for errors
- `•` for lists

### 4. Flush Output

When printing progress, use `flush=True` to ensure immediate display:

```python
print(f"Progress: {progress}%", flush=True)
```

### 5. Estimate Time Realistically

Base estimates on:
- Pilot runs
- Similar analyses
- Conservative estimates (better to under-promise)

### 6. Show File Save Confirmations

After saving files, confirm each one:
```python
summary.to_csv(output_dir / 'summary.csv')
print("  ✓ Saved: summary.csv")
```

### 7. Handle Errors Gracefully

Wrap analysis in try-except blocks and provide helpful error messages:

```python
try:
    trace, model = fit_hierarchical_lba(...)
except Exception as e:
    print(f"\n✗ Analysis failed: {e}")
    print("Check error messages above for details.")
    sys.exit(1)
```

## Integration with Quarto/R Markdown Reports

When results are used in Quarto reports, the report can check for result files:

```r
# In Report.qmd
```{r lba-analysis, eval=file.exists("analysis/results/lba_parameters.json")}
if (file.exists("analysis/results/lba_parameters.json")) {
  # Display results
} else {
  cat("⚠️ LBA analysis has not been run yet.\n")
  cat("Run: python3 analysis/py/lba.py --input data/clean/ --output analysis/results/\n")
}
```
```

## Shell Script Wrapper

For easy execution, create a shell script:

```bash
#!/bin/bash
# run_lba_analysis.sh

echo "=========================================="
echo "LBA Analysis Runner"
echo "=========================================="
echo ""
echo "This will run the LBA computational model analysis."
echo "Estimated time: 15-30 minutes"
echo ""
echo "Starting analysis..."
echo ""

cd "$(dirname "$0")"

python3 analysis/py/lba.py --input data/clean/ --output analysis/results/

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ Analysis completed successfully!"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "✗ Analysis failed. Check error messages above."
    echo "=========================================="
    exit 1
fi
```

## Troubleshooting

### Progress Bar Not Showing

- Ensure `progressbar=True` in `pm.sample()`
- Check that output is not being redirected
- Verify terminal supports progress bars

### ETA Inaccurate

- Early estimates may be inaccurate (wait for ~100 iterations)
- ETA improves as more data accumulates
- Consider showing "estimated" vs "actual" time

### Divergence Warnings

If PyMC shows divergence warnings:
- Check `target_accept` parameter (try 0.95)
- Consider reparameterization
- Check for model specification issues

## References

- [PyMC Sampling Documentation](https://www.pymc.io/projects/docs/en/stable/api/sampling.html)
- [ArviZ Diagnostics](https://python.arviz.org/en/stable/api/generated/arviz.rhat.html)
- [MCMC Best Practices](https://arxiv.org/abs/1701.02434)

## Summary Checklist

When implementing progress monitoring for MCMC analyses:

- [ ] Display configuration before sampling starts
- [ ] Enable PyMC's built-in progress bar (`progressbar=True`)
- [ ] Show elapsed time and ETA
- [ ] Display convergence diagnostics after sampling
- [ ] Confirm file saves with checkmarks
- [ ] Provide clear error messages if analysis fails
- [ ] Use visual separators for readability
- [ ] Document estimated time upfront
- [ ] Create shell script wrapper for easy execution
- [ ] Integrate with report generation (check for result files)

---

**Last Updated**: 2025-01-XX  
**Project**: XR Adaptive Modality Experiment  
**Author**: Analysis Team



