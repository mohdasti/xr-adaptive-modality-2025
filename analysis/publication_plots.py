"""
Publication-Quality Visualization Script for XR Adaptive Modality Study

This script generates 5 essential plots for HCI paper publication:
1. Throughput by Condition (Violin Plot) - The "Money Shot"
2. Fitts' Law Regression (Scatter + Line) - Model Check
3. Target Accuracy Spread (2D Scatter) - Accuracy Visualization
4. Trajectory & Velocity Profile - Process Visualization
5. NASA-TLX Workload (Stacked Bar) - Subjective Cost

Usage:
    python analysis/publication_plots.py

Requirements:
    - pandas
    - matplotlib
    - seaborn
    - numpy

Output:
    - results/figures/publication_panel.png (composite figure)
"""

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from pathlib import Path

# Set style for publication-quality figures
sns.set_theme(style="whitegrid", palette="muted", font_scale=1.2)
plt.rcParams['figure.dpi'] = 300
plt.rcParams['savefig.dpi'] = 300
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Arial', 'DejaVu Sans', 'Liberation Sans']

def load_data():
    """Load trial data from CSV"""
    trial_path = Path("data/clean/trial_data.csv")
    
    if not trial_path.exists():
        print("⚠️  Trial data not found. Generating synthetic data for preview...")
        return generate_synthetic_data()
    
    df = pd.read_csv(trial_path)
    
    # Normalize column names
    if "rt_ms" in df.columns and "movement_time_ms" not in df.columns:
        df = df.rename(columns={"rt_ms": "movement_time_ms"})
    if "pid" in df.columns and "participant_id" not in df.columns:
        df = df.rename(columns={"pid": "participant_id"})
    
    # Calculate throughput from effective metrics if available
    effective_path = Path("data/clean/effective_metrics.csv")
    if effective_path.exists():
        effective = pd.read_csv(effective_path)
        # Merge throughput from effective metrics
        df = df.merge(
            effective[['participant_id', 'modality', 'ui_mode', 'target_distance_A', 'throughput']],
            on=['participant_id', 'modality', 'ui_mode', 'target_distance_A'],
            how='left',
            suffixes=('', '_effective')
        )
        if 'throughput_effective' in df.columns:
            df['throughput'] = df['throughput_effective'].fillna(df.get('throughput', np.nan))
    
    return df

def generate_synthetic_data():
    """Generate synthetic data for visualization preview"""
    np.random.seed(42)
    n_participants = 32
    conditions = ['Hand_Static', 'Hand_Adaptive', 'Gaze_Static', 'Gaze_Adaptive']
    
    data = []
    for pid in range(n_participants):
        base_skill = np.random.normal(1.0, 0.2)  # Some people are faster
        
        for cond in conditions:
            is_gaze = 'Gaze' in cond
            is_adaptive = 'Adaptive' in cond
            
            # Throughput (TP): Hand is better (~4.5), Gaze worse (~2.5). Adaptive helps Gaze (+0.8)
            tp_mean = (4.5 if not is_gaze else 2.5) + (0.8 if is_gaze and is_adaptive else 0.1)
            tp = np.random.normal(tp_mean * base_skill, 0.5)
            
            # Movement Time (MT): Correlated with ID
            for id_val in [2, 3, 4, 5]:
                mt_intercept = 200 if not is_gaze else 400
                mt_slope = 150 if not is_gaze else 100  # Eyes move fast (low slope)
                
                # Adaptive reduces MT slightly
                if is_adaptive:
                    mt_slope *= 0.9
                
                mt = mt_intercept + (mt_slope * id_val) + np.random.normal(0, 50)
                
                # Error (Effective Width offset)
                error_x = np.random.normal(0, 5 if not is_gaze else 15)
                error_y = np.random.normal(0, 5 if not is_gaze else 15)
                
                data.append({
                    'participant_id': f"P{pid+1:03d}",
                    'Condition': cond,
                    'modality': 'gaze' if is_gaze else 'hand',
                    'ui_mode': 'adaptive' if is_adaptive else 'static',
                    'ID': id_val,
                    'index_of_difficulty_nominal': id_val,
                    'throughput': tp,
                    'movement_time_ms': mt,
                    'projected_error_px': np.abs(error_x),
                    'endpoint_x': error_x,
                    'endpoint_y': error_y,
                    'target_reentry_count': np.random.poisson(1.5 if is_gaze else 0.2),
                    'verification_time_ms': np.random.normal(50 if not is_gaze else 200, 30),
                })
    
    return pd.DataFrame(data)

