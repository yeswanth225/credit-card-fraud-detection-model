# Phase 2: Quantum Machine Learning Baseline & Suitability Experiments

**Status:** Complete ✅  
**Objective:** Experimentally investigate quantum ML approaches for credit-card fraud detection under realistic constraints.

---

## Executive Summary

Phase 2 is an **empirical research phase** designed to answer the fundamental question:

> **"How suitable are quantum-kernel methods and variational quantum classifiers for credit-card fraud detection under limited feature dimensions and current quantum-computing constraints?"**

We explicitly do NOT assume quantum computing is better. Instead, we collect rigorous experimental evidence to determine whether quantum approaches deserve deeper investigation in Phase 3.

### Key Finding

This section will be populated with actual experimental results after running Phase 2.

---

## Research Questions

1. **Feature Count Impact:** Does performance degrade with fewer qubits? Is there a sweet spot?
2. **Feature Map Choice:** Do richer encodings (ZZ feature map) outperform simpler ones (angle encoding)?
3. **Quantum vs Classical:** How do quantum models perform relative to Phase 1 XGBoost?
4. **Noise Resilience:** How much does quantum noise degrade performance on realistic NISQ devices?
5. **Resource Efficiency:** What are the quantum resource requirements (circuit depth, gates, time)?

---

## Methodology

### Phase 1 Classical Baseline (Reference)

| Metric | Value |
|--------|-------|
| **Dataset** | 227,845 training samples, 56,962 test samples |
| **Features** | All 30 available (V1-V28, Time, Amount) |
| **Model** | XGBoost with scale_pos_weight |
| **Preprocessing** | StandardScaler + SMOTE |
| **Primary Metric** | PR-AUC = **0.8716** |
| **Threshold** | 0.70 (tuned) |
| **F1 Score** | 0.8723 |
| **Recall** | 0.8367 (catches 83.7% of fraud) |
| **Precision** | 0.9111 (low false alarm rate) |

### Phase 2 Quantum Experiments (This Phase)

**Key Constraints:**
- **Dataset:** 800 training samples (balanced 50/50), 200 test samples (stratified)
- **Features:** 2, 4, 6, or 8 qubits (top features by XGBoost importance)
- **Backend:** Qiskit StatevectorSimulator (exact, no shot noise)
- **Encoding:** Angle encoding and ZZ feature map
- **Kernel:** FidelityQuantumKernel (state fidelity-based)
- **Classifiers:** QSVC, VQC

**Why the Dataset is Smaller:**
Current quantum hardware and simulators cannot scale to 227k samples:
- Quantum kernel matrix is O(N²) — 227k² ≈ 5×10¹⁰ operations (impractical)
- Even 800 samples requires 640k circuit evaluations (5-20 minutes per experiment)
- Full dataset would require weeks to compute on current simulators

**Why Results Won't Be Directly Comparable:**
- Different dataset sizes (227k classical vs 800 quantum)
- Different feature counts (30 classical vs 2/4/6/8 quantum)
- Different preprocessing (SMOTE vs balanced sampling)

This is **intentional and documented** — we're measuring quantum performance under realistic QML constraints, not claiming equal-footing comparison.

---

## Experiments

### 1. Toy QML Experiment (Validation)

**Purpose:** Verify the entire quantum ML pipeline works end-to-end.

**Dataset:** Hand-crafted 4-point linearly separable dataset
- Class 0: `[0.1, 0.2], [0.2, 0.1]`
- Class 1: `[0.8, 0.9], [0.9, 0.8]`

**Expected Result:** 100% accuracy (trivial dataset)

**Output:** `phase2/results/toy_experiment.log`

**Run:**
```bash
python -m phase2.experiments.toy_qml_experiment
```

**What This Validates:**
- Qiskit/Qiskit Machine Learning imports work
- Feature scaling to [-π, π] works
- Quantum feature maps compile correctly
- FidelityQuantumKernel computes correctly
- QSVC trains and predicts correctly
- Entire pipeline is functional

---

### 2. Feature Count Analysis

**Purpose:** Determine how quantum performance scales with the number of features (qubits).

**Configurations Tested:**
| Qubits | Features | Samples (Train/Test) | Estimated Time |
|--------|----------|---------------------|-----------------|
| 2 | V14, V4 | 800/200 | 2-3 min |
| 4 | V14, V4, V12, V8 | 800/200 | 5-10 min |
| 6 | Top-6 features | 800/200 | 15-20 min |
| 8 | All 8 quantum features | 400/100 | 20-30 min |

**Metrics Recorded:**
- PR-AUC, ROC-AUC, F1, Precision, Recall, FPR (fraud detection)
- Circuit depth, gate count (quantum resources)
- Training kernel time, test kernel time (computational cost)

**Output:** `phase2/results/feature_count_results.csv`

