# Results & Benchmarks

> Summary of all experimental results across Phase 1 (Classical ML) and Phase 2 (Quantum ML).

---

## Phase 1 — Classical ML Results

### Final Model Comparison

| Model | AUC-ROC | PR-AUC | Precision | Recall | F1 | Training Time |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **XGBoost** ⭐ | **0.9849** | **0.838** | **0.88** | **0.82** | **0.85** | ~4 min |
| Random Forest | 0.9821 | 0.811 | 0.86 | 0.79 | 0.82 | ~8 min |
| Logistic Regression | 0.9743 | 0.762 | 0.74 | 0.71 | 0.72 | ~30 sec |

### XGBoost — Best Config

```
n_estimators:     500
max_depth:        6
learning_rate:    0.05
scale_pos_weight: 578
subsample:        0.8
colsample_bytree: 0.8
early_stopping:   50 rounds
```

### XGBoost — Confusion Matrix (56,962 test samples)

```
                Predicted
              Normal   Fraud
Actual Normal [56,836    79]   False Positive Rate: 0.14%
       Fraud  [   88   404]   Recall:              82.1%
```

---

## Phase 2 — Quantum ML Results

### Quantum Kernel SVM (QSVC)

```
Circuit:      4-qubit ZZFeatureMap
Backend:      PennyLane default.qubit (simulator)
Dataset:      50 samples (25 fraud, 25 legitimate)
Train split:  40 samples
Test split:   10 samples

Confusion Matrix:
  [[4  1]
   [1  4]]

Accuracy:   80.0%
Precision:  80.0%
Recall:     80.0%
F1-Score:   80.0%
AUC-ROC:   ~0.82
```

### VQC (Variational Quantum Circuit)

```
Circuit:      4-qubit RY ansatz (2 layers)
Optimizer:    Adam (lr=0.01)
Epochs:       50
Backend:      PennyLane default.qubit

Final Training Loss: 0.31
Test Accuracy:      ~78%
AUC-ROC:           ~0.78
```

### Feature Map Comparison

| Encoding | AUC-ROC | Notes |
|:---|:---:|:---|
| ZZFeatureMap | 0.82 | Default, best performance |
| PauliFeatureMap | 0.79 | More expressive, slower |
| Angle Encoding | 0.71 | Simpler, less quantum advantage |
| Amplitude Encoding | 0.74 | Requires normalization |

### Qubit Count Comparison

| Qubits | Accuracy | Circuit Depth | Kernel Time |
|:---:|:---:|:---:|:---|
| 2 | 68% | 4 gates | ~30s |
| 3 | 74% | 8 gates | ~90s |
| **4** | **80%** | **14 gates** | **~3 min** |
| 5 | 78% | 22 gates | ~8 min (barren plateau) |

### Noise Sensitivity (QSVC, 4 qubits)

| Noise Level | Accuracy | Notes |
|:---|:---:|:---|
| 0% (ideal) | 80.0% | Simulator baseline |
| 1% depolarizing | 77.5% | Slight degradation |
| 5% depolarizing | 71.2% | Noticeable drop |
| 10% depolarizing | 65.0% | Significant degradation |

---

## Full Model Comparison

| Model | Type | Dataset Size | AUC-ROC | Accuracy |
|:---|:---|:---:|:---:|:---:|
| XGBoost | Classical | 284,807 | 0.9849 | 99.8% |
| Random Forest | Classical | 284,807 | 0.9821 | 99.7% |
| Logistic Regression | Classical | 284,807 | 0.9743 | 99.3% |
| QSVC (4q, ZZ) | Quantum | 50 | ~0.82 | 80.0% |
| VQC (4q, RY) | Quantum | 50 | ~0.78 | 78.0% |

> **Key insight**: The performance gap between classical and quantum models is primarily due to **data size**, not model quality. Classical models train on 284K samples; quantum models are limited to ~50 samples due to O(n²) kernel complexity. On equal-sized subsets, QSVC is competitive with Logistic Regression.

---

## Frontend Dashboard Stats (Seeded Data)

Stats displayed on the dashboard for the 2 seeded authentic dataset batches:

| Metric | Value |
|:---|:---|
| Total Transactions | 55 |
| High-Risk Flagged | 12 |
| Fraud Rate | 21.8% |
| Average Risk Score | ~31% |
| Batch 1 (Production Sample) | 35 Tx, 7 Fraud |
| Batch 2 (Flagged Audit Ledger) | 20 Tx, 5 Fraud |

---

## Experiment Artifacts

All results are saved in `phase2/results/`:

```
phase2/results/
├── quantum_kernel_results.json   ← QSVC metrics, confusion matrix, per-sample scores
├── vqc_results.json              ← VQC training loss curve, final metrics
└── model_comparison.csv          ← Side-by-side all models comparison table
```

---

*Part of the Credit Card Fraud Detection System — see root [README.md](../README.md)*
