# Policy-Based Adaptation Engine Documentation

## Overview

The policy-based adaptation engine implements rule-based adaptive behavior that responds to user performance. It monitors trial history and triggers UI adaptations when performance degrades, following configurable policies.

## Policy Configuration

### Location
`/policy/policy.default.json`

### Structure

```json
{
  "adaptive": true,
  "pressure_only": true,
  "hysteresis_trials": 5,
  "gaze": {
    "trigger": {
      "rt_p": 75,
      "err_burst": 2
    },
    "action": "declutter"
  },
  "hand": {
    "trigger": {
      "rt_p": 75,
      "err_burst": 2
    },
    "action": "inflate_width",
    "delta_w": 0.25
  },
  "fallback": {
    "use_performance_triggers": true,
    "use_camera": false
  }
}
```

### Parameters

**Global Settings:**
- `adaptive` (boolean): Enable/disable adaptation engine
- `pressure_only` (boolean): Only adapt when pressure ≥ 1.5
- `hysteresis_trials` (number): Consecutive trials needed to trigger/deactivate

**Modality-Specific Settings:**

Each modality (`gaze`, `hand`) has:
- `trigger.rt_p` (number): RT percentile threshold (e.g., 75 = p75)
- `trigger.err_burst` (number): Consecutive errors to trigger
- `action` (string): Adaptation action to take
- `delta_w` (number, optional): Width inflation factor for `inflate_width`

**Fallback Settings:**
- `use_performance_triggers` (boolean): Use RT/error triggers
- `use_camera` (boolean): Use camera-based triggers (future)

## Adaptation Actions

### 1. Declutter (Gaze Mode)

**Trigger**: Performance degradation in gaze mode
**Effect**: Hide non-critical UI elements
**Implementation**: Adds `.decluttered` class to HUDPane

**Hidden Elements:**
- Last event timestamp
- System status indicator
- Policy reason text

**Rationale**: Reduces visual clutter to help user focus on target

### 2. Inflate Width (Hand Mode)

**Trigger**: Performance degradation in hand mode
**Effect**: Increase target width by delta factor
**Implementation**: Multiplies target W by (1 + delta_w)

**Default**: W × 1.25 (25% increase)
**Visual**: Orange border, pulsing glow
**Rationale**: Makes targets easier to hit

### 3. None

**Effect**: No adaptation active
**State**: Default/baseline condition

## Trigger Detection

### RT Percentile (rt_p)

**Computation**:
1. Collect successful trials for current modality
2. Extract RT values
3. Compute 75th percentile (p75)
4. Compare current RT to p75
5. Trigger if current RT > p75

**Example**:
```typescript
// Historical RTs: [500, 600, 700, 800]
// p75 = 725ms
// Current RT = 850ms
// Trigger: 850 > 725 ✓
```

### Error Burst (err_burst)

**Computation**:
1. Look at recent trials (last 10)
2. Find longest consecutive error streak
3. Trigger if streak ≥ threshold

**Example**:
```typescript
// Recent trials: [✓, ✓, ✗, ✗, ✗, ✓]
// Max streak = 3
// Threshold = 2
// Trigger: 3 ≥ 2 ✓
```

## Hysteresis

**Purpose**: Prevent rapid toggling between states

**Mechanism**:
- **Activation**: Requires N consecutive "bad" trials
- **Deactivation**: Requires N consecutive "good" trials

**Default**: N = 5 trials

**Example**:
```
Trial: 1  2  3  4  5  6  7  8  9  10
Error: ✗  ✗  ✗  ✗  ✗  ✓  ✓  ✓  ✓  ✓
State: -  -  -  -  ON ON ON ON ON OFF
```

## Implementation

### Core Library (`/app/src/lib/policy.ts`)

#### Key Functions

**`loadPolicy(path)`**
- Fetches policy JSON from server
- Returns PolicyConfig object
- Falls back to default on error

**`computeTriggers(history, modality)`**
- Analyzes trial history
- Returns trigger metrics:
  - `rt_p75`: 75th percentile RT
  - `err_burst`: Max consecutive errors
  - `recent_errors`: Errors in last 10 trials
  - `total_trials`: Total trials for modality

