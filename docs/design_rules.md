# Design Rules for Modality-Aware Adaptive Systems

This document outlines the design principles and implementation rules for modality-aware adaptive policies in XR interfaces.

## Policy Architecture

### Core Components

- **Trigger Detection**: Performance metrics (RT percentile, error burst)
- **Action Execution**: UI adaptations (declutter, inflate width)
- **Hysteresis Gate**: N-consecutive trial threshold to prevent oscillation
- **Modality Context**: Different rules for hand vs. gaze

### Configuration Schema

```json
{
  "adaptive": true,
  "pressure_only": true,
  "hysteresis_trials": 5,
  "gaze": {
    "trigger": { "rt_p": 75, "err_burst": 2 },
    "action": "declutter"
  },
  "hand": {
    "trigger": { "rt_p": 75, "err_burst": 2 },
    "action": "inflate_width",
    "delta_w": 0.25
  }
}
```

## Modality-Specific Rules

### Gaze Modality

**Trigger Conditions:**
- RT p75 > baseline threshold
- Error burst ≥2 consecutive errors
- Trial count (rolling window of 20)

**Actions:**
- [ ] **Declutter**: Hide elements with `.noncritical` class
- [ ] **Reduce Visual Complexity**: Mute non-essential UI elements
- [ ] **Increase Target Contrast**: Ensure targets remain visible
- [ ] **Simplify Feedback**: Reduce animation/noise

**Implementation Notes:**
- Apply `.decluttered` class to parent container
- Use CSS `display: none` (preferred) or `visibility: hidden`
- Maintain accessibility (keyboard navigation)
- Preserve critical safety information

### Hand Modality

**Trigger Conditions:**
- RT p75 > baseline threshold
- Error burst ≥2 consecutive errors
- Trial count (rolling window of 20)

**Actions:**
- [ ] **Inflate Width**: Scale factor W *= (1 + delta_w)
- [ ] **Enlarge Targets**: Increase clickable area
- [ ] **Reduce Precision Requirements**: Lower accuracy demands
- [ ] **Adjust Feedback**: Enhance target highlighting

**Implementation Notes:**
- Apply `widthScale` factor to target rendering
- Maintain visual feedback for inflation (orange border, pulse)
- Scale proportionally (maintain aspect ratio)
- Reset on policy deactivation

## Hysteresis Mechanism

### Purpose

Prevent rapid oscillations in policy state (ON → OFF → ON).

### Implementation

```python
# Pseudocode
if trigger_condition_met:
    bad_trial_count += 1
    good_trial_count = 0
    
    if bad_trial_count >= hysteresis_trials:
        activate_adaptation()
        
else:
    good_trial_count += 1
    bad_trial_count = 0
    
    if good_trial_count >= hysteresis_trials:
        deactivate_adaptation()
```

### Thresholds

- **Default**: 5 consecutive good/bad trials
- **Configurable**: Via `policy.default.json`
- **Modality-Independent**: Same threshold for all modalities

## Pressure-Only Policy

### Rule

Adaptation **only activates** when pressure mode is enabled (`pressure_only: true`).

### Rationale

- Pressure condition simulates real-world time constraints
- Adaptive interventions most valuable under stress
- Reduces unnecessary UI changes in relaxed conditions

### Implementation

```typescript
if (policy.pressure_only && !pressureEnabled) {
  return 'none'  // No adaptation
}
```

## Performance Triggers

### RT Percentile (p75)

- Compute rolling RT percentile for recent trials (window: 20 trials)
- Trigger if current RT exceeds p75 threshold
- Baselines by modality and participant

### Error Burst Detection

- Count consecutive errors within rolling window
- Trigger if error_count ≥ threshold (default: 2)
- Reset on first correct trial

### Combined Logic

Adaptation triggers if **either**:
- RT p75 exceeded, OR
- Error burst detected

## Future Design Rules

### Additional Actions

- [ ] **Color Coding**: Increase target contrast (gaze)
- [ ] **Audio Feedback**: Provide confirmation sounds (gaze)
- [ ] **Haptic Feedback**: Vibration on interactions (hand)
- [ ] **Layout Reflow**: Responsive rearrangement (both)

### Advanced Triggers

- [ ] **Pupil Diameter**: Use z-score from camera proxy
- [ ] **Task Context**: Application-specific adaptations
- [ ] **User Preferences**: Personalization settings
- [ ] **Environmental Factors**: Lighting, noise, distraction

### Interaction Patterns

- [ ] **Gradual Adaptation**: Smooth transitions vs. binary on/off
- [ ] **Learning Phase**: Detect user skill development
- [ ] **Fatigue Compensation**: Late-session adjustments
- [ ] **Multi-Modal Coordination**: Hand + gaze simultaneous

## Testing Checklist

- [ ] Gaze declutter works (noncritical elements hidden)
- [ ] Hand inflate width works (targets enlarged)
- [ ] Hysteresis prevents oscillation (5-trial threshold)
- [ ] Pressure-only policy enforced
- [ ] RT trigger fires correctly
- [ ] Error burst trigger fires correctly
- [ ] Policy deactivation occurs after improvement
- [ ] Visual feedback clear (orange border, pulse)
- [ ] CSV logging includes policy actions
- [ ] Event bus emits policy:change

## References

- ISO 9241-9: Ergonomics of human-computer interaction (part 9)
- Guidelines for adaptive UI in HCI systems
- Modality-aware design principles

