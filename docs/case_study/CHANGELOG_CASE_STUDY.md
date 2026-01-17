# Case Study Web Page Updates - Changelog

## Narrative Conflict Resolution (Task A)

**Issue:** Case study incorrectly stated "gaze errors are predominantly timeouts" when data shows 99.2% are slips.

**Resolution:**
- Created `scripts/audit_error_types.R` to compute error type breakdowns
- Audit results: Gaze = 99.2% slips, 0.8% timeouts; Hand = 95.7% misses, 4.3% timeouts
- Updated `case_study_web.qmd`: Changed "primarily due to timeout errors" → "predominantly slips (99.2%)"
- Updated `CASE_STUDY.md`: Changed "Timeout errors dominated" → "99.2% of gaze errors are slips"
- Exported CSV tables: `error_types_by_modality.csv`, `error_types_by_modality_ui.csv`

## Portfolio Plots (Task B)

**Created Results Dashboard:**
- Single forest plot (dot + 95% CI) for all 4 outcomes: Throughput, Error Rate, Movement Time, TLX
- Saved to `docs/assets/case_study/portfolio/results_dashboard.png`
- Compact, web-ready format (7×4.5in, 200 DPI)

**Re-exported Existing Plots:**
- Optimized dimensions: 6.5×4in, 200 DPI (was 6×5in, 300 DPI)
- Thinner geoms, smaller text, reduced margins
- Files: `error_rate.png`, `throughput.png`, `movement_time.png`

## Heatmaps (Task C)

**Exported Two Heatmaps:**
1. **Spatial Error Rate Heatmap** (`heatmap_spatial_errors.png`)
   - Shows error rates by screen position (binned)
   - Faceted by modality
   - Helps identify UI layout issues

2. **Endpoint Density Heatmap** (`heatmap_endpoint_density.png`)
   - Shows where selection endpoints cluster (gaze modality)
   - Faceted by UI mode (static vs adaptive)
   - Reveals slip patterns and systematic biases
   - Target center marked at (0,0)

Both saved to `docs/assets/case_study/portfolio/` with optimized dimensions (7-7.5×4in, 200 DPI).

## Case Study Page Updates (Task D)

**Added Hero/TL;DR Section:**
- 3 key bullets at top
- Links to GitHub repo, full report, demo

**Added Results Dashboard Section:**
- Prominent placement near top
- Uses new portfolio plot

**Added "Failure Modes (XR-specific)" Section:**
- Panel-tabset with two tabs:
  - Tab 1: Spatial Error Rate Heatmap
  - Tab 2: Endpoint Density Heatmap
- Each tab includes 2-3 line explanation of what to look for

**Moved Statistical Details to Collapsed Appendix:**
- Used HTML `<details>` block for collapse
- Keeps page scannable while preserving technical details

**CSS Styling:**
- Created `docs/assets/css/case-study.css`
- Max-width 750px for figures
- Clean caption styling
- Hero section styling
- Applied via YAML: `css: docs/assets/css/case-study.css`

## Files Created/Modified

**New Scripts:**
- `scripts/audit_error_types.R` - Error type breakdown analysis
- `scripts/export_case_study_portfolio.R` - Portfolio plots and heatmaps export

**New Assets:**
- `docs/assets/case_study/portfolio/results_dashboard.png`
- `docs/assets/case_study/portfolio/heatmap_spatial_errors.png`
- `docs/assets/case_study/portfolio/heatmap_endpoint_density.png`
- `docs/assets/case_study/error_types_by_modality.csv`
- `docs/assets/case_study/error_types_by_modality_ui.csv`
- `docs/assets/css/case-study.css`

**Updated Files:**
- `case_study_web.qmd` - Complete redesign with hero, dashboard, heatmaps, collapsed appendix
- `CASE_STUDY.md` - Fixed error type narrative

**Re-exported (optimized dimensions):**
- `docs/assets/case_study/error_rate.png`
- `docs/assets/case_study/throughput.png`
- `docs/assets/case_study/movement_time.png`

## Verification

**To render the case study:**
```bash
quarto render case_study_web.qmd
```

**Expected output:**
- All figures ≤750px wide (enforced by CSS)
- Error type narrative consistent: "gaze errors are predominantly slips (99.2%)"
- Results dashboard visible near top
- Heatmaps accessible via tabset
- Statistical details collapsed in appendix
- Page readable in <2 minutes

## Key Numbers (Website-Ready)

- N hand: 75, N gaze: 81
- Error Rate: Hand = 1.7%, Gaze = 18.6%, Delta = 16.9%
- Throughput: Hand = 5.15 [4.96, 5.35] bits/s, Gaze = 4.70 bits/s
- NASA-TLX: Hand = 40.4, Gaze = 47.0, Delta = 6.6
- Gaze errors: 99.2% slips, 0.8% timeouts
- Hand errors: 95.7% misses, 4.3% timeouts