**`PolicyEngine.nextPolicyState(params)`**
- Evaluates current conditions
- Applies hysteresis logic
- Returns new policy state
- Emits events on state change

#### PolicyEngine Class

```typescript
const engine = new PolicyEngine(policy)

// Add trial to history
engine.addTrial({
  trialId: 'trial-123',
  modality: 'hand',
  rt_ms: 850,
  correct: true,
  timestamp: Date.now()
})

// Compute next state
const state = engine.nextPolicyState({
  modality: Modality.HAND,
  pressure: 2.0,
  currentRT: 850
})

// Check action
if (state.action === 'inflate_width') {
  // Apply width inflation
  const widthScale = 1.0 + state.delta_w
}
```

### Component Integration

#### App.tsx

Initializes policy engine on mount:
```typescript
useEffect(() => {
  initializePolicyEngine()
}, [])
```

#### HUDPane

**Responsibilities**:
1. Collect trial data from events
2. Add to policy engine history
3. Compute policy state after each trial
4. Emit `policy:change` events
5. Display policy status
6. Apply declutter mode

**Event Handlers**:
```typescript
handleTrialEnd(payload) {
  // Add to history
  policyEngine.addTrial({...})
  
  // Compute new state
  const newState = policyEngine.nextPolicyState({...})
  
  // Emit if changed
  if (newState.action !== currentAction) {
    bus.emit('policy:change', {
      policy: newState.action,
      state: newState,
      timestamp: Date.now()
    })
  }
}
```

**Declutter Mode**:
```tsx
<div className={`hud-pane ${action === 'declutter' ? 'decluttered' : ''}`}>
  <div className="noncritical">Hidden when decluttered</div>
</div>
```

#### TaskPane

**Responsibilities**:
1. Listen for `policy:change` events
2. Update width scale factor
3. Pass to FittsTask

**Implementation**:
```typescript
useEffect(() => {
  bus.on('policy:change', (payload) => {
    if (payload.state.action === 'inflate_width') {
      setWidthScale(1.0 + payload.state.delta_w)
    } else {
      setWidthScale(1.0)
    }
  })
}, [])
```

#### FittsTask

**Responsibilities**:
1. Accept `widthScale` prop
2. Apply to target rendering
3. Use for hit detection

**Implementation**:
```typescript
const effectiveWidth = config.W * widthScale

<div style={{
  width: `${effectiveWidth}px`,
  height: `${effectiveWidth}px`
}} />
```

## Event Flow

### Trial Success Flow

```
1. User completes trial
2. FittsTask emits trial:end
3. HUDPane receives event
4. Add to policy engine history
5. Compute triggers (RT p75, error burst)
6. Evaluate policy state
7. If state changed:
   a. Update local state
   b. Emit policy:change
8. TaskPane receives policy:change
9. Update width scale
10. FittsTask renders with new width
```

### Trial Error Flow

```
1. User makes error (miss/timeout/slip)
2. FittsTask emits trial:error
3. HUDPane receives event
4. Add to policy engine history (error=true)
5. Compute triggers (error burst++)
6. If error burst ≥ threshold:
   a. Increment bad trial count
   b. If bad count ≥ hysteresis:
      - Activate adaptation
      - Emit policy:change
7. Components apply adaptation
```

## Visual Feedback

### Policy Status Badge (HUDPane)

```tsx
{policyState.action !== 'none' && (
  <div className="policy-status">
    <div className="policy-badge">
      ⚡ Adaptation Active: {action}
    </div>
    <div className="policy-reason">{reason}</div>
  </div>
)}
```

**Styling**:
- Orange border with pulsing animation
- Lightning bolt icon (flashing)
- Reason text (italic, gray)

### Inflated Target (FittsTask)

**Styling**:
- Orange border (instead of red)
- Pulsing glow effect
- Scale indicator: "×1.25" next to width

### Decluttered HUD

**Effect**:
- Hides `.noncritical` elements
- Keeps critical info visible:
  - Modality switch
  - Policy status
  - Core statistics

## Data Analysis

### Metrics to Track

