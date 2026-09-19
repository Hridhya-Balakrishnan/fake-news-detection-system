"""
Pydantic schemas for request and response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class NewsArticleRequest(BaseModel):
    title: str = Field(..., description="News article headline/title", json_schema_extra={"example": "BREAKING: Shocking discovery revealed"})
    text: str = Field(..., description="News article main body text", json_schema_extra={"example": "Researchers today announced a major breakthrough..."})

class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="Predicted label ('Likely Fake' or 'Likely Genuine')")
    confidence: float = Field(..., description="Confidence percentage (0-100%)")
    prob_fake: float = Field(..., description="Probability of article being fake (0.0 - 1.0)")
    prob_genuine: float = Field(..., description="Probability of article being genuine (0.0 - 1.0)")
    disclaimer: str = Field(..., description="Academic model assessment disclaimer")

class PredictionHistoryItem(BaseModel):
    id: int
    title: str
    text_snippet: str
    prediction: str
    confidence: float
    prob_fake: float
    prob_genuine: float
    created_at: str

class ModelMetricsResponse(BaseModel):
    status: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None
    details: Optional[Dict[str, Any]] = None
