# Setup Guide

This guide will help you set up the XR Adaptive Modality project for development.

## Prerequisites

- Node.js 20.x or higher
- npm (comes with Node.js)

## Initial Setup

1. **Install dependencies**
   ```bash
   cd app
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## Verify Installation

Run the following commands to ensure everything is set up correctly:

```bash
cd app

# Check linting
npm run lint

# Run unit tests
npm run test

# Build the project
npm run build

# Preview production build
npm run preview

# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run e2e
```

## Development Workflow

1. **Start the dev server**: `npm run dev`
2. **Make your changes** in the `src/` directory
3. **Run tests**: `npm run test` (runs in watch mode)
4. **Lint your code**: `npm run lint`
5. **Format your code**: `npm run format`

## Project Structure

```
app/
├── src/                  # Source code
│   ├── App.tsx          # Main app component
│   ├── App.test.tsx     # Unit tests
│   ├── main.tsx         # Entry point
│   └── test/            # Test setup
├── e2e/                 # End-to-end tests
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── vitest.config.ts     # Vitest configuration
├── playwright.config.ts # Playwright configuration
├── .eslintrc.cjs        # ESLint configuration
└── .prettierrc          # Prettier configuration
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests (watch mode) |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run e2e` | Run E2E tests with Playwright |

## Troubleshooting

### Port already in use
If port 5173 is already in use, Vite will automatically use the next available port.

### Playwright browsers not installed
Run `npx playwright install` to install the required browsers.

### ESLint errors
Run `npm run format` to auto-fix formatting issues, then `npm run lint` to check for remaining issues.

## Next Steps

- Read the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
- Check out the [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)
- Explore the example code in `src/App.tsx`
- Write your first test in `src/App.test.tsx`
- Add an E2E test in `e2e/example.spec.ts`

## Need Help?

Open an issue on GitHub if you encounter any problems during setup.

