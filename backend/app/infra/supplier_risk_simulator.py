"""
Симулятор сигналов риска поставщика для Invoice-to-Credit.

Детерминированный фолбэк: seed = hash(INN). Без внешних/платных API.
"""
from __future__ import annotations

import hashlib
import random

from app.core.constants import (
    SUPPLIER_SIM_CONCENTRATION_CAP_PCT,
    SUPPLIER_SIM_CONCENTRATION_MAX_PCT,
    SUPPLIER_SIM_CONCENTRATION_MIN_PCT,
    SUPPLIER_SIM_DEALS_MAX,
    SUPPLIER_SIM_LAWSUIT_VALUES,
    SUPPLIER_SIM_LAWSUIT_WEIGHTS,
    SUPPLIER_SIM_ON_TIME_MAX_PCT,
    SUPPLIER_SIM_ON_TIME_MIN_PCT,
    SUPPLIER_SIM_SECTOR_MAX,
    SUPPLIER_SIM_SECTOR_MIN,
    SUPPLIER_SIM_TAX_DEBT_CHANCE,
    SUPPLIER_SIM_TAX_DEBT_MAX_RUB,
    SUPPLIER_SIM_TAX_DEBT_MIN_RUB,
    SUPPLIER_SIM_TENURE_MAX_MONTHS,
    SUPPLIER_SIM_TENURE_MIN_MONTHS,
)
from app.domain.supplier_risk import SupplierRiskInputs
from app.infra.demo_content import INVOICE_TEMPLATES
from app.infra.registry_simulator import simulate_company, validate_inn

_SECTOR_LABELS = (
    "Общественное питание (ОКВЭД 56)",
    "Строительство (ОКВЭД 41-43)",
    "Торговля (ОКВЭД 45-47)",
    "Производство (ОКВЭД 10-33)",
    "Услуги (ОКВЭД 69-75)",
)


def _rng_for_inn(inn: str) -> random.Random:
    digest = hashlib.sha256(f"supplier-deal-risk:{inn}".encode("utf-8")).hexdigest()
    return random.Random(int(digest[:16], 16))


def _template_name(inn: str) -> str | None:
    for template in INVOICE_TEMPLATES.values():
        if template.supplier_inn == inn:
            return template.supplier_name
    return None


def simulate_supplier_risk_inputs(
    inn: str,
    *,
    display_name: str | None = None,
    invoice_amount_rub: float | None = None,
    buyer_purchases_monthly: float | None = None,
) -> SupplierRiskInputs:
    """Собирает сигналы риска по ИНН поставщика (seed = hash(INN))."""
    validate_inn(inn)
    profile = simulate_company(inn)
    rng = _rng_for_inn(inn)

    tenure_months = rng.randint(SUPPLIER_SIM_TENURE_MIN_MONTHS, SUPPLIER_SIM_TENURE_MAX_MONTHS)
    completed_deals = rng.randint(0, SUPPLIER_SIM_DEALS_MAX)
    on_time_rate = round(
        rng.uniform(SUPPLIER_SIM_ON_TIME_MIN_PCT, SUPPLIER_SIM_ON_TIME_MAX_PCT), 1
    )
    sector_stability = rng.randint(SUPPLIER_SIM_SECTOR_MIN, SUPPLIER_SIM_SECTOR_MAX)
    lawsuits = rng.choices(
        list(SUPPLIER_SIM_LAWSUIT_VALUES),
        weights=list(SUPPLIER_SIM_LAWSUIT_WEIGHTS),
    )[0]
    tax_debt = 0.0
    if rng.random() < SUPPLIER_SIM_TAX_DEBT_CHANCE:
        tax_debt = round(
            rng.uniform(SUPPLIER_SIM_TAX_DEBT_MIN_RUB, SUPPLIER_SIM_TAX_DEBT_MAX_RUB),
            -3,
        )

    if invoice_amount_rub is not None and buyer_purchases_monthly and buyer_purchases_monthly > 0:
        concentration = min(
            SUPPLIER_SIM_CONCENTRATION_CAP_PCT,
            round(invoice_amount_rub / buyer_purchases_monthly * 100, 1),
        )
    else:
        concentration = round(
            rng.uniform(SUPPLIER_SIM_CONCENTRATION_MIN_PCT, SUPPLIER_SIM_CONCENTRATION_MAX_PCT),
            1,
        )

    name = display_name or _template_name(inn) or profile.name
    cluster = profile.okved_cluster or _SECTOR_LABELS[rng.randrange(len(_SECTOR_LABELS))]

    return SupplierRiskInputs(
        supplier_inn=inn,
        supplier_name=name,
        tenure_months=tenure_months,
        completed_deals_count=completed_deals,
        on_time_payment_rate_pct=on_time_rate,
        sector_stability_score=sector_stability,
        lawsuits_count=lawsuits,
        tax_debt_rub=tax_debt,
        concentration_share_pct=concentration,
        okved_cluster=cluster,
        is_egrul_active=profile.is_egrul_active,
    )
