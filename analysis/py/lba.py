#!/usr/bin/env python3
"""
Hierarchical Linear Ballistic Accumulator (LBA) Analysis
for XR Adaptive Modality Experiment

This script implements a Bayesian Hierarchical LBA model using PyMC.

It is designed as a robust alternative to DDM for Fitts' Law tasks,
specifically handling high-accuracy data where standard DDM may fail
to converge on error boundaries.

Theoretical Mapping:
- Drift Rate (v): Varies by Difficulty (ID).
    - Harder trials (High ID) -> Lower drift rate for correct response.
- Threshold (b): Varies by Pressure.
    - High pressure -> Lower threshold (speed-accuracy tradeoff).
- Non-Decision Time (t0): Varies by Modality and UI Mode.
    - Gaze vs Hand have physically different actuation latencies.
    - UI modes may affect verification phase timing.

This model specifically targets the "Verification Phase" - the time spent
deciding to click once inside the target (after movement completion).

Usage:
    python lba.py --input data/clean/ --output analysis/results/
    
Output:
    - lba_parameters.json: Parameters separated by modality and ui_mode
    - lba_parameters_summary.csv: Full parameter summary
    - lba_trace.nc: MCMC trace (netCDF format)
    - lba_trace_plot.png: Trace plots for diagnostics
"""

import argparse
import sys
from pathlib import Path
import pandas as pd
import numpy as np

try:
    import pymc as pm
    import pytensor.tensor as pt
    import arviz as az
    PYMC_AVAILABLE = True
except ImportError:
    PYMC_AVAILABLE = False
    print("Warning: PyMC not available. Install with: pip install pymc arviz", file=sys.stderr)

import json

# -------------------------------------------------------------------------
# LBA Mathematics (PyTensor Implementation)
# -------------------------------------------------------------------------

def pdf_lba_single(t, A, b, v, s):
    """
    Probability Density Function (PDF) for a single LBA accumulator.
    
    t: time (rt - t0)
    A: max start point
    b: decision threshold
    v: drift rate
    s: drift rate variability
    """
    # Use standard normal distribution
    normal = pm.Normal.dist(mu=0, sigma=1)
    
    # Transformation for numerical stability
    # pdf(t) = (1/A) * [phi((b-A-t*v)/(t*s)) - phi((b-t*v)/(t*s))]
    
    denom = pt.maximum(t * s, 1e-10)  # Avoid division by zero
    zs1 = (b - A - t * v) / denom
    zs2 = (b - t * v) / denom
    
    # Use log_prob for numerical stability
    log_prob1 = pm.logp(normal, zs1)
    log_prob2 = pm.logp(normal, zs2)
    
    # Convert to probabilities and compute difference
    dens = (1.0 / A) * (pm.math.exp(log_prob1) - pm.math.exp(log_prob2))
    
    # Clip to avoid zeros
    return pt.maximum(dens, 1e-10)

def cdf_lba_single(t, A, b, v, s):
    """
    Cumulative Distribution Function (CDF) for a single LBA accumulator.
    Uses the standard LBA CDF formula.
    """
    normal = pm.Normal.dist(mu=0, sigma=1)
    
    denom = pt.maximum(t * s, 1e-10)
    zs1 = (b - A - t * v) / denom
    zs2 = (b - t * v) / denom
    
    # LBA CDF formula
    # CDF = 1 + (b-A-t*v)/A * Phi(zs1) - (b-t*v)/A * Phi(zs2) 
    #      + (t*s)/A * [phi(zs1) - phi(zs2)]
    
    # Standard normal CDF and PDF
    cdf1 = pm.math.exp(pm.logcdf(normal, zs1))
    cdf2 = pm.math.exp(pm.logcdf(normal, zs2))
    pdf1 = pm.math.exp(pm.logp(normal, zs1))
    pdf2 = pm.math.exp(pm.logp(normal, zs2))
    
    term1 = 1.0
    term2 = ((b - A - t * v) / A) * cdf1
    term3 = ((b - t * v) / A) * cdf2
    term4 = ((t * s) / A) * (pdf1 - pdf2)
    
    cdf_val = term1 + term2 - term3 + term4
    
    return pt.clip(cdf_val, 0.0, 1.0)

