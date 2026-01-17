# Running LBA Analysis

## Quick Start (RStudio Terminal)

Copy and paste this into RStudio terminal:

```bash
cd /Users/mohdasti/Documents/GitHub/xr-adaptive-modality-2025
python3 analysis/py/lba.py --input data/clean/ --output analysis/results/
```

Or use the shell script:

```bash
./run_lba_analysis.sh
```

## What to Expect

The analysis will:
1. **Load data** (~5 seconds)
   - Shows: Number of trials and participants loaded
   
2. **Build model** (~10 seconds)
   - Shows: "Building PyMC Model..."

3. **MCMC Sampling** (~15-30 minutes) ⏱️
   - Shows: Progress bars and iteration counts
   - 2 chains × 2000 iterations each = 4000 total
   - You'll see progress updates every 100 iterations

4. **Extract results** (~30 seconds)
   - Shows: Parameter extraction and file saving

## Progress Indicators

You'll see:
- `Progress bar` showing sampling progress
- `Elapsed time` and `ETA` estimates
- `Iteration counts` (e.g., "100/2000", "200/2000", etc.)
- `File saving confirmations` (✓ marks)

## Output Files

After completion, check `analysis/results/`:
- `lba_parameters.json` - Main results (used by Report.qmd)
- `lba_parameters_summary.csv` - Parameter estimates table
- `lba_trace.nc` - Full MCMC trace (for diagnostics)
- `lba_trace_plot.png` - Trace plots

## If It Stalls

If you see no progress for >5 minutes:
1. Check CPU usage (should be high during sampling)
2. Check memory (should be stable)
3. If truly stalled, press Ctrl+C and check error messages

## Viewing Results

Once complete, render `Report.qmd` - Section 16 will automatically display the results!



