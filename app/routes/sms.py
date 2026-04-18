from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from app.db.database import get_db
from app.db.models import ScannedSms
from app.ml.predict import predict_sms
from app.middleware.auth_middleware import verify_token
from app.services.firebase_auth import get_firestore_client

router = APIRouter()


class SmsScanRequest(BaseModel):
    message: str


class SmsScanResponse(BaseModel):
    message: str
    verdict: str
    scam_probability: float
    timestamp: str


@router.post("/sms", response_model=SmsScanResponse)
def scan_sms(
    request: SmsScanRequest,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Scan an SMS message using the trained ML classifier.
    Saves result to PostgreSQL and Firestore under the authenticated user's ID.
    """
    user_id = token_data.get("uid", "anonymous")

    # Run ML prediction
    prediction = predict_sms(request.message)
    scam_prob = round(float(prediction.get("scam_probability", 0.0)), 4)
    verdict = prediction.get("verdict", "legitimate")

    # Normalize unknown verdict (model not trained yet)
    if verdict == "unknown":
        verdict = "legitimate"
        scam_prob = 0.0

    timestamp = datetime.now(timezone.utc)
    scan_id = str(uuid.uuid4())

    scan_data = {
        "message": request.message,
        "verdict": verdict,
        "scam_probability": scam_prob,
        "timestamp": timestamp.isoformat()
    }

    # Save to PostgreSQL
    db_scan = ScannedSms(
        id=scan_id,
        user_id=user_id,
        message_text=request.message,
        verdict=verdict,
        scam_probability=scam_prob,
        timestamp=timestamp
    )
    db.add(db_scan)
    db.commit()

    # Save to Firestore under /users/{uid}/scans/{scan_id}
    try:
        fs = get_firestore_client()
        fs.collection("users").document(user_id).collection("scans").document(scan_id).set({
            "type": "sms",
            "input": request.message[:200],  # truncate for Firestore safety
            "verdict": verdict,
            "scam_probability": scam_prob,
            "timestamp": scan_data["timestamp"]
        })
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Firestore write failed: {e}")

    return SmsScanResponse(**scan_data)
