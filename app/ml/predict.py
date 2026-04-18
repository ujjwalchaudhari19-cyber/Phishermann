import os
import joblib
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model.pkl")

_model = None

def load_model():
    global _model
    if _model is None:
        try:
            _model = joblib.load(MODEL_PATH)
        except Exception as e:
            logger.warning(f"Could not load ML model from {MODEL_PATH}. It may need to be trained first.")
            _model = None
    return _model

def predict_sms(message: str) -> dict:
    model = load_model()
    if not model:
        # Fallback if model isn't trained yet
        return {
            "scam_probability": 0.5,
            "verdict": "unknown",
            "message": "Model not loaded"
        }

    # model.predict_proba returns [[prob_legit, prob_scam]]
    probabilities = model.predict_proba([message])[0]
    scam_prob = probabilities[1]
    
    if scam_prob > 0.7:
        verdict = "scam"
    elif scam_prob > 0.4:
        verdict = "suspicious"
    else:
        verdict = "legitimate"

    return {
        "scam_probability": scam_prob,
        "verdict": verdict
    }
