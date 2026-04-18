from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()  # Load .env before anything else

from app.db.database import engine, Base
import app.db.models as models

# Import routes
from app.routes import url, sms, trends
from app.routes import user

# Recreate tables (adds user_id column if schema changed)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Phishermann API",
    version="1.0.0",
    description="Phishing and scam detection platform powered by VirusTotal, Google Safe Browsing, URLhaus, and ML."
)

# CORS — allow dashboard (localhost:5173 for Vite) and Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "chrome-extension://*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check():
    """Public health check — no auth required."""
    return {"status": "ok", "version": "1.0.0"}


# Mount all routers
app.include_router(url.router, prefix="/scan", tags=["URL Scanner"])
app.include_router(sms.router, prefix="/scan", tags=["SMS Scanner"])
app.include_router(trends.router, tags=["Trends"])
app.include_router(user.router, tags=["User"])
