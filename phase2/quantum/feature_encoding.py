"""
Phase 2 — Quantum Feature Encoding
=====================================

Provides functions to build quantum feature maps that encode classical
feature vectors into quantum states.

WHAT IS QUANTUM FEATURE ENCODING?
-----------------------------------
In classical machine learning, we feed numerical features directly into
a model (e.g., a decision tree or neural network).

In quantum machine learning, we must first convert those numbers into
*quantum states* that can be processed by quantum circuits.

Feature encoding is the bridge between classical and quantum computation.

TWO ENCODING STRATEGIES IMPLEMENTED HERE:
------------------------------------------

1. ANGLE ENCODING (educational baseline)
   ----------------------------------------
   The simplest encoding: apply one RY gate per qubit, where the rotation
   angle IS the feature value.

       qubit_i |0⟩ —— RY(x_i) ——

   After rotation, qubit_i points to a location on the Bloch sphere
   determined by x_i.

   PROS : Easy to understand, shallow circuit (depth = 1)
   CONS : Limited expressibility; features don't interact

2. ZZ FEATURE MAP (used for kernel experiments)
   -----------------------------------------------
   A more powerful encoding inspired by Havlíček et al. (2019).
   Uses a combination of Hadamard gates and ZZ-interaction terms:

       Layer 1: Apply H to all qubits (create superposition)
       Layer 2: Apply RZ(2*x_i) to each qubit
       Layer 3: Apply ZZ interaction: RZZ(2*(π-x_i)*(π-x_j)) to each pair

   This is repeated for `reps` repetitions.

   The ZZ feature map creates a quantum state in a high-dimensional
   Hilbert space where the inner products between states (the "quantum
   kernel") can capture non-linear relationships in the data.

   PROS : High expressibility, proven to work for kernel methods
   CONS : Deeper circuit, more noise-sensitive

References
----------
- Havlíček et al. "Supervised learning with quantum-enhanced feature spaces."
  Nature 567, 209-212 (2019). doi:10.1038/s41586-019-0980-2
- Qiskit Circuit Library: ZZFeatureMap, PauliFeatureMap
"""

from __future__ import annotations

import numpy as np
from qiskit import QuantumCircuit
from qiskit.circuit import ParameterVector
from qiskit.circuit.library import ZZFeatureMap, PauliFeatureMap


# ---------------------------------------------------------------------------
# 1. Simple Angle Encoding — Educational
# ---------------------------------------------------------------------------

def build_angle_encoding_circuit(n_qubits: int) -> QuantumCircuit:
    """
    Build a simple angle-encoding quantum circuit.

    Maps n classical features → n RY rotations on n qubits.
    This is the most basic form of quantum feature encoding.

    Circuit structure (n_qubits=3, features=[x0, x1, x2]):

        q0: ──|0⟩── RY(x0) ──
        q1: ──|0⟩── RY(x1) ──
        q2: ──|0⟩── RY(x2) ──

    The feature values are expected to be in [-π, π] for full Bloch-sphere
    coverage. See data_preparation._scale_for_encoding.

    Parameters
    ----------
    n_qubits : int
        Number of qubits = number of features.

    Returns
    -------
    QuantumCircuit
        Parameterised circuit with ParameterVector 'x' of length n_qubits.
    """
    x = ParameterVector("x", length=n_qubits)
    qc = QuantumCircuit(n_qubits, name="AngleEncoding")

    # Apply one RY gate per qubit, parameterised by the corresponding feature
    for qubit_idx in range(n_qubits):
        qc.ry(x[qubit_idx], qubit_idx)

    return qc


