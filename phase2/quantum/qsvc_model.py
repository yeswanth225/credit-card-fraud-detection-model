"""
Phase 2 — Quantum Support Vector Classifier (QSVC) Experiment
===============================================================

WHAT IS QSVC?
--------------
QSVC (Quantum Support Vector Classifier) is a classical SVM whose
similarity function (kernel) is replaced by a quantum kernel.

Pipeline:
    Classical features
        → angle encoding to [-π, π]
        → ZZ quantum feature map (encodes to quantum state |φ(x)⟩)
        → FidelityQuantumKernel (computes K(x,z) = |⟨φ(x)|φ(z)⟩|²)
        → Classical SVM (finds optimal hyperplane in quantum feature space)
        → Binary fraud prediction

The SVM optimisation (finding support vectors) is classical.
Only the kernel evaluation is quantum.

WHY SVM FOR QUANTUM?
---------------------
SVMs are particularly well-suited for quantum kernels because:
  - The kernel trick allows working in the quantum Hilbert space
    without explicitly constructing the exponentially large state vectors
  - SVMs have strong theoretical guarantees (large-margin classifiers)
  - The kernel evaluation is independent for each pair (x, z),
    making it natural to parallelise across quantum circuits

LIMITATIONS
-----------
  - Kernel matrix computation scales as O(N²) — must use small datasets
  - Current simulators use exact statevectors (no decoherence)
  - Real quantum hardware would add noise at every gate
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Dict, Optional

import numpy as np
from sklearn.svm import SVC
from qiskit_machine_learning.algorithms import QSVC

from .config import QuantumConfig, DEFAULT_CONFIG
from .data_preparation import load_quantum_dataset, get_feature_names, print_dataset_summary
from .feature_encoding import build_zz_feature_map, describe_feature_map
from .quantum_kernel import build_quantum_kernel, compute_kernel_matrix_timed
from .circuits import circuit_resource_info, print_circuit_resources, estimate_kernel_matrix_cost
from .evaluation import compute_metrics, print_metrics

logger = logging.getLogger(__name__)


class QSVCExperiment:
    """
    A complete QSVC experiment on the fraud detection dataset.

    Encapsulates: data loading → feature map → kernel → SVM → evaluation.

    Parameters
    ----------
    config : QuantumConfig
        Experiment configuration. Use DEFAULT_CONFIG or create a custom one.
    """

    def __init__(self, config: QuantumConfig = DEFAULT_CONFIG):
        self.config = config
        self.feature_map = None
        self.kernel = None
        self.model: Optional[QSVC] = None
        self.results: Dict = {}

    # ------------------------------------------------------------------
    # Build
    # ------------------------------------------------------------------

    def build(self) -> "QSVCExperiment":
        """
        Build the feature map and quantum kernel.

        This method is idempotent — safe to call multiple times.

        Returns
        -------
        self (for chaining)
        """
        logger.info("Building ZZFeatureMap (n_qubits=%d, reps=%d) …",
                    self.config.n_qubits, self.config.zz_reps)

        self.feature_map = build_zz_feature_map(
            n_qubits=self.config.n_qubits,
            reps=self.config.zz_reps,
        )

        self.kernel = build_quantum_kernel(
            feature_map=self.feature_map,
            shots=self.config.shots,
        )

        # Record circuit resources
        circuit_info = circuit_resource_info(self.feature_map)
        self.results["circuit_resources"] = circuit_info

        return self

    # ------------------------------------------------------------------
    # Train
    # ------------------------------------------------------------------

    def fit(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
    ) -> "QSVCExperiment":
        """
        Train the QSVC model on the given dataset.

        Parameters
        ----------
        X_train : np.ndarray, shape (n_train, n_features)
            Training features (angle-encoded, values in [-π, π]).
        y_train : np.ndarray, shape (n_train,)
            Training labels (0=legit, 1=fraud).

        Returns
        -------
        self
        """
        if self.kernel is None:
            self.build()

        logger.info("Training QSVC on %d samples …", len(y_train))

        self.model = QSVC(
            quantum_kernel=self.kernel,
            C=self.config.svm_C,
        )

        t0 = time.perf_counter()
        self.model.fit(X_train, y_train)
        train_seconds = time.perf_counter() - t0

        self.results["training_time_seconds"] = round(train_seconds, 3)
        self.results["n_train"] = len(y_train)
        self.results["n_train_fraud"] = int(y_train.sum())

        logger.info("QSVC training complete in %.1f s", train_seconds)
        return self

    # ------------------------------------------------------------------
    # Evaluate
    # ------------------------------------------------------------------

    def evaluate(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray,
    ) -> Dict:
        """
        Evaluate the trained QSVC on a test set.

        Parameters
        ----------
        X_test : np.ndarray
        y_test : np.ndarray

        Returns
        -------
        dict of evaluation metrics
        """
        if self.model is None:
            raise RuntimeError("Call fit() before evaluate().")

        logger.info("Evaluating QSVC on %d samples …", len(y_test))

        t0 = time.perf_counter()
        y_pred = self.model.predict(X_test)
        inference_seconds = time.perf_counter() - t0

        # QSVC does not expose predict_proba by default;
        # use decision_function as a probability proxy for ROC/PR curves
        try:
            y_score = self.model.decision_function(X_test)
            # Normalise to [0, 1] so it behaves like a probability
            y_score = (y_score - y_score.min()) / (y_score.max() - y_score.min() + 1e-10)
        except Exception:
            y_score = None

        metrics = compute_metrics(y_true=y_test, y_pred=y_pred, y_prob=y_score)

        self.results["inference_time_seconds"] = round(inference_seconds, 3)
        self.results["n_test"] = len(y_test)
        self.results["n_test_fraud"] = int(y_test.sum())
        self.results["metrics"] = metrics

        return metrics

    # ------------------------------------------------------------------
    # Save
    # ------------------------------------------------------------------

    def save_results(self, filepath: Optional[str | Path] = None) -> Path:
        """
        Save experiment results to a JSON file.

        Parameters
        ----------
        filepath : str or Path, optional
            Default: phase2/results/quantum_kernel_results.json

        Returns
        -------
        Path to saved file.
        """
        if filepath is None:
            filepath = self.config.results_dir / "quantum_kernel_results.json"

        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        # Build complete results record
        record = {
            "experiment": "QSVC (Quantum Kernel SVM)",
            "config": {
                "n_qubits":          self.config.n_qubits,
                "zz_reps":           self.config.zz_reps,
                "train_subset_size": self.config.train_subset_size,
                "test_subset_size":  self.config.test_subset_size,
                "balanced_train":    self.config.balanced_train,
                "random_seed":       self.config.random_seed,
                "shots":             self.config.shots,
                "svm_C":             self.config.svm_C,
            },
            **self.results,
        }

        with open(filepath, "w") as f:
            json.dump(record, f, indent=2)

        logger.info("Results saved to %s", filepath)
        return filepath


def run_qsvc_experiment(
    config: QuantumConfig = DEFAULT_CONFIG,
    verbose: bool = True,
) -> Dict:
    """
    End-to-end QSVC experiment runner.

    Parameters
    ----------
    config : QuantumConfig
    verbose : bool

    Returns
    -------
    dict of evaluation metrics
    """
    if verbose:
        print(config.summary())

    # 1. Load data
    X_train, y_train, X_test, y_test = load_quantum_dataset(config)

    if verbose:
        print_dataset_summary(X_train, y_train, X_test, y_test, config)

    # 2. Build experiment
    exp = QSVCExperiment(config)
    exp.build()

    if verbose:
        print_circuit_resources(exp.feature_map, label="ZZFeatureMap")
        cost = estimate_kernel_matrix_cost(len(y_train), len(y_test))
        print(f"\n  Kernel matrix cost:")
        print(f"    Train matrix : {cost['train_matrix_size']} = {cost['train_evaluations']:,} evaluations")
        print(f"    Test matrix  : {cost['test_evaluations']:,} evaluations")

    # 3. Train
    exp.fit(X_train, y_train)

    # 4. Evaluate
    metrics = exp.evaluate(X_test, y_test)

    if verbose:
        print_metrics(metrics, "QSVC")
        print(f"\n  Training time : {exp.results['training_time_seconds']:.1f} s")
        print(f"  Inference time: {exp.results['inference_time_seconds']:.3f} s")

    # 5. Save
    saved_path = exp.save_results()
    if verbose:
        print(f"\n  Results saved: {saved_path}")

    return metrics
