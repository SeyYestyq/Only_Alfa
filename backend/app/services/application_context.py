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
    from app.domain.enrichment.correspondence import append_correspondence, build_offer_letter_message

    ctx = get_context(application)
    letters = list(ctx.get("offer_letters") or [])
    letters.append(letter)
    ctx["offer_letters"] = letters[-8:]
    message_id = f"corr_offer_{application.id}_{letter.get('kind', 'PRIMARY')}_{len(letters)}"
    ctx["correspondence"] = append_correspondence(
        list(ctx.get("correspondence") or []),
        build_offer_letter_message(letter, message_id),
    )
    application.context_json = ctx
