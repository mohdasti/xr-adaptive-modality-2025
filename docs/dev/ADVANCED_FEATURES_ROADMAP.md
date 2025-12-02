# Advanced Features Implementation Roadmap

This document tracks the implementation of advanced considerations for CHI/UIST-level rigor.

## ✅ Completed

### 1. Strategy Questions in Debrief
- **Status:** ✅ Complete
- **Location:** `app/src/routes/Debrief.tsx`
- **Implementation:** Two open-ended questions added:
  - "Did you notice the interface changing during the task? If so, how?"
  - "Did you change your strategy when the targets became easier/harder?"
- **Storage:** Responses stored in `sessionStorage` as `debrief_responses`

## 🚧 In Progress / Next Steps

### 2. Target Entry Count (Gaze Signature)
- **Status:** ⏳ Pending
- **Purpose:** Track how many times user enters target area (proxy for frustration)
- **Implementation Notes:**
  - Add `target_entry_count` to `TrialData` interface
  - Track state transitions: `not hovering → hovering = +1 entry`
  - Log in `handleFittsTrialComplete` and `handleTimeout`
  - Add to CSV headers in `csv.ts`

### 3. Audio Feedback
- **Status:** ⏳ Pending
- **Purpose:** Offload verification to auditory channel
- **Implementation Notes:**
  - Create audio assets (or use Web Audio API to generate)
  - Add "click" sound on successful selection
  - Add "thud" sound on error
  - Play in `completeSelection` (success) and `onTrialError` (error)
  - Consider volume control/preferences

### 4. Criterion-Based Practice
- **Status:** ⏳ Pending
- **Purpose:** Ensure minimum competence before main block
- **Implementation Notes:**
  - Modify practice block logic in `TaskPane.tsx`
  - Track consecutive correct trials
  - Graduation rule: "3 correct in a row OR 20 trials max"
  - Update `handleFittsTrialComplete` to check practice graduation
  - Update UI to show progress toward graduation

### 5. Break Countdown Enforcer
- **Status:** ⏳ Pending
- **Purpose:** Force 10-second break between blocks
- **Implementation Notes:**
  - Add countdown timer in `TaskPane.tsx` after block completion
  - Show "Take a Break" screen with countdown
  - Disable "Next Block" button until countdown completes
  - Display remaining time

### 6. localStorage Backup (Crash-Proofing)
- **Status:** ⏳ Pending
- **Purpose:** Prevent data loss on refresh/crash
- **Implementation Notes:**
  - Modify `csv.ts` logger to append each trial to `localStorage`
  - Key: `backup_data_${participantId}_session${sessionNum}`
  - On app load, check for backup and offer restore
  - Merge restored data with current session

### 7. Continuous Zoom/DPI Monitoring
- **Status:** ⏳ Pending
- **Purpose:** Detect mid-experiment zoom changes
- **Implementation Notes:**
  - Add `setInterval` check every 1s in `FittsTask.tsx`
  - Monitor `window.visualViewport.scale` and `devicePixelRatio`
  - If change detected, pause experiment immediately
  - Show overlay: "Please reset zoom to 100%"
  - Store baseline values on trial start

## Priority Order

1. **localStorage Backup** (Critical - Data Safety)
2. **Continuous Zoom Monitoring** (High - Data Quality)
3. **Target Entry Count** (High - Gaze Metrics)
4. **Audio Feedback** (Medium - UX)
5. **Break Countdown** (Medium - Fatigue Control)
6. **Criterion-Based Practice** (Lower - Already have fixed practice)

## Implementation Complexity

- **Low:** Audio Feedback, Break Countdown
- **Medium:** Target Entry Count, Zoom Monitoring
- **High:** localStorage Backup, Criterion-Based Practice

## Notes

- All features should maintain existing dark theme styling
- Consider adding feature flags for gradual rollout
- Test thoroughly with different browsers/devices
- Document any new CSV columns for analysis pipeline


