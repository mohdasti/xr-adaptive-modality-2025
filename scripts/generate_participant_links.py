#!/usr/bin/env python3
"""
Generate participant-specific links for single-session study

This script creates a CSV file with one unique link per participant (session 1).

⚠️ IMPORTANT: You must deploy your app first! Localhost won't work for remote participants.
   See docs/guides/DEPLOYMENT_GUIDE.md for instructions.

Usage:
    # After deploying to Vercel/Netlify, use your production URL:
    python scripts/generate_participant_links.py \
      --base-url "https://your-project.vercel.app" \
      --participants 25 \
      --output participant_links.csv
    
    # For localhost testing (only works on your machine):
    python scripts/generate_participant_links.py \
      --base-url "http://localhost:5173" \
      --participants 25
"""

import argparse
import csv

def generate_links(base_url: str, num_participants: int) -> list:
    """Generate one unique link per participant for single-session design"""
    links = []
    
    for participant_idx in range(num_participants):
        participant_id = f"P{participant_idx + 1:03d}"  # P001, P002, etc.
        
        # Single session: all 8 blocks completed in one sitting
        session_number = 1
        
        # Link to /intro to start the proper flow: Intro -> Demographics -> SystemCheck -> Calibration -> Task -> Debrief
        link = f"{base_url}/intro?pid={participant_id}&session={session_number}"
        links.append({
            'participant_id': participant_id,
            'session_number': session_number,
            'link': link,
        })
    
    return links

def main():
    parser = argparse.ArgumentParser(
        description='Generate participant-specific links for single-session study'
    )
    parser.add_argument(
        '--base-url',
        type=str,
        required=True,
        help='Base URL of your experiment (e.g., https://your-experiment.com)'
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
        default='participant_links.csv',
        help='Output CSV file (default: participant_links.csv)'
    )
    
    args = parser.parse_args()
    
    print(f"Generating links for {args.participants} participants...")
    print(f"  Design: Single session (all 8 blocks in one sitting)")
    print(f"  Base URL: {args.base_url}")
    
    links = generate_links(args.base_url, args.participants)
    
    # Write to CSV
    with open(args.output, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['participant_id', 'session_number', 'link'])
        writer.writeheader()
        writer.writerows(links)
    
    print(f"\n✓ Generated {len(links)} links (one per participant)")
    print(f"✓ Saved to: {args.output}")
    print(f"\nExample links:")
    for link in links[:3]:
        print(f"  {link['participant_id']}: {link['link']}")
    if len(links) > 3:
        print(f"  ... and {len(links) - 3} more")

if __name__ == '__main__':
    main()

