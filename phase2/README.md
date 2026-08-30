# Phase 2 — Quantum Machine Learning for Fraud Detection

> Implements **QSVC** (Quantum Kernel SVM) and **VQC** (Variational Quantum Classifier)
> using **Qiskit** on a 4-qubit local statevector simulator.

---

## ⚠️ Important Caveats

| Item | Status |
|------|--------|
| **Backend** | Local Qiskit StatevectorSampler (CPU, ideal/noiseless) |
| **IBM Quantum hardware** | ❌ NOT integrated |
| **PennyLane** | ❌ NOT used — framework is Qiskit + qiskit-machine-learning |
| **Training data size** | 100 samples (quantum kernel scales O(N²)) |
| **Test set reliability** | Limited — ~1 fraud case in 25 test samples |

---

## Overview

Phase 2 explores quantum machine learning for fraud detection using a small, controlled subset of the Phase 1 dataset. Two quantum models are implemented:

1. **QSVC** — ZZFeatureMap → FidelityQuantumKernel → Classical SVM
2. **VQC** — ZZFeatureMap → RealAmplitudes ansatz → COBYLA optimizer

Both run on the **local Qiskit Statevector simulator** — no cloud access or IBM Quantum account required.

Classical comparison uses Phase 1 XGBoost results loaded from `data/processed/phase1_results.json`.

---

## Quick Start

```bash
# Install quantum dependencies
pip install -r phase2/requirements_quantum.txt

# 1. Sanity check: 4-sample toy pipeline (<10 seconds)
python -m phase2.experiments.toy_qml_experiment

# 2. Full benchmark: QSVC + VQC + XGBoost baseline (~90 minutes, QSVC is slow)
python -m phase2.experiments.phase2_benchmark

# 3. XGBoost baseline only (instant, loads from JSON)
python -m phase2.experiments.phase2_benchmark --skip-quantum

# 4. Quantum models only (skip XGBoost loading)
python -m phase2.experiments.phase2_benchmark --skip-xgboost
```

---

## Folder Structure

```
phase2/
├── README.md                          This file
├── requirements_quantum.txt           qiskit, qiskit-machine-learning, etc.
├── __init__.py
│
├── quantum/                           Core QML modules
│   ├── config.py                      QuantumConfig dataclass (all parameters here)
│   ├── data_preparation.py            Subset sampling + MinMaxScaler (no leakage)
│   ├── feature_encoding.py            ZZFeatureMap + angle-encoding circuit builders
│   ├── quantum_kernel.py              FidelityQuantumKernel (ComputeUncompute)
│   ├── circuits.py                    Circuit resource utilities
│   ├── qsvc_model.py                  QSVCExperiment class + run_qsvc_experiment()
│   ├── vqc_model.py                   VQCExperiment class + run_vqc_experiment()
│   └── evaluation.py                  Fraud-aware metrics (PR-AUC, ROC-AUC, F1…)
│
├── experiments/
│   ├── toy_qml_experiment.py          Educational end-to-end sanity check
│   ├── phase2_benchmark.py            PRIMARY: QSVC vs VQC vs XGBoost benchmark
│   ├── quantum_kernel_experiment.py   Standalone QSVC on real dataset
│   ├── vqc_experiment.py              Standalone VQC experiment
│   ├── feature_count_experiment.py    2/4/8-qubit comparison
│   ├── feature_map_experiment.py      Feature map comparison
│   ├── noise_experiment.py            Depolarizing noise sensitivity
│   └── run_all.py                     Sequential runner
│
└── results/
    ├── phase2_benchmark_final.json    PRIMARY result file (all 3 models)
    ├── quantum_kernel_results.json    QSVC individual results
    ├── vqc_results.json               VQC individual results
    └── model_comparison.csv           CSV summary
```

---

## Configuration (`quantum/config.py`)

All parameters live in one place — `QuantumConfig`:

```python
QuantumConfig(
    n_qubits=4,             # Qubits = number of features used
    feature_indices=[0,1,2,3],  # V14, V4, V12, V8 (top-4 by XGBoost importance)
    train_subset_size=100,  # Must stay small due to O(N²) kernel
    test_subset_size=25,    # Stratified at real fraud rate (~0.17%)
    balanced_train=True,    # 50% fraud / 50% legit in training subset
    random_seed=42,
    shots=None,             # None = exact statevector (fastest, no shot noise)
    zz_reps=2,              # ZZFeatureMap repetitions
    vqc_reps=2,             # RealAmplitudes repetitions
    vqc_max_iter=20,        # COBYLA max iterations
    vqc_optimizer="COBYLA",
    svm_C=1.0,              # SVM regularisation
)
```

