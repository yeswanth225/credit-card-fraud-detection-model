"""
Phase 2 — Fraud-Aware Evaluation Metrics
==========================================

WHY NOT USE ACCURACY FOR FRAUD DETECTION?
------------------------------------------
Credit card fraud is extremely rare: ~0.17% of all transactions.
This severe class imbalance makes accuracy a misleading metric:

    A model that ALWAYS predicts "legitimate" gets:
        Accuracy = 99.83%  ← looks excellent, but catches zero fraud!

Instead, we emphasise:

  PR-AUC (Primary)
      The area under the Precision-Recall curve.
      Measures trade-off between precision and recall at ALL thresholds.
      Captures model performance in the high-precision regime critical
      to real fraud detection (you don't want to block thousands of legit cards).

  Recall (Fraud Detection Rate)
      What fraction of actual fraud cases did we catch?
      A model with low recall misses many fraud cases.

  Precision
      Of all the transactions we flagged as fraud, how many were real fraud?
      Low precision → too many false alarms (frustrated customers).

  F1 Score
      Harmonic mean of precision and recall — balances both.

  ROC-AUC
      Area under the Receiver Operating Characteristic curve.
      Less informative than PR-AUC for imbalanced datasets, but included
      for completeness and comparison with Phase 1 numbers.

  False Positive Rate (FPR)
      Fraction of legitimate transactions incorrectly flagged as fraud.
      Critical for business impact: each false positive means a blocked
      card or manual review.
"""

from __future__ import annotations

from typing import Dict, Optional, Tuple

import numpy as np
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    accuracy_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report,
)


def compute_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None,
    threshold: float = 0.5,
) -> Dict:
    """
    Compute the full set of fraud-detection evaluation metrics.

    Parameters
    ----------
    y_true : np.ndarray, shape (n,)
        True binary labels (0=legitimate, 1=fraud).
    y_pred : np.ndarray, shape (n,)
        Predicted binary labels.
    y_prob : np.ndarray, shape (n,), optional
        Predicted probabilities for the positive (fraud) class.
        Required for ROC-AUC and PR-AUC computation.
    threshold : float
        Classification threshold used to produce y_pred (recorded for reference).

    Returns
    -------
    dict with keys:
        precision, recall, f1, accuracy, roc_auc, pr_auc,
        false_positive_rate, false_negative_rate,
        confusion_matrix, n_samples, n_fraud, n_legit, threshold
    """
    n_samples = len(y_true)
    n_fraud   = int(y_true.sum())
    n_legit   = n_samples - n_fraud

    # Classification metrics
    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall    = float(recall_score(y_true, y_pred, zero_division=0))
    f1        = float(f1_score(y_true, y_pred, zero_division=0))
    accuracy  = float(accuracy_score(y_true, y_pred))

    # Confusion matrix components
    cm = confusion_matrix(y_true, y_pred)
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
    else:
        # Edge case: only one class present in y_true
        tn, fp, fn, tp = 0, 0, 0, 0

    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    # Probability-based metrics (require y_prob)
    if y_prob is not None and len(np.unique(y_true)) > 1:
        roc_auc = float(roc_auc_score(y_true, y_prob))
        pr_auc  = float(average_precision_score(y_true, y_prob))
    else:
        roc_auc = float("nan")
        pr_auc  = float("nan")

    return {
        "precision":           precision,
        "recall":              recall,
        "f1":                  f1,
        "accuracy":            accuracy,
        "roc_auc":             roc_auc,
        "pr_auc":              pr_auc,
        "false_positive_rate": fpr,
        "false_negative_rate": fnr,
        "true_positives":      int(tp),
        "true_negatives":      int(tn),
        "false_positives":     int(fp),
        "false_negatives":     int(fn),
        "confusion_matrix":    cm.tolist(),
        "n_samples":           n_samples,
        "n_fraud":             n_fraud,
        "n_legit":             n_legit,
        "threshold":           threshold,
    }


def format_metrics_table(
    metrics: Dict,
    model_name: str = "Model",
    indent: int = 2,
) -> str:
    """
    Format a metrics dict as a human-readable table string.

    Parameters
    ----------
    metrics : dict
        Output of compute_metrics().
    model_name : str
        Label for the model being evaluated.
    indent : int
        Number of leading spaces.

    Returns
    -------
    str
    """
    pad = " " * indent
    lines = [
        "",
        f"{pad}{'=' * 58}",
        f"{pad}  Evaluation Results: {model_name}",
        f"{pad}{'=' * 58}",
        f"{pad}  Samples    : {metrics['n_samples']} "
        f"(fraud={metrics['n_fraud']}, legit={metrics['n_legit']})",
        f"{pad}  {'-' * 54}",
        f"{pad}  PR-AUC     : {_fmt(metrics['pr_auc'])}  <- PRIMARY METRIC",
        f"{pad}  ROC-AUC    : {_fmt(metrics['roc_auc'])}",
        f"{pad}  F1 Score   : {_fmt(metrics['f1'])}",
        f"{pad}  Precision  : {_fmt(metrics['precision'])}",
        f"{pad}  Recall     : {_fmt(metrics['recall'])}",
        f"{pad}  FPR        : {_fmt(metrics['false_positive_rate'])}",
        f"{pad}  Accuracy   : {_fmt(metrics['accuracy'])}",
        f"{pad}  {'-' * 54}",
        f"{pad}  Confusion Matrix:",
        f"{pad}    TP={metrics['true_positives']:4d}  FP={metrics['false_positives']:4d}",
        f"{pad}    FN={metrics['false_negatives']:4d}  TN={metrics['true_negatives']:4d}",
        f"{pad}{'=' * 58}",
    ]
    return "\n".join(lines)


def print_metrics(metrics: Dict, model_name: str = "Model") -> None:
    """Print formatted metrics to stdout."""
    print(format_metrics_table(metrics, model_name))


def compare_metrics(
    results: Dict[str, Dict],
    primary_metric: str = "pr_auc",
) -> None:
    """
    Print a side-by-side comparison table for multiple models.

    Parameters
    ----------
    results : dict
        Keys: model names; values: metric dicts from compute_metrics().
    primary_metric : str
        Metric to highlight as primary.
    """
    metric_keys = ["pr_auc", "roc_auc", "f1", "precision", "recall", "false_positive_rate"]
    col_w = 14

    header = f"{'Metric':<22}" + "".join(f"{name:>{col_w}}" for name in results)
    print("\n" + "=" * (22 + col_w * len(results)))
    print("  Benchmark Comparison")
    print("=" * (22 + col_w * len(results)))
    print(header)
    print("-" * (22 + col_w * len(results)))

    for key in metric_keys:
        row = f"{'  ' + key:<22}"
        vals = [results[name].get(key, float("nan")) for name in results]
        best_val = max((v for v in vals if not np.isnan(v)), default=None)
        for name, val in zip(results, vals):
            cell = _fmt(val)
            if val == best_val and best_val is not None:
                cell = f"[{cell}]"  # Highlight best
            row += f"{cell:>{col_w}}"
        if key == primary_metric:
            row += "  <- PRIMARY"
        print(row)

    print("=" * (22 + col_w * len(results)))
    print("  [value] = best per row\n")


def _fmt(val: float) -> str:
    """Format a float metric value for display."""
    if np.isnan(val):
        return "  N/A"
    return f"{val:.4f}"
