# Manuscript Edit Pack

**Date:** 2025-03-07  
**Source:** Regenerated outputs from 8-block-complete primary sample (N=69)  
**Evidence:** audit/regenerated_output_manifest.md, docs/assets/case_study/results_at_a_glance.csv

---

## REPLACEMENT 1 — Section 5.4 Experimental Design

**Section:** Experimental Design (after "2 × 2 × 2 within-subjects design")

**Old text:**
> We employed a repeated-measures factorial design: all participants experienced every combination of the two input modalities (Gaze vs. Hand) × two UI conditions (Adaptive vs. Non-adaptive) × two workload levels (Pressure vs. No Pressure). This creates a 2 × 2 × 2 within-subjects design.

**New text:**
> We used a repeated-measures 2 × 2 × 2 design crossing Modality (Hand vs. Gaze), UI Mode (Static vs. Adaptive), and Pressure (Self-Paced vs. Time-Limited). Each participant in the primary design-complete sample completed eight experimental blocks, one for each condition combination, with block order counterbalanced using a Williams-design schedule. Under the implemented default task configuration, each block contained 27 trials, yielding 216 main-task trials per complete participant before trial-level exclusions.

**Reason:** Align with implemented design (8 blocks, 27 trials/block); remove vague "workload levels"; specify block-level pressure.

**Source:** config/manuscript_analysis_policy.yaml, app/src/lib/fitts.ts, audit/design_audit.md

---

## REPLACEMENT 2 — Section 5.6 Procedure

**Section:** Procedure

**Old text:**
> Each participant completed a short training session to get familiar with gaze selection (including practice with the simulated gaze interface and dwell clicking) and hand selection. During the experiment, they performed 4 blocks of 40 trials each (160 trials total per participant). Practice trials (10 per modality before the main blocks) were excluded from analysis. Target positions cycled through 8 directions; Index of Difficulty varied across three levels ($\approx$2--6 bits). Pressure (time-limited vs. self-paced) was varied within blocks.
>
> After each block, participants filled out a NASA-TLX workload survey (rating mental demand, physical demand, etc.) and took a short break to mitigate fatigue. The entire session lasted about 1 hour per participant.

**New text:**
> Each participant first completed a short training session to become familiar with both input modes, including practice with the simulated gaze interface and dwell-based selection as well as standard hand pointing. In the main experiment, participants completed eight blocks corresponding to the full crossing of Modality (Hand vs. Gaze), UI Mode (Static vs. Adaptive), and Pressure (Self-Paced vs. Time-Limited), with counterbalanced block order across participants. Under the default configuration, each block contained 27 trials. Within each block, target direction varied across the eight ISO 9241-9 positions and Index of Difficulty varied across three levels. NASA-TLX was administered after each block. Practice trials were excluded from analysis.
>
> After each block, participants filled out a NASA-TLX workload survey (rating mental demand, physical demand, etc.) and took a short break to mitigate fatigue. The entire session lasted about 1 hour per participant.

**Reason:** Replace outdated 4 blocks × 40 trials; state 8 blocks × 27 trials; remove "pressure varied within blocks"; state 8 TLX administrations.

**Source:** audit/design_audit.md, config/manuscript_analysis_policy.yaml

---

## REPLACEMENT 3 — Section 5.5.1 Sample Size and Recruitment

**Section:** Sample Size and Recruitment

**Old text:**
> A total of N=81 participants enrolled and completed at least one session. After applying trial validity and factorial completeness criteria, N=67 participants with complete 2×2×2 factorial data were retained for the primary analysis. The 14 excluded participants either had no usable trial data (n=10) or did not complete all eight condition blocks (n=4). Participants were recruited from the university community (target: balanced gender distribution, age range 18–35). All had normal or corrected-to-normal vision and no known motor impairments. The study was approved by the Institutional Review Board (IRB) and all participants provided informed consent.

**New text:**
> A total of 81 participants enrolled and completed at least one session. After applying trial-level QC (zoom, fullscreen, tab visibility, focus), input-device filtering (hand modality: mouse only; gaze modality: mouse and trackpad), and an 8-block completeness requirement, 69 participants with complete 2×2×2 factorial data were retained for the primary analysis. The 12 excluded participants did not complete all eight condition blocks (6 trackpad users with 4 blocks each; 6 mouse users with incomplete sessions). Participants were recruited from the university community (target: balanced gender distribution, age range 18–35). All had normal or corrected-to-normal vision and no known motor impairments. The study was approved by the Institutional Review Board (IRB) and all participants provided informed consent.

**Reason:** N=67 not reproducible; use N=69 from regenerated pipeline; replace "10 no usable, 4 incomplete" with accurate 12-excluded story.

**Source:** audit/exclusion_waterfall.csv, audit/analysis_population_comparison.md

---

## REPLACEMENT 4 — Abstract (N and trial counts)

**Section:** Abstract

**Old text:**
> Results from N=67 participants show that hand yielded higher throughput than gaze (5.15 vs. 4.70 bits/s), lower error (1.75% vs. 18.65%), and lower NASA-TLX workload.

