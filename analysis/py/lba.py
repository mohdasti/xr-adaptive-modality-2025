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
    python3 lba.py --input data/clean/ --output analysis/results/
    # Note: Requires Python 3.8+ (pandas 2.x requirement)
    
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
    
    Uses the correct Brown & Heathcote (2008) closed-form formula:
    f(t) = (1/A) * [-v*Phi(z1) + s*phi(z1) + v*Phi(z2) - s*phi(z2)]
    where z1 = (b-A-t*v)/(t*s), z2 = (b-t*v)/(t*s)
    
    t: time (rt - t0)
    A: max start point
    b: decision threshold
    v: drift rate
    s: drift rate variability
    """
    normal = pm.Normal.dist(mu=0, sigma=1)
    
    # Compute z-scores
    denom = pt.maximum(t * s, 1e-10)  # Avoid division by zero
    z1 = (b - A - t * v) / denom
    z2 = (b - t * v) / denom
    
    # Compute Phi (CDF) and phi (PDF) in log-space for stability
    logcdf1 = pm.logcdf(normal, z1)
    logcdf2 = pm.logcdf(normal, z2)
    logpdf1 = pm.logp(normal, z1)
    logpdf2 = pm.logp(normal, z2)
    
    # Convert to linear space
    Phi1 = pm.math.exp(logcdf1)
    Phi2 = pm.math.exp(logcdf2)
    phi1 = pm.math.exp(logpdf1)
    phi2 = pm.math.exp(logpdf2)
    
    # Brown & Heathcote (2008) closed-form PDF
    # f(t) = (1/A) * [-v*Phi(z1) + s*phi(z1) + v*Phi(z2) - s*phi(z2)]
    pdf_val = (1.0 / A) * (-v * Phi1 + s * phi1 + v * Phi2 - s * phi2)
    
    # Ensure non-negative (should be naturally, but protect against numerical issues)
    return pt.maximum(pdf_val, 1e-12)

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

def logp_lba_race(rt, response, A, b, v_c, v_e, s, t0):
    """
    Log-Likelihood for the LBA Race Model (Correct vs Error accumulators).
    
    Computed entirely in log-space for numerical stability.
    
    rt: observed reaction times
    response: observed responses (1 = correct, 0 = error)
    A, b, v_c, v_e, s, t0: LBA parameters
    
    Note: t0 should be constrained to be < min(rt) to avoid t <= 0 issues.
    """
    # Effective reaction time (time spent accumulating)
    # t0 is constrained in the model to be < min(rt), so t should be positive
    t = rt - t0
    
    # Compute log-PDFs and log-CDFs for both accumulators
    normal = pm.Normal.dist(mu=0, sigma=1)
    
    # Helper function to compute log-PDF and log-CDF for an accumulator
    def compute_log_pdf_cdf(t_acc, v_acc):
        denom = pt.maximum(t_acc * s, 1e-10)
        z1 = (b - A - t_acc * v_acc) / denom
        z2 = (b - t_acc * v_acc) / denom
        
        logcdf1 = pm.logcdf(normal, z1)
        logcdf2 = pm.logcdf(normal, z2)
        logpdf1 = pm.logp(normal, z1)
        logpdf2 = pm.logp(normal, z2)
        
        Phi1 = pm.math.exp(logcdf1)
        Phi2 = pm.math.exp(logcdf2)
        phi1 = pm.math.exp(logpdf1)
        phi2 = pm.math.exp(logpdf2)
        
        # Brown & Heathcote PDF in log-space
        pdf_val = (1.0 / A) * (-v_acc * Phi1 + s * phi1 + v_acc * Phi2 - s * phi2)
        logpdf = pt.log(pt.maximum(pdf_val, 1e-12))
        
        # CDF (already computed components)
        cdf_val = 1.0 + ((b - A - t_acc * v_acc) / A) * Phi1 - ((b - t_acc * v_acc) / A) * Phi2 + ((t_acc * s) / A) * (phi1 - phi2)
        cdf_val = pt.clip(cdf_val, 1e-10, 1.0 - 1e-10)  # Clip away from boundaries
        logcdf = pt.log(cdf_val)
        
        # log(1 - CDF) = logsf using log1mexp for stability
        logsf = pm.math.log1mexp(-logcdf)  # More stable than log(1 - exp(logcdf))
        
        return logpdf, logsf
    
    # Compute for correct accumulator
    logpdf_c, logsf_c = compute_log_pdf_cdf(t, v_c)
    
    # Compute for error accumulator  
    logpdf_e, logsf_e = compute_log_pdf_cdf(t, v_e)
    
    # Race model likelihood in log-space:
    # P(correct) = PDF(c) * (1 - CDF(e)) -> logpdf_c + logsf_e
    # P(error) = PDF(e) * (1 - CDF(c)) -> logpdf_e + logsf_c
    logprob_correct = logpdf_c + logsf_e
    logprob_error = logpdf_e + logsf_c
    
    # Select based on response (element-wise selection)
    # response is 1 (correct) or 0 (error) - vector of same length as rt
    loglikelihood = response * logprob_correct + (1 - response) * logprob_error
    
    return loglikelihood

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
    # Prefer verification_time_ms for verification phase, fallback to movement_time_ms
    if 'participant_id' in df.columns and 'pid' not in df.columns:
        df['pid'] = df['participant_id']
    
    # RT column: prefer verification_time_ms (verification phase), then rt_ms, then movement_time_ms
    if 'rt_ms' not in df.columns:
        if 'verification_time_ms' in df.columns:
            df['rt_ms'] = df['verification_time_ms']
            print("Using verification_time_ms for RT (verification phase)")
        elif 'movement_time_ms' in df.columns:
            df['rt_ms'] = df['movement_time_ms']
            print("Using movement_time_ms for RT (movement phase - may not be appropriate for verification)")
        else:
            raise ValueError("No RT column found (need rt_ms, verification_time_ms, or movement_time_ms)")
    
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
    # Also check for error trials - if no RTs for errors, warn user
    initial_n = len(df)
    df = df[
        (df['rt_ms'].notna()) &
        (df['rt_ms'] >= 200) & 
        (df['rt_ms'] <= 5000) & 
        (df['correct'].notna()) &
        (df['ID'].notna())
    ].copy()
    
    # Check if we have error trials with RTs
    error_trials = df[df['correct'] == False]
    if len(error_trials) == 0:
        print("⚠ WARNING: No error trials found in data after filtering!")
        print("   The race model requires both correct and error RTs.")
        print("   Consider using a single-accumulator model or ensuring error RTs are recorded.")
    elif error_trials['rt_ms'].isna().all():
        print("⚠ WARNING: Error trials exist but have no RT values!")
        print("   This will cause issues with the race model.")
    else:
        print(f"✓ Found {len(error_trials)} error trials with RTs")
    
    print(f"Filtered from {initial_n} to {len(df)} valid trials")
    
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
    print("  Using non-centered parameterization for hierarchical effects (improves geometry)")
    print("  Using less informative priors (improves convergence)")
    
    with pm.Model() as model:
        # --- Priors ---
        
        # 1. Non-Decision Time (t0)
        # Varies by Modality and UI Mode (Hand vs Gaze have different physics, UI modes may affect verification)
        # Hierarchical: Group mean + Participant deviation
        # Using NON-CENTERED parameterization for better geometry
        # CRITICAL: Constrain t0 to be < min(rt) to avoid t <= 0 issues
        # Shape: (n_modalities, n_ui_modes) to allow interaction
        
        # Compute minimum RT per modality×ui_mode for constraint
        min_rt_by_condition = {}
        for mod_idx, mod in enumerate(modalities):
            for ui_idx, ui in enumerate(ui_modes):
                mask = (mod_idx == df['mod_idx'].values) & (ui_mode_idx == df['ui_mode_idx'].values)
                if mask.any():
                    min_rt = df.loc[mask, 'rt_ms'].min() / 1000.0  # Convert to seconds
                    min_rt_by_condition[(mod_idx, ui_idx)] = min_rt * 0.95  # 95% of min RT as upper bound
        
        # Use global minimum if per-condition not available
        global_min_rt = (df['rt_ms'].min() / 1000.0) * 0.95
        
        t0_mu = pm.Normal('t0_mu', mu=0.0, sigma=1.0, shape=(n_m, n_u))  # Less informative prior
        t0_sd = pm.HalfNormal('t0_sd', sigma=0.5)  # More flexible
        t0_offset_raw = pm.Normal('t0_offset_raw', mu=0, sigma=1, shape=(n_p, n_m, n_u))  # Standard normal
        
        # Non-centered: t0 = softplus(mu + offset_raw * sd), constrained to be < min(rt)
        # Use sigmoid transformation to bound t0: t0 = min_rt * sigmoid(raw_value)
        t0_raw = t0_mu[mod_idx, ui_mode_idx] + t0_offset_raw[pid_idx, mod_idx, ui_mode_idx] * t0_sd
        
        # Apply constraint: t0 must be < min(rt) for each condition
        # Use sigmoid to map to [0, min_rt)
        t0 = pm.Deterministic('t0', 
            pt.sigmoid(t0_raw) * pt.as_tensor([
                min_rt_by_condition.get((m, u), global_min_rt) 
                for m, u in zip(mod_idx, ui_mode_idx)
            ])
        )
        
        # 2. Start Point Variability (A)
        # Upper bound of start point distribution.
        # Usually relatively constant. Fit one per participant.
        # Using NON-CENTERED parameterization
        A_mu = pm.Normal('A_mu', mu=0.0, sigma=1.0)  # Less informative prior
        A_sd = pm.HalfNormal('A_sd', sigma=0.5)  # More flexible
        A_offset_raw = pm.Normal('A_offset_raw', mu=0, sigma=1, shape=n_p)  # Standard normal
        A = pm.Deterministic('A', pt.softplus(A_mu + A_offset_raw[pid_idx] * A_sd))
        
        # 3. Decision Threshold (b)
        # b = A + gap. Gap depends on Pressure.
        # gap = intercept + slope * pressure
        # Using NON-CENTERED parameterization for participant effects
        gap_intercept_mu = pm.Normal('gap_int_mu', mu=0.0, sigma=1.0)  # Less informative
        gap_slope_mu = pm.Normal('gap_slope_mu', mu=0.0, sigma=0.5)  # Less informative, expect neg slope
        
        # Participant random effects on intercept (non-centered)
        gap_int_sd = pm.HalfNormal('gap_int_sd', sigma=0.3)  # More flexible
        gap_int_offset_raw = pm.Normal('gap_int_offset_raw', mu=0, sigma=1, shape=n_p)  # Standard normal
        
        gap = pm.Deterministic('gap', 
            pt.softplus(
                (gap_intercept_mu + gap_int_offset_raw[pid_idx] * gap_int_sd) + 
                gap_slope_mu * pressure_obs
            )
        )
        
        # Threshold must be > A
        b = pm.Deterministic('b', A + gap)
        
        # 4. Drift Rate (v)
        # v_correct depends on ID (Difficulty).
        # v_correct = v_c_base + v_c_slope * ID
        # v_error is often modeled as flat or typically smaller.
        # Using NON-CENTERED parameterization for participant effects
        
        vc_base_mu = pm.Normal('vc_base_mu', mu=0.0, sigma=2.0)  # Less informative, wider prior
        vc_slope_mu = pm.Normal('vc_slope_mu', mu=0.0, sigma=1.0)  # Less informative, expect neg slope
        
        vc_base_sd = pm.HalfNormal('vc_base_sd', sigma=1.0)  # More flexible
        vc_base_offset_raw = pm.Normal('vc_base_offset_raw', mu=0, sigma=1, shape=n_p)  # Standard normal
        
        ve_mu = pm.Normal('ve_mu', mu=0.0, sigma=2.0)  # Less informative prior
        
        v_c = pm.Deterministic('v_c', 
            pt.softplus(
                (vc_base_mu + vc_base_offset_raw[pid_idx] * vc_base_sd) + 
                vc_slope_mu * id_obs
            )
        )
        
        v_e = pm.Deterministic('v_e', pt.softplus(ve_mu))  # Flat error drift
        
        # 5. Drift Variability (s)
        # Fixed to 1.0 for scaling constraint in LBA
        s = 1.0
        
        # --- Likelihood ---
        
        # For PyMC 5.x CustomDist, stack observed data into 2D array
        # Shape: (n_trials, 2) where [:, 0] = rt, [:, 1] = response
        rt_array = np.asarray(rt_obs, dtype=np.float64)
        resp_array = np.asarray(resp_obs, dtype=np.int32)
        observed_stack = np.column_stack([rt_array, resp_array])
        
        # Custom Density - vectorized over trials
        # PyMC 5.x: observed value is passed as first argument to logp
        # The lambda extracts rt and response from the stacked array
        obs = pm.CustomDist(
            'obs',
            A, b, v_c, v_e, s, t0,
            logp=lambda value, A, b, v_c, v_e, s, t0: logp_lba_race(
                value[:, 0],  # rt (first column)
                value[:, 1],  # response (second column)
                A, b, v_c, v_e, s, t0
            ),
            observed=observed_stack
        )
        
        # --- Sampling ---
        # Detect available CPU cores for optimal parallelization
        import os
        import multiprocessing
        try:
            available_cores = len(os.sched_getaffinity(0)) if hasattr(os, 'sched_getaffinity') else multiprocessing.cpu_count()
        except:
            available_cores = multiprocessing.cpu_count()
        
        # Optimize chains and cores for high-performance VMs
        # For VMs with many cores (>=32), use more chains for better diagnostics
        # PyMC parallelizes chains, so we want enough chains to utilize cores
        # but not so many that overhead dominates
        if available_cores >= 32:
            # High-core VM: use 8 chains (better diagnostics, good parallelization)
            n_chains = 8
            # Use all cores - PyMC will distribute chains across them
            n_cores = available_cores
        elif available_cores >= 8:
            # Medium VM: use 4 chains
            n_chains = 4
            n_cores = available_cores
        else:
            # Small VM: match chains to cores
            n_chains = min(4, available_cores)
            n_cores = available_cores
        
        print("\n" + "="*60)
        print("Starting MCMC Sampling...")
        print("="*60)
        print(f"Configuration:")
        print(f"  - Available CPU cores: {available_cores}")
        print(f"  - Chains: {n_chains} (optimized for {available_cores}-core VM)")
        print(f"  - Cores used: {n_cores}")
        print(f"  - Draws: 1000 per chain")
        print(f"  - Tune (warmup): 1500 per chain (reduced with fixed geometry)")
        print(f"  - Total iterations: {n_chains * 2500} ({2500} per chain)")
        print(f"  - Target accept rate: 0.90 (balanced for speed/convergence)")
        print(f"  - Max tree depth: 12 (reduced with smooth geometry)")
        if available_cores >= 32:
            print(f"  - Estimated time: 20-40 minutes (high-performance VM)")
        else:
            print(f"  - Estimated time: 30-60 minutes")
        print("="*60)
        print("\nProgress will be shown below. This may take a while...\n")
        
        # Add progress bar callback
        import time
        start_time = time.time()
        
        def progress_callback(trace, draw):
            """Callback to show progress during sampling"""
            if draw % 100 == 0:
                elapsed = time.time() - start_time
                total_draws = 2000  # per chain
                progress = (draw / total_draws) * 100
                eta = (elapsed / draw) * (total_draws - draw) if draw > 0 else 0
                print(f"Chain progress: {draw}/{total_draws} ({progress:.1f}%) | "
                      f"Elapsed: {elapsed/60:.1f}m | ETA: {eta/60:.1f}m", flush=True)
            return trace
        
        trace = pm.sample(
            draws=1000,
            tune=1500,  # Reduced from 2000 - should be sufficient with fixed geometry
            target_accept=0.90,  # Balanced: faster than 0.95, still good convergence
            chains=n_chains,  # Optimized for VM size
            cores=n_cores,  # Use all available cores for parallelization
            return_inferencedata=True,
            progressbar=True,  # Use PyMC's built-in progress bar
            max_treedepth=12,  # Reduced from 15 - should be sufficient with smooth geometry
            compute_convergence_checks=False,  # Disable during sampling for speed
            random_seed=42  # For reproducibility
        )
        
        elapsed_total = time.time() - start_time
        print(f"\n✓ Sampling complete! Total time: {elapsed_total/60:.1f} minutes")
        print("="*60)
        
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
        
        print("\n" + "="*60)
        print("Fitting Hierarchical LBA Model...")
        print("="*60)
        
        trace, model = fit_hierarchical_lba(df, participants, modalities, ui_modes)
        
        print("\n" + "="*60)
        print("Extracting Results...")
        print("="*60)
        
        # Save Summary
        summary = az.summary(trace, var_names=['t0_mu', 'vc_slope_mu', 'gap_slope_mu', 've_mu', 'vc_base_mu', 'gap_int_mu'])
        print("\nModel Summary:")
        print(summary)
        
        print(f"\nSaving results to {output_dir}...")
        summary.to_csv(output_dir / 'lba_parameters_summary.csv')
        print("  ✓ Saved: lba_parameters_summary.csv")
        
        # Save full trace as netCDF
        trace.to_netcdf(output_dir / 'lba_trace.nc')
        print("  ✓ Saved: lba_trace.nc")
        
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
        print(f"  ✓ Saved: lba_parameters.json")
        
        # Plot
        print("\nGenerating trace plots...")
        try:
            import matplotlib
            matplotlib.use('Agg')  # Non-interactive backend
            import matplotlib.pyplot as plt
            az.plot_trace(trace, var_names=['vc_slope_mu', 'gap_slope_mu', 't0_mu'])
            plt.savefig(output_dir / 'lba_trace_plot.png', dpi=150, bbox_inches='tight')
            plt.close()
            print(f"  ✓ Saved: lba_trace_plot.png")
        except Exception as e:
            print(f"  ⚠ Warning: Could not create trace plot: {e}")
        
        # Save convergence diagnostics
        print("\nComputing convergence diagnostics...")
        try:
            # Get R-hat for key parameters (group-level means and SDs)
            var_names = ['vc_slope_mu', 'gap_slope_mu', 't0_mu', 've_mu', 'vc_base_mu', 'gap_int_mu', 
                        't0_sd', 'A_sd', 'vc_base_sd', 'gap_int_sd']  # Also check SD parameters
            rhat = az.rhat(trace, var_names=var_names)
            
            # Extract R-hat values from Dataset
            print("\nR-hat diagnostics (should be < 1.01, acceptable < 1.05):")
            for var_name in var_names:
                try:
                    # Try to get the value from the Dataset
                    if var_name in rhat.data_vars:
                        rhat_val = float(rhat[var_name].values)
                    elif hasattr(rhat, 'to_dict'):
                        rhat_dict = rhat.to_dict()
                        rhat_val = float(rhat_dict.get('data_vars', {}).get(var_name, {}).get('data', [0])[0])
                    else:
                        # Fallback: try to access directly
                        rhat_val = float(rhat[var_name].values) if var_name in rhat else 999.0
                    
                    status = "✓" if rhat_val < 1.01 else "⚠" if rhat_val < 1.05 else "✗"
                    print(f"  {status} {var_name}: {rhat_val:.3f}")
                except Exception as e:
                    print(f"  ⚠ {var_name}: Could not extract R-hat ({e})")
            
            # Also get ESS (Effective Sample Size) for same parameters
            ess = az.ess(trace, var_names=var_names)
            print("\nESS (Effective Sample Size, should be > 400):")
            for var_name in var_names:
                try:
                    if var_name in ess.data_vars:
                        ess_val = float(ess[var_name].values)
                    else:
                        ess_val = 0.0
                    
                    status = "✓" if ess_val > 400 else "⚠" if ess_val > 100 else "✗"
                    print(f"  {status} {var_name}: {ess_val:.1f}")
                except Exception as e:
                    print(f"  ⚠ {var_name}: Could not extract ESS ({e})")
            
            # Check for convergence issues
            rhat_values = []
            ess_values = []
            for var_name in var_names:
                try:
                    if var_name in rhat.data_vars:
                        rhat_values.append(float(rhat[var_name].values))
                    if var_name in ess.data_vars:
                        ess_values.append(float(ess[var_name].values))
                except:
                    pass
            
            if rhat_values and (max(rhat_values) > 1.05 or min(ess_values) < 100 if ess_values else False):
                print("\n⚠ WARNING: Model convergence issues detected!")
                print("  - High R-hat values indicate poor convergence")
                print("  - Low ESS indicates inefficient sampling")
                print("  - Consider:")
                print("    1. Re-running with current improved settings (target_accept=0.95, max_treedepth=15)")
                print("    2. Running more chains (4+) for better diagnostics")
                print("    3. Reparameterizing the model")
                print("    4. Using simpler priors")
                print("  See analysis/LBA_CONVERGENCE_NOTES.md for details")
            
        except Exception as e:
            print(f"  ⚠ Warning: Could not compute convergence diagnostics: {e}")
            print("  (Results were still saved, but convergence may be poor)")
            import traceback
            traceback.print_exc()
        
        print("\n" + "="*60)
        print("✓ LBA Analysis Complete!")
        print("="*60)
        print(f"\nResults saved to: {output_dir}")
        print(f"  • lba_parameters.json - Parameters by modality and ui_mode")
        print(f"  • lba_parameters_summary.csv - Parameter estimates")
        print(f"  • lba_trace.nc - Full MCMC trace")
        print(f"  • lba_trace_plot.png - Trace plots")
        print("\nYou can now render Report.qmd to see the results in Section 16.")
        print("="*60)
        
    except Exception as e:
        print(f"Fitting Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
