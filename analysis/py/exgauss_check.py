#!/usr/bin/env python3
"""
Ex-Gaussian Check for RT Distribution Tails
for XR Adaptive Modality Experiment

This script:
- Loads cleaned CSV data from /data/clean/
- Fits ex-Gaussian distribution to RT data: RT ~ N(μ, σ) + Expon(τ)
- Inspects distribution tails (long RTs)
- Generates plots to visualize fit

Usage:
    python exgauss_check.py --input data/clean/ --output analysis/figures/
    python exgauss_check.py -i data/clean/*.csv -o analysis/figures/ --condition modality
"""

import argparse
import sys
from pathlib import Path
import pandas as pd
import numpy as np


def load_data(input_path: Path) -> pd.DataFrame:
    """Load and preprocess data."""
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
        (data['rt_ms'] < 10000)
    ].copy()
    
    # Convert to seconds
    data['rt'] = data['rt_ms'] / 1000
    
    # Filter correct trials only
    data = data[
        (data['correct'] == True) | 
        (data['correct'] == "True") | 
        (data['correct'] == 1)
    ]
    
    print(f"Loaded {len(data)} correct trials from {data['pid'].nunique()} participants")
    
    return data


def fit_exgauss_moments(data: pd.DataFrame) -> dict:
    """
    Fit ex-Gaussian using method of moments.
    
    Ex-Gaussian: RT ~ N(μ, σ) + Expon(τ)
    where μ and σ are Gaussian parameters, τ is exponential parameter
    
    Args:
        data: DataFrame with RT column
    
    Returns:
        Dictionary with ex-Gaussian parameters
    """
    rt = data['rt'].values
    
    # Method of moments estimation
    mean_rt = np.mean(rt)
    var_rt = np.var(rt)
    skew_rt = np.mean(((rt - mean_rt) / np.std(rt)) ** 3)  # Skewness
    
    # Estimate parameters
    # For ex-Gaussian: E[RT] = μ + τ, Var[RT] = σ² + τ², Skew[RT] = 2τ³/(σ²+τ²)^(3/2)
    
    # Initial estimates
    tau_est = np.sqrt(max(0, var_rt * (skew_rt / 2)))
    sigma_est = np.sqrt(max(0, var_rt - tau_est ** 2))
    mu_est = mean_rt - tau_est
    
    params = {
        'mu': mu_est,
        'sigma': sigma_est,
        'tau': tau_est,
        'mean_rt': mean_rt,
        'var_rt': var_rt,
        'skew_rt': skew_rt
    }
    
    return params


