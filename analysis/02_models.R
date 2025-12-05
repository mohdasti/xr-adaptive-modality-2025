# ============================================================================
# Statistical Models for XR Adaptive Modality Experiment
# ============================================================================
# 
# This script fits Linear Mixed Models (LMM) and Generalized LMM (GLMM) for:
# 1. Reaction Time (RT): log(movement_time_ms) ~ modality * ui_mode + ...
# 2. Error Rate: error ~ modality * ui_mode + ... (binomial)
# 3. Submovement Cost: submovement_count ~ modality * ui_mode * IDe + ...
# 4. Control Stability: target_reentry_count ~ modality * ui_mode + ... (count)
# 5. Verification Time: log(verification_time_ms) ~ modality * ui_mode + ...
#
# Hybrid Analysis Models (3-5) focus on movement quality metrics rather than
# just time and error, capturing the cost of the control loop.
# ============================================================================

library(tidyverse)
library(lme4)
library(lmerTest)
library(emmeans)
library(car)

trial <- read_csv("data/clean/trial_data.csv", show_col_types = FALSE)

# Normalize column names: handle both rt_ms/movement_time_ms and pid/participant_id
if ("rt_ms" %in% names(trial) && !"movement_time_ms" %in% names(trial)) {
  trial <- trial %>% rename(movement_time_ms = rt_ms)
}
if ("pid" %in% names(trial) && !"participant_id" %in% names(trial)) {
  trial <- trial %>% rename(participant_id = pid)
}
# Create error column from correct/err_type if needed
if (!"error" %in% names(trial)) {
  if ("correct" %in% names(trial)) {
    trial <- trial %>% mutate(error = ifelse(is.na(correct) | correct == FALSE, 1, 0))
  } else if ("err_type" %in% names(trial)) {
    trial <- trial %>% mutate(error = ifelse(!is.na(err_type) & err_type != "", 1, 0))
  } else {
    trial <- trial %>% mutate(error = 0)
  }
}

# Load effective metrics and join to trials if available (before converting to factors)
if (file.exists("data/clean/effective_metrics.csv")) {
  effective <- read_csv("data/clean/effective_metrics.csv", show_col_types = FALSE)
  trial <- trial %>%
    left_join(effective, by = c("participant_id", "modality", "ui_mode", "target_distance_A")) %>%
    mutate(
      index_of_difficulty_effective = ifelse(is.na(IDe), index_of_difficulty_nominal, IDe)
    )
} else {
  trial <- trial %>%
    mutate(index_of_difficulty_effective = index_of_difficulty_nominal)
}

# Convert to factors after join
trial <- trial %>%
  mutate(
    participant_id = factor(participant_id),
    modality = factor(modality, levels = c("hand","gaze")),
    ui_mode = factor(ui_mode, levels = c("static","adaptive")),
    block_number = factor(block_number)
  )

rt <- trial %>% filter(error == 0, movement_time_ms >= 150, movement_time_ms <= 6000)

# MODEL 1: RT
m_rt <<- lmer(
  log(movement_time_ms) ~ modality * ui_mode + scale(index_of_difficulty_effective) +
    scale(trial_number) + block_number + (1 + ui_mode | participant_id),
  data = rt, REML = FALSE, control = lmerControl(optimizer = "bobyqa")
)

cat("\n=== RT Model ===\n")
print(summary(m_rt))
cat("\n=== RT ANOVA ===\n")
print(anova(m_rt, type = "III"))

emm_rt <- emmeans(m_rt, ~ modality * ui_mode, type = "response")
cat("\n=== RT EMMs ===\n")
print(emm_rt)
cat("\n=== RT Pairs ===\n")
print(pairs(emm_rt, adjust = "holm"))

dir.create("results/tables", recursive = TRUE, showWarnings = FALSE)
write_csv(as.data.frame(emm_rt), "results/tables/emmeans_RT.csv")

# MODEL 2: Errors
m_err <- glmer(
  error ~ modality * ui_mode + scale(index_of_difficulty_effective) +
    scale(trial_number) + block_number + (1 | participant_id),
  data = trial, family = binomial(link = "logit"),
  control = glmerControl(optimizer = "bobyqa", optCtrl = list(maxfun = 2e5))
)

cat("\n=== Error Model ===\n")
print(summary(m_err))
cat("\n=== Error ANOVA ===\n")
print(car::Anova(m_err, type = "III"))

emm_err <- emmeans(m_err, ~ modality * ui_mode, type = "response")
cat("\n=== Error EMMs ===\n")
print(emm_err)

write_csv(as.data.frame(emm_err), "results/tables/emmeans_error.csv")

# ============================================================================
# HYBRID ANALYSIS MODELS: Movement Quality Metrics
# ============================================================================

# MODEL 3: Submovement Cost
# Hypothesis: Gaze modality (with "Saccadic Suppression") will significantly 
# increase submovement counts compared to Hand
if ("submovement_count" %in% names(trial)) {
  # Filter to correct trials only (like RT model)
  submov_data <- trial %>% 
    filter(error == 0, !is.na(submovement_count), submovement_count >= 0)
  
  if (nrow(submov_data) > 0) {
    m_submov <<- lmer(
      submovement_count ~ modality * ui_mode * scale(index_of_difficulty_effective) +
        scale(trial_number) + block_number + (1 + ui_mode | participant_id),
      data = submov_data, REML = FALSE, control = lmerControl(optimizer = "bobyqa")
    )
    
    cat("\n=== Submovement Cost Model ===\n")
    print(summary(m_submov))
    cat("\n=== Submovement ANOVA ===\n")
    print(anova(m_submov, type = "III"))
    
    emm_submov <- emmeans(m_submov, ~ modality * ui_mode, type = "response")
    cat("\n=== Submovement EMMs ===\n")
    print(emm_submov)
    cat("\n=== Submovement Pairs ===\n")
    print(pairs(emm_submov, adjust = "holm"))
    
    write_csv(as.data.frame(emm_submov), "results/tables/emmeans_submovement.csv")
  } else {
    cat("\n⚠ No valid submovement_count data found. Skipping submovement model.\n")
  }
} else {
  cat("\n⚠ submovement_count column not found. Skipping submovement model.\n")
}

