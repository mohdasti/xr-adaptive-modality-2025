# Modality Mechanics Documentation

## Overview

The modality system implements adaptive selection mechanics for different interaction paradigms: **Gaze-like** and **Hand-like** input. This allows researchers to study how different selection rules affect performance in pointing tasks.

## Modalities

### Hand-like (Direct Pointing)
- **Selection Rule**: Move cursor + click
- **Behavior**: Standard mouse interaction
- **Cursor**: Crosshair
- **Confirmation**: Immediate on click
- **Use Case**: Traditional desktop interaction, touch input simulation

### Gaze-like (Dwell or Confirmation)
- **Selection Rule**: Hover target + dwell/confirm
- **Behavior**: Two modes available:
  1. **Dwell-based**: Auto-confirm after hovering for specified duration
  2. **Confirmation-based**: Hover + press Space key to confirm
- **Cursor**: Custom cyan dot (simulates gaze point)
- **Visual Feedback**: 
  - Target border turns cyan when hovering
  - Dwell progress indicator (growing circle)
  - "Press SPACE" indicator (confirmation mode)
- **Use Case**: Eye-tracking simulation, accessibility research, hands-free interaction

## Implementation

### Core Library (`/src/lib/modality.ts`)

#### Enums and Types

```typescript
enum Modality {
  GAZE = 'gaze',
  HAND = 'hand',
}

const DWELL_TIMES = {
  NONE: 0,      // Require Space key
  SHORT: 350,   // 350ms dwell
  MEDIUM: 500,  // 500ms dwell
}

interface ModalityConfig {
  modality: Modality
  dwellTime: DwellTime
}
```

#### Key Functions

**`createGazeState(dwellTime)`**
- Initializes gaze interaction state
- Sets confirmation requirement based on dwell time

**`updateGazeState(state, isHovering, currentTime, dwellTime)`**
- Updates hover state and dwell progress
- Tracks time elapsed since hover start
- Calculates progress (0-1) for dwell indicator

**`isGazeSelectionComplete(state, dwellTime, spacePressed)`**
- Determines if selection is complete
- For dwell > 0: Checks if progress >= 1
- For dwell === 0: Checks if Space key pressed while hovering

**`isPointInTarget(point, target, targetWidth)`**
- Hit detection for circular targets
- Uses Euclidean distance

### Component Integration

#### FittsTask Component

**Hand Mode:**
```typescript
// Click handler
onClick={(event) => {
  const clickPos = getClickPosition(event)
  completeSelection(clickPos, true)
}}
```

**Gaze Mode:**
```typescript
// Mouse move handler (tracks cursor position)
onMouseMove={(event) => {
  setCursorPos(getPosition(event))
}}

// Animation frame loop (updates hover state)
useEffect(() => {
  const update = () => {
    const isHovering = isPointInTarget(cursorPos, target, width)
    setGazeState(updateGazeState(state, isHovering, Date.now(), dwell))
    
    // Auto-confirm on dwell complete
    if (isGazeSelectionComplete(state, dwell, false)) {
      completeSelection(cursorPos, false)
    }
  }
  requestAnimationFrame(update)
}, [cursorPos, target])

// Space key handler (confirmation mode)
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.code === 'Space' && gazeState.isHovering) {
      completeSelection(cursorPos, false)
    } else if (e.code === 'Space' && !gazeState.isHovering) {
      // Slip error: confirmed without hovering target
      emitError('slip')
    }
  }
  window.addEventListener('keydown', handleKeyDown)
}, [gazeState])
```

#### HUDPane - Modality Switch

**UI Components:**
- Radio buttons for Gaze-like / Hand-like
- Dropdown for dwell time (gaze mode only)
- Visual icons (👁️ for gaze, 👆 for hand)

**Event Emission:**
```typescript
const handleModalityChange = (modality) => {
  const config = { modality, dwellTime }
  bus.emit('modality:change', { config, timestamp: Date.now() })
}
```

