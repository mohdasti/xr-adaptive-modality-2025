suppressPackageStartupMessages({
  library(lme4)
  library(lmerTest)
  library(TOSTER)
  library(emmeans)
  library(tidyverse)
})

test_h1_modality <- function(trials) {
  m <- lmer(log(movement_time_ms) ~ modality + IDe_bits + trial_number + block_number +
              (1 + modality | participant_id), data = trials)
  anova(m)
}

test_h2_tost <- function(trials) {
  agg <- trials %>%
    group_by(participant_id, ui_mode) %>%
    summarise(rt = mean(log(movement_time_ms)), .groups = "drop") %>%
    pivot_wider(names_from = ui_mode, values_from = rt)
  list(
    ci95 = t.test(agg$adaptive, agg$static, paired = TRUE, conf.level = 0.95),
    tost5 = TOSTpaired(agg$adaptive, agg$static, low_eqbound = -0.05, high_eqbound = 0.05),
    tost3 = TOSTpaired(agg$adaptive, agg$static, low_eqbound = -0.03, high_eqbound = 0.03),
    tost75 = TOSTpaired(agg$adaptive, agg$static, low_eqbound = -0.075, high_eqbound = 0.075)
  )
}

test_h3_interaction <- function(trials) {
  m_rt <- lmer(log(movement_time_ms) ~ modality * ui_mode + IDe_bits + trial_number + block_number +
                 (1 | participant_id), data = trials)
  m_err <- glmer(error ~ modality * ui_mode + IDe_bits + trial_number + block_number +
                   (1 | participant_id), data = trials, family = binomial)
  list(rt = anova(m_rt), err = anova(m_err))
}
