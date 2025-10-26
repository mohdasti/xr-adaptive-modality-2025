# Application Architecture

## Overview

The XR Adaptive Modality application features a three-pane control panel layout with a global event bus for inter-component communication. It includes a Fitts's Law task implementation for measuring human motor performance in target selection tasks.

## Layout Structure

```
┌─────────────────────────────────────────────────────┐
│              XR Adaptive Modality                    │
│                  Control Panel                       │
├──────────────────────┬──────────────────────────────┤
│                      │                               │
│    Task Control      │       System HUD              │
│                      │                               │
├──────────────────────┴──────────────────────────────┤
│                                                       │
│                  Event Logger                        │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. TaskPane (`/src/components/TaskPane.tsx`)

**Purpose**: Primary control interface for managing trials and policies.

**Modes**:
- **Manual Mode**: Simple trial controls for testing
- **Fitts Task Mode**: Full Fitts's Law target selection task

**Manual Mode Features**:
- Start/End trial controls
- Error trigger button
- Policy selection dropdown
- Active trial status display

**Fitts Task Features**:
- Block configuration (trials per ID, difficulty levels)
- Modality selection (visual, auditory, haptic, multimodal)
- UI mode and pressure settings
- Randomized trial sequences
- Progress tracking
- Canvas-based target selection

**Events Emitted**:
- `trial:start` - When a trial begins (with A, W, ID, modality, etc.)
- `trial:end` - When a trial completes (with RT, accuracy, click position)
- `trial:error` - When an error occurs (miss or timeout)
- `policy:change` - When policy selection changes
- `block:complete` - When a Fitts block finishes

### 2. HUDPane (`/src/components/HUDPane.tsx`)

**Purpose**: Real-time statistics and system status display.

**Features**:
- Total trials counter
- Active trials counter
- Error count
- Current policy display
- Last event timestamp
- System status indicator

**Events Subscribed**:
- `trial:start` - Increments counters
- `trial:end` - Decrements active trials
- `trial:error` - Increments error count
- `policy:change` - Updates policy display

### 3. LoggerPane (`/src/components/LoggerPane.tsx`)

**Purpose**: Event logging and debugging interface.

**Features**:
- Table view of last 20 events
- Event type, timestamp, and payload display
- Color-coded event types
- Clear logs functionality
- Auto-scroll to newest events

**Events Subscribed**:
- `trial:start`
- `trial:end`
- `trial:error`
- `policy:change`

## Fitts's Law Task

### Overview
Implementation of Fitts's Law target selection paradigm following ISO 9241-9 guidelines.

**Shannon Formulation**: `ID = log₂(A/W + 1)`
- **A**: Amplitude (distance to target in pixels)
- **W**: Width (target size in pixels)
- **ID**: Index of Difficulty (bits)

### Components

**FittsTask** (`/src/components/FittsTask.tsx`)
- Canvas-based target selection (800×600px)
- Circular target layout (8 positions)
- Reaction time measurement
- Hit/miss detection
- Timeout handling (default: 10s)

**Fitts Library** (`/src/lib/fitts.ts`)
- `computeID(A, W)` - Calculate index of difficulty
- `generateTrialSequence()` - Create randomized blocks
- `generateCircularPositions()` - Position targets
- `isHit()` - Detect successful selections
- Preset difficulties: low (~1.7 bits), medium (~3.3 bits), high (~5.0 bits)

### Trial Flow
1. Click START button at center
2. Target appears at random position
3. Click target as quickly as possible
4. RT measured from START to target click
5. Emit `trial:end` (success) or `trial:error` (miss/timeout)
6. Advance to next trial

See [FITTS_TASK.md](FITTS_TASK.md) for detailed documentation.

## Modality System

### Overview
Adaptive selection mechanics supporting different interaction paradigms.

**Modalities:**
- **Hand-like**: Direct pointing (move cursor + click)
- **Gaze-like**: Hover-based selection (dwell or Space key confirmation)

### Selection Rules

**Hand Mode:**
- Standard mouse interaction
- Click to select
- Immediate feedback

**Gaze Mode:**
- Cursor hidden (replaced with cyan gaze point)
- Hover target to begin selection
- Two confirmation methods:
  1. **Dwell-based** (350ms or 500ms): Auto-confirm after hovering
  2. **Confirmation-based** (Space key): Manual confirmation while hovering

### Error Types

- **miss**: Click/confirm outside target
- **timeout**: No selection within time limit
- **slip**: Space pressed without hovering target (gaze mode only)

### Visual Feedback

**Gaze Mode Indicators:**
- Target border turns cyan when hovering
- Dwell progress: Growing circle inside target
- Confirmation prompt: "Press SPACE" tooltip
- Custom cursor: Cyan dot (simulates gaze point)

### Modality Switch (HUDPane)

Radio buttons for modality selection:
- 👆 Hand-like
- 👁️ Gaze-like

Dwell time dropdown (gaze mode):
- Space key
- 350ms dwell
- 500ms dwell

See [MODALITY.md](MODALITY.md) for detailed documentation.

## Event Bus System

### Location
`/src/lib/bus.ts`

### API

```typescript
// Subscribe to an event
bus.on(event: string, handler: (payload: any) => void): void

