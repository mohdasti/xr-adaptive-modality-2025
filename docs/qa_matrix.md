# QA Testing Matrix

Comprehensive testing matrix for cross-browser, cross-device, and scenario coverage.

## Browser Matrix

| Browser | Version | OS | Resolution | Status | Notes |
|--------|---------|-----|------------|--------|-------|
| Chrome | Latest | macOS | 1920×1080 | ✅ | Primary target |
| Chrome | Latest | Windows | 1920×1080 | ✅ | Primary target |
| Firefox | Latest | macOS | 1920×1080 | ✅ | Secondary target |
| Firefox | Latest | Windows | 1920×1080 | ✅ | Secondary target |
| Safari | Latest | macOS | 1920×1080 | ⚠️ | Known issues |
| Safari | Latest | iOS | 375×667 | ⚠️ | Limited support |
| Edge | Latest | Windows | 1920×1080 | ✅ | Chromium-based |

## DPI/Resolution Matrix

| Resolution | DPI | Device | OS | Testing Status |
|------------|-----|--------|-----|----------------|
| 1920×1080 | 96 | Desktop | macOS/Windows | ✅ Primary |
| 1920×1080 | 150 | HiDPI | macOS | ✅ Tested |
| 2560×1440 | 110 | Desktop | Windows | ✅ Tested |
| 3840×2160 | 150 | 4K | Windows | ⚠️ Partial |
| 1280×720 | 96 | Low-res | Windows | ✅ Tested |
| 375×667 | 326 | iPhone | iOS | ⚠️ Limited |
| 768×1024 | 264 | iPad | iPadOS | ⚠️ Limited |

## Four Key Scenarios

### Scenario 1: Hand Modality (No Adaptation)

- **Setup**: Hand input, pressure OFF, aging OFF
- **Expected**: Normal target selection
- **Outcome**: Baseline performance

**Test Checklist:**
- [ ] Cursor visible and responsive
- [ ] Targets render at correct sizes (W = base width)
- [ ] Click detection accurate (within target bounds)
- [ ] RT reasonable (200-800ms typical)
- [ ] Error rate <5%
- [ ] No policy adaptations triggered
- [ ] CSV logs correct: correct=1 for successful hits
- [ ] CSV logs correct: modality='hand'
- [ ] Event logger shows trial:start and trial:end events

### Scenario 2: Gaze Modality (No Adaptation)

- **Setup**: Gaze input (Space key), pressure OFF, aging OFF
- **Expected**: Hover + confirm workflow
- **Outcome**: Baseline gaze performance

**Test Checklist:**
- [ ] Cursor hidden (replaced with cyan gaze point)
- [ ] Target border turns cyan on hover
- [ ] Space key confirmation works
- [ ] Targets render at correct sizes (W = base width)
- [ ] RT reasonable (400-1200ms typical - includes dwell/confirm)
- [ ] Error type='slip' if Space pressed without hover
- [ ] Dwell progress indicator shows (if dwell >0ms)
- [ ] CSV logs correct: modality='gaze'
- [ ] CSV logs correct: confirm_type='space' or 'dwell'
- [ ] No policy adaptations triggered

### Scenario 3: Hand + Pressure + Adaptation (Inflate Width)

- **Setup**: Hand input, pressure ON, adaptive policy ON
- **Expected**: Target inflation after poor performance
- **Outcome**: Improved accuracy under stress

**Test Checklist:**
- [ ] Countdown timer appears (top-right)
- [ ] Timer turns red when <3s
- [ ] Targets enlarge when policy triggers (W *= 1.25)
- [ ] Orange border visible on inflated targets
- [ ] Scale indicator shows "(×1.25)" on target
- [ ] Hysteresis respected (5 consecutive slow trials before trigger)
- [ ] CSV logs correct: pressure=1.0
- [ ] CSV logs correct: width inflation applied
- [ ] Event logger shows policy:change events
- [ ] Policy status badge visible

### Scenario 4: Gaze + Pressure + Adaptation (Declutter)

- **Setup**: Gaze input, pressure ON, adaptive policy ON
- **Expected**: UI decluttering after poor performance
- **Outcome**: Reduced cognitive load

