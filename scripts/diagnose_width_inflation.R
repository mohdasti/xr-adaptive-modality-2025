#!/usr/bin/env Rscript
# Diagnostic script to determine why hand width inflation did not activate
# This script matches the data loading and filtering logic from Report.qmd

suppressPackageStartupMessages({
  library(tidyverse)
  library(knitr)
})

# --- DATA LOADING (matching Report.qmd) ---
data_paths <- c(
  "data/clean/trial_data.csv",           # If running from project root
  "../data/clean/trial_data.csv"         # If running from subdirectory
)

df_raw <- NULL
for (path in data_paths) {
  if (file.exists(path)) {
    tryCatch({
      df_raw <- read_csv(path, show_col_types = FALSE)
      cat("Loaded data from:", path, "\n")
      break
    }, error = function(e) {
      # Continue to next path
    })
  }
}

if (is.null(df_raw)) {
  stop("Could not find 'trial_data.csv'. Tried paths:\n",
       paste("  -", data_paths, collapse = "\n"),
       "\nCurrent working directory:", getwd())
}

# Normalize column names (matching Report.qmd)
if ("participant_id" %in% names(df_raw) && !"pid" %in% names(df_raw)) {
  df_raw <- df_raw %>% rename(pid = participant_id)
}
if ("movement_time_ms" %in% names(df_raw) && !"rt_ms" %in% names(df_raw)) {
  df_raw <- df_raw %>% rename(rt_ms = movement_time_ms)
}

# Apply same QC filters as Report.qmd
df_raw <- df_raw %>%
  mutate(
    trial_qc_ok = (
      (practice == FALSE | practice == "false" | is.na(practice)) &
      (is.na(zoom_pct) | zoom_pct == 100) &
      (is.na(is_fullscreen) | is_fullscreen == TRUE | (if("fullscreen" %in% names(.)) fullscreen == TRUE else TRUE)) &
      (is.na(tab_hidden_ms) | tab_hidden_ms < 500) &
      (is.na(focus_blur_count) | focus_blur_count == 0)
    )
  )

# Filter to non-practice trials only (matching Report.qmd)
df_clean <- df_raw %>% filter(trial_qc_ok)

cat("\n=== WIDTH INFLATION DIAGNOSTIC ===\n\n")
cat("Total non-practice trials:", nrow(df_clean), "\n")
cat("Participants:", n_distinct(df_clean$pid), "\n\n")

# --- 1. EMPIRICAL NON-ACTIVATION VERIFICATION ---
cat("1. EMPIRICAL NON-ACTIVATION VERIFICATION\n")
cat("=========================================\n\n")

if ("width_scale_factor" %in% names(df_clean)) {
  # Overall
  n_total <- nrow(df_clean)
  n_scaled <- sum(df_clean$width_scale_factor != 1, na.rm = TRUE)
  pct_scaled <- 100 * n_scaled / n_total
  
  cat(sprintf("Overall: %d / %d trials with width_scale_factor != 1 (%.2f%%)\n", 
              n_scaled, n_total, pct_scaled))
  
  # Hand/adaptive/pressure=1
  df_hand_adapt_p1 <- df_clean %>%
    filter(
      modality == "hand" | modality == "hand" | tolower(modality) == "hand",
      ui_mode == "adaptive" | tolower(ui_mode) == "adaptive",
      pressure == 1 | pressure == "1"
    )
  
  if (nrow(df_hand_adapt_p1) > 0) {
    n_hand_adapt_p1 <- nrow(df_hand_adapt_p1)
    n_scaled_hand <- sum(df_hand_adapt_p1$width_scale_factor != 1, na.rm = TRUE)
    pct_scaled_hand <- 100 * n_scaled_hand / n_hand_adapt_p1
    
    cat(sprintf("Hand/Adaptive/Pressure=1: %d / %d trials with width_scale_factor != 1 (%.2f%%)\n", 
                n_scaled_hand, n_hand_adapt_p1, pct_scaled_hand))
  } else {
    cat("No trials found for Hand/Adaptive/Pressure=1\n")
  }
} else {
  cat("⚠ width_scale_factor column not found\n")
}

cat("\n")

# --- 2. PRESSURE GATE CHECK ---
cat("2. PRESSURE GATE CHECK\n")
cat("======================\n\n")

pressure_runtime_cols <- c("pressureEnabled", "pressure_enabled", "pressure_mode", 
                           "countdown_active", "pressure_state")
pressure_runtime_col <- NULL

for (col in pressure_runtime_cols) {
  if (col %in% names(df_clean)) {
    pressure_runtime_col <- col
    break
  }
}

