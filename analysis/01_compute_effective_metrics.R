library(tidyverse)

trial <- read_csv("data/clean/trial_data.csv", show_col_types = FALSE)

# Normalize column names: handle both rt_ms/movement_time_ms and pid/participant_id
if ("rt_ms" %in% names(trial) && !"movement_time_ms" %in% names(trial)) {
  trial <- trial %>% rename(movement_time_ms = rt_ms)
}
if ("pid" %in% names(trial) && !"participant_id" %in% names(trial)) {
  trial <- trial %>% rename(participant_id = pid)
}
# Create error column from correct/err_type if needed
if (!"error" %in% names(trial)) {
  if ("correct" %in% names(trial)) {
    trial <- trial %>% mutate(error = ifelse(is.na(correct) | correct == FALSE, 1, 0))
  } else if ("err_type" %in% names(trial)) {
    trial <- trial %>% mutate(error = ifelse(!is.na(err_type) & err_type != "", 1, 0))
  } else {
    trial <- trial %>% mutate(error = 0)
  }
}

rt <- trial %>%
  filter(error == 0, movement_time_ms >= 150, movement_time_ms <= 5000, !is.na(projected_error_px)) %>%
  mutate(
    participant_id = factor(participant_id),
    modality = factor(modality, levels = c("hand","gaze")),
    ui_mode = factor(ui_mode, levels = c("static","adaptive"))
  )

# ISO 9241-9 Compliant Effective Width Calculation
# Uses projected error (distance along task axis) instead of radial error
# This ensures valid throughput comparisons across conditions
effective <- rt %>%
  group_by(participant_id, modality, ui_mode, target_distance_A) %>%
  summarise(
    # USE PROJECTED ERROR (ISO 9241-9 COMPLIANT)
    # Projected error is the component of selection error along the movement axis
    # This is the standard metric for calculating effective width (We)
    We = 4.133 * sd(projected_error_px, na.rm = TRUE),
    # Calculate IDe using Effective Width
    IDe = log2(target_distance_A / We + 1),
    mean_MT = mean(movement_time_ms, na.rm = TRUE),
    throughput = IDe / (mean_MT / 1000),
    .groups = "drop"
  )

write_csv(effective, "data/clean/effective_metrics.csv")

cat("✓ Effective metrics computed and saved to data/clean/effective_metrics.csv\n")

