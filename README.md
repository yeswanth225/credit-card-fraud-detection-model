# Credit Card Fraud Detection — Classical & Quantum Machine Learning Audit

This repository implements an end-to-end credit card fraud detection system benchmarked across classical machine learning (XGBoost) and quantum machine learning algorithms (QSVC, VQC) on the **real European Credit Card Fraud Detection dataset** (284,807 transactions).

---

## 1. Project Overview & Architecture

```
                               ┌────────────────────────────────┐
                               │   European Cardholder Data     │
                               │   (284,807 rows, 0.172% fraud) │
                               └───────────────┬────────────────┘
                                               │ Stratified Split (60/20/20, seed=42)
                    ┌──────────────────────────┴──────────────────────────┐
                    │                                                     │
     ┌──────────────▼──────────────┐                       ┌──────────────▼──────────────┐
     │  Train Split (170,883 rows) │                       │ Val (56,962) & Test (56,962)│
     │  - Fit StandardScaler       │                       │ - Transform with Train Scaler│
     │  - Fit Angle Scaler [-π, π] │                       │ - Test Untouched until Eval │
     │  - Feature Selection (Top 4)│                       └─────────────────────────────┘
     └──────────────┬──────────────┘
                    │
         ┌──────────┴──────────────────────────────────────────┐
         │                                                     │
┌────────▼────────────────────┐                       ┌────────▼────────────────────┐
│   Classical Pipeline (30F)  │                       │   Quantum Pipeline (4F/4Q)  │
│   - Full 30 Features        │                       │   - Features: V14, V4, V12, V8│
│   - XGBoost Classifier      │                       │   - ZZFeatureMap (4 qubits) │
│   - PR-AUC = 0.8716         │                       │   - QSVC (Fidelity Kernel)  │
│   - Threshold tuned on Val  │                       │   - VQC (RealAmplitudes)    │
│   - SHAP Explainability     │                       │   - XGBoost-4F Control      │
└────────┬────────────────────┘                       └────────┬────────────────────┘
         │                                                     │
         └──────────────────────────┬──────────────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   FastAPI Backend   │
                         │   Port 8000         │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   React + Vite UI   │
                         │   Port 5173 / 3002  │
                         └─────────────────────┘
```

---

## 2. Dataset Verification

- **Source:** Kaggle European Credit Card Fraud Detection dataset (`data/raw/creditcard.csv`)
- **Total Transactions:** 284,807
- **Legitimate:** 284,315 (99.8273%)
- **Fraud:** 492 (0.1727%)
- **Imbalance Ratio:** ~1 fraud per 578 legitimate transactions

---

## 3. Data Splitting & Leakage Prevention

To ensure strict academic and scientific validity:
1. **Stratified Split:** 60% Train (170,883), 20% Validation (56,962), 20% Test (56,962) with `random_state=42`.
2. **Zero Leakage:**
   - `StandardScaler` is fitted **exclusively on the training split**. Validation and test sets are transformed without refitting.
   - `MinMaxScaler([-π, π])` for angle encoding is fitted **exclusively on the training split**.
   - Feature selection (`V14`, `V4`, `V12`, `V8`) is derived from the Phase 1 training split feature importance (>72% total Gini weight).
   - Optimal classification thresholds are optimized on the **validation split only**, then frozen before test set evaluation.
   - Test split indices are completely disjoint from training and validation indices.

---

## 4. Benchmark Results

| Model | Features | Qubits | Training Size | PR-AUC (Primary) | ROC-AUC | F1 Score | Recall | Precision | FPR |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **XGBoost (Phase 1 Baseline)** | 30 | N/A | 227,845 | **0.8716** | **0.9692** | **0.8723** | 0.8367 | 0.9111 | 0.00014 |
| **XGBoost-4F (Classical Control)** | 4 | N/A | 150 | 1.0000* | 1.0000* | 0.0606 | 1.0000 | 0.0313 | 0.1558 |
| **QSVC (Quantum Kernel SVM)** | 4 | 4 | 150 | 0.0333 | 0.8543 | 0.0211 | 1.0000 | 0.0106 | 0.4673 |
| **VQC (Variational QC)** | 4 | 4 | 150 | 0.0152 | 0.6734 | 0.0000 | 0.0000 | 0.0000 | 0.1407 |

*\*Statistical Caveat*: Evaluated on small representative test slices with 1 fraud case, per-class metrics have wide confidence intervals. The Phase 1 XGBoost evaluated on 56,962 transactions provides the authoritative statistical reference.

---

## 5. Visualizations Generated

All evaluation artifacts are automatically saved in `phase2/results/plots/`:
1. `pr_curve_comparison.png` — Precision-Recall curves with imbalanced context
2. `roc_curve_comparison.png` — Receiver Operating Characteristic curves
3. `model_comparison_bar.png` — PR-AUC, ROC-AUC, and F1 side-by-side comparison
4. `feature_importance_top4.png` — Top 4 quantum features vs unused classical features
5. `confusion_matrices.png` — Multi-model confusion matrix breakdown
6. `computational_cost_comparison.png` — Training and inference runtime benchmarks
7. `class_distribution.png` — Linear and log scale dataset imbalance profile
8. `quantum_circuit_diagram.png` — 4-qubit ZZFeatureMap + RealAmplitudes circuit rendering

---

## 6. How to Run

### Run Quantum ML Benchmarks
```powershell
# 1. Ultra-fast sanity check (<15 seconds)
.\venv\Scripts\python -m phase2.experiments.phase2_benchmark_real --quick-test

# 2. Development benchmark (train=300, val=150, test=600)
.\venv\Scripts\python -m phase2.experiments.phase2_benchmark_real --max-train-samples 300 --max-val-samples 150 --max-test-samples 600

# 3. Authoritative final benchmark
.\venv\Scripts\python -m phase2.experiments.phase2_benchmark_real --final

# 4. Educational toy experiment
.\venv\Scripts\python -m phase2.experiments.toy_qml_experiment
```

### Run FastAPI Backend & Frontend
```powershell
# Start Backend
.\venv\Scripts\uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# Start Frontend (separate terminal)
cd frontend
npm run dev
```

### Run Automated Tests
```powershell
.\venv\Scripts\pytest tests/ -v
```

---

## 7. Limitations & Honest Scientific Assessment

- **No Quantum Advantage Claimed:** On tabular financial transaction data, classical XGBoost with 30 features substantially outperforms 4-qubit quantum models.
- **Dimensionality Constraint:** Mapping transactions to 4 qubits requires dropping 26 PCA features, discarding ~28% of the discriminative variance.
- **Simulation Scaling:** Statevector simulation scales exponentially ($O(2^n)$), while quantum kernel matrix computation scales quadratically ($O(N^2)$), restricting quantum training to subsamples.
- **Noise Modeling:** Experiments were conducted on an ideal noiseless simulator; NISQ hardware noise would further reduce quantum fidelity without error mitigation.

---

## 8. Future Work

1. **Noise-Aware Simulation:** Benchmarking with realistic thermal relaxation and gate error models (e.g. Qiskit Aer fake backends).
2. **Larger Qubit Circuits:** Exploring 6-qubit and 8-qubit circuits as classical simulation optimizations allow.
3. **Hardware Execution:** Submitting representative 4-qubit circuits to IBM Quantum cloud hardware.
4. **Hybrid Routing Architecture:** Using quantum classifiers strictly as secondary arbiters on high-uncertainty transactions (e.g. fraud probability 0.45–0.55).
