##
## Linear Mixed-Effects Models (LME/M) and Generalized LMM (GLMM)
## for XR Adaptive Modality Experiment Analysis
##
## This script:
## - Loads cleaned CSV data from /data/clean/
## - Fits LME/M: logRT ~ Modality * UI_Mode * Pressure + (1|pid)
## - Fits GLMM: correct ~ Modality * UI_Mode * Pressure + (1|pid)
## - Generates model summaries and diagnostics
##
## Usage:
##   Rscript lmem_glmm.R --input data/clean/ --output analysis/results/
##   Rscript lmem_glmm.R -i data/clean/*.csv -o analysis/results/ --verbose
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
  make_option(c("-o", "--output"), type="character", default="analysis/results/",
              help="Output directory for results (default: analysis/results/)"),
  make_option(c("-v", "--verbose"), action="store_true", default=FALSE,
              help="Print verbose output"),
  make_option(c("--save-plots"), action="store_true", default=TRUE,
              help="Save diagnostic plots")
)

opt_parser <- OptionParser(option_list=option_list)
opt <- parse_args(opt_parser)

# Ensure output directory exists
dir.create(opt$output, showWarnings=FALSE, recursive=TRUE)

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
  filter(!is.na(rt_ms), rt_ms > 0, rt_ms < 10000) %>%  # Filter valid RTs
  mutate(
    logRT = log(rt_ms),
    Modality = as.factor(modality),
    UI_Mode = as.factor(ui_mode),
    Pressure = as.factor(pressure),
    Aging = as.factor(aging),
    correct_binary = as.numeric(correct == TRUE | correct == "True" | correct == 1)
  )

cat("Total rows:", nrow(data), "\n")
cat("Participants:", n_distinct(data$pid), "\n")
cat("\n")

# ============================================================================
# LINEAR MIXED-EFFECTS MODEL (LME/M): logRT
# ============================================================================

cat("Fitting LME/M: logRT ~ Modality * UI_Mode * Pressure + (1|pid)\n")

model_lmem <- lmer(
  logRT ~ Modality * UI_Mode * Pressure + (1 | pid),
  data = data
)

# Model summary
cat("\n=== LME/M Results ===\n")
print(summary(model_lmem))

# Save model summary
sink(file.path(opt$output, "lmem_summary.txt"))
print(summary(model_lmem))
sink()

# Effect sizes and confidence intervals
cat("\n=== Effect Sizes (Cohen's d approximates) ===\n")
print(confint(model_lmem, method="boot"))

# Model diagnostics
if (opt$`save-plots`) {
  cat("\nGenerating diagnostic plots...\n")
  
  png(file.path(opt$output, "lmem_diagnostics.png"), 
      width=1200, height=800, res=150)
  
  par(mfrow=c(2,3))
  
  # Residuals vs fitted
  plot(fitted(model_lmem), residuals(model_lmem),
       xlab="Fitted values", ylab="Residuals",
       main="Residuals vs Fitted")
  abline(h=0, col="red", lty=2)
  
  # Q-Q plot
  qqnorm(residuals(model_lmem))
  qqline(residuals(model_lmem), col="red")
  
  # Scale-location
  sqrt_abs_res <- sqrt(abs(residuals(model_lmem)))
  plot(fitted(model_lmem), sqrt_abs_res,
       xlab="Fitted values", ylab="sqrt(|Residuals|)",
       main="Scale-Location")
  
  # Cook's distance
  plot(cooks.distance(model_lmem), 
       xlab="Observation", ylab="Cook's distance",
       main="Cook's Distance")
  
  # Random effects
  qqnorm(ranef(model_lmem)$pid[[1]])
  qqline(ranef(model_lmem)$pid[[1]], col="red")
  
  # Marginal R-squared
  margR2 <- 1 - sum(residuals(model_lmem)^2) / sum((data$logRT - mean(data$logRT, na.rm=TRUE))^2)
  barplot(c(R2_marginal=margR2), ylim=c(0,1), main="Marginal R²")
  
  dev.off()
  
  cat("Diagnostic plot saved to:", file.path(opt$output, "lmem_diagnostics.png"), "\n")
}