# MODEL 4: Control Stability (Target Re-entries)
# Hypothesis: High smoothingFactor (lag) in Gaze mode will cause more overshoots/re-entries
if ("target_reentry_count" %in% names(trial)) {
  # Include all trials (not just correct ones) - re-entries can happen in errors too
  reentry_data <- trial %>% 
    filter(!is.na(target_reentry_count), target_reentry_count >= 0)
  
  if (nrow(reentry_data) > 0) {
    # Try Poisson first, fall back to Negative Binomial if overdispersed
    m_reentry_pois <- glmer(
      target_reentry_count ~ modality * ui_mode + 
        scale(index_of_difficulty_effective) + scale(trial_number) + block_number + 
        (1 | participant_id),
      data = reentry_data, family = poisson(link = "log"),
      control = glmerControl(optimizer = "bobyqa", optCtrl = list(maxfun = 2e5))
    )
    
    # Check for overdispersion (simple check: variance > mean)
    mean_count <- mean(reentry_data$target_reentry_count, na.rm = TRUE)
    var_count <- var(reentry_data$target_reentry_count, na.rm = TRUE)
    is_overdispersed <- var_count > mean_count * 1.5  # Conservative threshold
    
    if (is_overdispersed) {
      cat("⚠ Overdispersion detected (var = ", round(var_count, 2), 
          " > mean = ", round(mean_count, 2), "). Trying Negative Binomial.\n")
      if (requireNamespace("glmmTMB", quietly = TRUE)) {
        library(glmmTMB)
        m_reentry <<- glmmTMB(
          target_reentry_count ~ modality * ui_mode + 
            scale(index_of_difficulty_effective) + scale(trial_number) + block_number + 
            (1 | participant_id),
          data = reentry_data, family = nbinom2()
        )
        cat("✓ Using Negative Binomial model\n")
      } else {
        cat("⚠ glmmTMB not available. Using Poisson despite overdispersion.\n")
        m_reentry <<- m_reentry_pois
      }
    } else {
      m_reentry <<- m_reentry_pois
      cat("✓ Using Poisson model (no overdispersion detected)\n")
    }
    
    cat("\n=== Control Stability (Re-entries) Model ===\n")
    print(summary(m_reentry))
    cat("\n=== Re-entries ANOVA ===\n")
    if (inherits(m_reentry, "glmmTMB")) {
      # glmmTMB uses different Anova function
      if (requireNamespace("car", quietly = TRUE)) {
        print(car::Anova(m_reentry, type = "III"))
      } else {
        print(anova(m_reentry))
      }
    } else {
      print(car::Anova(m_reentry, type = "III"))
    }
    
    emm_reentry <- emmeans(m_reentry, ~ modality * ui_mode, type = "response")
    cat("\n=== Re-entries EMMs ===\n")
    print(emm_reentry)
    cat("\n=== Re-entries Pairs ===\n")
    print(pairs(emm_reentry, adjust = "holm"))
    
    write_csv(as.data.frame(emm_reentry), "results/tables/emmeans_reentry.csv")
  } else {
    cat("\n⚠ No valid target_reentry_count data found. Skipping re-entry model.\n")
  }
} else {
  cat("\n⚠ target_reentry_count column not found. Skipping re-entry model.\n")
}

# MODEL 5: Verification Time (LBA Proxy)
# Note: verification_time_ms analyzes the "stopping" phase separately from the "moving" phase
if ("verification_time_ms" %in% names(trial)) {
  # Filter to trials where verification occurred (not null) and valid values
  verify_data <- trial %>% 
    filter(!is.na(verification_time_ms), verification_time_ms > 0, 
           verification_time_ms <= 6000)  # Reasonable upper bound
    
  if (nrow(verify_data) > 0) {
    m_verify <<- lmer(
      log(verification_time_ms) ~ modality * ui_mode + 
        scale(index_of_difficulty_effective) + scale(trial_number) + block_number + 
        (1 + ui_mode | participant_id),
      data = verify_data, REML = FALSE, control = lmerControl(optimizer = "bobyqa")
    )
    
    cat("\n=== Verification Time Model ===\n")
    print(summary(m_verify))
    cat("\n=== Verification Time ANOVA ===\n")
    print(anova(m_verify, type = "III"))
    
    emm_verify <- emmeans(m_verify, ~ modality * ui_mode, type = "response")
    cat("\n=== Verification Time EMMs ===\n")
    print(emm_verify)
    cat("\n=== Verification Time Pairs ===\n")
    print(pairs(emm_verify, adjust = "holm"))
    
    write_csv(as.data.frame(emm_verify), "results/tables/emmeans_verification.csv")
  } else {
    cat("\n⚠ No valid verification_time_ms data found. Skipping verification model.\n")
  }
} else {
  cat("\n⚠ verification_time_ms column not found. Skipping verification model.\n")
}

cat("\n✓ All models complete. EMMs saved to results/tables/\n")

