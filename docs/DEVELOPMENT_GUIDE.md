# Development Guide

## Folder Structure

```
quantum/                          ← project root
│
├── data/
│   ├── raw/
│   │   └── creditcard.csv        ← Kaggle dataset (download separately, not in git)
│   └── processed/
│       ├── xgboost_model.joblib  ← Trained model
│       ├── scaler.joblib         ← Fitted StandardScaler
│       ├── classical_model.joblib ← Alternative model save
│       ├── phase1_results.json   ← Phase 1 metrics
│       ├── X_train_quantum.npy   ← 8-feature quantum training set (227,845 × 8)
│       ├── X_test_quantum.npy    ← 8-feature quantum test set (56,962 × 8)
│       ├── y_train_quantum.npy   ← Training labels
│       ├── y_test_quantum.npy    ← Test labels
│       └── quantum_features.npy  ← Names of the 8 selected features
│
├── src/
│   ├── api/
│   │   ├── main.py               ← FastAPI app entry point
│   │   ├── analyst.py            ← Transaction + metrics endpoints
│   │   ├── verification.py       ← Prediction endpoints
│   │   └── admin.py              ← Admin endpoints
│   ├── ml/
│   │   ├── classical_model.py    ← FraudClassifier class (XGBoost + SHAP)
│   │   └── data_preprocessor.py  ← FraudDataPreprocessor class
│   ├── database/
│   │   ├── models.py             ← SQLAlchemy ORM models
│   │   └── connection.py         ← Database initialization
│   ├── quantum/                  ← EMPTY — reserved for Phase 2 code
│   └── data_loader.py            ← Data loading utilities
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx               ← Root component + page routing
│   │   ├── pages/                ← Dashboard, DetectFraud, History, Analytics, ModelPerformance
│   │   ├── components/
│   │   │   ├── layout/           ← Sidebar, TopBar
│   │   │   ├── charts/           ← Chart components
│   │   │   └── ui/               ← UI primitives
│   │   └── lib/                  ← Utilities
│   ├── .env                      ← VITE_API_URL=http://localhost:8000
│   ├── vite.config.js
│   └── package.json
│
├── notebooks/
│   ├── Phase1_Model_Analysis.ipynb  ← Main analysis notebook (run this)
│   └── Phase1_Output.ipynb          ← Pre-executed notebook with outputs
│
├── phase1/                       ← Phase 1 artifacts and scripts
│   ├── data/                     ← Duplicate model artifacts (backup)
│   └── PHASE1_FINAL_SUMMARY.txt  ← Text summary of Phase 1
│
├── phase2/                       ← Phase 2 (UPCOMING — currently placeholder)
│   ├── notebooks/                ← Put quantum experiment notebooks here
│   ├── results/                  ← Put quantum results here
│   └── models/                   ← Put saved quantum models here
│
├── scripts/
│   ├── download_data.py          ← Kaggle dataset downloader
│   ├── generate_demo_data.py     ← Synthetic demo data generator
│   ├── test_imports.py           ← Dependency checker
│   ├── install_deps.bat          ← Windows dependency installer
│   └── install_deps.sh           ← Linux/Mac dependency installer
│
├── tests/                        ← Test suite
├── docs/                         ← All project documentation (you are here)
├── .env                          ← Backend environment variables
├── requirements.txt              ← Core Python dependencies
├── requirements-plus.txt         ← Extended deps (quantum, dev tools)
├── pyproject.toml                ← Python project configuration
└── run_backend.bat               ← Windows batch file to start backend
```

---

## Where the Classical ML Code Is

| What you want | Where to look |
|--------------|--------------|
| XGBoost classifier class | `src/ml/classical_model.py` → `FraudClassifier` |
| Preprocessing (scaling, SMOTE, splits) | `src/ml/data_preprocessor.py` → `FraudDataPreprocessor` |
| API endpoints | `src/api/analyst.py`, `src/api/verification.py` |
| Trained model artifact | `data/processed/xgboost_model.joblib` |
| Analysis notebook | `notebooks/Phase1_Model_Analysis.ipynb` |

---

## Running the Existing Project

### 1. Get the dataset

Download `creditcard.csv` from Kaggle and place it at `data/raw/creditcard.csv`.  
See [DATASET.md](DATASET.md) for full instructions.

### 2. Set up the Python environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Optional: quantum and dev extras
pip install -r requirements-plus.txt
```

### 3. Check dependencies

```bash
python scripts/test_imports.py
```

### 4. Run the classical ML pipeline

This retrains the model and saves artifacts to `data/processed/`:

```bash
python src/data_loader.py
python src/ml/data_preprocessor.py
python src/ml/classical_model.py
```

Skip this if you want to use the pre-trained model that is already in `data/processed/`.

### 5. Start the backend

```bash
# Windows (batch file)
run_backend.bat

# Or directly
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Start the frontend

```bash
cd frontend
npm install      # only needed first time
npm run dev
```

### 7. Access

| URL | What |
|-----|------|
| http://localhost:5173 | React dashboard |
| http://localhost:8000 | FastAPI backend |
| http://localhost:8000/docs | Swagger UI (interactive API docs) |
| http://localhost:8000/health | Backend health check |

---

### Run the analysis notebook

```bash
pip install jupyter  # if not already installed
jupyter notebook notebooks/Phase1_Model_Analysis.ipynb
# Then: Cell → Run All
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | Run `python scripts/test_imports.py` to check which packages are missing |
| Backend port 8000 in use | Change `API_PORT` in `.env` |
| Frontend port 5173 in use | Change `server.port` in `frontend/vite.config.js` |
| `Model not found` error | Check `CLASSICAL_MODEL_PATH` in `.env`, or run the ML pipeline to regenerate |
| CORS error in browser | Verify `VITE_API_URL` in `frontend/.env` matches the backend port |
| `data/raw/creditcard.csv not found` | Download the dataset (see [DATASET.md](DATASET.md)) |

---

## Where to Add Quantum Code (Phase 2)

| New code | Where to put it |
|----------|----------------|
| Quantum classifier implementations | `src/quantum/vqc.py`, `src/quantum/qsvm.py` |
| Feature encoding utilities | `src/quantum/encoding.py` |
| Benchmark runner | `src/quantum/benchmark.py` |
| Experiment notebooks | `phase2/notebooks/` |
| Saved quantum model params | `phase2/models/` |
| Results and plots | `phase2/results/` |

**The quantum dataset is already prepared.** You can load it directly:

```python
import numpy as np

X_train = np.load("data/processed/X_train_quantum.npy")  # (227845, 8)
X_test  = np.load("data/processed/X_test_quantum.npy")   # (56962, 8)
y_train = np.load("data/processed/y_train_quantum.npy")
y_test  = np.load("data/processed/y_test_quantum.npy")
features = np.load("data/processed/quantum_features.npy") # feature names
```

For quantum training, start with a **small subset** (1,000–5,000 samples) — quantum simulation is slow:

```python
from sklearn.utils import resample
X_small, y_small = resample(X_train, y_train, n_samples=2000, 
                              stratify=y_train, random_state=42)
```

See [QUANTUM_PLAN.md](QUANTUM_PLAN.md) for the full step-by-step quantum implementation guide.
