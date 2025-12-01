# Participant Session Tracking System

## Problem
- Each participant may complete multiple sessions
- Need to track which blocks they've completed across sessions
- Ensure they follow the exact Williams design sequence
- EmailJS free tier has 200 emails/month limit

## Solution: Session-Based Tracking

### Option 1: Master Tracking File (Recommended for Small Studies)

Create a `participant_tracking.csv` file:

```csv
participant_id,session_number,block_number,block_condition,completed,timestamp,data_file
P001,1,1,HaS_P0,true,2025-11-28T10:00:00Z,experiment_P001_session1_block1.csv
P001,1,2,GaS_P0,true,2025-11-28T10:30:00Z,experiment_P001_session1_block2.csv
P001,1,3,HaA_P0,false,,,
P001,2,3,HaA_P0,true,2025-11-29T14:00:00Z,experiment_P001_session2_block3.csv
P001,2,4,GaA_P0,false,,,
P002,1,1,GaS_P0,true,2025-11-28T11:00:00Z,experiment_P002_session1_block1.csv
...
```

**Usage:**
1. Before each session, check which blocks the participant has completed
2. Start them on the next uncompleted block
3. Update the file after each block completion

### Option 2: URL-Based Session Tracking (Automated)

Modify the app to accept session parameters:
```
https://your-experiment.com/?pid=P001&session=2&startBlock=3
```

The app will:
- Load participant's sequence from counterbalancing
- Check which blocks they've completed (from localStorage or server)
- Start them at the correct block
- Track progress automatically

### Option 3: Server-Side Tracking (Best for Production)

Store progress in a database:
- Participant ID
- Session number
- Block number
- Completion status
- Data file location

## Implementation Recommendations

### For Your Current Setup (No Backend):

1. **Create a Master Spreadsheet** (Google Sheets or Excel):
   - Column 1: Participant ID
   - Column 2: Session Number
   - Column 3: Block Number (1-8)
   - Column 4: Block Condition (from Williams design)
   - Column 5: Completed (Y/N)
   - Column 6: Timestamp
   - Column 7: Data File Name

2. **Generate Participant Links with Session Info:**
   ```
   https://exp.com/?pid=P001&session=1
   https://exp.com/?pid=P001&session=2
   ```

3. **Modify App to:**
   - Read session number from URL
   - Track completed blocks in localStorage (per participant)
   - Show progress: "Session 2 of 3, Block 3 of 8"
   - Start at correct block based on previous completions

## Email Submission Strategy

### Current Problem:
- EmailJS free tier: 200 emails/month
- Submitting after each block = 8 emails per participant
- 25 participants = 200 emails (at limit!)

### Recommended Solutions:

#### Option A: Session-Based Submission (Recommended)
**Submit only at end of session, not after each block**

- 1 email per participant per session
- If 3 sessions per participant: 3 emails total
- 25 participants × 3 sessions = 75 emails (well under limit)

**Implementation:**
- Remove auto-submit after each block
- Add "End Session" button that submits all blocks from current session
- Or auto-submit when all 8 blocks are complete

#### Option B: Batch Multiple Blocks in One Email
**Combine all blocks from a session into one email**

- Still 1 email per participant per session
- Email contains CSV data for all blocks completed in that session
- More efficient, easier to process

#### Option C: Upgrade EmailJS or Use Alternative
- EmailJS paid: $15/month for 1,000 emails
- SendGrid: 100 emails/day free (3,000/month)
- Mailgun: 5,000 emails/month free
- Server API: Unlimited (but requires backend)

#### Option D: Local Storage + Manual Submission
- Store data in browser localStorage
- Participant downloads CSV at end of session
- Researcher collects files manually
- No email limits, but more manual work

## Recommended Approach

For your study, I recommend:

1. **Session-Based Submission:**
   - Submit only when participant completes a full session (all 8 blocks)
   - Or submit when they explicitly click "End Session"
   - Reduces emails from 8 per participant to 1 per session

2. **Master Tracking Spreadsheet:**
   - Google Sheets shared with research team
   - Tracks participant progress across sessions
   - Easy to see who needs to come back for session 2, 3, etc.

3. **URL Parameters for Sessions:**
   - `?pid=P001&session=1` - First session
   - `?pid=P001&session=2` - Second session (app knows to start at block 3 if blocks 1-2 completed)

4. **Progress Display:**
   - Show participant: "Session 2, Block 3 of 8"
   - Show which blocks completed: "✓ Blocks 1-2 completed in Session 1"

Would you like me to implement the session-based tracking and submission system?