// Unsubscribe from an event
bus.off(event: string, handler: (payload: any) => void): void

// Emit an event
bus.emit(event: string, payload?: any): void

// Clear all subscriptions
bus.clear(): void
```

### Event Types

| Event | Payload | Description |
|-------|---------|-------------|
| `trial:start` | `{ trialId, trial?, A?, W?, ID?, modality?, ui_mode?, pressure?, timestamp }` | Trial begins |
| `trial:end` | `{ trialId, trial?, duration, rt_ms?, correct?, A?, W?, ID?, clickPos?, targetPos?, timestamp }` | Trial completes |
| `trial:error` | `{ trialId, error, err_type?, rt_ms?, clickPos?, targetPos?, timestamp }` | Error occurs (miss/timeout/slip) |
| `modality:change` | `{ config: { modality, dwellTime }, timestamp }` | Modality switched |
| `policy:change` | `{ policy, timestamp }` | Policy changes |
| `block:complete` | `{ totalTrials, timestamp }` | Fitts block finishes |

### Usage Example

```typescript
import { bus } from './lib/bus'

// Subscribe to an event
const handler = (payload) => {
  console.log('Event received:', payload)
}
bus.on('trial:start', handler)

// Emit an event
bus.emit('trial:start', { 
  trialId: 'trial-123', 
  timestamp: Date.now() 
})

// Unsubscribe
bus.off('trial:start', handler)
```

## Styling

### Approach
- CSS Modules per component
- Dark theme with cyan/blue accents
- Responsive grid layout
- Utility-first approach for common patterns

### Color Palette
- Background: `#0f0f0f`, `#1a1a1a`, `#1a1a2e`
- Primary: `#00d9ff` (cyan)
- Success: `#00ff88` (green)
- Error: `#ff4444` (red)
- Warning: `#ffa500` (orange)
- Text: `#e0e0e0`, `#b0b0b0`, `#808080`

### Responsive Breakpoints
- Desktop: 2-column grid (Task/HUD side-by-side)
- Mobile (<1024px): Single column stack

## Testing

### Unit Tests
- Component rendering tests
- Event bus functionality tests
- Event handler registration/cleanup

### E2E Tests (Playwright)
- Full trial workflow
- Policy change workflow
- Error handling
- Logger functionality
- Clear logs feature

## Development Workflow

1. **Start dev server**: `npm run dev`
2. **Make changes** to components
3. **Test event flow** using browser console:
   ```javascript
   // Access bus from console
   window.bus = require('./lib/bus').bus
   window.bus.emit('trial:start', { trialId: 'test', timestamp: Date.now() })
   ```
4. **Run tests**: `npm run test`
5. **Build**: `npm run build`

## Future Enhancements

- [ ] Event persistence (localStorage/IndexedDB)
- [ ] Export logs to CSV/JSON
- [ ] Real-time event filtering
- [ ] Event replay functionality
- [ ] WebSocket integration for multi-user sessions
- [ ] Custom event type registration
- [ ] Event analytics dashboard
- [ ] Keyboard shortcuts for common actions

