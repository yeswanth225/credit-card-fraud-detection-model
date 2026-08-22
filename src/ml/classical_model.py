"""Classical machine learning model training and inference."""
import xgboost as xgb
import pandas as pd
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
from sklearn.model_selection import cross_val_score
import shap
import joblib
from pathlib import Path
from typing import Dict, Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FraudClassifier:
    """XGBoost-based fraud classifier with SHAP explanations."""

    def __init__(
        self,
        feature_names: list,
        random_state: int = 42,
        n_estimators: int = 100,
        max_depth: int = 6,
        learning_rate: float = 0.1,
        scale_pos_weight: float = None,
        threshold: float = 0.5,
    ):
        """
        Initialize the fraud classifier.

        Args:
            feature_names: List of feature names
            random_state: Random seed
            n_estimators: Number of trees
            max_depth: Maximum tree depth
            learning_rate: Learning rate
            scale_pos_weight: Weight for positive class (for imbalance)
            threshold: Decision threshold for classification
        """
        self.feature_names = feature_names
        self.random_state = random_state
        self.threshold = threshold

        # Initialize XGBoost classifier
        self.model = xgb.XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            random_state=random_state,
            use_label_encoder=False,
            eval_metric="logloss",
            scale_pos_weight=scale_pos_weight,
        )

        self.is_trained = False

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray = None,
        y_val: np.ndarray = None,
        verbose: bool = True,
    ):
        """
        Train the XGBoost model.

        Args:
            X_train: Training features
            y_train: Training targets (0 = legitimate, 1 = fraud)
            X_val: Validation features (optional)
            y_val: Validation targets (optional)
            verbose: Whether to print training progress

        Returns:
            Dictionary with training metrics
        """
        if verbose:
            logger.info(f"Training XGBoost model with {len(self.feature_names)} features...")

        # Convert to DMatrix for XGBoost
        dtrain = xgb.DMatrix(X_train, label=y_train)

        # Training params
        params = {"objective": "binary:logistic"}

        if verbose:
            evals_result = {}
            self.model.train(
                params,
                dtrain,
                num_boost_round=1000,
                evals=[(dtrain, "train")],
                early_stopping_rounds=30 if X_val is not None else None,
                evals_result=evals_result if X_val is None else None,
            )

            if X_val is not None and y_val is not None:
                dval = xgb.DMatrix(X_val, label=y_val)
                self.model.train(
                    params,
                    dtrain,
                    num_boost_round=1000,
                    evals=[(dtrain, "train"), (dval, "eval")],
                    early_stopping_rounds=30,
                )
        else:
            self.model.fit(X_train, y_train)

        # Store training metrics
        metrics = self._compute_metrics(X_train, y_train, prefix="train")
        metrics["n_features"] = len(self.feature_names)

        self.is_trained = True

        if verbose:
            logger.info("Training complete!")
            logger.info(f"  N_features: {self.feature_names}")
            logger.info(f"  Threshold: {self.threshold}")
            logger.info(f"  Metrics: {metrics}")

        return metrics

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions.

        Args:
            X: Features

        Returns:
            (predictions, probabilities)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions.")

        dtest = xgb.DMatrix(X)
        probabilities = self.model.predict(dtest)
        predictions = (probabilities >= self.threshold).astype(int)

        return predictions, probabilities

    def _compute_metrics(
        self,
        X: np.ndarray,
        y: np.ndarray,
        prefix: str = "",
    ) -> Dict[str, float]:
        """
        Compute evaluation metrics.

        Args:
            X: Features
            y: True labels
            prefix: Prefix for metric keys

        Returns:
            Dictionary of metrics
        """
        predictions, probabilities = self.predict(X)

        # Check if we have at least one positive class
        if y.sum() > 0:
            auc_pr = average_precision_score(y, probabilities)
            precision = precision_score(y, predictions, zero_division=0)
            recall = recall_score(y, predictions, zero_division=0)
            f1 = f1_score(y, predictions, zero_division=0)
        else:
            auc_pr = 0.0
            precision = 0.0
            recall = 0.0
            f1 = 0.0

        accuracy = accuracy_score(y, predictions)
        auc_roc = roc_auc_score(y, probabilities) if len(np.unique(y)) > 1 else 0.0

        metrics = {
            f"{prefix}precision": precision,
            f"{prefix}recall": recall,
            f"{prefix}f1": f1,
            f"{prefix}accuracy": accuracy,
            f"{prefix}auc_roc": auc_roc,
            f"{prefix}auc_pr": auc_pr,
            f"{prefix}n_samples": len(y),
            f"{prefix}n_positive": y.sum(),
            f"{prefix}n_negative": (y == 0).sum(),
        }

        return metrics

    def evaluate(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray,
        verbose: bool = True,
    ) -> Dict[str, float]:
        """
        Evaluate the model on test data.

        Args:
            X_test: Test features
            y_test: Test targets
            verbose: Whether to print detailed report

        Returns:
            Dictionary with all metrics
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before evaluation.")

        predictions, probabilities = self.predict(X_test)

        # Compute metrics
        train_metrics = self._compute_metrics(X_test, y_test, prefix="test")
        test_metrics = train_metrics.copy()

        # Confusion matrix
        cm = confusion_matrix(y_test, predictions)
        test_metrics["test_confusion_matrix"] = cm.tolist()

        # Detailed classification report
        if verbose:
            print("\n" + "=" * 50)
            print("Classification Report (Test Set)")
            print("=" * 50)
            print(classification_report(y_test, predictions, target_names=["Legitimate", "Fraud"]))

        # Feature importance
        feature_importance = self._get_feature_importance()
        test_metrics["feature_importance"] = feature_importance

        logger.info(f"Test PRC-AUC: {test_metrics['test_auc_pr']:.4f}")
        logger.info(f"Test Recall (Fraud): {test_metrics['test_recall']:.4f}")
        logger.info(f"Test Precision (Fraud): {test_metrics['test_precision']:.4f}")

        return test_metrics

    def _get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores."""
        importance = self.model.feature_importances_

        return {
            name: float(score) for name, score in zip(self.feature_names, importance)
        }

    def get_shap_values(self, X_sample: np.ndarray) -> np.ndarray:
        """
        Compute SHAP values for a sample of data.

        Uses TreeExplainer for maximum speed while providing accurate explanations.

        Args:
            X_sample: Sample of features to explain

        Returns:
            SHAP values array
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before computing SHAP values.")

        # Create explainer
        explainer = shap.TreeExplainer(self.model)
        shap_values = explainer.shap_values(X_sample)

        return shap_values

    def explain_single(self, X_sample: np.ndarray) -> Dict:
        """
        Explain a single prediction.

        Args:
            X_sample: Single sample to explain

        Returns:
            Dictionary with explanation details
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before explanation.")

        # Get prediction
        _, prob = self.predict(X_sample.reshape(1, -1))

        # Get SHAP values
        shap_values = self.get_shap_values(X_sample.reshape(1, -1))[0]

        # Get feature importance ranking
        feature_importance = self._get_feature_importance()
        sorted_indices = np.argsort(feature_importance.values())[::-1]
        top_features = [
            {
                "feature_name": self.feature_names[i],
                "importance": feature_importance[self.feature_names[i]],
                "shap_value": float(shap_values[i]),
            }
            for i in sorted_indices[:10]
        ]

        # Natural language summary
        positive_features = [f for f in top_features if f["shap_value"] > 0]
        negative_features = [f for f in top_features if f["shap_value"] < 0]

        summary_parts = []
        if positive_features:
            summary_parts.append(
                "Flagged due to high confidence in fraud features: "
                + ", ".join([f["feature_name"] for f in positive_features[:3]])
            )
        if negative_features:
            summary_parts.append(
                "Not flagged due to presence of safety features: "
                + ", ".join([f["feature_name"] for f in negative_features[:3]])
            )

        explanation = {
            "probability": float(prob[0]),
            "prediction_class": int(prob[0] >= self.threshold),
            "confidence": float(prob[0]) if prob[0] >= self.threshold else 1.0 - float(prob[0]),
            "shap_values": {f["feature_name"]: f["shap_value"] for f in top_features},
            "top_features": top_features,
            "simple_explanation": " ".join(summary_parts[:2]) if summary_parts else "No clear pattern detected.",
        }

        return explanation

    def save_model(self, filepath: str):
        """
        Save model to file.

        Args:
            filepath: Path to save model
        """
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)

        model_data = {
            "model": self.model,
            "feature_names": self.feature_names,
            "threshold": self.threshold,
            "random_state": self.random_state,
        }

        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath: str):
        """
        Load model from file.

        Args:
            filepath: Path to model file
        """
        model_data = joblib.load(filepath)
        self.model = model_data["model"]
        self.feature_names = model_data["feature_names"]
        self.threshold = model_data["threshold"]
        self.random_state = model_data["random_state"]
        self.is_trained = True

        logger.info(f"Model loaded from {filepath}")


