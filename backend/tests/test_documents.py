"""Запрос документа инспектором и ответ клиента через API."""
from __future__ import annotations

from app.infra.demo_profiles import DEMO_APPLICATION_SCENARIOS
from tests.conftest import create_application


def test_client_upload_returns_application_to_review(client, companies):
    company = companies["rosters"]
    application = create_application(client, company, DEMO_APPLICATION_SCENARIOS["rosters"])
    application_id = application["application_id"]
    assert application["status"] == "MANUAL_REVIEW"

    requested = client.post(
        f"/api/v1/applications/{application_id}/underwriter-action",
        json={
            "action": "NEED_MORE_INFO",
            "actor_role": "UNDERWRITER",
            "comment": "Нужен договор аренды, Покровка, 17",
            "document_name": "Договор аренды",
        },
    )
    assert requested.status_code == 200
    assert requested.json()["status"] == "NEED_MORE_INFO"

    notes = client.get(f"/api/v1/companies/{company['id']}/notifications")
    assert notes.status_code == 200
    client_notes = [row for row in notes.json()["notifications"] if row["audience"] == "client"]
    assert any(row["title"] == "Нужен документ" for row in client_notes)

    uploaded = client.post(
        f"/api/v1/applications/{application_id}/documents",
        data={"actor_role": "ACCOUNTANT"},
        files={"file": ("lease.pdf", b"%PDF-1.4 lease", "application/pdf")},
    )
    assert uploaded.status_code == 200, uploaded.text
    body = uploaded.json()
    assert body["status"] == "MANUAL_REVIEW"
    assert any(check["code"] == "CLIENT_DOCUMENT" and check["status"] == "UPLOADED" for check in body["checks"])

    bank_notes = client.get(f"/api/v1/companies/{company['id']}/notifications").json()["notifications"]
    assert any(row["audience"] == "bank" and row["title"] == "Документ получен" for row in bank_notes)

    archive = client.get(f"/api/v1/companies/{company['id']}/documents")
    assert archive.status_code == 200
    assert any(row["name"] == "lease.pdf" and row["downloadable"] is True for row in archive.json()["documents"])

    inspector = client.post(
        f"/api/v1/applications/{application_id}/documents",
        data={"actor_role": "UNDERWRITER"},
        files={"file": ("again.pdf", b"pdf", "application/pdf")},
    )
    assert inspector.status_code == 403


def test_upload_without_request_is_conflict(client, companies):
    company = companies["rosters"]
    application = create_application(client, company, DEMO_APPLICATION_SCENARIOS["rosters"])
    response = client.post(
        f"/api/v1/applications/{application['application_id']}/documents",
        data={"actor_role": "ACCOUNTANT"},
        files={"file": ("lease.pdf", b"pdf", "application/pdf")},
    )
    assert response.status_code == 409
