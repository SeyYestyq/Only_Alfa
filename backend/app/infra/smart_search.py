"""
Умный бизнес-поиск (Search-to-Credit).
Intent Parser → 4 класса: CAPEX, WORKING_CAPITAL, OVERDRAFT, INFO_ONLY.
Режим тишины при INFO_ONLY или достаточном балансе.
Детерминированный, <= 50 мс, без GPU.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from app.domain.types import CompanyProfile


class SearchIntent(str, Enum):
    CAPEX = "CAPEX"
    WORKING_CAPITAL = "WORKING_CAPITAL"
    OVERDRAFT = "OVERDRAFT"
    INFO_ONLY = "INFO_ONLY"


# ── Ключевые слова для классификации ────────────────────────────────────────
_CAPEX_KEYWORDS = [
    "оборудование", "станок", "техника", "купить", "приобрести",
    "кофемашина", "холодильник", "морозильник", "пекарня", "печь",
    "ремонт", "строительство", "лизинг", "инвест", "capex",
    "кофейня", "машина", "авто", "транспорт", "склад",
]
_WORKING_CAPITAL_KEYWORDS = [
    "закупка", "товар", "материал", "сырьё", "пополнение", "оборотные",
    "стройматериал", "бетон", "кирпич", "комплектующие", "запасы",
    "working capital", "оборотный", "оборотка", "поставщик",
]
_OVERDRAFT_KEYWORDS = [
    "зарплата", "налог", "аренда", "платёж", "кассовый разрыв",
    "не хватает", "срочно", "сегодня", "недостача", "overdraft",
    "овердрафт", "кредитная линия", "срочный кредит",
]
_INFO_ONLY_KEYWORDS = [
    "календарь усн", "усн", "налоговый календарь", "ставка", "сколько",
    "как", "что такое", "расскажи", "объясни", "когда платить",
    "справка", "консультация", "info", "информация",
]


@dataclass
class CatalogItem:
    inn: str
    name: str
    price_label: str
    fssp_clean: bool
    okved_cluster: str
    news_insight: str


@dataclass
class SearchResult:
    query: str
    intent: SearchIntent
    silence_mode: bool
    silence_reason: Optional[str]
    catalog_items: list[CatalogItem] = field(default_factory=list)
    credit_badge: Optional[dict] = None
    news_feed_item: Optional[dict] = None


# ── Каталог поставщиков (5 кластеров ОКВЭД) ─────────────────────────────────
_CATALOG: list[CatalogItem] = [
    # Кофейня / общественное питание
    CatalogItem("7701234567", "ООО «КофеТехПро»", "Кофемашина La Marzocco: 290 000 ₽", True,
                "Общественное питание (ОКВЭД 56)",
                "📈 Выручка кофеен +18% г/г — рынок растёт"),
    CatalogItem("7712345678", "ИП Морозов (пекарня)", "Конвектомат Rational: 180 000 ₽", True,
                "Общественное питание (ОКВЭД 56)",
                "🏆 Гранты Минэкономики для HoReCa до 500 тыс. ₽"),

    # Строительство
    CatalogItem("7723456789", "ООО «СтройМат»", "Бетон М300: 4 500 ₽/м³", True,
                "Строительство (ОКВЭД 41-43)",
                "🏗️ Госзаказ на строительство вырос на 34%"),
    CatalogItem("7734567890", "ООО «МеталлТрейд»", "Арматура А500: 68 000 ₽/т", True,
                "Строительство (ОКВЭД 41-43)",
                "💡 Льготная ипотека для застройщиков — новые лимиты"),

    # Торговля
    CatalogItem("7745678901", "ООО «ТоргОпт»", "Товарный кредит: от 500 000 ₽", True,
                "Торговля (ОКВЭД 45-47)",
                "🛒 Wildberries и Ozon: комиссия снижена до 15%"),

    # Производство
    CatalogItem("7756789012", "ООО «ПромМаш»", "Токарный станок ЧПУ: 1 200 000 ₽", True,
                "Производство (ОКВЭД 10-33)",
                "🔧 Субсидии на промышленный лизинг: ставка 5%"),

    # Услуги
    CatalogItem("7767890123", "ООО «ИТ-Решения»", "CRM-система: 35 000 ₽/год", True,
                "Услуги (ОКВЭД 69-75)",
                "💻 ИТ-отрасль: налоговые льготы продлены до 2028"),
]


def _classify_intent(query: str) -> SearchIntent:
    """Детерминированный Intent Parser по ключевым словам."""
    q = query.lower()

    # Проверяем INFO_ONLY первым — если запрос информационный, не предлагать кредит
    for kw in _INFO_ONLY_KEYWORDS:
        if kw in q:
            return SearchIntent.INFO_ONLY

    capex_score = sum(1 for kw in _CAPEX_KEYWORDS if kw in q)
    wc_score = sum(1 for kw in _WORKING_CAPITAL_KEYWORDS if kw in q)
    od_score = sum(1 for kw in _OVERDRAFT_KEYWORDS if kw in q)

    if od_score > 0:
        return SearchIntent.OVERDRAFT
    if capex_score > wc_score:
        return SearchIntent.CAPEX
    if wc_score > 0:
        return SearchIntent.WORKING_CAPITAL

    # По умолчанию — CAPEX (чаще всего ищут что-то купить)
    return SearchIntent.CAPEX


def _filter_catalog(query: str, intent: SearchIntent) -> list[CatalogItem]:
    """Фильтруем каталог по запросу и интенту."""
    q = query.lower()
    scored: list[tuple[int, CatalogItem]] = []

    for item in _CATALOG:
        score = 0
        if intent == SearchIntent.CAPEX and any(kw in item.okved_cluster.lower() for kw in ["производство", "питание"]):
            score += 2
        if intent == SearchIntent.WORKING_CAPITAL and "торговля" in item.okved_cluster.lower():
            score += 2
        if intent == SearchIntent.OVERDRAFT:
            score += 1
        # Совпадение по ключевым словам из запроса
        for word in q.split():
            if len(word) > 3 and (word in item.name.lower() or word in item.price_label.lower()):
                score += 3
        scored.append((score, item))

    scored.sort(key=lambda x: -x[0])
    return [item for _, item in scored[:4]]


def smart_search(query: str, profile: Optional[CompanyProfile] = None) -> SearchResult:
    """
    Основная точка входа.

    Args:
        query: строка поиска предпринимателя
        profile: текущий профиль компании (для режима тишины)
    Returns:
        SearchResult с intent, каталогом и кредитной плашкой
    """
    intent = _classify_intent(query)

    # Режим тишины
    if intent == SearchIntent.INFO_ONLY:
        return SearchResult(
            query=query,
            intent=intent,
            silence_mode=True,
            silence_reason="Кредит не требуется — информационный запрос",
        )

    if profile is not None:
        monthly_revenue = profile.monthly_revenue_alfa + profile.monthly_revenue_multibank
        if profile.account_balance >= monthly_revenue * 0.5:
            return SearchResult(
                query=query,
                intent=intent,
                silence_mode=True,
                silence_reason="Кредит не требуется — на счёте достаточно средств",
            )

    items = _filter_catalog(query, intent)

    # Кредитная плашка
    amount_estimates = {
        SearchIntent.CAPEX: 900_000,
        SearchIntent.WORKING_CAPITAL: 3_200_000,
        SearchIntent.OVERDRAFT: 500_000,
    }
    credit_badge = {
        "intent": intent.value,
        "estimated_amount_rub": amount_estimates.get(intent, 1_000_000),
        "label": f"Кредит на {intent.value.replace('_', ' ').lower()}",
        "pre_approved": True,
    }

    # News-to-Action: отраслевой инсайт
    news_item = None
    if items:
        news_item = {
            "text": items[0].news_insight,
            "cta": "Узнать подробнее",
            "cluster": items[0].okved_cluster,
        }

    return SearchResult(
        query=query,
        intent=intent,
        silence_mode=False,
        silence_reason=None,
        catalog_items=items,
        credit_badge=credit_badge,
        news_feed_item=news_item,
    )
