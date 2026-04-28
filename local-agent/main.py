import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add local-agent root to path so `src` imports resolve consistently.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.browser.manager import browser_manager
from src.campaign.engine import campaign_engine
from src.database.db import (
    Account,
    Campaign,
    CampaignSetting,
    Lead,
    Message,
    MessageLog,
    SessionLocal,
    init_db,
)
from src.tiktok.login import login_handler


def now_utc() -> datetime:
    return datetime.utcnow()


def serialize_datetime(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def serialize_account(account: Account) -> Dict[str, Any]:
    return {
        "id": account.id,
        "username": account.username,
        "email": account.email,
        "password": account.password,
        "twoFaCode": account.twoFaCode,
        "proxyIp": account.proxyIp,
        "proxyPort": account.proxyPort,
        "proxyUser": account.proxyUser,
        "proxyPass": account.proxyPass,
        "profilePath": account.profilePath,
        "sessionData": account.sessionData,
        "status": account.status,
        "lastLoginAt": serialize_datetime(account.lastLoginAt),
        "createdAt": serialize_datetime(account.createdAt),
        "updatedAt": serialize_datetime(account.updatedAt),
    }


def serialize_lead(lead: Lead) -> Dict[str, Any]:
    return {
        "id": lead.id,
        "tiktokUrl": lead.tiktokUrl,
        "username": lead.username,
        "displayName": lead.displayName,
        "status": lead.status,
        "accountId": lead.accountId,
        "notes": lead.notes,
        "createdAt": serialize_datetime(lead.createdAt),
        "updatedAt": serialize_datetime(lead.updatedAt),
    }


def serialize_message(message: Message) -> Dict[str, Any]:
    return {
        "id": message.id,
        "content": message.content,
        "order": message.order,
        "active": message.active,
        "createdAt": serialize_datetime(message.createdAt),
        "updatedAt": serialize_datetime(message.updatedAt),
    }


def serialize_settings(settings: CampaignSetting) -> Dict[str, Any]:
    return {
        "id": settings.id,
        "workers": settings.workers,
        "browsersPerWorker": settings.browsersPerWorker,
        "minDelaySeconds": settings.minDelaySeconds,
        "maxDelaySeconds": settings.maxDelaySeconds,
        "messagesPerAccount": settings.messagesPerAccount,
        "failureThreshold": settings.failureThreshold,
        "updatedAt": serialize_datetime(settings.updatedAt),
    }


def serialize_campaign(campaign: Campaign) -> Dict[str, Any]:
    stats = campaign_engine.get_stats()
    status = "running" if campaign_engine.running else campaign.status
    return {
        "id": campaign.id,
        "status": status,
        "startedAt": serialize_datetime(campaign.startedAt),
        "stoppedAt": serialize_datetime(campaign.stoppedAt),
        "totalSent": stats["sent"] if status == "running" else campaign.totalSent,
        "totalFailed": stats["failed"] if status == "running" else campaign.totalFailed,
        "activeAccounts": stats["active_accounts"] if status == "running" else campaign.activeAccounts,
        "blockedAccounts": stats["blocked_accounts"] if status == "running" else campaign.blockedAccounts,
        "createdAt": serialize_datetime(campaign.createdAt),
    }


def get_allowed_origins() -> List[str]:
    configured = []
    config_url = browser_manager.config.get("api", {}).get("web_app_url")
    env_url = os.getenv("WEB_APP_URL")
    for candidate in [config_url, env_url, "http://localhost:3000", "http://127.0.0.1:3000"]:
        if candidate and candidate not in configured:
            configured.append(candidate.rstrip("/"))
    return configured


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield
    await browser_manager.close_all()


app = FastAPI(title="Insta-Cli-Tiktok Local Agent", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    accountId: str
    username: str
    password: str
    twoFaCode: Optional[str] = None
    proxy: Optional[Dict[str, Any]] = None


class MessageRequest(BaseModel):
    accountId: str
    leadUsername: str
    message: str


class AccountPayload(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    twoFaCode: Optional[str] = None
    proxyIp: Optional[str] = None
    proxyPort: Optional[str] = None
    proxyUser: Optional[str] = None
    proxyPass: Optional[str] = None
    status: Optional[str] = None


class LeadPayload(BaseModel):
    tiktokUrl: str
    username: str
    displayName: Optional[str] = None
    status: Optional[str] = None
    accountId: Optional[str] = None
    notes: Optional[str] = None


class MessagePayload(BaseModel):
    content: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None


class SettingsPayload(BaseModel):
    workers: int
    browsersPerWorker: int
    minDelaySeconds: int
    maxDelaySeconds: int
    messagesPerAccount: int
    failureThreshold: int


class CampaignPayload(BaseModel):
    status: str


def get_or_create_settings(db) -> CampaignSetting:
    settings = db.query(CampaignSetting).first()
    if settings:
        return settings

    settings = CampaignSetting(
        id=str(uuid4()),
        workers=1,
        browsersPerWorker=1,
        minDelaySeconds=30,
        maxDelaySeconds=120,
        messagesPerAccount=50,
        failureThreshold=5,
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def get_or_create_campaign(db) -> Campaign:
    campaign = db.query(Campaign).order_by(Campaign.createdAt.desc()).first()
    if campaign:
        return campaign

    campaign = Campaign(
        id=str(uuid4()),
        status="stopped",
        totalSent=0,
        totalFailed=0,
        activeAccounts=0,
        blockedAccounts=0,
        createdAt=now_utc(),
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "agent": "Insta-Cli-Tiktok",
        "version": "1.0.0",
        "webAppUrl": os.getenv("WEB_APP_URL") or browser_manager.config.get("api", {}).get("web_app_url"),
    }


@app.get("/api/dashboard")
async def get_dashboard():
    db = SessionLocal()
    try:
        accounts = db.query(Account).all()
        leads = db.query(Lead).all()
        messages = db.query(Message).all()
        logs = db.query(MessageLog).all()

        stats = {
            "totalAccounts": len(accounts),
            "activeAccounts": len([account for account in accounts if account.status == "active"]),
            "totalLeads": len(leads),
            "freeLeads": len([lead for lead in leads if lead.status == "free"]),
            "contactedLeads": len([lead for lead in leads if lead.status == "contacted"]),
            "rejectedLeads": len([lead for lead in leads if lead.status == "rejected"]),
            "totalMessages": len(messages),
            "totalLogs": len(logs),
            "failedLogs": len([log for log in logs if log.status == "failed"]),
        }
        return stats
    finally:
        db.close()


@app.get("/api/accounts")
async def get_accounts():
    db = SessionLocal()
    try:
        accounts = db.query(Account).order_by(Account.createdAt.desc()).all()
        return [serialize_account(account) for account in accounts]
    finally:
        db.close()


@app.post("/api/accounts")
async def create_account(payload: AccountPayload):
    db = SessionLocal()
    try:
        account = Account(
            id=str(uuid4()),
            username=payload.username,
            email=payload.email,
            password=payload.password,
            twoFaCode=payload.twoFaCode,
            proxyIp=payload.proxyIp,
            proxyPort=payload.proxyPort,
            proxyUser=payload.proxyUser,
            proxyPass=payload.proxyPass,
            status=payload.status or "inactive",
            createdAt=now_utc(),
            updatedAt=now_utc(),
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return serialize_account(account)
    finally:
        db.close()


@app.put("/api/accounts/{account_id}")
async def update_account(account_id: str, payload: Dict[str, Any]):
    db = SessionLocal()
    try:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        for key, value in payload.items():
            if hasattr(account, key):
                setattr(account, key, value)

        account.updatedAt = now_utc()
        db.commit()
        db.refresh(account)
        return serialize_account(account)
    finally:
        db.close()


@app.delete("/api/accounts/{account_id}")
async def delete_account(account_id: str):
    db = SessionLocal()
    try:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        db.delete(account)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@app.get("/api/leads")
async def get_leads():
    db = SessionLocal()
    try:
        leads = db.query(Lead).order_by(Lead.createdAt.desc()).all()
        return [serialize_lead(lead) for lead in leads]
    finally:
        db.close()


@app.post("/api/leads")
async def create_lead(payload: LeadPayload):
    db = SessionLocal()
    try:
        lead = Lead(
            id=str(uuid4()),
            tiktokUrl=payload.tiktokUrl,
            username=payload.username,
            displayName=payload.displayName,
            status=payload.status or "free",
            accountId=payload.accountId,
            notes=payload.notes,
            createdAt=now_utc(),
            updatedAt=now_utc(),
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return serialize_lead(lead)
    finally:
        db.close()


@app.put("/api/leads/{lead_id}")
async def update_lead(lead_id: str, payload: Dict[str, Any]):
    db = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")

        for key, value in payload.items():
            if hasattr(lead, key):
                setattr(lead, key, value)

        lead.updatedAt = now_utc()
        db.commit()
        db.refresh(lead)
        return serialize_lead(lead)
    finally:
        db.close()


@app.delete("/api/leads/{lead_id}")
async def delete_lead(lead_id: str):
    db = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")

        db.delete(lead)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@app.get("/api/messages")
async def get_messages():
    db = SessionLocal()
    try:
        messages = db.query(Message).order_by(Message.order.asc(), Message.createdAt.asc()).all()
        return [serialize_message(message) for message in messages]
    finally:
        db.close()


@app.post("/api/messages")
async def create_message(payload: MessagePayload):
    if not payload.content:
        raise HTTPException(status_code=400, detail="Message content is required")

    db = SessionLocal()
    try:
        current_max_order = db.query(Message).count()
        message = Message(
            id=str(uuid4()),
            content=payload.content,
            order=payload.order if payload.order is not None else current_max_order,
            active=True if payload.active is None else payload.active,
            createdAt=now_utc(),
            updatedAt=now_utc(),
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return serialize_message(message)
    finally:
        db.close()


@app.put("/api/messages/{message_id}")
async def update_message(message_id: str, payload: Dict[str, Any]):
    db = SessionLocal()
    try:
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        for key, value in payload.items():
            if hasattr(message, key):
                setattr(message, key, value)

        message.updatedAt = now_utc()
        db.commit()
        db.refresh(message)
        return serialize_message(message)
    finally:
        db.close()


@app.delete("/api/messages/{message_id}")
async def delete_message(message_id: str):
    db = SessionLocal()
    try:
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        db.delete(message)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@app.get("/api/settings")
async def get_settings():
    db = SessionLocal()
    try:
        settings = get_or_create_settings(db)
        return serialize_settings(settings)
    finally:
        db.close()


@app.put("/api/settings")
async def update_settings(payload: SettingsPayload):
    db = SessionLocal()
    try:
        settings = get_or_create_settings(db)
        settings.workers = payload.workers
        settings.browsersPerWorker = payload.browsersPerWorker
        settings.minDelaySeconds = payload.minDelaySeconds
        settings.maxDelaySeconds = payload.maxDelaySeconds
        settings.messagesPerAccount = payload.messagesPerAccount
        settings.failureThreshold = payload.failureThreshold
        settings.updatedAt = now_utc()
        db.commit()
        db.refresh(settings)
        return serialize_settings(settings)
    finally:
        db.close()


@app.get("/api/campaigns")
async def get_campaigns():
    db = SessionLocal()
    try:
        campaign = get_or_create_campaign(db)
        return [serialize_campaign(campaign)]
    finally:
        db.close()


@app.post("/api/campaigns")
async def upsert_campaign(payload: CampaignPayload):
    db = SessionLocal()
    try:
        campaign = get_or_create_campaign(db)
        campaign.status = payload.status
        if payload.status == "running":
            campaign.startedAt = now_utc()
            campaign.stoppedAt = None
            campaign.totalSent = 0
            campaign.totalFailed = 0
            campaign.blockedAccounts = 0
            campaign.activeAccounts = db.query(Account).filter(Account.status.in_(["active", "inactive"])).count()
        else:
            campaign.stoppedAt = now_utc()
        db.commit()
        db.refresh(campaign)
        return serialize_campaign(campaign)
    finally:
        db.close()


@app.get("/api/metrics")
async def get_metrics(days: int = Query(default=7, ge=1, le=90)):
    db = SessionLocal()
    try:
        start_date = now_utc() - timedelta(days=days - 1)
        logs = db.query(MessageLog).filter(MessageLog.sentAt >= start_date).all()
        leads = db.query(Lead).filter(Lead.updatedAt >= start_date).all()

        metric_map: Dict[str, Dict[str, Any]] = {}
        for offset in range(days):
            current = start_date + timedelta(days=offset)
            key = current.strftime("%Y-%m-%d")
            metric_map[key] = {
                "date": current.strftime("%d/%m"),
                "sent": 0,
                "failed": 0,
                "contacted": 0,
                "rejected": 0,
            }

        for log in logs:
            key = log.sentAt.strftime("%Y-%m-%d")
            if key not in metric_map:
                continue
            if log.status == "failed":
                metric_map[key]["failed"] += 1
            else:
                metric_map[key]["sent"] += 1

        for lead in leads:
            key = lead.updatedAt.strftime("%Y-%m-%d")
            if key not in metric_map:
                continue
            if lead.status == "contacted":
                metric_map[key]["contacted"] += 1
            elif lead.status == "rejected":
                metric_map[key]["rejected"] += 1

        return list(metric_map.values())
    finally:
        db.close()


@app.post("/api/login")
async def login(request: LoginRequest):
    try:
        await browser_manager.start()
        result = await login_handler.login(
            account_id=request.accountId,
            username=request.username,
            password=request.password,
            two_fa_code=request.twoFaCode,
            proxy=request.proxy,
        )

        db = SessionLocal()
        try:
            account = db.query(Account).filter(Account.id == request.accountId).first()
            if account:
                account.status = "active" if result.get("success") else "error"
                account.lastLoginAt = now_utc() if result.get("success") else account.lastLoginAt
                account.updatedAt = now_utc()
                db.commit()
        finally:
            db.close()

        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/message")
async def send_message(request: MessageRequest):
    try:
        result = await login_handler.send_message(
            account_id=request.accountId,
            lead_username=request.leadUsername,
            message=request.message,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/campaign/start")
async def start_campaign():
    db = SessionLocal()
    try:
        campaign = get_or_create_campaign(db)
        campaign.status = "running"
        campaign.startedAt = now_utc()
        campaign.stoppedAt = None
        campaign.totalSent = 0
        campaign.totalFailed = 0
        campaign.blockedAccounts = 0
        campaign.activeAccounts = db.query(Account).filter(Account.status.in_(["active", "inactive"])).count()
        db.commit()
    finally:
        db.close()

    try:
        result = await campaign_engine.start()
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/campaign/stop")
async def stop_campaign():
    try:
        result = await campaign_engine.stop()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    db = SessionLocal()
    try:
        campaign = get_or_create_campaign(db)
        stats = result.get("stats", campaign_engine.get_stats())
        campaign.status = "stopped"
        campaign.stoppedAt = now_utc()
        campaign.totalSent = stats.get("sent", campaign.totalSent)
        campaign.totalFailed = stats.get("failed", campaign.totalFailed)
        campaign.activeAccounts = stats.get("active_accounts", campaign.activeAccounts)
        campaign.blockedAccounts = stats.get("blocked_accounts", campaign.blockedAccounts)
        db.commit()
    finally:
        db.close()

    return result


@app.get("/api/campaign/stats")
async def get_campaign_stats():
    return campaign_engine.get_stats()


@app.post("/api/session/save/{account_id}")
async def save_session(account_id: str):
    try:
        await browser_manager.save_session(account_id)
        return {"success": True, "message": "Sesion guardada"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/session/close/{account_id}")
async def close_session(account_id: str):
    try:
        await browser_manager.close_context(account_id)
        return {"success": True, "message": "Sesion cerrada"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("LOCAL_AGENT_PORT", browser_manager.config.get("api", {}).get("local_agent_port", 8765)))
    uvicorn.run(app, host="0.0.0.0", port=port)
