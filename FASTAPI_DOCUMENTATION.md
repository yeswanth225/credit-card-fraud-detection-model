# FastAPI Backend — Complete Documentation

## Overview

The FastAPI backend provides a production-ready fraud detection API with:
- **Classical ML**: XGBoost (30 features, PR-AUC 0.8716)
- **Quantum ML**: QSVC & VQC (4 features, 4 qubits, Phase 2 benchmark)
- **Explainability**: SHAP values for all predictions
- **Data Persistence**: SQLAlchemy + SQLite/PostgreSQL
- **Real Dataset**: European Credit Card Fraud Detection (284,807 transactions)

---

## Quick Start

### 1. Start the FastAPI Server

```bash
cd D:/quantum
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Access the API

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **API Version**: http://localhost:8000/api/version

---

## API Endpoints

### Verification Endpoints (`/api/verification`)

#### `POST /api/verification/predict`
Predict fraud status for a single transaction.

**Request:**
```json
{
  "amount": 150.00,
  "time_delta": 3600.0,
  "features": {
    "V1": -1.359807,
    "V2": -0.072781,
    ...
    "V28": -0.021053
  },
  "use_quantum": false
}
```

**Response:**
```json
{
  "transaction_id": "tx_543210",
  "is_fraud_classical": false,
  "fraud_probability_classical": 0.23,
  "confidence_classical": 0.77,
  "is_fraud_quantum": null,
  "fraud_probability_quantum": null,
  "explanation_classical": {
    "model": "XGBoost (30 Features)",
    "threshold": 0.7,
    "decision": "Legitimate",
    "probability": 0.23,
    "top_features": [
      {
        "feature": "V4",
        "importance": 0.156,
        "value": 1.234
      }
    ],
    "confidence": 0.77,
    "training_samples": 227845
  },
  "recommendation": "APPROVE: Transaction appears legitimate."
}
```

#### `POST /api/verification/batch-predict`
Predict fraud for multiple transactions.

**Request:**
```json
{
  "transactions": [
    {
      "amount": 100.0,
      "time_delta": 0.0,
      "features": { ... }
    },
    ...
  ],
  "use_quantum": false
}
```

**Response:**
```json
{
  "results": [ ... ],
  "summary": {
    "total_transactions": 5,
    "flagged_fraud": 1,
    "fraud_rate": 20.0,
    "avg_confidence": 0.85
  }
}
```

#### `GET /api/verification/model-info`
Get information about available models.

#### `GET /api/verification/health`
Health check for verification service.

---

### Analyst Endpoints (`/api/analyst`)

#### `GET /api/analyst/transactions`
List transactions for review.

**Query Parameters:**
- `limit` (int, default=50, max=500): Number of transactions
- `skip` (int, default=0): Pagination offset
- `status` (str, optional): Filter by status (pending, approved, rejected, fraud)

**Response:**
```json
[
  {
    "id": "tx_000001",
    "merchant": "Merchant 1",
    "amount": 100.50,
    "timestamp": "2026-08-21T14:30:00Z",
    "fraud_score": 0.23,
    "status": "clear",
    "reviewed": false,
    "analyst_notes": null
  }
]
```

#### `GET /api/analyst/transactions/{transaction_id}`
Get detailed transaction information with SHAP explanations.

**Response:**
```json
{
  "id": "tx_000001",
  "amount": 100.50,
  "timestamp": "2026-08-21T14:30:00Z",
  "features": { "V1": -1.35, "V2": -0.07, ... },
  "model_verdict": "clear",
  "fraud_probability": 0.23,
  "confidence": 0.77,
  "shap_values": [
    {
      "feature": "V4",
      "value": 0.156,
      "base_value": 0.05
    }
  ],
  "explanation": "The model predicts legitimate based primarily on V4 decreasing the fraud score."
}
```

#### `GET /api/analyst/metrics`
Get model evaluation metrics (confusion matrix, ROC/PR curves).

**Response:**
```json
{
  "confusion_matrix": {
    "tn": 56890,
    "fp": 72,
    "fn": 595,
    "tp": 405
  },
  "roc_curve": {
    "fpr": [0.0, 0.001, 0.002, ...],
    "tpr": [0.0, 0.15, 0.30, ...],
    "auc": 0.9692
  },
  "pr_curve": {
    "precision": [1.0, 0.95, 0.90, ...],
    "recall": [0.0, 0.05, 0.10, ...]
  },
  "feature_importance": { "V4": 0.156, "V12": 0.142, ... },
  "metrics": {
    "accuracy": 0.999,
    "precision": 0.9111,
    "recall": 0.8367,
    "f1_score": 0.8723,
    "auc_roc": 0.9692,
    "pr_auc": 0.8716
  }
}
```

#### `POST /api/analyst/review/{transaction_id}`
Record analyst decision.

**Query Parameters:**
- `action` (str): "approve", "reject", or "flag"
- `notes` (str, optional): Analyst notes

---

### Admin Endpoints (`/api/admin`)

#### `GET /api/admin/`
Get admin dashboard statistics.

#### `GET /api/admin/models`
List all trained models.

#### `GET /api/admin/model-history/{model_id}`
Get version history for a model.

#### `GET /api/admin/benchmarks`
Get benchmark comparison between classical and quantum models.

**Response:**
```json
{
  "status": "success",
  "classical_model": {
    "model": "XGBoost (Phase 1 Baseline)",
    "auc_pr": 0.8716,
    "auc_roc": 0.9692,
    "features": 30,
    "training_samples": 227845
  },
  "quantum_models": {
    "QSVC": {
      "model": "Quantum Kernel SVM",
      "auc_pr": 0.0333,
      "auc_roc": 0.8543,
      "features": 4,
      "qubits": 4,
      "training_samples": 150
    },
    "VQC": {
      "model": "Variational Quantum Classifier",
      "auc_pr": 0.0152,
      "auc_roc": 0.6734,
      "features": 4,
      "qubits": 4
    }
  },
  "conclusion": {
    "has_quantum_advantage": false,
    "reasoning": "Classical XGBoost achieves superior PR-AUC..."
  }
}
```

#### `GET /api/admin/drift-monitor`
Get drift detection status.

#### `GET /api/admin/system-health`
Get overall system health.

---

## Request/Response Examples

### Example 1: Simple Fraud Check

```bash
curl -X POST http://localhost:8000/api/verification/predict \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500.0,
    "time_delta": 3600,
    "features": {
      "V1": 1.19, "V2": 0.26, "V3": 0.16, "V4": 0.44,
      "V5": -0.78, "V6": -0.63, "V7": -0.29, "V8": -0.06,
      "V9": 0.00, "V10": -0.79, "V11": 0.00, "V12": 0.00,
      "V13": 0.00, "V14": 0.00, "V15": 0.00, "V16": 0.00,
      "V17": 0.00, "V18": 0.00, "V19": 0.00, "V20": 0.00,
      "V21": 0.00, "V22": 0.00, "V23": 0.00, "V24": 0.00,
      "V25": 0.00, "V26": 0.00, "V27": 0.00, "V28": 0.00
    }
  }'
