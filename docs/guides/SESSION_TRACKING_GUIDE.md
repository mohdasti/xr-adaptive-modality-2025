# Session Tracking & Submission Guide

## Overview

The experiment now supports **multi-session tracking** and **session-based submission** to solve both logistical challenges:

1. ✅ **Tracking participant progress** across multiple sessions
2. ✅ **Reducing email usage** from 200 to ~75 emails (session-based submission)

## ⚠️ IMPORTANT: Deploy First!

**Before generating links, you MUST deploy your app!**

- `localhost:5173` only works on YOUR computer
- Participants need a public URL (e.g., `https://your-project.vercel.app`)
- See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step instructions (same directory)

## How It Works

### Step 0: Deploy Your App

1. Deploy to Vercel/Netlify (see `DEPLOYMENT_GUIDE.md`)
2. Get your production URL: `https://your-project.vercel.app`
3. Add EmailJS environment variables to hosting platform
4. Test that it works

### For Participants

1. **First Visit:**
   - Participant receives link: `https://your-project.vercel.app/?pid=P001&session=1`
   - App automatically loads their counterbalanced sequence
   - Shows progress: "Session 1, Block 1 of 8"

2. **During Session:**
   - Complete blocks in order (automatically tracked)
   - Progress shown: "3 of 8 blocks completed (38%)"
   - After each block, TLX questionnaire appears

3. **End of Session:**
   - Click **"📤 End Session"** button in LoggerPane
   - All data from current session is submitted via email
   - Filename includes session: `experiment_P001_session1_all_blocks.csv`

4. **Return Visit (Session 2):**
   - Participant receives link: `https://your-experiment.com/?pid=P001&session=2`
   - App automatically starts at next uncompleted block
   - Shows: "Session 2, Block 3 of 8 (Blocks 1-2 completed in Session 1)"

### For Researchers

#### 1. Generate Participant Links

```bash
python scripts/generate_participant_links.py \
  --base-url "https://your-experiment.com" \
  --participants 25 \
  --sessions 3 \
  --output participant_links.csv
```

This creates a CSV with all participant links:
```csv
participant_id,session_number,link
P001,1,https://your-experiment.com/?pid=P001&session=1
P001,2,https://your-experiment.com/?pid=P001&session=2
P001,3,https://your-experiment.com/?pid=P001&session=3
P002,1,https://your-experiment.com/?pid=P002&session=1
...
```

#### 2. Track Progress

Use `participant_tracking.csv` (generated earlier) to track:
- Which blocks each participant has completed
- Which session they're on
- What block they need next

**Manual Tracking:**
- Open `participant_tracking.csv` in Google Sheets/Excel
- Mark blocks as completed as participants finish them
- When participant returns, check spreadsheet → give them correct link

**Automatic Tracking:**
- Progress is stored in browser localStorage
- App automatically shows next block when participant returns
- No manual tracking needed (but spreadsheet is still useful for oversight)

#### 3. Receive Data

**Email Submission:**
- 1 email per participant per session
- Filename: `experiment_P001_session1_all_blocks.csv`
- Contains all trials and blocks from that session
- 30 participants × 3 sessions = **90 emails total** (well under 200 limit!)

**Email Content:**
- All CSV data in email body (copy and save as .csv file)
- Includes trial data and block-level TLX data
- Complete data - nothing missing

## Features

### ✅ Automatic Progress Tracking
- Tracks completed blocks in localStorage
- Automatically starts at correct block when participant returns
- Shows progress: "3 of 8 blocks completed (38%)"

### ✅ Session-Based Submission
- Submit only at end of session (not after each block)
- Reduces emails from 200 to 75
- All blocks from session in one email

### ✅ User-Friendly UI
- Clear progress indicators
- Session info displayed prominently
- "End Session" button with confirmation
- Shows which blocks completed

### ✅ Researcher Tools
- Script to generate participant links
- Tracking spreadsheet for oversight
- URL parameters for easy link generation

## Usage Examples

### Example 1: First-Time Participant

1. Researcher generates link: `?pid=P001&session=1`
2. Participant opens link
3. App shows: "Session 1, Block 1 of 8"
4. Participant completes blocks 1-3
5. Participant clicks "End Session" → Data submitted
6. Email received: `experiment_P001_session1_all_blocks.csv`

### Example 2: Returning Participant

1. Researcher checks `participant_tracking.csv` → P001 completed blocks 1-3 in Session 1
2. Researcher generates link: `?pid=P001&session=2`
3. Participant opens link
4. App automatically shows: "Session 2, Block 4 of 8 (Blocks 1-3 completed)"
5. Participant completes blocks 4-6
6. Participant clicks "End Session" → Data submitted
7. Email received: `experiment_P001_session2_all_blocks.csv`

### Example 3: Final Session

1. Participant P001 has completed blocks 1-7
2. Researcher gives link: `?pid=P001&session=3`
3. App shows: "Session 3, Block 8 of 8 (Blocks 1-7 completed)"
4. Participant completes final block
5. Participant clicks "End Session" → Final data submitted
6. Email received: `experiment_P001_session3_all_blocks.csv`
7. Progress shows: "8 of 8 blocks completed (100%) 🎉"

## Email Reduction

**Before (Block-based):**
- 8 emails per participant (1 per block)
- 30 participants = 240 emails (would exceed 200 limit!)
- **At limit!**

**After (Session-based):**
- 1 email per participant per session
- 30 participants × 3 sessions = 90 emails
- **Well under 200 limit!**

## Best Practices

### For Researchers:

1. **Generate links in advance:**
   ```bash
   python scripts/generate_participant_links.py --base-url "YOUR_URL" --participants 30 --sessions 3
   ```

2. **Use tracking spreadsheet:**
   - Mark blocks as completed
   - Track which session each participant is on
   - Know what block they need next

3. **Organize emails:**
   - Create folders: "Session 1", "Session 2", "Session 3"
   - Filenames include session number for easy sorting

### For Participants:

1. **Complete all blocks in a session before leaving**
2. **Click "End Session" when done** (submits all data)
3. **Use the same browser** for all sessions (localStorage persists)
4. **Don't clear browser data** between sessions

## Troubleshooting

**Participant can't continue where they left off?**
- Check if localStorage is enabled
- Verify participant ID matches (P001, not P1)
- Check browser console for errors

**Wrong block number shown?**
- Clear localStorage: `localStorage.clear()` in browser console
- Or manually set: `localStorage.setItem('participant_session_P001', '{"completedBlocks":[1,2,3]}')`

**Email not received?**
- Check spam folder
- Verify EmailJS service is connected
- Check EmailJS dashboard → Email History

**Need to reset a participant's progress?**
- Clear their localStorage entry
- Or use the tracking spreadsheet to manually track

## Next Steps

1. ✅ Generate participant links: `python scripts/generate_participant_links.py`
2. ✅ Share links with participants (one per session)
3. ✅ Track progress in `participant_tracking.csv`
4. ✅ Collect emails as participants complete sessions

The system is now ready for multi-session data collection! 🎉

