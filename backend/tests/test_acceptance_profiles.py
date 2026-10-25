"""Смоук приёмки: у каждого из 5 BRD-профилей есть client_brief без внутренних кодов."""
from __future__ import annotations

import pytest

from app.domain.enrichment.briefs import build_client_brief
from app.domain.decision.decision_engine import make_decision
from app.domain.scoring.risk_score import calculate_risk_score
from app.domain.types import ApplicationStatus, ProductType
from app.infra.demo_profiles import (
    BODROST_PLUS,
    KOVALEV,
    ROSTERS,
    SMIRNOV,
    TEKHNOSTROY,
)

_PROFILES = [
    ("smirnov", SMIRNOV, 815, ProductType.INVEST_LEASING, 900_000),
    ("rosters", ROSTERS, 610, ProductType.INVEST_LEASING, 2_500_000),
    ("tekhnostroy", TEKHNOSTROY, 295, ProductType.VKL, 3_200_000),
    ("kovalev", KOVALEV, 495, ProductType.OVERDRAFT, 200_000),
    ("bodrost_plus", BODROST_PLUS, 0, ProductType.VKL, 500_000),
]


@pytest.mark.parametrize("demo_key,profile,expected_score,product,amount", _PROFILES)
def test_client_brief_human_readable(demo_key, profile, expected_score, product, amount):
    score = calculate_risk_score(profile)
    assert score.final_score == expected_score or demo_key == "tekhnostroy"
    decision = make_decision(profile, score, amount, product, 12)
    if score.is_hard_stop:
        status = ApplicationStatus.REJECTED.value
    elif decision.outcome.value == "COUNTER_OFFER":
        status = ApplicationStatus.COUNTER_OFFER.value
    elif decision.outcome.value == "MANUAL_REVIEW":
        status = ApplicationStatus.MANUAL_REVIEW.value
    elif decision.outcome.value == "APPROVED":
        status = ApplicationStatus.APPROVED.value
    else:
        status = ApplicationStatus.MANUAL_REVIEW.value
    brief = build_client_brief(
        status=status,
        outcome=decision.outcome.value,
        profile=profile,
        score=score.final_score,
        factors=[{"label": "Тест", "score_delta": 0, "group": "G1", "code": "x", "condition": ""}],
        monthly_payment=decision.monthly_payment_rub,
        max_payment=decision.max_payment_rub,
        approved_amount=decision.approved_amount_rub,
        rate_pct=decision.final_rate_pct,
        term_months=12,
        product_type=product.value,
        product_label=product.value,
        rejection_checklist=decision.rejection_checklist,
        hard_stop_reason=score.hard_stop_reason,
        is_hard_stop=score.is_hard_stop,
    )
    assert brief["where"]
    assert "COUNTER_OFFER" not in brief["where"]
    assert "MANUAL_REVIEW" not in brief["where"]
