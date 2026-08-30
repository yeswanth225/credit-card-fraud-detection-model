"""
Phase 2 — Feature Map Comparison Experiment
==============================================

RESEARCH QUESTION
------------------
How does the choice of quantum feature map affect fraud detection performance?

Do different encoding strategies produce materially different results?

FEATURE MAPS TESTED
---------------------
1. ANGLE ENCODING (baseline)
   - Simplest: one RY gate per qubit, one layer
   - Circuit depth: 1
   - No feature interactions
   - Educational baseline

2. ZZ FEATURE MAP (default for QSVC)
   - More expressive: Hadamard + RZ + RZZ interactions
   - Circuit depth: 2 * reps (typically 4-6)
   - Captures feature interactions via entanglement
   - Proven to work for kernel methods (Havlíček et al., 2019)

EXPERIMENT DESIGN
------------------
For each feature map:
  - Use the SAME 4-qubit configuration
  - Use the SAME fraud dataset (800 train, 200 test)
  - Use the SAME ZZFeatureMap repetitions (reps=2)
  - Train QSVC
  - Measure: all metrics (PR-AUC, Recall, Precision, F1, ROC-AUC, FPR)
  - Measure: circuit resources (depth, gates)
  - Measure: runtime

EXPECTED OUTCOME
-----------------
We are NOT assuming ZZ is better than angle encoding.
We will collect empirical data and report honestly:
  - If ZZ shows improvement → document it and quantify it
  - If angle encoding is competitive → note that simpler is better
  - If neither works well → that's valuable information too

RESULTS OUTPUT
---------------
CSV file: phase2/results/feature_map_results.csv

Columns:
  feature_map, n_qubits, circuit_depth, n_gates,
  pr_auc, roc_auc, f1, precision, recall, fpr,
  train_kernel_time_s, test_kernel_time_s, total_time_s

HOW TO RUN
-----------
    python -m phase2.experiments.feature_map_experiment
"""

from __future__ import annotations

import csv
import logging
import time
from pathlib import Path
from typing import Dict, List

import numpy as np

