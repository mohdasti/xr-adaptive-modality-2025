# Quick PyMC Installation (Recommended for Your Setup)

## Problem
Your Anaconda 2020.02 installation has old packages that conflict with PyMC dependencies. Conda is struggling to resolve all conflicts.

## Solution: Use pip instead

### Step 1: Cancel the current conda install
Press `Ctrl+C` in your terminal to stop the conda process.

### Step 2: Install via pip (much faster)
```bash
# Install netCDF4 first (handles system libraries)
conda install -c conda-forge netcdf4 -y

# Then install PyMC via pip (avoids conda dependency hell)
pip install "pymc<5" arviz
```

**Why this works:**
- `pymc<5` is compatible with Python 3.7
- pip doesn't try to update your entire Anaconda installation
- Much faster (seconds vs hours)

### Step 3: Verify installation
```bash
python -c "import pymc as pm; import arviz as az; print('✓ PyMC', pm.__version__, 'installed successfully')"
```

## Alternative: Create a new conda environment (if you want isolation)
```bash
# Create fresh environment with Python 3.8+
conda create -n lba_analysis python=3.9 -y
conda activate lba_analysis
conda install -c conda-forge pymc arviz -y
```

## Why conda is slow
- Your base environment has 70+ packages from 2020
- PyMC needs newer versions of numpy, scipy, etc.
- Conda tries to update everything to be consistent
- This creates a massive dependency resolution problem

## Recommendation
**Use pip** - it's the fastest solution and will work fine for your LBA analysis.












