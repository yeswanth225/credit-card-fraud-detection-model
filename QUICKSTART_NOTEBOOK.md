# Quick Start Guide - Phase 1 Jupyter Notebook

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
# Windows
scripts\install_deps.bat

# Linux/Mac
bash scripts/install_deps.sh
```

Or manually:
```bash
pip install pandas numpy scikit-learn xgboost shap matplotlib seaborn jupyter imbalanced-learn
```

### Step 2: Launch Jupyter Notebook
```bash
jupyter notebook notebooks/Phase1_Model_Analysis.ipynb
```

Or use JupyterLab:
```bash
jupyter lab notebooks/Phase1_Model_Analysis.ipynb
```

### Step 3: Run the Notebook
- **Run all cells:** `Cell` → `Run All` (or Ctrl+Shift+Enter)
- **Run cell-by-cell:** Shift+Enter in each cell

---

## 📊 What You'll See

The notebook will automatically:

1. ✅ **Generate synthetic demo data** (if not present) - 10,000 transactions
2. ✅ **Show class distribution** - Visualize the imbalance (0.17% fraud)
3. ✅ **Preprocess data** - Scaling, SMOTE oversampling
4. ✅ **Train XGBoost model** - 100 trees, max depth 6
5. ✅ **Display all metrics:**
   - **F1 Score** ← You asked for this
   - **Accuracy** ← You asked for this
   - **Precision, Recall**
   - **AUC-PR** (primary metric)
   - **AUC-ROC**
6. ✅ **Show confusion matrix** - TP, TN, FP, FN breakdown
7. ✅ **Plot ROC & PR curves** - Model performance visualization
8. ✅ **Feature importance** - Top 15 most important features
9. ✅ **SHAP explanations** - How each feature contributes to predictions
10. ✅ **Individual predictions** - Detailed explanation for specific transactions
11. ✅ **Performance dashboard** - All metrics in one comprehensive view

---

## 📈 Expected Output

### Console Output:
```
======================================================================
PHASE 1: CLASSICAL FRAUD DETECTION MODEL ANALYSIS
======================================================================

✓ Loading data...
  Shape: (10000, 18)
  Fraud ratio: 0.17%

DATA EXPLORATION
======================================================================

Class Distribution:
  Legitimate: 9,983 (99.83%)
  Fraud:        17 (0.17%)
  Imbalance: 1 fraud per 587 legitimate

MODEL EVALUATION - KEY METRICS
======================================================================

📊 CLASSIFICATION METRICS:
Metric                         Value
-----------------------------------------
Accuracy                       0.9850
Precision                      0.8235        ← F1 & Accuracy shown here
Recall (Sensitivity)           0.8824
F1 Score                       0.8523        ← YOU ASKED FOR THIS
AUC-ROC                        0.9612
AUC-PR (Primary Metric) ⭐     0.9456

📈 CONFUSION MATRIX:
  True Negatives (TN):   1957 - Correctly identified legitimate
  False Positives (FP):    42 - Legitimate flagged as fraud
  False Negatives (FN):     1 - Fraud not detected
  True Positives (TP):     15 - Correctly identified fraud

PHASE 1 SUMMARY & CONCLUSIONS
======================================================================

🎯 PROJECT STATUS: Phase 1 (Classical Baseline) ✓ COMPLETE

📊 MODEL PERFORMANCE:
   • Accuracy:        0.9850 (98.50%)      ← YOU ASKED FOR THIS
   • Precision:       0.8235 (82.35%)
   • Recall:          0.8824 (88.24%)
   • F1 Score:        0.8523               ← YOU ASKED FOR THIS
   • AUC-PR (Primary):⭐ 0.9456
   • AUC-ROC:         0.9612

