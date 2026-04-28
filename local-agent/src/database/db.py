import os
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
DEFAULT_DB_PATH = os.path.join(DATA_DIR, "agent.db")
DATABASE_URL = os.getenv("LOCAL_AGENT_DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

os.makedirs(DATA_DIR, exist_ok=True)

engine_kwargs = {"echo": False}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True)
    email = Column(String, nullable=True)
    password = Column(String)
    twoFaCode = Column(String, nullable=True)
    proxyIp = Column(String, nullable=True)
    proxyPort = Column(String, nullable=True)
    proxyUser = Column(String, nullable=True)
    proxyPass = Column(String, nullable=True)
    profilePath = Column(String, nullable=True)
    sessionData = Column(Text, nullable=True)
    status = Column(String, default="inactive")
    lastLoginAt = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True)
    tiktokUrl = Column(String)
    username = Column(String)
    displayName = Column(String, nullable=True)
    status = Column(String, default="free")
    accountId = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    content = Column(Text)
    order = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MessageLog(Base):
    __tablename__ = "message_logs"

    id = Column(String, primary_key=True)
    accountId = Column(String)
    leadId = Column(String)
    messageId = Column(String)
    status = Column(String, default="sent")
    errorMsg = Column(String, nullable=True)
    sentAt = Column(DateTime, default=datetime.utcnow)

class CampaignSetting(Base):
    __tablename__ = "campaign_settings"

    id = Column(String, primary_key=True)
    workers = Column(Integer, default=1)
    browsersPerWorker = Column(Integer, default=1)
    minDelaySeconds = Column(Integer, default=30)
    maxDelaySeconds = Column(Integer, default=120)
    messagesPerAccount = Column(Integer, default=50)
    failureThreshold = Column(Integer, default=5)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True)
    status = Column(String, default="stopped")
    startedAt = Column(DateTime, nullable=True)
    stoppedAt = Column(DateTime, nullable=True)
    totalSent = Column(Integer, default=0)
    totalFailed = Column(Integer, default=0)
    activeAccounts = Column(Integer, default=0)
    blockedAccounts = Column(Integer, default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
