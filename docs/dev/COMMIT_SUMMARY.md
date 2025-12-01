# Commit Summary: Critical Psychophysics Fixes

## Repository Information
- **Remote**: `https://github.com/mohdasti/xr-adaptive-modality-2025.git`
- **Branch**: `main`
- **Local Status**: Up to date with `origin/main`

## Commits Pushed

### Commit 1: Main Feature Implementation
- **Commit Hash**: `c55aec0fc3f679856381ad5ea434b53886f385af`
- **Short Hash**: `c55aec0`
- **Author**: mohdasti <mohammad.dastgheib@email.ucr.edu>
- **Date**: Sun Nov 30 20:27:04 2025 -0800
- **Message**: "Add critical psychophysics features and demographics collection"

### Commit 2: Gaze Simulation Fix
- **Commit Hash**: `fe48d727c6d2bdd7cd04a0a09ccd5d0299d6d051`
- **Short Hash**: `fe48d72`
- **Author**: mohdasti <mohammad.dastgheib@email.ucr.edu>
- **Date**: Sun Nov 30 20:35:16 2025 -0800
- **Message**: "Fix: Remove cursorPos override in handleMouseMove to use gaze simulation"

## Files Changed

### New Files Created (Commit c55aec0)
1. `app/src/components/DemographicsForm.tsx` - Demographics collection form
2. `app/src/components/DemographicsForm.css` - Styling for demographics form
3. `app/src/components/CreditCardCalibration.tsx` - Physical screen calibration component
4. `app/src/components/CreditCardCalibration.css` - Styling for calibration
5. `app/src/routes/Demographics.tsx` - Route component for demographics page
6. `app/src/routes/Calibration.tsx` - Route component for calibration page

### Modified Files

#### Commit c55aec0 (13 files changed, 1654 insertions, 113 deletions)
1. `app/src/App.tsx` - Added routes for Demographics and Calibration
2. `app/src/components/FittsTask.tsx` - Major changes:
   - Added practice block support
   - Implemented FPS tracking
   - Added gaze simulation integration with normalized jitter
   - Start button now works with gaze mode (dwell-based selection)
   - All timing changed to `performance.now()`
   - Added calibration data loading from sessionStorage
3. `app/src/components/HUDPane.tsx` - Added ISO 9241-9 error rate feedback
4. `app/src/components/TaskPane.tsx` - Added practice block logic
5. `app/src/lib/csv.ts` - Added demographics fields and practice/avg_fps to CSV schema
6. `app/src/routes/Intro.tsx` - Updated navigation to go to Demographics
7. `app/src/routes/SystemCheck.tsx` - Updated navigation to go to Calibration, checks for demographics

#### Commit fe48d72 (1 file changed, 6 insertions, 12 deletions)
1. `app/src/components/FittsTask.tsx` - Fixed `handleMouseMove` to not override gaze simulation

## Critical Fixes Implemented

### 1. Timing Precision ✅
- **Issue**: Was using `Date.now()` for timing (15ms+ jitter)
- **Fix**: All timing now uses `performance.now()` (sub-millisecond precision)
- **Location**: `FittsTask.tsx` lines 356, 509, etc.
- **Status**: FIXED in commit c55aec0

### 2. Gaze Simulation ✅
- **Issue**: Cursor position was being set directly from mouse events, overriding simulation
- **Fix**: 
  - Removed `setCursorPos(pos)` from `handleMouseMove` callback
  - Cursor position exclusively controlled by `useGazeSimulation` hook
  - Simulated position used for hit detection: `mousePosRef.current = simulatedGazePosRef.current`
- **Location**: `FittsTask.tsx` line 836-845 (removed override), line 954 (uses simulation)
- **Status**: FIXED in commit fe48d72

### 3. Start Button Modality Switching ✅
- **Issue**: Start button required mouse click, forcing modality switch in gaze mode
- **Fix**: 
  - Start button now selectable via dwell in gaze mode
  - Hover detection handles both start button and target
  - Visual feedback added (dwell progress, space indicator)
- **Location**: `FittsTask.tsx` lines 991, 1000, 1025-1028, 1093-1105
- **Status**: FIXED in commit c55aec0

### 4. Demographics Collection ✅
- **Issue**: No demographics form, only developer prompt
- **Fix**: 
  - Full demographics form created with all required fields
  - Integrated into flow: Intro → Demographics → SystemCheck → Calibration → Task
  - Data stored in sessionStorage and CSV
- **Location**: New files + routing updates
- **Status**: IMPLEMENTED in commit c55aec0

### 5. ISO 9241-9 Error Rate Feedback ✅
- **Issue**: No error rate feedback for participants
- **Fix**: 
  - Block-level error rate tracking
  - Real-time visual feedback (Green <4%, Yellow 4-10%, Red >10%)
  - Only displays after 3+ trials
- **Location**: `HUDPane.tsx` lines 254-284, 290-306
- **Status**: IMPLEMENTED in commit c55aec0

## Additional Features

### 6. Practice Blocks
- 10 trials Hand + 10 trials Gaze before real experiment
- Marked with `practice: true` flag
- Visual indicator in UI
- Location: `TaskPane.tsx`

### 7. FPS Telemetry
- Frame rate tracking per trial
- Logged as `avg_fps` in CSV
- Location: `FittsTask.tsx`

### 8. Credit Card Calibration
- Physical screen calibration
- Calculates `pixelsPerMM` and `pixelsPerDegree`
- Normalizes gaze jitter based on calibration
- Location: New `CreditCardCalibration.tsx` component

## CSV Schema Updates

New fields added to trial data CSV:
- Demographics: `age`, `gender`, `gaming_hours_per_week`, `input_device`, `vision_correction`, `wearing_correction_now`, `dominant_hand`, `operating_hand`, `using_dominant_hand`, `motor_impairment`, `fatigue_level`
- Experiment: `practice`, `avg_fps`

## Code Verification Commands

To verify the fixes in another LLM session:

```bash
# Check commit history
git log --oneline -5

# View specific commit
git show c55aec0
git show fe48d72

# Verify timing precision
grep -n "Date.now()" app/src/components/FittsTask.tsx
grep -n "performance.now()" app/src/components/FittsTask.tsx | head -5

# Verify gaze simulation
grep -n "useGazeSimulation" app/src/components/FittsTask.tsx
grep -n "setCursorPos(pos)" app/src/components/FittsTask.tsx

# Verify start button logic
grep -A5 -B5 "showStart ? startPos : targetPos" app/src/components/FittsTask.tsx

# Verify demographics route
grep -n "demographics" app/src/App.tsx
```

## Testing Checklist

- [ ] Timing uses `performance.now()` throughout
- [ ] Gaze simulation controls cursor position (no direct mouse override)
- [ ] Start button works with dwell in gaze mode
- [ ] Demographics form appears in flow
- [ ] Error rate feedback displays in HUD
- [ ] Practice blocks run before real experiment
- [ ] FPS is tracked and logged
- [ ] Calibration step appears in flow

## Notes for Future Development

1. All timing-critical code should use `performance.now()`, not `Date.now()`
2. Gaze mode cursor position is controlled by `useGazeSimulation` hook - do not set directly
3. Start button hover detection works for both start and target - check `showStart` flag
4. Demographics data is required - SystemCheck verifies it exists
5. Practice trials are marked and excluded from main analysis

