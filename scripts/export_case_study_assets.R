#!/usr/bin/env Rscript
# Export Case Study Assets
# Reuses data loading and QC from Report.qmd, exports publication-ready figures and tables

library(tidyverse)
library(ggplot2)
library(lme4)
library(lmerTest)
library(emmeans)

# Set sum-to-zero contrasts (matching Report.qmd)
options(contrasts = c("contr.sum", "contr.poly"))

# Color palette (matching Report.qmd)
if (requireNamespace("ggsci", quietly = TRUE)) {
  library(ggsci)
  npg_pal <- pal_npg("nrc")(10)
} else {
  # Fallback: use RColorBrewer or manual colors
  npg_pal <- c("#E64B35", "#4DBBD5", "#00A087", "#3C5488", "#F39B7F", "#8491B4", "#91D1C2", "#DC0000", "#7E6148", "#B09C85")
}
custom_palette_2 <- npg_pal[1:2]
custom_palette_multi <- npg_pal[1:6]

# --- DATA LOADING (reuse from Report.qmd) ---
data_paths <- c(
  "data/clean/trial_data.csv",
  "../data/clean/trial_data.csv"
)

df_raw <- NULL
for (path in data_paths) {
  if (file.exists(path)) {
    tryCatch({
      df_raw <- read_csv(path, show_col_types = FALSE)
      cat("Loaded data from:", path, "\n")
      break
    }, error = function(e) {})
  }
}

if (is.null(df_raw)) {
  stop("Could not find trial_data.csv")
}

# Column name normalization
if ("participant_id" %in% names(df_raw) && !"pid" %in% names(df_raw)) {
  df_raw <- df_raw %>% rename(pid = participant_id)
}
if ("movement_time_ms" %in% names(df_raw) && !"rt_ms" %in% names(df_raw)) {
  df_raw <- df_raw %>% rename(rt_ms = movement_time_ms)
}

# QC filter
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

# Create df_all_trials (for error rate)
df_all_trials <- df_raw %>%
  filter(trial_qc_ok) %>%
  mutate(
    rt_s = rt_ms / 1000,
    log_rt = log(rt_ms),
    modality = factor(modality, levels = c("hand", "gaze")),
    ui_mode = factor(ui_mode, levels = c("static", "adaptive")),
    pressure = factor(pressure),
    pid = factor(pid),
    is_correct = !is.na(correct) & (correct == "true" | correct == TRUE | correct == 1)
  )

# Filter valid trials (correct, valid RTs)
df <- df_all_trials %>%
  filter(
    is_correct == TRUE,
    rt_ms >= 150,
    rt_ms <= 6000
  )

# Input device exclusion (matching Report.qmd)
if ("input_device" %in% names(df)) {
  df <- df %>%
    filter(
      input_device == "mouse" |
      (input_device == "trackpad" & modality == "gaze")
    )
  df_all_trials <- df_all_trials %>%
    filter(
      input_device == "mouse" |
      (input_device == "trackpad" & modality == "gaze")
    )
}

# Calculate ISO metrics (Throughput)
df_iso <- df %>%
  group_by(pid, modality, ui_mode, pressure, A, W) %>%
  filter(n() >= 3) %>%
  summarise(
    We = sd(endpoint_error_px, na.rm = TRUE) * 2.066,
    MT_avg = mean(rt_ms, na.rm = TRUE) / 1000,
    IDe = log2((mean(A, na.rm = TRUE) / We) + 1),
    TP = IDe / MT_avg,
    .groups = "drop"
  ) %>%
  filter(
    !is.na(TP),
    is.finite(TP),
    TP > 0,
    TP < 20
  )

