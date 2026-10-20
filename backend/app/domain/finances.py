"""Финансовые формулы, общие для скоринга, решения и прогноза кассы."""
from __future__ import annotations

from app.core.constants import (
    BUYER_SCORE_HIGH_THRESHOLD,
    GEO_SCORE_HIGH_THRESHOLD,
    GEO_SCORE_LOW_THRESHOLD,
    K_SECTOR_HIGH,
    K_SECTOR_LOW,
    K_SECTOR_MID,
    MAX_PAYMENT_FCF_RATIO,
    MULTIBANK_LIMIT_BOOST,
)
from app.domain.types import CompanyProfile, ProductType


def calculate_fcf(profile: CompanyProfile) -> float:
    """FCF = выручка (Альфа + Мультибанк) − закупки − аренда/ФОТ − налоги − платежи БКИ."""
    return (
        profile.monthly_revenue_alfa
        + profile.monthly_revenue_multibank
        - profile.purchases_monthly
        - profile.rent_fot_monthly
        - profile.taxes_monthly
        - profile.bki_monthly_payment
    )


def calculate_k_sector(profile: CompanyProfile) -> float:
    """K_sector = 1.15 при GeoScore/BuyerScore >= 75, 0.85 при GeoScore < 45, иначе 1.0."""
    if (
        profile.geo_score >= GEO_SCORE_HIGH_THRESHOLD
        or profile.buyer_score >= BUYER_SCORE_HIGH_THRESHOLD
    ):
        return K_SECTOR_HIGH
    if profile.geo_score < GEO_SCORE_LOW_THRESHOLD:
        return K_SECTOR_LOW
    return K_SECTOR_MID


def calculate_max_payment(profile: CompanyProfile) -> float:
    """MaxPayment = 0.5 × FCF × K_sector, но не меньше нуля."""
    return max(0.0, MAX_PAYMENT_FCF_RATIO * calculate_fcf(profile) * calculate_k_sector(profile))


def calculate_annuity_payment(principal: float, annual_rate_pct: float, months: int) -> float:
    """Аннуитетный ежемесячный платёж."""
    if principal <= 0 or months <= 0:
        return 0.0
    monthly_rate = annual_rate_pct / 100 / 12
    if monthly_rate == 0:
        return principal / months
    factor = (1 + monthly_rate) ** months
    return principal * monthly_rate * factor / (factor - 1)


def calculate_max_principal(max_payment: float, annual_rate_pct: float, months: int) -> float:
    """Обратная аннуитету задача: какой основной долг даёт платёж не выше max_payment."""
    if max_payment <= 0 or months <= 0:
        return 0.0
    monthly_rate = annual_rate_pct / 100 / 12
    if monthly_rate == 0:
        return max_payment * months
    return max_payment * (1 - (1 + monthly_rate) ** (-months)) / monthly_rate


def calculate_credit_limit(
    profile: CompanyProfile,
    max_payment: float,
    annual_rate_pct: float,
    months: int,
) -> float:
    """Расчётный лимит по платежеспособности + бонус Мультибанка +25%."""
    limit = calculate_max_principal(max_payment, annual_rate_pct, months)
    if profile.is_multibank_verified:
        limit *= 1 + MULTIBANK_LIMIT_BOOST
    return max(0.0, limit)


def product_spread(product: ProductType) -> float:
    from app.core.constants import SPREAD_INVEST_LEASING, SPREAD_OVERDRAFT, SPREAD_VKL

    return {
        ProductType.INVEST_LEASING: SPREAD_INVEST_LEASING,
        ProductType.VKL: SPREAD_VKL,
        ProductType.OVERDRAFT: SPREAD_OVERDRAFT,
    }[product]
