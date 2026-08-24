# Quantum Fraud Detection - Project Architecture

## Overview
Production-ready fraud detection system with classical ML (XGBoost) backend and modern React v0 frontend.

---

## 📁 Project Structure

```
quantum/
├── 📂 frontend/                          # V0 React Frontend (PRODUCTION)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx            # Main transaction list
│   │   │   ├── TransactionDetail.tsx    # Single transaction + SHAP
│   │   │   ├── Metrics.tsx              # Model performance dashboard
│   │   │   └── Login.tsx                # Role-based auth
│   │   ├── components/
│   │   │   ├── Layout.tsx               # Main layout wrapper
│   │   │   ├── TransactionTable.tsx     # Data table component
│   │   │   ├── SortableTable.tsx        # Sortable table logic
│   │   │   └── StatusBadge.tsx          # Status indicator
│   │   ├── api/
│   │   │   └── transactions.ts          # (Mock - not used, API at backend)
│   │   ├── constants/
│   │   │   └── design.ts                # Design tokens + API config
│   │   ├── utils/
│   │   │   └── cn.ts                    # Class name utility
│   │   ├── App.tsx                      # Root component + routing
│   │   └── main.jsx                     # Entry point
│   ├── index.html                       # HTML template
│   ├── package.json                     # Dependencies
│   ├── vite.config.js                   # Vite configuration
│   ├── tailwind.config.js               # Tailwind configuration
│   ├── .env                             # VITE_API_URL=http://localhost:8000
│   ├── .gitignore
│   ├── README.md
│   └── dist/                            # Build output (production)
│
├── 📂 src/                              # Backend Python Code
│   ├── api/
│   │   ├── main.py                      # FastAPI app entry point
│   │   ├── analyst.py                   # Analyst endpoints (transactions, metrics)
│   │   ├── verification.py              # Prediction endpoints
│   │   ├── admin.py                     # Admin endpoints
│   │   └── __init__.py
│   ├── ml/
│   │   ├── classical_model.py           # XGBoost classifier
│   │   ├── data_preprocessor.py         # Feature scaling, SMOTE
│   │   └── __init__.py
│   ├── database/
│   │   ├── connection.py                # DB initialization
│   │   ├── models.py                    # SQLAlchemy models
│   │   └── __init__.py
│   ├── models/                          # (Reserved for saved models)
│   ├── quantum/                         # (Reserved for quantum code)
│   ├── data_loader.py                   # Data loading utilities
│   └── __init__.py
│
├── 📂 data/                             # Model Artifacts & Data
│   ├── raw/
│   │   └── creditcard.csv               # (To be added - Kaggle dataset)
│   └── processed/
│       ├── xgboost_model.joblib         # Trained XGBoost model (109 KB)
│       ├── scaler.joblib                # StandardScaler artifact (1.3 KB)
│       ├── classical_model.joblib       # Alternative model save
│       ├── phase1_results.json          # Performance metrics
│       ├── test.parquet                 # Test dataset
│       ├── train.parquet                # Training dataset
│       ├── X_test_quantum.npy           # Quantum test features (8 dims)
│       ├── y_test_quantum.npy           # Quantum test labels
│       ├── X_train_quantum.npy          # Quantum train features
│       ├── y_train_quantum.npy          # Quantum train labels
│       └── *.png                        # Visualizations
│
├── 📂 phase1/                           # Phase 1 Results (COMPLETE)
│   ├── data/
│   │   ├── xgboost_model.joblib         # Best model
│   │   ├── scaler.joblib
│   │   ├── phase1_results.json
│   │   ├── X_train_quantum.npy
│   │   ├── X_test_quantum.npy
│   │   ├── y_train_quantum.npy
│   │   ├── y_test_quantum.npy
│   │   ├── quantum_features.npy
│   │   └── *.png (visualizations)
│   ├── notebooks/
│   │   ├── Phase1_Model_Analysis.ipynb  # Main notebook
│   │   └── Phase1_Output.ipynb          # Executed output
│   ├── scripts/
│   │   ├── Phase1_Complete.py
│   │   ├── Phase1_Complete_Robust.py
│   │   ├── phase1_analysis.py
│   │   └── run_phase1.py
│   └── PHASE1_FINAL_SUMMARY.txt
│
├── 📂 phase2/                           # Phase 2 (UPCOMING - Quantum)
│   ├── models/
│   ├── notebooks/
│   ├── results/
│   └── scripts/
│
├── 📂 notebooks/                        # (Original - migrated to phase1/)
│   └── Phase1_Model_Analysis.ipynb
│
├── 📂 scripts/                          # Utility scripts
│   └── (individual scripts)
│
├── 📂 tests/                            # Test suite
│   └── (test files)
│
├── 📂 venv/                             # Python virtual environment
│
├── .env                                 # Environment variables (backend)
├── .gitignore
├── pyproject.toml                       # Python project config
├── requirements.txt                     # Python dependencies
├── requirements-plus.txt                # Extended dependencies
├── run_backend.bat                      # Windows backend launcher
│
├── .claude/
│   ├── launch.json                      # Dev server configuration
│   ├── settings.json                    # Claude Code settings
│   └── settings.local.json
│
├── .git/                                # Git repository
│
├── README.md                            # Project overview
├── FRONTEND_INTEGRATION_COMPLETE.md     # Integration summary
├── PROJECT_ARCHITECTURE.md              # This file
│
└── INDEX.md, PHASE1_FINAL_SUMMARY.txt, etc.  # Documentation
```

