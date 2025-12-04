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

cat("\n✓ Models complete. EMMs saved to results/tables/\n")

