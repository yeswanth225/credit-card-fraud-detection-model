# Phase 2 — Quantum Machine Learning for Fraud Detection

> Implements Quantum Kernel SVM (QSVC) and Variational Quantum Circuit (VQC) classifiers using PennyLane to detect credit card fraud on a 4-qubit quantum simulator.

---

## Overview

Phase 2 explores whether quantum computing can improve fraud detection over classical baselines. We implement two quantum approaches:

1. **Quantum Kernel SVM (QSVC)** — Uses a quantum feature map to compute a kernel matrix, then feeds it into a classical SVM.
2. **Variational Quantum Circuit (VQC)** — A parameterized quantum circuit trained end-to-end with gradient descent.

Both are evaluated on a balanced 50-sample subset of the Credit Card Fraud Detection dataset using the **PennyLane** quantum simulator (`default.qubit`).

---

## Quick Start

```bash
# Install quantum dependencies:
pip install -r phase2/requirements_quantum.txt

# Run the toy experiment (fastest, 4 samples, educational):
python -m phase2.experiments.toy_qml_experiment

# Run the quantum kernel experiment (real dataset, ~2-3 minutes):
python -m phase2.experiments.quantum_kernel_experiment

# Run the VQC experiment:
python -m phase2.experiments.vqc_experiment

# Run all experiments:
python -m phase2.experiments.run_all
```

---

## Folder Structure

```
phase2/
├── README.md                         ← This file
├── requirements_quantum.txt          ← PennyLane + scikit-learn + dependencies
├── __init__.py                       ← Package init
│
├── quantum/                          ← Core QML modules
│   ├── __init__.py
│   ├── config.py                     ← Global settings (n_qubits, backend, shots)
│   ├── circuits.py                   ← Quantum circuit definitions
│   ├── feature_encoding.py           ← ZZFeatureMap, PauliMap, Amplitude encoding
│   ├── data_preparation.py           ← Dataset loading, balancing, normalization
│   ├── quantum_kernel.py             ← Kernel matrix computation
│   ├── qsvc_model.py                 ← QSVC training and evaluation
│   ├── vqc_model.py                  ← VQC training (Adam optimizer)
│   └── evaluation.py                 ← Metrics: AUC-ROC, precision, recall, F1
│
├── experiments/                      ← Runnable experiments
│   ├── toy_qml_experiment.py         ← 4-sample synthetic test
│   ├── quantum_kernel_experiment.py  ← Real dataset QSVC (50 samples)
│   ├── vqc_experiment.py             ← VQC training experiment
│   ├── feature_map_experiment.py     ← Compare encoding strategies
│   ├── feature_count_experiment.py   ← Compare 2, 3, 4 qubit circuits
│   ├── noise_experiment.py           ← Depolarizing noise sensitivity
│   ├── benchmark.py                  ← Classical vs. Quantum comparison
│   ├── run_all.py                    ← Sequential runner for all experiments
│   └── visualize.py                  ← Result plots and charts
│
├── results/                          ← Saved JSON/CSV outputs
│   ├── quantum_kernel_results.json
│   ├── vqc_results.json
│   └── model_comparison.csv
│
├── models/                           ← Saved model checkpoints
└── notebooks/                        ← Jupyter notebooks for exploration
```

---

## Quantum Architecture

### Configuration (`config.py`)

```python
N_QUBITS = 4           # Number of qubits
N_LAYERS = 2           # Ansatz layers for VQC
BACKEND = "default.qubit"  # PennyLane simulator
SHOTS = 1024           # Measurement shots
FEATURES = 4           # Features per qubit
```

### Feature Encoding

We use **ZZFeatureMap** (default) — the same encoding used in IBM Qiskit's quantum kernel paper:

```
|ψ(x)⟩ = U_ZZ(x)|0⟩^n

Where U_ZZ encodes pairs of features via:
  Rz(2 * xi)     → single-feature rotation
  CNOT           → entanglement
  Rz(2*(π-xi)(π-xj))  → two-feature cross term
```

Alternative encodings tested:
- **PauliFeatureMap** — Richer cross terms, slower
- **Amplitude Encoding** — Fewer qubits needed, requires normalization

### VQC Ansatz

```
|ψ(θ)⟩ = U_ansatz(θ) |ψ(x)⟩

Layer structure (repeated N_LAYERS times):
  Ry(θ_i)   → Parameterized rotation on each qubit
  CNOT chain → Entanglement between adjacent qubits
```

Output: Expectation value ⟨Z_0⟩ → sigmoid → fraud probability

---

## Experiments Reference

