"""Invoice-to-Credit: 3 шаблона + реальный PDF через pdfplumber."""
from __future__ import annotations

from app.infra.pdf_factory import build_demo_invoice_pdf


def test_three_invoice_templates_available(client):
    response = client.get("/api/v1/applications/invoice-templates")
    assert response.status_code == 200
    templates = response.json()
    assert {row["code"] for row in templates} == {"LA_MARZOCCO", "ROSTERS_EQUIP", "CABLE_VVG"}
    assert all(row["amount_rub"] > 0 and row["vat_rub"] > 0 for row in templates)


def test_parse_template_creates_draft_and_submits(client, companies):
    response = client.post(
        "/api/v1/applications/parse-invoice",
        data={"company_id": companies["rosters"]["id"], "template_code": "ROSTERS_EQUIP"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["invoice"]["amount_rub"] == 2_500_000
    assert payload["invoice"]["supplier_inn"] == "7712345671"
    assert payload["antifraud"]["is_verified"] is True
    draft = payload["draft"]
    assert draft["status"] == "DRAFT_BY_EMPLOYEE"
    assert draft["invoice"]["purpose"] == "Комплект оборудования для кухни"

    submitted = client.post(
        "/api/v1/applications",
        json={
            "company_id": companies["rosters"]["id"],
            "product_type": "INVEST_LEASING",
            "requested_amount_rub": payload["invoice"]["amount_rub"],
            "term_months": 12,
            "declared_monthly_revenue": 2_100_000,
            "actor_role": "ACCOUNTANT",
            "draft_application_id": draft["application_id"],
        },
    )
    assert submitted.status_code == 201
    assert submitted.json()["status"] == "MANUAL_REVIEW"
    assert submitted.json()["risk_score"] == 610


def test_parse_real_pdf_extracts_inn_amount_vat(client, companies):
    pdf = build_demo_invoice_pdf(
        supplier_name="OOO KofeTechPro",
        supplier_inn="7701234560",
        amount_rub=900_000,
        vat_rub=150_000,
        purpose="Coffee machine La Marzocco",
    )
    response = client.post(
        "/api/v1/applications/parse-invoice",
        data={"company_id": companies["smirnov"]["id"]},
        files={"file": ("invoice.pdf", pdf, "application/pdf")},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["invoice"]["source"] == "PDF"
    assert payload["invoice"]["supplier_inn"] == "7701234560"
    assert payload["invoice"]["amount_rub"] == 900_000
    assert payload["invoice"]["vat_rub"] == 150_000
    assert payload["parsing_ms"] < 5_000
    assert payload["draft"]["status"] == "DRAFT_BY_EMPLOYEE"


def test_broken_pdf_returns_422(client, companies):
    response = client.post(
        "/api/v1/applications/parse-invoice",
        data={"company_id": companies["smirnov"]["id"]},
        files={"file": ("broken.pdf", b"not a pdf", "application/pdf")},
    )
    assert response.status_code == 422


def test_pdf_without_inn_returns_422(client, companies):
    from app.infra.pdf_factory import build_invoice_pdf

    pdf = build_invoice_pdf(["Invoice", "Total: 1000.00"])
    response = client.post(
        "/api/v1/applications/parse-invoice",
        data={"company_id": companies["smirnov"]["id"]},
        files={"file": ("invoice.pdf", pdf, "application/pdf")},
    )
    assert response.status_code == 422