**Test Checklist:**
- [ ] Countdown timer appears
- [ ] Noncritical elements hidden when policy triggers
- [ ] `.decluttered` class applied to HUD pane
- [ ] Critical elements remain visible
- [ ] Policy status badge shows "Adaptation Active: declutter"
- [ ] Hysteresis respected (5 consecutive slow trials)
- [ ] CSV logs correct: declutter action logged
- [ ] Event logger shows policy:change events
- [ ] Accuracy improves after adaptation

## Modality Switching

| Source → Target | Pressure | Adaptation | Expected Behavior | Test Status |
|----------------|----------|------------|------------------|-------------|
| Hand → Gaze | OFF | OFF | Smooth transition, cursor switches | ✅ |
| Gaze → Hand | OFF | OFF | Smooth transition, cursor reappears | ✅ |
| Hand → Gaze | ON | ON | Timer continues, gaze mode active | ✅ |
| Gaze → Hand | ON | ON | Timer resets, adaptation may change | ⚠️ |

## Dwell Time Variants

| Dwell Time | Modality | Confirmation | Expected RT | Test Status |
|------------|----------|--------------|-------------|-------------|
| 0ms | Gaze | Space only | Manual confirmation | ✅ |
| 350ms | Gaze | Auto-dwell | ~750ms median | ✅ |
| 500ms | Gaze | Auto-dwell | ~900ms median | ✅ |

## Contextual Factors

### Pressure Mode

- [ ] Countdown displays correctly
- [ ] Timeout triggers after 10s
- [ ] Error type='timeout' logged
- [ ] Alert/feedback visible on timeout
- [ ] Can complete trial before timeout

### Aging Proxy

- [ ] Reduced contrast applied (targets dimmed)
- [ ] Slight blur visible (simulates presbyopia)
- [ ] Text opacity reduced
- [ ] UI remains functional despite visual effects
- [ ] RT may increase (expected)

### Pupil Proxy (Optional)

- [ ] Camera permission requested
- [ ] Consent text displayed
- [ ] Camera access can be declined
- [ ] Z-score values logged (pupil_z_med column)
- [ ] No video frames stored
- [ ] Privacy policy respected

## CSV Data Validation

### Required Columns

- [ ] `pid`: Present and hashed/anonymized
- [ ] `ts`: Valid timestamp (milliseconds since epoch)
- [ ] `trial`: Sequential (1, 2, 3, ...)
- [ ] `modality`: 'hand' or 'gaze'
- [ ] `rt_ms`: Numeric, >0 and <10000
- [ ] `correct`: Boolean (true/false)
- [ ] `browser`: Detected correctly
- [ ] `dpi`: Device pixel ratio

### TLX Integration

- [ ] `tlx_global`: Populated after TLX submission
- [ ] `tlx_mental`: Populated after TLX submission
- [ ] Values 0-100 for all trials in block
- [ ] Missing until TLX form submitted

## Cross-Platform Testing

### Desktop (Primary)

- [ ] macOS + Chrome
- [ ] macOS + Firefox
- [ ] macOS + Safari
- [ ] Windows + Chrome
- [ ] Windows + Firefox
- [ ] Windows + Edge

### Mobile (Limited)

- [ ] iOS Safari (basic functionality only)
- [ ] Android Chrome (basic functionality only)
- [ ] Touch support (click simulation)

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible (basic)
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] No motion sickness triggers

## Performance Benchmarks

- [ ] Load time <2s
- [ ] RT calculation accurate (±1ms)
- [ ] No frame drops (<60fps target)
- [ ] Memory usage <500MB
- [ ] CSV export <1s for 1000 rows

## Known Issues

- [ ] Safari: Camera permission issues
- [ ] Mobile: Limited touch support
- [ ] HiDPI: UI scaling on some resolutions
- [ ] 4K: Potential performance issues

## Testing Sign-Off

**Date**: [Fill in]  
**Tester**: [Fill in]  
**Browser**: [Fill in]  
**Resolution**: [Fill in]  

**Status**: ✅ Pass / ⚠️ Partial / ❌ Fail

**Notes**: [Any issues or observations]

