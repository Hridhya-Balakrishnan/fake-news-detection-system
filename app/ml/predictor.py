"""
Model Inference Service for Real-Time Article Authenticity Prediction.
"""

import joblib
from typing import Dict, Any
from app.config import MODEL_PATH, VECTORIZER_PATH, ACADEMIC_DISCLAIMER
from app.ml.preprocessor import combine_title_and_text

class NewsPredictor:
    """
    Service class providing model loading, text vectorization, and probabilistic inference.
    """
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self._is_loaded = False
        self.load_artifacts()

    def load_artifacts(self) -> bool:
        """
        Loads saved model and vectorizer binaries from disk.
        """
        if MODEL_PATH.exists() and VECTORIZER_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                self.vectorizer = joblib.load(VECTORIZER_PATH)
                self._is_loaded = True
                return True
            except Exception as e:
                print(f"[ERROR] Failed to load model artifacts: {e}")
                self._is_loaded = False
                return False
        return False

    def predict(self, title: str, text: str) -> Dict[str, Any]:
        """
        Predicts authenticity label and probabilistic confidence score.
        """
        if not self._is_loaded:
            loaded = self.load_artifacts()
            if not loaded:
                raise RuntimeError("Model artifacts not loaded. Please train the model first by running 'python -m app.ml.train'.")

        processed_input = combine_title_and_text(title, text)
        if not processed_input:
            # Fallback for empty text inputs
            return {
                "prediction": "Uncertain / Insufficient Text",
                "confidence": 50.0,
                "prob_fake": 0.50,
                "prob_genuine": 0.50,
                "disclaimer": ACADEMIC_DISCLAIMER
            }

        # Transform via TF-IDF vectorizer
        tfidf_features = self.vectorizer.transform([processed_input])

        # Get class probabilities [P(Genuine), P(Fake)]
        probabilities = self.model.predict_proba(tfidf_features)[0]
        prob_genuine = float(probabilities[0])
        prob_fake = float(probabilities[1])

        # Determine label and confidence score
        if prob_fake >= 0.50:
            prediction_label = "Likely Fake"
            confidence_score = prob_fake * 100.0
        else:
            prediction_label = "Likely Genuine"
            confidence_score = prob_genuine * 100.0

        return {
            "prediction": prediction_label,
            "confidence": round(confidence_score, 1),
            "prob_fake": round(prob_fake, 4),
            "prob_genuine": round(prob_genuine, 4),
            "disclaimer": ACADEMIC_DISCLAIMER
        }

# Global singleton predictor instance
predictor_instance = NewsPredictor()
