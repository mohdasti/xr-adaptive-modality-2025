# Contextual Factors

This document describes the contextual factors system that simulates different user conditions.

## Overview

The system provides two contextual factors that can be toggled independently:

1. **Pressure Mode**: Adds time pressure through a countdown timer
2. **Aging Proxy**: Simulates age-related visual changes (reduced contrast, slight blur)

## Pressure Mode

### Features

- **Countdown Timer**: Displays a countdown overlay during trials
- **Visual Feedback**: Timer turns red and pulses when under 3 seconds
- **Timeout Detection**: Automatically triggers a timeout error when countdown reaches zero
- **Policy Integration**: The policy engine respects the `pressure_only` flag

### Implementation

```typescript
// Enable pressure mode
setPressureEnabled(true)

// Emits context:change event
bus.emit('context:change', {
  pressure: true,
  aging: false,
  timestamp: Date.now(),
})
```

### Visual Indicators

- **Normal**: Blue countdown with gentle pulse animation
- **Warning (≤3s)**: Red countdown with urgent pulse animation
- **Position**: Top-right corner of the task canvas

## Aging Proxy

### Features

- **Reduced Contrast**: Applies `contrast(0.7)` filter to targets
- **Slight Blur**: Adds `blur(0.5px)` to simulate presbyopia
- **Text Dimming**: Reduces opacity and contrast of UI elements
- **Color Desaturation**: Mutes colors in info panels

### Implementation

```typescript
// Enable aging mode
setAgingEnabled(true)

// CSS automatically applied via .aging-mode class
<div className={`fitts-task ${agingEnabled ? 'aging-mode' : ''}`}>
```

### CSS Effects

```css
.fitts-task.aging-mode .fitts-target {
  filter: contrast(0.7) blur(0.5px);
}

.fitts-task.aging-mode .fitts-info {
  filter: contrast(0.8);
  opacity: 0.85;
}
```

## Policy Integration

### pressure_only Flag

When `pressure_only: true` in the policy configuration, the adaptation engine only activates when pressure mode is enabled:

```json
{
  "adaptive": true,
  "pressure_only": true,
  "hysteresis_trials": 5
}
```

### Policy Engine Check

```typescript
// In policy.ts
if (this.policy.pressure_only && !pressureEnabled) {
  return {
    action: 'none',
    reason: 'Pressure mode not enabled',
    triggered: false,
    hysteresis_count: 0,
  }
}
```

## UI Controls

### Toggle Interface

Located in `HUDPane`, the contextual factors section provides:

- **Pressure Toggle**: Checkbox with timer icon (⏱️)
- **Aging Toggle**: Checkbox with glasses icon (👓)
- **Visual Feedback**: Toggles glow orange when enabled
- **Real-time Updates**: Changes apply immediately to active trials

### Styling

```css
.context-toggle:has(input:checked) {
  border-color: #ffa500;
  background: rgba(255, 165, 0, 0.1);
  box-shadow: 0 0 12px rgba(255, 165, 0, 0.3);
}
```

## Event Flow

```
User toggles pressure/aging
    ↓
HUDPane emits 'context:change'
    ↓
TaskPane receives event
    ↓
Props passed to FittsTask
    ↓
Visual effects applied
    ↓
Policy engine checks pressureEnabled
```

## Data Logging

Both contextual factors are logged in the CSV output:

| Column   | Type    | Description                        |
|----------|---------|-------------------------------------|
| pressure | number  | Pressure value (0-1)               |
| aging    | boolean | Whether aging mode is enabled      |

## Testing

### Manual Testing

1. Start a Fitts block
2. Enable pressure mode → verify countdown appears
3. Let countdown reach zero → verify timeout error
4. Enable aging mode → verify visual changes
5. Disable both → verify normal appearance

### Unit Tests

```typescript
describe('Contextual Factors', () => {
  it('should show countdown when pressure enabled', () => {
    // Test implementation
  })
  
  it('should apply aging CSS when enabled', () => {
    // Test implementation
  })
  
  it('should respect pressure_only policy flag', () => {
    // Test implementation
  })
})
```

## Design Rationale

### Pressure Mode

- **Countdown Timer**: Provides clear, immediate feedback on time remaining
- **Color Coding**: Red warning helps users gauge urgency
- **Timeout Handling**: Automatic error recording ensures data integrity

### Aging Proxy

- **Subtle Effects**: Balances realism with usability
- **CSS-based**: Performant and easy to toggle
- **Research-based**: Simulates common age-related visual changes

## Future Enhancements

1. **Configurable Timeouts**: Allow per-trial or per-block timeout settings
2. **Aging Severity Levels**: Mild/moderate/severe aging effects
3. **Additional Factors**: Tremor simulation, cognitive load indicators
4. **Adaptive Timeouts**: Adjust based on user performance
5. **Pressure Levels**: Multiple pressure intensities

## References

- Fitts's Law and aging: [Chaparro et al., 1999]
- Visual changes with age: [Owsley, 2011]
- Time pressure effects: [Maule & Hockey, 1993]

