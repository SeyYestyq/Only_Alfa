# Changelog

Все заметные изменения проекта будут фиксироваться в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и проект придерживается [Семантического версионирования](https://semver.org/lang/ru/).

## [Unreleased]

### Added
- Checkpoint 1 MVP: FastAPI (11 эндпоинтов ТЗ), дискретный RiskScore + Decision Engine, seed 5 профилей (815/610/760/495/0), Smart Search, PDF-парсер, SPA (Demo Control Bar, Экраны 1–2, задел Экрана 3).
- `docker-compose.yml` (postgres:16-alpine + backend + frontend), `.env.example`, Dockerfiles, корневой `openapi.yaml`.
- Автотесты pytest: конвейер, скоринг, поиск, PDF, коды 403/409/422.

### Changed
- README — продуктовый runbook для жюри (вместо только пакета правил агентов).
- Decision Engine больше не тянет `settings` из домена (ставка ЦБ через аргумент / константу).
- Устаревший черновик API переименован в `routes_legacy_unused.py` (не подключён).

### Added (ранее)
- Инициализация репозитория.
- Правила для ИИ-агентов и разработчиков (`AGENTS.md`).
- Скилы и стандарты разработки (`skills/`):
  - `skills/01-solid-clean-code.md` — SOLID и чистый код.
  - `skills/02-backend-fastapi.md` — архитектура и стандарты FastAPI бэкенда.
  - `skills/03-frontend-react-ts.md` — стандарты React + TypeScript фронтенда.
  - `skills/04-git-changelog.md` — ветки, Conventional Commits и фиксация изменений.
  - `skills/05-testing-quality.md` — приёмка, метрики и тестирование.
- Базовый `.gitignore` с исключением медиафайлов, видео, аудио и транскрипций.
