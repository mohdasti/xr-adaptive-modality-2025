# LBA Terminology Recommendation

**Date:** 2025-03-07  
**Purpose:** Recommend defensible labels for t0 and avoid reviewer misinterpretation.

---

## 1. Preferred Label

**"t0 (latent)"** or **"Non-decision time (t0, latent scale)"**

When a short phrase is needed: **"verification-related latent offset"**.

---

## 2. Labels to Avoid

- "Non-decision time (ms)" — implies physical time; t0_mu is not in ms
- "t0 in milliseconds" — incorrect
- Reporting values like −2.85 without stating they are latent — invites misinterpretation

---

## 3. One-Paragraph Justification (Manuscript Style)

> The LBA model estimates condition-varying non-decision time (t0) using a sigmoid-constrained parameterization to ensure t0 remains below the minimum observed RT. The group-level parameter t0_mu is reported on the model's latent scale rather than as a direct millisecond quantity. Condition differences in t0_mu are interpreted directionally: more rightward (less negative) values indicate a larger verification-related offset under the fitted parameterization. This ordering was validated against empirical verification-phase RT summaries (Figure 8), which showed the same condition ranking. Accordingly, we do not interpret the reported values as literal durations in milliseconds.
