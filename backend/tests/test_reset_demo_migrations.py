"""reset-demo: миграции на лету и повторное создание проактивных действий."""
from __future__ import annotations

import sqlite3

from tests.conftest import TEST_DB_PATH, create_application


def test_reset_demo_after_proactive_and_application(client, companies):
    company = companies["rosters"]
    dash = client.get(f"/api/v1/companies/{company['id']}/dashboard")
    assert dash.status_code == 200
    create_application(
        client,
        company,
        {
            "product_type": "INVEST_LEASING",
            "requested_amount_rub": 2_500_000,
            "term_months": 24,
            "declared_monthly_revenue": 1_200_000,
        },
    )
    reset_res = client.post("/api/v1/companies/reset-demo")
    assert reset_res.status_code == 200, reset_res.text
    actions = client.get(f"/api/v1/companies/{company['id']}/system-actions")
    assert actions.status_code == 200
    assert len(actions.json()["actions"]) >= 1


def test_reset_demo_repairs_missing_verified_supplements_column(client, companies):
    conn = sqlite3.connect(TEST_DB_PATH)
    try:
        conn.execute("ALTER TABLE companies DROP COLUMN verified_supplements_json")
        conn.commit()
    except sqlite3.OperationalError as exc:
        conn.close()
        raise AssertionError(f"SQLite must support DROP COLUMN for this test: {exc}") from exc
    conn.close()

    reset_res = client.post("/api/v1/companies/reset-demo")
    assert reset_res.status_code == 200, reset_res.text

    conn = sqlite3.connect(TEST_DB_PATH)
    columns = {row[1] for row in conn.execute("PRAGMA table_info(companies)")}
    conn.close()
    assert "verified_supplements_json" in columns
