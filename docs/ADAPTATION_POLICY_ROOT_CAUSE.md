# Adaptation Policy Root Cause Analysis

## Summary

This document summarizes findings from codebase analysis regarding hand width inflation (width scaling) non-activation. The analysis investigates where width scaling is supposed to be applied and identifies potential gating conditions.

## Policy Architecture

### Location of Width Scaling Logic

**Policy Engine:** `app/src/lib/policy.ts`
- PolicyEngine class manages adaptation state with hysteresis
- `nextPolicyState()` computes whether adaptation should activate
- Returns `PolicyState` with `action: 'inflate_width'` and `delta_w` when triggered

**Component Integration:** `app/src/components/TaskPane.tsx`
- Listens for `policy:change` events (lines 228-241)
- Sets `widthScale` state based on policy action:
  - If `action === 'inflate_width'`: `setWidthScale(1.0 + delta_w)`
  - Otherwise: `setWidthScale(1.0)`
- Passes `widthScale` prop to FittsTask component

**Target Rendering:** `app/src/components/FittsTask.tsx`
- Receives `widthScale` prop (default: 1.0)
- Computes `effectiveWidth = config.W * widthScale` (line 91)
- Applies scaling to target rendering
- Logs `width_scale_factor` to CSV (multiple locations: lines 755, 1472, 1604, 2263)

### Policy Configuration

**Default Policy:** `app/src/lib/policy.ts` (lines 162-187)
```typescript
hand: {
  trigger: {
    rt_p: 75,      // RT percentile threshold (p75)
    err_burst: 2,  // Consecutive errors threshold
  },
  action: 'inflate_width',
  delta_w: 0.25,   // Width scale factor (1.0 + 0.25 = 1.25)
}
```

**Policy JSON:** `policy/policy.default.json` (alternative structure)
- Contains `hand.width_inflate_factor` mapping by trigger severity
- Uses rolling error rate and threshold-based triggers

### Gating Conditions

#### 1. Pressure-Only Gate

**Location:** `app/src/lib/policy.ts`, `nextPolicyState()` (lines 375-383)

```typescript
if (this.policy.pressure_only && !pressureEnabled) {
  return {
    action: 'none',
    reason: 'Pressure mode not enabled',
    ...
  }
}
```

**Effect:** If `pressure_only: true` (default), adaptation ONLY activates when `pressureEnabled === true`.

**Implication:** Width scaling will NOT activate in pressure OFF conditions, even if triggers are met.

#### 2. Hysteresis Gate

**Location:** `app/src/lib/policy.ts`, `nextPolicyState()` (lines 395-418)

```typescript
if (triggered) {
  counters.bad++
  counters.good = 0
  
  // Need N consecutive bad trials to activate
  if (counters.bad >= this.policy.hysteresis_trials) {
    // Activate adaptation
  }
} else {
  counters.good++
  counters.bad = 0
  
  // Need N consecutive good trials to deactivate
  if (counters.good >= this.policy.hysteresis_trials) {
    // Deactivate adaptation
  }
}
```

**Default:** `hysteresis_trials: 5`

**Effect:** Requires N consecutive trials meeting trigger conditions before activation.

**Implication:** Even if RT p75 or error burst occurs occasionally, adaptation won't activate unless sustained for 5+ consecutive trials.

#### 3. Trigger Conditions

**Location:** `app/src/lib/policy.ts`, `checkTriggers()` (lines 274-293)

**Conditions:**
1. **Error burst:** `err_burst >= thresholds.err_burst` (default: 2 consecutive errors)
2. **RT percentile:** `currentRT > rt_p75` (when p75 baseline exists)

**Note:** Triggers are computed separately per modality using `computeTriggers()` (lines 233-269):
- Filters history by modality (`modalityHistory`)
- Computes p75 RT from successful trials only
- Detects error bursts via `detectErrorBurst()` (max consecutive errors in recent window)

### Policy Engine State Management

**History Tracking:** `PolicyEngine` maintains trial history (max 100 trials)
- `addTrial()` appends to history
- History is filtered by modality when computing triggers

**Counter Namespace:** Counters are per-modality (`counters[modalityStr]`)
- Prevents cross-contamination between hand and gaze
- Each modality has independent `good`/`bad` counters

## Potential Root Causes

### 1. Pressure Gate (Most Likely)

If `pressure_only: true` (default) and `pressureEnabled` is not correctly set in TaskPane:
- Policy will return `action: 'none'` immediately
- No triggers will be evaluated
- Width scaling will never activate

**Check:** Verify that `pressureEnabled` state in TaskPane correctly reflects the experimental condition.

