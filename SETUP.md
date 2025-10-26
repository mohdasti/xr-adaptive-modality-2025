# Setup Instructions

## Prerequisites

You need Node.js and npm installed to run this application.

### Installing Node.js

**Option 1: Using Homebrew (macOS)**

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

**Option 2: Direct Download**

1. Visit: https://nodejs.org/
2. Download the LTS version (recommended)
3. Install the .pkg file
4. Restart your terminal

**Option 3: Using NVM (Node Version Manager)**

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then:
nvm install 20
nvm use 20
```

### Verify Installation

After installation, restart your terminal and verify:

```bash
node --version  # Should show v20.x.x or similar
npm --version   # Should show 10.x.x or similar
```

## Install Dependencies

Once Node.js is installed:

```bash
cd app
npm install
```

This will install all required dependencies (React, Vite, TypeScript, Playwright, etc.)

## Run the Application

### Development Mode

```bash
npm run dev
```

The app will start at: `http://localhost:5173`

### Other Available Commands

```bash
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run linter
npm run format   # Format code
npm run test     # Run unit tests
npm run e2e      # Run E2E tests
```

## Troubleshooting

### "Command not found: node"

- Make sure Node.js is installed
- Restart your terminal after installation
- Check PATH: `echo $PATH`

### npm install fails

- Check internet connection
- Try: `npm cache clean --force`
- Try: `rm -rf node_modules package-lock.json && npm install`

### Port 5173 already in use

- Kill the process: `lsof -ti:5173 | xargs kill -9`
- Or use a different port: `npm run dev -- --port 3000`

### Permission errors (macOS)

- Use Homebrew instead of sudo
- Fix npm permissions: `sudo chown -R $(whoami) ~/.npm`

## Next Steps

After installing and running:

1. **First Launch**: Enter a participant ID or leave blank for auto-generated
2. **Modality Switch**: Try switching between Hand and Gaze modes
3. **Contextual Factors**: Enable Pressure or Aging toggles
4. **Fitts Task**: Start a trial block to see the task in action
5. **TLX Form**: Complete a block to see the workload assessment modal
6. **Export Data**: Click "Download CSV" in the Event Logger pane

## Feature Flags

You can configure features via environment variables:

Create `app/.env.local`:
```bash
PUBLIC_ENABLE_CAMERA=false
PUBLIC_ENABLE_PUPIL_PROXY=false
PUBLIC_ENABLE_PRESSURE=true
PUBLIC_ENABLE_AGING=true
PUBLIC_ENABLE_TLX=true
```

See `app/.env.example` for all available flags.

## Need Help?

- Check the [app/QUICKSTART.md](app/QUICKSTART.md) for detailed setup
- Review [ARCHITECTURE.md](app/ARCHITECTURE.md) for system overview
- See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Open an issue on GitHub for bugs or questions

