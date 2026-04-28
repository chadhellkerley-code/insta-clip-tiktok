import asyncio
import random
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from src.database.db import SessionLocal, Account, Lead, Message, MessageLog, CampaignSetting
from src.browser.manager import browser_manager
from src.tiktok.login import login_handler

class CampaignEngine:
    def __init__(self):
        self.running = False
        self.workers: List[asyncio.Task] = []
        self.stats = {
            "sent": 0,
            "failed": 0,
            "active_accounts": 0,
            "blocked_accounts": 0,
        }

    def get_settings(self) -> CampaignSetting:
        db = SessionLocal()
        try:
            settings = db.query(CampaignSetting).first()
            if not settings:
                settings = CampaignSetting(
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
        finally:
            db.close()

    def get_active_accounts(self) -> List[Account]:
        db = SessionLocal()
        try:
            return db.query(Account).filter(Account.status.in_(["active", "inactive"])).all()
        finally:
            db.close()

    def get_free_leads(self) -> List[Lead]:
        db = SessionLocal()
        try:
            return db.query(Lead).filter(Lead.status == "free").all()
        finally:
            db.close()

    def get_active_messages(self) -> List[Message]:
        db = SessionLocal()
        try:
            return db.query(Message).filter(Message.active == True).order_by(Message.order).all()
        finally:
            db.close()

    def log_message(self, account_id: str, lead_id: str, message_id: str, status: str, error_msg: str = None):
        db = SessionLocal()
        try:
            log = MessageLog(
                accountId=account_id,
                leadId=lead_id,
                messageId=message_id,
                status=status,
                errorMsg=error_msg,
            )
            db.add(log)

            # Actualizar lead
            lead = db.query(Lead).filter(Lead.id == lead_id).first()
            if lead and status == "sent":
                lead.status = "contacted"
                lead.accountId = account_id

            db.commit()
        finally:
            db.close()

    def update_account_status(self, account_id: str, status: str):
        db = SessionLocal()
        try:
            account = db.query(Account).filter(Account.id == account_id).first()
            if account:
                account.status = status
                db.commit()
        finally:
            db.close()

    async def worker_task(self, worker_id: int, accounts: List[Account], 
                          leads: List[Lead], messages: List[Message], settings: CampaignSetting):
        """Tarea de worker que procesa cuentas"""
        message_index = 0
        account_failures: Dict[str, int] = {a.id: 0 for a in accounts}
        account_message_count: Dict[str, int] = {a.id: 0 for a in accounts}

        while self.running:
            for account in accounts:
                if not self.running:
                    break

                if account.status == "blocked":
                    continue

                if account_message_count[account.id] >= settings.messagesPerAccount:
                    continue

                # Encontrar lead libre
                free_lead = None
                for lead in leads:
                    if lead.status == "free":
                        free_lead = lead
                        break

                if not free_lead:
                    print(f"Worker {worker_id}: No hay leads libres")
                    await asyncio.sleep(10)
                    continue

                # Seleccionar mensaje rotativo
                if not messages:
                    print(f"Worker {worker_id}: No hay mensajes activos")
                    await asyncio.sleep(10)
                    continue

                message = messages[message_index % len(messages)]
                message_index += 1

                try:
                    # Login si es necesario
                    if account.status != "active":
                        proxy = None
                        if account.proxyIp:
                            proxy = {
                                "ip": account.proxyIp,
                                "port": account.proxyPort,
                                "username": account.proxyUser,
                                "password": account.proxyPass,
                            }

                        login_result = await login_handler.login(
                            account.id,
                            account.username,
                            account.password,
                            account.twoFaCode,
                            proxy
                        )

                        if login_result["success"]:
                            self.update_account_status(account.id, "active")
                        else:
                            account_failures[account.id] += 1
                            if account_failures[account.id] >= settings.failureThreshold:
                                self.update_account_status(account.id, "blocked")
                                self.stats["blocked_accounts"] += 1
                            continue

                    # Enviar mensaje
                    result = await login_handler.send_message(
                        account.id,
                        free_lead.username,
                        message.content
                    )

                    if result["success"]:
                        self.log_message(account.id, free_lead.id, message.id, "sent")
                        self.stats["sent"] += 1
                        account_message_count[account.id] += 1
                        account_failures[account.id] = 0
                    else:
                        self.log_message(account.id, free_lead.id, message.id, "failed", result["message"])
                        self.stats["failed"] += 1
                        account_failures[account.id] += 1

                        if account_failures[account.id] >= settings.failureThreshold:
                            self.update_account_status(account.id, "blocked")
                            self.stats["blocked_accounts"] += 1

                    # Delay aleatorio
                    delay = random.uniform(settings.minDelaySeconds, settings.maxDelaySeconds)
                    await asyncio.sleep(delay)

                except Exception as e:
                    print(f"Worker {worker_id} error: {e}")
                    account_failures[account.id] += 1
                    await asyncio.sleep(5)

    async def start(self):
        """Iniciar campaña"""
        if self.running:
            return {"success": False, "message": "La campaña ya está corriendo"}

        self.running = True
        self.stats = {"sent": 0, "failed": 0, "active_accounts": 0, "blocked_accounts": 0}

        # Iniciar browser manager
        await browser_manager.start()

        # Obtener configuración
        settings = self.get_settings()

        # Obtener datos
        accounts = self.get_active_accounts()
        leads = self.get_free_leads()
        messages = self.get_active_messages()

        if not accounts:
            self.running = False
            return {"success": False, "message": "No hay cuentas disponibles"}

        if not leads:
            self.running = False
            return {"success": False, "message": "No hay leads libres"}

        if not messages:
            self.running = False
            return {"success": False, "message": "No hay mensajes activos"}

        # Distribuir cuentas entre workers
        num_workers = min(settings.workers, len(accounts))
        accounts_per_worker = len(accounts) // num_workers

        for i in range(num_workers):
            start_idx = i * accounts_per_worker
            end_idx = start_idx + accounts_per_worker if i < num_workers - 1 else len(accounts)
            worker_accounts = accounts[start_idx:end_idx]

            task = asyncio.create_task(
                self.worker_task(i + 1, worker_accounts, leads, messages, settings)
            )
            self.workers.append(task)

        self.stats["active_accounts"] = len(accounts)

        return {
            "success": True,
            "message": f"Campaña iniciada con {num_workers} workers",
            "workers": num_workers,
            "accounts": len(accounts),
            "leads": len(leads),
        }

    async def stop(self):
        """Detener campaña"""
        self.running = False

        # Cancelar workers
        for task in self.workers:
            task.cancel()

        self.workers = []

        # Cerrar todos los browsers
        await browser_manager.close_all()

        return {
            "success": True,
            "message": "Campaña detenida",
            "stats": self.stats,
        }

    def get_stats(self):
        return self.stats

campaign_engine = CampaignEngine()
