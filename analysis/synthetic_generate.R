# analysis/synthetic_generate.R
suppressPackageStartupMessages({library(tidyverse)})

set.seed(123)
syn <- expand.grid(
  participant_id = sprintf("P%02d", 1:3),
  modality = c("hand", "gaze_confirm"),
  ui_mode = c("static", "adaptive"),
  block_number = 1:4,
  trial_number = 1:10
) %>% mutate(
  target_amplitude_px = 200L,
  target_width_px = 50L,
  zoom_level_pct = 100L,
  fullscreen_mode = TRUE,
  device_pixel_ratio = 1.0,
  pointer_type = "mouse",
  framerate_hz = 60,
  window_w_px = 1440L,
  window_h_px = 900L,
  user_agent = "demo",
  display_stability_score = 1.0,
  endpoint_error_px = abs(rnorm(n(), mean = 0, sd = ifelse(modality == "hand", 12, 18))),
  movement_time_ms = rnorm(n(),
    mean = ifelse(modality == "hand", 700, 950) + ifelse(ui_mode == "adaptive", -50, 0),
    sd = 120),
  error = endpoint_error_px > (target_width_px / 2),
  timeout_flag = FALSE,
  adaptation_triggered = (ui_mode == "adaptive") & runif(n()) < 0.2,
  adaptation_type = ifelse(ui_mode == "adaptive", ifelse(modality == "hand", "width_inflate", "declutter"), NA),
  target_center_x = 640, target_center_y = 360, endpoint_x = 645, endpoint_y = 362,
  # Add pressure (vary by block: 1.0 = baseline, 1.5 = high pressure)
  pressure = ifelse(block_number <= 2, 1.0, 1.5),
  # Compute ID using Shannon formulation: ID = log2(A/W + 1)
  ID = log2(target_amplitude_px / target_width_px + 1)
)

dir.create("data/clean", recursive = TRUE, showWarnings = FALSE)
write_csv(syn, "data/clean/trial_data.csv")

cat("✓ Synthetic trial data generated: data/clean/trial_data.csv\n")

