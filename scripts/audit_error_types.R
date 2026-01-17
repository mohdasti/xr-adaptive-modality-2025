#!/usr/bin/env Rscript
# Audit Error Types: Resolve narrative conflict
# Computes error type breakdowns by modality and ui_mode

library(tidyverse)

# Load data (same as Report.qmd)
data_paths <- c("data/clean/trial_data.csv", "../data/clean/trial_data.csv")
df_raw <- NULL
for (path in data_paths) {
  if (file.exists(path)) {
    df_raw <- read_csv(path, show_col_types = FALSE)
    cat("Loaded data from:", path, "\n")
    break
  }
}

if (is.null(df_raw)) stop("Could not find trial_data.csv")

# Apply QC filter
df_raw <- df_raw %>%
  mutate(
    trial_qc_ok = (
      (practice == FALSE | practice == "false" | is.na(practice)) &
      (is.na(zoom_pct) | zoom_pct == 100) &
      (is.na(is_fullscreen) | is_fullscreen == TRUE) &
      (is.na(tab_hidden_ms) | tab_hidden_ms < 500) &
      (is.na(focus_blur_count) | focus_blur_count == 0)
    )
  )

# Input device exclusion
if ("input_device" %in% names(df_raw)) {
  df_raw <- df_raw %>%
    filter(
      input_device == "mouse" |
      (input_device == "trackpad" & modality == "gaze")
    )
}

# Filter to errors only
df_errors <- df_raw %>%
  filter(trial_qc_ok) %>%
  mutate(
    is_correct = !is.na(correct) & (correct == TRUE | correct == "true" | correct == 1)
  ) %>%
  filter(!is_correct) %>%
  filter(!is.na(err_type), err_type != "")

# Categorize error types
df_errors_cat <- df_errors %>%
  mutate(
    err_category = case_when(
      grepl("timeout|timed", err_type, ignore.case = TRUE) ~ "timeout",
      grepl("miss|missclick", err_type, ignore.case = TRUE) ~ "miss",
      grepl("slip|click", err_type, ignore.case = TRUE) ~ "slip",
      TRUE ~ "other"
    ),
    modality = factor(modality, levels = c("hand", "gaze")),
    ui_mode = factor(ui_mode, levels = c("static", "adaptive"))
  )

# Summary by modality
summary_modality <- df_errors_cat %>%
  group_by(modality, err_category) %>%
  summarise(n = n(), .groups = "drop") %>%
  group_by(modality) %>%
  mutate(
    pct = 100 * n / sum(n),
    total = sum(n)
  ) %>%
  arrange(modality, desc(n))

# Summary by modality × ui_mode
summary_modality_ui <- df_errors_cat %>%
  group_by(modality, ui_mode, err_category) %>%
  summarise(n = n(), .groups = "drop") %>%
  group_by(modality, ui_mode) %>%
  mutate(
    pct = 100 * n / sum(n),
    total = sum(n)
  ) %>%
  arrange(modality, ui_mode, desc(n))

# Print console summary
cat("\n=== ERROR TYPE AUDIT ===\n\n")

cat("By Modality:\n")
print(summary_modality)

cat("\nBy Modality × UI Mode:\n")
print(summary_modality_ui)

# Generate summary sentence
gaze_slips <- summary_modality %>% filter(modality == "gaze", err_category == "slip") %>% pull(pct) %>% round(1)
gaze_timeouts <- summary_modality %>% filter(modality == "gaze", err_category == "timeout") %>% pull(pct) %>% round(1)
gaze_misses <- summary_modality %>% filter(modality == "gaze", err_category == "miss") %>% pull(pct) %>% round(1)
hand_slips <- summary_modality %>% filter(modality == "hand", err_category == "slip") %>% pull(pct) %>% round(1)
hand_timeouts <- summary_modality %>% filter(modality == "hand", err_category == "timeout") %>% pull(pct) %>% round(1)
hand_misses <- summary_modality %>% filter(modality == "hand", err_category == "miss") %>% pull(pct) %>% round(1)

cat("\n=== SUMMARY SENTENCE ===\n")
cat("In gaze, slips are ", gaze_slips, "% of errors; timeouts ", gaze_timeouts, "%; misses ", gaze_misses, "%.\n")
cat("In hand, slips are ", hand_slips, "% of errors; timeouts ", hand_timeouts, "%; misses ", hand_misses, "%.\n\n")

# Determine dominant error type
gaze_dominant <- summary_modality %>%
  filter(modality == "gaze") %>%
  slice_max(n, n = 1) %>%
  pull(err_category)

cat("Gaze dominant error type:", gaze_dominant, "\n")
cat("Hand dominant error type:", summary_modality %>%
  filter(modality == "hand") %>%
  slice_max(n, n = 1) %>%
  pull(err_category), "\n\n")

# Export CSV
output_dir <- "docs/assets/case_study"
dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)

write_csv(summary_modality, file.path(output_dir, "error_types_by_modality.csv"))
write_csv(summary_modality_ui, file.path(output_dir, "error_types_by_modality_ui.csv"))

cat("✓ Saved error_types_by_modality.csv\n")
cat("✓ Saved error_types_by_modality_ui.csv\n")
cat("\n=== AUDIT COMPLETE ===\n")