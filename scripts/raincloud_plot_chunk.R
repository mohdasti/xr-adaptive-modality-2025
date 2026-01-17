# ============================================================================
# RAINCLOUD PLOT CODE CHUNK
# Based on Allen et al. (2019) "Raincloud plots: a multi-platform tool for 
# robust data visualization"
# ============================================================================

# Required libraries
library(ggplot2)
library(dplyr)
library(tidyr)

# Check for ggdist (recommended for proper half-violins)
has_ggdist <- requireNamespace("ggdist", quietly = TRUE)
if (!has_ggdist) {
  cat("Note: Install 'ggdist' for better raincloud plots: install.packages('ggdist')\n")
  cat("Using fallback violin plots for now.\n")
}

# ============================================================================
# OPTION 1: Simple helper function (for basic use)
# ============================================================================
create_raincloud <- function(data, x_var, y_var, fill_var, group_var = NULL, 
                             violin_side = "r", violin_width = 0.4, 
                             box_width = 0.15, point_size = 2.5, 
                             line_alpha = 0.3, point_alpha = 0.7) {
  
  p <- ggplot(data, aes_string(x = x_var, y = y_var, fill = fill_var))
  
  if (has_ggdist) {
    # Use ggdist for proper half-violins
    p <- p + 
      ggdist::stat_halfeye(
        aes(fill = .data[[fill_var]]),
        side = violin_side,
        alpha = 0.4,
        width = violin_width,
        .width = 0,
        justification = ifelse(violin_side == "r", -0.3, 1.3),
        point_colour = NA
      )
  } else {
    # Fallback: half-violin using geom_violin
    p <- p +
      geom_violin(
        alpha = 0.4,
        trim = FALSE,
        scale = "width",
        width = violin_width,
        position = position_nudge(x = ifelse(violin_side == "r", 0.25, -0.25)),
        color = NA
      )
  }
  
  # Boxplot
  p <- p +
    geom_boxplot(
      width = box_width,
      alpha = 0.6,
      outlier.shape = NA,
      position = position_nudge(x = -0.15),
      color = "grey30",
      linewidth = 0.5
    )
  
  # Connecting lines (if group_var provided, for paired data)
  if (!is.null(group_var)) {
    p <- p +
      geom_line(
        aes_string(group = group_var, color = fill_var),
        alpha = line_alpha,
        linewidth = 0.6,
        position = position_nudge(x = -0.25)
      )
  }
  
  # Individual points
  p <- p +
    geom_point(
      aes_string(color = fill_var),
      alpha = point_alpha,
      size = point_size,
      position = position_nudge(x = -0.25)
    )
  
  # Mean marker (white diamond)
  p <- p +
    stat_summary(
      fun = mean,
      geom = "point",
      shape = 23,
      size = 4,
      fill = "white",
      color = "black",
      stroke = 1.2,
      position = position_nudge(x = -0.25)
    )
  
  return(p)
}

# ============================================================================
# OPTION 2: Complete example with mirrored half-violins (as used in Report.qmd)
# This is the full implementation with mirrored violins (left/right)
# ============================================================================

# Example data preparation (replace with your data)
# df_plot <- your_data %>%
#   filter(!is.na(your_y_variable))

