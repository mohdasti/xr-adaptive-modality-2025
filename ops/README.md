# Operations Tools

Python CLI tools for data processing, validation, and summarization.

## Tools

### 1. `anonymize_cli.py`

Anonymize CSV data from `/data/raw` and write to `/data/clean`.

**Features:**
- Hashes participant IDs using SHA256 with salt
- Removes sensitive columns (UA, IP addresses)
- Preserves all trial data

**Usage:**
```bash
python anonymize_cli.py --input data/raw --output data/clean
python anonymize_cli.py -i data/raw -o data/clean --salt my-custom-salt
```

**Arguments:**
- `--input, -i`: Input directory (default: `data/raw`)
- `--output, -o`: Output directory (default: `data/clean`)
- `--salt`: Salt string for hashing (default: project name)
- `--drop-columns`: Columns to drop (default: user_agent, ip_address, etc.)

### 2. `validate_schema.py`

Validate CSV schema and data types.

**Features:**
- Checks required columns
- Validates data types
- Reports missing/extra columns
- Supports strict type checking

**Usage:**
```bash
python validate_schema.py --input data/clean/experiment.csv
python validate_schema.py -i data/clean/ -r --strict
```

**Arguments:**
- `--input, -i`: Input CSV file or directory (required)
- `--output, -o`: Output file for validation report (optional)
- `--strict`: Use strict type checking
- `--recursive, -r`: Process all CSV files recursively

**Expected Schema:**
```
pid, ts, block, trial, modality, ui_mode, pressure, aging,
ID, A, W, target_x, target_y, rt_ms, correct, err_type,
hover_ms, confirm_type, pupil_z_med, tlx_global, tlx_mental,
browser, dpi
```

**Required Columns:**
- `pid`: Participant ID
- `ts`: Timestamp
- `trial`: Trial number
- `browser`: Browser name
- `dpi`: Device pixel ratio

### 3. `summarize_run.py`

Generate statistical summary report.

**Features:**
- Counts participants and trials per condition
- Calculates mean/SD reaction times
- Computes error and timeout rates
- Formats readable report

**Usage:**
```bash
python summarize_run.py --input data/clean/experiment.csv
python summarize_run.py -i data/clean/ -r > summary.txt
```

**Arguments:**
- `--input, -i`: Input CSV file or directory (required)
- `--output, -o`: Output file for summary (default: stdout)
- `--recursive, -r`: Process all CSV files recursively

**Output Includes:**
- Total participants and trials
- Trials per condition
- Mean/SD reaction times per condition
- Error rates and timeout rates
- TLX workload statistics (if available)

## Installation

Required Python packages:
```bash
pip install pandas numpy
```

## Workflow

### 1. Data Collection
Export CSV data from the experiment app to `/data/raw/`.

### 2. Anonymization
```bash
python anonymize_cli.py -i data/raw -o data/clean
```

This will:
- Hash all participant IDs
- Remove sensitive columns
- Write anonymized CSV to `data/clean/`

### 3. Validation
```bash
python validate_schema.py -i data/clean/
```

This checks:
- Required columns present
- No unexpected columns
- Data types correct
- Data values valid

### 4. Summarization
```bash
python summarize_run.py -i data/clean/ > summary.txt
```

This generates:
- Participant counts
- Trials per condition
- Reaction time statistics
- Error and timeout rates

## Examples

### Complete Pipeline

```bash
# 1. Anonymize raw data
python anonymize_cli.py -i data/raw -o data/clean

# 2. Validate anonymized data
python validate_schema.py -i data/clean/ --strict

# 3. Generate summary
python summarize_run.py -i data/clean/ -o summary.txt
```

### Batch Processing

```bash
# Process all CSVs in a directory
python validate_schema.py -i data/clean/ -r --strict

# Summarize all experiments
python summarize_run.py -i experiments/ -r > all_summaries.txt
```

### Custom Salt

```bash
# Use custom salt for anonymization
python anonymize_cli.py -i data/raw -o data/clean --salt my-research-salt
```

## Error Handling

All tools include:
- Clear error messages
- File path reporting
- Graceful failure handling
- Exit codes for scripting

**Exit Codes:**
- `0`: Success
- `1`: Error (file not found, validation failure, etc.)

## Output Formats

### Anonymize
- Writes CSV files to output directory
- Preserves original filenames

### Validate
- Prints validation results to stdout
- Optional JSON report with `--output`

### Summarize
- Prints formatted report to stdout
- Optional text file with `--output`

## Best Practices

1. **Always anonymize before sharing**: Use `anonymize_cli.py` first
2. **Validate before analysis**: Check schema with `validate_schema.py`
3. **Generate summaries**: Use `summarize_run.py` for quick insights
4. **Use version control**: Commit anonymized data (not raw data)
5. **Document salt**: Record the salt value used for anonymization

## Troubleshooting

### Import Errors
```bash
# Install required packages
pip install pandas numpy
```

### File Not Found
```bash
# Check path exists
ls data/raw/
```

### Validation Failures
```bash
# Check column names
head -1 data/clean/experiment.csv
```

### Permission Errors
```bash
# Make scripts executable
chmod +x ops/*.py
```

## Contributing

When adding new tools:
1. Follow existing CLI patterns
2. Include docstrings and help text
3. Use argparse for argument parsing
4. Provide clear error messages
5. Add examples to README

