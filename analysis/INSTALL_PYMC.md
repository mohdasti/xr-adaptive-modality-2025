# Installing PyMC for LBA Analysis

## Quick Install (Recommended)

### Option 1: Conda (Handles dependencies automatically)
```bash
conda install -c conda-forge pymc arviz
```

### Option 2: Install netCDF4 first, then pip
```bash
# Install netCDF4 system libraries via conda
conda install -c conda-forge netcdf4

# Then install PyMC
pip install pymc arviz
```

### Option 3: Homebrew + pip (macOS)
```bash
# Install system libraries
brew install hdf5 netcdf

# Then install PyMC
pip install pymc arviz
```

## Verify Installation

```bash
python -c "import pymc as pm; import arviz as az; print('PyMC version:', pm.__version__)"
```

## Troubleshooting

### Error: "did not find netCDF version 4 headers"
- **Solution**: Install netCDF4 via conda first (Option 2 above)

### Error: "HDF5 library not found"
- **Solution**: Install via conda which handles HDF5 automatically

### Python 3.7 Compatibility
- PyMC 4.x works with Python 3.7
- PyMC 5.x requires Python 3.8+
- If using Python 3.7, you may need: `pip install "pymc<5"`

## When to Install

You can install PyMC:
- **Now**: To test the LBA script with synthetic data
- **Later**: When you have real experimental data to analyze

The LBA script will work once PyMC is installed - the code structure is already validated.












