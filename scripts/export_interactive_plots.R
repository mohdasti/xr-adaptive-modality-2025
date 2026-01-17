#!/usr/bin/env Rscript
# Export Interactive Plots for Case Study
# Uses Highcharter (Highcharts.js wrapper) for interactive visualizations
# Alternative: plotly R package is also still available and maintained

library(tidyverse)
library(highcharter)

# Set Highcharter options
options(highcharter.theme = hc_theme_smpl())

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

# Create output directory
output_dir <- "docs/assets/case_study/interactive"
dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)
cat("Output directory:", output_dir, "\n\n")

# Color palette
colors <- list(hand = "#E64B35", gaze = "#4DBBD5")

# --- INTERACTIVE PLOT 1: Results Dashboard ---
cat("Generating Interactive Results Dashboard...\n")

df_portfolio <- bind_rows(
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

# Create interactive dashboard
hc_dashboard <- highchart() %>%
  hc_chart(type = "scatter") %>%
  hc_xAxis(categories = unique(df_portfolio$metric), title = list(text = "")) %>%
  hc_yAxis(title = list(text = "Value")) %>%
  hc_plotOptions(
    scatter = list(
      marker = list(radius = 6),
      tooltip = list(
        pointFormat = "<b>{series.name}</b><br/>Mean: {point.y:.2f}<br/>95% CI: [{point.ci_lower:.2f}, {point.ci_upper:.2f}]"
      )
    ),
    errorbar = list(
      color = "black",
      stemWidth = 2,
      whiskerLength = 5
    )
  )

# Add series for each modality
for (mod in unique(df_portfolio$modality)) {
  mod_data <- df_portfolio %>% filter(modality == mod)
  
  hc_dashboard <- hc_dashboard %>%
    hc_add_series(
      name = mod,
      data = list_parse2(mod_data %>% select(x = metric, y = mean_val, ci_lower, ci_upper)),
      color = colors[[tolower(mod)]],
      marker = list(symbol = "circle", fillColor = colors[[tolower(mod)]])
    )
}

hc_dashboard <- hc_dashboard %>%
  hc_title(text = "Results Dashboard") %>%
  hc_legend(enabled = TRUE) %>%
  hc_tooltip(shared = FALSE)

# Save as HTML widget
htmlwidgets::saveWidget(hc_dashboard, file.path(output_dir, "results_dashboard.html"), selfcontained = TRUE)
cat("  ✓ Saved results_dashboard.html\n")

# --- INTERACTIVE PLOT 2: Throughput Comparison ---
cat("Generating Interactive Throughput Plot...\n")
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

hc_tp <- highchart() %>%
  hc_chart(type = "column") %>%
  hc_xAxis(categories = str_to_title(df_tp_summary$modality)) %>%
  hc_yAxis(title = list(text = "Throughput (bits/s)")) %>%
  hc_add_series(
    name = "Throughput",
    data = df_tp_summary$mean_tp,
    colorByPoint = TRUE,
    colors = c(colors$hand, colors$gaze)
  ) %>%
  hc_add_series(
    name = "95% CI Lower",
    data = df_tp_summary$ci_lower,
    type = "errorbar",
    linkedTo = ":previous",
    enableMouseTracking = FALSE
  ) %>%
  hc_add_series(
    name = "95% CI Upper",
    data = df_tp_summary$ci_upper,
    type = "errorbar",
    linkedTo = ":previous",
    enableMouseTracking = FALSE
  ) %>%
  hc_title(text = "Throughput by Modality") %>%
  hc_tooltip(
    pointFormat = "<b>{series.name}</b><br/>Mean: {point.y:.2f} bits/s<br/>95% CI: [{point.ci_lower:.2f}, {point.ci_upper:.2f}]"
  ) %>%
  hc_plotOptions(
    column = list(
      dataLabels = list(enabled = TRUE, format = "{y:.2f}")
    )
  )

htmlwidgets::saveWidget(hc_tp, file.path(output_dir, "throughput.html"), selfcontained = TRUE)
cat("  ✓ Saved throughput.html\n")

# --- INTERACTIVE PLOT 3: Error Rate Comparison ---
cat("Generating Interactive Error Rate Plot...\n")
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

hc_err <- highchart() %>%
  hc_chart(type = "column") %>%
  hc_xAxis(categories = str_to_title(df_err_summary$modality)) %>%
  hc_yAxis(title = list(text = "Error Rate (%)")) %>%
  hc_add_series(
    name = "Error Rate",
    data = df_err_summary$mean_err,
    colorByPoint = TRUE,
    colors = c(colors$hand, colors$gaze)
  ) %>%
  hc_add_series(
    name = "95% CI",
    data = list_parse2(df_err_summary %>% select(low = ci_lower, high = ci_upper)),
    type = "errorbar",
    linkedTo = ":previous"
  ) %>%
  hc_title(text = "Error Rate by Modality") %>%
  hc_tooltip(
    pointFormat = "<b>{series.name}</b><br/>Mean: {point.y:.2f}%<br/>95% CI: [{point.low:.2f}%, {point.high:.2f}%]"
  ) %>%
  hc_plotOptions(
    column = list(
      dataLabels = list(enabled = TRUE, format = "{y:.2f}%")
    )
  )

htmlwidgets::saveWidget(hc_err, file.path(output_dir, "error_rate.html"), selfcontained = TRUE)
cat("  ✓ Saved error_rate.html\n")

cat("\n=== INTERACTIVE PLOTS EXPORT COMPLETE ===\n")
cat("All interactive plots saved to:", output_dir, "\n")
cat("\nNote: These are HTML widgets that can be embedded in Quarto.\n")
cat("To use in case_study_web.qmd, use htmltools::includeHTML() or htmlwidgets::htmlwidgets()\n")