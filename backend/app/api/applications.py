"""Эндпоинты заявки, счёта, рассрочки и Экрана 3."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.api.schemas import (
    AcceptOfferRequest,
    ApplicationCreateRequest,
    ApplicationSchema,
    CeoApproveRequest,
    InstallmentRequest,
    InstallmentResponse,
    InvoiceTemplateSchema,
    MultibankVerifyResponse,
    ParseInvoiceResponse,
    UnderwriterActionRequest,
    XrayResponse,
)
from app.infra.database import get_session
from app.infra.demo_content import INVOICE_TEMPLATES
from app.services.application_service import ApplicationService
from app.services.invoice_service import InvoiceService
from app.services.xray_service import XrayService

router = APIRouter(tags=["applications"])


@router.get("/applications/invoice-templates", response_model=list[InvoiceTemplateSchema])
def invoice_templates() -> list[dict]:
    """3 предзаготовленных демо-счёта для мгновенной демонстрации."""
    return [
        {
            "code": template.code,
            "file_name": template.file_name,
            "supplier_name": template.supplier_name,
            "supplier_inn": template.supplier_inn,
            "amount_rub": template.amount_rub,
            "vat_rub": template.vat_rub,
            "purpose": template.purpose,
            "company_demo_key": template.company_demo_key,
        }
        for template in INVOICE_TEMPLATES.values()
    ]


@router.post("/applications", response_model=ApplicationSchema, status_code=status.HTTP_201_CREATED)
def create_application(
    body: ApplicationCreateRequest,
    session: Session = Depends(get_session),
) -> dict:
    """Создать заявку: Hard Stop → аномалия → скоринг → решение."""
    return ApplicationService(session).create(body)


@router.post("/applications/parse-invoice", response_model=ParseInvoiceResponse)
async def parse_invoice(
    company_id: str = Form(...),
    template_code: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    session: Session = Depends(get_session),
) -> dict:
    """PDF-счёт (pdfplumber) или демо-шаблон → проверка ИНН → черновик заявки."""
    content = await file.read() if file is not None else None
    return InvoiceService(session).parse_invoice(
        company_id,
        content,
        template_code,
    )


@router.get("/applications/{application_id}", response_model=ApplicationSchema)
def get_application(
    application_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """Текущее состояние заявки (дополнительный эндпоинт для SPA)."""
    return ApplicationService(session).get(application_id)


@router.post("/applications/{application_id}/verify-multibank", response_model=MultibankVerifyResponse)
def verify_multibank(
    application_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """Симулятор Open Banking: +90 баллов, +25% к лимиту, снятие аномалии."""
    return ApplicationService(session).verify_multibank(application_id)


@router.post("/applications/{application_id}/accept-offer", response_model=ApplicationSchema)
def accept_offer(
    application_id: str,
    body: AcceptOfferRequest,
    session: Session = Depends(get_session),
) -> dict:
    """Клиент выбирает один из 4 встречных офферов (дополнительный эндпоинт)."""
    return ApplicationService(session).accept_offer(
        application_id, body.offer_index, body.actor_role
    )


@router.post("/applications/{application_id}/underwriter-action", response_model=ApplicationSchema)
def underwriter_action(
    application_id: str,
    body: UnderwriterActionRequest,
    session: Session = Depends(get_session),
) -> dict:
    """Действие инспектора: APPROVE / COUNTER_OFFER / NEED_MORE_INFO / REJECT."""
    return ApplicationService(session).underwriter_action(application_id, body)


@router.post("/applications/{application_id}/ceo-approve", response_model=ApplicationSchema)
def ceo_approve(
    application_id: str,
    body: CeoApproveRequest,
    session: Session = Depends(get_session),
) -> dict:
    """Подписание ПЭП: ООО — только CEO_OWNER (иначе 403), невалидный статус — 409."""
    return ApplicationService(session).ceo_approve(application_id, body.actor_role)


@router.get("/applications/{application_id}/xray", response_model=XrayResponse)
def application_xray(
    application_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """Экран 3: P&L, Waterfall, OSM, аудит."""
    return XrayService(session).build(application_id)


@router.post("/transactions/{transaction_id}/installment", response_model=InstallmentResponse)
def transaction_installment(
    transaction_id: str,
    body: InstallmentRequest,
    session: Session = Depends(get_session),
) -> dict:
    """Пост-транзакционная рассрочка на 3–6 месяцев."""
    return ApplicationService(session).installment(transaction_id, body.months)
