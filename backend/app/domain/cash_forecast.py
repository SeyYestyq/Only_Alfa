"""
Прогноз остатка на счёте на 60 дней и 5 триггеров финансового радара.
Чистый Python, без сети и БД.
"""
from __future__ import annotations

from app.core.constants import (
    CAPEX_HIGH_SHARE_THRESHOLD,
    CASH_FORECAST_DAYS,
    CASH_FORECAST_RENT_DAYS,
    DAYS_IN_MONTH,
    DAYS_IN_YEAR,
    DEFAULT_CBR_KEY_RATE,
    SPREAD_OVERDRAFT,
)
from app.domain.types import CashForecastDay, CompanyProfile, RadarTrigger

TRIGGER_CASH_GAP = "TRG_CASH_GAP"
TRIGGER_SCALE_UP = "TRG_SCALE_UP"
TRIGGER_CAPEX_EXP = "TRG_CAPEX_EXP"
TRIGGER_ANTI_SPAM = "TRG_ANTI_SPAM"
TRIGGER_LOAN_PROTECT = "TRG_LOAN_PROTECT"


def _daily_operating_flow(profile: CompanyProfile) -> float:
    """Дневной поток без аренды/налогов — они списываются отдельными событиями."""
    return (
        profile.monthly_revenue_total
        - profile.purchases_monthly
        - profile.bki_monthly_payment
    ) / DAYS_IN_MONTH


def build_cash_forecast(
    profile: CompanyProfile,
    days: int = CASH_FORECAST_DAYS,
) -> list[CashForecastDay]:
    """Строит 60-дневный ряд остатка с учётом аренды/ФОТ и налогов."""
    daily_flow = _daily_operating_flow(profile)
    rent_and_taxes = profile.rent_fot_monthly + profile.taxes_monthly
    balance = profile.account_balance
    forecast: list[CashForecastDay] = []

    for day in range(1, days + 1):
        balance += daily_flow
        trigger = None
        if day in CASH_FORECAST_RENT_DAYS:
            balance -= rent_and_taxes
            if balance < 0:
                trigger = TRIGGER_CASH_GAP
        if balance < 0 and trigger is None:
            trigger = TRIGGER_CASH_GAP
        forecast.append(
            CashForecastDay(day=day, balance_rub=round(balance, 2), trigger=trigger)
        )

    return forecast


def find_cash_gap(forecast: list[CashForecastDay]) -> tuple[int, float, int]:
    """Возвращает (день минимума, минимальный остаток, число дней в минусе)."""
    if not forecast:
        return 0, 0.0, 0
    min_day = min(forecast, key=lambda item: item.balance_rub)
    days_negative = sum(1 for item in forecast if item.balance_rub < 0)
    return min_day.day, min_day.balance_rub, days_negative


def detect_radar_triggers(
    profile: CompanyProfile,
    forecast: list[CashForecastDay],
    overdraft_rate_pct: float | None = None,
) -> list[RadarTrigger]:
    """5 триггеров радара. Показываем только те, что реально сработали."""
    triggers: list[RadarTrigger] = []
    min_day, min_balance, days_negative = find_cash_gap(forecast)
    rate = (
        DEFAULT_CBR_KEY_RATE + SPREAD_OVERDRAFT
        if overdraft_rate_pct is None
        else overdraft_rate_pct
    )

    if min_balance < 0:
        overpayment = abs(min_balance) * (rate / 100) * (max(days_negative, 1) / DAYS_IN_YEAR)
        triggers.append(RadarTrigger(
            code=TRIGGER_CASH_GAP,
            title="Прогнозируется кассовый разрыв",
            value=f"День {min_day}: {min_balance:,.0f} ₽",
            action_label=f"Овердрафт закроет разрыв, честная переплата ≈ {overpayment:,.0f} ₽",
            severity="RISK",
        ))

    if profile.revenue_growth_pct > 15:
        triggers.append(RadarTrigger(
            code=TRIGGER_SCALE_UP,
            title="Выручка растёт быстрее рынка",
            value=f"{profile.revenue_growth_pct:+.0f}% за 3 месяца",
            action_label="Рассмотрите инвест-кредит на масштабирование",
            severity="GOOD",
        ))

    capex_share = profile.purchases_monthly / max(profile.monthly_revenue_total, 1)
    if capex_share > CAPEX_HIGH_SHARE_THRESHOLD:
        triggers.append(RadarTrigger(
            code=TRIGGER_CAPEX_EXP,
            title="Высокая доля закупок в выручке",
            value=f"{capex_share:.0%} от оборота",
            action_label="Лизинг оборудования снизит нагрузку на кассу",
            severity="WARN",
        ))

    debt_ratio = (
        profile.bki_monthly_payment / (profile.monthly_revenue_total or 1)
    )
    if profile.bki_active_contracts >= 2 or debt_ratio > 0.04:
        triggers.append(RadarTrigger(
            code=TRIGGER_ANTI_SPAM,
            title="Несколько кредитных обязательств",
            value=f"{profile.bki_active_contracts} договора, платежи {profile.bki_monthly_payment:,.0f} ₽/мес.",
            action_label="Рефинансирование объединит платежи",
            severity="WARN",
        ))

    reserve = profile.rent_fot_monthly + profile.taxes_monthly + profile.bki_monthly_payment
    if profile.account_balance < reserve:
        triggers.append(RadarTrigger(
            code=TRIGGER_LOAN_PROTECT,
            title="Низкий резервный буфер",
            value=f"Остаток {profile.account_balance:,.0f} ₽ < {reserve:,.0f} ₽",
            action_label="Подключите защиту бизнеса и резервный овердрафт",
            severity="WARN",
        ))

    return triggers
