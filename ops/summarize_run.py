#!/usr/bin/env python3
"""
Summarize experiment data and generate statistics.

This script:
- Counts participants and trials per condition
- Calculates mean/SD reaction times per condition
- Computes error rates and timeout rates
- Outputs formatted summary report

Usage:
    python summarize_run.py --input data/clean/experiment.csv
    python summarize_run.py -i data/clean/ -r > summary.txt
"""

import argparse
import sys
from pathlib import Path
from typing import Dict, List, Any
import pandas as pd
import numpy as np


def load_data(file_path: Path) -> pd.DataFrame:
    """
    Load CSV data from file.
    
    Args:
        file_path: Path to CSV file
    
    Returns:
        DataFrame with experiment data
    """
    try:
        return pd.read_csv(file_path)
    except Exception as e:
        print(f"Error loading {file_path}: {str(e)}", file=sys.stderr)
        raise


def aggregate_data(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Aggregate data and compute statistics.
    
    Args:
        df: DataFrame with experiment data
    
    Returns:
        Dictionary with summary statistics
    """
    summary = {
        'total_participants': df['pid'].nunique(),
        'total_trials': len(df),
        'conditions': {},
        'error_stats': {},
        'timeout_stats': {}
    }
    
    # Group by conditions
    conditions = ['modality', 'ui_mode', 'pressure', 'aging']
    
    # Filter available condition columns
    available_conditions = [col for col in conditions if col in df.columns]
    
    if available_conditions:
        grouped = df.groupby(available_conditions)
        
        for key, group in grouped:
            # Handle tuple keys for multiple conditions
            if isinstance(key, tuple):
                condition_name = ' | '.join([f"{col}={val}" for col, val in zip(available_conditions, key)])
            else:
                condition_name = f"{available_conditions[0]}={key}"
            
            # Calculate statistics
            rt_data = pd.to_numeric(group['rt_ms'], errors='coerce').dropna()
            
            summary['conditions'][condition_name] = {
                'n_participants': group['pid'].nunique(),
                'n_trials': len(group),
                'mean_rt': rt_data.mean() if len(rt_data) > 0 else 0,
                'sd_rt': rt_data.std() if len(rt_data) > 0 else 0,
                'median_rt': rt_data.median() if len(rt_data) > 0 else 0,
                'min_rt': rt_data.min() if len(rt_data) > 0 else 0,
                'max_rt': rt_data.max() if len(rt_data) > 0 else 0,
            }
    
    # Error statistics
    if 'correct' in df.columns:
        df['correct_num'] = pd.to_numeric(df['correct'], errors='coerce')
        error_rate = 1 - df['correct_num'].mean()
        summary['error_stats'] = {
            'overall_error_rate': error_rate,
            'total_errors': int((1 - df['correct_num']) * df['correct_num'].notna()).sum()),
            'total_correct': int(df['correct_num'].sum())
        }
    
    # Timeout statistics
    if 'err_type' in df.columns:
        timeouts = df['err_type'] == 'timeout'
        timeout_rate = timeouts.mean() if len(timeouts) > 0 else 0
        summary['timeout_stats'] = {
            'overall_timeout_rate': timeout_rate,
            'total_timeouts': int(timeouts.sum()),
            'timeout_rate_per_condition': {}
        }
        
        # Timeout rate per condition
        if available_conditions:
            for key, group in grouped:
                group_timeouts = (group['err_type'] == 'timeout').sum()
                group_rate = group_timeouts / len(group) if len(group) > 0 else 0
                
                if isinstance(key, tuple):
                    condition_name = ' | '.join([f"{col}={val}" for col, val in zip(available_conditions, key)])
                else:
                    condition_name = f"{available_conditions[0]}={key}"
                
                summary['timeout_stats']['timeout_rate_per_condition'][condition_name] = group_rate
    
    # TLX statistics (if available)
    if 'tlx_global' in df.columns:
        tlx_data = pd.to_numeric(df['tlx_global'], errors='coerce').dropna()
        if len(tlx_data) > 0:
            summary['tlx_stats'] = {
                'mean_global': tlx_data.mean(),
                'sd_global': tlx_data.std(),
                'mean_mental': 0,
                'sd_mental': 0
            }
            
            if 'tlx_mental' in df.columns:
                mental_data = pd.to_numeric(df['tlx_mental'], errors='coerce').dropna()
                if len(mental_data) > 0:
                    summary['tlx_stats']['mean_mental'] = mental_data.mean()
                    summary['tlx_stats']['sd_mental'] = mental_data.std()
    
    return summary


def format_summary(summary: Dict[str, Any]) -> str:
    """
    Format summary statistics as a readable string.
    
    Args:
        summary: Summary dictionary
    
    Returns:
        Formatted string with summary report
    """
    output = []
    output.append("=" * 80)
    output.append("EXPERIMENT SUMMARY REPORT")
    output.append("=" * 80)
    output.append("")
    
    # Overall statistics
    output.append("Overall Statistics:")
    output.append(f"  Total Participants: {summary['total_participants']}")
    output.append(f"  Total Trials: {summary['total_trials']}")
    output.append("")
    
    # Conditions
    if summary['conditions']:
        output.append("Trials per Condition:")
        for condition, stats in summary['conditions'].items():
            output.append(f"  {condition}:")
            output.append(f"    Participants: {stats['n_participants']}")
            output.append(f"    Trials: {stats['n_trials']}")
            output.append(f"    Mean RT: {stats['mean_rt']:.2f} ms (SD: {stats['sd_rt']:.2f})")
            output.append(f"    Median RT: {stats['median_rt']:.2f} ms")
            output.append(f"    RT Range: {stats['min_rt']:.2f} - {stats['max_rt']:.2f} ms")
            output.append("")
    
    # Error statistics
    if summary['error_stats']:
        output.append("Error Statistics:")
        output.append(f"  Overall Error Rate: {summary['error_stats']['overall_error_rate']:.2%}")
        output.append(f"  Total Errors: {summary['error_stats']['total_errors']}")
        output.append(f"  Total Correct: {summary['error_stats']['total_correct']}")
        output.append("")
    
    # Timeout statistics
    if summary['timeout_stats']:
        output.append("Timeout Statistics:")
        output.append(f"  Overall Timeout Rate: {summary['timeout_stats']['overall_timeout_rate']:.2%}")
        output.append(f"  Total Timeouts: {summary['timeout_stats']['total_timeouts']}")
        
        if summary['timeout_stats']['timeout_rate_per_condition']:
            output.append("  Timeout Rate by Condition:")
            for condition, rate in summary['timeout_stats']['timeout_rate_per_condition'].items():
                output.append(f"    {condition}: {rate:.2%}")
        output.append("")
    
    # TLX statistics
    if 'tlx_stats' in summary:
        output.append("TLX (Workload) Statistics:")
        output.append(f"  Mean Global Workload: {summary['tlx_stats']['mean_global']:.2f} (SD: {summary['tlx_stats']['sd_global']:.2f})")
        output.append(f"  Mean Mental Demand: {summary['tlx_stats']['mean_mental']:.2f} (SD: {summary['tlx_stats']['sd_mental']:.2f})")
        output.append("")
    
    output.append("=" * 80)
    
    return "\n".join(output)


def main():
    """Main entry point for the summarization CLI."""
    parser = argparse.ArgumentParser(
        description="Summarize experiment data and generate statistics",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python summarize_run.py -i data/clean/experiment.csv
  python summarize_run.py -i data/clean/ -r
  python summarize_run.py -i data/clean/*.csv -o summary.txt
        """.strip()
    )
    
    parser.add_argument(
        '--input', '-i',
        type=str,
        required=True,
        help='Input CSV file or directory'
    )
    
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='Output file for summary report (default: stdout)'
    )
    
    parser.add_argument(
        '--recursive', '-r',
        action='store_true',
        help='Process all CSV files in directory recursively'
    )
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    all_results = []
    
    # Collect files
    if input_path.is_file():
        files = [input_path]
    elif input_path.is_dir():
        if args.recursive:
            files = list(input_path.rglob("*.csv"))
        else:
            files = list(input_path.glob("*.csv"))
    else:
        print(f"Error: Input path does not exist: {input_path}", file=sys.stderr)
        sys.exit(1)
    
    if not files:
        print(f"No CSV files found in {input_path}", file=sys.stderr)
        sys.exit(1)
    
    # Process each file
    for file_path in files:
        print(f"Processing: {file_path.name}", file=sys.stderr)
        
        try:
            df = load_data(file_path)
            summary = aggregate_data(df)
            formatted = format_summary(summary)
            all_results.append(formatted)
        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}", file=sys.stderr)
            continue
    
    # Output results
    output = "\n\n".join(all_results)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"Summary written to: {args.output}", file=sys.stderr)
    else:
        print(output)
    
    sys.exit(0)


if __name__ == '__main__':
    main()

