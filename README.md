# XR Adaptive Modality (Hand vs Gaze-Confirm) — ISO 9241-9 Study

![CI Status](https://img.shields.io/github/actions/workflow/status/mohdasti/xr-adaptive-modality-2025/ci.yml?branch=main&logo=github)
![License](https://img.shields.io/badge/license-GPLv3-blue.svg)
[![DOI](https://zenodo.org/badge/1083506474.svg)](https://doi.org/10.5281/zenodo.18204915)
![Made with Vite](https://img.shields.io/badge/Made%20with-Vite-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

> **Study status: Pre-Data (`v0.3.0-pilot`)**
> 
> **Status Checklist:**
> - ✅ Design finalized & preregistered
> - ✅ Power analysis complete (target N=32, perfect Williams Design balancing)
> - ✅ Analysis pipeline implemented and validated on synthetic data
> - ✅ Policy thresholds tuned (target 15–25% adaptation trigger rate)
> - ✅ Participant links generated (40 links for redundancy, target: 32 complete)
> - ⏳ Pilot data collection (5 participants)
> - ⏳ Policy lock (after pilot tuning)
> - ⏳ Main study data collection (N=32 target)
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
   - Counterbalanced block sequence (Williams Balanced Latin Square)
   - 8 conditions: HaS_P0, GaS_P0, HaA_P0, GaA_P0, HaS_P1, GaS_P1, HaA_P1, GaA_P1
   - NASA-TLX after each block
   - Automatic data submission via email on completion

7. **Debrief Page** (`/debrief`)
   - Study explanation and gaze simulation disclosure
   - Strategy questions (optional qualitative feedback)
   - Automatic data submission with debrief responses
   - Data download buttons (trial CSV, block CSV)
   - Data deletion option

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
  --participants 40
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
- In production, the counterbalanced block order controls modality, UI mode, and pressure (8 conditions: HaS_P0, GaS_P0, HaA_P0, GaA_P0, HaS_P1, GaS_P1, HaA_P1, GaA_P1). HUD does not override it.
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
├── analysis/                 # Analysis scripts (R + Python)
│   ├── compute_effective_metrics.R  # Compute We, IDe, throughput
│   ├── 02_models.R                  # Primary models (RT, Errors) + Hybrid Analysis models
│   ├── primary_models.R              # Mixed-effects models (RT, Errors, TP, TLX)
│   ├── check_exclusions.R           # Exclusion reporting
│   ├── visualizations.R             # Summary figures
│   └── py/                          # Python analysis scripts
│       ├── lba.py                   # Linear Ballistic Accumulator (LBA) for verification phase
│       └── archive/                  # Deprecated scripts
│           └── ddm_hddm.py.bak      # DDM (deprecated - error rate too low for convergence)
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
- **Spatial metrics logging**: Endpoint coordinates, target centers, endpoint error (px), **projected error (px)** along task axis (ISO 9241-9 compliant)
- **Effective metrics**: Computes We (effective width) and IDe (effective ID) for throughput using projected error
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
- **Debrief responses**: Strategy questions about adaptation awareness and strategy changes (qualitative feedback)
- **Display metadata**: Screen/window dimensions, device pixel ratio, zoom level, fullscreen status
- **Performance metrics**: Frame rate (FPS) tracking for data quality filtering
- **Automatic data submission**: EmailJS integration for automatic email submission of all data (trials, blocks, debrief)
- **CSV export**: Separate files for trial data, block-level TLX, and manual download options
- **Data dictionary**: Complete documentation of all logged variables

**Data Submission:**
- Automatic email submission on debrief page load (all data included)
- Automatic email re-submission when strategy questions are submitted
- Automatic CSV download fallback when data exceeds EmailJS 50KB limit
- Email includes trial CSV, block CSV, and debrief responses (JSON)
- See `EMAILJS_TEMPLATE.txt` for template configuration

### NASA-TLX Workload Assessment

- **Raw NASA-TLX**: Six 0-100 sliders (no weighting)
- **All 6 standard dimensions**: Mental Demand, Physical Demand, Temporal Demand, Performance, Effort, Frustration
- **Clear descriptions**: Each dimension includes explanatory text to help participants understand what they're rating
- **Performance reverse-scored**: 100 - performance in analysis
- **Block-level logging**: Collected once per block after completion
- **Total score**: Sum of all six dimensions (0-600 range)

### Experimental Design

- **Counterbalancing**: True 8×8 Balanced Latin Square (Williams Design) for 8 conditions (2 Modality × 2 UI × 2 Pressure)
  - Controls for immediate carryover effects: every condition follows every other condition exactly once
  - Perfect balancing with N=32: each sequence used exactly 4 times
  - 40 participant links generated for redundancy (target: 32 complete datasets)
- **Participant indexing**: Automatic sequence assignment based on participant index (mod 8)
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

### Data Organization

**Data Directory Structure:**
- `data/raw/`: Individual participant CSV files (gitignored, private)
  - Raw data files from participants (e.g., `P040_2025-12-05T07-57-03_merged.csv`)
  - Keep all raw participant data here
- `data/clean/trial_data.csv`: Aggregated cleaned dataset (for analysis)
  - Merged dataset from all participants
  - Used by all analysis scripts
  - Currently contains synthetic data for testing (will be replaced with real data)

**Merging Raw Data:**
When you have participant data files, merge them into the cleaned dataset:
```bash
python scripts/merge_raw_data.py
# Or with anonymization:
python scripts/merge_raw_data.py --anonymize
```

This script:
- Reads all CSV files from `data/raw/`
- Combines them into a single dataset
- Handles column mismatches and data cleaning
- Writes to `data/clean/trial_data.csv`
- Optionally anonymizes participant IDs

### Data Export & Submission

**CSV Files:**
- **Trial CSV**: Includes `rt_ms`, `endpoint_error_px`, **`projected_error_px`** (ISO 9241-9 compliant), `confirm_type`, `adaptation_triggered`, `practice`, `avg_fps`, plus display metadata (screen/window size, DPR, zoom, fullscreen)
  - **Gaze interaction metrics**: `target_reentry_count` (measures drift in/out), `verification_time_ms` (decision phase isolation)
  - **Hybrid Analysis metrics**: `submovement_count` (velocity peaks, intermittent control proxy - Meyer et al., 1988)
  - **Calibration data**: `pixels_per_mm`, `pixels_per_degree` (stored in sessionStorage, logged in CSV)
- **Block CSV**: NASA-TLX data logged once per block with six raw subscales (performance reverse‑scored in analysis)
- **Demographics**: Age, gender, gaming frequency, input device, vision correction, handedness, motor impairment, fatigue level (included in trial CSV)

**Automatic Email Submission (EmailJS):**
- All data automatically emailed on debrief page: trial CSV, block CSV, and debrief responses
- EmailJS template configured with conditional sections (see `EMAILJS_TEMPLATE.txt`)
- **50KB Size Limit Handling**: If data exceeds EmailJS free tier limit, CSV files are automatically downloaded instead
- Participant always has access to downloaded CSV files for manual backup

**Manual Download:**
- Download buttons available on debrief page for both trial and block CSV files
- Data can be downloaded at any time during experiment via LoggerPane

**Data Quality Filters:**
- Practice trials (`practice: true`) should be excluded from main analysis
- Trials with low FPS (`avg_fps < 30`) should be excluded from analysis
- See `analysis/check_exclusions.R` for automated exclusion reporting
- See `docs/ops/EMAILJS_SIZE_LIMIT.md` for EmailJS size limit handling details

**Data Verification:**
- All critical metrics verified and working (see `CSV_VERIFICATION_REPORT.md` for detailed verification)
- ISO 9241-9 compliant projected error calculation for rigorous Fitts' Law analysis
- Gaze-specific metrics (target re-entries, verification time) captured for interaction analysis

---

## Study Snapshot (Portfolio-Ready)

- **Design:** 2×2 within — Modality (Hand vs Gaze-confirm) × UI (Static vs Adaptive)
- **N:** 32 (target) | **Links:** 40 (redundancy for attrition) | **Session:** Single session (~25 min) | **Trials:** ~160/participant
- **Counterbalancing:** True 8×8 Balanced Latin Square (Williams Design) — controls for order and carryover effects
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

**⚠️ Important: Before running analysis, merge raw participant data:**
```bash
# Install dependencies (if needed)
pip install pandas

# Merge raw participant CSV files
python scripts/merge_raw_data.py
```
See [docs/guides/DATA_PROCESSING.md](docs/guides/DATA_PROCESSING.md) for details.

**Note:** `data/clean/trial_data.csv` should contain merged data from all participants in `data/raw/`. The merge script combines all raw files into this single dataset for analysis.

The analysis pipeline follows the pre-registered plan:

1. **Compute Effective Metrics** (`compute_effective_metrics.R`)
   - Calculates effective width (We = 4.133 × SD(endpoints))
   - Computes effective ID (IDe = log₂(A/We + 1))
   - Computes throughput (TP = IDe / MT in seconds)
   - Exports condition-level summaries

2. **Primary Models** (`02_models.R` and `primary_models.R`)
   - LMEM for Movement Time (log-RT) with Modality × UI Mode interaction
   - GLMM for Error rates (binomial)
   - LMEM for Throughput
   - LMEM for NASA-TLX (raw total, reverse-scored performance)
   - **Hybrid Analysis Models** (movement quality metrics):
     - Submovement Cost: `lmer(submovement_count ~ modality * ui_mode * IDe + ...)`
     - Control Stability: `glmer(target_reentry_count ~ modality * ui_mode + ...)` (Poisson/NB)
     - Verification Time: `lmer(verification_time_ms ~ modality * ui_mode + ...)` (LBA proxy)
   - TOST equivalence test for RT (non-inferiority ±5%)
   - Participant and trial-level exclusions applied

3. **Decision Models** (`analysis/py/lba.py`)
   - Hierarchical Linear Ballistic Accumulator (LBA) for verification phase modeling
   - Parameters separated by modality and ui_mode
   - Exports `lba_parameters.json` for decision component analysis
   - Note: DDM deprecated (error rate ~3% too low for reliable convergence)

3. **Exclusion Reporting** (`check_exclusions.R`)
   - Generates participant-level exclusion report
   - Flags: error rate >40%, completion <80%, zoom/fullscreen violations
   - Exports exclusion report CSV

4. **Report Generation** (`Report.qmd`)
   - Comprehensive Quarto report with all analyses and visualizations
   - **Dynamic sample size reporting**: Sample sizes automatically computed and displayed in section headers, figure captions, and table captions
   - **Raincloud plots**: Enhanced with thick black mean connecting lines showing trends between conditions
   - Sample sizes update automatically when new participants are added
   - See `DYNAMIC_SAMPLE_SIZE_SUMMARY.md` for implementation details

5. **Visualizations** (`visualizations.R`) - Optional
   - Combined figure panel: MT, Error Rate, Throughput, TLX
   - Uses EMMs from primary models
   - Saves to `results/figures/summary_panel.png`

**Run all analyses:**
```bash
# R analysis pipeline
Rscript analysis/compute_effective_metrics.R
Rscript analysis/check_exclusions.R
Rscript analysis/02_models.R              # Primary + Hybrid Analysis models
Rscript analysis/primary_models.R
Rscript analysis/visualizations.R         # optional

# Python decision models (LBA)
python analysis/py/lba.py --input data/clean/ --output results/

# Generate comprehensive report (Quarto)
quarto render Report.qmd
```

**Note:** The `Report.qmd` file generates a comprehensive HTML report with all analyses, visualizations, and dynamic sample size reporting. Simply re-render after adding new participant data to automatically update all sample sizes throughout the report.

**Outputs:**
- `results/tables/effective_metrics_by_condition.csv`
- `results/tables/throughput_summary.csv`
- `results/tables/exclusion_report.csv`
- `results/tables/emmeans_rt.csv`
- `results/tables/emmeans_error.csv`
- `results/tables/emmeans_tp.csv`
- `results/tables/emmeans_TLX.csv`
- `results/tables/emmeans_submovement.csv` (Hybrid Analysis)
- `results/tables/emmeans_reentry.csv` (Hybrid Analysis)
- `results/tables/emmeans_verification.csv` (Hybrid Analysis)
- `results/lba_parameters.json` (LBA parameters by modality/ui_mode)
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
- [docs/guides/DATA_PROCESSING.md](docs/guides/DATA_PROCESSING.md) - **How to merge raw participant data** ⭐
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
- [docs/ops/EMAILJS_SIZE_LIMIT.md](docs/ops/EMAILJS_SIZE_LIMIT.md) - EmailJS 50KB size limit handling
- [docs/ops/EMAILJS_TEMPLATE_CLEAN.md](docs/ops/EMAILJS_TEMPLATE_CLEAN.md) - Clean EmailJS template guide
- [docs/ops/DEBUG_BLACK_SCREEN.md](docs/ops/DEBUG_BLACK_SCREEN.md) - Debugging guide

## Recent Updates

**Latest improvements (2025):**
- ✅ **Dynamic Sample Size Reporting**: Report.qmd now includes automatic sample size reporting throughout all sections and figure captions. Sample sizes update dynamically when new participants are added, ensuring transparency about data availability for each analysis.
- ✅ **Raincloud Plot Enhancements**: All raincloud plots now include thick black lines connecting mean values between static and adaptive conditions, making trends immediately visible. Lines are computed separately for each facet (modality × pressure combinations).
- ✅ **Debrief Page**: Complete debriefing page with study explanation, gaze simulation disclosure, strategy questions, and data download/delete options
- ✅ **Automatic Email Submission**: EmailJS integration for automatic data submission (trials, blocks, debrief responses) when participants reach debrief page
- ✅ **EmailJS Size Limit Handling**: Automatic CSV download fallback when data exceeds 50KB limit (EmailJS free tier limitation)
- ✅ **Strategy Questions**: Open-ended qualitative feedback questions about adaptation awareness and strategy changes on debrief page
- ✅ **Demographics Collection**: Comprehensive form collecting age, gender, gaming frequency, input device, vision correction, handedness, motor impairment, and fatigue level
- ✅ **Physical Calibration**: Credit card calibration for pixels-per-degree (PPD) normalization of gaze simulation jitter
- ✅ **Practice Block**: 10 trials each for Gaze and Hand modalities before the main experiment (flagged in data)
- ✅ **FPS Telemetry**: Average frame rate tracking per trial for data quality filtering (exclude trials with FPS < 30)
- ✅ **Comprehension Check**: Multiple-choice questions on Intro page to ensure participants understand the task
- ✅ **Participant Flow**: Complete flow implemented: Intro → Demographics → SystemCheck → Calibration → Task → Debrief
- ✅ **Timing Precision**: Using `performance.now()` for critical psychophysics timing measurements
- ✅ **Gaze Simulation**: Physiologically-accurate simulation with normalized jitter based on calibration (angular velocity in deg/s)
- ✅ **ISO 9241-9 Compliance**: Projected error calculation along task axis for rigorous Fitts' Law analysis
- ✅ **Critical Metrics Logging**: All scientific metrics verified - `projected_error_px`, `target_reentry_count`, `verification_time_ms`, `submovement_count`, `pixels_per_mm`, `pixels_per_degree` (see `CSV_VERIFICATION_REPORT.md`)
- ✅ **Hybrid Analysis**: Movement quality metrics (submovement count, control stability, verification time) for quantifying control loop costs
- ✅ **LBA Migration**: Switched from DDM to Linear Ballistic Accumulator for verification phase modeling (DDM error rate too low for convergence)
- ✅ **TLX Form Improvements**: Added clear descriptions for all 6 NASA-TLX dimensions to improve participant understanding
- ✅ **Error Rate Feedback**: ISO 9241-9 compliant block-level error rate indicator in HUD (only shown between trials to reduce distraction)
- ✅ **Start Button Modality Fix**: Start button is selectable via current modality (dwell for gaze), eliminating modality switching confound
- ✅ **Visual Feedback Enhancement**: More prominent orange border/glow for adaptive conditions, stress-inducing timer colors (yellow→orange→red gradient)
- ✅ **EmailJS Template**: Clean, production-ready template with conditional sections for trial data, block data, and debrief responses
- ✅ **Bug Fixes**: Fixed React hooks violation, corrupted policy JSON, black screen after calibration, block progression stuck
- ✅ Pre-registration documentation complete (design, hypotheses, methods)
- ✅ Full R analysis pipeline (effective metrics, mixed models, visualizations)
- ✅ True Williams Balanced Latin Square counterbalancing (8×8 matrix, 8-sequence design)
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

