# Project Overview

## What Has Been Built

This project detects credit card fraud using machine learning, and is being extended toward quantum machine learning for benchmarking purposes.

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

### 4. Quantum ML Pipeline ✅ Complete

Phase 2 is now complete. Reserved directory: `src/quantum/` and `phase2/`

Completed components:
- **Feature reduction:** Top 4 features extracted for quantum use.
- **VQC:** Variational Quantum Classifier using Qiskit.
- **QSVC:** Quantum Support Vector Machine using Qiskit.
- **Benchmark:** Compare quantum models against the Phase 1 XGBoost baseline (using a local simulator).

---

## What Is Complete vs Planned

| Item | Status | Notes |
|------|--------|-------|
| Classical ML pipeline | ✅ Done | Full preprocessing + XGBoost + SHAP |
| Model evaluation | ✅ Done | On real held-out test set |
| Quantum-ready 4-feature dataset | ✅ Done | Saved as .npy arrays in data/processed/ |
| FastAPI backend | 🟡 Partial | Core endpoints working, some in progress |
| React dashboard | 🟡 Partial | Connected to backend, actively developed |
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
