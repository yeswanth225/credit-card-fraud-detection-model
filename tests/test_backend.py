"""
Tests for the FastAPI backend — imports, startup, endpoints, and validation.
"""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    from src.api.main import app
    return TestClient(app)


def test_health_endpoint(client):
    """Backend health check must return 200 and {'status': 'healthy'}."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_endpoint(client):
    """Root endpoint returns API information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "status" in data


def test_api_docs_available(client):
    """OpenAPI docs should be reachable."""
    response = client.get("/docs")
    assert response.status_code == 200


def test_analyst_metrics_endpoint(client):
    """Analyst metrics endpoint should return model performance data without server errors."""
    response = client.get("/api/analyst/metrics")
    assert response.status_code != 500
    assert response.status_code in (200, 404, 422)


def test_analyst_transactions_endpoint(client):
    """Analyst transactions endpoint should be reachable without a server error."""
    response = client.get("/api/analyst/transactions")
    assert response.status_code != 500
    assert response.status_code in (200, 404, 422)


def test_verification_predict_endpoint(client):
    """Verify live prediction endpoint with sample transaction payload."""
    payload = {
        "amount": 250.0,
        "time_delta": 3600.0,
        "features": {"V1": -1.5, "V4": 2.1, "V14": -3.8}
    }
    response = client.post("/api/verification/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "is_fraud_classical" in data
    assert "fraud_probability_classical" in data
    assert 0.0 <= data["fraud_probability_classical"] <= 1.0
    assert "explanation_classical" in data


def test_verification_predict_validation_error(client):
    """Verify that invalid payload types return 422 Unprocessable Entity."""
    response = client.post("/api/verification/predict", json={"amount": "invalid_number"})
    assert response.status_code == 422


def test_verification_batch_predict(client):
    """Verify batch prediction endpoint."""
    batch = [
        {"amount": 50.0, "time_delta": 100.0, "features": {}},
        {"amount": 1500.0, "time_delta": 200.0, "features": {"V14": -5.0}}
    ]
    response = client.post("/api/verification/batch-predict", json=batch)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) == 2


def test_verification_model_info(client):
    """Verify model info returns valid architecture metadata."""
    response = client.get("/api/verification/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "classical_model" in data
    assert "quantum_model" in data


def test_admin_benchmarks_endpoint(client):
    """Verify admin benchmarks endpoint loads results correctly."""
    response = client.get("/api/admin/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert "conclusion" in data

