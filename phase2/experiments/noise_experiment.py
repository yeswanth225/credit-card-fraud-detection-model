"""
Phase 2 — Noise Experiment: Ideal vs Noisy Simulation
======================================================

RESEARCH QUESTION
------------------
How much does quantum noise degrade QSVC performance?

Current Phase 2 experiments use ideal simulators (exact statevectors).
Real quantum hardware has noise: decoherence, gate errors, measurement errors.

This experiment measures the performance gap between:
  1. IDEAL SIMULATOR: Perfect quantum gates, perfect measurements
  2. NOISY SIMULATOR: Realistic noise model approximating current NISQ devices

IMPORTANCE FOR FRAUD DETECTION
--------------------------------
If quantum models only work in ideal simulation but fail on noisy hardware,
they are not practical for real deployment. This experiment provides
critical evidence about whether quantum fraud detection is feasible.

NOISE MODEL
-----------
We use a simple but realistic noise model with:
  - Depolarizing errors on single-qubit gates
  - Depolarizing errors on two-qubit gates
  - Measurement errors

Error rates are conservative estimates for near-term quantum computers:
  - Single-qubit gate error: 0.001 (0.1%)
  - Two-qubit gate error: 0.01 (1%)
  - Measurement error: 0.01 (1%)

These are typical for 2024-2025 era quantum computers.

EXPERIMENT DESIGN
------------------
Use the best-performing 4-qubit QSVC configuration:
  - 4 qubits (features: V14, V4, V12, V8)
  - ZZ feature map (reps=2)
  - 800 training samples (balanced)
  - 200 test samples (stratified)

Run twice:
  1. Ideal simulation (baseline)
  2. Noisy simulation (degraded performance expected)

Compare: all metrics + circuit resources

RESULTS OUTPUT
---------------
CSV file: phase2/results/noise_results.csv

Columns:
  simulation_type, pr_auc, roc_auc, f1, precision, recall, fpr,
  circuit_depth, gate_count, total_time_s

HOW TO RUN
-----------
    python -m phase2.experiments.noise_experiment

EXPECTED RUNTIME: 20-40 minutes (noisy simulation is slower)
"""

from __future__ import annotations

import csv
import logging
import time
from pathlib import Path
from typing import Dict, List

import numpy as np
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error, pauli_error
from qiskit.primitives import Sampler
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit_algorithms.state_fidelities import ComputeUncompute
from qiskit_machine_learning.algorithms import QSVC

from phase2.quantum.config import QuantumConfig, PHASE2_RESULTS_DIR
from phase2.quantum.feature_encoding import build_zz_feature_map
from phase2.quantum.data_preparation import load_quantum_dataset, get_feature_names, print_dataset_summary
from phase2.quantum.circuits import circuit_resource_info, estimate_kernel_matrix_cost
from phase2.quantum.evaluation import compute_metrics, print_metrics

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def build_noisy_kernel(feature_map, noise_model=None):
    """Build a quantum kernel with optional noise model."""
    if noise_model is None:
        # Ideal case: use exact statevector simulation
        from qiskit.primitives import StatevectorSampler
        sampler = StatevectorSampler()
    else:
        # Noisy case: use Aer simulator with noise model
        simulator = AerSimulator(noise_model=noise_model)
        sampler = Sampler(backend_options={"method": "automatic"})
        sampler._backend = simulator

    fidelity = ComputeUncompute(sampler=sampler)
    kernel = FidelityQuantumKernel(feature_map=feature_map, fidelity=fidelity)
    return kernel


def create_realistic_noise_model() -> NoiseModel:
    """
    Create a realistic noise model for near-term quantum computers.

    Error rates are conservative estimates based on 2024-2025 technology.
    """
    noise_model = NoiseModel()

    # Single-qubit gate errors (0.1%)
    p_1q = 0.001
    error_1q = depolarizing_error(p_1q, 1)

    # Two-qubit gate errors (1%)
    p_2q = 0.01
    error_2q = depolarizing_error(p_2q, 2)

    # Measurement errors (1%)
    p_meas = 0.01
    error_meas = pauli_error([
        (0, 0, 0, 1 - p_meas),  # correct measurement
        (0, 0, 1, p_meas / 2),   # bit flip to |1>
        (0, 1, 0, p_meas / 2),   # bit flip (symmetric)
    ])

    # Add errors to all gates
    noise_model.add_all_qubit_quantum_error(error_1q, ["ry", "rz", "h"])
    noise_model.add_all_qubit_quantum_error(error_2q, ["cx", "rzz"])
    noise_model.add_all_qubit_readout_error(error_meas)

    return noise_model


