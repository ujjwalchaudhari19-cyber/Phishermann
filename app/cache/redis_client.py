import os
import json
import redis
import logging

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Attempt connection to Redis, fallback to mockup dictionary if fails (for easy local dev)
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    # If ping passes, we are connected
    HAS_REDIS = True
except Exception as e:
    logger.warning(f"Failed to connect to Redis at {REDIS_URL}: {e}. Falling back to basic memory cache.")
    HAS_REDIS = False
    _memory_cache: dict[str, dict] = {}

def get_cached_url_scan(url: str):
    try:
        if HAS_REDIS:
            res = redis_client.get(f"url_scan:{url}")
            return json.loads(res) if res else None
        else:
            return _memory_cache.get(f"url_scan:{url}")
    except Exception as e:
        logger.error(f"Redis get error: {e}")
        return None

def set_cached_url_scan(url: str, data: dict, ttl_seconds: int = 3600):
    try:
        if HAS_REDIS:
            redis_client.setex(f"url_scan:{url}", ttl_seconds, json.dumps(data))
        else:
            _memory_cache[f"url_scan:{url}"] = data
    except Exception as e:
        logger.error(f"Redis set error: {e}")
