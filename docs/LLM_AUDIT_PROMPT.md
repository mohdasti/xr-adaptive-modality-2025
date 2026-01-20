# LBA Analysis Script Audit Request

## Context and Situation

I am running a **Hierarchical Linear Ballistic Accumulator (LBA) model** using PyMC for a psychophysics experiment analyzing reaction time data. The analysis has been running for **over 48 hours** and has **not yet completed the warmup phase** (2000 iterations per chain), which seems abnormally slow given our computational resources.

### Computational Resources Available

- **VM Type**: Google Cloud Platform n2-standard-64
- **CPU**: 64 vCPUs (Intel Xeon @ 2.80GHz)
- **RAM**: 251 GB total, 235 GB available
- **Python**: 3.10.12
- **PyMC Version**: 5.12.0
- **ArviZ Version**: 0.17.1

### Current Process Status

- **Runtime**: 48+ hours (started Jan 18)
- **Phase**: Still in warmup/tuning (2000 iterations per chain)
- **Chains**: 8 chains running in parallel
- **CPU Usage**: Processes using ~100% CPU each (good utilization)
- **Output**: No trace file created yet (`lba_trace.nc` doesn't exist)
- **Configuration**: 
  - `target_accept=0.95` (very conservative)
  - `tune=2000` (warmup iterations)
  - `draws=1000` (sampling iterations)
  - `max_treedepth=15`
  - `chains=8`
  - `cores=64`

### Data Characteristics

- **Dataset**: `data/clean/trial_data.csv` (~68 MB)
- **Trials**: ~3,985 trials (from 70 participants)
- **Variables**:
  - `participant_id`: Participant identifier
  - `rt_ms`: Reaction time in milliseconds (verification phase)
  - `correct`: Binary correctness (1=correct, 0=error)
  - `ID`: Index of Difficulty (Fitts' Law: log2(A/W + 1))
  - `modality`: Input modality (Hand vs Gaze)
  - `ui_mode`: UI mode (baseline, etc.)
  - `pressure`: Pressure condition (varies by condition)

### Research Goals

1. **Model the verification phase** - time spent deciding to click once inside target (after movement completion)
2. **Estimate LBA parameters**:
   - **t0** (non-decision time): Varies by Modality and UI Mode
   - **v_c** (correct drift rate): Varies by ID (difficulty)
   - **v_e** (error drift rate): Flat
   - **b** (threshold): Varies by Pressure (speed-accuracy tradeoff)
   - **A** (start point variability): Per participant
3. **Extract parameters** separated by modality and ui_mode for downstream analysis

---

## Audit Request

Please conduct a **comprehensive audit** of the attached `lba.py` script covering:

### 1. Computational Efficiency Audit

**Questions:**
- Is the model computationally efficient? Are there bottlenecks?
- Why might warmup be taking 48+ hours? Is this expected?
- Are there unnecessary computations or inefficient operations?
- Is the CustomDist implementation optimal?
- Should we reduce `target_accept` from 0.95 to something faster (e.g., 0.90)?
- Are there PyMC-specific optimizations we're missing?
- Should we reduce `tune` (warmup iterations) from 2000?
- Is the non-centered parameterization implemented correctly?
- Are there vectorization opportunities we're missing?

**Specific Checks:**
- Review the `logp_lba_race` function - is it efficient?
- Check the `pdf_lba_single` and `cdf_lba_single` implementations
- Verify the CustomDist usage is correct for PyMC 5.x
- Check if we're using appropriate PyTensor operations
- Review memory usage patterns

### 2. Theoretical/Statistical Validity Audit

**Questions:**
- Is the LBA model implementation **theoretically correct**?
- Are the mathematical formulations (PDF, CDF) accurate?
- Is the hierarchical structure appropriate for this data?
- Are the priors reasonable?
- Is the parameterization (non-centered) correct?
- Are we modeling the right phase (verification phase)?
- Is the race model (correct vs error accumulators) correctly implemented?

**Specific Checks:**
- Verify LBA PDF formula: `pdf(t) = (1/A) * [phi((b-A-t*v)/(t*s)) - phi((b-t*v)/(t*s))]`
- Verify LBA CDF formula
- Check likelihood: `P(correct) = PDF(c) * (1 - CDF(e))` and `P(error) = PDF(e) * (1 - CDF(c))`
- Verify softplus transformations for positive parameters
- Check hierarchical structure: group-level means + participant deviations
- Verify ID and Pressure effects are modeled correctly

### 3. Data Appropriateness Audit

**Questions:**
- Is LBA appropriate for this dataset?
- Do we have enough data? (~3,985 trials, 70 participants)
- Are there data quality issues that might slow convergence?
- Should we filter outliers differently?
- Is the reaction time range appropriate (200-5000 ms)?

**Specific Checks:**
- Review data filtering/preprocessing
- Check for extreme values that might cause numerical issues
- Verify normalization of covariates (ID_norm, pressure_norm)

### 4. Recommendations

**Please provide:**
1. **Should we kill the current process and restart?** Why or why not?
2. **What specific code changes** would improve performance?
3. **What parameter changes** (target_accept, tune, etc.) would help?
4. **Is the model theoretically sound?** Any corrections needed?
5. **Alternative approaches** if LBA is not appropriate
6. **Expected runtime** with optimizations

---

## Code Structure Overview

The script (`lba.py`) contains:

1. **LBA Mathematics** (lines ~56-148):
   - `pdf_lba_single()`: PDF for single accumulator
   - `cdf_lba_single()`: CDF for single accumulator  
   - `logp_lba_race()`: Log-likelihood for race model (correct vs error)

2. **Data Processing** (lines ~154-239):
   - `load_and_prep_data()`: Loads CSV, filters, normalizes, creates indices

3. **Model Definition** (lines ~245-363):
   - `fit_hierarchical_lba()`: Builds PyMC model with hierarchical structure
   - Non-centered parameterization for hierarchical effects
   - CustomDist for likelihood

4. **Sampling** (lines ~365-420):
   - MCMC sampling with PyMC
   - Progress tracking

5. **Results Extraction** (lines ~450-610):
   - Extracts parameters by modality/ui_mode
   - Saves JSON, CSV, netCDF files
   - Convergence diagnostics

---

## Expected Output Format

Please structure your response as:

```
## 1. Computational Efficiency Findings
[Your findings]

## 2. Theoretical Validity Findings  
[Your findings]

## 3. Data Appropriateness Findings
[Your findings]

## 4. Specific Code Issues
[Line-by-line issues if any]

## 5. Recommendations
- Kill and restart? [Yes/No with reasoning]
- Code changes: [Specific changes]
- Parameter changes: [target_accept, tune, etc.]
- Expected improvement: [Time estimates]

## 6. Priority Actions
[Ordered list of what to do next]
```

---

## Files to Review

**Primary file**: `analysis/py/lba.py` (attached)

**Supporting context** (if helpful):
- Data dictionary: `data/dict/trial_data_dictionary.md`
- Analysis README: `analysis/README.md`

---

## Additional Context

- This is part of an XR (Extended Reality) adaptive modality experiment
- We're specifically modeling the "verification phase" - decision time after movement completion
- The model needs to handle high-accuracy data (where DDM may fail)
- Results will be used in a Quarto report (`Report.qmd`)

---

## Questions for the LLM

1. **Is 48+ hours for warmup normal** for this model complexity?
2. **What's the bottleneck?** CustomDist evaluation? Model complexity? Data size?
3. **Should we kill and restart** with optimizations, or wait?
4. **Is the LBA implementation correct** mathematically and statistically?
5. **What's the fastest path forward** to get results?

Please be thorough and provide actionable recommendations.
