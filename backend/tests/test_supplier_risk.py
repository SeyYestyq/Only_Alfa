"""Юнит-тесты оценки риска сделки с поставщиком (Invoice-to-Credit)."""
from __future__ import annotations

from app.core.constants import (
    SUPPLIER_DEAL_BASE_PROBABILITY_PCT,
    SUPPLIER_DEAL_MAX_PROBABILITY_PCT,
    SUPPLIER_DEAL_MIN_PROBABILITY_PCT,
    SUPPLIER_DEAL_PENALTY_CONCENTRATION_PCT,
    SUPPLIER_DEAL_PENALTY_LAWSUITS_PCT,
    SUPPLIER_DEAL_PENALTY_TAX_DEBT_PCT,
    SUPPLIER_DEAL_WEIGHT_PAYMENT_HISTORY_PCT,
    SUPPLIER_DEAL_WEIGHT_SECTOR_STABILITY_PCT,
    SUPPLIER_DEAL_WEIGHT_TENURE_PCT,
)
from app.domain.supplier_risk import SupplierRiskInputs, assess_supplier_deal_risk
from app.infra.supplier_risk_simulator import simulate_supplier_risk_inputs


def _inputs(**overrides: object) -> SupplierRiskInputs:
    base = dict(
        supplier_inn="7701234560",
        supplier_name="ООО «КофеТехПро»",
        tenure_months=48,
        completed_deals_count=8,
        on_time_payment_rate_pct=96.0,
        sector_stability_score=80,
        lawsuits_count=0,
        tax_debt_rub=0.0,
        concentration_share_pct=12.0,
        okved_cluster="Торговля (ОКВЭД 45-47)",
        is_egrul_active=True,
    )
    base.update(overrides)
    return SupplierRiskInputs(**base)  # type: ignore[arg-type]


def test_strong_supplier_hits_low_band_with_named_weights():
    expected = (
        SUPPLIER_DEAL_BASE_PROBABILITY_PCT
        + SUPPLIER_DEAL_WEIGHT_TENURE_PCT
        + SUPPLIER_DEAL_WEIGHT_PAYMENT_HISTORY_PCT
        + SUPPLIER_DEAL_WEIGHT_SECTOR_STABILITY_PCT
    )
    result = assess_supplier_deal_risk(_inputs())
    assert result.deal_success_probability_pct == round(
        min(SUPPLIER_DEAL_MAX_PROBABILITY_PCT, expected), 1
    )
    assert result.risk_band == "LOW"
    assert all(signal.is_flagged for signal in result.pros)
    assert not any(signal.is_flagged for signal in result.cons)


def test_cons_apply_named_penalties():
    result = assess_supplier_deal_risk(
        _inputs(
            tenure_months=6,
            completed_deals_count=0,
            on_time_payment_rate_pct=70.0,
            sector_stability_score=30,
            lawsuits_count=2,
            tax_debt_rub=120_000,
            concentration_share_pct=50.0,
        )
    )
    expected = (
        SUPPLIER_DEAL_BASE_PROBABILITY_PCT
        + SUPPLIER_DEAL_PENALTY_LAWSUITS_PCT
        + SUPPLIER_DEAL_PENALTY_TAX_DEBT_PCT
        + SUPPLIER_DEAL_PENALTY_CONCENTRATION_PCT
    )
    assert result.deal_success_probability_pct == round(
        max(SUPPLIER_DEAL_MIN_PROBABILITY_PCT, expected), 1
    )
    assert result.risk_band == "HIGH"
    assert sum(1 for signal in result.cons if signal.is_flagged) == 3


def test_simulator_is_deterministic_by_inn():
    first = simulate_supplier_risk_inputs("7712345671")
    second = simulate_supplier_risk_inputs("7712345671")
    assert first == second
    other = simulate_supplier_risk_inputs("7723456782")
    assert other.tenure_months != first.tenure_months or other.lawsuits_count != first.lawsuits_count


def test_deal_risk_endpoint_returns_panel_payload(client, companies):
    inn = "7701234560"
    response = client.get(
        f"/api/v1/suppliers/{inn}/deal-risk",
        params={
            "buyer_company_id": companies["smirnov"]["id"],
            "invoice_amount_rub": 900_000,
            "display_name": "ООО «КофеТехПро»",
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["supplier_inn"] == inn
    assert payload["supplier_name"] == "ООО «КофеТехПро»"
    assert SUPPLIER_DEAL_MIN_PROBABILITY_PCT <= payload["deal_success_probability_pct"] <= (
        SUPPLIER_DEAL_MAX_PROBABILITY_PCT
    )
    assert payload["risk_band"] in {"LOW", "MEDIUM", "HIGH"}
    assert len(payload["pros"]) == 3
    assert len(payload["cons"]) == 3
    assert payload["source"] == "REGISTRY_SIMULATOR"


def test_parse_invoice_includes_supplier_deal_risk(client, companies):
    response = client.post(
        "/api/v1/applications/parse-invoice",
        data={"company_id": companies["rosters"]["id"], "template_code": "ROSTERS_EQUIP"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["supplier_deal_risk"]["supplier_inn"] == "7712345671"
    assert "deal_success_probability_pct" in payload["supplier_deal_risk"]
    stored = payload["draft"]["invoice"]["supplier_deal_risk"]
    assert stored["supplier_inn"] == "7712345671"
    codes = [check["code"] for check in payload["draft"]["checks"]]
    assert "SUPPLIER_DEAL" in codes
