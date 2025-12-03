@echo off
REM HD4 Scheduler Full Stack Startup Script for Windows

echo.
echo ========================================
echo  HD4 Scheduler Full Stack Startup
echo ========================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo [OK] Python and Node.js are installed
echo.

REM Install Python dependencies if needed
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [INFO] Installing Python dependencies...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
    echo [OK] Using existing Python virtual environment
)

REM Install frontend dependencies if needed
if not exist "Frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd Frontend
    call npm install
    cd ..
) else (
    echo [OK] Frontend dependencies already installed
)

echo.
echo [OK] All dependencies are ready
echo.

REM Initialize database
echo [INFO] Initializing database...
python init_db.py
echo [OK] Database initialized
echo.

REM Create .env file for frontend if it doesn't exist
if not exist "Frontend\.env" (
    echo [INFO] Creating frontend .env file...
    echo VITE_API_URL=http://localhost:8000 > Frontend\.env
    echo [OK] Frontend .env file created
)

echo.
echo ========================================
echo  Starting Services
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start backend
echo [INFO] Starting backend...
start /B python backend.py > backend.log 2>&1

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo [INFO] Starting frontend...
cd Frontend
start /B npm run dev > ..\frontend.log 2>&1
cd ..

echo.
echo [OK] All services are running!
echo.
echo Logs:
echo   - Backend:  type backend.log
echo   - Frontend: type frontend.log
echo.

REM Keep window open
pause

