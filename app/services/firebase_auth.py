import os
import json
import logging
import firebase_admin
from firebase_admin import credentials, auth, firestore

logger = logging.getLogger(__name__)

# Path to the service account key file
SERVICE_ACCOUNT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "firebase_service_account.json"
)

def _initialize_firebase():
    """Initialize Firebase Admin SDK if not already initialized."""
    if not firebase_admin._apps:
        try:
            # Option 1: Load from environment variable (for Render/cloud deployments)
            firebase_credentials_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
            if firebase_credentials_json:
                cred_dict = json.loads(firebase_credentials_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized from environment variable.")
            # Option 2: Load from local file (for local development)
            elif os.path.exists(SERVICE_ACCOUNT_PATH):
                cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized from file.")
            else:
                raise FileNotFoundError(
                    "Firebase credentials not found. Set FIREBASE_CREDENTIALS_JSON "
                    "environment variable or provide firebase_service_account.json file."
                )
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