def logp_lba_race(value, A, b, v_c, v_e, s, t0):
    """
    Log-Likelihood for the LBA Race Model (Correct vs Error accumulators).
    
    value: dict with 'rt' and 'response' keys (observed data)
    A, b, v_c, v_e, s, t0: LBA parameters
    """
    rt = value['rt']
    response = value['response']
    
    # Effective reaction time (time spent accumulating)
    t = rt - t0
    
    # Ensure t is positive
    t = pt.maximum(t, 1e-5)
    
    # PDF and CDF for Correct Accumulator
    pdf_c = pdf_lba_single(t, A, b, v_c, s)
    cdf_c = cdf_lba_single(t, A, b, v_c, s)
    
    # PDF and CDF for Error Accumulator
    pdf_e = pdf_lba_single(t, A, b, v_e, s)
    cdf_e = cdf_lba_single(t, A, b, v_e, s)
    
    # Likelihood of Correct Response: PDF(c) * (1 - CDF(e))
    # Likelihood of Error Response:   PDF(e) * (1 - CDF(c))
    
    prob_correct = pdf_c * (1 - cdf_e)
    prob_error = pdf_e * (1 - cdf_c)
    
    # Select probability based on observed response
    # response is 1 (correct) or 0 (error)
    likelihood = response * prob_correct + (1 - response) * prob_error
    
    return pt.log(pt.maximum(likelihood, 1e-10))

# -------------------------------------------------------------------------
# Data Processing
# -------------------------------------------------------------------------

def load_and_prep_data(input_path: Path):
    """Load and preprocess data for LBA analysis."""
    if input_path.is_file():
        files = [input_path]
    else:
        files = list(input_path.glob("*.csv"))
    
    if not files:
        raise ValueError("No CSV files found.")
        
    print(f"Loading {len(files)} files...")
    df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)
    
    # Column name mapping (handle different naming conventions)
    # Map participant_id -> pid, movement_time_ms -> rt_ms, error -> correct
    if 'participant_id' in df.columns and 'pid' not in df.columns:
        df['pid'] = df['participant_id']
    if 'movement_time_ms' in df.columns and 'rt_ms' not in df.columns:
        df['rt_ms'] = df['movement_time_ms']
    if 'error' in df.columns and 'correct' not in df.columns:
        # error is inverted: FALSE = correct, TRUE = error
        df['correct'] = ~df['error'].astype(bool)
    
    # Compute ID if not present but we have A and W
    if 'ID' not in df.columns:
        if 'target_amplitude_px' in df.columns and 'target_width_px' in df.columns:
            # Compute ID using Shannon formulation: ID = log2(A/W + 1)
            df['A'] = df['target_amplitude_px']
            df['W'] = df['target_width_px']
            df['ID'] = np.log2(df['A'] / df['W'] + 1)
            print("Computed ID from target_amplitude_px and target_width_px")
        elif 'A' in df.columns and 'W' in df.columns:
            df['ID'] = np.log2(df['A'] / df['W'] + 1)
            print("Computed ID from A and W columns")
        else:
            raise ValueError("ID column not found and cannot be computed (need A/W or target_amplitude_px/target_width_px)")
    
    # Handle missing pressure (default to 1.0)
    if 'pressure' not in df.columns:
        print("Warning: pressure column not found. Defaulting to 1.0 (baseline)")
        df['pressure'] = 1.0
    
    # Filter valid trials
    # LBA is sensitive to extremely fast outliers, clip strict
    df = df[
        (df['rt_ms'] >= 200) & 
        (df['rt_ms'] <= 5000) & 
        (df['correct'].notna()) &
        (df['ID'].notna())
    ].copy()
    
    # Normalize Covariates for better convergence
    # ID: centered and scaled (Z-scored)
    df['ID_norm'] = (df['ID'] - df['ID'].mean()) / df['ID'].std()
    
    # Pressure: centered at 1.0 (baseline)
    df['pressure_norm'] = df['pressure'] - 1.0
    
    # Handle missing ui_mode (default to 'baseline' if not present)
    if 'ui_mode' not in df.columns:
        print("Warning: ui_mode column not found. Defaulting to 'baseline'")
        df['ui_mode'] = 'baseline'
    
    # Categorical indices
    participants = df['pid'].unique()
    n_participants = len(participants)
    pid_map = {p: i for i, p in enumerate(participants)}
    df['pid_idx'] = df['pid'].map(pid_map)
    
    modalities = df['modality'].unique()
    n_modalities = len(modalities)
    mod_map = {m: i for i, m in enumerate(modalities)}
    df['mod_idx'] = df['modality'].map(mod_map)
    
    ui_modes = df['ui_mode'].unique()
    n_ui_modes = len(ui_modes)
    ui_mode_map = {m: i for i, m in enumerate(ui_modes)}
    df['ui_mode_idx'] = df['ui_mode'].map(ui_mode_map)
    
    print(f"Data Prepared: {len(df)} trials, {n_participants} participants.")
    print(f"Modalities: {mod_map}")
    print(f"UI Modes: {ui_mode_map}")
    print(f"ID range: {df['ID'].min():.2f} - {df['ID'].max():.2f} bits")
    print(f"Pressure range: {df['pressure'].min():.2f} - {df['pressure'].max():.2f}")
    
    return df, participants, modalities, ui_modes