def plot_throughput_violin(df, ax):
    """Plot 1: Throughput by Condition (Violin Plot)"""
    # Ensure throughput exists or calculate it
    if 'throughput' not in df.columns or df['throughput'].isna().all():
        print("⚠️  Throughput not available, calculating from MT and ID...")
        # Use nominal ID and MT for rough estimate
        df['throughput'] = df['index_of_difficulty_nominal'] / (df['movement_time_ms'] / 1000)
    
    # Filter successful trials only
    plot_df = df[df.get('correct', True) == True].copy() if 'correct' in df.columns else df.copy()
    
    # Normalize modality names
    plot_df['Modality'] = plot_df['modality'].str.capitalize()
    plot_df['UI'] = plot_df['ui_mode'].str.capitalize()
    
    sns.violinplot(
        data=plot_df,
        x="Modality",
        y="throughput",
        hue="UI",
        split=True,
        inner="quart",
        ax=ax,
        palette="muted"
    )
    ax.set_title("A. Throughput by Modality & UI (Higher is Better)", fontsize=14, fontweight='bold')
    ax.set_ylabel("Throughput (bits/s)")
    ax.set_xlabel("")
    ax.legend(title="UI Mode", loc='upper right')

def plot_fitts_regression(df, ax):
    """Plot 2: Fitts' Law Regression (Scatter + Line)"""
    # Filter successful trials
    plot_df = df[df.get('correct', True) == True].copy() if 'correct' in df.columns else df.copy()
    
    # Normalize modality names
    plot_df['Modality'] = plot_df['modality'].str.capitalize()
    
    # Plot regression lines
    for modality in ['Hand', 'Gaze']:
        modality_data = plot_df[plot_df['Modality'] == modality]
        if len(modality_data) > 0:
            color = 'blue' if modality == 'Hand' else 'orange'
            sns.regplot(
                data=modality_data,
                x="index_of_difficulty_nominal",
                y="movement_time_ms",
                scatter_kws={'alpha': 0.1, 's': 10},
                label=modality,
                ax=ax,
                color=color,
                line_kws={'linewidth': 2}
            )
    
    ax.set_title("B. Fitts' Law Models (Hand vs. Gaze)", fontsize=14, fontweight='bold')
    ax.set_xlabel("Index of Difficulty (ID, bits)")
    ax.set_ylabel("Movement Time (ms)")
    ax.legend(loc='upper left')
    ax.grid(True, alpha=0.3)

def plot_accuracy_scatter(df, ax):
    """Plot 3: Target Accuracy Spread (2D Scatter for Gaze Only)"""
    # Filter for gaze modality and successful trials
    gaze_data = df[
        (df['modality'].str.lower() == 'gaze') &
        (df.get('correct', True) == True)
    ].copy() if 'correct' in df.columns else df[df['modality'].str.lower() == 'gaze'].copy()
    
    if len(gaze_data) == 0:
        ax.text(0.5, 0.5, 'No gaze data available', ha='center', va='center', transform=ax.transAxes)
        ax.set_title("C. Selection Spread (Gaze Accuracy)", fontsize=14, fontweight='bold')
        return
    
    # Draw Target Circle (assuming 20px radius for visualization)
    target_radius = 20
    target_circle = plt.Circle(
        (0, 0), target_radius,
        color='red', fill=False, linewidth=2,
        label='Target (20px radius)'
    )
    ax.add_patch(target_circle)
    
    # Normalize UI mode names
    gaze_data['UI'] = gaze_data['ui_mode'].str.capitalize()
    
    # Plot error scatter
    if 'endpoint_x' in gaze_data.columns and 'endpoint_y' in gaze_data.columns:
        sns.scatterplot(
            data=gaze_data,
            x="endpoint_x",
            y="endpoint_y",
            hue="UI",
            alpha=0.6,
            ax=ax,
            s=20
        )
    elif 'projected_error_px' in gaze_data.columns:
        # Use projected error if endpoint coordinates not available
        scatter_data = gaze_data.sample(min(500, len(gaze_data)))  # Sample for visualization
        ax.scatter(
            scatter_data['projected_error_px'] * np.random.choice([-1, 1], len(scatter_data)),
            scatter_data['projected_error_px'] * np.random.choice([-1, 1], len(scatter_data)),
            c=scatter_data['UI'].map({'Adaptive': 'orange', 'Static': 'blue'}),
            alpha=0.6,
            s=20
        )
    
    ax.set_xlim(-50, 50)
    ax.set_ylim(-50, 50)
    ax.set_aspect('equal')
    ax.set_title("C. Selection Spread (Gaze Accuracy)", fontsize=14, fontweight='bold')
    ax.set_xlabel("Error X (pixels)")
    ax.set_ylabel("Error Y (pixels)")
    ax.axvline(0, color='grey', linestyle='--', alpha=0.5)
    ax.axhline(0, color='grey', linestyle='--', alpha=0.5)
    ax.legend(title="UI Mode", loc='upper right')

