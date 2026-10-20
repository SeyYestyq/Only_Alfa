"""Валидатор аномалий заявленной выручки (ТЗ-03, п. 3)."""
from __future__ import annotations

from dataclasses import dataclass

from app.core.constants import ANOMALY_REVENUE_DEVIATION_THRESHOLD
from app.domain.types import CompanyProfile


@dataclass
class RevenueAnomaly:
    detected: bool
    declared_monthly_revenue: float
    alfa_monthly_revenue: float
    deviation_pct: float
    threshold_pct: float
    message: str


def check_revenue_anomaly(profile: CompanyProfile) -> RevenueAnomaly:
    """
    Заявленная выручка выше подтверждённого оборота более чем на 50% → ANOMALY.

    После Мультибанка подтверждённым считается суммарный оборот Альфа + другие банки:
    повторная заявка клиента не должна снова упираться в уже снятую аномалию.
    """
    alfa = profile.monthly_revenue_alfa
    confirmed_revenue = (
        profile.monthly_revenue_alfa + profile.monthly_revenue_multibank
        if profile.is_multibank_verified
        else alfa
    )
    declared = profile.declared_monthly_revenue
    deviation = (declared / confirmed_revenue - 1) if confirmed_revenue > 0 else 0.0
    detected = deviation > ANOMALY_REVENUE_DEVIATION_THRESHOLD
    source = "Альфа-Банка и подтверждённых выписок" if profile.is_multibank_verified else "Альфа-Банка"

    message = (
        f"Заявленная выручка {declared:,.0f} ₽/мес. выше оборота {source} "
        f"({confirmed_revenue:,.0f} ₽) на {deviation:.0%}. Требуется подтверждение выписок "
        f"из других банков."
        if detected
        else f"Заявленная выручка подтверждена оборотом {source} (отклонение {deviation:+.0%})."
    )
    return RevenueAnomaly(
        detected=detected,
        declared_monthly_revenue=declared,
        alfa_monthly_revenue=confirmed_revenue,
        deviation_pct=round(deviation * 100, 2),
        threshold_pct=ANOMALY_REVENUE_DEVIATION_THRESHOLD * 100,
        message=message,
    )
