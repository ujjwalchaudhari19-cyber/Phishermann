from fastapi import Header, HTTPException, Request
from app.services.firebase_auth import verify_firebase_token


async def verify_token(request: Request, authorization: str = Header(default=None)):
    """
    FastAPI dependency that extracts and verifies the Firebase ID token
    from the Authorization header (Bearer <token>).
    Returns the decoded token payload (contains uid, email, etc.)

    CORS preflight (OPTIONS) requests are allowed through without auth
    so that the CORSMiddleware can respond correctly to the browser.
    """
    # Let CORS preflight requests pass through — no auth needed
    if request.method == "OPTIONS":
        return {}

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header format. Expected: Bearer <token>")

    token = authorization.split("Bearer ", 1)[1].strip()

    try:
        decoded = verify_firebase_token(token)
        return decoded
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
