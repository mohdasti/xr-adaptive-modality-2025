#!/usr/bin/env python3
"""
Replace original CSV files with fixed versions after verification.

This script:
1. Backs up originals to excluded_pressure_bug/ subdirectory
2. Replaces originals with fixed versions
3. Removes _fixed suffix from filenames
"""

import shutil
from pathlib import Path
import sys

AFFECTED_PARTICIPANTS = ['P002', 'P003', 'P007', 'P008', 'P015', 'P039', 'P040']


def main():
    """Replace originals with fixed versions."""
    raw_dir = Path(__file__).parent.parent / 'data' / 'raw'
    
    if len(sys.argv) > 1:
        raw_dir = Path(sys.argv[1])
    
    if not raw_dir.exists():
        print(f"ERROR: Directory not found: {raw_dir}")
        sys.exit(1)
    
    # Create backup directory
    backup_dir = raw_dir / 'excluded_pressure_bug'
    backup_dir.mkdir(exist_ok=True)
    
    print(f"Replacing original files with fixed versions in: {raw_dir}\n")
    print(f"Backup directory: {backup_dir}\n")
    
    replaced = 0
    
    for participant in AFFECTED_PARTICIPANTS:
        # Find fixed file
        fixed_files = list(raw_dir.glob(f"{participant}_*_fixed.csv"))
        
        if not fixed_files:
            print(f"⚠️  {participant}: No fixed file found, skipping")
            continue
        
        fixed_file = fixed_files[0]
        
        # Find corresponding original
        # Remove _fixed and timestamp to find original pattern
        original_pattern = fixed_file.stem.replace('_fixed', '')
        # Try to find original with same timestamp
        original_files = list(raw_dir.glob(f"{participant}_*.csv"))
        original_files = [f for f in original_files if '_fixed' not in f.name and f != fixed_file]
        
        if not original_files:
            print(f"⚠️  {participant}: No original file found, skipping")
            continue
        
        original_file = original_files[0]  # Take first match
        
        # Backup original
        backup_path = backup_dir / original_file.name
        print(f"{participant}:")
        print(f"  Backing up: {original_file.name} -> {backup_path.name}")
        shutil.copy2(original_file, backup_path)
        
        # Replace with fixed (remove _fixed suffix)
        new_name = fixed_file.stem.replace('_fixed', '') + '.csv'
        new_path = raw_dir / new_name
        
        print(f"  Replacing: {original_file.name} -> {new_name}")
        shutil.copy2(fixed_file, new_path)
        
        # Remove old files
        original_file.unlink()
        fixed_file.unlink()
        
        print(f"  ✓ Done\n")
        replaced += 1
    
    print("=" * 60)
    print(f"Summary: {replaced} files replaced")
    print(f"Originals backed up to: {backup_dir}")
    print("\n✓ All fixed files are now the primary files")


if __name__ == '__main__':
    main()





