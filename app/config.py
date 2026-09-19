"""
Application Configuration and Constants.
"""

from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
APP_DIR = BASE_DIR / "app"
DATA_DIR = BASE_DIR / "data"
SAVED_MODELS_DIR = BASE_DIR / "saved_models"

# Database Configuration
DATABASE_PATH = BASE_DIR / "fakenews.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Model Paths
MODEL_PATH = SAVED_MODELS_DIR / "model.pkl"
VECTORIZER_PATH = SAVED_MODELS_DIR / "vectorizer.pkl"
METRICS_PATH = SAVED_MODELS_DIR / "metrics.json"

# Dataset Paths
RAW_DATA_PATH = DATA_DIR / "raw" / "news_dataset.csv"
PROCESSED_DATA_PATH = DATA_DIR / "processed" / "cleaned_dataset.csv"

# Academic Disclaimer Text
ACADEMIC_DISCLAIMER = (
    "This output is a statistical model assessment based on learned textual patterns from historical training data. "
    "It does not constitute definitive proof or factual verification of news truthfulness."
)
