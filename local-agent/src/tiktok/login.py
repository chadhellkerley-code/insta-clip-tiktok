import asyncio
import json
import random
from datetime import datetime
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout
from src.browser.manager import browser_manager

class TikTokLoginHandler:
    def __init__(self):
        self.config = browser_manager.config
        self.selectors = self.config["tiktok"]["selectors"]
        self.delays = self.config["tiktok"]["delays"]

    async def login(self, account_id: str, username: str, password: str, 
                    two_fa_code: str = None, proxy: dict = None) -> dict:
        """Login en TikTok con Playwright"""
        result = {
            "success": False,
            "message": "",
            "account_id": account_id,
        }

        try:
            # Crear contexto persistente
            context = await browser_manager.create_context(account_id, proxy)
            page = await context.new_page()

            # Navegar a login
            login_url = self.config["tiktok"]["login_url"]
            await page.goto(login_url, wait_until="networkidle", timeout=30000)

            # Aceptar cookies si aparece
            try:
                cookie_btn = page.locator(self.selectors["accept_cookies"])
                if await cookie_btn.is_visible(timeout=3000):
                    await cookie_btn.click()
                    await asyncio.sleep(1)
            except:
                pass

            # Ingresar username/email
            await browser_manager.human_type(page, self.selectors["email_input"], username)
            await asyncio.sleep(random.uniform(0.5, 1.5))

            # Ingresar password
            await browser_manager.human_type(page, self.selectors["password_input"], password)
            await asyncio.sleep(random.uniform(0.5, 1.5))

            # Click en login
            await page.click(self.selectors["login_button"])

            # Esperar resultado
            await asyncio.sleep(3)

            # Verificar si pide 2FA
            try:
                two_fa_input = page.locator(self.selectors["two_fa_input"])
                if await two_fa_input.is_visible(timeout=10000):
                    if two_fa_code:
                        await browser_manager.human_type(
                            page, self.selectors["two_fa_input"], two_fa_code
                        )
                        await page.click(self.selectors["two_fa_submit"])
                        await asyncio.sleep(5)
                    else:
                        result["message"] = "2FA requerido pero no proporcionado"
                        await browser_manager.save_session(account_id)
                        return result
            except PlaywrightTimeout:
                pass

            # Verificar si hay captcha
            try:
                captcha = page.locator(self.selectors["captcha_frame"])
                if await captcha.is_visible(timeout=5000):
                    result["message"] = "Captcha detectado - Resuélvelo manualmente"
                    # Esperar a que el usuario resuelva el captcha
                    await asyncio.sleep(self.delays["login_wait"])
            except:
                pass

            # Verificar login exitoso
            await asyncio.sleep(3)

            # Intentar navegar al perfil para verificar sesión
            try:
                await page.goto(
                    f"{self.config['tiktok']['base_url']}/@{username.replace('@', '')}",
                    wait_until="networkidle",
                    timeout=30000
                )

                # Verificar elementos de perfil
                profile_elements = [
                    self.selectors["profile_avatar"],
                    self.selectors["profile_username"],
                ]

                logged_in = False
                for selector in profile_elements:
                    try:
                        if await page.locator(selector).is_visible(timeout=5000):
                            logged_in = True
                            break
                    except:
                        continue

                if logged_in:
                    result["success"] = True
                    result["message"] = "Login exitoso"

                    # Guardar sesión
                    await browser_manager.save_session(account_id)
                else:
                    result["message"] = "No se pudo verificar el login"

            except Exception as e:
                result["message"] = f"Error verificando perfil: {str(e)}"

        except Exception as e:
            result["message"] = f"Error en login: {str(e)}"

        return result

    async def send_message(self, account_id: str, lead_username: str, message: str) -> dict:
        """Enviar mensaje a un lead"""
        result = {
            "success": False,
            "message": "",
        }

        try:
            page = await browser_manager.get_page(account_id)

            # Navegar al perfil del lead
            await page.goto(
                f"{self.config['tiktok']['base_url']}/@{lead_username.replace('@', '')}",
                wait_until="networkidle",
                timeout=30000
            )

            await asyncio.sleep(2)

            # Click en botón de mensaje
            try:
                dm_btn = page.locator(self.selectors["dm_button"])
                await dm_btn.click(timeout=10000)
                await asyncio.sleep(2)
            except:
                result["message"] = "No se encontró botón de mensaje"
                return result

            # Escribir mensaje
            await browser_manager.human_type(page, self.selectors["message_input"], message)
            await asyncio.sleep(1)

            # Enviar
            await page.click(self.selectors["message_send"])
            await asyncio.sleep(2)

            result["success"] = True
            result["message"] = "Mensaje enviado"

            # Guardar sesión
            await browser_manager.save_session(account_id)

        except Exception as e:
            result["message"] = f"Error enviando mensaje: {str(e)}"

        return result

login_handler = TikTokLoginHandler()
