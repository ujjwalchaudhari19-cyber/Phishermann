from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from app.db.database import get_db
from app.db.models import ScannedUrl
from app.cache.redis_client import get_cached_url_scan, set_cached_url_scan
from app.services.virustotal import check_virustotal
from app.services.safebrowsing import check_safe_browsing
from app.services.urlhaus import check_url_in_urlhaus
from app.middleware.auth_middleware import verify_token
from app.services.firebase_auth import get_firestore_client

router = APIRouter()


class UrlScanRequest(BaseModel):
    url: str


class UrlScanResponse(BaseModel):
    url: str
    verdict: str
    confidence_score: float
    sources: list[str]
    timestamp: str


@router.post("/url", response_model=UrlScanResponse)
def scan_url(
    request: UrlScanRequest,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """
    Scan a URL using VirusTotal, Google Safe Browsing, and URLhaus.
    Results are cached in Redis for 1 hour. Saved to PostgreSQL + Firestore.
    """
    target_url = request.url
    user_id = token_data.get("uid", "anonymous")

    # 1. Check Redis cache first (TTL: 1 hour)
    cached = get_cached_url_scan(target_url)
    if cached:
        return UrlScanResponse(**cached)

    # 2. Call all three external APIs concurrently (sequential for simplicity)
    vt_result = check_virustotal(target_url)
    sb_result = check_safe_browsing(target_url)
    uh_result = check_url_in_urlhaus(target_url)

    # 3. Aggregate verdict logic
    malicious_count = vt_result.get("malicious_count", 0)
    is_sb_threat = sb_result.get("is_threat", False)
    is_uh_malicious = uh_result.get("is_malicious", False)

    threat_signals = 0
    if malicious_count > 3:
        threat_signals += 2
    elif malicious_count > 0:
        threat_signals += 1
    if is_sb_threat:
        threat_signals += 2
    if is_uh_malicious:
        threat_signals += 1

    if threat_signals >= 3:
        verdict = "phishing"
        confidence_score = min(99.0, 60.0 + (malicious_count * 5) + (10 if is_sb_threat else 0))
    elif threat_signals >= 1:
        verdict = "suspicious"
        confidence_score = 30.0 + (malicious_count * 5) + (10 if is_uh_malicious else 0)
    else:
        verdict = "safe"
        confidence_score = 92.0

    sources_used = [s for s, r in [("virustotal", vt_result), ("safebrowsing", sb_result), ("urlhaus", uh_result)]
                    if r.get("status") != "error"]

    scan_data = {
        "url": target_url,
        "verdict": verdict,
        "confidence_score": round(confidence_score, 2),
        "sources": sources_used,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    # 4. Save to PostgreSQL
    db_scan = ScannedUrl(
        id=str(uuid.uuid4()),
        user_id=user_id,
        url=target_url,
        verdict=verdict,
        confidence_score=confidence_score,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(db_scan)
    db.commit()

    # 5. Save to Firestore under /users/{uid}/scans/{scan_id}
    try:
        fs = get_firestore_client()
        fs.collection("users").document(user_id).collection("scans").document(db_scan.id).set({
            "type": "url",
            "input": target_url,
            "verdict": verdict,
            "confidence_score": confidence_score,
            "sources": sources_used,
            "timestamp": scan_data["timestamp"]
        })
    except Exception as e:
        # Firestore failure should not block the response
        import logging
        logging.getLogger(__name__).error(f"Firestore write failed: {e}")

    # 6. Cache in Redis (1 hour TTL)
    set_cached_url_scan(target_url, scan_data, ttl_seconds=3600)

    return UrlScanResponse(**scan_data)
