#!/usr/bin/env python3
"""
Fix pressure logging bug in affected participant CSVs.

The bug: pressure was always logged as 1, regardless of actual condition.
The solution: Extract correct pressure from block_order condition code.

Affected participants: P002, P003, P007, P008, P015, P039, P040
"""

import csv
import sys
from pathlib import Path
from typing import Dict, List

AFFECTED_PARTICIPANTS = ['P002', 'P003', 'P007', 'P008', 'P015', 'P039', 'P040']


def extract_pressure_from_block_order(block_order: str) -> int:
    """
    Extract pressure value from block_order condition code.
    
    Examples:
        "HaA_P0" -> 0
        "GaS_P1" -> 1
        "HaS_P0" -> 0
    """
    if not block_order or '_P' not in block_order:
        return None
    
    # Extract the pressure suffix (P0 or P1)
    pressure_str = block_order.split('_P')[-1]
    try:
        return int(pressure_str)
    except ValueError:
        return None


def fix_pressure_in_csv(input_path: Path, output_path: Path = None) -> Dict[str, int]:
    """
    Fix pressure values in a CSV file by extracting from block_order.
    
    Returns:
        Dictionary with statistics: {'fixed': count, 'unchanged': count, 'errors': count}
    """
    if output_path is None:
        output_path = input_path.parent / f"{input_path.stem}_fixed.csv"
    
    stats = {'fixed': 0, 'unchanged': 0, 'errors': 0, 'total': 0}
    
    with open(input_path, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        # Ensure we have the required columns
        if 'block_order' not in fieldnames:
            print(f"ERROR: {input_path.name} missing 'block_order' column")
            return stats
        
        if 'pressure' not in fieldnames:
            print(f"ERROR: {input_path.name} missing 'pressure' column")
            return stats
        
        rows = []
        for row in reader:
            stats['total'] += 1
            block_order = row.get('block_order', '').strip()
            current_pressure = row.get('pressure', '').strip()
            
            # Extract correct pressure from block_order
            correct_pressure = extract_pressure_from_block_order(block_order)
            
            if correct_pressure is None:
                stats['errors'] += 1
                print(f"  WARNING: Row {stats['total']}: Could not extract pressure from block_order '{block_order}'")
                rows.append(row)
                continue
            
            # Update pressure field
            old_pressure = current_pressure
            row['pressure'] = str(correct_pressure)
            
            # Also update cond_pressure if it exists (for consistency)
            if 'cond_pressure' in row:
                row['cond_pressure'] = str(correct_pressure)
            
            if old_pressure != str(correct_pressure):
                stats['fixed'] += 1
            else:
                stats['unchanged'] += 1
            
            rows.append(row)
    
    # Write corrected CSV
    with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    return stats


def main():
    """Main function to fix all affected participant CSVs."""
    # Default to data/raw directory
    raw_dir = Path(__file__).parent.parent / 'data' / 'raw'
    
    if len(sys.argv) > 1:
        raw_dir = Path(sys.argv[1])
    
    if not raw_dir.exists():
        print(f"ERROR: Directory not found: {raw_dir}")
        sys.exit(1)
    
    print(f"Fixing pressure bug in CSVs from: {raw_dir}\n")
    print(f"Affected participants: {', '.join(AFFECTED_PARTICIPANTS)}\n")
    
    # Find all CSV files for affected participants
    fixed_count = 0
    total_stats = {'fixed': 0, 'unchanged': 0, 'errors': 0, 'total': 0}
    
    for csv_file in sorted(raw_dir.glob('*.csv')):
        # Check if this file is for an affected participant
        participant_id = csv_file.stem.split('_')[0]
        
        if participant_id not in AFFECTED_PARTICIPANTS:
            continue
        
        print(f"Processing: {csv_file.name}")
        
        # Create fixed version
        fixed_file = csv_file.parent / f"{csv_file.stem}_fixed.csv"
        stats = fix_pressure_in_csv(csv_file, fixed_file)
        
        print(f"  Total rows: {stats['total']}")
        print(f"  Fixed: {stats['fixed']}")
        print(f"  Unchanged: {stats['unchanged']}")
        if stats['errors'] > 0:
            print(f"  Errors: {stats['errors']}")
        print(f"  Output: {fixed_file.name}\n")
        
        # Accumulate stats
        for key in total_stats:
            total_stats[key] += stats[key]
        
        fixed_count += 1
    
    print("=" * 60)
    print(f"Summary:")
    print(f"  Files processed: {fixed_count}")
    print(f"  Total rows: {total_stats['total']}")
    print(f"  Rows fixed: {total_stats['fixed']}")
    print(f"  Rows unchanged: {total_stats['unchanged']}")
    if total_stats['errors'] > 0:
        print(f"  Errors: {total_stats['errors']}")
    print("\nFixed files have '_fixed' suffix. Review before replacing originals.")


if __name__ == '__main__':
    main()









