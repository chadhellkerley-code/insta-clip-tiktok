import json
import os
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "..", "web-app", "prisma", "dev.db")

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
