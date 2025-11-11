library(tidyverse)
library(emmeans)

# Assumes m_rt exists in the workspace (from 02_models.R)
if (!exists("m_rt")) {
  stop("m_rt model not found. Please run 02_models.R first.")
}

emm_ui <- emmeans(m_rt, ~ ui_mode, type = "response")
tab <- summary(emm_ui)
RT_static <- tab$response[tab$ui_mode == "static"]
RT_adaptive <- tab$response[tab$ui_mode == "adaptive"]

epsilon <- 0.05 * RT_static
diff_ui <- contrast(emm_ui, method = "revpairwise", adjust = "none")
ci90 <- confint(diff_ui, level = 0.90)

# Create results directory if it doesn't exist
dir.create("results", showWarnings = FALSE)

# Write summary
summary_text <- sprintf(
  "RT static=%.1f ms, adaptive=%.1f ms, diff=%.1f ms, 90%% CI=[%.1f, %.1f], margin=±%.1f ms",
  RT_static, RT_adaptive, RT_adaptive - RT_static, ci90$lower.CL, ci90$upper.CL, epsilon
)

writeLines(summary_text, "results/tost_summary.txt")

# Check equivalence
is_equivalent <- ci90$lower.CL > -epsilon && ci90$upper.CL < epsilon

cat("\n=== TOST Equivalence Test ===\n")
cat(summary_text, "\n")
if (is_equivalent) {
  cat("✓ RT equivalence (no slow-down) established.\n")
} else {
  cat("○ No equivalence established.\n")
}

cat("✓ TOST summary saved to results/tost_summary.txt\n")

