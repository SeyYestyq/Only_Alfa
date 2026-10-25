"""Эндпоинты компаний: список, lookup по ИНН, дашборд Экрана 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas import (
    ApplicationListResponse,
    CompanyListResponse,
    DashboardResponse,
    LookupInnRequest,
    LookupInnResponse,
    SystemActionListResponse,
)
from app.infra.database import get_session
from app.services.application_service import ApplicationService
from app.services.company_service import CompanyService
from app.services.proactive_service import ProactiveService

router = APIRouter(tags=["companies"])


@router.get("/companies", response_model=CompanyListResponse)
def list_companies(session: Session = Depends(get_session)) -> dict:
    """5 демо-компаний и их пользователи для Demo Control Bar."""
    return CompanyService(session).list_companies()


@router.post("/companies/lookup-inn", response_model=LookupInnResponse)
def lookup_inn(body: LookupInnRequest, session: Session = Depends(get_session)) -> dict:
    """360°-портрет по любому валидному ИНН (симулятор, seed=hash(INN))."""
    return CompanyService(session).lookup_inn(body.inn)


@router.post("/companies/reset-demo")
def reset_demo(session: Session = Depends(get_session)) -> dict:
    """Сброс всех демо-сценариев к исходному состоянию."""
    return CompanyService(session).reset_demo()


@router.get("/companies/{company_id}/dashboard", response_model=DashboardResponse)
def company_dashboard(company_id: str, session: Session = Depends(get_session)) -> dict:
    """Данные Экрана 1: ДНК, прогноз кассы, радар, новости, выписка, чипсы."""
    return CompanyService(session).dashboard(company_id)


@router.get("/companies/{company_id}/system-actions", response_model=SystemActionListResponse)
def company_system_actions(company_id: str, session: Session = Depends(get_session)) -> dict:
    """Лента «система решила» для пилота банка."""
    return ProactiveService(session).list_for_company(company_id)


@router.post("/companies/{company_id}/system-actions/{action_id}/publish")
def publish_system_action(
    company_id: str,
    action_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """Отправить проактивное действие клиенту (из PENDING в SENT)."""
    return ProactiveService(session).publish(action_id)


@router.post("/companies/{company_id}/system-actions/{action_id}/open")
def open_system_action(
    company_id: str,
    action_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """Клиент открыл проактивное уведомление — фиксируем для пилота."""
    return ProactiveService(session).mark_opened(action_id)


@router.post("/companies/{company_id}/system-actions/{action_id}/respond")
def respond_system_action(
    company_id: str,
    action_id: str,
    body: dict,
    session: Session = Depends(get_session),
) -> dict:
    """Ответ клиента на проактивное действие (демо: текст из UI)."""
    return ProactiveService(session).mark_client_response(action_id, str(body.get("response", "")))


@router.post("/companies/{company_id}/system-actions/{action_id}/cancel")
def cancel_system_action(
    company_id: str,
    action_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """Остановить исходящее действие до показа клиенту."""
    return ProactiveService(session).cancel(action_id)


@router.get("/companies/{company_id}/applications", response_model=ApplicationListResponse)
def company_applications(company_id: str, session: Session = Depends(get_session)) -> dict:
    """История заявок компании (дополнительный эндпоинт для навигации SPA)."""
    return ApplicationService(session).list_for_company(company_id)