#### TaskPane - Modality Consumption

**State Management:**
```typescript
const [modalityConfig, setModalityConfig] = useState(DEFAULT_MODALITY_CONFIG)

useEffect(() => {
  bus.on('modality:change', (payload) => {
    setModalityConfig(payload.config)
  })
}, [])
```

**Pass to FittsTask:**
```typescript
<FittsTask
  config={fittsConfig}
  modalityConfig={modalityConfig}
  ...
/>
```

## Error Types

### Miss
- **Trigger**: Click/confirm outside target (hand or gaze mode)
- **Event**: `trial:error` with `err_type: 'miss'`
- **Includes**: RT, click position, target position

### Timeout
- **Trigger**: No selection within timeout period (default: 10s)
- **Event**: `trial:error` with `err_type: 'timeout'`
- **Applies to**: Both modalities

### Slip
- **Trigger**: Space key pressed while NOT hovering target (gaze mode only)
- **Event**: `trial:error` with `err_type: 'slip'`
- **Rationale**: Premature confirmation, common in gaze interfaces
- **Includes**: Cursor position, target position

## Visual Feedback

### Hand Mode
- **Cursor**: Crosshair
- **Target**: Red circle, standard hover effect
- **Selection**: Click feedback

### Gaze Mode
- **Cursor**: Hidden (replaced with cyan dot via CSS ::after)
- **Target States**:
  - Default: Red circle
  - Hovering: Cyan border, glowing effect
  - Dwelling: Growing cyan circle inside target (progress indicator)
- **Confirmation Indicator**: "Press SPACE" tooltip (confirmation mode)

### CSS Classes
```css
.fitts-canvas.hand-mode { cursor: crosshair; }
.fitts-canvas.gaze-mode { cursor: none; }
.fitts-target.hovering { border-color: #00d9ff; }
.dwell-progress { /* Growing circle */ }
.space-indicator { /* Bouncing tooltip */ }
```

## Event Flow

### Hand Mode Selection
```
1. User moves cursor to target
2. User clicks
3. System checks hit/miss
4. Emit trial:end (hit) or trial:error (miss)
5. Advance to next trial
```

### Gaze Mode - Dwell Selection
```
1. User moves cursor to target
2. Target detects hover (border turns cyan)
3. Dwell timer starts
4. Progress indicator grows
5. At 100% progress: auto-confirm
6. Emit trial:end (hit)
7. Advance to next trial
```

### Gaze Mode - Confirmation Selection
```
1. User moves cursor to target
2. Target detects hover (border turns cyan)
3. "Press SPACE" indicator appears
4. User presses Space key
   - If hovering: Emit trial:end (hit)
   - If not hovering: Emit trial:error (slip)
5. Advance to next trial
```

## Usage Example

### Switching Modality

1. Open System HUD pane
2. Click radio button: "Gaze-like" or "Hand-like"
3. For Gaze mode: Select confirmation method
   - "Space key" - Manual confirmation
   - "350ms dwell" - Short auto-confirm
   - "500ms dwell" - Medium auto-confirm
4. Start Fitts block
5. Modality applies to all trials in block

### Running Experiment

**Hand Mode Block:**
```
1. Switch to "Hand-like" in HUD
2. Configure Fitts block (e.g., 5 trials × 3 IDs)
3. Start block
4. Click targets as quickly as possible
5. Review results in Event Logger
```

**Gaze Mode Block (Dwell):**
```
1. Switch to "Gaze-like" in HUD
2. Select "350ms dwell"
3. Configure Fitts block
4. Start block
5. Hover targets (no clicking!)
6. Wait for auto-confirm
7. Review results in Event Logger
```

**Gaze Mode Block (Confirmation):**
```
1. Switch to "Gaze-like" in HUD
2. Select "Space key"
3. Configure Fitts block
4. Start block
5. Hover target + press Space
6. Avoid pressing Space when not hovering (slip error)
7. Review results in Event Logger
```

## Data Analysis

