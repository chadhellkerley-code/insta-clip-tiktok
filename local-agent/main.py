import os
import sys
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.browser.manager import browser_manager
from src.tiktok.login import login_handler
from src.campaign.engine import campaign_engine

app = FastAPI(title="Insta-Cli-Tiktok Local Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class LoginRequest(BaseModel):
    accountId: str
    username: str
    password: str
    twoFaCode: Optional[str] = None
    proxy: Optional[dict] = None

class MessageRequest(BaseModel):
    accountId: str
    leadUsername: str
    message: str

class CampaignResponse(BaseModel):
    success: bool
    message: str
    stats: Optional[dict] = None

@app.get("/health")
async def health():
    return {"status": "ok", "agent": "Insta-Cli-Tiktok", "version": "1.0.0"}

@app.post("/api/login")
async def login(request: LoginRequest):
    """Iniciar sesión en TikTok"""
    try:
        await browser_manager.start()
        result = await login_handler.login(
            account_id=request.accountId,
            username=request.username,
            password=request.password,
            two_fa_code=request.twoFaCode,
            proxy=request.proxy,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/message")
async def send_message(request: MessageRequest):
    """Enviar mensaje a un lead"""
    try:
        result = await login_handler.send_message(
            account_id=request.accountId,
            lead_username=request.leadUsername,
            message=request.message,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/start")
async def start_campaign():
    """Iniciar campaña de mensajes"""
    try:
        result = await campaign_engine.start()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/stop")
async def stop_campaign():
    """Detener campaña"""
    try:
        result = await campaign_engine.stop()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/campaign/stats")
async def get_campaign_stats():
    """Obtener estadísticas de la campaña"""
    return campaign_engine.get_stats()

@app.post("/api/session/save/{account_id}")
async def save_session(account_id: str):
    """Guardar sesión manualmente"""
    try:
        await browser_manager.save_session(account_id)
        return {"success": True, "message": "Sesión guardada"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/session/close/{account_id}")
async def close_session(account_id: str):
    """Cerrar sesión y guardar"""
    try:
        await browser_manager.close_context(account_id)
        return {"success": True, "message": "Sesión cerrada"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
