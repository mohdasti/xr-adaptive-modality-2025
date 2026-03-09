# Conceptual Edit Pack

**Date:** 2025-03-07  
**Purpose:** Exact replacement text for conceptual overclaims (switching, adaptation, Fitts, XR framing).

---

## 1. TITLE

**Old:** Adaptive Gaze-Hand Switching in XR: Modality-Specific Failure Modes and the Midas Touch Problem

**New:** Gaze vs. Hand in XR-Relevant Pointing: Modality-Specific Failure Modes and the Midas Touch Problem

**Reason:** No true modality switching was demonstrated; only modality-specific adaptive interventions within fixed-modality blocks.

**Source:** audit/adaptive_switching_audit.md

---

## 2. ABSTRACT (opening)

**Old:** We introduce the xr-adaptive-modality-2025 platform, a web-based open-source framework for studying whether context-driven adaptive switching between gaze and hand input can improve XR pointing performance and reduce workload relative to static unimodal interaction.

**New:** We introduce the xr-adaptive-modality-2025 platform, a web-based open-source framework for studying whether modality-specific adaptive interventions can improve XR-relevant pointing performance and reduce workload relative to static unimodal interaction.

**Reason:** No switching demonstrated; only modality-specific adaptations (declutter, width inflation) within fixed-modality blocks.

**Source:** audit/adaptive_switching_audit.md

---

## 3. INTRODUCTION (platform paragraph)

**Old:** We introduce the xr-adaptive-modality-2025 platform, a research framework for studying adaptive switching between hand and gaze input in XR.

**New:** We introduce the xr-adaptive-modality-2025 platform, a research framework for studying modality-specific adaptive support within hand and gaze input in XR-relevant pointing tasks.

**Reason:** Align with implemented design.

**Source:** audit/adaptive_switching_audit.md

---

## 4. INTRODUCTION (contributions paragraph)

**Old:** First, we present an **open-source platform** for controlled, reproducible study of adaptive gaze–hand switching in XR, including a physiologically informed gaze simulation, a policy-driven adaptation engine, and a full remote data collection infrastructure.

**New:** First, we present an **open-source platform** for controlled, reproducible study of gaze and hand pointing in XR-relevant tasks, including a physiologically informed gaze simulation, a policy-driven adaptation engine, and a full remote data collection infrastructure.

**Reason:** Remove "switching" overclaim.

**Source:** audit/adaptive_switching_audit.md

---

## 5. INTRODUCTION (contributions — differentiation)

**Old:** Unlike prior gaze+hand paradigms that treat the two modalities as complementary components of a fixed multimodal combination (e.g., gaze for acquisition + hand for confirmation [@jacob1990eye]), this work investigates *context-driven switching*—when and how the system should shift between modalities based on real-time performance signals.

**New:** Unlike prior gaze+hand paradigms that treat the two modalities as complementary components of a fixed multimodal combination (e.g., gaze for acquisition + hand for confirmation [@jacob1990eye]), this work investigates *modality-specific adaptive support*—when and how the system should activate adaptations (declutter, width inflation) within each modality based on real-time performance signals. The platform is designed to support future studies of context-driven modality switching.

**Reason:** Current study did not implement or test modality switching.

**Source:** audit/adaptive_switching_audit.md

---

## 6. RQ2

**Old:** Can adaptive modality switching reduce "Physical Demand" and "Frustration" (NASA-TLX) compared to traditional interaction?

**New:** Can modality-specific adaptive interventions reduce "Physical Demand" and "Frustration" (NASA-TLX) compared to static conditions?

**Reason:** No switching; only adaptations within modality.

**Source:** audit/adaptive_switching_audit.md

---

## 7. RQ3

**Old:** Do adaptive interventions (declutter, width inflation) improve performance and reduce workload relative to non-adaptive conditions?

**New:** Do adaptive interventions improve performance and reduce workload relative to static conditions? (In this dataset, only gaze declutter was evaluable; hand width inflation was not applied due to a UI integration bug.)

