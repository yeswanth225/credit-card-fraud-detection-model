"""
Phase 2 — Feature Count Experiment
====================================

RESEARCH QUESTION
------------------
How does the number of quantum features (qubits) affect QSVC performance
on credit-card fraud detection?

Do we see monotonic improvement? A sweet spot? Diminishing returns?

EXPERIMENT DESIGN
------------------
We run QSVC with configurations:
  - 2 qubits (2 features)
  - 4 qubits (4 features)  ← default
  - 6 qubits (6 features)
  - 8 qubits (8 features)  ← all available

For each:
  - Use the same quantum feature map (ZZ, reps=2)
  - Use the same train/test subsets (balanced/stratified)
  - Measure: PR-AUC, Recall, Precision, F1, ROC-AUC, FPR
  - Measure: circuit resources (depth, gates)
  - Measure: runtime

IMPORTANT
----------
This experiment does NOT claim that more qubits automatically means better
performance. We are collecting empirical data to understand the tradeoff
between:
  - Model expressibility (more qubits → more quantum states)
  - Kernel complexity (more qubits → deeper circuits, more noise-sensitive)
  - Computational cost (O(N²) kernel matrix grows)

RESULTS OUTPUT
---------------
CSV file: phase2/results/feature_count_results.csv

Columns:
  n_qubits, feature_indices, n_samples_train, n_samples_test,
  pr_auc, roc_auc, f1, precision, recall, fpr,
  circuit_depth, n_gates, train_kernel_time_s, test_kernel_time_s, total_time_s

HOW TO RUN
-----------
    python -m phase2.experiments.feature_count_experiment

This will run all 4 configurations and save results to CSV.
"""

from __future__ import annotations

import csv
import json
import logging
import time
from pathlib import Path
from typing import Dict, List

import numpy as np

