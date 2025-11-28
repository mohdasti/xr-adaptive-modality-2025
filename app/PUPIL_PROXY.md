# Pupil Diameter Proxy System

This document describes the optional pupil diameter proxy system using webcam and luminance estimation.

## ⚠️ Important Disclaimer

**This is a simplified proxy system and should NOT be used for medical diagnosis.**
Use only for research purposes with informed consent.

**Scientific Validity Warning:**
This luminance-based proxy is **not scientifically valid for measuring cognitive workload** in uncontrolled remote settings due to the dominant influence of the Pupillary Light Reflex. Use NASA-TLX for workload assessment instead. See [Limitations](#scientific-validity) section for details.

**Privacy Protection:**
- No video frames are stored or transmitted
- Only a scalar z-score value is logged
- Camera access can be denied or revoked at any time
- All data remains local to your browser

## Overview

The pupil proxy system provides a simplified measure of cognitive load using:

1. **Webcam Access**: Front-facing camera (`getUserMedia`)
2. **Luminance Sampling**: Center region luminance as a proxy for pupil size
3. **Z-Score Calculation**: Normalized value relative to baseline
4. **Policy Integration**: Optional trigger for adaptation

### How It Works

```typescript
Camera Frame → Center Region Sampling → Luminance Calculation → Z-Score → Policy Trigger
```

**Luminance Formula:**
```
Luminance = 0.299 × Red + 0.587 × Green + 0.114 × Blue
```

**Z-Score:**
```
z = (luminance - mean) / std
```

## Implementation

### PupilTracker Class

**Location**: `/app/src/lib/pupil.ts`

```typescript
class PupilTracker {
  async start(): Promise<void>
  stop(): void
  getMedianZScore(): number
  getCurrentReading(): PupilReading | null
  onReading(callback: (reading: PupilReading) => void)
  running: boolean
}
```

**Features:**
- Captures frames at 10-20fps
- Samples center 40×40 region
- Maintains rolling buffer of last 20 readings
- Returns median z-score over last 1-2 seconds
- Emits readings via callback

### Usage

```typescript
import { getPupilTracker } from '../lib/pupil'

const tracker = getPupilTracker()

// Start tracking
await tracker.start()

// Subscribe to readings
tracker.onReading((reading) => {
  console.log('Z-score:', reading.zScore)
})

// Get median
const medianZ = tracker.getMedianZScore()

// Stop tracking
tracker.stop()
```

## Policy Integration

### Configuration

In `/policy/policy.default.json`:

```json
{
  "fallback": {
    "use_performance_triggers": true,
    "use_camera": false
  }
}
```

### Policy Behavior

- **`use_camera: false`**: Pupil proxy disabled (default)
- **`use_camera: true`**: Pupil proxy enabled (requires camera permission)

**Important**: When `use_camera` is true, the pupil z-score is used as an additional trigger alongside performance triggers (RT percentile, error bursts). Performance triggers remain the primary ground truth.

### Policy Engine Check

```typescript
// In policy.ts
if (this.policy.fallback.use_camera && pupilZScore > threshold) {
  // Trigger adaptation (supplementary to performance triggers)
}
```

## UI Integration

### HUDPane Toggle

**Location**: `/app/src/components/HUDPane.tsx`

**Features:**
- Checkbox toggle for camera/pupil tracking
- Consent text (animated warning box)
- Clear privacy statement
- Real-time status indicator

### Consent Text

```
⚠️ Consent: This feature uses your webcam to estimate cognitive load via pupil proxy.
No video frames are stored or transmitted—only a scalar value (luminance-based z-score).
Your privacy is protected.
```

### Visual Indicators

- **Checkbox**: 📷 Pupil Proxy (Camera Required)
- **Consent Box**: Orange pulsing border with warning text
- **Status**: Real-time z-score display (optional)

## Data Logging

### CSV Integration

The pupil z-score is automatically logged in the `pupil_z_med` column:

```csv
pid,ts,block,trial,...,pupil_z_med,tlx_global,tlx_mental,browser,dpi
P001,1698765432100,1,1,...,0.5,75,60,Chrome,2
```

**Values:**
- `pupil_z_med`: Median z-score over last 1-2 seconds (scalar only)
- Positive z-score: Increased pupil size (higher cognitive load)
- Negative z-score: Decreased pupil size (lower cognitive load)

### Privacy Guarantees

✅ **No video storage**  
✅ **No frame transmission**  
✅ **Only scalar z-score logged**  
✅ **Camera permission can be revoked**  
✅ **Data remains local**  

## Technical Details

### Implementation Architecture

```
Camera → Video Element → Canvas Sampling → Luminance Calc → Z-Score → Event Bus
```

### Code Structure

```typescript
// 1. Request camera permission
const stream = await navigator.mediaDevices.getUserMedia({ video: {...} })

// 2. Capture frames
ctx.drawImage(video, 0, 0, width, height)

// 3. Sample center region
const imageData = ctx.getImageData(centerX, centerY, size, size)

// 4. Calculate luminance
const luminance = 0.299 * r + 0.587 * g + 0.114 * b

// 5. Compute z-score
const zScore = (luminance - baselineMean) / baselineStd

// 6. Emit reading
onReadingCallback(reading)
```

### Parameters

- **Frame Rate**: 10-20fps (50ms intervals)
- **Sample Region**: 40×40 pixels (center)
- **Buffer Size**: 20 readings (~1-2 seconds)
- **Baseline**: Mean=128, Std=20 (configurable)

## Usage Examples

### Basic Setup

```typescript
import { getPupilTracker, checkCameraAvailability } from '../lib/pupil'

// Check if camera is available
const available = await checkCameraAvailability()
if (!available) {
  console.log('Camera not available')
}

// Start tracker
const tracker = getPupilTracker()
await tracker.start()

// Monitor readings
tracker.onReading((reading) => {
  console.log('Current z-score:', reading.zScore)
  console.log('Raw luminance:', reading.rawLuminance)
})

// Get median for logging
const median = tracker.getMedianZScore()

// Stop when done
tracker.stop()
```

### Integration with FittsTask

```typescript
// In FittsTask.tsx
useEffect(() => {
  if (cameraEnabled) {
    const tracker = getPupilTracker()
    
    const startTracking = async () => {
      try {
        await tracker.start()
        tracker.onReading((reading) => {
          setPupilZScore(reading.zScore)
        })
      } catch (error) {
        console.error('Camera access denied:', error)
      }
    }
    
    startTracking()
    
    return () => {
      tracker.stop()
    }
  }
}, [cameraEnabled])
```

## Best Practices

### Privacy

1. **Always Request Explicit Consent**: Don't start camera without user approval
2. **Clear Communication**: Explain why camera is needed
3. **Minimal Data**: Only log z-score, never frames
4. **User Control**: Allow easy disable
5. **Transparency**: Show what's being measured

### Research Ethics

1. **Informed Consent**: Obtain explicit permission
2. **Data Protection**: No raw video storage
3. **Right to Withdraw**: Easy opt-out
4. **Transparency**: Clear privacy policy
5. **Minimize Risk**: Only what's necessary

### Technical Considerations

1. **Graceful Degradation**: System works without camera
2. **Error Handling**: Handle camera denial
3. **Performance**: 10-20fps max to reduce CPU load
4. **Browser Compatibility**: Test across browsers
5. **Mobile Support**: Handle device-specific issues

## Limitations

### Scientific Validity

⚠️ **CRITICAL LIMITATION: Luminance Confound**

This pupil proxy system has a **fundamental scientific limitation** that must be acknowledged:

- **Primary Driver**: In uncontrolled lighting environments (remote studies), pupil diameter is driven **90%+ by the Pupillary Light Reflex**, not cognitive load (Locus Coeruleus activity).
- **Confounding Factors**: 
  - User movement (leaning back/forward changes face illumination)
  - UI changes (dark/light button appearances)
  - Ambient lighting variations
  - Screen brightness changes
- **Signal Validity**: The luminance-based z-score is **scientifically invalid for measuring cognitive workload** in this context.

**Recommendation for Research Use:**
- **DO NOT** use `pupil_z_med` as a primary or secondary outcome for "Cognitive Load" claims
- **DO** use NASA-TLX (H5) for workload assessment
- **Optional Use**: Consider using pupil proxy only as a "movement artifact" detector or remove it entirely to save bandwidth/processing power
- **Reporting**: If used, explicitly state limitations and do not claim it measures cognitive load

### Accuracy

- **Proxy Measure**: Not true pupil diameter
- **Simplified Model**: Luminance-only estimation
- **Environmental Factors**: Lighting affects readings (dominant factor)
- **Individual Variation**: Baseline varies by person

### Constraints

- **Camera Required**: Needs webcam access
- **Privacy Concerns**: Some users may decline
- **Browser Permissions**: Subject to browser policy
- **Performance Impact**: Slight CPU/GPU usage
- **Scientific Validity**: Limited by luminance confound in uncontrolled settings

## Future Enhancements

1. **True Pupil Tracking**: Computer vision-based detection
2. **Better Baseline**: Adaptive baseline calculation
3. **Multiple Metrics**: Combine luminance with other proxies
4. **Visualization**: Real-time pupil proxy graph
5. **Calibration Mode**: Pre-trial baseline calibration

## References

- Pupil diameter and cognitive load: [Kahneman & Beatty, 1966]
- Physiological measures in HCI: [Wilson & Russell, 2003]
- Privacy in biometric research: [Friedewald et al., 2010]

## Troubleshooting

### Camera Permission Denied

```typescript
// Check status and handle gracefully
if (!available) {
  console.warn('Camera unavailable, falling back to performance triggers only')
  // System continues without pupil proxy
}
```

### No Readings

- Check if camera permission granted
- Verify camera is connected
- Check browser console for errors
- Ensure HTTPS context (required for getUserMedia)

### Inconsistent Readings

- Stable lighting environment
- Avoid background motion
- Proper camera positioning
- Consider recalibrating baseline

## Research Ethics

### Consent Form Template

```
RESEARCH STUDY: Pupil Diameter Proxy Measurement

This study uses your webcam to estimate cognitive workload via pupil proxy analysis.

DATA COLLECTION:
- Webcam access for luminance sampling
- NO video frames stored or transmitted
- Only a scalar z-score value logged
- Data remains local to your browser

PRIVACY PROTECTION:
- No biometric features extracted
- No face recognition
- No raw video data
- Scalar proxy only

YOUR RIGHTS:
- Right to decline camera access
- Right to withdraw at any time
- Right to delete your data
- No video recording

I consent to participating in this research study.
```

## API Reference

### PupilTracker

```typescript
interface PupilReading {
  zScore: number
  rawLuminance: number
  timestamp: number
}
```

### Global Functions

```typescript
getPupilTracker(): PupilTracker
resetPupilTracker(): void
checkCameraAvailability(): Promise<boolean>
```

## Testing

### Manual Testing

1. Enable camera toggle in HUDPane
2. Check consent text appears
3. Grant camera permission
4. Verify readings appear in console
5. Check CSV output for `pupil_z_med` column

### Automated Tests

```typescript
describe('Pupil Tracker', () => {
  it('should request camera permission', async () => {
    // Test implementation
  })
  
  it('should calculate z-scores', () => {
    // Test implementation
  })
  
  it('should respect policy flag', () => {
    // Test implementation
  })
})
```

