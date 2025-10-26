# XR Adaptive Modality 2025

![CI Status](https://img.shields.io/github/actions/workflow/status/mohdasti/xr-adaptive-modality-2025/ci.yml?branch=main&logo=github)
![License](https://img.shields.io/badge/license-GPLv3-blue.svg)
![Made with Vite](https://img.shields.io/badge/Made%20with-Vite-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

**Adaptive Modality Systems for Extended Reality: A Fitts's Law Investigation**

A research platform for studying adaptive user interface interventions in dual-modality XR environments (hand vs. gaze). Features Fitts's Law target selection, policy-driven adaptation, contextual factors (pressure, aging), and comprehensive data logging.

## 📋 Description

This platform enables researchers to:
- Study hand vs. gaze interaction patterns using Fitts's Law
- Investigate adaptive UI interventions based on performance and context
- Evaluate cognitive load using NASA-TLX
- Generate comprehensive CSV datasets for statistical analysis

Key features include:
- **Dual-modality support**: Hand-like (click) and gaze-like (dwell + Space key) interactions
- **Adaptive policies**: Rule-based UI adaptation (declutter, inflate width) based on performance triggers
- **Contextual factors**: Time pressure countdown and aging proxy (visual impairment simulation)
- **Robust logging**: 23-column CSV schema with participant tracking, TLX scores, and metadata
- **Analysis ready**: Python ops tools (anonymization, validation) and R/Python analysis skeletons

## Quick Start

```bash
cd app
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
xr-adaptive-modality-2025/
├── app/              # React + TypeScript web application
├── policy/           # Research protocols and policies
├── data/             # Data files
│   ├── raw/          # Raw data files
│   ├── clean/        # Processed data
│   └── dict/         # Data dictionaries
├── analysis/         # Analysis scripts
│   ├── r/            # R analysis scripts
│   └── py/           # Python analysis scripts
├── docs/             # Documentation
├── ops/              # Operations and deployment
└── video/            # Video materials
```

## Features

### Three-Pane Control Panel

- **Task Control**: Manage trials, trigger events, change policies, and run Fitts tasks
- **System HUD**: Real-time statistics and system status monitoring
- **Event Logger**: Comprehensive event logging with last 20 events displayed

### Fitts's Law Task

- Standard target selection paradigm (ISO 9241-9)
- Configurable difficulty levels (ID: 1.7 - 5.6 bits)
- Reaction time measurement
- Block-based trial management

### Adaptive Modality System

- **Hand-like**: Direct pointing (move + click)
- **Gaze-like**: Hover-based selection with configurable confirmation
  - Dwell-based (350ms, 500ms auto-confirm)
  - Confirmation-based (Space key to confirm)
- Real-time modality switching
- Error detection (miss, timeout, slip)

### Policy-Based Adaptation Engine

- Rule-based adaptation responding to performance
- **Triggers**: RT percentile (p75), error burst detection
- **Actions**:
  - Declutter (gaze): Hide non-critical UI elements
  - Inflate width (hand): Increase target size by 25%
- Hysteresis mechanism (5-trial threshold)
- Configurable via `/policy/policy.default.json`

### Global Event Bus

Lightweight pub/sub system for inter-component communication:
- `trial:start`, `trial:end`, `trial:error`, `policy:change` events
- Type-safe event payloads
- Easy subscription/unsubscription

See detailed documentation:
- [app/ARCHITECTURE.md](app/ARCHITECTURE.md) - System architecture
- [app/FITTS_TASK.md](app/FITTS_TASK.md) - Fitts task implementation
- [app/MODALITY.md](app/MODALITY.md) - Modality mechanics
- [app/POLICY.md](app/POLICY.md) - Adaptation engine
- [app/CONTEXT.md](app/CONTEXT.md) - Contextual factors (pressure, aging)
- [app/CSV_LOGGING.md](app/CSV_LOGGING.md) - Data logging and export
- [app/TLX_FORM.md](app/TLX_FORM.md) - NASA-TLX workload assessment
- [app/PUPIL_PROXY.md](app/PUPIL_PROXY.md) - Pupil diameter proxy (camera-based)

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

Fatemeh Pourmahdian

