"""
Phase 2 — Quantum Data Preparation
====================================

Loads the pre-built 8-feature quantum-ready dataset produced by Phase 1
and prepares a small, circuit-ready subset for QML experiments.

WHY DO WE NEED A SUBSET?
-------------------------
Current quantum hardware (and classical simulators of quantum circuits) have
severe scalability limitations:

  - Quantum kernel methods require computing a kernel MATRIX of size N × N.
  - Every entry in that matrix requires running a quantum circuit.
  - For N=800 training samples: 800² = 640,000 circuit evaluations.
  - For the full dataset (N=227,845): ~5 × 10¹⁰ evaluations — completely impractical.

Therefore Phase 2 works on a configurable subset (default: 800 train, 200 test).

WHY DO WE RE-SCALE TO [-π, π]?
--------------------------------
The Phase 1 data was already scaled with StandardScaler (mean=0, std=1).
However, quantum angle-encoding maps feature values directly onto rotation
angles of quantum gates (RY, RZ). Those gates accept angles in radians, and
the most meaningful range for a full rotation is [-π, π].

A StandardScaler does not guarantee bounded output (extreme outliers can be
many standard deviations away from zero). We therefore apply a SECOND
MinMaxScaler to map the feature range to [-π, π].

IMPORTANT: The second scaler is fit ONLY on the training subsample.
It is then applied to the test subsample. This preserves the original
train/test separation and avoids data leakage.

WHY BALANCED TRAINING SUBSAMPLES?
-----------------------------------
The fraud dataset is severely imbalanced: ~0.17% fraud.
A naive QML model trained on this imbalance would simply predict
"legitimate" for every sample and achieve 99.83% accuracy — useless.

We therefore use a balanced training subsample (50% fraud, 50% legit).
The TEST subsample is stratified (preserves real imbalance) so that
evaluation metrics reflect real-world performance.
"""

from __future__ import annotations

import logging
from typing import Tuple

import numpy as np
from sklearn.preprocessing import MinMaxScaler

from .config import QuantumConfig, DEFAULT_CONFIG

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_quantum_dataset(config: QuantumConfig = DEFAULT_CONFIG) -> Tuple[
    np.ndarray, np.ndarray, np.ndarray, np.ndarray
]:
    """
    Load the Phase 1 quantum-ready dataset and return a circuit-ready subset.

    Steps performed
    ---------------
    1. Load X_train_quantum.npy, X_test_quantum.npy, y_train, y_test.
    2. Select the feature columns specified in ``config.feature_indices``.
    3. Sub-sample a balanced training subset and a stratified test subset.
    4. Apply MinMaxScaler (fit on train subset only) to map features to [-π, π].

    Parameters
    ----------
    config : QuantumConfig
        Experiment configuration (n_qubits, subset sizes, seed, …).

    Returns
    -------
    X_train_q : np.ndarray, shape (n_train, n_features)
        Scaled training features, ready for angle encoding.
    y_train_q : np.ndarray, shape (n_train,)
        Training labels (0=legit, 1=fraud).
    X_test_q  : np.ndarray, shape (n_test, n_features)
        Scaled test features.
    y_test_q  : np.ndarray, shape (n_test,)
        Test labels.
    """
    rng = np.random.default_rng(config.random_seed)

    # ------------------------------------------------------------------
    # 1. Load Phase 1 artifacts
    # ------------------------------------------------------------------
    logger.info("Loading Phase 1 quantum-ready dataset …")

    X_train_full = np.load(config.quantum_train_path)
    X_test_full  = np.load(config.quantum_test_path)
    y_train_full = np.load(config.y_train_path)
    y_test_full  = np.load(config.y_test_path)

    logger.info(
        "Loaded — Train: %s (fraud=%d), Test: %s (fraud=%d)",
        X_train_full.shape, int(y_train_full.sum()),
        X_test_full.shape,  int(y_test_full.sum()),
    )

    # ------------------------------------------------------------------
    # 2. Feature selection
    # ------------------------------------------------------------------
    X_train_full = X_train_full[:, config.feature_indices]
    X_test_full  = X_test_full[:, config.feature_indices]

    logger.info("Using %d features (columns %s)", len(config.feature_indices), config.feature_indices)

    # ------------------------------------------------------------------
    # 3. Sub-sampling
    # ------------------------------------------------------------------
    X_train_sub, y_train_sub = _subsample_train(
        X_train_full, y_train_full,
        total_size=config.train_subset_size,
        balanced=config.balanced_train,
        rng=rng,
    )
    X_test_sub, y_test_sub = _subsample_test(
        X_test_full, y_test_full,
        total_size=config.test_subset_size,
        rng=rng,
    )

    logger.info(
        "Subsample — Train: %s (fraud=%d), Test: %s (fraud=%d)",
        X_train_sub.shape, int(y_train_sub.sum()),
        X_test_sub.shape,  int(y_test_sub.sum()),
    )

    # ------------------------------------------------------------------
    # 4. Re-scale to [-π, π] for angle encoding
    #    Fit scaler ONLY on training subsample.
    # ------------------------------------------------------------------
    X_train_q, X_test_q = _scale_for_encoding(X_train_sub, X_test_sub)

    logger.info(
        "Angle-encoding scale — Train range: [%.3f, %.3f], Test range: [%.3f, %.3f]",
        X_train_q.min(), X_train_q.max(),
        X_test_q.min(),  X_test_q.max(),
    )

    return X_train_q, y_train_sub, X_test_q, y_test_sub


