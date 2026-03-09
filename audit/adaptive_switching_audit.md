# Adaptive Switching Audit

**Date:** 2025-03-07  
**Purpose:** Determine whether the manuscript overclaims "adaptive switching" vs. what the code/data actually demonstrate.

---

## 1. Files Inspected

| File | Purpose |
|------|---------|
| `app/src/experiment/counterbalance.ts` | Block sequence, condition codes |
| `app/src/components/TaskPane.tsx` | Block setup, modality assignment |
| `app/src/lib/policy.ts` | Policy engine, adaptation triggers |
| `docs/manuscript/Manuscript.qmd` | Title, abstract, intro, contributions |

---

## 2. Evidence

### 2.1 Modality Assignment

**Source:** `counterbalance.ts` lines 11–27, 39–47

- Design: 8 conditions (HaS_P0, GaS_P0, HaA_P1, etc.)
- Each block = one fixed condition
- Modality is encoded in condition code: `H` = hand, `G` = gaze
- Williams design predetermines block order; no runtime modality decision

### 2.2 Block Setup Logic

**Source:** `TaskPane.tsx` lines 404–471

```typescript
const currentCond = blockSequence[blockNumber - 1]
const { modality: targetModality, uiMode: targetUiMode, pressure: targetPressure } = parseConditionCode(currentCond)
// ...
if (modalityConfig.modality !== targetModality) {
  bus.emit('modality:change', { config: { modality: targetModality, ... } })
}
```

- Modality changes **only when a new block starts**
- Change is driven by the predetermined block sequence, not by performance
- No logic switches modality mid-block or mid-trial

### 2.3 Policy Engine

**Source:** `policy.ts` lines 340–410

- Policy engine has separate configs for `gaze` (declutter) and `hand` (inflate_width)
- Triggers are computed **per modality** from `modalityHistory`
- When triggered: gaze → declutter HUD; hand → inflate target width
- **No modality switch:** policy only triggers modality-specific UI adaptations within the current modality

### 2.4 What "Adaptation" Actually Does

| Modality | Adaptation | Effect |
|----------|------------|--------|
| Gaze | Declutter | Hides HUD elements when performance degrades |
| Hand | Inflate width | Would expand targets (not evaluable in dataset) |

Neither adaptation changes the active modality. Modality is fixed per block.

---

## 3. Answers to Key Questions

| Question | Answer |
|----------|--------|
| Is modality fixed by block in the analyzed dataset? | **Yes** |
| Can the active modality change automatically online? | **No** — only at block boundaries, and only per predetermined schedule |
| Are there any actual gaze→hand or hand→gaze switch events? | **No** — block transitions are scheduled, not performance-driven |
| If not, is "adaptive switching" an overclaim? | **Yes** — the study did not demonstrate context-driven modality switching |

---

## 4. Verdict

**The manuscript overclaims "adaptive switching."**

What was implemented and analyzed:
- **Modality-specific adaptive interventions** within fixed-modality blocks (declutter for gaze, width inflation for hand)
- **Block-level modality assignment** via Williams counterbalancing (predetermined, not performance-driven)

What was NOT implemented or analyzed:
- True online switching between hand and gaze during a trial or within a block
- Automatic modality changes based on real-time performance signals

---

## 5. Recommended Terminology

| Avoid | Use Instead |
|-------|-------------|
| Adaptive gaze-hand switching | Modality-specific adaptive support / adaptive interventions within gaze and hand |
| Context-driven switching | Context-driven adaptation (within modality) |
| When and how the system should shift between modalities | When and how modality-specific adaptations should activate |
| Adaptive modality switching | Adaptive interventions (declutter, width inflation) |

---

## 6. Manuscript Sections Affected

| Section | Issue |
|---------|-------|
| **Title** | "Adaptive Gaze-Hand Switching" implies switching was demonstrated |
| **Abstract** | "context-driven adaptive switching between gaze and hand input" |
| **Introduction** | "adaptive switching between hand and gaze input" |
| **Contributions** | "adaptive gaze–hand switching," "context-driven switching" |
| **Differentiation paragraph** | "context-driven switching—when and how the system should shift between modalities" |
| **RQ2** | "adaptive modality switching" |
| **Methods** | "adaptive modality switching" |
| **Conclusion** | "adaptive modality switching" |
