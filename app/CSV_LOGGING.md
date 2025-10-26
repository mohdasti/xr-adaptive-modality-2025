# CSV Logging System

This document describes the robust CSV logging system for experiment data collection.

## Overview

The CSV logging system provides:

- **Structured Data**: Predefined schema with 23 columns
- **Validation**: Required field checking before row insertion
- **Session Management**: Automatic browser/DPI detection
- **Export Formats**: CSV and JSON download options
- **Real-time Tracking**: Row count display and event integration

## CSV Schema

### Column Definitions

| Column        | Type    | Description                                    | Required |
|---------------|---------|------------------------------------------------|----------|
| pid           | string  | Participant ID                                 | Yes      |
| ts            | number  | Timestamp (milliseconds since epoch)           | Yes      |
| block         | number  | Block number                                   | No       |
| trial         | number  | Trial number within block                      | Yes      |
| modality      | string  | Input modality ('gaze' or 'hand')              | No       |
| ui_mode       | string  | UI mode/condition                              | No       |
| pressure      | number  | Pressure level (0-1)                           | No       |
| aging         | boolean | Aging mode enabled                             | No       |
| ID            | number  | Index of Difficulty (Shannon formulation)      | No       |
| A             | number  | Amplitude (distance to target)                 | No       |
| W             | number  | Width (target size)                            | No       |
| target_x      | number  | Target X position (pixels)                     | No       |
| target_y      | number  | Target Y position (pixels)                     | No       |
| rt_ms         | number  | Reaction time (milliseconds)                   | No       |
| correct       | boolean | Trial success                                  | No       |
| err_type      | string  | Error type ('miss', 'timeout', 'slip')         | No       |
| hover_ms      | number  | Hover duration for gaze (milliseconds)         | No       |
| confirm_type  | string  | Confirmation method ('click', 'space', 'dwell')| No       |
| pupil_z_med   | number  | Median pupil diameter (z-scored)               | No       |
| tlx_global    | number  | NASA-TLX global workload score                 | No       |
| tlx_mental    | number  | NASA-TLX mental demand score                   | No       |
| browser       | string  | Browser name                                   | Yes      |
| dpi           | number  | Device pixel ratio                             | Yes      |

## Usage

### Initialization

The CSV logger is automatically initialized when the app loads:

```typescript
import { initLogger, getLogger } from '../lib/csv'

// On mount (LoggerPane)
useEffect(() => {
  const pid = prompt('Enter Participant ID (or leave blank for auto-generated):')
  initLogger(pid || undefined)
}, [])
```

### Logging Trial Data

Trial data is automatically logged on `trial:end` and `trial:error` events:

```typescript
// In LoggerPane
if (eventName === 'trial:end' || eventName === 'trial:error') {
  const row = createRowFromTrial(payload, currentBlock)
  logger.pushRow(row)
  setCsvRowCount(logger.getRowCount())
}
```

### Manual Row Insertion

You can also manually insert rows:

```typescript
import { getLogger } from '../lib/csv'

const logger = getLogger()
logger.pushRow({
  ts: Date.now(),
  trial: 1,
  modality: 'gaze',
  rt_ms: 450,
  correct: true,
  // ... other fields
})
```

### Downloading Data

#### CSV Format

```typescript
const handleDownloadCSV = () => {
  const logger = getLogger()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `experiment_${timestamp}.csv`
  logger.downloadCSV(filename)
}
```

#### JSON Format

```typescript
const handleDownloadJSON = () => {
  const logger = getLogger()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `experiment_${timestamp}.json`
  logger.downloadJSON(filename)
}
```

## API Reference

### CSVLogger Class

#### Constructor

```typescript
new CSVLogger(headers?: string[])
```

Creates a new CSV logger instance with optional custom headers.

#### Methods

##### initSession(data: Partial<CSVRow>): void

Initialize session-level data (e.g., participant ID, browser, DPI).

```typescript
logger.initSession({
  pid: 'P001',
})
```

##### pushRow(row: CSVRow): void

Add a new row to the log. Validates required fields.

```typescript
logger.pushRow({
  ts: Date.now(),
  trial: 1,
  rt_ms: 450,
  correct: true,
})
```

##### getRows(): CSVRow[]

Get all logged rows.

```typescript
const rows = logger.getRows()
console.log(`Total rows: ${rows.length}`)
```

##### clear(): void

Clear all logged rows.

```typescript
logger.clear()
```

##### toCSV(): string

Convert logged data to CSV string.

```typescript
const csvString = logger.toCSV()
console.log(csvString)
```

##### downloadCSV(filename: string): void

Download data as CSV file.

```typescript
logger.downloadCSV('experiment_data.csv')
```

##### toJSON(): string

Convert logged data to JSON string.

