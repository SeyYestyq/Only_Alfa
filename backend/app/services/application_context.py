"""Чтение и запись context_json заявки (письма, встречные запросы, дозапросы)."""
from __future__ import annotations

from typing import Any

from app.infra.models import Application


def get_context(application: Application) -> dict[str, Any]:
    raw = getattr(application, "context_json", None)
    if not raw:
        return {}
    return dict(raw)


def save_context(application: Application, **updates: Any) -> dict[str, Any]:
    ctx = get_context(application)
    ctx.update(updates)
    application.context_json = ctx
    return ctx


def append_offer_letter(application: Application, letter: dict[str, Any]) -> None:
    ctx = get_context(application)
    letters = list(ctx.get("offer_letters") or [])
    letters.append(letter)
    ctx["offer_letters"] = letters[-8:]
    application.context_json = ctx
