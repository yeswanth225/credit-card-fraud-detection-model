# Project Overview

## What Has Been Built

This project detects credit card fraud using machine learning and includes a completed quantum benchmarking phase for research purposes. The project compares classical XGBoost against QSVC and VQC experiments run on a local Qiskit simulator.

---

## System Architecture

The project has three distinct layers:

```
React + Vite Frontend (port 5173)
        │
        ▼
FastAPI Backend (port 8000)
        │
        ▼
Classical ML Pipeline          Quantum ML Pipeline (Phase 2)
  └── XGBoost model               └── VQC / QSVC
        │
        ▼
 data/processed/ (model artifacts)
        │
        ▼
 data/raw/creditcard.csv (Kaggle dataset)
```

---

## Components

### 1. Classical ML Pipeline ✅ Complete

The core model is a trained XGBoost classifier.

- **Input:** 30 features (V1–V28 PCA components + Time + Amount)
- **Training data:** 170,883 transactions (60% of dataset, stratified)
- **Output:** Fraud probability (0–1) + binary classification at threshold 0.85
- **Explainability:** SHAP values computed per prediction

**Files:**
- `src/ml/classical_model.py` — XGBoost classifier class, training, inference, SHAP
- `src/ml/data_preprocessor.py` — Feature scaling, SMOTE, train/val/test splits
- `data/processed/xgboost_model.joblib` — Trained model artifact
- `data/processed/scaler.joblib` — Fitted StandardScaler

---

### 2. FastAPI Backend 🟡 In Development

Serves the ML model as a REST API.

- **Entry point:** `src/api/main.py`
- **Key endpoints:**
  - `GET /api/analyst/transactions` — List transactions with fraud scores
  - `GET /api/analyst/transactions/{id}` — Single transaction + SHAP explanation
  - `GET /api/analyst/metrics` — Model performance metrics (PR-AUC, ROC, confusion matrix)
  - `GET /health` — Health check
  - `GET /docs` — Interactive Swagger UI

**Data flow:** Request → load model from cache → scale features → XGBoost predict → compute SHAP → return JSON

---

### 3. React + Vite Frontend 🟡 In Development

A dashboard for fraud analysts.

- **Location:** `frontend/`
- **Stack:** React 18 + TypeScript + Tailwind CSS + Vite
- **Pages:** Dashboard (transaction list), Fraud detail with SHAP chart, Model metrics
- **Connects to:** `http://localhost:8000`

---

### 4. Quantum ML Pipeline ✅ Upgraded (Phase 2 Real-Dataset Benchmark)

Phase 2 has been upgraded from an initial 100-sample proof-of-concept to a **scientifically rigorous real-dataset benchmark** using the full 284,807-transaction European Credit Card Fraud Detection dataset.

**Completed components:**
- **Real Dataset Integration:** Loaded `data/raw/creditcard.csv` (284,807 transactions, 492 fraud, 0.17% prevalence).
- **Zero-Leakage Splits:** Stratified 60%/20%/20% Train/Val/Test (`random_state=42`). `StandardScaler` and quantum angle scaler fitted on train split only.
- **Top 4 Feature Selection:** `V14`, `V4`, `V12`, `V8` selected from Phase 1 XGBoost importance (>72% of total decision weight). Artifact saved at `phase2/results/phase2_feature_selection.json`.
- **Angle Encoding:** 4 features → 4 qubits, mapped to $[-\pi, \pi]$ via `ZZFeatureMap(reps=2)`.
- **QSVC:** Quantum Kernel SVM using `FidelityQuantumKernel` (local Qiskit Statevector simulator).
- **VQC:** `RealAmplitudes` ansatz + COBYLA optimizer, validation-tuned decision threshold.
- **XGBoost-4F Baseline:** Classical XGBoost trained on the exact same 4 features for fair architectural comparison.
- **Visualizations:** PR curves, ROC curves, confusion matrices, feature importance plot, circuit diagram — saved in `phase2/results/plots/`.

**CLI Command:**
```bash
python -m phase2.experiments.phase2_benchmark_real --max-train-samples 300 --max-val-samples 150 --max-test-samples 600
```

---

## What Is Complete vs Planned

| Item | Status | Notes |
|------|--------|-------|
| Classical ML pipeline | ✅ Done | Full preprocessing + XGBoost + SHAP |
| Model evaluation | ✅ Done | On real held-out test set |
| Quantum-ready 4-feature dataset | ✅ Done | Saved as .npy arrays in `data/processed/` |
| FastAPI backend | ✅ Functional | Core endpoints working |
| React dashboard | ✅ Functional | Connected to backend and running locally |
| VQC implementation | ✅ Done | Phase 2 completed |
| QSVC implementation | ✅ Done | Phase 2 completed |
| Classical vs quantum benchmark | ✅ Done | Phase 2 completed (using local simulator) |
| Production deployment | ⏳ Future | After Phase 2 |

---

## Environment Variables

**Backend** (`.env` in project root):
```env
DATABASE_URL=sqlite:///./data/fraud_detection.db
CLASSICAL_MODEL_PATH=data/processed/classical_model.joblib
RAW_DATA_PATH=data/raw/creditcard.csv
PROCESSED_DATA_PATH=data/processed
PREDICTION_THRESHOLD=0.5
RANDOM_STATE=42
QUANTUM_HARDWARE_AVAILABLE=false
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```
