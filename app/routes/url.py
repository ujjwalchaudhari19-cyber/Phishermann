from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.cache.redis_client import get_cached_url_scan, set_cached_url_scan
from app.db.database import get_db
from app.db.models import ScannedUrl
from app.middleware.auth_middleware import verify_token
from app.services.email_alert import send_phishing_alert
from app.services.firebase_auth import get_firestore_client
from app.services.heuristic import analyze_url, normalize_url
from app.services.safebrowsing import check_safe_browsing
from app.services.urlhaus import check_url_in_urlhaus
from app.services.virustotal import check_virustotal

router = APIRouter()


class URLRequest(BaseModel):
    url: str


class UrlScanResponse(BaseModel):
    url: str
    verdict: str
    confidence_score: float
    sources: list[str]
    timestamp: str


@router.post("/url", response_model=UrlScanResponse)
async def scan_url(
    request: URLRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: dict = Depends(verify_token)
):
    """
    Scan URL using VirusTotal, Safe Browsing, URLhaus, and local heuristics.
    Uses dynamic confidence weighting so unavailable external services do not
    incorrectly force risky URLs into a safe verdict.
    """
    raw_url = (request.url or "").strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    normalized_url = normalize_url(raw_url)
    if not normalized_url:
        raise HTTPException(status_code=400, detail="Invalid URL")

    user_id = user.get("uid", "anonymous")

    # 1. Cache lookup uses normalized URL to avoid split cache entries.
    cached = get_cached_url_scan(normalized_url)
    if cached:
        cached["confidence_score"] = min(float(cached.get("confidence_score", 0)), 100.0)
        return UrlScanResponse(**cached)

    # 2. Query detection sources.
    vt_result = check_virustotal(normalized_url)
    sb_result = check_safe_browsing(normalized_url)
    uh_result = check_url_in_urlhaus(normalized_url)
    heuristic_result = analyze_url(normalized_url)

    # 3. Convert source outputs to scores.
    raw_malicious_count = vt_result.get("malicious_count", 0)
    try:
        malicious_count = int(raw_malicious_count or 0)
    except (TypeError, ValueError):
        malicious_count = 0

    if malicious_count >= 10:
        vt_score = 100
    elif malicious_count >= 6:
        vt_score = 85
    elif malicious_count >= 3:
        vt_score = 65
    elif malicious_count >= 1:
        vt_score = 40
    else:
        vt_score = 0

    sb_score = 100 if sb_result.get("is_threat", False) else 0
    h_score = int(heuristic_result.get("score", 0))

    critical_flags = set(heuristic_result.get("critical_flags", []))
    has_critical_heuristic_signal = bool(critical_flags)

    # URLhaus score
    uh_score = 100 if uh_result.get("is_malicious", False) else 0

    # 4. Dynamic weighted score with availability-aware weights.
    # Heuristics are always available.
    weighted_components = [(h_score, 0.25)]

    if vt_result.get("status") == "ok":
        weighted_components.append((vt_score, 0.35))

    if sb_result.get("status") == "ok":
        weighted_components.append((sb_score, 0.25))

    if uh_result.get("url_status") != "error":
        weighted_components.append((uh_score, 0.15))

    total_weight = sum(weight for _, weight in weighted_components)
    if total_weight == 0:
        weighted_score = float(h_score)
    else:
        weighted_score = sum(score * weight for score, weight in weighted_components) / total_weight

    confidence_score = round(max(0.0, min(100.0, weighted_score)), 2)

    # 5. Base verdict thresholds.
    if confidence_score >= 61:
        verdict = "phishing"
    elif confidence_score >= 26:
        verdict = "suspicious"
    else:
        verdict = "safe"

    # 6. Heuristic safety overrides for zero-day phish patterns.
    if has_critical_heuristic_signal and h_score >= 60 and verdict == "safe":
        verdict = "suspicious"
        confidence_score = max(confidence_score, 45.0)

    if h_score >= 85 or (has_critical_heuristic_signal and h_score >= 75):
        verdict = "phishing"
        confidence_score = max(confidence_score, 75.0)

    # 7. Source list is strictly based on actual usable checks.
    sources_used = ["heuristics"]
    if vt_result.get("status") == "ok":
        sources_used.append("virustotal")
    if sb_result.get("status") == "ok":
        sources_used.append("safebrowsing")
    if uh_result.get("url_status") != "error":
        sources_used.append("urlhaus")

    scan_data = {
        "url": normalized_url,
        "verdict": verdict,
        "confidence_score": round(confidence_score, 2),
        "sources": sources_used,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # 8. Save to local database.
    db_scan = ScannedUrl(
        id=str(uuid.uuid4()),
        user_id=user_id,
        url=normalized_url,
        verdict=verdict,
        confidence_score=confidence_score,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(db_scan)
    db.commit()

    # 9. Save to Firestore (best effort).
    try:
        fs = get_firestore_client()
        fs.collection("users").document(user_id).collection("scans").document(db_scan.id).set({
            "type": "url",
            "input": normalized_url,
            "verdict": verdict,
            "confidence_score": confidence_score,
            "sources": sources_used,
            "timestamp": scan_data["timestamp"],
            "heuristic_flags": heuristic_result.get("flags", []),
        })
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Firestore write failed: {e}")

    # 10. Cache response.
    set_cached_url_scan(normalized_url, scan_data, ttl_seconds=3600)

    # 11. Email alerts on risk.
    if verdict in ["phishing", "suspicious"]:
        user_email = user.get("email")
        if user_email:
            background_tasks.add_task(
                send_phishing_alert,
                user_email,
                normalized_url,
                confidence_score,
                verdict
            )

    return UrlScanResponse(**scan_data)

