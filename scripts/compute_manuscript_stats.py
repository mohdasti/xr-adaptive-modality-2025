#!/usr/bin/env python3
"""
Compute manuscript statistics from trial data.
Outputs: NASA-TLX subscales, Fitts' Law slopes, width scaling check, etc.
Uses manuscript_analysis_policy: 8-block-complete primary sample.
Run from project root: python3 scripts/compute_manuscript_stats.py
"""

import sys
from pathlib import Path

# Ensure scripts/ is on path for manuscript_inclusion import
_scripts_dir = Path(__file__).resolve().parent
if str(_scripts_dir) not in sys.path:
    sys.path.insert(0, str(_scripts_dir))

import pandas as pd
import numpy as np

from manuscript_inclusion import load_and_prep

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "docs" / "manuscript" / "assets"
TLX_COLS = ["tlx_mental", "tlx_physical", "tlx_temporal", "tlx_performance", "tlx_effort", "tlx_frustration"]


def compute_tlx_subscales(df: pd.DataFrame) -> pd.DataFrame:
    """NASA-TLX subscale means by modality. Participant-level means first, then aggregate."""
    if not all(c in df.columns for c in TLX_COLS):
        return pd.DataFrame()

    # TLX is at block level; get one row per block, then average per participant per condition
    block_cols = ["pid", "modality", "ui_mode"]
    if "block_number" in df.columns:
        block_cols.append("block_number")
    tlx_block = (
        df.dropna(subset=["tlx_mental"])
        .groupby(block_cols, as_index=False)[TLX_COLS]
        .mean()
    )
    tlx_pp = tlx_block.groupby(["pid", "modality", "ui_mode"], as_index=False)[TLX_COLS].mean()

    # By modality: mean across participants
    rows = []
    for mod in ["hand", "gaze"]:
        sub = tlx_pp[tlx_pp["modality"] == mod]
        if sub.empty:
            continue
        for scale in TLX_COLS:
            vals = sub[scale].dropna()
            if len(vals) == 0:
                continue
            mean_val = vals.mean()
            se = vals.std(ddof=1) / np.sqrt(len(vals)) if len(vals) > 1 else 0
            ci_lo = mean_val - 1.96 * se
            ci_hi = mean_val + 1.96 * se
            scale_name = scale.replace("tlx_", "").capitalize()
            rows.append({
                "modality": mod,
                "scale": scale_name,
                "mean": round(mean_val, 2),
                "sd": round(vals.std(ddof=1), 2) if len(vals) > 1 else 0,
                "se": round(se, 2),
                "ci_lower": round(ci_lo, 2),
                "ci_upper": round(ci_hi, 2),
                "n": len(vals),
            })

    return pd.DataFrame(rows)


def compute_fitts_slopes(df: pd.DataFrame) -> pd.DataFrame:
    """Fitts' Law regression: MT ~ IDe by modality x ui_mode."""
    df_valid = df[
        df["correct"].isin([True, "true", 1])
        & (df["rt_ms"] >= 150)
        & (df["rt_ms"] <= 6000)
    ].copy()

    err_col = "projected_error_px" if "projected_error_px" in df_valid.columns else "endpoint_error_px"
    if err_col not in df_valid.columns:
        return pd.DataFrame()
    we_factor = 4.133 if err_col == "projected_error_px" else 2.066  # ISO vs approximation

    # Compute We, IDe, MT per pid x modality x ui_mode x A x W (matching R pipeline)
    def we_agg(x):
        return np.std(x, ddof=1) * we_factor if len(x) >= 3 else np.nan

    df_iso = (
        df_valid.groupby(["pid", "modality", "ui_mode", "A", "W"], as_index=False)
        .agg(
            We=(err_col, we_agg),
            MT_avg=("rt_ms", "mean"),
        )
    )
    df_iso["We"] = df_iso["We"].replace(0, np.nan)
    df_iso["IDe"] = np.log2(df_iso["A"] / df_iso["We"] + 1)
    df_iso["MT_s"] = df_iso["MT_avg"] / 1000
    df_iso = df_iso.dropna(subset=["IDe", "MT_s"])

    if df_iso.empty:
        return pd.DataFrame()

    # Fit MT ~ IDe per condition
    rows = []
    for (mod, ui), g in df_iso.groupby(["modality", "ui_mode"]):
        if len(g) < 10:
            continue
        X = g["IDe"].values
        y = g["MT_s"].values
        slope = np.polyfit(X, y, 1)[0]
        r = np.corrcoef(X, y)[0, 1]
        r2 = r ** 2 if not np.isnan(r) else np.nan
        rows.append({
            "modality": mod,
            "ui_mode": ui,
            "slope": slope,
            "r_squared": r2,
            "n": len(g),
        })

    return pd.DataFrame(rows)


def compute_width_scaling_check(df: pd.DataFrame) -> dict:
    """Check if width inflation ever activated. Exclude NaN (NaN != 1 is True in Python)."""
    if "width_scale_factor" not in df.columns:
        return {"n_scaled_overall": 0, "n_total": 0, "pct_scaled": 0, "n_hand_adapt_p1": 0, "n_hand_scaled": 0, "n_inflate_actions": 0}

    wsf = df["width_scale_factor"].dropna()
    n_scaled = int((wsf != 1.0).sum())
    n_total = len(df)

    hand_adapt = df[
        (df["modality"] == "hand")
        & (df["ui_mode"] == "adaptive")
        & (df.get("pressure", 1).astype(str).str.contains("1", na=True))
    ]
    n_hand_adapt = len(hand_adapt)
    hand_wsf = hand_adapt["width_scale_factor"].dropna()
    n_hand_scaled = int((hand_wsf != 1.0).sum())

    n_inflate = int(df.get("adaptation_triggered", pd.Series(0)).sum()) if "adaptation_triggered" in df.columns else 0

    return {
        "n_scaled_overall": n_scaled,
        "n_total": n_total,
        "pct_scaled": 100 * n_scaled / n_total if n_total > 0 else 0,
        "n_hand_adapt_p1": n_hand_adapt,
        "n_hand_scaled": n_hand_scaled,
        "n_inflate_actions": n_inflate,
    }


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    df = load_and_prep(require_8_blocks=True)
    print(f"Loaded {len(df)} QC-ok trials, {df['pid'].nunique()} participants (8-block complete)")

    # NASA-TLX subscales
    tlx = compute_tlx_subscales(df)
    if not tlx.empty:
        tlx.to_csv(OUTPUT_DIR / "tlx_subscales_by_modality.csv", index=False)
        print(f"Saved TLX subscales to {OUTPUT_DIR / 'tlx_subscales_by_modality.csv'}")
        print(tlx.to_string())

    # Fitts slopes
    fitts = compute_fitts_slopes(df)
    if not fitts.empty:
        fitts.to_csv(OUTPUT_DIR / "fitts_slopes_by_condition.csv", index=False)
        print(f"\nSaved Fitts slopes to {OUTPUT_DIR / 'fitts_slopes_by_condition.csv'}")
        print(fitts.to_string())

    # Width scaling check
    width_check = compute_width_scaling_check(df)
    width_df = pd.DataFrame([width_check])
    width_df.to_csv(OUTPUT_DIR / "width_scaling_check.csv", index=False)
    print(f"\nWidth scaling check: {width_check}")

    return tlx, fitts, width_check


if __name__ == "__main__":
    main()
