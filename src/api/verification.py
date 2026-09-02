"""Verification endpoint for processing new transactions."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import numpy as np
import warnings
from .analyst import get_model_data

router = APIRouter()


class TransactionInput(BaseModel):
    """Input transaction data."""
    amount: float = Field(default=100.0, description="Transaction amount")
    time_delta: float = Field(default=0.0, description="Seconds elapsed since reference")
    features: Dict[str, float] = Field(default_factory=dict, description="Feature dictionary e.g. {'V1': 0.0, ..., 'V28': 0.0}")


class PredictionResponse(BaseModel):
    """Prediction with explanations."""
    transaction_id: str
    is_fraud_classical: bool
    fraud_probability_classical: float
    is_fraud_quantum: Optional[bool] = None
    fraud_probability_quantum: Optional[float] = None
    explanation_classical: Dict
    explanation_quantum: Optional[Dict] = None


class BatchPredictionResponse(BaseModel):
    """Batch prediction response."""
    results: List[PredictionResponse]


@router.post("/predict", response_model=PredictionResponse)
async def predict(transaction: TransactionInput):
    """Predict fraud status for a single transaction using the real trained Phase 1 XGBoost model."""
    try:
        data = get_model_data()
        model = data["model"]
        scaler = data["scaler"]

        # Build feature vector matching 30 features: V1-V28, Time, Amount
        feature_cols = [f"V{i}" for i in range(1, 29)] + ["Time", "Amount"]
        row_vals = []
        for col in feature_cols:
            if col == "Time":
                row_vals.append(float(transaction.time_delta))
            elif col == "Amount":
                row_vals.append(float(transaction.amount))
            else:
                row_vals.append(float(transaction.features.get(col, 0.0)))

        X_raw = np.array(row_vals).reshape(1, -1)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            X_scaled = scaler.transform(X_raw)

            if hasattr(model, "predict_proba"):
                prob = float(model.predict_proba(X_scaled)[0, 1])
            else:
                import xgboost as xgb
                dmatrix = xgb.DMatrix(X_scaled)
                prob = float(model.predict(dmatrix)[0])

        is_fraud = prob >= 0.70  # Phase 1 validated optimal threshold

        # Feature contributions
        importances = getattr(model, "feature_importances_", None)
        top_contribs = []
        if importances is not None and len(importances) == len(feature_cols):
            sorted_idx = np.argsort(importances)[::-1]
            for idx in sorted_idx[:5]:
                col_name = feature_cols[idx]
                top_contribs.append({
                    "feature": col_name,
                    "importance": float(importances[idx]),
                    "value": float(row_vals[idx]),
                })

        explanation = {
            "threshold": 0.70,
            "decision": "Fraudulent" if is_fraud else "Legitimate",
            "top_features": top_contribs,
            "feature_importance": [tc["feature"] for tc in top_contribs],
        }

        return PredictionResponse(
            transaction_id=f"tx_{np.random.randint(100000, 999999)}",
            is_fraud_classical=is_fraud,
            fraud_probability_classical=round(prob, 4),
            explanation_classical=explanation,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@router.post("/batch-predict", response_model=BatchPredictionResponse)
async def batch_predict(transactions: List[TransactionInput]):
    """Predict fraud status for multiple transactions."""
    if not transactions:
        raise HTTPException(status_code=400, detail="Transaction list cannot be empty")
    results = [await predict(t) for t in transactions]
    return BatchPredictionResponse(results=results)


@router.get("/model-info")
async def get_model_info():
    """Get information about available models and benchmark status."""
    return {
        "classical_model": {
            "type": "XGBoost (30 Features)",
            "version": "Phase 1 Production Baseline",
            "threshold": 0.70,
            "metrics": {
                "pr_auc": 0.8716,
                "roc_auc": 0.9692,
                "f1": 0.8723,
                "recall": 0.8367,
                "precision": 0.9111,
            },
        },
        "quantum_model": {
            "type": "QSVC + VQC (4 Features -> 4 Qubits)",
            "backend": "Local Qiskit Statevector Simulator",
            "features_selected": ["V14", "V4", "V12", "V8"],
            "status": "Benchmark Complete (Real Dataset)",
        },
    }