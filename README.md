# Credit Card Fraud Detection System
> A full-stack, production-grade fraud detection platform combining classical machine learning (XGBoost) with Quantum Machine Learning (QML/VQC), backed by a real credit card dataset and a modern browser-based SPA dashboard.

---

## 📑 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Phase 1 — Classical ML](#phase-1--classical-ml)
- [Phase 2 — Quantum ML](#phase-2--quantum-ml)
- [Frontend Dashboard](#frontend-dashboard)
- [Dataset](#dataset)
- [Configuration](#configuration)
- [Development](#development)
- [Results Summary](#results-summary)

---

## Project Overview

This project implements a credit card fraud detection system that:

1. **Trains classical ML models** (XGBoost, Random Forest, Logistic Regression) on 284,807 real credit card transactions.
2. **Explores Quantum ML** via Quantum Kernel SVM (QSVC) and Variational Quantum Circuits (VQC) using PennyLane.
3. **Presents results** through a premium vanilla JS SPA dashboard with real-time risk scoring, batch analysis, audit history, and notifications.

### Key Stats
| Metric | Value |
|:---|:---|
| Dataset Transactions | 284,807 |
| Fraud Transactions | 492 (0.17%) |
| Classical Best AUC-ROC | 0.9849 (XGBoost) |
| QML Kernel Qubits | 4 qubits |
| Frontend Screens | 9 screens |
| Seed Dataset Transactions | 55 (12 flagged) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser SPA                        │
│    [cred] — Fraud Detection Dashboard (Vanilla JS)      │
│  Dashboard │ History │ Single Check │ Notifications ...  │
└──────────────────────────┬──────────────────────────────┘
                           │ localStorage (client state)
┌──────────────────────────▼──────────────────────────────┐
│                    ML Engine (JS)                        │
│   Classical XGBoost proxy scorer  │  Quantum VQC proxy  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              Python Backend (optional)                   │
│   Phase 1: XGBoost  │  Phase 2: PennyLane QML           │
│   src/ml/           │  phase2/quantum/ + experiments/   │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Clone & Setup Python Environment
```bash
git clone https://github.com/yeswanth225/credit-card-fraud-detection-model
cd credit-card-fraud-detection-model

python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Run the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### 3. Run Phase 2 QML Experiments
```bash
pip install -r phase2/requirements_quantum.txt

# Toy experiment (fast, no GPU needed):
python -m phase2.experiments.toy_qml_experiment

# Full quantum kernel (uses real dataset subset):
python -m phase2.experiments.quantum_kernel_experiment
```

---

## Directory Structure

```
credit-card-fraud-detection-model/
├── README.md                        ← This file
├── requirements.txt                 ← Core Python dependencies
├── requirements-plus.txt            ← Extended dependencies
├── pyproject.toml                   ← Project metadata
├── .env                             ← Environment variables (not committed)
├── run_backend.bat                  ← Windows backend launcher
│
├── frontend/                        ← SPA Dashboard (Vanilla HTML/CSS/JS)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── css/                         ← Design system
│   │   ├── tokens.css               ← Color, spacing, typography tokens
│   │   ├── reset.css                ← CSS reset
│   │   ├── components.css           ← UI components
│   │   ├── layout.css               ← App shell layout
│   │   └── screens.css              ← Screen-specific styles
│   └── js/                          ← Application logic
│       ├── app.js                   ← Router, shell HTML, navigation
│       ├── store.js                 ← localStorage state management
│       ├── ml.js                    ← Fraud scoring engine (JS proxy)
│       ├── notifications.js         ← Alert system, bell badge
│       ├── csv.js                   ← CSV parsing and validation
│       ├── export.js                ← CSV/PDF export
│       ├── icons.js                 ← SVG icon system
│       ├── seed-data.js             ← Real dataset samples (55 transactions)
│       └── screens/
│           ├── auth.js              ← Login, signup, password reset
│           ├── dashboard.js         ← Main dashboard + batch analysis
│           ├── history.js           ← Audit history list + batch detail
│           ├── single-check.js      ← Individual transaction checker
│           ├── transaction.js       ← Transaction detail view
│           ├── notifications-screen.js
│           ├── settings.js
│           └── about.js
│
├── data/                            ← Raw and processed datasets
│   ├── raw/                         ← Original creditcard.csv / parquet files
│   └── processed/                   ← Feature-engineered data
│
├── src/                             ← Python backend source
│   ├── data_loader.py               ← Data loading utilities
│   ├── api/                         ← FastAPI endpoints
│   ├── ml/                          ← Classical ML models
│   ├── models/                      ← Saved model artifacts
│   ├── quantum/                     ← Backend quantum utilities
│   └── database/                    ← DB layer
│
├── phase1/                          ← Phase 1: Classical ML work
│   ├── PHASE1_FINAL_SUMMARY.txt
│   ├── data/
│   ├── models/
│   ├── notebooks/
│   └── scripts/
│
├── phase2/                          ← Phase 2: Quantum ML work
│   ├── README.md                    ← Phase 2 detailed docs
│   ├── requirements_quantum.txt
│   ├── quantum/                     ← Core quantum modules
│   │   ├── circuits.py
│   │   ├── config.py
│   │   ├── data_preparation.py
│   │   ├── feature_encoding.py
│   │   ├── quantum_kernel.py
│   │   ├── qsvc_model.py
│   │   ├── vqc_model.py
│   │   └── evaluation.py
│   ├── experiments/                 ← Runnable experiments
│   │   ├── toy_qml_experiment.py
│   │   ├── quantum_kernel_experiment.py
│   │   ├── vqc_experiment.py
│   │   ├── feature_map_experiment.py
│   │   ├── feature_count_experiment.py
│   │   ├── noise_experiment.py
│   │   ├── benchmark.py
│   │   ├── run_all.py
│   │   └── visualize.py
│   ├── results/                     ← Saved experiment outputs
│   │   ├── quantum_kernel_results.json
│   │   ├── vqc_results.json
│   │   └── model_comparison.csv
│   ├── models/
│   └── notebooks/
│
├── notebooks/                       ← Jupyter notebooks
├── scripts/                         ← Utility scripts
├── docs/                            ← Documentation
└── tests/                           ← Test suite
```

---

## Phase 1 — Classical ML

See [`docs/ML_MODEL.md`](docs/ML_MODEL.md) for full details.

### Models Trained
| Model | AUC-ROC | Precision | Recall | F1 |
|:---|:---|:---|:---|:---|
| **XGBoost** | **0.9849** | 0.88 | 0.82 | 0.85 |
| Random Forest | 0.9821 | 0.86 | 0.79 | 0.82 |
| Logistic Regression | 0.9743 | 0.74 | 0.71 | 0.72 |

### Features Used
- `amount` — Transaction amount
- `merchant` — Merchant category
- `mcc` — Merchant Category Code
- `country` — Transaction country
- `card_type` — Card type
- `hour` — Hour of transaction
- `distance_from_home` — Distance anomaly flag

---

## Phase 2 — Quantum ML

See [`phase2/README.md`](phase2/README.md) for full details.

### Approach
- **Quantum Kernel SVM (QSVC)**: Encodes fraud features into quantum states using ZZFeatureMap, computes kernel matrix on quantum simulator, feeds into classical SVM.
- **Variational Quantum Circuit (VQC)**: Parameterized 4-qubit ansatz trained via gradient descent to classify fraud vs. legitimate transactions.

### Experiments Available
| Experiment | File | Description |
|:---|:---|:---|
| Toy QML | `toy_qml_experiment.py` | 4-sample synthetic test, fast local run |
| Quantum Kernel | `quantum_kernel_experiment.py` | Real dataset, 50-sample balanced subset |
| VQC | `vqc_experiment.py` | Variational circuit training |
| Feature Map | `feature_map_experiment.py` | Compare ZZ, Pauli, Amplitude encoding |
| Feature Count | `feature_count_experiment.py` | 2, 3, 4 qubit comparison |
| Noise | `noise_experiment.py` | Depolarizing noise sensitivity |
| Benchmark | `benchmark.py` | Classical vs Quantum accuracy comparison |

---

## Frontend Dashboard

See [`frontend/README.md`](frontend/README.md) for full details.

### Screens
| Screen | Route | Description |
|:---|:---|:---|
| Dashboard | `/dashboard` | Batch upload, stats overview, transaction table |
| History | `/history` | Audit log of all batch runs |
| Batch Detail | `/history/:id` | Drill-down into a specific batch |
| Single Check | `/single-check` | Real-time individual transaction risk scoring |
| Transaction | `/transaction/:id` | Full transaction detail + risk breakdown |
| Notifications | `/notifications` | Fraud alerts (12 seeded high-risk alerts) |
| Settings | `/settings` | Profile, notification preferences |
| About | `/about` | Quantum engine explanation |
| Auth | `/login`, `/signup` | Authentication screens |

### Tech Stack
- **HTML5** + **Vanilla CSS** (design tokens, component system)
- **Vanilla JS** ES Modules (no framework)
- **Vite** for bundling
- **localStorage** for client state (no backend required for demo)

---

## Dataset

See [`docs/DATASET.md`](docs/DATASET.md) for full details.

- **Source**: Kaggle — Credit Card Fraud Detection (ULB)
- **Records**: 284,807 transactions (2 days, European cardholders)
- **Fraud Rate**: 0.172% (492 fraudulent)
- **Features**: 30 (28 PCA-anonymized V1–V28 + Time + Amount)
- **Format**: CSV / Parquet

---

## Configuration

### `.env` (root level)
```env
# Data paths
DATA_DIR=./data/raw
PROCESSED_DIR=./data/processed

# Model paths
MODEL_DIR=./src/models

# API settings
API_HOST=0.0.0.0
API_PORT=8000
```

### `frontend/.env` (if needed)
```env
VITE_API_URL=http://localhost:8000
```

---

## Development

### Run frontend dev server
```bash
cd frontend && npm run dev
```

### Run Python backend
```bash
# Windows:
run_backend.bat
# Or directly:
uvicorn src.api.main:app --reload --port 8000
```

### Run tests
```bash
pytest tests/ -v
```

### Install quantum dependencies
```bash
pip install -r phase2/requirements_quantum.txt
```

---

## Results Summary

| Model | Type | AUC-ROC | Notes |
|:---|:---|:---|:---|
| XGBoost | Classical | 0.9849 | Production model |
| Random Forest | Classical | 0.9821 | Ensemble |
| QSVC (4 qubits) | Quantum | ~0.82 | 50-sample sim |
| VQC (4 qubits) | Quantum | ~0.78 | Sim only |

> **Note**: QML results are from local simulation on a 50-sample balanced subset. Real hardware results may differ.

---

## License

This project is for educational and research purposes.

---

*Built with ❤️ using Python, PennyLane, Qiskit, XGBoost, and Vanilla JS*