def build_angle_encoding_with_entanglement(n_qubits: int) -> QuantumCircuit:
    """
    Angle encoding followed by a layer of CNOT entanglement gates.

    Adds qubit interactions that the plain angle-encoding circuit lacks.
    This is an intermediate step between angle encoding and ZZFeatureMap.

    Circuit structure (n_qubits=4):

        q0: ── RY(x0) ──●────────────
        q1: ── RY(x1) ──X──●─────────
        q2: ── RY(x2) ─────X──●──────
        q3: ── RY(x3) ────────X──────

    Parameters
    ----------
    n_qubits : int

    Returns
    -------
    QuantumCircuit
    """
    x = ParameterVector("x", length=n_qubits)
    qc = QuantumCircuit(n_qubits, name="AngleEncoding+Entanglement")

    # Rotation layer
    for i in range(n_qubits):
        qc.ry(x[i], i)

    # Entanglement layer (linear chain of CNOTs)
    for i in range(n_qubits - 1):
        qc.cx(i, i + 1)

    return qc


# ---------------------------------------------------------------------------
# 2. ZZ Feature Map — Used for Kernel Experiments
# ---------------------------------------------------------------------------

def build_zz_feature_map(
    n_qubits: int,
    reps: int = 2,
    entanglement: str = "linear",
) -> ZZFeatureMap:
    """
    Build a ZZFeatureMap from qiskit.circuit.library.

    The ZZFeatureMap implements the quantum feature map from:
    Havlíček et al., Nature 567 (2019).

    It encodes each feature using a combination of Hadamard gates,
    single-qubit Z rotations, and two-qubit ZZ interactions:

        Phase 1 (per layer):
            H on all qubits
            RZ(2 * x_i)               for each qubit i
            RZZ(2 * (π - x_i)(π - x_j)) for each pair (i,j)

    The inner product in the resulting Hilbert space defines the
    quantum kernel:

        K(x, z) = |⟨φ(x)|φ(z)⟩|²

    where φ(x) is the quantum state prepared by this circuit.

    Parameters
    ----------
    n_qubits : int
        Number of qubits = number of features.
    reps : int
        Number of encoding repetitions (more reps → richer kernel, deeper circuit).
    entanglement : str
        'linear', 'full', or 'circular'.
        Controls which qubit pairs receive ZZ interactions.

    Returns
    -------
    ZZFeatureMap (QuantumCircuit subclass)
    """
    feature_map = ZZFeatureMap(
        feature_dimension=n_qubits,
        reps=reps,
        entanglement=entanglement,
    )
    return feature_map


def build_pauli_feature_map(
    n_qubits: int,
    reps: int = 2,
    paulis: list | None = None,
) -> PauliFeatureMap:
    """
    Build a PauliFeatureMap — a more general version of ZZFeatureMap.

    Allows specifying which Pauli interactions to use:
        'Z'  → single-qubit Z rotations only (angle encoding variant)
        'ZZ' → two-qubit interactions (same as ZZFeatureMap)
        'ZZZ' → three-qubit interactions (deeper entanglement)

    Parameters
    ----------
    n_qubits : int
    reps : int
    paulis : list of str, optional
        Default ['Z', 'ZZ'] (equivalent to ZZFeatureMap).

    Returns
    -------
    PauliFeatureMap (QuantumCircuit subclass)
    """
    if paulis is None:
        paulis = ["Z", "ZZ"]

    feature_map = PauliFeatureMap(
        feature_dimension=n_qubits,
        reps=reps,
        paulis=paulis,
    )
    return feature_map


# ---------------------------------------------------------------------------
# Utility: print feature map summary
# ---------------------------------------------------------------------------

def describe_feature_map(feature_map: QuantumCircuit) -> None:
    """Print a concise description of a feature map circuit."""
    print(f"\nFeature Map: {feature_map.name}")
    print(f"  Qubits      : {feature_map.num_qubits}")
    print(f"  Parameters  : {feature_map.num_parameters}")
    print(f"  Depth       : {feature_map.depth()}")
    print(f"  Total gates : {sum(feature_map.count_ops().values())}")
    print(f"  Gate counts : {dict(feature_map.count_ops())}")
