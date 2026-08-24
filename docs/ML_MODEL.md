# Classical ML Model

This documents the completed classical fraud detection model. It is the **Phase 1 baseline** that all future quantum models will be compared against.

---

## Algorithm: XGBoost

XGBoost (Extreme Gradient Boosting) is a gradient boosting algorithm built on decision trees. It was chosen because:

- It handles tabular data very well
- It natively supports class imbalance via `scale_pos_weight`
- It produces SHAP-compatible feature importance
- It is fast and reproducible
- It is a well-established baseline for fraud detection in the literature

---

## Preprocessing Pipeline

The preprocessing pipeline is implemented in `src/ml/data_preprocessor.py`.

**Steps (in order, to prevent data leakage):**

1. **Load data** from `data/raw/creditcard.csv`
2. **Stratified split** into train (60%) / validation (20%) / test (20%) — split happens *before* any transformation
3. **StandardScaler** — fit on training set only, then applied to val and test
   - Normalizes features to mean=0, std=1
   - Prevents test-set information from leaking into the scaler
4. **SMOTE oversampling** — applied to training data only
   - Synthetically generates fraud examples to address 1:578 imbalance
   - Target ratio: 0.5 (fraud becomes ~33% of training set after oversampling)
   - Test set is NOT oversampled — it preserves the real 0.17% fraud rate

---

## Model Architecture

**Class:** `FraudClassifier` in `src/ml/classical_model.py`

```python
XGBClassifier(
    n_estimators=100,       # number of trees
    max_depth=7,            # tree depth (tuned from grid search: [5,6,7])
    learning_rate=0.15,     # (tuned from grid search: [0.05, 0.1, 0.15])
    random_state=42,
    eval_metric="logloss",
    scale_pos_weight=577.29, # auto-adjusted to class imbalance ratio
)
```

Hyperparameters were selected by GridSearchCV with 3-fold cross-validation over `max_depth ∈ {5,6,7}` and `learning_rate ∈ {0.05, 0.1, 0.15}`. Best CV F1: 0.8539.

---

## Training Process

1. Features are scaled and SMOTE-oversampled (or class-weighted — see note below)
2. XGBoost trains using gradient boosting over decision trees
3. Early stopping monitors validation loss (stops if no improvement for 10 rounds)
4. `scale_pos_weight=577.29` provides class weighting to compensate for imbalance
5. Decision threshold is tuned on the **validation set** (not the test set)
   - Default threshold is 0.5; tuned threshold is **0.70** (maximizes F1)
   - Higher threshold means fewer fraud flags, but each flag is more confident

> **Note on SMOTE:** The final training run used `scale_pos_weight` instead of SMOTE because `imbalanced-learn` was unavailable in that environment. Both techniques address class imbalance; `scale_pos_weight` is a lighter-weight alternative that upweights fraud samples in the loss function.

---

## Explainability: SHAP

Every prediction includes SHAP (SHapley Additive exPlanations) values.

- **Method:** `shap.TreeExplainer` — fast and exact for tree-based models
- **Output per transaction:**
  - Fraud probability (0–1)
  - SHAP value for each of the 30 features (positive = pushes toward fraud, negative = away from fraud)
  - Top 3 contributing features in plain language
- Used in the dashboard's transaction detail view

---

## Evaluation Metrics

Because the dataset is severely imbalanced (0.17% fraud), standard accuracy is misleading.

| Metric | Why it matters |
|--------|---------------|
| **PR-AUC** (primary) | Measures precision-recall trade-off on the fraud class. Does not inflate on majority class. |
| ROC-AUC | Overall discrimination ability. Can look good even on weak models with class imbalance. |
| F1 Score | Harmonic mean of precision and recall at a fixed threshold. |
| Precision | Of all transactions flagged as fraud, how many are actually fraud? |
| Recall | Of all actual fraud cases, how many did the model catch? |

---

## Phase 1 Results

Evaluated on the **test set** (56,962 transactions, 98 actual fraud), which was never seen during training or threshold tuning.

| Metric | Score |
|--------|-------|
| **PR-AUC** (primary) | **0.8716** |
| ROC-AUC | 0.9692 |
| F1 Score | 0.8723 |
| Precision | 0.9111 |
| Recall | 0.8367 |

Full confusion matrix and additional context: see [`RESULTS.md`](RESULTS.md).

**Confusion matrix:**

| | Predicted: Legit | Predicted: Fraud |
|--|--:|--:|
| **Actual: Legit** | 56,856 (TN) | 8 (FP) |
| **Actual: Fraud** | 19 (FN) | 79 (TP) |

**In plain terms:**
- The model caught **79 out of 98** fraud cases (80.6% recall)
- Only **8 false alarms** out of 56,864 legitimate transactions (very high precision)
- PR-AUC of **0.8557** is the number Phase 2 quantum models must beat to be considered an improvement

---

## Saved Artifacts

| File | Description |
|------|-------------|
| `data/processed/xgboost_model.joblib` | Trained XGBoost model |
| `data/processed/scaler.joblib` | Fitted StandardScaler |
| `data/processed/phase1_results.json` | Metrics in JSON format |
| `data/processed/train.parquet` | Preprocessed training split |
| `data/processed/test.parquet` | Preprocessed test split |

**Loading the model for inference:**
```python
import joblib
import numpy as np

model = joblib.load("data/processed/xgboost_model.joblib")
scaler = joblib.load("data/processed/scaler.joblib")

# transaction_features: numpy array of shape (1, 30)
scaled = scaler.transform(transaction_features)
fraud_probability = model.predict_proba(scaled)[:, 1]

# Tuned threshold
is_fraud = fraud_probability >= 0.85
```

---

## Feature Importance

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
| Top 8 total | | ~76.6% |

`V14` dominates the model's decisions with ~60% of total importance. The top 8 features (V14, V4, V12, V8, V13, V20, V27, V18) are selected for the quantum-ready dataset.
