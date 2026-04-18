import os
import base64
import requests
import logging

logger = logging.getLogger(__name__)
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")


def check_virustotal(url: str) -> dict:
    """
    Check a URL against the VirusTotal v3 API.
    Encodes the URL in base64 (url-safe, no padding) as required by VT v3.
    Returns malicious engine count.
    """
    if not VIRUSTOTAL_API_KEY:
        logger.warning("No VirusTotal API key set, returning safe fallback.")
        return {"malicious_count": 0, "source": "virustotal", "status": "no_key"}

    try:
        # VT v3 requires URL ID = base64url(url) without trailing '='
        url_id = base64.urlsafe_b64encode(url.encode()).decode().rstrip("=")
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}

        response = requests.get(
            f"https://www.virustotal.com/api/v3/urls/{url_id}",
            headers=headers,
            timeout=15
        )

        if response.status_code == 404:
            # URL not yet in VT — submit it for analysis
            submit_resp = requests.post(
                "https://www.virustotal.com/api/v3/urls",
                headers=headers,
                data={"url": url},
                timeout=15
            )
            if submit_resp.status_code in (200, 201):
                logger.info(f"URL submitted to VirusTotal for analysis: {url}")
            return {"malicious_count": 0, "source": "virustotal", "status": "submitted"}

        response.raise_for_status()
        data = response.json()

        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
        malicious_count = stats.get("malicious", 0)
        suspicious_count = stats.get("suspicious", 0)

        return {
            "malicious_count": malicious_count + suspicious_count,
            "source": "virustotal",
            "status": "ok"
        }

    except requests.RequestException as e:
        logger.error(f"VirusTotal API error for {url}: {e}")
        # Gracefully degrade — don't block the entire scan on VT failure
        return {"malicious_count": 0, "source": "virustotal", "status": "error"}