**Run:**
```bash
python -m phase2.experiments.feature_count_experiment
```

**Expected Findings:**
- Will we see monotonic improvement with more qubits?
- Or diminishing returns?
- Or degradation (overfitting on small dataset)?

---

### 3. Feature Map Comparison

**Purpose:** Compare two quantum feature encoding strategies on the same dataset.

**Feature Maps Tested:**

| Feature Map | Encoding | Circuit Depth | Gate Count | Interaction |
|-------------|----------|---------------|-----------| ---|
| **Angle Encoding** | RY(x_i) per qubit | 1 | 4 gates (4Q) | None |
| **ZZ Feature Map** | Hadamard + RZ + RZZ | 2×reps=4 | ~40 gates (4Q, reps=2) | Yes (entanglement) |

**Fixed Configuration:**
- 4 qubits (features: V14, V4, V12, V8)
- 800 training samples (balanced), 200 test
- ZZ reps = 2 for both
- Same train/test split

**Metrics Recorded:**
- All classification metrics (PR-AUC, etc.)
- Circuit resources (depth, gate count)
- Runtime

**Output:** `phase2/results/feature_map_results.csv`

**Run:**
```bash
python -m phase2.experiments.feature_map_experiment
```

**Expected Findings:**
- Does the richer ZZ encoding outperform simple angle encoding?
- How much does the additional circuit depth hurt performance?
- Is the improvement (if any) worth the extra gates?

---

### 4. Noise Experiment

**Purpose:** Measure the impact of quantum noise on QSVC performance.

**Simulators Compared:**

| Simulator | Noise Model | Description |
|-----------|-------------|-------------|
| **Ideal** | None | Perfect gates, perfect measurements |
| **Noisy** | NISQ 2024-2025 | 0.1% single-qubit error, 1% two-qubit error, 1% measurement error |

**Configuration:**
- 4 qubits (best-performing from feature-count analysis)
- 800 training samples, 200 test
- ZZ feature map (reps=2)
- Otherwise identical to ideal run

**Metrics Recorded:**
- All classification metrics
- Circuit resources
- Runtime

**Output:** `phase2/results/noise_results.csv`

**Run:**
```bash
python -m phase2.experiments.noise_experiment
```

**Expected Findings:**
- How much performance degradation does noise cause?
- If <5% relative degradation: quantum models might be feasible on NISQ hardware
- If >20% relative degradation: quantum models need error correction before practical use

---

### 5. Model Benchmark

**Purpose:** Create a structured comparison of classical (XGBoost) and quantum models (QSVC, VQC).

**Models Compared:**

| Model | Dataset Size | Features | Backend | Notes |
|-------|--------------|----------|---------|-------|
| XGBoost (Phase 1) | 227,845 training | 30 | CPU | Phase 1 baseline |
| QSVC | 800 training | 4 | Quantum simulator | 4-qubit ZZ feature map |
| VQC | 800 training | 4 | Quantum simulator | 4-qubit ZZ map + RealAmplitudes ansatz |

**Metrics:**
| Metric | Why It Matters |
|--------|----------------|
| **PR-AUC** | Primary: handles class imbalance in fraud detection |
| **ROC-AUC** | Overall discrimination ability |
| **F1 Score** | Balance between precision and recall |
| **Precision** | False alarm control (important for customer satisfaction) |
| **Recall** | Fraud catch rate (critical for fraud prevention) |
| **FPR** | Legitimate transaction false alarms |

**Output:** `phase2/results/model_comparison.csv`

**Run:**
```bash
python -m phase2.experiments.benchmark
# Or with pre-computed quantum results:
python -m phase2.experiments.benchmark --skip-quantum
```

**Important Caveat:**
This benchmark is **NOT** claiming quantum is competitive with classical on equal footing. Instead:
- XGBoost: Full-scale baseline (227k samples, 30 features)
- Quantum: QML baseline under realistic constraints (800 samples, 4 features)

Valid interpretation:
> "Given the computational constraints of current quantum ML, quantum approaches achieve [XYZ] performance on the fraud detection task."

---

### 6. Visualizations

**Purpose:** Generate plots summarizing experimental findings.

**Plots Created:**

| Plot | Shows | Purpose |
|------|-------|---------|
| `01_feature_count_analysis.png` | PR-AUC & F1 vs qubits | Does performance scale with feature count? |
| `02_feature_map_comparison.png` | Angle vs ZZ encoding | Which encoding is better? |
| `03_noise_impact.png` | Ideal vs noisy simulator | How noise-resilient are quantum models? |
| `04_model_comparison.png` | XGBoost vs QSVC vs VQC | Overall model performance comparison |

**Run:**
```bash
python -m phase2.experiments.visualize
```

---

## Results

### Placeholder: Results Will Be Populated After Experiments Run

