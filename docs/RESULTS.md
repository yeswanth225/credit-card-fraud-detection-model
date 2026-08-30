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
Backend:      Qiskit Statevector (local ideal simulation)
Dataset:      100 train (50 fraud, 50 legit), 25 test (stratified, 1 fraud)

Confusion Matrix:
  [[15  9]
   [ 1  0]]

Accuracy:   60.0%
Precision:  0.0%
Recall:     0.0%
F1-Score:   0.0%
AUC-ROC:    0.083
PR-AUC:     0.043
```

### VQC (Variational Quantum Classifier)

```
Circuit:      4-qubit ZZFeatureMap + RealAmplitudes ansatz (2 reps)
Optimizer:    COBYLA (max_iter=20)
Backend:      Qiskit Statevector (local ideal simulation)
Dataset:      100 train (50 fraud, 50 legit), 25 test (stratified, 1 fraud)

Confusion Matrix:
  [[13 11]
   [ 0  1]]

Accuracy:   56.0%
Precision:  8.3%
Recall:     100.0%
F1-Score:   15.4%
AUC-ROC:    0.542
PR-AUC:     0.083
```

## Full Model Comparison

| Model | Type | Dataset Size | AUC-ROC | PR-AUC |
|:---|:---|:---:|:---:|:---:|
| XGBoost | Classical | 284,807 | 0.969 | 0.872 |
| QSVC (4q, ZZ) | Quantum | 100 | 0.083 | 0.043 |
| VQC (4q, ZZ+RY) | Quantum | 100 | 0.542 | 0.083 |

> **Key insight**: The performance gap between classical and quantum models in this experiment is heavily influenced by **data size**. Classical models train on ~227K samples; quantum models are limited to 100 samples due to O(n²) kernel complexity and local simulation constraints. The test set size of 25 (with only 1 fraud case) also severely limits the statistical reliability of the precision/recall metrics.

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
