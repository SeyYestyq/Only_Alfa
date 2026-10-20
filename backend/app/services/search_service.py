"""Умный поиск: Intent Parser → каталог → кредитная плашка / Режим тишины."""
from __future__ import annotations

import time

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import SEARCH_BALANCE_SILENCE_RATIO, SEARCH_SUPPLIERS_LIMIT
from app.core.exceptions import EntityNotFound
from app.domain.cash_forecast import build_cash_forecast, find_cash_gap
from app.domain.decision.decision_engine import calculate_rate
from app.domain.finances import (
    calculate_annuity_payment,
    calculate_credit_limit,
    calculate_max_payment,
)
from app.domain.scoring.risk_score import calculate_risk_score
from app.domain.types import ProductType
from app.infra.models import SearchCatalogItem
from app.infra.openai_adapter import enrich_search_result
from app.infra.smart_search_engine import (
    INTENT_INFO_ONLY,
    INTENT_LABELS,
    default_term,
    parse_intent,
    pick_suppliers,
    product_for_intent,
    rank_catalog,
    resolve_amount,
)
from app.repositories.catalog_repository import CatalogRepository
from app.repositories.company_repository import CompanyRepository
from app.services.presenters import money, news_row


class SearchService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.companies = CompanyRepository(session)
        self.catalog = CatalogRepository(session)

    async def search(self, company_id: str, query: str) -> dict:
        started = time.perf_counter()
        profile = self.companies.get_by_id(company_id)
        if profile is None:
            raise EntityNotFound(f"Компания {company_id} не найдена")

        intent_result = parse_intent(query)
        intent = intent_result.intent
        catalog_items = self.catalog.list_items()
        matches = rank_catalog(query, catalog_items, profile)
        amount, amount_source = resolve_amount(query, matches, intent)

        silence_mode = False
        silence_reason = None
        if intent == INTENT_INFO_ONLY:
            silence_mode = True
            silence_reason = "Кредит не требуется: это информационный запрос."
        else:
            forecast = build_cash_forecast(profile)
            _, min_balance, _ = find_cash_gap(forecast)
            enough_money = (
                profile.account_balance >= amount * SEARCH_BALANCE_SILENCE_RATIO
                and min_balance >= 0
            )
            if enough_money:
                silence_mode = True
                silence_reason = "Кредит не требуется: на счёте достаточно средств и кассового разрыва нет."

        suppliers = self._suppliers(matches, catalog_items, profile)
        market_prices = [
            {
                "item": match.item.item_name,
                "price_rub": money(match.item.amount_rub),
                "price_label": match.item.price_label,
                "unit": match.item.unit,
                "supplier_name": match.item.supplier_name,
            }
            for match in matches[:4]
        ]

        classified_ms = round((time.perf_counter() - started) * 1000, 2)
        badge = None if silence_mode else self._credit_badge(profile, intent, amount, query)
        news_item = None
        if not silence_mode and matches:
            top = matches[0].item
            created = self.catalog.add_news(
                company_id=profile.id,
                title=top.news_insight,
                text=(
                    f"Подобрано по запросу «{query}»: {top.item_name} "
                    f"({top.price_label}). Поставщик проверен: ФССП 0 ₽."
                ),
                cta="Открыть предложение",
                cluster=profile.okved_cluster,
            )
            self.session.commit()
            news_item = news_row(created)

        payload = {
            "query": query,
            "intent": intent,
            "intent_label": INTENT_LABELS[intent],
            "silence_mode": silence_mode,
            "silence_reason": silence_reason,
            "amount_estimate_rub": money(amount),
            "amount_source": amount_source,
            "market_prices": market_prices,
            "suppliers": suppliers,
            "credit_badge": badge,
            "news_item": news_item,
            "classification_ms": classified_ms,
            "ai_provider_mode": settings.ai_provider_mode,
            "ai_enrichment": None,
        }
        if not silence_mode:
            payload["ai_enrichment"] = await enrich_search_result(
                query,
                {
                    "intent": intent,
                    "amount_estimate_rub": amount,
                    "supplier_names": [supplier["name"] for supplier in suppliers],
                },
            )
        payload["total_ms"] = round((time.perf_counter() - started) * 1000, 2)
        return payload

    def _suppliers(
        self,
        matches: list,
        catalog_items: list[SearchCatalogItem],
        profile,
    ) -> list[dict]:
        selected = list(pick_suppliers(matches))
        if len(selected) < SEARCH_SUPPLIERS_LIMIT:
            cluster_code = profile.okved_code.split(".")[0]
            for item in catalog_items:
                if len(selected) >= SEARCH_SUPPLIERS_LIMIT:
                    break
                if item.cluster_code == cluster_code and item.supplier_inn not in {
                    chosen.supplier_inn for chosen in selected
                }:
                    selected.append(item)
        return [
            {
                "name": item.supplier_name,
                "inn": item.supplier_inn,
                "fssp_amount_rub": 0.0,
                "fssp_label": "ФССП: 0 ₽",
                "is_verified": item.fssp_clean,
                "price_label": item.price_label,
                "delivery_days": item.delivery_days,
            }
            for item in selected[:SEARCH_SUPPLIERS_LIMIT]
        ]

    def _credit_badge(self, profile, intent: str, amount: float, query: str) -> dict:
        product = ProductType(product_for_intent(intent))
        term = default_term(intent)
        score = calculate_risk_score(profile)
        rate = calculate_rate(score.final_score, product, key_rate_pct=settings.cbr_key_rate)
        max_payment = calculate_max_payment(profile)
        limit = calculate_credit_limit(profile, max_payment, rate, term)
        monthly = calculate_annuity_payment(amount, rate, term)
        is_preapproved = (
            not score.is_hard_stop
            and score.final_score >= 650
            and monthly <= max_payment
            and amount <= limit
        )
        return {
            "product_type": product.value,
            "product_label": {
                ProductType.INVEST_LEASING: "Инвест-кредит / лизинг",
                ProductType.VKL: "Возобновляемая кредитная линия",
                ProductType.OVERDRAFT: "Овердрафт",
            }[product],
            "amount_rub": money(amount),
            "term_months": term,
            "rate_pct": rate,
            "monthly_payment_rub": money(monthly),
            "max_payment_rub": money(max_payment),
            "limit_rub": money(limit),
            "is_preapproved": is_preapproved,
            "query": query,
            "disclaimer": "Предварительная оценка. Не является офертой.",
        }
