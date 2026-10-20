# Only_Alfa — Умный кредитный кабинет предпринимателя

Хакатон «Альфа-Будущее» · команда Only_Alfa · репозиторий [SeyYestyq/Only_Alfa](https://github.com/SeyYestyq/Only_Alfa)

Стек: React 18 + Vite + TypeScript · Python 3.12 + FastAPI · PostgreSQL 16 · `docker compose up --build`

Правила для агентов и команды: [`AGENTS.md`](./AGENTS.md) · скиллы в [`skills/`](./skills/)

## Быстрый старт (жюри / демо)

```bash
cp .env.example .env
docker compose up --build
```

| Сервис   | URL |
|----------|-----|
| SPA      | http://localhost:8080 |
| API docs | http://localhost:8000/docs |
| Health   | http://localhost:8000/health |
| OpenAPI  | [`openapi.yaml`](./openapi.yaml) |

Норматив памяти трёх контейнеров: **≤ 4 ГБ ОЗУ** (`docker stats`).

## Чекпоинт 1 — сквозные 5 демо-профилей

| # | Компания | Ожидание |
|---|----------|----------|
| 1 | ИП Смирнов (кофейня) | RiskScore **815** → APPROVED → ПЭП → FUNDED |
| 2 | ООО «Ростерс Кафе» | **610** → 4 контр-оффера → CEO ПЭП (сотрудник = 403) |
| 3 | ООО «ТехноСтрой» | ANOMALY → Мультибанк → **760** → APPROVED |
| 4 | ИП Ковалев | **495** → MANUAL_REVIEW (Экран 3 / инспектор) |
| 5 | ООО «Бодрость Плюс» | Hard Stop → **0** / REJECTED |

Demo Control Bar переключает компанию, роль и экраны «бизнес / банк».

## Локальная разработка без Docker

```bash
# Backend
cd backend
python -m venv ../.venv && source ../.venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=sqlite:///./alfa.db CBR_KEY_RATE=14.0 AI_PROVIDER_MODE=DETERMINISTIC
uvicorn app.main:app --reload --port 8000

# Frontend (другой терминал)
cd frontend && npm ci && npm run dev
# http://localhost:5173  (прокси /api → :8000)
```

Тесты: `cd backend && pytest -q` (эталон 815 / 610 / 760 / 495 / 0).

## Ветки по ТЗ

| Ветка | Зона |
|-------|------|
| `feature/frontend-spa` | ТЗ-01 Frontend |
| `feature/backend-core` | ТЗ-02 Backend core |
| `feature/scoring-data` | ТЗ-03 Scoring / Decision |
| `feature/smart-search` | ТЗ-04 Smart search / PDF |
| `feature/qa-acceptance` | ТЗ-05 QA |

`main` — защищённая; работа только через feature-ветки и PR.

## Контракт API

11 канонических эндпоинтов ТЗ + SPA-хелперы (`accept-offer`, `invoice-templates`, …) — см. [`openapi.yaml`](./openapi.yaml).
