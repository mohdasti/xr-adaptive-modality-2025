# XR Adaptive Modality 2025

A research project exploring adaptive modality in extended reality environments.

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Fatemeh Pourmahdian

