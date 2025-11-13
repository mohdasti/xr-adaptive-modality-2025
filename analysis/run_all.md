# Run All Analysis Pipeline

One-command analysis pipeline that validates data, computes metrics, runs models, and generates a mini-report.

## Overview

The `run_all` pipeline orchestrates the complete analysis workflow:

```
validate → summarize → render mini-report
```

## Pipeline Stages

### 1. Validate (`validate`)

**Purpose:** Ensure data quality and schema compliance before analysis.

**Steps:**
- Run CSV schema validator on trial data
- Check required columns are present
- Validate data types and ranges
- Flag invalid values (efficiency > 1, curvature < 1, etc.)
- Check display requirements (zoom=100%, fullscreen=true)
- Generate validation report

**Outputs:**
- `results/validation_report.txt`
- `results/validation_errors.csv` (if any errors found)

**Exit Codes:**
- `0`: All validations passed
- `1`: Validation errors found (pipeline stops)

### 2. Summarize (`summarize`)

**Purpose:** Compute descriptive statistics and effective metrics.

**Steps:**
- Load trial data
- Apply trial-level exclusions
- Compute ISO 9241-9 effective metrics (We, IDe, TP)
- Compute movement quality metrics (efficiency, curvature, submovements)
- Generate summary statistics by condition
- Export summary tables

**Outputs:**
- `results/tables/effective_metrics_by_condition.csv`
- `results/tables/throughput_summary.csv`
- `results/tables/descriptive_stats.csv`

### 3. Models (`models`)

**Purpose:** Run statistical models for hypothesis testing.

**Steps:**
- Load trial data with effective metrics
- Run LMEM for log-RT (H1, H2, H3)
- Run GLMM for errors (H3)
- Run TOST equivalence test (H2)
- Run TLX analysis (H5)
- Export model summaries and EMMs

**Outputs:**
- `results/tables/emmeans_RT.csv`
- `results/tables/emmeans_error.csv`
- `results/tables/emmeans_TLX.csv`
- `results/tost_summary.txt`
- `results/model_summary.txt`

### 4. Visualizations (`visualize`)

**Purpose:** Generate figures for key outcomes.

**Steps:**
- Load EMMs and summary tables
- Create combined panel (MT, Error, TP, TLX)
- Generate Fitts fit plots
- Export figures

**Outputs:**
- `results/figures/summary_panel.png`
- `results/figures/fitts_fit.png`

### 5. Render Mini-Report (`report`)

**Purpose:** Generate human-readable summary report.

**Steps:**
- Compile validation results
- Summarize descriptive statistics
- Extract key model results
- Format as markdown report
- Include figure references

**Outputs:**
- `results/analysis_report.md`
- `results/analysis_report.html` (optional)

## Usage

### Command Line

```bash
# Run full pipeline
./analysis/run_all.sh

# Or with R (legacy)
Rscript analysis/run_all.R
```

### CI/CD

The pipeline is designed to run in CI/CD environments:

```yaml
- name: Run analysis pipeline
  run: ./analysis/run_all.sh
```

## Dependencies

### Required Tools

- **Node.js** (v20+): For CSV validation
- **R** (v4.4+): For statistical analysis
- **R packages:** `tidyverse`, `lme4`, `lmerTest`, `TOSTER`, `emmeans`, `afex`

### Data Requirements

- `data/clean/trial_data.csv`: Trial-level data
- `data/clean/block_data.csv`: Block-level TLX data (optional)

## Exit Codes

- `0`: Pipeline completed successfully
- `1`: Validation failed (pipeline stops early)
- `2`: Analysis error (models failed)
- `3`: Visualization error

## Output Structure

```
results/
├── validation_report.txt
├── validation_errors.csv (if errors)
├── tables/
│   ├── effective_metrics_by_condition.csv
│   ├── throughput_summary.csv
│   ├── descriptive_stats.csv
│   ├── emmeans_RT.csv
│   ├── emmeans_error.csv
│   ├── emmeans_TLX.csv
│   └── exclusion_report.csv
├── figures/
│   ├── summary_panel.png
│   └── fitts_fit.png
├── tost_summary.txt
├── model_summary.txt
└── analysis_report.md
```

## Error Handling

- **Validation errors:** Pipeline stops, errors reported in `validation_errors.csv`
- **Model convergence issues:** Warnings logged, pipeline continues
- **Missing data:** Handled gracefully with appropriate warnings

## Future Enhancements

- [ ] Add data quality dashboard
- [ ] Generate interactive HTML report
- [ ] Add sensitivity analysis options
- [ ] Support for multiple data sources
- [ ] Parallel processing for large datasets

## See Also

- `/docs/analysis_plan.md`: Detailed formulas and expected ranges
- `/docs/preregistration.md`: Pre-registered hypotheses and analysis plan
- `/app/scripts/validate_trials_schema.ts`: CSV validation script

