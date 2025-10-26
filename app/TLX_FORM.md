# NASA-TLX Form Implementation

This document describes the lightweight NASA-TLX workload assessment form integrated into the XR Adaptive Modality system.

## Overview

The TLX form appears after each block completion to collect subjective workload ratings. The form captures:
- **Global Workload**: Overall perceived workload
- **Mental Demand**: Cognitive load required

These values are automatically attached to all trial rows for that block in the CSV output.

## Implementation

### Components

#### TLXForm Component

**Location**: `/app/src/components/TLXForm.tsx`

**Features**:
- Modal overlay with dark gradient background
- Two sliders (0-100 range) with gradient colors
- Real-time value display
- Animated submit/skip buttons
- Responsive design

**Props**:
```typescript
interface TLXFormProps {
  blockNumber: number
  isOpen: boolean
  onSubmit: (values: TLXValues) => void
  onClose: () => void
}
```

**Styles**: `/app/src/components/TLXForm.css`
- Modal overlay with fade-in animation
- Slider with gradient track (green → orange → red)
- Smooth transitions and hover effects
- Responsive breakpoints

### TLX Store

**Location**: `/app/src/lib/tlxStore.ts`

In-memory store for persisting TLX values per block:

```typescript
class TLXStore {
  setBlockTLX(blockNumber, values)
  getBlockTLX(blockNumber)
  hasBlockTLX(blockNumber)
  clear()
  getAllBlocks()
  size()
}
```

**Global Access**:
```typescript
import { getTlxStore } from '../lib/tlxStore'

const store = getTlxStore()
```

### Integration Flow

```
Block completes
    ↓
Show TLX modal
    ↓
User submits values
    ↓
Store TLX in memory (per block)
    ↓
Emit 'tlx:submit' event
    ↓
CSV rows for this block attach TLX values
```

## Data Flow

### 1. Block Completion

When a Fitts block completes in TaskPane:

```typescript
const handleFittsTrialComplete = () => {
  const nextIndex = currentTrialIndex + 1
  
  if (nextIndex < trialSequence.length) {
    setCurrentTrialIndex(nextIndex)
  } else {
    // Block complete - show TLX modal
    setFittsActive(false)
    setShowTlxModal(true)
    bus.emit('block:complete', {...})
  }
}
```

### 2. TLX Submission

```typescript
const handleTlxSubmit = (values: TLXValues) => {
  const tlxStore = getTlxStore()
  tlxStore.setBlockTLX(currentBlockNumber, values)
  
  bus.emit('tlx:submit', {
    blockNumber: currentBlockNumber,
    values,
    timestamp: Date.now(),
  })
  
  setShowTlxModal(false)
  setCurrentTrialIndex(0)
}
```

### 3. CSV Attachment

In LoggerPane, when logging trial events:

```typescript
if (eventName === 'trial:end' || eventName === 'trial:error') {
  let row = createRowFromTrial(payload, blockNumber)
  
  // Attach TLX values from store
  const tlxStore = getTlxStore()
  const tlxValues = tlxStore.getBlockTLX(blockNumber)
  row = attachTlxToRow(row, tlxValues)
  
  logger.pushRow(row)
}
```

### 4. Helper Functions

From `/app/src/lib/csv.ts`:

```typescript
/**
 * Attach TLX values to a CSV row
 */
export function attachTlxToRow(
  row: CSVRow, 
  tlxValues?: { global: number; mental: number }
): CSVRow {
  if (tlxValues) {
    row.tlx_global = tlxValues.global
    row.tlx_mental = tlxValues.mental
  }
  return row
}
```

## UI/UX Design

### Modal Design

- **Overlay**: Dark semi-transparent (85% opacity)
- **Content**: Dark blue gradient with cyan border
- **Animation**: Fade-in and slide-up
- **Responsive**: Adapts to mobile screens

### Sliders

- **Track**: Green (0) → Orange (50) → Red (100)
- **Thumb**: Cyan circle with white border
- **Size**: 24px diameter
- **Hover Effect**: Scales up 15%, glows stronger
- **Labels**: Low | Medium | High

