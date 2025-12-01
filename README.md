# XR Adaptive Modality (Hand vs Gaze-Confirm) — ISO 9241-9 Study

![CI Status](https://img.shields.io/github/actions/workflow/status/mohdasti/xr-adaptive-modality-2025/ci.yml?branch=main&logo=github)
![License](https://img.shields.io/badge/license-GPLv3-blue.svg)
![Made with Vite](https://img.shields.io/badge/Made%20with-Vite-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

> **Study status: Pre-Data (`v0.3.0-pilot`)**
> 
> **Status Checklist:**
> - ✅ Design finalized & preregistered
> - ✅ Power analysis complete (target N=26–28)
> - ✅ Analysis pipeline implemented and validated on synthetic data
> - ✅ Policy thresholds tuned (target 15–25% adaptation trigger rate)
> - ⏳ Pilot data collection (5 participants)
> - ⏳ Policy lock (after pilot tuning)
> - ⏳ Main study data collection (N=26–28)
> - ⏳ Data analysis & reporting
> 
> **⚠️ IMPORTANT: All performance metrics below are PREDICTED (literature-based) until `v1.0.0-data`**

## Privacy & Data Governance

- No PII collected (anonymous participant IDs only).  
- Minimal logging: cursor positions, display metadata (zoom/DPR/fullscreen), trial metrics.  
- Webcam/eye-tracking is **optional & exploratory**; never required to participate.  
- Raw trial logs stored locally (gitignored); aggregated results shared via OSF/Zenodo on `v1.0.0-data`.  
- Participants can withdraw any time; data minimization practiced.

## Telemetry Tiers

The study uses a tiered telemetry system to balance data richness with privacy and performance:

### P0 (Minimal) — Always Collected

**Default:** Enabled for all participants  
**Data Collected:**
- Basic trial metrics: RT, endpoint coordinates, error flags
- Trial metadata: modality, UI mode, task parameters
- Display metadata: zoom, fullscreen, DPR, viewport size
- System health: focus/blur events, tab visibility

**Use Case:** Standard data collection for all participants

### P0+ (Full) — Default Setting

**Default:** Enabled (current default: `level: 'full'`)  
**Additional Data Beyond P0:**
- Movement kinematics: path length, velocity, acceleration
- Quality metrics: curvature, submovements, deviation
- Frequency domain: power in 8–12 Hz and 12–20 Hz bands
- Event health: coalesced event ratio, drop estimates
- Timing landmarks: move onset, target entry, pinch onset

**Use Case:** Detailed movement analysis and quality assessment

### P1 (Raw) — Opt-In Only

**Default:** Disabled (`enableRawStreams: false`)  
**Additional Data Beyond P0+:**
- High-frequency pointer samples (coalesced events, ~240 Hz)
- RAF (requestAnimationFrame) deltas for FPS/jitter estimation
- State snapshots at regular intervals
- **Storage:** Gzipped JSONL files (large, compressed)

**Use Case:** Deep-dive analysis, validation, debugging  
**Note:** Requires explicit opt-in; not collected by default

### Configuration

Telemetry level is controlled in `/app/src/lib/telemetry/config.ts`:

```typescript
export const telemetryConfig: TelemetryConfig = {
  level: 'full',        // 'minimal' | 'full' | 'raw'
  sampleHz: 240,        // Target pointer sampling rate
  enableRawStreams: false,  // true only when level === 'raw'
}
```

**Current Default:** `level: 'full'` (P0+), `enableRawStreams: false` (P1 disabled)

## Run in one command

```bash
Rscript analysis/run_all.R
```

Artifacts saved to `results/`.

---

## XR Adaptive Modality — Study Overview

**Design:** 2×2 within-subjects  
- **Modality:** Hand vs Gaze-confirmation  
- **UI Mode:** Static vs Adaptive (width-inflate for hand, declutter for gaze)  

**Primary outcomes:** Movement time (log-RT), Error (0/1), Throughput (IDe/MT) with **effective width** (ISO 9241-9), NASA-TLX (raw).

**Success thresholds (pre-registered):**
- Error: **≥15% reduction** with Adaptive vs Static.
- Speed: **no meaningful slowdown** (TOST ±5%).
- Workload: **≥10–15% reduction** TLX.

**Docs:** see `/docs/hypotheses.md`, `/docs/preregistration.md`, `/docs/instructions.md`, `/docs/remote_moderation.md`, and `/docs/counterbalancing.csv`.

**Policy:** Tune `policy/policy.default.json` during pilot to 15–25% adaptation trigger rate, then lock thresholds to `policy/policy.locked.json`.

## Participant Flow

The study follows a structured participant flow:

1. **Intro Page** (`/intro`)
   - Welcome message and study overview
   - Multiple-choice comprehension check (3 questions)
   - Instructions for modalities and display requirements

2. **Demographics Form** (`/demographics`)
   - Age, gender, vision correction status
   - Gaming frequency (hours per week)
   - Input device type (mouse, trackpad, etc.)
   - Handedness (dominant hand, operating hand)
   - Motor impairment screening
   - Fatigue level (1-7 Likert scale)

3. **System Check** (`/check`)
   - Display requirements verification
   - Fullscreen enforcement
   - Zoom level check (must be 100%)
   - Window size validation

4. **Calibration** (`/calibrate`)
   - Credit card calibration for physical display measurement
   - Calculates pixels-per-millimeter (PPMM)
   - Calculates pixels-per-degree (PPD) for gaze jitter normalization

5. **Practice Block** (within `/task`)
   - 10 trials with Hand modality
   - 10 trials with Gaze modality
   - Practice trials are flagged in data (not included in main analysis)

6. **Main Experiment** (`/task`)
   - Counterbalanced block sequence
   - 4 conditions: HaS, GaS, HaA, GaA
   - NASA-TLX after each block
   - CSV export at completion

## Quick Start

### Local Development

```bash
cd app
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

**Note:** When testing locally without participant links, the app will prompt for a Participant ID. In production, participant links include `?pid=P001&session=1` parameters that automatically populate this information.

### Deploy for Data Collection

**⚠️ For remote participants, you MUST deploy first!**

See [docs/guides/DEPLOYMENT_GUIDE.md](docs/guides/DEPLOYMENT_GUIDE.md) for step-by-step instructions.

**Quick deploy to Vercel:**
```bash
cd app
npm run build
npm install -g vercel
vercel
```

After deployment, generate participant links:
```bash
python scripts/generate_participant_links.py \
  --base-url "https://your-project.vercel.app" \
  --participants 25 \
  --sessions 3
```

The app will be available at `http://localhost:5173`

### Run (production build)

```bash
cd app
npm run build
npm run preview
```

Open the preview URL (typically `http://localhost:4173`).

Notes:
- In production, the counterbalanced block order controls modality (HaS/GaS/HaA/GaA). HUD does not override it.
- In development, the HUD may override modality to facilitate testing (e.g., Gaze + dwell).

## Project Structure

```
xr-adaptive-modality-2025/
├── app/                      # React + TypeScript web application
│   └── src/
│       ├── components/       # React components (FittsTask, TaskPane, TLXForm)
│       ├── lib/              # Core libraries (fitts, modality, policy, csv)
│       ├── experiment/       # Experiment utilities (counterbalance)
│       ├── policy/           # Policy loading (locked vs default)
│       └── utils/            # Utilities (geom, sessionMeta)
├── policy/                   # Research protocols and policies
│   ├── policy.default.json   # Default adaptation thresholds
│   └── policy.locked.json    # Locked thresholds (post-pilot)
├── data/                     # Data files
│   ├── raw/                  # Raw data files (gitignored)
│   ├── clean/                # Processed data (trial_data.csv, block_data.csv)
│   └── dict/                 # Data dictionaries
├── analysis/                 # Analysis scripts (R)
│   ├── compute_effective_metrics.R  # Compute We, IDe, throughput
│   ├── primary_models.R              # Mixed-effects models (RT, Errors, TP, TLX)
│   ├── check_exclusions.R           # Exclusion reporting
│   └── visualizations.R             # Summary figures
├── docs/                     # Documentation
│   ├── preregistration.md    # Pre-registered study design
│   ├── hypotheses.md         # H1-H5 hypotheses
│   └── methods_detail.md     # Detailed protocol
├── results/                   # Analysis outputs (gitignored)
│   ├── tables/               # Model outputs, EMMs, exclusion reports
│   └── figures/              # Visualizations
├── ops/                      # Operations and deployment
└── video/                    # Video materials
```

## Features

### Three-Pane Control Panel

- **Task Control**: Primary experiment interface for Fitts task with simplified UI
  - Participant-friendly interface (dev tools hidden in production)
  - Display requirements guard (fullscreen/maximized, zoom check)
  - Block configuration and counterbalancing
- **System HUD**: Real-time statistics and system status monitoring
- **Event Logger**: Comprehensive event logging with CSV export

### Fitts's Law Task

- Standard target selection paradigm (ISO 9241-9)
- Configurable difficulty levels (ID: 1.7 - 5.6 bits)
- **High-precision timing**: Uses `performance.now()` for sub-millisecond psychophysics timing
- **Spatial metrics logging**: Endpoint coordinates, target centers, endpoint error (px)
- **Effective metrics**: Computes We (effective width) and IDe (effective ID) for throughput
- **Performance tracking**: Average FPS per trial for data quality filtering
- **Practice block**: Automatic practice trials before main experiment (flagged in data)
- Reaction time measurement
- Block-based trial management with Williams counterbalancing
- Trial and block metadata tracking (trial_number, block_number, block_order)

### Adaptive Modality System

- **Hand-like**: Direct pointing (move + click)
- **Gaze-like**: Hover-based selection with configurable confirmation
  - Physiologically-accurate gaze simulation with normalized jitter
  - Jitter normalized by pixels-per-degree (PPD) from calibration
  - Saccadic suppression and smoothing effects
  - Dwell-based (350ms, 500ms auto-confirm)
  - Confirmation-based (Space key to confirm)
- **Start button modality switching**: Start button is selectable via current modality (no forced modality switch)
- Real-time modality switching
- Error detection (miss, timeout, slip)
- ISO 9241-9 compliant: 10px tolerance radius for gaze selection (accounts for physiological tremor)

#### Gaze mode UX tips
- The system cursor is hidden inside the canvas by design in Gaze mode.
- In dwell modes (350ms/500ms), a blue progress ring fills as you hover over the target; selection auto‑confirms at 100%.
- In Space mode (0ms dwell), “Press SPACE” appears when hovering; press Space to confirm.

### Policy-Based Adaptation Engine

- Rule-based adaptation responding to performance
- **Triggers**: RT percentile (p75), error burst detection (2 errors), minimum trials before adapt (5)
- **Actions**:
  - Declutter (gaze): Hide non-critical UI elements
  - Inflate width (hand): Increase target size by 25%
- Hysteresis mechanism (5-trial window, 3-trial minimum gap)
- **Policy loading**: Automatically loads `policy.locked.json` if present, otherwise falls back to `policy.default.json`
- Configurable via `/policy/policy.default.json`

#### Post-Pilot Locking

After the pilot study, lock the calibrated thresholds by copying the default policy to the locked file and committing:

```bash
cp policy/policy.default.json policy/policy.locked.json
git add policy/policy.locked.json
git commit -m "Lock adaptation thresholds post-pilot"
```

### Data Collection & Logging

- **Demographics data**: Age, gender, gaming frequency, input device, vision correction, handedness, motor impairment, fatigue level
- **Calibration data**: Pixels-per-millimeter and pixels-per-degree (PPD) for gaze jitter normalization
- **Trial-level data**: Movement time, errors, endpoint coordinates, spatial metrics, display metadata, practice flag, average FPS
- **Block-level data**: Raw NASA-TLX (6 dimensions: mental, physical, temporal, performance, effort, frustration)
- **Display metadata**: Screen/window dimensions, device pixel ratio, zoom level, fullscreen status
- **Performance metrics**: Frame rate (FPS) tracking for data quality filtering
- **CSV export**: Separate files for trial data and block-level TLX
- **Data dictionary**: Complete documentation of all logged variables

### NASA-TLX Workload Assessment

- **Raw NASA-TLX**: Six 0-100 sliders (no weighting)
- **Performance reverse-scored**: 100 - performance in analysis
- **Block-level logging**: Collected once per block after completion
- **Total score**: Sum of all six dimensions (0-600 range)

### Experimental Design

- **Counterbalancing**: Williams square design for 4 conditions (HaS, GaS, HaA, GaA)
- **Participant indexing**: Automatic sequence assignment based on participant index (mod 4)
- **Practice block**: 10 trials each for Hand and Gaze modalities before main experiment
- **Block shuffling**: Target positions randomized within each block
- **Display requirements**: Enforced fullscreen/maximized window and 100% zoom for consistency
- **Physical calibration**: Credit card calibration for PPD-based gaze jitter normalization
- **Data quality filtering**: FPS tracking to exclude trials with performance issues (FPS < 30)

**Practice Block Logic:**
- Practice trials are automatically run before the main experiment
- Practice trials are flagged with `practice: true` in the CSV data
- Practice data should be excluded from main analysis
- Participants complete practice for both modalities to minimize learning effects

Tip: to test a different counterbalanced sequence locally, clear the stored participant index in the browser console:

```js
localStorage.removeItem('participantIndex'); location.reload();
```

### Data Export
- Trial CSV includes: `rt_ms`, `endpoint_error_px`, `confirm_type`, `adaptation_triggered`, `practice`, `avg_fps`, plus display metadata (screen/window size, DPR, zoom, fullscreen).
- Demographics CSV includes: age, gender, gaming frequency, input device, vision correction, handedness, motor impairment, fatigue level.
- Calibration data includes: pixels_per_mm, pixels_per_degree (stored in sessionStorage, logged in CSV).
- Block TLX CSV is logged once per block with six raw subscales (performance reverse‑scored in analysis).

**Data Quality Filters:**
- Practice trials (`practice: true`) should be excluded from main analysis
- Trials with low FPS (`avg_fps < 30`) should be excluded from analysis
- See `analysis/check_exclusions.R` for automated exclusion reporting

---

## Study Snapshot (Portfolio-Ready)

- **Design:** 2×2 within — Modality (Hand vs Gaze-confirm) × UI (Static vs Adaptive)
- **N:** 24–30 | **Session:** 20–30 min | **Trials:** ~160/participant
- **KPIs:** Movement Time, Error, **Throughput (IDe/MT)**, Raw NASA-TLX
- **Adaptation:** RT p75 or 2-error burst triggers; **~15–25%** adaptive; **5-trial hysteresis**
- **Display control:** Fullscreen + 100% zoom enforced; DPI logged
- **Telemetry:** P0+ (Full) by default; P1 (Raw) opt-in only

### Success Criteria (Pre-Registered)

- RT: **non-inferior** within ±5% (TOST) or ≥5–10% faster
- Errors: ≥**15%** relative reduction
- Throughput: **+0.2–0.3 bits/s**
- TLX: **≥10–15%** lower

### Analysis Pipeline

The analysis pipeline follows the pre-registered plan:

1. **Compute Effective Metrics** (`compute_effective_metrics.R`)
   - Calculates effective width (We = 4.133 × SD(endpoints))
   - Computes effective ID (IDe = log₂(A/We + 1))
   - Computes throughput (TP = IDe / MT in seconds)
   - Exports condition-level summaries

2. **Primary Models** (`primary_models.R`)
   - LMEM for Movement Time (log-RT) with Modality × UI Mode interaction
   - GLMM for Error rates (binomial)
   - LMEM for Throughput
   - LMEM for NASA-TLX (raw total, reverse-scored performance)
   - TOST equivalence test for RT (non-inferiority ±5%)
   - Participant and trial-level exclusions applied

3. **Exclusion Reporting** (`check_exclusions.R`)
   - Generates participant-level exclusion report
   - Flags: error rate >40%, completion <80%, zoom/fullscreen violations
   - Exports exclusion report CSV

4. **Visualizations** (`visualizations.R`) - Optional
   - Combined figure panel: MT, Error Rate, Throughput, TLX
   - Uses EMMs from primary models
   - Saves to `results/figures/summary_panel.png`

**Run all analyses:**
```bash
Rscript analysis/compute_effective_metrics.R
Rscript analysis/check_exclusions.R
Rscript analysis/primary_models.R
Rscript analysis/visualizations.R   # optional
```

**Outputs:**
- `results/tables/effective_metrics_by_condition.csv`
- `results/tables/throughput_summary.csv`
- `results/tables/exclusion_report.csv`
- `results/tables/emmeans_rt.csv`
- `results/tables/emmeans_error.csv`
- `results/tables/emmeans_tp.csv`
- `results/tables/emmeans_TLX.csv`
- `results/figures/summary_panel.png`

---

## Preregistration

This study is pre-registered with detailed documentation:

- **[Preregistration](docs/preregistration.md)**: Complete study design, outcomes, exclusion rules, and analysis plan
- **[Hypotheses](docs/hypotheses.md)**: H1-H5 hypotheses with quantified expectations and planned tests
- **[Methods Detail](docs/methods_detail.md)**: Detailed protocol including block order, trial structure, and Williams counterbalancing

**Key pre-registered elements:**
- 2×2 within-subjects design (Modality × UI Mode)
- Primary outcomes: Movement Time, Error Rate, Throughput (IDe/MT), Raw NASA-TLX
- Exclusion rules: Trial-level (RT <150ms or >5000ms) and participant-level (>40% errors, <80% completion, display violations)
- Mixed-effects models with planned contrasts and TOST equivalence testing
- Success thresholds: Error ≥15% reduction, RT non-inferior ±5%, Throughput +0.2-0.3 bits/s, TLX ≥10-15% lower

### Global Event Bus

Lightweight pub/sub system for inter-component communication:
- `trial:start`, `trial:end`, `trial:error`, `policy:change` events
- Type-safe event payloads
- Easy subscription/unsubscription

### Documentation

**Quick Start Guides:**
- [docs/guides/SETUP.md](docs/guides/SETUP.md) - Setup instructions for developers
- [docs/guides/DEPLOYMENT_GUIDE.md](docs/guides/DEPLOYMENT_GUIDE.md) - Deploy to Vercel/Netlify
- [docs/README.md](docs/README.md) - Complete documentation index

**Study Documentation:**
- [docs/preregistration.md](docs/preregistration.md) - Pre-registered study design and analysis plan
- [docs/hypotheses.md](docs/hypotheses.md) - H1-H5 hypotheses with quantified expectations
- [docs/methods_detail.md](docs/methods_detail.md) - Detailed experimental protocol
- [data/dict/trial_data_dictionary.md](data/dict/trial_data_dictionary.md) - Complete data dictionary

**Technical Documentation:**
- [app/ARCHITECTURE.md](app/ARCHITECTURE.md) - System architecture
- [app/FITTS_TASK.md](app/FITTS_TASK.md) - Fitts task implementation
- [app/MODALITY.md](app/MODALITY.md) - Modality mechanics
- [app/POLICY.md](app/POLICY.md) - Adaptation engine
- [app/CONTEXT.md](app/CONTEXT.md) - Contextual factors (pressure, aging)
- [app/CSV_LOGGING.md](app/CSV_LOGGING.md) - Data logging and export
- [app/TLX_FORM.md](app/TLX_FORM.md) - NASA-TLX workload assessment
- [app/PUPIL_PROXY.md](app/PUPIL_PROXY.md) - Pupil diameter proxy (camera-based)

**Operations & Troubleshooting:**
- [docs/ops/VERCEL_BUILD_FIX.md](docs/ops/VERCEL_BUILD_FIX.md) - Troubleshooting Vercel builds
- [docs/ops/EMAILJS_SETUP.md](docs/ops/EMAILJS_SETUP.md) - EmailJS configuration
- [docs/ops/DEBUG_BLACK_SCREEN.md](docs/ops/DEBUG_BLACK_SCREEN.md) - Debugging guide

## Recent Updates

**Latest improvements (2025):**
- ✅ **Demographics Collection**: Comprehensive form collecting age, gender, gaming frequency, input device, vision correction, handedness, motor impairment, and fatigue level
- ✅ **Physical Calibration**: Credit card calibration for pixels-per-degree (PPD) normalization of gaze simulation jitter
- ✅ **Practice Block**: 10 trials each for Gaze and Hand modalities before the main experiment (flagged in data)
- ✅ **FPS Telemetry**: Average frame rate tracking per trial for data quality filtering (exclude trials with FPS < 30)
- ✅ **Comprehension Check**: Multiple-choice questions on Intro page to ensure participants understand the task
- ✅ **Participant Flow**: Complete flow implemented: Intro → Demographics → SystemCheck → Calibration → Task
- ✅ **Timing Precision**: Using `performance.now()` for critical psychophysics timing measurements
- ✅ **Gaze Simulation**: Physiologically-accurate simulation with normalized jitter based on calibration
- ✅ **Error Rate Feedback**: ISO 9241-9 compliant block-level error rate indicator in HUD
- ✅ **Bug Fixes**: Fixed React hooks violation, corrupted policy JSON, black screen after calibration
- ✅ Pre-registration documentation complete (design, hypotheses, methods)
- ✅ Full R analysis pipeline (effective metrics, mixed models, visualizations)
- ✅ Williams counterbalancing for block order (4-sequence design)
- ✅ Spatial metrics logging (endpoint coordinates, error calculation)
- ✅ Display requirements guard (fullscreen/maximized, zoom enforcement)
- ✅ Adaptation policy loader (locked vs default policy support)
- ✅ Raw NASA-TLX with block-level logging (6 dimensions, reverse-scored performance)
- ✅ Participant-friendly UI (dev tools hidden in production builds)
- ✅ Data dictionary and exclusion reporting
- ✅ Trial and block metadata tracking

## Development

### Available Scripts

In the `app/` directory:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run e2e` - Run end-to-end tests with Playwright

### Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Testing**: Vitest + React Testing Library + Playwright
- **Architecture**: Event-driven with global event bus
- **CI/CD**: GitHub Actions

### Development vs Production

- **Development mode** (`npm run dev`): Shows Manual Control mode and Pressure slider for testing
- **Production mode** (`npm run build`): Hides dev tools, shows only participant-facing Fitts Task interface
- Display requirements (fullscreen/maximized, zoom) are enforced in both modes

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Privacy

Privacy is important. See [docs/privacy_notice.md](docs/privacy_notice.md) for details on data collection, retention, and your rights.

- **No personally identifiable information (PII)** collected
- **Camera off by default** (optional, used only for cognitive load estimation)
- **Data anonymized** before storage (SHA256 hashing)
- **Retention ≤90 days** (then permanently deleted)
- **Local processing** (all data remains on your device until export)

## Author

Fatemeh Pourmahdian & Mohammad Dastgheib

