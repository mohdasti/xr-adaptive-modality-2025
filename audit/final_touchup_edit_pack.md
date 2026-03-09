# Final Touchup Edit Pack

**Date:** 2025-03-07  
**Purpose:** Minimal edits for release-candidate consistency.  
**Evidence:** audit/stale_language_sweep.md, audit/red_team_review.md, audit/final_policy_harmonization.md

---

## 1. N=67 → N=69 (all instances)

| Location | Old | New |
|----------|-----|-----|
| Abstract | N=67 participants | N=69 participants |
| Introduction (contributions) | (N=67) | (N=69) |
| Participants | N=67 participants with complete 2×2×2 factorial data | N=69 participants with complete 2×2×2 factorial data |
| Participants | The 14 excluded participants either had no usable trial data (n=10) or did not complete all eight condition blocks (n=4) | The 12 excluded participants either had no usable trial data or did not complete all eight condition blocks |
| Results opening | N=67 participants with complete factorial data (14,688 valid trials; 7,344 per modality) | N=69 participants with complete factorial data (15,105 trials after QC and device filter; 13,519 valid for performance metrics) |
| Discussion limitations | the sample comprised N=67 participants | the sample comprised N=69 participants |
| Discussion limitations | seven participants were excluded from the primary factorial analysis because of a pressure-logging bug | a pressure-logging bug affected early data collection; the primary exclusion criterion is 8-block factorial completeness |
| Conclusion | (N=67) | (N=69) |

---

## 2. Procedure — Design description

**Old:**
> During the experiment, they performed 4 blocks of 40 trials each (160 trials total per participant). Practice trials (10 per modality before the main blocks) were excluded from analysis. Target positions cycled through 8 directions; Index of Difficulty varied across three levels ($\approx$2--6 bits). Pressure (time-limited vs. self-paced) was varied within blocks.

**New:**
> During the experiment, they performed 8 blocks of 27 trials each (216 main-task trials per participant before trial-level exclusions). Practice trials were excluded from analysis. Target positions cycled through 8 directions; Index of Difficulty varied across three levels ($\approx$2--6 bits). Pressure (time-limited vs. self-paced) was assigned at the block level.

---

## 3. Data Quality Assurance — Pressure bug

**Old:**
> However, a bug was identified in the pressure condition logging that affected the first 7 participants (see Participant Exclusions above). The bug was fixed immediately, and all subsequent data collection used the corrected logging code.

**New:**
> However, a bug was identified in the pressure condition logging that affected the first 7 participants. The bug was fixed immediately, and all subsequent data collection used the corrected logging code. The primary participant exclusion criterion is 8-block factorial completeness, not the pressure bug.

---

## 4. Abstract — Throughput numbers (optional)

Regenerated: Hand 5.17, Gaze 4.73 bits/s. Manuscript: 5.15, 4.70. If updating N and trial counts, consider updating to 5.17 vs 4.73 for consistency. **Deferred** — user may prefer to keep abstract numbers stable; table values can be updated separately.

---

## 5. Background — context-driven switching (optional)

**Old:**
> Our work differs by investigating *context-driven switching*—when and how the system should shift between modalities based on real-time performance signals—rather than a fixed multimodal combination.

**New:**
> Our work differs by investigating *modality-specific adaptive support*—when and how the system should activate adaptations within each modality based on real-time performance signals—rather than a fixed multimodal combination.

---

## Edits NOT included (per user guardrails)

- LBA t0 section (already updated)
- Adaptive switching in Introduction/RQs/Conclusion (already updated)
- Fitts wording (already updated)
- XR framing (already updated)
- Hand width inflation (already noted as not evaluable)
