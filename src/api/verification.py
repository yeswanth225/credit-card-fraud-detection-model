"""Verification endpoint for processing new transactions with classical and quantum models."""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import numpy as np
import warnings
from .analyst import get_model_data
from ..ml.quantum_model import predict_quantum, get_quantum_model_info

router = APIRouter()


class TransactionInput(BaseModel):
    """Input transaction data."""
    amount: float = Field(default=100.0, description="Transaction amount")
    time_delta: float = Field(default=0.0, description="Seconds elapsed since reference")
    features: Dict[str, float] = Field(default_factory=dict, description="Feature dictionary e.g. {'V1': 0.0, ..., 'V28': 0.0}")


class SHAPExplanation(BaseModel):
    """SHAP-based explanation."""
    feature: str
    shap_value: float
    original_value: float


class PredictionResponse(BaseModel):
    """Prediction with explanations."""
    transaction_id: str
    is_fraud_classical: bool
    fraud_probability_classical: float
    confidence_classical: float
    is_fraud_quantum: Optional[bool] = None
    fraud_probability_quantum: Optional[float] = None
    confidence_quantum: Optional[float] = None
    explanation_classical: Dict
    explanation_quantum: Optional[Dict] = None
    model_agreement: Optional[bool] = None
    recommendation: str

    class Config:
        from_attributes = True


class BatchPredictionResponse(BaseModel):
    """Batch prediction response."""
    results: List[PredictionResponse]
    summary: Dict

    class Config:
        from_attributes = True


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    transaction: TransactionInput,
    use_quantum: bool = Query(False, description="Whether to also run quantum model"),
):
    """
    Predict fraud status for a single transaction using classical (and optionally quantum) models.

    The classical model uses all 30 features trained on the real European dataset.
    The quantum model uses 4 selected features (V14, V4, V12, V8) on a 4-qubit circuit.
    """
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

        # Classical prediction
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            X_scaled = scaler.transform(X_raw)

            if hasattr(model, "predict_proba"):
                prob_classical = float(model.predict_proba(X_scaled)[0, 1])
            else:
                import xgboost as xgb
                dmatrix = xgb.DMatrix(X_scaled)
                prob_classical = float(model.predict(dmatrix)[0])

        is_fraud_classical = prob_classical >= 0.70  # Phase 1 validated optimal threshold
        confidence_classical = max(prob_classical, 1.0 - prob_classical)

        # Feature contributions for classical model
        importances = getattr(model, "feature_importances_", None)
        classical_features = []
        if importances is not None and len(importances) == len(feature_cols):
            sorted_idx = np.argsort(importances)[::-1]
            for idx in sorted_idx[:5]:
                col_name = feature_cols[idx]
                classical_features.append({
                    "feature": col_name,
                    "importance": float(importances[idx]),
                    "value": float(row_vals[idx]),
                })

        explanation_classical = {
            "model": "XGBoost (30 Features)",
            "threshold": 0.70,
            "decision": "Fraudulent" if is_fraud_classical else "Legitimate",
            "probability": prob_classical,
            "top_features": classical_features,
            "confidence": confidence_classical,
            "training_samples": 227845,
        }

        # Quantum prediction (if requested)
        is_fraud_quantum = None
        prob_quantum = None
        confidence_quantum = None
        explanation_quantum = None
        model_agreement = None

        if use_quantum:
            is_fraud_quantum, prob_quantum, explanation_dict = predict_quantum(
                X_raw, scaler, model_type="qsvc", threshold=0.5
            )
            if "error" not in explanation_dict:
                confidence_quantum = max(prob_quantum, 1.0 - prob_quantum)
                explanation_quantum = {
                    **explanation_dict,
                    "confidence": confidence_quantum,
                    "training_samples": 150,
                }
                model_agreement = is_fraud_classical == is_fraud_quantum

        # Generate recommendation
        if model_agreement is False:
            recommendation = "⚠️ Model disagreement detected. Manual review recommended."
        elif is_fraud_classical:
            recommendation = "🚨 BLOCK: High fraud confidence from classical model."
        else:
            recommendation = "✅ APPROVE: Transaction appears legitimate."

        return PredictionResponse(
            transaction_id=f"tx_{np.random.randint(100000, 999999)}",
            is_fraud_classical=is_fraud_classical,
            fraud_probability_classical=round(prob_classical, 4),
            confidence_classical=round(confidence_classical, 4),
            is_fraud_quantum=is_fraud_quantum,
            fraud_probability_quantum=round(prob_quantum, 4) if prob_quantum is not None else None,
            confidence_quantum=round(confidence_quantum, 4) if confidence_quantum is not None else None,
            explanation_classical=explanation_classical,
            explanation_quantum=explanation_quantum,
            model_agreement=model_agreement,
            recommendation=recommendation,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@router.post("/batch-predict", response_model=BatchPredictionResponse)
async def batch_predict(
    transactions: List[TransactionInput],
    use_quantum: bool = Query(False, description="Whether to also run quantum model"),
):
    """
    Predict fraud status for multiple transactions.

    Returns aggregated statistics and per-transaction predictions.
    """
    if not transactions:
        raise HTTPException(status_code=400, detail="Transaction list cannot be empty")

    results = []
    fraud_count = 0
    quantum_agreement_count = 0

    for tx in transactions:
        result = await predict(tx, use_quantum=use_quantum)
        results.append(result)

        if result.is_fraud_classical:
            fraud_count += 1
        if result.model_agreement is not None and result.model_agreement:
            quantum_agreement_count += 1

    summary = {
        "total_transactions": len(transactions),
        "flagged_fraud": fraud_count,
        "fraud_rate": round(fraud_count / len(transactions) * 100, 2) if transactions else 0,
        "avg_confidence": round(
            np.mean([r.confidence_classical for r in results]), 4
        ),
    }

    if use_quantum:
        summary["quantum_agreement_rate"] = round(
            quantum_agreement_count / len(transactions) * 100, 2
        ) if transactions else 0

    return BatchPredictionResponse(results=results, summary=summary)


@router.get("/model-info")
async def get_model_info():
    """Get information about available models and benchmark status."""
    quantum_info = get_quantum_model_info()

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
                "fpr": 0.00014,
            },
            "training_samples": 227845,
            "test_samples": 56962,
        },
        "quantum_models": quantum_info,
        "features_selected": {
            "classical": list(range(1, 29)) + ["Time", "Amount"],
            "quantum": ["V14", "V4", "V12", "V8"],
        },
        "note": "Classical model uses full 30-feature pipeline. Quantum models use 4-feature subset on 4-qubit circuits.",
    }


@router.get("/health")
async def health():
    """Health check for verification service."""
    data = get_model_data()
    quantum_info = get_quantum_model_info()

    return {
        "status": "healthy",
        "classical_model": "loaded" if data.get("model") is not None else "error",
        "quantum_models": "available" if quantum_info.get("available") else "not_loaded",
        "database": "ready",
    }
