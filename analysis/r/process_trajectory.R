#!/usr/bin/env Rscript
# Process Trajectory Data for Control Theory Analysis
# 
# This script processes JSON trajectory data to compute:
# - Velocity profiles
# - Acceleration profiles  
# - Jerk (rate of change of acceleration)
# - Submovement detection (zero-crossings in acceleration)
# - Primary vs. corrective movement phases
# - Movement smoothness metrics (normalized jerk)

library(tidyverse)
library(jsonlite)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

#' Parse trajectory JSON string to data frame
#' @param traj_json JSON string or NULL
#' @return data frame with columns x, y, t, or NULL if invalid
parse_trajectory <- function(traj_json) {
  if (is.null(traj_json) || is.na(traj_json) || traj_json == "" || traj_json == "null" || traj_json == "[]") {
    return(NULL)
  }
  
  tryCatch({
    traj <- fromJSON(traj_json)
    if (is.null(traj) || length(traj) == 0 || nrow(traj) < 2) {
      return(NULL)
    }
    # Ensure columns exist and are numeric
    if (!all(c("x", "y", "t") %in% names(traj))) {
      return(NULL)
    }
    traj <- traj %>%
      mutate(
        x = as.numeric(x),
        y = as.numeric(y),
        t = as.numeric(t)
      ) %>%
      filter(!is.na(x), !is.na(y), !is.na(t)) %>%
      arrange(t)  # Ensure chronological order
    
    if (nrow(traj) < 2) return(NULL)
    return(traj)
  }, error = function(e) {
    return(NULL)
  })
}

#' Compute velocity from position data
#' @param traj data frame with x, y, t columns
#' @return data frame with added vx, vy, v (speed) columns
compute_velocity <- function(traj) {
  if (is.null(traj) || nrow(traj) < 2) return(NULL)
  
  # Compute differences
  dx <- diff(traj$x)
  dy <- diff(traj$y)
  dt <- diff(traj$t) / 1000  # Convert ms to seconds
  
  # Avoid division by zero
  dt[dt == 0] <- NA
  
  # Velocity components (px/s)
  vx <- dx / dt
  vy <- dy / dt
  
  # Speed (magnitude)
  v <- sqrt(vx^2 + vy^2)
  
  # Add to trajectory (first point has no velocity)
  traj$vx <- c(NA, vx)
  traj$vy <- c(NA, vy)
  traj$v <- c(NA, v)
  
  return(traj)
}

#' Compute acceleration from velocity data
#' @param traj data frame with vx, vy, v, t columns
#' @return data frame with added ax, ay, a (acceleration magnitude) columns
compute_acceleration <- function(traj) {
  if (is.null(traj) || nrow(traj) < 2) return(NULL)
  
  # Get velocity components (skip first NA)
  vx <- traj$vx[!is.na(traj$vx)]
  vy <- traj$vy[!is.na(traj$vy)]
  t <- traj$t[!is.na(traj$vx)]
  
  if (length(vx) < 2) return(traj)
  
  # Compute differences
  dvx <- diff(vx)
  dvy <- diff(vy)
  dt <- diff(t) / 1000  # Convert ms to seconds
  
  # Avoid division by zero
  dt[dt == 0] <- NA
  
  # Acceleration components (px/s²)
  ax <- dvx / dt
  ay <- dvy / dt
  
  # Acceleration magnitude
  a <- sqrt(ax^2 + ay^2)
  
  # Add to trajectory (first two points have no acceleration)
  traj$ax <- c(NA, NA, ax)
  traj$ay <- c(NA, NA, ay)
  traj$a <- c(NA, NA, a)
  
  return(traj)
}

#' Compute jerk (rate of change of acceleration)
#' @param traj data frame with ax, ay, a, t columns
#' @return data frame with added jx, jy, j (jerk magnitude) columns
compute_jerk <- function(traj) {
  if (is.null(traj) || nrow(traj) < 3) return(NULL)
  
  # Get acceleration components (skip first two NAs)
  ax <- traj$ax[!is.na(traj$ax)]
  ay <- traj$ay[!is.na(traj$ay)]
  t <- traj$t[!is.na(traj$ax)]
  
  if (length(ax) < 2) return(traj)
  
  # Compute differences
  dax <- diff(ax)
  day <- diff(ay)
  dt <- diff(t) / 1000  # Convert ms to seconds
  
  # Avoid division by zero
  dt[dt == 0] <- NA
  
  # Jerk components (px/s³)
  jx <- dax / dt
  jy <- day / dt
  
  # Jerk magnitude
  j <- sqrt(jx^2 + jy^2)
  
  # Add to trajectory (first three points have no jerk)
  traj$jx <- c(NA, NA, NA, jx)
  traj$jy <- c(NA, NA, NA, jy)
  traj$j <- c(NA, NA, NA, j)
  
  return(traj)
}

