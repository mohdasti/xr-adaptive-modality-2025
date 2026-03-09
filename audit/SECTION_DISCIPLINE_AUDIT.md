# Section Discipline Audit

**Date:** 2025-03-07  
**Purpose:** Final surgical cleanup pass to enforce Methods/Results boundary and fix section-discipline issues. No scientific content changes.

---

## 1. Issues Inspected and Resolved

### ISSUE 1 — Heading mismatch in Methods

**Problem:** The subsection heading "Apparatus and Participants" was misleading because the text under that heading described apparatus only; participant information appears in a separate Participants subsection.

**Change:** Renamed "Apparatus and Participants" to "Apparatus".

**Why:** The heading now accurately reflects the content. Methods structure remains intact; no participant text was moved.

**Status:** ✅ Fixed

---

### ISSUE 2 — Counterbalancing wording should match the actual design

**Problem:** The Counterbalancing subsection implied blocks corresponded only to Modality × UI Mode combinations, but the implemented design is 2 × 2 × 2 with pressure assigned at the block level.

**Change:** Revised the sentence to state explicitly that each block corresponds to one Modality × UI Mode × Pressure combination (e.g., Hand-Static-Self-Paced, Gaze-Adaptive-Time-Limited). Added that within each block, all trials shared the same modality, UI mode, and pressure level.

**Why:** The wording now matches the implemented design and avoids reader confusion about what a "block" represents.

**Status:** ✅ Fixed

---

### ISSUE 3 — Data Quality Assurance paragraph is too result-like for Methods

**Problem:** The Data Quality Assurance paragraph included specific audit outcomes such as "0 mismatches across all participants," which reads like a QA result rather than a method description.

**Change:** Rewrote the paragraph to be process-focused: (1) a post-collection audit was performed; (2) modality and UI mode logging was verified; (3) a pressure-condition logging issue was identified and corrected; (4) all analyses use the corrected merged dataset; (5) primary exclusion criterion is 8-block factorial completeness. Removed result-like language ("0 mismatches").

**Why:** Methods should describe what was done and how issues were handled, not report QA findings in a results tone. The pressure-logging issue remains visible as preprocessing/QA context.

**Status:** ✅ Fixed

---

### ISSUE 4 — Results 4.2 (Error Profile) is slightly too interpretive

**Problem:** The sentence "This asymmetry strongly supports the Midas Touch account" was more interpretive than a strict Results sentence should be.

**Change:** Replaced "strongly supports" with "is consistent with."

**Why:** Results should report findings and their consistency with theoretical accounts without overstating support. Stronger interpretation belongs in Discussion.

**Status:** ✅ Fixed

---

### ISSUE 5 — Opening of LBA Results contains too much Methods material

**Problem:** The opening of the LBA Results subsection included model-fitting/setup details (PyMC, RT inclusion range, chain/convergence setup) that belong in Methods.

**Change:** Removed setup language from the LBA Results opening. The opening now starts directly with what @tbl-lba-params, @fig-lba-t0, and @fig-verification-rt show. Model definition, fitting setup, RT window, and LBA choice remain in Methods (Verification-Phase Modeling with LBA). A brief convergence note remains in the Convergence Diagnostics subsection within Results, where it reads naturally as a prerequisite for interpreting the parameter estimates.

**Why:** Results should present findings; Methods should present procedures. The LBA Results section now leads with results rather than re-explaining how the model was fit.

**Status:** ✅ Fixed

---

### ISSUE 6 — Optional micro-fix: future-switching sentence

**Problem:** The sentence "The platform is designed to support future studies of context-driven modality switching" could be slightly cleaner and less prominent.

**Change:** Replaced with "The platform could support future studies of modality switching."

**Why:** Softer wording ("could" vs. "is designed to") reduces overclaiming; "context-driven" was dropped as redundant with modality switching.

**Status:** ✅ Fixed

---

## 2. Issues Left Unchanged (and Why)

- **Abstract:** The abstract retains "strongly supporting the Midas Touch account" per user instruction: "Do NOT change abstract."
- **N, trial counts, table values, figure captions:** Unchanged per guardrails.
- **LBA latent-scale t0 clarification:** Kept intact; no changes to the t0 interpretation.
- **Discussion:** No edits; user specified "Do NOT rewrite Discussion."

---

## 3. Cross-References and Compilation

- Figure and table cross-references (@tbl-lba-params, @fig-lba-t0, @fig-verification-rt, etc.) were verified after edits.
- Manuscript compiles cleanly to PDF via `quarto render docs/manuscript/Manuscript.qmd --to pdf`.

---

## 4. Summary

| Issue | Type | Status |
|-------|------|--------|
| 1. Apparatus heading | Heading alignment | Fixed |
| 2. Counterbalancing | Methods/design accuracy | Fixed |
| 3. Data QA paragraph | Methods/Results boundary | Fixed |
| 4. Midas Touch sentence | Interpretive tone | Fixed |
| 5. LBA Results opening | Methods/Results boundary | Fixed |
| 6. Future-switching sentence | Optional micro-fix | Fixed |
