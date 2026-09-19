"""
FastAPI Application Entrypoint and Route Definitions.
"""

import json
import sqlite3
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import HTMLResponse

from app.config import APP_DIR, ACADEMIC_DISCLAIMER, METRICS_PATH
from app.database import init_db, get_db
from app.models import NewsArticleRequest, PredictionResponse, PredictionHistoryItem, ModelMetricsResponse
from app.ml.predictor import predictor_instance

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager for startup and shutdown events.
    """
    init_db()
    predictor_instance.load_artifacts()
    yield

app = FastAPI(
    title="AI-Based Fake News Detection System",
    description="Academic ML system assessing news authenticity using TF-IDF and Logistic Regression.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files and Templates
app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(APP_DIR / "templates"))

@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    """
    Serves the main single-page HTML frontend.
    """
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/api/health")
def health_check():
    """
    Health check endpoint returning system status and model readiness.
    """
    model_loaded = predictor_instance._is_loaded
    return {
        "status": "healthy",
        "service": "Fake News Detection API",
        "model_loaded": model_loaded
    }

@app.post("/api/predict", response_model=PredictionResponse)
def predict_news(payload: NewsArticleRequest, db: sqlite3.Connection = Depends(get_db)):
    """
    Analyzes an article title and text to predict authenticity label and confidence score.
    """
    if not payload.title.strip() or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Title and text body must not be empty.")

    try:
        result = predictor_instance.predict(payload.title, payload.text)
    except RuntimeError as err:
        raise HTTPException(status_code=503, detail=str(err))

    # Log prediction to SQLite database
    text_snippet = payload.text.strip()[:150] + ("..." if len(payload.text.strip()) > 150 else "")
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO prediction_history (title, text_snippet, prediction, confidence, prob_fake, prob_genuine)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        payload.title.strip(),
        text_snippet,
        result["prediction"],
        result["confidence"],
        result["prob_fake"],
        result["prob_genuine"]
    ))
    db.commit()

    return PredictionResponse(
        prediction=result["prediction"],
        confidence=result["confidence"],
        prob_fake=result["prob_fake"],
        prob_genuine=result["prob_genuine"],
        disclaimer=result["disclaimer"]
    )

@app.get("/api/history", response_model=List[PredictionHistoryItem])
def get_prediction_history(limit: int = 15, db: sqlite3.Connection = Depends(get_db)):
    """
    Retrieve recent prediction history logs from SQLite database.
    """
    cursor = db.cursor()
    cursor.execute("""
        SELECT id, title, text_snippet, prediction, confidence, prob_fake, prob_genuine, created_at
        FROM prediction_history
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    return [dict(row) for row in rows]

@app.get("/api/metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    """
    Retrieve trained model evaluation metrics (Accuracy, F1-Score, Confusion Matrix).
    """
    if not METRICS_PATH.exists():
        return ModelMetricsResponse(
            status="Model not trained yet",
            details={"message": "Run python -m app.ml.train to train the model and generate metrics."}
        )

    try:
        with open(METRICS_PATH, "r") as f:
            data = json.load(f)
        return ModelMetricsResponse(
            status=data.get("status", "Trained"),
            accuracy=data.get("accuracy"),
            precision=data.get("precision"),
            recall=data.get("recall"),
            f1_score=data.get("f1_score"),
            roc_auc=data.get("roc_auc"),
            confusion_matrix=data.get("confusion_matrix"),
            details=data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading metrics: {e}")
