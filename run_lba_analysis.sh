#!/bin/bash
# LBA Analysis Runner with Progress Indicators
# Run this from RStudio terminal or command line

echo "=========================================="
echo "LBA Analysis Runner"
echo "=========================================="
echo ""
echo "This will run the LBA computational model analysis."
echo "Estimated time: 15-30 minutes"
echo ""
echo "Starting analysis..."
echo ""

# Change to project directory
cd "$(dirname "$0")"

# Run the analysis with python3
python3 analysis/py/lba.py --input data/clean/ --output analysis/results/

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ Analysis completed successfully!"
    echo "=========================================="
    echo ""
    echo "Results are in: analysis/results/"
    echo "  - lba_parameters.json"
    echo "  - lba_parameters_summary.csv"
    echo "  - lba_trace.nc"
    echo "  - lba_trace_plot.png"
    echo ""
    echo "You can now render Report.qmd to see results in Section 16."
else
    echo ""
    echo "=========================================="
    echo "✗ Analysis failed. Check error messages above."
    echo "=========================================="
    exit 1
fi



