#!/usr/bin/env python3
"""
Merge all raw participant CSV files from data/raw/ into a single cleaned dataset.

This script:
- Reads all CSV files from data/raw/
- Combines them into a single dataset
- Handles column mismatches and data cleaning
- Writes aggregated data to data/clean/trial_data.csv
- Optionally anonymizes participant IDs

Dependencies:
    pip install pandas

Usage:
    python scripts/merge_raw_data.py
    python scripts/merge_raw_data.py --anonymize
    python scripts/merge_raw_data.py --output data/clean/trial_data.csv

See docs/guides/DATA_PROCESSING.md for detailed instructions.
"""

import argparse
import sys
from pathlib import Path
import pandas as pd
import hashlib

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

def hash_pid(pid: str, salt: str = "xr-adaptive-modality-2025") -> str:
    """Hash participant ID using SHA256 with salt."""
    return hashlib.sha256(f"{pid}{salt}".encode()).hexdigest()

def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names to handle variations."""
    # Common column name mappings
    column_mapping = {
        'participant_id': 'participant_id',
        'pid': 'participant_id',
        'rt_ms': 'rt_ms',
        'movement_time_ms': 'rt_ms',
        'correct': 'correct',
        'error': 'error',
    }
    
    # Rename columns if they exist
    rename_dict = {}
    for old_name, new_name in column_mapping.items():
        if old_name in df.columns and new_name not in df.columns:
            rename_dict[old_name] = new_name
    
    if rename_dict:
        df = df.rename(columns=rename_dict)
    
    return df

def merge_raw_data(
    input_dir: Path = None,
    output_file: Path = None,
    anonymize: bool = False,
    salt: str = "xr-adaptive-modality-2025"
) -> None:
    """
    Merge all raw CSV files into a single cleaned dataset.
    
    Args:
        input_dir: Directory containing raw CSV files (default: data/raw/)
        output_file: Output file path (default: data/clean/trial_data.csv)
        anonymize: Whether to hash participant IDs
        salt: Salt string for hashing (if anonymize=True)
    """
    if input_dir is None:
        input_dir = PROJECT_ROOT / "data" / "raw"
    if output_file is None:
        output_file = PROJECT_ROOT / "data" / "clean" / "trial_data.csv"
    
    # Check if input directory exists
    if not input_dir.exists():
        print(f"Error: Input directory does not exist: {input_dir}", file=sys.stderr)
        print(f"  Create the directory and add raw participant CSV files there.", file=sys.stderr)
        sys.exit(1)
    
    # Find all CSV files
    csv_files = list(input_dir.glob("*.csv"))
    
    if not csv_files:
        print(f"Warning: No CSV files found in {input_dir}", file=sys.stderr)
        print(f"  Add participant CSV files to {input_dir} and run again.", file=sys.stderr)
        sys.exit(1)
    
    print(f"Found {len(csv_files)} CSV file(s) in {input_dir}")
    print()
    
    # Read and combine all CSV files
    all_dataframes = []
    
    for csv_file in sorted(csv_files):
        print(f"Reading: {csv_file.name}")
        try:
            df = pd.read_csv(csv_file)
            
            # Normalize column names
            df = normalize_column_names(df)
            
            # Anonymize participant IDs if requested
            if anonymize:
                if 'participant_id' in df.columns:
                    df['participant_id'] = df['participant_id'].apply(
                        lambda x: hash_pid(str(x), salt)
                    )
                    print(f"  ✓ Anonymized participant IDs")
                elif 'pid' in df.columns:
                    df['pid'] = df['pid'].apply(lambda x: hash_pid(str(x), salt))
                    if 'participant_id' not in df.columns:
                        df['participant_id'] = df['pid']
                    print(f"  ✓ Anonymized participant IDs")
            
            # Add source file info (optional, for debugging)
            df['source_file'] = csv_file.name
            
            all_dataframes.append(df)
            print(f"  ✓ Loaded {len(df)} rows, {len(df.columns)} columns")
            
        except Exception as e:
            print(f"  ✗ Error reading {csv_file.name}: {e}", file=sys.stderr)
            continue
    
    if not all_dataframes:
        print("Error: No data was successfully loaded.", file=sys.stderr)
        sys.exit(1)
    
    # Combine all dataframes
    print()
    print("Merging dataframes...")
    try:
        # Use outer join to handle different columns across files
        merged_df = pd.concat(all_dataframes, ignore_index=True, sort=False)
        print(f"✓ Merged into {len(merged_df)} total rows, {len(merged_df.columns)} columns")
    except Exception as e:
        print(f"✗ Error merging dataframes: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Data cleaning
    print()
    print("Cleaning data...")
    
    # Remove source_file column if it exists (internal use only)
    if 'source_file' in merged_df.columns:
        merged_df = merged_df.drop(columns=['source_file'])
    
    # Handle duplicate columns (if any)
    merged_df = merged_df.loc[:, ~merged_df.columns.duplicated()]
    
    # Sort by participant_id and trial_number if available
    sort_columns = []
    if 'participant_id' in merged_df.columns:
        sort_columns.append('participant_id')
    if 'trial_number' in merged_df.columns:
        sort_columns.append('trial_number')
    elif 'trial' in merged_df.columns:
        sort_columns.append('trial')
    
    if sort_columns:
        merged_df = merged_df.sort_values(by=sort_columns, na_position='last')
    
    # Write to output file
    output_file.parent.mkdir(parents=True, exist_ok=True)
    merged_df.to_csv(output_file, index=False)
    
    print(f"✓ Data written to: {output_file}")
    print()
    print("Summary:")
    print(f"  Total rows: {len(merged_df)}")
    print(f"  Total columns: {len(merged_df.columns)}")
    if 'participant_id' in merged_df.columns:
        n_participants = merged_df['participant_id'].nunique()
        print(f"  Participants: {n_participants}")
    print()
    print("Next steps:")
    print(f"  1. Review the merged data: {output_file}")
    print(f"  2. Run analysis scripts (they read from data/clean/trial_data.csv)")
    print(f"  3. Example: Rscript analysis/02_models.R")

def main():
    parser = argparse.ArgumentParser(
        description="Merge raw participant CSV files into aggregated cleaned dataset",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/merge_raw_data.py
  python scripts/merge_raw_data.py --anonymize
  python scripts/merge_raw_data.py --input data/raw --output data/clean/trial_data.csv
        """.strip()
    )
    
    parser.add_argument(
        '--input', '-i',
        type=str,
        default=None,
        help='Input directory with raw CSV files (default: data/raw/)'
    )
    
    parser.add_argument(
        '--output', '-o',
        type=str,
        default=None,
        help='Output file path (default: data/clean/trial_data.csv)'
    )
    
    parser.add_argument(
        '--anonymize', '-a',
        action='store_true',
        help='Anonymize participant IDs using SHA256 hashing'
    )
    
    parser.add_argument(
        '--salt',
        type=str,
        default='xr-adaptive-modality-2025',
        help='Salt string for hashing (default: project name)'
    )
    
    args = parser.parse_args()
    
    input_dir = Path(args.input) if args.input else None
    output_file = Path(args.output) if args.output else None
    
    merge_raw_data(
        input_dir=input_dir,
        output_file=output_file,
        anonymize=args.anonymize,
        salt=args.salt
    )

if __name__ == '__main__':
    main()

