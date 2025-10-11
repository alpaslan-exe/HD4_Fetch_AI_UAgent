@echo off
REM HD4 Fetch.AI UAgent Quick Start Script for Windows

echo ==================================================
echo HD4 Fetch.AI UAgent Template - Quick Start
echo ==================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python 3 is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo [OK] Python found: %PYTHON_VERSION%
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo.
echo Installing dependencies...
pip install -q -r requirements.txt

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [OK] Dependencies installed successfully

echo.
echo ==================================================
echo Setup Complete!
echo ==================================================
echo.
echo Available examples:
echo   1. python agent.py                    - Basic agent
echo   2. python agent_advanced.py           - Advanced features
echo   3. python agent_communication.py      - Agent communication
echo   4. python example_usage.py            - Custom usage example
echo.
echo To activate the environment manually:
echo   venv\Scripts\activate.bat
echo.
echo To deactivate:
echo   deactivate
echo.
echo ==================================================
echo.
pause
