"""
Decision Engine: 4 коридора, ставка от ключевой ставки ЦБ, MaxPayment,
4 встречных предложения и чек-лист оздоровления.

На вход получает готовый ScoreResult — сам балл здесь не пересчитывается.
"""
from __future__ import annotations

from app.core.config import settings
from app.core.constants import (
    GEO_SCORE_LOW_THRESHOLD,
    RATE_ADJUSTMENT_HIGH,
    RATE_ADJUSTMENT_HIGH_MIN_SCORE,
    RATE_ADJUSTMENT_LOW,
    RATE_ADJUSTMENT_MID,
    RATE_ADJUSTMENT_MID_MIN_SCORE,
    SCORE_APPROVED_MIN,
    SCORE_COUNTER_OFFER_MIN,
    SCORE_MANUAL_REVIEW_MIN,
)
from app.domain.finances import (
    calculate_annuity_payment,
    calculate_credit_limit,
    calculate_fcf,
    calculate_k_sector,
    calculate_max_payment,
    product_spread,
)
from app.domain.types import (
    CompanyProfile,
    CounterOffer,
    DecisionOutcome,
    DecisionResult,
    ProductType,
    ScoreResult,
)

_PRODUCT_LABELS = {
    ProductType.INVEST_LEASING: "Инвест-кредит / лизинг",
    ProductType.VKL: "Возобновляемая кредитная линия",
    ProductType.OVERDRAFT: "Овердрафт",
}


def calculate_rate(score: int, product: ProductType, key_rate_pct: float | None = None) -> float:
    """FinalRate = CBR_KEY_RATE + ProductSpread + RiskAdjustment."""
    key_rate = settings.cbr_key_rate if key_rate_pct is None else key_rate_pct
    if score >= RATE_ADJUSTMENT_HIGH_MIN_SCORE:
        adjustment = RATE_ADJUSTMENT_HIGH
    elif score >= RATE_ADJUSTMENT_MID_MIN_SCORE:
        adjustment = RATE_ADJUSTMENT_MID
    else:
        adjustment = RATE_ADJUSTMENT_LOW
    return round(key_rate + product_spread(product) + adjustment, 2)


def build_counter_offers(
    profile: CompanyProfile,
    product: ProductType,
    requested_amount: float,
    term_months: int,
    score: int,
    max_payment: float,
    key_rate_pct: float | None = None,
) -> list[CounterOffer]:
    """4 встречных варианта: сумма, срок, овердрафт под эквайринг, ВКЛ."""
    base_rate = calculate_rate(score, product, key_rate_pct=key_rate_pct)
    limit = calculate_credit_limit(profile, max_payment, base_rate, term_months)
    overdraft_rate = calculate_rate(score, ProductType.OVERDRAFT, key_rate_pct=key_rate_pct)
    vkl_rate = calculate_rate(score, ProductType.VKL, key_rate_pct=key_rate_pct)

    reduced_amount = max(1.0, min(requested_amount, limit))
    extended_term = min(60, max(term_months + 12, term_months + 1))
    while (
        calculate_annuity_payment(requested_amount, base_rate, extended_term) > max_payment
        and extended_term < 60
    ):
        extended_term = min(60, extended_term + 6)
    overdraft_limit = max(1.0, max_payment * 3)
    vkl_limit = max(1.0, max_payment * 6)

    drafts = [
        CounterOffer(
            product_type=product.value,
            product_label=_PRODUCT_LABELS[product],
            amount_rub=round(reduced_amount, 2),
            term_months=term_months,
            rate_pct=base_rate,
            monthly_payment_rub=round(calculate_annuity_payment(reduced_amount, base_rate, term_months), 2),
            label="Снизить сумму до расчётного лимита",
            features=["Платёж укладывается в MaxPayment", "Срок сохраняется"],
        ),
        CounterOffer(
            product_type=product.value,
            product_label=_PRODUCT_LABELS[product],
            amount_rub=round(requested_amount, 2),
            term_months=extended_term,
            rate_pct=base_rate,
            monthly_payment_rub=round(calculate_annuity_payment(requested_amount, base_rate, extended_term), 2),
            label=f"Удлинить срок до {extended_term} мес.",
            features=["Сумма заявки сохраняется", "Платёж укладывается в MaxPayment за счёт срока"],
        ),
        CounterOffer(
            product_type=ProductType.OVERDRAFT.value,
            product_label=_PRODUCT_LABELS[ProductType.OVERDRAFT],
            amount_rub=round(overdraft_limit, 2),
            term_months=6,
            rate_pct=overdraft_rate,
            monthly_payment_rub=round(calculate_annuity_payment(overdraft_limit, overdraft_rate, 6), 2),
            label="Овердрафт с погашением 9% с эквайринга",
            features=["Погашение 9% с дневного эквайринга", "Лимит восстанавливается по мере выручки"],
        ),
        CounterOffer(
            product_type=ProductType.VKL.value,
            product_label=_PRODUCT_LABELS[ProductType.VKL],
            amount_rub=round(vkl_limit, 2),
            term_months=12,
            rate_pct=vkl_rate,
            monthly_payment_rub=round(calculate_annuity_payment(vkl_limit, vkl_rate, 12), 2),
            label="Возобновляемая кредитная линия на 12 мес.",
            features=["Выборка частями под каждый платёж", "Проценты только на использованный лимит"],
        ),
    ]
    for index, offer in enumerate(drafts, start=1):
        offer.features.insert(0, f"Вариант {index} из 4")
    return drafts


