@echo off
echo Iniciando Insta-Cli-Tiktok Local Agent...
cd /d "%~dp0"
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
python main.py
pause
