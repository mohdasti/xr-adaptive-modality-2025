suppressPackageStartupMessages({
  library(tidyverse)
})

# Compute ISO 9241-9 effective metrics and throughput
compute_effective_metrics <- function(trials) {
  stopifnot(all(trials$zoom_level_pct == 100))
  stopifnot(all(trials$fullscreen_mode))

  # Filter valid trials
  trials <- trials %>%
    filter(movement_time_ms >= 150, movement_time_ms <= 5000)

  # Per-participant×condition×A×W aggregation for We/IDe/TP
  effective <- trials %>%
    group_by(participant_id, modality, ui_mode, target_amplitude_px, target_width_px) %>%
    summarise(
      SDx = sd(suppressWarnings(as.numeric(endpoint_error_px))),  # radial axis proxy
      We = 4.133 * SDx,
      A = mean(target_amplitude_px),
      IDe = log2(A / We + 1),
      MT_s = mean(movement_time_ms) / 1000,
      TP = IDe / MT_s,
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
