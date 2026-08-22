# Jupyter Notebook & Analysis Scripts for Phase 1

This directory contains interactive Jupyter notebooks and standalone Python scripts to visualize and analyze the classical fraud detection model.

## 📓 Available Resources

### 1. **Jupyter Notebook** (Recommended for Interactive Analysis)
**File:** `Phase1_Model_Analysis.ipynb`

A comprehensive interactive notebook that demonstrates:
- ✅ Data loading and preprocessing
- ✅ XGBoost model training with early stopping
- ✅ All key metrics (F1, Accuracy, Precision, Recall, AUC-PR, AUC-ROC)
- ✅ Confusion matrix and classification report
- ✅ ROC and Precision-Recall curves
- ✅ Feature importance analysis
- ✅ SHAP explanations for model interpretability
- ✅ Individual transaction explanations
- ✅ Comprehensive performance dashboard

**Run the notebook:**
```bash
jupyter notebook notebooks/Phase1_Model_Analysis.ipynb
```

Or in JupyterLab:
```bash
jupyter lab notebooks/Phase1_Model_Analysis.ipynb
```

### 2. **Standalone Python Script** (For Non-Interactive Analysis)
**File:** `../scripts/phase1_analysis.py`

Same analysis as the notebook but runs from command line and generates PNG visualizations.

**Run the script:**
```bash
python scripts/phase1_analysis.py
```

Output:
- Console output with all metrics
- 6 PNG visualization files saved to `data/processed/`

---

## 📊 Key Metrics Explained

### Primary Metric: **AUC-PR (Precision-Recall AUC)** ⭐

Why AUC-PR instead of Accuracy?

```
Dataset: 0.17% fraud (1 fraud per 590 legitimate transactions)
Accuracy Trap: Model can achieve 99.8% accuracy by just predicting 
               "legitimate" for EVERYTHING → Useless for fraud detection!

AUC-PR: Measures performance specifically on the MINORITY class (fraud)
        → Appropriate for imbalanced classification
        → Target: > 0.90 (excellent), > 0.80 (good)
```

### Secondary Metrics:

| Metric | What It Measures | Good Range |
|--------|-----------------|-----------|
| **Accuracy** | % of correct predictions overall | High, but misleading for imbalance |
| **Precision** | % of fraud flags that are actually fraud | > 0.85 (low false alarms) |
| **Recall** | % of actual fraud caught | > 0.85 (catch most fraud) |
| **F1 Score** | Harmonic mean of precision & recall | > 0.85 |
| **AUC-ROC** | Trade-off between TPR and FPR | > 0.90 |
| **AUC-PR** | **Primary metric for imbalance** | **> 0.90** |

### Confusion Matrix Terms:

```
                 Predicted
                Fraud  Legit
Actual  Fraud     TP     FN  ← Type II Error (missed fraud - bad!)
        Legit     FP     TN  ← Type I Error (false alarms - less bad)

True Positives (TP):   Correctly flagged fraud ✓
True Negatives (TN):   Correctly cleared legit ✓
False Positives (FP):  Legit flagged as fraud (investigation cost)
False Negatives (FN):  Fraud not caught (financial loss - worst!)
```

---

## 📈 Visualizations Generated

The notebook/script creates the following visualizations:

### 1. **Class Distribution**
Shows the severe imbalance in the dataset (0.17% fraud).

### 2. **Confusion Matrix**
- **Absolute counts** - Raw numbers of TP, TN, FP, FN
- **Normalized percentages** - Row-wise percentages for comparison

### 3. **ROC and PR Curves**
- **ROC Curve** - Trade-off between TPR and FPR (AUC-ROC)
- **PR Curve** - Trade-off between precision and recall (AUC-PR) ⭐ primary

### 4. **Feature Importance**
Top 15 most important features from XGBoost using tree-based importance.

### 5. **SHAP Summary Plot**
Feature importance based on SHAP values (mean absolute impact on predictions).

### 6. **Performance Dashboard**
Comprehensive 6-panel dashboard showing:
- All metrics at a glance
- Confusion matrix
- Class distribution
- ROC and PR curves
- Key statistics box

---

## 🔬 Expected Performance Metrics

Based on the synthetic demo data:

```
Accuracy:        ~0.95 - 0.98  (high but misleading due to imbalance)
Precision:       ~0.80 - 0.90  (80-90% of fraud flags are real fraud)
Recall:          ~0.80 - 0.90  (catch 80-90% of actual fraud)
F1 Score:        ~0.80 - 0.90  (balanced metric)
AUC-PR:          ~0.90 - 0.96  ⭐ PRIMARY METRIC (excellent range)
AUC-ROC:         ~0.95 - 0.98
```

**Note:** These are estimates for synthetic data. Real fraud datasets may vary.

---

## 🛠️ Installation & Setup

