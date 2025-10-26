# Analysis Scripts

Statistical analysis scripts for the XR Adaptive Modality experiment.

## Directory Structure

```
analysis/
├── README.md           # This file
├── r/                  # R analysis scripts
│   ├── lmem_glmm.R    # Linear mixed-effects models
│   └── fitts_tp.R     # Fitts's Law throughput analysis
├── py/                 # Python analysis scripts
│   ├── ddm_hddm.py    # Drift-diffusion model (HDDM/PyMC)
│   ├── lba.py         # Linear ballistic accumulator
│   └── exgauss_check.py # Ex-Gaussian distribution analysis
└── figures/            # Generated plots (created by scripts)
```

## R Scripts

### `lmem_glmm.R`

Linear mixed-effects models for reaction time and accuracy data.

**Required Packages:**
```r
install.packages(c("lme4", "lmerTest", "ggplot2", "dplyr", "tidyr", "optparse"))
```

**Usage:**
```bash
Rscript analysis/r/lmem_glmm.R --input data/clean/ --output analysis/results/
Rscript analysis/r/lmem_glmm.R -i data/clean/*.csv -o analysis/results/ --verbose
```

**Models:**
1. **LME/M for log(RT)**: `logRT ~ Modality * UI_Mode * Pressure + (1|pid)`
2. **GLMM for accuracy**: `correct ~ Modality * UI_Mode * Pressure + (1|pid)`

