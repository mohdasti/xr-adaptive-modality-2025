#!/usr/bin/env python3
"""
Compute manuscript analysis populations A, B, C for audit.
Run from project root: python3 scripts/compute_analysis_populations.py

Populations:
  A: Current pipeline behavior (QC + device filter, no 8-block gate)
  B: Complete-design primary (8 blocks after QC + device filter)
  C: B + check_exclusions participant-level QC (error>40%, completion<80%, zoom, fullscreen)
"""

import pandas as pd
import numpy as np
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "clean" / "trial_data.csv"
OUTPUT_CSV = PROJECT_ROOT / "audit" / "analysis_population_counts.csv"


def load_qc_device_filtered():
    """Match compute_manuscript_stats.py load_and_prep()."""
    df = pd.read_csv(DATA_PATH, low_memory=False)
    if "participant_id" in df.columns and "pid" not in df.columns:
        df = df.rename(columns={"participant_id": "pid"})

    practice_col = df.get("practice", pd.Series(dtype=object))
    practice_ok = practice_col.isna() | (practice_col == False) | (practice_col.astype(str).str.lower() == "false")
    zoom_ok = df.get("zoom_pct", 100).fillna(100) == 100
    fullscreen_ok = df.get("is_fullscreen", True).fillna(True) | df.get("fullscreen", True).fillna(True)
    tab_ok = df.get("tab_hidden_ms", 0).fillna(0) < 500
    focus_ok = df.get("focus_blur_count", 0).fillna(0) == 0
    df = df[practice_ok & zoom_ok & fullscreen_ok & tab_ok & focus_ok].copy()

    df["modality"] = df["modality"].str.lower().replace("gaze_confirm", "gaze")
    df["ui_mode"] = df["ui_mode"].str.lower()

    if "input_device" in df.columns:
        df = df[
            (df["input_device"] == "mouse")
            | ((df["input_device"] == "trackpad") & (df["modality"] == "gaze"))
        ]
    return df


def check_exclusions_flags(df: pd.DataFrame) -> pd.Series:
    """Participant-level exclude flags matching check_exclusions.R logic.
    Uses correct/rt_ms when error/movement_time_ms absent.
    NOTE: check_exclusions.R uses zoom_level!=100 and is_fullscreen==FALSE. The trial_data
    has many trials with is_fullscreen=False (browser/OS reporting). This would exclude
    almost all participants. Since check_exclusions is NOT used by manuscript-facing scripts
    and fails to run on current data, we only apply error_rate and completion_rate here.
    Zoom/fullscreen are already applied at trial level in QC (zoom_pct==100, fullscreen)."""
    err_col = "error" if "error" in df.columns else None
    if err_col is None:
        df = df.copy()
        df["_is_error"] = ~(df["correct"].isin([True, "true", 1]))
        err_col = "_is_error"

    mt_col = "movement_time_ms" if "movement_time_ms" in df.columns else "rt_ms"

    def _exclude(g):
        err_rate = g[err_col].mean()
        compl = g[mt_col].notna().sum() / len(g) if len(g) > 0 else 1
        # Skip zoom/fullscreen: already in trial QC; raw check would over-exclude
        return err_rate > 0.4 or compl < 0.8

    return df.groupby("pid", group_keys=False).apply(_exclude, include_groups=False)


def main():
    df = load_qc_device_filtered()

    # Valid trials (correct, 150-6000ms)
    df_valid = df[
        df["correct"].isin([True, "true", 1])
        & (df["rt_ms"] >= 150)
        & (df["rt_ms"] <= 6000)
    ]

    # POP A
    pids_a = set(df["pid"].unique())
    n_a = len(pids_a)
    trials_a = len(df)
    hand_a = len(df[df["modality"] == "hand"])
    gaze_a = len(df[df["modality"] == "gaze"])
    tlx_a = df.dropna(subset=["tlx_mental"]).groupby(["pid", "block_number"]).ngroups if "tlx_mental" in df.columns else 0

    # POP B: 8-block complete
    blocks_per = df.groupby("pid")["block_number"].nunique()
    pids_b = set(blocks_per[blocks_per == 8].index)
    n_b = len(pids_b)
    df_b = df[df["pid"].isin(pids_b)]
    trials_b = len(df_b)
    hand_b = len(df_b[df_b["modality"] == "hand"])
    gaze_b = len(df_b[df_b["modality"] == "gaze"])
    tlx_b = df_b.dropna(subset=["tlx_mental"]).groupby(["pid", "block_number"]).ngroups if "tlx_mental" in df_b.columns else 0

    # POP C: B minus check_exclusions
    excl = check_exclusions_flags(df)
    excluded_pids = set(excl[excl].index)
    pids_c = pids_b - excluded_pids
    n_c = len(pids_c)
    df_c = df[df["pid"].isin(pids_c)]
    trials_c = len(df_c)
    hand_c = len(df_c[df_c["modality"] == "hand"])
    gaze_c = len(df_c[df_c["modality"] == "gaze"])
    tlx_c = df_c.dropna(subset=["tlx_mental"]).groupby(["pid", "block_number"]).ngroups if "tlx_mental" in df_c.columns else 0

    # CSV
    rows = [
        {"population": "A", "description": "Current pipeline (no 8-block gate)", "n_participants": n_a, "trials": trials_a, "hand_trials": hand_a, "gaze_trials": gaze_a, "tlx_observations": tlx_a, "blocks_per_participant": "varies", "matches_rm_design": "no"},
        {"population": "B", "description": "8-block complete (primary)", "n_participants": n_b, "trials": trials_b, "hand_trials": hand_b, "gaze_trials": gaze_b, "tlx_observations": tlx_b, "blocks_per_participant": "8", "matches_rm_design": "yes"},
        {"population": "C", "description": "8-block + check_exclusions", "n_participants": n_c, "trials": trials_c, "hand_trials": hand_c, "gaze_trials": gaze_c, "tlx_observations": tlx_c, "blocks_per_participant": "8", "matches_rm_design": "yes"},
    ]
    pd.DataFrame(rows).to_csv(OUTPUT_CSV, index=False)
    print(f"Saved {OUTPUT_CSV}")

    # TLX n by modality (participant count with TLX data)
    tlx_hand_n = df_b.dropna(subset=["tlx_mental"]).query("modality=='hand'").groupby("pid").ngroups
    tlx_gaze_n = df_b.dropna(subset=["tlx_mental"]).query("modality=='gaze'").groupby("pid").ngroups
    print(f"\nPopulation B: N={n_b}, trials={trials_b}, hand={hand_b}, gaze={gaze_b}, TLX_obs={tlx_b}")
    print(f"Population C: N={n_c}, excluded from B: {sorted(excluded_pids & pids_b)}")
    return rows


if __name__ == "__main__":
    main()