def get_feature_names(config: QuantumConfig = DEFAULT_CONFIG) -> list:
    """
    Return the names of the quantum features used in this configuration.

    Parameters
    ----------
    config : QuantumConfig

    Returns
    -------
    list of str, e.g. ['V14', 'V4', 'V12', 'V8']
    """
    all_names = np.load(config.quantum_features_path, allow_pickle=True).tolist()
    return [all_names[i] for i in config.feature_indices]


def print_dataset_summary(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    config: QuantumConfig = DEFAULT_CONFIG,
) -> None:
    """Print a human-readable summary of the quantum dataset subset."""
    feature_names = get_feature_names(config)
    print("\n" + "=" * 60)
    print("  Quantum Dataset Summary")
    print("=" * 60)
    print(f"  Features used     : {feature_names}")
    print(f"  Training samples  : {len(y_train)} (fraud={y_train.sum()}, legit={len(y_train)-y_train.sum()})")
    print(f"  Test samples      : {len(y_test)}  (fraud={y_test.sum()}, legit={len(y_test)-y_test.sum()})")
    print(f"  Feature range     : [{X_train.min():.3f}, {X_train.max():.3f}] (angle-encoded)")
    print(f"  Encoding target   : [-π, π] = [{-np.pi:.3f}, {np.pi:.3f}]")
    print("=" * 60)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _subsample_train(
    X: np.ndarray,
    y: np.ndarray,
    total_size: int,
    balanced: bool,
    rng: np.random.Generator,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Draw a training subsample from the full dataset.

    If ``balanced=True``, draw equal numbers of fraud and legit samples.
    If ``balanced=False``, draw a stratified random subset.

    Parameters
    ----------
    X : np.ndarray
    y : np.ndarray
    total_size : int
        Total number of samples in the returned subset.
    balanced : bool
        Whether to enforce 50/50 class balance.
    rng : np.random.Generator

    Returns
    -------
    (X_sub, y_sub)
    """
    fraud_idx  = np.where(y == 1)[0]
    legit_idx  = np.where(y == 0)[0]

    if balanced:
        n_each = total_size // 2
        n_fraud = min(n_each, len(fraud_idx))
        n_legit = min(total_size - n_fraud, len(legit_idx))

        chosen_fraud = rng.choice(fraud_idx, size=n_fraud, replace=False)
        chosen_legit = rng.choice(legit_idx, size=n_legit, replace=False)
        chosen = np.concatenate([chosen_fraud, chosen_legit])
    else:
        # Stratified: keep real proportion
        n_fraud = max(1, int(total_size * y.mean()))
        n_legit = total_size - n_fraud

        n_fraud = min(n_fraud, len(fraud_idx))
        n_legit = min(n_legit, len(legit_idx))

        chosen_fraud = rng.choice(fraud_idx, size=n_fraud, replace=False)
        chosen_legit = rng.choice(legit_idx, size=n_legit, replace=False)
        chosen = np.concatenate([chosen_fraud, chosen_legit])

    # Shuffle to mix classes before returning
    rng.shuffle(chosen)
    return X[chosen], y[chosen]


def _subsample_test(
    X: np.ndarray,
    y: np.ndarray,
    total_size: int,
    rng: np.random.Generator,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Draw a STRATIFIED test subsample (preserves real class distribution).

    The test subset must not be artificially balanced — doing so would
    overestimate the model's ability to detect rare fraud events.

    Parameters
    ----------
    X : np.ndarray
    y : np.ndarray
    total_size : int
    rng : np.random.Generator

    Returns
    -------
    (X_sub, y_sub)
    """
    fraud_idx  = np.where(y == 1)[0]
    legit_idx  = np.where(y == 0)[0]

    fraud_rate = y.mean()
    n_fraud = max(1, int(total_size * fraud_rate))
    n_legit = total_size - n_fraud

    n_fraud = min(n_fraud, len(fraud_idx))
    n_legit = min(n_legit, len(legit_idx))

    chosen_fraud = rng.choice(fraud_idx, size=n_fraud, replace=False)
    chosen_legit = rng.choice(legit_idx, size=n_legit, replace=False)
    chosen = np.concatenate([chosen_fraud, chosen_legit])
    rng.shuffle(chosen)

    return X[chosen], y[chosen]


def _scale_for_encoding(
    X_train: np.ndarray,
    X_test: np.ndarray,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Apply MinMaxScaler to map features from their current range to [-π, π].

    The scaler is fit on X_train ONLY (data-leakage prevention).
    X_test is transformed using the same fitted scaler.

    Why [-π, π]?
    Quantum rotation gates (RY, RZ) accept angles in radians.
    Mapping features to the full [-π, π] range ensures they cover
    the entire Bloch sphere, maximising the expressibility of the
    quantum state space.

    Parameters
    ----------
    X_train : np.ndarray
    X_test  : np.ndarray

    Returns
    -------
    (X_train_scaled, X_test_scaled)
    """
    scaler = MinMaxScaler(feature_range=(-np.pi, np.pi))
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)
    return X_train_scaled, X_test_scaled
