# Credit Card Fraud Detection — Classical + Quantum ML

A fraud detection system built in two stages: a completed, evaluated classical machine learning baseline (XGBoost), and a planned quantum machine learning phase (VQC / QSVM) that will be benchmarked honestly against it to answer one question — **can quantum computing actually improve fraud detection in a realistic financial scenario?**

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![XGBoost](https://img.shields.io/badge/Model-XGBoost-red)](https://xgboost.readthedocs.io/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Phase 1](https://img.shields.io/badge/Phase%201-Complete-brightgreen)](#results-phase-1--classical-baseline)
[![Phase 2 (Quantum)](https://img.shields.io/badge/Phase%202%20(Quantum)-Not%20Started-lightgrey)](#quantum-roadmap-phase-2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](#license)

> **Honest status:** Phase 1 (classical XGBoost baseline) is **complete and evaluated on real data**. The quantum implementation has **not started yet**. The FastAPI backend and React dashboard are functional and under active development. This README reflects actual current state, not aspirational scope.

---

## Table of Contents

- [Overview](#overview)
- [Why This Project Exists](#why-this-project-exists)
- [Results — Phase 1 (Classical Baseline)](#results-phase-1--classical-baseline)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Dataset](#dataset)
- [Quantum Roadmap (Phase 2)](#quantum-roadmap-phase-2)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Project Status](#project-status)
- [Roadmap](#roadmap)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Overview

Credit card fraud is a needle-in-a-haystack problem: only about **0.17% of transactions are fraudulent**, which makes naive accuracy meaningless and forces careful attention to precision/recall tradeoffs, class imbalance handling, and evaluation metrics that actually matter for the use case.

This project approaches the problem in two deliberately separated phases so that any future quantum-vs-classical comparison is fair and evidence-based rather than aspirational:

1. **Phase 1 — Classical baseline (complete):** Train and rigorously evaluate an XGBoost model on real transaction data, establishing a real-world performance bar.
2. **Phase 2 — Quantum benchmarking (planned):** Implement VQC and QSVM quantum classifiers on a reduced 8-feature dataset and compare them against the Phase 1 baseline on identical evaluation criteria — quantum-simulator-first, with real quantum hardware gated behind a feature flag for later validation.

A FastAPI backend serves live predictions to a React + Vite dashboard, with the goal of also supporting adaptive learning (via synthetic data-drift injection) and explainable, per-transaction risk breakdowns rather than an opaque score.

---

## Why This Project Exists

Most "AI fraud detection" demos either skip evaluation rigor entirely or make unverified quantum-advantage claims without a real classical baseline to compare against. This project is built the other way around:

- Establish a **real, evaluated classical baseline first** — so there's an honest bar to beat
- Only then attempt the quantum comparison — so any claimed advantage (or lack of one) is measured against real numbers, not vibes
- Keep the current build status explicit in this README at all times, rather than implying finished work that isn't there yet

---

## Results — Phase 1 (Classical Baseline)

Evaluated on a held-out test set never seen during training or hyperparameter tuning, trained on the full [Kaggle European credit card transactions dataset](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) (284,807 transactions).

| Metric | Score | Notes |
|---|---|---|
| **PR-AUC** (primary metric) | **0.8557** | Chosen as primary since ROC-AUC is misleading under severe class imbalance |
| ROC-AUC | 0.9695 | |
| F1 Score | 0.8541 | |
| Precision | 0.9080 | |
| Recall | 0.8061 | |

**In practical terms:** the model catches **~80.6% of fraudulent transactions**, with only **8 false alarms across 56,864 legitimate transactions** in the test set — a strong precision/recall balance for a problem where both missed fraud and excessive false positives carry real cost.

---

## Architecture

```
                         ┌──────────────────────────┐
                         │   Kaggle Credit Card      │
                         │   Fraud Dataset (raw)     │
                         └────────────┬──────────────┘
                                      │
                            Preprocessing Pipeline
                          (cleaning, scaling, split)
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                    │
          ┌─────────▼─────────┐              ┌───────────▼────────────┐
          │  XGBoost Classical │              │  8-Feature Quantum-    │
          │  Model (Phase 1)   │              │  Ready Dataset          │
          │  ✅ Complete        │              │  ✅ Prepared            │
          └─────────┬─────────┘              └───────────┬────────────┘
                    │                                    │
                    │                          ┌───────────▼────────────┐
                    │                          │   VQC / QSVM Models    │
                    │                          │   (Phase 2 — planned)  │
                    │                          └───────────┬────────────┘
                    │                                    │
                    └─────────────────┬──────────────────┘
                                      │
                         Classical vs Quantum Benchmark
                                (planned, Phase 2)
                                      │
                          ┌────────────▼────────────┐
                          │   FastAPI Backend         │
                          │   (prediction serving,     │
                          │   SHAP explainability)     │
                          └────────────┬────────────┘
                                      │
                          ┌────────────▼────────────┐
                          │  React + Vite Dashboard   │
                          │  (live fraud scores,       │
                          │  explanations, history)    │
                          └────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Classical ML | Python, XGBoost, scikit-learn |
| Quantum ML (planned) | VQC (Variational Quantum Classifier) — primary; QSVM — secondary comparison |
| Backend API | FastAPI |
| Frontend | React + Vite, with charting via Plotly/Recharts |
| Data storage (dev) | SQLite |
| Explainability | SHAP |
| Environment | Python 3.10+, Node.js 18+ |

---

## Project Structure

```
credit-card-fraud-detection-model/
├── data/
│   └── processed/          # Cleaned, split, and quantum-ready datasets
├── docs/                   # Detailed project documentation (see below)
├── frontend/                # Active React + Vite dashboard
├── frontend_old/            # Previous frontend iteration, retained for reference
├── notebooks/                # Exploratory data analysis and experimentation
├── phase1/                   # Phase 1 classical model artifacts
├── scripts/                  # Utility and automation scripts
├── src/                      # Core application source (API, model pipeline)
├── .agents/skills/           # AI-agent skill definitions used in development
├── .claude/                  # Claude Code project configuration
├── pyproject.toml            # Python project configuration
├── requirements.txt          # Core Python dependencies
├── requirements-plus.txt     # Extended/optional dependencies
├── run_backend.bat           # Windows helper script to launch the backend
└── README.md
```

---

## Dataset

- **Source:** [Kaggle — Credit Card Fraud Detection (ULB)](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
- **Size:** 284,807 transactions made by European cardholders over two days
- **Class balance:** ~0.17% fraudulent — a severely imbalanced classification problem
- **Features:** PCA-transformed numerical features (`V1`–`V28`) plus `Time` and `Amount`
- A separate **8-feature quantum-ready subset** has been prepared for Phase 2, selecting the most predictive features to keep the quantum circuit width tractable on simulators and near-term hardware

Full dataset handling, class-imbalance strategy, and preprocessing decisions are documented in [`docs/DATASET.md`](docs/DATASET.md).

---

## Quantum Roadmap (Phase 2)

Not yet started. Planned approach:

- **VQC (Variational Quantum Classifier)** as the primary quantum model
- **QSVM (Quantum Support Vector Machine)** as a secondary comparison model
- Trained and evaluated on the same 8-feature quantum-ready dataset, using the same evaluation metrics (PR-AUC as primary) as the Phase 1 classical baseline, so the comparison is apples-to-apples
- **Quantum-simulator-first** development, with real quantum hardware execution gated behind a feature flag for later validation once the simulator results are sound
- Adaptive learning exploration via synthetic data-drift injection, to evaluate how each model type responds to changing fraud patterns over time — not just static-dataset performance

Full plan and comparison methodology: [`docs/QUANTUM_PLAN.md`](docs/QUANTUM_PLAN.md).

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- The raw dataset at `data/raw/creditcard.csv` — [download from Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)

### Installation & Running

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Start the backend API
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# 3. In a separate terminal, start the frontend
cd frontend
npm install
npm run dev
```

Windows users can also launch the backend via the included `run_backend.bat`.

| Service | URL |
|---|---|
| Dashboard | http://localhost:5173 |
| API | http://localhost:8000 |
| Interactive API docs (Swagger) | http://localhost:8000/docs |

---

## Documentation

Detailed documentation lives in [`docs/`](docs):

| File | Covers |
|---|---|
| [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) | Architecture, components, what's built vs. planned |
| [`docs/DATASET.md`](docs/DATASET.md) | Dataset details, features, class imbalance, preprocessing |
| [`docs/ML_MODEL.md`](docs/ML_MODEL.md) | Classical XGBoost model — architecture, training, evaluation |
| [`docs/RESULTS.md`](docs/RESULTS.md) | Full Phase 1 metrics and the comparison table Phase 2 will fill in |
| [`docs/QUANTUM_PLAN.md`](docs/QUANTUM_PLAN.md) | Quantum roadmap, VQC/QSVM plan, comparison strategy |
| [`docs/DEVELOPMENT_GUIDE.md`](docs/DEVELOPMENT_GUIDE.md) | Folder structure, how to run locally, where to add quantum code |

---

## Project Status

| Component | Status |
|---|---|
| Dataset (Kaggle, 284,807 transactions) | ✅ Complete |
| Preprocessing pipeline | ✅ Complete |
| XGBoost classical model | ✅ Complete |
| 8-feature quantum-ready dataset | ✅ Prepared |
| FastAPI backend | 🟡 In development |
| React + Vite dashboard | 🟡 In development |
| VQC / QSVM (Phase 2) | ⏳ Not started |
| Classical vs. quantum benchmark | ⏳ Not started |

---

## Roadmap

- [x] Classical XGBoost baseline trained and evaluated
- [x] Quantum-ready 8-feature dataset prepared
- [ ] Finish FastAPI backend endpoints for live scoring and SHAP explanations
- [ ] Finish React + Vite dashboard (live scores, history, explanations)
- [ ] Implement VQC quantum classifier
- [ ] Implement QSVM quantum classifier
- [ ] Run classical-vs-quantum benchmark on identical evaluation criteria
- [ ] Publish honest findings — including if quantum does *not* outperform classical

---

## License

Released under the [MIT License](LICENSE).

---

## Acknowledgments

- Dataset: Machine Learning Group — ULB (Université Libre de Bruxelles), via [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
