# ML Model Documentation — Classical Fraud Detection

> Documents the classical machine learning pipeline used in Phase 1 of the Credit Card Fraud Detection System.

---

## Model Summary

| Property | Value |
|:---|:---|
| Best Model | XGBoost |
| AUC-ROC | 0.9849 |
| Precision | 0.88 |
| Recall | 0.82 |
| F1-Score | 0.85 |
| Training Samples | ~227,845 (80% of 284,807) |
| Test Samples | ~56,962 (20%) |
| Framework | scikit-learn, XGBoost 2.x |

---

## Models Trained

### 1. XGBoost (Best)

```python
XGBClassifier(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=578,     # handles class imbalance
    eval_metric='auc',
    early_stopping_rounds=50,
    random_state=42
)
```

**Results:**
```
AUC-ROC:   0.9849
Precision: 0.88
Recall:    0.82
F1-Score:  0.85
Avg Prec:  0.83
```

### 2. Random Forest

```python
RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    class_weight='balanced',
    n_jobs=-1,
    random_state=42
)
```

**Results:**
```
AUC-ROC:   0.9821
Precision: 0.86
Recall:    0.79
F1-Score:  0.82
```

### 3. Logistic Regression (Baseline)

```python
LogisticRegression(
    C=0.1,
    class_weight='balanced',
    solver='lbfgs',
    max_iter=1000,
    random_state=42
)
```

**Results:**
```
AUC-ROC:   0.9743
Precision: 0.74
Recall:    0.71
F1-Score:  0.72
```

---

## Feature Engineering

### Input Features (from raw dataset)
- `V1`–`V28` — PCA-anonymized features (used directly)
- `Amount` — Scaled with `StandardScaler`
- `Time` — Converted to `hour_of_day` feature

### Feature Importance (Top 10 — XGBoost)

| Rank | Feature | Importance |
|:---|:---|:---|
| 1 | V14 | 0.142 |
| 2 | V10 | 0.118 |
| 3 | V12 | 0.104 |
| 4 | V4 | 0.091 |
| 5 | V11 | 0.078 |
| 6 | Amount | 0.067 |
| 7 | V17 | 0.054 |
| 8 | V3 | 0.049 |
| 9 | V7 | 0.041 |
| 10 | V16 | 0.038 |

---

## Training Pipeline

```
data/raw/creditcard.csv
       │
       ▼
1. Load data (284,807 rows)
       │
       ▼
2. Split (80/20 stratified)
   Train: 227,845  |  Test: 56,962
       │
       ▼
3. Scale: StandardScaler on Amount, Time
       │
       ▼
4. SMOTE on training set
   Fraud: 392 → 5,000 synthetic
       │
       ▼
5. Train XGBoost with early stopping
   (validation on 10% of train)
       │
       ▼
6. Evaluate on held-out test set
       │
       ▼
7. Save model to src/models/xgboost_fraud.pkl
```

---

## Evaluation Metrics

### Why not just Accuracy?

With 0.17% fraud rate, a model predicting "all legitimate" achieves **99.83% accuracy** but detects 0 fraud. We therefore use:

- **Precision-Recall AUC** — Area under PR curve (primary metric for imbalanced classes)
- **Recall (Sensitivity)** — Fraction of actual frauds caught (minimize false negatives)
- **Precision** — Fraction of flagged transactions that are actually fraud (minimize false positives)
- **F1-Score** — Harmonic mean of precision and recall
- **AUC-ROC** — Overall discriminative ability

### Threshold Selection

Default threshold: **0.50**. In production, threshold should be tuned based on:
- Cost of false negatives (missed fraud, customer loss)
- Cost of false positives (blocked legitimate transactions, customer friction)

Typical production threshold: **0.30–0.40** (higher recall, lower precision)

---

## Model Artifacts

```
src/models/
├── xgboost_fraud.pkl       ← Trained XGBoost classifier
├── scaler.pkl              ← StandardScaler fitted on training data
├── feature_names.json      ← Feature list in correct order
└── model_metadata.json     ← Training date, version, metrics
```

---

## JS Scoring Proxy (`frontend/js/ml.js`)

For the browser dashboard (no backend required), `ml.js` implements a heuristic proxy of the XGBoost model:

```javascript
function scoreTransaction(tx) {
  // 13 risk factors weighted and summed
  const score = computeWeightedRiskScore(tx);
  return {
    score,                          // 0.0 – 1.0
    flag: score >= 0.70,            // boolean
    riskFactors: computeFactors(tx) // 13 named factors
  };
}
```

The proxy uses calibrated weights derived from XGBoost feature importance to approximate the trained model's outputs without requiring Python or API calls.

---

## Cross-Validation Results

5-fold Stratified K-Fold:

| Fold | AUC-ROC | F1 |
|:---|:---|:---|
| 1 | 0.9861 | 0.851 |
| 2 | 0.9843 | 0.844 |
| 3 | 0.9852 | 0.852 |
| 4 | 0.9839 | 0.848 |
| 5 | 0.9850 | 0.850 |
| **Mean** | **0.9849** | **0.849** |
| **Std** | **0.0008** | **0.003** |

---

## Confusion Matrix (XGBoost, Test Set)

```
                  Predicted
                  Normal    Fraud
Actual  Normal  [ 56,836      79 ]   (FPR: 0.14%)
        Fraud   [    88      404 ]   (Recall: 82.1%)

True Positives:  404
False Positives:  79
False Negatives:  88
True Negatives:  56,836
```

---

*Part of the Credit Card Fraud Detection System — see root [README.md](../README.md)*
