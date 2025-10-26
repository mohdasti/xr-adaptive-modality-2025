#!/usr/bin/env python3
"""
Anonymize CSV data from /data/raw and write to /data/clean.

This script:
- Hashes participant IDs (SHA256 with salt)
- Removes any user agent or IP address columns
- Preserves all other trial data
- Writes anonymized CSVs to output directory

Usage:
    python anonymize_cli.py --input data/raw --output data/clean
    python anonymize_cli.py -i data/raw -o data/clean --salt my-salt-string
"""

import argparse
import hashlib
import os
import sys
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd


def hash_pid(pid: str, salt: str = "xr-adaptive-modality-2025") -> str:
    """
    Hash a participant ID using SHA256 with salt.
    
    Args:
        pid: Participant ID to hash
        salt: Salt string for hashing (default: project name)
    
    Returns:
        Hashed participant ID (hex digest)
    """
    return hashlib.sha256(f"{pid}{salt}".encode()).hexdigest()


def anonymize_csv(
    input_path: Path,
    output_path: Path,
    salt: str,
    columns_to_drop: List[str] = None
) -> bool:
    """
    Anonymize a single CSV file.
    
    Args:
        input_path: Path to input CSV file
        output_path: Path to output CSV file
        salt: Salt string for hashing
        columns_to_drop: List of column names to drop
    
    Returns:
        True if successful, False otherwise
    """
    if columns_to_drop is None:
        columns_to_drop = ['user_agent', 'ip_address', 'ua', 'ip', 'ip_addr']
    
    try:
        # Read CSV
        df = pd.read_csv(input_path)
        
        # Check if 'pid' column exists
        if 'pid' not in df.columns:
            print(f"Warning: No 'pid' column found in {input_path.name}")
            return False
        
        # Hash participant IDs
        df['pid'] = df['pid'].apply(lambda x: hash_pid(str(x), salt))
        
        # Drop sensitive columns
        columns_to_drop = [col for col in columns_to_drop if col in df.columns]
        if columns_to_drop:
            df = df.drop(columns=columns_to_drop)
            print(f"  Dropped columns: {', '.join(columns_to_drop)}")
        
        # Write anonymized CSV
        output_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(output_path, index=False)
        
        print(f"✓ Anonymized {input_path.name} → {output_path.name}")
        return True
        
    except Exception as e:
        print(f"✗ Error processing {input_path.name}: {str(e)}", file=sys.stderr)
        return False


def find_csv_files(directory: Path) -> List[Path]:
    """
    Find all CSV files in a directory.
    
    Args:
        directory: Directory to search
    
    Returns:
        List of CSV file paths
    """
    return list(directory.glob("*.csv"))


def anonymize_directory(
    input_dir: Path,
    output_dir: Path,
    salt: str
) -> int:
    """
    Anonymize all CSV files in input directory.
    
    Args:
        input_dir: Input directory containing CSV files
        output_dir: Output directory for anonymized files
        salt: Salt string for hashing
    
    Returns:
        Number of files successfully processed
    """
    if not input_dir.exists():
        print(f"Error: Input directory does not exist: {input_dir}", file=sys.stderr)
        return 0
    
    csv_files = find_csv_files(input_dir)
    
    if not csv_files:
        print(f"No CSV files found in {input_dir}", file=sys.stderr)
        return 0
    
    print(f"Found {len(csv_files)} CSV file(s) in {input_dir}")
    print(f"Salt: {salt}")
    print()
    
    success_count = 0
    
    for csv_file in csv_files:
        output_file = output_dir / csv_file.name
        if anonymize_csv(csv_file, output_file, salt):
            success_count += 1
    
    print()
    print(f"Successfully anonymized {success_count}/{len(csv_files)} file(s)")
    
    return success_count


def main():
    """Main entry point for the anonymization CLI."""
    parser = argparse.ArgumentParser(
        description="Anonymize CSV data from raw to clean directory",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python anonymize_cli.py -i data/raw -o data/clean
  python anonymize_cli.py --input data/raw --output data/clean --salt my-custom-salt
  python anonymize_cli.py -i data/raw -o data/clean --drop-columns user_agent ip_address
        """.strip()
    )
    
    parser.add_argument(
        '--input', '-i',
        type=str,
        default='data/raw',
        help='Input directory containing raw CSV files (default: data/raw)'
    )
    
    parser.add_argument(
        '--output', '-o',
        type=str,
        default='data/clean',
        help='Output directory for anonymized CSV files (default: data/clean)'
    )
    
    parser.add_argument(
        '--salt',
        type=str,
        default='xr-adaptive-modality-2025',
        help='Salt string for hashing participant IDs (default: project name)'
    )
    
    parser.add_argument(
        '--drop-columns',
        nargs='+',
        default=['user_agent', 'ip_address', 'ua', 'ip', 'ip_addr'],
        help='Columns to drop from CSV files (default: user_agent, ip_address, etc.)'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    input_dir = Path(args.input)
    output_dir = Path(args.output)
    
    if not input_dir.exists():
        print(f"Error: Input directory does not exist: {input_dir}", file=sys.stderr)
        sys.exit(1)
    
    # Process files
    count = anonymize_directory(input_dir, output_dir, args.salt)
    
    if count == 0:
        print("No files were processed. Check input directory and file permissions.", file=sys.stderr)
        sys.exit(1)
    
    print(f"\n✓ Anonymization complete. Output written to: {output_dir}")
    sys.exit(0)


if __name__ == '__main__':
    main()

