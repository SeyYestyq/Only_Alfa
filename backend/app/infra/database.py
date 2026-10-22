"""Подключение к БД и фабрика сессий."""
from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, pool_pre_ping=True, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

_APPLICATION_COLUMNS = {
    "collateral_type": "VARCHAR(24) DEFAULT 'NONE'",
    "collateral_value_rub": "FLOAT DEFAULT 0",
    "collateral_status": "VARCHAR(24) DEFAULT 'NONE'",
}


def get_session() -> Iterator[Session]:
    """FastAPI dependency."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _ensure_application_columns() -> None:
    """create_all не добавляет колонки в уже существующую таблицу."""
    inspector = inspect(engine)
    if "applications" not in inspector.get_table_names():
        return
    existing = {column["name"] for column in inspector.get_columns("applications")}
    with engine.begin() as connection:
        for name, definition in _APPLICATION_COLUMNS.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE applications ADD COLUMN {name} {definition}"))


def create_schema() -> None:
    from app.infra import models  # noqa: F401 — регистрация метаданных

    models.Base.metadata.create_all(bind=engine)
    _ensure_application_columns()
