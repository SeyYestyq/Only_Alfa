# Third-Party Notices

Проект использует открытые библиотеки и образы. Ниже — прямые зависимости и ключевые транзитивные компоненты с лицензиями. Это предварительная инвентаризация для сдачи хакатонного проекта, а не юридическое заключение: перед коммерческим распространением нужна проверка лицензий юридической службой.

## Содержание

- [1. Принцип лицензионной чистоты](#1-принцип-лицензионной-чистоты)
- [2. Python-рантайм и backend](#2-python-рантайм-и-backend)
- [3. Frontend и edge](#3-frontend-и-edge)
- [4. База данных](#4-база-данных)
- [5. Hugging Face и open-weights модели](#5-hugging-face-и-open-weights-модели)
- [6. Внешние API и критический путь](#6-внешние-api-и-критический-путь)
- [7. Как проверить состав зависимостей](#7-как-проверить-состав-зависимостей)

## 1. Принцип лицензионной чистоты

- В критическом пути нет платных API и внешних LLM.
- Все обязательные вычисления — скоринг, Decision Engine, State Machine, прогноз кассы, PDF-парсинг — выполняются локально.
- Внешние реестры заменены локальными симуляторами, поэтому демо работает без сетевых лицензий.
- Опциональный OpenAI-compatible адаптер использует `httpx` и не является зависимостью решения по заявке.
- При распространении сборки нужно сохранить уведомления об авторских правах и тексты лицензий MIT/BSD/Apache-2.0 из upstream-репозиториев.

## 2. Python-рантайм и backend

| Компонент | Версия | Лицензия | Ссылка | Использование |
|---|---:|---|---|---|
| Python | 3.12 | PSF-2.0 | https://docs.python.org/3/license.html | Рантайм backend |
| FastAPI | 0.115.0 | MIT | https://github.com/fastapi/fastapi | HTTP-роуты, OpenAPI, DI |
| Starlette | 0.38.6 | BSD-3-Clause | https://github.com/encode/starlette | ASGI-основа FastAPI (транзитивно) |
| Uvicorn | 0.30.6 | BSD-3-Clause | https://github.com/encode/uvicorn | ASGI-сервер |
| SQLAlchemy | 2.0.36 | MIT | https://github.com/sqlalchemy/sqlalchemy | ORM и запросы |
| Pydantic | 2.9.2 | MIT | https://github.com/pydantic/pydantic | Схемы запросов и ответов |
| psycopg | 3.2.3 | LGPL-3.0-only | https://github.com/psycopg/psycopg | Драйвер PostgreSQL |
| pdfplumber | 0.11.4 | MIT | https://github.com/jsvine/pdfplumber | Извлечение текста из PDF |
| pdfminer.six | 20231228 | MIT | https://github.com/pdfminer/pdfminer.six | Парсинг PDF (транзитивно) |
| httpx | 0.27.2 | BSD-3-Clause | https://github.com/encode/httpx | Опциональный OpenAI-compatible вызов |
| python-multipart | 0.0.12 | Apache-2.0 | https://github.com/Kludex/python-multipart | Загрузка PDF через multipart |
| pytest | 8.3.3 | MIT | https://github.com/pytest-dev/pytest | Автотесты |

Примечание по `psycopg`: библиотека распространяется под LGPL-3.0. Она используется как отдельная динамическая зависимость, а не как часть кода проекта; при распространении нужно сохранить уведомления и обеспечить возможность замены библиотеки.

## 3. Frontend и edge

| Компонент | Версия | Лицензия | Ссылка | Использование |
|---|---:|---|---|---|
| React | 18.3.1 | MIT | https://github.com/facebook/react | UI-компоненты |
| React DOM | 18.3.1 | MIT | https://github.com/facebook/react | Рендеринг |
| recharts | 3.x | MIT | https://github.com/recharts/recharts | Прогноз кассы 60 дней, Waterfall скоринга |
| zustand | 5.x | MIT | https://github.com/pmndrs/zustand | Demo Control Bar (экран / роль / режим) |
| react-dropzone | 20.x | MIT | https://github.com/react-dropzone/react-dropzone | Drag-and-drop PDF-счетов |
| lucide-react | 1.x | ISC | https://github.com/lucide-icons/lucide | SVG-иконки UI |
| react-leaflet | 4.2.1 | Hippocratic-2.1 | https://github.com/PaulLeCam/react-leaflet | Карта GeoScore + офлайн SVG-фолбэк |
| Leaflet | 1.9.4 | BSD-2-Clause | https://github.com/Leaflet/Leaflet | Ядро карты (транзитивно) |
| openapi-typescript | 7.13.0 | MIT | https://github.com/openapi-ts/openapi-typescript | Генерация `src/types/api.d.ts` из openapi.yaml |
| Vite | 5.4.21 | MIT | https://github.com/vitejs/vite | Сборка и dev-сервер |
| TypeScript | 5.6.3 | Apache-2.0 | https://github.com/microsoft/TypeScript | Типизация |
| @vitejs/plugin-react | 4.7.0 | MIT | https://github.com/vitejs/vite-plugin-react | React-плагин Vite |
| Node.js | 20 | MIT | https://github.com/nodejs/node | Сборка frontend (только build-стадия) |
| nginx | 1.27-alpine | BSD-2-Clause | https://github.com/nginx/nginx | Статика SPA, reverse proxy |
| core-ds/core-components | — | MIT | https://github.com/core-ds/core-components | Референс палитры (#EF3124 / #1A1D24); тяжёлый пакет не установлен |

`nginx:1.27-alpine` — официальный образ; в него также входят компоненты Alpine Linux и сторонние библиотеки с собственными лицензиями. Для продукта нужен полный SBOM образа.

## 4. База данных

| Компонент | Версия | Лицензия | Ссылка | Использование |
|---|---:|---|---|---|
| PostgreSQL | 16 | PostgreSQL License | https://www.postgresql.org/about/licence/ | Основная БД в Docker |
| SQLite | 3 | Public Domain | https://www.sqlite.org/copyright.html | Локальный фолбэк и тесты |

Лицензия PostgreSQL близка к BSD/MIT: разрешает использование, изменение и распространение при сохранении уведомления об авторских правах. SQLite находится в общественном достоянии.

## 5. Hugging Face и open-weights модели

Сейчас Hugging Face SDK в зависимости **не подключён**. В коде есть только OpenAI-compatible HTTP-адаптер (`httpx`), который можно направить на локальный или внешний шлюз. Если open-weights модель будет подключена, лицензия зависит от конкретной модели:

| Компонент / модель | Лицензия | Статус | Ссылка и комментарий |
|---|---|---|---|
| `Qwen/Qwen2.5-7B-Instruct` | Apache-2.0 | Рекомендуемая модель (Open Weights) | [Hugging Face: Qwen/Qwen2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct) — совместима с OpenAI API |
| `transformers` | Apache-2.0 | Опционально для self-hosted | [transformers upstream](https://github.com/huggingface/transformers) |
| `pdfplumber` | MIT | Включён в ядро | [pdfplumber upstream](https://github.com/jsvine/pdfplumber) — открытый парсер без Yandex Vision OCR |

Правило: перед подключением модели нужно зафиксировать её лицензию, условия коммерческого использования, требования к атрибуции и ограничения на выходные данные. Нельзя считать «open weights» синонимом «любая коммерческая лицензия». Проприетарные облачные OCR (Yandex Vision OCR и аналоги) исключены из контура.

## 6. Внешние API и критический путь

| Внешний сервис | Использование | Критический путь | Лицензия / условия |
|---|---|---|---|
| OpenStreetMap | Тайлы Leaflet на Экране 3 + офлайн SVG-фолбэк | Нет, Tier-2 | Данные ODbL, тайлы — условия openstreetmap.org |
| OpenAI-compatible провайдер | Опциональное обогащение поиска | Нет, Tier-2 | Условия провайдера; по умолчанию выключен |
| ЕГРЮЛ / БКИ / ФССП / Open Banking | Заменены симуляторами | Нет реального вызова | В демо внешние API не используются |

В критическом пути (Tier-0) внешних платных API нет. Скоринг, решение, State Machine, ПЭП и аудит работают локально. PDF-парсинг также локальный; карта и ИИ — необязательные слои.

## 7. Как проверить состав зависимостей

```bash
# Python-зависимости
.venv/bin/pip freeze

# Прямые frontend-зависимости
cd frontend && npm ls --depth=0

# Образы Docker
docker compose images

# Поиск лицензий в установленных пакетах
.venv/bin/pip show fastapi sqlalchemy pydantic pdfplumber httpx
```

Для продукта рекомендуется:

1. генерировать SBOM (например, CycloneDX) для backend-образа и frontend-сборки;
2. хранить тексты лицензий MIT/BSD/Apache-2.0 в дистрибутиве;
3. проверять лицензию каждой новой модели и каждого нового API до подключения;
4. отдельно проверить LGPL-условия для `psycopg` и лицензию выбранной open-weights модели.

Связанные документы:

- [Навигатор по документации (docs/README.md)](./docs/README.md)
- [01. Продуктовое исследование, JTBD и CJM](./docs/01_Product_Research_JTBD_CJM.md)
- [02. Системная архитектура и SLA](./docs/02_System_Architecture_and_SLA.md)
- [03. FSM State Machine и скоринг](./docs/03_State_Machine_and_Scoring_Rules.md)
- [04. Модель данных (ERD)](./docs/04_ERD_Data_Model.md)
- [05. Банковская ценность и антифрод](./docs/05_Bank_Risk_Value_and_AntiFraud.md)
- [06. Реестр упрощений](./docs/06_Simplifications_and_Mocks_Registry.md)
- [07. Матрица приёмки и QA](./docs/07_QA_Acceptance_and_Test_Scenarios.md)
- [README](./README.md)
