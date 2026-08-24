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
Top 8 features selected by XGBoost importance (83.16% of cumulative importance).
Quantum-ready arrays saved at `data/processed/X_train_quantum.npy` (227,845 × 8).

### Step 3 — Quantum-Compatible Dataset ⏳ Next
- Normalize the 8 features to the range [0, π] or [−π, π] for angle encoding
- Decide on the number of training samples to use (full dataset is too slow for quantum simulation; start with 1,000–5,000 samples)
- Use the same test split as Phase 1 for a fair comparison

### Step 4 — Quantum Encoding ⏳
Encoding translates classical feature values into quantum states.

**Angle Encoding (recommended starting point):**
```
feature_i → Ry(θ_i)|0⟩   where θ_i = 2 × arcsin(x_i)
```
Each of the 8 features maps to one qubit rotation. This requires an 8-qubit circuit.

**ZZFeatureMap (for QSVM):**
A Qiskit built-in that encodes features with entanglement between qubits. Captures feature interactions at the quantum level.

### Step 5 — Quantum Kernel / QSVM ⏳
Quantum Support Vector Machine using a quantum kernel.

```python
from qiskit.circuit.library import ZZFeatureMap
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit_machine_learning.algorithms import QSVC

feature_map = ZZFeatureMap(feature_dimension=8, reps=2)
kernel = FidelityQuantumKernel(feature_map=feature_map)
qsvm = QSVC(quantum_kernel=kernel)
qsvm.fit(X_train_quantum_small, y_train_quantum_small)
```

Why start here: QSVM has a cleaner theoretical motivation (quantum kernel expressiveness) and no variational training loop — easier to debug.

### Step 6 — VQC (Variational Quantum Classifier) ⏳
A quantum circuit with trainable parameters, optimized to classify fraud vs legitimate.

```python
from qiskit.circuit.library import RealAmplitudes
from qiskit_machine_learning.algorithms import VQC
from qiskit.algorithms.optimizers import COBYLA

ansatz = RealAmplitudes(num_qubits=8, reps=3)
vqc = VQC(feature_map=feature_map, ansatz=ansatz, optimizer=COBYLA())
vqc.fit(X_train_quantum_small, y_train_quantum_small)
```

Why include this: VQC is the most "quantum-native" approach and is the subject of active research for quantum advantage in classification.

### Step 7 — Compare Quantum vs Classical ⏳
Evaluate VQC and QSVM on the same 8-feature test set, using the same metrics as Phase 1.

Report honestly:
- Which model has higher PR-AUC?
- What is the gap?
- How long did quantum training take vs classical?
- Does the quantum model generalize better or worse with limited training data?

### Step 8 — Noise Simulation ⏳
Run the quantum circuits through Qiskit's noise simulators to model what real hardware would produce.

```python
from qiskit_aer.noise import NoiseModel
from qiskit_ibm_runtime import QiskitRuntimeService
# Load noise model from a real IBM backend
noise_model = NoiseModel.from_backend(backend)
```

This step answers: how much does realistic hardware noise degrade the results?

### Step 9 — IBM Quantum Hardware ⏳
Run a subset of experiments on a real IBM Quantum device.

- Use IBM Quantum free tier via `QiskitRuntimeService`
- Choose a backend with ≥ 8 qubits and low error rates
- Run a small number of test samples (hardware is slow and queued)
- Compare results to noiseless simulation

### Step 10 — Custom Hybrid Algorithm ⏳
If time and resources allow, explore a hybrid approach:

- Use XGBoost for most predictions (fast, accurate)
- Route uncertain predictions (fraud probability near threshold) to a quantum classifier
- This "quantum routing" approach may give the best of both worlds

### Step 11 — Final Evaluation ⏳
Write a final summary comparing all approaches:

| Model | PR-AUC | Training time | Notes |
|-------|--------|--------------|-------|
| XGBoost (baseline) | 0.8557 | fast | 284,807 samples |
| QSVM (simulator) | _TBD_ | slow | 8 features, small subset |
| VQC (simulator) | _TBD_ | very slow | 8 features, small subset |
| QSVM (IBM hardware) | _TBD_ | very slow + queued | noise-affected |
| Hybrid | _TBD_ | fast+slow | routing model |

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
