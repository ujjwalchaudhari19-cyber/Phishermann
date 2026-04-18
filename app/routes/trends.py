from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any

from app.services.urlhaus import get_aggregated_trends
from app.middleware.auth_middleware import verify_token

router = APIRouter()


class TrendResponse(BaseModel):
    total_threats_today: int
    top_scam_types: List[Dict[str, Any]]
    top_targeted_regions: List[Dict[str, Any]]
    trend_data: List[Dict[str, Any]]


@router.get("/trends", response_model=TrendResponse)
def fetch_trends(token_data: dict = Depends(verify_token)):
    """
    Fetches global phishing/malware trends from URLhaus.
    Protected endpoint — requires Firebase auth token.
    """
    data = get_aggregated_trends()
    return TrendResponse(**data)