from phase2.quantum.config import QuantumConfig, PHASE2_RESULTS_DIR
from phase2.quantum.feature_encoding import (
    build_angle_encoding_circuit,
    build_zz_feature_map,
    describe_feature_map,
)
from phase2.quantum.quantum_kernel import build_quantum_kernel
from phase2.quantum.data_preparation import load_quantum_dataset, get_feature_names, print_dataset_summary
from phase2.quantum.circuits import circuit_resource_info, estimate_kernel_matrix_cost
from phase2.quantum.evaluation import compute_metrics, print_metrics
from qiskit_machine_learning.algorithms import QSVC

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def run_qsvc_with_feature_map(
    feature_map_name: str,
    feature_map,
    config: QuantumConfig,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> Dict:
    """
    Train and evaluate QSVC with a given feature map.

    Parameters
    ----------
    feature_map_name : str
        Name of the feature map ("angle", "zz", etc.)
    feature_map : QuantumCircuit
        The actual feature map circuit
    config : QuantumConfig
        Configuration (used for SVM C parameter)
    X_train, y_train, X_test, y_test : arrays
        Training and test data

    Returns
    -------
    dict with metrics and circuit resources
    """
    print(f"\n  Feature map: {feature_map_name}")
    describe_feature_map(feature_map)

    # Build quantum kernel
    print(f"\n  Building quantum kernel…")
    kernel = build_quantum_kernel(feature_map=feature_map, shots=None)

    # Estimate and print kernel computation cost
    cost_est = estimate_kernel_matrix_cost(len(X_train), len(X_test))
    print(f"\n  Kernel matrix cost:")
    print(f"    Training matrix:  {cost_est['train_matrix_size']} ({cost_est['train_evaluations']} evaluations)")
    print(f"    Test matrix:      {cost_est['n_test']} x {cost_est['n_train']} ({cost_est['test_evaluations']} evaluations)")
    print(f"    Total evaluations: {cost_est['total_evaluations']}")

    # Compute kernel matrices with timing
    print(f"\n  Computing kernel matrices…")
    t0_kernel = time.perf_counter()
    K_train = kernel.evaluate(x_vec=X_train)
    train_kernel_seconds = time.perf_counter() - t0_kernel
    logger.info("  Training kernel computed in %.1f s", train_kernel_seconds)

    K_test = kernel.evaluate(x_vec=X_test, y_vec=X_train)
    test_kernel_seconds = time.perf_counter() - t0_kernel - train_kernel_seconds
    logger.info("  Test kernel computed in %.1f s", test_kernel_seconds)

    # Train QSVC
    print(f"\n  Training QSVC…")
    t0_train = time.perf_counter()
    qsvc = QSVC(quantum_kernel=kernel, C=config.svm_C)
    qsvc.fit(X_train, y_train)
    train_seconds = time.perf_counter() - t0_train
    logger.info("  QSVC training done in %.1f s", train_seconds)

    # Predict
    print(f"\n  Making predictions…")
    y_pred = qsvc.predict(X_test)
    y_pred_proba = qsvc.decision_function(X_test)

    # Evaluate
    metrics = compute_metrics(y_test, y_pred, y_pred_proba, threshold=0.5)

    # Add circuit info
    info = circuit_resource_info(feature_map)
    metrics["circuit_depth"] = info["depth"]
    metrics["n_gates"] = info["n_gates"]
    metrics["train_kernel_seconds"] = train_kernel_seconds
    metrics["test_kernel_seconds"] = test_kernel_seconds
    metrics["total_time_seconds"] = train_seconds + train_kernel_seconds + test_kernel_seconds

    return metrics


def run_feature_map_experiment() -> None:
    """Run QSVC with different feature maps and compare results."""

    print("\n" + "=" * 70)
    print("  PHASE 2 — FEATURE MAP COMPARISON EXPERIMENT")
    print("=" * 70)
    print("""
  Research question:
    How does the choice of quantum feature map affect
    fraud detection performance?

  Feature maps tested:
    1. Angle Encoding (simplest baseline)
       - One RY gate per qubit
       - Circuit depth: 1
       - No feature interactions

    2. ZZ Feature Map (proven for kernel methods)
       - Hadamard + RZ rotations + ZZ interactions
       - Circuit depth: 2 * reps (typically 4-6)
       - Captures non-linear relationships

  Experiment design:
    - Same 4-qubit configuration
    - Same fraud dataset (800 train, 200 test)
    - Same evaluation metrics
    - Compare: all metrics + circuit resources + runtime

  Note:
    This is an empirical investigation, not a performance benchmark.
    We will report the results honestly, regardless of which is better.
""")

    # Load data - use consistent 100/25 split matching primary benchmark
    config = QuantumConfig(
        n_qubits=4,
        feature_indices=[0, 1, 2, 3],
        train_subset_size=100,
        test_subset_size=25,
        random_seed=42,
    )

    print(f"\nLoading data…")
    X_train, y_train, X_test, y_test = load_quantum_dataset(config)
    print_dataset_summary(X_train, y_train, X_test, y_test, config)

    # Define feature maps to test
    feature_maps_to_test = [
        ("angle_encoding", build_angle_encoding_circuit(n_qubits=4)),
        ("zz_feature_map", build_zz_feature_map(n_qubits=4, reps=2, entanglement="linear")),
    ]

    results: List[Dict] = []

    for i, (fm_name, fm_circuit) in enumerate(feature_maps_to_test, 1):
        print(f"\n{'=' * 70}")
        print(f"  [{i}/{len(feature_maps_to_test)}] Testing feature map: {fm_name}")
        print(f"{'=' * 70}")

        try:
            metrics = run_qsvc_with_feature_map(
                feature_map_name=fm_name,
                feature_map=fm_circuit,
                config=config,
                X_train=X_train,
                y_train=y_train,
                X_test=X_test,
                y_test=y_test,
            )

            print(f"\n  Metrics for {fm_name}:")
            print_metrics(metrics, model_name=fm_name)

            # Add feature map name to results
            row = {
                "feature_map": fm_name,
                "n_qubits": 4,
                "circuit_depth": metrics["circuit_depth"],
                "n_gates": metrics["n_gates"],
                "pr_auc": round(metrics.get("pr_auc", np.nan), 4),
                "roc_auc": round(metrics.get("roc_auc", np.nan), 4),
                "f1": round(metrics.get("f1", np.nan), 4),
                "precision": round(metrics.get("precision", np.nan), 4),
                "recall": round(metrics.get("recall", np.nan), 4),
                "fpr": round(metrics.get("fpr", np.nan), 4),
                "train_kernel_time_s": round(metrics.get("train_kernel_seconds", 0), 2),
                "test_kernel_time_s": round(metrics.get("test_kernel_seconds", 0), 2),
                "total_time_s": round(metrics.get("total_time_seconds", 0), 2),
            }
            results.append(row)

        except Exception as e:
            logger.error(f"Error testing {fm_name}: {e}")
            import traceback
            traceback.print_exc()
            row = {
                "feature_map": fm_name,
                "n_qubits": 4,
                "error": str(e),
            }
            results.append(row)

    # Save results to CSV
    output_path = PHASE2_RESULTS_DIR / "feature_map_results.csv"
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

    print(f"✓ Saved {len(results)} results to {output_path}\n")

    # Print comparison table
    print("\nComparison Table:")
    print("-" * 120)
    if results and "error" not in results[0]:
        header = f"{'Feature Map':^20} | {'Depth':^6} | {'Gates':^6} | {'PR-AUC':^8} | {'ROC-AUC':^8} | {'F1':^8} | {'Precision':^10} | {'Recall':^8} | {'FPR':^8} | {'Time (s)':^10}"
        print(header)
        print("-" * 120)
        for row in results:
            if "error" not in row:
                print(
                    f"{row['feature_map']:^20} | {row['circuit_depth']:^6} | {row['n_gates']:^6} | "
                    f"{row['pr_auc']:^8.4f} | {row['roc_auc']:^8.4f} | {row['f1']:^8.4f} | "
                    f"{row['precision']:^10.4f} | {row['recall']:^8.4f} | {row['fpr']:^8.4f} | "
                    f"{row['total_time_s']:^10.1f}"
                )

    print("\n" + "=" * 70)
    print("  FEATURE MAP COMPARISON COMPLETE")
    print("=" * 70)
    print(f"""
  Results saved to: {output_path}

  Key observations:
    - Compared angle encoding vs ZZ feature map
    - Same 4-qubit configuration and dataset
    - Tracked all metrics and circuit resources

  Next step:
    Run the full benchmark to compare with classical XGBoost baseline.
    python -m phase2.experiments.benchmark
""")


if __name__ == "__main__":
    run_feature_map_experiment()
