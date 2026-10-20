"""
Детерминированный Intent Parser (4 класса) и подбор поставщиков по каталогу.

Никакой сети и GPU: только правила и локальная таблица search_catalog.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.core.constants import (
    SEARCH_DEFAULT_AMOUNT_RUB,
    SEARCH_DEFAULT_TERM_MONTHS,
    SEARCH_SUPPLIERS_LIMIT,
)
from app.domain.types import CompanyProfile
from app.infra.models import SearchCatalogItem

INTENT_CAPEX = "CAPEX"
INTENT_WORKING_CAPITAL = "WORKING_CAPITAL"
INTENT_OVERDRAFT = "OVERDRAFT"
INTENT_INFO_ONLY = "INFO_ONLY"

INTENT_LABELS = {
    INTENT_CAPEX: "Покупка оборудования (CAPEX)",
    INTENT_WORKING_CAPITAL: "Пополнение оборотных средств",
    INTENT_OVERDRAFT: "Кассовый разрыв / овердрафт",
    INTENT_INFO_ONLY: "Информационный запрос",
}

_INFO_ONLY_MARKERS = (
    "календарь", "усн", "когда платить", "срок уплаты", "ставка налога",
    "что такое", "расскажи", "объясни", "инструкция", "справка", "консультация",
    "льгот", "требования", "как работает", "как получить", "сколько стоит",
)
_OVERDRAFT_MARKERS = (
    "овердрафт", "кассовый разрыв", "не хватает", "нечем", "зарплат", "аренд",
    "срочно", "кредитная линия", "закрыть разрыв", "налоги", "налог", "платёж",
)
_CAPEX_MARKERS = (
    "кофемашина", "la marzocco", "оборудован", "станок", "конвектомат", "купить",
    "лизинг", "техник", "ремонт", "холодильник", "печь", "авто", "фургон",
    "спецтехник", "стеллаж", "мебель", "приобрести", "модернизац",
)
_WORKING_CAPITAL_MARKERS = (
    "закупк", "товар", "материал", "кабель", "сырь", "оборот", "поставщик",
    "партия", "бетон", "арматур", "комплектующ", "пополнен", "расходник",
)


@dataclass
class IntentResult:
    intent: str
    matched_markers: list[str] = field(default_factory=list)


@dataclass
class CatalogMatch:
    item: SearchCatalogItem
    score: int


def normalize_query(query: str) -> str:
    return re.sub(r"\s+", " ", query.lower().replace("ё", "е")).strip()


def parse_intent(query: str) -> IntentResult:
    """Классифицирует запрос в один из 4 классов. INFO_ONLY имеет приоритет."""
    normalized = normalize_query(query)
    info_hits = [marker for marker in _INFO_ONLY_MARKERS if marker in normalized]

    scores = {
        INTENT_OVERDRAFT: sum(1 for marker in _OVERDRAFT_MARKERS if marker in normalized),
        INTENT_CAPEX: sum(1 for marker in _CAPEX_MARKERS if marker in normalized),
        INTENT_WORKING_CAPITAL: sum(1 for marker in _WORKING_CAPITAL_MARKERS if marker in normalized),
    }
    all_hits = {
        intent: [marker for marker in markers if marker in normalized]
        for intent, markers in (
            (INTENT_OVERDRAFT, _OVERDRAFT_MARKERS),
            (INTENT_CAPEX, _CAPEX_MARKERS),
            (INTENT_WORKING_CAPITAL, _WORKING_CAPITAL_MARKERS),
        )
    }

    if info_hits and not any(scores.values()):
        return IntentResult(INTENT_INFO_ONLY, info_hits)
    if info_hits and len(info_hits) >= max(scores.values()):
        return IntentResult(INTENT_INFO_ONLY, info_hits)

    best_intent = max(scores, key=lambda intent: scores[intent])
    if scores[best_intent] == 0:
        return IntentResult(INTENT_CAPEX, [])
    return IntentResult(best_intent, all_hits[best_intent])


_AMOUNT_WITH_UNIT_RE = re.compile(
    r"(\d[\d\s.,]*)\s*(млн|миллион\w*|тыс\w*|тысяч\w*|к)\b", re.IGNORECASE
)
_AMOUNT_PLAIN_RE = re.compile(r"(\d[\d\s]{3,})(?!\s*(?:км|м|м2|м3|шт|т|кг|л)\b)", re.IGNORECASE)


def _parse_number(raw: str) -> float | None:
    cleaned = raw.strip().replace(" ", "").replace("\xa0", "")
    if not cleaned:
        return None
    if cleaned.count(",") == 1 and "." not in cleaned:
        cleaned = cleaned.replace(",", ".")
    else:
        cleaned = cleaned.replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def extract_amount(query: str) -> float | None:
    """Достаёт сумму из запроса: «900 000», «3,2 млн», «900 тыс»."""
    normalized = normalize_query(query)
    match = _AMOUNT_WITH_UNIT_RE.search(normalized)
    if match:
        value = _parse_number(match.group(1))
        if value is None:
            return None
        unit = match.group(2)
        if unit.startswith("млн") or unit.startswith("миллион"):
            return round(value * 1_000_000, 2)
        if unit.startswith("тыс") or unit.startswith("тысяч") or unit == "к":
            return round(value * 1_000, 2)
    match = _AMOUNT_PLAIN_RE.search(normalized)
    if match:
        value = _parse_number(match.group(1))
        if value and value >= 1_000:
            return round(value, 2)
    return None


def _tokens(query: str) -> list[str]:
    raw = re.findall(r"[a-zа-я0-9]+", normalize_query(query))
    return [token for token in raw if len(token) >= 3]


def rank_catalog(
    query: str,
    items: list[SearchCatalogItem],
    profile: CompanyProfile | None,
) -> list[CatalogMatch]:
    tokens = _tokens(query)
    cluster_code = (profile.okved_code.split(".")[0] if profile else "")
    ranked: list[CatalogMatch] = []

    for item in items:
        haystack = f"{item.item_name} {item.keywords} {item.okved_cluster}".lower()
        score = 0
        for token in tokens:
            if token in haystack:
                score += 3
        if cluster_code and item.cluster_code == cluster_code:
            score += 1
        if score > 0:
            ranked.append(CatalogMatch(item=item, score=score))

    ranked.sort(key=lambda match: (-match.score, -match.item.amount_rub))
    return ranked


def pick_suppliers(matches: list[CatalogMatch]) -> list[SearchCatalogItem]:
    """3 проверенных поставщика без дублей по ИНН."""
    selected: list[SearchCatalogItem] = []
    seen_inns: set[str] = set()
    for match in matches:
        if match.item.supplier_inn in seen_inns:
            continue
        selected.append(match.item)
        seen_inns.add(match.item.supplier_inn)
        if len(selected) >= SEARCH_SUPPLIERS_LIMIT:
            break
    return selected


def resolve_amount(query: str, matches: list[CatalogMatch], intent: str) -> tuple[float, str]:
    parsed = extract_amount(query)
    if parsed:
        return parsed, "QUERY"
    if matches:
        return round(matches[0].item.amount_rub, 2), "CATALOG"
    return SEARCH_DEFAULT_AMOUNT_RUB[intent], "DEFAULT"


def default_term(intent: str) -> int:
    return SEARCH_DEFAULT_TERM_MONTHS[intent]


def product_for_intent(intent: str) -> str:
    return {
        INTENT_CAPEX: "INVEST_LEASING",
        INTENT_WORKING_CAPITAL: "VKL",
        INTENT_OVERDRAFT: "OVERDRAFT",
    }.get(intent, "INVEST_LEASING")
