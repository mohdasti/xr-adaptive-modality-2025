# Analysis Plan

Complete specification of formulas, equivalence criteria, and expected ranges for all metrics.

## Overview

This document provides exact formulas for all computed metrics, primary and secondary equivalence criteria, and expected ranges for sanity checks during analysis.

---

## 1. ISO 9241-9 Effective Metrics

### Effective Width (We)

**Formula:**
```
We = 4.133 × SDx
```

Where:
- `SDx` = standard deviation of endpoint errors (radial distance from target center) in pixels
- `4.133` = constant for 96% hit rate (ISO 9241-9 standard)

**Computation:**
- Group by: `participant_id × modality × ui_mode × target_amplitude_px × target_width_px`
- Filter: Valid trials only (RT ≥ 150ms, RT ≤ 5000ms, no timeout, no error)
- Compute `SDx` from `endpoint_error_px` values
- Apply formula to get `We` in pixels

**Expected Range:**
- Hand: 20–60 px (typically 30–45 px)
- Gaze-confirm: 25–80 px (typically 40–60 px)
- Values < 10 px or > 100 px should be flagged for review

### Effective Index of Difficulty (IDe)

**Formula:**
```
IDe = log₂(A / We + 1)
```

Where:
- `A` = target amplitude (distance from start to target center) in pixels
- `We` = effective width (computed above) in pixels
- Base-2 logarithm (Shannon formulation)

**Computation:**
- Use `target_amplitude_px` (or `A`) for amplitude
- Use computed `We` from above
- Compute per condition group

**Expected Range:**
- Low difficulty (A=200, W=80): IDe ≈ 1.5–2.5 bits
- Medium difficulty (A=400, W=40): IDe ≈ 3.0–4.5 bits
- High difficulty (A=600, W=20): IDe ≈ 4.5–6.5 bits
- Values < 0.5 bits or > 8 bits should be flagged

### Throughput (TP)

**Formula:**
```
TP = IDe / MT_s
```

Where:
- `IDe` = effective index of difficulty (computed above) in bits
- `MT_s` = mean movement time in seconds (MT_ms / 1000)

**Computation:**
- Per condition group: compute mean `movement_time_ms` (or `rt_ms` if movement_time not available)
- Convert to seconds: `MT_s = mean(movement_time_ms) / 1000`
- Compute: `TP = IDe / MT_s` in bits/second

**Aggregation (ISO recommendation):**
- Compute TP per `participant_id × modality × ui_mode × A × W`
- Then compute mean-of-means per `participant_id × modality × ui_mode`
- Final TP = mean of participant-level means

**Expected Range:**
- Hand: 3.0–6.0 bits/s (typically 4.0–5.5 bits/s)
- Gaze-confirm: 2.5–5.5 bits/s (typically 3.5–4.5 bits/s)
- Values < 1.0 bits/s or > 8.0 bits/s should be flagged

---

## 2. Movement Quality Metrics

### Path Efficiency

**Formula:**
```
path_efficiency = straight_line_distance / path_length_px
```

Where:
- `straight_line_distance` = Euclidean distance from start to endpoint (or target center)
- `path_length_px` = accumulated path length from pointer trajectory

**Computation:**
- `straight_line_distance = sqrt((endpoint_x - start_x)² + (endpoint_y - start_y)²)`
- Use `path_length_px` from telemetry (or `path_len_px`)
- Efficiency = `straight_line_distance / path_length_px`

**Expected Range:**
- Typical: 0.70–0.98
- Excellent: > 0.90
- Poor: < 0.60 (may indicate excessive corrections)
- Values > 1.0 are invalid (path cannot be shorter than straight line)

### Curvature Index

**Formula:**
```
curvature_index = path_length_px / straight_line_distance
```

Where:
- `path_length_px` = total path length traveled
- `straight_line_distance` = Euclidean distance from start to end

**Computation:**
- Use `path_length_px` (or `path_len_px`) from telemetry
- Compute straight-line distance as above
- `curvature_index = path_length_px / straight_line_distance`

**Expected Range:**
- Minimum: 1.0 (perfectly straight)
- Typical: 1.02–1.40
- High curvature: > 1.50 (may indicate corrections or obstacles)
- Values < 1.0 are invalid

### Mean Curvature

**Formula:**
```
mean_curvature = mean(deviation_i / path_length_i)
```

