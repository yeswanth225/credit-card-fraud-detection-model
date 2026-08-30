"""
Phase 2 — Variational Quantum Classifier (VQC) Experiment
===========================================================

WHAT IS A VQC?
---------------
A Variational Quantum Classifier (VQC) is a quantum analog of a
parameterised neural network.

Pipeline:
    Classical features
        → quantum feature map (encodes data as quantum state)
        → parameterised ansatz (trainable quantum circuit)
        → measurement (collapse to classical bits)
        → classical post-processing (sigmoid/softmax → probability)
        → classical optimizer (adjust ansatz parameters to minimise loss)

Key difference from QSVC:
    QSVC : Quantum only for kernel evaluation; SVM is classical.
    VQC  : The entire forward pass runs on a quantum circuit.
           Trainable parameters live *inside* the quantum circuit.

COMPONENTS
-----------
1. FEATURE MAP (encoding layer, not trained):
   ZZFeatureMap maps classical features to quantum states.
   The same feature map used in the QSVC experiment.

2. ANSATZ (variational layer, trained):
   RealAmplitudes — a standard ansatz that alternates between
   single-qubit RY rotations and CNOT entanglement layers.

   For n_qubits=4, reps=2:
       Layer 1: RY(θ_0) RY(θ_1) RY(θ_2) RY(θ_3)
       Layer 2: CNOT(0→1) CNOT(1→2) CNOT(2→3)
       Layer 3: RY(θ_4) RY(θ...) RY(θ_6) RY(θ_7)
       ...
   The θ values are the trainable parameters.

3. CLASSICAL OPTIMIZER:
   COBYLA — Constrained Optimization BY Linear Approximations.
   Gradient-free: does not require backpropagation through the circuit.
   Suitable for small circuits where gradient computation is expensive.

4. LOSS FUNCTION:
   Cross-entropy (binary classification).

TRAINING LOOP
--------------
Each training step:
    1. Sample current parameters θ
    2. Run feature_map + ansatz(θ) on all training samples
    3. Measure output qubit(s) → class probability
    4. Compute cross-entropy loss
    5. Feed loss to COBYLA → update θ
    Repeat until max_iter or convergence.

CURRENT LIMITATIONS
--------------------
- VQC training is slow on classical simulators (each forward pass requires
  running quantum circuits for all training samples)
- With n_train=800 and max_iter=100, expect many minutes of compute time
- The expressibility of RealAmplitudes is limited for complex boundaries
- No trainable quantum kernel — the feature map is fixed

PHASE 3 CONSIDERATION
----------------------
If VQC shows promise, Phase 3 could explore:
  - Trainable feature maps (TrainableFidelityQuantumKernel)
  - More expressive ansatze (EfficientSU2, TwoLocal)
  - Gradient-based optimizers (SPSA, Adam-like variants)
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
from qiskit.circuit.library import RealAmplitudes
from qiskit_machine_learning.algorithms.classifiers import VQC

try:
    from qiskit_algorithms.optimizers import COBYLA, SPSA, L_BFGS_B
except ImportError:
    from qiskit.algorithms.optimizers import COBYLA, SPSA, L_BFGS_B  # type: ignore

from .config import QuantumConfig, DEFAULT_CONFIG
from .data_preparation import load_quantum_dataset, get_feature_names, print_dataset_summary
from .feature_encoding import build_zz_feature_map
from .circuits import circuit_resource_info, print_circuit_resources, combine_feature_map_and_ansatz
from .evaluation import compute_metrics, print_metrics

logger = logging.getLogger(__name__)


class VQCExperiment:
    """
    A complete VQC experiment on the fraud detection dataset.

    Encapsulates: data loading → feature map → ansatz → VQC → evaluation.

    Parameters
    ----------
    config : QuantumConfig
        Experiment configuration.
    """

    def __init__(self, config: QuantumConfig = DEFAULT_CONFIG):
        self.config = config
        self.feature_map = None
        self.ansatz = None
        self.optimizer = None
        self.model: Optional[VQC] = None
        self.results: Dict = {}
        self._loss_history: List[float] = []

    # ------------------------------------------------------------------
    # Build
    # ------------------------------------------------------------------

    def build(self) -> "VQCExperiment":
        """
        Build the feature map, ansatz, and optimizer.

        Returns
        -------
        self
        """
        n_qubits = self.config.n_qubits

        logger.info("Building VQC (n_qubits=%d, zz_reps=%d, vqc_reps=%d) ...",
                    n_qubits, self.config.zz_reps, self.config.vqc_reps)

        # Feature map (same as QSVC for fair comparison)
        self.feature_map = build_zz_feature_map(
            n_qubits=n_qubits,
            reps=self.config.zz_reps,
        )

        # Ansatz: RealAmplitudes uses only real-valued rotations and CNOTs.
        # This keeps the circuit implementable on most hardware architectures.
        self.ansatz = RealAmplitudes(
            num_qubits=n_qubits,
            reps=self.config.vqc_reps,
            entanglement="linear",
        )

        # Optimizer
        opt_name = self.config.vqc_optimizer.upper()
        if opt_name == "SPSA":
            self.optimizer = SPSA(maxiter=self.config.vqc_max_iter)
        elif opt_name == "L_BFGS_B":
            self.optimizer = L_BFGS_B(maxiter=self.config.vqc_max_iter)
        else:
            # Default: COBYLA
            self.optimizer = COBYLA(maxiter=self.config.vqc_max_iter)

        # Record full circuit resources (feature map + ansatz)
        full_circuit = combine_feature_map_and_ansatz(self.feature_map, self.ansatz)
        circuit_info = circuit_resource_info(full_circuit)
        self.results["circuit_resources"] = circuit_info

        return self

    # ------------------------------------------------------------------
    # Train
    # ------------------------------------------------------------------

    def fit(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
    ) -> "VQCExperiment":
        """
        Train the VQC model.

        Parameters
        ----------
        X_train : np.ndarray, shape (n_train, n_features)
        y_train : np.ndarray, shape (n_train,)

        Returns
        -------
        self
        """
        if self.feature_map is None:
            self.build()

        logger.info(
            "Training VQC on %d samples, max_iter=%d, optimizer=%s ...",
            len(y_train), self.config.vqc_max_iter, self.config.vqc_optimizer,
        )

        # Note: Qiskit VQC's callback parameter has known issues with COBYLA optimizer
        # in recent versions. We disable it and track training via model internals instead.
        # The optimizer will still run properly without the callback.

        self.model = VQC(
            feature_map=self.feature_map,
            ansatz=self.ansatz,
            optimizer=self.optimizer,
            # callback deliberately omitted due to Qiskit 2.5 compatibility issues
        )

        t0 = time.perf_counter()
        self.model.fit(X_train, y_train)
        train_seconds = time.perf_counter() - t0

        self.results["training_time_seconds"]  = round(train_seconds, 3)
        self.results["n_train"]                = len(y_train)
        self.results["n_train_fraud"]          = int(y_train.sum())
        # Note: optimizer iteration count is not directly available in Qiskit VQC.
        # We set these to placeholder values indicating data was not collected.
        self.results["n_optimizer_iterations"] = "Not available"
        self.results["final_loss"]             = "Not available"
        self.results["loss_history"]           = []

        logger.info("VQC training complete in %.1f s", train_seconds)
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
        Evaluate the trained VQC on a test set.

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

        logger.info("Evaluating VQC on %d samples ...", len(y_test))

        t0 = time.perf_counter()
        y_pred = self.model.predict(X_test)

        # VQC.predict_proba returns probabilities for each class
        try:
            y_prob_all = self.model.predict_proba(X_test)
            y_prob = y_prob_all[:, 1]  # probability of class 1 (fraud)
        except Exception:
            y_prob = None

        inference_seconds = time.perf_counter() - t0

        metrics = compute_metrics(y_true=y_test, y_pred=y_pred, y_prob=y_prob)

        self.results["inference_time_seconds"] = round(inference_seconds, 3)
        self.results["n_test"]                 = len(y_test)
        self.results["n_test_fraud"]           = int(y_test.sum())
        self.results["metrics"]                = metrics

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
            Default: phase2/results/vqc_results.json
        """
        if filepath is None:
            filepath = self.config.results_dir / "vqc_results.json"

        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        record = {
            "experiment": "VQC (Variational Quantum Classifier)",
            "config": {
                "n_qubits":          self.config.n_qubits,
                "zz_reps":           self.config.zz_reps,
                "vqc_reps":          self.config.vqc_reps,
                "vqc_max_iter":      self.config.vqc_max_iter,
                "vqc_optimizer":     self.config.vqc_optimizer,
                "train_subset_size": self.config.train_subset_size,
                "test_subset_size":  self.config.test_subset_size,
                "balanced_train":    self.config.balanced_train,
                "random_seed":       self.config.random_seed,
                "shots":             self.config.shots,
            },
            **self.results,
        }

        with open(filepath, "w") as f:
            json.dump(record, f, indent=2)

        logger.info("Results saved to %s", filepath)
        return filepath