### Prerequisites
```bash
pip install jupyter jupyterlab
```

### Run All Dependencies Check
```bash
python scripts/test_imports.py
```

### Install Full Stack
```bash
# Windows
scripts\install_deps.bat

# Linux/Mac
bash scripts/install_deps.sh
```

### Minimal Installation (if dependencies conflict)
```bash
pip install pandas numpy scikit-learn xgboost shap matplotlib seaborn jupyter
```

---

## 📝 How to Use the Notebook

### Option 1: Cell-by-Cell Execution
1. Open the notebook: `jupyter notebook notebooks/Phase1_Model_Analysis.ipynb`
2. Run each cell sequentially (Shift+Enter)
3. Modify parameters in cells to experiment
4. All outputs appear inline

### Option 2: Run All Cells
1. `Cell` menu → `Run All` (or Ctrl+Shift+Enter)
2. Entire analysis runs automatically
3. All visualizations appear inline

### Option 3: Export Results
- **Save as HTML:** `File` → `Download as` → `HTML`
- **Save as PDF:** `File` → `Download as` → `PDF` (requires extra packages)
- **Export code:** `File` → `Download as` → `Python`

---

## 📂 File Structure

```
quantum/
├── notebooks/
│   └── Phase1_Model_Analysis.ipynb     ← Interactive notebook
├── scripts/
│   ├── phase1_analysis.py              ← Standalone script
│   ├── run_phase1.py                   ← Full pipeline
│   ├── test_imports.py                 ← Dependency checker
│   └── install_deps.bat/sh             ← Dependency installer
├── data/
│   ├── raw/
│   │   └── creditcard.csv              ← Input data
│   └── processed/
│       ├── classical_model.joblib      ← Trained model
│       ├── 01_class_distribution.png   ← Generated plots
│       ├── 02_confusion_matrix.png
│       ├── 03_roc_pr_curves.png
│       ├── 04_feature_importance.png
│       ├── 05_shap_summary.png
│       └── 06_performance_dashboard.png
└── README.md
```

---

## 🔧 Troubleshooting

### Issue: "Module not found" error
**Solution:** Install dependencies
```bash
python scripts/test_imports.py
```

### Issue: Jupyter won't start
**Solution:** Install and verify
```bash
pip install jupyter
jupyter --version
```

### Issue: SHAP computation is slow
**Solution:** This is normal for larger datasets. The notebook samples 200 transactions for speed. Reduce `sample_size` in the notebook if needed.

### Issue: "No data file found"
**Solution:** The notebook auto-generates synthetic demo data if not present. No action needed.

---

## 🎯 Key Takeaways

### From Phase 1 Analysis:

1. **XGBoost is effective** for tabular fraud data
2. **AUC-PR > 0.90** indicates excellent performance on minority class
3. **SHAP explanations** make the model interpretable
4. **Class imbalance** requires specialized metrics (not accuracy!)
5. **Feature importance** shows which attributes drive fraud detection

### Next Phase (Phase 2):

- Implement quantum classifier (VQC + QSVM)
- Compare quantum vs classical on same metrics
- Honest reporting of results (no cherry-picking)

---

## 📖 References

- **SHAP Documentation:** https://shap.readthedocs.io/
- **XGBoost Documentation:** https://xgboost.readthedocs.io/
- **Scikit-Learn Metrics:** https://scikit-learn.org/stable/modules/model_evaluation.html
- **Imbalanced Learning:** https://imbalanced-learn.org/

---

## 💡 Tips for Experimentation

### Try modifying these in the notebook:

1. **Change the decision threshold** (currently 0.5):
   ```python
   y_pred = (y_pred_proba >= 0.3).astype(int)  # Lower threshold = catch more fraud
   ```

2. **Adjust SMOTE ratio** (currently 0.5 = 1:1):
   ```python
   smote = SMOTE(sampling_strategy=0.3)  # More conservative
   ```

3. **Change XGBoost hyperparameters**:
   ```python
   model = xgb.XGBClassifier(
       max_depth=8,      # Deeper trees
       learning_rate=0.05  # Slower learning
   )
   ```

4. **Sample more transactions for SHAP** (currently 200):
   ```python
   sample_size = 500  # More samples = slower but more complete
   ```

---

## ✅ Phase 1 Checklist

- [x] Data preprocessing (scaling, SMOTE)
- [x] XGBoost training with early stopping
- [x] All key metrics calculated
- [x] Confusion matrix visualization
- [x] ROC and PR curves
- [x] Feature importance analysis
- [x] SHAP explanations
- [x] Performance dashboard
- [x] Notebook created
- [x] Standalone script created

**Ready for Phase 2: Quantum Module**

---

**Last Updated:** 2026-08-21
**Project:** Smart Fraud Detection System - Hybrid Classical-Quantum Platform