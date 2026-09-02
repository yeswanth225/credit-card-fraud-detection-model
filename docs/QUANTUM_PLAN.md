# Quantum Plan

## Why Quantum Computing?

Quantum computers process information differently from classical computers. They can represent and manipulate many possible states simultaneously through a property called **superposition**, and exploit **interference** and **entanglement** to find patterns that classical algorithms might solve less efficiently for certain problem shapes.

For fraud detection specifically, we are investigating quantum computing because:

1. **Fraud patterns may live in high-dimensional spaces** that quantum kernels can represent more compactly
2. **QSVM (Quantum SVM)** can compute kernel functions in exponentially large feature spaces — potentially finding non-linear decision boundaries classical SVMs cannot reach efficiently
3. **VQC (Variational Quantum Classifier)** learns parameterized quantum circuits that may generalize differently from classical neural networks
4. **Research is ongoing** — it is worth establishing an experimental baseline now while IBM Quantum hardware is increasingly accessible

---

## Why We Are NOT Assuming Quantum Will Win

On near-term quantum hardware, there are serious practical constraints:

- **Few qubits:** Current devices have tens to hundreds of qubits, but many have high error rates
- **Circuit depth limits:** Deep circuits amplify errors; near-term algorithms must be shallow
- **Noise:** Quantum gates are imperfect — results degrade with circuit length
- **Training cost:** VQC requires many circuit evaluations per gradient update — very slow on simulators and hardware
- **Scalability:** Classical XGBoost scales to 284,807 samples trivially; quantum training currently does not

Our classical baseline (PR-AUC 0.8557, F1 0.8541) is strong. It is entirely possible — and expected — that quantum models will not match it on this dataset at this scale. The honest scientific goal is to **measure the gap** and understand it.

---

## What "Quantum Advantage" Means Here

In this project, quantum advantage would mean one or more of:

- **Higher PR-AUC** than 0.8557 on the same test set using the 8-feature quantum dataset
- **Better generalization** on small subsets (quantum may perform relatively better with less training data)
- **Faster training convergence** in circuits evaluated on IBM hardware
- **Novel feature interactions** captured by quantum kernels that classical SVMs miss

We will document all of this honestly, including cases where quantum performs worse.

---

## Roadmap

### Step 1 — Classical Baseline ✅ Done
XGBoost trained on 284,807 real transactions. PR-AUC: 0.8557.
This is the number all quantum models must be compared against.

### Step 2 — Feature Reduction ✅ Done
Top 4 features selected by XGBoost importance.
Quantum-ready arrays saved at `data/processed/X_train_quantum.npy`.

### Step 3 — Quantum-Compatible Real Dataset ✅ Upgraded
- Loaded the genuine European Credit Card Fraud Detection dataset (`data/raw/creditcard.csv`, 284,807 transactions).
- Stratified 60% Train / 20% Val / 20% Test split with zero leakage (`StandardScaler` fitted on training split only).
- Selected top 4 features (`V14`, `V4`, `V12`, `V8`) accounting for >72% of Phase 1 XGBoost decision weight.
- Angle-normalized to $[-\pi, \pi]$ using `MinMaxScaler` fitted strictly on training data.
- Balanced training subsampling (50% fraud, 50% legit) to allow quantum models to learn fraud decision boundaries under simulation limits.
- Test set preserves real-world fraud distribution (~0.17% fraud) and is never balanced.

### Step 4 — Quantum Encoding ✅ Done
Encoding translates classical feature values into quantum states.

**ZZFeatureMap (used for QSVC and VQC):**
A 4-qubit ZZFeatureMap parameterised with single-qubit $R_Y(\theta_i)$ rotations and two-qubit $R_{ZZ}(2(\pi-\theta_i)(\pi-\theta_j))$ entangling gates. Captures non-linear feature interactions in a $2^4 = 16$-dimensional Hilbert space.

### Step 5 — Quantum Kernel / QSVC ✅ Upgraded
Quantum Support Vector Machine using state fidelity kernel (`FidelityQuantumKernel` with `ComputeUncompute` on local Qiskit Statevector simulator).
- Evaluated on real credit card transactions.
- Operating threshold optimized on validation set only, then frozen for test set.

