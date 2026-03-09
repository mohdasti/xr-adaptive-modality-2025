# Regenerated Output Manifest

**Date:** 2025-03-07  
**Policy:** audit/manuscript_analysis_policy.md (8-block-complete primary sample, N=69)

---

## Regenerated Files

| File | Source Script | Input Population | Notes |
|------|---------------|------------------|-------|
| docs/manuscript/assets/tlx_subscales_by_modality.csv | compute_manuscript_stats.py | N=69, 8-block | TLX subscale means by modality |
| docs/manuscript/assets/fitts_slopes_by_condition.csv | compute_manuscript_stats.py | N=69, 8-block | Fitts regression slopes |
| docs/manuscript/assets/width_scaling_check.csv | compute_manuscript_stats.py | N=69, 8-block | Width inflation check |
| docs/assets/case_study/performance_combined.png | export_case_study_assets.R | N=69, 8-block | TP + Error rate figure |
| docs/assets/case_study/throughput.png | export_case_study_assets.R | N=69, 8-block | TP only |
| docs/assets/case_study/error_rate.png | export_case_study_assets.R | N=69, 8-block | Error rate only |
| docs/assets/case_study/movement_time.png | export_case_study_assets.R | N=69, 8-block | MT figure |
| docs/assets/case_study/error_type_composition.png | export_case_study_assets.R | N=69, 8-block | Error type bars |
| docs/assets/case_study/tlx_overall.png | export_case_study_assets.R | N=69, 8-block | TLX overall |
| docs/assets/case_study/tlx_subscales.png | export_case_study_assets.R | N=69, 8-block | TLX subscales |
| docs/assets/case_study/fitts_validation.png | export_case_study_assets.R | N=69, 8-block | Fitts MT vs IDe |
| docs/assets/case_study/results_at_a_glance.csv | export_case_study_assets.R | N=69, 8-block | Summary table |
| docs/assets/case_study/qc_exclusions_summary.csv | export_case_study_assets.R | N=69, 8-block | QC exclusion counts |
| audit/analysis_population_counts.csv | compute_analysis_populations.py | Populations A, B, C | Count comparison |

---

## Final Counts (from regenerated outputs)

- **Primary N:** 69
- **Total trials (QC+device+8block):** 15,105
- **Valid trials (correct, 150–6000 ms):** 13,519 (7,428 hand, 6,091 gaze)
- **TLX:** Hand 38.92 [35.30, 42.54], Gaze 46.38 [42.77, 49.99], N=69 each
- **Throughput:** Hand 5.17 [5.06, 5.27], Gaze 4.73 [4.58, 4.88] bits/s
- **Error rate:** Hand 1.77%, Gaze 19.09%
- **Movement time:** Hand 1.09 s, Gaze 1.19 s
