"""
Встречный запрос клиента на другой продукт — оценка без пересчёта на фронте.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.core.config import settings
from app.core.constants import CLIENT_REQUEST_MIN_SCORE_FOR_PRODUCT_SWITCH
from app.domain.decision.decision_engine import calculate_rate, make_decision
from app.domain.finances import calculate_annuity_payment, calculate_max_payment
from app.domain.scoring.risk_score import calculate_risk_score
from app.domain.types import CompanyProfile, DecisionOutcome, ProductType


@dataclass(frozen=True)
class ClientProductRequestPayload:
    product_type: str
    requested_amount_rub: float
    term_months: int
    comment: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "product_type": self.product_type,
            "requested_amount_rub": round(self.requested_amount_rub, 2),
            "term_months": self.term_months,
            "comment": self.comment,
        }


@dataclass(frozen=True)
class SupplementHint:
    code: str
    label: str
    reason: str
    score_delta: int

    def as_dict(self) -> dict[str, Any]:
        return {
            "code": self.code,
            "label": self.label,
            "reason": self.reason,
            "score_delta": self.score_delta,
        }


@dataclass(frozen=True)
class ClientRequestVerdict:
    is_acceptable: bool
    summary: str
    reasons: list[str]
    suggested_supplements: list[SupplementHint]
    pilot_actions: list[str]

    def as_dict(self) -> dict[str, Any]:
        return {
            "is_acceptable": self.is_acceptable,
            "summary": self.summary,
            "reasons": self.reasons,
            "suggested_supplements": [item.as_dict() for item in self.suggested_supplements],
            "pilot_actions": self.pilot_actions,
        }


_PRODUCT_LABELS = {
    ProductType.INVEST_LEASING.value: "Инвест-кредит / лизинг",
    ProductType.VKL.value: "Возобновляемая кредитная линия",
    ProductType.VKL_SEC.value: "ВКЛ с залогом",
    ProductType.OVERDRAFT.value: "Овердрафт",
}


def evaluate_client_product_request(
    profile: CompanyProfile,
    bank_product_type: str,
    payload: ClientProductRequestPayload,
) -> ClientRequestVerdict:
    score = calculate_risk_score(profile)
    product = ProductType(payload.product_type)
    decision = make_decision(
        profile,
        score,
        payload.requested_amount_rub,
        product,
        payload.term_months,
        key_rate_pct=settings.cbr_key_rate,
    )
    max_payment = calculate_max_payment(profile)
    rate = calculate_rate(score.final_score, product, settings.cbr_key_rate)
    payment = calculate_annuity_payment(payload.requested_amount_rub, rate, payload.term_months)

    reasons: list[str] = [
        f"Кредитная оценка {score.final_score} баллов.",
        f"Запрошено: {_PRODUCT_LABELS.get(payload.product_type, payload.product_type)} "
        f"на {payload.requested_amount_rub:,.0f} ₽, {payload.term_months} мес.",
        f"Платёж ≈ {payment:,.0f} ₽/мес при лимите комфортного платежа {max_payment:,.0f} ₽.",
    ]

    supplements: list[SupplementHint] = []
    if not profile.is_multibank_verified:
        from app.core.constants import SUPPLEMENT_SCORE_MULTIBANK_STATEMENT

        supplements.append(
            SupplementHint(
                code="MULTIBANK_STATEMENT",
                label="Выписки других банков за 6 месяцев",
                reason="Подтвердит оборот вне Альфы и добавит баллы за поток.",
                score_delta=SUPPLEMENT_SCORE_MULTIBANK_STATEMENT,
            )
        )
    if payload.product_type in (ProductType.INVEST_LEASING.value, ProductType.VKL_SEC.value):
        from app.core.constants import SUPPLEMENT_SCORE_EQUIPMENT_INVOICE

        supplements.append(
            SupplementHint(
                code="EQUIPMENT_INVOICE",
                label="Счёт или договор на оборудование",
                reason="Покажет целевое использование кредита.",
                score_delta=SUPPLEMENT_SCORE_EQUIPMENT_INVOICE,
            )
        )
    if bank_product_type != ProductType.OVERDRAFT.value and payload.product_type == ProductType.OVERDRAFT.value:
        reasons.append(
            "Овердрафт уместен при кратких кассовых разрывах — банк проверит сезонность выручки."
        )

    acceptable = (
        decision.outcome in (DecisionOutcome.APPROVED, DecisionOutcome.COUNTER_OFFER)
        and score.final_score >= CLIENT_REQUEST_MIN_SCORE_FOR_PRODUCT_SWITCH
        and payment <= max_payment + 0.01
    )

    if decision.outcome == DecisionOutcome.REJECTED:
        reasons.append("По правилам Decision Engine такой запрос уходит в отказ.")
    elif payment > max_payment:
        reasons.append("Платёж выше свободного денежного потока — нужны документы или меньшая сумма.")
    elif score.final_score < CLIENT_REQUEST_MIN_SCORE_FOR_PRODUCT_SWITCH:
        reasons.append(
            f"Балл ниже порога {CLIENT_REQUEST_MIN_SCORE_FOR_PRODUCT_SWITCH} для смены продукта без дозапроса."
        )
    else:
        reasons.append("Условия укладываются в коридор — пилот может одобрить как есть.")

    summary = "Запрос приемлем" if acceptable else "Запрос пока неприемлем"
    pilot_actions = (
        ["Одобрить как есть", "Отправить свой вариант", "Запросить данные"]
        if acceptable
        else ["Запросить данные", "Отправить свой вариант"]
    )

    return ClientRequestVerdict(
        is_acceptable=acceptable,
        summary=summary,
        reasons=reasons[:5],
        suggested_supplements=supplements,
        pilot_actions=pilot_actions,
    )
