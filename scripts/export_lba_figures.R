#!/usr/bin/env Rscript
# Export LBA figures for manuscript
# 1. Forest plot: t0 (NDT) posterior by condition (95% HDI)
# 2. Empirical verification-phase RT by condition (bridge to model)
#
# t0 PARAMETERIZATION (from analysis/py/lba.py):
#   t0 = sigmoid(t0_raw) * min_rt  with t0_raw = t0_mu + participant_offset
#   t0_mu is the group-level latent parameter (reported in lba_parameters_summary.csv)
#   Higher t0_mu -> higher sigmoid -> higher t0 in seconds -> LONGER verification phase
#   Values are negative; rightward on the plot = longer non-decision time

library(tidyverse)
library(ggplot2)

# Plotting utils
if (file.exists("analysis/r/utils_plotting.R")) {
  source("analysis/r/utils_plotting.R")
} else if (file.exists("../analysis/r/utils_plotting.R")) {
  source("../analysis/r/utils_plotting.R")
} else {
  condition_levels <- c("Hand – Static", "Hand – Adaptive", "Gaze – Static", "Gaze – Adaptive")
  CONDITION_COLORS <- c(
    "Hand – Static" = "#E64B35", "Hand – Adaptive" = "#F39B7F",
    "Gaze – Static" = "#4DBBD5", "Gaze – Adaptive" = "#91D1C2"
  )
  scale_color_condition <- function(...) scale_color_manual(values = CONDITION_COLORS, ...)
  theme_manuscript <- function(base_size = 12) theme_classic(base_size = base_size)
}

# --- LBA FOREST PLOT (t0 posterior) ---
cat("Generating LBA forest plot (t0 posterior)...\n")
lba_path <- "outputs/LBA/lba_parameters_summary.csv"
if (!file.exists(lba_path)) lba_path <- "../outputs/LBA/lba_parameters_summary.csv"

if (file.exists(lba_path)) {
  lba <- read_csv(lba_path, show_col_types = FALSE)
  param_col <- names(lba)[1]
  if (param_col == "" || param_col == "X") param_col <- names(lba)[1]
  # t0_mu[0,0]=Hand-Static, [0,1]=Hand-Adaptive, [1,0]=Gaze-Static, [1,1]=Gaze-Adaptive
  # modality: 0=hand, 1=gaze; ui_mode: 0=static, 1=adaptive
  t0_rows <- lba %>% filter(grepl("^t0_mu", .data[[param_col]]))
  if (nrow(t0_rows) >= 4) {
    hdi_lo <- t0_rows[[grep("hdi_3", names(t0_rows))[1]]]
    hdi_hi <- t0_rows[[grep("hdi_97", names(t0_rows))[1]]]
    df_t0 <- tibble(
      condition = condition_levels,
      modality = c("Hand", "Hand", "Gaze", "Gaze"),
      estimate = as.numeric(t0_rows$mean),
      lower = as.numeric(hdi_lo),
      upper = as.numeric(hdi_hi)
    ) %>%
      mutate(
        condition = factor(condition, levels = condition_levels),
        modality = factor(modality, levels = c("Hand", "Gaze"))
      )
    
    # Horizontal forest plot: one row per condition, point = mean, line = 95% HDI
    # Order: Hand first (shorter NDT), then Gaze (longer NDT). Rightward = longer verification phase.
    p_lba <- ggplot(df_t0, aes(x = estimate, y = condition, color = condition)) +
      geom_pointrange(aes(xmin = lower, xmax = upper), size = 2, linewidth = 1.2) +
      scale_color_condition(guide = "none") +
      scale_x_continuous(
        breaks = seq(-4, 0, 0.5),
        expand = expansion(mult = c(0.02, 0.05))
      ) +
      labs(
        x = "Non-decision time (t0) — latent scale: rightward = longer verification phase",
        y = NULL
      ) +
      theme_manuscript() +
      theme(
        panel.grid.major.y = element_line(linewidth = 0.25, color = "grey88"),
        panel.grid.major.x = element_line(linewidth = 0.2, color = "grey92"),
        axis.text.y = element_text(size = rel(1.05)),
        axis.title.x = element_text(size = rel(0.95))
      )
    
    out_dir <- "docs/assets/case_study"
    dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)
    ggsave(file.path(out_dir, "lba_t0_forest.png"), p_lba, width = 7, height = 4, dpi = 300)
    cat("  ✓ Saved lba_t0_forest.png\n")
  } else {
    cat("  ⚠ t0 rows not found in LBA summary, skipping forest plot\n")
  }
} else {
  cat("  ⚠ LBA summary not found at", lba_path, "\n")
}

# --- EMPIRICAL VERIFICATION-PHASE RT (bridge figure) ---
cat("Generating empirical verification-phase RT figure...\n")
data_paths <- c("data/clean/trial_data.csv", "../data/clean/trial_data.csv")
df_raw <- NULL
for (path in data_paths) {
  if (file.exists(path)) {
    df_raw <- read_csv(path, show_col_types = FALSE)
    break
  }
}

if (!is.null(df_raw) && "verification_time_ms" %in% names(df_raw)) {
  if ("participant_id" %in% names(df_raw) && !"pid" %in% names(df_raw)) {
    df_raw <- df_raw %>% rename(pid = participant_id)
  }
  df_verify <- df_raw %>%
    filter(
      !is.na(verification_time_ms), verification_time_ms >= 50, verification_time_ms <= 5000,
      (practice == FALSE | practice == "false" | is.na(practice))
    ) %>%
    mutate(
      modality = factor(modality, levels = c("hand", "gaze")),
      ui_mode = factor(ui_mode, levels = c("static", "adaptive")),
      condition = paste0(str_to_title(modality), " – ", str_to_title(ui_mode))
    ) %>%
    group_by(pid, condition, modality, ui_mode) %>%
    summarise(rt_ms = mean(verification_time_ms, na.rm = TRUE), .groups = "drop") %>%
    group_by(condition, modality, ui_mode) %>%
    summarise(
      mean_rt = mean(rt_ms, na.rm = TRUE),
      se = sd(rt_ms, na.rm = TRUE) / sqrt(n()),
      ci_lower = mean_rt - 1.96 * se,
      ci_upper = mean_rt + 1.96 * se,
      n = n(),
      .groups = "drop"
    ) %>%
    mutate(condition = factor(condition, levels = condition_levels))
  
  if (nrow(df_verify) >= 4) {
    p_verify <- ggplot(df_verify, aes(x = mean_rt, y = condition, color = condition)) +
      geom_pointrange(aes(xmin = ci_lower, xmax = ci_upper), size = 1, linewidth = 1) +
      scale_color_condition(guide = "none") +
      labs(
        x = "Verification-Phase RT (ms)",
        y = NULL
      ) +
      theme_manuscript() +
      theme(panel.grid.major.y = element_line(linewidth = 0.2, color = "grey90"))
    
    out_dir <- "docs/assets/case_study"
    dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)
    ggsave(file.path(out_dir, "verification_rt_empirical.png"), p_verify, width = 6, height = 3.5, dpi = 300)
    cat("  ✓ Saved verification_rt_empirical.png\n")
  } else {
    cat("  ⚠ Insufficient verification data, skipping bridge figure\n")
  }
} else {
  cat("  ⚠ verification_time_ms not found or data missing, skipping bridge figure\n")
}

cat("LBA figure export complete.\n")