if (!is.null(pressure_runtime_col)) {
  cat(sprintf("Found runtime pressure column: %s\n\n", pressure_runtime_col))
  
  df_hand_adapt <- df_clean %>%
    filter(
      modality == "hand" | tolower(modality) == "hand",
      ui_mode == "adaptive" | tolower(ui_mode) == "adaptive"
    )
  
  if (nrow(df_hand_adapt) > 0 && !all(is.na(df_hand_adapt[[pressure_runtime_col]]))) {
    # Create mismatch table
    pressure_mismatch <- df_hand_adapt %>%
      mutate(
        pressure_label = as.character(pressure),
        runtime_state = as.character(.data[[pressure_runtime_col]]),
        mismatch = pressure_label != runtime_state
      ) %>%
      group_by(pressure_label, runtime_state) %>%
      summarise(
        n_trials = n(),
        n_mismatch = sum(mismatch),
        .groups = "drop"
      ) %>%
      mutate(
        pct_mismatch = 100 * n_mismatch / n_trials
      )
    
    cat("Pressure Label × Runtime State (Hand/Adaptive only):\n")
    print(kable(pressure_mismatch, digits = 2))
    
    overall_mismatch_pct <- 100 * sum(df_hand_adapt$pressure != df_hand_adapt[[pressure_runtime_col]], na.rm = TRUE) / 
                            sum(!is.na(df_hand_adapt$pressure) & !is.na(df_hand_adapt[[pressure_runtime_col]]))
    cat(sprintf("\nOverall mismatch rate: %.2f%%\n", overall_mismatch_pct))
  } else {
    cat("⚠ No valid data for pressure mismatch check\n")
  }
} else {
  cat("⚠ No runtime pressure columns found. Tried:", paste(pressure_runtime_cols, collapse = ", "), "\n")
}

cat("\n")

# --- 3. CANDIDATE TRIGGER RECONSTRUCTION ---
cat("3. CANDIDATE TRIGGER RECONSTRUCTION (Hand/Adaptive/Pressure=1)\n")
cat("================================================================\n\n")

df_hand_adapt_p1 <- df_clean %>%
  filter(
    modality == "hand" | tolower(modality) == "hand",
    ui_mode == "adaptive" | tolower(ui_mode) == "adaptive",
    pressure == 1 | pressure == "1",
    !is.na(rt_ms),
    rt_ms > 0
  ) %>%
  arrange(pid, trial_number) %>%
  mutate(
    correct_bool = (correct == TRUE | correct == "true" | correct == 1 | !is.na(correct)),
    error = !correct_bool
  )

if (nrow(df_hand_adapt_p1) == 0) {
  cat("⚠ No trials found for Hand/Adaptive/Pressure=1\n")
} else {
  # For each participant, compute triggers
  trigger_summary <- df_hand_adapt_p1 %>%
    group_by(pid) %>%
    arrange(trial_number) %>%
    mutate(
      # Compute rt_p75 from successful trials only
      rt_p75 = quantile(rt_ms[correct_bool], 0.75, na.rm = TRUE),
      
      # Mark triggered if rt_ms > rt_p75 OR error
      is_slow = rt_ms > rt_p75,
      is_error = error,
      triggered = is_slow | is_error,
      
      # Rolling consecutive error counter (error burst >= 2)
      error_streak = sequence(rle(error)$lengths) * error,
      error_burst = error_streak >= 2,
      
      # Combined trigger (slow OR error burst)
      triggered_combined = is_slow | error_burst,
      
      # Rolling consecutive triggered counter
      triggered_streak = sequence(rle(triggered_combined)$lengths) * triggered_combined,
      max_consecutive_triggered = max(triggered_streak, na.rm = TRUE)
    ) %>%
    ungroup() %>%
    group_by(pid) %>%
    summarise(
      n_trials = n(),
      n_successful = sum(correct_bool, na.rm = TRUE),
      rt_p75 = first(rt_p75),
      n_triggered_slow = sum(is_slow, na.rm = TRUE),
      n_triggered_error_burst = sum(error_burst, na.rm = TRUE),
      n_triggered_combined = sum(triggered_combined, na.rm = TRUE),
      max_consecutive_triggered = first(max_consecutive_triggered),
      ever_triggered = any(triggered_combined, na.rm = TRUE),
      .groups = "drop"
    )
  
  # Summary statistics
  n_participants <- nrow(trigger_summary)
  n_ever_triggered <- sum(trigger_summary$ever_triggered, na.rm = TRUE)
  n_streak_ge5 <- sum(trigger_summary$max_consecutive_triggered >= 5, na.rm = TRUE)
  
  cat(sprintf("Participants with >=1 triggered trial: %d / %d (%.1f%%)\n", 
              n_ever_triggered, n_participants, 100 * n_ever_triggered / n_participants))
  cat(sprintf("Participants with max streak >= 5 (hysteresis_trials): %d / %d (%.1f%%)\n", 
              n_streak_ge5, n_participants, 100 * n_streak_ge5 / n_participants))
  
  # Distribution of max streak
  streak_dist <- trigger_summary %>%
    summarise(
      min = min(max_consecutive_triggered, na.rm = TRUE),
      median = median(max_consecutive_triggered, na.rm = TRUE),
      mean = mean(max_consecutive_triggered, na.rm = TRUE),
      max = max(max_consecutive_triggered, na.rm = TRUE),
      q75 = quantile(max_consecutive_triggered, 0.75, na.rm = TRUE),
      q90 = quantile(max_consecutive_triggered, 0.90, na.rm = TRUE)
    )
  
  cat("\nDistribution of max consecutive triggered trials:\n")
  print(kable(streak_dist, digits = 2))
  
  # Participant-level detail (top 10 by max streak)
  cat("\nTop 10 participants by max consecutive triggered trials:\n")
  print(kable(trigger_summary %>% 
              arrange(desc(max_consecutive_triggered)) %>% 
              head(10) %>%
              select(pid, n_trials, rt_p75, n_triggered_slow, n_triggered_error_burst, 
                     n_triggered_combined, max_consecutive_triggered),
              digits = 1))
}

