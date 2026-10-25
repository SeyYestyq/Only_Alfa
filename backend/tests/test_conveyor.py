"""Сквозные тесты 11 эндпоинтов и 5 демо-сценариев Чекпоинта-1."""
from __future__ import annotations

from app.infra.database import SessionLocal
from app.infra.demo_profiles import DEMO_APPLICATION_SCENARIOS
from app.infra.seed import seed_database
from tests.conftest import create_application


def test_five_companies_with_users(client):
    response = client.get("/api/v1/companies")
    assert response.status_code == 200
    companies = response.json()["companies"]
    assert len(companies) == 5
    assert [row["demo_key"] for row in companies] == [
        "smirnov", "rosters", "tekhnostroy", "kovalev", "bodrost_plus"
    ]
    assert all(len(row["users"]) == 2 for row in companies)
    assert companies[0]["users"][0]["role"] == "IP_OWNER"
    assert companies[1]["users"][0]["role"] == "CEO_OWNER"


def test_dashboard_structure(client, companies):
    response = client.get(f"/api/v1/companies/{companies['smirnov']['id']}/dashboard")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["business_dna"]["blocks"]) == 5
    assert len(payload["cash_forecast"]["days"]) == 60
    assert payload["cash_forecast"]["has_gap"] is False
    assert payload["search_chips"]
    assert len(payload["transactions"]) == 4
    assert len(payload["news_feed"]) >= 3

    kovalev = client.get(f"/api/v1/companies/{companies['kovalev']['id']}/dashboard").json()
    assert kovalev["cash_forecast"]["has_gap"] is True
    assert kovalev["cash_forecast"]["min_day"] == 14


def test_five_reference_scenarios(client, companies):
    expected = {
        "smirnov": ("APPROVED", 815, 0),
        "rosters": ("COUNTER_OFFER", 610, 4),
        "tekhnostroy": ("ANOMALY_VERIFICATION", 295, 0),
        "kovalev": ("MANUAL_REVIEW", 495, 0),
        "bodrost_plus": ("REJECTED", 0, 0),
    }
    for key, (status, score, offers) in expected.items():
        application = create_application(client, companies[key], DEMO_APPLICATION_SCENARIOS[key])
        assert application["status"] == status, key
        assert application["risk_score"] == score, key
        assert len(application["counter_offers"]) == offers, key

    bodrost = create_application(client, companies["bodrost_plus"], DEMO_APPLICATION_SCENARIOS["bodrost_plus"])
    assert bodrost["is_hard_stop"] is True
    assert "БКИ" in bodrost["hard_stop_reason"]
    assert "ФССП" in bodrost["hard_stop_reason"]


def test_multibank_restores_anomaly_and_boosts_score(client, companies):
    application = create_application(client, companies["tekhnostroy"], DEMO_APPLICATION_SCENARIOS["tekhnostroy"])
    assert application["multibank"]["available"] is True
    assert application["anomaly"]["deviation_pct"] > 50

    response = client.post(f"/api/v1/applications/{application['application_id']}/verify-multibank")
    assert response.status_code == 200
    payload = response.json()
    assert payload["previous_score"] == 295
    assert payload["new_score"] == 760
    assert payload["score_delta"] == 465
    assert payload["external_revenue_rub"] == 4_200_000
    assert payload["application"]["status"] == "APPROVED"
    assert payload["application"]["final_rate_pct"] == 15.5
    assert payload["application"]["multibank"]["verified"] is True

    again = client.post(f"/api/v1/applications/{application['application_id']}/verify-multibank")
    assert again.status_code == 409


def test_signature_for_ip_and_ooo(client, companies):
    smirnov = create_application(client, companies["smirnov"], DEMO_APPLICATION_SCENARIOS["smirnov"])
    signed = client.post(
        f"/api/v1/applications/{smirnov['application_id']}/ceo-approve",
        json={"actor_role": "IP_OWNER"},
    )
    assert signed.status_code == 200
    assert signed.json()["status"] == "FUNDED"
    assert signed.json()["account_balance"] == 420_000 + 900_000

    rosters = create_application(client, companies["rosters"], DEMO_APPLICATION_SCENARIOS["rosters"])
    assert rosters["status"] == "COUNTER_OFFER"
    # ПЭП из COUNTER_OFFER без accept-offer — 409 (нужен выбор оффера).
    premature = client.post(
        f"/api/v1/applications/{rosters['application_id']}/ceo-approve",
        json={"actor_role": "CEO_OWNER"},
    )
    assert premature.status_code == 409

    accepted = client.post(
        f"/api/v1/applications/{rosters['application_id']}/accept-offer",
        json={"offer_index": 1, "actor_role": "ACCOUNTANT"},
    )
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "AWAITING_CEO_APPROVAL"
    assert accepted.json()["selected_offer_index"] == 1

    forbidden = client.post(
        f"/api/v1/applications/{rosters['application_id']}/ceo-approve",
        json={"actor_role": "ACCOUNTANT"},
    )
    assert forbidden.status_code == 403

    funded = client.post(
        f"/api/v1/applications/{rosters['application_id']}/ceo-approve",
        json={"actor_role": "CEO_OWNER"},
    )
    assert funded.status_code == 200
    assert funded.json()["status"] == "FUNDED"