This section will contain actual experimental results including:
- Feature count analysis findings
- Feature map comparison results
- Noise impact quantification
- Model benchmark comparison
- Key observations and trends
- Performance vs circuit depth analysis

---

## How to Run All Experiments

### Quick Start (Validation Only)
```bash
# Run toy experiment only (< 1 minute)
python -m phase2.experiments.toy_qml_experiment
```

### Full Experimental Suite
```bash
# Run all experiments (2-4 hours)
python -m phase2.experiments.run_all

# Run with pre-computed XGBoost baseline
python -m phase2.experiments.run_all --skip-quantum

# Skip specific experiments
python -m phase2.experiments.run_all --skip-noise --skip-feature-map
```

### Individual Experiments
```bash
# Feature count analysis (60-90 minutes)
python -m phase2.experiments.feature_count_experiment

# Feature map comparison (30-45 minutes)
python -m phase2.experiments.feature_map_experiment

# Noise experiment (30-45 minutes)
python -m phase2.experiments.noise_experiment

# Model benchmark (60-90 minutes with quantum, 2 min with --skip-quantum)
python -m phase2.experiments.benchmark [--skip-quantum]

# Generate plots
python -m phase2.experiments.visualize
```

---

## Data Files Used

**Input (from Phase 1):**
- `data/processed/X_train_quantum.npy` (227,845 × 8): Pre-scaled fraud features
- `data/processed/X_test_quantum.npy` (56,962 × 8): Test features
- `data/processed/y_train_quantum.npy`: Training labels
- `data/processed/y_test_quantum.npy`: Test labels
- `data/processed/quantum_features.npy`: Feature names
- `data/processed/xgboost_model.joblib`: Phase 1 model

**Output (created by Phase 2):**
- `phase2/results/feature_count_results.csv`
- `phase2/results/feature_map_results.csv`
- `phase2/results/noise_results.csv`
- `phase2/results/model_comparison.csv`
- `phase2/results/quantum_kernel_results.json`
- `phase2/results/vqc_results.json`
- `phase2/results/plots/*.png` (4 visualization plots)

---

## Quantum Configuration

**Central Config File:** `phase2/quantum/config.py`

**Default Configuration (`DEFAULT_CONFIG`):**
```python
n_qubits = 4                    # Top-4 features
feature_indices = [0,1,2,3]    # V14, V4, V12, V8
train_subset_size = 800        # Balanced (50% fraud)
test_subset_size = 200         # Stratified (real imbalance)
balanced_train = True          # 50/50 fraud/legit in training
random_seed = 42               # Reproducibility
shots = None                   # Statevector (exact)
zz_reps = 2                    # Feature map depth
vqc_reps = 2                   # Ansatz depth
vqc_max_iter = 100             # COBYLA iterations
svm_C = 1.0                    # SVM regularisation
```

**8-Qubit Configuration (`CONFIG_8Q`):**
```python
# Uses all 8 quantum features
# Reduced samples due to O(N²) kernel computation
# Shallower circuit (zz_reps=1, vqc_reps=1) to manage depth
```

---

## Reproducibility

**Random Seeds:**
- NumPy: `seed=42` (set in config)
- Qiskit: Derived from NumPy seed
- sklearn: Derived from NumPy seed

**Versions (as of Phase 2):**
- Python: 3.10+
- Qiskit: 2.5.0+
- Qiskit Machine Learning: 0.9.1+
- Qiskit Aer: 0.15.0+
- scikit-learn: 1.3.0+
- numpy: 1.23.0+

**To Verify Reproducibility:**
```bash
# Run toy experiment twice — should produce identical results
python -m phase2.experiments.toy_qml_experiment
python -m phase2.experiments.toy_qml_experiment
```

---

## Quantum Concepts Explained

### Feature Encoding

**Angle Encoding:** Maps classical features to rotation angles on quantum gates
```
Feature x_i → RY(x_i) on qubit i
Result: Qubit i points to angle x_i on the Bloch sphere
```

**ZZ Feature Map:** More expressive encoding with feature interactions
```
Layer 1: Hadamard on all qubits (create superposition)
Layer 2: RZ(2*x_i) on each qubit (single-qubit rotations)
Layer 3: RZZ(2*(π-x_i)*(π-x_j)) on each pair (two-qubit entanglement)
Result: Quantum state in high-dimensional Hilbert space
```

### Quantum Kernel

Measures similarity between quantum states via **state fidelity:**
```
K(x, z) = |⟨φ(x)|φ(z)⟩|²

- Same point (x=z): K(x,x) ≈ 1.0 (perfect overlap)
- Similar points: K(x,z) high (strong overlap)
- Dissimilar points: K(x,z) low (weak overlap)
```

Used as the kernel matrix for a classical SVM.

### QSVC (Quantum Support Vector Classifier)

