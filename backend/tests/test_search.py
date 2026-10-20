"""Метрики ТЗ-04: точность Intent Parser >= 90% и ответ <= 50 мс."""
from __future__ import annotations

from app.infra.smart_search_engine import parse_intent

CONTROL_SET: list[tuple[str, str]] = [
    ("Кофемашина La Marzocco 900 000", "CAPEX"),
    ("Купить конвектомат Rational", "CAPEX"),
    ("Станок ЧПУ для цеха", "CAPEX"),
    ("Лизинг спецтехники", "CAPEX"),
    ("Холодильник для кухни", "CAPEX"),
    ("Кабель ВВГнг 15 км", "WORKING_CAPITAL"),
    ("Закупка товара на сезон", "WORKING_CAPITAL"),
    ("Пополнение оборотных средств", "WORKING_CAPITAL"),
    ("Бетон М300 40 м3", "WORKING_CAPITAL"),
    ("Арматура для стройки", "WORKING_CAPITAL"),
    ("Не хватает на зарплату", "OVERDRAFT"),
    ("Кассовый разрыв через неделю", "OVERDRAFT"),
    ("Овердрафт на налоги", "OVERDRAFT"),
    ("Срочно закрыть разрыв", "OVERDRAFT"),
    ("Нужна кредитная линия", "OVERDRAFT"),
    ("Календарь УСН", "INFO_ONLY"),
    ("Когда платить налог по УСН", "INFO_ONLY"),
    ("Что такое ПЭП", "INFO_ONLY"),
    ("Расскажи про льготы для кофеен", "INFO_ONLY"),
    ("Как получить грант", "INFO_ONLY"),
]


def test_intent_parser_accuracy_at_least_90_percent():
    correct = sum(1 for query, expected in CONTROL_SET if parse_intent(query).intent == expected)
    accuracy = correct / len(CONTROL_SET)
    assert accuracy >= 0.90, f"accuracy={accuracy:.0%}"
    assert accuracy == 1.0


def test_smart_search_returns_three_suppliers_and_badge(client, companies):
    response = client.post(
        f"/api/v1/companies/{companies['smirnov']['id']}/smart-search",
        json={"query": "Кофемашина La Marzocco 900 000"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["intent"] == "CAPEX"
    assert payload["silence_mode"] is False
    assert payload["amount_estimate_rub"] == 900_000
    assert len(payload["suppliers"]) == 3
    assert all(supplier["fssp_label"] == "ФССП: 0 ₽" for supplier in payload["suppliers"])
    assert payload["credit_badge"]["is_preapproved"] is True
    assert payload["credit_badge"]["rate_pct"] == 14.5
    assert payload["news_item"] is not None
    assert payload["classification_ms"] <= 50


def test_smart_search_silence_for_info_query(client, companies):
    response = client.post(
        f"/api/v1/companies/{companies['smirnov']['id']}/smart-search",
        json={"query": "Календарь УСН"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["intent"] == "INFO_ONLY"
    assert payload["silence_mode"] is True
    assert payload["credit_badge"] is None
    assert payload["classification_ms"] <= 50


def test_smart_search_silence_when_account_has_enough_money(client, companies):
    response = client.post(
        f"/api/v1/companies/{companies['smirnov']['id']}/smart-search",
        json={"query": "Закупка расходников 100 000"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["silence_mode"] is True
    assert "достаточно средств" in payload["silence_reason"]


def test_search_updates_news_feed(client, companies):
    company_id = companies["tekhnostroy"]["id"]
    before = client.get(f"/api/v1/companies/{company_id}/dashboard").json()["news_feed"]
    response = client.post(
        f"/api/v1/companies/{company_id}/smart-search",
        json={"query": "Кабель ВВГнг 15 км"},
    )
    assert response.status_code == 200
    after = client.get(f"/api/v1/companies/{company_id}/dashboard").json()["news_feed"]
    assert len(after) == len(before) + 1
    assert after[0]["source"] == "NEWS_TO_ACTION"
