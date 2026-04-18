import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime
from app.db.database import Base


class ScannedUrl(Base):
    __tablename__ = "scanned_urls"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, default="anonymous")  # Firebase UID
    url = Column(String, nullable=False)
    verdict = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ScannedSms(Base):
    __tablename__ = "scanned_sms"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, default="anonymous")  # Firebase UID
    message_text = Column(String, nullable=False)
    scam_probability = Column(Float, nullable=False)
    verdict = Column(String, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TrendData(Base):
    __tablename__ = "trend_data"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String, nullable=False)
    scam_type = Column(String, nullable=False)
    region = Column(String, nullable=False)
    count = Column(Integer, default=0)
    date_recorded = Column(DateTime, default=lambda: datetime.now(timezone.utc))
