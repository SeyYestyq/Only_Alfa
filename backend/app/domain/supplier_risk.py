"""
Оценка вероятности успешной сделки с поставщиком (Invoice-to-Credit).

Чистый домен: веса и пороги только из core.constants; без FastAPI/SQL/HTTP.
Сигналы приходят из симулятора реестров (seed = hash(INN)).
"""
from __future__ import annotations

from dataclasses import dataclass

from app.core.constants import (
    SUPPLIER_CONCENTRATION_HIGH_SHARE_PCT,
    SUPPLIER_DEAL_BAND_LOW_MIN_PCT,
    SUPPLIER_DEAL_BAND_MEDIUM_MIN_PCT,
    SUPPLIER_DEAL_BASE_PROBABILITY_PCT,
    SUPPLIER_DEAL_INACTIVE_EGRUL_PENALTY_RATIO,
    SUPPLIER_DEAL_MAX_PROBABILITY_PCT,
    SUPPLIER_DEAL_MIN_PROBABILITY_PCT,
    SUPPLIER_DEAL_PARTIAL_PAYMENT_RATIO,
    SUPPLIER_DEAL_PARTIAL_SECTOR_RATIO,
    SUPPLIER_DEAL_PARTIAL_TENURE_RATIO,
    SUPPLIER_DEAL_PENALTY_CONCENTRATION_PCT,
    SUPPLIER_DEAL_PENALTY_LAWSUITS_PCT,
    SUPPLIER_DEAL_PENALTY_TAX_DEBT_PCT,
    SUPPLIER_DEAL_WEIGHT_PAYMENT_HISTORY_PCT,
    SUPPLIER_DEAL_WEIGHT_SECTOR_STABILITY_PCT,
    SUPPLIER_DEAL_WEIGHT_TENURE_PCT,
    SUPPLIER_LAWSUITS_RISK_MIN,
    SUPPLIER_ON_TIME_RATE_STRONG_PCT,
    SUPPLIER_PAYMENT_HISTORY_STRONG_COUNT,
    SUPPLIER_PAYMENT_HISTORY_WEAK_COUNT,
    SUPPLIER_SECTOR_STABILITY_STRONG_MIN,
    SUPPLIER_SECTOR_STABILITY_WEAK_MAX,
    SUPPLIER_TAX_DEBT_RISK_MIN_RUB,
    SUPPLIER_TENURE_STRONG_MONTHS,
    SUPPLIER_TENURE_WEAK_MONTHS,
)


@dataclass(frozen=True)
class SupplierRiskInputs:
    """Сырые сигналы по поставщику (симулятор / реестры)."""

    supplier_inn: str
    supplier_name: str
    tenure_months: int
    completed_deals_count: int
    on_time_payment_rate_pct: float
    sector_stability_score: int
    lawsuits_count: int
    tax_debt_rub: float
    concentration_share_pct: float
    okved_cluster: str
    is_egrul_active: bool


@dataclass(frozen=True)
class SupplierRiskSignal:
    code: str
    label: str
    polarity: str  # "pro" | "con"
    value_label: str
    is_flagged: bool
    score_delta_pct: float


@dataclass(frozen=True)
class SupplierDealRiskAssessment:
    supplier_inn: str
    supplier_name: str
    okved_cluster: str
    deal_success_probability_pct: float
    risk_band: str  # LOW | MEDIUM | HIGH
    risk_score: int  # 0…100, выше выше — рискнее (100 − вероятность)
    pros: list[SupplierRiskSignal]
    cons: list[SupplierRiskSignal]
    summary: str
    source: str = "REGISTRY_SIMULATOR"


def _clamp_probability(value: float) -> float:
    return round(
        max(SUPPLIER_DEAL_MIN_PROBABILITY_PCT, min(SUPPLIER_DEAL_MAX_PROBABILITY_PCT, value)),
        1,
    )


def _risk_band(probability_pct: float) -> str:
    if probability_pct >= SUPPLIER_DEAL_BAND_LOW_MIN_PCT:
        return "LOW"
    if probability_pct >= SUPPLIER_DEAL_BAND_MEDIUM_MIN_PCT:
        return "MEDIUM"
    return "HIGH"


def _tenure_delta(tenure_months: int) -> float:
    if tenure_months >= SUPPLIER_TENURE_STRONG_MONTHS:
        return SUPPLIER_DEAL_WEIGHT_TENURE_PCT
    if tenure_months >= SUPPLIER_TENURE_WEAK_MONTHS:
        return SUPPLIER_DEAL_WEIGHT_TENURE_PCT * SUPPLIER_DEAL_PARTIAL_TENURE_RATIO
    return 0.0


def _payment_history_delta(deals: int, on_time_rate: float) -> float:
    if deals >= SUPPLIER_PAYMENT_HISTORY_STRONG_COUNT and on_time_rate >= SUPPLIER_ON_TIME_RATE_STRONG_PCT:
        return SUPPLIER_DEAL_WEIGHT_PAYMENT_HISTORY_PCT
    if deals >= SUPPLIER_PAYMENT_HISTORY_WEAK_COUNT:
        return SUPPLIER_DEAL_WEIGHT_PAYMENT_HISTORY_PCT * SUPPLIER_DEAL_PARTIAL_PAYMENT_RATIO
    return 0.0


