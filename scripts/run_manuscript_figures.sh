#!/bin/bash
# Regenerate all manuscript figures.
# Run from project root: ./scripts/run_manuscript_figures.sh

set -e
cd "$(dirname "$0")/.."

echo "=== Regenerating manuscript figures ==="
echo ""

echo "1. Behavioral figures (performance, TLX, error types, Fitts)..."
Rscript scripts/export_case_study_assets.R

echo ""
echo "2. LBA figures (forest plot, verification RT)..."
Rscript scripts/export_lba_figures.R

echo ""
echo "3. LBA trace plot (if lba_trace.nc exists)..."
if [ -f outputs/LBA/lba_trace.nc ]; then
  python3 scripts/regenerate_lba_trace_plot.py
else
  echo "   (Skipped: outputs/LBA/lba_trace.nc not found)"
fi

echo ""
echo "=== Done. Figures in docs/assets/case_study/ and outputs/LBA/ ==="
