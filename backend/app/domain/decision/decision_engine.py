"""
Decision Engine: 4 коридора, ставка от ключевой ставки ЦБ, MaxPayment,
4 встречных предложения и чек-лист оздоровления.

На вход получает готовый ScoreResult — сам балл здесь не пересчитывается.
"""
from __future__ import annotations

from app.core.config import settings
from app.core.constants import (
    COLLATERAL_COVERAGE_RATIO,
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
    ProductType.VKL_SEC: "ВКЛ с залогом",
    ProductType.OVERDRAFT: "Овердрафт",
}


def collateral_covers(requested_amount_rub: float, collateral_value_rub: float) -> bool:
    """Залог покрывает ≥50% запрошенной суммы."""
    if requested_amount_rub <= 0 or collateral_value_rub <= 0:
        return False
    return collateral_value_rub >= requested_amount_rub * COLLATERAL_COVERAGE_RATIO


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


def build_secured_offer(
    requested_amount: float,
    term_months: int,
    score: int,
    key_rate_pct: float | None = None,
) -> CounterOffer:
    """Полная сумма под залог (ВКЛ с залогом)."""
    rate = calculate_rate(score, ProductType.VKL_SEC, key_rate_pct=key_rate_pct)
    payment = calculate_annuity_payment(requested_amount, rate, term_months)
    return CounterOffer(
        product_type=ProductType.VKL_SEC.value,
        product_label=_PRODUCT_LABELS[ProductType.VKL_SEC],
        amount_rub=round(requested_amount, 2),
        term_months=term_months,
        rate_pct=rate,
        monthly_payment_rub=round(payment, 2),
        label="Полная сумма с залогом",
        features=[
            "Обеспечение покрывает ≥50% суммы",
            "ВКЛ с залогом до 60 млн ₽",
            "Ставка ниже необеспеченной линии за счёт залога",
        ],
    )


