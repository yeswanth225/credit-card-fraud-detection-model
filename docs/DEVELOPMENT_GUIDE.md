# Development Guide

> Complete setup, workflow, and contribution guide for the Credit Card Fraud Detection project.

---

## Prerequisites

| Tool | Version | Purpose |
|:---|:---|:---|
| Python | 3.10+ | ML backend, QML experiments |
| Node.js | 18+ | Frontend dev server and bundling |
| Git | Any | Version control |
| pip | Latest | Python packages |
| npm | 9+ | JS packages |

---

## Initial Setup

### 1. Clone the repository

```bash
git clone https://github.com/yeswanth225/credit-card-fraud-detection-model
cd credit-card-fraud-detection-model
```

### 2. Python environment

```bash
# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install core dependencies
pip install -r requirements.txt

# Install quantum dependencies (Phase 2 only)
pip install -r phase2/requirements_quantum.txt
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

### 4. Environment variables

Copy and edit the `.env` file:
```bash
cp .env.example .env
# Edit DATA_DIR, MODEL_DIR, API settings as needed
```

### 5. Download dataset

```bash
# Using Kaggle CLI (recommended):
pip install kaggle
# Set up kaggle.json API credentials first (see kaggle.com/docs/api)
python scripts/download_data.py

# Or manually: download from https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
# Place creditcard.csv in data/raw/
```

---

## Running the Project

### Frontend Dashboard (No backend needed)

```bash
cd frontend
npm run dev
# Opens at http://localhost:3000
```

The dashboard works fully in demo mode using seeded data from `js/seed-data.js`. No Python backend is required.

### Backend API (Optional)

```bash
# From repo root (with venv active):
uvicorn src.api.main:app --reload --port 8000
# API docs at http://localhost:8000/docs

# Windows shortcut:
run_backend.bat
```

### Phase 1 — Classical ML Training

```bash
# Train XGBoost (requires creditcard.csv in data/raw/):
python phase1/scripts/train_model.py

# Evaluate models:
python phase1/scripts/evaluate.py

# Run Jupyter notebooks:
jupyter lab phase1/notebooks/
```

### Phase 2 — Quantum ML

```bash
# Quick test (synthetic data, fast):
python -m phase2.experiments.toy_qml_experiment

# Real dataset quantum kernel:
python -m phase2.experiments.quantum_kernel_experiment

# VQC training:
python -m phase2.experiments.vqc_experiment

# Run all experiments sequentially:
python -m phase2.experiments.run_all

# Visualize results:
python -m phase2.experiments.visualize
```

---

## Project Structure Explained

```
credit-card-fraud-detection-model/
│
├── frontend/        ← Browser SPA — the user-facing dashboard
├── src/             ← Python backend source (API, ML, data)
├── phase1/          ← Classical ML work and results
├── phase2/          ← Quantum ML work and experiments
├── data/            ← Raw + processed dataset files (gitignored raw)
├── docs/            ← Project documentation (this folder)
├── notebooks/       ← Shared Jupyter notebooks
├── scripts/         ← Utility scripts (download, install, test)
└── tests/           ← Automated test suite
```

---

## Key Files Reference

| File | Purpose |
|:---|:---|
| `frontend/js/store.js` | All localStorage state (users, batches, alerts) |
| `frontend/js/ml.js` | JS fraud scoring engine |
| `frontend/js/seed-data.js` | 55 real dataset transaction samples |
| `frontend/js/screens/dashboard.js` | Main dashboard logic |
| `frontend/css/tokens.css` | All design tokens |
| `src/data_loader.py` | Dataset loading utilities |
| `phase2/quantum/config.py` | QML configuration (qubits, backend, shots) |
| `phase2/quantum/quantum_kernel.py` | Kernel matrix computation |
| `phase2/experiments/run_all.py` | Run all Phase 2 experiments |

---

## Development Workflow

### Frontend Changes

1. Edit files in `frontend/js/` or `frontend/css/`
2. Vite hot-reloads automatically at `http://localhost:3000`
3. Run syntax check: `node -c frontend/js/<file>.js`
4. Build: `cd frontend && npm run build`