#' Detect velocity peaks (submovements)
#' @param traj data frame with v, t columns
#' @param min_peak_height Minimum velocity to consider a peak (px/s)
#' @param min_peak_distance Minimum time between peaks (ms)
#' @return vector of indices where peaks occur
detect_velocity_peaks <- function(traj, min_peak_height = 10, min_peak_distance = 50) {
  if (is.null(traj) || nrow(traj) < 3) return(integer(0))
  
  v <- traj$v[!is.na(traj$v)]
  t <- traj$t[!is.na(traj$v)]
  
  if (length(v) < 3) return(integer(0))
  
  # Find local maxima in velocity
  peaks <- integer(0)
  for (i in 2:(length(v) - 1)) {
    if (v[i] > v[i-1] && v[i] > v[i+1] && v[i] > min_peak_height) {
      # Check distance from previous peak
      if (length(peaks) == 0 || (t[i] - t[peaks[length(peaks)]]) >= min_peak_distance) {
        peaks <- c(peaks, i)
      }
    }
  }
  
  # Map back to original indices
  valid_indices <- which(!is.na(traj$v))
  if (length(peaks) > 0) {
    return(valid_indices[peaks])
  }
  return(integer(0))
}

#' Detect zero-crossings in acceleration (alternative submovement detection)
#' @param traj data frame with a, t columns
#' @return vector of indices where zero-crossings occur
detect_acceleration_zero_crossings <- function(traj) {
  if (is.null(traj) || nrow(traj) < 3) return(integer(0))
  
  a <- traj$a[!is.na(traj$a)]
  t <- traj$t[!is.na(traj$a)]
  
  if (length(a) < 2) return(integer(0))
  
  # Find sign changes (zero-crossings)
  signs <- sign(a)
  zero_crossings <- integer(0)
  
  for (i in 2:length(signs)) {
    if (signs[i] != signs[i-1] && signs[i] != 0 && signs[i-1] != 0) {
      zero_crossings <- c(zero_crossings, i)
    }
  }
  
  # Map back to original indices
  valid_indices <- which(!is.na(traj$a))
  if (length(zero_crossings) > 0) {
    return(valid_indices[zero_crossings])
  }
  return(integer(0))
}

#' Compute movement smoothness metrics
#' @param traj data frame with j, t columns
#' @param movement_time Total movement time (seconds)
#' @return list with jerk metrics
compute_smoothness_metrics <- function(traj, movement_time) {
  if (is.null(traj) || is.null(movement_time) || movement_time <= 0) {
    return(list(
      mean_jerk = NA_real_,
      max_jerk = NA_real_,
      normalized_jerk = NA_real_,
      jerk_variance = NA_real_
    ))
  }
  
  j <- traj$j[!is.na(traj$j)]
  
  if (length(j) == 0) {
    return(list(
      mean_jerk = NA_real_,
      max_jerk = NA_real_,
      normalized_jerk = NA_real_,
      jerk_variance = NA_real_
    ))
  }
  
  # Mean and max jerk
  mean_jerk <- mean(j, na.rm = TRUE)
  max_jerk <- max(j, na.rm = TRUE)
  jerk_variance <- var(j, na.rm = TRUE)
  
  # Normalized jerk (duration-normalized)
  # Formula: normalized_jerk = jerk * duration^2.5 / distance
  # For simplicity, we use: normalized_jerk = mean_jerk * movement_time^2.5
  # (Distance normalization would require path length, which we can add)
  normalized_jerk <- mean_jerk * (movement_time^2.5)
  
  return(list(
    mean_jerk = mean_jerk,
    max_jerk = max_jerk,
    normalized_jerk = normalized_jerk,
    jerk_variance = jerk_variance
  ))
}

