##
## Fitts's Law Throughput (TP) Analysis
## 
## This script:
## - Computes throughput (TP) per ID and condition
## - Fits LME/M on TP: TP ~ Modality * UI_Mode * Pressure + (1|pid)
## - Generates plots: TP vs ID, TP by condition
## - Saves results to /analysis/figures/
##
## Usage:
##   Rscript fitts_tp.R --input data/clean/ --output analysis/figures/
##   Rscript fitts_tp.R -i data/clean/*.csv -o analysis/figures/ --verbose
##

library(optparse)
library(lme4)
library(lmerTest)
library(ggplot2)
library(dplyr)
library(tidyr)

# Command-line arguments
option_list <- list(
  make_option(c("-i", "--input"), type="character", default="data/clean/",
              help="Input CSV file or directory (default: data/clean/)"),
  make_option(c("-o", "--output"), type="character", default="analysis/figures/",
              help="Output directory for plots (default: analysis/figures/)"),
  make_option(c("-v", "--verbose"), action="store_true", default=FALSE,
              help="Print verbose output")
)

opt_parser <- OptionParser(option_list=option_list)
opt <- parse_args(opt_parser)

# Ensure output directory exists
dir.create(opt$output, showWarnings=FALSE, recursive=TRUE)

cat("Fitts's Law Throughput Analysis\n")
cat("Loading data from:", opt$input, "\n")

# Load CSV files
if (dir.exists(opt$input)) {
  files <- list.files(opt$input, pattern="*.csv", full.names=TRUE)
} else {
  files <- opt$input
}

if (length(files) == 0) {
  stop("No CSV files found in input path")
}

cat("Loading", length(files), "file(s)...\n")
data_list <- lapply(files, read.csv)
data <- bind_rows(data_list)

# Data preprocessing
data <- data %>%
  filter(!is.na(rt_ms), rt_ms > 0, rt_ms < 10000) %>%  # Valid RTs
  filter(correct == TRUE | correct == "True" | correct == 1) %>%  # Correct trials only
  filter(!is.na(ID), !is.na(A), !is.na(W)) %>%  # Required Fitts columns
  mutate(
    # Convert to numeric
    ID_num = as.numeric(ID),
    A_num = as.numeric(A),
    W_num = as.numeric(W),
    rt_ms_num = as.numeric(rt_ms),
    
    # Compute throughput (TP) in bits/s
    # TP = ID / MT (where MT is movement time in seconds)
    MT = rt_ms_num / 1000,  # Convert ms to seconds
    TP = ID_num / MT,
    
    # Factors
    Modality = as.factor(modality),
    UI_Mode = as.factor(ui_mode),
    Pressure = as.factor(pressure),
    Aging = as.factor(aging)
  ) %>%
  filter(TP > 0, TP < 20)  # Reasonable TP range

cat("Total valid trials:", nrow(data), "\n")
cat("Participants:", n_distinct(data$pid), "\n")
cat("ID range:", range(data$ID_num, na.rm=TRUE), "\n")
cat("\n")

# ============================================================================
# DESCRIPTIVE STATISTICS
# ============================================================================

cat("=== Descriptive Statistics ===\n")

# TP summary by condition
tp_summary <- data %>%
  group_by(Modality, UI_Mode, Pressure) %>%
  summarise(
    n = n(),
    mean_TP = mean(TP, na.rm=TRUE),
    sd_TP = sd(TP, na.rm=TRUE),
    median_TP = median(TP, na.rm=TRUE),
    .groups="drop"
  )

print(tp_summary)
cat("\n")

# TP by ID
tp_by_id <- data %>%
  group_by(ID_num) %>%
  summarise(
    n = n(),
    mean_TP = mean(TP, na.rm=TRUE),
    sd_TP = sd(TP, na.rm=TRUE),
    .groups="drop"
  )

print(tp_by_id)
cat("\n")

# ============================================================================
# LINEAR MIXED-EFFECTS MODEL: TP
# ============================================================================

cat("=== Fitting LME/M: TP ~ Modality * UI_Mode * Pressure + (1|pid) ===\n")

model_tp <- lmer(
  TP ~ Modality * UI_Mode * Pressure + (1 | pid),
  data = data
)

print(summary(model_tp))

# Save model summary
sink(file.path(opt$output, "tp_lmem_summary.txt"))
print(summary(model_tp))
sink()

# Effect sizes
cat("\n=== Effect Sizes ===\n")
print(confint(model_tp, method="boot"))

# ============================================================================
# PLOTTING
# ============================================================================

cat("\nGenerating plots...\n")

# 1. TP vs ID (scatter with smooth)
p1 <- ggplot(data, aes(x=ID_num, y=TP, color=Modality)) +
  geom_point(alpha=0.3, size=0.5) +
  geom_smooth(method="lm", se=TRUE) +
  facet_wrap(~Modality) +
  labs(
    title="Throughput vs Index of Difficulty",
    x="Index of Difficulty (ID, bits)",
    y="Throughput (TP, bits/s)"
  ) +
  theme_minimal()

ggsave(file.path(opt$output, "tp_vs_id.png"), p1, width=10, height=6)

# 2. TP by condition (boxplot)
p2 <- ggplot(data, aes(x=Modality, y=TP, fill=Pressure)) +
  geom_violin() +
  geom_boxplot(width=0.1, position=position_dodge(0.9), outlier.size=0.5) +
  facet_wrap(~UI_Mode) +
  labs(
    title="Throughput by Condition",
    x="Modality",
    y="Throughput (TP, bits/s)"
  ) +
  theme_minimal()

ggsave(file.path(opt$output, "tp_by_condition.png"), p2, width=10, height=6)

# 3. TP distribution by ID and modality
p3 <- data %>%
  ggplot(aes(x=factor(ID_num), y=TP, fill=Modality)) +
  geom_violin(position=position_dodge(0.9)) +
  geom_boxplot(width=0.1, position=position_dodge(0.9), outlier.size=0.5) +
  labs(
    title="Throughput Distribution by ID and Modality",
    x="Index of Difficulty (ID)",
    y="Throughput (TP, bits/s)"
  ) +
  theme_minimal()

ggsave(file.path(opt$output, "tp_distribution.png"), p3, width=10, height=6)

# 4. Individual participant trajectories
p4 <- data %>%
  group_by(pid, ID_num, Modality) %>%
  summarise(
    mean_TP = mean(TP, na.rm=TRUE),
    .groups="drop"
  ) %>%
  ggplot(aes(x=ID_num, y=mean_TP, color=Modality, group=pid)) +
  geom_line(alpha=0.3) +
  geom_smooth(aes(group=Modality), method="lm", se=TRUE, size=1.5) +
  labs(
    title="Individual TP Trajectories",
    x="Index of Difficulty (ID)",
    y="Mean Throughput (TP, bits/s)"
  ) +
  theme_minimal()

ggsave(file.path(opt$output, "tp_trajectories.png"), p4, width=10, height=6)

cat("\nPlots saved to:", opt$output, "\n")
cat("\n=== Analysis Complete ===\n")