def test_manual_review_flow_need_more_info(client, companies):
    application = create_application(client, companies["kovalev"], DEMO_APPLICATION_SCENARIOS["kovalev"])
    application_id = application["application_id"]

    conflict = client.post(
        f"/api/v1/applications/{application_id}/ceo-approve",
        json={"actor_role": "IP_OWNER"},
    )
    assert conflict.status_code == 409

    request_docs = client.post(
        f"/api/v1/applications/{application_id}/underwriter-action",
        json={
            "action": "NEED_MORE_INFO",
            "actor_role": "UNDERWRITER",
            "comment": "Запрошен договор аренды помещения",
        },
    )
    assert request_docs.status_code == 200
    assert request_docs.json()["status"] == "NEED_MORE_INFO"

    no_document = client.post(
        f"/api/v1/applications/{application_id}/underwriter-action",
        json={"action": "APPROVE", "actor_role": "UNDERWRITER"},
    )
    assert no_document.status_code == 400

    approved = client.post(
        f"/api/v1/applications/{application_id}/underwriter-action",
        json={
            "action": "APPROVE",
            "actor_role": "UNDERWRITER",
            "document_name": "Договор аренды.pdf",
        },
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "APPROVED"
    assert approved.json()["approved_amount_rub"] == 300_000

    signed = client.post(
        f"/api/v1/applications/{application_id}/ceo-approve",
        json={"actor_role": "IP_OWNER"},
    )
    assert signed.status_code == 200
    assert signed.json()["status"] == "FUNDED"


def test_underwriter_counter_offer_can_be_selected_and_funded(client, companies):
    application = create_application(client, companies["kovalev"], DEMO_APPLICATION_SCENARIOS["kovalev"])
    application_id = application["application_id"]

    response = client.post(
        f"/api/v1/applications/{application_id}/underwriter-action",
        json={"action": "COUNTER_OFFER", "actor_role": "UNDERWRITER", "comment": "Инспектор предлагает варианты"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "COUNTER_OFFER"
    assert len(payload["counter_offers"]) == 4

    no_offer = client.post(
        f"/api/v1/applications/{application_id}/ceo-approve",
        json={"actor_role": "IP_OWNER"},
    )
    assert no_offer.status_code == 409

    accepted = client.post(
        f"/api/v1/applications/{application_id}/accept-offer",
        json={"offer_index": 1, "actor_role": "IP_OWNER"},
    )
    assert accepted.status_code == 200
    assert accepted.json()["approved_amount_rub"] > 0

    funded = client.post(
        f"/api/v1/applications/{application_id}/ceo-approve",
        json={"actor_role": "IP_OWNER"},
    )
    assert funded.status_code == 200
    assert funded.json()["status"] == "FUNDED"
    assert funded.json()["account_balance"] > 0


def test_repeated_tekhnostroy_is_not_stuck_in_anomaly(client, companies):
    first = create_application(client, companies["tekhnostroy"], DEMO_APPLICATION_SCENARIOS["tekhnostroy"])
    verified = client.post(f"/api/v1/applications/{first['application_id']}/verify-multibank")
    assert verified.status_code == 200
    assert verified.json()["new_score"] == 760
    assert verified.json()["new_limit"] > verified.json()["previous_limit"]
    assert verified.json()["application"]["limit_rub"] > 0

    second = create_application(client, companies["tekhnostroy"], DEMO_APPLICATION_SCENARIOS["tekhnostroy"])
    assert second["status"] == "APPROVED"
    assert second["risk_score"] == 760
    assert second["anomaly"] is None
    assert second["multibank"]["verified"] is True


def test_demo_inns_are_trusted_seeds(client):
    """4 из 5 ИНН ТЗ не проходят контрольную сумму — это синтетические демо-данные."""
    for inn in ("771589012345", "7728901122", "773344556677", "7719009988"):
        response = client.post("/api/v1/companies/lookup-inn", json={"inn": inn})
        assert response.status_code == 200, inn
        assert response.json()["company"]["demo_key"] is not None


def test_rejected_application_cannot_be_signed(client, companies):
    application = create_application(client, companies["bodrost_plus"], DEMO_APPLICATION_SCENARIOS["bodrost_plus"])
    response = client.post(
        f"/api/v1/applications/{application['application_id']}/ceo-approve",
        json={"actor_role": "CEO_OWNER"},
    )
    assert response.status_code == 409


def test_negative_codes_422_403_409(client, companies):
    bad_inn = client.post("/api/v1/companies/lookup-inn", json={"inn": "1234567890"})
    assert bad_inn.status_code == 422

    short_inn = client.post("/api/v1/companies/lookup-inn", json={"inn": "12345"})
    assert short_inn.status_code == 422

    smirnov = create_application(client, companies["smirnov"], DEMO_APPLICATION_SCENARIOS["smirnov"])
    underwriter_forbidden = client.post(
        f"/api/v1/applications/{smirnov['application_id']}/underwriter-action",
        json={"action": "APPROVE", "actor_role": "ACCOUNTANT"},
    )
    assert underwriter_forbidden.status_code == 403

    invalid_transition = client.post(
        f"/api/v1/applications/{smirnov['application_id']}/verify-multibank"
    )
    assert invalid_transition.status_code == 409


def test_lookup_inn_is_deterministic(client):
    first = client.post("/api/v1/companies/lookup-inn", json={"inn": "7734567893"})
    second = client.post("/api/v1/companies/lookup-inn", json={"inn": "7734567893"})
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["source"] == "REGISTRY_SIMULATOR"
    assert second.json()["source"] == "DATABASE"
    assert first.json()["company"]["id"] == second.json()["company"]["id"]
    assert first.json()["company"]["name"] == second.json()["company"]["name"]


def test_xray_contains_pnl_waterfall_and_events(client, companies):
    application = create_application(client, companies["smirnov"], DEMO_APPLICATION_SCENARIOS["smirnov"])
    response = client.get(f"/api/v1/applications/{application['application_id']}/xray")
    assert response.status_code == 200
    payload = response.json()
    assert payload["bank_pnl"]["expected_margin_rub"] > 0
    assert payload["waterfall"]["final_score"] == 815
    assert payload["geo"]["map_url"].startswith("https://www.openstreetmap.org/")
    assert len(payload["events"]) >= 1
    assert payload["bank_value"]["points"]
    assert payload["cash_forecast_summary"]["has_gap"] is False


def test_installment_restores_balance(client, companies):
    company_id = companies["smirnov"]["id"]
    dashboard = client.get(f"/api/v1/companies/{company_id}/dashboard").json()
    transaction = next(row for row in dashboard["transactions"] if row["can_installment"])

    response = client.post(
        f"/api/v1/transactions/{transaction['id']}/installment", json={"months": 6}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["restored_amount_rub"] == 180_000
    assert payload["monthly_payment_rub"] == 30_000
    assert payload["account_balance"] == 600_000

    repeated = client.post(
        f"/api/v1/transactions/{transaction['id']}/installment", json={"months": 3}
    )
    assert repeated.status_code == 400

    invalid_term = client.post(
        f"/api/v1/transactions/{transaction['id']}/installment", json={"months": 12}
    )
    assert invalid_term.status_code == 422


def test_seed_is_idempotent(client):
    with SessionLocal() as session:
        created = seed_database(session)
    assert created == {"companies": 0, "catalog_items": 0}


def test_reset_demo_scenarios(client, companies):
    company = companies["smirnov"]
    create_application(
        client,
        company,
        {
            "product_type": "INVEST_LEASING",
            "requested_amount_rub": 900_000,
            "term_months": 24,
            "declared_monthly_revenue": 1_200_000,
        },
    )
    apps = client.get(f"/api/v1/companies/{company['id']}/applications").json()
    assert len(apps["applications"]) >= 1

    reset_res = client.post("/api/v1/companies/reset-demo")
    assert reset_res.status_code == 200
    assert reset_res.json()["ok"] is True

    apps_after = client.get(f"/api/v1/companies/{company['id']}/applications").json()
    assert len(apps_after["applications"]) == 0
