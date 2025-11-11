library(tidyverse)
library(afex)
library(emmeans)

# Check if block data exists
block_path <- "data/clean/block_data.csv"
if (file.exists(block_path)) {
  tlx <- read_csv(block_path, show_col_types = FALSE)
  
  if (nrow(tlx) > 0) {
    tlx <- tlx %>%
      mutate(
        participant_id = factor(participant_id),
        modality = factor(modality, levels = c("hand","gaze")),
        ui_mode = factor(ui_mode, levels = c("static","adaptive")),
        # Reverse-score performance: 0 = perfect, 100 = poor
        # So we reverse: 100 - performance (higher = better performance = lower workload)
        tlx_total = tlx_mental + tlx_physical + tlx_temporal + (100 - tlx_performance) + tlx_effort + tlx_frustration
      )
    
    # Create results directory if it doesn't exist
    dir.create("results", showWarnings = FALSE)
    dir.create("results/tables", recursive = TRUE, showWarnings = FALSE)
    
    # RM-ANOVA
    aov_tlx <- aov_ez(
      id = "participant_id",
      dv = "tlx_total",
      data = tlx,
      within = c("modality", "ui_mode"),
      anova_table = list(es = "pes")
    )
    
    cat("\n=== TLX ANOVA ===\n")
    print(aov_tlx)
    
    # Save ANOVA to file
    sink("results/tlx_anova.txt")
    print(aov_tlx)
    sink()
    
    # EMMs
    emm_tlx <- emmeans(aov_tlx, ~ modality * ui_mode)
    cat("\n=== TLX EMMs ===\n")
    print(emm_tlx)
    
    write_csv(as.data.frame(emm_tlx), "results/tables/emmeans_TLX.csv")
    
    cat("✓ TLX analysis complete. Results saved to results/\n")
  } else {
    cat("⚠ TLX block data is empty; skipping TLX analysis.\n")
  }
} else {
  cat("⚠ TLX block data not found at data/clean/block_data.csv; skipping TLX analysis.\n")
}