---

## Quantum Architecture

### QSVC Pipeline

```
Classical features (V14, V4, V12, V8)
  → MinMaxScaler (fit on train only) → [-π, π]
  → ZZFeatureMap (4 qubits, reps=2)  → quantum state |φ(x)⟩
  → FidelityQuantumKernel            → K(x,z) = |⟨φ(x)|φ(z)⟩|²
  → sklearn SVC (precomputed kernel) → fraud / legitimate
```

Kernel computation: **O(N²)** — 100 training samples = 10,000 circuit evaluations.

### VQC Pipeline

```
Classical features (V14, V4, V12, V8)
  → MinMaxScaler (fit on train only) → [-π, π]
  → ZZFeatureMap (4 qubits, reps=2)  → encodes data
  → RealAmplitudes ansatz (reps=2)   → 12 trainable parameters
  → Measurement                      → class probabilities
  → COBYLA optimizer                 → minimises cross-entropy loss
```

---

## Data Preparation (No Leakage)

```
Phase 1 artifacts:
  X_train_quantum.npy  (227,845 × 8)
  X_test_quantum.npy   (56,962 × 8)
  y_train_quantum.npy  (227,845 labels)
  y_test_quantum.npy   (56,962 labels)

Phase 2 subset:
  1. Select 4 features: X[:, [0,1,2,3]]
  2. Training subset: 100 samples, 50 fraud + 50 legit (balanced)
  3. Test subset:     25 samples, stratified at real 0.17% rate
  4. MinMaxScaler → [-π, π]:  FIT on training subset ONLY
                               TRANSFORM applied to both train + test
```

> The MinMaxScaler is a **second** scaling step on top of Phase 1's StandardScaler.
> It is required to map feature values into the rotation angle range for quantum gates.
> The fit-on-train-only rule prevents data leakage.

---

## Benchmark Results (August 29, 2026)

All metrics generated by running `python -m phase2.experiments.phase2_benchmark`.
XGBoost metrics loaded from `data/processed/phase1_results.json` (not re-trained).

| Metric | QSVC | VQC | XGBoost |
|--------|------|-----|---------|
| Training samples | 100 | 100 | 227,845 |
| Test samples | 25 | 25 | 56,962 |
| Features | 4 | 4 | 30 |
| Training time | ~82 min | ~8 s | Not available |
| Inference time | ~15 s | ~0.17 s | Not available |
| ROC-AUC | 0.0833 | 0.9167 | 0.9692 |
| PR-AUC | 0.0435 | 0.3333 | 0.8716 |
| F1 Score | 0.0 | 0.1667 | 0.8723 |
| Recall | 0.0 | 1.0 | 0.8367 |
| Precision | 0.0 | 0.0909 | 0.9111 |

> ⚠️ **These are NOT comparable numbers.** XGBoost uses 2,000× more training data.
> Quantum metrics reflect feasibility on a tiny subset, not production performance.

---

## Toy Experiment (`toy_qml_experiment.py`)

An educational sanity check — verifies the complete pipeline on 4 hand-crafted samples:

```
Checks:
  1. Feature scaling to [0, π] for ZZFeatureMap
  2. ZZFeatureMap circuit construction
  3. Quantum kernel matrix (diagonal=1, within-class > cross-class)
  4. QSVC training and prediction (expected: 100% accuracy on 4 samples)
  5. End-to-end prediction path

Expected output: [PASS] QSVC correctly classified all 4 samples.
Runtime: < 10 seconds
```

Run this first to verify your environment is working.

---

## Dependencies

See `phase2/requirements_quantum.txt`. Key packages:

```
qiskit>=1.0
qiskit-machine-learning>=0.8
qiskit-algorithms>=0.3
scikit-learn>=1.3
numpy>=1.24
```

---

## Known Limitations

1. **Statistical reliability** — ~1 fraud case in 25 test samples makes recall/precision/F1 unreliable
2. **QSVC is slow** — O(N²) kernel; 100 samples ≈ 82 minutes; 200 samples ≈ 5+ hours
3. **Noiseless simulation only** — Real hardware would degrade results significantly
4. **Small feature count** — Only 4 of 30 features used (quantum circuit depth constraint)
5. **No IBM Quantum** — Hardware integration is a Phase 3 goal

---

*Part of the Credit Card Fraud Detection System — see root [README.md](../README.md)*