Where:
- `deviation_i` = perpendicular distance from point i to straight-line path
- `path_length_i` = accumulated path length up to point i

**Computation:**
- For each point in trajectory, compute perpendicular distance to straight line
- Normalize by accumulated path length
- Take mean across all points

**Expected Range:**
- Typical: 0.05–0.25 (unitless, normalized)
- Low: < 0.05 (very straight)
- High: > 0.40 (very curved)

### Maximum Deviation

**Formula:**
```
max_deviation_px = max(perpendicular_distance_i)
```

Where:
- `perpendicular_distance_i` = distance from point i to straight-line path

**Computation:**
- For each point in trajectory, compute perpendicular distance to straight line
- Take maximum across all points

**Expected Range:**
- Low difficulty (A=200): 5–20 px
- Medium difficulty (A=400): 10–40 px
- High difficulty (A=600): 15–60 px
- Values > 100 px should be flagged

---

## 3. Submovement Detection

### Detection Rule

**Algorithm:**
1. Compute speed profile from pointer trajectory (velocity magnitude over time)
2. Identify local minima in speed profile
3. Apply hysteresis threshold: `speed_min < peak_speed × 0.3` AND `speed_min < previous_speed - 5 px/s`
4. Count minima that meet prominence criterion: `speed_min < max(speed) × 0.1`

**Formula:**
```
n_submovements = count(local_minima where:
  speed[i] < speed[i-1] AND
  speed[i] < speed[i+1] AND
  speed[i] < peak_speed × 0.3 AND
  speed[i] < max(speed) × 0.1
)
```

**Computation:**
- Use `speedBuffer` from telemetry (or compute from position deltas)
- Find local minima: `speed[i-1] > speed[i] < speed[i+1]`
- Filter by prominence: `speed[i] < max(speed) × 0.1`
- Apply hysteresis: `speed[i] < previous_speed - 5 px/s` (to avoid noise)

**Expected Range:**
- Typical: 1–4 submovements per trial
- Simple movements: 1–2
- Complex/corrective: 3–5
- Values > 8 should be flagged (may indicate noise or very difficult target)

---

## 4. Primary Equivalence Criterion

### H2: RT Equivalence (No Slowdown)

**Primary Criterion:**
```
95% CI of log(RT_adaptive) - log(RT_static) entirely within [-0.05, +0.05]
```

**Computation:**
1. Transform RT to log scale: `log_RT = log(movement_time_ms)`
2. Aggregate per participant: mean `log_RT` per `participant_id × ui_mode`
3. Compute difference: `diff = log_RT_adaptive - log_RT_static`
4. Compute 95% CI of difference using paired t-test or LMEM
5. Check: `CI_lower > -0.05 AND CI_upper < +0.05`

**Interpretation:**
- If 95% CI entirely within [-0.05, +0.05]: **Equivalence established**
- If CI extends outside: **No equivalence** (may be faster or slower)

**Sensitivity Analysis:**
- Report CI bounds at ±3%, ±5%, ±7.5% margins
- Primary: ±5% (0.05 log units)
- Secondary: ±3% (0.03 log units) and ±7.5% (0.075 log units)

---

## 5. Secondary Equivalence Test (TOST)

### Two One-Sided Tests (TOST)

**Null Hypotheses:**
- H₀₁: `log_RT_adaptive - log_RT_static ≤ -0.05` (adaptive is >5% faster)
- H₀₂: `log_RT_adaptive - log_RT_static ≥ +0.05` (adaptive is >5% slower)

**Alternative Hypotheses:**
- H₁₁: `log_RT_adaptive - log_RT_static > -0.05`
- H₁₂: `log_RT_adaptive - log_RT_static < +0.05`

**Test:**
- Reject both H₀₁ and H₀₂ if both p-values < 0.05
- Equivalence established if both nulls rejected

**Computation:**
- Use `TOSTER::TOSTpaired()` or equivalent
- Test at ±5% margin (primary)
- Also test at ±3% and ±7.5% (sensitivity)

**Reporting:**
- Report both p-values
- Report 90% CI (for TOST)
- Note: Primary criterion is 95% CI, TOST is secondary

---

## 6. Expected Ranges (Sanity Checks)

### Reaction Time (RT)

| Condition | Expected Range (ms) | Typical (ms) | Notes |
|-----------|---------------------|--------------|-------|
| Hand, Static | 400–1200 | 600–900 | Direct pointing |
| Hand, Adaptive | 400–1100 | 550–850 | Width inflation helps |
| Gaze, Static | 600–1500 | 800–1200 | Hover + confirm |
| Gaze, Adaptive | 550–1400 | 750–1100 | Declutter helps |

