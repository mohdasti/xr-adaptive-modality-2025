# Trial Count Audit: 27 vs 40 per Block

## Summary

**Manuscript says:** "4 blocks of 40 trials each (160 trials total per participant)"

**Code default:** 27 trials per block (3 IDs × 3 trials × 3 task types from `generateTrialSequence`)

**Observed data:** Median 27, range 27–54 trials per block

---

## 1. Default Intended Trials per Block (from Code)

**Source:** `app/src/lib/fitts.ts` + `app/src/components/TaskPane.tsx`

```typescript
// TaskPane.tsx line 57-58
const [nTrialsPerID, setNTrialsPerID] = useState(3)
const [selectedIDs, setSelectedIDs] = useState<string[]>(['low', 'medium', 'high'])

// generateTrialSequence: for each config (3), add 3 point + 3×2 drag = 9 per config
// Total: 3 × 9 = 27
```

**Default:** 27 trials per block.

---

## 2. Observed Distribution in Data

**Source:** `data/clean/trial_data.csv`

| Metric | Value |
|--------|-------|
| Min trials per block | 27 |
| Max trials per block | 54 |
| Median | 27 |
| Mode | 27 |

Participants can change `nTrialsPerID` or `selectedIDs` in the UI (dev mode or if exposed), yielding up to 54 (e.g. 3×6×3 or 6×3×3).

---

## 3. Origin of "40 Trials"

**Source:** `docs/methods_detail.md` line 3

> "Each block includes 40 trials (10 per ID), yielding ~160 trials per participant."

**Verdict:** The "40 trials" and "4 blocks" come from an **older design** documented in `methods_detail.md`. That design was:
- 4 blocks (not 8)
- 40 trials per block (10 per ID × 4 IDs, or 10 per ID × 2 IDs × 2, etc.)
- 160 trials total

The current codebase uses an 8-block, 27-trial-per-block design. The manuscript Procedure section was not updated when the design changed.

---

## 4. Recommendation

- **Intended default:** Report "27 trials per block" (or "approximately 27").
- **Observed:** Report "median 27 trials per block (range 27–54)" if desired.
- **Total:** "8 blocks × 27 trials = 216 main-task trials per complete participant" (or "approximately 216").
- **Remove** "40" and "160" as outdated.
