#!/usr/bin/env Rscript
# Export Portfolio Plots and Heatmaps for Case Study
# Creates compact, web-ready figures

library(tidyverse)
library(ggplot2)
library(lme4)
library(lmerTest)
library(emmeans)

# Set contrasts
options(contrasts = c("contr.sum", "contr.poly"))

# Color palette
if (requireNamespace("ggsci", quietly = TRUE)) {
  library(ggsci)
  npg_pal <- pal_npg("nrc")(10)
} else {
  npg_pal <- c("#E64B35", "#4DBBD5", "#00A087", "#3C5488", "#F39B7F", "#8491B4", "#91D1C2", "#DC0000", "#7E6148", "#B09C85")
}
custom_palette_2 <- npg_pal[1:2]

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

# Column name normalization
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

# Create df_all_trials
df_all_trials <- df_raw %>%
  filter(trial_qc_ok) %>%
  mutate(
    rt_s = rt_ms / 1000,
    modality = factor(modality, levels = c("hand", "gaze")),
    ui_mode = factor(ui_mode, levels = c("static", "adaptive")),
    pressure = factor(pressure),
    pid = factor(pid),
    is_correct = !is.na(correct) & (correct == TRUE | correct == "true" | correct == 1)
  )

# Filter valid trials
df <- df_all_trials %>%
  filter(
    is_correct == TRUE,
    rt_ms >= 150,
    rt_ms <= 6000
  )

# Calculate ISO metrics
df_factorial <- df %>%
  group_by(pid) %>%
  filter(n_distinct(pressure, na.rm = TRUE) == 2) %>%
  ungroup()

df_iso <- df_factorial %>%
  group_by(pid, modality, ui_mode, pressure, A, W) %>%
  filter(n() >= 3) %>%
  summarise(
    We = sd(projected_error_px, na.rm = TRUE) * 4.133,
    MT_avg = mean(rt_s, na.rm = TRUE),
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

# Create portfolio directory
portfolio_dir <- "docs/assets/case_study/portfolio"
dir.create(portfolio_dir, recursive = TRUE, showWarnings = FALSE)

# --- PORTFOLIO PLOT: Results Dashboard (dot + CI) ---
cat("Generating Results Dashboard...\n")

# Compute means and CIs by modality
df_portfolio <- bind_rows(
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
      .groups = "drop"
    ),
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
      .groups = "drop"
    ),
  # TLX (if available)
  if (all(c("tlx_mental", "tlx_physical", "tlx_temporal", "tlx_performance", "tlx_effort", "tlx_frustration") %in% names(df_raw))) {
    df_raw %>%
      filter(!is.na(pid), trial_qc_ok) %>%
      group_by(pid, modality) %>%
      summarise(overall_tlx = mean(c_across(starts_with("tlx_")), na.rm = TRUE), .groups = "drop") %>%
      group_by(modality) %>%
      summarise(
        metric = "NASA-TLX (0-100)",
        mean_val = mean(overall_tlx, na.rm = TRUE),
        se = sd(overall_tlx, na.rm = TRUE) / sqrt(n()),
        ci_lower = mean_val - 1.96 * se,
        ci_upper = mean_val + 1.96 * se,
        .groups = "drop"
      )
  } else {
    NULL
  }
) %>%
  mutate(
    modality = str_to_title(modality),
    metric = factor(metric, levels = c("Throughput (bits/s)", "Error Rate (%)", "Movement Time (s)", "NASA-TLX (0-100)"))
  )

p_portfolio <- ggplot(df_portfolio, aes(x = mean_val, y = metric, color = modality)) +
  geom_point(size = 3, position = position_dodge(width = 0.5)) +
  geom_errorbarh(aes(xmin = ci_lower, xmax = ci_upper), height = 0.3, linewidth = 0.8, position = position_dodge(width = 0.5)) +
  scale_color_manual(values = c("Hand" = custom_palette_2[1], "Gaze" = custom_palette_2[2])) +
  labs(
    x = "Value",
    y = "",
    color = "Modality",
    title = "Results Dashboard"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    legend.position = "top",
    panel.grid.minor = element_blank(),
    panel.grid.major.y = element_blank(),
    axis.text.y = element_text(size = 11),
    plot.title = element_text(size = 14, face = "bold")
  )

ggsave(file.path(portfolio_dir, "results_dashboard.png"), p_portfolio, width = 7, height = 4.5, dpi = 200)
cat("  ✓ Saved results_dashboard.png\n")

