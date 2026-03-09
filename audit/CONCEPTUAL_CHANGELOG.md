# Conceptual Changelog

**Date:** 2025-03-07  
**Source:** audit/conceptual_edit_pack.md (with user-specified title)

---

## Summary

Applied conceptual-claims audit revisions to align manuscript with implemented design and evidence. No changes to N, block count, trial count, QC wording, or LBA t0 section.

---

## Edits Applied

| Section | Old Claim | New Claim | Evidence Source | Change Type |
|---------|-----------|-----------|-----------------|-------------|
| **Title** | Adaptive Gaze-Hand Switching in XR: Modality-Specific Failure Modes and the Midas Touch Problem | The Midas Touch in Gaze vs. Hand Pointing: Modality-Specific Failure Modes and Implications for XR Interfaces | User-specified; audit/adaptive_switching_audit.md | switching-related |
| **Abstract (opening)** | context-driven adaptive switching between gaze and hand input can improve XR pointing performance | modality-specific adaptive interventions can improve XR-relevant pointing performance | audit/adaptive_switching_audit.md | switching-related |
| **Introduction (platform)** | studying adaptive switching between hand and gaze input in XR | studying modality-specific adaptive support within hand and gaze input in XR-relevant pointing tasks | audit/adaptive_switching_audit.md | switching-related |
| **Introduction (contributions)** | controlled, reproducible study of adaptive gaze–hand switching in XR | controlled, reproducible study of gaze and hand pointing in XR-relevant tasks | audit/adaptive_switching_audit.md | switching-related |
| **Introduction (differentiation)** | context-driven switching—when and how the system should shift between modalities based on real-time performance signals | modality-specific adaptive support—when and how the system should activate adaptations (declutter, width inflation) within each modality based on real-time performance signals. The platform is designed to support future studies of context-driven modality switching. | audit/adaptive_switching_audit.md | switching-related |
| **RQ2** | Can adaptive modality switching reduce "Physical Demand" and "Frustration" (NASA-TLX) compared to traditional interaction? | Can modality-specific adaptive interventions reduce "Physical Demand" and "Frustration" (NASA-TLX) compared to static conditions? | audit/adaptive_switching_audit.md | switching-related |
| **RQ3** | Do adaptive interventions (declutter, width inflation) improve performance and reduce workload relative to non-adaptive conditions? | Do adaptive interventions improve performance and reduce workload relative to static conditions? (In this dataset, only gaze declutter was evaluable; hand width inflation was not applied due to a UI integration bug.) | audit/hand_adaptation_audit.md | adaptation-related |
| **Methods (study design)** | reproducible evaluation of adaptive modality switching under controlled remote testing conditions | reproducible evaluation of modality-specific adaptive interventions under controlled remote testing conditions | audit/adaptive_switching_audit.md | switching-related |
| **Apparatus** | (no explicit proxy statement) | Added: No headset or VR hardware was used; the platform serves as a controlled web-based proxy for XR-relevant selection dynamics. | audit/xr_framing_audit.md | XR-framing-related |
| **Discussion (Fitts)** | the flatter and noisier gaze fits suggest | the steeper and noisier gaze fits suggest | audit/fitts_wording_audit.md, fitts_slopes_by_condition.csv | Fitts-related |
| **Appendix (Fitts)** | Hand conditions showed steeper slopes... The flatter gaze slope is consistent with | Hand conditions showed smaller slopes... The steeper gaze slope suggests | audit/fitts_wording_audit.md, fitts_slopes_by_condition.csv | Fitts-related |
| **Limitations** | (no explicit) | Added Fifth: the study used a desktop web proxy (mouse/trackpad); generalization to headset-based XR with optical hand tracking or hardware eye-tracking requires validation. | audit/xr_framing_audit.md | XR-framing-related |
| **Conclusion (opening)** | framework for studying adaptive modality switching in XR | framework for studying gaze and hand pointing and modality-specific adaptive interventions in XR-relevant tasks | audit/adaptive_switching_audit.md | switching-related |

---

## Guardrails Observed

- **N, block count, trial count, QC wording:** Not modified
- **LBA t0 section:** Not modified
- **"Adaptive switching":** Removed; replaced with modality-specific adaptive support / interventions
- **Web-based proxy framing:** Preserved and strengthened (Apparatus, Limitations)
