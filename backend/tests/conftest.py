"""Общие фикстуры тестов: изолированная SQLite-БД и TestClient."""
from __future__ import annotations

import os
from pathlib import Path

import pytest

TEST_DB_PATH = Path(__file__).resolve().parent / "test_alfa.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["AI_PROVIDER_MODE"] = "DETERMINISTIC"
os.environ.setdefault("CBR_KEY_RATE", "14.0")

from fastapi.testclient import TestClient  # noqa: E402

from app.infra.database import engine  # noqa: E402
from app.infra.models import Base  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def companies(client) -> dict[str, dict]:
    response = client.get("/api/v1/companies")
    assert response.status_code == 200
    return {row["demo_key"]: row for row in response.json()["companies"]}


def create_application(client: TestClient, company: dict, scenario: dict) -> dict:
    response = client.post(
        "/api/v1/applications",
        json={
            "company_id": company["id"],
            "product_type": scenario["product_type"],
            "requested_amount_rub": scenario["requested_amount_rub"],
            "term_months": scenario["term_months"],
            "declared_monthly_revenue": scenario["declared_monthly_revenue"],
            "actor_role": "ACCOUNTANT",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()