### 2. Hysteresis Gate Too Strict

If `hysteresis_trials: 5` is set:
- Requires 5 consecutive slow/error trials
- If participants have sporadic slow/error trials, triggers may never accumulate
- This is a design feature (prevents oscillation) but may be too conservative

**Check:** Review participant performance: are there sustained streaks of poor performance?

### 3. Trigger Thresholds Too Strict

If RT p75 or error burst thresholds are not met:
- Baseline p75 RT may be high (participants consistently slow)
- Error bursts may not occur (participants make isolated errors, not streaks)

**Check:** Compute per-participant p75 RT and error burst patterns in hand/adaptive/pressure ON condition.

### 4. Policy Not Enabled/Initialized

If policy engine is not initialized or `adaptive: false`:
- `nextPolicyState()` returns `action: 'none'` immediately (lines 366-373)

**Check:** Verify policy initialization in TaskPane and that `adaptive: true` in policy config.

### 5. Component Integration Issue

If `policy:change` events are not being emitted or received:
- TaskPane won't update `widthScale` state
- FittsTask will render with default `widthScale = 1.0`

**Check:** Verify event bus is emitting `policy:change` events when policy state changes.

## Diagnostic Recommendations

1. **Check pressure state:** Verify `pressureEnabled` matches experimental condition labels
2. **Compute candidate triggers:** Use diagnostic code in Report.qmd to reconstruct trigger events
3. **Compare to observed scaling:** If candidate triggers exist but no scaling occurred, investigate gate conditions
4. **Review policy config:** Ensure `adaptive: true`, `pressure_only` matches intent, `hysteresis_trials` is reasonable
5. **Trace policy execution:** Add logging to `nextPolicyState()` to see why `action: 'inflate_width'` is not returned

## Conclusion

The width scaling logic is correctly implemented across policy engine, event handling, and component rendering. The most likely causes of non-activation are:

1. **Pressure gate:** `pressure_only: true` with `pressureEnabled === false`
2. **Hysteresis gate:** Requires 5 consecutive trigger trials, which may be too strict
3. **Trigger thresholds:** RT p75 or error burst conditions not met in practice

The root-cause diagnostic section in Report.qmd will help identify which of these (or other factors) is responsible for the observed non-activation.

## Data-Backed Conclusion (Policy Replay Diagnostics)

**Analysis Method:** Replayed trial logs through actual PolicyEngine (`app/src/lib/policy.ts`) using `scripts/policy_replay_width_inflation_diagnostics.ts`.

### Key Findings

**PolicyEngine Behavior:**
- **Total inflate_width events emitted:** 243 events across 17 participants (20.0% of 85 participants)
- **Participants reaching hysteresis threshold (max bad streak >= 5):** 64 participants (75.3%)
- **Total policy events (action != 'none'):** 2,087 events
- **Events with reason 'Pressure mode not enabled':** 0

**Observed Data:**
- **Width scaling in data (Hand/Adaptive/Pressure=1):** 0% (width_scale_factor always 1.0)

### Root Cause: UI Integration Issue

**Evidence:** PolicyEngine correctly emitted `inflate_width` actions (243 events, 17 participants), but `width_scale_factor` remained 1.0 in all recorded trials. This indicates:

1. **Policy logic executed correctly:** Triggers were met, hysteresis threshold (5 consecutive) was reached, and PolicyEngine returned `action: 'inflate_width'` with `delta_w: 0.25`.

2. **Actions not applied to UI:** The policy actions were emitted but not reflected in the rendered targets or logged `width_scale_factor`.

3. **Likely failure points:**
   - Event bus not propagating `policy:change` events from PolicyEngine to TaskPane
   - TaskPane not updating `widthScale` state when receiving events
   - FittsTask not receiving/applying `widthScale` prop correctly
   - CSV logging capturing nominal width instead of displayed width

**Not a threshold/hysteresis issue:** 75.3% of participants reached the hysteresis threshold, and 20% had inflate_width actions emitted, so strict thresholds are not the cause.

**Not a pressure gate issue:** 0 events had reason 'Pressure mode not enabled', indicating `pressureEnabled` runtime state matched condition labels.

### Recommended Fixes

1. **Verify event bus:** Check if `policy:change` events are emitted when PolicyEngine state changes
2. **Verify TaskPane listener:** Confirm `handlePolicyChange` in TaskPane.tsx (lines 228-241) is receiving events
3. **Verify widthScale prop:** Check if FittsTask receives and applies `widthScale` prop correctly
4. **Verify CSV logging:** Ensure `width_scale_factor` in CSV reflects actual displayed width, not nominal width