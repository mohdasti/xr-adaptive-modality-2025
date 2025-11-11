# Adaptation Policy

## Overview

The adaptation policy controls when and how the UI adapts based on user performance. The policy consists of trigger thresholds and hysteresis parameters that determine adaptation behavior.

## Policy Files

Policy files are located in `app/public/policy/` directory (served by Vite at `/policy/` URL path):

- **`app/public/policy/policy.default.json`**: Editable policy used during pilot phase. Tune thresholds here to achieve target trigger rate.
- **`app/public/policy/policy.locked.json`**: Frozen policy committed after pilot. This file takes precedence at runtime if present.

**Note**: The root `policy/` directory contains documentation. Policy files for runtime are in `app/public/policy/`.

## Target Trigger Rate

**Target: 15–25% of trials should trigger adaptation**

During the pilot phase, adjust thresholds in `policy.default.json` to achieve this target rate. After pilot completion, lock the thresholds by copying to `policy.locked.json`.

## Policy Structure

```json
{
  "adaptation": {
    "triggers": {
      "rt_percentile": 75,
      "error_burst_threshold": 2,
      "min_trials_before_adapt": 5
    },
    "hysteresis": {
      "post_trigger_window": 5,
      "min_trigger_gap": 3
    }
  }
}
```

### Trigger Parameters

- **`rt_percentile`**: Percentile threshold for reaction time (default: 75). Adaptation triggers when RT exceeds this percentile.
- **`error_burst_threshold`**: Number of consecutive errors that trigger adaptation (default: 2).
- **`min_trials_before_adapt`**: Minimum number of trials before adaptation can be triggered (default: 5).

### Hysteresis Parameters

- **`post_trigger_window`**: Number of trials after adaptation trigger where adaptation remains active (default: 5).
- **`min_trigger_gap`**: Minimum number of trials between adaptation triggers (default: 3).

## Locking Policy After Pilot

After pilot tuning reaches the target trigger rate (15–25%), lock the thresholds:

**Note**: Policy files are located in `app/public/policy/` directory (served by Vite at `/policy/`).

```bash
# Lock the policy after pilot tuning
cd app/public/policy
cp policy.default.json policy.locked.json
git add policy.locked.json
git commit -m "chore(policy): lock thresholds post-pilot (target 15–25% trigger rate)"
```

After locking, the application will automatically use `policy.locked.json` instead of `policy.default.json`.

## Runtime Behavior

The application automatically loads `policy.locked.json` if present, otherwise falls back to `policy.default.json`. This ensures:

1. **Pilot phase**: Use `policy.default.json` for tuning
2. **Main study**: Use `policy.locked.json` for consistent thresholds
3. **Development**: Can still modify `policy.default.json` without affecting locked policy

## Notes

- Do not tune thresholds after locking
- Report observed trigger rate in study results
- The locked policy ensures reproducibility and prevents accidental threshold changes during data collection