def main():
    """Demo of the fraud classifier."""
    from data_preprocessor import FraudDataPreprocessor

    # Load and preprocess data
    preprocessor = FraudDataPreprocessor(random_state=42, test_size=0.2, smote_ratio=0.5)

    try:
        # Load data
        X, y = preprocessor.load_data()

        # Split
        X_train, y_train, X_test, y_test = preprocessor.split_train_test(X, y)

        # Scale
        X_train_scaled, X_test_scaled = preprocessor.scale_features(X_train, X_test)

        # Oversample
        X_resampled, y_resampled = preprocessor.oversample_minority(X_train_scaled, y_train)

        # Compute scale_pos_weight for imbalance handling
        neg_count = (y_resampled == 0).sum()
        pos_count = y_resampled.sum()
        scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0

        # Train classifier
        classifier = FraudClassifier(
            feature_names=preprocessor.get_feature_importance_names(),
            random_state=42,
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            scale_pos_weight=scale_pos_weight,
            threshold=0.5,
        )

        metrics = classifier.train(
            X_resampled,
            y_resampled,
            X_test_scaled,
            y_test,
            verbose=True,
        )

        # Evaluate
        test_metrics = classifier.evaluate(X_test_scaled, y_test, verbose=True)

        # Save model
        classifier.save_model("data/processed/classical_model.joblib")

        # Explain a sample
        sample_idx = 0
        explanation = classifier.explain_single(X_test_scaled[sample_idx])

        print("\n" + "=" * 50)
        print("Example Explanation (Test Sample)")
        print("=" * 50)
        print(f"Prediction: {'Fraud' if explanation['prediction_class'] == 1 else 'Legitimate'}")
        print(f"Probability: {explanation['probability']:.4f}")
        print(f"Explaination: {explanation['simple_explanation']}")
        print("\nTop features:")
        for i, feature in enumerate(explanation["top_features"][:5], 1):
            print(f"  {i}. {feature['feature_name']} (SHAP: {feature['shap_value']:.4f})")

    except FileNotFoundError as e:
        print(f"\nData file not found: {e}")
        print("Run data preprocessing first or add the real data file.")
    except Exception as e:
        print(f"\nError: {e}")


if __name__ == "__main__":
    main()