# -------------------------------------------------------------------------
# Model Definition & Fitting
# -------------------------------------------------------------------------

def fit_hierarchical_lba(df, participants, modalities, ui_modes):
    """Fit hierarchical Bayesian LBA model."""
    
    if not PYMC_AVAILABLE:
        raise ImportError("PyMC is required for hierarchical LBA fitting. Install with: pip install pymc arviz")
    
    n_p = len(participants)
    n_m = len(modalities)
    n_u = len(ui_modes)
    
    pid_idx = df['pid_idx'].values
    mod_idx = df['mod_idx'].values
    ui_mode_idx = df['ui_mode_idx'].values
    rt_obs = df['rt_ms'].values / 1000.0  # Convert to seconds
    resp_obs = df['correct'].astype(int).values
    id_obs = df['ID_norm'].values
    pressure_obs = df['pressure_norm'].values
    
    print("Building PyMC Model...")
    
    with pm.Model() as model:
        # --- Priors ---
        
        # 1. Non-Decision Time (t0)
        # Varies by Modality and UI Mode (Hand vs Gaze have different physics, UI modes may affect verification)
        # Hierarchical: Group mean + Participant deviation
        # Shape: (n_modalities, n_ui_modes) to allow interaction
        t0_mu = pm.Normal('t0_mu', mu=0.3, sigma=0.1, shape=(n_m, n_u))
        t0_sd = pm.HalfNormal('t0_sd', sigma=0.1)
        t0_offset = pm.Normal('t0_offset', mu=0, sigma=1, shape=(n_p, n_m, n_u))
        
        # t0 must be positive and less than min(RT) ~ 0.2
        # We use Softplus to ensure positivity
        # Index by both modality and ui_mode
        t0 = pm.Deterministic('t0', pm.math.softplus(
            t0_mu[mod_idx, ui_mode_idx] + 
            t0_offset[pid_idx, mod_idx, ui_mode_idx] * t0_sd
        ))
        
        # 2. Start Point Variability (A)
        # Upper bound of start point distribution.
        # Usually relatively constant. Fit one per participant.
        A_mu = pm.Normal('A_mu', mu=0.3, sigma=0.1)
        A_sd = pm.HalfNormal('A_sd', sigma=0.1)
        A_offset = pm.Normal('A_offset', mu=0, sigma=1, shape=n_p)
        A = pm.Deterministic('A', pm.math.softplus(A_mu + A_offset[pid_idx] * A_sd))
        
        # 3. Decision Threshold (b)
        # b = A + gap. Gap depends on Pressure.
        # gap = intercept + slope * pressure
        gap_intercept_mu = pm.Normal('gap_int_mu', mu=0.2, sigma=0.1)
        gap_slope_mu = pm.Normal('gap_slope_mu', mu=-0.1, sigma=0.1)  # Expect neg slope (higher pressure -> lower gap)
        
        # Participant random effects on intercept
        gap_int_sd = pm.HalfNormal('gap_int_sd', sigma=0.05)
        gap_int_offset = pm.Normal('gap_int_offset', mu=0, sigma=1, shape=n_p)
        
        gap = pm.Deterministic('gap', 
            pm.math.softplus(
                (gap_intercept_mu + gap_int_offset[pid_idx] * gap_int_sd) + 
                gap_slope_mu * pressure_obs
            )
        )
        
        # Threshold must be > A
        b = pm.Deterministic('b', A + gap)
        
        # 4. Drift Rate (v)
        # v_correct depends on ID (Difficulty).
        # v_correct = v_c_base + v_c_slope * ID
        # v_error is often modeled as flat or typically smaller.
        
        vc_base_mu = pm.Normal('vc_base_mu', mu=2.5, sigma=0.5)
        vc_slope_mu = pm.Normal('vc_slope_mu', mu=-0.5, sigma=0.2)  # Harder (Higher ID) -> Slower drift
        
        vc_base_sd = pm.HalfNormal('vc_base_sd', sigma=0.5)
        vc_base_offset = pm.Normal('vc_base_offset', mu=0, sigma=1, shape=n_p)
        
        ve_mu = pm.Normal('ve_mu', mu=1.0, sigma=0.5)  # Error drift usually lower
        
        v_c = pm.Deterministic('v_c', 
            pm.math.softplus(
                (vc_base_mu + vc_base_offset[pid_idx] * vc_base_sd) + 
                vc_slope_mu * id_obs
            )
        )
        
        v_e = pm.Deterministic('v_e', pm.math.softplus(ve_mu))  # Flat error drift
        
        # 5. Drift Variability (s)
        # Fixed to 1.0 for scaling constraint in LBA
        s = 1.0
        
        # --- Likelihood ---
        
        # Custom Density - vectorized over trials
        # Note: CustomDist expects logp(value, *params) signature
        # The logp function will be called for each trial
        obs = pm.CustomDist(
            'obs',
            A, b, v_c, v_e, s, t0,
            logp=logp_lba_race,
            observed={'rt': rt_obs, 'response': resp_obs}
        )
        
        # --- Sampling ---
        print("Sampling... (This may take time)")
        trace = pm.sample(
            draws=1000,
            tune=1000,
            target_accept=0.9,
            chains=2,
            cores=2,
            return_inferencedata=True
        )
        
    return trace, model

