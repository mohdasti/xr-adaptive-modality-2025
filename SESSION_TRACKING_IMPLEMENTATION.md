# Session-Based Tracking & Submission Implementation

## Solution Overview

### Problem 1: Multi-Session Tracking
**Solution:** URL-based session tracking + localStorage progress

### Problem 2: Email Limits (200/month)
**Solution:** Submit only at end of session, not after each block

## Implementation Plan

### 1. Session Tracking
- Read `?pid=P001&session=2` from URL
- Store completed blocks in localStorage: `participant_P001_blocks: [1,2,5,6]`
- Show progress: "Session 2, Block 3 of 8 (Blocks 1-2 completed in Session 1)"
- Start at correct block based on previous completions

### 2. Session-Based Submission
- Remove auto-submit after each block
- Add "End Session" button
- Submit all blocks from current session in one email
- Or auto-submit when all 8 blocks complete

### 3. Master Tracking Spreadsheet
- Use `scripts/generate_participant_tracking.py` to generate CSV
- Manually update as participants complete blocks
- Or automate with server-side tracking

## Email Reduction

**Current:** 8 emails per participant (1 per block)
**New:** 1 email per participant per session

**Example:**
- 25 participants × 3 sessions = 75 emails (vs 600 emails)
- Well under 200/month limit!

## Next Steps

1. Implement session tracking in app
2. Change submission to session-based
3. Generate tracking spreadsheet
4. Test with a few participants

