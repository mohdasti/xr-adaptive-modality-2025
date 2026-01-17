# Dynamic Sample Size Implementation Summary

## Overview
The Report.qmd file has been updated to include dynamic sample size reporting throughout all sections. This ensures that as you add new participants to your data folder, the sample sizes in figure captions, table captions, and section headers will automatically update when you re-render the report.

## Changes Made

### 1. Helper Functions Added (Lines 133-189)
New helper functions were added after the `build_mixed_formula` function:

- **`get_n_participants(data)`**: Returns the number of unique participants in a dataset
- **`get_n_by_condition(data, modality_val, ui_mode_val, pressure_val)`**: Returns sample size filtered by specific conditions
- **`get_n_by_modality(data, modality_val)`**: Returns sample size for a specific modality
- **`get_n_by_ui_mode(data, ui_mode_val)`**: Returns sample size for a specific UI mode
- **`get_n_string(data, prefix, suffix)`**: Returns formatted string like "N = 48 participants"
- **`get_n_modality_string(data)`**: Returns formatted string comparing sample sizes across modalities

These functions work with any data subset (df, df_all_trials, df_iso, etc.) and automatically compute the correct sample size.

### 2. Section-by-Section Updates

#### **Section 2: Demographics**
- Added: `**Sample Size:** r get_n_string(df_raw %>% distinct(pid))` participants.`

#### **Section 3: Primary Analysis - Throughput**
- Added sample size to section header
- Updated table caption to include dynamic N
- Updated main figure caption (plot-tp) with dynamic N
- Updated EMM figure caption with dynamic N
- Added N_participants and N_observations columns to summary table

#### **Section 4: Movement Time Analysis**
- Added sample size to section header (correct trials only)
- Updated table caption with dynamic N
- Updated main figure caption with dynamic N
- Updated EMM figure caption with dynamic N
- Added N_participants and N_trials columns to summary table

#### **Section 5: Fitts' Law Modelling**
- Added sample size to section header
- Updated figure caption with dynamic N
- Updated model fit statistics table caption with dynamic N

#### **Section 6: Error Rate Analysis**
- Added sample size to section header (all trials)
- Updated figure caption with dynamic N
- Updated table caption with dynamic N
- Changed N column to N_participants in summary table

#### **Section 7: Accuracy & Gaze Dynamics**
- Added sample size to section header
- Updated Effective Width table caption with dynamic N
- Updated We plot figure caption with dynamic N
- Updated endpoint accuracy scatter plot caption with dynamic N
- Updated target re-entries table caption with dynamic N
- Updated re-entries plot caption with dynamic N
- Added N_participants column to summary tables

#### **Section 8: Workload (NASA-TLX)**
- Added sample size to section header
- Updated main TLX figure caption with dynamic N
- Updated stacked bar chart caption with dynamic N
- Updated table caption with dynamic N
- Added N_participants column to summary table

#### **Section 9: Learning Curves & Practice Effects**
- Added sample size to section header
- Updated learning curve data summary table caption with dynamic N
- Updated movement time learning curve figure caption with dynamic N

#### **Section 10: Movement Quality Metrics**
- Added sample size to section header (submovement data)
- Updated submovement count table caption with dynamic N
- Updated submovement count figure caption with dynamic N
- Updated submovements vs. ID figure caption with dynamic N
- Updated verification time section header with sample size
- Updated verification time table caption with dynamic N
- Added N_participants and N_trials columns to summary tables

#### **Section 11: Error Patterns & Types**
- Added sample size to section header (error type data)
- Updated error type distribution table caption with dynamic N

#### **Section 12: Block Order & Temporal Effects**
- Added sample size to section header (block-level data)

#### **Section 13: Spatial Patterns & Heatmaps**
- Added sample size to section header (spatial position data)

#### **Section 14: Adaptive UI Mechanism Analysis**
- Added sample size to section header (width scaling data)
- Updated width scaling table captions with dynamic N (both for no scaling and scaling cases)
- Updated width scaling figure caption with dynamic N
- Added N_participants and N_trials columns to summary tables

## How It Works

### Dynamic Inline R Code
Sample sizes are computed dynamically using inline R code in markdown:
```markdown
**Sample Size:** `r get_n_string(df)` participants.
```

### Dynamic Figure Captions
Figure captions use the `!expr` syntax to evaluate R expressions:
```r
#| fig-cap: !expr paste0("Throughput by Modality. ", get_n_string(df_iso), " participants. ...")
```

### Dynamic Table Captions
Table captions use `paste0()` with the helper functions:
```r
kable(caption = paste0("Throughput by Condition (", get_n_string(df_iso), " participants)"))
```

## Benefits

1. **Automatic Updates**: When you add new participants, just re-render the report and all sample sizes update automatically
2. **Consistency**: Sample sizes are computed from the actual data, eliminating manual counting errors
3. **Transparency**: Readers can see exactly how many participants contributed to each analysis
4. **Feature-Specific Tracking**: Different features (TLX, submovements, verification time, etc.) may have different sample sizes, and this is now clearly reported

## Data Subsets Tracked

The implementation tracks sample sizes for different data subsets:
- **`df`**: Correct trials with valid RTs (for performance metrics)
- **`df_all_trials`**: All trials including errors (for error rate analysis)
- **`df_iso`**: ISO 9241-9 throughput calculations
- **`df_raw`**: Raw data (for demographics, TLX, etc.)
- Feature-specific subsets: submovement data, verification time data, width scaling data, etc.

## Example Output

When rendered, you'll see:
- Section headers: "**Sample Size:** N = 48 participants with valid throughput data."
- Figure captions: "Throughput by Modality. N = 48 participants. Raincloud plot..."
- Table captions: "Throughput by Condition (N = 48 participants)"

## Testing

To verify the implementation works:
1. Render the report with current data
2. Note the sample sizes in various sections
3. Add a new participant's data
4. Re-render the report
5. Verify that sample sizes have incremented appropriately

## Notes

- Sample sizes may differ across sections due to:
  - Data quality filters (e.g., RT range filters)
  - Feature availability (e.g., not all participants have TLX data if added later)
  - Condition-specific analyses (e.g., gaze-only analyses)
- The helper functions handle missing data gracefully and return 0 when no data is available
- All changes maintain backward compatibility with existing code