**Reason:** Clarify that only gaze pathway was tested.

**Source:** audit/hand_adaptation_audit.md

---

## 8. METHODS (study design)

**Old:** The study was designed to support reproducible evaluation of adaptive modality switching under controlled remote testing conditions.

**New:** The study was designed to support reproducible evaluation of modality-specific adaptive interventions under controlled remote testing conditions.

**Reason:** Align with implemented design.

**Source:** audit/adaptive_switching_audit.md

---

## 9. APPENDIX — Fitts interpretation

**Old:** Hand conditions showed steeper slopes (0.15–0.16 s/bit) and higher $R^2$ (0.54) than gaze (slopes 0.18–0.19 s/bit, $R^2$ 0.28–0.35). The flatter gaze slope is consistent with the ballistic nature of saccadic movement: difficulty primarily affects the verification phase rather than the initial ballistic phase, aligning with the LBA NDT findings.

**New:** Hand conditions showed smaller slopes (0.15–0.16 s/bit) and higher $R^2$ (0.54) than gaze (slopes 0.18–0.19 s/bit, $R^2$ 0.28–0.35). The steeper gaze slope suggests that difficulty primarily affects the verification phase rather than the initial ballistic phase, aligning with the LBA NDT findings.

**Reason:** Hand has smaller slopes (more efficient); gaze has larger slopes (steeper). Manuscript had it inverted.

**Source:** audit/fitts_wording_audit.md, fitts_slopes_by_condition.csv

---

## 10. DISCUSSION (Fitts paragraph)

**Old:** The appendix-level Fitts validation supports this interpretation: hand showed stronger fits and more stable scaling with index of difficulty, whereas gaze exhibited weaker fits and lower explained variance. Although both modalities were affected by task difficulty, the flatter and noisier gaze fits suggest that its performance was shaped by more than ballistic movement alone.

**New:** The appendix-level Fitts validation supports this interpretation: hand showed stronger fits and more stable scaling with index of difficulty, whereas gaze exhibited weaker fits and lower explained variance. Although both modalities were affected by task difficulty, the steeper and noisier gaze fits suggest that its performance was shaped by more than ballistic movement alone.

**Reason:** Gaze has steeper (larger) slope, not flatter.

**Source:** audit/fitts_wording_audit.md

---

## 11. APPARATUS (XR proxy clarification)

**Old:** We developed a custom pointing testbed as a web-based application (React 18, TypeScript), allowing broad hardware compatibility for remote participants. The study was conducted on participants' own computers using a standard mouse or trackpad.

**New:** We developed a custom pointing testbed as a web-based application (React 18, TypeScript), allowing broad hardware compatibility for remote participants. The study was conducted on participants' own computers using a standard mouse or trackpad. No headset or VR hardware was used; the platform serves as a controlled web-based proxy for XR-relevant selection dynamics.

**Reason:** Clarify desktop proxy; avoid implying direct XR hardware testing.

**Source:** audit/xr_framing_audit.md

---

## 12. LIMITATIONS (XR generalization)

**Old:** (No explicit sentence on XR proxy limitation)

**New:** Add after the gaze simulation limitation: "Fifth, the study used a desktop web proxy (mouse/trackpad); generalization to headset-based XR with optical hand tracking or hardware eye-tracking requires validation."

**Reason:** Explicit limitation on XR generalization.

**Source:** audit/xr_framing_audit.md

---

## 13. CONCLUSION (opening)

**Old:** This paper introduced the xr-adaptive-modality-2025 platform as a rigorous and reproducible framework for studying adaptive modality switching in XR.

**New:** This paper introduced the xr-adaptive-modality-2025 platform as a rigorous and reproducible framework for studying gaze and hand pointing and modality-specific adaptive interventions in XR-relevant tasks.

**Reason:** Remove "switching" overclaim.

**Source:** audit/adaptive_switching_audit.md