# Participant-level summaries
df_pid_cond <- df %>%
  group_by(pid, modality, ui_mode, pressure) %>%
  summarise(
    rt_mean = mean(rt_s, na.rm = TRUE),
    trials_rt = n(),
    .groups = "drop"
  ) %>%
  left_join(
    df_all_trials %>%
      group_by(pid, modality, ui_mode, pressure) %>%
      summarise(
        error_rate = mean(!is_correct, na.rm = TRUE),
        trials_all = n(),
        .groups = "drop"
      ),
    by = c("pid", "modality", "ui_mode", "pressure")
  ) %>%
  left_join(
    df_iso %>%
      group_by(pid, modality, ui_mode, pressure) %>%
      summarise(tp_mean = mean(TP, na.rm = TRUE), .groups = "drop"),
    by = c("pid", "modality", "ui_mode", "pressure")
  )

# --- CREATE OUTPUT DIRECTORY ---
output_dir <- "docs/assets/case_study"
dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)
cat("Output directory:", output_dir, "\n\n")

# --- FIGURE A: Error Rate (Hand vs Gaze with 95% CI) ---
cat("Generating Figure A: Error Rate...\n")
df_err_summary <- df_pid_cond %>%
  filter(!is.na(error_rate)) %>%
  group_by(modality) %>%
  summarise(
    mean_err = mean(error_rate, na.rm = TRUE) * 100,
    se = sd(error_rate, na.rm = TRUE) / sqrt(n()) * 100,
    ci_lower = mean_err - 1.96 * se,
    ci_upper = mean_err + 1.96 * se,
    n = n(),
    .groups = "drop"
  )

p_err <- ggplot(df_err_summary, aes(x = modality, y = mean_err, fill = modality)) +
  geom_bar(stat = "identity", alpha = 0.8, width = 0.6) +
  geom_errorbar(aes(ymin = ci_lower, ymax = ci_upper), width = 0.2, linewidth = 0.8) +
  scale_fill_manual(values = c("hand" = custom_palette_2[1], "gaze" = custom_palette_2[2])) +
  scale_x_discrete(labels = c("hand" = "Hand", "gaze" = "Gaze")) +
  labs(
    x = "Input Modality",
    y = "Error Rate (%)",
    title = "Error Rate by Modality"
  ) +
  theme_minimal(base_size = 14) +
  theme(legend.position = "none")

ggsave(file.path(output_dir, "error_rate.png"), p_err, width = 6, height = 5, dpi = 300)
cat("  ✓ Saved error_rate.png\n")

# --- FIGURE B: Throughput (TP) Hand vs Gaze with 95% CI ---
cat("Generating Figure B: Throughput...\n")
df_tp_summary <- df_pid_cond %>%
  filter(!is.na(tp_mean)) %>%
  group_by(modality) %>%
  summarise(
    mean_tp = mean(tp_mean, na.rm = TRUE),
    se = sd(tp_mean, na.rm = TRUE) / sqrt(n()),
    ci_lower = mean_tp - 1.96 * se,
    ci_upper = mean_tp + 1.96 * se,
    n = n(),
    .groups = "drop"
  )

p_tp <- ggplot(df_tp_summary, aes(x = modality, y = mean_tp, fill = modality)) +
  geom_bar(stat = "identity", alpha = 0.8, width = 0.6) +
  geom_errorbar(aes(ymin = ci_lower, ymax = ci_upper), width = 0.2, linewidth = 0.8) +
  scale_fill_manual(values = c("hand" = custom_palette_2[1], "gaze" = custom_palette_2[2])) +
  scale_x_discrete(labels = c("hand" = "Hand", "gaze" = "Gaze")) +
  labs(
    x = "Input Modality",
    y = "Throughput (bits/s)",
    title = "Throughput by Modality"
  ) +
  theme_minimal(base_size = 14) +
  theme(legend.position = "none")

ggsave(file.path(output_dir, "throughput.png"), p_tp, width = 6, height = 5, dpi = 300)
cat("  ✓ Saved throughput.png\n")

