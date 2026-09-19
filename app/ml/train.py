"""
Model Training and Evaluation Pipeline Script.

Loads raw dataset, performs text cleaning and vectorization, trains Logistic Regression model,
evaluates performance metrics, and saves serialized artifacts to saved_models/ directory.
"""

import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    confusion_matrix, roc_auc_score, classification_report
)

from app.config import (
    RAW_DATA_PATH, SAVED_MODELS_DIR, MODEL_PATH, VECTORIZER_PATH, METRICS_PATH
)
from app.ml.dataset_generator import generate_sample_dataset
from app.ml.preprocessor import combine_title_and_text

def train_model():
    """
    Executes complete ML training, evaluation, and artifact saving pipeline.
    """
    print("[INFO] Starting ML Model Training Pipeline...")
    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Ensure dataset exists
    if not RAW_DATA_PATH.exists():
        print(f"[INFO] Dataset not found at {RAW_DATA_PATH}. Generating sample dataset...")
        generate_sample_dataset()

    # 2. Load dataset
    df = pd.read_csv(RAW_DATA_PATH)
    print(f"[INFO] Loaded dataset with {len(df)} records.")

    # Fill NaN values if any
    df['title'] = df['title'].fillna('')
    df['text'] = df['text'].fillna('')

    # 3. Preprocess combined text
    print("[INFO] Preprocessing text and extracting features...")
    processed_texts = [
        combine_title_and_text(title, text) 
        for title, text in zip(df['title'], df['text'])
    ]
    labels = df['label'].values

    # 4. Stratified Train / Test Split (80% Train, 20% Test)
    X_train_text, X_test_text, y_train, y_test = train_test_split(
        processed_texts, labels, test_size=0.20, random_state=42, stratify=labels
    )
    print(f"[INFO] Dataset split: {len(X_train_text)} training samples, {len(X_test_text)} test samples.")

    # 5. TF-IDF Vectorization
    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1
    )
    X_train = vectorizer.fit_transform(X_train_text)
    X_test = vectorizer.transform(X_test_text)

    # 6. Train Logistic Regression Classifier
    print("[INFO] Fitting Logistic Regression Classifier...")
    model = LogisticRegression(max_iter=1000, C=1.0, solver='lbfgs', random_state=42)
    model.fit(X_train, y_train)

    # 7. Evaluate Model Performance
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, average='binary'))
    rec = float(recall_score(y_test, y_pred, average='binary'))
    f1 = float(f1_score(y_test, y_pred, average='binary'))
    roc_auc = float(roc_auc_score(y_test, y_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()

    metrics = {
        "status": "Trained successfully",
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "confusion_matrix": cm,
        "sample_counts": {
            "total": len(df),
            "train": len(X_train_text),
            "test": len(X_test_text)
        },
        "model_type": "TF-IDF + Logistic Regression"
    }

    # 8. Save Model Artifacts
    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=4)

    print(f"[SUCCESS] Model saved to: {MODEL_PATH}")
    print(f"[SUCCESS] Vectorizer saved to: {VECTORIZER_PATH}")
    print(f"[SUCCESS] Metrics saved to: {METRICS_PATH}")
    print(f"[METRICS SUMMARY] Accuracy: {acc*100:.2f}%, F1-Score: {f1*100:.2f}%, ROC-AUC: {roc_auc:.4f}")

    return metrics

if __name__ == "__main__":
    train_model()