```

### Example 2: Batch Processing

```bash
curl -X POST http://localhost:8000/api/verification/batch-predict \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      { "amount": 100.0, "time_delta": 0, "features": { ... } },
      { "amount": 250.0, "time_delta": 3600, "features": { ... } }
    ],
    "use_quantum": false
  }'
```

### Example 3: Get Model Metrics

```bash
curl http://localhost:8000/api/analyst/metrics
```

---

## Database Models

### Transaction
Stores individual transaction predictions and analyst reviews.

**Fields:**
- `transaction_id` (String, unique)
- `amount` (Float)
- `time_delta` (Float)
- `features` (JSON)
- `is_fraud_classical` (Boolean)
- `fraud_probability_classical` (Float)
- `is_fraud_quantum` (Boolean, optional)
- `fraud_probability_quantum` (Float, optional)
- `status` (Enum: PENDING, APPROVED, REJECTED)
- `reviewed` (Boolean)
- `analyst_notes` (String)
- `created_at`, `updated_at` (DateTime)

### Experiment
Tracks model training and evaluation runs.

**Fields:**
- `experiment_id` (String, unique)
- `experiment_type` (String)
- `model_type` (String)
- `metrics` (auc_pr, precision, recall, f1, training_time, inference_latency)
- `drift_detected` (Boolean)

### DriftEvent
Monitors for data/model drift.

**Fields:**
- `event_id` (String, unique)
- `detected_at` (DateTime)
- `drift_type` (String)
- `affected_features` (JSON)
- `is_handled` (Boolean)

---

## Error Handling

### HTTP Status Codes

- **200**: Success
- **400**: Bad Request (validation error)
- **404**: Not Found (transaction not found)
- **422**: Unprocessable Entity (invalid input schema)
- **500**: Internal Server Error

### Error Response Format

```json
{
  "status": "error",
  "status_code": 400,
  "message": "Invalid transaction ID format",
  "detail": "Transaction not found",
  "timestamp": "2026-09-02T16:54:12.651Z"
}
```

---

## Authentication & Security

Currently, the API has no authentication layer. For production:

1. Add JWT bearer tokens via FastAPI security
2. Implement role-based access control (analyst, admin, public)
3. Use HTTPS/TLS for all communications
4. Add rate limiting per IP/user
5. Enable request signing for audit trails

---

## Performance Optimization

### Model Loading
- Classical model (30 features): Cached on startup, ~2.5ms inference
- Quantum models (4 features): Lazy-loaded, ~156ms (QSVC) / 234ms (VQC)

### Database
- SQLite for development, PostgreSQL recommended for production
- Indexes on `transaction_id`, `status`, `created_at`

### Batch Processing
- Max 500 transactions per request
- Async processing with semaphores for concurrency control

---

## Deployment

### Docker (Recommended)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost/fraud_db
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=false
CORS_ORIGINS=http://localhost:3000,https://app.example.com
```

---

## Testing

### Run Unit Tests

```bash
pytest tests/test_backend.py -v
```

### Run Integration Tests

```bash
pytest tests/ -v --cov=src
```

---

## Support & Monitoring

- **Logs**: Check console output or `/var/log/fraud-api.log`
- **Health**: GET /health endpoint
- **Metrics**: GET /api/admin/system-health
- **Drift**: GET /api/admin/drift-monitor

---

## Future Enhancements

1. **Model A/B Testing**: Shadow mode for new models
2. **Feature Store**: Centralized feature management
3. **Explainability UI**: Visual SHAP plots
4. **Real-time Alerts**: Kafka/Redis for fraud alerts
5. **Multi-tenant**: Isolation for multiple banks/merchants
6. **Hardware Quantum**: IBM Quantum or AWS Braket integration
