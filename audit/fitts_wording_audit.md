# Fitts Slope Wording Audit

**Date:** 2025-03-07  
**Purpose:** Verify Fitts slope interpretation and correct any inverted wording.

---

## 1. Verified Slope Values

**Source:** `docs/manuscript/assets/fitts_slopes_by_condition.csv`

| Condition | Slope (s/bit) | R² |
|-----------|---------------|-----|
| Hand – Static | 0.154 | 0.53 |
| Hand – Adaptive | 0.147 | 0.54 |
| Gaze – Static | 0.177 | 0.35 |
| Gaze – Adaptive | 0.189 | 0.25 |

**Conclusion:** Hand slopes (0.15–0.16) are **smaller** than gaze slopes (0.18–0.19).

---

## 2. Fitts Law Interpretation

- **MT = a + b × ID**

- **Slope b** = rate of information processing; higher b = more delay per additional bit

- **Smaller slope** = lower movement-time cost per bit = more efficient scaling = higher throughput

- **Larger slope** = higher movement-time cost per bit = less efficient scaling

**Correct interpretation:**
- Hand has **smaller** (flatter) slopes → more efficient
- Gaze has **larger** (steeper) slopes → less efficient

---

## 3. Manuscript Error

**Appendix Fitts paragraph (line ~374):**

> "Hand conditions showed steeper slopes (0.15–0.16 s/bit) and higher $R^2$ (0.54) than gaze (slopes 0.18–0.19 s/bit, $R^2$ 0.28–0.35). The flatter gaze slope is consistent with the ballistic nature of saccadic movement..."

**Problem:** Hand has the **smaller** slopes; gaze has the **larger** slopes. The manuscript inverts both:
- "Hand... steeper slopes" → **Wrong** (hand has smaller slopes)
- "The flatter gaze slope" → **Wrong** (gaze has larger/steeper slopes)

---

## 4. Correct Wording

**Replace with:**

> "Hand conditions showed smaller slopes (0.15–0.16 s/bit) and higher $R^2$ (0.54) than gaze (slopes 0.18–0.19 s/bit, $R^2$ 0.28–0.35). The steeper gaze slope suggests that difficulty primarily affects the verification phase rather than the initial ballistic phase, aligning with the LBA NDT findings."

---

## 5. Discussion Paragraph (line ~328)

**Current:** "the flatter and noisier gaze fits"

**Issue:** "Flatter" is wrong for slope (gaze has steeper slope). "Noisier" (lower R²) is correct.

**Replace with:** "the steeper and noisier gaze fits" or "the weaker gaze fits (steeper slope, lower R²)"

---

## 6. All Locations Needing Wording Changes

| Location | Old | New |
|----------|-----|-----|
| Appendix Fitts paragraph | "Hand conditions showed steeper slopes" | "Hand conditions showed smaller slopes" |
| Appendix Fitts paragraph | "The flatter gaze slope" | "The steeper gaze slope" |
| Discussion (line ~328) | "the flatter and noisier gaze fits" | "the steeper and noisier gaze fits" |
