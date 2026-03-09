# Hand Adaptation (Width Inflation) Audit

**Date:** 2025-03-07  
**Purpose:** Determine whether the hand-adaptive pathway was evaluable in the analyzed dataset.

---

## 1. Files Inspected

| File | Purpose |
|------|---------|
| `docs/ADAPTATION_POLICY_ROOT_CAUSE.md` | Root cause analysis |
| `app/src/lib/policy.ts` | Policy engine, inflate_width action |
| `app/src/components/TaskPane.tsx` | policy:change listener, widthScale state |
| `app/src/components/FittsTask.tsx` | Target rendering, widthScale prop |
| `docs/manuscript/assets/width_scaling_check.csv` | Observed width scaling in data |

---

## 2. Evidence

### 2.1 Width Scaling Check (Data)

**Source:** `docs/manuscript/assets/width_scaling_check.csv`

```
n_scaled_overall,n_total,pct_scaled,n_hand_adapt_p1,n_hand_scaled,n_inflate_actions
0,15105,0.0,1890,0,0
```

- **n_scaled_overall:** 0 — no trials had width_scale_factor ≠ 1.0
- **n_hand_scaled:** 0 — no hand/adaptive trials with scaling
- **n_inflate_actions:** 0 — no adaptation_triggered (or equivalent) in logged data

### 2.2 Root Cause (ADAPTATION_POLICY_ROOT_CAUSE.md)

**Data-backed conclusion:**

- PolicyEngine emitted **243 inflate_width events** across 17 participants (20% of 85)
- 64 participants (75.3%) reached hysteresis threshold (5 consecutive trigger trials)
- **0 events** had reason "Pressure mode not enabled"
- **Width scale in data:** 0% (always 1.0)

**Root cause:** UI integration bug. Policy logic executed correctly; actions were emitted but not applied to rendered targets or logged width_scale_factor.

### 2.3 Implementation Chain

| Component | Status |
|-----------|--------|
| Policy engine triggers | Correct (emitted inflate_width) |
| policy:change event | Unknown (TaskPane listener exists) |
| widthScale state update | Suspected failure (not propagated to FittsTask) |
| FittsTask target rendering | effectiveWidth = W * widthScale; never received >1.0 |
| CSV logging | width_scale_factor always 1.0 |

---

## 3. Answers to Key Questions

| Question | Answer |
|----------|--------|
| Were inflate-width actions emitted? | **Yes** (243 events, 17 participants) |
| Did widthScale ever differ from 1.0 in the analyzed dataset? | **No** |
| Did rendered targets actually change size? | **No** |
| Is the hand-adaptive manipulation validly testable in this dataset? | **No** |

---

## 4. What Can Still Be Claimed

- The platform was designed with hand width-inflation as an adaptive intervention
- The policy engine correctly detected performance degradation and emitted inflate_width actions
- A UI integration bug prevented those actions from affecting rendered targets
- Hand UI-mode effects (static vs adaptive) in this dataset cannot be interpreted as adaptation effectiveness

---

## 5. What Cannot Be Claimed

- That hand width inflation was tested or evaluated
- That hand adaptive mode improved (or failed to improve) performance
- That RQ3 was fully answered for the hand pathway

---

## 6. Manuscript Sections Affected

| Section | Current Status | Recommendation |
|---------|----------------|-----------------|
| Abstract | Already states "Hand width inflation was not evaluable" | Keep |
| Input Modality Implementations | Already states "not evaluable" | Keep |
| RQ3 | "Do adaptive interventions (declutter, width inflation) improve..." | Clarify: only declutter was evaluable |
| Gaze Declutter Effectiveness | Correct | Keep |
| RQ3 Discussion | "RQ3 received only partial support" | Strengthen: hand pathway not evaluable |
| Appendix Adaptive System Manipulation Check | Correct | Keep |
