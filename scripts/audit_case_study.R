#!/usr/bin/env Rscript
# Audit Case Study: Validate consistency + correctness
# Outputs values.json and console summary

library(tidyverse)
library(jsonlite)

cat("=== Case Study Audit ===\n\n")

# 1) Policy replay diagnostics
cat("1. Policy Replay Diagnostics:\n")
policy_summary <- NULL
policy_events <- NULL
policy_by_pid <- NULL
width_diag <- NULL

if (file.exists("outputs/policy_replay_summary.csv")) {
  policy_summary <- read_csv("outputs/policy_replay_summary.csv", show_col_types = FALSE)
  cat("  ✅ Loaded policy_replay_summary.csv\n")
} else {
  cat("  ⚠️  policy_replay_summary.csv not found\n")
}

if (file.exists("outputs/policy_replay_events.csv")) {
  policy_events <- read_csv("outputs/policy_replay_events.csv", show_col_types = FALSE)
  cat("  ✅ Loaded policy_replay_events.csv\n")
} else {
  cat("  ⚠️  policy_replay_events.csv not found\n")
}

if (file.exists("outputs/policy_replay_by_pid.csv")) {
  policy_by_pid <- read_csv("outputs/policy_replay_by_pid.csv", show_col_types = FALSE)
  cat("  ✅ Loaded policy_replay_by_pid.csv\n")
} else {
  cat("  ⚠️  policy_replay_by_pid.csv not found\n")
}

if (file.exists("outputs/width_inflation_diagnostics_summary.csv")) {
  width_diag <- read_csv("outputs/width_inflation_diagnostics_summary.csv", show_col_types = FALSE)
  cat("  ✅ Loaded width_inflation_diagnostics_summary.csv\n")
} else {
  cat("  ⚠️  width_inflation_diagnostics_summary.csv not found\n")
}

# Check width inflation activation
if (!is.null(width_diag)) {
  if ("width_scale_factor_neq_1_count" %in% names(width_diag)) {
    non_one_count <- width_diag$width_scale_factor_neq_1_count[1]
    cat(sprintf("  Width inflation activation: %d trials with width_scale_factor != 1.0\n", non_one_count))
    if (non_one_count == 0) {
      cat("  ✅ Width inflation never activated (as expected)\n")
    } else {
      cat("  ⚠️  Width inflation DID activate (unexpected!)\n")
    }
  }
}

# Adaptation events by condition
if (!is.null(policy_events)) {
  if ("modality" %in% names(policy_events) && "ui_mode" %in% names(policy_events) && "pressure" %in% names(policy_events)) {
    adapt_by_cond <- policy_events %>%
      filter(action != "none") %>%
      group_by(modality, ui_mode, pressure) %>%
      summarise(n_events = n(), .groups = "drop")
    cat("\n  Adaptation events by condition:\n")
    print(adapt_by_cond)
  }
  
  # Per-participant activation rates
  if ("pid" %in% names(policy_events)) {
    adapt_by_pid <- policy_events %>%
      filter(action != "none") %>%
      group_by(pid) %>%
      summarise(n_events = n(), .groups = "drop") %>%
      arrange(desc(n_events)) %>%
      head(10)
    cat("\n  Top 10 participants by adaptation events:\n")
    print(adapt_by_pid)
  }
}

# 2) Error type breakdowns
cat("\n2. Error Type Breakdowns:\n")
err_modality <- NULL
err_modality_ui <- NULL

if (file.exists("docs/assets/case_study/error_types_by_modality.csv")) {
  err_modality <- read_csv("docs/assets/case_study/error_types_by_modality.csv", show_col_types = FALSE)
  cat("  ✅ Loaded error_types_by_modality.csv\n")
  
  if ("modality" %in% names(err_modality) && "err_category" %in% names(err_modality) && "pct" %in% names(err_modality)) {
    gaze_slip <- err_modality %>% filter(modality == "gaze", err_category == "slip") %>% pull(pct)
    gaze_timeout <- err_modality %>% filter(modality == "gaze", err_category == "timeout") %>% pull(pct)
    hand_miss <- err_modality %>% filter(modality == "hand", err_category == "miss") %>% pull(pct)
    hand_timeout <- err_modality %>% filter(modality == "hand", err_category == "timeout") %>% pull(pct)
    
    cat(sprintf("  Gaze: %.1f%% slips, %.1f%% timeouts\n", 
                ifelse(length(gaze_slip) > 0, gaze_slip, 0),
                ifelse(length(gaze_timeout) > 0, gaze_timeout, 0)))
    cat(sprintf("  Hand: %.1f%% misses, %.1f%% timeouts\n",
                ifelse(length(hand_miss) > 0, hand_miss, 0),
                ifelse(length(hand_timeout) > 0, hand_timeout, 0)))
  }
} else {
  cat("  ⚠️  error_types_by_modality.csv not found\n")
}

# 3) Sample sizes
cat("\n3. Sample Sizes:\n")
data_paths <- c("data/clean/trial_data.csv", "../data/clean/trial_data.csv")
df_raw <- NULL
for (path in data_paths) {
  if (file.exists(path)) {
    df_raw <- read_csv(path, show_col_types = FALSE)
    cat(sprintf("  ✅ Loaded data from: %s\n", path))
    break
  }
}

if (!is.null(df_raw)) {
  # Column normalization
  if ("participant_id" %in% names(df_raw) && !"pid" %in% names(df_raw)) {
    df_raw <- df_raw %>% rename(pid = participant_id)
  }
  
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
  
  # Count unique participants by modality
  n_hand <- df_raw %>%
    filter(trial_qc_ok, modality == "hand") %>%
    pull(pid) %>%
    n_distinct()
  
  n_gaze <- df_raw %>%
    filter(trial_qc_ok, modality == "gaze") %>%
    pull(pid) %>%
    n_distinct()
  
  n_total <- df_raw %>%
    filter(trial_qc_ok) %>%
    pull(pid) %>%
    n_distinct()
  
  cat(sprintf("  N hand (mouse only): %d\n", n_hand))
  cat(sprintf("  N gaze (all included): %d\n", n_gaze))
  cat(sprintf("  N total: %d\n", n_total))
  
  values <- list(
    n_hand = n_hand,
    n_gaze = n_gaze,
    n_total = n_total
  )
} else {
  cat("  ⚠️  Could not load trial data\n")
  values <- list(n_hand = NA, n_gaze = NA, n_total = NA)
}

# 4) Search for stale phrases
cat("\n4. Narrative Consistency Check:\n")
files_to_check <- c("case_study_web.qmd", "CASE_STUDY.md")
phrases <- c(
  "timeout errors dominated gaze",
  "timeouts dominated gaze modality",
  "primarily due to timeout"
)

for (file in files_to_check) {
  if (file.exists(file)) {
    content <- readLines(file, warn = FALSE)
    for (phrase in phrases) {
      matches <- grep(phrase, content, ignore.case = TRUE, value = FALSE)
      if (length(matches) > 0) {
        cat(sprintf("  ⚠️  Found '%s' in %s (lines: %s)\n", phrase, file, paste(matches, collapse = ", ")))
        for (line_num in matches) {
          cat(sprintf("      Line %d: %s\n", line_num, substr(content[line_num], 1, 80)))
        }
      }
    }
  }
}

# Write values.json
write_json(values, "values.json", pretty = TRUE, auto_unbox = TRUE)
cat("\n✅ Wrote values.json\n")

cat("\n=== Audit Complete ===\n")
