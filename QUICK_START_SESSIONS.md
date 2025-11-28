# Quick Start: Multi-Session Data Collection

## For Researchers

### Step 0: Deploy Your App First! ⚠️

**IMPORTANT:** You must deploy before participants can access it!

1. **Deploy to Vercel (recommended):**
   ```bash
   cd app
   npm run build
   npm install -g vercel
   vercel
   ```
   - Follow prompts
   - Get your URL: `https://your-project.vercel.app`

2. **Add EmailJS environment variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Add: `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`
   - Redeploy

3. **Test:** Visit `https://your-project.vercel.app` - should load!

### Step 1: Generate Participant Links

**After deployment, use your production URL:**

```bash
python scripts/generate_participant_links.py \
  --base-url "https://your-project.vercel.app" \
  --participants 25 \
  --sessions 3 \
  --output participant_links.csv
```

This creates a CSV with all links you need to send to participants.

**⚠️ Don't use localhost!** Participants can't access `localhost:5173` from their devices.

### Step 2: Send Links to Participants

- **Session 1:** Send `?pid=P001&session=1` link
- **Session 2:** Send `?pid=P001&session=2` link (after they complete Session 1)
- **Session 3:** Send `?pid=P001&session=3` link (after they complete Session 2)

### Step 3: Track Progress

Use `participant_tracking.csv` to see:
- Which blocks each participant has completed
- What block they need next
- Which session they're on

### Step 4: Collect Data

- Participants click **"📤 End Session"** when done
- You receive 1 email per participant per session
- Filename: `experiment_P001_session1_all_blocks.csv`

## For Participants

1. **Click your session link** (e.g., `?pid=P001&session=1`)
2. **Complete blocks** in order (app tracks automatically)
3. **Click "📤 End Session"** when done with all blocks in that session
4. **Return for next session** using the next link

## Email Usage

- **Before:** 200 emails (8 per participant)
- **After:** 75 emails (1 per participant per session)
- **Savings:** 62.5% reduction! ✅

## What's New

✅ **Session tracking** - App remembers where you left off
✅ **Progress display** - See "3 of 8 blocks completed"
✅ **Session-based submission** - Submit once per session, not per block
✅ **Automatic block selection** - Starts at correct block when you return

## Troubleshooting

**Wrong block number?**
- Check URL has correct `?pid=P001&session=2`
- Clear browser cache if needed

**Progress not saving?**
- Make sure you're using the same browser
- Don't clear localStorage between sessions

**Need help?**
- Check browser console (F12) for errors
- Contact researcher with your participant ID