### Step 6 — VQC (Variational Quantum Classifier) ✅ Upgraded
A parameterised quantum circuit using `RealAmplitudes` ansatz (2 repetitions, linear entanglement) trained with the COBYLA optimizer.
- Outputs calibrated class probabilities.
- Threshold tuned on validation data only and evaluated on unseen real-imbalance test set.

### Step 7 — Compare Classical vs Quantum (Real-Data Benchmark) ✅ Done
Evaluated **XGBoost (30F, Phase 1)**, **XGBoost-4F (Classical 4-Feature Baseline)**, **QSVC (4F, 4Q)**, and **VQC (4F, 4Q)**.
- **Outcome**: Classical XGBoost outperforms quantum models, primarily due to higher feature capacity (30 vs 4 features), mature tree ensemble splitting, and extensive sample capacity.
- **Scientific Honesty**: Demonstrates quantum feasibility and geometric representation without fabricating results or claiming false quantum advantage.

### Step 8 — Noise Simulation ⏳ Future
Run the quantum circuits through Qiskit's noise simulators to model what real hardware would produce.

### Step 9 — IBM Quantum Hardware ⏳ Future
Run a subset of experiments on a real IBM Quantum device.
- Compare results to noiseless simulation

### Step 10 — Custom Hybrid Algorithm ⏳ Future
Explore a hybrid approach routing uncertain predictions to a quantum classifier.

### Step 11 — Final Evaluation ✅ Done
Final summary comparing the approaches based on local simulation:

| Model | PR-AUC | Training time | Notes |
|-------|--------|--------------|-------|
| XGBoost (baseline) | 0.8716 | fast | 227,845 training samples, 30 features |
| QSVC (simulator) | 0.0435 | ~82 mins | 100 training samples, 4 features |
| VQC (simulator) | 0.0833 | ~8 sec | 100 training samples, 4 features |

---

## Candidate Algorithms

### Quantum SVM (QSVM)
- **How it works:** Computes a kernel matrix using a quantum circuit; then fits a classical SVM on top of it
- **Advantage:** Cleaner theoretical grounding — quantum kernels can access feature spaces exponential in size
- **Disadvantage:** Kernel computation requires O(n²) circuit evaluations; slow for large n

### VQC (Variational Quantum Classifier)
- **How it works:** A parameterized quantum circuit is trained end-to-end using a classical optimizer
- **Advantage:** Flexible, trainable, analogous to a quantum neural network
- **Disadvantage:** Training is slow, gradients can vanish (barren plateau problem), sensitive to circuit design

---

## Comparison Metrics

The same metrics used in Phase 1 will be used for quantum models:

| Metric | Priority |
|--------|----------|
| PR-AUC | Primary — fraud is rare, this is the honest metric |
| F1 Score | Secondary — threshold-dependent balance |
| Precision | How many flagged transactions are real fraud? |
| Recall | How many fraud cases are caught? |
| Training time | Practical cost of quantum training |
| Inference time | Practical cost per prediction |

---

## Quantum-Specific Constraints

| Constraint | Value | Notes |
|-----------|-------|-------|
| Qubits needed | 8 | One per feature (angle encoding) |
| Circuit depth | Low (≤ 20 layers) | Deep circuits amplify noise too much |
| Training samples | 1,000–5,000 | Full 170k dataset is too slow for simulation |
| Simulator | Qiskit Aer | Statevector or shot-based simulation |
| Hardware provider | IBM Quantum | Free tier access via QiskitRuntimeService |

---

## Where to Put Quantum Code

```
src/quantum/          ← reserved, currently empty
├── vqc.py            ← VQC implementation
├── qsvm.py           ← QSVM implementation
├── encoding.py       ← Feature encoding utilities
└── benchmark.py      ← Comparison runner

phase2/               ← Phase 2 results and notebooks
├── notebooks/        ← Quantum experiment notebooks
├── results/          ← Saved metrics and plots
└── models/           ← Saved quantum model parameters
```
