"""Конфигурация приложения: только переменные окружения, ничего больше."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from app.core.constants import (
    AI_MODE_DETERMINISTIC,
    AI_MODE_OPENAI_COMPATIBLE,
    DEFAULT_CBR_KEY_RATE,
    OPENAI_DEFAULT_TIMEOUT_MS,
)

_BACKEND_ROOT = Path(__file__).resolve().parents[2]


def load_dotenv(path: Path) -> None:
    """Минимальный загрузчик .env — без внешних зависимостей."""
    if not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_dotenv(_BACKEND_ROOT.parent / ".env")
load_dotenv(_BACKEND_ROOT / ".env")


def _parse_origins(raw: str) -> list[str]:
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./alfa.db")
    cbr_key_rate: float = float(os.getenv("CBR_KEY_RATE", str(DEFAULT_CBR_KEY_RATE)))
    ai_provider_mode: str = os.getenv("AI_PROVIDER_MODE", AI_MODE_DETERMINISTIC)
    openai_base_url: str = os.getenv("OPENAI_BASE_URL") or os.getenv("LLM_BASE_URL", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY", "")
    openai_model_name: str = os.getenv("OPENAI_MODEL_NAME") or os.getenv("LLM_MODEL_NAME", "")
    openai_timeout_ms: int = int(os.getenv("OPENAI_TIMEOUT_MS", str(OPENAI_DEFAULT_TIMEOUT_MS)))
    cors_origins: list[str] = field(
        default_factory=lambda: _parse_origins(
            os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:8080")
        )
    )

    @property
    def is_openai_enabled(self) -> bool:
        return (
            self.ai_provider_mode == AI_MODE_OPENAI_COMPATIBLE
            and bool(self.openai_base_url)
            and bool(self.openai_model_name)
        )


settings = Settings()
