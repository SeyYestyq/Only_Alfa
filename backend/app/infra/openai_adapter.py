"""
OpenAI-compatible адаптер. Жёсткий таймаут 1.5 сек и мгновенный фолбэк
на детерминированный результат при любой ошибке.
"""
from __future__ import annotations

import time

import httpx

from app.core.config import settings

_SYSTEM_PROMPT = (
    "Ты финансовый ассистент банка. Дай одно короткое деловое предложение "
    "к результату поиска предпринимателя. Не выдумывай цифры, не предлагай "
    "продукты, которых нет в переданных данных."
)


async def enrich_search_result(query: str, deterministic_payload: dict) -> dict | None:
    """Возвращает {'text', 'model', 'latency_ms'} или None при фолбэке."""
    if not settings.is_openai_enabled:
        return None

    url = settings.openai_base_url.rstrip("/") + "/chat/completions"
    payload = {
        "model": settings.openai_model_name,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Запрос: {query}\n"
                    f"Класс: {deterministic_payload.get('intent')}\n"
                    f"Сумма: {deterministic_payload.get('amount_estimate_rub')} ₽\n"
                    f"Поставщики: {', '.join(deterministic_payload.get('supplier_names', []))}"
                ),
            },
        ],
        "temperature": 0.2,
        "max_tokens": 120,
    }
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"} if settings.openai_api_key else {}
    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=settings.openai_timeout_ms / 1000) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            body = response.json()
        content = body["choices"][0]["message"]["content"].strip()
        if not content:
            return None
        return {
            "text": content,
            "model": settings.openai_model_name,
            "latency_ms": round((time.perf_counter() - started) * 1000, 1),
        }
    except Exception:
        return None
