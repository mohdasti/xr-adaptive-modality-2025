# Final Changelog

**Date:** 2025-03-07  
**Scope:** Release-candidate consistency audit — policy, wording, exclusion framing

---

## Summary

Applied final touchup edits from audit/final_touchup_edit_pack.md. All edits were policy-related or wording-related to align the manuscript with the 8-block-complete primary sample (N=69) and the correct design description.

---

## Edits Applied

| Section | Change | Type | Evidence |
|---------|--------|------|----------|
| Abstract | N=67 → N=69 | Policy | manuscript_analysis_policy.md |
| Introduction (contributions) | N=67 → N=69 | Policy | manuscript_analysis_policy.md |
| Participants | N=67 → N=69; 14→12 excluded; removed n=10, n=4 | Policy | analysis_population_counts.csv |
| Participants | "did not complete all eight condition blocks" | Wording | — |
| Procedure | 4 blocks×40 trials (160) → 8 blocks×27 trials (216) | Policy | manuscript_analysis_policy.yaml |
| Procedure | "Practice trials (10 per modality...)" → "Practice trials were excluded" | Wording | — |
| Procedure | "Pressure was varied within blocks" → "Pressure was assigned at the block level" | Policy | manuscript_analysis_policy.md |
| Data Quality Assurance | Removed "see Participant Exclusions above"; added exclusion criterion clarification | Wording | red_team_review.md |
| Results opening | N=67 → N=69; 14,688→15,105 trials; 13,519 valid | Policy | results_at_a_glance.csv, analysis_population_counts |
| Discussion limitations | N=67 → N=69 | Policy | — |
| Discussion limitations | "seven participants excluded for pressure bug" → "pressure bug affected early data; primary exclusion is 8-block completeness" | Wording | manuscript_analysis_policy.md |
| Conclusion | N=67 → N=69 | Policy | — |
| Background | "context-driven switching" / "shift between modalities" → "modality-specific adaptive support" / "activate adaptations within each modality" | Wording | CONCEPTUAL_CHANGELOG, consistency |

---

## Script Changes (Not Manuscript)

| File | Change | Type |
|------|--------|------|
| scripts/export_lba_figures.R | Figure 8: 50→200 ms lower bound; added 8-block, QC, device filter | Policy |
| audit/final_policy_harmonization.md | Created | Audit |
| audit/final_output_manifest.md | Created | Audit |
| audit/stale_language_sweep.md | Created | Audit |
| audit/compile_QA.md | Created | Audit |
| audit/red_team_review.md | Created | Audit |
| audit/final_touchup_edit_pack.md | Created | Audit |

---

## Regenerated Outputs

- docs/assets/case_study/verification_rt_empirical.png (Figure 8) — under 200–5000 ms, 8-block, QC, device filter

---

## Guardrails Observed

- Did not reopen: LBA t0, adaptive switching framing (Introduction/RQs/Conclusion), Fitts wording, XR framing, hand width inflation
- Did not change: Abstract throughput numbers (5.15 vs 4.70) — user may update separately if desired
- Did not re-run LBA model — policy mismatch documented; empirical Figure 8 now aligned
