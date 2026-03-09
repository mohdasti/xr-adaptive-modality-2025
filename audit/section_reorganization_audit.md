# Section Reorganization Audit

**Date:** 2025-03-07  
**Purpose:** CHI/HCI-style empirical paper structure

---

## Old Structure

1. Introduction
2. Background and Related Work
3. Research Objectives (standalone)
4. Theoretical Framework (standalone)
5. Methods
6. Results
7. Discussion
8. Conclusion
9. Code and Materials Availability
10. Acknowledgments
11. Appendix

---

## New Structure

1. Introduction (with RQs at end)
2. Background and Related Work
3. Methods
4. Results
5. Discussion
6. Conclusion
7. Code and Materials Availability
8. Acknowledgments
9. Appendix

---

## Section Moves and Redistributions

| Content | Old Location | New Location | Reason |
|---------|--------------|--------------|--------|
| RQ1, RQ2, RQ3 | Research Objectives (§3) | Introduction (final paragraph) | CHI convention: RQs at end of Intro |
| Research Objectives section | Top-level §3 | Removed | Eliminated standalone section |
| Fitts's Law (ID, MT, W_e, TP) | Theoretical Framework | Methods §3.6.1 Throughput and Fitts-Style Performance Metrics | Defines measurement; belongs in Methods |
| LBA model explanation | Theoretical Framework | Methods §3.6.2 Verification-Phase Modeling with LBA | Part of analysis pipeline |
| Control theory / submovement | Theoretical Framework | Methods §3.6.1 (brief mention) | Part of analysis pipeline |
| Theoretical Framework section | Top-level §4 | Removed | Content redistributed |
| Methods | §5 | §3 | CHI convention: Methods early |
| Results | §6 | §4 | Follows Methods |
| Discussion | §7 | §5 | Follows Results |
| Conclusion | §8 | §6 | Follows Discussion |

---

## Background Subsection Renames

| Old | New |
|-----|-----|
| The Sensorimotor Implications of Spatial Input | Sensorimotor Implications of Hand and Gaze Input |
| Signal Processing and Cognitive Load Theory | Signal Processing and Cognitive Load Framing |
| (paragraph under Adaptive) Differentiation from prior gaze+hand work | Differentiation from Prior Gaze+Hand Work (new §2.4) |

---

## Internal References Updated

| Reference | Change |
|-----------|--------|
| "Figure 8" in LBA Interpretation | → @fig-verification-rt (cross-reference) |
| "see @fig-psychophysics in Methods" | Unchanged (Methods is still the section name) |

---

## Remaining Structure Notes

- Participants remains a separate Methods subsection (## Participants); could be merged into Apparatus and Participants per some CHI papers, but current structure is acceptable.
- Measures and Analysis Strategy now has two subsections: 3.6.1 Throughput and Fitts-Style Performance Metrics, 3.6.2 Verification-Phase Modeling with LBA.
- No orphaned paragraphs; all content preserved.