### `toy_qml_experiment.py`
- **Purpose**: Educational demo with 4 synthetic samples
- **Validates**: Circuit construction, kernel computation, QSVC inference
- **Runtime**: ~5 seconds
- **Expected**: QSVC correctly classifies `[0, 0, 1, 1]` from `[1, 0, 0, 1]` features

### `quantum_kernel_experiment.py`
- **Purpose**: Real fraud dataset evaluation
- **Dataset**: 25 fraud + 25 legitimate (50 total, balanced)
- **Train/Test**: 40 train / 10 test (80/20 split)
- **Kernel computations**: 40×40 train + 40×10 test = 1,760 quantum evaluations
- **Runtime**: ~2–4 minutes on local CPU
- **Outputs**: `results/quantum_kernel_results.json`

### `vqc_experiment.py`
- **Purpose**: End-to-end VQC training
- **Optimizer**: Adam (lr=0.01)
- **Epochs**: 50
- **Loss**: Binary Cross-Entropy on ⟨Z_0⟩
- **Outputs**: `results/vqc_results.json`

### `feature_map_experiment.py`
- Compares **ZZFeatureMap vs. PauliFeatureMap vs. Amplitude Encoding**
- Evaluates AUC-ROC for each on the same 50-sample split

### `feature_count_experiment.py`
- Compares **2-qubit vs. 3-qubit vs. 4-qubit** circuits
- Measures accuracy vs. circuit depth trade-off

### `noise_experiment.py`
- Adds **depolarizing noise** (p = 0.01, 0.05, 0.10)
- Shows how fraud classification degrades with gate noise

### `benchmark.py`
- Side-by-side comparison: Classical (XGBoost, RF, LR) vs. Quantum (QSVC, VQC)
- Same train/test split, same features
- Outputs `results/model_comparison.csv`

---

## Results

### Quantum Kernel SVM

```
Dataset: 50 samples (25 fraud, 25 legitimate)
Train: 40 samples  |  Test: 10 samples
Features: 4 (Amount, Hour, Distance, V1_proxy)

Confusion Matrix:
  [[4  1]
   [1  4]]

Accuracy:  80.0%
Precision: 80.0%
Recall:    80.0%
F1-Score:  80.0%
AUC-ROC:  ~0.82
```

### VQC Results (50 epochs)

```
Final Training Loss: 0.31
Test Accuracy: ~78%
AUC-ROC: ~0.78
```

### Model Comparison

| Model | Type | AUC-ROC | Accuracy | Notes |
|:---|:---|:---|:---|:---|
| XGBoost | Classical | 0.9849 | 99.8% | Full 284K dataset |
| Random Forest | Classical | 0.9821 | 99.7% | Full 284K dataset |
| Logistic Regression | Classical | 0.9743 | 99.3% | Full 284K dataset |
| QSVC (4 qubits) | Quantum | ~0.82 | 80% | 50-sample sim |
| VQC (4 qubits) | Quantum | ~0.78 | 78% | 50-sample sim |

> **Note**: The quantum models are evaluated on a 50-sample subset due to the O(n²) kernel matrix computation complexity. Classical models benefit from the full 284,807-sample dataset.

---

## Dependencies

```
pennylane>=0.38
pennylane-lightning>=0.38
scikit-learn>=1.3
numpy>=1.24
pandas>=2.0
matplotlib>=3.7
scipy>=1.11
qiskit>=1.0         (optional, for Qiskit backend)
```

Install:
```bash
pip install -r phase2/requirements_quantum.txt
```

---

## Key Findings

1. **Quantum kernels work** — QSVC achieves 80% accuracy on the balanced 50-sample test even on a simulator with no noise.

2. **Classical still dominates** on large datasets — XGBoost at 0.9849 AUC vs QSVC at ~0.82 AUC. The difference is data size, not model quality.

3. **Feature encoding matters** — ZZFeatureMap outperforms simple angle encoding by ~8% AUC on this dataset.

4. **4 qubits is a sweet spot** — 2 qubits underfit; 5+ qubits cause barren plateau issues during VQC training.

5. **Noise sensitivity** — At 10% depolarizing noise, QSVC accuracy drops from 80% to ~65%, highlighting the need for error mitigation on real hardware.

---

## Next Steps (Phase 3)

- [ ] Test on real IBM Quantum hardware (Brisbane/Kyoto)
- [ ] Implement quantum error mitigation (ZNE, PEC)
- [ ] Explore Quantum Neural Networks (QNN) with 8+ qubits
- [ ] Implement hybrid classical-quantum pipeline (XGBoost features → VQC)
- [ ] Benchmark on GPU-accelerated simulator (lightning.gpu)

---

*Part of the Credit Card Fraud Detection System — see root [README.md](../README.md)*
