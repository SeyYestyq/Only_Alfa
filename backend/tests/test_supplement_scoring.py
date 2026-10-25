"""Дозапрос документов увеличивает RiskScore через доменные факторы."""
from __future__ import annotations

from app.core.constants import FACTOR_POINTS
from app.domain.enrichment.supplements import apply_supplement_and_rescore
from app.domain.scoring.risk_score import calculate_risk_score
from app.infra.demo_profiles import ROSTERS


def test_supply_contract_adds_named_factor_points():
    before = calculate_risk_score(ROSTERS).final_score
    _updated, snapshot, after = apply_supplement_and_rescore(
        ROSTERS,
        "SUPPLY_CONTRACT",
        already_applied=set(),
    )
    assert after.final_score == before + FACTOR_POINTS["DOC_SUPPLY_CONTRACT"]
    assert snapshot.score_delta == FACTOR_POINTS["DOC_SUPPLY_CONTRACT"]
