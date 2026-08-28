"""
Phase 2 — Circuit Inspection Utilities
========================================

Functions to measure quantum circuit resource requirements.

WHY TRACK CIRCUIT RESOURCES?
------------------------------
Quantum hardware has strict constraints:
  - Physical qubits are limited (current NISQ devices: 100-1000 qubits)
  - Circuit depth is limited by decoherence (noise grows with depth)
  - Gate counts affect both simulation speed and hardware fidelity

Recording these metrics for every experiment lets us:
  1. Understand the hardware requirements of each approach
  2. Compare approaches on practical feasibility
  3. Estimate how results might change on real hardware

METRICS RECORDED
-----------------
  n_qubits    : Number of qubits required
  depth       : Longest path through the circuit (critical path)
  n_gates     : Total number of gates
  gate_counts : Breakdown by gate type (e.g. {'h':4, 'rz':4, 'rzz':6})
  n_parameters: Number of trainable parameters (for VQC ansatz)
"""

from __future__ import annotations

from typing import Dict, Optional
from pathlib import Path

from qiskit import QuantumCircuit


def circuit_resource_info(circuit: QuantumCircuit) -> Dict:
    """
    Extract quantum resource information from a Qiskit circuit.

    Parameters
    ----------
    circuit : QuantumCircuit

    Returns
    -------
    dict with keys:
        name, n_qubits, depth, n_gates, gate_counts, n_parameters
    """
    gate_counts = dict(circuit.count_ops())
    total_gates = sum(gate_counts.values())

    return {
        "name": circuit.name,
        "n_qubits": circuit.num_qubits,
        "depth": circuit.depth(),
        "n_gates": total_gates,
        "gate_counts": gate_counts,
        "n_parameters": circuit.num_parameters,
    }


def print_circuit_resources(circuit: QuantumCircuit, label: str = "") -> None:
    """
    Print a formatted summary of circuit resources.

    Parameters
    ----------
    circuit : QuantumCircuit
    label : str
        Optional label to prefix the output.
    """
    info = circuit_resource_info(circuit)
    prefix = f"[{label}] " if label else ""
    print(f"\n{prefix}Circuit Resources: {info['name']}")
    print(f"  Qubits      : {info['n_qubits']}")
    print(f"  Depth       : {info['depth']}")
    print(f"  Total gates : {info['n_gates']}")
    print(f"  Parameters  : {info['n_parameters']}")
    print(f"  Gate counts : {info['gate_counts']}")


def draw_circuit(
    circuit: QuantumCircuit,
    output_path: Optional[str | Path] = None,
    style: str = "mpl",
    fold: int = 40,
) -> None:
    """
    Save or display a circuit diagram.

    Parameters
    ----------
    circuit : QuantumCircuit
    output_path : str or Path, optional
        If provided, saves the diagram to this path.
        If None, uses circuit.draw(output='text') to print to console.
    style : str
        'mpl' for matplotlib (PNG), 'text' for ASCII.
    fold : int
        Number of gates per row when using text output.
    """
    if output_path is not None and style == "mpl":
        try:
            fig = circuit.draw(output="mpl", fold=fold)
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            fig.savefig(str(output_path), dpi=100, bbox_inches="tight")
            print(f"  Circuit diagram saved: {output_path}")
        except Exception as exc:
            # matplotlib backend may not be available in all environments
            print(f"  [Warning] Could not save circuit PNG: {exc}")
            print(circuit.draw(output="text", fold=fold))
    else:
        print(circuit.draw(output="text", fold=fold))


def combine_feature_map_and_ansatz(
    feature_map: QuantumCircuit,
    ansatz: QuantumCircuit,
) -> QuantumCircuit:
    """
    Compose a feature map and an ansatz into a single circuit.

    Used for VQC resource analysis: the full VQC circuit = feature_map + ansatz.

    Parameters
    ----------
    feature_map : QuantumCircuit
        The encoding circuit (no trainable parameters).
    ansatz : QuantumCircuit
        The variational circuit (has trainable parameters).

    Returns
    -------
    QuantumCircuit
        Combined circuit with feature_map followed by ansatz.
    """
    assert feature_map.num_qubits == ansatz.num_qubits, (
        f"Qubit mismatch: feature_map has {feature_map.num_qubits}, "
        f"ansatz has {ansatz.num_qubits}"
    )
    combined = feature_map.compose(ansatz)
    combined.name = f"{feature_map.name} + {ansatz.name}"
    return combined


def estimate_kernel_matrix_cost(n_train: int, n_test: int) -> Dict:
    """
    Estimate the number of circuit evaluations needed for a quantum kernel.

    The FidelityQuantumKernel computes a kernel matrix by evaluating:
        K(x_i, x_j) = |⟨φ(x_i)|φ(x_j)⟩|²

    For QSVC:
        - Training kernel:  n_train × n_train evaluations
        - Test kernel:      n_test  × n_train evaluations

    Parameters
    ----------
    n_train : int
    n_test  : int

    Returns
    -------
    dict with keys:
        train_matrix_size, train_evaluations, test_evaluations, total_evaluations
    """
    train_eval = n_train * n_train  # symmetric, but Qiskit computes full matrix
    test_eval  = n_test  * n_train
    return {
        "n_train": n_train,
        "n_test": n_test,
        "train_matrix_size": f"{n_train} x {n_train}",
        "train_evaluations": train_eval,
        "test_evaluations": test_eval,
        "total_evaluations": train_eval + test_eval,
    }
