#!/bin/bash
# Test script to compare LBA and HDDM on sample data
# Run this before data collection to validate the analysis pipeline

set -e  # Exit on error

echo "=========================================="
echo "Testing LBA and HDDM Analysis Scripts"
echo "=========================================="
echo ""

# Check if synthetic data exists, generate if not
if [ ! -f "data/clean/trial_data.csv" ] || [ ! -s "data/clean/trial_data.csv" ]; then
    echo "Generating synthetic data..."
    Rscript analysis/synthetic_generate.R
    echo ""
fi

# Create output directories
mkdir -p analysis/results/lba
mkdir -p analysis/results/ddm

echo "=========================================="
echo "1. Testing LBA Analysis"
echo "=========================================="
echo ""

if python analysis/py/lba.py --input data/clean/ --output analysis/results/lba/ 2>&1; then
    echo "✓ LBA analysis completed successfully"
    echo ""
    if [ -f "analysis/results/lba/lba_parameters_summary.csv" ]; then
        echo "LBA Results Summary:"
        head -10 analysis/results/lba/lba_parameters_summary.csv
        echo ""
    fi
else
    echo "✗ LBA analysis failed (check error messages above)"
    echo ""
fi

echo "=========================================="
echo "2. Testing DDM/HDDM Analysis"
echo "=========================================="
echo ""

if python analysis/py/ddm_hddm.py --input data/clean/ --output analysis/results/ddm/ 2>&1; then
    echo "✓ DDM/HDDM analysis completed successfully"
    echo ""
    if [ -f "analysis/results/ddm/ddm_parameters.json" ]; then
        echo "DDM Results Summary:"
        cat analysis/results/ddm/ddm_parameters.json
        echo ""
    fi
else
    echo "✗ DDM/HDDM analysis failed (check error messages above)"
    echo ""
fi

echo "=========================================="
echo "3. Comparison Summary"
echo "=========================================="
echo ""

echo "Check the following files for results:"
echo "  - LBA: analysis/results/lba/lba_parameters_summary.csv"
echo "  - DDM: analysis/results/ddm/ddm_parameters.json"
echo ""
echo "Note: These are test results on synthetic/demo data."
echo "      Final analysis will require real experimental data."
echo ""








