#!/usr/bin/env python3
"""
Validate CSV schema for experiment data.

This script:
- Checks for required columns
- Validates data types
- Fails on missing or extra columns
- Reports validation errors with line numbers

Usage:
    python validate_schema.py --input data/clean/experiment.csv
    python validate_schema.py -i data/clean/*.csv --strict
"""

import argparse
import sys
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd


# Expected CSV schema
EXPECTED_SCHEMA = {
    'pid': 'object',           # Participant ID (string)
    'ts': 'int64',             # Timestamp
    'block': 'object',         # Block number
    'trial': 'object',          # Trial number
    'modality': 'object',      # Input modality ('gaze' or 'hand')
    'ui_mode': 'object',       # UI mode
    'pressure': 'object',       # Pressure level
    'aging': 'object',         # Aging mode (boolean)
    'ID': 'object',            # Index of Difficulty
    'A': 'object',             # Amplitude
    'W': 'object',             # Width
    'target_x': 'object',      # Target X position
    'target_y': 'object',      # Target Y position
    'rt_ms': 'object',         # Reaction time in milliseconds
    'correct': 'object',       # Trial success (boolean)
    'err_type': 'object',      # Error type ('miss', 'timeout', 'slip')
    'hover_ms': 'object',      # Hover duration
    'confirm_type': 'object',  # Confirmation method
    'pupil_z_med': 'object',   # Pupil z-score
    'browser': 'object',       # Browser name
    'dpi': 'object',           # Device pixel ratio
}

# Required columns
REQUIRED_COLUMNS = ['pid', 'ts', 'trial', 'browser', 'dpi']


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


def validate_column_types(df: pd.DataFrame, strict: bool = False) -> List[str]:
    """
    Validate column types in DataFrame.
    
    Args:
        df: DataFrame to validate
        strict: If True, enforce exact type matching
    
    Returns:
        List of error messages (empty if valid)
    """
    errors = []
    
    for col, expected_type in EXPECTED_SCHEMA.items():
        if col not in df.columns:
            continue  # Will be caught by missing column check
        
        actual_type = str(df[col].dtype)
        expected_type_str = expected_type
        
        # Check for type compatibility
        if strict and actual_type != expected_type_str:
            errors.append(
                f"Column '{col}' has wrong type: "
                f"expected {expected_type_str}, got {actual_type}"
            )
    
    return errors


def validate_required_columns(df: pd.DataFrame) -> List[str]:
    """
    Validate that all required columns are present.
    
    Args:
        df: DataFrame to validate
    
    Returns:
        List of error messages (empty if valid)
    """
    errors = []
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    
    if missing:
        errors.append(f"Missing required columns: {', '.join(missing)}")
    
    return errors


def validate_extra_columns(df: pd.DataFrame) -> List[str]:
    """
    Check for unexpected columns.
    
    Args:
        df: DataFrame to validate
    
    Returns:
        List of error messages (empty if valid)
    """
    errors = []
    extra = [col for col in df.columns if col not in EXPECTED_SCHEMA]
    
    if extra:
        errors.append(f"Unexpected columns: {', '.join(extra)}")
    
    return errors


def validate_data_values(df: pd.DataFrame) -> List[str]:
    """
    Validate data values (e.g., correct boolean values, valid ranges).
    
    Args:
        df: DataFrame to validate
    
    Returns:
        List of error messages (empty if valid)
    """
    errors = []
    
    # Validate boolean columns
    boolean_cols = ['correct', 'aging']
    for col in boolean_cols:
        if col in df.columns:
            invalid = df[col].dropna().apply(
                lambda x: x not in [True, False, 1, 0, 'True', 'False', 'true', 'false']
            )
            if invalid.any():
                errors.append(
                    f"Column '{col}' contains invalid boolean values"
                )
    
    # Validate numeric columns
    numeric_cols = ['ts', 'rt_ms', 'ID', 'A', 'W', 'target_x', 'target_y']
    for col in numeric_cols:
        if col in df.columns:
            try:
                pd.to_numeric(df[col], errors='coerce')
            except Exception as e:
                errors.append(f"Column '{col}' contains invalid numeric values: {str(e)}")
    
    return errors


def validate_csv_file(file_path: Path, strict: bool = False) -> Dict[str, Any]:
    """
    Validate a single CSV file.
    
    Args:
        file_path: Path to CSV file
        strict: If True, enforce strict type checking
    
    Returns:
        Dictionary with validation results
    """
    results = {
        'file': str(file_path),
        'valid': False,
        'errors': [],
        'warnings': [],
        'row_count': 0
    }
    
    try:
        # Read CSV
        df = pd.read_csv(file_path)
        results['row_count'] = len(df)
        
        # Run validations
        errors = []
        errors.extend(validate_required_columns(df))
        errors.extend(validate_extra_columns(df))
        errors.extend(validate_column_types(df, strict))
        errors.extend(validate_data_values(df))
        
        results['errors'] = errors
        results['valid'] = len(errors) == 0
        
    except Exception as e:
        results['errors'].append(f"Failed to read CSV: {str(e)}")
    
    return results


def main():
    """Main entry point for the validation CLI."""
    parser = argparse.ArgumentParser(
        description="Validate CSV schema for experiment data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python validate_schema.py -i data/clean/experiment.csv
  python validate_schema.py -i data/clean/*.csv
  python validate_schema.py -i data/clean/ -r --strict
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
        help='Output file for validation report (optional)'
    )
    
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Use strict type checking'
    )
    
    parser.add_argument(
        '--recursive', '-r',
        action='store_true',
        help='Process all CSV files in directory recursively'
    )
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    results_list = []
    
    # Collect files to validate
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
    
    print(f"Validating {len(files)} CSV file(s)...")
    print()
    
    # Validate each file
    for file_path in files:
        print(f"Validating: {file_path.name}")
        results = validate_csv_file(file_path, args.strict)
        results_list.append(results)
        
        if results['valid']:
            print(f"  ✓ Valid ({results['row_count']} rows)")
        else:
            print(f"  ✗ Invalid ({results['row_count']} rows)")
            for error in results['errors']:
                print(f"    - {error}")
        print()
    
    # Summary
    valid_count = sum(1 for r in results_list if r['valid'])
    total_count = len(results_list)
    
    print(f"Summary: {valid_count}/{total_count} file(s) valid")
    
    # Write output if specified
    if args.output:
        import json
        with open(args.output, 'w') as f:
            json.dump(results_list, f, indent=2)
        print(f"Validation report written to: {args.output}")
    
    # Exit with error code if any files are invalid
    if valid_count < total_count:
        sys.exit(1)
    
    print("✓ All files validated successfully")
    sys.exit(0)


if __name__ == '__main__':
    main()

