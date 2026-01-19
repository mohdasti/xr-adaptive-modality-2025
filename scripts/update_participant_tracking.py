#!/usr/bin/env python3
"""
Update data/participant_tracking.csv with data from raw CSV files.

This script:
1. Scans data/raw/ for *_merged.csv files
2. Extracts participant info and block completion data
3. Updates data/participant_tracking.csv while preserving existing notes

Usage:
    python scripts/update_participant_tracking.py
"""

import pandas as pd
from datetime import datetime
import glob
import os
import sys

def main():
    # Paths
    tracking_file = 'data/participant_tracking.csv'
    raw_dir = 'data/raw'
    
    # Read existing tracking file to preserve notes
    if not os.path.exists(tracking_file):
        print(f"Error: {tracking_file} not found!")
        sys.exit(1)
    
    tracking_df = pd.read_csv(tracking_file)
    print(f"Loaded {len(tracking_df)} participants from {tracking_file}")
    
    # Find all raw CSV files (both naming conventions)
    merged_files = glob.glob(f'{raw_dir}/*_merged.csv')
    experiment_files = glob.glob(f'{raw_dir}/experiment_*.csv')
    raw_files = merged_files + experiment_files
    
    print(f'\nFound {len(raw_files)} raw CSV files:')
    for f in sorted(raw_files):
        print(f'  {os.path.basename(f)}')
    
    if len(raw_files) == 0:
        print(f"\nNo raw CSV files found in {raw_dir}")
        return
    
    # Extract participant info from filenames
    file_info = {}
    for filepath in raw_files:
        filename = os.path.basename(filepath)
        
        # Handle two naming conventions:
        # 1. PXXX_YYYY-MM-DDTHH-MM-SS_merged.csv
        # 2. experiment_PXXX_sessionX_TIMESTAMP.csv
        if filename.endswith('_merged.csv'):
            # Format: PXXX_YYYY-MM-DDTHH-MM-SS_merged.csv
            parts = filename.replace('_merged.csv', '').split('_')
            if len(parts) >= 2:
                pid = parts[0]
                date_str = '_'.join(parts[1:])
                try:
                    # Parse: 2025-12-07T22-11-16
                    file_time = datetime.strptime(date_str, '%Y-%m-%dT%H-%M-%S')
                    file_info[pid] = {
                        'filename': filename,
                        'file_time': file_time
                    }
                except ValueError as e:
                    print(f'Warning: Could not parse date from {filename}: {e}')
        elif filename.startswith('experiment_'):
            # Format: experiment_PXXX_sessionX_TIMESTAMP.csv
            # Extract: experiment_P037_session1_1765340797477.csv
            parts = filename.replace('.csv', '').split('_')
            if len(parts) >= 3 and parts[0] == 'experiment':
                pid = parts[1]  # P037
                timestamp_str = parts[-1]  # 1765340797477 (milliseconds since epoch)
                try:
                    # Convert milliseconds timestamp to datetime
                    timestamp_ms = int(timestamp_str)
                    file_time = datetime.fromtimestamp(timestamp_ms / 1000)
                    file_info[pid] = {
                        'filename': filename,
                        'file_time': file_time
                    }
                except (ValueError, OSError) as e:
                    print(f'Warning: Could not parse timestamp from {filename}: {e}')
    
    print(f'\nExtracted info for {len(file_info)} participants')
    
    # Process each raw file to get block information
    updated_count = 0
    for pid, info in file_info.items():
        filepath = f'{raw_dir}/{info["filename"]}'
        try:
            df = pd.read_csv(filepath)
            
            # Get session number
            session = df['session_number'].iloc[0] if 'session_number' in df.columns else 1
            
            # Count completed blocks
            completed_blocks = df['block_number'].nunique() if 'block_number' in df.columns else 0
            total_blocks = 8
            
            # Get block order sequence
            if 'block_number' in df.columns and 'block_order' in df.columns:
                blocks = df.groupby('block_number')['block_order'].first().tolist()
                block_sequence = ', '.join(blocks) if blocks else ''
            else:
                block_sequence = ''
            
            # Update tracking for this participant
            mask = tracking_df['participant_id'] == pid
            if mask.any():
                # Get existing notes to preserve
                existing_notes = tracking_df.loc[mask, 'notes'].iloc[0]
                
                # Update existing row
                tracking_df.loc[mask, 'session_number'] = session
                tracking_df.loc[mask, 'completed_blocks'] = f'{completed_blocks}/{total_blocks}'
                tracking_df.loc[mask, 'block_sequence'] = block_sequence
                tracking_df.loc[mask, 'status'] = 'Completed' if completed_blocks == total_blocks else 'Partial'
                tracking_df.loc[mask, 'timestamp'] = info['file_time'].strftime('%Y-%m-%d %H:%M:%S')
                tracking_df.loc[mask, 'data_file'] = info['filename']
                # Preserve notes - only update if it was empty
                if pd.isna(existing_notes) or existing_notes == '':
                    # Keep empty if no notes
                    pass
                else:
                    # Keep existing notes
                    tracking_df.loc[mask, 'notes'] = existing_notes
                
                print(f'✓ Updated {pid}: {completed_blocks}/{total_blocks} blocks (notes preserved)')
                updated_count += 1
            else:
                print(f'⚠ Warning: {pid} not found in tracking file - skipping')
        except Exception as e:
            print(f'✗ Error processing {filepath}: {e}')
    
    # Save updated tracking file
    tracking_df.to_csv(tracking_file, index=False)
    print(f'\n✓ Saved updated {tracking_file}')
    print(f'  Updated {updated_count} participants')
    
    # Summary
    completed = tracking_df[tracking_df['status'] == 'Completed']
    partial = tracking_df[tracking_df['status'] == 'Partial']
    not_started = tracking_df[tracking_df['status'] == 'Not started']
    
    print(f'\nSummary:')
    print(f'  Completed: {len(completed)}')
    print(f'  Partial: {len(partial)}')
    print(f'  Not started: {len(not_started)}')
    
    if len(completed) > 0:
        print(f'\nCompleted participants:')
        for _, row in completed.iterrows():
            print(f'  {row["participant_id"]}: {row["notes"] if pd.notna(row["notes"]) else "No notes"}')

if __name__ == '__main__':
    main()






