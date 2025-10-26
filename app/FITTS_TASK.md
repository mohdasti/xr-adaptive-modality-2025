# Fitts's Law Task Documentation

## Overview

The Fitts task implementation provides a standard target selection paradigm for measuring human motor performance in pointing tasks, following ISO 9241-9 guidelines.

## Fitts's Law

**Shannon Formulation:**
```
ID = log₂(A/W + 1)
```

Where:
- **ID** = Index of Difficulty (bits)
- **A** = Amplitude (distance to target in pixels)
- **W** = Width (target size in pixels)

## Implementation

### Core Library (`/src/lib/fitts.ts`)

#### Functions

**`computeID(A: number, W: number): number`**
- Computes Index of Difficulty using Shannon formulation
- Returns ID in bits
- Throws error if W ≤ 0 or A < 0

**`generateTrialSequence(configs, trialsPerConfig, shuffle)`**
- Creates randomized trial sequences
- Supports counterbalancing across difficulty levels
- Fisher-Yates shuffle algorithm

**`generateCircularPositions(center, amplitude, numPositions)`**
- Generates target positions in circular layout
- Default: 8 positions around center
- Used for consistent amplitude across trials

**`generateGridPositions(bounds, margin, gridSize)`**
- Generates target positions in grid layout
- Respects canvas margins
- Useful for spatial variation

**`isHit(clickPos, targetPos, targetWidth)`**
- Determines if click is within target bounds
- Uses Euclidean distance
- Circular target assumption

#### Presets

**`DIFFICULTY_PRESETS`**
```typescript
{
  low:      { A: 200, W: 80, ID: ~1.7 }
  medium:   { A: 400, W: 40, ID: ~3.3 }
  high:     { A: 600, W: 20, ID: ~5.0 }
  veryHigh: { A: 800, W: 16, ID: ~5.6 }
}
```

**`ladder`**
- Standard 3-level difficulty ladder: [low, medium, high]
- Recommended for experimental blocks

## Component Architecture

### FittsTask Component

**Props:**
```typescript
{
  config: FittsConfig          // Difficulty configuration
  modality: string             // 'visual' | 'auditory' | 'haptic' | 'multimodal'
  ui_mode: string              // 'standard' | 'minimal' | 'enhanced'
  pressure: number             // Task pressure (0-2)
  trialNumber: number          // Current trial index
  onTrialComplete: () => void  // Success callback
  onTrialError: (type) => void // Error callback
  timeout?: number             // Trial timeout (ms, default: 10000)
}
```

**Trial Flow:**
1. Display START button at center
2. User clicks START
3. Target appears at random position (circular layout)
4. User clicks target
5. Measure reaction time (RT)
6. Emit `trial:end` (hit) or `trial:error` (miss/timeout)
7. Advance to next trial

**Canvas Dimensions:**
- Width: 800px
- Height: 600px
- Center: (400, 300)

### TaskPane Integration

**Task Modes:**
- **Manual**: Original trial controls (backward compatible)
- **Fitts**: Full Fitts task block

**Block Configuration:**
- **Trials per ID**: Number of repetitions per difficulty (1-20)
- **Difficulty Levels**: Checkbox selection (low, medium, high, very high)
- **Modality**: Visual, Auditory, Haptic, Multimodal
- **UI Mode**: Standard, Minimal, Enhanced
- **Pressure**: Slider (0.0 - 2.0)

**Block Management:**
- Generates randomized trial sequence
- Tracks progress (trial N of M)
- Progress bar visualization
- Stop block at any time

## Event Emissions

### `trial:start`
```typescript
{
  trialId: string
  trial: number
  A: number
  W: number
  ID: number
  modality: string
  ui_mode: string
  pressure: number
  timestamp: number
}
```

### `trial:end` (Success)
```typescript
{
  trialId: string
  trial: number
  rt_ms: number           // Reaction time in milliseconds
  duration: number        // Same as rt_ms
  correct: true
  A: number
  W: number
  ID: number
  clickPos: {x, y}
  targetPos: {x, y}
  timestamp: number
}
```

### `trial:error` (Miss or Timeout)
```typescript
{
  trialId: string
  error: 'miss' | 'timeout'
  err_type: 'miss' | 'timeout'
  rt_ms?: number          // Only for miss
  clickPos?: {x, y}       // Only for miss
  targetPos?: {x, y}
  timestamp: number
}
```

### `block:complete`
```typescript
{
  totalTrials: number
  timestamp: number
}
```

