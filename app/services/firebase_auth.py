import os
import logging
import firebase_admin
from firebase_admin import credentials, auth, firestore

logger = logging.getLogger(__name__)

# Path to the service account key
SERVICE_ACCOUNT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "firebase_service_account.json"
)

def _initialize_firebase():
    """Initialize Firebase Admin SDK if not already initialized."""
    if not firebase_admin._apps:
        try:
            cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
            raise RuntimeError(f"Firebase initialization failed: {e}")

# Initialize on import
_initialize_firebase()

def get_firestore_client():
    """Get a Firestore client instance."""
    return firestore.client()

def verify_firebase_token(token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded payload.
    Raises ValueError on invalid or expired token.
    """
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise ValueError(f"Invalid or expired Firebase token: {e}")
