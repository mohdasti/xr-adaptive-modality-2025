# Stale Language Sweep

**Date:** 2025-03-07  
**Scope:** docs/manuscript/Manuscript.qmd (excludes CHATGPT prompts, Manuscript.tex compiled output)

---

## Hits

| Section | Exact Phrase | Action | Reason |
|---------|--------------|--------|--------|
| Abstract | N=67 participants | **Replace** | Policy: N=69 |
| Abstract | 5.15 vs. 4.70 bits/s | **Verify** | Regenerated: 5.17 vs 4.73; keep or update |
| Introduction (contributions) | N=67 | **Replace** | Policy: N=69 |
| Participants | N=67 participants with complete 2×2×2 factorial data | **Replace** | Policy: N=69 |
| Participants | The 14 excluded participants either had no usable trial data (n=10) or did not complete all eight condition blocks (n=4) | **Verify** | With N=69: 81−69=12 excluded; update counts |
| Procedure | 4 blocks of 40 trials each (160 trials total per participant) | **Replace** | Design: 8 blocks of 27 trials (216 main trials) |
| Procedure | Pressure (time-limited vs. self-paced) was varied within blocks | **Replace** | Pressure is block-level |
| Results (opening) | N=67 participants with complete factorial data (14,688 valid trials; 7,344 per modality) | **Replace** | N=69; 15,105 trials (13,519 valid per policy) |
| Data Quality Assurance | a bug was identified in the pressure condition logging that affected the first 7 participants (see Participant Exclusions above) | **Keep** | Historical fact; reframe as data-quality note, not current exclusion |
| Discussion (limitations) | the sample comprised N=67 participants | **Replace** | N=69 |
| Discussion (limitations) | seven participants were excluded from the primary factorial analysis because of a pressure-logging bug | **Replace** | Reframe: pressure bug affected early data; current exclusion is 8-block completeness |
| Conclusion | N=67 | **Replace** | N=69 |
| Background | context-driven switching—when and how the system should shift between modalities | **Verify** | Settled: modality-specific adaptive support; consider aligning |

---

## Not Stale (Verified)

| Phrase | Location | Status |
|--------|----------|--------|
| t0 (latent) | Table 4, captions | ✓ Updated in LBA audit |
| non-decision time | LBA section | ✓ Used with latent-scale caveat |
| steeper gaze slope | Discussion, Appendix | ✓ Corrected in Fitts audit |
| 8 blocks | — | ✓ Design constant |
| 27 trials per block | — | ✓ Design constant |

---

## Excluded from Sweep

- Manuscript.tex (compiled; will update on render)
- CHATGPT_DEEP_RESEARCH_PROMPT*.md (internal prompts)
- bootstrap-icons.css (bi-headset is icon name, not manuscript claim)
