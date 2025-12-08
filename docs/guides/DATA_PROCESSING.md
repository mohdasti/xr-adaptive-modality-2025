# Data Processing Guide

This guide explains how to process raw participant data into the cleaned dataset used for analysis.

## Data Directory Structure

```
data/
├── raw/                    # Individual participant CSV files (gitignored, private)
│   ├── P040_2025-12-05T07-57-03_merged.csv
│   ├── P041_2025-12-05T08-15-22_merged.csv
│   └── ...
└── clean/                  # Aggregated cleaned dataset (for analysis)
    └── trial_data.csv      # Merged dataset from all participants
```

## Workflow

### 1. Collect Raw Data

Participant CSV files are automatically downloaded or emailed when they complete the study. Place all raw participant CSV files in `data/raw/`:

```bash
# Example: Copy participant files to raw directory
cp ~/Downloads/P040_*.csv data/raw/
cp ~/Downloads/P041_*.csv data/raw/
```

**Important:** 
- `data/raw/` is gitignored (private data, not committed to repository)
- Keep individual participant files here for backup and traceability

### 2. Install Dependencies

The merge script requires `pandas`. Install it first:

```bash
# Install pandas
pip install pandas

# Or install from requirements file
pip install -r requirements.txt
```

### 3. Merge Raw Data

Use the merge script to combine all raw files into a single cleaned dataset:

```bash
# Basic merge (keeps original participant IDs)
python scripts/merge_raw_data.py

# Merge with anonymization (hashes participant IDs)
python scripts/merge_raw_data.py --anonymize

# Custom input/output paths
python scripts/merge_raw_data.py --input data/raw --output data/clean/trial_data.csv
```

**What the script does:**
- Reads all CSV files from `data/raw/`
- Normalizes column names (handles variations like `pid` vs `participant_id`)
- Combines all data into a single dataset
- Handles column mismatches across files
- Optionally anonymizes participant IDs (SHA256 hashing)
- Writes aggregated data to `data/clean/trial_data.csv`

**Output:**
- Creates/overwrites `data/clean/trial_data.csv`
- This file is used by all analysis scripts
- Can be tracked in git (if anonymized) or kept private

### 4. Verify Merged Data

Check the merged dataset:

```bash
# Quick check
head -5 data/clean/trial_data.csv
wc -l data/clean/trial_data.csv

# Or use Python
python -c "import pandas as pd; df = pd.read_csv('data/clean/trial_data.csv'); print(f'Rows: {len(df)}, Participants: {df[\"participant_id\"].nunique()}')"
```

### 5. Run Analysis

Once `data/clean/trial_data.csv` is ready, run analysis scripts:

```bash
# R analysis pipeline
Rscript analysis/compute_effective_metrics.R
Rscript analysis/02_models.R
Rscript analysis/primary_models.R

# Python decision models
python analysis/py/lba.py --input data/clean/ --output results/
```

## Anonymization

### When to Anonymize

- **Before committing to git**: Always anonymize if you plan to version control the data
- **For sharing**: Anonymize before sharing with collaborators
- **For publication**: Anonymize before making data publicly available

### How Anonymization Works

The merge script uses SHA256 hashing with a salt:

```python
hashed_id = SHA256(participant_id + salt)
```

**Default salt:** `"xr-adaptive-modality-2025"`

**Custom salt:**
```bash
python scripts/merge_raw_data.py --anonymize --salt "my-custom-salt"
```

**Important:** 
- Use the same salt for consistent hashing across runs
- Document the salt used (for reproducibility)
- Never commit the salt to the repository if it contains sensitive information

## Data Cleaning

The merge script automatically:

1. **Normalizes column names:**
   - `pid` → `participant_id`
   - `movement_time_ms` → `rt_ms`
   - Handles other common variations

2. **Handles missing columns:**
   - Files with different columns are merged using outer join
   - Missing values are filled with `NA`/`NaN`

3. **Removes duplicates:**
   - Duplicate columns (if any) are removed
   - Data is sorted by participant_id and trial_number

## Troubleshooting

### No CSV files found

```
Warning: No CSV files found in data/raw
```

**Solution:** Add participant CSV files to `data/raw/` directory first.

### Column mismatch errors

If files have very different schemas, the script will still merge them but some columns may have missing values.

**Solution:** Review the merged data and handle missing columns in your analysis scripts.

### Memory errors with large datasets

If you have many participants or very large files, you may run into memory issues.

**Solution:** Process in batches or increase available memory.

## Best Practices

1. **Keep raw files separate:** Always keep individual participant files in `data/raw/` for backup
2. **Document the merge:** Note when and how you merged the data
3. **Version control:** Only commit `data/clean/trial_data.csv` if it's anonymized
4. **Regular backups:** Keep backups of both raw and cleaned data
5. **Verify before analysis:** Always check the merged dataset before running analysis

## Example Workflow

```bash
# 1. Collect participant files
cp ~/Downloads/P040_*.csv data/raw/
cp ~/Downloads/P041_*.csv data/raw/

# 2. Merge with anonymization
python scripts/merge_raw_data.py --anonymize

# 3. Verify
head -5 data/clean/trial_data.csv

# 4. Run analysis
Rscript analysis/02_models.R
```

## Related Scripts

- `ops/anonymize_cli.py`: Anonymize individual CSV files (alternative to merge script)
- `ops/validate_schema.py`: Validate CSV schema and data types
- `ops/summarize_run.py`: Generate statistical summary reports

