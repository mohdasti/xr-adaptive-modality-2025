# Section Discipline Changelog

**Date:** 2025-03-07  
**File:** `docs/manuscript/Manuscript.qmd`

---

## 1. Heading alignment

| Location | Old | New | Fix type |
|----------|-----|-----|----------|
| Methods §3.1 | Apparatus and Participants | Apparatus | heading alignment |

---

## 2. Methods/Results boundary

| Location | Old | New | Fix type |
|----------|-----|-----|----------|
| Counterbalancing subsection | (implied blocks = Modality × UI Mode) | each block corresponded to one Modality × UI Mode × Pressure combination (e.g., Hand-Static-Self-Paced, Gaze-Adaptive-Time-Limited). Within each block, all trials shared the same modality, UI mode, and pressure level. | methods/design accuracy |
| Data Quality Assurance | (included "0 mismatches across all participants" and other result-like phrasing) | A post-collection audit verified modality and UI mode logging and identified a pressure-condition logging issue that affected early sessions. The bug was corrected in the codebase; all analyses use the corrected merged dataset. The primary participant exclusion criterion is 8-block factorial completeness. | methods/result boundary |
| LBA Results opening | (included model-fitting, RT window, MCMC setup) | @tbl-lba-params reports group-level LBA parameter estimates… @fig-lba-t0 visualizes… @fig-verification-rt shows… (results-focused; setup remains in Methods) | methods/result boundary |
| Parameter Estimates subsection | (duplicate intro paragraph) | (removed; intro consolidated in LBA section opening) | methods/result boundary |

---

## 3. Interpretive tone

| Location | Old | New | Fix type |
|----------|-----|-----|----------|
| Error Profile (Results 4.2) | This asymmetry **strongly supports** the Midas Touch account | This asymmetry **is consistent with** the Midas Touch account | interpretive tone |

---

## 4. Optional micro-fix

| Location | Old | New | Fix type |
|----------|-----|-----|----------|
| Introduction (contributions paragraph) | The platform **is designed to support** future studies of **context-driven** modality switching | The platform **could support** future studies of modality switching | optional micro-fix |
