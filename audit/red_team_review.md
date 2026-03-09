# Red Team Review

**Date:** 2025-03-07  
**Scope:** Near-final manuscript (Manuscript.qmd)

---

## 1. Top 5 Reviewer Vulnerabilities

1. **Sample-size inconsistency:** Manuscript states N=67; policy and pipeline yield N=69. Reviewers may question exclusion logic.
2. **Design description mismatch:** Procedure says "4 blocks of 40 trials (160 total)" and "pressure varied within blocks"; actual design is 8 blocks of 27 trials (216 main), pressure block-level.
3. **LBA t0 scale:** Risk of interpreting t0 as milliseconds. Mitigated by LBA audit edits (latent-scale language).
4. **Adaptive switching vs. modality-specific support:** Background still uses "context-driven switching" and "shift between modalities"; rest of manuscript uses modality-specific adaptive support. Inconsistent framing.
5. **Pressure-bug exclusion framing:** "7 participants excluded for pressure bug" implies current exclusion; policy says exclusion is 8-block completeness. Could confuse reviewers.

---

## 2. Already Fixed

| Vulnerability | Fix |
|---------------|-----|
| LBA t0 as ms | LBA audit: latent-scale language, t0 (latent) label |
| Fitts slope wording | CONCEPTUAL_CHANGELOG: steeper gaze, smaller hand slopes |
| XR overclaim | Apparatus: web-based proxy; Limitations: generalization caveat |
| Adaptive switching | Introduction, RQs, Conclusion: modality-specific adaptive support |
| Hand width inflation | Explicitly "not evaluable" throughout |

---

## 3. Still Remain

| Vulnerability | Severity | Section |
|---------------|----------|---------|
| N=67 vs N=69 | High | Abstract, Introduction, Participants, Results, Discussion, Conclusion |
| 4 blocks / 40 trials / 160 trials | High | Procedure |
| Pressure varied within blocks | Medium | Procedure |
| 14 excluded (n=10, n=4) | Medium | Participants |
| Pressure-bug as current exclusion | Medium | Data QA, Limitations |
| context-driven switching (Background) | Low | Background |
| Trial counts (14,688 valid) | Medium | Results |

---

## 4. Exact Text-Level Recommendations

### 4.1 N=69 (all instances)

Replace "N=67" with "N=69" in: Abstract, Introduction (contributions), Participants, Results opening, Discussion limitations, Conclusion.

### 4.2 Procedure

**Old:** "During the experiment, they performed 4 blocks of 40 trials each (160 trials total per participant). Practice trials (10 per modality before the main blocks) were excluded from analysis. Target positions cycled through 8 directions; Index of Difficulty varied across three levels ($\approx$2--6 bits). Pressure (time-limited vs. self-paced) was varied within blocks."

**New:** "During the experiment, they performed 8 blocks of 27 trials each (216 main-task trials per participant before trial-level exclusions). Practice trials were excluded from analysis. Target positions cycled through 8 directions; Index of Difficulty varied across three levels ($\approx$2--6 bits). Pressure (time-limited vs. self-paced) was assigned at the block level."

### 4.3 Participants exclusion

**Old:** "The 14 excluded participants either had no usable trial data (n=10) or did not complete all eight condition blocks (n=4)."

**New:** "The 12 excluded participants either had no usable trial data or did not complete all eight condition blocks."

(Verify 12 from 81−69; adjust n=10/n=4 if audit provides exact breakdown.)

### 4.4 Results trial count

**Old:** "14,688 valid trials; 7,344 per modality"

**New:** "15,105 trials after QC and device filter (13,519 valid for performance metrics; 7,428 hand, 6,091 gaze)" — or simplify to "15,105 trials (13,519 valid for throughput, error rate, movement time)."

### 4.5 Pressure-bug framing

**Data QA:** Keep as historical: "a bug was identified in the pressure condition logging that affected the first 7 participants. The bug was fixed immediately." Remove "see Participant Exclusions above" if that implies pressure bug drives current N.

**Limitations:** Replace "seven participants were excluded from the primary factorial analysis because of a pressure-logging bug" with "a pressure-logging bug affected early data collection; the primary exclusion criterion is 8-block factorial completeness."

### 4.6 Background (optional)

**Old:** "Our work differs by investigating *context-driven switching*—when and how the system should shift between modalities based on real-time performance signals"

**New:** "Our work differs by investigating *modality-specific adaptive support*—when and how the system should activate adaptations within each modality based on real-time performance signals"

---

## 5. Overall Readiness Verdict

**Verdict:** **Ready with minor edits**

The manuscript is conceptually sound and the analysis pipeline is harmonized. The remaining issues are primarily consistency edits (N, design description, exclusion framing). Once the stale-language fixes are applied, the manuscript is suitable for **advisor/internal review**. For submission, ensure all numbers match regenerated outputs and the exclusion narrative is clear.
