"""
Phase 2 Quantum ML — Central Configuration
==========================================

All tuneable parameters for Phase 2 experiments live here.
Change values here rather than deep inside experiment scripts.

Design rationale
----------------
Centralised config prevents "magic numbers" scattered across files
and ensures every experiment uses the same seeds, subset sizes,
and paths — which is essential for reproducibility.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List


# ---------------------------------------------------------------------------
# Directory helpers
# ---------------------------------------------------------------------------

# Repository root: two levels up from this file (phase2/quantum/config.py)
_REPO_ROOT = Path(__file__).resolve().parents[2]

PROCESSED_DATA_DIR: Path = _REPO_ROOT / "data" / "processed"
PHASE2_RESULTS_DIR: Path = _REPO_ROOT / "phase2" / "results"

# Ensure results directory always exists when this module is imported
PHASE2_RESULTS_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Experiment configuration dataclass
# ---------------------------------------------------------------------------

@dataclass
class QuantumConfig:
    """
    Central configuration for all Phase 2 quantum experiments.

    Every experiment script imports an instance of this class so that
    parameters are guaranteed to be consistent across runs.

    Attributes
    ----------
    n_qubits : int
        Number of qubits used in quantum circuits.
        Must equal the number of features fed to the quantum model.
        Default 4 → use 4 of the 8 available quantum features.
        Set to 8 for a more expressive but slower experiment.

    feature_indices : List[int]
        Which columns of the 8-feature quantum dataset to use.
        Default [0,1,2,3] → V14, V4, V12, V8 (top-4 by XGBoost importance).
        Set to list(range(8)) to use all 8 features with n_qubits=8.

    train_subset_size : int
        Total number of TRAINING samples for QML experiments.
        Must be kept small because the quantum kernel matrix scales as O(N²).
        Default 800 → roughly 400 fraud + 400 legit (balanced sampling).

    test_subset_size : int
        Total number of TEST samples for QML experiments.
        Default 200 → stratified (real imbalance ~0.17% fraud).

    balanced_train : bool
        If True, oversample training subset to 50/50 fraud/legit balance.
        Essential: with 0.17% fraud rate a naive model always predicts "legit".

    random_seed : int
        Reproducibility seed used by NumPy, Qiskit samplers, and sklearn.

    shots : int
        Number of measurement shots for SamplerV2-based kernel computation.
        Higher shots → lower statistical noise → slower computation.
        None → statevector simulation (exact, fastest on CPU simulator).

    zz_reps : int
        Number of repetitions of the ZZFeatureMap entanglement layer.
        More reps → higher expressibility, deeper circuit, more noise-sensitive.

    vqc_reps : int
        Number of repetitions of the RealAmplitudes ansatz in the VQC.

    vqc_max_iter : int
        Maximum number of optimizer iterations for VQC training.

    vqc_optimizer : str
        Which classical optimizer to use: 'COBYLA' or 'SPSA'.
        COBYLA is gradient-free and stable; SPSA scales to larger circuits.

    svm_C : float
        Regularisation parameter for the SVC inside QSVC.
        Larger C → lower bias, higher variance.
    """

    # --- Circuit dimensions ---
    n_qubits: int = 4
    feature_indices: List[int] = field(default_factory=lambda: [0, 1, 2, 3])

    # --- Dataset sub-sampling ---
    train_subset_size: int = 800
    test_subset_size: int = 200
    balanced_train: bool = True

    # --- Reproducibility ---
    random_seed: int = 42

    # --- Sampler ---
    # None → statevector (exact); int → SamplerV2 with that many shots
    shots: int | None = None

    # --- Feature map ---
    zz_reps: int = 2

    # --- VQC ansatz ---
    vqc_reps: int = 2

    # --- VQC training ---
    vqc_max_iter: int = 100
    vqc_optimizer: str = "COBYLA"

    # --- QSVC regularisation ---
    svm_C: float = 1.0

    # --- Paths (read-only; derived from repo root) ---
    @property
    def quantum_train_path(self) -> Path:
        return PROCESSED_DATA_DIR / "X_train_quantum.npy"

    @property
    def quantum_test_path(self) -> Path:
        return PROCESSED_DATA_DIR / "X_test_quantum.npy"

    @property
    def y_train_path(self) -> Path:
        return PROCESSED_DATA_DIR / "y_train_quantum.npy"

    @property
    def y_test_path(self) -> Path:
        return PROCESSED_DATA_DIR / "y_test_quantum.npy"

    @property
    def quantum_features_path(self) -> Path:
        return PROCESSED_DATA_DIR / "quantum_features.npy"

    @property
    def xgboost_model_path(self) -> Path:
        return PROCESSED_DATA_DIR / "xgboost_model.joblib"

    @property
    def results_dir(self) -> Path:
        return PHASE2_RESULTS_DIR

    def summary(self) -> str:
        """Return a human-readable summary of the active configuration."""
        lines = [
            "=" * 60,
            "  Phase 2 Quantum Config",
            "=" * 60,
            f"  n_qubits          : {self.n_qubits}",
            f"  feature_indices   : {self.feature_indices}",
            f"  train_subset_size : {self.train_subset_size}",
            f"  test_subset_size  : {self.test_subset_size}",
            f"  balanced_train    : {self.balanced_train}",
            f"  random_seed       : {self.random_seed}",
            f"  shots             : {self.shots} (None=statevector)",
            f"  zz_reps           : {self.zz_reps}",
            f"  vqc_reps          : {self.vqc_reps}",
            f"  vqc_max_iter      : {self.vqc_max_iter}",
            f"  vqc_optimizer     : {self.vqc_optimizer}",
            f"  svm_C             : {self.svm_C}",
            "=" * 60,
        ]
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Pre-built config instances for convenience
# ---------------------------------------------------------------------------

# Standard 4-qubit experiment (fast, suitable for development)
DEFAULT_CONFIG = QuantumConfig()

# 8-qubit experiment (slower — uses all available quantum features)
CONFIG_8Q = QuantumConfig(
    n_qubits=8,
    feature_indices=list(range(8)),
    train_subset_size=400,   # smaller because 8-qubit kernel is more expensive
    test_subset_size=100,
    zz_reps=1,               # shallower circuit to keep depth manageable
    vqc_reps=1,
    vqc_max_iter=50,
)
