library(tidyverse); library(lme4); library(lmerTest); library(emmeans); library(performance)

trial <- read_csv("data/clean/trial_data.csv", show_col_types = FALSE) %>%
  mutate(
    participant_id = factor(participant_id),
    modality = factor(modality, levels = c("hand","gaze")),
    ui_mode = factor(ui_mode, levels = c("static","adaptive")),
    block_number = factor(block_number)
  )

# Exclusions (participant-level)
part_flags <- trial %>%
  group_by(participant_id) %>%
  summarise(
    error_rate = mean(error, na.rm=TRUE),
    completion_rate = mean(!is.na(movement_time_ms)),
    zoom_violation = any(zoom_level != 100, na.rm=TRUE),
    fullscreen_violation = any(is_fullscreen == FALSE, na.rm=TRUE),
    .groups="drop"
  ) %>%
  mutate(exclude = error_rate > .40 | completion_rate < .80 | zoom_violation | fullscreen_violation)

included_pids <- part_flags %>% filter(!exclude) %>% pull(participant_id)

trial <- trial %>% filter(participant_id %in% included_pids)

# Trial-level exclusions for RT
trial <- trial %>%
  mutate(exclude_RT = movement_time_ms < 150 | movement_time_ms > 5000 | timeout == TRUE)

rt_ok <- trial %>% filter(!exclude_RT, error == 0)

# If index_of_difficulty_effective exists, use it; else fall back to nominal
if(!"index_of_difficulty_effective" %in% names(rt_ok)) {
  rt_ok <- rt_ok %>% mutate(index_of_difficulty_effective = index_of_difficulty_nominal)
}

# MODEL 1: RT
m_rt <- lmer(
  log(movement_time_ms) ~ modality * ui_mode + scale(index_of_difficulty_effective) +
    scale(trial_number) + block_number + (1 + ui_mode | participant_id),
  data = rt_ok, REML = FALSE, control = lmerControl(optimizer="bobyqa")
)
print(summary(m_rt)); print(anova(m_rt, type="III")); print(r2(m_rt))
emm_rt <- emmeans(m_rt, ~ modality * ui_mode, type="response"); print(emm_rt); print(pairs(emm_rt, adjust="holm"))

# TOST via 90% CI vs ±5% margin
emm_ui <- emmeans(m_rt, ~ ui_mode, type="response")
rt_vals <- as.data.frame(emm_ui)
rt_static <- rt_vals$response[rt_vals$ui_mode=="static"]; rt_adapt <- rt_vals$response[rt_vals$ui_mode=="adaptive"]
margin <- 0.05 * rt_static
diff_ui <- contrast(emm_ui, method="revpairwise", adjust="none")
ci90 <- confint(diff_ui, level=.90)
cat("\n90% CI (Adaptive - Static):", round(ci90$lower.CL,1),"to",round(ci90$upper.CL,1),"ms; margin ±", round(margin,1),"ms\n")
if (ci90$lower.CL > -margin && ci90$upper.CL < margin) cat("✓ RT equivalence (no slow-down) established.\n") else cat("○ No equivalence.\n")

# MODEL 2: Errors
m_err <- glmer(
  error ~ modality * ui_mode + scale(index_of_difficulty_effective) +
    scale(trial_number) + block_number + (1 | participant_id),
  data = trial, family=binomial(link="logit"),
  control = glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5))
)
print(summary(m_err))
emm_err <- emmeans(m_err, ~ modality * ui_mode, type="response"); print(emm_err)

# MODEL 3: Throughput (requires effective metrics CSV from compute_effective_metrics.R)
eff <- read_csv("results/tables/effective_metrics_by_condition.csv", show_col_types = FALSE) %>%
  mutate(participant_id = factor(participant_id),
         modality = factor(modality, levels=c("hand","gaze")),
         ui_mode = factor(ui_mode, levels=c("static","adaptive")))
m_tp <- lmer(throughput ~ modality * ui_mode + (1 | participant_id), data = eff)
print(summary(m_tp)); print(anova(m_tp, type="III"))
emm_tp <- emmeans(m_tp, ~ modality * ui_mode); print(emm_tp); print(pairs(emm_tp, adjust="holm"))

# MODEL 4: TLX (raw, reverse-scored performance)
block_path <- "data/clean/block_data.csv"
if (file.exists(block_path)) {
  block <- read_csv(block_path, show_col_types = FALSE)
  if (nrow(block) > 0) {
    block <- block %>%
      mutate(
        participant_id = factor(participant_id),
        modality = factor(modality, levels = c("hand","gaze")),
        ui_mode = factor(ui_mode, levels = c("static","adaptive")),
        tlx_performance_rev = 100 - tlx_performance,
        tlx_raw_total = tlx_mental + tlx_physical + tlx_temporal + tlx_performance_rev + tlx_effort + tlx_frustration
      )
    
    m_tlx <- lmer(tlx_raw_total ~ modality * ui_mode + (1 | participant_id), data = block)
    print(summary(m_tlx)); print(anova(m_tlx, type="III"))
    emm_tlx <- emmeans(m_tlx, ~ modality * ui_mode)
    print(emm_tlx); print(pairs(emm_tlx, adjust="holm"))
  } else {
    cat("TLX block data present but empty; skipping TLX model.\n")
  }
} else {
  cat("TLX block data not found; skipping TLX model.\n")
}

# MODEL 4: Adaptation state dynamics (if you log `adaptation_triggered`)
if ("adaptation_triggered" %in% names(trial)) {
  states <- trial %>%
    filter(!exclude_RT, error == 0) %>%
    group_by(participant_id, modality) %>%
    arrange(trial_number) %>%
    mutate(
      adaptive_state = dplyr::case_when(
        adaptation_triggered ~ "trigger",
        dplyr::lag(adaptation_triggered,1,default=FALSE) ~ "post_1",
        dplyr::lag(adaptation_triggered,2,default=FALSE) | dplyr::lag(adaptation_triggered,3,default=FALSE) ~ "post_2to3",
        TRUE ~ "baseline"
      ),
      adaptive_state = factor(adaptive_state, levels=c("baseline","trigger","post_1","post_2to3"))
    ) %>% ungroup()

  m_state <- lmer(log(movement_time_ms) ~ adaptive_state * modality + scale(index_of_difficulty_effective) + (1|participant_id), data = states)
  print(summary(m_state)); print(anova(m_state, type="III"))
  print(emmeans(m_state, pairwise ~ adaptive_state | modality, adjust="holm", type="response"))
}

# Export emmeans
dir.create("results/tables", recursive = TRUE, showWarnings = FALSE)
write_csv(as.data.frame(emm_rt), "results/tables/emmeans_rt.csv")
write_csv(as.data.frame(emm_err), "results/tables/emmeans_error.csv")
write_csv(as.data.frame(emm_tp), "results/tables/emmeans_tp.csv")
if (exists("emm_tlx")) {
  write_csv(as.data.frame(emm_tlx), "results/tables/emmeans_TLX.csv")
}

cat("✓ Models complete. Tables saved in results/tables/\n")