def build_counter_offers(
    profile: CompanyProfile,
    product: ProductType,
    requested_amount: float,
    term_months: int,
    score: int,
    max_payment: float,
    key_rate_pct: float | None = None,
    *,
    include_secured: bool = False,
) -> list[CounterOffer]:
    """4 встречных варианта как в Figma К4 / BRD: сумма+срок, выручка, лестница, лизинг/залог."""
    base_rate = calculate_rate(score, product, key_rate_pct=key_rate_pct)
    limit = calculate_credit_limit(profile, max_payment, base_rate, 24)
    # Вариант 1: меньше сумма, дольше срок (безопасный платёж в низкий сезон)
    safe_amount = max(1.0, min(requested_amount, limit, 1_200_000.0))
    safe_term = 24
    safe_payment = calculate_annuity_payment(safe_amount, base_rate, safe_term)
    # Вариант 2: платёж от выручки (9% эквайринга)
    revenue_amount = max(1.0, min(requested_amount, max(limit * 1.5, 1_800_000.0)))
    revenue_term = 18
    # Вариант 3: лестница лимитов
    ladder_amount = max(1.0, min(900_000.0, limit))
    ladder_term = 24
    ladder_payment = calculate_annuity_payment(ladder_amount, base_rate, ladder_term)

    fourth = (
        build_secured_offer(requested_amount, term_months, score, key_rate_pct=key_rate_pct)
        if include_secured
        else CounterOffer(
            product_type=ProductType.INVEST_LEASING.value,
            product_label="Альфа-Лизинг",
            amount_rub=round(requested_amount, 2),
            term_months=min(36, max(term_months, 24)),
            rate_pct=base_rate,
            monthly_payment_rub=0.0,
            label="Оплата поставщику",
            features=[
                "Альфа-Лизинг",
                "Аванс от 0%",
                "Срок до 36 мес.",
                "Предмет лизинга — оборудование из счёта",
            ],
        )
    )
    if not include_secured:
        fourth.features.append("Ростер — предмет лизинга" if profile.demo_key == "rosters" else "Оборудование — предмет лизинга")

    drafts = [
        CounterOffer(
            product_type=product.value,
            product_label=_PRODUCT_LABELS[product],
            amount_rub=round(safe_amount, 2),
            term_months=safe_term,
            rate_pct=base_rate,
            monthly_payment_rub=round(safe_payment, 2),
            label="Меньше сумма, дольше срок",
            features=["Укладывается в низкий сезон", f"Платёж ≈ {round(safe_payment):,} ₽".replace(",", " ")],
        ),
        CounterOffer(
            product_type=ProductType.OVERDRAFT.value,
            product_label="Платёж от выручки",
            amount_rub=round(revenue_amount, 2),
            term_months=revenue_term,
            rate_pct=base_rate,
            monthly_payment_rub=0.0,
            label="Платёж от выручки",
            features=["9% эквайринга", "Летом платёж снижается автоматически"],
        ),
        CounterOffer(
            product_type=ProductType.VKL.value,
            product_label="Лестница лимитов",
            amount_rub=round(ladder_amount, 2),
            term_months=ladder_term,
            rate_pct=base_rate,
            monthly_payment_rub=round(ladder_payment, 2),
            label="Лестница лимитов",
            features=["Рост лимита до 2 000 000 ₽", "После 3 платежей без просрочек"],
        ),
        fourth,
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
    *,
    collateral_type: str = "NONE",
    collateral_value_rub: float = 0.0,
) -> DecisionResult:
    """Принимает решение по 4 коридорам и считает лимит/ставку/платёж."""
    fcf = calculate_fcf(profile)
    k_sector = calculate_k_sector(profile)
    max_payment = calculate_max_payment(profile)
    key_rate = settings.cbr_key_rate if key_rate_pct is None else key_rate_pct
    has_collateral = collateral_type not in ("NONE", "", None) and collateral_covers(
        requested_amount_rub, collateral_value_rub
    )
    decision_product = ProductType.VKL_SEC if has_collateral else product

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
    rate = calculate_rate(score, decision_product, key_rate_pct=key_rate)
    monthly_payment = calculate_annuity_payment(requested_amount_rub, rate, term_months)
    limit = calculate_credit_limit(profile, max_payment, rate, term_months)
    # С достаточным залогом лимит поднимается до запрошенной суммы (демо).
    if has_collateral:
        limit = max(limit, requested_amount_rub)
    approved_amount = min(requested_amount_rub, limit)

    payment_exceeds_limit = monthly_payment > max_payment and not has_collateral
    weak_location = (
        profile.geo_score < GEO_SCORE_LOW_THRESHOLD
        and profile.business_model.value == "B2C_OFFLINE"
        and not has_collateral
    )

    # Достаточный залог поднимает жёлтый коридор до одобрения полной суммы (демо).
    if has_collateral and score >= SCORE_COUNTER_OFFER_MIN:
        secured_rate = calculate_rate(score, ProductType.VKL_SEC, key_rate_pct=key_rate)
        secured_payment = calculate_annuity_payment(requested_amount_rub, secured_rate, term_months)
        return DecisionResult(
            outcome=DecisionOutcome.APPROVED,
            approved_amount_rub=round(requested_amount_rub, 2),
            final_rate_pct=secured_rate,
            monthly_payment_rub=round(secured_payment, 2),
            fcf_rub=fcf,
            max_payment_rub=round(max_payment, 2),
            k_sector=k_sector,
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

    # 520–649: черновик контр-оффера готов, но клиент его не видит, пока инспектор не опубликует.
    if score >= SCORE_COUNTER_OFFER_MIN:
        return DecisionResult(
            outcome=DecisionOutcome.MANUAL_REVIEW,
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
                include_secured=has_collateral or collateral_type not in ("NONE", "", None),
            ),
            rejection_checklist=(
                ["Платёж по заявке превышает расчётный MaxPayment — инспектор отправит встречные варианты."]
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
