import os
import json
import random
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROFILES_DIR = os.path.join(BASE_DIR, "profiles")
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")
CONFIG_PATH = os.path.join(BASE_DIR, "..", "shared-config", "tiktok-config.json")

os.makedirs(PROFILES_DIR, exist_ok=True)
os.makedirs(SESSIONS_DIR, exist_ok=True)

class BrowserManager:
    def __init__(self):
        self.playwright = None
        self.browsers: Dict[str, Browser] = {}
        self.contexts: Dict[str, BrowserContext] = {}
        self.pages: Dict[str, Page] = {}
        self.config = self._load_config()

    def _load_config(self) -> dict:
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)

    def _get_profile_path(self, account_id: str) -> str:
        return os.path.join(PROFILES_DIR, account_id)

    def _get_session_path(self, account_id: str) -> str:
        return os.path.join(SESSIONS_DIR, f"{account_id}.json")

    def _get_proxy_config(self, proxy: Optional[dict]) -> Optional[dict]:
        if not proxy or not proxy.get("ip"):
            return None

        proxy_url = f"http://{proxy['ip']}:{proxy.get('port', '80')}"

        config = {
            "server": proxy_url,
        }

        if proxy.get("username") and proxy.get("password"):
            config["username"] = proxy["username"]
            config["password"] = proxy["password"]

        return config

    def _get_timezone(self, proxy: Optional[dict]) -> str:
        """Obtener timezone basado en proxy o sistema local"""
        if proxy and proxy.get("ip"):
            # Si hay proxy, usar timezone del proxy (simplificado)
            # En producción, usar geolocalización IP
            return "America/New_York"

        # Usar timezone local del sistema
        import tzlocal
        return str(tzlocal.get_localzone())

    async def start(self):
        if self.playwright:
            return
        self.playwright = await async_playwright().start()

    async def create_context(self, account_id: str, proxy: Optional[dict] = None) -> BrowserContext:
        profile_path = self._get_profile_path(account_id)
        os.makedirs(profile_path, exist_ok=True)

        browser_config = self.config["browser"]
        user_agent = random.choice(browser_config["user_agents"])

        proxy_config = self._get_proxy_config(proxy)
        timezone = self._get_timezone(proxy)

        # Cargar sesión previa si existe
        session_path = self._get_session_path(account_id)
        storage_state = None
        if os.path.exists(session_path):
            with open(session_path, "r") as f:
                storage_state = json.load(f)

        context_args = {
            "user_agent": user_agent,
            "viewport": browser_config["default_viewport"],
            "locale": "es-ES",
            "timezone_id": timezone,
            "permissions": ["geolocation"],
            "color_scheme": "dark",
        }

        if proxy_config:
            context_args["proxy"] = proxy_config

        if storage_state:
            context_args["storage_state"] = storage_state

        browser = await self.playwright.chromium.launch_persistent_context(
            user_data_dir=profile_path,
            headless=False,
            args=browser_config["chrome_args"],
            **context_args
        )

        self.contexts[account_id] = browser
        return browser

    async def get_page(self, account_id: str) -> Page:
        if account_id not in self.pages or self.pages[account_id].is_closed():
            context = self.contexts.get(account_id)
            if not context:
                raise Exception(f"No context found for account {account_id}")

            pages = context.pages
            if pages:
                self.pages[account_id] = pages[0]
            else:
                self.pages[account_id] = await context.new_page()

        return self.pages[account_id]

    async def save_session(self, account_id: str):
        """Guardar el estado de la sesión al cerrar"""
        context = self.contexts.get(account_id)
        if not context:
            return

        try:
            storage_state = await context.storage_state()
            session_path = self._get_session_path(account_id)
            with open(session_path, "w") as f:
                json.dump(storage_state, f)
        except Exception as e:
            print(f"Error saving session for {account_id}: {e}")

    async def close_context(self, account_id: str):
        """Cerrar contexto y guardar sesión"""
        await self.save_session(account_id)

        if account_id in self.pages:
            del self.pages[account_id]

        if account_id in self.contexts:
            try:
                await self.contexts[account_id].close()
            except:
                pass
            del self.contexts[account_id]

    async def close_all(self):
        for account_id in list(self.contexts.keys()):
            await self.close_context(account_id)

        if self.playwright:
            await self.playwright.stop()
            self.playwright = None

    async def human_type(self, page: Page, selector: str, text: str):
        """Escribir como humano con delays aleatorios"""
        delays = self.config["tiktok"]["delays"]["typing_speed"]

        await page.click(selector)
        await page.fill(selector, "")

        for char in text:
            await page.type(selector, char, delay=random.randint(delays["min"], delays["max"]))
            await asyncio.sleep(random.uniform(0.05, 0.15))

    async def human_delay(self, min_seconds: Optional[int] = None, max_seconds: Optional[int] = None):
        """Delay aleatorio para simular comportamiento humano"""
        delays = self.config["tiktok"]["delays"]["message_interval"]
        min_s = min_seconds or delays["min"]
        max_s = max_seconds or delays["max"]
        await asyncio.sleep(random.uniform(min_s, max_s))

browser_manager = BrowserManager()
