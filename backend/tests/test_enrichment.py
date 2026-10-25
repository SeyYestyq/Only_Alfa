"""Пояснения статуса, встречные запросы клиента и дозапрос документов."""
from __future__ import annotations

from app.domain.enrichment.briefs import build_client_brief
from app.domain.enrichment.client_request import ClientProductRequestPayload, evaluate_client_product_request
from app.domain.types import ApplicationStatus
from app.infra.demo_profiles import ROSTERS, SMIRNOV


def test_client_brief_approved_has_decision_letter():
    brief = build_client_brief(
        status=ApplicationStatus.APPROVED.value,
        outcome="APPROVED",
        profile=SMIRNOV,
        score=815,
        factors=[{"label": "Чистая БКИ", "score_delta": 130, "group": "G1", "code": "x", "condition": ""}],
        monthly_payment=40_000,
        max_payment=161_000,
        approved_amount=900_000,
        rate_pct=14.5,
        term_months=24,
        product_type="INVEST_LEASING",
        product_label="Инвест-кредит / лизинг",
        rejection_checklist=[],
        hard_stop_reason=None,
        is_hard_stop=False,
    )
    assert "одобрен" in brief["where"].lower() or "подпис" in brief["where"].lower()
    assert brief["decision_letter"] is not None
    assert brief["tone"] == "good"


def test_client_product_request_overdraft_for_rosters():
    payload = ClientProductRequestPayload(
        product_type="OVERDRAFT",
        requested_amount_rub=800_000,
        term_months=12,
        comment="Нужен овердрафт на закупки",
    )
    verdict = evaluate_client_product_request(ROSTERS, "INVEST_LEASING", payload)
    assert verdict.summary
    assert len(verdict.reasons) >= 3
    assert verdict.pilot_actions
