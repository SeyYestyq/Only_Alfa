"""
Реестр документов дозапроса и пересчёт скоринга после загрузки.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from app.core.constants import (
    SUPPLEMENT_SCORE_COLLATERAL_DOC,
    SUPPLEMENT_SCORE_EQUIPMENT_INVOICE,
    SUPPLEMENT_SCORE_MULTIBANK_STATEMENT,
    SUPPLEMENT_SCORE_SUPPLY_CONTRACT,
)
from app.domain.scoring.risk_score import calculate_risk_score
from app.domain.types import CompanyProfile, ScoreResult


@dataclass(frozen=True)
class SupplementDocumentType:
    code: str
    label: str
    score_delta: int
    reason: str
    apply: Callable[[CompanyProfile], CompanyProfile]

    def hint(self) -> dict:
        return {
            "code": self.code,
            "label": self.label,
            "score_delta": self.score_delta,
            "reason": self.reason,
        }


def _apply_multibank(profile: CompanyProfile) -> CompanyProfile:
    from dataclasses import replace

    external = max(profile.monthly_revenue_multibank, profile.monthly_revenue_alfa * 0.35)
    return replace(
        profile,
        monthly_revenue_multibank=external,
        is_multibank_verified=True,
    )


def _with_supplement(profile: CompanyProfile, code: str) -> CompanyProfile:
    from dataclasses import replace

    merged = set(profile.verified_supplement_codes)
    merged.add(code)
    return replace(profile, verified_supplement_codes=frozenset(merged))


SUPPLEMENT_REGISTRY: dict[str, SupplementDocumentType] = {
    "MULTIBANK_STATEMENT": SupplementDocumentType(
        code="MULTIBANK_STATEMENT",
        label="Выписки других банков",
        score_delta=SUPPLEMENT_SCORE_MULTIBANK_STATEMENT,
        reason="Подтверждает оборот вне Альфы — фактор Мультибанка.",
        apply=_apply_multibank,
    ),
    "SUPPLY_CONTRACT": SupplementDocumentType(
        code="SUPPLY_CONTRACT",
        label="Договор поставки",
        score_delta=SUPPLEMENT_SCORE_SUPPLY_CONTRACT,
        reason="Снижает риск нецелевого использования средств.",
        apply=lambda profile: _with_supplement(profile, "SUPPLY_CONTRACT"),
    ),
    "COLLATERAL_DOC": SupplementDocumentType(
        code="COLLATERAL_DOC",
        label="Документ по обеспечению",
        score_delta=SUPPLEMENT_SCORE_COLLATERAL_DOC,
        reason="Уточняет залоговую массу для ВКЛ с залогом.",
        apply=lambda profile: _with_supplement(profile, "COLLATERAL_DOC"),
    ),
    "EQUIPMENT_INVOICE": SupplementDocumentType(
        code="EQUIPMENT_INVOICE",
        label="Счёт на оборудование",
        score_delta=SUPPLEMENT_SCORE_EQUIPMENT_INVOICE,
        reason="Подтверждает CAPEX-закупку под инвест-кредит.",
        apply=lambda profile: _with_supplement(profile, "EQUIPMENT_INVOICE"),
    ),
}


@dataclass(frozen=True)
class ScoreChangeSnapshot:
    previous_score: int
    new_score: int
    score_delta: int
    shifted_factors: list[str]
    document_code: str
    document_label: str

    def as_dict(self) -> dict:
        return {
            "previous_score": self.previous_score,
            "new_score": self.new_score,
            "score_delta": self.score_delta,
            "shifted_factors": self.shifted_factors,
            "document_code": self.document_code,
            "document_label": self.document_label,
        }


def apply_supplement_and_rescore(
    profile: CompanyProfile,
    document_code: str,
    *,
    already_applied: set[str],
) -> tuple[CompanyProfile, ScoreChangeSnapshot, ScoreResult]:
    doc = SUPPLEMENT_REGISTRY.get(document_code)
    if doc is None:
        raise ValueError(f"Неизвестный тип документа: {document_code}")
    if document_code in already_applied:
        raise ValueError("Документ этого типа уже учтён в скоринге")

    before = calculate_risk_score(profile)
    updated_profile = doc.apply(profile)
    after = calculate_risk_score(updated_profile)

    shifted: list[str] = []
    if document_code == "MULTIBANK_STATEMENT":
        shifted.append("Финансовый поток и Мультибанк: подтверждён оборот вне Альфы")
    else:
        shifted.append(f"{doc.label}: +{doc.score_delta} баллов к профилю сделки")

    snapshot = ScoreChangeSnapshot(
        previous_score=before.final_score,
        new_score=after.final_score,
        score_delta=after.final_score - before.final_score,
        shifted_factors=shifted,
        document_code=document_code,
        document_label=doc.label,
    )
    return updated_profile, snapshot, after
