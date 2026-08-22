"""Verification endpoint for processing new transactions."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
import json

router = APIRouter()


class TransactionInput(BaseModel):
    """Input transaction data."""

    amount: float
    time_delta: float
    features: Dict[str, float]  # Feature name -> value


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
    """Predict fraud status for a single transaction."""
    # TODO: Integrate with actual ML pipeline
    return PredictionResponse(
        transaction_id="pending",
        is_fraud_classical=False,
        fraud_probability_classical=0.0,
        explanation_classical={"feature_importance": []},
    )


@router.post("/batch-predict", response_model=BatchPredictionResponse)
async def batch_predict(transactions: List[TransactionInput]):
    """Predict fraud status for multiple transactions."""
    results = [await predict(t) for t in transactions]
    return BatchPredictionResponse(results=results)


@router.get("/model-info")
async def get_model_info():
    """Get information about available models."""
    return {
        "classical_model": {
            "type": "XGBoost",
            "version": "0.1.0",
            "metrics": {"auc_pr": 0.0, "precision": 0.0, "recall": 0.0},
        },
        "quantum_model": {
            "type": "VQC",
            "version": "0.1.0",
            "status": "pending",
        },
    }