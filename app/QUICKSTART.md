# Quick Start Guide

## Installation

```bash
cd app
npm install
```

## Run the Application

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

## Using the Control Panel

### 1. Start a Trial

1. Click **"Start Trial"** in the Task Control pane
2. Watch the HUD update with trial statistics
3. See the event logged in the Event Logger

### 2. Monitor System Status

The System HUD shows:
- **Total Trials**: Number of trials started
- **Active Trials**: Currently running trials
- **Errors**: Total error count
- **Current Policy**: Active policy setting
- **Last Event**: Timestamp of most recent event

### 3. Change Policy

1. Use the dropdown in Task Control
2. Select a policy: Default, Adaptive, Fixed, or Experimental
3. Watch the HUD update
4. See the policy change logged

### 4. Trigger an Error

1. Start a trial first
2. Click **"Trigger Error"**
3. Watch error count increase in HUD
4. See error details in Event Logger

### 5. End a Trial

1. Click **"End Trial"**
2. Watch active trials decrease
3. See completion logged with duration

### 6. View Event History

The Event Logger shows:
- Last 20 events in chronological order (newest first)
- Event type (color-coded)
- Timestamp
- Full payload data

Click **"Clear Logs"** to reset the logger.

## Event Flow Example

```
User Action          →  Event Emitted       →  Components Updated
─────────────────────────────────────────────────────────────────
Start Trial         →  trial:start         →  HUD: +1 total, +1 active
                                            →  Logger: New entry

Change Policy       →  policy:change       →  HUD: Policy updated
                                            →  Logger: New entry

Trigger Error       →  trial:error         →  HUD: +1 error
                                            →  Logger: New entry (red)

End Trial           →  trial:end           →  HUD: -1 active
                                            →  Logger: New entry
```

## Testing the Event Bus

Open browser console and try:

```javascript
// Import the bus (if exposed to window)
import { bus } from './src/lib/bus'

// Emit a custom event
bus.emit('trial:start', { 
  trialId: 'test-123', 
  timestamp: Date.now() 
})

// Subscribe to events
bus.on('trial:start', (payload) => {
  console.log('Trial started:', payload)
})
```

## Running Tests

```bash
# Unit tests
npm run test

# Unit tests with UI
npm run test:ui

# E2E tests (requires build first)
npm run build
npm run e2e
```

## Building for Production

```bash
npm run build
```

Output will be in `dist/` directory.

Preview the build:

```bash
npm run preview
```

## Troubleshooting

### Port already in use
Vite will automatically use the next available port (5174, 5175, etc.)

### Components not updating
Check browser console for errors. Ensure event handlers are properly subscribed.

### Tests failing
Run `npm run lint` to check for code issues.

### Build errors
Ensure all dependencies are installed: `npm install`

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design
- Explore component source code in `src/components/`
- Modify event types in `src/lib/bus.ts`
- Add custom events and handlers
- Extend the UI with new panes or features

## Need Help?

- Check the [main README](../README.md)
- Review [CONTRIBUTING.md](../CONTRIBUTING.md)
- Open an issue on GitHub