# --- FIGURE C: RT (log-RT or ms) Hand vs Gaze with 95% CI ---
cat("Generating Figure C: Movement Time...\n")
df_rt_summary <- df_pid_cond %>%
  filter(!is.na(rt_mean)) %>%
  group_by(modality) %>%
  summarise(
    mean_rt = mean(rt_mean, na.rm = TRUE),
    se = sd(rt_mean, na.rm = TRUE) / sqrt(n()),
    ci_lower = mean_rt - 1.96 * se,
    ci_upper = mean_rt + 1.96 * se,
    n = n(),
    .groups = "drop"
  )

p_rt <- ggplot(df_rt_summary, aes(x = modality, y = mean_rt, fill = modality)) +
  geom_bar(stat = "identity", alpha = 0.8, width = 0.6) +
  geom_errorbar(aes(ymin = ci_lower, ymax = ci_upper), width = 0.2, linewidth = 0.8) +
  scale_fill_manual(values = c("hand" = custom_palette_2[1], "gaze" = custom_palette_2[2])) +
  scale_x_discrete(labels = c("hand" = "Hand", "gaze" = "Gaze")) +
  labs(
    x = "Input Modality",
    y = "Movement Time (s)",
    title = "Movement Time by Modality"
  ) +
  theme_minimal(base_size = 14) +
  theme(legend.position = "none")

ggsave(file.path(output_dir, "movement_time.png"), p_rt, width = 6, height = 5, dpi = 300)
cat("  ✓ Saved movement_time.png\n")

# --- FIGURE D: Error Type Composition (slips vs misses/timeouts) ---
cat("Generating Figure D: Error Type Composition...\n")
if ("err_type" %in% names(df_all_trials)) {
  df_err_type <- df_all_trials %>%
    filter(!is_correct, !is.na(err_type), trial_qc_ok) %>%
    mutate(
      err_category = case_when(
        grepl("slip|missclick|click", err_type, ignore.case = TRUE) ~ "Slips",
        grepl("timeout|timed", err_type, ignore.case = TRUE) ~ "Timeouts",
        TRUE ~ "Other"
      )
    ) %>%
    group_by(modality, err_category) %>%
    summarise(n = n(), .groups = "drop") %>%
    group_by(modality) %>%
    mutate(
      pct = 100 * n / sum(n),
      err_category = factor(err_category, levels = c("Slips", "Timeouts", "Other"))
    )
  
  p_err_type <- ggplot(df_err_type, aes(x = modality, y = pct, fill = err_category)) +
    geom_bar(stat = "identity", position = "stack", alpha = 0.8) +
    scale_fill_manual(values = c("Slips" = custom_palette_multi[1], 
                                  "Timeouts" = custom_palette_multi[2],
                                  "Other" = custom_palette_multi[3])) +
    scale_x_discrete(labels = c("hand" = "Hand", "gaze" = "Gaze")) +
    labs(
      x = "Input Modality",
      y = "Percentage of Errors (%)",
      fill = "Error Type",
      title = "Error Type Composition"
    ) +
    theme_minimal(base_size = 14) +
    theme(legend.position = "right")
  
  ggsave(file.path(output_dir, "error_type_composition.png"), p_err_type, width = 7, height = 5, dpi = 300)
  cat("  ✓ Saved error_type_composition.png\n")
} else {
  cat("  ⚠ err_type column not found, skipping error type composition\n")
}

