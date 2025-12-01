# Apparatus & Methodological Notes

## Target Selection Tolerance

### Hand Mode (Mouse Input)
- **Tolerance**: Strict - uses `effectiveWidth / 2` (target radius)
- **Rationale**: Direct mouse control allows precise clicking within visual target boundaries
- **Implementation**: `isHit(clickPos, targetPos, effectiveWidth)` in `FittsTask.tsx` (Line 373)

### Gaze Mode (Simulated Eye Tracking)
- **Tolerance**: Forgiving - uses `hitRadius + DWELL_TOLERANCE_PX` (10px tolerance beyond visual boundary)
- **Rationale**: 
  - Accounts for physiological tremor (fixation instability ~0.12° visual angle)
  - Simulates real-world eye tracker noise and drift
  - Prevents frustration from micro-movements resetting dwell timer
- **Implementation**: `FittsTask.tsx` Line 585-587
  ```typescript
  const hitRadius = hitSize / 2
  const isHovering = distance <= (hitRadius + DWELL_TOLERANCE_PX)
  ```
  Where `DWELL_TOLERANCE_PX = 10`

### Scientific Justification

This tolerance difference is **scientifically valid** and necessary:

1. **Physiological Accuracy**: Real eye trackers have ~0.12° (≈0.5mm at 60cm) fixation noise. The 10px tolerance accounts for this in screen space.

2. **Fitts' Law Validity**: The tolerance is **fixed** (not adaptive) to maintain valid throughput calculations. Throughput is only comparable if error rates are controlled, which they are via ISO 9241-9 error rate feedback.

3. **Usability**: Without tolerance, gaze dwell would be frustratingly sensitive to natural eye micro-movements.

### Documentation for Paper

In the "Apparatus" or "Stimuli" section, include:

> *"To account for physiological tremor and eye tracker noise (fixation instability ~0.12° visual angle), gaze selection utilized a 10px tolerance radius beyond the visual target boundary. Hand (mouse) selection used strict boundary detection with no tolerance, as mouse control allows precise clicking. This tolerance difference is fixed across all trials to maintain Fitts' Law validity, and error rates were controlled via real-time feedback (ISO 9241-9 compliant)."*

## Timing Precision

All reaction time measurements use `performance.now()` (monotonic, sub-millisecond precision) rather than `Date.now()` to avoid clock skew and quantization noise.

## Gaze Simulation Model

The gaze simulation implements physiologically-accurate behavior:
- **Fixation Noise**: Gaussian noise (0.5mm base, normalized by calibration) when velocity < 50px/s
- **Saccadic Suppression**: Cursor freezes during rapid movement (>2000px/s)
- **Smoothing**: Lerp interpolation (factor 0.15) to simulate processing latency

See `useGazeSimulation.ts` for full implementation details.

## Calibration

Screen calibration (Credit Card Calibration step) normalizes all gaze simulation parameters to physical units (mm and degrees of visual angle), ensuring consistent jitter levels across different display sizes and resolutions.

## Practice Blocks

10 practice trials per modality (Hand + Gaze = 20 total) run before the main experiment to eliminate learning effects from contaminating Block 1 data.