def _sector_delta(stability: int) -> float:
    if stability >= SUPPLIER_SECTOR_STABILITY_STRONG_MIN:
        return SUPPLIER_DEAL_WEIGHT_SECTOR_STABILITY_PCT
    if stability > SUPPLIER_SECTOR_STABILITY_WEAK_MAX:
        return SUPPLIER_DEAL_WEIGHT_SECTOR_STABILITY_PCT * SUPPLIER_DEAL_PARTIAL_SECTOR_RATIO
    return 0.0


def assess_supplier_deal_risk(inputs: SupplierRiskInputs) -> SupplierDealRiskAssessment:
    """Считает вероятность успешной сделки и раскладывает плюсы/минусы."""
    tenure_delta = _tenure_delta(inputs.tenure_months)
    payment_delta = _payment_history_delta(
        inputs.completed_deals_count, inputs.on_time_payment_rate_pct
    )
    sector_delta = _sector_delta(inputs.sector_stability_score)

    has_lawsuits = inputs.lawsuits_count >= SUPPLIER_LAWSUITS_RISK_MIN
    has_tax_debt = inputs.tax_debt_rub >= SUPPLIER_TAX_DEBT_RISK_MIN_RUB
    has_concentration = inputs.concentration_share_pct >= SUPPLIER_CONCENTRATION_HIGH_SHARE_PCT

    lawsuits_delta = SUPPLIER_DEAL_PENALTY_LAWSUITS_PCT if has_lawsuits else 0.0
    tax_delta = SUPPLIER_DEAL_PENALTY_TAX_DEBT_PCT if has_tax_debt else 0.0
    concentration_delta = SUPPLIER_DEAL_PENALTY_CONCENTRATION_PCT if has_concentration else 0.0

    if not inputs.is_egrul_active:
        # Ликвидация — усиленный штраф (как по искам × коэффициент).
        inactive_penalty = (
            SUPPLIER_DEAL_PENALTY_LAWSUITS_PCT * SUPPLIER_DEAL_INACTIVE_EGRUL_PENALTY_RATIO
        )
        lawsuits_delta = min(lawsuits_delta, inactive_penalty)

    raw = (
        SUPPLIER_DEAL_BASE_PROBABILITY_PCT
        + tenure_delta
        + payment_delta
        + sector_delta
        + lawsuits_delta
        + tax_delta
        + concentration_delta
    )
    probability = _clamp_probability(raw)
    band = _risk_band(probability)
    risk_score = int(round(100 - probability))

    pros = [
        SupplierRiskSignal(
            code="TENURE",
            label="Срок на рынке",
            polarity="pro",
            value_label=f"{inputs.tenure_months} мес.",
            is_flagged=tenure_delta > 0,
            score_delta_pct=tenure_delta,
        ),
        SupplierRiskSignal(
            code="PAYMENT_HISTORY",
            label="История оплат по ИНН",
            polarity="pro",
            value_label=(
                f"{inputs.completed_deals_count} сделок · "
                f"{inputs.on_time_payment_rate_pct:.0f}% вовремя"
            ),
            is_flagged=payment_delta > 0,
            score_delta_pct=payment_delta,
        ),
        SupplierRiskSignal(
            code="SECTOR_STABILITY",
            label="Стабильность отрасли",
            polarity="pro",
            value_label=f"{inputs.okved_cluster} · индекс {inputs.sector_stability_score}",
            is_flagged=sector_delta > 0,
            score_delta_pct=sector_delta,
        ),
    ]
    cons = [
        SupplierRiskSignal(
            code="LAWSUITS",
            label="Судебные иски",
            polarity="con",
            value_label=(
                f"{inputs.lawsuits_count} дел"
                if has_lawsuits
                else "Активных исков нет"
            ),
            is_flagged=has_lawsuits or not inputs.is_egrul_active,
            score_delta_pct=lawsuits_delta,
        ),
        SupplierRiskSignal(
            code="TAX_DEBT",
            label="Налоговая задолженность",
            polarity="con",
            value_label=(
                f"{inputs.tax_debt_rub:,.0f} ₽".replace(",", " ")
                if has_tax_debt
                else "Задолженности нет"
            ),
            is_flagged=has_tax_debt,
            score_delta_pct=tax_delta,
        ),
        SupplierRiskSignal(
            code="CONCENTRATION",
            label="Концентрация на поставщике",
            polarity="con",
            value_label=f"{inputs.concentration_share_pct:.0f}% закупок",
            is_flagged=has_concentration,
            score_delta_pct=concentration_delta,
        ),
    ]

    flagged_cons = [signal for signal in cons if signal.is_flagged]
    if band == "LOW":
        summary = (
            f"Сделка с «{inputs.supplier_name}» выглядит устойчивой: "
            f"вероятность успеха ≈ {probability:.0f}%."
        )
    elif band == "MEDIUM":
        summary = (
            f"Умеренный риск по поставщику: вероятность успеха ≈ {probability:.0f}%. "
            f"Замечаний: {len(flagged_cons)}."
        )
    else:
        summary = (
            f"Повышенный риск сделки с поставщиком (≈ {probability:.0f}% успеха). "
            "Перед финансированием стоит ручная проверка."
        )

    return SupplierDealRiskAssessment(
        supplier_inn=inputs.supplier_inn,
        supplier_name=inputs.supplier_name,
        okved_cluster=inputs.okved_cluster,
        deal_success_probability_pct=probability,
        risk_band=band,
        risk_score=risk_score,
        pros=pros,
        cons=cons,
        summary=summary,
    )
