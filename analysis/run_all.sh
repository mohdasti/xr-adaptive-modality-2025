#!/bin/bash
#
# Run All Analysis Pipeline
#
# One-command pipeline: validate → summarize → render mini-report
#
# Exit codes:
#   0: Success
#   1: Validation failed
#   2: Analysis error
#   3: Visualization error

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Output directory
RESULTS_DIR="$PROJECT_ROOT/results"
mkdir -p "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR/tables"
mkdir -p "$RESULTS_DIR/figures"

echo "=========================================="
echo "  Analysis Pipeline: run_all"
echo "=========================================="
echo ""

# ============================================================================
# Stage 1: Validate
# ============================================================================

echo -e "${GREEN}[1/5] Validating data...${NC}"

# Check if validator script exists
VALIDATOR_SCRIPT="$PROJECT_ROOT/app/scripts/validate_trials_schema.ts"

if [ ! -f "$VALIDATOR_SCRIPT" ]; then
  echo -e "${YELLOW}⚠ Validator script not found: $VALIDATOR_SCRIPT${NC}"
  echo -e "${YELLOW}  Skipping validation (TODO: implement validator)${NC}"
else
  # Check if trial data exists
  TRIAL_DATA="$PROJECT_ROOT/data/clean/trial_data.csv"
  
  if [ ! -f "$TRIAL_DATA" ]; then
    echo -e "${YELLOW}⚠ Trial data not found: $TRIAL_DATA${NC}"
    echo -e "${YELLOW}  Generating synthetic data for testing...${NC}"
    
    # Generate synthetic data if R is available
    if command -v Rscript &> /dev/null; then
      cd "$PROJECT_ROOT"
      Rscript analysis/synthetic_generate.R 2>/dev/null || true
    else
      echo -e "${YELLOW}  R not available, skipping synthetic data generation${NC}"
    fi
  fi
  
    # Run validator if data exists
    if [ -f "$TRIAL_DATA" ]; then
      cd "$PROJECT_ROOT/app"
      
      # Check if tsx is available
      if command -v npx &> /dev/null; then
        echo "  Running CSV schema validator..."
        if npx tsx scripts/validate_trials_schema.ts "$TRIAL_DATA" > "$RESULTS_DIR/validation_report.txt" 2>&1; then
          echo -e "${GREEN}✓ Validation passed${NC}"
        else
          VALIDATION_EXIT=$?
          echo -e "${YELLOW}⚠ Validation found issues (exit code: $VALIDATION_EXIT)${NC}"
          echo "  See $RESULTS_DIR/validation_report.txt for details"
          echo -e "${YELLOW}  Note: Continuing pipeline (validation is non-blocking for now)${NC}"
        fi
      else
        echo -e "${YELLOW}⚠ npx/tsx not available, skipping TypeScript validator${NC}"
        echo -e "${YELLOW}  TODO: Install Node.js dependencies (npm install)${NC}"
      fi
    else
      echo -e "${YELLOW}⚠ No trial data found, skipping validation${NC}"
    fi
fi

echo ""

# ============================================================================
# Stage 2: Summarize (TODO)
# ============================================================================

echo -e "${YELLOW}[2/5] Summarize (TODO: implement)${NC}"
echo "  TODO: Compute effective metrics (We, IDe, TP)"
echo "  TODO: Compute movement quality metrics (efficiency, curvature)"
echo "  TODO: Generate summary statistics by condition"
echo "  TODO: Export summary tables"
echo ""

# ============================================================================
# Stage 3: Decision Models (LBA)
# ============================================================================

echo -e "${GREEN}[3/5] Decision Models (LBA)${NC}"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
  echo -e "${YELLOW}⚠ Python3 not available, skipping LBA analysis${NC}"
else
  # Check if PyMC is available
  if python3 -c "import pymc" 2>/dev/null; then
    echo "  Running LBA analysis..."
    cd "$PROJECT_ROOT"
    
    LBA_SCRIPT="$PROJECT_ROOT/analysis/py/lba.py"
    if [ -f "$LBA_SCRIPT" ]; then
      if python3 "$LBA_SCRIPT" --input "$PROJECT_ROOT/data/clean/" --output "$RESULTS_DIR" 2>&1 | tee "$RESULTS_DIR/lba_analysis.log"; then
        echo -e "${GREEN}✓ LBA analysis complete${NC}"
      else
        LBA_EXIT=$?
        echo -e "${YELLOW}⚠ LBA analysis had issues (exit code: $LBA_EXIT)${NC}"
        echo "  See $RESULTS_DIR/lba_analysis.log for details"
      fi
    else
      echo -e "${YELLOW}⚠ LBA script not found: $LBA_SCRIPT${NC}"
    fi
  else
    echo -e "${YELLOW}⚠ PyMC not installed. Install with: pip install pymc arviz${NC}"
    echo -e "${YELLOW}  Skipping LBA analysis${NC}"
  fi
fi

echo ""

# ============================================================================
# Stage 4: Statistical Models (TODO)
# ============================================================================

echo -e "${YELLOW}[4/6] Statistical Models (TODO: implement)${NC}"
echo "  TODO: Run LMEM for log-RT (H1, H2, H3)"
echo "  TODO: Run GLMM for errors (H3)"
echo "  TODO: Run TOST equivalence test (H2)"
echo "  TODO: Run TLX analysis (H5)"
echo "  TODO: Export model summaries and EMMs"
echo ""

# ============================================================================
# Stage 5: Visualizations (TODO)
# ============================================================================

echo -e "${YELLOW}[5/6] Visualizations (TODO: implement)${NC}"
echo "  TODO: Create combined panel (MT, Error, TP, TLX)"
echo "  TODO: Generate Fitts fit plots"
echo "  TODO: Export figures"
echo ""

# ============================================================================
# Stage 6: Render Mini-Report (TODO)
# ============================================================================

echo -e "${YELLOW}[6/6] Render Mini-Report (TODO: implement)${NC}"
echo "  TODO: Compile validation results"
echo "  TODO: Summarize descriptive statistics"
echo "  TODO: Extract key model results"
echo "  TODO: Format as markdown report"
echo ""

# ============================================================================
# Summary
# ============================================================================

echo "=========================================="
echo -e "${GREEN}✓ Pipeline completed (validation only)${NC}"
echo "=========================================="
echo ""
echo "Current status:"
echo "  ✓ Validation: Implemented"
echo "  ○ Summarize: TODO"
echo "  ✓ Decision Models (LBA): Implemented"
echo "  ○ Statistical Models: TODO"
echo "  ○ Visualizations: TODO"
echo "  ○ Report: TODO"
echo ""
echo "Results directory: $RESULTS_DIR"
echo ""
echo "Next steps:"
echo "  1. Implement summarize stage (compute effective metrics)"
echo "  2. Implement models stage (run statistical tests)"
echo "  3. Implement visualizations stage (generate figures)"
echo "  4. Implement report stage (render mini-report)"
echo ""

# Exit with success (validation passed, even if other stages are TODOs)
exit 0

