#!/bin/bash
# Quick verification script for LBA analysis setup
# Run this before running the full LBA analysis to check everything is ready

echo "=========================================="
echo "LBA Analysis Setup Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

check_warning() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${YELLOW}⚠${NC} $2"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Detect which Python to use (prefer python3, fallback to python)
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}✗${NC} No Python interpreter found"
    exit 1
fi

# Check 1: Python version
echo "1. Checking Python version..."
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 8 ]; then
    check_status 0 "Python version: $PYTHON_VERSION (>= 3.8 required) [using $PYTHON_CMD]"
else
    check_status 1 "Python version: $PYTHON_VERSION (need >= 3.8)"
fi

# Check 2: Required Python packages
echo ""
echo "2. Checking Python dependencies..."
$PYTHON_CMD -c "import pymc" 2>/dev/null
check_status $? "PyMC installed"

$PYTHON_CMD -c "import arviz" 2>/dev/null
check_status $? "ArviZ installed"

$PYTHON_CMD -c "import pandas" 2>/dev/null
check_status $? "pandas installed"

$PYTHON_CMD -c "import numpy" 2>/dev/null
check_status $? "numpy installed"

# Check 3: Data file exists
echo ""
echo "3. Checking data files..."
if [ -f "data/clean/trial_data.csv" ]; then
    FILE_SIZE=$(ls -lh data/clean/trial_data.csv | awk '{print $5}')
    check_status 0 "trial_data.csv exists ($FILE_SIZE)"
else
    check_status 1 "trial_data.csv not found (need to upload)"
fi

# Check 4: Data file structure
echo ""
echo "4. Checking data file structure..."
if [ -f "data/clean/trial_data.csv" ]; then
    $PYTHON_CMD -c "
import pandas as pd
import sys
try:
    df = pd.read_csv('data/clean/trial_data.csv', nrows=1)
    required = ['participant_id', 'rt_ms', 'correct', 'ID', 'modality']
    missing = [col for col in required if col not in df.columns]
    if missing:
        print(f'Missing columns: {missing}')
        sys.exit(1)
    else:
        print('All required columns present')
        sys.exit(0)
except Exception as e:
    print(f'Error reading CSV: {e}')
    sys.exit(1)
" 2>&1
    check_status $? "CSV has required columns"
else
    echo -e "${YELLOW}⚠${NC} Skipping column check (file not found)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 5: Output directory writable
echo ""
echo "5. Checking output directory..."
if [ -d "analysis/results" ]; then
    if [ -w "analysis/results" ]; then
        check_status 0 "analysis/results/ is writable"
    else
        check_status 1 "analysis/results/ is not writable"
    fi
else
    # Try to create it
    mkdir -p analysis/results 2>/dev/null
    if [ $? -eq 0 ]; then
        check_status 0 "Created analysis/results/ directory"
    else
        check_status 1 "Cannot create analysis/results/ directory"
    fi
fi

# Check 6: Script exists and is executable
echo ""
echo "6. Checking LBA script..."
if [ -f "analysis/py/lba.py" ]; then
    check_status 0 "lba.py script exists"
    if [ -x "analysis/py/lba.py" ]; then
        check_status 0 "lba.py is executable"
    else
        check_warning 0 "lba.py is not executable (will use python3 to run)"
    fi
else
    check_status 1 "lba.py script not found"
fi

# Summary
echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to run LBA analysis.${NC}"
    echo ""
    echo "To run the analysis:"
    echo "  ./scripts/run_lba_analysis.sh"
    echo "  OR"
    echo "  python3 analysis/py/lba.py --input data/clean/ --output analysis/results/"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found, but no errors.${NC}"
    echo "You can proceed, but review warnings above."
    exit 0
else
    echo -e "${RED}✗ ${ERRORS} error(s) found.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) also found.${NC}"
    fi
    echo ""
    echo "Please fix the errors above before running the analysis."
    echo "See docs/guides/RUN_LBA_ON_GCP.md for troubleshooting."
    exit 1
fi