def _rejection_checklist(hard_stop: bool, reasons: list[str]) -> list[str]:
    if hard_stop:
        return [
            "Шаг 1 (0–30 дней): погасите текущую просрочку и закройте исполнительные листы ФССП.",
            "Шаг 2 (30–60 дней): восстановите положительный денежный поток — сократите постоянные расходы.",
            "Шаг 3 (60–90 дней): нарастите обороты в Альфа-Банке до устойчивого положительного FCF.",
            "Шаг 4: подайте повторную заявку — история платежей за 90 дней будет учтена в скоринге.",
            "Причина отказа: " + "; ".join(reasons),
        ]
    return [
        "Увеличьте среднемесячные обороты в Альфа-Банке минимум на 30%.",
        "Снизьте долговую нагрузку: платежи по кредитам должны быть ниже 25% FCF.",
        "Подтвердите выручку выписками из других банков (Мультибанк).",
        "Повторная заявка возможна через 60 дней.",
    ]


def make_decision(
    profile: CompanyProfile,
    score_result: ScoreResult,
    requested_amount_rub: float,
    product: ProductType,
    term_months: int,
    key_rate_pct: float | None = None,
) -> DecisionResult:
    """Принимает решение по 4 коридорам и считает лимит/ставку/платёж."""
    fcf = calculate_fcf(profile)
    k_sector = calculate_k_sector(profile)
    max_payment = calculate_max_payment(profile)
    key_rate = settings.cbr_key_rate if key_rate_pct is None else key_rate_pct

    if score_result.is_hard_stop:
        return DecisionResult(
            outcome=DecisionOutcome.REJECTED,
            approved_amount_rub=0.0,
            final_rate_pct=0.0,
            monthly_payment_rub=0.0,
            fcf_rub=fcf,
            max_payment_rub=0.0,
            k_sector=k_sector,
            rejection_checklist=_rejection_checklist(True, score_result.hard_stop_reasons),
        )

    score = score_result.final_score
    rate = calculate_rate(score, product, key_rate_pct=key_rate)
    monthly_payment = calculate_annuity_payment(requested_amount_rub, rate, term_months)
    limit = calculate_credit_limit(profile, max_payment, rate, term_months)
    approved_amount = min(requested_amount_rub, limit)

    payment_exceeds_limit = monthly_payment > max_payment
    weak_location = (
        profile.geo_score < GEO_SCORE_LOW_THRESHOLD
        and profile.business_model.value == "B2C_OFFLINE"
    )

    if score >= SCORE_APPROVED_MIN and not payment_exceeds_limit and not weak_location:
        return DecisionResult(
            outcome=DecisionOutcome.APPROVED,
            approved_amount_rub=round(approved_amount, 2),
            final_rate_pct=rate,
            monthly_payment_rub=round(monthly_payment, 2),
            fcf_rub=fcf,
            max_payment_rub=round(max_payment, 2),
            k_sector=k_sector,
        )

    if score >= SCORE_COUNTER_OFFER_MIN:
        return DecisionResult(
            outcome=DecisionOutcome.COUNTER_OFFER,
            approved_amount_rub=round(approved_amount, 2),
            final_rate_pct=rate,
            monthly_payment_rub=round(monthly_payment, 2),
            fcf_rub=fcf,
            max_payment_rub=round(max_payment, 2),
            k_sector=k_sector,
            counter_offers=build_counter_offers(
                profile,
                product,
                requested_amount_rub,
                term_months,
                score,
                max_payment,
                key_rate_pct=key_rate,
            ),
            rejection_checklist=(
                ["Платёж по заявке превышает расчётный MaxPayment — выберите один из 4 встречных вариантов."]
                if payment_exceeds_limit or weak_location else []
            ),
        )

    if score >= SCORE_MANUAL_REVIEW_MIN:
        return DecisionResult(
            outcome=DecisionOutcome.MANUAL_REVIEW,
            approved_amount_rub=0.0,
            final_rate_pct=rate,
            monthly_payment_rub=round(monthly_payment, 2),
            fcf_rub=fcf,
            max_payment_rub=round(max_payment, 2),
            k_sector=k_sector,
            rejection_checklist=[
                "Заявка передана кредитному инспектору.",
                f"Текущий балл {score} — оранжевый коридор (450–519).",
                "Инспектор может запросить подтверждающие документы.",
            ],
        )

    return DecisionResult(
        outcome=DecisionOutcome.REJECTED,
        approved_amount_rub=0.0,
        final_rate_pct=0.0,
        monthly_payment_rub=0.0,
        fcf_rub=fcf,
        max_payment_rub=0.0,
        k_sector=k_sector,
        rejection_checklist=_rejection_checklist(False, score_result.hard_stop_reasons),
    )
