# LBA Clarity Micro-Update

**Date:** 2025-03-07  
**Purpose:** Targeted explanatory cleanup for broad HCI/CHI audience. No modeling decisions, numbers, or parameter values changed.

---

## Edited Locations

### 1. Methods — Verification-Phase Modeling with LBA

**Function:** Behavioral clarification

**Old wording:**
> In behavioral terms, the model separates the speed/quality of evidence accumulation (drift rate) from response caution (threshold) and residual non-accumulation time ($t_0$).

**New wording:**
> In behavioral terms: **drift rate** reflects how quickly and how well evidence accumulates that the target acquisition is correct; **threshold** reflects how much evidence is required before committing to selection; and **$t_0$** is a verification-related latent offset capturing residual non-accumulation time.

---

### 2. Results — LBA Cognitive Modeling (opening paragraph)

**Function:** Shared-vs-condition-varying clarification

**Old wording:**
> @tbl-lba-params reports group-level LBA parameter estimates by modality and UI mode. The non-decision-time parameter ($t_0$) is the primary parameter that varies across conditions; it is reported on the model's latent scale, not as a raw duration in milliseconds.

**New wording:**
> @tbl-lba-params reports group-level LBA parameter estimates by modality and UI mode. In the fitted model, the primary condition-sensitive parameter was $t_0$; drift base, the ID-related drift slope, and the pressure-related threshold slope were modeled as shared effects and therefore do not vary across modality × UI rows in @tbl-lba-params. The non-decision-time parameter ($t_0$) is reported on the model's latent scale, not as a raw duration in milliseconds.

---

### 3. Results — Interpretation (Difficulty and pressure)

**Function:** General-task-effect interpretation

**Old wording:**
> **Difficulty and pressure:** The negative ID slope (−0.93) is consistent with harder trials reducing drift rate (Fitts's Law). The positive pressure slope (0.06) suggests a speed–accuracy tradeoff: higher time pressure increases the decision threshold.

**New wording:**
> **Difficulty and pressure:** The shared effects capture general task dynamics. The negative ID-related drift slope (−0.93) indicates that greater task difficulty reduces evidence-accumulation efficiency (consistent with Fitts's Law). The positive pressure-related threshold slope (0.06) indicates that time pressure alters response caution—the amount of evidence required before committing—rather than evidence quality. The main modality difference remains concentrated in $t_0$.

---

### 4. Discussion — LBA paragraph

**Function:** Discussion synthesis

**Old wording:**
> Taken together, the LBA results indicate that gaze interaction imposed a verification burden beyond raw target acquisition.

**New wording:**
> Taken together, the LBA results indicate that gaze interaction imposed a verification burden beyond raw target acquisition. Because the condition-varying effect was concentrated in $t_0$, the modality difference in this dataset appears to reflect a verification burden more than a broad change in evidence quality or response caution.

---

## Confirmation

**No numbers or model outputs were changed.** No edits were made to Table 4 (@tbl-lba-params), Figure 7 (@fig-lba-t0), Figure 8 (@fig-verification-rt), or their captions. The latent-scale clarification for $t_0$ was preserved. All edits were explanatory only.
