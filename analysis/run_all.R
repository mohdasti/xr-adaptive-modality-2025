# Master script to run all analyses in sequence
# Usage: Rscript analysis/run_all.R

# Create output directories
dir.create("results", showWarnings = FALSE)
dir.create("results/figures", recursive = TRUE, showWarnings = FALSE)
dir.create("results/tables", recursive = TRUE, showWarnings = FALSE)

cat("========================================\n")
cat("Running XR Adaptive Modality Analysis\n")
cat("========================================\n\n")

# Step 1: Compute effective metrics
cat("Step 1: Computing effective metrics...\n")
source("analysis/01_compute_effective_metrics.R")
cat("\n")

# Step 2: Run primary models (RT and Errors)
cat("Step 2: Running primary models (RT and Errors)...\n")
source("analysis/02_models.R")
cat("\n")

# Step 3: TOST equivalence test
cat("Step 3: Running TOST equivalence test...\n")
source("analysis/03_tost_equivalence.R")
cat("\n")

# Step 4: TLX analysis
cat("Step 4: Running TLX analysis...\n")
source("analysis/04_tlx.R")
cat("\n")

cat("========================================\n")
cat("✓ Analysis complete. See results/ for outputs.\n")
cat("========================================\n")

