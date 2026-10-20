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
    """Заявленная выручка выше оборота в Альфе более чем на 50% → ANOMALY."""
    alfa = profile.monthly_revenue_alfa
    declared = profile.declared_monthly_revenue
    deviation = (declared / alfa - 1) if alfa > 0 else 0.0
    detected = deviation > ANOMALY_REVENUE_DEVIATION_THRESHOLD

    message = (
        f"Заявленная выручка {declared:,.0f} ₽/мес. выше оборота в Альфа-Банке "
        f"({alfa:,.0f} ₽) на {deviation:.0%}. Требуется подтверждение выписок "
        f"из других банков."
        if detected
        else f"Заявленная выручка подтверждена оборотом Альфа-Банка (отклонение {deviation:+.0%})."
    )
    return RevenueAnomaly(
        detected=detected,
        declared_monthly_revenue=declared,
        alfa_monthly_revenue=alfa,
        deviation_pct=round(deviation * 100, 2),
        threshold_pct=ANOMALY_REVENUE_DEVIATION_THRESHOLD * 100,
        message=message,
    )