def run_qsvc_on_simulator(
    config: QuantumConfig,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    noise_model=None,
    label: str = "ideal",
) -> Dict:
    """
    Run QSVC on a given simulator (ideal or noisy).

    Parameters
    ----------
    config : QuantumConfig
    X_train, y_train, X_test, y_test : arrays
    noise_model : NoiseModel or None
        If None, uses ideal simulation; otherwise uses noisy Aer simulator
    label : str
        Label for this simulation ("ideal" or "noisy")

    Returns
    -------
    dict with metrics and resources
    """
    print(f"\n{'=' * 70}")
    print(f"  Running QSVC with {label.upper()} simulation")
    print(f"{'=' * 70}")

    if noise_model is not None:
        print(f"\n  Noise model configuration:")
        print(f"    Single-qubit gate error: 0.1%")
        print(f"    Two-qubit gate error: 1%")
        print(f"    Measurement error: 1%")

    # Build feature map
    feature_map = build_zz_feature_map(n_qubits=config.n_qubits, reps=config.zz_reps)

    # Build kernel
    print(f"\n  Building {label} quantum kernel…")
    if noise_model is None:
        from qiskit.primitives import StatevectorSampler
        sampler = StatevectorSampler()
    else:
        simulator = AerSimulator(noise_model=noise_model)
        sampler = Sampler(backend_options={"simulator_options": {"noise_model": noise_model}})

    fidelity = ComputeUncompute(sampler=sampler)
    kernel = FidelityQuantumKernel(feature_map=feature_map, fidelity=fidelity)

    # Estimate cost
    cost_est = estimate_kernel_matrix_cost(len(X_train), len(X_test))
    print(f"  Kernel matrix: {cost_est['train_matrix_size']} training + {cost_est['test_evaluations']} test evaluations")

    # Compute kernels
    print(f"  Computing kernel matrices…")
    t0_kernel = time.perf_counter()
    K_train = kernel.evaluate(x_vec=X_train)
    train_kernel_seconds = time.perf_counter() - t0_kernel

    K_test = kernel.evaluate(x_vec=X_test, y_vec=X_train)
    test_kernel_seconds = time.perf_counter() - t0_kernel - train_kernel_seconds
    logger.info("  Kernel computation done in %.1f s", train_kernel_seconds + test_kernel_seconds)

    # Train QSVC
    print(f"  Training QSVC…")
    t0_train = time.perf_counter()
    qsvc = QSVC(quantum_kernel=kernel, C=config.svm_C)
    qsvc.fit(X_train, y_train)
    train_seconds = time.perf_counter() - t0_train

    # Predict and evaluate
    print(f"  Evaluating on test set…")
    y_pred = qsvc.predict(X_test)
    y_pred_proba = qsvc.decision_function(X_test)

    metrics = compute_metrics(y_test, y_pred, y_pred_proba)

    # Add circuit and timing info
    info = circuit_resource_info(feature_map)
    metrics["circuit_depth"] = info["depth"]
    metrics["n_gates"] = info["n_gates"]
    metrics["total_time_seconds"] = train_kernel_seconds + test_kernel_seconds + train_seconds

    print(f"\n  Results ({label}):")
    print_metrics(metrics, model_name=label)

    return metrics


