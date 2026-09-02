"""
Quantum Machine Learning model service for Phase 2 integration.
Provides QSVC and VQC prediction interfaces compatible with FastAPI.
"""

import numpy as np
import joblib
import logging
from pathlib import Path
from typing import Dict, Tuple, Optional, List
import warnings

logger = logging.getLogger(__name__)

# Cache for loaded quantum models
_quantum_cache = {}


def get_quantum_models():
    """
    Load quantum models (QSVC, VQC) and supporting infrastructure.
    Uses lazy loading to avoid startup delay.
    """
    if "qsvc" in _quantum_cache:
        return _quantum_cache

    try:
        base_path = Path(__file__).resolve().parent.parent.parent / "phase2" / "quantum"

        # Try to load pre-trained quantum models
        qsvc_path = base_path / "qsvc_model.joblib"
        vqc_path = base_path / "vqc_model.joblib"
        scaler_quantum_path = base_path / "scaler_quantum.joblib"
        angle_scaler_path = base_path / "angle_scaler.joblib"

        models_loaded = False

        if qsvc_path.exists() and vqc_path.exists():
            try:
                _quantum_cache["qsvc"] = joblib.load(qsvc_path)
                _quantum_cache["vqc"] = joblib.load(vqc_path)
                models_loaded = True
                logger.info("Quantum models loaded from cache")
            except Exception as e:
                logger.warning(f"Failed to load cached quantum models: {e}")

        # Load scalers
        if scaler_quantum_path.exists():
            _quantum_cache["scaler_quantum"] = joblib.load(scaler_quantum_path)
        else:
            _quantum_cache["scaler_quantum"] = None

        if angle_scaler_path.exists():
            _quantum_cache["angle_scaler"] = joblib.load(angle_scaler_path)
        else:
            _quantum_cache["angle_scaler"] = None

        # Load feature selection
        feature_selection_path = base_path / "feature_selection.joblib"
        if feature_selection_path.exists():
            _quantum_cache["feature_indices"] = joblib.load(feature_selection_path)
        else:
            # Default quantum features: V14, V4, V12, V8 (indices 13, 3, 11, 7)
            _quantum_cache["feature_indices"] = [13, 3, 11, 7]

        _quantum_cache["available"] = models_loaded

    except Exception as e:
        logger.error(f"Error loading quantum models: {e}")
        _quantum_cache["available"] = False
        _quantum_cache["qsvc"] = None
        _quantum_cache["vqc"] = None

    return _quantum_cache


def predict_quantum(
    X_raw: np.ndarray,
    scaler: object,
    model_type: str = "qsvc",
    threshold: float = 0.5,
) -> Tuple[bool, float, Dict]:
    """
    Make prediction using quantum model (QSVC or VQC).

    Args:
        X_raw: Raw feature vector (30 features)
        scaler: Classical scaler for feature normalization
        model_type: "qsvc" or "vqc"
        threshold: Decision threshold

    Returns:
        (is_fraud, probability, explanation)
    """
    quantum = get_quantum_models()

    if not quantum.get("available"):
        return False, 0.5, {"error": "Quantum models not available"}

    try:
        # Extract 4 quantum features
        feature_indices = quantum.get("feature_indices", [13, 3, 11, 7])
        X_quantum_features = X_raw[:, feature_indices] if X_raw.ndim == 2 else X_raw[feature_indices]

        if X_raw.ndim == 1:
            X_quantum_features = X_quantum_features.reshape(1, -1)

        # Scale features
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            X_scaled = scaler.transform(X_quantum_features)

            # Angle encode if scaler available
            if quantum.get("angle_scaler"):
                X_angle = quantum["angle_scaler"].transform(X_scaled)
            else:
                # Simple rescale to [-π, π]
                X_angle = np.pi * (2 * X_scaled - 1)

        # Select model
        if model_type == "qsvc":
            model = quantum.get("qsvc")
            if model is None:
                return False, 0.5, {"error": "QSVC model not loaded"}
            prob = model.decision_function(X_angle)[0] if hasattr(model, 'decision_function') else model.predict_proba(X_angle)[0, 1]
        else:  # vqc
            model = quantum.get("vqc")
            if model is None:
                return False, 0.5, {"error": "VQC model not loaded"}
            prob = model.predict_proba(X_angle)[0, 1] if hasattr(model, 'predict_proba') else model.predict(X_angle)[0]

        # Ensure probability is in [0, 1]
        prob = float(np.clip(prob, 0.0, 1.0))
        is_fraud = prob >= threshold

        explanation = {
            "model": model_type.upper(),
            "probability": prob,
            "threshold": threshold,
            "decision": "Fraudulent" if is_fraud else "Legitimate",
            "features_used": ["V14", "V4", "V12", "V8"],
            "note": "Quantum model evaluated on 4-feature subset (Phase 2 benchmark)"
        }

        return is_fraud, prob, explanation

    except Exception as e:
        logger.error(f"Quantum prediction error: {e}")
        return False, 0.5, {"error": str(e), "model": model_type}


def get_quantum_model_info() -> Dict:
    """Get information about available quantum models."""
    quantum = get_quantum_models()

    return {
        "available": quantum.get("available", False),
        "qsvc": {
            "name": "Quantum Kernel SVM (Fidelity Kernel)",
            "features": 4,
            "qubits": 4,
            "loaded": quantum.get("qsvc") is not None,
            "metrics": {
                "pr_auc": 0.0333,
                "roc_auc": 0.8543,
                "recall": 1.0,
                "precision": 0.0106,
                "f1": 0.0211,
            }
        },
        "vqc": {
            "name": "Variational Quantum Classifier (RealAmplitudes)",
            "features": 4,
            "qubits": 4,
            "loaded": quantum.get("vqc") is not None,
            "metrics": {
                "pr_auc": 0.0152,
                "roc_auc": 0.6734,
                "recall": 0.0,
                "precision": 0.0,
                "f1": 0.0,
            }
        },
        "note": "Phase 2 quantum models evaluated on representative 150-sample benchmark with real dataset features V14, V4, V12, V8",
    }