### Buttons

**Submit Button**:
- Gradient cyan-blue background
- Shadow effect
- Hover lift animation
- Uppercase text

**Skip Button**:
- Transparent background
- Gray border
- Hover background fade

## Event Bus

### New Event Type

```typescript
'tlx:submit': {
  blockNumber: number
  values: {
    global: number
    mental: number
  }
  timestamp: number
}
```

### Usage

```typescript
// Subscribe to TLX submissions
bus.on('tlx:submit', (payload) => {
  console.log('TLX submitted:', payload.values)
})

// Emit TLX submission
bus.emit('tlx:submit', {
  blockNumber: 1,
  values: { global: 75, mental: 60 },
  timestamp: Date.now(),
})
```

## CSV Integration

### Schema Columns

The TLX values appear in two columns:
- `tlx_global`: Global workload rating (0-100)
- `tlx_mental`: Mental demand rating (0-100)

### Example CSV Row

```csv
pid,ts,block,trial,modality,ui_mode,pressure,aging,ID,A,W,target_x,target_y,rt_ms,correct,err_type,hover_ms,confirm_type,pupil_z_med,tlx_global,tlx_mental,browser,dpi
P001,1698765432100,1,1,gaze,standard,1.0,false,3.17,200,50,300,200,450,true,,,space,,75,60,Chrome,2
P001,1698765432200,1,2,gaze,standard,1.0,false,3.17,200,50,400,300,520,true,,,space,,75,60,Chrome,2
```

All trials in Block 1 will have the same TLX values (75, 60).

## Testing

### Manual Testing

1. **Start a Fitts block** with any configuration
2. **Complete the block** by finishing all trials
3. **Verify TLX modal appears** with sliders
4. **Adjust sliders** and verify values update
5. **Submit TLX values**
6. **Check CSV output** - TLX columns should be populated for all trials in that block

### Automated Tests

```typescript
describe('TLX Form', () => {
  it('should show modal after block completion', () => {
    // Test implementation
  })
  
  it('should attach TLX values to CSV rows', () => {
    // Test implementation
  })
  
  it('should store TLX per block', () => {
    // Test implementation
  })
})
```

## Design Rationale

### Why Two Scales?

- **Global Workload**: Captures overall task difficulty
- **Mental Demand**: Specifically measures cognitive load

This two-scale approach provides both a holistic and specific workload assessment.

### Why Modal Design?

- **Non-intrusive**: Appears only when needed
- **Focused**: Prevents interaction with main app
- **Clear**: Draws attention to the assessment

### Why Per-Block Storage?

- **Practical**: Users can complete an entire block then assess
- **Consistent**: All trials in a block share context
- **Efficient**: Single assessment per block reduces fatigue

## Future Enhancements

1. **Full NASA-TLX**: Add all 6 subscales (mental, physical, temporal, performance, effort, frustration)
2. **Conditional Display**: Only show TLX for specific conditions
3. **Adaptive Frequency**: Adjust based on block duration
4. **Visualizations**: Show workload trends
5. **Export TLX Separately**: Separate TLX-only CSV for analysis
6. **Customizable Scales**: Allow researchers to define custom scales

## References

- NASA-TLX: [Hart & Staveland, 1988]
- Workload measurement in HCI: [Hart, 2006]
- Subjective mental workload: [Cain, 2007]

## API Reference

### TLXForm Component

```typescript
export interface TLXValues {
  global: number
  mental: number
}

<TLXForm
  blockNumber={1}
  isOpen={showModal}
  onSubmit={handleSubmit}
  onClose={handleClose}
/>
```

### TLX Store

```typescript
import { getTlxStore } from '../lib/tlxStore'

const store = getTlxStore()
store.setBlockTLX(1, { global: 75, mental: 60 })
const values = store.getBlockTLX(1) // Returns { global: 75, mental: 60 }
```

### CSV Helpers

```typescript
import { attachTlxToRow } from '../lib/csv'

let row = createRowFromTrial(payload, blockNumber)
row = attachTlxToRow(row, tlxValues)
```