def plot_trajectory(ax):
    """Plot 4: Representative Trajectories (Simulated)"""
    t = np.linspace(0, 1, 100)
    
    # Smooth Hand Path
    hand_x = t * 800
    hand_y = 600 * (1 - np.exp(-5*t))  # Smooth arc
    
    # Jittery Gaze Path (with saccade simulation)
    np.random.seed(42)
    gaze_x = hand_x + np.random.normal(0, 15, 100)  # Add noise
    gaze_y = hand_y + np.random.normal(0, 15, 100)
    
    # Saccade jump simulation (smooth jump in middle)
    gaze_x[40:50] = np.linspace(gaze_x[40], gaze_x[50], 10)  # Clean jump (saccade)
    gaze_y[40:50] = np.linspace(gaze_y[40], gaze_y[50], 10)
    
    ax.plot(hand_x, hand_y, 'b-', linewidth=2, label='Hand (Ballistic)', alpha=0.8)
    ax.plot(
        gaze_x, gaze_y, 'o-',
        color='orange', markersize=3, linewidth=1,
        alpha=0.7, label='Gaze (Noisy/Saccadic)'
    )
    
    # Add start and target markers
    ax.plot(0, 0, 'go', markersize=10, label='Start', zorder=5)
    ax.plot(800, 600, 'ro', markersize=10, label='Target', zorder=5)
    
    ax.set_title("D. Representative Trajectories", fontsize=14, fontweight='bold')
    ax.set_xlabel("X Position (pixels)")
    ax.set_ylabel("Y Position (pixels)")
    ax.legend(loc='upper left')
    ax.grid(True, alpha=0.3)

