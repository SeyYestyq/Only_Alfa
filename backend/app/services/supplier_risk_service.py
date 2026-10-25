"""Сценарий аналитики поставщика для Invoice-to-Credit."""
from __future__ import annotations

from dataclasses import asdict

from sqlalchemy.orm import Session

from app.domain.supplier_risk import SupplierDealRiskAssessment, assess_supplier_deal_risk
from app.infra.supplier_risk_simulator import simulate_supplier_risk_inputs
from app.repositories.company_repository import CompanyRepository


def _signal_payload(assessment: SupplierDealRiskAssessment) -> dict:
    return {
        "supplier_inn": assessment.supplier_inn,
        "supplier_name": assessment.supplier_name,
        "okved_cluster": assessment.okved_cluster,
        "deal_success_probability_pct": assessment.deal_success_probability_pct,
        "risk_band": assessment.risk_band,
        "risk_score": assessment.risk_score,
        "pros": [asdict(signal) for signal in assessment.pros],
        "cons": [asdict(signal) for signal in assessment.cons],
        "summary": assessment.summary,
        "source": assessment.source,
    }


class SupplierRiskService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.companies = CompanyRepository(session)

    def assess_deal_risk(
        self,
        supplier_inn: str,
        *,
        buyer_company_id: str | None = None,
        invoice_amount_rub: float | None = None,
        display_name: str | None = None,
    ) -> dict:
        buyer_purchases: float | None = None
        if buyer_company_id:
            buyer = self.companies.get_by_id(buyer_company_id)
            if buyer is not None:
                buyer_purchases = buyer.purchases_monthly

        inputs = simulate_supplier_risk_inputs(
            supplier_inn,
            display_name=display_name,
            invoice_amount_rub=invoice_amount_rub,
            buyer_purchases_monthly=buyer_purchases,
        )
        assessment = assess_supplier_deal_risk(inputs)
        return _signal_payload(assessment)