---

## 🚀 Key Components

### Frontend (React v0)
- **Location**: `frontend/`
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State**: React hooks + Context
- **Routing**: React Router v7
- **Charts**: Plotly.js
- **Icons**: Phosphor Icons
- **Status**: ✅ Production-ready, v0 design applied
- **API**: Connects to `http://localhost:8000`

### Backend (Python/FastAPI)
- **Location**: `src/api/`
- **Framework**: FastAPI
- **Server**: Uvicorn
- **CORS**: Enabled for localhost:5173
- **Endpoints**: 
  - `/api/analyst/transactions` - Get transaction list with predictions
  - `/api/analyst/transactions/{id}` - Get transaction detail with SHAP
  - `/api/analyst/metrics` - Get model performance metrics
  - `/api/verification/*` - Prediction endpoints
  - `/api/admin/*` - Admin endpoints

### ML Model (XGBoost)
- **Location**: `data/processed/xgboost_model.joblib`
- **Type**: XGBoost Binary Classifier
- **Training Data**: 284,807 credit card transactions (Kaggle)
- **Features**: 28 PCA-transformed + Time + Amount
- **Performance**:
  - Recall: 80.61% (catches fraud)
  - Precision: 90.80% (low false positives)
  - F1: 0.8541
  - PR-AUC: 0.8557
  - ROC-AUC: 0.9695
- **Threshold**: 0.7 (optimized on validation set)
- **Explainability**: SHAP values per prediction

### Preprocessing Pipeline
- **StandardScaler**: `data/processed/scaler.joblib`
- **SMOTE**: Oversampling for class imbalance
- **Feature Scaling**: Z-score normalization
- **Data Leakage**: Eliminated (scaler fit on training only)

---

## 🔄 API Integration

### Frontend → Backend Flow

```
Dashboard.tsx
  ↓
fetch(`${API.baseURL}/api/analyst/transactions?limit=50`)
  ↓
FastAPI: analyst.py → list_transactions()
  ↓
Load model + scaler from cache
  ↓
Transform data with scaler
  ↓
XGBoost prediction
  ↓
Return transaction list with fraud_score + status
  ↓
Frontend renders TransactionTable with predictions
```

### Transaction Detail Flow

```
TransactionDetail.tsx (params: id)
  ↓
fetch(`${API.baseURL}/api/analyst/transactions/{id}`)
  ↓
FastAPI: analyst.py → get_transaction()
  ↓
Load test data + model + scaler
  ↓
Extract transaction features
  ↓
Scale features
  ↓
XGBoost predict + probability
  ↓
SHAP TreeExplainer: compute feature contributions
  ↓
Return model_verdict + fraud_probability + shap_values
  ↓
Frontend renders verdict card + SHAP chart
```

### Metrics Flow

```
Metrics.tsx
  ↓
fetch(`${API.baseURL}/api/analyst/metrics`)
  ↓
FastAPI: analyst.py → get_metrics()
  ↓
Load test data + predictions
  ↓
sklearn: confusion_matrix, roc_curve, precision_recall_curve
  ↓
Return metrics + curves
  ↓
Frontend renders with Plotly charts
```

---

## 🛠️ How to Run

### 1. Backend Setup
```bash
cd D:\quantum
python -m venv venv              # Create virtual env (if needed)
venv\Scripts\activate            # Activate (Windows)
pip install -r requirements.txt  # Install dependencies
```

### 2. Start Backend
```bash
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```
Or use the batch file:
```bash
run_backend.bat
```

### 3. Start Frontend
```bash
cd frontend
npm install                       # Install deps (if needed)
npm run dev                       # Start dev server
```

