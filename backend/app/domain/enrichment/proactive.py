"""
Проактивные сценарии: поставщик рядом с бизнесом и намерение купить оборудование.
Новые правила — новые классы, без ветвлений в старых функциях.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, Optional

from app.core.constants import PROACTIVE_EQUIPMENT_INTENT_MONTHS_AHEAD, PROACTIVE_SUPPLIER_OFFER_VALID_DAYS
from app.domain.cash_forecast import build_cash_forecast, detect_radar_triggers
from app.domain.types import CompanyProfile


@dataclass(frozen=True)
class ProactiveActionProposal:
    rule_code: str
    title: str
    explanation: str
    client_text: str
    cta: str
    target_screen: str
    offer_product_type: str
    offer_amount_rub: float
    valid_until: str
    document_period: Optional[str] = None
    document_code: Optional[str] = None
    expected_score_delta: Optional[int] = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "rule_code": self.rule_code,
            "title": self.title,
            "explanation": self.explanation,
            "client_text": self.client_text,
            "cta": self.cta,
            "target_screen": self.target_screen,
            "offer_product_type": self.offer_product_type,
            "offer_amount_rub": round(self.offer_amount_rub, 2),
            "valid_until": self.valid_until,
            "document_period": self.document_period,
            "document_code": self.document_code,
            "expected_score_delta": self.expected_score_delta,
        }


class ProactiveRule(ABC):
    code: str

    @abstractmethod
    def evaluate(self, profile: CompanyProfile) -> Optional[ProactiveActionProposal]:
        ...


class NearbySupplierRule(ProactiveRule):
    """Демо: у кофейни открывается поставщик с окном на неделю."""

    code = "NEARBY_SUPPLIER"

    def evaluate(self, profile: CompanyProfile) -> Optional[ProactiveActionProposal]:
        if profile.demo_key != "rosters":
            return None
        valid = (date.today() + timedelta(days=PROACTIVE_SUPPLIER_OFFER_VALID_DAYS)).isoformat()
        return ProactiveActionProposal(
            rule_code=self.code,
            title="Поставщик рядом с точкой",
            explanation=(
                "Радар заметил нового поставщика оборудования в 400 м от кофейни Ростерс. "
                "Правило NEARBY_SUPPLIER: предложить инвест-кредит на закупку до конца недели."
            ),
            client_text=(
                "На вашей улице открылся поставщик кофейного оборудования — "
                "до {0} банк готов обсудить инвест-кредит на закупку по льготной ставке."
            ).format(valid),
            cta="Открыть предложение",
            target_screen="apply",
            offer_product_type="INVEST_LEASING",
            offer_amount_rub=1_200_000,
            valid_until=valid,
        )


class EquipmentPurchaseIntentRule(ProactiveRule):
    """Намерение CAPEX из радара / прогноза кассы."""

    code = "EQUIPMENT_INTENT"

    def evaluate(self, profile: CompanyProfile) -> Optional[ProactiveActionProposal]:
        forecast = build_cash_forecast(profile)
        triggers = detect_radar_triggers(profile, forecast)
        capex = next((t for t in triggers if t.code == "TRG_CAPEX_EXP"), None)
        if capex is None and profile.demo_key not in ("smirnov", "kovalev"):
            return None
        period_end = (
            date.today().replace(day=1) + timedelta(days=32 * PROACTIVE_EQUIPMENT_INTENT_MONTHS_AHEAD)
        ).replace(day=1) - timedelta(days=1)
        period_start = period_end.replace(day=1)
        period_label = f"{period_start.strftime('%d.%m')}–{period_end.strftime('%d.%m.%Y')}"
        return ProactiveActionProposal(
            rule_code=self.code,
            title="План закупки оборудования",
            explanation=(
                "В кабинете видно намерение усилить CAPEX в ближайший месяц. "
                "Правило EQUIPMENT_INTENT: предложить загрузить выписку за период для роста шанса."
            ),
            client_text=(
                f"Планируете закупку оборудования в следующем месяце. "
                f"Загрузите выписку за {period_label} — шанс инвест-кредита вырастет."
            ),
            cta="Загрузить выписку",
            target_screen="decision",
            offer_product_type="INVEST_LEASING",
            offer_amount_rub=900_000,
            valid_until=(date.today() + timedelta(days=21)).isoformat(),
            document_period=period_label,
            document_code="MULTIBANK_STATEMENT",
            expected_score_delta=90,
        )


PROACTIVE_RULES: tuple[ProactiveRule, ...] = (
    NearbySupplierRule(),
    EquipmentPurchaseIntentRule(),
)


def collect_proactive_proposals(profile: CompanyProfile) -> list[ProactiveActionProposal]:
    proposals: list[ProactiveActionProposal] = []
    for rule in PROACTIVE_RULES:
        proposal = rule.evaluate(profile)
        if proposal is not None:
            proposals.append(proposal)
    return proposals
