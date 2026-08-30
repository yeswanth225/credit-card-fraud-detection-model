# Phase 2 — Quantum Machine Learning for Fraud Detection
## Final Completion Report

**Date:** August 29, 2026  
**Status:** ✓ COMPLETE  
**Results Location:** `phase2/results/`

---

## Executive Summary

Phase 2 implements and validates quantum machine learning experiments for credit card fraud detection, comparing three models:

1. **QSVC** — Quantum kernel SVM using ZZFeatureMap + FidelityQuantumKernel
2. **VQC** — Variational Quantum Classifier using ZZFeatureMap + RealAmplitudes
3. **XGBoost** — Classical baseline (Phase 1 results, loaded from file)

> **Backend:** All quantum models run on **local Qiskit Statevector simulation** (ideal, noiseless).  
> **IBM Quantum hardware is NOT integrated.** This is a CPU-local proof-of-concept.

---

## Phase 2 Architecture

```
phase2/
├── quantum/
│   ├── config.py            Central configuration (QuantumConfig dataclass)
│   ├── data_preparation.py  Subset sampling + MinMaxScaler (fit on train only)
│   ├── feature_encoding.py  ZZFeatureMap and angle-encoding circuit builders
│   ├── quantum_kernel.py    FidelityQuantumKernel (ComputeUncompute fidelity)
│   ├── circuits.py          Circuit resource utilities
│   ├── qsvc_model.py        QSVC experiment class + runner
│   ├── vqc_model.py         VQC experiment class + runner
│   └── evaluation.py        Fraud-aware metrics (PR-AUC, ROC-AUC, F1, …)
├── experiments/
│   ├── toy_qml_experiment.py      Educational sanity check (runs in <10 s)
│   ├── phase2_benchmark.py        Full QSVC vs VQC vs XGBoost benchmark
│   ├── quantum_kernel_experiment.py
│   ├── feature_count_experiment.py
│   ├── feature_map_experiment.py
│   ├── noise_experiment.py
│   └── vqc_experiment.py
└── results/
    ├── phase2_benchmark_final.json   PRIMARY result file
    ├── quantum_kernel_results.json   QSVC individual results
    ├── vqc_results.json              VQC individual results
    └── model_comparison.csv          CSV summary
```

---

## Model Details

### QSVC (Quantum Support Vector Classifier)
- **Circuit:** ZZFeatureMap (n_qubits=4, reps=2)
- **Kernel:** FidelityQuantumKernel — K(x,z) = |⟨φ(x)|φ(z)⟩|²
- **Classifier:** sklearn SVC with precomputed quantum kernel
- **Backend:** Qiskit StatevectorSampler (local, ideal simulation)
- **IBM Quantum:** NOT used

### VQC (Variational Quantum Classifier)
- **Feature map:** ZZFeatureMap (n_qubits=4, reps=2)
- **Ansatz:** RealAmplitudes (reps=2, entanglement="linear"), 12 trainable parameters
- **Optimizer:** COBYLA (gradient-free, max_iter=20)
- **Backend:** Qiskit StatevectorSampler (local, ideal simulation)
- **IBM Quantum:** NOT used

### XGBoost (Classical Baseline)
- **Source:** Phase 1 results loaded from `data/processed/phase1_results.json`
- **NOT re-trained in Phase 2** — Phase 1 metrics are reported as-is
- **Training data:** 227,845 samples, all 30 features
- **Test data:** 56,962 samples (real imbalance 0.172%)
- **Imbalance handling:** scale_pos_weight=577.29 (class weighting)
- **Threshold:** Optimised to 0.70 for maximum F1

---

## Dataset Strategy

### Why a small subset?
The quantum kernel matrix has size N×N where each cell requires one circuit evaluation.
- N=100 → 10,000 evaluations (~1-82 minutes on CPU)
- N=800 → 640,000 evaluations (~11 hours on CPU)
- N=56,962 → computationally impossible on a local CPU

### Data preparation (no leakage)
1. Load Phase 1 quantum-ready dataset (`X_train_quantum.npy`, `X_test_quantum.npy`)
2. Select 4 features by index: `[0,1,2,3]` → V14, V4, V12, V8
3. Sub-sample training: **100 samples, 50/50 balanced** (50 fraud, 50 legit)
4. Sub-sample test: **25 samples, stratified** at real 0.17% → expect ~0–1 fraud cases
5. Apply `MinMaxScaler(feature_range=(-π, π))` — **fitted on training subset only**
6. Test subset transformed using the same fitted scaler

