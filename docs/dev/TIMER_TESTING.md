# Timer Testing Guide

## When the Timer Appears

The countdown timer **only appears** in blocks with **pressure enabled (P1 blocks)**, not in P0 blocks.

## How to Identify P1 Blocks

1. **Check the Block Condition Code:**
   - P1 blocks end with `_P1` (e.g., `HaS_P1`, `GaA_P1`, `HaA_P1`, `GaS_P1`)
   - P0 blocks end with `_P0` (e.g., `HaS_P0`, `GaA_P0`)

2. **Look for Visual Indicator:**
   - When a P1 block is active, you should see: **"⏱️ Time pressure is ON - work quickly!"** in the Task Control pane

3. **Check Browser Console:**
   - Open DevTools (F12) and look for console logs showing `pressure: true` or `pressureEnabled: true`

## Testing the Timer Locally

1. Start the dev server:
   ```bash
   cd app
   npm run dev
   ```

2. Navigate to: `http://localhost:5173/intro?pid=P001&session=1`

3. Complete the flow (Intro → Demographics → System Check → Calibration)

4. **Start a block** and check:
   - If the block condition ends with `_P1`, the timer should appear
   - The timer appears in the **top-right corner** of the task canvas
   - It only shows **after clicking START** and when the target is visible

5. **Timer Behavior:**
   - Starts at 10.0 seconds
   - Yellow background (>6s remaining)
   - Orange background (3-6s remaining)
   - Red background with pulsing animation (≤3s remaining)

## Debugging

If you don't see the timer in a P1 block:

1. **Check browser console** for errors
2. **Verify pressure is enabled:**
   - Look for: `[TaskPane] Setting pressure from block condition: { targetPressure: true }`
3. **Check timer conditions:**
   - Timer only renders when: `pressureEnabled && !showStart && targetPos`
   - This means it appears AFTER clicking START and when target is visible

## Block Sequence Reference

The base sequence (for participant 0) has pressure in blocks 5-8:
- Block 1: `HaS_P0` (no timer)
- Block 2: `GaS_P0` (no timer)
- Block 3: `HaA_P0` (no timer)
- Block 4: `GaA_P0` (no timer)
- Block 5: `HaS_P1` (timer ON) ✅
- Block 6: `GaS_P1` (timer ON) ✅
- Block 7: `HaA_P1` (timer ON) ✅
- Block 8: `GaA_P1` (timer ON) ✅

Note: Different participants will have different orders due to Williams counterbalancing, but only blocks with `_P1` will show the timer.

