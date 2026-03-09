# Final Micro-Polish Audit

**Date:** 2025-03-07  
**Purpose:** Ultra-minimal polish pass before arXiv upload. No scientific, statistical, or structural changes.

---

## Issue 1 — Fitts slope wording in Methods

**Problem:** The slope $b$ was described as "represents the rate of information processing," which is not ideal; slope $b$ = movement-time cost per bit; information-processing rate is more closely related to 1/$b$.

**Old wording:** Movement time is modeled as $MT = a + b \cdot ID$, where the slope $b$ represents the rate of information processing.

**New wording:** Movement time is modeled as $MT = a + b \cdot ID$. The slope $b$ represents the movement-time cost per additional bit of difficulty; correspondingly, smaller slopes imply higher information-processing efficiency.

**Status:** ✅ Changed

---

## Issue 2 — Future-work sentence in Methods

**Problem:** "Advanced gaze adaptations such as goal-aware snapping and dynamic dwell time adjustment are planned for future implementations" does not belong in Methods.

**Old wording:** The declutter effect persists until performance improves, using hysteresis to prevent rapid oscillation. Advanced gaze adaptations such as goal-aware snapping and dynamic dwell time adjustment are planned for future implementations.

**New wording:** The declutter effect persists until performance improves, using hysteresis to prevent rapid oscillation.

**Status:** ✅ Removed (future-work sentence deleted; no replacement)

---

## Issue 3 — Gaze simulation heading

**Problem:** "Gaze Simulation (The 'Ground Truth' Signal)" is too strong for a proxy-based signal.

**Old heading:** ### Gaze Simulation (The "Ground Truth" Signal)

**New heading:** ### Gaze Simulation

**Status:** ✅ Changed (simpler option)

---

## Issue 4 — Lingering adaptation terminology

**Problem:** Phrases such as "adaptive modality logic" and "adaptive modality policies" sound older than the final manuscript terminology.

**Changes made:**

| Location | Old | New |
|----------|-----|-----|
| Introduction (central question) | adaptive modality logic | modality-specific adaptive support |
| Introduction (contributions) | adaptive modality policies | modality-specific adaptive interventions |
| Discussion | policy-driven adaptive modality logic | policy-driven modality-specific adaptive interventions |

**Status:** ✅ Changed (3 instances)

---

## Issue 5 — Abstract phrase

**Problem:** "strongly supporting the Midas Touch account" is slightly stronger than necessary for a final results summary.

**Old wording:** …whereas hand errors were predominantly misses (95.7%), strongly supporting the Midas Touch account.

**New wording:** …whereas hand errors were predominantly misses (95.7%), consistent with the Midas Touch account.

**Status:** ✅ Changed

---

## Not changed (per guardrails)

- N, trial counts, Results values, tables, figures, captions
- Title, section organization
- LBA wording
- Appendix Fitts table caption ("Slope = rate of information processing") — left as-is; user specified no caption changes unless required by heading rename

---

## Confirmation

**No other manuscript content was modified.** Only the five issues above were addressed. The manuscript compiles cleanly to PDF.