**From Event Logger:**
```typescript
// Filter policy change events
const policyEvents = logs.filter(e => e.event === 'policy:change')

// Count activations
const activations = policyEvents.filter(e => 
  e.payload.state.action !== 'none'
)

// Time in adapted state
const adaptedTime = computeAdaptedDuration(policyEvents)

// Trials until adaptation
const trialsToAdapt = computeTrialsUntilAdaptation(logs)
```

**Performance Comparison:**
```typescript
// Before adaptation
const beforeRT = logs
  .filter(e => e.event === 'trial:end' && !isAdapted(e.timestamp))
  .map(e => e.payload.rt_ms)

// During adaptation
const duringRT = logs
  .filter(e => e.event === 'trial:end' && isAdapted(e.timestamp))
  .map(e => e.payload.rt_ms)

// Compare
console.log('Before:', mean(beforeRT), 'ms')
console.log('During:', mean(duringRT), 'ms')
console.log('Improvement:', mean(beforeRT) - mean(duringRT), 'ms')
```

## Configuration Examples

### Aggressive Adaptation

```json
{
  "adaptive": true,
  "pressure_only": false,
  "hysteresis_trials": 2,
  "gaze": {
    "trigger": {
      "rt_p": 50,
      "err_burst": 1
    },
    "action": "declutter"
  }
}
```

**Effect**: Adapts quickly, even at low pressure

### Conservative Adaptation

```json
{
  "adaptive": true,
  "pressure_only": true,
  "hysteresis_trials": 10,
  "hand": {
    "trigger": {
      "rt_p": 90,
      "err_burst": 5
    },
    "action": "inflate_width",
    "delta_w": 0.15
  }
}
```

**Effect**: Adapts slowly, only under high pressure

### Disabled Adaptation

```json
{
  "adaptive": false
}
```

**Effect**: No adaptation, baseline condition

## Testing

### Unit Tests (`policy.test.ts`)

- ✅ Policy loading and defaults
- ✅ Trigger computation (RT p75, error burst)
- ✅ Modality filtering
- ✅ Hysteresis logic
- ✅ State transitions
- ✅ History management

### Integration Testing

**Manual Test Procedure:**
1. Start Fitts block (hand mode, pressure=2.0)
2. Make 5 consecutive errors
3. Observe adaptation: inflate_width
4. See orange target border
5. Complete 5 successful trials
6. Observe deactivation
7. Switch to gaze mode
8. Make 5 consecutive errors
9. Observe adaptation: declutter
10. See HUD elements hidden

## Design Rationale

### Why Hysteresis?

**Problem**: Rapid toggling between states is disruptive
**Solution**: Require N consecutive trials to change state
**Benefit**: Stable, predictable behavior

### Why Modality-Specific Actions?

**Gaze Mode**: Visual attention is limited
- **Action**: Declutter (reduce visual load)

**Hand Mode**: Motor control is the bottleneck
- **Action**: Inflate width (reduce motor precision requirement)

### Why Pressure Threshold?

**Rationale**: Only adapt when task is challenging
**Default**: pressure ≥ 1.5
**Benefit**: Avoids unnecessary adaptation in easy conditions

## Future Enhancements

- [ ] Adaptive hysteresis (based on stability)
- [ ] Multi-level adaptations (small, medium, large)
- [ ] Camera-based triggers (gaze tracking, posture)
- [ ] Personalized thresholds (per-user calibration)
- [ ] Predictive adaptation (ML-based)
- [ ] Combination actions (declutter + inflate)
- [ ] Gradual adaptation (smooth transitions)
- [ ] Adaptation history visualization
- [ ] A/B testing framework
- [ ] Real-time policy editing

## References

1. Feigh, K. M., Dorneich, M. C., & Hayes, C. C. (2012). Toward a characterization of adaptive systems: a framework for researchers and system designers. Human factors, 54(6), 1008-1024.
2. Kaber, D. B., & Endsley, M. R. (2004). The effects of level of automation and adaptive automation on human performance, situation awareness and workload in a dynamic control task. Theoretical Issues in Ergonomics Science, 5(2), 113-153.
3. Scerbo, M. W. (1996). Theoretical perspectives on adaptive automation. In Automation and human performance: Theory and applications (pp. 37-63).

