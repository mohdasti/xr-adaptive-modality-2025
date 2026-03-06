# =============================================================================
# utils_plotting.R — Global ggplot2 style guide for XR manuscript figures
# =============================================================================
# Use consistently across all manuscript figures. Source this file in figure
# generation scripts.
#
# PREFERENCES:
# - Prefer point-range plots over bars when possible.
# - Use coord_flip() for forest plots and subscale comparisons if it improves
#   readability (horizontal point-ranges with rows = categories).
# - Use patchwork for multi-panel figure assembly.
# - Use tidy/long data rather than separate custom code paths per condition.
# - Explicit factor releveling; never alphabetical defaults.
# - Centralize theme/color here; do not duplicate in figure scripts.
# - Do not use stacked bars for NASA-TLX subscales.
# - Do not use trace plots as the only main-text LBA figure.
# =============================================================================

library(ggplot2)

# -----------------------------------------------------------------------------
# MODALITY COLOR MAPPING (consistent across all figures)
# -----------------------------------------------------------------------------
# Hand = warm/orange; Gaze = cool/blue
MODALITY_COLORS <- c(
  hand  = "#E64B35",  # NPG red
  gaze  = "#4DBBD5"   # NPG blue
)

# For condition-level plots (Hand-Static, Hand-Adaptive, etc.)
CONDITION_COLORS <- c(
  "Hand – Static"    = "#E64B35",
  "Hand – Adaptive"  = "#F39B7F",  # lighter hand
  "Gaze – Static"    = "#4DBBD5",
  "Gaze – Adaptive"  = "#91D1C2"   # lighter gaze
)

scale_fill_condition <- function(...) {
  scale_fill_manual(values = CONDITION_COLORS, ...)
}

scale_color_condition <- function(...) {
  scale_color_manual(values = CONDITION_COLORS, ...)
}

# -----------------------------------------------------------------------------
# BASE THEME
# -----------------------------------------------------------------------------
# base_size 12 recommended for figures embedded in manuscript PDF
theme_manuscript <- function(base_size = 12) {
  theme_classic(base_size = base_size) +
    theme(
      axis.title = element_text(face = "plain", size = rel(1)),
      axis.text = element_text(size = rel(0.9), color = "black"),
      legend.title = element_text(face = "plain", size = rel(0.95)),
      legend.text = element_text(size = rel(0.9)),
      legend.position = "right",
      panel.grid.major.y = element_line(linewidth = 0.2, color = "grey90"),
      panel.grid.minor = element_blank(),
      strip.background = element_rect(fill = "grey95", color = NA),
      strip.text = element_text(face = "plain", size = rel(1)),
      plot.margin = margin(5, 5, 5, 5)
    )
}

# -----------------------------------------------------------------------------
# SCALE: Modality fill/color
# -----------------------------------------------------------------------------
scale_fill_modality <- function(...) {
  scale_fill_manual(values = MODALITY_COLORS, ...)
}

scale_color_modality <- function(...) {
  scale_color_manual(values = MODALITY_COLORS, ...)
}

# -----------------------------------------------------------------------------
# FACTOR ORDERING
# -----------------------------------------------------------------------------
# Modality: Hand first (better performance)
modality_levels <- c("hand", "gaze")
modality_labels <- c(hand = "Hand", gaze = "Gaze")

# Condition order for LBA (Hand-Static, Hand-Adaptive, Gaze-Static, Gaze-Adaptive)
condition_levels <- c("Hand – Static", "Hand – Adaptive", "Gaze – Static", "Gaze – Adaptive")

# NASA-TLX subscale order (standard order)
tlx_subscale_levels <- c("Mental", "Physical", "Temporal", "Performance", "Effort", "Frustration")

# -----------------------------------------------------------------------------
# SAVE FUNCTION (publication quality)
# -----------------------------------------------------------------------------
save_figure <- function(plot, path, width = 6, height = 4, dpi = 300, use_pdf = FALSE) {
  dir.create(dirname(path), recursive = TRUE, showWarnings = FALSE)
  if (use_pdf) {
    ggsave(path, plot, width = width, height = height, device = "pdf")
  } else {
    ggsave(path, plot, width = width, height = height, dpi = dpi)
  }
}