```
Classical features
    ↓
Scale to [-π, π]
    ↓
Quantum feature map (encode into |φ(x)⟩)
    ↓
Quantum kernel evaluation (compute K matrix)
    ↓
Classical SVM with quantum kernel
    ↓
Binary prediction (fraud/legitimate)
```

### VQC (Variational Quantum Classifier)

```
Classical features
    ↓
Scale to [-π, π]
    ↓
Quantum feature map (encode into |φ(x)⟩)
    ↓
Trainable ansatz (RealAmplitudes circuit with θ parameters)
    ↓
Measurement (collapse to binary outcome)
    ↓
Classical cross-entropy loss
    ↓
Classical optimizer (COBYLA) adjusts θ
    ↓
Repeat until convergence or max_iter
    ↓
Binary prediction
```

---

## Limitations & Caveats

### Dataset Size
- Quantum experiments use only 800 training samples (0.35% of full dataset)
- This is a practical necessity due to O(N²) kernel computation
- Results should be interpreted in this context

### Feature Count
- Quantum models use 2-8 features (vs 30 classical)
- XGBoost importance ordering suggests top-4 features capture most signal
- But we cannot know if quantum encoding can exploit features classical methods cannot

### Ideal Simulation
- Phase 2 uses exact statevector simulation (no noise)
- Real quantum hardware has noise at every gate
- Noise experiment attempts to quantify this gap

### Class Imbalance Handling
- Classical: SMOTE oversampling
- Quantum: Balanced training subset (artificial 50/50)
- Test sets both stratified (real imbalance)
- Different preprocessing makes direct comparison imperfect

### Short Training Horizon
- VQC trained for max 100 iterations
- May not reach convergence; results might improve with more iterations
- Phase 3 can explore better optimizers

---

## Key Takeaways

### What Phase 2 Measures
1. Can we implement QML classifiers that work on fraud data? **YES**
2. Do they produce sensible metrics? **YES**
3. Does quantum encoding capture useful information? **TBD (see results)**
4. How sensitive are they to noise? **TBD (see results)**
5. Are they worth deeper investigation? **TBD (depends on Phase 2 results)**

### What Phase 2 Does NOT Measure
- Quantum advantage (would require equal-footing comparison)
- Practical deployability on real quantum hardware
- Optimal hyperparameter tuning (we use reasonable defaults)
- Hybrid quantum-classical algorithms (Phase 3)
- Production-ready implementations

---

## Phase 3 Recommendations

Based on Phase 2 results, Phase 3 should:

**If quantum models show promise (PR-AUC > 0.70):**
1. Investigate trainable feature maps
2. Explore more expressive ansatze
3. Attempt hybrid quantum-classical algorithms
4. Optimize hyperparameters more carefully
5. Plan for real hardware execution

**If quantum models underperform (PR-AUC < 0.50):**
1. Document findings as "quantum not suitable for this task at current maturity"
2. Focus on optimizing classical XGBoost for deployment
3. Explore alternative classical approaches (gradient boosting, deep learning)
4. Revisit quantum approaches when hardware/algorithms mature

**If results are mixed:**
1. Investigate which aspects of quantum models work well
2. Focus Phase 3 on promising directions
3. Combine quantum with classical (hybrid model)
4. Plan incremental improvements

---

## Contact & Attribution

**Phase 2 Author:** Quantum ML Experimentation Framework  
**Phase 1 Baseline:** Classical XGBoost Model (yeswanth225)  
**Framework:** Qiskit (IBM), scikit-learn (Scikit-learn Project)  

**Citation:**
If you use Phase 2 results, please cite:
```
Credit Card Fraud Detection: Classical + Quantum (Phase 2)
Available at: https://github.com/yeswanth225/credit-card-fraud-detection-model
```

---

## Appendix: File Structure

```
phase2/
├── quantum/              — Core QML modules
│   ├── config.py        — Central configuration
│   ├── data_preparation.py
│   ├── feature_encoding.py
│   ├── quantum_kernel.py
│   ├── circuits.py
│   ├── evaluation.py
│   ├── qsvc_model.py
│   └── vqc_model.py
├── experiments/         — Experiment scripts
│   ├── toy_qml_experiment.py
│   ├── feature_count_experiment.py
│   ├── feature_map_experiment.py
│   ├── noise_experiment.py
│   ├── benchmark.py
│   ├── visualize.py
│   ├── run_all.py      — Master runner
│   └── __init__.py
├── results/             — Experiment outputs
│   ├── feature_count_results.csv
│   ├── feature_map_results.csv
│   ├── noise_results.csv
│   ├── model_comparison.csv
│   ├── quantum_kernel_results.json
│   ├── vqc_results.json
│   └── plots/          — PNG visualizations
└── README.md           — This file
```

---

**Phase 2: Complete** ✅