### 4. Access
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs` (Swagger)
- Healthcheck: `http://localhost:8000/health`

---

## 🔑 Environment Variables

### Backend (.env)
```env
DATABASE_URL=sqlite:///./data/fraud_detection.db
API_HOST=0.0.0.0
API_PORT=8000
CLASSICAL_MODEL_PATH=data/processed/classical_model.joblib
QUANTUM_MODEL_PATH=data/processed/quantum_model.joblib
PREDICTION_THRESHOLD=0.5
QUANTUM_HARDWARE_AVAILABLE=false
QUANTUM_PROVIDER=qiskit
QUANTUM_BACKEND=statevector_simulator
RAW_DATA_PATH=data/raw/creditcard.csv
PROCESSED_DATA_PATH=data/processed
RANDOM_STATE=42
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

---

## 📊 Data Pipeline

1. **Input**: Raw credit card transactions (CSV)
2. **Preprocessing**: 
   - Feature scaling (StandardScaler)
   - Class imbalance handling (SMOTE)
   - Train/val/test split (60/20/20)
3. **Model Training**: XGBoost with hyperparameter tuning
4. **Validation**: Early stopping on validation set
5. **Testing**: Final metrics on untouched test set
6. **Deployment**: Model serialized with joblib
7. **Inference**: Load from disk → Transform → Predict → SHAP

---

## 🎯 Features

### Frontend
✅ Transaction list with real fraud predictions
✅ Transaction detail with SHAP explanations
✅ Model performance metrics dashboard
✅ ROC and PR curves visualization
✅ Feature importance charts
✅ Dark/light theme toggle
✅ Responsive mobile design
✅ Role-based access (analyst/admin)
✅ Keyboard navigation
✅ Accessibility compliance (WCAG)

### Backend
✅ RESTful API with FastAPI
✅ CORS enabled for frontend
✅ SHAP explanations per prediction
✅ Model caching for performance
✅ Metrics computation on-demand
✅ Error handling + logging
✅ Swagger/OpenAPI documentation
✅ Health check endpoint

### ML
✅ XGBoost classical model
✅ SHAP interpretability
✅ Feature importance ranking
✅ Confusion matrix analysis
✅ ROC-AUC metrics
✅ PR-AUC metrics
✅ Cross-validation
✅ Data leakage prevention

---

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| Test Accuracy | 99.97% |
| Recall (Fraud Detection) | 80.61% |
| Precision (Low False Positives) | 90.80% |
| F1 Score | 0.8541 |
| PR-AUC (Primary) | 0.8557 |
| ROC-AUC | 0.9695 |
| True Positives | 82 |
| True Negatives | 56,856 |
| False Positives | 8 |
| False Negatives | 16 |

---

## 🔮 Phase 2: Quantum (UPCOMING)

Quantum models to be trained on 8 selected features:
- VQC (Variational Quantum Classifier)
- QSVM (Quantum Support Vector Machine)
- Benchmark against classical baseline (F1: 0.8541)

---

## 📁 File Organization Best Practices

### ✅ Do
- Keep v0 frontend as-is in `frontend/`
- Use `src/api/` for backend endpoints
- Keep models in `data/processed/`
- Use `.env` for configuration
- Commit code, not data artifacts
- Separate concerns: API / ML / DB

### ❌ Don't
- Don't modify v0 UI design
- Don't move model files
- Don't duplicate frontend directories
- Don't hardcode paths
- Don't store data in git
- Don't mix frontend/backend logic

---

## 🚦 Status Indicators

- ✅ Phase 1 (Classical): **COMPLETE**
- 🚀 Phase 2 (Quantum): **UPCOMING**
- 🎨 Frontend Integration: **COMPLETE**
- 🔌 API Integration: **COMPLETE**
- 📊 Model Performance: **OPTIMIZED**
- 🎯 Production Readiness: **YES**

---

## 📞 Support

### Running Locally
1. Ensure Python 3.10+ is installed
2. Ensure Node.js 18+ is installed
3. Create/activate venv
4. Install dependencies
5. Set environment variables
6. Start backend then frontend
7. Open http://localhost:5173

### Troubleshooting
- **Port 8000 in use**: Change API_PORT in .env
- **Port 5173 in use**: Change in frontend vite.config.js
- **Model not found**: Check CLASSICAL_MODEL_PATH in .env
- **CORS error**: Verify API_URL in frontend .env
- **API not responding**: Check backend is running with `curl http://localhost:8000/health`

---

**Last Updated**: 2026-08-24
**Version**: 1.0.0
**Status**: Production Ready ✅
