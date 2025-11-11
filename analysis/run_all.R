suppressPackageStartupMessages({
  library(tidyverse)
})

set.seed(42)
dir.create("results", showWarnings = FALSE)

trials <- read_csv("data/clean/trial_data.csv", show_col_types = FALSE)

source("analysis/compute_effective_metrics.R")
source("analysis/primary_models.R")

# ISO metrics
iso <- compute_effective_metrics(trials)
write_csv(iso$per_condition, "results/iso_per_condition.csv")
write_csv(iso$tp_condition, "results/iso_tp_condition.csv")

# Attach IDe into trials for modeling (merge by keys)
trials_w <- trials %>%
  left_join(iso$per_condition %>%
              group_by(participant_id, modality, ui_mode) %>%
              summarise(IDe_bits = mean(IDe, na.rm = TRUE), .groups = "drop"),
            by = c("participant_id", "modality", "ui_mode"))

# Models
h1 <- test_h1_modality(trials_w)
h2 <- test_h2_tost(trials_w)
h3 <- test_h3_interaction(trials_w)

capture.output(sessionInfo(), file = "results/session_info.txt")
saveRDS(list(h1 = h1, h2 = h2, h3 = h3), "results/model_objects.rds")
cat("✓ Analyses complete. See /results\n")
