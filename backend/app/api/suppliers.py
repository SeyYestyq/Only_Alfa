"""Эндпоинты аналитики поставщика (Invoice-to-Credit)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.schemas import SupplierDealRiskResponse
from app.infra.database import get_session
from app.services.supplier_risk_service import SupplierRiskService

router = APIRouter(tags=["suppliers"])


@router.get("/suppliers/{supplier_inn}/deal-risk", response_model=SupplierDealRiskResponse)
def supplier_deal_risk(
    supplier_inn: str,
    buyer_company_id: str | None = Query(default=None),
    invoice_amount_rub: float | None = Query(default=None, ge=0),
    display_name: str | None = Query(default=None, max_length=200),
    session: Session = Depends(get_session),
) -> dict:
    """
    Аналитика контрагента для Invoice-to-Credit: плюсы/минусы и
    вероятность успешной сделки (симулятор, seed=hash(INN)).
    """
    return SupplierRiskService(session).assess_deal_risk(
        supplier_inn,
        buyer_company_id=buyer_company_id,
        invoice_amount_rub=invoice_amount_rub,
        display_name=display_name,
    )