cat("\n")

# --- 4. POLICY ACTION LOGS ---
cat("4. POLICY ACTION LOGS\n")
cat("=====================\n\n")

policy_cols <- c("policy_action", "policy_reason", "policy_change_event", 
                 "adaptation_state", "adaptation_action")
policy_found <- FALSE

for (col in policy_cols) {
  if (col %in% names(df_clean)) {
    policy_found <- TRUE
    cat(sprintf("Found policy column: %s\n", col))
    
    df_hand <- df_clean %>%
      filter(modality == "hand" | tolower(modality) == "hand")
    
    if (nrow(df_hand) > 0 && !all(is.na(df_hand[[col]]))) {
      action_summary <- df_hand %>%
        group_by(.data[[col]]) %>%
        summarise(n = n(), .groups = "drop") %>%
        arrange(desc(n))
      
      cat("\nPolicy actions in hand mode:\n")
      print(kable(action_summary))
      
      n_inflate <- sum(grepl("inflate|width", df_hand[[col]], ignore.case = TRUE), na.rm = TRUE)
      cat(sprintf("\nTrials with 'inflate' or 'width' in %s: %d\n", col, n_inflate))
    }
    cat("\n")
  }
}

if (!policy_found) {
  cat("⚠ No policy action columns found. Tried:", paste(policy_cols, collapse = ", "), "\n")
}

cat("\n")

# --- 5. WRITE SUMMARY CSV ---
cat("5. WRITING SUMMARY CSV\n")
cat("======================\n\n")

# Create outputs directory if needed
if (!dir.exists("outputs")) {
  dir.create("outputs", recursive = TRUE)
}

summary_stats <- list(
  total_trials = nrow(df_clean),
  n_participants = n_distinct(df_clean$pid),
  n_scaled_overall = if("width_scale_factor" %in% names(df_clean)) sum(df_clean$width_scale_factor != 1, na.rm = TRUE) else NA,
  pct_scaled_overall = if("width_scale_factor" %in% names(df_clean)) 100 * mean(df_clean$width_scale_factor != 1, na.rm = TRUE) else NA,
  n_hand_adapt_p1_trials = if(exists("df_hand_adapt_p1")) nrow(df_hand_adapt_p1) else 0,
  n_scaled_hand_adapt_p1 = if(exists("df_hand_adapt_p1") && "width_scale_factor" %in% names(df_hand_adapt_p1)) 
                            sum(df_hand_adapt_p1$width_scale_factor != 1, na.rm = TRUE) else NA,
  pct_scaled_hand_adapt_p1 = if(exists("df_hand_adapt_p1") && "width_scale_factor" %in% names(df_hand_adapt_p1))
                             100 * mean(df_hand_adapt_p1$width_scale_factor != 1, na.rm = TRUE) else NA,
  n_ever_triggered = if(exists("trigger_summary")) sum(trigger_summary$ever_triggered, na.rm = TRUE) else NA,
  n_streak_ge5 = if(exists("trigger_summary")) sum(trigger_summary$max_consecutive_triggered >= 5, na.rm = TRUE) else NA,
  pct_streak_ge5 = if(exists("trigger_summary")) 100 * mean(trigger_summary$max_consecutive_triggered >= 5, na.rm = TRUE) else NA,
  median_max_streak = if(exists("trigger_summary")) median(trigger_summary$max_consecutive_triggered, na.rm = TRUE) else NA,
  mean_max_streak = if(exists("trigger_summary")) mean(trigger_summary$max_consecutive_triggered, na.rm = TRUE) else NA,
  max_max_streak = if(exists("trigger_summary")) max(trigger_summary$max_consecutive_triggered, na.rm = TRUE) else NA,
  pressure_mismatch_pct = if(exists("overall_mismatch_pct")) overall_mismatch_pct else NA
)

summary_df <- data.frame(
  metric = names(summary_stats),
  value = unlist(summary_stats)
)

output_path <- "outputs/width_inflation_diagnostics_summary.csv"
write_csv(summary_df, output_path)
cat(sprintf("Summary written to: %s\n", output_path))

cat("\n=== DIAGNOSTIC COMPLETE ===\n")