### Python/ML Changes

1. Edit files in `src/` or `phase2/`
2. Run tests: `pytest tests/ -v`
3. Lint: `flake8 src/ phase2/`
4. Format: `black src/ phase2/`

### Adding a New Experiment (Phase 2)

1. Create `phase2/experiments/my_experiment.py`
2. Implement the standard experiment interface:
   ```python
   def run_experiment():
       """Returns dict with 'accuracy', 'auc_roc', 'results'"""
       ...
   
   if __name__ == '__main__':
       results = run_experiment()
       print(results)
   ```
3. Add to `phase2/experiments/run_all.py`
4. Document in `phase2/README.md`

### Adding a New Frontend Screen

1. Create `frontend/js/screens/my-screen.js`
2. Export `renderMyScreen(ctx)` function
3. Import and register route in `frontend/js/app.js`
4. Add nav link in `sidebarHTML()` if needed
5. Add screen-specific styles to `frontend/css/screens.css`

---

## Testing

### Frontend (manual)

```bash
cd frontend && npm run dev
# Open browser, test all screens
```

### Python tests

```bash
# All tests:
pytest tests/ -v

# Specific module:
pytest tests/test_ml.py -v

# With coverage:
pytest tests/ --cov=src --cov-report=html
```

### Syntax checks

```bash
# JS:
node -c frontend/js/store.js
node -c frontend/js/screens/dashboard.js

# Python:
python -m py_compile phase2/experiments/quantum_kernel_experiment.py
```

---

## Code Style

### JavaScript
- ES Modules (no CommonJS)
- `const`/`let` only (no `var`)
- Template literals for HTML strings
- 2-space indent
- Descriptive function names: `renderDashboard`, `mountShell`, `computeStats`

### Python
- PEP 8 compliant (use `black` formatter)
- Type hints on all public functions
- Docstrings on all modules and classes
- 4-space indent

### CSS
- All colors via CSS custom properties (`var(--c-*)`)
- All spacing via spacing tokens (`var(--sp-*)`)
- BEM-like class naming for components
- No inline styles in HTML (exceptions: dynamic JS-generated content)

---

## Git Workflow

```bash
# Feature branch
git checkout -b feat/my-feature

# Commit with conventional commit messages:
git commit -m "feat: add quantum noise experiment"
git commit -m "fix: deduplicate batch notifications in store.js"
git commit -m "docs: update phase2 README with VQC results"
git commit -m "style: separate score and risk columns in dashboard table"

# Push and open PR:
git push origin feat/my-feature
```

### Commit Message Format

```
<type>: <short description>

Types:
  feat     → New feature
  fix      → Bug fix
  docs     → Documentation only
  style    → CSS/formatting (no logic change)
  refactor → Code restructure (no feature/fix)
  test     → Add/fix tests
  chore    → Build, deps, config changes
```

---

## Troubleshooting

### Frontend: "Cannot find module" error
```bash
cd frontend && npm install
```

### Frontend: Vite build fails
```bash
# Check vite.config.js is plain JS (not TypeScript):
cat frontend/vite.config.js
# Should start with: export default { ... }
```

### Frontend: Data shows duplicated batches
- Open browser DevTools → Application → localStorage
- Delete `cred_batches` and `cred_notifications` keys
- Refresh the page — seed data will auto-reload clean

### Python: "pennylane not found"
```bash
pip install -r phase2/requirements_quantum.txt
```

### Python: Quantum experiment hangs
- Reduce `N_TRAIN_SAMPLES` in `phase2/quantum/config.py` to `20` for faster local runs
- The kernel matrix computation is O(n²) — 50 samples = 2500 kernel evaluations

### Dataset not found
```bash
# Download the dataset:
python scripts/download_data.py
# Or place creditcard.csv manually in data/raw/
```

---

*Part of the Credit Card Fraud Detection System — see root [README.md](../README.md)*
