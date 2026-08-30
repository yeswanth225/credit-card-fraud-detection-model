"""
Phase 2, Part 1 — Toy QML Experiment
======================================

PURPOSE: Educational validation.
-------
Before using the real fraud dataset, this script demonstrates the COMPLETE
quantum machine learning pipeline on a tiny, hand-crafted dataset.

This is NOT a performance benchmark. It is a working demonstration that:

  classical features
      -> feature scaling to [0, pi]
      -> ZZ quantum feature map (richer encoding for kernel methods)
      -> quantum kernel computation (state fidelity)
      -> QSVC classifier (classical SVM with quantum kernel)
      -> binary prediction

DATASET
--------
We use 4 points that are linearly separable:

    Class 0 (low values):  [0.1, 0.2], [0.2, 0.1]
    Class 1 (high values): [0.8, 0.9], [0.9, 0.8]

Any reasonable classifier should achieve 100% on this trivial dataset.
If it doesn't, there is a bug in the pipeline — this is its value.

WHY [0, pi] SCALING (NOT [-pi, pi])?
--------------------------------------
The ZZFeatureMap uses interaction terms of the form:
    RZZ(2 * (pi - x_i) * (pi - x_j))

When x is in [-pi, pi], the factor (pi - x) can become as large as 2*pi,
causing the cosine-based kernel to wrap around and produce unexpectedly high
cross-class similarity. Scaling to [0, pi] keeps (pi - x) in [0, pi],
making the kernel well-behaved:
    - Within-class pairs (similar x) -> high fidelity
    - Cross-class pairs (dissimilar x) -> low fidelity

HOW TO RUN
-----------
    python -m phase2.experiments.toy_qml_experiment

Expected runtime: < 10 seconds
Expected output:  [PASS] 100% accuracy on 4-sample dataset
"""

from __future__ import annotations

import sys
from pathlib import Path

# Windows terminals default to cp1252 which cannot encode Qiskit's box-drawing
# characters used in circuit diagrams. Reconfigure stdout to UTF-8 if possible;
# fall back to replacing unencodable characters rather than crashing.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import numpy as np

# ---------------------------------------------------------------------------
# Step 0: Raw classical features (no preprocessing needed for a 4-point toy)
# ---------------------------------------------------------------------------

print("\n" + "=" * 70)
print("  PHASE 2 — TOY QML EXPERIMENT (Educational)")
print("=" * 70)

# Two features, two classes
# We keep this tiny so we can inspect the full quantum circuit
X_raw = np.array([
    [0.1, 0.2],   # class 0 — low values -> "legitimate" in the analogy
    [0.2, 0.1],   # class 0
    [0.8, 0.9],   # class 1 — high values -> "fraud" in the analogy
    [0.9, 0.8],   # class 1
], dtype=float)

y = np.array([0, 0, 1, 1])

print("\nStep 0: Classical features")
print(f"  X_raw:\n{X_raw}")
print(f"  y:     {y}")
print("  (Class 0 = bottom-left cluster, Class 1 = top-right cluster)")


# ---------------------------------------------------------------------------
# Step 1: Scale to [0, pi] for ZZFeatureMap
# ---------------------------------------------------------------------------

from sklearn.preprocessing import MinMaxScaler

print("\nStep 1: Scale features to [0, pi] for ZZFeatureMap")
print("  WHY [0, pi] instead of [-pi, pi]?")
print("  ZZFeatureMap uses RZZ(2*(pi-x_i)*(pi-x_j)) interaction terms.")
print("  With x in [-pi, pi], the factor (pi-x) can reach 2*pi, causing")
print("  the quantum kernel to wrap around and confuse the two classes.")
print("  Restricting x to [0, pi] keeps (pi-x) in [0, pi], so the kernel")
print("  correctly gives: within-class ~ high, cross-class ~ low.")

scaler = MinMaxScaler(feature_range=(0, np.pi))
# For the toy dataset, fit and transform on the same 4 samples.
# (In real experiments, fit ONLY on training data — see data_preparation.py)
X_scaled = scaler.fit_transform(X_raw)

