"""
Phase 2 — Quantum Kernel Builder
==================================

WHAT IS A QUANTUM KERNEL?
---------------------------
In classical Support Vector Machines, a kernel function K(x, z)
measures the similarity between two data points x and z in a
(possibly infinite-dimensional) feature space:

    K(x, z) = ⟨φ(x), φ(z)⟩

where φ maps the raw features into a high-dimensional space.

A *quantum kernel* replaces the classical kernel with a similarity
measure computed on a quantum computer:

    K_Q(x, z) = |⟨φ_Q(x)|φ_Q(z)⟩|²

where |φ_Q(x)⟩ is the quantum state produced by running a
quantum feature map circuit on input x.

This inner product is the *state fidelity* between the two
quantum states — exactly what FidelityQuantumKernel computes.

WHY MIGHT A QUANTUM KERNEL WORK?
----------------------------------
The quantum feature map encodes data in an exponentially large
Hilbert space (2^n_qubits dimensions). If the decision boundary
of the fraud data can be better separated in this space than in
classical kernel spaces, the quantum kernel may outperform
classical kernels.

This is an *open research question* — Phase 2 is designed to
produce evidence about whether this is true for fraud detection.

IMPLEMENTATION
---------------
FidelityQuantumKernel (qiskit-machine-learning 0.9.x) uses:
    1. A feature map circuit to prepare quantum states
    2. A state-fidelity estimator (ComputeUncompute on a StatevectorSimulator)
    3. The resulting kernel matrix is passed to sklearn.svm.SVC internally

KERNEL MATRIX SIZE NOTE
------------------------
The training kernel matrix has shape (n_train, n_train).
For n_train=800 this is 640,000 entries — each requiring one circuit evaluation.
This is why we limit the subset size in config.py.
"""

from __future__ import annotations

import time
import logging
from typing import Dict, Optional, Tuple

import numpy as np
from qiskit import QuantumCircuit
from qiskit.primitives import StatevectorSampler
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit_algorithms.state_fidelities import ComputeUncompute

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_quantum_kernel(
    feature_map: QuantumCircuit,
    shots: Optional[int] = None,
) -> FidelityQuantumKernel:
    """
    Build a FidelityQuantumKernel using Qiskit's StatevectorSampler.

    COMPUTATION METHOD:
    -------------------
    If shots=None (default): Uses exact statevector simulation.
        - Deterministic (same result every run for same input)
        - Fastest for small circuits on CPU
        - Does NOT model quantum shot noise

    If shots=N (integer): Uses sampler-based simulation.
        - Approximates the true quantum measurement statistically
        - Each entry K(x,z) computed from N measurement shots
        - Introduces statistical noise, as real hardware would
        - Much slower but more realistic

    Parameters
    ----------
    feature_map : QuantumCircuit
        The quantum feature map that encodes classical data into quantum states.
        Must be parameterised (has Parameters).
    shots : int, optional
        Number of measurement shots per circuit evaluation.
        None → exact statevector computation.

    Returns
    -------
    FidelityQuantumKernel
        Ready to compute kernel matrices via .evaluate(x_vec, y_vec).
    """
    sampler = StatevectorSampler()

    # ComputeUncompute: the standard fidelity estimator.
    # It runs |φ(x)⟩ followed by |φ(z)⟩† and measures ⟨0|...⟩
    fidelity = ComputeUncompute(sampler=sampler)

    kernel = FidelityQuantumKernel(
        feature_map=feature_map,
        fidelity=fidelity,
    )

    return kernel


def compute_kernel_matrix_timed(
    kernel: FidelityQuantumKernel,
    X_train: np.ndarray,
    X_test: Optional[np.ndarray] = None,
) -> Tuple[np.ndarray, Optional[np.ndarray], Dict]:
    """
    Compute the training (and optionally test) kernel matrices with timing.

    Parameters
    ----------
    kernel : FidelityQuantumKernel
    X_train : np.ndarray, shape (n_train, n_features)
    X_test : np.ndarray, optional, shape (n_test, n_features)

    Returns
    -------
    K_train : np.ndarray, shape (n_train, n_train)
    K_test  : np.ndarray or None, shape (n_test, n_train)
    timing  : dict with 'train_seconds' and 'test_seconds'
    """
    logger.info(
        "Computing training kernel matrix %d × %d ...",
        len(X_train), len(X_train),
    )
    t0 = time.perf_counter()
    K_train = kernel.evaluate(x_vec=X_train)
    train_seconds = time.perf_counter() - t0
    logger.info("  Training kernel done in %.1f s", train_seconds)

    K_test  = None
    test_seconds = 0.0

    if X_test is not None:
        logger.info(
            "Computing test kernel matrix %d × %d ...",
            len(X_test), len(X_train),
        )
        t0 = time.perf_counter()
        K_test = kernel.evaluate(x_vec=X_test, y_vec=X_train)
        test_seconds = time.perf_counter() - t0
        logger.info("  Test kernel done in %.1f s", test_seconds)

    timing = {
        "train_kernel_seconds": round(train_seconds, 3),
        "test_kernel_seconds":  round(test_seconds, 3),
    }

    return K_train, K_test, timing