# Example: Create raincloud plot with mirrored half-violins
# Replace variable names with your actual column names
create_mirrored_raincloud <- function(data, x_var, y_var, fill_var, 
                                      group_var = NULL, facet_formula = NULL) {
  
  p <- ggplot(data, aes_string(x = x_var, y = y_var, fill = fill_var, color = fill_var)) +
    # Mirrored half-violins: first level extends LEFT, second level extends RIGHT
    {
      if (has_ggdist) {
        # Get unique values of fill_var to determine which goes left/right
        fill_levels <- unique(data[[fill_var]])
        list(
          # First level: half-violin extending LEFT
          ggdist::stat_halfeye(
            data = data %>% filter(.data[[fill_var]] == fill_levels[1]),
            aes(fill = .data[[fill_var]]),
            side = "left",
            alpha = 0.4,
            width = 0.35,
            .width = 0,
            justification = 1.3,
            point_colour = NA
          ),
          # Second level: half-violin extending RIGHT
          ggdist::stat_halfeye(
            data = data %>% filter(.data[[fill_var]] == fill_levels[2]),
            aes(fill = .data[[fill_var]]),
            side = "right",
            alpha = 0.4,
            width = 0.35,
            .width = 0,
            justification = -0.3,
            point_colour = NA
          )
        )
      } else {
        # Fallback: full violins
        geom_violin(
          alpha = 0.4,
          trim = FALSE,
          scale = "width",
          width = 0.35,
          position = position_dodge(width = 0),
          color = NA
        )
      }
    } +
    # Boxplots inside violins
    geom_boxplot(
      width = 0.15,
      alpha = 0.9,
      outlier.shape = NA,
      position = position_dodge(width = 0),
      fill = "grey90",
      color = "grey70",
      linewidth = 0.7,
      show.legend = FALSE
    ) +
    # Individual points
    geom_point(
      alpha = 0.5,
      size = 1.5,
      position = position_dodge(width = 0),
      show.legend = FALSE
    )
  
  # Connecting lines (if group_var provided, for paired data)
  if (!is.null(group_var)) {
    p <- p +
      geom_line(
        aes_string(group = group_var),
        alpha = 0.3,
        linewidth = 0.4,
        color = "grey60",
        position = position_dodge(width = 0),
        show.legend = FALSE
      )
  }
  
  # Thick black line connecting mean values between conditions
  p <- p + {
    mean_data <- data %>%
      group_by(.data[[x_var]], .data[[fill_var]]) %>%
      summarise(mean_value = mean(.data[[y_var]], na.rm = TRUE), .groups = "drop") %>%
      pivot_wider(names_from = all_of(fill_var), values_from = "mean_value", 
                  names_prefix = "mean_")
    
    # Get the two levels
    fill_levels <- unique(data[[fill_var]])
    col1 <- paste0("mean_", fill_levels[1])
    col2 <- paste0("mean_", fill_levels[2])
    
    if (col1 %in% names(mean_data) && col2 %in% names(mean_data)) {
      mean_data <- mean_data %>%
        filter(!is.na(.data[[col1]]), !is.na(.data[[col2]]))
      
      if (nrow(mean_data) > 0) {
        geom_segment(
          data = mean_data,
          aes(x = 1, xend = 2, y = .data[[col1]], yend = .data[[col2]]),
          inherit.aes = FALSE,
          color = "black",
          linewidth = 0.9,
          alpha = 0.9
        )
      } else {
        NULL
      }
    } else {
      NULL
    }
  }
  
  # Add facets if specified
  if (!is.null(facet_formula)) {
    p <- p + facet_grid(facet_formula, drop = TRUE)
  }
  
  # Theme
  p <- p +
    theme_minimal(base_size = 13) +
    theme(
      legend.position = "top",
      strip.text = element_text(face = "bold", size = 12),
      strip.background = element_rect(fill = "grey90", color = "grey70", linewidth = 0.5),
      panel.grid.minor = element_blank(),
      panel.border = element_rect(color = "grey85", fill = NA, linewidth = 0.4)
    )
  
  return(p)
}

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

# Example 1: Simple raincloud plot
# p <- create_raincloud(
#   data = your_data,
#   x_var = "condition",
#   y_var = "score",
#   fill_var = "condition",
#   group_var = "participant_id"  # Optional: for connecting lines
# )
# print(p)

# Example 2: Mirrored raincloud plot (like in your Report.qmd)
# p <- create_mirrored_raincloud(
#   data = df_plot,
#   x_var = "ui_mode",
#   y_var = "tp_mean",
#   fill_var = "ui_mode",
#   group_var = "pid",  # Optional: for connecting lines
#   facet_formula = modality ~ pressure  # Optional: for faceting
# ) +
#   scale_fill_manual(values = c("static" = "#E64B35", "adaptive" = "#4DBBD5")) +
#   scale_color_manual(values = c("static" = "#E64B35", "adaptive" = "#4DBBD5")) +
#   scale_x_discrete(labels = c("Static", "Adaptive")) +
#   labs(x = "UI Mode", y = "Throughput (bits/s)", fill = "UI Mode")
# print(p)

