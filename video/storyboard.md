# Demo GIF Storyboard

Instructions for creating a demonstration GIF from a short screen recording.

## Overview

This guide explains how to record, edit, and export a demonstration GIF showing the key features of the XR Adaptive Modality application.

## Recording Setup

### Tools

**Recommended:**
- **Screen Recording**: OBS Studio, QuickTime (macOS), ShareX (Windows)
- **GIF Creation**: FFmpeg, LICEcap, Gifski

**Command-Line (Advanced):**
```bash
# Using ffmpeg
ffmpeg -i input.mp4 -vf "fps=15,scale=1280:-1" -loop 0 output.gif

# Using gifski (better quality)
gifski --fps 15 --width 1280 input.mp4 -o output.gif
```

### Recording Settings

- **Resolution**: 1280×720 (recommended) or 1920×1080
- **Frame Rate**: 30fps (or 15fps for GIF)
- **Duration**: 30-60 seconds (keep it short)
- **Browser**: Chrome or Firefox
- **View**: Full application (three-pane layout visible)

## Storyboard Sequence

### Scene 1: Application Overview (0-5s)

**Actions:**
- [ ] Start recording
- [ ] Show application loaded (three panes visible)
- [ ] Pan across panes: Task Control, System HUD, Event Logger
- [ ] Highlight key UI elements

**Caption Text** (optional):
- "XR Adaptive Modality Experiment Platform"
- "Three-pane control panel"

---

### Scene 2: Modality Switching (5-10s)

**Actions:**
- [ ] Click "Hand-like" radio button
- [ ] Show cursor is visible
- [ ] Click "Gaze-like" radio button  
- [ ] Show cursor disappears (replaced with cyan gaze point)
- [ ] Show tooltip: "Press SPACE to confirm"

**Caption Text**:
- "Dual Modality: Hand ↔ Gaze"

---

### Scene 3: Contextual Factors (10-15s)

**Actions:**
- [ ] Toggle "Pressure" checkbox ON
- [ ] Show orange highlight on toggle
- [ ] Toggle "Aging Proxy" checkbox ON
- [ ] Show consent text for camera (optional)
- [ ] Demonstrate that contextual factors are independent

**Caption Text**:
- "Contextual Factors: Pressure & Aging Proxy"

---

### Scene 4: Fitts Task Execution (15-25s)

**Actions:**
- [ ] Click "Fitts Task" tab
- [ ] Configure: 3 trials, low difficulty only
- [ ] Click "Start Fitts Block"
- [ ] Show START button at center
- [ ] Click START button
- [ ] Show countdown timer appears (top-right)
- [ ] Show target appears
- [ ] Click target quickly (show hit)
- [ ] RT measurement visible in HUD
- [ ] Event logger shows `trial:end` event

**Caption Text**:
- "Fitts's Law Target Selection Task"
- "Reaction Time Measurement"

---

### Scene 5: Policy Adaptation (25-35s)

**Actions:**
- [ ] Show several trials with slow performance
- [ ] Show policy status badge appears: "Adaptation Active: inflate_width"
- [ ] Demonstrate target inflation (orange border, scale indicator)
- [ ] Show policy:change event in logger
- [ ] Continue trials with improved performance
- [ ] Show policy deactivates after improvement

**Caption Text**:
- "Adaptive UI: Automatically Adjusts Based on Performance"

---

### Scene 6: TLX Form (35-45s)

**Actions:**
- [ ] Complete final trial in block
- [ ] Show TLX modal appears
- [ ] Demonstrate adjusting sliders (global workload, mental demand)
- [ ] Show values update in real-time
- [ ] Click "Submit" button
- [ ] Show modal closes and CSV row count increases

**Caption Text**:
- "NASA-TLX Workload Assessment"
- "Subjective Workload Rating"

---

### Scene 7: CSV Export (45-55s)

**Actions:**
- [ ] Show "Download CSV" button in logger
- [ ] Click button (simulate download)
- [ ] Show CSV filename with timestamp
- [ ] Optional: Open CSV in preview to show structure

**Caption Text**:
- "Export Data for Analysis"

---

### Scene 8: Closing (55-60s)

**Actions:**
- [ ] Pan back to full application view
- [ ] Fade out or show "Research Platform" text overlay
- [ ] End recording

**Caption Text**:
- "XR Adaptive Modality 2025"
- "Research Platform"

## Post-Production

### Video Editing

**If recording as MP4/MOV:**

