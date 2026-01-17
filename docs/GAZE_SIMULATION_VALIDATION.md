# Gaze Simulation Parameter Validation Request

## Context

We have implemented a **physiologically-accurate gaze simulation** for a Fitts' Law experiment where participants use mouse/trackpad input to simulate eye tracking. The simulation models three key aspects of human eye behavior:

1. **Fixation Noise (Drift/Tremor)**: The eye's inability to hold perfectly still during fixation
2. **Saccadic Suppression**: The eye is "blind" during rapid ballistic movements (saccades)
3. **Smoothing (Damping)**: Processing latency that causes gaze to trail behind the intended position

## Current Implementation Parameters

### Base Configuration

- **Smoothing Factor (Lerp)**: `0.15`
  - Linear interpolation factor for damping/smoothing
  - Lower values = more lag, higher values = more responsive
  - Current: 15% interpolation per frame (~60-120Hz)

- **Base Fixation Noise (Standard Deviation)**: `3.5 pixels`
  - Gaussian noise applied when velocity < 50 px/s
  - Simulates physiological drift/tremor during fixation
  - Applied independently to X and Y axes

- **Fixation Velocity Threshold**: `50 pixels/second`
  - Below this velocity, fixation noise is applied
  - Above this, noise is reduced/removed (eye is moving intentionally)

- **Saccade Velocity Threshold**: `1000 pixels/second`
  - Above this velocity, saccadic suppression activates
  - Cursor freezes at last position, then snaps to new location
  - Simulates the eye being "blind" during rapid movements

### Adaptive Noise Scaling (For Small Targets)

- **Target Size Scaling**:
  - Targets < 30px: Noise scales proportionally
    - 10px target → 33% noise (~1.2px std dev)
    - 20px target → 67% noise (~2.3px std dev)
    - 30px+ targets → 100% noise (3.5px std dev)
  - Minimum noise scale: 20% (to maintain some realism)

- **Proximity-Based Reduction**:
  - When cursor is within 1.5× target radius:
    - At target center (0 distance): Noise reduced to 30% (~1.05px std dev)
    - At 1.5× radius: Noise returns to 100% (3.5px std dev)
    - Linear interpolation between these points
  - This makes dwelling on small targets more feasible

## Questions for Validation

**Please evaluate our gaze simulation parameters against real eye tracking systems and physiological data:**

1. **Fixation Noise (3.5px std dev)**: 
   - Is this within realistic ranges for commercial eye trackers (e.g., Tobii, EyeLink, SMI)?
   - What is typical fixation stability in degrees of visual angle? (Assume ~40-50 pixels per degree at typical viewing distance)
   - Is 3.5px (~0.07-0.09 degrees) reasonable for fixation drift/tremor?

2. **Smoothing Factor (0.15 lerp)**:
   - Does this create realistic processing latency?
   - Typical eye tracker sampling rates are 60-1000Hz; what latency is typical?
   - Is 15% interpolation per frame (at 60Hz = ~16ms lag) realistic?

3. **Saccade Suppression (1000 px/s threshold)**:
   - What are typical saccade velocities in degrees/second?
   - Is 1000 px/s (~20-25 deg/s) a reasonable threshold for detecting saccades?
   - Do real eye trackers show similar "freezing" behavior during saccades?

4. **Adaptive Noise Scaling**:
   - Is reducing noise for small targets scientifically defensible?
   - Do real eye trackers show better stability when fixating on small targets?
   - Is the 30% minimum noise at target center too low, or appropriate?

5. **Overall Assessment**:
   - Are our parameters too conservative (not enough noise) or too aggressive (too much noise)?
   - Would these values produce results comparable to real eye tracking data in Fitts' Law experiments?
   - Any recommendations for adjustments based on published eye tracking literature?

## References We Should Consider

- ISO 9241-9 (Ergonomic requirements for non-keyboard input devices)
- Eye tracking accuracy/precision specifications from manufacturers
- Published studies on eye tracking in Fitts' Law tasks
- Physiological data on fixation stability and saccade characteristics

## Expected Use Case

This simulation is used in a **Fitts' Law experiment** comparing:
- **Hand modality**: Direct 1:1 mouse input (baseline)
- **Gaze modality**: Simulated eye tracking with the above parameters

Target sizes range from ~10px to ~100px, with Index of Difficulty (ID) values from ~2 to ~6 bits.

---

**Please provide a detailed analysis comparing our parameters to real eye tracking systems and physiological data, and recommend any adjustments if needed.**














