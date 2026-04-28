"""
Heuristic URL Analyzer for PhisherMann.
Inspects URL structure for common phishing indicators and returns
a score from 0-100 based on multiple structural checks.
"""

import logging
import re
from urllib.parse import parse_qs, urlparse

logger = logging.getLogger(__name__)

GENERIC_SUSPICIOUS_KEYWORDS = [
    "bank", "secure", "verify", "login", "update", "confirm", "account",
    "validate", "signin", "password", "credential", "wallet", "invoice",
]

TYPOSQUATTING_PATTERNS = [
    "paypa1", "paypall", "paypa-l",
    "micros0ft", "micosoft", "microsft",
    "arnazon", "amazom", "amaz0n",
    "g00gle", "gooogle", "googel",
    "faceb00k", "facebok", "faceboook",
    "netfl1x", "netflx", "netlfix",
    "app1e", "aple", "appie"
]

SUSPICIOUS_QUERY_KEYS = {
    "token", "session", "redirect", "continue", "next", "confirm",
    "verify", "password", "otp", "code", "auth",
}

PHISHING_TLDS = [
    ".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".club",
    ".online", ".site", ".info", ".click", ".link", ".icu", ".buzz",
]

SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
    "lnkd.in", "cutt.ly", "rebrand.ly", "shorturl.at",
}

BRAND_DOMAINS = {
    "paypal": ["paypal.com"],
    "microsoft": ["microsoft.com", "live.com", "outlook.com", "office.com"],
    "amazon": ["amazon.com", "amazon.in", "amazon.co.uk", "amazon.de"],
    "apple": ["apple.com", "icloud.com"],
    "google": ["google.com", "gmail.com", "youtube.com", "googleapis.com"],
    "bank": [],
    "netflix": ["netflix.com"],
    "facebook": ["facebook.com", "fb.com"],
    "instagram": ["instagram.com"],
    "whatsapp": ["whatsapp.com"],
    "discord": ["discord.com", "discord.gg"],
    "steam": ["steampowered.com", "steamcommunity.com"],
    "coinbase": ["coinbase.com"],
    "binance": ["binance.com"],
    "chase": ["chase.com"],
    "wellsfargo": ["wellsfargo.com"],
    "dropbox": ["dropbox.com"],
}


def is_domain_legit_for_brand(hostname: str, brand: str) -> bool:
    """Check if the hostname is a legitimate domain for the given brand."""
    legit_domains = BRAND_DOMAINS.get(brand, [])
    if any(hostname == d or hostname.endswith("." + d) for d in legit_domains):
        return True
    
    # Check for custom corporate TLDs (e.g. labs.google)
    corporate_tlds = ["google", "apple", "amazon", "microsoft", "chase"]
    if brand in corporate_tlds:
        if hostname == brand or hostname.endswith("." + brand):
            return True
            
    return False



def normalize_url(url: str) -> str:
    """Ensure a URL has a parseable scheme for consistent analysis."""
    cleaned = (url or "").strip()
    if not cleaned:
        return ""
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", cleaned):
        return cleaned
    if cleaned.startswith("//"):
        return f"https:{cleaned}"
    return f"https://{cleaned}"