from phase2.quantum.config import QuantumConfig, PHASE2_RESULTS_DIR
from phase2.quantum.qsvc_model import run_qsvc_experiment
from phase2.quantum.data_preparation import load_quantum_dataset, get_feature_names

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def run_feature_count_experiment() -> None:
    """Run QSVC with varying feature counts and collect results."""

    print("\n" + "=" * 70)
    print("  PHASE 2 — FEATURE COUNT EXPERIMENT")
    print("=" * 70)
    print("""
  Research question:
    How does the number of quantum features (qubits) affect
    fraud detection performance in QSVC?

  Configurations tested:
    - 2 qubits (2 features)
    - 4 qubits (4 features, default)
    - 6 qubits (6 features)
    - 8 qubits (8 features, all)

  Each configuration uses:
    - ZZFeatureMap with reps=2
    - 800 training samples (balanced)
    - 200 test samples (stratified)
    - Statevector simulation (exact, no shot noise)

  Metrics recorded:
    - PR-AUC, ROC-AUC, F1, Precision, Recall, FPR
    - Circuit depth, gate count
    - Kernel computation times
    - Total training time
""")

    # Configurations to test
    # All use consistent 100/25 split matching the primary benchmark
    configs = [
        QuantumConfig(n_qubits=2, feature_indices=[0, 1], random_seed=42),
        QuantumConfig(n_qubits=4, feature_indices=[0, 1, 2, 3], random_seed=42),
        QuantumConfig(n_qubits=6, feature_indices=[0, 1, 2, 3, 4, 5], random_seed=42),
        QuantumConfig(n_qubits=8, feature_indices=[0, 1, 2, 3, 4, 5, 6, 7], random_seed=42),
    ]

    results: List[Dict] = []

    for i, config in enumerate(configs, 1):
        print(f"\n{'=' * 70}")
        print(f"  [{i}/{len(configs)}] Running {config.n_qubits}-qubit QSVC")
        print(f"{'=' * 70}")

        print(f"  Configuration:")
        print(f"    Qubits: {config.n_qubits}")
        print(f"    Features: {get_feature_names(config)}")
        print(f"    Training samples: {config.train_subset_size} (balanced)")
        print(f"    Test samples: {config.test_subset_size} (stratified)")
        print()

        try:
            # Run QSVC experiment
            t0 = time.perf_counter()
            experiment_results = run_qsvc_experiment(config=config, verbose=False)
            total_time = time.perf_counter() - t0

            # Extract metrics
            row = {
                "n_qubits": config.n_qubits,
                "feature_indices": str(config.feature_indices),
                "selected_features": ",".join(get_feature_names(config)),
                "n_samples_train": config.train_subset_size,
                "n_samples_test": config.test_subset_size,
                "pr_auc": round(experiment_results.get("pr_auc", np.nan), 4),
                "roc_auc": round(experiment_results.get("roc_auc", np.nan), 4),
                "f1": round(experiment_results.get("f1", np.nan), 4),
                "precision": round(experiment_results.get("precision", np.nan), 4),
                "recall": round(experiment_results.get("recall", np.nan), 4),
                "fpr": round(experiment_results.get("fpr", np.nan), 4),
                "circuit_depth": experiment_results.get("circuit_depth", "N/A"),
                "n_gates": experiment_results.get("n_gates", "N/A"),
                "train_kernel_time_s": round(experiment_results.get("train_kernel_seconds", 0), 2),
                "test_kernel_time_s": round(experiment_results.get("test_kernel_seconds", 0), 2),
                "total_time_s": round(total_time, 2),
            }

            results.append(row)

            # Print summary for this configuration
            print(f"  Results ({config.n_qubits} qubits):")
            print(f"    PR-AUC   : {row['pr_auc']:.4f}")
            print(f"    ROC-AUC  : {row['roc_auc']:.4f}")
            print(f"    F1 Score : {row['f1']:.4f}")
            print(f"    Precision: {row['precision']:.4f}")
            print(f"    Recall   : {row['recall']:.4f}")
            print(f"    FPR      : {row['fpr']:.4f}")
            print(f"    Circuit depth: {row['circuit_depth']}")
            print(f"    Gate count: {row['n_gates']}")
            print(f"    Time: {row['total_time_s']:.1f} seconds")

        except Exception as e:
            logger.error(f"Error in {config.n_qubits}-qubit experiment: {e}")
            import traceback
            traceback.print_exc()
            row = {
                "n_qubits": config.n_qubits,
                "feature_indices": str(config.feature_indices),
                "selected_features": ",".join(get_feature_names(config)),
                "n_samples_train": config.train_subset_size,
                "n_samples_test": config.test_subset_size,
                "error": str(e),
            }
            results.append(row)

    # Save results to CSV
    output_path = PHASE2_RESULTS_DIR / "feature_count_results.csv"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"\n{'=' * 70}")
    print(f"  Saving results to: {output_path}")
    print(f"{'=' * 70}\n")

    with open(output_path, "w", newline="") as f:
        if results:
            fieldnames = results[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)

    print(f"✓ Saved {len(results)} experiment results to {output_path}\n")

    # Print summary table
    print("\nSummary Table:")
    print("-" * 100)
    if results and "error" not in results[0]:
        header = f"{'Qubits':^8} | {'Features':^20} | {'PR-AUC':^8} | {'ROC-AUC':^8} | {'F1':^8} | {'Precision':^10} | {'Recall':^8} | {'FPR':^8} | {'Time (s)':^10}"
        print(header)
        print("-" * 100)
        for row in results:
            if "error" not in row:
                print(
                    f"{row['n_qubits']:^8} | {row['selected_features']:^20} | "
                    f"{row['pr_auc']:^8.4f} | {row['roc_auc']:^8.4f} | {row['f1']:^8.4f} | "
                    f"{row['precision']:^10.4f} | {row['recall']:^8.4f} | {row['fpr']:^8.4f} | "
                    f"{row['total_time_s']:^10.1f}"
                )

    print("\n" + "=" * 70)
    print("  FEATURE COUNT EXPERIMENT COMPLETE")
    print("=" * 70)
    print(f"""
  Key findings:
    - Tested configurations: 2, 4, 6, 8 qubits
    - Results saved to: {output_path}

  Next steps:
    - Plot PR-AUC vs number of qubits
    - Plot F1 vs number of qubits
    - Compare with classical baseline (PR-AUC: 0.8716)

  Run: python -m phase2.experiments.feature_map_experiment
       to compare different quantum feature maps.
""")


if __name__ == "__main__":
    run_feature_count_experiment()
