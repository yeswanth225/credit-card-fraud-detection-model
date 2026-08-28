# Phase 2 Implementation Report

**Date:** 2026-08-27  
**Status:** Starting Implementation  
**Objective:** Complete Phase 2 Quantum ML Baseline & Suitability Experiments

---

## 1. EXISTING INFRASTRUCTURE ASSESSMENT

### 1.1 Repository Structure ✅
- `phase2/quantum/` — Core QML modules (8 files)
- `phase2/experiments/` — Experiment scripts (4 files)
- `phase2/results/` — Empty (ready for outputs)
- `data/processed/` — Phase 1 outputs (8 .npy files, 1 .joblib model)

### 1.2 Data Assets Available ✅
**Source:** Phase 1 quantum-ready dataset
- `X_train_quantum.npy` (227,845 × 8): Pre-scaled fraud features
- `X_test_quantum.npy` (56,962 × 8): Test features
- `y_train_quantum.npy` (227,845): Training labels
- `y_test_quantum.npy` (56,962): Test labels
- `quantum_features.npy`: Feature names [V14, V4, V12, V8, V13, V20, V27, V18]
- `xgboost_model.joblib`: Phase 1 classical baseline

**Data Properties:**
- Full dataset: 227,845 training samples (394 fraud, 0.17% rate)
- 8 features: Top-8 by XGBoost feature importance
- Current range: [-70.7, 78.1] (pre-scaled with StandardScaler in Phase 1)
- Will be re-scaled to [-π, π] for quantum angle encoding

### 1.3 Quantum Modules Implemented ✅

| Module | Status | Purpose |
|--------|--------|---------|
| `config.py` | Complete | Central configuration, QuantumConfig dataclass |
| `data_preparation.py` | Complete | Load Phase 1 data, subsample, re-scale to [-π, π] |
| `feature_encoding.py` | Complete | Angle encoding, ZZ feature map, Pauli maps |
| `quantum_kernel.py` | Complete | FidelityQuantumKernel builder |
| `circuits.py` | Complete | Circuit resource analysis (depth, gate count) |
| `evaluation.py` | Complete | Fraud-aware metrics (PR-AUC, Recall, Precision, F1, ROC-AUC, FPR) |
| `qsvc_model.py` | Complete | QSVC trainer and evaluator |
| `vqc_model.py` | Complete | VQC trainer and evaluator |

### 1.4 Experiment Scripts

| Script | Status | Purpose |
|--------|--------|---------|
| `toy_qml_experiment.py` | Exists, **has Unicode bug** | End-to-end pipeline demo (4 samples) |
| `quantum_kernel_experiment.py` | Complete | QSVC runner with CLI args |
| `vqc_experiment.py` | Complete | VQC runner with CLI args |

### 1.5 Missing/Incomplete Components ❌

1. **Fixed toy experiment** — Unicode encoding issue in print statements
2. **Feature-count experiments** — Need runners for 2, 4, 6, 8 qubits
3. **Feature-map comparison** — Angle encoding vs ZZ feature map comparison
4. **Noise experiments** — Ideal vs noisy simulation comparison
5. **Model benchmark script** — Fair comparison (XGBoost vs QSVC vs VQC)
6. **Visualization suite** — PR-AUC plots, F1 vs qubits, model comparison
7. **Phase 2 README** — Comprehensive documentation with results
8. **Results collection scripts** — Helper to aggregate CSV/JSON outputs

### 1.6 Configuration (config.py) ✅

**Default settings:**
- `n_qubits`: 4 (top-4 features)
- `train_subset_size`: 800 (balanced 50/50)
- `test_subset_size`: 200 (stratified, real imbalance)
- `zz_reps`: 2 (for feature map depth)
- `vqc_reps`: 2 (for ansatz depth)
- `vqc_max_iter`: 100
- `random_seed`: 42 (reproducibility)
- `shots`: None (statevector, exact simulation)

**Pre-built configs:**
- `DEFAULT_CONFIG`: 4-qubit standard
- `CONFIG_8Q`: 8-qubit with reduced iterations

---

## 2. PHASE 1 BASELINE METRICS (For Comparison)

**Classical XGBoost (Phase 1):**
- Dataset: 227,845 training samples (all 30 features), 56,962 test
- PR-AUC: **0.8716** (primary metric)
- ROC-AUC: 0.9692
- F1 Score: 0.8723
- Precision: 0.9111
- Recall: 0.8367
- Threshold: 0.70 (tuned)

