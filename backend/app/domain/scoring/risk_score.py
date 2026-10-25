"""
RiskScore = clamp(500 + F1 + F2 + F3 + F4 + F5, 0, 1000).

Ответственность модуля — только балл и Hard Stop. Решение по коридорам,
ставке и лимиту принимает decision_engine.
"""
from __future__ import annotations

from app.core.constants import (
    BKI_HARD_STOP_OVERDUE_DAYS,
    FSSP_HARD_STOP_SHARE,
    MIN_COMPANY_AGE_MONTHS,
    SCORE_BASE,
    SCORE_MAX,
    SCORE_MIN,
)
from app.domain.finances import calculate_fcf
from app.domain.scoring.rules import FACTOR_SELECTORS
from app.domain.scoring.supplement_factors import supplement_factor_breakdowns
from app.domain.types import CompanyProfile, FactorBreakdown, ScoreResult


def detect_hard_stops(profile: CompanyProfile) -> list[str]:
    """Этап А: 4 жёстких стоп-фактора. Возвращает все причины, а не первую."""
    reasons: list[str] = []
    if not profile.is_egrul_active:
        reasons.append("ЕГРЮЛ: статус компании не ACTIVE")
    if profile.age_months < MIN_COMPANY_AGE_MONTHS:
        reasons.append(
            f"Возраст бизнеса {profile.age_months} мес. < {MIN_COMPANY_AGE_MONTHS} мес."
        )
    if profile.bki_overdue_days > BKI_HARD_STOP_OVERDUE_DAYS:
        reasons.append(
            f"БКИ: текущая просрочка {profile.bki_overdue_days} дн. > {BKI_HARD_STOP_OVERDUE_DAYS} дн."
        )
    monthly_turnover = profile.monthly_revenue_total
    if monthly_turnover > 0 and profile.fssp_amount > FSSP_HARD_STOP_SHARE * monthly_turnover:
        reasons.append(
            f"ФССП: {profile.fssp_amount:,.0f} ₽ > 20% месячного оборота "
            f"({FSSP_HARD_STOP_SHARE * monthly_turnover:,.0f} ₽)"
        )
    return reasons


def build_factors_breakdown(profile: CompanyProfile) -> list[FactorBreakdown]:
    """Полная декомпозиция для Waterfall: база + 5 дискретных факторов."""
    factors = [FactorBreakdown(
        group="G0",
        code="BASE_SCORE",
        label="Базовый уровень модели",
        score_delta=SCORE_BASE,
        condition="Base = 500",
    )]
    factors.extend(selector(profile) for selector in FACTOR_SELECTORS)
    factors.extend(supplement_factor_breakdowns(profile))
    return factors


def calculate_risk_score(profile: CompanyProfile) -> ScoreResult:
    """Считает балл всегда, даже при Hard Stop — нужна декомпозиция для Waterfall."""
    factors = build_factors_breakdown(profile)
    raw_score = sum(factor.score_delta for factor in factors)
    final_score = max(SCORE_MIN, min(SCORE_MAX, raw_score))
    hard_stop_reasons = detect_hard_stops(profile)

    return ScoreResult(
        final_score=final_score,
        raw_score=raw_score,
        is_hard_stop=bool(hard_stop_reasons),
        hard_stop_reasons=hard_stop_reasons,
        factors_breakdown=factors,
    )


def financial_health_snapshot(profile: CompanyProfile) -> dict[str, float]:
    """Публичные метрики для DNA и Xray (не влияют на решение)."""
    return {
        "fcf_rub": calculate_fcf(profile),
        "monthly_revenue_total": profile.monthly_revenue_total,
        "debt_ratio": (
            profile.bki_monthly_payment / calculate_fcf(profile)
            if calculate_fcf(profile) > 0 else 0.0
        ),
    }
