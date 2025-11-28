# Prompt for LLM: Validate Gaze Simulation Parameters

Copy and paste this prompt to another LLM for validation:

---

**Role:** Eye Tracking Expert & Human Factors Engineer

**Task:** Evaluate the realism of our gaze simulation parameters for a Fitts' Law experiment.

## Our Gaze Simulation Parameters

We're simulating eye tracking behavior using mouse input with these parameters:

### Core Parameters:
- **Fixation Noise (Gaussian, std dev)**: `3.5 pixels` - Applied when velocity < 50 px/s
- **Smoothing (Lerp factor)**: `0.15` - 15% interpolation per frame (~60Hz = ~16ms lag)
- **Saccade Threshold**: `1000 pixels/second` - Above this, cursor freezes then snaps (saccadic suppression)
- **Fixation Velocity Threshold**: `50 px/s` - Below this, noise is applied

### Adaptive Features:
- **Small Target Scaling**: Targets < 30px get proportionally less noise (10px = 33%, 20px = 67%)
- **Proximity Reduction**: When within 1.5× target radius, noise scales from 30% (at center) to 100% (at edge)

### Context:
- Display: ~40-50 pixels per degree of visual angle (typical viewing distance)
- Target sizes: 10px to 100px
- Use case: Fitts' Law experiment comparing hand vs. gaze input

## Questions:

1. **Is 3.5px (~0.07-0.09°) fixation noise realistic?** Compare to:
   - Commercial eye trackers (Tobii, EyeLink, SMI)
   - Published fixation stability data
   - Typical RMS precision values

2. **Is 0.15 lerp (15% per frame) realistic for processing latency?** Consider:
   - Eye tracker sampling rates (60-1000Hz)
   - Typical system latency
   - Smoothing algorithms used in eye tracking software

3. **Is 1000 px/s (~20-25 deg/s) appropriate for saccade detection?** Compare to:
   - Typical saccade velocities (10-900 deg/s)
   - When saccadic suppression occurs
   - How eye trackers handle saccades

4. **Is our adaptive noise scaling scientifically defensible?** 
   - Do real eye trackers show better stability on small targets?
   - Is 30% minimum noise too low?
   - Should noise scale with target size?

5. **Overall Assessment:**
   - Are we too conservative (not enough noise) or too aggressive (too much noise)?
   - Would these produce results comparable to real eye tracking in Fitts' Law tasks?
   - Any specific recommendations for adjustments?

**Please provide detailed analysis with references to:**
- Eye tracker manufacturer specifications
- Published eye tracking studies
- Physiological data on fixation stability
- ISO 9241-9 or similar standards

---