**Important:** Quantum experiments will use **much smaller subsets** (800 train, 200 test) and **fewer features** (2, 4, 6, or 8). Direct comparison not expected to be equal-footing.

---

## 3. IMPLEMENTATION PLAN

### Phase 2A: Fix & Validate Pipeline
- [ ] Fix Unicode encoding in toy_qml_experiment.py
- [ ] Run toy experiment → verify 100% accuracy on 4-point dataset
- [ ] Confirm Qiskit APIs working (FidelityQuantumKernel, QSVC, VQC)

### Phase 2B: Feature-Count Experiments
- [ ] Create `feature_count_experiment.py` runner
- [ ] Test configurations: 2, 4, 6, 8 qubits
- [ ] For each: record metrics + circuit resources
- [ ] Save to `results/feature_count_results.csv`

### Phase 2C: Feature-Map Comparison
- [ ] Create `feature_map_experiment.py` runner
- [ ] Compare: Angle encoding vs ZZ feature map
- [ ] Keep dataset/features/config constant except feature map
- [ ] Save to `results/feature_map_results.csv`

### Phase 2D: Run Core Experiments
- [ ] Run QSVC (4-qubit baseline) → `quantum_kernel_results.json`
- [ ] Run VQC (4-qubit baseline) → `vqc_results.json`

### Phase 2E: Noise Experiment
- [ ] Create `noise_experiment.py`
- [ ] Compare: Ideal simulator vs Aer noisy simulator
- [ ] Use best-performing 4-qubit QSVC config
- [ ] Save to `results/noise_results.csv`

### Phase 2F: Benchmark & Comparison
- [ ] Create `benchmark.py`
- [ ] Load: XGBoost (Phase 1), QSVC (4Q), VQC (4Q)
- [ ] Create comparison table (Model | Samples | Features | Precision | Recall | F1 | PR-AUC | ROC-AUC | Runtime)
- [ ] Save to `results/model_comparison.csv`

### Phase 2G: Visualizations
- [ ] PR-AUC vs feature count
- [ ] F1 vs feature count
- [ ] Feature map comparison
- [ ] Ideal vs noisy performance
- [ ] Model comparison bar chart
- [ ] Save plots to `results/plots/`

### Phase 2H: Documentation
- [ ] Create `phase2/README.md`
- [ ] Document: objectives, methods, results, limitations
- [ ] Conclusions (based on actual data, not fabricated)

---

## 4. BUILD SEQUENCE

1. **Fix toy experiment** (Unicode issue)
2. **Create feature-count runner**
3. **Create feature-map comparison runner**
4. **Create noise experiment runner**
5. **Create benchmark/comparison script**
6. **Create visualization utilities**
7. **Run all experiments** (may take 30+ minutes)
8. **Generate Phase 2 README** with results
9. **Final verification** — all results files exist and are valid

---

## 5. EXPECTED RUNTIME

- Toy experiment: <10 seconds
- QSVC (4Q, 800 train): 5-10 minutes
- QSVC (8Q, 400 train): 10-20 minutes
- VQC (4Q, 800 train, 100 iter): 15-30 minutes
- VQC (8Q, 400 train, 50 iter): 20-40 minutes
- Noise experiment: 10-15 minutes
- Total estimated: 60-120 minutes (1-2 hours)

---

## 6. QUALITY CHECKS

✅ Phase 0/1 functionality preserved (no modifications to src/ml/classical_model.py)
✅ All results saved as machine-readable formats (JSON, CSV)
✅ Random seeds fixed for reproducibility
✅ No quantum advantage claimed (honest reporting of results)
✅ Metrics appropriate for imbalanced fraud detection
✅ Circuit resources tracked
✅ Data leakage prevented (scaler fit on train only)

---

## 7. SUCCESS CRITERIA

- [ ] Toy experiment runs without errors
- [ ] 4-qubit QSVC produces metrics within expected range
- [ ] 4-qubit VQC produces metrics within expected range
- [ ] Feature-count experiments show trend (or lack thereof)
- [ ] Feature-map comparison documented
- [ ] Noise impact quantified
- [ ] Benchmark table generated
- [ ] All results plotted
- [ ] Phase 2 README complete with honest conclusions
- [ ] No fabricated data