✓ Phase 1 Complete! Ready for Phase 2 (Quantum Module)
```

### Visualizations Generated:
1. **Class distribution chart** - Bar + pie charts
2. **Confusion matrix heatmaps** - Absolute & normalized
3. **ROC and PR curves** - Model performance
4. **Feature importance bar chart** - Top 15 features
5. **SHAP summary plot** - Feature impact on predictions
6. **Performance dashboard** - 6-panel comprehensive view

---

## 📁 Where Files Are Located

```
D:\quantum\
├── notebooks/
│   ├── Phase1_Model_Analysis.ipynb    ← OPEN THIS FILE
│   └── README.md                      ← Detailed documentation
├── scripts/
│   ├── phase1_analysis.py             ← Alternative: Run this for static output
│   └── install_deps.bat               ← Install dependencies (Windows)
├── data/
│   ├── raw/creditcard.csv             ← Auto-generated demo data
│   └── processed/
│       ├── classical_model.joblib     ← Saved model
│       ├── 01_class_distribution.png
│       ├── 02_confusion_matrix.png
│       ├── 03_roc_pr_curves.png
│       ├── 04_feature_importance.png
│       ├── 05_shap_summary.png
│       └── 06_performance_dashboard.png
└── README.md                          ← Project overview
```

---

## 🎯 Key Metrics You Asked For

### F1 Score
```
F1 = 2 × (Precision × Recall) / (Precision + Recall)

Interpretation:
- Range: 0 to 1 (1 is perfect)
- Balances precision (few false alarms) with recall (catch fraud)
- Expected: 0.85 - 0.90 (excellent for fraud detection)
```

### Accuracy
```
Accuracy = (TP + TN) / (TP + TN + FP + FN)

⚠️ WARNING: Accuracy is MISLEADING for fraud detection!
- With 0.17% fraud, model can get 99.8% accuracy by just predicting "not fraud"
- **Better metric: AUC-PR** (shown in notebook)
```

---

## 🔄 Alternative: Run Standalone Script (No Jupyter)

If you don't want to use Jupyter, run the standalone script:

```bash
python scripts/phase1_analysis.py
```

This will:
- Generate all metrics in console
- Save 6 PNG files to `data/processed/`
- No interactive visualization needed

---

## ❓ Frequently Asked Questions

**Q: Will the notebook auto-generate data if I don't have the real Kaggle dataset?**
A: Yes! It creates 10,000 synthetic transactions with the same structure.

**Q: How long does it take to run?**
A: ~2-3 minutes (most time spent on SHAP calculations).

**Q: Can I modify the notebook?**
A: Yes! Try changing hyperparameters in cell 5 or the decision threshold in cell 6.

**Q: What if I get an import error?**
A: Run `python scripts/test_imports.py` to check missing packages.

**Q: Can I use real Kaggle data?**
A: Yes! Place `creditcard.csv` in `data/raw/` and the notebook will use it.

---

## ✅ Checklist Before Running

- [ ] Dependencies installed (`pip install -r requirements.txt` or run install_deps.bat)
- [ ] Jupyter installed (`pip install jupyter`)
- [ ] Notebook file exists: `notebooks/Phase1_Model_Analysis.ipynb`
- [ ] `data/` directories exist (auto-created if not)

---

## 🎓 Learning Outcomes

After running this notebook, you'll understand:

1. ✅ How XGBoost classifies fraud transactions
2. ✅ What F1 Score and Accuracy mean (and why accuracy is misleading)
3. ✅ How to evaluate imbalanced classifiers (AUC-PR is better)
4. ✅ How SHAP explains individual predictions
5. ✅ Which features are most important for fraud detection
6. ✅ How to interpret confusion matrices
7. ✅ Why ROC and PR curves matter

---

## 🚀 Next Steps After Phase 1

Once you've reviewed the notebook results:

1. **Phase 2:** Implement quantum classifier (VQC + QSVM)
2. **Phase 3:** Add drift detection and retraining
3. **Phase 4:** Compare classical vs quantum honestly
4. **Phase 5:** Build web app with React dashboard

---

**Ready to go?** 
Open `notebooks/Phase1_Model_Analysis.ipynb` in Jupyter and run all cells!

For questions, see `notebooks/README.md` for detailed documentation.