**New text:**
> Results from N=69 participants with complete design data show that hand yielded higher throughput than gaze (5.17 vs. 4.73 bits/s), lower error (1.77% vs. 19.09%), and lower NASA-TLX workload (38.9 vs. 46.4).

**Reason:** Use reproducible N=69 and regenerated point estimates.

**Source:** docs/assets/case_study/results_at_a_glance.csv

---

## REPLACEMENT 5 — Results section header (N and trial count)

**Section:** Results (first paragraph)

**Old text:**
> We report results from N=67 participants with complete factorial data (14,688 valid trials; 7,344 per modality).

**New text:**
> We report results from N=69 participants with complete factorial data (13,519 valid trials after trial-level exclusions).

**Reason:** Align with regenerated counts.

**Source:** audit/regenerated_output_manifest.md

---

## REPLACEMENT 6 — Table: Primary performance (tbl-performance)

**Section:** @tbl-performance

**Old text:**
| Metric | Hand | Gaze |
|:-------|:----:|:----:|
| Throughput (bits/s) | 5.15 [5.06, 5.25] | 4.70 [4.56, 4.83] |
| Error Rate (%) | 1.75 [1.23, 2.26] | 18.65 [17.26, 20.04] |
| Movement Time (s) | 1.09 [1.07, 1.11] | 1.19 [1.16, 1.23] |

**New text:**
| Metric | Hand | Gaze |
|:-------|:----:|:----:|
| Throughput (bits/s) | 5.17 [5.06, 5.27] | 4.73 [4.58, 4.88] |
| Error Rate (%) | 1.77 [1.22, 2.32] | 19.09 [17.58, 20.59] |
| Movement Time (s) | 1.09 [1.07, 1.11] | 1.19 [1.14, 1.23] |

**Reason:** Use regenerated values from results_at_a_glance.csv.

**Source:** docs/assets/case_study/results_at_a_glance.csv

---

## REPLACEMENT 7 — Results narrative (throughput, error, MT)

**Section:** Primary Performance Outcomes (RQ1)

**Old text:**
> Hand input yielded higher throughput (5.15 vs. 4.70 bits/s) and substantially lower error rate (1.75% vs. 18.65%) than gaze input. Movement time was shorter for hand (1.09 s) than gaze (1.19 s).

**New text:**
> Hand input yielded higher throughput (5.17 vs. 4.73 bits/s) and substantially lower error rate (1.77% vs. 19.09%) than gaze input. Movement time was shorter for hand (1.09 s) than gaze (1.19 s).

**Reason:** Match regenerated outputs.

**Source:** docs/assets/case_study/results_at_a_glance.csv

---

## REPLACEMENT 8 — Table: NASA-TLX (tbl-tlx)

**Section:** @tbl-tlx

**Old text (table):**
| NASA-TLX Subscale | Hand | Gaze |
|:------------------|:----:|:----:|
| Mental Demand | 34.9 [31.5, 38.4] | 45.7 [42.4, 49.1] |
| Physical Demand | 34.3 [30.8, 37.8] | 41.9 [38.4, 45.4] |
| Temporal Demand | 40.3 [36.9, 43.6] | 47.1 [44.0, 50.1] |
| Performance | 55.6 [50.4, 60.9] | 53.3 [49.3, 57.3] |
| Effort | 39.8 [36.1, 43.5] | 48.6 [45.2, 51.9] |
| Frustration | 32.2 [28.5, 35.9] | 43.2 [39.5, 46.9] |
| **Overall** | **40.4 [37.0, 43.8]** | **47.0 [43.9, 50.2]** |

**New text (table):**
| NASA-TLX Subscale | Hand | Gaze |
|:------------------|:----:|:----:|
| Mental Demand | 33.8 [30.1, 37.4] | 45.1 [41.4, 48.9] |
| Physical Demand | 33.2 [29.4, 37.0] | 41.1 [37.1, 45.0] |
| Temporal Demand | 38.9 [35.3, 42.5] | 46.5 [43.1, 50.0] |
| Performance | 54.3 [48.6, 59.9] | 52.7 [48.4, 57.0] |
| Effort | 38.3 [34.4, 42.3] | 47.1 [43.3, 51.0] |
| Frustration | 31.4 [27.5, 35.4] | 43.6 [39.6, 47.7] |
| **Overall** | **38.9 [35.3, 42.5]** | **46.4 [42.8, 50.0]** |

**Reason:** Use regenerated TLX from 8-block sample (N=69).

**Source:** docs/manuscript/assets/tlx_subscales_by_modality.csv, docs/assets/case_study/results_at_a_glance.csv

---

## REPLACEMENT 9 — Subjective Workload narrative

**Section:** Subjective Workload (RQ2)

**Old text:**
> NASA-TLX scores (0–100) were higher for gaze than hand across all subscales (@tbl-tlx). Overall workload (unweighted mean of six subscales) was 40.4 [37.0, 43.8] for hand and 47.0 [43.9, 50.2] for gaze.