## Usage Example

### Starting a Block

1. Switch to "Fitts Task" mode
2. Configure block:
   - Set trials per ID (e.g., 5)
   - Select difficulties (e.g., low, medium, high)
   - Choose modality (e.g., visual)
   - Set UI mode (e.g., standard)
   - Adjust pressure (e.g., 1.0)
3. Click "Start Fitts Block"
4. Complete trials:
   - Click START button
   - Click target when it appears
   - Repeat for all trials
5. Block completes automatically

### Programmatic Usage

```typescript
import { computeID, ladder, generateTrialSequence } from './lib/fitts'

// Compute ID for custom A/W
const id = computeID(500, 30) // ~4.06 bits

// Generate trial sequence
const sequence = generateTrialSequence(ladder, 5, true)
// Returns 15 trials (3 difficulties × 5 trials), shuffled

// Use in component
<FittsTask
  config={sequence[0]}
  modality="visual"
  ui_mode="standard"
  pressure={1.0}
  trialNumber={1}
  onTrialComplete={() => console.log('Success!')}
  onTrialError={(type) => console.log('Error:', type)}
/>
```

## Data Analysis

### Metrics to Collect

From event logs, you can compute:

1. **Movement Time (MT)**: `rt_ms` from `trial:end`
2. **Error Rate**: Count of `trial:error` / total trials
3. **Throughput (TP)**: `ID / (MT in seconds)` bits/second
4. **Effective Width (We)**: `4.133 × SD(click positions)`
5. **Effective ID (IDe)**: `log₂(A/We + 1)`

### Example Analysis

```typescript
// Filter successful trials
const successTrials = logs.filter(e => 
  e.event === 'trial:end' && e.payload.correct
)

// Compute mean MT per ID
const mtByID = {}
successTrials.forEach(trial => {
  const id = trial.payload.ID
  if (!mtByID[id]) mtByID[id] = []
  mtByID[id].push(trial.payload.rt_ms)
})

// Compute throughput
Object.entries(mtByID).forEach(([id, times]) => {
  const meanMT = times.reduce((a,b) => a+b) / times.length
  const tp = parseFloat(id) / (meanMT / 1000)
  console.log(`ID ${id}: TP = ${tp.toFixed(2)} bits/s`)
})
```

## Design Decisions

### Cursor Speed
- **Constant**: Native browser cursor (no artificial constraints)
- **Rationale**: Allows natural pointing behavior
- **Future**: Modality layer can modify selection rules (next prompt)

### Target Layout
- **Circular**: 8 positions around center
- **Rationale**: Consistent amplitude, balanced directions
- **Alternative**: Grid layout available via `generateGridPositions()`

### Error Handling
- **Miss**: Immediate feedback, advance to next trial
- **Timeout**: 10s default, advance to next trial
- **Future**: Option to repeat failed trials

### Visual Design
- **START button**: Cyan, pulsing animation
- **Target**: Red, circular, size = W
- **Canvas**: Dark background, crosshair cursor
- **Feedback**: Implicit (next trial appears)

## Testing

### Unit Tests (`fitts.test.ts`)
- ✅ ID computation accuracy
- ✅ Preset values
- ✅ Trial sequence generation
- ✅ Position generation (circular, grid)
- ✅ Hit detection
- ✅ Error handling

### Integration Tests
Run a test block:
1. Start dev server: `npm run dev`
2. Switch to Fitts Task mode
3. Configure: 2 trials × 3 difficulties
4. Complete block
5. Check Event Logger for proper emissions

## Future Enhancements

- [ ] Adaptive difficulty based on performance
- [ ] Multi-directional target sequences (ISO 9241-9)
- [ ] Repeat-on-error option
- [ ] Real-time performance feedback
- [ ] Export trial data to CSV
- [ ] 2D error distribution visualization
- [ ] Fitts's law regression plot
- [ ] Practice trials before block
- [ ] Custom A/W input (advanced mode)
- [ ] Touch/stylus input support

## References

1. ISO 9241-9:2000 - Ergonomic requirements for office work with visual display terminals (VDTs) - Part 9: Requirements for non-keyboard input devices
2. MacKenzie, I. S. (1992). Fitts' law as a research and design tool in human-computer interaction. Human-Computer Interaction, 7(1), 91-139.
3. Soukoreff, R. W., & MacKenzie, I. S. (2004). Towards a standard for pointing device evaluation. Behaviour & Information Technology, 23(3), 149-156.

