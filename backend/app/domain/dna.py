"""Сборка 5 блоков «360°-ДНК бизнеса» из доменного профиля."""
from __future__ import annotations

from app.core.constants import GEO_SCORE_LOW_THRESHOLD
from app.domain.finances import calculate_fcf
from app.domain.types import CompanyProfile, DnaBlock, StatusTone


def _fmt_money(value: float) -> str:
    return f"{value:,.0f} ₽".replace(",", " ")


def build_business_dna(profile: CompanyProfile) -> list[DnaBlock]:
    fcf = calculate_fcf(profile)
    debt_ratio = profile.bki_monthly_payment / fcf if fcf > 0 else 1.0

    profile_status = StatusTone.GOOD if profile.age_months > 24 and profile.is_egrul_active else StatusTone.WARN
    if not profile.is_egrul_active:
        profile_status = StatusTone.RISK

    if profile.bki_overdue_days > 30:
        bki_status = StatusTone.RISK
    elif profile.bki_overdue_days > 0:
        bki_status = StatusTone.WARN
    else:
        bki_status = StatusTone.GOOD

    if fcf <= 0:
        cash_status = StatusTone.RISK
    elif profile.revenue_growth_pct >= 0:
        cash_status = StatusTone.GOOD
    else:
        cash_status = StatusTone.WARN

    if fcf <= 0 or debt_ratio > 0.5:
        debt_status = StatusTone.RISK
    elif debt_ratio >= 0.25:
        debt_status = StatusTone.WARN
    else:
        debt_status = StatusTone.GOOD

    if profile.business_model.value == "B2B_CONTRACTOR":
        sector_value = f"BuyerScore {profile.buyer_score}"
        sector_status = StatusTone.GOOD if profile.buyer_score >= 75 else StatusTone.WARN
    else:
        sector_value = f"GeoScore {profile.geo_score}"
        if profile.geo_score >= 75:
            sector_status = StatusTone.GOOD
        elif profile.geo_score >= GEO_SCORE_LOW_THRESHOLD:
            sector_status = StatusTone.WARN
        else:
            sector_status = StatusTone.RISK

    return [
        DnaBlock(
            code="PROFILE",
            title="Профиль бизнеса",
            value=f"{profile.legal_form.value} · {profile.age_months} мес.",
            description=f"ОКВЭД {profile.okved_code} · {profile.okved_cluster}",
            status=profile_status,
        ),
        DnaBlock(
            code="BKI",
            title="Платёжная дисциплина",
            value=f"{profile.bki_overdue_days} дн. просрочки",
            description=(
                f"История {profile.bki_history_months} мес. · "
                f"{profile.bki_active_contracts} активных договора"
            ),
            status=bki_status,
        ),
        DnaBlock(
            code="CASHFLOW",
            title="Финансовый поток",
            value=f"FCF {_fmt_money(fcf)}/мес.",
            description=(
                f"Оборот Альфа {_fmt_money(profile.monthly_revenue_alfa)} · "
                f"Мультибанк {_fmt_money(profile.monthly_revenue_multibank)} · "
                f"динамика {profile.revenue_growth_pct:+.0f}%"
            ),
            status=cash_status,
        ),
        DnaBlock(
            code="DEBT",
            title="Долговая нагрузка",
            value=f"ПДН {debt_ratio:.0%}",
            description=(
                f"Платежи по кредитам {_fmt_money(profile.bki_monthly_payment)}/мес. "
                f"при FCF {_fmt_money(fcf)}"
            ),
            status=debt_status,
        ),
        DnaBlock(
            code="SECTOR",
            title="Отраслевой потенциал",
            value=sector_value,
            description=(
                profile.anchor_buyer
                or f"Конкурентов в радиусе 300 м: {profile.competitors_count} · {profile.city}"
            ),
            status=sector_status,
        ),
    ]


def build_dna_payload(profile: CompanyProfile) -> dict:
    blocks = build_business_dna(profile)
    return {
        "blocks": [
            {
                "code": block.code,
                "title": block.title,
                "value": block.value,
                "description": block.description,
                "status": block.status.value,
            }
            for block in blocks
        ],
        "completeness_pct": 100,
    }
