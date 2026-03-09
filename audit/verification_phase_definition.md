# Verification Phase Definition

**Date:** 2025-03-07  
**Purpose:** Document how verification-phase RT is defined and used across the pipeline.

---

## 1. Event Definitions

### 1.1 Source: `app/src/lib/telemetry/csv.ts`

> verification_time_ms: Time from first target entry to selection

### 1.2 Source: `app/src/components/FittsTask.tsx` (lines 1378–1381, 2188–2191)

```typescript
verification_start_time_ms = firstEntryTimeRef.current  // first target entry
verification_time_ms = verification_end_time_ms - verification_start_time_ms
```

**Start event:** First target entry (cursor enters target bounds)  
**End event:** Verification end (selection/confirmation)

---

## 2. Preprocessing Steps

### 2.1 LBA Model (`analysis/py/lba.py`)

- **RT column:** Prefers `verification_time_ms`; fallback `rt_ms`, then `movement_time_ms` (lines 243–253)
- **Filter:** 200 ≤ rt_ms ≤ 5000 ms (lines 283–286)
- **Correct trials:** Uses `correct` for response coding; filters on valid RT
- **Units:** Converts to seconds for likelihood: `rt_obs = df['rt_ms'].values / 1000.0`

### 2.2 Empirical Figure (`scripts/export_lba_figures.R`)

- **Filter:** 50 ≤ verification_time_ms ≤ 5000 ms (line 105)
- **Exclusions:** practice trials
- **No 8-block filter** in the R script (uses all participants with valid verification data)

### 2.3 Manuscript Policy (`config/manuscript_analysis_policy.yaml`)

```yaml
lba:
  verification_time_min_ms: 200
  verification_time_max_ms: 5000
```

---

## 3. Exclusions

| Step | Exclusions |
|------|------------|
| LBA load | 200–5000 ms, non-null RT, correct, ID present |
| Empirical figure (R) | 50–5000 ms, practice excluded |
| Manuscript policy | 200–5000 ms |

---

## 4. Mismatch Between Empirical Summary and Model Input

| Aspect | LBA model | Empirical Figure 8 |
|--------|-----------|---------------------|
| RT column | verification_time_ms (preferred) or rt_ms | verification_time_ms |
| Range | 200–5000 ms | 50–5000 ms |
| 8-block filter | No (uses all with valid data) | No |
| QC filters | None (raw load) | practice only |

**Note:** LBA and the empirical figure both use verification_time_ms. The lower bound differs (200 vs 50 ms); the LBA is stricter. Both operate on the same behavioral construct (verification-phase duration).

---

## 5. Data Availability

- **Hand trials:** verification_time_ms is populated (merged dataset has 7117+ non-null hand trials)
- **Gaze trials:** verification_time_ms populated
- Both modalities contribute to LBA and empirical summaries
