# Phase 2 — Quantum Machine Learning for Fraud Detection (Real Dataset Upgrade)

> **Phase 2 Benchmark**: Comparative evaluation of **Classical XGBoost (30 Features)**, **Classical XGBoost (4 Features)**, **QSVC (4 Qubits)**, and **VQC (4 Qubits)** on the **real European Credit Card Fraud Detection dataset** (284,807 transactions) with zero data leakage.

---

## Executive Summary & Scientific Rigor

Phase 2 upgrades the quantum machine learning experiments from initial toy proofs-of-concept to a **scientifically valid real-world benchmark**:

1. **Genuine Dataset**: Uses the real European Credit Card Fraud Detection dataset (`data/raw/creditcard.csv`), containing 284,807 transactions with 492 fraud instances (~0.1727% prevalence).
2. **Phase 1 Splitting Methodology**: Stratified **60% Train / 20% Validation / 20% Test** split (`random_state=42`).
3. **Zero Test-Set Leakage**:
   - `StandardScaler` is fitted **strictly on the training split** and applied to validation and test sets.
   - Quantum angle-range `MinMaxScaler` is fitted **strictly on the training split**.
   - Top 4 features are derived **strictly from training data** using Phase 1 XGBoost feature importance.
4. **Honest Class Imbalance Handling**:
   - **Training Set**: Balanced 50/50 subsampling drawn exclusively from the training split so quantum circuits can learn fraud decision boundaries under simulation budgets.
   - **Test Set**: Subsampled strictly with stratified real-world prevalence (~0.17% fraud). The test set is **never balanced** for evaluation.
5. **Validation-Based Threshold Freezing**: Decision thresholds are tuned on the validation set only, then frozen and evaluated once on the unseen test set.
6. **No False Quantum Advantage Claims**: Classical XGBoost achieves superior PR-AUC on tabular financial data due to higher feature capacity (30 vs 4 features), mature handling of non-linear interactions, and large sample capacity. Current NISQ-era quantum simulators provide proof of feasibility and geometric insight rather than production supremacy.

---

## ⚠️ Hardware & Simulation Specifications

| Dimension | Specification |
|:---|:---|
| **Backend** | Local Qiskit `StatevectorSimulator` / `StatevectorSampler` (CPU, ideal/noiseless) |
| **Qubit Capacity** | 4 Qubits (1:1 mapping with top 4 classical features) |
| **IBM Quantum Hardware** | Not required (runs 100% locally on CPU without API tokens) |
| **Quantum Framework** | Qiskit 2.5 + `qiskit-machine-learning` 0.9 |
| **Primary Evaluation Metric** | **PR-AUC** (Precision-Recall Area Under Curve), standard for extreme class imbalance |

---

## Feature Selection & Quantum Encoding

### Why 4 Features?
Statevector simulation of quantum circuits scales exponentially ($2^n$ state amplitudes). On local simulation and near-term NISQ devices, 4 qubits provides a fast, reproducible baseline with shallow circuit depth and high gate fidelity.

### Selected Features
Derived from Phase 1 XGBoost Gini feature importance on training data (accounting for >72% of total tree splitting weight):
1. **`V14`** (Weight: 0.6001) — Dominant PCA component separating fraud
2. **`V4`**  (Weight: 0.0540) — Strongly correlated with anomalous transaction patterns
3. **`V12`** (Weight: 0.0411) — Negative correlation with fraudulent behavior
4. **`V8`**  (Weight: 0.0272) — Secondary interaction marker

Artifact saved at: `phase2/results/phase2_feature_selection.json`.

### Angle Encoding Pipeline
Classical features undergo standardisation and are then mapped into the $[-\pi, \pi]$ rotation space:
$$\vec{x} \in \mathbb{R}^4 \xrightarrow{\text{StandardScaler}} \vec{x}_{\text{std}} \xrightarrow{\text{MinMaxScaler}[-\pi, \pi]} \vec{\theta} \in [-\pi, \pi]^4$$

Each $\theta_i$ parameterises single-qubit rotations $R_Y(\theta_i)$ and two-qubit $R_{ZZ}(2(\pi-\theta_i)(\pi-\theta_j))$ entangling interactions in `ZZFeatureMap(reps=2)`.

---

## Evaluated Models & Architectural Comparison

