library(tidyverse)
trial <- read_csv("data/clean/trial_data.csv", show_col_types = FALSE)

part_flags <- trial %>%
  group_by(participant_id) %>%
  summarise(
    error_rate = mean(error, na.rm=TRUE),
    completion_rate = mean(!is.na(movement_time_ms)),
    zoom_violation = any(zoom_level != 100, na.rm=TRUE),
    fullscreen_violation = any(is_fullscreen == FALSE, na.rm=TRUE),
    .groups = "drop"
  ) %>%
  mutate(
    exclude = error_rate > .40 | completion_rate < .80 | zoom_violation | fullscreen_violation,
    reason = case_when(
      error_rate > .40 ~ "Error>40%",
      completion_rate < .80 ~ "Completion<80%",
      zoom_violation ~ "Zoom≠100%",
      fullscreen_violation ~ "Not fullscreen",
      TRUE ~ "OK"
    )
  )

write_csv(part_flags, "results/tables/exclusion_report.csv")
cat("✓ Exclusion report: results/tables/exclusion_report.csv\n")

