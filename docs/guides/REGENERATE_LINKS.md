# Regenerate Participant Links

## Issue Fixed

The participant links were pointing directly to `/task`, which skipped the Demographics form. This has been fixed:

1. **Link generation script updated**: Now generates links pointing to `/intro` instead of `/task`
2. **Redirect added**: If someone lands on `/task` directly, they're automatically redirected to `/intro` (with query params preserved)

## Action Required

You need to **regenerate your `participant_links.csv` file** with the updated script:

```bash
python scripts/generate_participant_links.py \
  --base-url "https://your-deployed-url.vercel.app" \
  --participants 25 \
  --sessions 3 \
  --output participant_links.csv
```

Replace `https://your-deployed-url.vercel.app` with your actual deployment URL.

## New Flow

Links now point to `/intro`, ensuring participants go through the complete flow:

1. **Intro** (`/intro`) - Welcome and comprehension check
2. **Demographics** (`/demographics`) - Background information collection
3. **SystemCheck** (`/check`) - Display requirements verification
4. **Calibration** (`/calibration`) - Credit card calibration
5. **Task** (`/task`) - The actual experiment

## Backward Compatibility

Old links pointing to `/task` will automatically redirect to `/intro` if demographics haven't been completed, so old links in the CSV will still work.

