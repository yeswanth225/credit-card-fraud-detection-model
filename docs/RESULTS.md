# Results

## Phase 1 — Classical XGBoost Baseline ✅ Complete

These are the **actual, verified results** from training on the real Kaggle credit card fraud dataset and evaluating on a held-out test set.

> All metrics below are from `data/processed/phase1_results.json`, confirmed against the model evaluation notebook.

---

### Test Set Metrics

Evaluation was performed on **56,962 transactions** (98 actual fraud cases) that were never seen during training or threshold tuning.

| Metric | Score |
|--------|-------|
| **PR-AUC** (primary metric) | **0.8716** |
| ROC-AUC | 0.9692 |
| F1 Score | 0.8723 |
| Precision | 0.9111 |
| Recall | 0.8367 |

Decision threshold: **0.70** (tuned on validation set, not test set)

> **Note on metric variation:** Slightly different numbers appear in different documents (README shows PR-AUC 0.8557 from an earlier run; PHASE1_FINAL_SUMMARY.txt shows 0.8716 from the tuned GridSearchCV run with threshold=0.70). The numbers above are from the tuned run with best hyperparameters (max_depth=7, lr=0.15). Use `data/processed/phase1_results.json` as the authoritative source.

---

### Confusion Matrix

| | Predicted: Legitimate | Predicted: Fraud |
|--|--:|--:|
| **Actual: Legitimate** | 56,856 (TN) | 8 (FP) |
| **Actual: Fraud** | 16 (FN) | 82 (TP) |

**What this means:**
- **82 fraud cases caught** out of 98 total → 83.7% recall
- **8 false alarms** out of 56,864 legitimate transactions → very high precision (91.1%)
- **16 missed fraud cases** → these are the main remaining risk

---

### Key Observations

- `V14` accounts for ~60% of XGBoost feature importance — it is by far the most discriminative feature
- The top 8 features together account for ~76.6% of cumulative importance
- The 8 quantum features (in order of importance): **V14, V4, V12, V8, V13, V20, V27, V18**
- The threshold of 0.70 (vs default 0.5) was tuned using GridSearchCV to maximize F1
- PR-AUC was used as the primary metric because ROC-AUC is misleading on severely imbalanced datasets
- SMOTE was unavailable in the final run; class weighting (`scale_pos_weight=577.29`) was used instead

---

### Dataset Split Used

| Split | Transactions | Fraud |
|-------|-------------|-------|
| Training | 170,883 | 295 |
| Validation | 56,962 | 99 |
| Test | 56,962 | 98 |

---

## Phase 2 — Quantum Models ⏳ Not Started

No quantum results exist yet. This section will be updated when VQC and QSVM experiments are completed.

| Metric | XGBoost (Phase 1) | VQC (Phase 2) | QSVM (Phase 2) |
|--------|:-----------------:|:-------------:|:--------------:|
| PR-AUC | 0.8557 | _pending_ | _pending_ |
| ROC-AUC | 0.9695 | _pending_ | _pending_ |
| F1 Score | 0.8541 | _pending_ | _pending_ |
| Precision | 0.9080 | _pending_ | _pending_ |
| Recall | 0.8061 | _pending_ | _pending_ |
| Training time | — | _pending_ | _pending_ |

> **Note:** Do not assume quantum will match or beat classical. The purpose of Phase 2 is to measure the gap honestly, not to claim quantum advantage in advance.
