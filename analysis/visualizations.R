library(tidyverse); library(ggplot2); library(ggpubr); library(patchwork); library(readr)

emm_rt <- read_csv("results/tables/emmeans_rt.csv", show_col_types = FALSE)
emm_err <- read_csv("results/tables/emmeans_error.csv", show_col_types = FALSE)
emm_tp <- read_csv("results/tables/emmeans_tp.csv", show_col_types = FALSE)
tlx_path <- "results/tables/emmeans_TLX.csv"
tlx <- if (file.exists(tlx_path)) {
  read_csv(tlx_path, show_col_types = FALSE)
} else {
  tibble()
}

p_rt <- ggplot(emm_rt, aes(x=modality, y=response, fill=ui_mode)) +
  geom_bar(stat="identity", position=position_dodge(.9)) +
  geom_errorbar(aes(ymin=lower.CL, ymax=upper.CL), position=position_dodge(.9), width=.2) +
  labs(title="Movement Time", y="ms", x=NULL, fill="UI")

p_err <- ggplot(emm_err %>% mutate(error_pct = prob*100),
                aes(x=modality, y=error_pct, fill=ui_mode)) +
  geom_bar(stat="identity", position=position_dodge(.9)) +
  geom_errorbar(aes(ymin=asymp.LCL*100, ymax=asymp.UCL*100),
                position=position_dodge(.9), width=.2) +
  labs(title="Error Rate", y="%", x=NULL, fill="UI")

p_tp <- ggplot(emm_tp, aes(x=modality, y=emmean, fill=ui_mode)) +
  geom_bar(stat="identity", position=position_dodge(.9)) +
  geom_errorbar(aes(ymin=lower.CL, ymax=upper.CL), position=position_dodge(.9), width=.2) +
  labs(title="Throughput", y="bits/s", x=NULL, fill="UI")

if (nrow(tlx)>0) {
  p_tlx <- ggplot(tlx, aes(x=modality, y=emmean, fill=ui_mode)) +
    geom_bar(stat="identity", position=position_dodge(.9)) +
    geom_errorbar(aes(ymin=lower.CL, ymax=upper.CL), position=position_dodge(.9), width=.2) +
    labs(title="NASA-TLX", y="Raw Total (0–600)", x=NULL, fill="UI")
} else {
  p_tlx <- ggplot() + theme_void() + labs(title="NASA-TLX (pending)")
}

panel <- (p_rt + p_err) / (p_tp + p_tlx) +
  plot_annotation(title = "XR Adaptive Modality — Key Outcomes (N≈30)")

dir.create("results/figures", recursive = TRUE, showWarnings = FALSE)
ggsave("results/figures/summary_panel.png", panel, width=12, height=10, dpi=300)
cat("✓ Saved results/figures/summary_panel.png\n")