**Flags:**
- RT < 150 ms: Likely anticipatory or error
- RT > 5000 ms: Likely timeout or distraction

### Error Rate

| Condition | Expected Range | Typical | Notes |
|-----------|----------------|---------|-------|
| Hand, Static | 2–15% | 5–10% | Direct pointing |
| Hand, Adaptive | 1–12% | 3–8% | Width inflation reduces errors |
| Gaze, Static | 5–20% | 8–15% | Hover confirmation |
| Gaze, Adaptive | 4–18% | 6–12% | Declutter reduces errors |

**Flags:**
- Error rate > 40%: Participant exclusion criterion
- Error rate < 1%: May indicate very easy targets or practice effect

### Throughput (TP)

| Condition | Expected Range (bits/s) | Typical (bits/s) | Notes |
|-----------|-------------------------|------------------|-------|
| Hand, Static | 3.0–6.0 | 4.0–5.5 | ISO mouse baseline ~4.5 |
| Hand, Adaptive | 3.2–6.2 | 4.2–5.7 | Slight improvement |
| Gaze, Static | 2.5–5.5 | 3.5–4.5 | Lower than hand |
| Gaze, Adaptive | 2.7–5.7 | 3.7–4.7 | Slight improvement |

**Flags:**
- TP < 1.0 bits/s: Likely error in computation or very poor performance
- TP > 8.0 bits/s: Likely error in computation or very easy targets

### Path Efficiency

| Condition | Expected Range | Typical | Notes |
|-----------|----------------|---------|-------|
| Hand, Static | 0.70–0.98 | 0.80–0.95 | Direct pointing |
| Hand, Adaptive | 0.72–0.98 | 0.82–0.96 | Slightly better |
| Gaze, Static | 0.65–0.95 | 0.75–0.90 | Hover may be less direct |
| Gaze, Adaptive | 0.67–0.95 | 0.77–0.92 | Slightly better |

**Flags:**
- Efficiency < 0.50: Very curved path, may indicate corrections
- Efficiency > 1.0: Invalid (path cannot be shorter than straight line)

### Submovement Count

| Condition | Expected Range | Typical | Notes |
|-----------|----------------|---------|-------|
| Hand, Static | 1–4 | 1.5–3.0 | Simple movements |
| Hand, Adaptive | 1–4 | 1.5–3.0 | Similar |
| Gaze, Static | 1–5 | 2.0–3.5 | May have more corrections |
| Gaze, Adaptive | 1–5 | 2.0–3.5 | Similar |

**Flags:**
- n_submovements > 8: Likely noise or very difficult target
- n_submovements = 0: May indicate missing data

### Curvature Index

| Condition | Expected Range | Typical | Notes |
|-----------|----------------|---------|-------|
| Hand, Static | 1.02–1.40 | 1.05–1.25 | Relatively straight |
| Hand, Adaptive | 1.02–1.35 | 1.05–1.20 | Slightly straighter |
| Gaze, Static | 1.05–1.50 | 1.10–1.30 | May be more curved |
| Gaze, Adaptive | 1.05–1.45 | 1.10–1.28 | Slightly straighter |

**Flags:**
- Curvature < 1.0: Invalid (path cannot be shorter than straight line)
- Curvature > 2.0: Very curved, may indicate corrections or obstacles

### Effective Width (We)

| Condition | Expected Range (px) | Typical (px) | Notes |
|-----------|---------------------|--------------|-------|
| Hand, Static | 20–60 | 30–45 | Direct pointing precision |
| Hand, Adaptive | 25–65 | 35–50 | Width inflation increases We |
| Gaze, Static | 25–80 | 40–60 | Hover confirmation less precise |
| Gaze, Adaptive | 30–85 | 45–65 | Declutter may increase We slightly |

**Flags:**
- We < 10 px: Likely error or very precise participant
- We > 100 px: Likely error or very imprecise participant

### Effective Index of Difficulty (IDe)

| Difficulty Level | A (px) | W (px) | Expected IDe (bits) | Typical (bits) |
|------------------|--------|--------|---------------------|----------------|
| Low | 200 | 80 | 1.5–2.5 | 1.8–2.2 |
| Medium | 400 | 40 | 3.0–4.5 | 3.3–4.0 |
| High | 600 | 20 | 4.5–6.5 | 5.0–6.0 |