# --- FIGURE E: NASA-TLX (Hand vs Gaze, stacked if available) ---
cat("Generating Figure E: NASA-TLX...\n")
tlx_cols <- c("tlx_mental", "tlx_physical", "tlx_temporal", "tlx_performance", "tlx_effort", "tlx_frustration")
if (all(tlx_cols %in% names(df_raw))) {
  df_tlx <- df_raw %>%
    filter(!is.na(pid), trial_qc_ok) %>%
    select(pid, modality, ui_mode, all_of(tlx_cols)) %>%
    pivot_longer(cols = all_of(tlx_cols), names_to = "Scale", values_to = "Score") %>%
    filter(!is.na(Score)) %>%
    mutate(
      Scale = str_replace(Scale, "tlx_", ""),
      Scale = str_to_title(Scale),
      modality = factor(modality, levels = c("hand", "gaze"))
    )
  
  # Overall TLX by modality
  df_tlx_overall <- df_tlx %>%
    group_by(pid, modality) %>%
    summarise(overall_tlx = mean(Score, na.rm = TRUE), .groups = "drop") %>%
    group_by(modality) %>%
    summarise(
      mean_tlx = mean(overall_tlx, na.rm = TRUE),
      se = sd(overall_tlx, na.rm = TRUE) / sqrt(n()),
      ci_lower = mean_tlx - 1.96 * se,
      ci_upper = mean_tlx + 1.96 * se,
      n = n(),
      .groups = "drop"
    )
  
  p_tlx <- ggplot(df_tlx_overall, aes(x = modality, y = mean_tlx, fill = modality)) +
    geom_bar(stat = "identity", alpha = 0.8, width = 0.6) +
    geom_errorbar(aes(ymin = ci_lower, ymax = ci_upper), width = 0.2, linewidth = 0.8) +
    scale_fill_manual(values = c("hand" = custom_palette_2[1], "gaze" = custom_palette_2[2])) +
    scale_x_discrete(labels = c("hand" = "Hand", "gaze" = "Gaze")) +
    labs(
      x = "Input Modality",
      y = "Overall TLX Score (0-100)",
      title = "NASA-TLX Workload by Modality"
    ) +
    theme_minimal(base_size = 14) +
    theme(legend.position = "none")
  
  ggsave(file.path(output_dir, "tlx_overall.png"), p_tlx, width = 6, height = 5, dpi = 300)
  cat("  ✓ Saved tlx_overall.png\n")
  
  # Stacked TLX components
  df_tlx_stacked <- df_tlx %>%
    group_by(modality, Scale) %>%
    summarise(Mean_Score = mean(Score, na.rm = TRUE), .groups = "drop") %>%
    mutate(
      Modality = str_to_title(modality),
      Scale = factor(Scale, levels = c("Mental", "Physical", "Temporal", "Performance", "Effort", "Frustration"))
    )
  
  p_tlx_stacked <- ggplot(df_tlx_stacked, aes(x = Modality, y = Mean_Score, fill = Scale)) +
    geom_bar(stat = "identity", position = "stack", alpha = 0.8) +
    scale_fill_manual(values = custom_palette_multi) +
    labs(
      x = "Input Modality",
      y = "TLX Score (0-100)",
      fill = "TLX Scale",
      title = "NASA-TLX Components by Modality"
    ) +
    theme_minimal(base_size = 14) +
    theme(legend.position = "right")
  
  ggsave(file.path(output_dir, "tlx_stacked.png"), p_tlx_stacked, width = 7, height = 5, dpi = 300)
  cat("  ✓ Saved tlx_stacked.png\n")
} else {
  cat("  ⚠ TLX columns not found, skipping TLX plots\n")
}

