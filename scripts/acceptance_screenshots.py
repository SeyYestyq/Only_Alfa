#!/usr/bin/env python3
"""Снимки приёмки Only_Alfa (Playwright). Требует backend :8000 и frontend :5173."""
from __future__ import annotations

import hashlib
import subprocess
import sys
import time
from pathlib import Path

import requests
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8000/api/v1"
UI = "http://127.0.0.1:5173"
OUT = Path("/opt/cursor/artifacts/screenshots")


def md5(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def api_reset() -> None:
    r = requests.post(f"{BASE}/companies/reset-demo", timeout=30)
    assert r.status_code == 200, r.text


def companies() -> dict[str, dict]:
    rows = requests.get(f"{BASE}/companies", timeout=30).json()["companies"]
    return {row["demo_key"]: row for row in rows}


def create_app(
    company_id: str,
    *,
    product: str,
    amount: float,
    term: int,
    revenue: float,
    role: str,
) -> dict:
    r = requests.post(
        f"{BASE}/applications",
        json={
            "company_id": company_id,
            "product_type": product,
            "requested_amount_rub": amount,
            "term_months": term,
            "declared_monthly_revenue": revenue,
            "actor_role": role,
        },
        timeout=60,
    )
    assert r.status_code == 201, r.text
    return r.json()


def submit_client_request(app_id: str, role: str = "CEO_OWNER") -> dict:
    r = requests.post(
        f"{BASE}/applications/{app_id}/client-product-request",
        json={
            "product_type": "OVERDRAFT",
            "requested_amount_rub": 800_000,
            "term_months": 12,
            "comment": "Хочу овердрафт на закупку зерна до сезона",
            "actor_role": role,
        },
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()


def pilot_request_docs(app_id: str, doc: str = "MULTIBANK_STATEMENT") -> dict:
    r = requests.post(
        f"{BASE}/applications/{app_id}/client-request-decision",
        json={"action": "REQUEST_DATA", "document_code": doc, "actor_role": "UNDERWRITER"},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()


def upload_supplement(app_id: str, code: str, role: str = "CEO_OWNER") -> dict:
    r = requests.post(
        f"{BASE}/applications/{app_id}/supplement-document",
        json={"document_code": code, "file_name": "demo.pdf", "actor_role": role},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()


def sign_app(app_id: str, role: str) -> dict:
    r = requests.post(
        f"{BASE}/applications/{app_id}/ceo-approve",
        json={"actor_role": role},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()


def open_island(page) -> None:
    if page.locator(".dyn-island.is-open").count() == 0:
        page.locator(".dyn-island-pill").click()


def close_island(page) -> None:
    page.keyboard.press("Escape")
    if page.locator(".dyn-island.is-open").count() > 0:
        page.locator(".dyn-island-pill").click()
    page.wait_for_timeout(150)


def hide_island(page) -> None:
    """Демо-остров перекрывает навбар — убираем только для автоснимков."""
    page.locator(".dyn-island-anchor").evaluate(
        "el => { el.style.display = 'none'; }",
    )


def restore_island(page) -> None:
    page.locator(".dyn-island-anchor").evaluate(
        "el => { el.style.display = ''; }",
    )


def select_company(page, name_part: str) -> None:
    restore_island(page)
    open_island(page)
    page.locator(".demo-org-trigger").click()
    page.locator(".demo-popover-search").fill(name_part)
    page.locator(".demo-popover-list button").filter(has_text=name_part).first.click()
    close_island(page)
    page.wait_for_timeout(500)


def select_role(page, role_hint: str) -> None:
    restore_island(page)
    open_island(page)
    page.locator(".demo-user-trigger").click()
    page.locator(".demo-user-menu button").filter(has_text=role_hint).first.click()
    close_island(page)
    page.wait_for_timeout(400)


def set_bank_mode(page) -> None:
    restore_island(page)
    open_island(page)
    page.locator(".figma-view-toggle button").nth(1).click()
    close_island(page)
    page.wait_for_timeout(500)


def set_business_mode(page) -> None:
    restore_island(page)
    open_island(page)
    page.locator(".figma-view-toggle button").nth(0).click()
    close_island(page)
    page.wait_for_timeout(500)


def go_nav(page, label: str) -> None:
    hide_island(page)
    page.get_by_role("button", name=label, exact=True).click()
    page.wait_for_timeout(500)


def open_latest_application(page) -> None:
    go_nav(page, "Кредиты")
    page.locator(".credit-list-item .btn-primary").first.click()
    page.wait_for_timeout(1200)


def shot(page, name: str, width: int = 1280, height: int = 900) -> Path:
    page.set_viewport_size({"width": width, "height": height})
    page.wait_for_timeout(400)
    path = OUT / name
    page.screenshot(path=str(path), full_page=True)
    print(f"saved {path} md5={md5(path)}")
    return path


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    api_reset()
    comps = companies()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto(UI, wait_until="networkidle", timeout=60_000)

        # 01 brief rosters
        api_reset()
        create_app(
            comps["rosters"]["id"],
            product="INVEST_LEASING",
            amount=2_500_000,
            term=24,
            revenue=1_200_000,
            role="CEO_OWNER",
        )
        page.reload(wait_until="networkidle")
        select_company(page, "Ростерс")
        open_latest_application(page)
        shot(page, "acceptance-01-client-brief-rosters.png")

        # 02 rejection bodrost
        api_reset()
        create_app(
            comps["bodrost_plus"]["id"],
            product="VKL",
            amount=500_000,
            term=12,
            revenue=400_000,
            role="CEO_OWNER",
        )
        page.reload(wait_until="networkidle")
        select_company(page, "Бодрость")
        open_latest_application(page)
        shot(page, "acceptance-02-rejection-bodrost.png")

        # 03 messages offer letter
        api_reset()
        create_app(
            comps["rosters"]["id"],
            product="INVEST_LEASING",
            amount=2_500_000,
            term=24,
            revenue=1_200_000,
            role="CEO_OWNER",
        )
        page.reload(wait_until="networkidle")
        select_company(page, "Ростерс")
        open_latest_application(page)
        go_nav(page, "Сообщения")
        page.locator(".chat-thread-item").filter(has_text="Заявка").first.click()
        page.wait_for_timeout(600)
        shot(page, "acceptance-03-messages-offer-letter.png")

        # 04 client overdraft request submitted
        api_reset()
        app = create_app(
            comps["rosters"]["id"],
            product="INVEST_LEASING",
            amount=2_500_000,
            term=24,
            revenue=1_200_000,
            role="CEO_OWNER",
        )
        submit_client_request(app["application_id"])
        page.reload(wait_until="networkidle")
        select_company(page, "Ростерс")
        open_latest_application(page)
        page.locator("text=Ваш встречный запрос в банке").scroll_into_view_if_needed()
        shot(page, "acceptance-04-client-overdraft-request.png")

        # 05 pilot client request
        page.reload(wait_until="networkidle")
        set_bank_mode(page)
        select_company(page, "Ростерс")
        hide_island(page)
        page.get_by_role("button", name="К столу разбора →").first.click()
        page.wait_for_timeout(1200)
        page.locator("text=Встречный запрос клиента").scroll_into_view_if_needed()
        shot(page, "acceptance-05-pilot-client-request.png")

        # 06 score before/after
        api_reset()
        app = create_app(
            comps["rosters"]["id"],
            product="INVEST_LEASING",
            amount=2_500_000,
            term=24,
            revenue=1_200_000,
            role="CEO_OWNER",
        )
        submit_client_request(app["application_id"])
        pilot_request_docs(app["application_id"])
        upload_supplement(app["application_id"], "MULTIBANK_STATEMENT")
        set_business_mode(page)
        page.reload(wait_until="networkidle")
        select_company(page, "Ростерс")
        open_latest_application(page)
        page.locator("text=Пересчёт после загрузки").scroll_into_view_if_needed()
        shot(page, "acceptance-06-score-before-after.png")

        # 07 system decided opened/responded
        api_reset()
        cid = comps["rosters"]["id"]
        requests.get(f"{BASE}/companies/{cid}/dashboard", timeout=30)
        actions = requests.get(f"{BASE}/companies/{cid}/system-actions", timeout=30).json()["actions"]
        pending = next(a for a in actions if a["status"] == "PENDING")
        requests.post(f"{BASE}/companies/{cid}/system-actions/{pending['id']}/publish", timeout=30)
        news = requests.get(f"{BASE}/companies/{cid}/dashboard", timeout=30).json()["news_feed"]
        proactive = next(n for n in news if n.get("cluster") == "PROACTIVE")
        meta = proactive.get("meta") or {}
        action_id = meta.get("system_action_id")
        requests.post(f"{BASE}/companies/{cid}/system-actions/{action_id}/open", timeout=30)
        requests.post(
            f"{BASE}/companies/{cid}/system-actions/{action_id}/respond",
            json={"response": proactive["cta"]},
            timeout=30,
        )
        page.reload(wait_until="networkidle")
        set_bank_mode(page)
        select_company(page, "Ростерс")
        hide_island(page)
        page.get_by_role("button", name="К столу разбора →").first.click()
        page.wait_for_timeout(1200)
        page.locator("text=Клиент открыл").scroll_into_view_if_needed()
        shot(page, "acceptance-07-system-decided-opened.png")

        # 08 signing CEO smirnov
        api_reset()
        create_app(
            comps["smirnov"]["id"],
            product="INVEST_LEASING",
            amount=900_000,
            term=24,
            revenue=1_450_000,
            role="IP_OWNER",
        )
        page.reload(wait_until="networkidle")
        set_business_mode(page)
        select_company(page, "Смирнов")
        select_role(page, "Предприниматель")
        open_latest_application(page)
        hide_island(page)
        page.get_by_role("button", name="Подписать договор").click()
        page.wait_for_timeout(800)
        shot(page, "acceptance-08-signing-ceo.png")

        # 09 accountant funded
        api_reset()
        app = create_app(
            comps["rosters"]["id"],
            product="INVEST_LEASING",
            amount=1_200_000,
            term=24,
            revenue=1_200_000,
            role="CEO_OWNER",
        )
        aid = app["application_id"]
        for offer_index in (0, 1, 2):
            refreshed = requests.get(f"{BASE}/applications/{aid}", timeout=30).json()
            if refreshed["status"] in ("APPROVED", "AWAITING_CEO_APPROVAL", "FUNDED"):
                break
            requests.post(
                f"{BASE}/applications/{aid}/accept-offer",
                json={"offer_index": offer_index, "actor_role": "CEO_OWNER"},
                timeout=30,
            )
        sign_app(aid, "CEO_OWNER")
        page.reload(wait_until="networkidle")
        select_company(page, "Ростерс")
        select_role(page, "Бухгалтер")
        go_nav(page, "Кредиты")
        page.locator(".credit-list-item .btn-primary").first.click()
        page.wait_for_timeout(800)
        shot(page, "acceptance-09-signing-accountant-funded.png")

        # 10 narrow
        api_reset()
        create_app(
            comps["rosters"]["id"],
            product="INVEST_LEASING",
            amount=2_500_000,
            term=24,
            revenue=1_200_000,
            role="CEO_OWNER",
        )
        page.reload(wait_until="networkidle")
        select_company(page, "Ростерс")
        open_latest_application(page)
        shot(page, "acceptance-10-narrow-decision.png", width=390, height=844)

        browser.close()

    files = sorted(OUT.glob("acceptance-*.png"))
    digests = {f.name: md5(f) for f in files}
    if len(digests) != len(set(digests.values())):
        print("ERROR: duplicate md5 among acceptance screenshots", file=sys.stderr)
        return 1
    old = list(OUT.glob("pass2-*.png")) + list(OUT.glob("*laptop*.png"))
    for f in files:
        d = md5(f)
        for o in old:
            if md5(o) == d:
                print(f"ERROR: {f.name} duplicates {o.name}", file=sys.stderr)
                return 1
    print("md5 check OK", digests)
    return 0


if __name__ == "__main__":
    sys.exit(main())