#' Process a single trajectory and extract all metrics
#' @param traj_json JSON string of trajectory
#' @param movement_time_ms Movement time in milliseconds
#' @return list with all computed metrics
process_trajectory <- function(traj_json, movement_time_ms = NULL) {
  # Parse trajectory
  traj <- parse_trajectory(traj_json)
  
  if (is.null(traj)) {
    return(list(
      n_points = 0,
      peak_velocity = NA_real_,
      time_to_peak_velocity = NA_real_,
      mean_velocity = NA_real_,
      submovement_count_velocity_peaks = 0,
      submovement_count_zero_crossings = 0,
      mean_jerk = NA_real_,
      max_jerk = NA_real_,
      normalized_jerk = NA_real_,
      jerk_variance = NA_real_
    ))
  }
  
  # Compute kinematic profiles
  traj <- compute_velocity(traj)
  traj <- compute_acceleration(traj)
  traj <- compute_jerk(traj)
  
  # Extract metrics
  n_points <- nrow(traj)
  
  # Velocity metrics
  v <- traj$v[!is.na(traj$v)]
  if (length(v) > 0) {
    peak_velocity <- max(v, na.rm = TRUE)
    peak_idx <- which.max(v)
    time_to_peak_velocity <- traj$t[peak_idx] - traj$t[1]  # ms
    mean_velocity <- mean(v, na.rm = TRUE)
  } else {
    peak_velocity <- NA_real_
    time_to_peak_velocity <- NA_real_
    mean_velocity <- NA_real_
  }
  
  # Submovement detection
  velocity_peaks <- detect_velocity_peaks(traj)
  submovement_count_velocity_peaks <- max(0, length(velocity_peaks) - 1)  # Subtract 1 for primary movement
  
  zero_crossings <- detect_acceleration_zero_crossings(traj)
  submovement_count_zero_crossings <- max(0, length(zero_crossings))
  
  # Smoothness metrics
  movement_time_s <- if (!is.null(movement_time_ms)) movement_time_ms / 1000 else NA_real_
  smoothness <- compute_smoothness_metrics(traj, movement_time_s)
  
  return(list(
    n_points = n_points,
    peak_velocity = peak_velocity,
    time_to_peak_velocity = time_to_peak_velocity,
    mean_velocity = mean_velocity,
    submovement_count_velocity_peaks = submovement_count_velocity_peaks,
    submovement_count_zero_crossings = submovement_count_zero_crossings,
    mean_jerk = smoothness$mean_jerk,
    max_jerk = smoothness$max_jerk,
    normalized_jerk = smoothness$normalized_jerk,
    jerk_variance = smoothness$jerk_variance
  ))
}

# ============================================================================
# MAIN PROCESSING FUNCTION
# ============================================================================

#' Process trajectory data from a data frame
#' @param data data frame with trajectory and movement_time_ms columns
#' @return data frame with added kinematic metrics
process_trajectory_data <- function(data) {
  if (!"trajectory" %in% names(data)) {
    warning("No 'trajectory' column found in data")
    return(data)
  }
  
  cat("Processing trajectory data...\n")
  cat("Total rows:", nrow(data), "\n")
  
  # Process each trajectory
  results <- data %>%
    rowwise() %>%
    mutate(
      traj_metrics = list(process_trajectory(
        trajectory,
        if ("rt_ms" %in% names(.)) rt_ms else if ("movement_time_ms" %in% names(.)) movement_time_ms else NULL
      ))
    ) %>%
    ungroup()
  
  # Extract metrics from list column
  results <- results %>%
    mutate(
      traj_n_points = map_dbl(traj_metrics, ~ .x$n_points),
      traj_peak_velocity = map_dbl(traj_metrics, ~ .x$peak_velocity),
      traj_time_to_peak_velocity = map_dbl(traj_metrics, ~ .x$time_to_peak_velocity),
      traj_mean_velocity = map_dbl(traj_metrics, ~ .x$mean_velocity),
      traj_submovement_count_peaks = map_dbl(traj_metrics, ~ .x$submovement_count_velocity_peaks),
      traj_submovement_count_zero_crossings = map_dbl(traj_metrics, ~ .x$submovement_count_zero_crossings),
      traj_mean_jerk = map_dbl(traj_metrics, ~ .x$mean_jerk),
      traj_max_jerk = map_dbl(traj_metrics, ~ .x$max_jerk),
      traj_normalized_jerk = map_dbl(traj_metrics, ~ .x$normalized_jerk),
      traj_jerk_variance = map_dbl(traj_metrics, ~ .x$jerk_variance)
    ) %>%
    select(-traj_metrics)
  
  cat("Processing complete.\n")
  cat("Valid trajectories:", sum(results$traj_n_points > 0, na.rm = TRUE), "\n")
  
  return(results)
}

# ============================================================================
# IF RUN AS SCRIPT
# ============================================================================

if (!interactive()) {
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 2) {
    cat("Usage: Rscript process_trajectory.R <input.csv> <output.csv>\n")
    cat("  input.csv: CSV file with 'trajectory' column (JSON strings)\n")
    cat("  output.csv: Output CSV with added kinematic metrics\n")
    quit(status = 1)
  }
  
  input_file <- args[1]
  output_file <- args[2]
  
  cat("Reading:", input_file, "\n")
  data <- read_csv(input_file, show_col_types = FALSE)
  
  data_processed <- process_trajectory_data(data)
  
  cat("Writing:", output_file, "\n")
  write_csv(data_processed, output_file)
  
  cat("Done!\n")
}

