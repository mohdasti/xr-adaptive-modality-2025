library(tidyverse)

trial <- read_csv("data/clean/trial_data.csv", show_col_types = FALSE)

# Exclusions (trial-level)
trial <- trial %>%
  mutate(exclude_RT = movement_time_ms < 150 | movement_time_ms > 5000 | timeout == TRUE)

rt_ok <- trial %>% filter(!exclude_RT, error == 0)

# Effective width and IDe by participant × modality × ui × A
eff <- rt_ok %>%
  group_by(participant_id, modality, ui_mode, target_distance_A) %>%
  summarise(
    We = 4.133 * sd(endpoint_error_px, na.rm = TRUE),
    IDe = log2(target_distance_A / We + 1),
    mean_MT = mean(movement_time_ms, na.rm = TRUE),
    throughput = IDe / (mean_MT/1000),
    n = n(),
    .groups = "drop"
  )

write_csv(eff, "results/tables/effective_metrics_by_condition.csv")

tp_summary <- eff %>%
  group_by(modality, ui_mode) %>%
  summarise(
    mean_TP = mean(throughput), sd_TP = sd(throughput),
    mean_We = mean(We), mean_IDe = mean(IDe), n_conds = n(),
    .groups = "drop"
  )

write_csv(tp_summary, "results/tables/throughput_summary.csv")

cat("✓ Effective metrics exported to results/tables/\n")

