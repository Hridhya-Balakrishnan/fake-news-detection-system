"""
Integration tests for FastAPI endpoints.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "AI-Based Fake News Detection System" in response.text

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data

def test_predict_endpoint():
    payload = {
        "title": "NASA James Webb Space Telescope Observes Distant Spiral Galaxy",
        "text": "Astronomers today published new findings from the James Webb Space Telescope detailing light spectrum readings."
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] in ["Likely Genuine", "Likely Fake"]
    assert 0 <= data["confidence"] <= 100
    assert "disclaimer" in data

def test_predict_empty_payload_validation():
    payload = {
        "title": "   ",
        "text": "   "
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400

def test_get_history_endpoint():
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_metrics_endpoint():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