# --- HEATMAP 1: Spatial Error Rate ---
cat("Generating Spatial Error Rate Heatmap...\n")
if ("target_x" %in% names(df_raw) && "target_y" %in% names(df_raw)) {
  # Bin spatial coordinates
  df_spatial <- df_raw %>%
    filter(trial_qc_ok, !is.na(target_x), !is.na(target_y)) %>%
    mutate(
      is_correct = !is.na(correct) & (correct == TRUE | correct == "true" | correct == 1),
      x_bin = cut(target_x, breaks = 10, labels = FALSE),
      y_bin = cut(target_y, breaks = 10, labels = FALSE),
      is_error = !is_correct
    ) %>%
    group_by(modality, x_bin, y_bin) %>%
    summarise(
      error_rate = mean(is_error, na.rm = TRUE) * 100,
      n_trials = n(),
      .groups = "drop"
    ) %>%
    filter(n_trials >= 5)  # Minimum trials per bin
  
  if (nrow(df_spatial) > 0) {
    p_spatial <- ggplot(df_spatial, aes(x = x_bin, y = y_bin, fill = error_rate)) +
      geom_tile(alpha = 0.9) +
      scale_fill_viridis_c(name = "Error\nRate (%)", option = "plasma", direction = 1) +
      facet_wrap(~modality, labeller = labeller(modality = c("hand" = "Hand", "gaze" = "Gaze"))) +
      labs(
        x = "Screen X Position (binned)",
        y = "Screen Y Position (binned)",
        title = "Spatial Error Rate Heatmap"
      ) +
      theme_minimal(base_size = 11) +
      theme(
        legend.position = "right",
        strip.text = element_text(face = "bold"),
        panel.grid = element_blank()
      )
    
    ggsave(file.path(portfolio_dir, "heatmap_spatial_errors.png"), p_spatial, width = 7, height = 4, dpi = 200)
    cat("  ✓ Saved heatmap_spatial_errors.png\n")
  } else {
    cat("  ⚠ Insufficient spatial data\n")
  }
} else {
  cat("  ⚠ Spatial coordinates not available\n")
}

# --- HEATMAP 2: Endpoint Density (Gaze) ---
cat("Generating Endpoint Density Heatmap...\n")
df_endpoint <- df_raw %>%
  filter(
    trial_qc_ok,
    modality == "gaze",
    !is.na(endpoint_x), !is.na(endpoint_y),
    !is.na(target_center_x), !is.na(target_center_y)
  ) %>%
  mutate(
    err_x = endpoint_x - target_center_x,
    err_y = endpoint_y - target_center_y
  ) %>%
  filter(
    abs(err_x) <= 100,
    abs(err_y) <= 100
  )

if (nrow(df_endpoint) > 0) {
  p_endpoint <- ggplot(df_endpoint, aes(x = err_x, y = err_y)) +
    stat_density_2d(aes(fill = after_stat(density)), geom = "raster", contour = FALSE, bins = 30) +
    geom_vline(xintercept = 0, color = "white", linetype = "dashed", linewidth = 0.5, alpha = 0.7) +
    geom_hline(yintercept = 0, color = "white", linetype = "dashed", linewidth = 0.5, alpha = 0.7) +
    facet_wrap(~ui_mode, labeller = labeller(ui_mode = c("static" = "Static", "adaptive" = "Adaptive"))) +
    scale_fill_viridis_c(name = "Density", option = "plasma") +
    coord_fixed(ratio = 1) +
    labs(
      x = "Error X (px)",
      y = "Error Y (px)",
      title = "Endpoint Density Heatmap: Gaze Modality",
      subtitle = "Shows where selection endpoints cluster relative to target center (0,0)"
    ) +
    theme_minimal(base_size = 11) +
    theme(
      legend.position = "right",
      strip.text = element_text(face = "bold"),
      panel.grid = element_blank()
    )
  
  ggsave(file.path(portfolio_dir, "heatmap_endpoint_density.png"), p_endpoint, width = 7.5, height = 4, dpi = 200)
  cat("  ✓ Saved heatmap_endpoint_density.png\n")
} else {
  cat("  ⚠ Insufficient endpoint data\n")
}

# --- RE-EXPORT EXISTING PLOTS WITH BETTER DIMENSIONS ---
cat("\nRe-exporting existing plots with optimized dimensions...\n")
base_dir <- "docs/assets/case_study"

# Error Rate
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
  geom_errorbar(aes(ymin = ci_lower, ymax = ci_upper), width = 0.2, linewidth = 0.6) +
  scale_fill_manual(values = c("hand" = custom_palette_2[1], "gaze" = custom_palette_2[2])) +
  scale_x_discrete(labels = c("hand" = "Hand", "gaze" = "Gaze")) +
  labs(x = "Input Modality", y = "Error Rate (%)", title = "Error Rate by Modality") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none", plot.title = element_text(size = 13))

ggsave(file.path(base_dir, "error_rate.png"), p_err, width = 6.5, height = 4, dpi = 200)

# Throughput
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
  geom_errorbar(aes(ymin = ci_lower, ymax = ci_upper), width = 0.2, linewidth = 0.6) +
  scale_fill_manual(values = c("hand" = custom_palette_2[1], "gaze" = custom_palette_2[2])) +
  scale_x_discrete(labels = c("hand" = "Hand", "gaze" = "Gaze")) +
  labs(x = "Input Modality", y = "Throughput (bits/s)", title = "Throughput by Modality") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none", plot.title = element_text(size = 13))

ggsave(file.path(base_dir, "throughput.png"), p_tp, width = 6.5, height = 4, dpi = 200)

# Movement Time
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
  geom_errorbar(aes(ymin = ci_lower, ymax = ci_upper), width = 0.2, linewidth = 0.6) +
  scale_fill_manual(values = c("hand" = custom_palette_2[1], "gaze" = custom_palette_2[2])) +
  scale_x_discrete(labels = c("hand" = "Hand", "gaze" = "Gaze")) +
  labs(x = "Input Modality", y = "Movement Time (s)", title = "Movement Time by Modality") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none", plot.title = element_text(size = 13))

ggsave(file.path(base_dir, "movement_time.png"), p_rt, width = 6.5, height = 4, dpi = 200)

cat("  ✓ Re-exported existing plots\n")
cat("\n=== PORTFOLIO EXPORT COMPLETE ===\n")