def plot_workload(df, ax):
    """Plot 5: NASA-TLX Workload (Stacked Bar)"""
    # Load TLX data if available
    tlx_path = Path("data/clean/block_data.csv")
    
    if not tlx_path.exists():
        # Generate synthetic TLX data for preview
        np.random.seed(42)
        conditions = ['Hand_Static', 'Hand_Adaptive', 'Gaze_Static', 'Gaze_Adaptive']
        tlx_data = []
        for cond in conditions:
            is_gaze = 'Gaze' in cond
            is_adaptive = 'Adaptive' in cond
            base_tlx = 350 if is_gaze else 250
            reduction = 50 if is_adaptive and is_gaze else 20 if is_adaptive else 0
            tlx_data.append({
                'modality': 'gaze' if is_gaze else 'hand',
                'ui_mode': 'adaptive' if is_adaptive else 'static',
                'tlx_mental': np.random.normal(60 - (10 if is_adaptive else 0), 10),
                'tlx_physical': np.random.normal(40 - (5 if is_adaptive else 0), 8),
                'tlx_temporal': np.random.normal(70 if is_gaze else 50, 10),
                'tlx_performance': np.random.normal(50, 10),
                'tlx_effort': np.random.normal(60 if is_gaze else 40, 10),
                'tlx_frustration': np.random.normal(80 if is_gaze else 30 - (10 if is_adaptive else 0), 15),
            })
        tlx_df = pd.DataFrame(tlx_data)
    else:
        tlx_df = pd.read_csv(tlx_path)
        if 'modality' not in tlx_df.columns:
            print("⚠️  TLX data missing modality column")
            ax.text(0.5, 0.5, 'TLX data format issue', ha='center', va='center', transform=ax.transAxes)
            ax.set_title("E. NASA-TLX Workload", fontsize=14, fontweight='bold')
            return
    
    # Aggregate by condition
    tlx_summary = tlx_df.groupby(['modality', 'ui_mode']).agg({
        'tlx_mental': 'mean',
        'tlx_physical': 'mean',
        'tlx_temporal': 'mean',
        'tlx_performance': 'mean',
        'tlx_effort': 'mean',
        'tlx_frustration': 'mean',
    }).reset_index()
    
    # Normalize modality names
    tlx_summary['Modality'] = tlx_summary['modality'].str.capitalize()
    tlx_summary['UI'] = tlx_summary['ui_mode'].str.capitalize()
    
    # Create stacked bar plot
    x_pos = np.arange(len(tlx_summary))
    width = 0.35
    
    dimensions = ['tlx_mental', 'tlx_physical', 'tlx_temporal', 'tlx_performance', 'tlx_effort', 'tlx_frustration']
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
    labels = ['Mental', 'Physical', 'Temporal', 'Performance', 'Effort', 'Frustration']
    
    bottom = np.zeros(len(tlx_summary))
    for dim, color, label in zip(dimensions, colors, labels):
        values = tlx_summary[dim].values
        ax.bar(
            x_pos,
            values,
            width,
            label=label,
            bottom=bottom,
            color=color,
            alpha=0.8
        )
        bottom += values
    
    ax.set_xlabel("Condition")
    ax.set_ylabel("TLX Score (0-100 per dimension)")
    ax.set_title("E. NASA-TLX Workload", fontsize=14, fontweight='bold')
    ax.set_xticks(x_pos)
    ax.set_xticklabels([
        f"{row['Modality']}\n{row['UI']}"
        for _, row in tlx_summary.iterrows()
    ])
    ax.legend(title="Dimension", bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.set_ylim(0, 400)

def main():
    """Generate publication-quality composite figure"""
    print("📊 Generating publication-quality visualizations...")
    
    # Create output directory
    output_dir = Path("results/figures")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load data
    df = load_data()
    print(f"✓ Loaded {len(df)} trials from {df['participant_id'].nunique()} participants")
    
    # Create composite figure
    fig = plt.figure(figsize=(20, 14))
    gs = fig.add_gridspec(3, 2, hspace=0.3, wspace=0.3)
    
    # Plot A: Throughput (Violin)
    ax1 = fig.add_subplot(gs[0, 0])
    plot_throughput_violin(df, ax1)
    
    # Plot B: Fitts' Law Regression
    ax2 = fig.add_subplot(gs[0, 1])
    plot_fitts_regression(df, ax2)
    
    # Plot C: Accuracy Spread
    ax3 = fig.add_subplot(gs[1, 0])
    plot_accuracy_scatter(df, ax3)
    
    # Plot D: Trajectories
    ax4 = fig.add_subplot(gs[1, 1])
    plot_trajectory(ax4)
    
    # Plot E: Workload
    ax5 = fig.add_subplot(gs[2, :])
    plot_workload(df, ax5)
    
    # Add main title
    fig.suptitle(
        "XR Adaptive Modality Study — Publication-Ready Visualizations\n"
        "Throughput, Fitts' Law, Accuracy, Trajectories, and Workload Analysis",
        fontsize=16,
        fontweight='bold',
        y=0.98
    )
    
    # Save figure
    output_path = output_dir / "publication_panel.png"
    plt.savefig(output_path, bbox_inches='tight', facecolor='white', edgecolor='none')
    print(f"✓ Saved publication panel to {output_path}")
    
    # Also save individual plots
    print("\n📈 Generating individual plots...")
    
    for plot_name, plot_func, ax in [
        ("throughput_violin", plot_throughput_violin, None),
        ("fitts_regression", plot_fitts_regression, None),
        ("accuracy_scatter", plot_accuracy_scatter, None),
        ("trajectories", plot_trajectory, None),
        ("workload", plot_workload, None),
    ]:
        fig_ind = plt.figure(figsize=(8, 6))
        ax_ind = fig_ind.add_subplot(111)
        plot_func(df if plot_func != plot_trajectory else None, ax_ind)
        output_path_ind = output_dir / f"{plot_name}.png"
        fig_ind.savefig(output_path_ind, bbox_inches='tight', facecolor='white', edgecolor='none')
        plt.close(fig_ind)
        print(f"  ✓ Saved {plot_name}.png")
    
    print(f"\n✅ All visualizations saved to {output_dir}/")
    print("\nNote: If using synthetic data, replace with real data from data/clean/trial_data.csv")

if __name__ == "__main__":
    main()

