# Scripts

## Data Processing Scripts

### merge_raw_data.py

Merges all raw participant CSV files from `data/raw/` into a single cleaned dataset.

**Location:** `/scripts/merge_raw_data.py` (project root)

**Dependencies:** `pandas` (install with `pip install pandas`)

**Usage:**
```bash
# Basic merge (keeps original participant IDs)
python scripts/merge_raw_data.py

# Merge with anonymization (hashes participant IDs)
python scripts/merge_raw_data.py --anonymize

# Custom paths
python scripts/merge_raw_data.py --input data/raw --output data/clean/trial_data.csv
```

**What it does:**
- Reads all CSV files from `data/raw/`
- Normalizes column names (handles variations)
- Combines into single dataset
- Optionally anonymizes participant IDs
- Writes to `data/clean/trial_data.csv`

**📖 See [docs/guides/DATA_PROCESSING.md](../../docs/guides/DATA_PROCESSING.md) for detailed guide**

---

## App Scripts

### validate_trials_schema.ts

Validates trial CSV files against the schema defined in `/data/dict/trials.md`.

### Usage

```bash
# From app directory
npm run validate <csv_file1> [csv_file2] ...

# Or directly with tsx
npx tsx scripts/validate_trials_schema.ts <csv_file1> [csv_file2] ...
```

### Validation Rules

1. **Required Columns**: Checks for presence of all P0 (minimal) fields:
   - `trial_id`, `session_id`, `participant_id`
   - `timestamp_start`, `timestamp_end`, `rt_ms`
   - `correct`, `endpoint_x`, `endpoint_y`
   - `target_center_x`, `target_center_y`, `endpoint_error_px`

2. **System Fields**:
   - `zoom_pct` must be exactly 100
   - `fullscreen` must be `true` (or `1`)
   - `dpr` must be > 0

3. **Timing Monotonicity**: Ensures timestamps are in order:
   - `stim_onset_ts <= move_onset_ts <= target_entry_ts <= select_ts`

4. **Type Validation**:
   - Numeric fields must parse as numbers
   - Boolean fields must be `true`/`false` or `1`/`0`

5. **Path Efficiency**: If `path_length_px` and `A` are present:
   - Efficiency = `A / path_length_px` must be in (0, 1]

6. **Throughput Fields**: `power_8_12_hz`, `power_12_20_hz` must be finite if present

### Exit Codes

- `0`: All validations passed
- `1`: One or more validation errors found

### Example

```bash
# Validate sample data
npm run validate ../samples/trials_sample.csv

# Validate multiple files
npm run validate file1.csv file2.csv file3.csv
```