def analyze_url(url: str) -> dict:
    """
    Perform heuristic analysis on a URL's structure.
    Returns:
      - score: int 0-100 indicating phishing probability
      - flags: list of triggered heuristic rules
      - critical_flags: subset of highly risky flags
      - normalized_url: URL after normalization
    """
    flags = []
    critical_flags = []
    score = 0
    normalized_url = normalize_url(url)

    try:
        parsed = urlparse(normalized_url)
        hostname = (parsed.hostname or "").lower()
        full_url = normalized_url.lower()
    except Exception:
        return {"score": 0, "flags": ["parse_error"], "critical_flags": [], "normalized_url": normalized_url}

    if not hostname:
        if parsed.scheme in {"javascript", "data", "file"}:
            return {
                "score": 100,
                "flags": [f"dangerous_scheme ({parsed.scheme})"],
                "critical_flags": ["dangerous_scheme"],
                "normalized_url": normalized_url,
            }
        return {"score": 0, "flags": ["missing_hostname"], "critical_flags": [], "normalized_url": normalized_url}


    found_keywords = [kw for kw in GENERIC_SUSPICIOUS_KEYWORDS if kw in full_url]
    if found_keywords:
        flags.append(f"suspicious_keywords ({', '.join(found_keywords[:4])})")
        score += min(10 + (len(found_keywords) * 5), 30)

    query = parse_qs(parsed.query)
    risky_query_keys = [k for k in query.keys() if k.lower() in SUSPICIOUS_QUERY_KEYS]
    if risky_query_keys:
        flags.append(f"suspicious_query_keys ({', '.join(risky_query_keys[:3])})")
        score += min(10 + (len(risky_query_keys) * 5), 20)

    if len(query) >= 8:
        flags.append(f"many_query_params ({len(query)})")
        score += 10

    for tld in PHISHING_TLDS:
        if hostname.endswith(tld):
            flags.append(f"phishing_tld ({tld})")
            critical_flags.append("phishing_tld")
            score += 25
            break


    if re.search(r"\d{4,}", hostname):
        flags.append("consecutive_digits_in_domain")
        score += 15

    hyphen_count = hostname.count("-")
    if hyphen_count > 3:
        flags.append(f"hyphen_abuse ({hyphen_count} hyphens)")
        score += 20

    if "_" in hostname:
        flags.append("underscore_in_hostname")
        score += 10

    if "xn--" in hostname:
        flags.append("punycode_domain")
        critical_flags.append("punycode_domain")
        score += 50

    if any(ord(ch) > 127 for ch in hostname):
        flags.append("unicode_hostname")
        score += 60

    if re.match(r"^\d{1,3}(?:\.\d{1,3}){3}$", hostname):
        flags.append("ip_address_as_domain")
        critical_flags.append("ip_address_as_domain")
        score += 40

    if parsed.username or parsed.password:
        flags.append("userinfo_in_url")
        critical_flags.append("userinfo_in_url")
        score += 35

    if "@" in full_url:
        flags.append("at_symbol_in_url")
        critical_flags.append("at_symbol_in_url")
        score += 50


    redirect_params = ["redirect=", "url=", "return=", "next=", "goto=", "link="]
    if any(p in full_url for p in redirect_params):
        flags.append("redirect_chain_params")
        score += 35

    if hostname in SHORTENER_DOMAINS or any(hostname.endswith("." + d) for d in SHORTENER_DOMAINS):
        flags.append("url_shortener")
        score += 15


    if re.search(r"[a-z0-9]{24,}", parsed.path.lower()):
        flags.append("long_random_path_token")
        score += 15

    if normalized_url.count("%") >= 4:
        flags.append("heavy_url_encoding")
        score += 12

    try:
        parsed_port = parsed.port
    except ValueError:
        parsed_port = None
        flags.append("invalid_port_value")
        score += 10

    if parsed_port and parsed_port not in (80, 443, 8080, 8443):
        flags.append(f"non_standard_port ({parsed_port})")
        score += 10

    if parsed.scheme in {"javascript", "data", "file"}:
        flags.append(f"dangerous_scheme ({parsed.scheme})")
        critical_flags.append("dangerous_scheme")
        score += 45
    elif parsed.scheme == "http" and found_keywords:
        flags.append("http_with_sensitive_keywords")
        score += 10

    for brand, legit_domains in BRAND_DOMAINS.items():
        if brand not in full_url:
            continue
        if is_domain_legit_for_brand(hostname, brand):
            continue
        flags.append(f"brand_impersonation ({brand})")
        critical_flags.append("brand_impersonation")
        score += 35
        break

    for typo in TYPOSQUATTING_PATTERNS:
        if typo in hostname:
            flags.append(f"typosquatting ({typo})")
            critical_flags.append("typosquatting")
            score += 60
            break

    hostname_parts = hostname.split('.')
    if len(hostname_parts) >= 3:
        subdomains = ".".join(hostname_parts[:-2])
        for brand in BRAND_DOMAINS:
            if brand in subdomains:
                if not is_domain_legit_for_brand(hostname, brand):
                    flags.append(f"misleading_subdomain ({brand})")
                    critical_flags.append("misleading_subdomain")
                    score += 70
                    break

    major_tlds = [".com", ".org", ".net", ".edu", ".gov", ".io", ".co"]
    is_major_tld = any(hostname.endswith(tld) for tld in major_tlds)
    
    if "secure" in hostname and not is_major_tld:
        flags.append("secure_non_major_tld")
        score += 40
    
    if "login" in hostname or "signin" in hostname:
        flags.append("login_signin_keyword")
        score += 35
        
    if "verify" in hostname or "validate" in hostname:
        flags.append("verify_validate_keyword")
        score += 35
        
    if "update" in hostname or "confirm" in hostname:
        flags.append("update_confirm_keyword")
        score += 30

    if re.search(r"[bcdfghjklmnpqrstvwxyz]{5,}", hostname):
        flags.append("consecutive_consonants")
        score += 25

    if len(hostname_parts) >= 2:
        sld = hostname_parts[-2]
        if len(sld) >= 8 and any(c.isdigit() for c in sld) and any(c.isalpha() for c in sld) and sld.isalnum():
            flags.append("random_string_before_tld")
            score += 30

    score = max(0, min(100, score))
    return {
        "score": score,
        "flags": flags,
        "critical_flags": sorted(set(critical_flags)),
        "normalized_url": normalized_url,
    }

