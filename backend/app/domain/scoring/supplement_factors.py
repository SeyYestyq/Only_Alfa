"""Факторы RiskScore за подтверждённые документы дозапроса."""
from __future__ import annotations

from app.domain.types import CompanyProfile, FactorBreakdown, FactorGroup

_SUPPLEMENT_TO_FACTOR: dict[str, tuple[str, str]] = {
    "SUPPLY_CONTRACT": ("DOC_SUPPLY_CONTRACT", "Подтверждён договор поставки"),
    "EQUIPMENT_INVOICE": ("DOC_EQUIPMENT_INVOICE", "Подтверждён счёт на оборудование"),
    "COLLATERAL_DOC": ("DOC_COLLATERAL_DOC", "Подтверждён документ по обеспечению"),
}


def supplement_factor_breakdowns(profile: CompanyProfile) -> list[FactorBreakdown]:
    from app.core.constants import FACTOR_POINTS

    factors: list[FactorBreakdown] = []
    for code in sorted(profile.verified_supplement_codes):
        mapping = _SUPPLEMENT_TO_FACTOR.get(code)
        if mapping is None:
            continue
        factor_code, label = mapping
        factors.append(
            FactorBreakdown(
                group=FactorGroup.G4_PROFILE.value,
                code=factor_code,
                label=label,
                score_delta=FACTOR_POINTS[factor_code],
                condition=f"Документ {code} проверен банком",
            )
        )
    return factors
