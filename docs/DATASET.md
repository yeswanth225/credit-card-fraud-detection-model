# Dataset — Credit Card Fraud Detection

> Source: Kaggle / Machine Learning Group — Université Libre de Bruxelles (ULB)  
> URL: https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud

---

## Overview

| Property | Value |
|:---|:---|
| Total Records | 284,807 transactions |
| Fraudulent | 492 (0.172%) |
| Legitimate | 284,315 (99.828%) |
| Time Period | 2 days (September 2013) |
| Cardholders | European cardholders |
| Format | CSV, Parquet |
| File Size | ~150 MB (CSV), ~30 MB (Parquet) |

---

## Features

The dataset contains 31 columns:

| Column | Type | Description |
|:---|:---|:---|
| `Time` | float | Seconds elapsed since first transaction |
| `V1`–`V28` | float | PCA-anonymized features (confidential) |
| `Amount` | float | Transaction amount (EUR) |
| `Class` | int | Target: `1` = Fraud, `0` = Legitimate |

> **Note**: V1–V28 are the result of a PCA transformation applied to the original features to protect cardholder privacy. The real features (merchant, location, card details) are not disclosed.

---

## Class Imbalance

The dataset is highly imbalanced:

```
Class 0 (Legitimate): 284,315  (99.83%)
Class 1 (Fraud):          492   (0.17%)

Fraud-to-Legitimate ratio: 1 : 578
```

Handling strategies used in this project:
- **SMOTE** (Synthetic Minority Oversampling) for training
- **Class weights** in XGBoost (`scale_pos_weight = 578`)
- **Stratified K-Fold** cross-validation
- **Precision-Recall AUC** as primary metric (more informative than ROC-AUC for imbalanced data)

---

## Feature Statistics

| Feature | Min | Max | Mean | Std |
|:---|:---|:---|:---|:---|
| Time | 0 | 172,792 | 94,813 | 47,488 |
| Amount | 0.00 | 25,691.16 | 88.35 | 250.12 |
| V1–V28 | varies | varies | ~0 (PCA) | varies |

Notable fraud patterns:
- **Amount**: Fraud transactions tend to cluster at smaller amounts (median ~9.25 EUR) or very large amounts
- **Time**: Fraud is more frequent during late-night hours (0–6h)
- **V14, V10, V12**: Most discriminative PCA features for fraud

---

## Data Files

```
data/
├── raw/
│   ├── creditcard.csv         ← Original Kaggle CSV (not committed, ~150 MB)
│   ├── train.parquet          ← Training split (Parquet, compressed)
│   └── test.parquet           ← Test split (Parquet, compressed)
└── processed/
    ├── train_scaled.parquet   ← Feature-scaled training data
    ├── test_scaled.parquet    ← Feature-scaled test data
    └── features.json          ← Selected feature names and metadata
```

> Raw data files are excluded from the repository (`.gitignore`) due to size. Download from Kaggle before running experiments.

---

## Downloading the Data

```bash
# Using Kaggle CLI:
pip install kaggle
kaggle datasets download mlg-ulb/creditcardfraud
unzip creditcardfraud.zip -d data/raw/

# Or run the helper script:
python scripts/download_data.py
```

---

## Preprocessing Pipeline

```
Raw CSV (284,807 rows)
   │
   ▼
1. Load & validate schema
   │
   ▼
2. Train/test split (80/20, stratified)
   │
   ▼
3. StandardScaler on `Amount` and `Time`
   (V1–V28 already PCA-normalized)
   │
   ▼
4. SMOTE oversampling on training set only
   (Fraud: 492 → ~5,000 synthetic samples)
   │
   ▼
5. Save to data/processed/
```

---

## Engineered Features (Frontend Schema)

For the frontend dashboard, the dataset is adapted to a realistic transaction schema:

| Original | Frontend Column | Mapping |
|:---|:---|:---|
| `Amount` | `amount` | Direct (EUR → INR conversion ×87) |
| `Time` | `hour` | `(Time % 86400) / 3600` |
| `V14` | Geo velocity proxy | Normalized to [0,1] |
| `V12` | Distance from home proxy | Normalized to [0,1] |
| `V10` | Merchant risk proxy | Normalized to [0,1] |
| `Class` | `isKnownFraud` | 1 → true |

---

## Sample Distribution in Seed Data

The 55 seeded transactions in `frontend/js/seed-data.js` are sampled to preserve realistic class distribution:

| Batch | Total | Fraud | Legitimate | Fraud % |
|:---|:---|:---|:---|:---|
| Production Sample 01 | 35 | 7 | 28 | 20% |
| Flagged Audit Ledger 02 | 20 | 5 | 15 | 25% |
| **Total** | **55** | **12** | **43** | **21.8%** |

> Note: Seed data uses a higher fraud rate than the original dataset (21.8% vs 0.17%) for educational demonstration purposes.

---

## Citation

```
Andrea Dal Pozzolo, Olivier Caelen, Reid A. Johnson and Gianluca Bontempi.
Calibrating Probability with Undersampling for Unbalanced Classification.
In Symposium on Computational Intelligence and Data Mining (CIDM), IEEE, 2015
```

*Part of the Credit Card Fraud Detection System — see root [README.md](../README.md)*
