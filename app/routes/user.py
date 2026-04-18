from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session

from app.middleware.auth_middleware import verify_token
from app.db.database import get_db
from app.db.models import ScannedUrl, ScannedSms

router = APIRouter()


class ScanHistoryItem(BaseModel):
    scan_id: str
    type: str       # "url" or "sms"
    input: str
    verdict: str
    score: float
    timestamp: str


class HistoryResponse(BaseModel):
    scans: List[ScanHistoryItem]


@router.get("/user/history", response_model=HistoryResponse)
def get_user_history(
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Returns the last 20 scans for the currently authenticated user.
    Tries Firestore first, falls back to local PostgreSQL/SQLite.
    """
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token.")

    # Try Firestore first
    try:
        from app.services.firebase_auth import get_firestore_client
        fs = get_firestore_client()
        scans_ref = (
            fs.collection("users")
            .document(user_id)
            .collection("scans")
            .order_by("timestamp", direction="DESCENDING")
            .limit(20)
        )
        docs = list(scans_ref.stream())

        if docs:
            results = []
            for doc in docs:
                data = doc.to_dict()
                score = data.get("confidence_score") or data.get("scam_probability") or 0.0
                results.append(ScanHistoryItem(
                    scan_id=doc.id,
                    type=data.get("type", "url"),
                    input=data.get("input", ""),
                    verdict=data.get("verdict", "unknown"),
                    score=round(float(score), 2),
                    timestamp=data.get("timestamp", "")
                ))
            return HistoryResponse(scans=results)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Firestore history fetch failed, falling back to local DB: {e}")

    # Fallback: query local SQLite/PostgreSQL
    results = []

    url_scans = (
        db.query(ScannedUrl)
        .filter(ScannedUrl.user_id == user_id)
        .order_by(ScannedUrl.timestamp.desc())
        .limit(20)
        .all()
    )
    for s in url_scans:
        results.append(ScanHistoryItem(
            scan_id=s.id,
            type="url",
            input=s.url,
            verdict=s.verdict,
            score=round(s.confidence_score, 2),
            timestamp=s.timestamp.isoformat() if s.timestamp else ""
        ))

    sms_scans = (
        db.query(ScannedSms)
        .filter(ScannedSms.user_id == user_id)
        .order_by(ScannedSms.timestamp.desc())
        .limit(20)
        .all()
    )
    for s in sms_scans:
        results.append(ScanHistoryItem(
            scan_id=s.id,
            type="sms",
            input=s.message_text[:200],
            verdict=s.verdict,
            score=round(s.scam_probability, 2),
            timestamp=s.timestamp.isoformat() if s.timestamp else ""
        ))

    # Sort combined results by timestamp descending, take top 20
    results.sort(key=lambda x: x.timestamp, reverse=True)
    results = results[:20]

    return HistoryResponse(scans=results)
