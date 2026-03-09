# LBA t0 Parameterization Audit

**Date:** 2025-03-07  
**Purpose:** Determine whether the manuscript's interpretation of LBA t0 is statistically and conceptually justified.

---

## 1. Files Inspected

| File | Purpose |
|------|---------|
| `analysis/py/lba.py` | Model definition, t0 parameterization |
| `outputs/LBA/lba_parameters.json` | Exported parameters |
| `outputs/LBA/lba_parameters_summary.csv` | Posterior summary |
| `scripts/export_lba_figures.R` | Forest plot, axis labels |
| `docs/manuscript/Manuscript.qmd` | LBA Results, Table 4, Figure 7 |
| `audit/HIGH_RISK_CLAIMS.md` | Prior LBA scale note |

---

## 2. Exact Parameterization of t0

### 2.1 Model Code (`analysis/py/lba.py`)

**t0 declaration (lines 283–299):**

```python
t0_mu = pm.Normal('t0_mu', mu=0.0, sigma=1.0, shape=(n_m, n_u))  # Group-level latent
t0_sd = pm.HalfNormal('t0_sd', sigma=0.5)
t0_offset_raw = pm.Normal('t0_offset_raw', mu=0, sigma=1, shape=(n_p, n_m, n_u))

t0_raw = t0_mu[mod_idx, ui_mode_idx] + t0_offset_raw[pid_idx, mod_idx, ui_mode_idx] * t0_sd

# t0 in physical time (seconds): sigmoid(t0_raw) * min_rt_global
t0 = pm.Deterministic('t0', pt.sigmoid(t0_raw) * min_rt_global)
```

**min_rt_global (line 285):**
```python
min_rt_global = (df['rt_ms'].min() / 1000.0) * 0.95  # 95% of global min RT, in seconds
```

**Likelihood (lines 131, 167):**
```python
t = rt - t0  # rt and t0 both in seconds
```

### 2.2 What Is Exported and Reported

**Exported:** `t0_mu` (the latent group-level parameter), **not** the transformed `t0`.

**lba_parameters.json** and **lba_parameters_summary.csv** contain `t0_mu` values: −2.85, −3.01, −1.41, −0.97.

**Manuscript Table 4** reports these as "t0 (NDT) [95% HDI]".

---

## 3. Why t0_mu Can Be Negative

- **t0_mu** has a Normal(0, 1) prior and is **unconstrained** in sampling space.
- **t0** (used in the likelihood) is `sigmoid(t0_raw) * min_rt_global`:
  - sigmoid maps (−∞, +∞) → (0, 1)
  - t0 is always in (0, min_rt_global) seconds
- Negative **t0_mu** means sigmoid(t0_mu) is closer to 0, so **t0** is smaller (shorter non-decision time).
- The manuscript reports **t0_mu**, not **t0**. t0_mu is on a latent scale; it is not in milliseconds.

---

## 4. Reporting Scale vs Model Scale

| Quantity | Scale | Units | Reported in manuscript? |
|----------|-------|------|-------------------------|
| t0_mu | Latent (unbounded) | None | Yes (Table 4, Figure 7) |
| t0 | Physical | Seconds | No |

**Back-transform:** t0 (seconds) = sigmoid(t0_mu + participant_offset) × min_rt_global.  
The manuscript does not apply this transform; it reports t0_mu directly.

---

## 5. Whether Current Manuscript Wording Is Defensible

**Issues:**
1. Table 4 labels the column "t0 (NDT)" but the values are **t0_mu** (latent), not t0 (seconds).
2. The caption says "higher values indicate longer verification-phase duration" — correct for **direction** (less negative t0_mu → longer t0).
3. The manuscript does not state that the reported values are on a latent scale, not milliseconds.
4. Risk of misinterpretation: readers may treat −2.85 as "−2.85 ms" or similar.

**Defensible aspects:**
- The **ordinal** interpretation (more rightward / less negative = longer verification phase) is correct.
- The transform is monotonic: higher t0_mu → higher t0 in seconds.

---

## 6. Recommended Terminology

- **Preferred:** "t0 (latent)" or "t0_mu (latent scale)" with an explicit note that values are not in milliseconds.
- **Avoid:** Reporting t0_mu as if it were "non-decision time in ms" or a direct physical duration.
- **Caption:** State that t0 is on the model's latent scale; condition differences are interpreted directionally and supported by empirical verification-phase RT (Figure 8).

---

## 7. Manuscript Sections Affected

| Section | Issue |
|--------|-------|
| Table 4 | Column "t0 (NDT)" — clarify latent scale |
| Table 4 caption | Add that values are latent, not ms |
| Figure 7 caption | Already says "latent scale (negative)" — keep and strengthen |
| Results interpretation | Add that t0 is latent; interpretation is directional |
| Discussion | Ensure no claim that t0 is literal ms |
