"""
ML Training Script for SMS Scam Classification
Dataset: UCI SMS Spam Collection (https://archive.ics.uci.edu/ml/datasets/SMS+Spam+Collection)

Run: python -m app.ml.train
Output: app/ml/model.pkl
"""

import os
import urllib.request
import zipfile
import pandas as pd
import joblib
import logging
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
DATA_PATH = os.path.join(MODEL_DIR, "SMSSpamCollection")
DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip"


def download_dataset():
    """Download and extract the UCI SMS Spam Collection dataset."""
    zip_path = os.path.join(MODEL_DIR, "smsspamcollection.zip")

    if os.path.exists(DATA_PATH):
        logger.info("Dataset already exists, skipping download.")
        return

    logger.info("Downloading SMS Spam Collection from UCI repository...")
    urllib.request.urlretrieve(DATA_URL, zip_path)

    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(MODEL_DIR)

    os.remove(zip_path)
    logger.info("Dataset downloaded and extracted.")


def load_dataset() -> pd.DataFrame:
    """Load the dataset into a DataFrame."""
    df = pd.read_csv(
        DATA_PATH,
        sep="\t",
        header=None,
        names=["label", "message"],
        encoding="latin-1"
    )
    # Map label: spam -> 1 (scam), ham -> 0 (legitimate)
    df["label_binary"] = df["label"].map({"spam": 1, "ham": 0})
    logger.info(f"Loaded {len(df)} samples — spam: {df['label_binary'].sum()}, ham: {(df['label_binary'] == 0).sum()}")
    return df


def train():
    """Train and save binary SMS scam classifier."""
    download_dataset()
    df = load_dataset()

    X = df["message"]
    y = df["label_binary"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Pipeline: TF-IDF vectorizer + Logistic Regression
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),    # Unigrams + bigrams improve recall
            max_features=50000,
            sublinear_tf=True      # Log TF scaling reduces impact of very frequent terms
        )),
        ("clf", LogisticRegression(
            C=5.0,
            solver="lbfgs",
            max_iter=1000,
            class_weight="balanced"  # Handle class imbalance (ham >> spam)
        ))
    ])

    logger.info("Training model...")
    pipeline.fit(X_train, y_train)

    # Evaluate on held-out test set
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    logger.info(f"Accuracy: {acc:.4f}")
    logger.info("\n" + classification_report(y_test, y_pred, target_names=["legitimate", "scam"]))

    # Save model pipeline to disk
    joblib.dump(pipeline, MODEL_PATH)
    logger.info(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()