def run_vqc_experiment(
    config: QuantumConfig = DEFAULT_CONFIG,
    verbose: bool = True,
) -> Dict:
    """
    End-to-end VQC experiment runner.

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

    # 2. Build
    exp = VQCExperiment(config)
    exp.build()

    if verbose:
        # Show full circuit resources (feature map + ansatz combined)
        from .circuits import combine_feature_map_and_ansatz
        full_circ = combine_feature_map_and_ansatz(exp.feature_map, exp.ansatz)
        print_circuit_resources(full_circ, label="Full VQC (Feature Map + Ansatz)")
        print(f"  Trainable parameters: {exp.ansatz.num_parameters}")

    # 3. Train
    exp.fit(X_train, y_train)

    # 4. Evaluate
    metrics = exp.evaluate(X_test, y_test)

    if verbose:
        print_metrics(metrics, "VQC")
        print(f"\n  Training time    : {exp.results['training_time_seconds']:.1f} s")
        print(f"  Iterations done  : {exp.results['n_optimizer_iterations']}")
        final_loss = exp.results.get("final_loss")
        if final_loss is not None and isinstance(final_loss, float):
            print(f"  Final loss       : {final_loss:.4f}")

    # 5. Save
    saved_path = exp.save_results()
    if verbose:
        print(f"\n  Results saved: {saved_path}")

    return metrics
