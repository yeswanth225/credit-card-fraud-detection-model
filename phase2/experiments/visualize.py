"""
Phase 2 — Visualization Utilities
===================================

Create plots for Phase 2 experimental results.

PLOTS CREATED
--------------
1. PR-AUC vs Feature Count (line plot)
2. F1 vs Feature Count (line plot)
3. Feature Map Comparison (bar chart)
4. Ideal vs Noisy Performance (comparison)
5. Model Comparison (grouped bar chart)

All plots use consistent styling and are saved to phase2/results/plots/
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    logger.warning("matplotlib not available; skipping visualizations")


def ensure_plots_dir(base_dir: Path = None) -> Path:
    """Create and return the plots directory."""
    if base_dir is None:
        from phase2.quantum.config import PHASE2_RESULTS_DIR
        base_dir = PHASE2_RESULTS_DIR

    plots_dir = base_dir / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)
    return plots_dir


def setup_matplotlib():
    """Configure matplotlib styling."""
    if not HAS_MATPLOTLIB:
        return

    plt.style.use('seaborn-v0_8-darkgrid')
    plt.rcParams['figure.figsize'] = (12, 6)
    plt.rcParams['font.size'] = 11


def plot_feature_count_results(csv_path: Path, output_dir: Path = None) -> Optional[Path]:
    """
    Plot PR-AUC and F1 vs feature count.

    Parameters
    ----------
    csv_path : Path
        Path to feature_count_results.csv
    output_dir : Path, optional
        Directory to save plots. Defaults to phase2/results/plots/

    Returns
    -------
    Path to saved plot, or None if plotting fails
    """
    if not HAS_MATPLOTLIB:
        return None

    if output_dir is None:
        output_dir = ensure_plots_dir()

    try:
        df = pd.read_csv(csv_path)

        setup_matplotlib()
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))

        # Plot 1: PR-AUC vs Feature Count
        ax = axes[0]
        ax.plot(df["n_qubits"], df["pr_auc"], marker="o", linewidth=2, markersize=8, label="QSVC PR-AUC")
        ax.axhline(y=0.8716, color="red", linestyle="--", label="XGBoost Baseline (0.8716)", linewidth=2)
        ax.set_xlabel("Number of Qubits", fontsize=12, fontweight="bold")
        ax.set_ylabel("PR-AUC", fontsize=12, fontweight="bold")
        ax.set_title("PR-AUC vs Feature Count", fontsize=13, fontweight="bold")
        ax.grid(True, alpha=0.3)
        ax.legend()
        ax.set_xticks(df["n_qubits"].unique())

        # Plot 2: F1 vs Feature Count
        ax = axes[1]
        ax.plot(df["n_qubits"], df["f1"], marker="s", linewidth=2, markersize=8, label="QSVC F1")
        ax.axhline(y=0.8723, color="red", linestyle="--", label="XGBoost Baseline (0.8723)", linewidth=2)
        ax.set_xlabel("Number of Qubits", fontsize=12, fontweight="bold")
        ax.set_ylabel("F1 Score", fontsize=12, fontweight="bold")
        ax.set_title("F1 Score vs Feature Count", fontsize=13, fontweight="bold")
        ax.grid(True, alpha=0.3)
        ax.legend()
        ax.set_xticks(df["n_qubits"].unique())

        plt.tight_layout()
        output_path = output_dir / "01_feature_count_analysis.png"
        plt.savefig(output_path, dpi=150, bbox_inches="tight")
        logger.info(f"Saved plot: {output_path}")
        plt.close()

        return output_path

    except Exception as e:
        logger.error(f"Error plotting feature count results: {e}")
        return None


def plot_feature_map_comparison(csv_path: Path, output_dir: Path = None) -> Optional[Path]:
    """
    Plot feature map comparison (angle encoding vs ZZ).

    Parameters
    ----------
    csv_path : Path
        Path to feature_map_results.csv
    output_dir : Path, optional

    Returns
    -------
    Path to saved plot, or None if plotting fails
    """
    if not HAS_MATPLOTLIB:
        return None

    if output_dir is None:
        output_dir = ensure_plots_dir()

    try:
        df = pd.read_csv(csv_path)

        setup_matplotlib()
        fig, ax = plt.subplots(figsize=(10, 6))

        metrics = ["pr_auc", "roc_auc", "f1", "precision", "recall"]
        x = np.arange(len(metrics))
        width = 0.35

        for i, row in df.iterrows():
            values = [row[m] for m in metrics]
            offset = (i - len(df) / 2 + 0.5) * width
            ax.bar(x + offset, values, width, label=row["feature_map"])

        ax.set_xlabel("Metrics", fontsize=12, fontweight="bold")
        ax.set_ylabel("Score", fontsize=12, fontweight="bold")
        ax.set_title("Feature Map Comparison (4-qubit QSVC)", fontsize=13, fontweight="bold")
        ax.set_xticks(x)
        ax.set_xticklabels(metrics)
        ax.legend()
        ax.grid(True, alpha=0.3, axis="y")
        ax.set_ylim([0, 1.0])

        plt.tight_layout()
        output_path = output_dir / "02_feature_map_comparison.png"
        plt.savefig(output_path, dpi=150, bbox_inches="tight")
        logger.info(f"Saved plot: {output_path}")
        plt.close()

        return output_path

    except Exception as e:
        logger.error(f"Error plotting feature map comparison: {e}")
        return None


def plot_noise_impact(csv_path: Path, output_dir: Path = None) -> Optional[Path]:
    """
    Plot ideal vs noisy simulation performance.

    Parameters
    ----------
    csv_path : Path
        Path to noise_results.csv
    output_dir : Path, optional

    Returns
    -------
    Path to saved plot, or None if plotting fails
    """
    if not HAS_MATPLOTLIB:
        return None

    if output_dir is None:
        output_dir = ensure_plots_dir()

    try:
        df = pd.read_csv(csv_path)

        setup_matplotlib()
        fig, ax = plt.subplots(figsize=(10, 6))

        metrics = ["pr_auc", "roc_auc", "f1", "precision", "recall"]
        x = np.arange(len(metrics))
        width = 0.35

        ideal_row = df[df["simulation_type"] == "ideal"].iloc[0]
        noisy_row = df[df["simulation_type"] == "noisy"].iloc[0]

        ideal_values = [ideal_row[m] for m in metrics]
        noisy_values = [noisy_row[m] for m in metrics]

        ax.bar(x - width / 2, ideal_values, width, label="Ideal Simulation", alpha=0.8)
        ax.bar(x + width / 2, noisy_values, width, label="Noisy Simulation (1% errors)", alpha=0.8)

        ax.set_xlabel("Metrics", fontsize=12, fontweight="bold")
        ax.set_ylabel("Score", fontsize=12, fontweight="bold")
        ax.set_title("Quantum Noise Impact (4-qubit QSVC)", fontsize=13, fontweight="bold")
        ax.set_xticks(x)
        ax.set_xticklabels(metrics)
        ax.legend()
        ax.grid(True, alpha=0.3, axis="y")
        ax.set_ylim([0, 1.0])

        plt.tight_layout()
        output_path = output_dir / "03_noise_impact.png"
        plt.savefig(output_path, dpi=150, bbox_inches="tight")
        logger.info(f"Saved plot: {output_path}")
        plt.close()

        return output_path

    except Exception as e:
        logger.error(f"Error plotting noise impact: {e}")
        return None


def plot_model_comparison(csv_path: Path, output_dir: Path = None) -> Optional[Path]:
    """
    Plot model comparison (XGBoost vs QSVC vs VQC).

    Parameters
    ----------
    csv_path : Path
        Path to model_comparison.csv
    output_dir : Path, optional

    Returns
    -------
    Path to saved plot, or None if plotting fails
    """
    if not HAS_MATPLOTLIB:
        return None

    if output_dir is None:
        output_dir = ensure_plots_dir()

    try:
        df = pd.read_csv(csv_path)

        setup_matplotlib()
        fig, ax = plt.subplots(figsize=(12, 6))

        metrics = ["pr_auc", "roc_auc", "f1", "precision", "recall"]
        x = np.arange(len(metrics))
        width = 1.0 / (len(df) + 1)

        colors = ["#1f77b4", "#ff7f0e", "#2ca02c"]

        for i, (idx, row) in enumerate(df.iterrows()):
            values = [row[m] for m in metrics]
            offset = (i - len(df) / 2 + 0.5) * width
            ax.bar(x + offset, values, width, label=row["model"], alpha=0.8, color=colors[i % len(colors)])

        ax.set_xlabel("Metrics", fontsize=12, fontweight="bold")
        ax.set_ylabel("Score", fontsize=12, fontweight="bold")
        ax.set_title("Model Comparison: Classical vs Quantum", fontsize=13, fontweight="bold")
        ax.set_xticks(x)
        ax.set_xticklabels(metrics)
        ax.legend(fontsize=11)
        ax.grid(True, alpha=0.3, axis="y")
        ax.set_ylim([0, 1.0])

        plt.tight_layout()
        output_path = output_dir / "04_model_comparison.png"
        plt.savefig(output_path, dpi=150, bbox_inches="tight")
        logger.info(f"Saved plot: {output_path}")
        plt.close()

        return output_path

    except Exception as e:
        logger.error(f"Error plotting model comparison: {e}")
        return None


def create_all_visualizations(results_dir: Path = None) -> None:
    """
    Create all Phase 2 visualizations.

    Looks for CSV files in results_dir and generates plots.

    Parameters
    ----------
    results_dir : Path, optional
        Directory containing Phase 2 results. Defaults to phase2/results/
    """
    if not HAS_MATPLOTLIB:
        logger.warning("matplotlib not installed; skipping visualizations")
        return

    if results_dir is None:
        from phase2.quantum.config import PHASE2_RESULTS_DIR
        results_dir = PHASE2_RESULTS_DIR

    print(f"\nCreating Phase 2 visualizations…")
    print(f"Results directory: {results_dir}\n")

    plots_dir = ensure_plots_dir(results_dir)

    plots_created = []

    # Feature count analysis
    fc_path = results_dir / "feature_count_results.csv"
    if fc_path.exists():
        print(f"  • Creating feature count analysis plot…")
        p = plot_feature_count_results(fc_path, plots_dir)
        if p:
            plots_created.append(p)

    # Feature map comparison
    fm_path = results_dir / "feature_map_results.csv"
    if fm_path.exists():
        print(f"  • Creating feature map comparison plot…")
        p = plot_feature_map_comparison(fm_path, plots_dir)
        if p:
            plots_created.append(p)

    # Noise impact
    noise_path = results_dir / "noise_results.csv"
    if noise_path.exists():
        print(f"  • Creating noise impact plot…")
        p = plot_noise_impact(noise_path, plots_dir)
        if p:
            plots_created.append(p)

    # Model comparison
    comp_path = results_dir / "model_comparison.csv"
    if comp_path.exists():
        print(f"  • Creating model comparison plot…")
        p = plot_model_comparison(comp_path, plots_dir)
        if p:
            plots_created.append(p)

    print(f"\n✓ Created {len(plots_created)} visualizations")
    for p in plots_created:
        print(f"  - {p.name}")
    print()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    create_all_visualizations()
