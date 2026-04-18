import os
import requests
import logging

logger = logging.getLogger(__name__)
GOOGLE_SAFE_BROWSING_API_KEY = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "")

THREAT_TYPES = ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"]


def check_safe_browsing(url: str) -> dict:
    """
    Check a URL against the Google Safe Browsing v4 Lookup API.
    Returns whether the URL is a known threat.
    """
    if not GOOGLE_SAFE_BROWSING_API_KEY:
        logger.warning("No Google Safe Browsing API key set, returning safe fallback.")
        return {"is_threat": False, "threat_type": None, "source": "safebrowsing", "status": "no_key"}

    api_endpoint = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GOOGLE_SAFE_BROWSING_API_KEY}"

    payload = {
        "client": {
            "clientId": "phishermann",
            "clientVersion": "1.0.0"
        },
        "threatInfo": {
            "threatTypes": THREAT_TYPES,
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}]
        }
    }

    try:
        response = requests.post(api_endpoint, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()

        matches = data.get("matches", [])
        if matches:
            threat_type = matches[0].get("threatType", "UNKNOWN")
            return {
                "is_threat": True,
                "threat_type": threat_type,
                "source": "safebrowsing",
                "status": "ok"
            }

        return {
            "is_threat": False,
            "threat_type": None,
            "source": "safebrowsing",
            "status": "ok"
        }

    except requests.RequestException as e:
        logger.error(f"Google Safe Browsing API error for {url}: {e}")
        return {"is_threat": False, "threat_type": None, "source": "safebrowsing", "status": "error"}
