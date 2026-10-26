#!/usr/bin/env bash
# ==============================================================================
# Only_Alfa — «Умный кредитный кабинет предпринимателя»
# Скрипт экспресс-запуска в 1 клик для жюри и экспертов хакатона
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${RED}${BOLD}"
cat << 'EOF'
  ____        _             _    _  __       
 / __ \      | |           / \  | |/ _|      
| |  | |_ __ | |_   _     / _ \ | | |_ __ _  
| |  | | '_ \| | | | |   / ___ \| |  _/ _` | 
\____/|_| |_|_|\__, |  /_/   \_\_|_| \__,_| 
                 __/ |                        
                |___/  Умный кредитный кабинет
EOF
echo -e "${NC}"
echo -e "${BOLD}====================================================================${NC}"
echo -e "🚀 Подготовка окружения для экспресс-прогона жюри..."
echo -e "${BOLD}====================================================================${NC}"

# 1. Проверяем наличие .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}ℹ️  Файл .env не найден, копируем эталон из .env.example...${NC}"
    cp .env.example .env
fi

# 2. Проверяем флаг запуска Docker
USE_DOCKER=false
if [ "$1" == "--docker" ] || [ "$1" == "-d" ]; then
    USE_DOCKER=true
fi

# Если передан флаг --docker, или передан аргумент docker
if [ "$USE_DOCKER" = true ]; then
    if command -v docker &> /dev/null; then
        echo -e "${BLUE}🐳 Запуск в Docker Compose (PostgreSQL 16 + FastAPI + Nginx SPA)...${NC}"
        echo -e "Лимит памяти: < 2 ГБ ОЗУ (соответствие требованиям жюри)."
        docker compose up --build
        exit 0
    else
        echo -e "${RED}❌ Docker не найден в PATH. Переключаемся на локальный запуск...${NC}"
    fi
fi

# 3. Локальный запуск (Zero-Docker / Нативный)
echo -e "${GREEN}⚡ Режим: Локальный запуск без Docker (FastAPI + Vite Dev Server + SQLite)...${NC}"

# Проверяем Python
PYTHON_CMD=""
if [ -f ".venv/bin/python" ]; then
    PYTHON_CMD=".venv/bin/python"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}❌ Python не найден! Установите Python 3.10+ для локального запуска.${NC}"
    exit 1
fi

# Создание виртуального окружения, если его нет
if [ ! -f ".venv/bin/activate" ]; then
    echo -e "${YELLOW}📦 Создание виртуального окружения .venv...${NC}"
    $PYTHON_CMD -m venv .venv
    PYTHON_CMD=".venv/bin/python"
    echo -e "${YELLOW}📥 Установка зависимостей backend...${NC}"
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r backend/requirements.txt
fi

# Проверяем Node.js & npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js / npm не найден! Установите Node.js 18+ для запуска фронтенда.${NC}"
    exit 1
fi

# Проверяем зависимости frontend
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📥 Установка зависимостей frontend (npm install)...${NC}"
    (cd frontend && npm install)
fi

# Инициализируем БД и демо-сид (5 компаний)
echo -e "${BLUE}🌱 Инициализация схемы и сидирование 5 эталонных компаний...${NC}"
.venv/bin/python -c "
from app.infra.database import create_schema, SessionLocal
from app.infra.seed import seed_database
create_schema()
with SessionLocal() as s:
    seed_database(s)
" 2>/dev/null || true

# Очистка процессов при выходе (Ctrl+C)
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Остановка сервисов Only_Alfa...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Все процессы успешно остановлены.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Запуск Backend
echo -e "${GREEN}🚀 Запуск FastAPI Backend на http://localhost:8000 ...${NC}"
export DATABASE_URL="sqlite:///./alfa.db"
export CBR_KEY_RATE="14.0"
export AI_PROVIDER_MODE="DETERMINISTIC"

.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend > /dev/null 2>&1 &
BACKEND_PID=$!

# Ожидание готовности Backend
echo -n "⏳ Ожидание готовности API"
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/health | grep -q "ok" 2>/dev/null; then
        echo -e " ${GREEN}[ГОТОВО]${NC}"
        break
    fi
    sleep 0.5
    echo -n "."
done

# Запуск Frontend
echo -e "${GREEN}🚀 Запуск Frontend (Vite) на http://localhost:5173 ...${NC}"
(cd frontend && npm run dev -- --host 127.0.0.1 --port 5173) &
FRONTEND_PID=$!

# Ожидание готовности Frontend
sleep 1.5

echo ""
echo -e "${BOLD}====================================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 Стенд «Only_Alfa» УСПЕШНО ЗАПУЩЕН!${NC}"
echo -e "${BOLD}====================================================================${NC}"
echo -e "🖥️  ${BOLD}Веб-интерфейс:${NC}      ${BLUE}http://localhost:5173${NC}"
echo -e "📑  ${BOLD}Swagger API:${NC}        ${BLUE}http://localhost:8000/docs${NC}"
echo -e "🩺  ${BOLD}Healthcheck:${NC}        ${BLUE}http://localhost:8000/health${NC}"
echo -e "📋  ${BOLD}Гид жюри (3 мин):${NC}   ${YELLOW}docs/07_QA_Acceptance_and_Test_Scenarios.md${NC}"
echo -e "${BOLD}====================================================================${NC}"
echo -e "💡 В шапке сайта доступен ${BOLD}Demo Control Bar${NC}: переключайте роли и компании в 1 клик!"
echo -e "Нажмите ${BOLD}Ctrl + C${NC} для корректной остановки всех сервисов."
echo ""

# Автоматически открываем браузер, если поддерживается
if command -v open &> /dev/null; then
    open "http://localhost:5173" 2>/dev/null || true
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:5173" 2>/dev/null || true
fi

# Ожидаем фоновые процессы
wait