| Model | Type | Features | Qubits | Encoding / Architecture |
|:---|:---|:---:|:---:|:---|
| **XGBoost (Phase 1 Baseline)** | Classical Ensemble | 30 | N/A | Full dataset (227k train), gradient boosted trees |
| **XGBoost-4F** | Classical Ensemble | 4 | N/A | Top 4 features (`V14`, `V4`, `V12`, `V8`), same splits & samples |
| **QSVC** | Quantum Kernel SVM | 4 | 4 | `ZZFeatureMap` (reps=2) + `FidelityQuantumKernel` + Classical SVM |
| **VQC** | Variational Classifier | 4 | 4 | `ZZFeatureMap` + `RealAmplitudes` ansatz + COBYLA optimizer |

### Why XGBoost-4F is Essential
Comparing a 4-qubit quantum model solely against a 30-feature classical model conflates **feature capacity** with **model architecture**. `XGBoost-4F` isolates the algorithmic difference by evaluating both paradigms on the **exact same 4 features and data splits**.

---

## Quick Start & CLI Usage

### 1. Fast Test Run (CI / Validation Mode, < 30 seconds)
```powershell
python -m phase2.experiments.phase2_benchmark_real --quick-test
```

### 2. Standard Real-Data Benchmark
```powershell
python -m phase2.experiments.phase2_benchmark_real --max-train-samples 400 --max-val-samples 200 --max-test-samples 800
```

### 3. CLI Arguments
- `--max-train-samples <int>`: Quantum training subset size (balanced 50/50). Default: `300`.
- `--max-val-samples <int>`: Validation subset size for threshold tuning. Default: `150`.
- `--max-test-samples <int>`: Unbalanced test subset size preserving ~0.17% fraud rate. Default: `600`.
- `--vqc-max-iter <int>`: COBYLA iterations for VQC. Default: `15`.
- `--skip-qsvc`: Skip QSVC execution.
- `--skip-vqc`: Skip VQC execution.
- `--quick-test`: Run ultra-fast 40-sample sanity validation.

### 4. Educational Toy Experiment (Sanity Check)
```powershell
python -m phase2.experiments.toy_qml_experiment
```
*(4-sample linearly separable toy dataset demonstrating Qiskit circuit mechanics in < 10 seconds)*.

---

## Output Artifacts & Visualizations

Running the real benchmark automatically generates:

### Data Artifacts (`phase2/results/`)
- `phase2_benchmark_real.json`: Full metrics, confusion matrices, timestamps, and split metadata.
- `phase2_metrics.csv`: Tabular CSV of all 4 models.
- `phase2_feature_selection.json`: Selected top 4 features, ranking scores, and mathematical rationale.

### Publication-Grade Visualizations (`phase2/results/plots/`)
1. **`pr_curve_comparison.png`**: Precision-Recall curves showing trade-offs across all models.
2. **`roc_curve_comparison.png`**: Receiver Operating Characteristic curves.
3. **`model_comparison_bar.png`**: Side-by-side bar chart of PR-AUC, ROC-AUC, and F1-score.
4. **`feature_importance_top4.png`**: XGBoost feature importance ranking highlighting selected qubits.
5. **`confusion_matrices.png`**: Subplot matrix of TP, TN, FP, FN for evaluated models.
6. **`quantum_circuit_diagram.png`**: Gate-level diagram of the 4-qubit quantum circuit.

---

## Directory Structure

```
phase2/
├── README.md                          Comprehensive documentation (this file)
├── requirements_quantum.txt           Qiskit & QML dependencies
│
├── quantum/                           Core QML Modules
│   ├── config.py                      QuantumConfig dataclass with real dataset settings
│   ├── real_data_pipeline.py          Stratified 60/20/20 split, zero-leakage scalers
│   ├── classical_baseline.py          XGBoost-4F baseline classifier
│   ├── feature_encoding.py            ZZFeatureMap and angle rotation encoders
│   ├── quantum_kernel.py              FidelityQuantumKernel with StatevectorSampler
│   ├── circuits.py                    Circuit resource profiler & diagram exporter
│   ├── qsvc_model.py                  QSVC model class
│   ├── vqc_model.py                   VQC model class with RealAmplitudes
│   ├── evaluation.py                  Fraud-aware metrics & validation threshold tuner
│   └── data_preparation.py            Legacy subset helpers (backward compatible)
│
├── experiments/
│   ├── phase2_benchmark_real.py       PRIMARY: Real-dataset benchmark CLI
│   ├── toy_qml_experiment.py          Educational 4-point sanity check
│   └── phase2_benchmark.py            Legacy 100-sample benchmark
│
└── results/
    ├── phase2_benchmark_real.json     Real-dataset benchmark metrics
    ├── phase2_metrics.csv             Model comparison table
    ├── phase2_feature_selection.json  Top 4 feature selection metadata
    └── plots/                         6 benchmark plots (PR, ROC, CM, Circuit, etc.)
```
