"""
Дискретные правила выбора уровня факторов RiskScore.

Каждая группа возвращает ровно один код уровня и фиксированный балл из
FACTOR_POINTS. Никаких диапазонов «от +40 до +120» — только целые числа.
"""
from __future__ import annotations

from app.core.constants import (
    BKI_CLEAN_HIGH_MIN_HISTORY_MONTHS,
    BKI_HARD_STOP_OVERDUE_DAYS,
    BKI_TECH_OVERDUE_MAX_DAYS,
    BKI_TECH_OVERDUE_MIN_DAYS,
    BUYER_SCORE_HIGH_THRESHOLD,
    CF_CRITICAL_DROP_PCT,
    CF_GROWTH_HIGH_MIN_PCT,
    CORP_GIRBO_MIN_AGE_MONTHS,
    DSCR_LOW_LOAD_MAX_RATIO,
    DSCR_MED_LOAD_MAX_RATIO,
    ESTABLISHED_MIN_AGE_MONTHS,
    FACTOR_POINTS,
    GEO_SCORE_HIGH_THRESHOLD,
    GEO_SCORE_LOW_THRESHOLD,
    PROFILE_POSITIVE_MIN_GROWTH_PCT,
    YOUNG_MAX_AGE_MONTHS,
    YOUNG_MIN_AGE_MONTHS,
)
from app.domain.finances import calculate_fcf
from app.domain.types import BusinessModel, CompanyProfile, FactorBreakdown, FactorGroup, LegalForm

_RISK_CLAIMS_MAX_AGE_MONTHS = 6


def _factor(group: FactorGroup, code: str, label: str, condition: str) -> FactorBreakdown:
    return FactorBreakdown(
        group=group.value,
        code=code,
        label=label,
        score_delta=FACTOR_POINTS[code],
        condition=condition,
    )


def select_bki_factor(profile: CompanyProfile) -> FactorBreakdown:
    """Группа 1: платёжная дисциплина БКИ."""
    group = FactorGroup.G1_BKI
    overdue = profile.bki_overdue_days

    if overdue > BKI_HARD_STOP_OVERDUE_DAYS:
        return _factor(group, "BKI_STOP_OVERDUE", "Текущая просрочка > 30 дней",
                       f"Просрочка {overdue} дн. > {BKI_HARD_STOP_OVERDUE_DAYS} дн.")
    if BKI_TECH_OVERDUE_MIN_DAYS <= overdue <= BKI_TECH_OVERDUE_MAX_DAYS:
        return _factor(group, "BKI_TECH_OVERDUE", "Техническая просрочка 5–25 дней",
                       f"Просрочка {overdue} дн. за последние 12 мес.")
    if profile.bki_history_months == 0:
        return _factor(group, "BKI_NO_HISTORY", "Кредитная история отсутствует",
                       "В БКИ нет записей — нейтральный профиль")
    if overdue == 0 and profile.bki_history_months >= BKI_CLEAN_HIGH_MIN_HISTORY_MONTHS:
        return _factor(group, "BKI_CLEAN_HIGH", "Безупречная история ≥ 24 мес.",
                       f"История {profile.bki_history_months} мес., 0 просрочек")
    return _factor(group, "BKI_CLEAN_STD", "Чистая история без просрочек",
                   f"История {profile.bki_history_months} мес., {profile.bki_active_contracts} активный договор")


def select_cashflow_factor(profile: CompanyProfile) -> FactorBreakdown:
    """Группа 2: финансовый поток и Мультибанк."""
    group = FactorGroup.G2_CASHFLOW
    fcf = calculate_fcf(profile)

    if profile.is_multibank_verified:
        return _factor(group, "CF_MULTIBANK_VERIFIED", "Выписки из других банков подтверждены",
                       "Open Banking API: обороты Сбер / Т-Банк / ВТБ")
    if fcf <= 0 or profile.revenue_growth_pct < CF_CRITICAL_DROP_PCT:
        return _factor(group, "CF_CRITICAL_DROP", "Падение выручки > 30% или FCF ≤ 0",
                       f"Динамика {profile.revenue_growth_pct:+.0f}%, FCF {fcf:,.0f} ₽")
    if profile.revenue_growth_pct > CF_GROWTH_HIGH_MIN_PCT:
        return _factor(group, "CF_GROWTH_HIGH", "Рост оборотов > 15% при положительном FCF",
                       f"Динамика {profile.revenue_growth_pct:+.0f}%, FCF {fcf:,.0f} ₽")
    return _factor(group, "CF_STABLE_POSITIVE", "Стабильный положительный FCF",
                   f"Динамика {profile.revenue_growth_pct:+.0f}%, FCF {fcf:,.0f} ₽")