# --- FIGURE F: Fitts Validation (MT vs IDe with R²) ---
cat("Generating Figure F: Fitts Validation...\n")
if (nrow(df_iso) > 0 && "IDe" %in% names(df_iso) && "MT_avg" %in% names(df_iso)) {
  fitts_fits <- df_iso %>%
    group_by(modality) %>%
    do(model = lm(MT_avg ~ IDe, data = .)) %>%
    mutate(
      r_squared = summary(model)$r.squared,
      intercept = coef(model)[1],
      slope = coef(model)[2]
    )
  
  p_fitts <- ggplot(df_iso, aes(x = IDe, y = MT_avg, color = modality)) +
    geom_point(alpha = 0.3, size = 1) +
    geom_smooth(method = "lm", se = TRUE, linewidth = 1.2) +
    facet_wrap(~modality, labeller = labeller(modality = c("hand" = "Hand", "gaze" = "Gaze"))) +
    scale_color_manual(values = c("hand" = custom_palette_2[1], "gaze" = custom_palette_2[2])) +
    labs(
      x = "Effective Index of Difficulty (IDe, bits)",
      y = "Movement Time (s)",
      title = "Fitts' Law Validation",
      subtitle = paste0("Hand: R² = ", sprintf("%.3f", fitts_fits$r_squared[fitts_fits$modality == "hand"]),
                       ", Gaze: R² = ", sprintf("%.3f", fitts_fits$r_squared[fitts_fits$modality == "gaze"]))
    ) +
    theme_minimal(base_size = 14) +
    theme(legend.position = "none")
  
  ggsave(file.path(output_dir, "fitts_validation.png"), p_fitts, width = 10, height = 5, dpi = 300)
  cat("  ✓ Saved fitts_validation.png\n")
} else {
  cat("  ⚠ Fitts data not available, skipping Fitts validation plot\n")
}

# --- TABLE T1: Results-at-a-glance ---
cat("Generating Table T1: Results-at-a-glance...\n")
results_glance <- bind_rows(
  # Error Rate
  df_pid_cond %>%
    filter(!is.na(error_rate)) %>%
    group_by(modality) %>%
    summarise(
      metric = "Error Rate (%)",
      mean_val = mean(error_rate, na.rm = TRUE) * 100,
      se = sd(error_rate, na.rm = TRUE) / sqrt(n()) * 100,
      ci_lower = mean_val - 1.96 * se,
      ci_upper = mean_val + 1.96 * se,
      n = n(),
      .groups = "drop"
    ),
  # Throughput
  df_pid_cond %>%
    filter(!is.na(tp_mean)) %>%
    group_by(modality) %>%
    summarise(
      metric = "Throughput (bits/s)",
      mean_val = mean(tp_mean, na.rm = TRUE),
      se = sd(tp_mean, na.rm = TRUE) / sqrt(n()),
      ci_lower = mean_val - 1.96 * se,
      ci_upper = mean_val + 1.96 * se,
      n = n(),
      .groups = "drop"
    ),
  # Movement Time
  df_pid_cond %>%
    filter(!is.na(rt_mean)) %>%
    group_by(modality) %>%
    summarise(
      metric = "Movement Time (s)",
      mean_val = mean(rt_mean, na.rm = TRUE),
      se = sd(rt_mean, na.rm = TRUE) / sqrt(n()),
      ci_lower = mean_val - 1.96 * se,
      ci_upper = mean_val + 1.96 * se,
      n = n(),
      .groups = "drop"
    ),
  # TLX (if available)
  if (all(tlx_cols %in% names(df_raw))) {
    df_raw %>%
      filter(!is.na(pid), trial_qc_ok) %>%
      group_by(pid, modality) %>%
      summarise(overall_tlx = mean(c_across(all_of(tlx_cols)), na.rm = TRUE), .groups = "drop") %>%
      group_by(modality) %>%
      summarise(
        metric = "NASA-TLX (0-100)",
        mean_val = mean(overall_tlx, na.rm = TRUE),
        se = sd(overall_tlx, na.rm = TRUE) / sqrt(n()),
        ci_lower = mean_val - 1.96 * se,
        ci_upper = mean_val + 1.96 * se,
        n = n(),
        .groups = "drop"
      )
  } else {
    NULL
  }
) %>%
  mutate(
    modality = str_to_title(modality),
    mean_ci = sprintf("%.2f [%.2f, %.2f]", mean_val, ci_lower, ci_upper)
  ) %>%
  select(metric, modality, mean_ci, n) %>%
  pivot_wider(names_from = modality, values_from = c(mean_ci, n), names_sep = "_") %>%
  mutate(
    Hand_N = n_Hand,
    Gaze_N = n_Gaze
  ) %>%
  select(metric, Hand = mean_ci_Hand, Hand_N, Gaze = mean_ci_Gaze, Gaze_N)

