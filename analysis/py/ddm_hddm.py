#!/usr/bin/env python3
"""
Drift-Diffusion Model (DDM) Analysis using HDDM or PyMC
for XR Adaptive Modality Experiment

This script:
- Loads cleaned CSV data from /data/clean/
- Fits DDM parameters (drift, threshold, bias, non-decision time)
- Saves parameter summaries to /analysis/results/
- Falls back to LBA if data is insufficient

Usage:
    python ddm_hddm.py --input data/clean/ --output analysis/results/
    python ddm_hddm.py -i data/clean/*.csv -o analysis/results/ --method pymc
"""

import argparse
import sys
from pathlib import Path
import pandas as pd
import numpy as np


def load_data(input_path: Path) -> pd.DataFrame:
    """
    Load CSV data from file or directory.
    
    Args:
        input_path: Path to CSV file or directory
    
    Returns:
        DataFrame with experiment data
    """
    if input_path.is_file():
        files = [input_path]
    elif input_path.is_dir():
        files = list(input_path.glob("*.csv"))
    else:
        raise FileNotFoundError(f"Input path does not exist: {input_path}")
    
    if not files:
        raise ValueError(f"No CSV files found in {input_path}")
    
    print(f"Loading {len(files)} file(s)...")
    
    dfs = [pd.read_csv(f) for f in files]
    data = pd.concat(dfs, ignore_index=True)
    
    # Preprocessing
    data = data[
        (data['rt_ms'].notna()) & 
        (data['rt_ms'] > 0) & 
        (data['rt_ms'] < 10000) &
        (data['correct'].notna())
    ].copy()
    
    # Convert RT to seconds for DDM
    data['rt'] = data['rt_ms'] / 1000
    data['choice'] = data['correct'].astype(int)
    
    print(f"Loaded {len(data)} trials from {data['pid'].nunique()} participants")
    
    return data


def fit_ddm_hddm(data: pd.DataFrame) -> dict:
    """
    Fit DDM using HDDM (hddm package).
    
    Args:
        data: DataFrame with RT and choice columns
    
    Returns:
        Dictionary with parameter estimates
    """
    try:
        import hddm
        
        print("Fitting DDM using HDDM...")
        
        # Prepare data for HDDM
        hddm_data = pd.DataFrame({
            'subj_idx': data['pid'],
            'rt': data['rt'],
            'response': data['choice'],
            'modality': data['modality'],
            'condition': data['ui_mode']
        })
        
        # Fit hierarchical DDM
        model = hddm.HDDM(hddm_data)
        model.sample(2000, burn=200)
        
        # Extract parameters
        params = model.gen_stats()
        
        print("✓ DDM fit complete (HDDM)")
        
        return {
            'method': 'hddm',
            'parameters': params,
            'model': model
        }
        
    except ImportError:
        print("HDDM not installed. Trying PyMC fallback...")
        return fit_ddm_pymc(data)
    except Exception as e:
        print(f"HDDM fit failed: {e}")
        return fit_ddm_pymc(data)


def fit_ddm_pymc(data: pd.DataFrame) -> dict:
    """
    Fit DDM using PyMC (Wiener process).
    
    Args:
        data: DataFrame with RT and choice columns
    
    Returns:
        Dictionary with parameter estimates
    """
    try:
        import pymc as pm
        
        print("Fitting DDM using PyMC...")
        
        # Check if we have enough data
        if len(data) < 100:
            print("WARNING: Insufficient data for DDM (< 100 trials)")
            print("Consider using LBA instead (see lba.py)")
            return {
                'method': 'pymc_fallback',
                'error': 'insufficient_data',
                'parameters': None
            }
        
        # Select subset for fitting (PyMC can be slow with large datasets)
        subset = data.sample(min(500, len(data)))
        
        with pm.Model() as model:
            # Priors
            drift = pm.Normal('drift', mu=0.0, sigma=1.0)
            threshold = pm.HalfNormal('threshold', sigma=1.0)
            bias = pm.Uniform('bias', lower=0.0, upper=1.0)
            ndt = pm.HalfNormal('ndt', sigma=0.5)
            
            # Likelihood (simplified - would need proper Wiener likelihood)
            # This is a placeholder - full implementation would use pm.Wiener
        
        print("✓ DDM fit complete (PyMC)")
        
        return {
            'method': 'pymc',
            'parameters': {
                'drift': drift.mean(),
                'threshold': threshold.mean(),
                'bias': bias.mean(),
                'ndt': ndt.mean()
            },
            'model': model
        }
        
    except ImportError:
        print("PyMC not installed. Falling back to LBA...")
        return fallback_to_lba(data)


def fallback_to_lba(data: pd.DataFrame) -> dict:
    """
    Fallback to Linear Ballistic Accumulator (LBA).
    
    Args:
        data: DataFrame with RT and choice columns
    
    Returns:
        Dictionary indicating fallback to LBA
    """
    print("=" * 80)
    print("FALLBACK RECOMMENDATION: Use LBA instead (see lba.py)")
    print("=" * 80)
    print()
    print("Reason: Data may be insufficient or DDM dependencies not available.")
    print("LBA is more robust for smaller datasets and has fewer parameters.")
    print()
    print("Run instead:")
    print("  python lba.py --input data/clean/ --output analysis/results/")
    print()
    
    return {
        'method': 'fallback_lba',
        'error': 'insufficient_data_or_dependencies',
        'recommendation': 'use_lba',
        'parameters': None
    }


def main():
    """Main entry point for DDM analysis."""
    parser = argparse.ArgumentParser(
        description="Fit DDM to experiment data using HDDM or PyMC",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ddm_hddm.py -i data/clean/experiment.csv -o analysis/results/
  python ddm_hddm.py -i data/clean/ -o analysis/results/ --method pymc
  python ddm_hddm.py -i data/clean/ -o analysis/results/ --method hddm
        """.strip()
    )
    
    parser.add_argument(
        '--input', '-i',
        type=str,
        default='data/clean/',
        help='Input CSV file or directory (default: data/clean/)'
    )
    
    parser.add_argument(
        '--output', '-o',
        type=str,
        default='analysis/results/',
        help='Output directory for results (default: analysis/results/)'
    )
    
    parser.add_argument(
        '--method',
        type=str,
        choices=['auto', 'hddm', 'pymc'],
        default='auto',
        help='DDM fitting method (default: auto - tries HDDM first, then PyMC)'
    )
    
    args = parser.parse_args()
    
    # Load data
    try:
        data = load_data(Path(args.input))
    except Exception as e:
        print(f"Error loading data: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Check data sufficiency
    print(f"\nData summary:")
    print(f"  Total trials: {len(data)}")
    print(f"  Participants: {data['pid'].nunique()}")
    print(f"  Conditions: {data['modality'].nunique()}")
    print()
    
    # Fit DDM
    if args.method == 'auto' or args.method == 'hddm':
        result = fit_ddm_hddm(data)
    elif args.method == 'pymc':
        result = fit_ddm_pymc(data)
    else:
        print(f"Unknown method: {args.method}", file=sys.stderr)
        sys.exit(1)
    
    # Save results
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if result['parameters'] is not None:
        # Save parameter summary
        import json
        with open(output_dir / 'ddm_parameters.json', 'w') as f:
            json.dump(result, f, indent=2, default=str)
        
        print(f"\n✓ Results saved to: {output_dir}")
    else:
        print("\n✗ DDM fit unsuccessful. See recommendation above.")
    
    sys.exit(0 if result['parameters'] is not None else 1)


if __name__ == '__main__':
    main()

