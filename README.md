# Credit Card Fraud Detection — Classical + Quantum ML

A fraud detection system built in two phases: a completed classical ML baseline (XGBoost) and a completed quantum ML proof-of-concept (QSVC + VQC) benchmarked against it. Served via a FastAPI backend and a React + Vite dashboard (FraudGuard).

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![XGBoost](https://img.shields.io/badge/Model-XGBoost-red)](https://xgboost.readthedocs.io/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Phase 1](https://img.shields.io/badge/Phase%201-Complete-brightgreen)](#project-status)
[![Phase 2 (Quantum)](https://img.shields.io/badge/Phase%202%20(Quantum)-Complete-brightgreen)](#project-status)

> **Honest status:** Phase 1 (classical XGBoost baseline) and Phase 2 (quantum ML proof-of-concept on a local simulator) are **complete**. The FastAPI backend and React dashboard are functional and under active development. Quantum experiments use **local Qiskit Statevector simulation** — IBM Quantum hardware is not integrated.

---

## What This Project Does

Credit card fraud is rare — only about 0.17% of transactions are fraudulent — which makes it a genuinely hard detection problem. This project:

1. **Trains a classical XGBoost model** on 284,807 real European credit card transactions (Phase 1 — complete).
2. **Implements quantum ML classifiers** (QSVC and VQC) on a 4-feature subset and benchmarks them against the classical baseline (Phase 2 — complete).
3. **Serves predictions via a FastAPI backend** connected to a React + Vite dashboard, with live fraud scores.
4. **Documents the results honestly** — including the fact that quantum models do not outperform XGBoost on this dataset at this scale.

---

## Results

### Phase 1 — Classical XGBoost (Primary Model)

Evaluated on a held-out test set (56,962 transactions, never seen during training).

| Metric               | Score      | Notes |
| --------------------- | ---------- | ----- |
| **PR-AUC** (primary)  | **0.8716** | Primary metric — ROC-AUC is misleading under severe class imbalance |
| ROC-AUC                | 0.9692     | |
| F1 Score               | 0.8723     | |
| Precision              | 0.9111     | |
| Recall                 | 0.8367     | Catches ~83.7% of fraud |
| False Positive Rate    | 0.014%     | |

### Phase 2 — Quantum ML (Experimental Proof-of-Concept)

> ⚠️ **Important:** Quantum models use a **100-sample balanced subset** (50 fraud + 50 legitimate) with **4 features** on a **local Qiskit Statevector simulator** (ideal, noiseless). IBM Quantum hardware is not integrated. The test set had only ~1 fraud case in 25 samples, so per-class metrics (recall/F1/precision) have very limited statistical reliability. **These results demonstrate quantum feasibility, not quantum superiority.**

| Metric    | QSVC (Quantum Kernel) | VQC (Variational) | XGBoost |
| --------- | --------------------- | ----------------- | ------- |
| Train samples | 100 | 100 | 227,845 |
| Features | 4 | 4 | 30 |
| ROC-AUC | 0.0833 | 0.7083 | 0.9692 |
| PR-AUC | 0.0435 | 0.1250 | 0.8716 |
| Train time | ~21 s | ~5 s | Not recorded |

Full results: `phase2/results/phase2_benchmark_final.json` · `PHASE2_COMPLETION_REPORT.md`

---

## Project Status

| Component                              | Status              |
| --------------------------------------- | ------------------- |
| Dataset (Kaggle, 284,807 transactions)  | ✅ Complete          |
| Preprocessing pipeline                  | ✅ Complete          |
| XGBoost classical model (Phase 1)       | ✅ Complete          |
| 4-feature quantum-ready dataset         | ✅ Complete          |
| QSVC + VQC quantum classifiers (Phase 2)| ✅ Complete (local sim)|
| Classical vs. quantum benchmark         | ✅ Complete (local sim)|
| FastAPI backend                         | 🟡 In development    |
| React + Vite dashboard (FraudGuard)     | 🟡 In development    |
| IBM Quantum hardware integration        | ⏳ Future work        |

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
    │  XGBoost (Phase 1) │   │ 4-feature quantum set  │
    │   classical model  │   │  QSVC + VQC (Phase 2) │
    │   ✅ Complete       │   │  ✅ Complete (local sim)│
    └─────────┬──────────┘   └───────────────────────┘
              │
    ┌─────────▼─────────┐
    │  FastAPI backend   │
    │  predictions + SHAP│
    └─────────┬─────────┘
              │
    ┌─────────▼─────────┐
    │ React + Vite       │
    │ FraudGuard UI      │
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
cd frontend
npm install
npm run dev
```

- **Dashboard:** http://localhost:5173
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Run Quantum Experiments

```bash
# Install quantum dependencies
pip install -r phase2/requirements_quantum.txt

# Sanity check (<10 seconds)
python -m phase2.experiments.toy_qml_experiment

# Full benchmark (QSVC ~21 min, VQC ~5 sec)
python -m phase2.experiments.phase2_benchmark

# Skip expensive QSVC, run VQC + XGBoost only
python -m phase2.experiments.phase2_benchmark --skip-qsvc
```

---

## Project Structure

```
.
├── data/processed/          # Preprocessed datasets and model artifacts
├── docs/                    # Detailed documentation
├── frontend/                # React + Vite dashboard (FraudGuard)
├── notebooks/               # Exploration and EDA notebooks
├── phase1/                  # Classical XGBoost pipeline
├── phase2/                  # Quantum ML experiments and results
│   ├── quantum/             # QSVC, VQC, evaluation modules
│   ├── experiments/         # Benchmark and experiment scripts
│   └── results/             # JSON/CSV result files
├── src/                     # FastAPI backend
├── tests/                   # Test suite
├── requirements.txt         # Core Python dependencies
└── phase2/requirements_quantum.txt  # Qiskit quantum dependencies
```

---

## Roadmap

- [x] Classical XGBoost baseline trained and evaluated
- [x] 4-feature quantum-ready dataset prepared
- [x] QSVC (Quantum Kernel SVM) implemented and benchmarked
- [x] VQC (Variational Quantum Classifier) implemented and benchmarked
- [x] Classical vs. quantum benchmark completed (local simulation)
- [ ] Finish FastAPI backend + React dashboard (live SHAP explanations)
- [ ] IBM Quantum hardware integration (Phase 3)
- [ ] Larger balanced quantum test sets for reliable per-class metrics

---

## Documentation

All detailed documentation lives in [`docs/`](./docs):

| File                          | What it covers                                                |
| ------------------------------ | -------------------------------------------------------------- |
| `docs/PROJECT_OVERVIEW.md`     | Architecture, components, what is built vs. planned            |
| `docs/DATASET.md`              | Dataset details, features, class imbalance, preprocessing      |
| `docs/ML_MODEL.md`             | Classical XGBoost model — architecture, training, evaluation   |
| `docs/RESULTS.md`              | Phase 1 and Phase 2 benchmark results                          |
| `docs/QUANTUM_PLAN.md`         | Quantum roadmap, completed work, future steps                  |
| `docs/DEVELOPMENT_GUIDE.md`    | Folder structure, how to run, where to add quantum code        |

Phase 2 documentation: `phase2/README.md` · `PHASE2_COMPLETION_REPORT.md`

---

## License

MIT
