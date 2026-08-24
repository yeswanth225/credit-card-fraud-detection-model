# Credit Card Fraud Detection — Classical + Quantum

A fraud detection system built in two stages: a completed classical ML baseline (XGBoost), and an upcoming quantum machine learning phase (VQC / QSVM) evaluated against it.

> **Honest status:** Phase 1 (classical XGBoost baseline) is **complete and evaluated on real data**. The quantum implementation has **not started yet**. The frontend and backend are functional and under active development.

---

## What This Project Does

Credit card fraud is rare — only about 0.17% of transactions are fraudulent — which makes it a hard detection problem. This project:

1. **Trains a classical XGBoost model** on 284,807 real European credit card transactions and achieves strong performance (PR-AUC 0.8557, F1 0.8541).
2. **Prepares a quantum-ready dataset** (8 most important features) for comparison with quantum classifiers.
3. **Serves predictions through a FastAPI backend** connected to a React + Vite dashboard with live fraud scores and SHAP explanations.
4. **Plans a quantum benchmarking phase** (VQC and QSVM) to honestly answer: can quantum computing improve fraud detection?

---

## Project Status

| Component | Status |
|-----------|--------|
| Dataset (Kaggle, 284,807 transactions) | ✅ Complete |
| Preprocessing pipeline | ✅ Complete |
| XGBoost classical model | ✅ Complete |
| Hyperparameter tuning | ✅ Complete |
| Threshold optimization | ✅ Complete |
| 8-feature quantum-ready dataset | ✅ Prepared |
| FastAPI backend | 🟡 In development |
| React + Vite dashboard | 🟡 In development |
| VQC (Variational Quantum Classifier) | ⏳ Not started |
| QSVM (Quantum SVM) | ⏳ Not started |
| Classical vs quantum benchmark | ⏳ Not started |

---

## Results (Phase 1 — Classical Baseline)

Evaluated on a held-out test set never seen during training or tuning.

| Metric | Score |
|--------|-------|
| **PR-AUC** (primary) | **0.8557** |
| ROC-AUC | 0.9695 |
| F1 Score | 0.8541 |
| Precision | 0.9080 |
| Recall | 0.8061 |

The model catches **~80.6% of fraud** with only **8 false alarms** across 56,864 legitimate transactions.

---

## How to Run

**Prerequisites:** Python 3.10+, Node.js 18+, `data/raw/creditcard.csv` ([download from Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud))

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the classical ML pipeline
python src/data_loader.py
python src/ml/data_preprocessor.py
python src/ml/classical_model.py

# Start the backend
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# Start the frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Documentation

| File | What it covers |
|------|---------------|
| [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) | Architecture, components, what is built vs planned |
| [`DATASET.md`](DATASET.md) | Dataset details, features, class imbalance, preprocessing |
| [`ML_MODEL.md`](ML_MODEL.md) | Classical XGBoost model — architecture, training, evaluation |
| [`RESULTS.md`](RESULTS.md) | Actual metrics from Phase 1 |
| [`QUANTUM_PLAN.md`](QUANTUM_PLAN.md) | Quantum roadmap, algorithms, comparison strategy |
| [`DEVELOPMENT_GUIDE.md`](DEVELOPMENT_GUIDE.md) | Folder structure, how to run, where to add quantum code |

---

## License

MIT
