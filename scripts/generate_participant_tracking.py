#!/usr/bin/env python3
"""
Generate participant tracking spreadsheet for single-session study

This script creates a CSV file that tracks:
- Participant ID
- Session number (always 1 for single-session design)
- Block number and condition (all 8 blocks in one session)
- Completion status
- Data file names

Usage:
    python scripts/generate_participant_tracking.py --participants 25 --output participant_tracking.csv
"""

import argparse
import csv
from typing import List, Tuple

# Williams design sequences (8 conditions)
# Each participant index (0-99) maps to one of these sequences
WILLIAMS_SEQUENCES = [
    ['HaS_P0', 'GaS_P0', 'HaA_P0', 'GaA_P0', 'HaS_P1', 'GaS_P1', 'HaA_P1', 'GaA_P1'],
    ['GaS_P0', 'HaA_P0', 'GaA_P0', 'HaS_P0', 'GaS_P1', 'HaA_P1', 'GaA_P1', 'HaS_P1'],
    ['HaA_P0', 'GaA_P0', 'HaS_P0', 'GaS_P0', 'HaA_P1', 'GaA_P1', 'HaS_P1', 'GaS_P1'],
    ['GaA_P0', 'HaS_P0', 'GaS_P0', 'HaA_P0', 'GaA_P1', 'HaS_P1', 'GaS_P1', 'HaA_P1'],
    ['HaS_P1', 'GaS_P1', 'HaA_P1', 'GaA_P1', 'HaS_P0', 'GaS_P0', 'HaA_P0', 'GaA_P0'],
    ['GaS_P1', 'HaA_P1', 'GaA_P1', 'HaS_P1', 'GaS_P0', 'HaA_P0', 'GaA_P0', 'HaS_P0'],
    ['HaA_P1', 'GaA_P1', 'HaS_P1', 'GaS_P1', 'HaA_P0', 'GaA_P0', 'HaS_P0', 'GaS_P0'],
    ['GaA_P1', 'HaS_P1', 'GaS_P1', 'HaA_P1', 'GaA_P0', 'HaS_P0', 'GaS_P0', 'HaA_P0'],
]

def get_sequence_for_participant(participant_index: int) -> List[str]:
    """Get Williams design sequence for a participant index (0-99)"""
    sequence_index = participant_index % len(WILLIAMS_SEQUENCES)
    return WILLIAMS_SEQUENCES[sequence_index]

def generate_tracking_data(
    num_participants: int
) -> List[Tuple[str, int, int, str]]:
    """
    Generate tracking data for all participants in single-session design
    
    All 8 blocks are assigned to session_number = 1 for environmental consistency.
    
    Returns list of (participant_id, session_number, block_number, block_condition)
    """
    data = []
    
    for participant_idx in range(num_participants):
        participant_id = f"P{participant_idx + 1:03d}"  # P001, P002, etc.
        sequence = get_sequence_for_participant(participant_idx)
        
        # Assign all 8 blocks to session_number = 1
        session_number = 1
        
        for block_counter, block_condition in enumerate(sequence, start=1):
            data.append((
                participant_id,
                session_number,
                block_counter,
                block_condition
            ))
    
    return data

def write_tracking_csv(data: List[Tuple], output_file: str):
    """Write tracking data to CSV file"""
    headers = [
        'participant_id',
        'session_number',
        'block_number',
        'block_condition',
        'completed',
        'timestamp',
        'data_file',
        'notes'
    ]
    
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for row in data:
            # Add empty columns for completion tracking
            writer.writerow(list(row) + ['', '', '', ''])

def main():
    parser = argparse.ArgumentParser(
        description='Generate participant tracking spreadsheet for single-session study'
    )
    parser.add_argument(
        '--participants',
        type=int,
        default=25,
        help='Number of participants (default: 25)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='participant_tracking.csv',
        help='Output CSV file (default: participant_tracking.csv)'
    )
    
    args = parser.parse_args()
    
    print(f"Generating tracking data for {args.participants} participants...")
    print(f"  Design: Single session (all 8 blocks in session 1)")
    print(f"  Total blocks per participant: 8 (Williams design)")
    
    data = generate_tracking_data(args.participants)
    
    write_tracking_csv(data, args.output)
    
    print(f"\n✓ Generated {len(data)} rows")
    print(f"✓ Saved to: {args.output}")
    print(f"\nNext steps:")
    print(f"  1. Open {args.output} in Excel/Google Sheets")
    print(f"  2. Mark blocks as completed as participants finish them")
    print(f"  3. Use this file to track which blocks each participant needs to complete")

if __name__ == '__main__':
    main()


