from fastapi import Header, HTTPException
from app.services.firebase_auth import verify_firebase_token


async def verify_token(authorization: str = Header(...)):
    """
    FastAPI dependency that extracts and verifies the Firebase ID token
    from the Authorization header (Bearer <token>).
    Returns the decoded token payload (contains uid, email, etc.)
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header format. Expected: Bearer <token>")

    token = authorization.split("Bearer ", 1)[1].strip()

    try:
        decoded = verify_firebase_token(token)
        return decoded
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
