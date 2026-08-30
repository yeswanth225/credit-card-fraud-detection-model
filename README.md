# Credit Card Fraud Detection — Classical + Quantum

A fraud detection system built in two stages: a completed classical ML baseline (XGBoost), and an upcoming quantum machine learning phase (VQC / QSVM) benchmarked against it.

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![XGBoost](https://img.shields.io/badge/Model-XGBoost-red)](https://xgboost.readthedocs.io/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Phase 1](https://img.shields.io/badge/Phase%201-Complete-brightgreen)](#project-status)
[![Phase 2 (Quantum)](https://img.shields.io/badge/Phase%202%20(Quantum)-Not%20Started-lightgrey)](#project-status)

> **Honest status:** Phase 1 (classical XGBoost baseline) is **complete and evaluated on real data**. The quantum implementation has **not started yet**. The frontend and backend are functional and under active development.

---

## What This Project Does

Credit card fraud is rare — only about 0.17% of transactions are fraudulent — which makes it a genuinely hard detection problem. This project:

1. **Trains a classical XGBoost model** on 284,807 real European credit card transactions.
2. **Prepares a quantum-ready dataset** (the 8 most important features) for a fair comparison against quantum classifiers.
3. **Serves predictions via a FastAPI backend** connected to a React + Vite dashboard, with live fraud scores and SHAP explanations.
4. **Plans a quantum benchmarking phase** (VQC and QSVM) to honestly answer one question: can quantum computing actually improve fraud detection in a realistic financial scenario?

---

## Results (Phase 1 — Classical Baseline)

Evaluated on a held-out test set never seen during training or tuning.

| Metric               | Score      |
| --------------------- | ---------- |
| **PR-AUC** (primary)  | **0.8557** |
| ROC-AUC                | 0.9695     |
| F1 Score               | 0.8541     |
| Precision              | 0.9080     |
| Recall                 | 0.8061     |

The model catches **~80.6% of fraud** with only **8 false alarms** across 56,864 legitimate transactions.

---

## Project Status

| Component                              | Status             |
| --------------------------------------- | ------------------ |
| Dataset (Kaggle, 284,807 transactions)  | ✅ Complete         |
| Preprocessing pipeline                  | ✅ Complete         |
| XGBoost classical model                 | ✅ Complete         |
| 8-feature quantum-ready dataset         | ✅ Prepared         |
| FastAPI backend                         | 🟡 In development   |
| React + Vite dashboard                  | 🟡 In development   |
| VQC / QSVM (Phase 2)                    | ⏳ Not started      |
| Classical vs. quantum benchmark         | ⏳ Not started      |

---

## Architecture

```
                ┌─────────────────────┐
                │   Raw Transactions   │
                │  (Kaggle CSV, 284K)  │
                └──────────┬───────────┘
                           │
                 preprocessing pipeline
                           │
              ┌────────────┴────────────┐
              │                         │
    ┌─────────▼─────────┐   ┌───────────▼───────────┐
    │  XGBoost (Phase 1) │   │ 8-feature quantum set  │
    │   classical model  │   │   (Phase 2, planned)   │
    └─────────┬──────────┘   └───────────┬────────────┘
              │                          │
              └─────────────┬────────────┘
                             │
                   ┌─────────▼─────────┐
                   │  FastAPI backend   │
                   │  predictions + SHAP│
                   └─────────┬─────────┘
                             │
                   ┌─────────▼─────────┐
                   │ React + Vite       │
                   │ dashboard (live)   │
                   └────────────────────┘
```

---

## Quick Start

**Prerequisites:** Python 3.10+, Node.js 18+, `data/raw/creditcard.csv` ([download from Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud))

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the backend
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# Start the frontend (separate terminal)
cd frontend && npm install && npm run dev
```

- **Dashboard:** http://localhost:5173
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Project Structure

```
.
├── data/processed/     # Preprocessed / quantum-ready datasets
├── docs/                # Detailed documentation (see below)
├── frontend/            # React + Vite dashboard (active)
├── frontend_old/        # Superseded frontend, kept for reference
├── notebooks/           # Exploration and experimentation notebooks
├── phase1/              # Classical XGBoost pipeline artifacts
├── scripts/             # Utility / automation scripts
├── src/                 # Backend source (FastAPI, model serving)
├── requirements.txt     # Core Python dependencies
└── requirements-plus.txt # Extended/optional dependencies
```

---

## Roadmap

- [x] Classical XGBoost baseline trained and evaluated
- [x] Quantum-ready 8-feature dataset prepared
- [ ] Finish FastAPI backend + React dashboard (live scores, SHAP explanations)
- [ ] Implement VQC (primary) and QSVM (secondary) quantum classifiers
- [ ] Run classical-vs-quantum benchmark on the same held-out test set
- [ ] Publish final comparison and write-up in `docs/RESULTS.md`

---

## Documentation

All detailed documentation lives in [`docs/`](./docs):

| File                          | What it covers                                                |
| ------------------------------ | -------------------------------------------------------------- |
| `docs/PROJECT_OVERVIEW.md`     | Architecture, components, what is built vs. planned            |
| `docs/DATASET.md`              | Dataset details, features, class imbalance, preprocessing      |
| `docs/ML_MODEL.md`             | Classical XGBoost model — architecture, training, evaluation   |
| `docs/RESULTS.md`              | Actual Phase 1 metrics and comparison table for Phase 2        |
| `docs/QUANTUM_PLAN.md`         | Quantum roadmap, VQC/QSVM plan, comparison strategy            |
| `docs/DEVELOPMENT_GUIDE.md`    | Folder structure, how to run, where to add quantum code        |

---

## License

MIT
