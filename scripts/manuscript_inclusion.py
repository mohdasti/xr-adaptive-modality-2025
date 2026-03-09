"""
Shared manuscript-facing inclusion logic.
Load trial data with QC + device filter; optionally restrict to 8-block-complete sample.
Used by: compute_manuscript_stats.py, compute_analysis_populations.py
"""

import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "clean" / "trial_data.csv"


def load_and_prep(require_8_blocks: bool = True) -> pd.DataFrame:
    """
    Load trial data with QC and input-device filter.
    If require_8_blocks=True, restrict to participants with all 8 blocks.
    """
    df = pd.read_csv(DATA_PATH, low_memory=False)
    if "participant_id" in df.columns and "pid" not in df.columns:
        df = df.rename(columns={"participant_id": "pid"})
    if "movement_time_ms" in df.columns and "rt_ms" not in df.columns:
        df = df.rename(columns={"movement_time_ms": "rt_ms"})

    # Trial QC
    practice_col = df.get("practice", pd.Series(dtype=object))
    practice_ok = practice_col.isna() | (practice_col == False) | (practice_col.astype(str).str.lower() == "false")
    zoom_ok = df.get("zoom_pct", 100).fillna(100) == 100
    fullscreen_ok = df.get("is_fullscreen", True).fillna(True) | df.get("fullscreen", True).fillna(True)
    tab_ok = df.get("tab_hidden_ms", 0).fillna(0) < 500
    focus_ok = df.get("focus_blur_count", 0).fillna(0) == 0
    df = df[practice_ok & zoom_ok & fullscreen_ok & tab_ok & focus_ok].copy()

    df["modality"] = df["modality"].str.lower().replace("gaze_confirm", "gaze")
    df["ui_mode"] = df["ui_mode"].str.lower()

    # Input device
    if "input_device" in df.columns:
        df = df[
            (df["input_device"] == "mouse")
            | ((df["input_device"] == "trackpad") & (df["modality"] == "gaze"))
        ]

    if require_8_blocks and "block_number" in df.columns:
        blocks_per = df.groupby("pid")["block_number"].nunique()
        pids_8 = set(blocks_per[blocks_per == 8].index)
        df = df[df["pid"].isin(pids_8)].copy()

    return df


def get_primary_participant_ids(df: pd.DataFrame) -> set:
    """Return participant IDs with 8 blocks (for use when df is already QC+device filtered)."""
    if "block_number" not in df.columns:
        return set(df["pid"].unique())
    blocks_per = df.groupby("pid")["block_number"].nunique()
    return set(blocks_per[blocks_per == 8].index)