write_csv(results_glance, file.path(output_dir, "results_at_a_glance.csv"))
cat("  ✓ Saved results_at_a_glance.csv\n")

# --- TABLE T2: QC/Exclusions Summary ---
cat("Generating Table T2: QC/Exclusions Summary...\n")
qc_summary <- tibble(
  Rule = c(
    "Practice trials",
    "Zoom != 100%",
    "Not fullscreen",
    "Tab hidden > 500ms",
    "Focus/blur events",
    "RT < 150ms",
    "RT > 6000ms",
    "Incorrect trials (for performance metrics)",
    "Trackpad users (hand modality only)"
  ),
  Trials_Removed = c(
    sum(df_raw$practice == TRUE | df_raw$practice == "true", na.rm = TRUE),
    sum(!is.na(df_raw$zoom_pct) & df_raw$zoom_pct != 100, na.rm = TRUE),
    sum(!is.na(df_raw$is_fullscreen) & df_raw$is_fullscreen == FALSE, na.rm = TRUE),
    sum(!is.na(df_raw$tab_hidden_ms) & df_raw$tab_hidden_ms >= 500, na.rm = TRUE),
    sum(!is.na(df_raw$focus_blur_count) & df_raw$focus_blur_count > 0, na.rm = TRUE),
    sum(df_raw$rt_ms < 150, na.rm = TRUE),
    sum(df_raw$rt_ms > 6000, na.rm = TRUE),
    sum(!is.na(df_raw$correct) & (df_raw$correct == FALSE | df_raw$correct == "false" | df_raw$correct == 0), na.rm = TRUE),
    if ("input_device" %in% names(df_raw)) {
      df_raw %>%
        filter(input_device == "trackpad", modality == "hand") %>%
        nrow()
    } else {
      0
    }
  )
) %>%
  mutate(
    Pct_Removed = round(100 * Trials_Removed / nrow(df_raw), 2)
  )

write_csv(qc_summary, file.path(output_dir, "qc_exclusions_summary.csv"))
cat("  ✓ Saved qc_exclusions_summary.csv\n")

# --- PRINT WEBSITE-READY NUMBERS ---
cat("\n=== WEBSITE-READY NUMBERS ===\n\n")

# N hand, N gaze
n_hand <- df_pid_cond %>% filter(modality == "hand") %>% pull(pid) %>% n_distinct()
n_gaze <- df_pid_cond %>% filter(modality == "gaze") %>% pull(pid) %>% n_distinct()
cat("N hand:", n_hand, "\n")
cat("N gaze:", n_gaze, "\n\n")

# Overall error rate per modality, delta
err_hand <- df_pid_cond %>% filter(modality == "hand", !is.na(error_rate)) %>% pull(error_rate) %>% mean(na.rm = TRUE) * 100
err_gaze <- df_pid_cond %>% filter(modality == "gaze", !is.na(error_rate)) %>% pull(error_rate) %>% mean(na.rm = TRUE) * 100
err_delta <- err_gaze - err_hand
cat("Error Rate: Hand =", sprintf("%.1f%%", err_hand), ", Gaze =", sprintf("%.1f%%", err_gaze), 
    ", Delta =", sprintf("%.1f%%", err_delta), "\n\n")

# Overall TP per modality, delta, CI
tp_hand <- df_pid_cond %>% filter(modality == "hand", !is.na(tp_mean)) %>% pull(tp_mean) %>% mean(na.rm = TRUE)
tp_gaze <- df_pid_cond %>% filter(modality == "gaze", !is.na(tp_mean)) %>% pull(tp_mean) %>% mean(na.rm = TRUE)
tp_delta <- tp_hand - tp_gaze
tp_hand_se <- df_pid_cond %>% filter(modality == "hand", !is.na(tp_mean)) %>% pull(tp_mean) %>% sd(na.rm = TRUE) / sqrt(n_hand)
tp_hand_ci_lower <- tp_hand - 1.96 * tp_hand_se
tp_hand_ci_upper <- tp_hand + 1.96 * tp_hand_se
cat("Throughput: Hand =", sprintf("%.2f", tp_hand), "[", sprintf("%.2f", tp_hand_ci_lower), ",", sprintf("%.2f", tp_hand_ci_upper), "]",
    "bits/s, Gaze =", sprintf("%.2f", tp_gaze), "bits/s, Delta =", sprintf("%.2f", tp_delta), "bits/s\n\n")

