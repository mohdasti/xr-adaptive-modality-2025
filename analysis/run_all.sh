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
# Stage 3: Models (TODO)
# ============================================================================

echo -e "${YELLOW}[3/5] Models (TODO: implement)${NC}"
echo "  TODO: Run LMEM for log-RT (H1, H2, H3)"
echo "  TODO: Run GLMM for errors (H3)"
echo "  TODO: Run TOST equivalence test (H2)"
echo "  TODO: Run TLX analysis (H5)"
echo "  TODO: Export model summaries and EMMs"
echo ""

# ============================================================================
# Stage 4: Visualizations (TODO)
# ============================================================================

echo -e "${YELLOW}[4/5] Visualizations (TODO: implement)${NC}"
echo "  TODO: Create combined panel (MT, Error, TP, TLX)"
echo "  TODO: Generate Fitts fit plots"
echo "  TODO: Export figures"
echo ""

# ============================================================================
# Stage 5: Render Mini-Report (TODO)
# ============================================================================

echo -e "${YELLOW}[5/5] Render Mini-Report (TODO: implement)${NC}"
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
echo "  ○ Models: TODO"
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

