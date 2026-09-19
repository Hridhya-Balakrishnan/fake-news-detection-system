"""
Unit tests for model predictor.
"""

from app.ml.predictor import NewsPredictor

def test_news_predictor_placeholder():
    predictor = NewsPredictor()
    result = predictor.predict("Sample Title", "Sample Body Text")
    assert "prediction" in result
    assert "confidence" in result
    assert "prob_fake" in result
    assert "prob_genuine" in result