def plot_exgauss_fit(data: pd.DataFrame, params: dict, output_path: Path):
    """
    Plot ex-Gaussian fit and distribution.
    
    Args:
        data: DataFrame with RT data
        params: Dictionary with ex-Gaussian parameters
        output_path: Path to save plot
    """
    try:
        import matplotlib.pyplot as plt
        from scipy import stats
        
        rt = data['rt'].values
        
        # Create figure
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle('Ex-Gaussian Fit to RT Distribution', fontsize=14, fontweight='bold')
        
        # 1. Histogram with ex-Gaussian curve
        ax1 = axes[0, 0]
        ax1.hist(rt, bins=50, density=True, alpha=0.7, color='skyblue', edgecolor='black')
        
        # Plot ex-Gaussian curve (approximate)
        x = np.linspace(rt.min(), rt.max(), 200)
        # Note: Full implementation would use scipy.stats.exgaussian
        # This is a simplified visualization
        ax1.plot(x, stats.norm.pdf(x, params['mu'], params['sigma']), 
                'r-', linewidth=2, label=f"μ={params['mu']:.3f}, σ={params['sigma']:.3f}, τ={params['tau']:.3f}")
        ax1.set_xlabel('Reaction Time (s)')
        ax1.set_ylabel('Density')
        ax1.set_title('Distribution with Ex-Gaussian Fit')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # 2. Q-Q plot
        ax2 = axes[0, 1]
        stats.probplot(rt, dist=stats.norm, plot=ax2)
        ax2.set_title('Q-Q Plot (Normal)')
        ax2.grid(True, alpha=0.3)
        
        # 3. Tail inspection (upper tail)
        ax3 = axes[1, 0]
        tail_threshold = np.percentile(rt, 90)
        tail_data = rt[rt > tail_threshold]
        ax3.hist(tail_data, bins=20, color='coral', edgecolor='black')
        ax3.axvline(np.percentile(rt, 95), color='r', linestyle='--', label='95th percentile')
        ax3.axvline(np.percentile(rt, 99), color='darkred', linestyle='--', label='99th percentile')
        ax3.set_xlabel('Reaction Time (s)')
        ax3.set_ylabel('Count')
        ax3.set_title(f'Upper Tail (>90th percentile): {len(tail_data)} trials')
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        # 4. Summary statistics
        ax4 = axes[1, 1]
        ax4.axis('off')
        summary_text = f"""
Ex-Gaussian Parameters:
  μ (Gaussian mean): {params['mu']:.3f} s
  σ (Gaussian std): {params['sigma']:.3f} s
  τ (Exponential rate): {params['tau']:.3f} s

RT Statistics:
  Mean: {params['mean_rt']:.3f} s
  Variance: {params['var_rt']:.3f} s²
  Skewness: {params['skew_rt']:.2f}

Tail Analysis:
  90th percentile: {np.percentile(rt, 90):.3f} s
  95th percentile: {np.percentile(rt, 95):.3f} s
  99th percentile: {np.percentile(rt, 99):.3f} s
  Max: {rt.max():.3f} s
        """
        ax4.text(0.1, 0.5, summary_text, fontfamily='monospace', 
                fontsize=9, verticalalignment='center')
        
        plt.tight_layout()
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        print(f"✓ Plot saved to: {output_path}")
        
    except ImportError:
        print("Matplotlib not available. Skipping plot generation.")
    except Exception as e:
        print(f"Error generating plot: {e}")


def main():
    """Main entry point for ex-Gaussian check."""
    parser = argparse.ArgumentParser(
        description="Fit ex-Gaussian distribution to RT data and inspect tails",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python exgauss_check.py -i data/clean/experiment.csv -o analysis/figures/
  python exgauss_check.py -i data/clean/ -o analysis/figures/ --condition modality
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
        default='analysis/figures/',
        help='Output directory for plots (default: analysis/figures/)'
    )
    
    parser.add_argument(
        '--condition',
        type=str,
        help='Variable to stratify by (e.g., modality, ui_mode)'
    )
    
    args = parser.parse_args()
    
    # Load data
    try:
        data = load_data(Path(args.input))
    except Exception as e:
        print(f"Error loading data: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Fit ex-Gaussian
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if args.condition and args.condition in data.columns:
        print(f"\nFitting ex-Gaussian by condition: {args.condition}")
        
        for condition_value in data[args.condition].unique():
            condition_data = data[data[args.condition] == condition_value]
            params = fit_exgauss_moments(condition_data)
            
            print(f"\n{args.condition} = {condition_value}:")
            print(f"  μ={params['mu']:.3f}, σ={params['sigma']:.3f}, τ={params['tau']:.3f}")
            
            # Plot for each condition
            plot_path = output_dir / f'exgauss_{args.condition}_{condition_value}.png'
            plot_exgauss_fit(condition_data, params, plot_path)
    else:
        print("\nFitting ex-Gaussian to all data...")
        params = fit_exgauss_moments(data)
        
        print(f"\nEx-Gaussian parameters:")
        print(f"  μ={params['mu']:.3f}, σ={params['sigma']:.3f}, τ={params['tau']:.3f}")
        
        # Plot overall
        plot_path = output_dir / 'exgauss_overall.png'
        plot_exgauss_fit(data, params, plot_path)
        
        # Save parameters
        import json
        with open(output_dir / 'exgauss_parameters.json', 'w') as f:
            json.dump(params, f, indent=2, default=str)
    
    print(f"\n✓ Analysis complete. Results saved to: {output_dir}")
    sys.exit(0)


if __name__ == '__main__':
    main()

