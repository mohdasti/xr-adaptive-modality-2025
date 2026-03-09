# LBA Empirical Alignment

**Date:** 2025-03-07  
**Purpose:** Verify that latent t0 ordering matches empirical verification-phase RT.

---

## 1. Condition-Wise Comparison

| Condition | t0_mu (latent) | Empirical verification RT (ms) | t0 rank (1=shortest) | Empirical rank (1=shortest) |
|-----------|----------------|--------------------------------|----------------------|-----------------------------|
| Hand – Adaptive | −3.01 | 414 | 1 | 1 |
| Hand – Static | −2.85 | 436 | 2 | 2 |
| Gaze – Static | −1.41 | 558 | 3 | 3 |
| Gaze – Adaptive | −0.97 | 599 | 4 | 4 |

**Empirical source:** trial_data.csv, 8-block-complete sample, QC filters, correct trials, 200–5000 ms verification_time_ms.

---

## 2. Does Latent t0 Ordering Match Empirical RT Ordering?

**Yes.** The ordering is identical:

- **t0_mu:** More negative = shorter predicted verification phase (sigmoid maps to smaller t0 in seconds).
- **Empirical:** Hand-Adaptive < Hand-Static < Gaze-Static < Gaze-Adaptive.

---

## 3. Discrepancies

None. The latent t0_mu condition ordering is fully consistent with empirical verification-phase RT.

---

## 4. Do Figure 7 and Figure 8 Tell a Consistent Story?

**Yes.** Figure 7 (t0 posterior) and Figure 8 (empirical verification RT) both show:

- Hand conditions shorter than gaze conditions.
- Within hand: Adaptive shorter than Static.
- Within gaze: Adaptive longer than Static (empirical 599 vs 558 ms; t0_mu −0.97 vs −1.41).

The gaze adaptive vs static difference is consistent: both figures show Gaze-Adaptive as the longest condition.