1. **Trim**: Remove dead time (waits, pauses)
2. **Speed up**: 1.5×-2× speed for monotony
3. **Add captions**: Optional text overlays
4. **Zoom in**: On important UI elements

### GIF Conversion

**Using FFmpeg:**
```bash
# Convert MP4 to GIF (basic)
ffmpeg -i demo.mp4 -vf "fps=15,scale=1280:-1:flags=lanczos" \
  -loop 0 demo.gif

# Better quality with palette
ffmpeg -i demo.mp4 -vf "fps=15,scale=1280:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 demo.gif
```

**Using Gifski (Recommended):**
```bash
# Install gifski: cargo install gifski
gifski --fps 15 --width 1280 --quality 90 demo.mp4 -o demo.gif
```

**Using Online Tools:**
- CloudConvert
- EzGIF.com
- Gifski (browser version)

### Optimization

**Reduce file size:**
```bash
# Use gifsicle to optimize
gifsicle -O3 --colors 128 demo.gif -o demo_optimized.gif

# Or use optipng (if converted to PNG sequence)
optipng -o7 frame*.png
```

**Target Sizes:**
- **Small**: <5MB (for GitHub README)
- **Medium**: <10MB (for documentation)
- **Large**: <20MB (for presentations)

## Demo GIF Checklist

### Pre-Recording

- [ ] Application running smoothly (no lags)
- [ ] All features working correctly
- [ ] Browser window properly sized (1280×720 or 1920×1080)
- [ ] Camera disabled (for privacy in public demo)
- [ ] Sample data ready (or use demo mode)

### During Recording

- [ ] Smooth mouse movements (no jittery cursor)
- [ ] Clear, readable text
- [ ] Good contrast (not too dark/bright)
- [ ] No cursor hovering over buttons unnecessarily
- [ ] Pause between actions for clarity
- [ ] Work through storyboard sequence

### Post-Recording

- [ ] Trim dead time
- [ ] Add captions if needed
- [ ] Optimize file size
- [ ] Test in README/documentation
- [ ] Verify quality is acceptable

## Alternative: Animated Screenshots

If full-screen recording is not possible:

1. **Take screenshots** of key states
2. **Animate** using tools like:
   - LICEcap (screen-to-GIF)
   - Kap (macOS) → GIF
   - ShareX (Windows)
3. **Combine** screenshots into sequence

## File Naming

**Recommended:**
```
demo-overview.gif          # General demo
demo-modality-switching.gif # Modality features
demo-adaptation.gif        # Policy adaptation
demo-tlx.gif              # TLX form
demo-complete.gif         # Full workflow
```

## Upload Locations

- **GitHub**: `/video/demo.gif`
- **Documentation**: Reference in README.md
- **Website**: Host externally if file too large

## Privacy Notes

⚠️ **Important**: When creating demo GIFs for public sharing:

- [ ] No real participant data
- [ ] Use demo/example participant IDs
- [ ] Camera disabled
- [ ] No confidential information visible
- [ ] CSVs contain only example data

## Tools Reference

### Screen Recording

- **OBS Studio**: Free, cross-platform, powerful
- **QuickTime**: Built-in on macOS, simple
- **ShareX**: Windows, great for short clips

### GIF Creation

- **FFmpeg**: Command-line, powerful, free
- **Gifski**: High quality, Rust-based
- **LICEcap**: Simple, animated GIF capture
- **CloudConvert**: Online conversion

### Editing

- **GIMP**: Free image editor with GIF support
- **Adobe After Effects**: Professional (if available)
- **DaVinci Resolve**: Free video editor

## Example Commands

```bash
# Record screen (using FFmpeg)
ffmpeg -f avfoundation -r 30 -i "1:0" demo.mp4

# Convert to GIF (FFmpeg)
ffmpeg -i demo.mp4 -vf "fps=15,scale=1280:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" demo.gif

# Optimize (gifsicle)
gifsicle -O3 --colors 128 demo.gif -o demo_optimized.gif

# Check file size
ls -lh demo*.gif
```

## Success Criteria

A good demo GIF should:
- ✅ Be under 10MB
- ✅ Show key features clearly
- ✅ Be smooth (no jerkiness)
- ✅ Include text labels/captions
- ✅ Loop seamlessly
- ✅ Be readable at small sizes
- ✅ Load quickly in documentation

## Resources

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Gifski GitHub](https://github.com/ImageOptim/gifski)
- [Screencast Best Practices](https://www.nngroup.com/articles/screencast-usability/)

