"""Переписка по заявке: письма к офферам и системные сообщения."""
from __future__ import annotations

from typing import Any


def format_offer_letter_text(letter: dict[str, Any]) -> str:
    factors = letter.get("top_factors") or []
    factor_lines = ", ".join(
        f"{item.get('label', '')} ({'+' if int(item.get('delta', 0)) >= 0 else ''}{int(item.get('delta', 0))})"
        for item in factors[:5]
    )
    return (
        f"{letter.get('headline', 'Предложение банка')}\n\n"
        f"{letter.get('why_this_product', '')}\n\n"
        f"Факторы: {factor_lines or 'см. скоринг'}.\n"
        f"{letter.get('why_terms', '')}\n\n"
        f"{letter.get('if_no_action', '')}"
    )


def build_offer_letter_message(letter: dict[str, Any], message_id: str) -> dict[str, Any]:
    return {
        "id": message_id,
        "sender_role": "UNDERWRITER",
        "sender_label": "Кредитный инспектор · Альфа-Банк",
        "message_type": "OFFER_LETTER",
        "text": format_offer_letter_text(letter),
        "offer_letter": letter,
    }


def append_correspondence(
    correspondence: list[dict[str, Any]],
    entry: dict[str, Any],
) -> list[dict[str, Any]]:
    if any(row.get("id") == entry.get("id") for row in correspondence):
        return correspondence
    return [*correspondence, entry]
