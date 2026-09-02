"""
Phase 2 — Classical 4-Feature Baseline (XGBoost-4F)
===================================================

Provides a scientifically fair classical baseline for Phase 2:
Instead of only comparing 4-qubit quantum models against a 30-feature
classical model trained on 227,845 samples, this module trains a classical
XGBoost model on the EXACT SAME 4 features (V14, V4, V12, V8).

This isolates two distinct variables:
  1. Dimensionality Effect: 30 Features vs 4 Features
  2. Model Architecture: Classical Trees vs Quantum Kernel (QSVC) vs Variational Circuit (VQC)
"""

from __future__ import annotations

import logging
import time
from typing import Dict, Optional, Tuple

import numpy as np
import xgboost as xgb

from .evaluation import compute_metrics, optimize_threshold_on_val

logger = logging.getLogger(__name__)


class Classical4FBaseline:
    """
    Classical XGBoost classifier trained on the exact same 4 features
    used by the quantum models.
    """

    def __init__(
        self,
        random_seed: int = 42,
        n_estimators: int = 100,
        max_depth: int = 4,
        learning_rate: float = 0.1,
    ):
        self.random_seed = random_seed
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.model: Optional[xgb.XGBClassifier] = None
        self.optimal_threshold: float = 0.5
        self.training_time_seconds: float = 0.0
        self.inference_time_seconds: float = 0.0

    def fit(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
    ) -> "Classical4FBaseline":
        """
        Train XGBoost on the 4-feature dataset and tune threshold on validation set.
        """
        neg = (y_train == 0).sum()
        pos = max(1, (y_train == 1).sum())
        scale_pos_weight = neg / pos

        self.model = xgb.XGBClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            learning_rate=self.learning_rate,
            scale_pos_weight=scale_pos_weight,
            random_state=self.random_seed,
            eval_metric="logloss",
            verbosity=0,
        )

        t0 = time.perf_counter()
        self.model.fit(X_train, y_train)
        self.training_time_seconds = round(time.perf_counter() - t0, 4)

        # Optimize decision threshold on validation set if provided
        if X_val is not None and y_val is not None and len(y_val) > 0:
            val_probs = self.model.predict_proba(X_val)[:, 1]
            self.optimal_threshold, val_f1 = optimize_threshold_on_val(y_val, val_probs)
            logger.info("XGBoost-4F optimal threshold on val: %.3f (val F1=%.4f)", self.optimal_threshold, val_f1)
        else:
            self.optimal_threshold = 0.5

        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict fraud probability."""
        if self.model is None:
            raise RuntimeError("Model not fitted. Call fit() first.")
        return self.model.predict_proba(X)[:, 1]

    def predict(self, X: np.ndarray, threshold: Optional[float] = None) -> np.ndarray:
        """Predict binary class using frozen optimal threshold."""
        thresh = threshold if threshold is not None else self.optimal_threshold
        probs = self.predict_proba(X)
        return (probs >= thresh).astype(int)

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict:
        """
        Evaluate on test set using frozen threshold.
        """
        t0 = time.perf_counter()
        probs = self.predict_proba(X_test)
        self.inference_time_seconds = round(time.perf_counter() - t0, 4)

        preds = (probs >= self.optimal_threshold).astype(int)
        metrics = compute_metrics(y_true=y_test, y_pred=preds, y_prob=probs)
        metrics["optimal_threshold"] = round(self.optimal_threshold, 3)
        metrics["training_time_seconds"] = self.training_time_seconds
        metrics["inference_time_seconds"] = self.inference_time_seconds
        return metrics