print(f"\n  X_scaled (values now in [0, pi={np.pi:.3f}]):")
for i, (raw, scaled) in enumerate(zip(X_raw, X_scaled)):
    print(f"    Sample {i} (class {y[i]}): {raw} -> {scaled.round(4)}")


# ---------------------------------------------------------------------------
# Step 2: Angle Encoding Circuit (educational visualisation only)
# ---------------------------------------------------------------------------

from phase2.quantum.feature_encoding import build_angle_encoding_circuit, describe_feature_map

print("\nStep 2: Angle Encoding Circuit (educational — not used for QSVC)")
print("  This is the simplest quantum feature encoding:")
print("  Each classical feature value becomes the rotation angle of one qubit.")
print("  Feature x_i -> RY(x_i) gate on qubit i")
print("  The qubit is initialised to |0> and rotated to a point on the Bloch sphere.")

angle_circuit = build_angle_encoding_circuit(n_qubits=2)

def _draw(circuit) -> None:
    """Print a circuit diagram, falling back to ASCII on encoding errors."""
    try:
        print(circuit.draw(output="text"))
    except (UnicodeEncodeError, UnicodeDecodeError):
        # Last-resort: encode to ASCII with '?' for unsupported box chars
        diagram = str(circuit.draw(output="text")).encode("ascii", errors="replace").decode("ascii")
        print(diagram)

print("\n  Parameterised circuit structure:")
_draw(angle_circuit)

print("\n  Bind first sample values to see concrete circuit:")
param_dict = {angle_circuit.parameters[i]: X_scaled[0][i] for i in range(2)}
bound = angle_circuit.assign_parameters(param_dict)
_draw(bound)

describe_feature_map(angle_circuit)


# ---------------------------------------------------------------------------
# Step 3: ZZ Feature Map — used for both kernel inspection and QSVC
# ---------------------------------------------------------------------------

from phase2.quantum.feature_encoding import build_zz_feature_map

print("\nStep 3: ZZ Feature Map (used for BOTH kernel inspection and QSVC)")
print("  The ZZFeatureMap is a richer encoding that captures feature interactions.")
print("  It uses Hadamard gates + ZZ two-qubit interactions, creating a quantum state")
print("  in a high-dimensional Hilbert space where the kernel is computed.")
print("  reps=1: shallow circuit, well-behaved kernel on this 4-sample toy dataset.")

# ONE feature map, reused for Steps 4 and 5 — no hidden second kernel
zz_map = build_zz_feature_map(n_qubits=2, reps=1)

print("\n  ZZFeatureMap structure (n_qubits=2, reps=1):")
_draw(zz_map.decompose())

describe_feature_map(zz_map)


# ---------------------------------------------------------------------------
# Step 4: Quantum Kernel — inspect before training
# ---------------------------------------------------------------------------

from phase2.quantum.quantum_kernel import build_quantum_kernel

print("\nStep 4: Quantum Kernel")
print("  K(x, z) = |<phi(x)|phi(z)>|^2")
print("  This computes the 'overlap' (fidelity) between quantum states.")
print("  Two similar data points -> high fidelity -> large kernel value.")
print("  Two dissimilar points   -> low  fidelity -> small kernel value.")

kernel = build_quantum_kernel(feature_map=zz_map, shots=None)

# Compute and display the kernel matrix — verify separability BEFORE training
print("\n  Computing 4x4 kernel matrix (all pairs of our 4 samples) ...")
K = kernel.evaluate(x_vec=X_scaled)
print(f"\n  Kernel matrix K[i,j] = |<phi(x_i)|phi(x_j)>|^2:")
print(f"  (Row/col 0,1 = class 0; row/col 2,3 = class 1)")
with np.printoptions(precision=4, suppress=True):
    print(K)

# Explicit kernel sanity check: within-class should be high, cross-class low
diag_ok      = np.allclose(np.diag(K), 1.0, atol=1e-6)
within_01    = (K[0, 1] + K[1, 0]) / 2   # avg same-class similarity (class 0)
within_23    = (K[2, 3] + K[3, 2]) / 2   # avg same-class similarity (class 1)
cross_02     = (K[0, 2] + K[2, 0]) / 2   # avg cross-class similarity
contrast     = min(within_01, within_23) - cross_02