# -------------------------------------------------------------------------
# Main Execution
# -------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="LBA Analysis")
    parser.add_argument('--input', '-i', type=str, default='data/clean/')
    parser.add_argument('--output', '-o', type=str, default='analysis/results/')
    args = parser.parse_args()
    
    input_path = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load
    try:
        df, participants, modalities, ui_modes = load_and_prep_data(input_path)
    except Exception as e:
        print(f"Data Error: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Fit
    try:
        if not PYMC_AVAILABLE:
            print("Error: PyMC is required for hierarchical LBA analysis.", file=sys.stderr)
            print("Install with: pip install pymc arviz", file=sys.stderr)
            sys.exit(1)
        
        trace, model = fit_hierarchical_lba(df, participants, modalities, ui_modes)
        
        # Save Summary
        summary = az.summary(trace, var_names=['t0_mu', 'vc_slope_mu', 'gap_slope_mu', 've_mu', 'vc_base_mu', 'gap_int_mu'])
        print("\nModel Summary:")
        print(summary)
        
        summary.to_csv(output_dir / 'lba_parameters_summary.csv')
        
        # Save full trace as netCDF
        trace.to_netcdf(output_dir / 'lba_trace.nc')
        
        # Extract parameters by modality and ui_mode for JSON export
        print("\nExtracting parameters by modality and ui_mode...")
        parameters_by_condition = {}
        
        # Get posterior samples
        posterior = trace.posterior
        
        # Extract t0_mu (shape: [chain, draw, modality, ui_mode])
        t0_mu_samples = posterior['t0_mu'].values
        # Average over chains and draws to get point estimates
        t0_mu_mean = np.mean(t0_mu_samples, axis=(0, 1))  # Shape: [modality, ui_mode]
        
        # Extract other parameters (these don't vary by ui_mode in current model)
        vc_slope_mu_samples = posterior['vc_slope_mu'].values
        vc_slope_mu_mean = float(np.mean(vc_slope_mu_samples))
        
        gap_slope_mu_samples = posterior['gap_slope_mu'].values
        gap_slope_mu_mean = float(np.mean(gap_slope_mu_samples))
        
        ve_mu_samples = posterior['ve_mu'].values
        ve_mu_mean = float(np.mean(ve_mu_samples))
        
        vc_base_mu_samples = posterior['vc_base_mu'].values
        vc_base_mu_mean = float(np.mean(vc_base_mu_samples))
        
        gap_int_mu_samples = posterior['gap_int_mu'].values
        gap_int_mu_mean = float(np.mean(gap_int_mu_samples))
        
        # Build JSON structure: parameters separated by modality and ui_mode
        for mod_idx, modality in enumerate(modalities):
            parameters_by_condition[modality] = {}
            for ui_idx, ui_mode in enumerate(ui_modes):
                parameters_by_condition[modality][ui_mode] = {
                    't0_mu': float(t0_mu_mean[mod_idx, ui_idx]),
                    'vc_base_mu': vc_base_mu_mean,  # Shared across conditions
                    'vc_slope_mu': vc_slope_mu_mean,  # Shared across conditions
                    've_mu': ve_mu_mean,  # Shared across conditions
                    'gap_int_mu': gap_int_mu_mean,  # Shared across conditions
                    'gap_slope_mu': gap_slope_mu_mean,  # Shared across conditions
                    'note': 'LBA parameters for verification phase modeling. t0 varies by modality and ui_mode.'
                }
        
        # Save JSON
        json_path = output_dir / 'lba_parameters.json'
        with open(json_path, 'w') as f:
            json.dump(parameters_by_condition, f, indent=2)
        print(f"✓ Parameters exported to {json_path}")
        
        # Plot
        try:
            import matplotlib.pyplot as plt
            az.plot_trace(trace, var_names=['vc_slope_mu', 'gap_slope_mu', 't0_mu'])
            plt.savefig(output_dir / 'lba_trace_plot.png', dpi=150, bbox_inches='tight')
            plt.close()
            print(f"Trace plot saved to {output_dir / 'lba_trace_plot.png'}")
        except Exception as e:
            print(f"Warning: Could not create trace plot: {e}")
        
        # Save convergence diagnostics
        rhat = az.rhat(trace)
        rhat_df = az.extract(rhat, var_names=['vc_slope_mu', 'gap_slope_mu', 't0_mu', 've_mu'])
        print("\nR-hat diagnostics (should be < 1.05):")
        print(rhat_df)
        
        print(f"\nAnalysis Complete. Results saved to {output_dir}")
        print(f"  - lba_parameters.json: Parameters by modality and ui_mode")
        print(f"  - lba_parameters_summary.csv: Parameter estimates")
        print(f"  - lba_trace.nc: Full MCMC trace")
        print(f"  - lba_trace_plot.png: Trace plots")
        
    except Exception as e:
        print(f"Fitting Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
