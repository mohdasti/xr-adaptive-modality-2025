# Final Output Manifest

**Date:** 2025-03-07  
**Policy:** N=69, 8-block complete, config/manuscript_analysis_policy.yaml

---

## Regenerated Files

| File | Source Script | Policy | Output Changed | Manuscript Section |
|------|---------------|--------|----------------|--------------------|
| docs/manuscript/assets/tlx_subscales_by_modality.csv | compute_manuscript_stats.py | N=69, 8-block | No (already current) | TLX table |
| docs/manuscript/assets/fitts_slopes_by_condition.csv | compute_manuscript_stats.py | N=69, 8-block | No | Appendix Fitts |
| docs/manuscript/assets/width_scaling_check.csv | compute_manuscript_stats.py | N=69, 8-block | No | Appendix |
| docs/assets/case_study/performance_combined.png | export_case_study_assets.R | N=69, 8-block | No | Figure: Primary performance |
| docs/assets/case_study/throughput.png | export_case_study_assets.R | N=69, 8-block | No | — |
| docs/assets/case_study/error_rate.png | export_case_study_assets.R | N=69, 8-block | No | — |
| docs/assets/case_study/movement_time.png | export_case_study_assets.R | N=69, 8-block | No | — |
| docs/assets/case_study/error_type_composition.png | export_case_study_assets.R | N=69, 8-block | No | Figure: Error types |
| docs/assets/case_study/tlx_overall.png | export_case_study_assets.R | N=69, 8-block | No | Figure: TLX |
| docs/assets/case_study/tlx_subscales.png | export_case_study_assets.R | N=69, 8-block | No | Figure: TLX subscales |
| docs/assets/case_study/fitts_validation.png | export_case_study_assets.R | N=69, 8-block | No | Appendix: Fitts |
| docs/assets/case_study/results_at_a_glance.csv | export_case_study_assets.R | N=69, 8-block | No | — |
| docs/assets/case_study/qc_exclusions_summary.csv | export_case_study_assets.R | N=69, 8-block | No | — |
| docs/assets/case_study/lba_t0_forest.png | export_lba_figures.R | LBA params | No | Figure 7 |
| docs/assets/case_study/verification_rt_empirical.png | export_lba_figures.R | **200–5000 ms, 8-block, QC, device** | **Yes** | Figure 8 |

---

## Figure 8 Regeneration

**Before:** 50–5000 ms, practice excluded only, no 8-block filter, no QC/device filter  
**After:** 200–5000 ms (match LBA), 8-block complete, full QC, device filter  

Figure 8 (verification_rt_empirical.png) was regenerated under the final manuscript policy. Condition ordering is expected to remain consistent (Hand < Gaze) but point estimates may differ slightly due to stricter RT bounds and participant filter.
