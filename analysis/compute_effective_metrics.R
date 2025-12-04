suppressPackageStartupMessages({
  library(tidyverse)
})

# Compute ISO 9241-9 effective metrics and throughput
# ISO 9241-9 requires projection of selection coordinates onto the task axis
compute_effective_metrics <- function(trials) {
  stopifnot(all(trials$zoom_level_pct == 100))
  stopifnot(all(trials$fullscreen_mode))

  # Filter valid trials with required coordinate data
  trials <- trials %>%
    filter(
      movement_time_ms >= 150, 
      movement_time_ms <= 6000,
      !is.na(endpoint_x), !is.na(endpoint_y),
      !is.na(target_center_x), !is.na(target_center_y)
    )

  # Estimate start position (canvas center)
  # NOTE: For full ISO 9241-9 accuracy, start_x and start_y should be logged in CSV
  # For now, we estimate start as canvas center
  # TODO: Add start_x, start_y columns to CSV logging for accurate calculation
  if ("start_x" %in% names(trials) && "start_y" %in% names(trials)) {
    # Use logged start positions if available
    trials <- trials %>% mutate(
      start_x = start_x,
      start_y = start_y
    )
  } else if ("viewport_w" %in% names(trials) && "viewport_h" %in% names(trials)) {
    # Estimate from viewport dimensions
    trials <- trials %>% mutate(
      start_x = viewport_w / 2,
      start_y = viewport_h / 2
    )
  } else {
    # Default: assume 800x600 canvas (center = 400, 300)
    trials <- trials %>% mutate(
      start_x = 400,
      start_y = 300
    )
  }
  
  # Calculate projected distance onto task axis (ISO 9241-9 compliant)
  # Task axis: vector from start position to target center
  # Project endpoint onto this axis to get directional error
  trials_with_projection <- trials %>%
    mutate(
      # Calculate task axis vector (from start to target)
      task_axis_dx = target_center_x - start_x,
      task_axis_dy = target_center_y - start_y,
      task_axis_length = sqrt(task_axis_dx^2 + task_axis_dy^2),
      # Normalize task axis vector
      task_axis_nx = ifelse(task_axis_length > 0, task_axis_dx / task_axis_length, 0),
      task_axis_ny = ifelse(task_axis_length > 0, task_axis_dy / task_axis_length, 0),
      # Vector from target center to endpoint
      error_dx = endpoint_x - target_center_x,
      error_dy = endpoint_y - target_center_y,
      # Project error vector onto task axis (dot product)
      projected_distance = error_dx * task_axis_nx + error_dy * task_axis_ny
    ) %>%
    # Filter out invalid projections
    filter(is.finite(projected_distance), task_axis_length > 0)

  # Per-participant×condition×A×W aggregation for We/IDe/TP
  # ISO 9241-9: We = 4.133 * SD(projected_distance)
  effective <- trials_with_projection %>%
    group_by(participant_id, modality, ui_mode, target_amplitude_px, target_width_px) %>%
    summarise(
      SDx = sd(projected_distance, na.rm = TRUE),  # Standard deviation of projected distance
      We = 4.133 * SDx,  # ISO 9241-9 effective width
      A = mean(target_amplitude_px),
      IDe = log2(A / We + 1),  # Effective Index of Difficulty
      MT_s = mean(movement_time_ms, na.rm = TRUE) / 1000,
      TP = IDe / MT_s,  # Throughput in bits/s
      n = n(),
      .groups = "drop"
    ) %>%
    filter(is.finite(We), We > 0, is.finite(IDe), IDe > 0, n >= 3)

  # Mean-of-means throughput per participant×condition (ISO guidance)
  tp_cond <- effective %>%
    group_by(participant_id, modality, ui_mode) %>%
    summarise(throughput_bits_s = mean(TP), .groups = "drop")

  list(per_condition = effective, tp_condition = tp_cond)
}
