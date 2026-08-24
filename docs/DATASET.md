# Dataset

## Source

**Kaggle — Credit Card Fraud Detection (ULB)**
https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud

Real European cardholder transactions from September 2013 (2 days).

---

## Overview

| Property | Value |
|----------|-------|
| Total transactions | 284,807 |
| Fraudulent | 492 (0.1727%) |
| Legitimate | 284,315 (99.83%) |
| Features | 30 (V1–V28 + Time + Amount) |
| Target column | `Class` (0 = legitimate, 1 = fraud) |
| File format | CSV (~120 MB uncompressed) |
| Missing values | None |

---

## Features

| Feature | Description |
|---------|-------------|
| `V1`–`V28` | PCA-transformed components. Original features are anonymized for privacy. Meaning of each component is unknown. |
| `Time` | Seconds elapsed since the first transaction in the dataset |
| `Amount` | Transaction amount in Euros |
| `Class` | Target variable: 0 = legitimate, 1 = fraud |

Because V1–V28 are already PCA-transformed, their raw values are not interpretable in the usual sense. The model learns patterns from their distributions.

---

## Class Imbalance

This is a severely imbalanced dataset:
- **1 fraud per ~578 legitimate transactions**
- Accuracy is a misleading metric here — a model that always predicts "not fraud" would achieve 99.83% accuracy
- The correct primary metric is **PR-AUC** (Precision-Recall Area Under Curve), which measures performance specifically on the minority (fraud) class

---

## Train / Validation / Test Split

| Split | Transactions | Fraud |
|-------|-------------|-------|
| Training (60%) | 170,883 | 295 |
| Validation (20%) | 56,962 | 99 |
| Test (20%) | 56,962 | 98 |

Split is **stratified** — each split maintains the same ~0.17% fraud rate.

**Important:** The test set was never touched until final evaluation. The decision threshold was tuned using only the validation set.

---

## Preprocessing

Applied in this exact order to prevent data leakage:

1. **Train/test split first** (before any scaling) — stratified 60/20/20
2. **StandardScaler** — fit on training data only, then applied to val and test
3. **SMOTE oversampling** — applied to training data only (target ratio: 0.5), test set preserves real 0.17% fraud distribution

```python
# Correct order (no leakage)
X_train, X_val, X_test, y_train, y_val, y_test = split(data, stratify=True)
scaler.fit(X_train)           # fit only on training
X_train = scaler.transform(X_train)
X_val   = scaler.transform(X_val)    # transform, not fit
X_test  = scaler.transform(X_test)
X_train_smote, y_train_smote = SMOTE().fit_resample(X_train, y_train)
```

Artifacts saved at `data/processed/scaler.joblib`.

---

## How to Obtain the Dataset

1. Create a Kaggle account at https://www.kaggle.com
2. Go to https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
3. Download the dataset ZIP file
4. Extract `creditcard.csv` and place it at `data/raw/creditcard.csv`

**Or using the Kaggle API:**
```bash
pip install kaggle
kaggle datasets download -d mlg-ulb/creditcardfraud -p data/raw
cd data/raw && unzip creditcardfraud.zip
```

**Or using the project download script:**
```bash
python scripts/download_data.py --output data/raw
```

**Verify the download:**
```python
import pandas as pd
df = pd.read_csv('data/raw/creditcard.csv')
print(df.shape)        # Expected: (284807, 31)
print(df['Class'].sum())  # Expected: 492
```

---

## Quantum-Ready Dataset

For Phase 2 (quantum), feature reduction has already been applied.

The **top 8 features by XGBoost importance** account for ~83.16% of cumulative importance. These have been extracted and saved:

| File | Description |
|------|-------------|
| `data/processed/X_train_quantum.npy` | Training features (227,845 × 8) |
| `data/processed/X_test_quantum.npy` | Test features (56,962 × 8) |
| `data/processed/y_train_quantum.npy` | Training labels |
| `data/processed/y_test_quantum.npy` | Test labels |
| `data/processed/quantum_features.npy` | Names of the 8 selected features |

**Why 8 features?**
- Quantum circuits need each input feature to be encoded as a qubit rotation
- More qubits = deeper circuits = more noise on real hardware
- 8 features is a practical limit for near-term quantum devices
- These 8 capture most of the discriminative signal

**Top feature:** `V14` alone accounts for ~60% of model importance. The exact 8 selected features are:

| Rank | Feature | Importance |
|------|---------|----------|
| 1 | V14 | 60.01% |
| 2 | V4 | 5.40% |
| 3 | V12 | 4.11% |
| 4 | V8 | 2.72% |
| 5 | V13 | 1.99% |
| 6 | V20 | 1.83% |
| 7 | V27 | 1.81% |
| 8 | V18 | 1.73% |

Cumulative importance of top 8: **76.6%** of the model's decisions.

**Note:** The `quantum_features.npy` file stores these names: `['V14', 'V4', 'V12', 'V8', 'V13', 'V20', 'V27', 'V18']`

**Note:** The 8-feature dataset is awaiting the Phase 2 quantum implementation. No quantum model has been trained on it yet.

---

## Citation

Dal Pozzolo, A., Caelen, O., Reid, M. D., & Bontempi, G. (2015). *Calibrating Probability with Undersampling for Unbalanced Classification*. IEEE ICDM.