def select_debt_factor(profile: CompanyProfile) -> FactorBreakdown:
    """Группа 3: долговая нагрузка ПДН / DSCR."""
    group = FactorGroup.G3_DEBT
    fcf = calculate_fcf(profile)

    if fcf <= 0:
        return _factor(group, "DSCR_CRITICAL_LOAD", "Высокая долговая нагрузка",
                       "FCF ≤ 0 — обслуживание долга невозможно")
    ratio = profile.bki_monthly_payment / fcf
    if ratio < DSCR_LOW_LOAD_MAX_RATIO:
        return _factor(group, "DSCR_LOW_LOAD", "Платежи по кредитам < 25% FCF",
                       f"ПДН {ratio:.0%} от FCF")
    if ratio <= DSCR_MED_LOAD_MAX_RATIO:
        return _factor(group, "DSCR_MED_LOAD", "Платежи по кредитам 25–50% FCF",
                       f"ПДН {ratio:.0%} от FCF")
    return _factor(group, "DSCR_CRITICAL_LOAD", "Высокая долговая нагрузка",
                   f"ПДН {ratio:.0%} от FCF (> 50%)")


def select_profile_factor(profile: CompanyProfile) -> FactorBreakdown:
    """Группа 4: профиль бизнеса ФНС и ОПФ."""
    group = FactorGroup.G4_PROFILE
    age = profile.age_months
    positive_profile = (
        profile.arbitration_claims == 0
        and profile.revenue_growth_pct >= PROFILE_POSITIVE_MIN_GROWTH_PCT
    )

    if age < _RISK_CLAIMS_MAX_AGE_MONTHS or profile.arbitration_claims > 0:
        return _factor(group, "PROF_RISK_CLAIMS", "Критические арбитражные иски / молодой бизнес",
                       f"Возраст {age} мес., исков: {profile.arbitration_claims}")
    if (
        profile.legal_form == LegalForm.OOO
        and profile.has_girbo
        and age > CORP_GIRBO_MIN_AGE_MONTHS
        and positive_profile
    ):
        return _factor(group, "PROF_CORP_GIRBO", "Юрлицо > 36 мес. с балансом ГИР БО",
                       f"ООО, {age} мес., баланс ГИР БО, 0 исков")
    if age > ESTABLISHED_MIN_AGE_MONTHS and positive_profile:
        return _factor(group, "PROF_ESTABLISHED", "Действующий бизнес > 24 мес.",
                       f"{age} мес. в профильном ОКВЭД, 0 исков")
    if YOUNG_MIN_AGE_MONTHS <= age <= YOUNG_MAX_AGE_MONTHS and profile.arbitration_claims == 0:
        return _factor(group, "PROF_YOUNG_12_24M", "Действующий бизнес 12–24 мес.",
                       f"{age} мес., без исполнительных листов")
    return _factor(group, "PROF_NEUTRAL", "Базовый профиль",
                   "Нет положительных или критических отметок")


def select_sector_factor(profile: CompanyProfile) -> FactorBreakdown:
    """Группа 5: отраслевой потенциал Geo / Buyer."""
    group = FactorGroup.G5_SECTOR

    if profile.business_model == BusinessModel.B2B_CONTRACTOR:
        if profile.buyer_score >= BUYER_SCORE_HIGH_THRESHOLD:
            return _factor(group, "SEC_HIGH_BUYER", "Высокий рейтинг якорного заказчика",
                           f"BuyerScore {profile.buyer_score}, {profile.anchor_buyer}")
        return _factor(group, "SEC_NEUTRAL", "Нейтральный отраслевой профиль",
                       f"BuyerScore {profile.buyer_score} < {BUYER_SCORE_HIGH_THRESHOLD}")

    if profile.business_model == BusinessModel.WHOLESALE:
        return _factor(group, "SEC_NEUTRAL", "Нейтральный отраслевой профиль",
                       "Оптовая торговля без гео-привязки")

    if profile.geo_score >= GEO_SCORE_HIGH_THRESHOLD:
        return _factor(group, "SEC_HIGH_GEO", "Высокий трафик локации",
                       f"GeoScore {profile.geo_score} (OpenStreetMap)")
    if profile.geo_score >= GEO_SCORE_LOW_THRESHOLD:
        return _factor(group, "SEC_MID_GEO", "Умеренный трафик спального района",
                       f"GeoScore {profile.geo_score}")
    return _factor(group, "SEC_LOW_COMPETITION", "Переизбыток конкурентов в радиусе 300 м",
                   f"GeoScore {profile.geo_score}, конкурентов: {profile.competitors_count}")


FACTOR_SELECTORS = (
    select_bki_factor,
    select_cashflow_factor,
    select_debt_factor,
    select_profile_factor,
    select_sector_factor,
)