**New text:**
> NASA-TLX scores (0–100) were higher for gaze than hand across all subscales (@tbl-tlx). Overall workload (unweighted mean of six subscales) was 38.9 [35.3, 42.5] for hand and 46.4 [42.8, 50.0] for gaze.

**Reason:** Match regenerated TLX.

**Source:** docs/manuscript/assets/tlx_subscales_by_modality.csv

---

## REPLACEMENT 10 — Limitations: pressure-bug sentence

**Section:** Limitations (Discussion)

**Old text:**
> Fourth, seven participants were excluded from the primary factorial analysis because of a pressure-logging bug, although the bug has since been fixed.

**New text:**
> Fourth, an earlier data snapshot contained a pressure-logging issue for a subset of participants. In the current merged dataset, pressure is reconstructed from block order, so this issue does not define the final participant exclusion rule used for the present analyses.

**Reason:** Pressure is corrected in merge; no current exclusion uses the bug.

**Source:** audit/exclusion_waterfall.csv, audit/manuscript_analysis_policy.md

---

## REPLACEMENT 11 — Limitations: sample N

**Section:** Limitations (first sentence)

**Old text:**
> First, the sample comprised N=67 participants with complete factorial data.

**New text:**
> First, the sample comprised N=69 participants with complete factorial data.

**Reason:** Use reproducible N.

**Source:** audit/regenerated_output_manifest.md

---

## REPLACEMENT 12 — Conclusion

**Section:** Conclusion

**Old text:**
> The findings from the factorial dataset (N=67) suggest a consistent pattern.

**New text:**
> The findings from the factorial dataset (N=69) suggest a consistent pattern.

**Reason:** Use reproducible N.

**Source:** audit/regenerated_output_manifest.md

---

## REPLACEMENT 13 — Introduction contributions

**Section:** Introduction (contributions paragraph)

**Old text:**
> Second, we provide **quantitative empirical evidence** on gaze vs. hand input in an ISO 9241-9 pointing task (N=67), showing that hand substantially outperforms gaze on throughput and error rate, and that the dominant failure modes are modality-specific: slips (false activations) for gaze and misses (spatial targeting failures) for hand.

**New text:**
> Second, we provide **quantitative empirical evidence** on gaze vs. hand input in an ISO 9241-9 pointing task (N=69), showing that hand substantially outperforms gaze on throughput and error rate, and that the dominant failure modes are modality-specific: slips (false activations) for gaze and misses (spatial targeting failures) for hand.

**Reason:** Use reproducible N.

**Source:** audit/regenerated_output_manifest.md

---

## REPLACEMENT 14 — Discussion summary

**Section:** Discussion (first paragraph)

**Old text:**
> Across the primary performance measures, hand input outperformed gaze input: hand produced higher throughput (5.15 vs. 4.70 bits/s), lower error (1.75% vs. 18.65%), and shorter movement time (1.09 vs. 1.19 s). The workload pattern paralleled these performance differences. NASA-TLX scores were higher for gaze than hand overall (47.0 vs. 40.4), with especially notable differences in Physical Demand (41.9 vs. 34.3) and Frustration (43.2 vs. 32.2).

**New text:**
> Across the primary performance measures, hand input outperformed gaze input: hand produced higher throughput (5.17 vs. 4.73 bits/s), lower error (1.77% vs. 19.09%), and shorter movement time (1.09 vs. 1.19 s). The workload pattern paralleled these performance differences. NASA-TLX scores were higher for gaze than hand overall (46.4 vs. 38.9), with especially notable differences in Physical Demand (41.1 vs. 33.2) and Frustration (43.6 vs. 31.4).

**Reason:** Match regenerated outputs.

**Source:** docs/assets/case_study/results_at_a_glance.csv, docs/manuscript/assets/tlx_subscales_by_modality.csv

---

## REPLACEMENT 15 — Appendix Fitts table (tbl-fitts)

**Section:** Appendix Fitts' Law Regression

**Old text:**
| Condition | Slope (s/bit) | $R^2$ |
|:----------|:-------------:|:-----:|
| Hand – Static | 0.155 | 0.54 |
| Hand – Adaptive | 0.146 | 0.54 |
| Gaze – Static | 0.179 | 0.35 |
| Gaze – Adaptive | 0.193 | 0.28 |

**New text:**
| Condition | Slope (s/bit) | $R^2$ |
|:----------|:-------------:|:-----:|
| Hand – Static | 0.154 | 0.53 |
| Hand – Adaptive | 0.147 | 0.54 |
| Gaze – Static | 0.177 | 0.35 |
| Gaze – Adaptive | 0.189 | 0.25 |

**Reason:** Use regenerated Fitts slopes from fitts_slopes_by_condition.csv.

**Source:** docs/manuscript/assets/fitts_slopes_by_condition.csv

---

## Table footnote (optional)

For @tbl-performance and @tbl-tlx, consider adding: "N=69 participants with complete 8-block design. Hand: mouse users only; Gaze: mouse and trackpad users."