**Outputs:**
- `lmem_summary.txt`: LME/M model summary
- `glmm_summary.txt`: GLMM model summary
- `lmem_diagnostics.png`: Diagnostic plots (residuals, Q-Q, Cook's distance)
- `glmm_diagnostics.png`: GLMM diagnostic plots
- `rt_by_modality.png`: Reaction time by modality
- `accuracy_by_condition.png`: Accuracy by condition

### `fitts_tp.R`

Fitts's Law throughput analysis.

**Required Packages:**
```r
install.packages(c("lme4", "lmerTest", "ggplot2", "dplyr", "tidyr", "optparse"))
```

**Usage:**
```bash
Rscript analysis/r/fitts_tp.R --input data/clean/ --output analysis/figures/
Rscript analysis/r/fitts_tp.R -i data/clean/ -o analysis/figures/ --verbose
```

**Calculations:**
- Throughput (TP): `TP = ID / MT` (where MT is movement time)
- LME/M on TP: `TP ~ Modality * UI_Mode * Pressure + (1|pid)`

**Outputs:**
- `tp_lmem_summary.txt`: LME/M summary for throughput
- `tp_vs_id.png`: Throughput vs ID scatter plot
- `tp_by_condition.png`: Boxplots of TP by condition
- `tp_distribution.png`: TP distribution by ID and modality
- `tp_trajectories.png`: Individual participant TP trajectories

## Python Scripts

### `ddm_hddm.py`

Drift-diffusion model analysis using HDDM or PyMC.

**Required Packages:**
```bash
# Option 1: HDDM
pip install hddm

# Option 2: PyMC
pip install pymc
```

**Usage:**
```bash
python analysis/py/ddm_hddm.py --input data/clean/ --output analysis/results/
python analysis/py/ddm_hddm.py -i data/clean/ -o analysis/results/ --method pymc
```

**Models:**
- Fits DDM parameters: drift rate, threshold, bias, non-decision time
- Automatically falls back to LBA if data is insufficient
- Works with small datasets (< 100 trials may trigger fallback)

**Outputs:**
- `ddm_parameters.json`: Parameter estimates
- Prints recommendation to use LBA if data is thin

**Fallback Logic:**
If HDDM is not installed or data is insufficient, the script automatically recommends using LBA (`lba.py`) instead.

### `lba.py`

Linear Ballistic Accumulator (LBA) model, a robust alternative to DDM.

**Required Packages:**
```bash
# Optional for Bayesian estimation:
pip install pymc

# Otherwise uses simple moment-based estimation
```

**Usage:**
```bash
python analysis/py/lba.py --input data/clean/ --output analysis/results/
python analysis/py/lba.py -i data/clean/ -o analysis/results/ --method pymc
```

**Models:**
- Simple LBA: moment-based estimation (always available)
- Bayesian LBA: PyMC-based estimation (if PyMC installed)

**Parameters:**
- `drift`: Accumulator drift rate
- `threshold`: Response threshold
- `start_bias`: Starting point bias
- `ndt`: Non-decision time

**Outputs:**
- `lba_parameters.json`: Parameter estimates
- Console output with parameter summary

### `exgauss_check.py`

Ex-Gaussian distribution analysis for inspecting RT tails.

**Required Packages:**
```bash
pip install matplotlib scipy
```

**Usage:**
```bash
python analysis/py/exgauss_check.py --input data/clean/ --output analysis/figures/
python analysis/py/exgauss_check.py -i data/clean/ -o analysis/figures/ --condition modality
```

**Models:**
- Ex-Gaussian: `RT ~ N(μ, σ) + Expon(τ)`
- Fits Gaussian parameters (μ, σ) and exponential parameter (τ)

**Outputs:**
- `exgauss_overall.png`: Overall distribution fit
- `exgauss_modality_gaze.png`, `exgauss_modality_hand.png`: Condition-specific fits
- `exgauss_parameters.json`: Parameter estimates
- Tail analysis: 90th, 95th, 99th percentiles

**Purpose:**
- Inspects distribution tails (long RTs)
- Detects outliers and response timing issues
- Useful for data cleaning

## Common Workflow

### 1. Data Preparation

Ensure cleaned data is in `/data/clean/`:

```bash
python ops/anonymize_cli.py -i data/raw -o data/clean
python ops/validate_schema.py -i data/clean/
```

### 2. R Analysis

Run LME/M models:

```bash
Rscript analysis/r/lmem_glmm.R -i data/clean/ -o analysis/results/
```

Run Fitts throughput analysis:

```bash
Rscript analysis/r/fitts_tp.R -i data/clean/ -o analysis/figures/
```

### 3. Python Analysis

Check RT distributions:

```bash
python analysis/py/exgauss_check.py -i data/clean/ -o analysis/figures/
```

Fit cognitive models:

```bash
# Try DDM
python analysis/py/ddm_hddm.py -i data/clean/ -o analysis/results/

# Or use LBA (more robust)
python analysis/py/lba.py -i data/clean/ -o analysis/results/
```

### 4. Generate Summary

```bash
python ops/summarize_run.py -i data/clean/ -o summary.txt
```

## Expected Outputs

### R Analysis Outputs

```
analysis/
├── results/
│   ├── lmem_summary.txt
│   ├── glmm_summary.txt
│   ├── lmem_diagnostics.png
│   └── glmm_diagnostics.png
└── figures/
    ├── tp_lmem_summary.txt
    ├── tp_vs_id.png
    ├── tp_by_condition.png
    └── tp_trajectories.png
```

### Python Analysis Outputs

```
analysis/
├── results/
│   ├── ddm_parameters.json (or lba_parameters.json)
│   └── exgauss_parameters.json
└── figures/
    ├── exgauss_overall.png
    └── exgauss_modality_*.png
```

## Dependencies

### R Dependencies

```r
# Core analysis
install.packages(c("lme4", "lmerTest"))

# Plotting and data manipulation
install.packages(c("ggplot2", "dplyr", "tidyr"))

# Command-line arguments
install.packages("optparse")
```

### Python Dependencies

```bash
# Core
pip install pandas numpy

# For DDM
pip install hddm  # or pymc

# For LBA
pip install pymc  # optional

# For plots
pip install matplotlib scipy
```

## Troubleshooting

### R Script Errors

**Error**: `Error in library(...) : there is no package called 'lme4'`
```r
install.packages("lme4")
```

**Error**: Convergence warnings in LME/M
- Check data quality (sufficient trials per participant)
- Consider simplifying the model
- Check for extreme outliers

### Python Script Errors

**Error**: `ImportError: No module named 'hddm'`
```bash
pip install hddm
# Or use fallback LBA script instead
python lba.py -i data/clean/ -o analysis/results/
```

**Error**: Insufficient data for DDM
- Use LBA instead (more robust for small datasets)
- Or collect more data

**Error**: Matplotlib not available
```bash
pip install matplotlib scipy
```

## Contributing

When adding new analysis scripts:

1. Follow existing patterns (argparse for Python, optparse for R)
2. Include comprehensive docstrings
3. Add to this README
4. Provide example usage
5. Handle errors gracefully
6. Save outputs to appropriate directories

## References

- **LME/M**: Bates et al. (2015). Fitting linear mixed-effects models using lme4. Journal of Statistical Software.
- **DDM**: Ratcliff & McKoon (2008). The diffusion decision model: theory and data for two-choice decision tasks. Neural Computation.
- **LBA**: Brown & Heathcote (2008). The simplest complete model of choice reaction time: Linear ballistic accumulator. Psychological Review.
- **Ex-Gaussian**: Ratcliff & Murdock (1976). Retrieval processes in recognition memory. Psychological Review.

## License

This analysis code is part of the XR Adaptive Modality research project.
See main project LICENSE for details.

