# Running LBA Analysis on Google Cloud Platform (Posit Workbench)

This guide walks you through running the LBA analysis on GCP using VS Code in Posit Workbench.

## Prerequisites

- ✅ GitHub repo connected to Posit Workbench
- ✅ VS Code opened in Posit Workbench
- ✅ Terminal access in VS Code

## Step-by-Step Instructions

### Step 1: Navigate to Project Directory

Open a terminal in VS Code and navigate to your project:

```bash
# If you cloned the repo, navigate to it
cd /path/to/xr-adaptive-modality-2025

# Or if you're already in the workspace, verify you're in the right place
pwd
ls -la  # Should see analysis/, data/, scripts/ directories
```

### Step 2: Verify Data File Exists

The LBA analysis requires `data/clean/trial_data.csv`. Check if it exists:

```bash
ls -lh data/clean/trial_data.csv
```

**If the file doesn't exist:**
- The file is likely gitignored (it's private data)
- You'll need to upload it manually:
  1. Use VS Code's file explorer to upload `data/clean/trial_data.csv` from your local machine
  2. Or use `scp`/`rsync` to transfer it from your local machine
  3. Or if you have it in Google Cloud Storage, download it:
     ```bash
     gsutil cp gs://your-bucket/data/clean/trial_data.csv data/clean/
     ```

### Step 3: Check Python Version

The script requires Python 3.8+:

```bash
python3 --version
# Should show Python 3.8.x or higher
```

If Python 3.8+ is not available, you may need to install it or use a different Python version manager.

### Step 4: Install Python Dependencies

Install all required packages:

```bash
# Install from requirements.txt (recommended)
pip install -r requirements.txt

# This installs:
# - pandas>=2.0.0
# - pymc>=5.0.0
# - arviz>=0.15.0
# - numpy (dependency of pandas/pymc)
# - matplotlib (dependency of arviz)
```

**Alternative: If pip install fails, try conda:**

```bash
# Install via conda (handles system libraries better)
conda install -c conda-forge pymc arviz pandas numpy matplotlib -y
```

**Note:** On GCP/Posit Workbench, conda is often pre-installed and may handle dependencies better.

### Step 5: Verify Installation

Test that all dependencies are available:

```bash
python3 -c "import pymc as pm; import arviz as az; import pandas as pd; import numpy as np; print('✓ All dependencies available')"
```

You should see: `✓ All dependencies available`

### Step 6: Verify Data File Structure

Quick check that the CSV has the required columns:

```bash
python3 -c "
import pandas as pd
df = pd.read_csv('data/clean/trial_data.csv', nrows=1)
required = ['participant_id', 'rt_ms', 'correct', 'ID', 'modality']
missing = [col for col in required if col not in df.columns]
if missing:
    print(f'⚠ Missing columns: {missing}')
else:
    print('✓ All required columns present')
"
```

### Step 7: Run the LBA Analysis

You have two options:

#### Option A: Use the Shell Script (Recommended)

```bash
# Make sure script is executable
chmod +x scripts/run_lba_analysis.sh

# Run the analysis
./scripts/run_lba_analysis.sh
```

#### Option B: Run Python Script Directly

```bash
python3 analysis/py/lba.py --input data/clean/ --output analysis/results/
```

### Step 8: Monitor Progress

The script will show progress updates:

```
============================================================
Starting MCMC Sampling...
============================================================
Configuration:
  - Draws: 1000 per chain
  - Tune (warmup): 2000 per chain
  - Chains: 4
  - Total iterations: 12000 (3000 per chain)
  - Estimated time: 60-90 minutes
============================================================

Progress will be shown below. This may take a while...
```

**Expected Runtime:** 60-90 minutes (depending on GCP instance performance)

### Step 9: Check Results

After completion, verify output files were created:

```bash
ls -lh analysis/results/
```

You should see:
- `lba_parameters.json` - Parameters by modality and ui_mode
- `lba_parameters_summary.csv` - Parameter estimates table
- `lba_trace.nc` - Full MCMC trace (netCDF format)
- `lba_trace_plot.png` - Trace plots for diagnostics

### Step 10: Download Results (Optional)

If you want to download results to your local machine:

```bash
# Using gsutil (if you have Google Cloud Storage set up)
gsutil cp -r analysis/results/ gs://your-bucket/results/

# Or download via VS Code's file explorer
# Right-click on analysis/results/ → Download
```

## Running Overnight / In Background

To run the analysis in the background (so you can disconnect):

### Option 1: Using `nohup` (Recommended)

```bash
# Run in background, save output to log file
nohup python3 analysis/py/lba.py --input data/clean/ --output analysis/results/ > lba_analysis.log 2>&1 &

# Check progress
tail -f lba_analysis.log

# Check if process is still running
ps aux | grep lba.py
```

### Option 2: Using `screen` or `tmux`

```bash
# Start a screen session
screen -S lba_analysis

# Run the analysis
python3 analysis/py/lba.py --input data/clean/ --output analysis/results/

# Detach: Press Ctrl+A, then D
# Reattach later: screen -r lba_analysis
```

### Option 3: Using VS Code Tasks

Create `.vscode/tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Run LBA Analysis",
            "type": "shell",
            "command": "python3 analysis/py/lba.py --input data/clean/ --output analysis/results/",
            "problemMatcher": []
        }
    ]
}
```

Then run: `Ctrl+Shift+P` → "Tasks: Run Task" → "Run LBA Analysis"

## Troubleshooting

### Error: "No CSV files found"

**Solution:** Make sure `data/clean/trial_data.csv` exists:
```bash
ls -lh data/clean/*.csv
```

### Error: "PyMC not available" or ImportError

**Solution:** Reinstall PyMC:
```bash
pip install --upgrade pymc arviz
# Or with conda:
conda install -c conda-forge pymc arviz -y
```

### Error: "netCDF version 4 headers not found"

**Solution:** Install netCDF4 system libraries:
```bash
conda install -c conda-forge netcdf4 -y
pip install pymc arviz
```

### Analysis Taking Too Long

The analysis is computationally intensive. On GCP:
- **Use a high-CPU instance** (e.g., n1-highcpu-8 or n1-highcpu-16)
- **Consider using GPU instances** if available (though PyMC doesn't require GPU, it can help with some operations)
- **Check CPU usage**: `top` or `htop` to verify it's using resources

### Memory Issues

If you run out of memory:
- Use a larger instance (more RAM)
- The script processes all data in memory, so ensure you have enough RAM for your dataset

## Quick Reference

```bash
# Full workflow (copy-paste ready)
cd /path/to/xr-adaptive-modality-2025
pip install -r requirements.txt
python3 -c "import pymc as pm; import arviz as az; print('✓ Dependencies OK')"
python3 analysis/py/lba.py --input data/clean/ --output analysis/results/
```

## Next Steps

After the analysis completes:
1. Review `analysis/results/lba_parameters_summary.csv` for parameter estimates
2. Check `analysis/results/lba_trace_plot.png` for convergence diagnostics
3. Use `analysis/results/lba_parameters.json` in your Report.qmd (Section 16)
