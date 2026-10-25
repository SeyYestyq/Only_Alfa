"""Кредит под залог: покрытие ≥50% поднимает жёлтый коридор до APPROVED."""
from __future__ import annotations

from app.domain.decision.decision_engine import collateral_covers, make_decision
from app.domain.scoring.risk_score import calculate_risk_score
from app.domain.types import ProductType
from app.infra.demo_profiles import ROSTERS


def test_collateral_coverage_ratio() -> None:
    assert collateral_covers(2_500_000, 1_250_000) is True
    assert collateral_covers(2_500_000, 1_249_999) is False
    assert collateral_covers(2_500_000, 0) is False


def test_rosters_with_collateral_approves_full_amount() -> None:
    score = calculate_risk_score(ROSTERS)
    decision = make_decision(
        ROSTERS,
        score,
        2_500_000,
        ProductType.INVEST_LEASING,
        12,
        collateral_type="REAL_ESTATE",
        collateral_value_rub=3_000_000,
    )
    assert decision.outcome.value == "APPROVED"
    assert decision.approved_amount_rub == 2_500_000


def test_rosters_without_collateral_waits_for_inspector() -> None:
    score = calculate_risk_score(ROSTERS)
    decision = make_decision(
        ROSTERS,
        score,
        2_500_000,
        ProductType.INVEST_LEASING,
        12,
        collateral_type="NONE",
        collateral_value_rub=0,
    )
    assert decision.outcome.value == "MANUAL_REVIEW"
    assert len(decision.counter_offers) == 4


def test_api_create_with_collateral(client, companies) -> None:
    company = companies["rosters"]
    response = client.post(
        "/api/v1/applications",
        json={
            "company_id": company["id"],
            "product_type": "INVEST_LEASING",
            "requested_amount_rub": 2_500_000,
            "term_months": 12,
            "declared_monthly_revenue": 2_100_000,
            "actor_role": "ACCOUNTANT",
            "collateral_type": "REAL_ESTATE",
            "collateral_value_rub": 3_000_000,
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["status"] == "APPROVED"
    assert body["approved_amount_rub"] == 2_500_000
    assert body["collateral_status"] == "APPROVED"
    assert body["product_type"] == "VKL_SEC"
    assert any(check["code"] == "COLLATERAL" for check in body["checks"])
