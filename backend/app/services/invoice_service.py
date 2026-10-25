"""Сценарий Invoice-to-Credit: PDF/шаблон → проверка поставщика → черновик заявки."""
from __future__ import annotations

import time

from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFound, InvoiceParseError
from app.infra.invoice_parser import parse_demo_template, parse_pdf, run_antifraud
from app.repositories.company_repository import CompanyRepository
from app.services.application_service import ApplicationService
from app.services.supplier_risk_service import SupplierRiskService


class InvoiceService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.companies = CompanyRepository(session)
        self.applications = ApplicationService(session)
        self.supplier_risk = SupplierRiskService(session)

    def parse_invoice(
        self,
        company_id: str,
        content: bytes | None,
        template_code: str | None,
    ) -> dict:
        started = time.perf_counter()
        profile = self.companies.get_by_id(company_id)
        if profile is None:
            raise EntityNotFound(f"Компания {company_id} не найдена")
        if template_code:
            parsed = parse_demo_template(template_code)
        elif content:
            parsed = parse_pdf(content)
        else:
            raise InvoiceParseError("Загрузите PDF-счёт или выберите один из 3 демо-шаблонов")

        antifraud = run_antifraud(parsed.supplier_inn)
        deal_risk = self.supplier_risk.assess_deal_risk(
            parsed.supplier_inn,
            buyer_company_id=company_id,
            invoice_amount_rub=parsed.amount_rub,
            display_name=parsed.supplier_name,
        )
        draft = self.applications.create_draft(
            profile, parsed.to_dict(), antifraud, actor_role="ACCOUNTANT"
        )
        return {
            "invoice": parsed.to_dict(),
            "antifraud": antifraud,
            "draft": draft,
            "parsing_ms": round((time.perf_counter() - started) * 1000, 2),
            "supplier_deal_risk": deal_risk,
        }
