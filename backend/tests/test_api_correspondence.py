"""E2E API: письмо к офферу попадает в correspondence заявки."""
from __future__ import annotations


def test_smirnov_application_has_offer_correspondence(client, companies):
    smirnov = companies["smirnov"]
    created = client.post(
        "/api/v1/applications",
        json={
            "company_id": smirnov["id"],
            "product_type": "INVEST_LEASING",
            "requested_amount_rub": 900_000,
            "term_months": 24,
            "declared_monthly_revenue": 1_450_000,
            "actor_role": "IP_OWNER",
        },
    )
    assert created.status_code == 201
    payload = created.json()
    assert payload["client_brief"] is not None
    assert len(payload.get("offer_letters") or []) >= 1
    correspondence = payload.get("correspondence") or []
    assert len(correspondence) >= 1
    assert correspondence[0]["message_type"] == "OFFER_LETTER"
    assert "OFFER_LETTER" not in correspondence[0]["text"]
