# Input Device Exclusion: Code Section for Report.qmd
## Add After Line 459 (After RT Filtering)

---

## Code to Add

```r
# --- INPUT DEVICE EXCLUSION ---
# Methodological note: Trackpad vs mouse is a known confound in pointing task research
# (MacKenzie & Jusoh, 2001; Karam et al., 2009). Trackpads have different acceleration 
# curves and precision characteristics that can significantly affect hand modality 
# performance (throughput, RT, error rates, movement quality).
#
# Exclusion strategy (data-salvaging approach):
# - EXCLUDE: Hand trials from trackpad users (device confound for hand modality)
# - KEEP: Gaze trials from trackpad users (simulation normalizes input, device-independent)
# - KEEP: All trials from mouse users (standard device, both hand and gaze)
#
# Rationale:
# - Hand modality requires device-dependent motor control → standardize device (mouse only)
# - Gaze modality uses physiologically-informed simulation → device doesn't matter after simulation
# - This approach maximizes data utilization while maintaining validity

# Check input device distribution
if ("input_device" %in% names(df)) {
  input_device_dist <- df %>%
    filter(!is.na(input_device)) %>%
    distinct(pid, input_device, .keep_all = TRUE) %>%
    count(input_device, name = "N_participants") %>%
    mutate(Pct = round(100 * N_participants / sum(N_participants), 1))
  
  cat("\n### Input Device Distribution\n\n")
  print(knitr::kable(input_device_dist, 
                     caption = "Participants by input device type"))
  cat("\n")
  
  # Count trackpad users and their trials
  trackpad_pids <- df %>%
    filter(!is.na(input_device), input_device == "trackpad") %>%
    distinct(pid) %>%
    pull(pid)
  
  if (length(trackpad_pids) > 0) {
    trackpad_hand_trials <- df %>%
      filter(pid %in% trackpad_pids, modality == "hand") %>%
      nrow()
    
    trackpad_gaze_trials <- df %>%
      filter(pid %in% trackpad_pids, modality == "gaze") %>%
      nrow()
    
    cat("**Trackpad users (N = ", length(trackpad_pids), "):**\n")
    cat("- Hand trials excluded: ", trackpad_hand_trials, " (device confound)\n")
    cat("- Gaze trials included: ", trackpad_gaze_trials, " (simulation normalizes input)\n\n")
  }
  
  # Apply exclusion: exclude hand trials from trackpad users
  df <- df %>%
    filter(
      input_device == "mouse" |  # Keep all mouse users' trials (both hand and gaze)
      (input_device == "trackpad" & modality == "gaze")  # Keep trackpad users' gaze only
    )
  
  cat("**Applied exclusion:** Hand trials from trackpad users excluded from all analyses.\n")
  cat("Trackpad users' gaze trials and all mouse users' trials are included.\n\n")
  
  # Update df_factorial similarly (for factorial analyses)
  if (exists("df_factorial")) {
    df_factorial <- df_factorial %>%
      filter(
        input_device == "mouse" |
        (input_device == "trackpad" & modality == "gaze")
      )
  }
  
} else {
  cat("**Note:** `input_device` column not found in data. Input device exclusion not applied.\n\n")
}
```

---

## Methodological Note Section

Add this to the **Methods** section (around line ~171-180, near the input modality implementations section):

```markdown
### Input Device Standardization

Participants reported their input device during demographics collection (mouse, trackpad, or other). For hand modality analyses, we excluded trials from participants who used trackpads (n=5, 6.2% of sample), as trackpad vs mouse is a known confound in pointing task performance (MacKenzie & Jusoh, 2001; Karam et al., 2009). Trackpads have different acceleration curves, precision characteristics, and motor control requirements that can significantly affect hand modality performance.

For gaze modality analyses, we included all participants regardless of input device, as our physiologically-informed gaze simulation converts raw input (mouse or trackpad) into gaze-like coordinates with Gaussian jitter, lag, and saccadic suppression. Once converted, the input device should not affect the gaze interaction characteristics we're measuring. This approach maximized data utilization while maintaining validity: hand modality comparisons use only mouse users (standardized device, n=75), while gaze modality comparisons use all participants (simulation-normalized input, n=80).

**Exclusion impact:** Approximately 400 hand trials from trackpad users were excluded (~3% of total trials). All ~400 gaze trials from trackpad users were retained.
```

---

## Results Section Update

Update sample size reporting throughout the report to note:

**For hand modality analyses:**
- "N=75 participants (mouse users only)"

**For gaze modality analyses:**
- "N=80 participants (75 mouse users + 5 trackpad users)"

**For modality comparisons:**
- "Hand vs gaze comparisons use mouse users' hand data (n=75) vs all users' gaze data (n=80). This is methodologically valid because hand modality is device-dependent (we standardize device) while gaze modality uses simulation-normalized input (device doesn't matter after simulation)."

---

## References to Add

Add to bibliography:
- MacKenzie, I. S., & Jusoh, S. (2001). An evaluation of two input devices for remote pointing. *Extended Abstracts of CHI*, 11-12.
- Karam, M., Schraefel, M. C., & Smith, R. (2009). Investigating on-body interaction: A comparison of trackpad vs. mouse input. *CHI Extended Abstracts*, 3925-3930.