**Flags:**
- IDe < 0.5 bits: Likely error (very easy target)
- IDe > 8 bits: Likely error (very difficult target)

---

## 7. Statistical Models

### Primary Model: Log-RT (LMEM)

**Formula:**
```
log(movement_time_ms) ~ modality × ui_mode + IDe + trial_number + block_number + (1 + modality | participant_id)
```

**Fixed Effects:**
- `modality`: Hand vs Gaze-confirm (reference: Hand)
- `ui_mode`: Static vs Adaptive (reference: Static)
- `modality × ui_mode`: Interaction term
- `IDe`: Effective index of difficulty (continuous)
- `trial_number`: Practice effect (continuous)
- `block_number`: Block order effect (continuous)

**Random Effects:**
- `(1 | participant_id)`: Participant intercept
- `(modality | participant_id)`: Participant-specific modality effect

**Expected Effects:**
- `modality`: Hand faster than Gaze (β ≈ -0.15 to -0.25 log units)
- `ui_mode`: Adaptive may be slightly faster (β ≈ -0.02 to -0.05 log units)
- `modality × ui_mode`: Interaction (β ≈ -0.01 to -0.03 log units)

### Error Model: GLMM (Binomial)

**Formula:**
```
error ~ modality × ui_mode + IDe + trial_number + block_number + (1 | participant_id)
```

**Family:** Binomial (logit link)

**Expected Effects:**
- `modality`: Hand fewer errors than Gaze (OR ≈ 0.6–0.8)
- `ui_mode`: Adaptive fewer errors than Static (OR ≈ 0.7–0.9)
- `modality × ui_mode`: Interaction (OR ≈ 0.8–1.0)

### Throughput Model: Mean-of-Means

**Formula:**
```
TP_participant_condition = mean(TP_per_trial) per participant × condition
```

**Analysis:**
- Compute TP per trial (IDe / MT_s)
- Aggregate to participant × condition means
- Use paired t-test or RM-ANOVA

**Expected:**
- Hand > Gaze by 0.5–1.0 bits/s
- Adaptive ≥ Static (no meaningful difference)

---

## 8. Exclusion Criteria

### Trial-Level Exclusions

1. **RT Out of Range:**
   - `movement_time_ms < 150` OR `movement_time_ms > 5000`
   - OR `timeout_flag == TRUE`

2. **Display Violations:**
   - `zoom_pct != 100`
   - `fullscreen != TRUE`
   - `dpr` changed during trial (unstable)

3. **Missing Data:**
   - Missing `endpoint_x` or `endpoint_y`
   - Missing `target_center_x` or `target_center_y`

### Participant-Level Exclusions

1. **Error Rate:**
   - `mean(error) > 0.40` (40% error rate)

2. **Completion Rate:**
   - `mean(!is.na(movement_time_ms)) < 0.80` (less than 80% completion)

3. **Display Violations:**
   - Any trial with `zoom_pct != 100`
   - Any trial with `fullscreen != TRUE`

---

## 9. Reporting Checklist

### Primary Outcomes

- [ ] H1: Modality effect (Hand vs Gaze) on log-RT and TP
- [ ] H2: Equivalence test (95% CI within ±5%)
- [ ] H3: Modality × Adaptation interaction
- [ ] H4: Fitts fit (R² ≥ 0.80 hand, ≥ 0.75 gaze)
- [ ] H5: TLX reduction (≥10% decrease)

### Secondary Outcomes

- [ ] Error rate by condition
- [ ] Path efficiency by condition
- [ ] Submovement count by condition
- [ ] Curvature metrics by condition
- [ ] Event health metrics (coalesced ratio, drop estimate)

### Sanity Checks

- [ ] All metrics within expected ranges
- [ ] No invalid values (efficiency > 1, curvature < 1, etc.)
- [ ] Exclusion report generated
- [ ] Data dictionary matches actual columns

---

## 10. References

- ISO 9241-9:2000 - Ergonomic requirements for office work with visual display terminals
- MacKenzie, I. S. (1992). Fitts' law as a research and design tool in human-computer interaction
- Soukoreff, R. W., & MacKenzie, I. S. (2004). Towards a standard for pointing device evaluation
- TOST: Two One-Sided Tests for equivalence (Schuirmann, 1987)