```typescript
const jsonString = logger.toJSON()
console.log(jsonString)
```

##### downloadJSON(filename: string): void

Download data as JSON file.

```typescript
logger.downloadJSON('experiment_data.json')
```

##### getRowCount(): number

Get the number of logged rows.

```typescript
const count = logger.getRowCount()
console.log(`${count} rows logged`)
```

### Helper Functions

#### initLogger(pid?: string): CSVLogger

Initialize the global logger instance.

```typescript
import { initLogger } from '../lib/csv'

const logger = initLogger('P001')
```

#### getLogger(): CSVLogger

Get the global logger instance (creates one if it doesn't exist).

```typescript
import { getLogger } from '../lib/csv'

const logger = getLogger()
```

#### createRowFromTrial(payload: any, blockNumber: number): CSVRow

Create a CSV row from a trial event payload.

```typescript
import { createRowFromTrial } from '../lib/csv'

const row = createRowFromTrial(trialPayload, 1)
logger.pushRow(row)
```

## Data Validation

### Required Fields

The logger validates that each row contains:

- `ts` (timestamp)
- `trial` (trial number)

Missing required fields will trigger a console warning and the row will not be added.

### Automatic Fields

The following fields are automatically populated:

- `pid`: From session initialization or auto-generated
- `browser`: Detected from user agent
- `dpi`: From `window.devicePixelRatio`

## CSV Format

### Example Output

```csv
pid,ts,block,trial,modality,ui_mode,pressure,aging,ID,A,W,target_x,target_y,rt_ms,correct,err_type,hover_ms,confirm_type,pupil_z_med,tlx_global,tlx_mental,browser,dpi
P001,1698765432100,1,1,gaze,standard,1.0,false,3.17,200,50,300,200,450,true,,,space,,,Chrome,2
P001,1698765433200,1,2,gaze,standard,1.0,false,3.17,200,50,400,300,520,true,,,space,,,Chrome,2
P001,1698765434300,1,3,hand,standard,1.0,false,2.32,150,60,350,250,380,true,,,click,,,Chrome,2
```

### CSV Escaping

- Values containing commas, quotes, or newlines are automatically wrapped in quotes
- Quotes within values are escaped as double quotes (`""`)
- Empty/null values are represented as empty strings

## UI Components

### Download Buttons

Located in `LoggerPane`, the CSV actions section provides:

- **Row Count**: Displays current number of logged rows
- **Download CSV**: Primary download button (blue)
- **Download JSON**: Secondary format option
- **Clear Data**: Trash icon to clear all logged rows

### Styling

```css
.csv-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 217, 255, 0.05);
  border: 1px solid #2a2a2a;
  border-radius: 4px;
}
```

## Data Analysis

### Loading in R

```r
library(tidyverse)

# Read CSV
data <- read_csv("experiment_2025-01-15T14-30-00.csv")

# Basic analysis
data %>%
  group_by(modality, ID) %>%
  summarise(
    mean_rt = mean(rt_ms, na.rm = TRUE),
    error_rate = mean(!correct, na.rm = TRUE),
    n = n()
  )
```

### Loading in Python

```python
import pandas as pd

# Read CSV
df = pd.read_csv("experiment_2025-01-15T14-30-00.csv")

# Basic analysis
summary = df.groupby(['modality', 'ID']).agg({
    'rt_ms': 'mean',
    'correct': lambda x: 1 - x.mean(),
    'trial': 'count'
}).rename(columns={'correct': 'error_rate', 'trial': 'n'})
```

## Best Practices

1. **Participant ID**: Always provide a meaningful participant ID
2. **Regular Downloads**: Download data periodically to prevent loss
3. **Backup**: Keep multiple copies of data files
4. **Validation**: Check row count matches expected trials
5. **Metadata**: Include session notes in a separate file

## Troubleshooting

### Missing Data

If rows are missing:

1. Check browser console for validation warnings
2. Verify event payloads contain required fields
3. Ensure logger is initialized before trials start

### Download Issues

If downloads fail:

1. Check browser popup blocker settings
2. Verify sufficient disk space
3. Try alternative format (JSON instead of CSV)

### Large Files

For experiments with many trials:

1. Download data in chunks (per block)
2. Use JSON format for better compression
3. Clear old data after successful download

## Future Enhancements

1. **Cloud Sync**: Automatic backup to cloud storage
2. **Compression**: Gzip compression for large datasets
3. **Streaming**: Stream data to server during experiment
4. **Validation Rules**: Custom validation for specific fields
5. **Data Preview**: In-app data viewer before download

## References

- CSV RFC 4180: https://tools.ietf.org/html/rfc4180
- Best practices for experimental data: [Goodman et al., 2014]
- Data management in HCI research: [Mackay & Fayard, 1997]

