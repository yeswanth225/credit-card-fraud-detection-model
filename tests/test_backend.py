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
