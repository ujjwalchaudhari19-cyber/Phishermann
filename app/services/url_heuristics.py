"""
URL Heuristic Analyzer for PhisherMann.
Inspects URL structure for common phishing indicators without relying
on external databases. This catches brand-new phishing sites that
haven't been indexed by VirusTotal/Safe Browsing/URLhaus yet.
"""

import re
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Well-known brands that phishers commonly impersonate
IMPERSONATED_BRANDS = [
    "paypal", "apple", "amazon", "microsoft", "google", "facebook",
    "instagram", "netflix", "banking", "chase", "wellsfargo", "citi",
    "bankofamerica", "usbank", "hsbc", "barclays", "dropbox", "icloud",
    "outlook", "hotmail", "yahoo", "linkedin", "twitter", "whatsapp",
    "telegram", "coinbase", "binance", "metamask", "blockchain",
    "steam", "epicgames", "roblox", "discord", "spotify", "adobe",
    "docusign", "fedex", "ups", "usps", "dhl",
]

# Legitimate TLDs for those brands (so we don't flag the real sites)
LEGIT_DOMAINS = [
    "paypal.com", "apple.com", "amazon.com", "microsoft.com",
    "google.com", "facebook.com", "instagram.com", "netflix.com",
    "chase.com", "wellsfargo.com", "bankofamerica.com",
    "dropbox.com", "icloud.com", "outlook.com", "linkedin.com",
    "twitter.com", "x.com", "whatsapp.com", "coinbase.com",
    "binance.com", "steam.com", "steampowered.com",
    "discord.com", "spotify.com", "adobe.com", "docusign.com",
    "fedex.com", "ups.com", "usps.com", "dhl.com",
    "youtube.com", "github.com",
]

# Suspicious TLDs commonly abused by phishers
SUSPICIOUS_TLDS = [
    ".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".work",
    ".click", ".link", ".info", ".buzz", ".rest", ".icu", ".cam",
    ".surf", ".monster", ".fun", ".site", ".online", ".live",
    ".store", ".shop", ".space",
]

# URL shorteners that can mask malicious destinations
SHORTENER_DOMAINS = [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
    "buff.ly", "adf.ly", "bl.ink", "lnkd.in", "db.tt", "qr.ae",
    "rebrand.ly", "shorturl.at", "cutt.ly",
]


def analyze_url_heuristics(url: str) -> dict:
    """
    Perform heuristic analysis on a URL's structure.
    Returns a dict with:
      - heuristic_score: float 0-100 indicating suspiciousness
      - flags: list of triggered heuristic rules
      - is_suspicious: bool (True if score >= 30)
    """
    flags = []
    score = 0.0

    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        full_url = url.lower()
        path = (parsed.path or "").lower()
    except Exception:
        return {"heuristic_score": 0, "flags": [], "is_suspicious": False, "status": "error"}

    # Skip analysis for known legitimate domains
    for legit in LEGIT_DOMAINS:
        if hostname == legit or hostname.endswith("." + legit):
            return {"heuristic_score": 0, "flags": ["known_legitimate"], "is_suspicious": False, "status": "ok"}

    # --- HEURISTIC CHECKS ---

    # 1. IP address instead of domain name (e.g., http://192.168.1.1/login)
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname):
        flags.append("ip_address_as_host")
        score += 25

    # 2. Excessive subdomain depth (e.g., secure.login.paypal.com.evil.tk)
    subdomain_count = hostname.count(".")
    if subdomain_count >= 4:
        flags.append(f"excessive_subdomains ({subdomain_count} levels)")
        score += 20
    elif subdomain_count >= 3:
        flags.append(f"many_subdomains ({subdomain_count} levels)")
        score += 10

    # 3. Suspicious TLD
    for tld in SUSPICIOUS_TLDS:
        if hostname.endswith(tld):
            flags.append(f"suspicious_tld ({tld})")
            score += 15
            break

    # 4. Brand impersonation — brand name in domain but not the real site
    for brand in IMPERSONATED_BRANDS:
        if brand in hostname:
            # It's NOT the legitimate domain for this brand
            flags.append(f"brand_impersonation ({brand})")
            score += 30
            break

    # 5. Homograph / typosquatting indicators (hyphens separating brand-like words)
    if re.search(r"[a-z]+-[a-z]+-[a-z]+", hostname):
        flags.append("hyphenated_domain")
        score += 10

    if hostname.count("-") >= 3:
        flags.append(f"excessive_hyphens ({hostname.count('-')})")
        score += 15

    # 6. Very long hostname (legitimate domains are usually short)
    if len(hostname) > 50:
        flags.append(f"extremely_long_hostname ({len(hostname)} chars)")
        score += 15
    elif len(hostname) > 30:
        flags.append(f"long_hostname ({len(hostname)} chars)")
        score += 5

    # 7. Suspicious path keywords
    suspicious_paths = [
        "login", "signin", "verify", "account", "secure", "update",
        "confirm", "authenticate", "banking", "password", "credential",
        "wallet", "recover", "unlock", "suspend", "alert", "urgent",
    ]
    path_hits = [kw for kw in suspicious_paths if kw in path]
    if path_hits:
        flags.append(f"suspicious_path_keywords ({', '.join(path_hits[:3])})")
        score += min(len(path_hits) * 5, 15)

    # 8. URL contains @ symbol (used to trick users about the real host)
    if "@" in url:
        flags.append("at_symbol_in_url")
        score += 25

    # 9. Non-standard port
    if parsed.port and parsed.port not in (80, 443, 8080, 8443):
        flags.append(f"non_standard_port ({parsed.port})")
        score += 10

    # 10. HTTP instead of HTTPS
    if parsed.scheme == "http":
        flags.append("no_https")
        score += 10

    # 11. URL shortener (destination is hidden)
    for shortener in SHORTENER_DOMAINS:
        if hostname == shortener or hostname.endswith("." + shortener):
            flags.append(f"url_shortener ({shortener})")
            score += 15
            break

    # 12. Encoded characters / obfuscation in URL
    encoded_chars = url.count("%")
    if encoded_chars >= 5:
        flags.append(f"heavy_url_encoding ({encoded_chars} encoded chars)")
        score += 10

    # 13. Data URI or javascript scheme
    if parsed.scheme in ("data", "javascript"):
        flags.append(f"dangerous_scheme ({parsed.scheme})")
        score += 40

    # Cap at 100
    score = min(score, 100.0)

    return {
        "heuristic_score": round(score, 1),
        "flags": flags,
        "is_suspicious": score >= 30,
        "status": "ok"
    }