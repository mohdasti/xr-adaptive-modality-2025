# Data Collection Strategy: Multi-Session Tracking & Email Optimization

## Your Questions Answered

### 1. Tracking Participant Sessions & Williams Design Order

**Problem:** Ensure participant 14 (or any participant) follows exact order across multiple sessions.

**Best Solution: Master Tracking Spreadsheet + URL Parameters**

#### Step 1: Generate Tracking Spreadsheet
```bash
python scripts/generate_participant_tracking.py --participants 25 --sessions 3 --output participant_tracking.csv
```

This creates a CSV with:
- Participant ID (P001, P002, etc.)
- Session number (1, 2, 3)
- Block number (1-8)
- Block condition (from Williams design)
- Completion status (you fill in as they complete)
- Data file name

#### Step 2: Use URL Parameters for Sessions
Generate links like:
```
https://your-experiment.com/?pid=P001&session=1
https://your-experiment.com/?pid=P001&session=2
https://your-experiment.com/?pid=P001&session=3
```

The app will:
- Load participant's sequence from Williams design
- Check localStorage for completed blocks
- Start at the correct block for that session
- Track progress automatically

#### Step 3: Manual Tracking (Recommended for Now)
- Open `participant_tracking.csv` in Google Sheets/Excel
- As participant P001 completes Block 1 in Session 1, mark it complete
- When they return for Session 2, check spreadsheet → they need Block 3 next
- Give them link: `?pid=P001&session=2&startBlock=3`

**Alternative: Automated Server-Side Tracking** (requires backend)
- Store progress in database
- App queries server for next block
- Automatic, but needs infrastructure

---

### 2. Email Submission Strategy (200/month limit)

**Current Problem:**
- EmailJS free: 200 emails/month
- You're at 198 already
- Submitting after each block = 8 emails per participant
- 25 participants = 200 emails (exactly at limit!)

**Best Solution: Session-Based Submission**

#### Option A: Submit Only at End of Session (Recommended)

**Change:** Submit when participant completes a full session, not after each block.

**Benefits:**
- 1 email per participant per session (vs 8 per participant)
- 25 participants × 3 sessions = **75 emails total** (well under limit!)
- All blocks from session in one email (easier to process)
- Participant clicks "End Session" button when done

**Implementation:**
- Remove auto-submit after each block completion
- Add "End Session" button in LoggerPane
- Submit all blocks from current session in one email
- Email filename: `experiment_P001_session2_all_blocks.csv`

#### Option B: Batch All Blocks in One Email

**Change:** Submit only when all 8 blocks complete (entire experiment done).

**Benefits:**
- 1 email per participant total (vs 8 per participant)
- 25 participants = **25 emails total**
- Simplest approach

**Downside:**
- If participant doesn't finish, you lose all data
- No intermediate backups

#### Option C: Upgrade EmailJS

**Cost:** $15/month for 1,000 emails
- Allows 8 emails per participant
- 25 participants × 3 sessions × 8 blocks = 600 emails
- Well within 1,000 limit

#### Option D: Use Alternative Service

**SendGrid:** 100 emails/day free (3,000/month)
- Free tier sufficient for your needs
- Similar setup to EmailJS

**Mailgun:** 5,000 emails/month free
- More generous free tier
- Requires more setup

#### Option E: Server-Side API (Best Long-Term)

**Benefits:**
- Unlimited submissions
- No email limits
- Better organization
- Automatic file storage
- Can add validation/processing

**Requires:**
- Backend server (Node.js, Python, etc.)
- Database or file storage
- ~4-6 hours to implement

---

## My Recommendation

### For Your Current Setup (No Backend):

1. **Use Session-Based Submission (Option A)**
   - Submit at end of each session (not after each block)
   - Reduces emails from 200 to ~75
   - Still get data regularly
   - Easy to implement

2. **Use Master Tracking Spreadsheet**
   - Generate with Python script
   - Track manually in Google Sheets
   - Share with research team
   - Simple, no infrastructure needed

3. **URL Parameters for Sessions**
   - `?pid=P001&session=1` - First session
   - `?pid=P001&session=2` - Second session
   - App tracks progress automatically

### Implementation Priority:

**Phase 1 (Quick Fix - Do Now):**
1. Change submission to session-based (remove block auto-submit)
2. Add "End Session" button
3. Generate tracking spreadsheet

**Phase 2 (Better Tracking - Next Week):**
1. Add URL parameter parsing for sessions
2. Add localStorage progress tracking
3. Show "Session X, Block Y" in UI

**Phase 3 (Production - If Needed):**
1. Set up server-side API
2. Automated progress tracking
3. Unlimited submissions

---

## Quick Implementation

Would you like me to:
1. ✅ Modify submission to be session-based (remove block auto-submit, add "End Session" button)?
2. ✅ Add session tracking from URL parameters?
3. ✅ Generate the tracking spreadsheet script (already created)?

This will solve both your problems:
- ✅ Proper session tracking
- ✅ Email limit solved (75 emails vs 200)

Let me know and I'll implement it!

