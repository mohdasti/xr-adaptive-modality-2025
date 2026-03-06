#!/usr/bin/env python3
"""
Regenerate LBA trace plot from existing lba_trace.nc.

Use this to update the figure (e.g., fix labels, spacing) without re-running MCMC.
Requires outputs/LBA/lba_trace.nc to exist (run full LBA analysis first, or copy from GCP).

Usage:
    python3 scripts/regenerate_lba_trace_plot.py
    python3 scripts/regenerate_lba_trace_plot.py --trace outputs/LBA/lba_trace.nc --output outputs/LBA/
"""

import argparse
from pathlib import Path

import arviz as az
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from arviz.labels import MapLabeller


def main():
    parser = argparse.ArgumentParser(description='Regenerate LBA trace plot from existing trace')
    parser.add_argument('--trace', type=str, default='outputs/LBA/lba_trace.nc',
                        help='Path to lba_trace.nc')
    parser.add_argument('--output', '-o', type=str, default='outputs/LBA/',
                        help='Output directory for lba_trace_plot.png')
    args = parser.parse_args()

    trace_path = Path(args.trace)
    output_dir = Path(args.output)
    if not trace_path.exists():
        print(f"Error: Trace file not found: {trace_path}")
        print("Run the full LBA analysis first, or copy lba_trace.nc from GCP.")
        return 1

    print(f"Loading trace from {trace_path}...")
    trace = az.from_netcdf(trace_path)

    labeller = MapLabeller(var_name_map={
        'vc_slope_mu': 'Drift Rate Slope (ID)',
        'gap_slope_mu': 'Threshold Slope (Pressure)',
        't0_mu': 'Non-Decision Time',
    })

    # Distinct colors for chains/conditions (colorblind-friendly)
    plt.rcParams['axes.prop_cycle'] = plt.cycler(
        color=['#0173b2', '#de8f05', '#029e73', '#cc78bc', '#ca9161', '#fbafe4', '#949494', '#ece133']
    )

    print("Generating trace plot...")
    az.plot_trace(
        trace,
        var_names=['vc_slope_mu', 'gap_slope_mu', 't0_mu'],
        labeller=labeller,
        compact=True,
    )
    fig = plt.gcf()
    fig.subplots_adjust(hspace=0.5, wspace=0.3)

    # Identical parameter range per row: density x-axis and trace y-axis aligned
    axes = fig.get_axes()
    for i, var in enumerate(['vc_slope_mu', 'gap_slope_mu', 't0_mu']):
        vals = trace.posterior[var].values.flatten()
        vmin, vmax = float(vals.min()), float(vals.max())
        pad = 0.1 * (vmax - vmin) or 0.1
        lim = (vmin - pad, vmax + pad)
        axes[i * 2].set_xlim(lim)      # density: param on x-axis
        axes[i * 2 + 1].set_ylim(lim)  # trace: param on y-axis

    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / 'lba_trace_plot.png'
    plt.savefig(out_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"✓ Saved: {out_path}")
    return 0


if __name__ == '__main__':
    exit(main())