# ============================================================================
# GENERALIZED LINEAR MIXED MODEL (GLMM): correct
# ============================================================================

cat("\n\nFitting GLMM: correct ~ Modality * UI_Mode * Pressure + (1|pid)\n")

model_glmm <- glmer(
  correct_binary ~ Modality * UI_Mode * Pressure + (1 | pid),
  data = data,
  family = binomial(link = "logit")
)

# Model summary
cat("\n=== GLMM Results ===\n")
print(summary(model_glmm))

# Save model summary
sink(file.path(opt$output, "glmm_summary.txt"))
print(summary(model_glmm))
sink()

# Effect sizes (odds ratios)
cat("\n=== Odds Ratios ===\n")
print(exp(fixef(model_glmm)))

# Model diagnostics
if (opt$`save-plots`) {
  cat("\nGenerating GLMM diagnostic plots...\n")
  
  png(file.path(opt$output, "glmm_diagnostics.png"),
      width=1200, height=800, res=150)
  
  par(mfrow=c(2,3))
  
  # Residuals vs fitted
  plot(fitted(model_glmm), residuals(model_glmm, type="pearson"),
       xlab="Fitted values", ylab="Pearson residuals",
       main="Residuals vs Fitted")
  abline(h=0, col="red", lty=2)
  
  # Q-Q plot
  qqnorm(residuals(model_glmm, type="pearson"))
  qqline(residuals(model_glmm, type="pearson"), col="red")
  
  # Scale-location
  sqrt_abs_res <- sqrt(abs(residuals(model_glmm, type="pearson")))
  plot(fitted(model_glmm), sqrt_abs_res,
       xlab="Fitted values", ylab="sqrt(|Pearson residuals|)",
       main="Scale-Location")
  
  # Observation-level random effects
  plot(ranef(model_glmm)$pid[[1]],
       xlab="Participant", ylab="Random effect",
       main="Random Effects by Participant")
  
  # Predicted vs observed
  plot(fitted(model_glmm), data$correct_binary,
       xlab="Predicted probability", ylab="Observed correct",
       main="Predicted vs Observed")
  abline(0, 1, col="red", lty=2)
  
  # Empirical CDF
  plot(ecdf(residuals(model_glmm, type="pearson")),
       main="Empirical CDF of Residuals")
  
  dev.off()
  
  cat("GLMM diagnostic plot saved to:", file.path(opt$output, "glmm_diagnostics.png"), "\n")
}

# ============================================================================
# Exploratory visualizations
# ============================================================================

if (opt$`save-plots`) {
  cat("\nGenerating exploratory plots...\n")
  
  # RT distribution by modality
  p1 <- ggplot(data, aes(x=Modality, y=rt_ms)) +
    geom_violin(aes(fill=Modality)) +
    geom_boxplot(width=0.1, outlier.size=0.5) +
    scale_y_log10() +
    labs(title="Reaction Time by Modality",
         x="Modality", y="RT (ms, log scale)")
  
  ggsave(file.path(opt$output, "rt_by_modality.png"), p1, width=8, height=6)
  
  # Accuracy by condition
  p2 <- data %>%
    group_by(Modality, UI_Mode, Pressure) %>%
    summarise(
      accuracy = mean(correct_binary, na.rm=TRUE),
      n = n(),
      .groups="drop"
    ) %>%
    ggplot(aes(x=Modality, y=accuracy, fill=Pressure)) +
    geom_bar(stat="identity", position="dodge") +
    facet_wrap(~UI_Mode) +
    labs(title="Accuracy by Condition",
         x="Modality", y="Accuracy") +
    ylim(0, 1)
  
  ggsave(file.path(opt$output, "accuracy_by_condition.png"), p2, width=10, height=6)
}

cat("\n=== Analysis Complete ===\n")
cat("Results saved to:", opt$output, "\n")

