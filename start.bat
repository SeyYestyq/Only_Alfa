@echo off
chcp 65001 > nul
title Only_Alfa - Умный кредитный кабинет

echo ====================================================================
echo   Only_Alfa - Умный кредитный кабинет предпринимателя
echo   Экспресс-запуск для жюри хакатона (Windows)
echo ====================================================================
echo.

cd /d "%~dp0"

:: 1. Проверка .env
if not exist .env (
    echo [i] Создаем .env из .env.example...
    copy .env.example .env > nul
)

:: 2. Проверка флага docker
if "%1"=="--docker" (
    echo [Docker] Запуск через Docker Compose...
    docker compose up --build
    goto :eof
)

echo [1/4] Проверка окружения Python и Node.js...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Ошибка: Python не найден в PATH! Установите Python 3.10+
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Ошибка: Node.js / npm не найден в PATH! Установите Node.js 18+
    pause
    exit /b 1
)

:: Проверка и создание виртуального окружения
if not exist .venv (
    echo [2/4] Создание виртуального окружения .venv и установка библиотек...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r backend\requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

:: Проверка зависимостей фронтенда
if not exist frontend\node_modules (
    echo [3/4] Установка пакетов фронтенда (npm install)...
    cd frontend
    call npm install
    cd ..
)

:: Инициализация БД
echo [4/4] Инициализация БД SQLite и сидирование 5 компаний...
set DATABASE_URL=sqlite:///./alfa.db
set CBR_KEY_RATE=14.0
set AI_PROVIDER_MODE=DETERMINISTIC

python -c "from app.infra.database import create_schema, SessionLocal; from app.infra.seed import seed_database; create_schema(); with SessionLocal() as s: seed_database(s)" 2>nul

echo.
echo ====================================================================
echo Запуск Backend и Frontend в отдельных окнах...
echo ====================================================================
echo.

start "Only_Alfa Backend (FastAPI)" cmd /k "call .venv\Scripts\activate.bat && set DATABASE_URL=sqlite:///./alfa.db && set CBR_KEY_RATE=14.0 && set AI_PROVIDER_MODE=DETERMINISTIC && uvicorn app.main:app --port 8000 --app-dir backend"

start "Only_Alfa Frontend (Vite)" cmd /k "cd frontend && npm run dev -- --port 5173"

timeout /t 3 >nul

echo.
echo ====================================================================
echo   🎉 Стенд «Only_Alfa» успешно запущен!
echo ====================================================================
echo   Веб-интерфейс:    http://localhost:5173
echo   Swagger API:      http://localhost:8000/docs
echo   Healthcheck:      http://localhost:8000/health
echo   Гид жюри (3 мин): docs\07_QA_Acceptance_and_Test_Scenarios.md
echo ====================================================================
echo.

start http://localhost:5173