# Overall TLX per modality, delta
if (all(tlx_cols %in% names(df_raw))) {
  tlx_hand <- df_raw %>%
    filter(!is.na(pid), trial_qc_ok, modality == "hand") %>%
    group_by(pid) %>%
    summarise(overall_tlx = mean(c_across(all_of(tlx_cols)), na.rm = TRUE), .groups = "drop") %>%
    pull(overall_tlx) %>%
    mean(na.rm = TRUE)
  tlx_gaze <- df_raw %>%
    filter(!is.na(pid), trial_qc_ok, modality == "gaze") %>%
    group_by(pid) %>%
    summarise(overall_tlx = mean(c_across(all_of(tlx_cols)), na.rm = TRUE), .groups = "drop") %>%
    pull(overall_tlx) %>%
    mean(na.rm = TRUE)
  tlx_delta <- tlx_gaze - tlx_hand
  cat("NASA-TLX: Hand =", sprintf("%.1f", tlx_hand), ", Gaze =", sprintf("%.1f", tlx_gaze),
      ", Delta =", sprintf("%.1f", tlx_delta), "\n\n")
}

# Adaptive vs static deltas for gaze only
cat("Gaze-only Adaptive vs Static:\n")
gaze_adapt_tp <- df_pid_cond %>%
  filter(modality == "gaze", ui_mode == "adaptive", !is.na(tp_mean)) %>%
  pull(tp_mean) %>%
  mean(na.rm = TRUE)
gaze_static_tp <- df_pid_cond %>%
  filter(modality == "gaze", ui_mode == "static", !is.na(tp_mean)) %>%
  pull(tp_mean) %>%
  mean(na.rm = TRUE)
cat("  TP: Adaptive =", sprintf("%.2f", gaze_adapt_tp), ", Static =", sprintf("%.2f", gaze_static_tp),
    ", Delta =", sprintf("%.2f", gaze_adapt_tp - gaze_static_tp), "bits/s\n")

gaze_adapt_err <- df_pid_cond %>%
  filter(modality == "gaze", ui_mode == "adaptive", !is.na(error_rate)) %>%
  pull(error_rate) %>%
  mean(na.rm = TRUE) * 100
gaze_static_err <- df_pid_cond %>%
  filter(modality == "gaze", ui_mode == "static", !is.na(error_rate)) %>%
  pull(error_rate) %>%
  mean(na.rm = TRUE) * 100
cat("  Error Rate: Adaptive =", sprintf("%.1f%%", gaze_adapt_err), ", Static =", sprintf("%.1f%%", gaze_static_err),
    ", Delta =", sprintf("%.1f%%", gaze_adapt_err - gaze_static_err), "\n\n")

# Width inflation check
if ("width_scale_factor" %in% names(df_raw)) {
  n_scaled <- df_raw %>%
    filter(trial_qc_ok, !is.na(width_scale_factor)) %>%
    filter(width_scale_factor != 1) %>%
    nrow()
  cat("Width inflation applied (width_scale_factor != 1.0):", n_scaled, "trials\n")
  if (n_scaled == 0) {
    cat("  ✓ Confirmed: width_scale_factor always 1.0 (no inflation applied)\n")
  }
} else {
  cat("Width inflation check: width_scale_factor column not found\n")
}

cat("\n=== EXPORT COMPLETE ===\n")
cat("All assets saved to:", output_dir, "\n")