print(f"\n  Kernel sanity check:")
print(f"    Diagonal = 1.0 (self-fidelity):   {'OK' if diag_ok else 'FAIL'}")
print(f"    K[0,1] within-class (class 0):    {K[0,1]:.4f}  (expected: high)")
print(f"    K[2,3] within-class (class 1):    {K[2,3]:.4f}  (expected: high)")
print(f"    K[0,2] cross-class:               {K[0,2]:.4f}  (expected: low)")
print(f"    Contrast (min_within - cross):     {contrast:.4f}  (expected: > 0)")

kernel_ok = diag_ok and contrast > 0.01
if kernel_ok:
    print("\n  Kernel CHECK PASSED: within-class similarity > cross-class.")
    print("  The quantum kernel can separate the two classes.")
else:
    print("\n  WARNING: Kernel contrast is too low — QSVC may misclassify.")
    print("  Possible causes: wrong feature scaling, reps too high, or")
    print("  data points that map to similar quantum states under this encoding.")


# ---------------------------------------------------------------------------
# Step 5: QSVC — Train and Predict (reuses kernel from Step 4)
# ---------------------------------------------------------------------------

from qiskit_machine_learning.algorithms import QSVC

print("\nStep 5: QSVC (Quantum Support Vector Classifier)")
print("  Training QSVC on 4 samples ...")
print("  Using the SAME kernel built in Step 4 (no hidden second kernel).")

qsvc = QSVC(quantum_kernel=kernel)
qsvc.fit(X_scaled, y)

# Predict on the same 4 points (trivial check — should be perfect on separable data)
y_pred = qsvc.predict(X_scaled)

print("\n  Predictions on training data (expected: [0, 0, 1, 1]):")
print(f"    True labels : {y}")
print(f"    Predictions : {y_pred}")
n_correct = int((y_pred == y).sum())
accuracy  = n_correct / len(y)
print(f"    Correct     : {n_correct}/{len(y)}")
print(f"    Accuracy    : {accuracy:.1%}")

# Explicit pass/fail — no hard-coded result
if (y_pred == y).all():
    classification_status = "PASS"
    print(f"\n  [{classification_status}] QSVC correctly classified all 4 samples.")
    print("  The quantum ML pipeline is working end-to-end.")
else:
    classification_status = "FAIL"
    wrong = [
        f"sample {i} (true={int(y[i])}, pred={int(y_pred[i])})"
        for i in range(len(y)) if y_pred[i] != y[i]
    ]
    print(f"\n  [{classification_status}] Misclassified: {', '.join(wrong)}")
    print("  Check: kernel contrast above, feature scaling, or reps value.")


# ---------------------------------------------------------------------------
# Step 6: Summary
# ---------------------------------------------------------------------------

print("\n" + "=" * 70)
print("  TOY EXPERIMENT COMPLETE")
print("=" * 70)
print(f"""
  What this demonstrated:
  -----------------------
  1. Raw features (2D) scaled to [0, pi] for ZZFeatureMap compatibility
  2. ZZFeatureMap: Hadamard + ZZ interactions encode features into Hilbert space
  3. Quantum kernel: similarity = |<phi(x)|phi(z)>|^2 (state fidelity)
  4. Kernel matrix inspected BEFORE training to verify class separability
  5. QSVC trained using the SAME kernel (single consistent feature map)
  6. Classification result: [{classification_status}]

  DESIGN NOTE — [0, pi] vs [-pi, pi]:
  -------------------------------------
  Phase 1 / angle-encoding experiments scale to [-pi, pi].
  ZZFeatureMap works better with [0, pi] because its (pi-x) interaction
  terms remain in [0, pi], preserving kernel separability.
  The real QSVC/VQC experiments (qsvc_model.py) use a configurable scaler.

  IMPORTANT CAVEATS:
  ------------------
  - This used only 4 training samples (trivially separable)
  - Real fraud data has 284,807 samples (subset used for QML)
  - The toy dataset is NOT representative of fraud detection difficulty
  - See quantum_kernel_experiment.py for the real experiment

  Next step: python -m phase2.experiments.quantum_kernel_experiment
""")

# Exit with non-zero code on failure so CI / automated runners detect it.
if classification_status == "FAIL":
    sys.exit(1)