### Metrics by Modality

**Hand Mode:**
- Movement Time (MT): Time from trial start to click
- Error Rate: Misses / total trials
- Throughput: ID / MT (bits/second)

**Gaze Mode:**
- Selection Time (ST): Time from trial start to dwell complete / Space press
- Dwell Time (DT): Time hovering before confirmation
- Error Rate: Misses + slips / total trials
- Slip Rate: Slips / total trials (unique to gaze)

### Example Analysis

```typescript
// Filter by modality
const handTrials = logs.filter(e => 
  e.event === 'trial:end' && e.payload.modality === 'hand'
)

const gazeTrials = logs.filter(e => 
  e.event === 'trial:end' && e.payload.modality === 'gaze'
)

// Compare mean RT
const handMeanRT = mean(handTrials.map(t => t.payload.rt_ms))
const gazeMeanRT = mean(gazeTrials.map(t => t.payload.rt_ms))

console.log(`Hand: ${handMeanRT}ms, Gaze: ${gazeMeanRT}ms`)

// Count slip errors (gaze only)
const slips = logs.filter(e => 
  e.event === 'trial:error' && e.payload.err_type === 'slip'
)

console.log(`Slip rate: ${slips.length / gazeTrials.length * 100}%`)
```

## Design Rationale

### Why Two Gaze Modes?

**Dwell-based (350ms, 500ms):**
- Pros: Hands-free, no extra action required
- Cons: Slower, "Midas touch" problem (accidental selections)
- Use: Accessibility, hands-busy scenarios

**Confirmation-based (Space key):**
- Pros: Explicit intent, fewer accidental selections
- Cons: Requires keyboard, slower than click
- Use: Research on hybrid gaze+key interfaces

### Cursor Speed

- **Constant**: Native OS cursor speed (no artificial constraints)
- **Rationale**: Isolates modality effects from cursor control
- **Future**: Could add cursor gain/acceleration manipulation

### Visual Design

- **Cyan for gaze**: Distinguishes from red target, high contrast
- **Progress indicator**: Provides feedback for dwell progress
- **Hidden cursor**: Simulates eye-tracking (gaze point only)
- **Hover effects**: Clear feedback for target entry/exit

## Testing

### Unit Tests (`modality.test.ts`)
- ✅ Gaze state creation
- ✅ Hover state updates
- ✅ Dwell progress calculation
- ✅ Selection completion detection
- ✅ Hit detection
- ✅ Modality manager

### Integration Testing

**Manual Test Procedure:**
1. Switch to Hand mode
2. Complete 3 trials (click targets)
3. Switch to Gaze mode (350ms dwell)
4. Complete 3 trials (hover only)
5. Switch to Gaze mode (Space key)
6. Complete 3 trials (hover + Space)
7. Try pressing Space without hovering (should emit slip error)
8. Check Event Logger for all events

## Future Enhancements

- [ ] Custom dwell times (slider input)
- [ ] Gaze jitter simulation (cursor wobble)
- [ ] Multi-target dwell (prevent Midas touch)
- [ ] Gaze trail visualization
- [ ] Fixation detection (vs. smooth pursuit)
- [ ] Saccade simulation (discrete jumps)
- [ ] Touch modality (tap vs. dwell)
- [ ] Voice confirmation ("select")
- [ ] Hybrid modalities (gaze + gesture)
- [ ] Adaptive dwell (based on ID)

## References

1. Majaranta, P., & Bulling, A. (2014). Eye tracking and eye-based human–computer interaction. In Advances in physiological computing (pp. 39-65). Springer.
2. Kumar, M., Paepcke, A., & Winograd, T. (2007). EyePoint: practical pointing and selection using gaze and keyboard. In CHI'07.
3. Miniotas, D., Špakov, O., & Evreinov, G. (2006). Symbol creator: An alternative eye-based text entry technique with low demand for screen space. In INTERACT 2006.
4. ISO 9241-9:2000 - Requirements for non-keyboard input devices.