> ⚠️ **Reliability Warning:** With only ~1 fraud case in the 25-sample test set,
> per-class metrics (precision, recall, F1) have very limited statistical reliability.
> These numbers demonstrate that the quantum pipeline works, not that it generalises.

---

## Phase 2 Results

Results are freshly generated each run and written to:
- `phase2/results/phase2_benchmark_final.json` ← PRIMARY
- `phase2/results/quantum_kernel_results.json`
- `phase2/results/vqc_results.json`
- `phase2/results/model_comparison.csv`

XGBoost metrics are loaded from `data/processed/phase1_results.json` at runtime.
No XGBoost metrics are hard-coded in the benchmark script.

### Summary (last run — August 29, 2026)

| Metric | QSVC | VQC | XGBoost |
|--------|------|-----|---------|
| Training samples | 100 | 100 | 227,845 |
| Test samples | 25 | 25 | 56,962 |
| Features | 4 | 4 | 30 |
| Training time | ~82 min | ~8 s | Not available |
| Inference time | ~15 s | ~0.17 s | Not available |
| ROC-AUC | 0.0833 | 0.9167 | 0.9692 |
| PR-AUC | 0.0435 | 0.3333 | 0.8716 |
| F1 Score | 0.0 | 0.1667 | 0.8723 |
| Recall | 0.0 | 1.0 | 0.8367 |
| Precision | 0.0 | 0.0909 | 0.9111 |

> ⚠️ **Comparison caveat:** XGBoost uses 2,279× more training data and 7.5× more features.
> This is NOT a fair performance comparison. It demonstrates quantum feasibility on a small dataset
> against a well-tuned classical baseline on the full dataset.

---

## How to Run

```bash
# 1. Educational sanity check (< 10 seconds)
python -m phase2.experiments.toy_qml_experiment

# 2. QSVC only (< 90 minutes for 100 training samples)
python -c "from phase2.quantum.qsvc_model import run_qsvc_experiment; run_qsvc_experiment()"

# 3. VQC only (< 60 seconds for 100 training samples)
python -c "from phase2.quantum.vqc_model import run_vqc_experiment; run_vqc_experiment()"

# 4. Full benchmark (both quantum + XGBoost baseline from file)
python -m phase2.experiments.phase2_benchmark

# 5. XGBoost baseline only (instant, loads from JSON)
python -m phase2.experiments.phase2_benchmark --skip-quantum
```

---

## Bug Fixes (Applied During Phase 2)

| Issue | Fix |
|-------|-----|
| VQC callback incompatibility with COBYLA in Qiskit 2.5 | Removed `callback` parameter from `VQC.fit()` |
| Windows console can't encode π character | Replaced π with "pi" in all print statements |
| Hard-coded XGBoost metrics in benchmark | Replaced with `load_xgboost_baseline()` reading `phase1_results.json` |
| Lost QSVC/VQC timing in benchmark | Benchmark now uses `QSVCExperiment`/`VQCExperiment` directly to capture timing |
| Wrong data_strategy docs (said 800/200, used 100/25) | Fixed to reflect actual subset sizes |

---

## Known Limitations

1. **Test set too small** — ~1 fraud case in 25 samples makes recall/precision/F1 unreliable
2. **QSVC is slow** — 100-sample kernel matrix takes ~82 minutes (O(N²) scaling)
3. **No IBM Quantum** — results are noiseless statevector simulation, not real hardware
4. **Different comparison conditions** — XGBoost uses full dataset; quantum models use tiny subset
5. **VQC convergence** — max_iter=20 is conservative; longer training may improve metrics

---

## Phase 3 Recommendations

1. Use synthetic fraud data or larger balanced test sets for reliable quantum metrics
2. Try kernel caching or Nyström approximation to reduce QSVC compute time
3. Integrate IBM Quantum hardware for realistic noise assessment
4. Implement error mitigation (ZNE, readout correction) for hardware runs
5. Try longer VQC training (max_iter=100+) and SPSA optimizer

---

*Phase 2 Completion Date: August 29, 2026 — BTech Credit Card Fraud Detection Project*