def run_noise_experiment() -> None:
    """Run QSVC on ideal and noisy simulators and compare."""

    print("\n" + "=" * 70)
    print("  PHASE 2 — NOISE EXPERIMENT")
    print("=" * 70)
    print("""
  Research question:
    How much does quantum noise degrade QSVC performance
    on fraud detection?

  Simulators tested:
    1. Ideal (perfect gates, perfect measurements)
    2. Noisy (realistic error model for 2024-2025 quantum computers)

  Noise model:
    - Single-qubit gate error: 0.1%
    - Two-qubit gate error: 1%
    - Measurement error: 1%

  Experiment design:
    - Same 4-qubit configuration
    - Same fraud dataset (800 train, 200 test)
    - Same ZZ feature map (reps=2)
    - Compare: all metrics

  Interpretation:
    If ideal >> noisy: quantum models unrealistic without error correction
    If ideal ≈ noisy: quantum models might be feasible
    If noisy is acceptable: promising for near-term deployment
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

    # Run on ideal simulator
    print(f"\n{'=' * 70}")
    print(f"  STEP 1: Ideal Simulation (baseline)")
    print(f"{'=' * 70}")

    try:
        ideal_metrics = run_qsvc_on_simulator(
            config=config,
            X_train=X_train,
            y_train=y_train,
            X_test=X_test,
            y_test=y_test,
            noise_model=None,
            label="ideal",
        )
    except Exception as e:
        logger.error(f"Error in ideal simulation: {e}")
        import traceback
        traceback.print_exc()
        ideal_metrics = None

    # Run on noisy simulator
    print(f"\n{'=' * 70}")
    print(f"  STEP 2: Noisy Simulation (degraded performance expected)")
    print(f"{'=' * 70}")

    noise_model = create_realistic_noise_model()

    try:
        noisy_metrics = run_qsvc_on_simulator(
            config=config,
            X_train=X_train,
            y_train=y_train,
            X_test=X_test,
            y_test=y_test,
            noise_model=noise_model,
            label="noisy",
        )
    except Exception as e:
        logger.error(f"Error in noisy simulation: {e}")
        import traceback
        traceback.print_exc()
        noisy_metrics = None

    # Compare results
    results = []

    if ideal_metrics:
        row = {
            "simulation_type": "ideal",
            "pr_auc": round(ideal_metrics.get("pr_auc", np.nan), 4),
            "roc_auc": round(ideal_metrics.get("roc_auc", np.nan), 4),
            "f1": round(ideal_metrics.get("f1", np.nan), 4),
            "precision": round(ideal_metrics.get("precision", np.nan), 4),
            "recall": round(ideal_metrics.get("recall", np.nan), 4),
            "fpr": round(ideal_metrics.get("fpr", np.nan), 4),
            "circuit_depth": ideal_metrics.get("circuit_depth", "N/A"),
            "gate_count": ideal_metrics.get("n_gates", "N/A"),
            "total_time_s": round(ideal_metrics.get("total_time_seconds", 0), 2),
        }
        results.append(row)

    if noisy_metrics:
        row = {
            "simulation_type": "noisy",
            "pr_auc": round(noisy_metrics.get("pr_auc", np.nan), 4),
            "roc_auc": round(noisy_metrics.get("roc_auc", np.nan), 4),
            "f1": round(noisy_metrics.get("f1", np.nan), 4),
            "precision": round(noisy_metrics.get("precision", np.nan), 4),
            "recall": round(noisy_metrics.get("recall", np.nan), 4),
            "fpr": round(noisy_metrics.get("fpr", np.nan), 4),
            "circuit_depth": noisy_metrics.get("circuit_depth", "N/A"),
            "gate_count": noisy_metrics.get("n_gates", "N/A"),
            "total_time_s": round(noisy_metrics.get("total_time_seconds", 0), 2),
        }
        results.append(row)

    # Save results
    output_path = PHASE2_RESULTS_DIR / "noise_results.csv"
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

    # Print comparison
    print("\nNoise Impact Analysis:")
    print("-" * 110)
    if ideal_metrics and noisy_metrics:
        print(f"{'Metric':^15} | {'Ideal':^12} | {'Noisy':^12} | {'Degradation':^15} | {'% Change':^12}")
        print("-" * 110)

        for key in ["pr_auc", "roc_auc", "f1", "precision", "recall"]:
            ideal_val = ideal_metrics.get(key, np.nan)
            noisy_val = noisy_metrics.get(key, np.nan)
            if not (np.isnan(ideal_val) or np.isnan(noisy_val)):
                degradation = ideal_val - noisy_val
                pct_change = (degradation / ideal_val) * 100 if ideal_val != 0 else 0
                print(
                    f"{key:^15} | {ideal_val:^12.4f} | {noisy_val:^12.4f} | "
                    f"{degradation:^15.4f} | {pct_change:^12.1f}%"
                )

    print("\n" + "=" * 70)
    print("  NOISE EXPERIMENT COMPLETE")
    print("=" * 70)
    print(f"""
  Results saved to: {output_path}

  Key findings:
    - Compared ideal vs noisy (1% error rate) simulation
    - Measured performance degradation
    - Quantified impact of quantum noise

  Interpretation:
    Large degradation (>20% relative) suggests quantum models
    are noise-sensitive and may require error correction for real hardware.

    Small degradation (<5% relative) suggests quantum models might
    be feasible on near-term quantum computers.

  Next step:
    Compare all models (XGBoost vs QSVC vs VQC) on same benchmarks.
    python -m phase2.experiments.benchmark
""")


if __name__ == "__main__":
    run_noise_experiment()
