# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-01-15

### Added - Contextual Factors

#### Pressure Mode
- **Countdown Timer**: Visual countdown overlay during trials
  - Blue timer with pulse animation (normal state)
  - Red timer with urgent pulse when ≤3 seconds
  - Positioned at top-right of task canvas
- **Timeout Detection**: Automatic timeout error when countdown reaches zero
- **Policy Integration**: Policy engine respects `pressure_only` flag
  - Adaptation only activates when pressure mode is enabled
- **Toggle Control**: Checkbox in HUDPane with timer icon (⏱️)
- **Event Emission**: `context:change` event with pressure/aging state

#### Aging Proxy
- **Visual Effects**: Simulates age-related visual changes
  - `contrast(0.7)` filter on targets
  - `blur(0.5px)` to simulate presbyopia
  - Reduced opacity (0.85) on info panels
  - Muted colors in UI elements
- **CSS-based**: Performant, toggleable via `.aging-mode` class
- **Toggle Control**: Checkbox in HUDPane with glasses icon (👓)
- **Real-time Application**: Effects apply immediately to active trials

#### Documentation
- Created `/app/CONTEXT.md` with comprehensive documentation
  - Feature descriptions
  - Implementation details
  - Policy integration
  - UI controls
  - Event flow
  - Design rationale

### Added - CSV Logging System

#### Core Features
- **Structured Schema**: 23-column CSV format
  - Participant ID, timestamps, trial data
  - Modality, contextual factors, performance metrics
  - Browser info, DPI, physiological data placeholders
- **Validation**: Required field checking before row insertion
- **Session Management**: Automatic browser/DPI detection
- **Export Formats**: Both CSV and JSON download options
- **Real-time Tracking**: Row count display in UI

#### CSV Schema Columns
```
pid, ts, block, trial, modality, ui_mode, pressure, aging,
ID, A, W, target_x, target_y, rt_ms, correct, err_type,
hover_ms, confirm_type, pupil_z_med, tlx_global, tlx_mental,
browser, dpi
```

#### API
- **CSVLogger Class**:
  - `initSession(data)`: Initialize session-level data
  - `pushRow(row)`: Add new row with validation
  - `getRows()`: Retrieve all logged rows
  - `clear()`: Clear all rows
  - `toCSV()`: Convert to CSV string
  - `downloadCSV(filename)`: Download as CSV file
  - `toJSON()`: Convert to JSON string
  - `downloadJSON(filename)`: Download as JSON file
  - `getRowCount()`: Get number of logged rows

- **Helper Functions**:
  - `initLogger(pid?)`: Initialize global logger
  - `getLogger()`: Get global logger instance
  - `createRowFromTrial(payload, block)`: Create row from event

#### UI Components
- **Download Buttons** (in LoggerPane):
  - 📊 Download CSV (primary, blue)
  - 📄 JSON (secondary format)
  - 🗑️ Clear Data (trash icon)
- **Row Counter**: Real-time display of logged rows
- **Participant ID Prompt**: On session start

#### Integration
- **Automatic Logging**: Trial events automatically logged
  - `trial:end` → CSV row
  - `trial:error` → CSV row with error details
- **Block Tracking**: Automatic block number increment
- **Event Bus Integration**: Seamless with existing event system

#### Documentation
- Created `/app/CSV_LOGGING.md` with comprehensive documentation
  - Schema definitions
  - Usage examples
  - API reference
  - Data validation
  - CSV format details
  - Analysis examples (R, Python)
  - Best practices
  - Troubleshooting

### Changed

#### Policy Engine
- Updated `nextPolicyState()` to accept `pressureEnabled` parameter
- Changed pressure check from `pressure < 1.5` to `!pressureEnabled`
- More explicit control over when adaptation activates

#### Event Bus
- Added `context:change` event type
  - Payload: `{ pressure: boolean, aging: boolean, timestamp: number }`
- Updated `policy:change` event type
  - Added optional `state` object with detailed policy info
- Updated `trial:error` event type
  - Added `'slip'` to error types

#### FittsTask Component
- Added `pressureEnabled` prop (default: false)
- Added `agingEnabled` prop (default: false)
- Countdown timer overlay (conditional rendering)
- Aging mode CSS class application
- Countdown state management with 0.1s interval

#### TaskPane Component
- Added `pressureEnabled` and `agingEnabled` state
- Subscribed to `context:change` events
- Passes context flags to FittsTask

#### HUDPane Component
- Added contextual factors section
- Two toggle controls (pressure, aging)
- Passes `pressureEnabled` to policy engine
- Emits `context:change` events

#### LoggerPane Component
- Integrated CSV logging
- Added download buttons (CSV, JSON)
- Added clear data button
- Row count display
- Participant ID prompt on mount
- Automatic CSV row creation from trial events
- Block number tracking

#### Documentation
- Updated `/README.md` with new features
- Updated `/app/ARCHITECTURE.md`:
  - Added `context:change` event
  - Added ContextControls to component hierarchy
  - Added CSV logging to libraries section
  - Marked CSV export as completed

### Technical Details

#### Files Added
- `/app/src/lib/csv.ts` (273 lines)
- `/app/CONTEXT.md` (195 lines)
- `/app/CSV_LOGGING.md` (436 lines)

#### Files Modified
- `/app/src/components/FittsTask.tsx`
- `/app/src/components/FittsTask.css`
- `/app/src/components/TaskPane.tsx`
- `/app/src/components/HUDPane.tsx`
- `/app/src/components/HUDPane.css`
- `/app/src/components/LoggerPane.tsx`
- `/app/src/components/LoggerPane.css`
- `/app/src/lib/bus.ts`
- `/app/src/lib/policy.ts`
- `/README.md`
- `/app/ARCHITECTURE.md`

### Testing

#### Manual Testing Checklist
- [x] Pressure toggle enables/disables countdown timer
- [x] Countdown reaches zero triggers timeout error
- [x] Aging toggle applies visual effects
- [x] Context changes emit events
- [x] Policy respects pressure_only flag
- [x] CSV rows logged on trial completion
- [x] CSV download works (with timestamp in filename)
- [x] JSON download works
- [x] Row counter updates in real-time
- [x] Clear data confirmation works
- [x] Participant ID prompt on session start

#### Linting
- [x] No ESLint errors
- [x] No TypeScript errors

### Design Decisions

1. **Countdown Timer Position**: Top-right to avoid interfering with targets
2. **Aging Effects**: Subtle to balance realism with usability
3. **CSV Schema**: 23 columns to support comprehensive analysis
4. **Automatic Logging**: Reduces experimenter burden
5. **Dual Export**: CSV for analysis, JSON for flexibility
6. **Block Tracking**: Local variable in useEffect to avoid stale closure issues

### Future Enhancements

#### Contextual Factors
- [ ] Configurable timeout durations
- [ ] Multiple aging severity levels
- [ ] Tremor simulation
- [ ] Cognitive load indicators
- [ ] Adaptive timeouts based on performance

#### CSV Logging
- [ ] Cloud sync/backup
- [ ] Gzip compression for large files
- [ ] Streaming to server during experiment
- [ ] Custom validation rules
- [ ] In-app data preview/viewer
- [ ] Automatic periodic backups

### References

- Fitts's Law and aging: Chaparro et al. (1999)
- Visual changes with age: Owsley (2011)
- Time pressure effects: Maule & Hockey (1993)
- CSV RFC 4180: https://tools.ietf.org/html/rfc4180

---

## Previous Releases

See git history for previous changes.

